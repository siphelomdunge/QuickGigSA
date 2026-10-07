import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal-document';
import terms from '@/content/terms.json';

export const metadata: Metadata = { title: 'Terms of Use | QuickGig SA' };

export default function TermsPage() {
  return <LegalDocument content={terms} />;
}
