import { test, expect, type Page } from "@playwright/test";

const APOLOGY_PATTERNS = [
  /trouble accessing/i,
  /having a hiccup/i,
  /technical snag/i,
  /can'?t pull up/i,
  /i am so sorry/i,
  /having a little trouble/i,
];

async function sendQuery(page: Page, query: string) {
  const input = page.getByTestId("chat-input");
  await input.click();
  await input.fill(query);
  await page.getByTestId("send-button").click();
}

async function waitForAgentReply(page: Page, opts: { hasText: RegExp }) {
  // Agent bubble is the second message-with-text; wait until at least one
  // agent message contains the matching pattern and is no longer pending.
  const agentMessages = page.getByTestId("agent-message");
  // Give the agent room to think + run tools.
  await expect(async () => {
    const count = await agentMessages.count();
    expect(count).toBeGreaterThan(0);
    const last = agentMessages.last();
    const text = (await last.textContent()) ?? "";
    expect(text).toMatch(opts.hasText);
  }).toPass({ timeout: 60_000, intervals: [500, 1000, 2000] });
  return agentMessages.last();
}

async function lastAgentText(page: Page) {
  return (
    (await page.getByTestId("agent-message").last().textContent()) ?? ""
  );
}

function assertNoApology(text: string, context: string) {
  for (const pat of APOLOGY_PATTERNS) {
    expect(text, `${context}: response should not apologize (${pat})`).not.toMatch(pat);
  }
}

test.describe("Betty's Bird Brain — end-to-end", () => {
  test("empty state renders with mascot and suggestions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Betty.*Bird Brain/i }).first()).toBeVisible();
    const suggestions = page.getByTestId("suggestion");
    await expect(suggestions).toHaveCount(3);
  });

  test("database tool fires on product price query", async ({ page }) => {
    await page.goto("/");
    await sendQuery(page, "How much is a bird feeder?");

    // Tool chip for the database tool should appear at some point.
    const chip = page
      .locator('[data-testid="tool-chip"][data-tool-name="get-product-price"]')
      .first();
    await expect(chip).toBeVisible({ timeout: 45_000 });

    await waitForAgentReply(page, { hasText: /\$?25(\.00)?/ });
    const text = await lastAgentText(page);
    expect(text).toMatch(/\$?25(\.00)?/);
    assertNoApology(text, "price query");
  });

  test("datastore tool fires on store hours query", async ({ page }) => {
    await page.goto("/");
    await sendQuery(page, "What are your store hours?");

    const chip = page
      .locator('[data-testid="tool-chip"][data-tool-name="search_datastore"]')
      .first();
    await expect(chip).toBeVisible({ timeout: 45_000 });

    await waitForAgentReply(page, {
      hasText: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    });
    const text = await lastAgentText(page);
    expect(
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*\d/i.test(text) ||
        /\d{1,2}\s*(am|pm).*\d{1,2}\s*(am|pm)/i.test(text)
    ).toBeTruthy();
    assertNoApology(text, "store hours query");
  });

  test("web search tool fires on bird care query", async ({ page }) => {
    await page.goto("/");
    await sendQuery(page, "What do parakeets eat?");

    const chip = page
      .locator('[data-testid="tool-chip"]')
      .filter({ hasText: /web|search/i })
      .first();
    await expect(chip).toBeVisible({ timeout: 60_000 });

    await waitForAgentReply(page, {
      hasText: /(seed|pellet|fruit|vegetable|grain|millet)/i,
    });
    const text = await lastAgentText(page);
    expect(text.length).toBeGreaterThan(40);
    assertNoApology(text, "bird care query");
  });

  test("composer input is keyboard-accessible", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // skip link
    // Cycle a few tabs to ensure we reach an interactive element.
    for (let i = 0; i < 8; i++) {
      const active = await page.evaluate(() =>
        document.activeElement?.getAttribute("data-testid")
      );
      if (active === "chat-input" || active === "suggestion") break;
      await page.keyboard.press("Tab");
    }
    const active = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-testid")
    );
    expect(["chat-input", "suggestion"]).toContain(active);
  });
});
