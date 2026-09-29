import { expect, type Page } from '@playwright/test';

const OPTIONAL_REPETITION_MARKER = '​?';

function escapedForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function expectAnnouncement(page: Page, text: string): Promise<void> {
  const announcedText = new RegExp(`^${escapedForPattern(text)}${OPTIONAL_REPETITION_MARKER}$`);
  await expect(page.getByRole('status').filter({ hasText: announcedText })).toHaveCount(1);
}
