import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Panel } from '../../ui/Panel';
import { QrCode } from '../../ui/QrCode';
import { Tag } from '../../ui/Tag';
import { linkClassesInherit } from '../../ui/Link';
import { rotateCardToken } from '../../../supabase/queryHelpers/membershipCard';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import { cardPayload, formatCardToken } from '../../../utils/membershipCard';
import { currentSeason } from '../../../utils/membership';
import { CLUB_EMAIL, CLUB_EMAIL_HREF } from '../../../utils/contact';
import { norwegianErrorMessage } from '../../../utils/errorMessage';

type MembershipCardSectionProps = {
  member: Member | null;
  /** This season paid; null when the status could not be read. */
  paid: boolean | null;
  /** For tests; the real RPC otherwise. */
  rotate?: () => Promise<string>;
};

/**
 * `/medlemsportal/medlemskort`: "have I paid?" and the QR code the board scans at the door.
 * Its own tab, so a member can bookmark it and open it in the queue.
 */
export default function MembershipCardSection({
  member,
  paid,
  rotate = rotateCardToken,
}: MembershipCardSectionProps) {
  const [token, setToken] = useState(member?.member_card_token ?? null);
  const [rotating, setRotating] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const season = currentSeason();

  if (!member || !token) {
    return (
      <Alert tone="warning">
        Vi fikk ikke hentet medlemskortet ditt akkurat nå. Last siden på nytt om litt.
      </Alert>
    );
  }

  const fullName = `${member.name} ${member.surname}`.trim();

  const newCode = async () => {
    setRotating(true);
    setMessage(null);
    try {
      setToken(await rotate());
      setMessage({
        tone: 'success',
        text: 'Du har fått en ny kode. Den gamle virker ikke lenger.',
      });
    } catch (err: unknown) {
      setMessage({
        tone: 'error',
        text: norwegianErrorMessage(err, 'Vi fikk ikke laget en ny kode. Prøv igjen.'),
      });
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Medlemskort">
        <p className="font-heading text-h3 font-bold break-words">{fullName}</p>
        {paid === null ? (
          <p>Vi fikk ikke sjekket betalingen akkurat nå.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={paid ? 'success' : 'orange'}>
              {paid ? `Medlem ${season}: betalt` : `Medlem ${season}: ikke betalt`}
            </Tag>
          </div>
        )}
        {paid === false && (
          <p>
            Betal på en spillkveld, eller send oss en e-post på{' '}
            <a href={CLUB_EMAIL_HREF} className={`${linkClassesInherit} underline`}>
              {CLUB_EMAIL}
            </a>
            .{' '}
            <Link to="/bli-medlem" className={`${linkClassesInherit} underline`}>
              Les mer om medlemskap
            </Link>
            .
          </p>
        )}
      </Panel>
      <Panel title="Vis koden i døra">
        <QrCode
          value={cardPayload(token)}
          label={`QR-kode for medlemskortet til ${fullName}`}
          className="aspect-square w-full max-w-64 self-center"
        />
        <p className="text-center font-mono text-sm tracking-wide">{formatCardToken(token)}</p>
        <p className="text-sm">
          Skru opp lysstyrken på skjermen, så går skanningen raskere. Har du delt koden med noen?
          Lag en ny, så slutter den gamle å virke.
        </p>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Button
          type="button"
          variant="outline"
          size="md"
          loading={rotating}
          onClick={() => void newCode()}
          className="self-start"
        >
          Lag ny kode
        </Button>
      </Panel>
    </div>
  );
}
