export type LegalContent = {
  title: string;
  version: string;
  status: string;
  updated: string;
  intro: string;
  sections: { heading: string; body?: string[]; bullets?: string[] }[];
};

export function LegalDocument({ content }: { content: LegalContent }) {
  return (
    <article className="card mx-auto max-w-3xl space-y-6 p-8">
      {content.status === 'draft' ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Draft: not yet reviewed by a lawyer. Replace every [PLACEHOLDER], get it reviewed, then set
          &quot;status&quot; to &quot;final&quot; in the content file to remove this notice.
        </p>
      ) : null}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{content.title}</h1>
        <p className="text-sm text-slate-500">
          Version {content.version} · Last updated {content.updated}
        </p>
        <p className="text-slate-600">{content.intro}</p>
      </header>
      {content.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
          {section.body?.map((paragraph) => (
            <p key={paragraph} className="leading-7 text-slate-700">{paragraph}</p>
          ))}
          {section.bullets ? (
            <ul className="list-disc space-y-2 pl-6 text-slate-700">
              {section.bullets.map((item) => <li key={item} className="leading-7">{item}</li>)}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
