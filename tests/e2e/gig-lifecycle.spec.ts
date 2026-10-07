import { expect, test } from '@playwright/test';
import { login, logout, seeded } from './helpers';

test('client posts a gig, worker applies, client accepts, worker sees it accepted', async ({ page }) => {
  const title = `E2E gig ${Date.now()}`;

  // Client posts a gig.
  await login(page, seeded.client);
  await page.goto('/client/post-gig');
  await page.getByLabel('Gig title').fill(title);
  await page.getByLabel('Public location area').fill('Observatory, Cape Town');
  await page.getByLabel('Private address').fill('12 Secret Lane');
  await page.getByLabel('Date').fill('2026-12-01');
  await page.getByLabel('Start time').fill('09:00');
  await page.getByLabel('End time').fill('13:00');
  await page.getByLabel('Pay amount (ZAR)').fill('350');
  await page.getByLabel('Description').fill('Help pack boxes for a market stall.');
  await page.getByLabel('Requirements').fill('Comfortable shoes.');
  await page.getByRole('button', { name: 'Post gig' }).click();

  await expect(page).toHaveURL(/\/client\/gigs\/.+\/applications/);
  const gigId = page.url().match(/\/client\/gigs\/([^/]+)\/applications/)![1];
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  // Worker applies. The private address must not be visible before acceptance.
  await logout(page);
  await login(page, seeded.worker);
  await page.goto(`/gigs/${gigId}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('12 Secret Lane')).toHaveCount(0);
  await page.getByRole('button', { name: 'Apply for this Gig' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Why are you a good fit for this gig?').fill('I live nearby and have event experience.');
  await dialog.getByRole('button', { name: 'Submit Application' }).click();
  await expect(page).toHaveURL(/\/worker\/applications/);
  await expect(page.getByText(title)).toBeVisible();

  // Client accepts.
  await logout(page);
  await login(page, seeded.client);
  await page.goto(`/client/gigs/${gigId}/applications`);
  await expect(page.getByText('Anele Mpofu')).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByText('accepted', { exact: false }).first()).toBeVisible();

  // Worker sees the status.
  await logout(page);
  await login(page, seeded.worker);
  await page.goto('/worker/applications');
  const card = page.locator('article', { hasText: title });
  await expect(card.getByText(/accepted/i)).toBeVisible();
});

test('a worker cannot apply to the same gig twice', async ({ page }) => {
  await login(page, seeded.worker);
  await page.goto('/gigs/gig_1');
  await page.getByRole('button', { name: 'Apply for this Gig' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Why are you a good fit for this gig?').fill('First application.');
  await dialog.getByRole('button', { name: 'Submit Application' }).click();
  await expect(page).toHaveURL(/\/worker\/applications/);

  await page.goto('/gigs/gig_1');
  await expect(page.getByText('You applied to this gig')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply for this Gig' })).toHaveCount(0);
});
