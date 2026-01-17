-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paciente_id" UUID NOT NULL,
    "servico_tipo" TEXT NOT NULL,
    "provider_id" UUID,
    "priority" TEXT NOT NULL DEFAULT 'CONVENIENCE',
    "preferred_date" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlist_status_priority_created_at_idx" ON "waitlist"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "waitlist_paciente_id_servico_tipo_idx" ON "waitlist"("paciente_id", "servico_tipo");

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
