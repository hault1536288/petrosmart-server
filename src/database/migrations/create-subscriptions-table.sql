-- Migration: Create Subscriptions Table
-- Description: Adds subscription management for SaaS model
-- Date: 2025-11-03

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `plan` enum('free','basic','professional','enterprise') NOT NULL DEFAULT 'free',
  `status` enum('trial','active','past_due','cancelled','expired','suspended') NOT NULL DEFAULT 'trial',
  `monthlyPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
  `startDate` timestamp NULL DEFAULT NULL,
  `endDate` timestamp NULL DEFAULT NULL,
  `trialEndDate` timestamp NULL DEFAULT NULL,
  `nextBillingDate` timestamp NULL DEFAULT NULL,
  `cancelledAt` timestamp NULL DEFAULT NULL,
  `maxStations` int NOT NULL DEFAULT '5',
  `maxStaff` int NOT NULL DEFAULT '10',
  `maxTransactionsPerMonth` int NOT NULL DEFAULT '1000',
  `hasAdvancedReporting` tinyint(1) NOT NULL DEFAULT '0',
  `hasApiAccess` tinyint(1) NOT NULL DEFAULT '0',
  `hasPrioritySupport` tinyint(1) NOT NULL DEFAULT '0',
  `stripeCustomerId` varchar(255) DEFAULT NULL,
  `stripeSubscriptionId` varchar(255) DEFAULT NULL,
  `paymentMethod` varchar(100) DEFAULT NULL,
  `lastPaymentDate` timestamp NULL DEFAULT NULL,
  `lastPaymentAmount` decimal(10,2) DEFAULT NULL,
  `failedPaymentAttempts` int NOT NULL DEFAULT '0',
  `autoRenew` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text,
  `metadata` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_userId` (`userId`),
  KEY `IDX_status` (`status`),
  KEY `IDX_plan` (`plan`),
  KEY `IDX_nextBillingDate` (`nextBillingDate`),
  CONSTRAINT `FK_subscription_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for checking expired subscriptions
CREATE INDEX `IDX_status_endDate` ON `subscriptions` (`status`, `endDate`);

-- Add index for trial subscriptionsq
CREATE INDEX `IDX_status_trialEndDate` ON `subscriptions` (`status`, `trialEndDate`);

