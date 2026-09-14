export function formatSum(amount: number) {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(amount)) + " so'm";
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Yangi",
  CONFIRMED: "Tasdiqlangan",
  IN_PRODUCTION: "Ishlab chiqarilmoqda",
  READY: "Tayyor",
  SHIPPED: "Jo'natildi",
  COMPLETED: "Yakunlandi",
  CANCELLED: "Bekor qilindi",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  IN_PRODUCTION: "bg-amber-100 text-amber-700",
  READY: "bg-violet-100 text-violet-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PALLET: "Pallet",
  MATERIAL: "Xomashyo",
  SERVICE: "Xizmat",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Naqd",
  CARD: "Karta",
  BANK_TRANSFER: "Bank o'tkazmasi",
};
