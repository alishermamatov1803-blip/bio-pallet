-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "inn" TEXT,
    "address" TEXT,
    "odataBaseUrl" TEXT,
    "odataUsername" TEXT,
    "odataPassword" TEXT,
    "odataEntitySet" TEXT,
    "odataFieldMap" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BankStatementImport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "periodLabel" TEXT,
    "openingBalance" REAL,
    "closingBalance" REAL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankStatementImport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankStatementLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "importId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "account" TEXT NOT NULL,
    "accountName" TEXT,
    "docNumber" TEXT,
    "vo" TEXT,
    "mfo" TEXT,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "purpose" TEXT,
    "kasSmv" TEXT,
    "exportedAt" DATETIME,
    "odataId" TEXT,
    "odataError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankStatementLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BankStatementLine_importId_fkey" FOREIGN KEY ("importId") REFERENCES "BankStatementImport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BankStatementLine_companyId_date_idx" ON "BankStatementLine"("companyId", "date");

-- CreateIndex
CREATE INDEX "BankStatementLine_importId_idx" ON "BankStatementLine"("importId");
