import { expect, test } from '@playwright/test';
import { login, seeded } from './helpers';

test('registration requires both consent checkboxes', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Test Worker');
  await page.getByLabel('Email address').fill(`e2e.${Date.now()}@example.com`);
  await page.getByLabel('Phone number').fill('0821234567');
  await page.getByLabel('Location').fill('Cape Town');
  await page.getByLabel('Password').fill('StrongPass123!');

  const submit = page.getByRole('button', { name: 'Create account' });
  await submit.click();
  // Native `required` on the checkboxes blocks submission.
  await expect(page).toHaveURL(/\/register/);

  for (const box of await page.getByRole('checkbox').all()) await box.check();
  await submit.click();
  await expect(page).toHaveURL(/\/worker\/dashboard/);
});

test.describe('role gates', () => {
  test('anonymous users are sent to login from protected pages', async ({ page }) => {
    await page.goto('/client/post-gig');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a worker cannot open client pages', async ({ page }) => {
    await login(page, seeded.worker);
    await page.goto('/client/post-gig');
    await expect(page).not.toHaveURL(/\/client\/post-gig/);
  });

  test('a client cannot open admin pages', async ({ page }) => {
    await login(page, seeded.client);
    await page.goto('/admin/users');
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test('an admin can open the admin dashboard', async ({ page }) => {
    await login(page, seeded.admin);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});

test('browse page lists seeded gigs and opens a gig detail', async ({ page }) => {
  await page.goto('/browse');
  await page.locator('article', { hasText: 'Event assistant for food stall' }).getByRole('link', { name: 'View gig' }).click();
  await expect(page).toHaveURL(/\/gigs\/gig_1/);
  await expect(page.getByRole('heading', { name: 'Event assistant for food stall' })).toBeVisible();
});
