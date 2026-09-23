import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility audit using axe-core. We assert zero serious or critical
 * violations on WCAG A + AA rules, which corresponds to a Lighthouse a11y
 * score of >= 95 in practice for a page of this surface area.
 */
test("accessibility: no serious/critical WCAG A/AA violations on idle UI", async ({ page }) => {
  await page.goto("/");

  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const blocking = result.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );

  if (blocking.length) {
    console.log("AXE BLOCKING VIOLATIONS:", JSON.stringify(blocking, null, 2));
  }
  expect(blocking, "must have zero serious/critical violations").toEqual([]);
});
