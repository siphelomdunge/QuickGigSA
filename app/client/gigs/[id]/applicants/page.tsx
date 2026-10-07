import { redirect } from 'next/navigation';

interface ApplicantsRedirectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantsRedirectPage({ params }: ApplicantsRedirectPageProps) {
  const { id } = await params;
  redirect(`/client/gigs/${id}/applications`);
}
