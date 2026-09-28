-- AlterTable
ALTER TABLE `PaymentTransaction` ADD COLUMN `submissionKey` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `PaymentUpload` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `paymentPointId` CHAR(36) NOT NULL,
    `fingerprint` CHAR(64) NOT NULL,
    `paymentNo` VARCHAR(32) NOT NULL,
    `driveFileId` VARCHAR(160) NULL,
    `state` VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentUpload_paymentNo_key`(`paymentNo`),
    UNIQUE INDEX `PaymentUpload_driveFileId_key`(`driveFileId`),
    INDEX `PaymentUpload_state_updatedAt_idx`(`state`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `PaymentTransaction_submissionKey_key` ON `PaymentTransaction`(`submissionKey`);
