import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "team-recognition:v1";
const entries = (page: Page) => page.getByTestId("recognition-item");

async function recognize(page: Page, message: string) {
  await page.getByRole("button", { name: /Maya Chen Frontend engineer/ }).click();
  await page.getByRole("button", { name: /Team Player Better, together/ }).click();
  await page.getByRole("textbox", { name: /Put it into words/ }).fill(message);
  await page.getByRole("button", { name: "Send recognition" }).click();
  await expect(page.getByText("Recognition sent to Maya Chen.")).toBeVisible();
}

test("recognition is newest first, literal, persistent, and resettable", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.goto("/");
  await expect(entries(page)).toHaveCount(4);
  const message = '<img src=x onerror="alert(1)"> Thank you for the thoughtful review.';
  await recognize(page, `  ${message}  `);
  await expect(entries(page)).toHaveCount(5);
  await expect(entries(page).first()).toContainText(message);
  await expect(entries(page).first().locator(".recognition-message img")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /Put it into words/ })).toHaveValue("");
  await page.reload();
  await expect(entries(page)).toHaveCount(5);
  await expect(entries(page).first()).toContainText(message);
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(entries(page)).toHaveCount(5);
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(entries(page)).toHaveCount(4);
  await page.reload();
  await expect(entries(page)).toHaveCount(4);
  expect(failures).toEqual([]);
});

test("validation, teammate search, empty state, and keyboard submission", async ({ page }) => {
  await page.goto("/");
  await expect(entries(page)).toHaveCount(4);
  await page.getByRole("button", { name: "Send recognition" }).click();
  await expect(page.getByText("Choose a teammate.", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose a recognition badge.")).toBeVisible();
  await expect(page.getByText("Add a thank-you message.")).toBeVisible();
  const search = page.getByRole("textbox", { name: "Search teammates" });
  await expect(search).toBeFocused();
  await search.fill("Alex Morgan");
  await expect(page.getByText("No teammates found.")).toBeVisible();
  await search.fill("frontend");
  const recipient = page.getByRole("button", { name: /Maya Chen Frontend engineer/ });
  await expect(recipient).toBeVisible();
  await recipient.focus();
  await page.keyboard.press("Enter");
  const badge = page.getByRole("button", { name: /Bright Idea A fresh perspective/ });
  await badge.focus();
  await page.keyboard.press("Space");
  const message = page.getByRole("textbox", { name: /Put it into words/ });
  await message.fill(" \n ");
  await page.getByRole("button", { name: "Send recognition" }).click();
  await expect(page.getByText("Add a thank-you message.")).toBeVisible();
  await message.fill("Thank you for making collaboration easier.");
  await page.getByRole("button", { name: "Send recognition" }).focus();
  await page.keyboard.press("Enter");
  await expect(entries(page)).toHaveCount(5);
  await page.getByRole("button", { name: "Received", exact: true }).click();
  await expect(page.getByText("No recognition here yet")).toBeVisible();
  await page.getByRole("button", { name: "Sent", exact: true }).click();
  await expect(entries(page)).toHaveCount(2);
});

test("malformed saved data restores the sample feed", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{not valid json"), STORAGE_KEY);
  await page.goto("/");
  await expect(entries(page)).toHaveCount(4);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).length, STORAGE_KEY)).toBe(4);
});

test("empty saved feed stays empty", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "[]"), STORAGE_KEY);
  await page.goto("/");
  await expect(page.getByText("No recognition here yet")).toBeVisible();
  await recognize(page, "The first thank you.");
  await expect(entries(page)).toHaveCount(1);
});

test("blocked storage still permits in-memory recognition", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } }));
  await page.goto("/");
  await expect(entries(page)).toHaveCount(4);
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
  await recognize(page, "Thank you, even without persistence.");
  await expect(entries(page)).toHaveCount(5);
  await page.reload();
  await expect(entries(page)).toHaveCount(4);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`layout and avatars render at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(entries(page)).toHaveCount(4);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const clipped = await page.locator("button, h1, h2, .summary-item strong").evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth + 2).map((element) => element.textContent));
    expect(clipped).toEqual([]);
    const form = await page.locator(".composer").boundingBox();
    const feed = await page.locator(".feed-section").boundingBox();
    expect(form).not.toBeNull();
    expect(feed).not.toBeNull();
    if (viewport.width > 800) expect(feed!.x + feed!.width).toBeLessThan(form!.x);
    else expect(form!.y + form!.height).toBeLessThan(feed!.y);
    await page.screenshot({ path: testInfo.outputPath(`goodwork-${viewport.width}.png`), fullPage: true, animations: "disabled" });
    await recognize(page, "a".repeat(500));
    await expect(entries(page).first()).toContainText("a".repeat(500));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}