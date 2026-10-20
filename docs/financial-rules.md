# ForgeKeep Wallet Financial Rules

## Money representation

Authoritative money is `{ amountMinor: bigint, currency: ISO-4217 code }`. Currency exponent metadata controls input parsing, display, and exchange-rate conversion. Financial code never uses JavaScript `number` for authoritative arithmetic. Rounding is half-up only at the documented conversion/output boundary, with the original amount, currency, rate, and rate timestamp retained.

## Cash classifications

| Classification | Realized cash effect |
| --- | --- |
| `cash_payment` | Increases cash cost. |
| `cash_receipt` | Increases cash recovery. |
| `refund` / `reimbursement` | Reduces applicable cash cost or increases recovery according to the linked transaction. |
| `asset_disposal` | Actual confirmed proceeds; eligible for realized recovery. |
| `internal_transfer` | No portfolio-wide cash effect. |
| estimated valuation, listing, in-game resource | No realized cash effect. |

## Shared calculations

```text
Net Cash Flow = Total Cash Receipts - Total Cash Payments
Break-Even Gap = max(0, Total Spending - Cash Recovered)
Realized ROI = Realized Net Profit / Applicable Cost Basis × 100
Net Sale Proceeds = Expected Sale Price - Percentage Fees - Fixed Fees - Sale Costs
Hypothetical Exit Profit = Previously Recovered Cash + Net Sale Proceeds - Total Recorded Cash Costs
Required Gross Sale Price = Remaining Gap / (1 - fee percentage)
Estimated Months to Break Even = Remaining Gap / Projected Net Monthly Cash Recovery
```

ROI is `not_applicable` when the cost basis is zero or no valid realized return is available. Break-even time is `not_applicable` unless projected net monthly recovery is positive. A 100% or greater percentage fee yields `not_possible` unless the remaining gap is zero. Hypothetical sale results and scenarios always carry an explicit hypothetical label.

## Posting, reversals, and allocations

Only posted transactions participate in confirmed summaries. Drafts are excluded. A reversal is a new linked entry that exactly cancels the original financial effect. Corrections retain both the correction lineage and the replaced record. Allocations may distribute one cash transaction only when their signed minor-unit total equals the transaction amount; summaries must consume either the parent transaction or its allocations, never both.

## Reporting rules

Reports state their date range, reporting currency, exchange-rate source, and whether each result is realized or estimated. Dashboard, reports, exports, and calculators call the same financial-engine functions. Budget consumption counts posted `cash_payment` spending only; it never frames additional spending as a way to recover sunk costs.
