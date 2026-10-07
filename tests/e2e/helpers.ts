import { expect, type Page } from '@playwright/test';

/** Demo-mode login: any password works; seeded emails get their seeded role. */
export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/(worker|client|admin)\/dashboard/);
}

export async function logout(page: Page) {
  await page.evaluate(() => window.localStorage.removeItem('quickgig-sa-demo-auth'));
  await page.goto('/');
}

export const seeded = {
  worker: 'anele@example.com',
  client: 'nandi@example.com',
  admin: 'sipho@example.com',
};
