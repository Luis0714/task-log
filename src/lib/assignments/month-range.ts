export type DateRange = { from: string; to: string };

/**
 * Convierte un mes "YYYY-MM" en su rango de fechas [primer día, último día]
 * en formato "YYYY-MM-DD". Devuelve null si el formato no es válido.
 */
export function monthToDateRange(month: string): DateRange | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mm = Number(m[2]);
  if (mm < 1 || mm > 12) return null;
  const lastDay = new Date(Date.UTC(year, mm, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${m[1]}-${pad(mm)}-01`,
    to: `${m[1]}-${pad(mm)}-${pad(lastDay)}`,
  };
}
