export type Applicable<T> = Readonly<{ kind: "applicable"; value: T }>;
export type NotApplicable = Readonly<{ kind: "not_applicable"; reason: string }>;
export type NotPossible = Readonly<{ kind: "not_possible"; reason: string }>;

export type FinancialResult<T> = Applicable<T> | NotApplicable | NotPossible;
