import type { FastifyInstance } from 'fastify';
import { eq, desc, asc } from 'drizzle-orm';
import { customers, sales, auditLogs, shifts, cashMovements, customerPayments } from '../db/schema.js';
import { authenticateRequest } from './auth.js';

export async function customerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticateRequest);

  // Ensure customer_payments table exists dynamically if needed
  try {
    app.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS customer_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        amount INTEGER NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        notes TEXT,
        created_at TEXT NOT NULL
      );
    `);
  } catch (e) {
    // Table already exists or table check passed
  }

  // List all customers
  app.get('/customers', async (_req, _reply) => {
    return app.db.select().from(customers).orderBy(desc(customers.id)).all();
  });

  // Get single customer
  app.get('/customers/:id', async (req, reply) => {
    const id = Number((req.params as any).id);
    const customer = app.db.select().from(customers).where(eq(customers.id, id)).get();
    if (!customer) return reply.code(404).send({ error: 'not_found', message: 'العميل غير موجود' });
    return customer;
  });

  // Create customer (manager & sales)
  app.post('/customers', async (req, reply) => {
    const { name, phone, address, notes } = req.body as any;
    if (!name)
      return reply.code(400).send({ error: 'missing_fields', message: 'اسم العميل مطلوب' });

    const now = new Date().toISOString();
    const result = app.db
      .insert(customers)
      .values({
        name,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        createdAt: now,
      })
      .run();
    const newId = Number(result.lastInsertRowid);

    app.db
      .insert(auditLogs)
      .values({
        userId: req.user!.userId,
        action: 'create_customer',
        details: `إضافة عميل: ${name}`,
        createdAt: now,
      })
      .run();
    
    const newCustomer = app.db.select().from(customers).where(eq(customers.id, newId)).get();
    return newCustomer;
  });

  // Update customer
  app.put('/customers/:id', async (req, reply) => {
    if (req.user?.role !== 'manager') {
      return reply
        .code(403)
        .send({ error: 'forbidden', message: 'تعديل العملاء متاح للمدراء فقط' });
    }
    const id = Number((req.params as any).id);
    const existing = app.db.select().from(customers).where(eq(customers.id, id)).get();
    if (!existing) return reply.code(404).send({ error: 'not_found' });

    const { name, phone, address, notes } = req.body as any;
    app.db
      .update(customers)
      .set({
        name: name ?? existing.name,
        phone: phone !== undefined ? phone : existing.phone,
        address: address !== undefined ? address : existing.address,
        notes: notes !== undefined ? notes : existing.notes,
      })
      .where(eq(customers.id, id))
      .run();

    return { success: true };
  });

  // Record a payment from customer (reduce credit balance)
  const handleCustomerPayment = async (req: any, reply: any) => {
    const id = Number((req.params as any).id);
    const { amount, notes } = req.body as { amount: number; notes?: string };
    if (!amount || amount <= 0) return reply.code(400).send({ error: 'invalid_amount' });

    const customer = app.db.select().from(customers).where(eq(customers.id, id)).get();
    if (!customer) return reply.code(404).send({ error: 'not_found' });

    const newBalance = Math.max(0, customer.creditBalance - amount);
    app.db.update(customers).set({ creditBalance: newBalance }).where(eq(customers.id, id)).run();

    const now = new Date().toISOString();

    // Insert into customer_payments
    app.db
      .insert(customerPayments)
      .values({
        customerId: id,
        amount: amount,
        userId: req.user.userId,
        notes: notes || null,
        createdAt: now,
      })
      .run();

    // Check active shift to register cash deposit
    const activeShift = app.db
      .select()
      .from(shifts)
      .where(eq(shifts.status, 'open'))
      .limit(1)
      .get();

    if (activeShift) {
      app.db
        .insert(cashMovements)
        .values({
          shiftId: activeShift.id,
          type: 'deposit',
          amount: amount,
          referenceId: `سداد عميل ${customer.name}`,
          userId: req.user.userId,
          createdAt: now,
        })
        .run();
    }

    app.db
      .insert(auditLogs)
      .values({
        userId: req.user.userId,
        action: 'customer_payment',
        details: `سداد عميل ${customer.name}: ${(amount / 1000).toFixed(3)} د.ل. الرصيد الجديد: ${(newBalance / 1000).toFixed(3)} د.ل`,
        createdAt: now,
      })
      .run();

    return { success: true, newCreditBalance: newBalance };
  };

  app.post('/customers/:id/payment', handleCustomerPayment);
  app.post('/customers/:id/payments', handleCustomerPayment);

  // Get customer's sales history
  app.get('/customers/:id/sales', async (req, _reply) => {
    const id = Number((req.params as any).id);
    return app.db
      .select()
      .from(sales)
      .where(eq(sales.customerId, id))
      .orderBy(desc(sales.id))
      .all();
  });

  // Get Customer Account Statement (كشف حساب التفصيلي للزبون)
  app.get('/customers/:id/statement', async (req, reply) => {
    const id = Number((req.params as any).id);
    const customer = app.db.select().from(customers).where(eq(customers.id, id)).get();
    if (!customer) return reply.code(404).send({ error: 'not_found', message: 'العميل غير موجود' });

    // Fetch all sales for this customer
    const customerSales = app.db
      .select()
      .from(sales)
      .where(eq(sales.customerId, id))
      .all();

    // Fetch payments recorded in customer_payments table
    const payments = app.db
      .select()
      .from(customerPayments)
      .where(eq(customerPayments.customerId, id))
      .all();

    // Combine transactions into single array
    const transactions: Array<{
      id: string;
      date: string;
      type: 'sale_credit' | 'sale_cash' | 'payment';
      typeLabel: string;
      reference: string;
      debit: number; // milli-LYD
      credit: number; // milli-LYD
      notes?: string;
    }> = [];

    customerSales.forEach((s) => {
      if (s.status === 'cancelled') return;
      const isCredit = s.paymentType === 'credit';
      transactions.push({
        id: `sale-${s.id}`,
        date: s.createdAt,
        type: isCredit ? 'sale_credit' : 'sale_cash',
        typeLabel: isCredit ? 'فاتورة مبيعات (آجل)' : 'فاتورة مبيعات (نقدي)',
        reference: s.invoiceNumber,
        debit: isCredit ? s.total : 0, // credit sales add to debt
        credit: 0,
        notes: `طريقة الدفع: ${s.paymentMethod}`,
      });
    });

    payments.forEach((p) => {
      transactions.push({
        id: `pay-${p.id}`,
        date: p.createdAt,
        type: 'payment',
        typeLabel: 'سداد دفعة نقدية (دفع)',
        reference: `REC-${p.id}`,
        debit: 0,
        credit: p.amount, // payment reduces debt
        notes: p.notes || 'سداد نقدي لحساب الدين',
      });
    });

    // Sort transactions chronologically
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance and totals
    let runningBalance = 0;
    let totalPurchases = 0;
    let totalPaid = 0;

    const statementRows = transactions.map((tx) => {
      totalPurchases += tx.debit;
      totalPaid += tx.credit;
      runningBalance += tx.debit - tx.credit;
      return {
        ...tx,
        runningBalance: Math.max(0, runningBalance),
      };
    });

    return {
      customer,
      summary: {
        totalPurchases,
        totalPaid,
        currentBalance: customer.creditBalance,
        calculatedBalance: Math.max(0, runningBalance),
      },
      statement: statementRows,
    };
  });
}

