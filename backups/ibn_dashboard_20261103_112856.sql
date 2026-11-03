-- MySQL dump 10.13  Distrib 8.3.0, for Win64 (x86_64)
--
-- Host: localhost    Database: ibn_dashboard
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'42c2c0b5f4eb6c37b814bcdb3a707e765fd689eb37abaecac740e2fef2d2beae',1793171610421),(2,'e3e74ada8e3c40e7b28c5a626852ee3c3dfec871442216956373e0a4fc475b91',1793293436588),(3,'28d2bdaad9ed08a881285f6e6f167e8a882e661a0686f5000679dd50f257d7cf',1793341494619),(4,'6da35bd5aef936459aca8ab58a7d6b02f4831233ed68aa182a451884aab8a0f2',1793342588888),(5,'1c2b9257880ff22047a0b9a96694f2c579a6a3c902d0033cc9515d90babec316',1793343849396);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deadline_requests`
--

DROP TABLE IF EXISTS `deadline_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deadline_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` int NOT NULL,
  `new_due_date` date NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deadline_requests`
--

LOCK TABLES `deadline_requests` WRITE;
/*!40000 ALTER TABLE `deadline_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `deadline_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_messages`
--

DROP TABLE IF EXISTS `email_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_messages` (
  `gmail_message_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gmail_thread_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `subject` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `sender` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `received_at` timestamp NULL DEFAULT NULL,
  `body_snippet` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `matched_rule` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` enum('pending','converted','linked','ignored') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `synced_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`gmail_message_id`),
  KEY `email_messages_ticket_id_tickets_id_fk` (`ticket_id`),
  CONSTRAINT `email_messages_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_messages`
--

LOCK TABLES `email_messages` WRITE;
/*!40000 ALTER TABLE `email_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gmail_tokens`
--

DROP TABLE IF EXISTS `gmail_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gmail_tokens` (
  `id` int NOT NULL,
  `access_token` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `refresh_token` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `expiry` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gmail_tokens`
--

LOCK TABLES `gmail_tokens` WRITE;
/*!40000 ALTER TABLE `gmail_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `gmail_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intervention_reports`
--

DROP TABLE IF EXISTS `intervention_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intervention_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','submitted','under_review','to_correct','validated','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `intervention_date` date DEFAULT NULL,
  `nature` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `actions` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `result` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `advancement` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `difficulties` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `remaining` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `time_spent` int NOT NULL DEFAULT '0',
  `next_action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `intervention_reports_ticket` (`ticket_id`),
  KEY `intervention_reports_agent` (`agent_id`),
  CONSTRAINT `intervention_reports_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intervention_reports`
--

LOCK TABLES `intervention_reports` WRITE;
/*!40000 ALTER TABLE `intervention_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `intervention_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_tasks`
--

DROP TABLE IF EXISTS `recurring_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `next_run` timestamp NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_tasks`
--

LOCK TABLES `recurring_tasks` WRITE;
/*!40000 ALTER TABLE `recurring_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sync_runs`
--

DROP TABLE IF EXISTS `sync_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ran_at` timestamp NOT NULL DEFAULT (now()),
  `outcome` enum('ok','error','not_configured') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fetched` int NOT NULL DEFAULT '0',
  `new_messages` int NOT NULL DEFAULT '0',
  `detail` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_runs`
--

LOCK TABLES `sync_runs` WRITE;
/*!40000 ALTER TABLE `sync_runs` DISABLE KEYS */;
INSERT INTO `sync_runs` VALUES (1,'2026-10-29 11:45:27','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(2,'2026-10-29 11:55:22','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(3,'2026-10-29 11:55:22','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(4,'2026-10-29 11:56:24','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(5,'2026-10-29 11:57:28','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(6,'2026-10-29 11:59:21','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(7,'2026-10-29 12:05:45','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(8,'2026-10-29 12:07:10','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(9,'2026-10-29 12:09:28','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(10,'2026-10-29 12:17:04','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(11,'2026-10-29 12:46:46','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(12,'2026-10-30 04:35:40','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(13,'2026-10-30 04:39:23','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(14,'2026-10-30 04:48:06','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(15,'2026-10-30 05:04:14','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(16,'2026-10-30 05:06:27','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(17,'2026-10-30 05:11:50','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(18,'2026-10-30 05:35:45','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(19,'2026-10-30 05:39:07','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(20,'2026-10-30 05:40:55','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(21,'2026-10-30 05:53:46','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(22,'2026-10-30 06:13:16','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(23,'2026-10-30 06:15:33','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(24,'2026-10-30 06:30:54','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(25,'2026-10-30 07:28:01','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(26,'2026-10-30 07:34:21','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(27,'2026-10-30 15:46:15','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(28,'2026-10-31 16:41:00','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(29,'2026-10-31 16:46:15','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(30,'2026-10-31 18:36:05','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(31,'2026-10-31 18:38:33','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(32,'2026-10-31 18:44:45','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(33,'2026-10-31 19:37:27','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(34,'2026-10-31 20:05:50','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(35,'2026-11-02 02:03:31','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(36,'2026-11-02 03:01:05','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(37,'2026-11-02 03:03:43','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(38,'2026-11-02 03:22:03','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(39,'2026-11-02 04:20:36','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(40,'2026-11-02 04:50:32','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(41,'2026-11-02 05:50:52','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(42,'2026-11-02 07:33:42','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(43,'2026-11-02 07:42:07','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(44,'2026-11-02 07:44:47','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(45,'2026-11-02 07:47:43','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(46,'2026-11-02 07:50:14','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(47,'2026-11-02 07:52:27','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(48,'2026-11-02 07:55:07','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(49,'2026-11-02 07:57:49','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(50,'2026-11-02 08:02:02','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(51,'2026-11-02 08:08:47','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.'),(52,'2026-11-02 08:35:15','not_configured',0,0,'Gmail non configuré : renseigner GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.');
/*!40000 ALTER TABLE `sync_runs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_templates`
--

DROP TABLE IF EXISTS `task_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nature` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_templates`
--

LOCK TABLES `task_templates` WRITE;
/*!40000 ALTER TABLE `task_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_comments`
--

DROP TABLE IF EXISTS `ticket_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `ticket_comments_ticket_id_tickets_id_fk` (`ticket_id`),
  CONSTRAINT `ticket_comments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_comments`
--

LOCK TABLES `ticket_comments` WRITE;
/*!40000 ALTER TABLE `ticket_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_counters`
--

DROP TABLE IF EXISTS `ticket_counters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_counters` (
  `year` int NOT NULL,
  `last_seq` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_counters`
--

LOCK TABLES `ticket_counters` WRITE;
/*!40000 ALTER TABLE `ticket_counters` DISABLE KEYS */;
INSERT INTO `ticket_counters` VALUES (2026,129);
/*!40000 ALTER TABLE `ticket_counters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_dependencies`
--

DROP TABLE IF EXISTS `ticket_dependencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_dependencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `depends_on_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_dependencies`
--

LOCK TABLES `ticket_dependencies` WRITE;
/*!40000 ALTER TABLE `ticket_dependencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_dependencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_events`
--

DROP TABLE IF EXISTS `ticket_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `new_value` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'application',
  `changed_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `ticket_events_ticket_id_tickets_id_fk` (`ticket_id`),
  CONSTRAINT `ticket_events_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=376 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_events`
--

LOCK TABLES `ticket_events` WRITE;
/*!40000 ALTER TABLE `ticket_events` DISABLE KEYS */;
INSERT INTO `ticket_events` VALUES (14,'11','description','Adjustement de stock et transfere de stock entre magasin','Probe description','application','2026-10-29 12:22:14'),(116,'11','status','Closed','In Progress','application','2026-10-29 13:26:27'),(117,'11','priority','Critical','High','application','2026-10-29 13:26:27'),(118,'11','assignee','','AGENT DIAG SAP','application','2026-10-29 13:26:27'),(119,'11','description','Probe description','Description modifiée par diagnostic e2e.Probe description','application','2026-10-29 13:26:27'),(374,'SAP-2026-0129','creation','','SAP-2026-0129','Ange','2026-11-02 15:44:00'),(375,'1','assignee','','test.agent@ibngroup.com','Test Manager','2026-11-03 09:19:05');
/*!40000 ALTER TABLE `ticket_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_tags`
--

DROP TABLE IF EXISTS `ticket_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_tags`
--

LOCK TABLES `ticket_tags` WRITE;
/*!40000 ALTER TABLE `ticket_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Not Started','In Progress','On Hold','Blocked','Closed','waiting for Customer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Not Started',
  `priority` enum('Critical','High','Medium','Low') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `raised_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `assignee` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `open_date` date DEFAULT NULL,
  `close_date` date DEFAULT NULL,
  `payment` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `comments` text COLLATE utf8mb4_unicode_ci,
  `source` enum('excel','form','email') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'form',
  `gmail_message_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gmail_thread_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tickets_gmail_msg_uid` (`gmail_message_id`),
  KEY `tickets_status` (`status`),
  KEY `tickets_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES ('1','Blocage cloture Annuel et budgetaire 2024','Closed','Critical','CLOTURE','DOFC','','test.agent@ibngroup.com','2026-01-05','2026-01-08','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-11-03 09:19:05',''),('10','le blocage ci dessous apparait après avoir fait la saisie qui transfert un montant du code Immos 4900015 au code immo 4900009.','Closed','High','FI_AA','LUDIVINE','','','2026-01-07','2026-03-24','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('11','Adjustement de stock et transfere de stock entre magasin','Closed','Critical','MM_INVENTORY','NGONKA','','','2026-03-04','2026-03-18','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-29 13:37:43',''),('12','blocage Facturation de certaine commande avec la zone grise','Closed','Critical','FI_AP','YANNICK','','','2026-03-04','2026-03-10','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('13','Readjustement de la ligne budgetaire liee a la paie, modification indemnite de transport, blocage simulation paie pour period jan et fev 2026','Closed','High','HCM','Assoua','','','2026-03-02','2026-03-11','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('14','Requete liee au immobilisation.Immos définitive au lieu d\'etre en encours (immo 3401191)','waiting for Customer','High','FI_AA','LUDIVINE','','','2026-03-08',NULL,'','send mail for business to accept reduction of depreciation value for 2025.Depreciation ran for 2025. need to simulate postings and check best solution applicable.','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('15','PROPOSITION DE LIMITATION DU MONTANT DU COUT D\'OBJECTIF DANS SAP','In Progress','Medium','MM_PROCUREMENT','MARIE-LINE','','','2026-02-19',NULL,'','need to discuss detail requirement with customer','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('16','changement du nom de la banque BANQUE ATLANTIQUE par AFG BANK Cameroun','Closed','Critical','Bank Treso','DOFC','','','2026-03-10','2026-03-10','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('17','TRASACTION PERMETTANT D\'EXTRAIRE LES INFORMATION FOURNISSEUR INCLUANT LE NUI','Blocked','Critical','FI_AP','YANNICK','','','2026-03-12',NULL,'','client asked to stop development report','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('18','Rapprochement paie fevrier','Closed','High','HCM','Assoua','','','2026-03-17','2026-03-22','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('19','modification matricule 1210 permettant un sursalaire attendu','Closed','High','HCM','Assoua','','','2026-03-17','2026-03-22','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('2','MAD SCB n\'imprime pas','Closed','Critical','Bank Treso','MAGDALEINE','','','2026-01-04','2026-01-07','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('20','Requete liee au matricule 1211 qui na pas de retenue cotisation cnps sur son bulletin de paie','Closed','High','HCM','Assoua','','','2026-03-22','2026-03-31','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('21','comptabilisation dans le compte 40910000','Closed','High','FI_AP','YANNICK','','','2026-03-17','2026-03-25','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('22','immobilisation en cours desactive et bloque reception de marche','Closed','High','FI_AA','LUDIVINE','','','2026-03-18','2026-03-24','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('23','Rapprochement acomptes fournisseur','Closed','High','FI_AP','YANNICK','','','2026-03-25','2026-03-25','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('24','Demande d’appui pour vérification des paramétrages analytiques (Paie et Immobilisations)','waiting for Customer','Medium','FI_AA','YENGUE','','','2026-03-29',NULL,'','client to provide more info on his requirement','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('25','CONTRE-PASSATION IMPOSSIBLE','waiting for Customer','Medium','FI_AP','YANNICK','','','2026-03-31',NULL,'','Waiting for user to be available so as to assist in testing solution provided.','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('26','BESOIN DU MANUEL ET DE LA TRANSACTION PERMETTANT DE PASSER LES ECRITURES dans le compte 40170000','waiting for Customer','Medium','FI_AP','YANNICK','','','2026-03-31',NULL,'','waiting for user to follow manual sent to perform transaction and confirm','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('27','message d\'erreur liee au centre de couts à la suite de la tentative de comptabilisation de la paie du mois mars 2026','Closed','High','HCM','Assoua','','','2026-04-03','2026-04-05','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('28','matricules 1138-1060-1090 qui ont connu des promotions d\'agents de maitrises à cadre. Cependant, après avoir procéder à leurs reclassement, la rubrique indemnité kilométrique (qui doit être de 85.000 FCFA n\'apparait pas sur leurs bulletins','Closed','Medium','HCM','Assoua','','','2026-04-06','2026-04-12','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('29','Par ailleurs, à la suite des changements structurels observés à la SCDP, j\'aimerais que soit changé l\'entête de nos ordres de mission','In Progress','Medium','HCM','Assoua','','','2026-04-06',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('3','modification sur nom bancaire.Constat d’une mention ‘BONANJO’ sur toutes les banques payantes qui a été modifier','Closed','Critical','Bank Treso','MAGDALEINE','','','2026-01-09','2026-01-09','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('30','comment transfere partiellement les valeur d\'acquisition dans un immo en cours a l\'autre','Closed','Medium','FI_AA','LUDIVINE','','','2026-04-08','2026-04-08','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('31','fournisseur GESIP n\'arrive pas a etre paie .probleme avec impot honorraire','Closed','Critical','Bank Treso','MAGDALEINE','','','2026-04-08','2026-04-08','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('32','modifie information bank sur base de donnee fournisseur','Closed','High','Bank Treso','MAGDALEINE','','','2026-04-13','2026-04-14','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('33','rapport de solde des actifs montrant également la durée de vie utile des actifs','Closed','High','FI_AA','MOISE','','','2026-04-13','2026-04-19','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('34','Bloquer la paie de matricule 780 mais son net apparaitre toujour','Closed','High','HCM','Assoua','','','2026-04-19','2026-04-21','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('35','message d\'erreur en creant ordre de mission:Fournisseur 600970 non prevu dans societe 1000Par ailleurs les informations relatives à la fonction n\'apparaissent pas sur son ordre de mission','Closed','High','HCM','Assoua','','','2026-04-22','2026-04-29','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('36','MAD SCB n\'imprime pas (SPOOL OVERFLOW ERROR)','Closed','High','Bank Treso','MAGDALEINE','','','2026-04-23','2026-04-26','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('37','MAD AFRILAND n\'imprime pas','In Progress','High','Bank Treso','MAGDALEINE','','','2026-04-26',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('38','ECART ENTRE LA BALANCE GENERALE ET LE FICHIER DES IMMOBILISATIONS','waiting for Customer','High','FI_AA','LUDIVINE','','','2026-04-26',NULL,'','waiting for user to test solution proposed','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('39','Rapport sur le compte 408 en suivant le type d\'extraction envoie par mail','Closed','High','FI_AA','NGUIAMBA','','','2026-05-03','2026-05-14','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('4','ABAP error when running sp01-Spool','Closed','Critical','BASIS','JEFFREY','','','2026-01-22','2026-01-22','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('40','Type d\'extraction sollicite sur les immobilisation avec tous les info CODE/COMPTE IMMOBILISATION,DESIGNATIONS DATE MISE EN SERVICE,VALEUR ACQUISITION,AMORTS EXERCISE,AMORTS CUMULES,DATE DE DEBUT AMORTS DUREE,VALEUR COMPTABLE NETTE','Closed','High','FI_AA','NGUIAMBA','','','2026-05-03','2026-07-30','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('41','Saisir sur les immobilisation dans 2026 ne passe pas','Closed','High','FI_AA','NGUIAMBA','','','2026-05-03','2026-05-14','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('42','Transmission liste d\'utilisateurs SAP et rôles existante','Closed','High','','JEFFREY','','','2026-05-03','2026-05-05','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('43','l\'activation des écritures \"négatives\" dans SAP principalement pour les écritures de contrepassation (annulation)','In Progress','High','FI_AP','DOFC','','','2026-05-10',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('44','Blocage saisie des transferts PDR','Closed','High','MM_INVENTORY','Fabrice Bihina','','','2026-05-10','2026-05-14','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('45','Problème d\'impression GR','Closed','High','MM_INVENTORY','NGUIAMBA','','','2026-05-11','2026-05-12','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('46','rapport de relance de paiement','Closed','High','FI_AP','DGA','','','2026-05-11','2026-05-14','INVOICED','test solution in FBL1N with layout and confirrm','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('47','rapport de paiement en double','In Progress','High','FI_AP','DGA','','','2026-05-11',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('48','RAPPORT D\'ÂGE DES FOURNISSEURS ET DES CLIENTS','Closed','High','FI_AP','NGONKA','','','2026-05-11','2026-05-14','INVOICED','need to provide information on type of extraction to be seen','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('49','le code recupere le libelle du materiel sur le poste. J\'ai l\'impression qu\'il va falloir modifier le programme pour gérer le cas de GR service','In Progress','High','MM_PROCUREMENT','NGUIAMBA/jeffrey','','','2026-05-12',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('5','Résolution des problèmes liés immobilisation en cours (transfert vers immo final) et création BC Marché','Closed','Critical','FI_AA','LUDIVINE','','','2026-01-19','2026-01-22','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('50','possibbilites des ecritures negatives','On Hold','High','BLANK','DOFC','','','2026-05-10',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('51','comptabilisation dans le compte 25210000','Closed','High','FI_AP','YANNICK','','','2026-05-13','2026-05-14','INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('52','comptabilisation dans le compte 25210000 pour fournisseur etranger,(BLOCAGE SAISIE DANS F-90 (FOURNISSEURS ETRANGER)','waiting for Customer','High','FI_AP','YANNICK','','','2026-05-15',NULL,'','waiting for user to provide special gl account for foreign supplier','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('53','Blocage compte 40810000 pour imputation manuel','waiting for Customer','High','FI_AP','DGA','','','2026-05-15',NULL,'','waiting for DOFC to confirm','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('54','SAISIE COMMANDE SCELLES 2025 & FACTURATION.BLOCAGE REPORT BUDGETAIRE','Closed','High','FI_FM','MBELLA','','','2026-05-20','2026-06-24','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('55','Un tiers avec deux comptes collectifs différents','In Progress','Medium','FI_AP','NGONKA','','','2026-05-22',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('56','solliciter la création pour retenue à la source dans l\'infotype 14 des comptes après : - Orange pour le personnel ayant acquis des terminaux chez ledit opérateur ; -Achat pagne pour le personnel ayant acquis des pagnes supplémentaires','Closed','Medium','HCM','Assoua','','','2026-05-24','2026-06-15','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('57','pour ce qui est du personnel en détachement, rubrique 5060, vous voudrez bien créer une rubrique cotisation patronale retraite fonctionnaire, dont le montant sera saisi, comme la part salariale, et reversé sauf meilleur avis de la comptabilité dans le même compte','In Progress','Medium','HCM','Assoua','','','2026-05-24',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('58','nous voudrons nous pencher sur l\'affichage et les éléments constitutifs des indemnités de congés payés qui ressortent des chiffres négatifs sur les bulletins du personnel.','In Progress','Medium','HCM','Assoua','','','2026-05-24',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('59','besoin de l’extraction système des taxes retenues à la source au titre de l’exercice 2025.','In Progress','Medium','FI_AA','JEFFREY','','','2026-05-28',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('6','problème de réception et facturation des marchés (2025000446 ET 2024000075)','waiting for Customer','Critical','MM_CONTRACT','YANNICK','','','2026-01-21',NULL,'','Purchase order and AUC not having same fund center.need to align','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('60','bloquer le tier 102461','Closed','Medium','FI_AP','YANNICK','','','2026-05-31','2026-05-31','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('61','BLOCAGE COMMANDE 2025000344 AURELY BUSINESS CENTER ( COMPTE 40810000 )','Closed','High','FI_AP','YANNICK','','','2026-05-31','2026-05-31','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('62','Requête relative à la gestion des prêts','Closed','Medium','HCM','Assoua','','','2026-05-31','2026-06-07','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('63','Extraction du fichier des immo avec codes barres','Closed','High','FI_AA','BIHINA','','','2026-06-08','2026-06-14','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('64','difficultés lors de l’annulation d\'une réception dans le système. 5000002136.apres annulation APC sera negative','waiting for Customer','High','FI_AA','JEFFREY','','','2026-06-21',NULL,'','explained reason to user and waiting for him to proceed','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('65','désactiver les pars salariales et patronales sur son bulletin ? Mat 1015','waiting for Customer','High','HCM','Assoua','','','2026-07-03',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('66','pas possible de fais imprimes les paiements et autres','Closed','Critical','Bank Treso','MAGDALEINE','','','2026-07-13','2026-07-14','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('67','Doubles engagements budgétaire','Closed','High','FI_FM','Annie','','','2026-07-14','2026-07-16','NOT INVOICED','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('68','some users do not have execute buttons when they execute Pos','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('69','Correction period carried forward','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('7','Paie pour la period nov/dec 2025 en simulation a le statut errone','Closed','Critical','HCM','Assoua','','','2026-02-05','2026-02-18','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('70','system cancelled budget line of 2025 and engaged it in 2026','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('71','Account 408 not working properly with budget lines as well as others','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('72','Form Jan to May 445m have been wrongly consumed, source double consumption of budget','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('73','Problem with payment of PO blocking because PO amount is different from billing amount','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('74','Send manual for grouping all PO items so it matches billing amount and PO amount(at IBN create a same scenario and test of a PO that block because payment amount is different)','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('75','Purchase orders in 2025 received in 2026, user wants to cancel','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('76','Dessy creates Pos and modifies them but the budget team do not see his changes.Technically the interface gives doubles.','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('77','SAP period end SAP best practice procedure','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('78','Continous training program, to see Akam','Not Started','Medium','FI_FM','Annie','','','2026-07-14',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('79','cloture annuelle finance','Closed','High','FI_AP','DOFC','','','2026-07-30','2026-08-05','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('8','Developpement d\'un nouveau fichier pour les paiement international pour que ca constituent certain detail precis','waiting for Customer','Critical','Bank Treso','REMY','','','2026-02-05',NULL,'','test results presented. waiting for user to test and confirm for changes to be moved to production system','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('80','SOD BASIS','In Progress','High','BASIS','JEFFREY','','','2026-07-31',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('81','Deversement partiel paie pour period avril, mai et juin','Closed','High','HCM','Assoua','','','2026-08-02','2026-08-04','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('82','Rapport d\'extraction enfant par employe','Closed','Medium','HCM','Assoua','','','2026-08-04','2026-09-01','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('83','Rapport d\'extraction salarial par unite','waiting for Customer','Medium','HCM','Assoua','','','2026-08-04',NULL,'','User needs to correctly assign all employees per cost center','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('84','GESTION DES ACTIFS IMMOBILISES DE TYPE TITRE DE PARTICIPATION','In Progress','High','FI_AA','DOFC','','','2026-08-17',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('85','Banque SCB THK & ECOBANK pour paiement','Closed','Critical','Bank Treso','MAGDALEINE','','','2026-08-18','2026-08-19','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('86','Toutes les banks nouvellement cree (CCA) doivent pouvoir fais le paiement dans f110 et imprimer PLUS Rapport de paiement fournisseur','In Progress','High','Bank Treso','BAKETI','','','2026-08-19',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('87','Role et authorization a assigner pour creation bank','Closed','High','BASIS','JEFFREY','','','2026-08-24','2026-08-24','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('88','MATRICULE 83 dont l\'infotype 41 sur la date de gestion est bien activé mais son indemnité de congé qui devait passer en août 2026 n\'est pas passé.','Closed','High','HCM','Assoua','','','2026-08-26','2026-09-01','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('89','l\'extraction du grand livre des comptes avec les noms des fournisseurs et des clients.','In Progress','High','FI_AP','NGONKA','','','2026-09-01',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('9','Requete ouverture periode Logistique','Closed','Critical','MM_PROCUREMENT','JEFFREY','','','2026-02-18','2026-02-18','PAID','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('90','rapport de nombre d\'enfant par employer dois matcher avec nombre sur bulletin de paie','Closed','High','HCM','Assoua','','','2026-09-06','2026-09-15','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('91','Matricule 901 suspendu mais bulletin de paie ne s\'affiche pas','Closed','High','HCM','Assoua','','','2026-09-14','2026-09-15','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('92','Deversement partiel paie pour period avril et juin des matricule exclu pendant period reel','Closed','High','HCM','Assoua','','','2026-09-14','2026-09-15','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('93','retrp du mois d\'août 2026 sur 60 matricule qui me fait avoir 60 messages d\'erreurs','Closed','High','HCM','Assoua','','','2026-09-16','2026-09-16','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('94','Anomalie SAP – Validation des bons de commande','In Progress','High','MM_PROCUREMENT','DAG','','','2026-09-16',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('95','Procédure d’annulation d’une réception service','Closed','High','MM_INVENTORY','MOISE','','','2026-09-17','2026-09-21','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('96','Non prise en compte de l’entrée en stock des Articles.Consulter les stocks après toute réception','Closed','High','MM_INVENTORY','BIHINA','','','2026-09-20','2026-09-21','','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('97','PROBLEME DE RECEPTION BC 2026000085','waiting for Customer','High','MM_INVENTORY','MOISE','','','2026-10-05',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('98','BLOCAGE LORS DU TRAITEMENT DES DROITS DE DOUANE','Not Started','Medium','FI_AP','REMY','','','2026-10-07',NULL,'','','excel',NULL,'','2026-10-28 07:37:00','2026-10-28 07:37:00',''),('SAP-2026-0129','test2','In Progress','Medium','MM_INVENTORY','Oumar','oumar@gmail.com','Équipe IT','2026-10-29','2026-11-15','',NULL,'form',NULL,'','2026-11-02 15:44:00','2026-11-02 15:44:00','');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','agent','viewer','manager') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'viewer',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_uid` (`email`),
  KEY `users_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Ange','support@gmail.com','66386bdd9aee3caeec6491540975446b:a2a694b68882b553496babb4ca5e583b7204db76a6c4806eff503354342fd338277388f8e601758696a848a3397ed40d41b4ac63dd9c6bd37589472df59c1da3','admin',1,'2026-10-29 19:44:01','2026-10-29 19:44:01'),(2,'Test Manager','test.manager@ibngroup.com','bb088a336b059cc296996563ef27ea7e:0bd1e887c62078cc1eda7e0c231da2f91421374795209a342d4aadebe9c65a124d24a2c2b0e66de15f7e63d650af39b3d83d17e9478264551d05044c11e27666','manager',1,'2026-10-30 05:19:43','2026-10-30 05:19:43'),(3,'Test Agent','test.agent@ibngroup.com','efbcad5a8c2b9312ca88e60830a55c52:756f494f4390b38369159ae244116a252cdbc3d7cb25f476426a8c39d62917c87103a0838c94a9751faf05a28df04a618c063a4d0bfbc1e38ab4c29024ff287d','agent',1,'2026-10-30 05:20:59','2026-10-30 05:20:59'),(4,'Test Viewer','test.viewer@ibngroup.com','9ec1081ccdc20a4f744c2667f1592cb1:30112dc2001db859b0dc427072f9e7565b6fb4a006731ceb602ca109c97213f3b2bdbad9225e446730f930ddabd5ac40e3efb49f8ba99560545e69e1252a39c5','viewer',1,'2026-10-30 05:22:46','2026-10-30 05:22:46'),(5,'E2E Admin','e2e.admin@ibngroup.com','85c13e5507b822d20080cf19d57ab5cb:9d46b8672452bd2db9a62fafec601da2c1d26b19bd57ef8aa4456fbd06396405576c88e2fa884042da25a715897d29b2614a973089a02a9add889e34d1da8985','admin',1,'2026-10-30 05:32:36','2026-10-30 05:32:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_evaluations`
--

DROP TABLE IF EXISTS `work_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_id` int NOT NULL,
  `agent_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quality` int NOT NULL DEFAULT '3',
  `deadline_respect` tinyint(1) NOT NULL DEFAULT '1',
  `solution_relevance` int NOT NULL DEFAULT '3',
  `autonomy` int NOT NULL DEFAULT '3',
  `observations` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `decision` enum('validated','to_correct','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluated_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `work_evaluations_ticket` (`ticket_id`),
  KEY `work_evaluations_agent` (`agent_id`),
  CONSTRAINT `work_evaluations_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_evaluations`
--

LOCK TABLES `work_evaluations` WRITE;
/*!40000 ALTER TABLE `work_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_payments`
--

DROP TABLE IF EXISTS `work_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nature` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `amount_planned` int NOT NULL DEFAULT '0',
  `amount_paid` int NOT NULL DEFAULT '0',
  `balance` int NOT NULL DEFAULT '0',
  `intervention_date` date DEFAULT NULL,
  `validation_status` enum('draft','submitted','under_review','to_correct','validated','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `payment_status` enum('not_billable','to_pay','pending','partial','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'to_pay',
  `payment_date` date DEFAULT NULL,
  `payment_mode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `transaction_ref` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `proof` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `work_payments_ticket` (`ticket_id`),
  KEY `work_payments_agent` (`agent_id`),
  CONSTRAINT `work_payments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_payments`
--

LOCK TABLES `work_payments` WRITE;
/*!40000 ALTER TABLE `work_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ibn_dashboard'
--

--
-- Dumping routines for database 'ibn_dashboard'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-03 11:28:57
