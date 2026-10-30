CREATE TABLE `work_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` varchar(32) NOT NULL,
	`report_id` int NOT NULL,
	`agent_id` varchar(100) NOT NULL,
	`quality` int NOT NULL DEFAULT 3,
	`deadline_respect` boolean NOT NULL DEFAULT true,
	`solution_relevance` int NOT NULL DEFAULT 3,
	`autonomy` int NOT NULL DEFAULT 3,
	`observations` text NOT NULL DEFAULT (''),
	`decision` enum('validated','to_correct','rejected') NOT NULL,
	`evaluated_by` varchar(100) NOT NULL,
	`evaluated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_evaluations` ADD CONSTRAINT `work_evaluations_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `work_evaluations_ticket` ON `work_evaluations` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `work_evaluations_agent` ON `work_evaluations` (`agent_id`);