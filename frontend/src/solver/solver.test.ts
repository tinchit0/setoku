import { describe, it, expect } from "vitest";
import { solvePuzzle } from "./solver";

describe("solvePuzzle", () => {
  it("devuelve multiple sin restricciones", () => {
    const result = solvePuzzle([]);
    expect(result.state).toBe("multiple");
  });

  it("devuelve none con givens contradictorios en la misma fila", () => {
    const result = solvePuzzle([
      { id: "1", kind: "given", pos: { r: 0, c: 0 }, digit: 5 },
      { id: "2", kind: "given", pos: { r: 0, c: 1 }, digit: 5 },
    ]);
    expect(result.state).toBe("none");
  });
});
