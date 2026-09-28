-- AlterTable
ALTER TABLE `PaymentTransaction`
  ADD COLUMN `statusTokenHash` CHAR(64) NULL,
  ADD COLUMN `deviceFingerprintHash` CHAR(64) NULL;

-- AlterTable
ALTER TABLE `PaymentSlip` ADD UNIQUE INDEX `PaymentSlip_organizationId_id_key`(`organizationId`, `id`);

-- CreateTable
CREATE TABLE `PaymentSlipExtraction` (
  `id` CHAR(36) NOT NULL,
  `organizationId` CHAR(36) NOT NULL,
  `paymentSlipId` CHAR(36) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `provider` VARCHAR(40) NULL,
  `amount` DECIMAL(15, 2) NULL,
  `transferAt` DATETIME(3) NULL,
  `bankName` VARCHAR(120) NULL,
  `reference` VARCHAR(120) NULL,
  `confidence` DECIMAL(5, 4) NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `errorCode` VARCHAR(40) NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PaymentSlipExtraction_paymentSlipId_key`(`paymentSlipId`),
  UNIQUE INDEX `PaymentSlipExtraction_organizationId_id_key`(`organizationId`, `id`),
  UNIQUE INDEX `PaymentSlipExtraction_organizationId_paymentSlipId_key`(`organizationId`, `paymentSlipId`),
  INDEX `PaymentSlipExtraction_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `PaymentTransaction_statusTokenHash_key` ON `PaymentTransaction`(`statusTokenHash`);
CREATE INDEX `PaymentTransaction_organizationId_deviceFingerprintHash_submittedAt_idx`
  ON `PaymentTransaction`(`organizationId`, `deviceFingerprintHash`, `submittedAt`);

ALTER TABLE `PaymentSlipExtraction`
  ADD CONSTRAINT `PaymentSlipExtraction_organizationId_paymentSlipId_fkey`
  FOREIGN KEY (`organizationId`, `paymentSlipId`)
  REFERENCES `PaymentSlip`(`organizationId`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PaymentSlipExtraction`
  ADD CONSTRAINT `slip_extraction_attempts_nonnegative` CHECK (`attempts` >= 0);
