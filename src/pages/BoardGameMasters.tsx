import { lazy } from 'react';
import { useLoaderData } from 'react-router-dom';
import { PagePlaceholder } from '../components/ui/PagePlaceholder';
import type { FestivalTypes } from '../sanity/queryHelpers/festivals';

const FestivalPage = lazy(() => import('../components/sections/FestivalPage/FestivalPage'));

/**
 * The current Board Game Masters edition, or the placeholder until one is published in the
 * Studio. Never a 404: the footer and old posts link here.
 */
export default function BoardGameMasters() {
  const { festival } = (useLoaderData() as { festival: FestivalTypes | null } | undefined) ?? {
    festival: null,
  };
  if (festival) return <FestivalPage festival={festival} />;
  return (
    <PagePlaceholder
      title="Board Game Masters"
      description="Board Game Masters er turneringsserien vår, og siden om den er under arbeid. Kommende runder ligger allerede i kalenderen."
    />
  );
}
