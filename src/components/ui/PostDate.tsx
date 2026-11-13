import Clock from '../../assets/icons/symbols/clock.svg?react';
import { TIME_ZONE } from '../../utils/eventDateFormat';

/** «fredag 29. jan. 18:00» with a clock icon: when a post was published, in Oslo time. */
export function PostDate({ publishedAt }: { publishedAt: Date }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Clock className="h-4 w-4 fill-current" aria-hidden="true" />
      <span className="capitalize">
        {publishedAt.toLocaleString('no-NO', { weekday: 'long', timeZone: TIME_ZONE })}
      </span>
      <span>
        {publishedAt.toLocaleString('no-NO', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: TIME_ZONE,
        })}
      </span>
    </span>
  );
}
