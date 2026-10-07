import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal-document';
import privacy from '@/content/privacy.json';

export const metadata: Metadata = { title: 'Privacy Policy | QuickGig SA' };

export default function PrivacyPage() {
  return <LegalDocument content={privacy} />;
}
