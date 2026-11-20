import * as React from 'react';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Input } from '../../ui/Input';
import { Panel } from '../../ui/Panel';
import {
  POSTER_FIELD_MAX_LENGTH,
  buildPosterPrompt,
  type PosterFormat,
} from '../../../utils/posterPrompt';

type Status = 'idle' | 'copied' | 'empty' | 'failed';

/**
 * Event details in, the club's whole finished-poster prompt out, on the clipboard. The board
 * pastes it into their own AI tool, so this never calls a paid API and holds no key.
 */
export default function PosterPromptPanel() {
  const id = React.useId();
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [format, setFormat] = React.useState<PosterFormat>('portrait');
  const [status, setStatus] = React.useState<Status>('idle');

  async function copy(event: React.FormEvent) {
    event.preventDefault();
    const prompt = buildPosterPrompt({ title, date, time, place, format });
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

  function field(
    name: string,
    label: string,
    value: string,
    set: (value: string) => void,
    placeholder: string,
    invalid = false,
  ) {
    return (
      <>
        <label htmlFor={`${id}-${name}`}>{label}</label>
        <Input
          id={`${id}-${name}`}
          value={value}
          maxLength={POSTER_FIELD_MAX_LENGTH}
          placeholder={placeholder}
          invalid={invalid}
          aria-describedby={invalid ? `${id}-status` : undefined}
          onChange={(event) => {
            set(event.target.value);
            setStatus('idle');
          }}
        />
      </>
    );
  }

  return (
    <Panel title="Plakat-prompt">
      <p>
        Fyll inn det som skal stå på plakaten. Vi legger på klubbens bildestil, så limer du inn i
        ditt eget AI-verktøy og får en ferdig plakat med tekst.
      </p>
      <form className="flex flex-col gap-3" onSubmit={copy} noValidate>
        {field(
          'title',
          'Tittel',
          title,
          setTitle,
          'Juleavslutning med klubben',
          status === 'empty',
        )}
        {field('date', 'Dato', date, setDate, '13. desember')}
        {field('time', 'Klokkeslett', time, setTime, 'Kl. 18:00–23:00')}
        {field('place', 'Sted', place, setPlace, 'Klubbhuset')}
        <fieldset className="flex flex-wrap gap-4">
          <legend>Format</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${id}-format`}
              checked={format === 'portrait'}
              onChange={() => setFormat('portrait')}
            />
            Stående (A-format)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${id}-format`}
              checked={format === 'landscape'}
              onChange={() => setFormat('landscape')}
            />
            Liggende
          </label>
        </fieldset>
        <Button type="submit" variant="primary" size="md" className="w-fit">
          Kopier prompt
        </Button>
        {status === 'copied' && (
          <Alert tone="success" id={`${id}-status`}>
            Prompten er kopiert. Lim den inn i AI-verktøyet ditt.
          </Alert>
        )}
        {status === 'empty' && (
          <Alert tone="warning" id={`${id}-status`}>
            Skriv først en tittel.
          </Alert>
        )}
        {status === 'failed' && <Alert id={`${id}-status`}>Kunne ikke kopiere. Prøv igjen.</Alert>}
      </form>
    </Panel>
  );
}
