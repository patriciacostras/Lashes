CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

CREATE TABLE "Service" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "priceRon" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "clientEmail" TEXT,
  "notes" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
  "serviceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlockedSlot" (
  "id" TEXT NOT NULL,
  "reason" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlockedSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");
CREATE INDEX "Appointment_startsAt_endsAt_idx" ON "Appointment"("startsAt", "endsAt");
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");
CREATE INDEX "BlockedSlot_startsAt_endsAt_idx" ON "BlockedSlot"("startsAt", "endsAt");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
