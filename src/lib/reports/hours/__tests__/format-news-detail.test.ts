import { describe, expect, it } from "vitest";

import {
  formatNewsDetail,
  type NewsStoryInfo,
} from "@/lib/reports/hours/format-news-detail";

const infoMap = new Map<number, NewsStoryInfo>([
  [1, { type: "VPN caída", title: "No fue posible acceder al servidor" }],
  [2, { type: "Permiso médico", title: "Cita odontológica" }],
  [3, { type: null, title: "Formación interna" }],
  [4, { type: "Capacitación", title: "   " }],
]);

describe("formatNewsDetail", () => {
  it("concatena `<tipo> - <título>` separados por '. ' (CA-24/CA-25)", () => {
    expect(formatNewsDetail([1, 2], infoMap)).toBe(
      "VPN caída - No fue posible acceder al servidor. Permiso médico - Cita odontológica",
    );
  });

  it("omite el prefijo cuando la HU no tiene tipo", () => {
    expect(formatNewsDetail([3], infoMap)).toBe("Formación interna");
  });

  it("omite HU sin título o sin info", () => {
    expect(formatNewsDetail([4, 99], infoMap)).toBe("");
  });
});
