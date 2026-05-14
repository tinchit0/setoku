export type CellPos = { r: number; c: number };

export type GivenConstraint = {
  id: string;
  kind: "given";
  pos: CellPos;
  digit: number;
};

export type DiagonalConstraint = {
  id: string;
  kind: "diagonal";
  which: "main" | "anti";
};

export type CageConstraint = {
  id: string;
  kind: "cage";
  cells: CellPos[];
  sum?: number;
};

export type ThermometerConstraint = {
  id: string;
  kind: "thermometer";
  cells: CellPos[];
};

export type ArrowConstraint = {
  id: string;
  kind: "arrow";
  bulb: CellPos[];
  path: CellPos[];
};

export type KropkiConstraint = {
  id: string;
  kind: "kropki";
  a: CellPos;
  b: CellPos;
  color: "white" | "black";
};

export type XVConstraint = {
  id: string;
  kind: "xv";
  a: CellPos;
  b: CellPos;
  mark: "x" | "v";
};

export type ParityConstraint = {
  id: string;
  kind: "parity";
  pos: CellPos;
  parity: "even" | "odd";
};

export type AntiKnightConstraint = {
  id: string;
  kind: "antiKnight";
};

export type AntiKingConstraint = {
  id: string;
  kind: "antiKing";
};

export type Constraint =
  | GivenConstraint
  | DiagonalConstraint
  | CageConstraint
  | ThermometerConstraint
  | ArrowConstraint
  | KropkiConstraint
  | XVConstraint
  | ParityConstraint
  | AntiKnightConstraint
  | AntiKingConstraint;

export type ConstraintKind = Constraint["kind"];

export const CONSTRAINT_LABELS: Record<ConstraintKind, string> = {
  given: "Given",
  diagonal: "Diagonal",
  cage: "Killer cage",
  thermometer: "Thermometer",
  arrow: "Arrow",
  kropki: "Kropki dot",
  xv: "XV",
  parity: "Par/Impar",
  antiKnight: "Anti-caballo",
  antiKing: "Anti-rey",
};
