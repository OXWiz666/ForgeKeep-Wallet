import {
  calculateBreakEven,
  calculateCashFlow,
  calculateHypotheticalExit,
  calculateRealizedRoi,
  money,
} from "@forgekeep/financial-engine";
import { describe, expect, test } from "vitest";

describe("calculateCashFlow", () => {
  test("subtracts posted payments from posted confirmed receipts", () => {
    const result = calculateCashFlow([
      { classification: "cash_payment", money: money(10_000n, "PHP"), state: "posted" },
      { classification: "cash_receipt", money: money(2_500n, "PHP"), state: "posted" },
      { classification: "cash_receipt", money: money(9_999n, "PHP"), state: "draft" },
      { classification: "internal_transfer", money: money(999n, "PHP"), state: "posted" },
    ]);

    expect(result).toEqual({
      kind: "applicable",
      value: {
        payments: money(10_000n, "PHP"),
        receipts: money(2_500n, "PHP"),
        netCashFlow: money(-7_500n, "PHP"),
      },
    });
  });
});

describe("calculateRealizedRoi", () => {
  test("returns not applicable for a zero cost basis", () => {
    expect(calculateRealizedRoi(money(0n, "PHP"), money(1n, "PHP"))).toEqual({
      kind: "not_applicable",
      reason: "zero_cost_basis",
    });
  });
});

describe("calculateBreakEven", () => {
  test("returns not possible when a 100 percent sale fee must recover a remaining gap", () => {
    expect(
      calculateBreakEven({
        totalSpending: money(10_000n, "PHP"),
        cashRecovered: money(2_500n, "PHP"),
        saleFeeBasisPoints: 10_000n,
        fixedFees: money(0n, "PHP"),
        projectedNetMonthlyRecovery: money(1_000n, "PHP"),
      }),
    ).toEqual({ kind: "not_possible", reason: "fee_at_or_above_100_percent" });
  });
});

describe("calculateHypotheticalExit", () => {
  test("labels a fee-adjusted exit result as hypothetical", () => {
    expect(
      calculateHypotheticalExit({
        recordedCashCosts: money(10_000n, "PHP"),
        previouslyRecoveredCash: money(2_500n, "PHP"),
        expectedSalePrice: money(12_000n, "PHP"),
        saleFeeBasisPoints: 1_000n,
        fixedFees: money(500n, "PHP"),
      }),
    ).toEqual({
      kind: "applicable",
      value: {
        label: "hypothetical",
        netSaleProceeds: money(10_300n, "PHP"),
        hypotheticalExitProfit: money(2_800n, "PHP"),
      },
    });
  });
});
