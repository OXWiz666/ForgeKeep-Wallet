export type Money = Readonly<{
  amountMinor: bigint;
  currency: string;
}>;

export const money = (amountMinor: bigint, currency: string): Money => ({ amountMinor, currency });

export const addMoney = (left: Money, right: Money): Money => {
  if (left.currency !== right.currency) throw new Error("currency_mismatch");
  return money(left.amountMinor + right.amountMinor, left.currency);
};

export const subtractMoney = (left: Money, right: Money): Money => {
  if (left.currency !== right.currency) throw new Error("currency_mismatch");
  return money(left.amountMinor - right.amountMinor, left.currency);
};
