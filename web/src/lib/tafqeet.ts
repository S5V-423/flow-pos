/**
 * Convert milli-LYD to Arabic Spelled Out Currency (Tafqeet / التفقيط)
 * Example: 8,800,000 milli-LYD -> "فقط ثمانية آلاف وثمانمائة دينار ليبي لا غير"
 */

const ones = [
  '',
  'واحد',
  'اثنان',
  'ثلاثة',
  'أربعة',
  'خمسة',
  'ستة',
  'سبعة',
  'ثمانية',
  'تسعة',
  'عشرة',
  'إحدى عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];

const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];

const hundreds = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسعمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function convertGroup(n: number): string {
  if (n === 0) return '';
  let str = '';

  const h = Math.floor(n / 100);
  const remainder = n % 100;

  if (h > 0) {
    str += hundreds[h];
  }

  if (remainder > 0) {
    if (str !== '') str += ' و';
    if (remainder < 20) {
      str += ones[remainder];
    } else {
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;
      if (o > 0) {
        str += ones[o] + ' و' + tens[t];
      } else {
        str += tens[t];
      }
    }
  }

  return str;
}

export function tafqeetLYD(milliLyd: number): string {
  if (!milliLyd || milliLyd <= 0) return 'صفر دينار ليبي لا غير';

  const lyd = Math.floor(Math.abs(milliLyd) / 1000);
  const dirhams = Math.abs(milliLyd) % 1000;

  let parts: string[] = [];

  if (lyd > 0) {
    const millions = Math.floor(lyd / 1000000);
    const thousands = Math.floor((lyd % 1000000) / 1000);
    const remainder = lyd % 1000;

    if (millions > 0) {
      if (millions === 1) parts.push('مليون');
      else if (millions === 2) parts.push('مليونان');
      else if (millions >= 3 && millions <= 10) parts.push(convertGroup(millions) + ' ملايين');
      else parts.push(convertGroup(millions) + ' مليون');
    }

    if (thousands > 0) {
      if (thousands === 1) parts.push('ألف');
      else if (thousands === 2) parts.push('ألفان');
      else if (thousands >= 3 && thousands <= 10) parts.push(convertGroup(thousands) + ' آلاف');
      else parts.push(convertGroup(thousands) + ' ألف');
    }

    if (remainder > 0) {
      parts.push(convertGroup(remainder));
    }

    const lydWord = parts.join(' و');
    let lydSuffix = 'دينار ليبي';
    if (lyd >= 3 && lyd <= 10 && millions === 0 && thousands === 0) {
      lydSuffix = 'دنانير ليبية';
    }

    parts = [`${lydWord} ${lydSuffix}`];
  }

  if (dirhams > 0) {
    parts.push(`${dirhams} درهم`);
  }

  return `فقط ${parts.join(' و')} لا غير`;
}
