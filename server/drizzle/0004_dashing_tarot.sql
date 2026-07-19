CREATE TABLE `customer_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`user_id` integer NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `settings` ADD `business_subtitle` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `business_phone2` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `warranty_terms` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `stamp_title` text;