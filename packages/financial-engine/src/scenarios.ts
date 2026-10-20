import { money, type Money } from "./money.js";
import type { FinancialResult } from "./results.js";

const BASIS_POINTS = 10_000n;

export const calculateRealizedRoi = (costBasis: Money, realizedNetProfit: Money): FinancialResult<Readonly<{ percentageBasisPoints: bigint }>> => {
  if (costBasis.currency !== realizedNetProfit.currency) throw new Error("currency_mismatch");
  if (costBasis.amountMinor === 0n) return { kind: "not_applicable", reason: "zero_cost_basis" };
  return { kind: "applicable", value: { percentageBasisPoints: (realizedNetProfit.amountMinor * BASIS_POINTS) / costBasis.amountMinor } };
};

export type HypotheticalExitInput = Readonly<{
  recordedCashCosts: Money;
  previouslyRecoveredCash: Money;
  expectedSalePrice: Money;
  saleFeeBasisPoints: bigint;
  fixedFees: Money;
}>;

export const calculateHypotheticalExit = (input: HypotheticalExitInput): FinancialResult<Readonly<{
  label: "hypothetical";
  netSaleProceeds: Money;
  hypotheticalExitProfit: Money;
}>> => {
  const percentageFee = (input.expectedSalePrice.amountMinor * input.saleFeeBasisPoints) / BASIS_POINTS;
  const netSaleProceeds = money(input.expectedSalePrice.amountMinor - percentageFee - input.fixedFees.amountMinor, input.expectedSalePrice.currency);
  return {
    kind: "applicable",
    value: {
      label: "hypothetical",
      netSaleProceeds,
      hypotheticalExitProfit: money(input.previouslyRecoveredCash.amountMinor + netSaleProceeds.amountMinor - input.recordedCashCosts.amountMinor, input.recordedCashCosts.currency),
    },
  };
};
