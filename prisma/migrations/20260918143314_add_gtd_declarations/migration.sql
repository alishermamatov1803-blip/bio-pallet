-- AlterTable
ALTER TABLE "Company" ADD COLUMN "gtdEntitySet" TEXT;
ALTER TABLE "Company" ADD COLUMN "gtdFieldMap" TEXT;

-- CreateTable
CREATE TABLE "GtdDeclaration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileData" BLOB NOT NULL,
    "declarationNumber" TEXT,
    "declarationDate" DATETIME,
    "senderName" TEXT,
    "receiverName" TEXT,
    "receiverInn" TEXT,
    "brokerName" TEXT,
    "originCountry" TEXT,
    "destinationCountry" TEXT,
    "deliveryTerms" TEXT,
    "currencyCode" TEXT,
    "invoiceTotal" REAL,
    "exchangeRate" REAL,
    "weightBrutto" REAL,
    "weightNetto" REAL,
    "customsValue" REAL,
    "dutyTotal" REAL,
    "notes" TEXT,
    "exportedAt" DATETIME,
    "odataId" TEXT,
    "odataError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GtdDeclaration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GtdItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gtdId" INTEGER NOT NULL,
    "itemNo" INTEGER,
    "description" TEXT NOT NULL,
    "hsCode" TEXT,
    "originCountryCode" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "weightNetto" REAL,
    "invoiceValue" REAL,
    CONSTRAINT "GtdItem_gtdId_fkey" FOREIGN KEY ("gtdId") REFERENCES "GtdDeclaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GtdDeclaration_companyId_idx" ON "GtdDeclaration"("companyId");

-- CreateIndex
CREATE INDEX "GtdItem_gtdId_idx" ON "GtdItem"("gtdId");
