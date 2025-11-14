import { test, expect } from '@playwright/test';

test.describe('CropMate smoke', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/CropMate/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
  });

  test('hazards page loads public data', async ({ page }) => {
    await page.goto('/hazards');
    await expect(page.getByRole('heading', { name: /Skadedyr/i })).toBeVisible();
    await expect(page.getByText(/Viser/)).toBeVisible();
  });
});
