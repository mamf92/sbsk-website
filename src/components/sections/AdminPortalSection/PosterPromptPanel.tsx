import * as React from 'react';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Input } from '../../ui/Input';
import { Panel } from '../../ui/Panel';
import { POSTER_PROMPT_MAX_LENGTH, buildPosterPrompt } from '../../../utils/posterPrompt';

type Status = 'idle' | 'copied' | 'empty' | 'failed';

/**
 * One line in, the club's whole image prompt out, on the clipboard. The board pastes it into
 * their own AI tool, so this never calls a paid API and holds no key.
 */
export default function PosterPromptPanel() {
  const inputId = React.useId();
  const [subject, setSubject] = React.useState('');
  const [status, setStatus] = React.useState<Status>('idle');

  async function copy(event: React.FormEvent) {
    event.preventDefault();
    const prompt = buildPosterPrompt(subject);
    if (!prompt) {
      setStatus('empty');
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('copied');
    } catch {
      // Insecure origin or a blocked clipboard: say so rather than pretending it worked.
      setStatus('failed');
    }
  }

  return (
    <Panel title="Plakat-prompt">
      <p>
        Skriv hva plakaten gjelder. Vi legger på klubbens bildestil, så limer du inn i ditt eget
        AI-verktøy.
      </p>
      <form className="flex flex-col gap-3" onSubmit={copy} noValidate>
        <label htmlFor={inputId}>Hva gjelder plakaten?</label>
        <Input
          id={inputId}
          value={subject}
          maxLength={POSTER_PROMPT_MAX_LENGTH}
          placeholder="For eksempel: Julespillkveld med pepperkaker"
          invalid={status === 'empty'}
          aria-describedby={status === 'empty' ? `${inputId}-status` : undefined}
          onChange={(event) => {
            setSubject(event.target.value);
            setStatus('idle');
          }}
        />
        <Button type="submit" variant="primary" size="md" className="w-fit">
          Kopier prompt
        </Button>
        {status === 'copied' && (
          <Alert tone="success" id={`${inputId}-status`}>
            Prompten er kopiert. Lim den inn i AI-verktøyet ditt.
          </Alert>
        )}
        {status === 'empty' && (
          <Alert tone="warning" id={`${inputId}-status`}>
            Skriv først hva plakaten gjelder.
          </Alert>
        )}
        {status === 'failed' && (
          <Alert id={`${inputId}-status`}>Kunne ikke kopiere. Prøv igjen.</Alert>
        )}
      </form>
    </Panel>
  );
}
