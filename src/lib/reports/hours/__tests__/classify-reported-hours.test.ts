import { describe, expect, it } from "vitest";

import { classifyReportedHours } from "@/lib/reports/hours/classify-reported-hours";

describe("classifyReportedHours", () => {
  it("separa desarrollo, bugs y novedades (caso cliente 60 + 20 + 8)", () => {
    const result = classifyReportedHours(
      [
        { hours: 60, parentId: 100 },
        { hours: 8, parentId: 3421 },
      ],
      [{ hours: 20 }],
      new Set([3421]),
    );
    expect(result.developmentHours).toBe(60);
    expect(result.bugHours).toBe(20);
    expect(result.newsHours).toBe(8);
    expect(result.newsStoryIds).toEqual([3421]);
  });

  it("cuenta las HU de novedad distintas trabajadas", () => {
    const result = classifyReportedHours(
      [
        { hours: 2, parentId: 3421 },
        { hours: 3, parentId: 3421 },
        { hours: 4, parentId: 3508 },
      ],
      [],
      new Set([3421, 3508, 3600]),
    );
    expect(result.newsHours).toBe(9);
    expect(result.newsStoryIds).toEqual([3421, 3508]);
  });

  it("las tasks sin HU padre novedad cuentan como desarrollo", () => {
    const result = classifyReportedHours(
      [
        { hours: 5, parentId: null },
        { hours: 5, parentId: 200 },
      ],
      [],
      new Set([999]),
    );
    expect(result.developmentHours).toBe(10);
    expect(result.newsHours).toBe(0);
    expect(result.newsStoryIds).toEqual([]);
  });
});
