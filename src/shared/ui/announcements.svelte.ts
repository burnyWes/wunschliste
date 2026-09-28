import { announcementText } from './announcement';

const announcement = $state({ text: '', repetition: 0 });

export function announce(text: string): void {
  announcement.text = text;
  announcement.repetition += 1;
}

export function spokenText(): string {
  return announcementText(announcement.text, announcement.repetition);
}
