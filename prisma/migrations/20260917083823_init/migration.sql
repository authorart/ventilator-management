-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EQUIPMENT_CENTER', 'WARD_STAFF');

-- CreateEnum
CREATE TYPE "WardCategory" AS ENUM ('DEDICATED', 'RESERVE');

-- CreateEnum
CREATE TYPE "VentilatorStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'AWAITING_REPAIR', 'UNDER_MAINTENANCE', 'DAMAGED_PENDING_DISPOSAL', 'DISPOSED');

-- CreateEnum
CREATE TYPE "MoveType" AS ENUM ('ASSIGN', 'WITHDRAW_RESERVE', 'RETURN_TO_STOCK', 'SEND_FOR_REPAIR', 'RETURN_FROM_REPAIR', 'DISPOSE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE');

-- CreateEnum
CREATE TYPE "MaintenanceResult" AS ENUM ('REPAIRED', 'AWAITING_PARTS', 'UNREPAIRABLE');

-- CreateEnum
CREATE TYPE "DisposalMethod" AS ENUM ('SOLD', 'DESTROYED', 'DONATED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('SUPPLIER', 'REPAIR_SERVICE', 'BOTH');

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "WardCategory" NOT NULL,
    "bedCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "homeWardId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ventilator" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(65,30),
    "warrantyExpiryDate" TIMESTAMP(3),
    "vendorId" TEXT,
    "currentWardId" TEXT NOT NULL,
    "currentStatus" "VentilatorStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isReserveUnit" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ventilator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "ventilatorId" TEXT NOT NULL,
    "fromWardId" TEXT,
    "toWardId" TEXT NOT NULL,
    "moveType" "MoveType" NOT NULL,
    "moveDatetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movedById" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "ventilatorId" TEXT NOT NULL,
    "status" "VentilatorStatus" NOT NULL,
    "statusDatetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "ventilatorId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "vendorId" TEXT,
    "technicianName" TEXT,
    "startDate" TIMESTAMP(3),
    "completeDate" TIMESTAMP(3),
    "cost" DECIMAL(65,30),
    "partsReplaced" TEXT,
    "result" "MaintenanceResult",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisposalRecord" (
    "id" TEXT NOT NULL,
    "ventilatorId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "committeeApprovalNo" TEXT NOT NULL,
    "approvalDate" TIMESTAMP(3),
    "disposalMethod" "DisposalMethod" NOT NULL,
    "disposalDate" TIMESTAMP(3),
    "approvedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisposalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Building_name_key" ON "Building"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Building_code_key" ON "Building"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_buildingId_name_key" ON "Ward"("buildingId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Ventilator_assetNumber_key" ON "Ventilator"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ventilator_serialNumber_key" ON "Ventilator"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ventilator_deviceCode_key" ON "Ventilator"("deviceCode");

-- CreateIndex
CREATE INDEX "LocationHistory_ventilatorId_idx" ON "LocationHistory"("ventilatorId");

-- CreateIndex
CREATE INDEX "StatusHistory_ventilatorId_idx" ON "StatusHistory"("ventilatorId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_ventilatorId_idx" ON "MaintenanceRecord"("ventilatorId");

-- CreateIndex
CREATE UNIQUE INDEX "DisposalRecord_ventilatorId_key" ON "DisposalRecord"("ventilatorId");

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeWardId_fkey" FOREIGN KEY ("homeWardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ventilator" ADD CONSTRAINT "Ventilator_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ventilator" ADD CONSTRAINT "Ventilator_currentWardId_fkey" FOREIGN KEY ("currentWardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_ventilatorId_fkey" FOREIGN KEY ("ventilatorId") REFERENCES "Ventilator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_fromWardId_fkey" FOREIGN KEY ("fromWardId") REFERENCES "Ward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_toWardId_fkey" FOREIGN KEY ("toWardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_movedById_fkey" FOREIGN KEY ("movedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_ventilatorId_fkey" FOREIGN KEY ("ventilatorId") REFERENCES "Ventilator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_ventilatorId_fkey" FOREIGN KEY ("ventilatorId") REFERENCES "Ventilator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalRecord" ADD CONSTRAINT "DisposalRecord_ventilatorId_fkey" FOREIGN KEY ("ventilatorId") REFERENCES "Ventilator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalRecord" ADD CONSTRAINT "DisposalRecord_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
