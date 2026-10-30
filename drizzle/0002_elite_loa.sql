CREATE TABLE `intervention_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` varchar(32) NOT NULL,
	`agent_id` varchar(100) NOT NULL,
	`status` enum('draft','submitted','under_review','to_correct','validated','rejected') NOT NULL DEFAULT 'draft',
	`intervention_date` date,
	`nature` varchar(255) NOT NULL DEFAULT '',
	`description` text NOT NULL DEFAULT (''),
	`actions` text NOT NULL DEFAULT (''),
	`result` text NOT NULL DEFAULT (''),
	`advancement` varchar(100) NOT NULL DEFAULT '',
	`difficulties` text NOT NULL DEFAULT (''),
	`remaining` text NOT NULL DEFAULT (''),
	`time_spent` int NOT NULL DEFAULT 0,
	`next_action` varchar(255) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intervention_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `intervention_reports` ADD CONSTRAINT `intervention_reports_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `intervention_reports_ticket` ON `intervention_reports` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `intervention_reports_agent` ON `intervention_reports` (`agent_id`);