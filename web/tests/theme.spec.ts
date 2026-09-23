import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("three options render with correct ARIA roles", async ({ page }) => {
    await page.goto("/");
    const group = page.getByTestId("theme-toggle");
    await expect(group).toBeVisible();
    await expect(group).toHaveAttribute("role", "radiogroup");
    await expect(group).toHaveAttribute("aria-label", "Color theme");

    await expect(page.getByTestId("theme-system")).toHaveAttribute("role", "radio");
    await expect(page.getByTestId("theme-light")).toHaveAttribute("role", "radio");
    await expect(page.getByTestId("theme-dark")).toHaveAttribute("role", "radio");
  });

  test("dark mode persists across reloads (no FOUC)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("theme-dark").click();

    // Verify class applied immediately
    await expect(page.locator("html")).toHaveClass(/theme-dark/);
    await expect(page.getByTestId("theme-dark")).toHaveAttribute("aria-checked", "true");

    // Reload and verify class is set BEFORE React renders the toggle
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/theme-dark/);

    // Persisted localStorage
    const stored = await page.evaluate(() => localStorage.getItem("betty-theme"));
    expect(stored).toBe("dark");

    // Toggle reflects persisted state after hydration
    await expect(page.getByTestId("theme-dark")).toHaveAttribute("aria-checked", "true");
  });

  test("light mode persists across reloads", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveClass(/theme-light/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/theme-light/);
    const stored = await page.evaluate(() => localStorage.getItem("betty-theme"));
    expect(stored).toBe("light");
  });

  test("system mode clears any explicit override on reload", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("theme-dark").click();
    await expect(page.locator("html")).toHaveClass(/theme-dark/);

    await page.getByTestId("theme-system").click();
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/theme-dark/);
    await expect(html).not.toHaveClass(/theme-light/);

    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/theme-(light|dark)/);
    const stored = await page.evaluate(() => localStorage.getItem("betty-theme"));
    expect(stored).toBeNull();
  });

  test("arrow keys cycle through options", async ({ page }) => {
    await page.goto("/");
    const systemBtn = page.getByTestId("theme-system");
    await systemBtn.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("theme-light")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("theme-dark")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("theme-light")).toHaveAttribute("aria-checked", "true");
  });
});
