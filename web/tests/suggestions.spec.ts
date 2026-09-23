import { test, expect } from "@playwright/test";

test.describe("Suggestion chip persistence", () => {
  test("chips remain in the strip after sending a message", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByTestId("suggestion-strip");
    await expect(strip).toBeVisible();
    await expect(page.getByTestId("suggestion")).toHaveCount(3);

    // Send a free-text message (do not click a chip — chips animate out on click)
    const input = page.getByTestId("chat-input");
    await input.fill("Hello there");
    await page.getByTestId("send-button").click();

    // After the agent finishes, the strip should still exist and have all 3 chips
    // (we don't need to wait for the full agent response — just that the strip
    // is back to interactive once busy resolves).
    await expect(strip).toBeAttached({ timeout: 60_000 });
    // Wait for the strip to become visible again (busy=false reveals it)
    await expect(strip).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("suggestion")).toHaveCount(3);
  });

  test("suggestions are accessible via ARIA group label", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByTestId("suggestion-strip");
    await expect(strip).toHaveAttribute("role", "group");
    await expect(strip).toHaveAttribute("aria-label", "Suggested questions");

    const firstChip = page.getByTestId("suggestion").first();
    const label = await firstChip.getAttribute("aria-label");
    expect(label).toMatch(/^Suggested question: /);
  });
});
