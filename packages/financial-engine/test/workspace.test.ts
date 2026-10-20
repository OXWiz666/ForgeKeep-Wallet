import * as financialEngine from "@forgekeep/financial-engine";
import { expect, test } from "vitest";

test("publishes a financial engine workspace package", () => {
  expect(financialEngine).toBeDefined();
});
