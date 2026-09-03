import { expect, test } from "@playwright/test";

test("shows the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bienvenido a Clinica Belen" })).toBeVisible();
});
