-- CreateTable
CREATE TABLE `BankAccount` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `bankName` VARCHAR(120) NOT NULL,
    `accountName` VARCHAR(160) NOT NULL,
    `accountNumber` VARCHAR(40) NOT NULL,
    `branch` VARCHAR(120) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BankAccount_organizationId_id_key`(`organizationId`, `id`),
    UNIQUE INDEX `BankAccount_organizationId_code_key`(`organizationId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentPoint` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` VARCHAR(500) NULL,
    `department` VARCHAR(120) NULL,
    `location` VARCHAR(160) NULL,
    `qrToken` CHAR(64) NOT NULL,
    `bankAccountId` CHAR(36) NOT NULL,
    `openTime` CHAR(5) NULL,
    `closeTime` CHAR(5) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED', 'MAINTENANCE') NOT NULL DEFAULT 'INACTIVE',
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentPoint_qrToken_key`(`qrToken`),
    INDEX `PaymentPoint_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `PaymentPoint_organizationId_id_key`(`organizationId`, `id`),
    UNIQUE INDEX `PaymentPoint_organizationId_code_key`(`organizationId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentPointUser` (
    `organizationId` CHAR(36) NOT NULL,
    `paymentPointId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentPointUser_organizationId_userId_idx`(`organizationId`, `userId`),
    PRIMARY KEY (`organizationId`, `paymentPointId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentShift` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `paymentPointId` CHAR(36) NOT NULL,
    `shiftDate` DATE NOT NULL,
    `shiftName` VARCHAR(120) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `openedBy` CHAR(36) NOT NULL,
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedBy` CHAR(36) NULL,
    `closedAt` DATETIME(3) NULL,
    `transactionCount` INTEGER NOT NULL DEFAULT 0,
    `declaredAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `verifiedAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `receiptAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `differenceAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'CLOSED', 'LOCKED') NOT NULL DEFAULT 'OPEN',
    `openSlot` INTEGER NULL DEFAULT 1,
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentShift_organizationId_shiftDate_status_idx`(`organizationId`, `shiftDate`, `status`),
    UNIQUE INDEX `PaymentShift_organizationId_paymentPointId_id_key`(`organizationId`, `paymentPointId`, `id`),
    UNIQUE INDEX `PaymentShift_organizationId_paymentPointId_openSlot_key`(`organizationId`, `paymentPointId`, `openSlot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentTransaction` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `paymentNo` VARCHAR(32) NOT NULL,
    `paymentPointId` CHAR(36) NOT NULL,
    `shiftId` CHAR(36) NULL,
    `hn` VARCHAR(40) NOT NULL,
    `vn` VARCHAR(40) NULL,
    `an` VARCHAR(40) NULL,
    `patientName` VARCHAR(160) NOT NULL,
    `payerName` VARCHAR(160) NULL,
    `payerPhone` VARCHAR(30) NULL,
    `declaredAmount` DECIMAL(15, 2) NOT NULL,
    `verifiedAmount` DECIMAL(15, 2) NULL,
    `sourceBank` VARCHAR(120) NOT NULL,
    `transferDateTime` DATETIME(3) NOT NULL,
    `status` ENUM('SUBMITTED', 'PENDING_VERIFY', 'VERIFIED', 'RECEIPTED', 'AMOUNT_MISMATCH', 'POSSIBLE_DUPLICATE', 'INVALID_SLIP', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedBy` CHAR(36) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `receiptNo` VARCHAR(80) NULL,
    `receiptedBy` CHAR(36) NULL,
    `receiptedAt` DATETIME(3) NULL,
    `reconciliationStatus` ENUM('MATCHED', 'PARTIAL_MATCH', 'MISMATCH', 'NOT_FOUND', 'DUPLICATE') NOT NULL DEFAULT 'NOT_FOUND',
    `note` VARCHAR(2000) NULL,
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentTransaction_paymentNo_key`(`paymentNo`),
    INDEX `PaymentTransaction_organizationId_submittedAt_id_idx`(`organizationId`, `submittedAt`, `id`),
    INDEX `PaymentTransaction_organizationId_hn_idx`(`organizationId`, `hn`),
    INDEX `PaymentTransaction_organizationId_status_submittedAt_idx`(`organizationId`, `status`, `submittedAt`),
    INDEX `PaymentTransaction_organizationId_paymentPointId_submittedAt_idx`(`organizationId`, `paymentPointId`, `submittedAt`),
    INDEX `PaymentTransaction_organizationId_transferDateTime_idx`(`organizationId`, `transferDateTime`),
    INDEX `PaymentTransaction_organizationId_verifiedAt_idx`(`organizationId`, `verifiedAt`),
    INDEX `PaymentTransaction_organizationId_verifiedBy_submittedAt_idx`(`organizationId`, `verifiedBy`, `submittedAt`),
    INDEX `PaymentTransaction_organizationId_sourceBank_submittedAt_idx`(`organizationId`, `sourceBank`, `submittedAt`),
    UNIQUE INDEX `PaymentTransaction_organizationId_id_key`(`organizationId`, `id`),
    UNIQUE INDEX `PaymentTransaction_organizationId_receiptNo_key`(`organizationId`, `receiptNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentSlip` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `paymentTransactionId` CHAR(36) NOT NULL,
    `driveFileId` VARCHAR(160) NOT NULL,
    `driveFolderId` VARCHAR(160) NOT NULL,
    `storedFilename` VARCHAR(255) NOT NULL,
    `originalFilename` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(80) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `sha256` CHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentSlip_driveFileId_key`(`driveFileId`),
    INDEX `PaymentSlip_organizationId_sha256_idx`(`organizationId`, `sha256`),
    INDEX `PaymentSlip_organizationId_paymentTransactionId_idx`(`organizationId`, `paymentTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentStatusHistory` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `paymentTransactionId` CHAR(36) NOT NULL,
    `fromStatus` ENUM('SUBMITTED', 'PENDING_VERIFY', 'VERIFIED', 'RECEIPTED', 'AMOUNT_MISMATCH', 'POSSIBLE_DUPLICATE', 'INVALID_SLIP', 'REJECTED', 'CANCELLED') NULL,
    `toStatus` ENUM('SUBMITTED', 'PENDING_VERIFY', 'VERIFIED', 'RECEIPTED', 'AMOUNT_MISMATCH', 'POSSIBLE_DUPLICATE', 'INVALID_SLIP', 'REJECTED', 'CANCELLED') NOT NULL,
    `version` INTEGER NOT NULL,
    `changedBy` CHAR(36) NULL,
    `reason` VARCHAR(1000) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentStatusHistory_organizationId_paymentTransactionId_cre_idx`(`organizationId`, `paymentTransactionId`, `createdAt`),
    UNIQUE INDEX `PaymentStatusHistory_organizationId_paymentTransactionId_ver_key`(`organizationId`, `paymentTransactionId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentNumberSequence` (
    `date` DATE NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BankAccount` ADD CONSTRAINT `BankAccount_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentPoint` ADD CONSTRAINT `PaymentPoint_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentPoint` ADD CONSTRAINT `PaymentPoint_organizationId_bankAccountId_fkey` FOREIGN KEY (`organizationId`, `bankAccountId`) REFERENCES `BankAccount`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentPoint` ADD CONSTRAINT `PaymentPoint_organizationId_createdBy_fkey` FOREIGN KEY (`organizationId`, `createdBy`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentPointUser` ADD CONSTRAINT `PaymentPointUser_organizationId_paymentPointId_fkey` FOREIGN KEY (`organizationId`, `paymentPointId`) REFERENCES `PaymentPoint`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentPointUser` ADD CONSTRAINT `PaymentPointUser_organizationId_userId_fkey` FOREIGN KEY (`organizationId`, `userId`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentShift` ADD CONSTRAINT `PaymentShift_organizationId_paymentPointId_fkey` FOREIGN KEY (`organizationId`, `paymentPointId`) REFERENCES `PaymentPoint`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentShift` ADD CONSTRAINT `PaymentShift_organizationId_openedBy_fkey` FOREIGN KEY (`organizationId`, `openedBy`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentShift` ADD CONSTRAINT `PaymentShift_organizationId_closedBy_fkey` FOREIGN KEY (`organizationId`, `closedBy`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_organizationId_paymentPointId_fkey` FOREIGN KEY (`organizationId`, `paymentPointId`) REFERENCES `PaymentPoint`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_organizationId_paymentPointId_shiftId_fkey` FOREIGN KEY (`organizationId`, `paymentPointId`, `shiftId`) REFERENCES `PaymentShift`(`organizationId`, `paymentPointId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_organizationId_verifiedBy_fkey` FOREIGN KEY (`organizationId`, `verifiedBy`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_organizationId_receiptedBy_fkey` FOREIGN KEY (`organizationId`, `receiptedBy`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentSlip` ADD CONSTRAINT `PaymentSlip_organizationId_paymentTransactionId_fkey` FOREIGN KEY (`organizationId`, `paymentTransactionId`) REFERENCES `PaymentTransaction`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentStatusHistory` ADD CONSTRAINT `PaymentStatusHistory_organizationId_paymentTransactionId_fkey` FOREIGN KEY (`organizationId`, `paymentTransactionId`) REFERENCES `PaymentTransaction`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentStatusHistory` ADD CONSTRAINT `PaymentStatusHistory_organizationId_changedBy_fkey` FOREIGN KEY (`organizationId`, `changedBy`) REFERENCES `User`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database invariants not expressible in Prisma's schema language.
ALTER TABLE `PaymentTransaction`
  ADD CONSTRAINT `payment_declared_positive` CHECK (`declaredAmount` > 0),
  ADD CONSTRAINT `payment_verified_nonnegative` CHECK (`verifiedAmount` IS NULL OR `verifiedAmount` >= 0),
  ADD CONSTRAINT `payment_version_nonnegative` CHECK (`version` >= 0);
ALTER TABLE `PaymentShift`
  ADD CONSTRAINT `shift_open_slot` CHECK ((`status` = 'OPEN' AND `openSlot` IS NOT NULL AND `openSlot` = 1) OR (`status` <> 'OPEN' AND `openSlot` IS NULL)),
  ADD CONSTRAINT `shift_totals_nonnegative` CHECK (`transactionCount` >= 0 AND `declaredAmount` >= 0 AND `verifiedAmount` >= 0 AND `receiptAmount` >= 0),
  ADD CONSTRAINT `shift_time_order` CHECK (`endTime` IS NULL OR `endTime` >= `startTime`);
ALTER TABLE `PaymentSlip` ADD CONSTRAINT `slip_size_positive` CHECK (`fileSize` > 0);
ALTER TABLE `PaymentStatusHistory` ADD CONSTRAINT `history_version_nonnegative` CHECK (`version` >= 0);
ALTER TABLE `PaymentNumberSequence` ADD CONSTRAINT `sequence_nonnegative` CHECK (`value` >= 0);
