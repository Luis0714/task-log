import { describe, expect, it } from "vitest";

import { isNumericList } from "@/lib/agent/features/log-work/is-numeric-list";

describe("isNumericList", () => {
  it("acepta dos números separados por coma", () => {
    expect(isNumericList("1, 2")).toBe(true);
    expect(isNumericList("1,2")).toBe(true);
  });

  it("acepta tres o más números separados por espacios o comas", () => {
    expect(isNumericList("1 2 3")).toBe(true);
    expect(isNumericList("1, 2, 3")).toBe(true);
    expect(isNumericList(" 1 , 2 , 3 ")).toBe(true);
  });

  it("rechaza un único número (sin lista)", () => {
    expect(isNumericList("5")).toBe(false);
    expect(isNumericList("0")).toBe(false);
  });

  it("rechaza input con tokens no numéricos", () => {
    expect(isNumericList("1, abc")).toBe(false);
    expect(isNumericList("1 2 three")).toBe(false);
    expect(isNumericList("uno")).toBe(false);
  });

  it("rechaza input vacío o solo separadores", () => {
    expect(isNumericList("")).toBe(false);
    expect(isNumericList(",,, ")).toBe(false);
  });

  it("rechaza strings con espacios internos en un token numérico", () => {
    expect(isNumericList("1 2")).toBe(true);
    expect(isNumericList("1  2")).toBe(true);
    expect(isNumericList("1 2 ")).toBe(true);
    expect(isNumericList(" 12 34 ")).toBe(true);
  });
});
