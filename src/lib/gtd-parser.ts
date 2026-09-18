import { PDFParse } from "pdf-parse";

export type ParsedGtdItem = {
  itemNo: number;
  description: string;
  weightNetto: number | null;
};

export type ParsedGtd = {
  declarationNumber: string | null;
  declarationDate: Date | null;
  rawText: string;
  items: ParsedGtdItem[];
};

/**
 * GTD (bojxona deklaratsiyasi) PDF fayllarida asosiy jadval (1-54 grafalar:
 * deklaratsiya raqami, jo'natuvchi/oluvchi, summalar, TIF kodlari) odatda
 * skanerlangan RASM bo'ladi — matn qatlamida shu qism o'qilmaydi. Faqat
 * "Товар № N" tovar tavsifi sahifalari haqiqiy matn bo'lib keladi, shuni
 * ishonchli tarzda ajratib olamiz; qolgan maydonlar foydalanuvchi tomonidan
 * PDF ko'rinishiga qarab qo'lda to'ldiriladi.
 */
export async function parseGtdPdf(buffer: Buffer): Promise<ParsedGtd> {
  const parser = new PDFParse({ data: buffer });
  let text: string;
  try {
    const result = await parser.getText();
    text = result.text;
  } finally {
    await parser.destroy();
  }

  const refMatch = text.match(/(\d{3,6})\s*\/\s*(\d{2}\.\d{2}\.\d{4})\s*\/\s*(\d{4,8})/);
  let declarationNumber: string | null = null;
  let declarationDate: Date | null = null;
  if (refMatch) {
    declarationNumber = `${refMatch[1]}/${refMatch[2]}/${refMatch[3]}`;
    const [dd, mm, yyyy] = refMatch[2].split(".");
    declarationDate = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  }

  const items: ParsedGtdItem[] = [];
  const seen = new Set<number>();
  const blockRe = /Товар\s*№\s*(\d+)\s*\n1\.Сведения о товаре:([\s\S]*?)(?=2\.Cведение об упаковки товара:)/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text))) {
    const itemNo = Number(m[1]);
    if (seen.has(itemNo)) continue;
    seen.add(itemNo);

    const block = m[2].trim();
    const weightMatch = block.match(/вес:\s*([\d,.]+)\s*кг/);
    const weightNetto = weightMatch ? Number(weightMatch[1].replace(",", ".")) : null;

    const description = block
      .split("\n")
      .filter((line) => !/^(2\.|8\.|9\.|10\.|11\.)\s/.test(line.trim()))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    items.push({ itemNo, description, weightNetto });
  }
  items.sort((a, b) => a.itemNo - b.itemNo);

  return { declarationNumber, declarationDate, rawText: text, items };
}
