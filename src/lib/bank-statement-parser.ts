import * as XLSX from "xlsx";

export type ParsedBankLine = {
  date: Date;
  account: string;
  accountName: string | null;
  docNumber: string | null;
  vo: string | null;
  mfo: string | null;
  debit: number;
  credit: number;
  purpose: string | null;
  kasSmv: string | null;
};

export type ParsedBankStatement = {
  accountNumber: string | null;
  accountHolder: string | null;
  periodLabel: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  lines: ParsedBankLine[];
};

const HEADER_ROW_MARKER = "ДАТА";
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{2,4})$/;

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\s|,/g, (m) => (m === "," ? "." : "")));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  const s = toStr(v);
  if (!s) return null;
  const m = s.match(DATE_RE);
  if (!m) return null;
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
  return new Date(Date.UTC(year, Number(mm) - 1, Number(dd)));
}

/** NCI Bank uslubidagi "ДАТА/СЧЕТ/.../Кас.смв" formatidagi vypiska (.xlsx) ni tahlil qiladi. */
export function parseBankStatement(buffer: Buffer): ParsedBankStatement {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });

  let headerRowIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (toStr(rows[i]?.[0]) === HEADER_ROW_MARKER) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) {
    throw new Error(
      "Fayl tuzilmasi tanilmadi: 'ДАТА' sarlavhali ustun topilmadi"
    );
  }

  let accountNumber: string | null = null;
  let accountHolder: string | null = null;
  let periodLabel: string | null = null;
  let openingBalance: number | null = null;
  let closingBalance: number | null = null;

  // Sarlavha qatoridan keyin, haqiqiy tranzaksiyalardan oldin filial/hisob/qoldiq
  // haqidagi izoh qatorlari keladi — ularni topib metadata sifatida o'qiymiz.
  const lines: ParsedBankLine[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const date = parseDate(row[0]);
    const account = toStr(row[1]);
    if (!date || !account) {
      const cell = toStr(row[0]);
      if (!cell) continue;
      if (cell.startsWith("Счет:")) {
        const m = cell.match(/Счет:\s*(\d+)\s*(.*)/);
        if (m) {
          accountNumber = m[1];
          accountHolder = m[2]?.trim() || null;
        }
      } else if (cell.startsWith("Справка о работе счета")) {
        periodLabel = cell.replace("Справка о работе счета за", "").trim();
      } else if (cell.startsWith("Остаток на начало")) {
        const nums = cell.match(/[\d.,]+/g)?.map((n) => Number(n.replace(/,/g, "")));
        if (nums && nums.length >= 2) {
          openingBalance = nums[0];
          closingBalance = nums[1];
        }
      }
      continue; // sarlavha/izoh qatorlarini o'tkazib yuborish
    }

    lines.push({
      date,
      account,
      accountName: toStr(row[2]),
      docNumber: toStr(row[3]),
      vo: toStr(row[4]),
      mfo: toStr(row[5]),
      debit: toNum(row[6]),
      credit: toNum(row[7]),
      purpose: toStr(row[8]),
      kasSmv: toStr(row[9]),
    });
  }

  return { accountNumber, accountHolder, periodLabel, openingBalance, closingBalance, lines };
}
