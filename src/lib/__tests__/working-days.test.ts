import { describe, expect, it } from "vitest";

import {
  addWorkingDayKeys,
  countWorkingDayKeysBetween,
  filterWorkingDayKeys,
  isWeekendKey,
  isWorkingDayKey,
  listWorkingDayKeysBetween,
  nextWorkingDayKey,
  parseLocalDateKey,
  resolveLastWorkingDayKey,
  toLocalDateKey,
} from "@/lib/working-days";

describe("isWeekendKey", () => {
  it("devuelve false para lunes a viernes", () => {
    expect(isWeekendKey("2026-06-01")).toBe(false);
    expect(isWeekendKey("2026-06-02")).toBe(false);
    expect(isWeekendKey("2026-06-03")).toBe(false);
    expect(isWeekendKey("2026-06-04")).toBe(false);
    expect(isWeekendKey("2026-06-05")).toBe(false);
  });

  it("devuelve true para sábado y domingo", () => {
    expect(isWeekendKey("2026-06-06")).toBe(true);
    expect(isWeekendKey("2026-06-07")).toBe(true);
  });

  it("devuelve false para una clave mal formada", () => {
    expect(isWeekendKey("not-a-date")).toBe(false);
    expect(isWeekendKey("2026-13-01")).toBe(false);
  });
});

describe("isWorkingDayKey", () => {
  it("false para sábado y domingo aunque no haya festivos", () => {
    expect(isWorkingDayKey("2026-06-06")).toBe(false);
    expect(isWorkingDayKey("2026-06-07")).toBe(false);
  });

  it("true para lunes sin festivo", () => {
    expect(isWorkingDayKey("2026-06-01")).toBe(true);
  });

  it("false para festivo entre semana", () => {
    const nonWorking = new Set(["2026-06-01"]);
    expect(isWorkingDayKey("2026-06-01", { nonWorkingDates: nonWorking })).toBe(false);
  });
});

describe("filterWorkingDayKeys", () => {
  it("conserva solo los días laborables", () => {
    const input = [
      "2026-06-01",
      "2026-06-06",
      "2026-06-07",
      "2026-06-08",
    ];
    const result = filterWorkingDayKeys(input, {
      nonWorkingDates: new Set(["2026-06-08"]),
    });
    expect(result).toEqual(["2026-06-01"]);
  });

  it("devuelve [] si todo el rango cae en finde/festivo", () => {
    const result = filterWorkingDayKeys(["2026-06-06", "2026-06-07"]);
    expect(result).toEqual([]);
  });
});

