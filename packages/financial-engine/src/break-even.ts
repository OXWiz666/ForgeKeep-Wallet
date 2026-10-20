import { money, subtractMoney, type Money } from "./money";
import type { FinancialResult } from "./results";

const BASIS_POINTS = 10_000n;

export type BreakEvenInput = Readonly<{
  totalSpending: Money;
  cashRecovered: Money;
  saleFeeBasisPoints: bigint;
  fixedFees: Money;
  projectedNetMonthlyRecovery: Money;
}>;

export type BreakEven = Readonly<{ gap: Money; requiredGrossSalePrice: Money; estimatedMonths: bigint }>;

export const calculateBreakEven = (input: BreakEvenInput): FinancialResult<BreakEven> => {
  const gapMinor = input.totalSpending.amountMinor - input.cashRecovered.amountMinor;
  const gap = money(gapMinor > 0n ? gapMinor : 0n, input.totalSpending.currency);
  if (input.saleFeeBasisPoints >= BASIS_POINTS && gap.amountMinor > 0n) {
    return { kind: "not_possible", reason: "fee_at_or_above_100_percent" };
  }
  if (input.projectedNetMonthlyRecovery.amountMinor <= 0n) {
    return { kind: "not_applicable", reason: "non_positive_monthly_recovery" };
  }
  const netAfterFixedFees = subtractMoney(gap, input.fixedFees).amountMinor;
  const requiredGrossSalePrice = money(
    netAfterFixedFees <= 0n ? 0n : (netAfterFixedFees * BASIS_POINTS + (BASIS_POINTS - input.saleFeeBasisPoints) - 1n) / (BASIS_POINTS - input.saleFeeBasisPoints),
    input.totalSpending.currency,
  );
  return {
    kind: "applicable",
    value: {
      gap,
      requiredGrossSalePrice,
      estimatedMonths: (gap.amountMinor + input.projectedNetMonthlyRecovery.amountMinor - 1n) / input.projectedNetMonthlyRecovery.amountMinor,
    },
  };
};
