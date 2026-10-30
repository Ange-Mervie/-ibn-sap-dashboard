CREATE TABLE `work_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` varchar(32) NOT NULL,
	`agent_id` varchar(100) NOT NULL,
	`nature` varchar(255) NOT NULL DEFAULT '',
	`amount_planned` int NOT NULL DEFAULT 0,
	`amount_paid` int NOT NULL DEFAULT 0,
	`balance` int NOT NULL DEFAULT 0,
	`intervention_date` date,
	`validation_status` enum('draft','submitted','under_review','to_correct','validated','rejected') NOT NULL DEFAULT 'draft',
	`payment_status` enum('not_billable','to_pay','pending','partial','paid') NOT NULL DEFAULT 'to_pay',
	`payment_date` date,
	`payment_mode` varchar(50) NOT NULL DEFAULT '',
	`transaction_ref` varchar(100) NOT NULL DEFAULT '',
	`proof` text NOT NULL DEFAULT (''),
	`comment` text NOT NULL DEFAULT (''),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_payments` ADD CONSTRAINT `work_payments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `work_payments_ticket` ON `work_payments` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `work_payments_agent` ON `work_payments` (`agent_id`);