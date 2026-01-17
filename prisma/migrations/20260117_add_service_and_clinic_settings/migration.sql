-- CreateTable: ClinicSettings (singleton pattern)
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "business_hours" JSONB NOT NULL,
    "lunch_break" JSONB NOT NULL,
    "antecedencia_minima" INTEGER NOT NULL DEFAULT 24,
    "notification_preferences" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Services
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "duracao" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Services nome search
CREATE INDEX "services_nome_idx" ON "services"("nome");

-- CreateIndex: Services ativo filtering
CREATE INDEX "services_ativo_idx" ON "services"("ativo");
