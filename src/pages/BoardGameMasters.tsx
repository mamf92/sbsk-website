import { useLoaderData } from 'react-router-dom';
import FestivalPage from '../components/sections/FestivalPage/FestivalPage';
import { PagePlaceholder } from '../components/ui/PagePlaceholder';
import type { FestivalTypes } from '../sanity/queryHelpers/festivals';

/**
 * The current Board Game Masters edition, or the placeholder until one is published in the
 * Studio. Never a 404: the footer and old posts link here. FestivalPage is imported statically:
 * this route is already its own lazy chunk, and a second lazy step would add a round trip.
 */
export default function BoardGameMasters() {
  const { festival } = useLoaderData() as { festival: FestivalTypes | null };
  if (festival) return <FestivalPage festival={festival} />;
  return (
    <PagePlaceholder
      title="Board Game Masters"
      description="Board Game Masters er turneringsserien vår, og siden om den er under arbeid. Kommende runder ligger allerede i kalenderen."
    />
  );
}
