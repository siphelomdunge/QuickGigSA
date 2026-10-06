import { redirect } from 'next/navigation';

interface ApplicantsRedirectPageProps {
  params: { id: string };
}

export default function ApplicantsRedirectPage({ params }: ApplicantsRedirectPageProps) {
  redirect(`/client/gigs/${params.id}/applications`);
}
