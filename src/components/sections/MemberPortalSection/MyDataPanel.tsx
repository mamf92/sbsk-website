import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Panel } from '../../ui/Panel';
import {
  eraseMyAccount,
  exportFileName,
  exportMyData,
  hasFreshSignIn,
  removeMyPhotos,
} from '../../../supabase/queryHelpers/gdpr';
import { sendSignInCode, verifySignInCode } from '../../../supabase/queryHelpers/memberAuth';
import { supabase } from '../../../supabase/client';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import { downloadJson } from '../../../utils/downloadJson';
import { CODE_INVALID, norwegianErrorMessage } from '../../../utils/errorMessage';

/** The calls this panel makes; the real ones unless a test passes its own. */
export type MyDataActions = {
  exportData: () => Promise<unknown>;
  download: (data: unknown, fileName: string) => void;
  freshSignIn: () => Promise<boolean>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  removePhotos: (userId: string) => Promise<void>;
  erase: (confirm: string) => Promise<void>;
  signOutHere: () => Promise<void>;
};

const realActions: MyDataActions = {
  exportData: exportMyData,
  download: downloadJson,
  freshSignIn: hasFreshSignIn,
  sendCode: sendSignInCode,
  verifyCode: verifySignInCode,
  removePhotos: removeMyPhotos,
  erase: eraseMyAccount,
  signOutHere: async () => {
    // The login no longer exists; this only clears the session stored in this browser.
    await supabase.auth.signOut({ scope: 'local' });
  },
};

function errorText(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : '';
}

/**
 * "Dine data" on `/medlemsportal/innstillinger` (docs/plans/gdpr.md steps 2–3): download a copy
 * of everything the club holds, and delete the account for good.
 */
export default function MyDataPanel({
  profile,
  actions = realActions,
}: {
  profile: Profile;
  actions?: MyDataActions;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      actions.download(await actions.exportData(), exportFileName());
    } catch (err) {
      setDownloadError(
        errorText(err).includes('rate_limited')
          ? 'Du lastet ned dataene dine for litt siden. Vent ti minutter og prøv igjen.'
          : norwegianErrorMessage(err, 'Vi fikk ikke laget filen. Prøv igjen.'),
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Panel title="Dine data" className="md:col-span-2">
      <p>
        Last ned en fil med alt klubben har lagret om deg: medlemskap, profil, påmeldinger,
        innsjekk, merker og betalinger.
      </p>
      {downloadError && <Alert>{downloadError}</Alert>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={downloading}
          onClick={() => void download()}
        >
          Last ned mine data
        </Button>
        <Button type="button" variant="danger" size="md" onClick={() => setDeleting(true)}>
          Slett kontoen min
        </Button>
      </div>
      {deleting && (
        <DeleteAccountDialog
          profile={profile}
          actions={actions}
          onClose={() => setDeleting(false)}
        />
      )}
    </Panel>
  );
}

type Step = 'confirm' | 'code';

function DeleteAccountDialog({
  profile,
  actions,
  onClose,
}: {
  profile: Profile;
  actions: MyDataActions;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const wordId = useId();
  const codeId = useId();
  const [step, setStep] = useState<Step>('confirm');
  const [word, setWord] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = word.trim().toUpperCase() === 'SLETT';

  const erase = async () => {
    await actions.removePhotos(profile.supabase_id);
    await actions.erase('SLETT');
    await actions.signOutHere().catch(() => undefined);
    navigate('/konto-slettet', { replace: true });
  };

  const fail = (err: unknown) => {
    const text = errorText(err);
    if (text.includes('last_admin')) {
      setError(
        'Du er den siste aktive administratoren. Gjør en annen i styret til administrator først.',
      );
    } else if (text.includes('reauth_required')) {
      setError('Innloggingen er for gammel. Be om en ny kode og prøv igjen.');
      setStep('code');
    } else {
      setError(norwegianErrorMessage(err, 'Vi fikk ikke slettet kontoen. Prøv igjen.'));
    }
  };

  const confirm = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      if (await actions.freshSignIn()) {
        await erase();
        return;
      }
      // Proof that the person holding this phone is the member: a new code by email.
      await actions.sendCode(profile.email);
      setStep('code');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await actions.verifyCode(profile.email, code);
    } catch (err) {
      setError(norwegianErrorMessage(err, CODE_INVALID));
      setBusy(false);
      return;
    }
    try {
      await erase();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await actions.sendCode(profile.email);
    } catch (err) {
      setError(norwegianErrorMessage(err, 'Vi fikk ikke sendt koden. Prøv igjen.'));
    }
  };

  const cancel = (
    <Button
      type="button"
      variant="tertiary"
      size="md"
      className="border border-white/50"
      onClick={onClose}
    >
      Avbryt
    </Button>
  );

  return (
    <Dialog title="Slette kontoen din?" onClose={onClose}>
      {step === 'confirm' ? (
        <form className="flex flex-col gap-4" onSubmit={(e) => void confirm(e)}>
          <p>
            Vi sletter profilen, bildet, påmeldingene, innsjekkene og merkene dine, og du står ikke
            lenger i medlemslisten. Medlemskapet ditt slutter, og innbetalt kontingent refunderes
            ikke.
          </p>
          <p>
            Betalinger beholder vi i fem år fordi bokføringsloven krever det, men uten kobling til
            deg. Vil du ha en kopi først, last ned dataene dine før du sletter.
          </p>
          <div className="flex flex-col gap-1">
            <label htmlFor={wordId}>Skriv SLETT for å bekrefte</label>
            <Input
              id={wordId}
              name="confirm"
              autoComplete="off"
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {cancel}
            <Button
              type="submit"
              variant={confirmed ? 'danger' : 'disabled'}
              size="md"
              loading={busy}
            >
              Slett kontoen min
            </Button>
          </div>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => void verify(e)}>
          <p>
            For å være sikre på at det er du, har vi sendt en kode til {profile.email}. Skriv den
            inn for å slette kontoen.
          </p>
          <div className="flex flex-col gap-1">
            <label htmlFor={codeId}>Kode fra e-posten</label>
            <Input
              id={codeId}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {error && <Alert>{error}</Alert>}
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            className="self-start"
            onClick={() => void resend()}
          >
            Send ny kode
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {cancel}
            <Button
              type="submit"
              variant={code.trim() ? 'danger' : 'disabled'}
              size="md"
              loading={busy}
            >
              Slett kontoen min
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
