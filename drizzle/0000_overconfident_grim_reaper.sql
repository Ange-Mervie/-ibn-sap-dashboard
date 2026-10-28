CREATE TABLE `email_messages` (
	`gmail_message_id` varchar(100) NOT NULL,
	`gmail_thread_id` varchar(100) NOT NULL DEFAULT '',
	`subject` text NOT NULL DEFAULT (''),
	`sender` varchar(200) NOT NULL DEFAULT '',
	`received_at` timestamp,
	`body_snippet` text NOT NULL DEFAULT (''),
	`matched_rule` varchar(200) NOT NULL DEFAULT '',
	`status` enum('pending','converted','linked','ignored') NOT NULL DEFAULT 'pending',
	`ticket_id` varchar(32),
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_messages_gmail_message_id` PRIMARY KEY(`gmail_message_id`)
);
--> statement-breakpoint
CREATE TABLE `gmail_tokens` (
	`id` int NOT NULL,
	`access_token` text NOT NULL DEFAULT (''),
	`refresh_token` text NOT NULL DEFAULT (''),
	`expiry` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gmail_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ran_at` timestamp NOT NULL DEFAULT (now()),
	`outcome` enum('ok','error','not_configured') NOT NULL,
	`fetched` int NOT NULL DEFAULT 0,
	`new_messages` int NOT NULL DEFAULT 0,
	`detail` text NOT NULL DEFAULT (''),
	CONSTRAINT `sync_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` varchar(32) NOT NULL,
	`author` varchar(100) NOT NULL,
	`body` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_counters` (
	`year` int NOT NULL,
	`last_seq` int NOT NULL DEFAULT 0,
	CONSTRAINT `ticket_counters_year` PRIMARY KEY(`year`)
);
--> statement-breakpoint
CREATE TABLE `ticket_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` varchar(32) NOT NULL,
	`field` varchar(50) NOT NULL,
	`old_value` text NOT NULL DEFAULT (''),
	`new_value` text NOT NULL DEFAULT (''),
	`changed_by` varchar(100) NOT NULL DEFAULT 'application',
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` varchar(32) NOT NULL,
	`description` text NOT NULL,
	`status` enum('Not Started','In Progress','On Hold','Blocked','Closed','waiting for Customer') NOT NULL DEFAULT 'Not Started',
	`priority` enum('Critical','High','Medium','Low') NOT NULL DEFAULT 'Medium',
	`module` varchar(50) NOT NULL DEFAULT '',
	`raised_by` varchar(100) NOT NULL,
	`email` varchar(150) NOT NULL DEFAULT '',
	`assignee` varchar(100) NOT NULL DEFAULT '',
	`open_date` date,
	`close_date` date,
	`payment` varchar(50) NOT NULL DEFAULT '',
	`comments` text,
	`source` enum('excel','form','email') NOT NULL DEFAULT 'form',
	`gmail_message_id` varchar(100),
	`gmail_thread_id` varchar(100) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_gmail_msg_uid` UNIQUE(`gmail_message_id`)
);
--> statement-breakpoint
ALTER TABLE `email_messages` ADD CONSTRAINT `email_messages_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_comments` ADD CONSTRAINT `ticket_comments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ticket_events` ADD CONSTRAINT `ticket_events_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `tickets_priority` ON `tickets` (`priority`);