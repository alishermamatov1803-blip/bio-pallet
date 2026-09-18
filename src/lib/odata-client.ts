import { Company } from "@prisma/client";

export function odataAuthHeader(company: Pick<Company, "odataUsername" | "odataPassword">) {
  if (!company.odataUsername) return undefined;
  const token = Buffer.from(
    `${company.odataUsername}:${company.odataPassword || ""}`
  ).toString("base64");
  return `Basic ${token}`;
}

export function requireOdataConfig(
  company: Pick<Company, "odataBaseUrl" | "odataEntitySet">
) {
  if (!company.odataBaseUrl) {
    throw new Error("1C OData manzili (odataBaseUrl) sozlanmagan");
  }
  if (!company.odataEntitySet) {
    throw new Error("1C hujjat turi (entity set) tanlanmagan");
  }
  return { baseUrl: company.odataBaseUrl.replace(/\/+$/, ""), entitySet: company.odataEntitySet };
}

/** $metadata XML ichidan <EntitySet Name="..."> nomlarini ajratib oladi. */
export function parseEntitySets(xml: string): string[] {
  const names = new Set<string>();
  const re = /<EntitySet\s+Name="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    names.add(m[1]);
  }
  return Array.from(names).sort();
}
