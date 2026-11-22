import { useEffect } from 'react';
import type { LegalDocument, Localised } from '../../content/legal';

/**
 * One legal text (privacy policy or terms) as a single reading column. Norwegian only until
 * the `en` text exists; the page then stays `lang="nb"` whatever the toggle says.
 */
export default function LegalDocumentSection({
  document: doc,
}: {
  document: Localised<LegalDocument>;
}) {
  const text = doc.nb;

  useEffect(() => {
    window.document.title = `${text.title} – Stavanger Brettspillklubb`;
    return () => {
      window.document.title = 'Stavanger Brettspillklubb';
    };
  }, [text.title]);

  return (
    <div className="flex w-full justify-center px-2 py-8 sm:px-0">
      <article
        lang="nb"
        className="max-w-content bg-darkblue surface-dark flex w-full flex-col gap-6 p-4 text-white sm:p-8"
      >
        <header className="flex flex-col gap-2">
          <h1 className="font-heading text-h1 font-bold">{text.title}</h1>
          <p className="font-body text-sm">Versjon {text.version}</p>
          <p className="font-body font-bold">{text.intro}</p>
        </header>
        {text.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="font-heading text-h3 font-bold">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="font-body">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="font-body flex list-disc flex-col gap-1 pl-5">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </div>
  );
}
