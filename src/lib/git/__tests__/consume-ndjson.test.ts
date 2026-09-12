import { describe, expect, it } from "vitest";

import { flushNdjsonBuffer } from "@/lib/git/consume-ndjson";

describe("flushNdjsonBuffer", () => {
  it("entrega líneas completas y conserva el resto", () => {
    const lines: string[] = [];
    const rest = flushNdjsonBuffer('{"a":1}\n{"b":2}\n{"c":', (line) => {
      lines.push(line);
    });
    expect(lines).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('{"c":');
  });
});
