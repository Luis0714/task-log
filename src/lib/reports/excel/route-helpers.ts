import "server-only";

import type ExcelJS from "exceljs";

export function xlsxResponse(
  buffer: ExcelJS.Buffer,
  filename: string,
): Response {
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}