-- CreateEnum
CREATE TYPE "SignerType" AS ENUM ('WEBAUTHN', 'EOA');

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "address" CHAR(42) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signer" (
    "id" TEXT NOT NULL,
    "type" "SignerType" NOT NULL,
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Signer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialId" (
    "hash" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CredentialId_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Lock" (
    "id" UUID NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_address_key" ON "Account"("address");

-- AddForeignKey
ALTER TABLE "Signer" ADD CONSTRAINT "Signer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