describe("listWorkingDayKeysBetween", () => {
  it("excluye fines de semana en una semana completa", () => {
    const result = listWorkingDayKeysBetween("2026-06-01", "2026-06-07");
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("excluye festivos que caen en día hábil", () => {
    const result = listWorkingDayKeysBetween("2026-06-01", "2026-06-05", {
      nonWorkingDates: new Set(["2026-06-03"]),
    });
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("festivo en fin de semana no afecta la cuenta", () => {
    const result = listWorkingDayKeysBetween("2026-06-01", "2026-06-07", {
      nonWorkingDates: new Set(["2026-06-06"]),
    });
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("rango invertido devuelve vacío", () => {
    expect(listWorkingDayKeysBetween("2026-06-10", "2026-06-01")).toEqual([]);
  });

  it("rango de un solo día hábil", () => {
    expect(listWorkingDayKeysBetween("2026-06-02", "2026-06-02")).toEqual(["2026-06-02"]);
  });

  it("rango de un solo día festivo entre semana", () => {
    expect(
      listWorkingDayKeysBetween("2026-06-03", "2026-06-03", {
        nonWorkingDates: new Set(["2026-06-03"]),
      }),
    ).toEqual([]);
  });

  it("junio 2026 con festivos colombianos da 19 días hábiles (regresión)", () => {
    const result = countWorkingDayKeysBetween("2026-06-01", "2026-06-30", {
      nonWorkingDates: new Set([
        "2026-06-08",
        "2026-06-15",
        "2026-06-29",
      ]),
    });
    expect(result).toBe(19);
  });
});

describe("parseLocalDateKey + toLocalDateKey", () => {
  it("round-trip preserva la fecha", () => {
    const date = parseLocalDateKey("2026-06-15");
    expect(date).not.toBeNull();
    expect(toLocalDateKey(date!)).toBe("2026-06-15");
  });

  it("devuelve null para claves con formato inválido", () => {
    expect(parseLocalDateKey("")).toBeNull();
    expect(parseLocalDateKey("2026-6-1")).toBeNull();
    expect(parseLocalDateKey("abc")).toBeNull();
  });
});

describe("addWorkingDayKeys", () => {
  it("count <= 0 devuelve la misma fecha", () => {
    expect(addWorkingDayKeys("2026-06-01", 0)).toBe("2026-06-01");
    expect(addWorkingDayKeys("2026-06-01", -3)).toBe("2026-06-01");
  });

  it("avanza un día hábil dentro de la semana", () => {
    // Lunes 1 + 1 día hábil = martes 2.
    expect(addWorkingDayKeys("2026-06-01", 1)).toBe("2026-06-02");
  });

  it("salta el fin de semana", () => {
    // Viernes 5 + 1 día hábil = lunes 8.
    expect(addWorkingDayKeys("2026-06-05", 1)).toBe("2026-06-08");
  });

  it("salta festivos entre semana además de fines de semana", () => {
    // Viernes 5 + 1 día hábil, con lunes 8 festivo = martes 9.
    expect(
      addWorkingDayKeys("2026-06-05", 1, {
        nonWorkingDates: new Set(["2026-06-08"]),
      }),
    ).toBe("2026-06-09");
  });

  it("CA-18: inicio 15/06/2026 + 3 días hábiles (festivo intermedio) = 18/06", () => {
    // Lunes 15 como día 0; +3 hábiles saltando festivo lunes 15 no aplica
    // (arranca en 15). 16, 17, 18 son hábiles => 18.
    expect(addWorkingDayKeys("2026-06-15", 3)).toBe("2026-06-18");
  });

  it("devuelve null si la fecha es inválida", () => {
    expect(addWorkingDayKeys("nope", 2)).toBeNull();
  });
});

describe("nextWorkingDayKey", () => {
  it("siguiente hábil de un viernes es el lunes", () => {
    expect(nextWorkingDayKey("2026-06-05")).toBe("2026-06-08");
  });

  it("salta festivo para caer en el siguiente hábil", () => {
    // Viernes 5 -> lunes 8 festivo -> martes 9.
    expect(
      nextWorkingDayKey("2026-06-05", {
        nonWorkingDates: new Set(["2026-06-08"]),
      }),
    ).toBe("2026-06-09");
  });

  it("siguiente hábil de un día entre semana es el día siguiente", () => {
    expect(nextWorkingDayKey("2026-06-02")).toBe("2026-06-03");
  });
});

describe("resolveLastWorkingDayKey", () => {
  it("devuelve el mismo día si es laborable", () => {
    expect(resolveLastWorkingDayKey("2026-06-08", "2026-06-12")).toBe("2026-06-12");
  });

  it("retrocede al viernes cuando el último día es sábado o domingo", () => {
    expect(resolveLastWorkingDayKey("2026-06-08", "2026-06-13")).toBe("2026-06-12");
    expect(resolveLastWorkingDayKey("2026-06-08", "2026-06-14")).toBe("2026-06-12");
  });

  it("ignora festivos entre semana y cae al último hábil", () => {
    // Lunes 8 es festivo, retrocede al viernes 5.
    expect(
      resolveLastWorkingDayKey("2026-06-01", "2026-06-08", {
        nonWorkingDates: new Set(["2026-06-08"]),
      }),
    ).toBe("2026-06-05");
  });

  it("atraviesa festivos consecutivos y retrocede hasta el último hábil", () => {
    // Lunes 8 y martes 9 son festivos. El día "actual" cae en martes festivo,
    // así que retrocede hasta el viernes 5 anterior.
    expect(
      resolveLastWorkingDayKey("2026-06-01", "2026-06-09", {
        nonWorkingDates: new Set(["2026-06-08", "2026-06-09"]),
      }),
    ).toBe("2026-06-05");
  });

  it("devuelve null si no hay ningún laborable en el rango", () => {
    expect(resolveLastWorkingDayKey("2026-06-06", "2026-06-07")).toBeNull();
  });

  it("devuelve null si el rango está invertido", () => {
    expect(resolveLastWorkingDayKey("2026-06-10", "2026-06-01")).toBeNull();
  });

  it("respeta la cota inferior: nunca devuelve un día anterior al fromIso", () => {
    // fromIso es el lunes festivo: no debe devolver nada porque no hay
    // laborable dentro del rango [lunes festivo, martes festivo].
    expect(
      resolveLastWorkingDayKey("2026-06-08", "2026-06-09", {
        nonWorkingDates: new Set(["2026-06-08", "2026-06-09"]),
      }),
    ).toBeNull();
  });
});