-- Migration: Create Invitations Table
-- Description: Adds support for staff invitation system
-- Date: 2025-11-03

CREATE TABLE IF NOT EXISTS `invitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `roleType` enum('super_admin','admin','manager','staff','user','guest') NOT NULL,
  `status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
  `stationId` int DEFAULT NULL,
  `expiresAt` timestamp NOT NULL,
  `invitedBy` int NOT NULL,
  `acceptedAt` timestamp NULL DEFAULT NULL,
  `acceptedBy` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_token` (`token`),
  KEY `IDX_email` (`email`),
  KEY `IDX_status` (`status`),
  KEY `IDX_roleType` (`roleType`),
  KEY `FK_invitation_invitedBy` (`invitedBy`),
  CONSTRAINT `FK_invitation_invitedBy` FOREIGN KEY (`invitedBy`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for efficient querying of pending invitations
CREATE INDEX `IDX_status_expiresAt` ON `invitations` (`status`, `expiresAt`);

-- Add index for finding invitations by email and status
CREATE INDEX `IDX_email_status_roleType` ON `invitations` (`email`, `status`, `roleType`);

-- Optional: Add foreign key for stationId if stations table exists
-- ALTER TABLE `invitations` 
-- ADD CONSTRAINT `FK_invitation_stationId` 
-- FOREIGN KEY (`stationId`) REFERENCES `stations` (`id`) ON DELETE SET NULL;

-- Optional: Add foreign key for acceptedBy if you want referential integrity
-- ALTER TABLE `invitations` 
-- ADD CONSTRAINT `FK_invitation_acceptedBy` 
-- FOREIGN KEY (`acceptedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL;

