import { useState } from 'react';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { buttonClasses } from '../../ui/buttonClasses';
import { calendarFeedUrls } from '../../../utils/calendarFeed';
import { siteUrl } from '../../../utils/siteUrl';

/**
 * «Abonner på kalenderen»: the club calendar as a feed the visitor's own calendar app keeps up
 * to date. A dialog offers the three ways in: open it in the phone's or computer's calendar
 * (`webcal://`), add it to Google Calendar, or copy the address. The per-event «Legg i
 * kalenderen» stays a one-off download.
 */
export function SubscribeCalendar({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);
  const urls = calendarFeedUrls(siteUrl());

  async function copy() {
    try {
      await navigator.clipboard.writeText(urls.https);
      setCopied('yes');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <>
      <Button variant="primary" size={size} icon="calendar" onClick={() => setOpen(true)}>
        Abonner på kalenderen
      </Button>
      {open && (
        <Dialog
          title="Abonner på kalenderen"
          onClose={() => {
            setOpen(false);
            setCopied(null);
          }}
        >
          <p className="font-body">
            Få alle spillkvelder og arrangementer rett i kalenderen din. Den oppdaterer seg selv når
            vi legger inn noe nytt.
          </p>
          <div className="flex flex-col gap-3">
            <a href={urls.webcal} className={buttonClasses({ variant: 'primary', size: 'md' })}>
              Åpne i kalender-appen
            </a>
            <a
              href={urls.google}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: 'primary', size: 'md' })}
            >
              Legg til i Google Kalender
            </a>
            <Button variant="tertiary" size="md" className="border border-white" onClick={copy}>
              Kopier lenken
            </Button>
            <p role="status" className="font-body min-h-5 text-sm break-all text-white/90">
              {copied === 'yes'
                ? 'Lenken er kopiert. Lim den inn under «Legg til kalender fra URL».'
                : copied === 'failed'
                  ? urls.https
                  : ''}
            </p>
          </div>
          <Button variant="tertiary" size="md" onClick={() => setOpen(false)}>
            Lukk
          </Button>
        </Dialog>
      )}
    </>
  );
}
