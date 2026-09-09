import { expect, test } from "@playwright/test";

test("rutas secundarias y menú móvil", async ({ page }) => {
  for (const route of ["perfil", "citas", "resumen"]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { name: "Identificación del Paciente" })).toBeVisible();
  }
  await page.goto("/profesionales");
  await expect(page.getByRole("heading", { name: "Nuestros profesionales" })).toBeVisible();
  await expect(page.locator(".doctor-card")).toHaveCount(6);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("button", { name: "Contacto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Información de atención" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/mobile-contact.png", fullPage: true });
});
