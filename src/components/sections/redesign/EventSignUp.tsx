import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { RsvpButton } from '../../ui/RsvpButton';
import { AvatarStack } from '../../ui/AvatarStack';
import { toAvatarPeople, type useRsvp } from '../../../hooks/useRsvp';

/**
 * A member's sign-up on the new pages: the toggle, who is coming, and the error if a toggle
 * failed. `lg` is the hero's; `md` sits on a poster, full width like «Les mer», and leaves the
 * head count to the card's facts strip; `xs` fits a date token.
 */
export function EventSignUp({
  event,
  rsvp,
  size,
}: {
  event: CalendarEventTypes;
  rsvp: ReturnType<typeof useRsvp>;
  size: 'xs' | 'md' | 'lg';
}) {
  const attending = rsvp.isAttending(event._id);
  const attendees = rsvp.attendeesOf(event._id);
  const hidden = attendees.filter((a) => a.hidden).length;
  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${size === 'lg' ? '' : 'flex-col'} ${
        size === 'xs' ? 'gap-1.5' : ''
      } ${size === 'md' ? 'items-stretch' : ''}`}
    >
      <RsvpButton
        attending={attending}
        joinLabel="Bli med"
        attendingLabel="Påmeldt!"
        leaveLabel="Meld av"
        ariaLabel={attending ? `Meld av ${event.title}` : `Meld på ${event.title}`}
        size={size}
        className={size === 'md' ? 'w-full' : undefined}
        disabled={rsvp.pending[event._id]}
        onClick={() => rsvp.toggle(event._id)}
      />
      {attendees.length > 0 && size === 'lg' && (
        <span className="font-body flex items-center gap-2 text-sm">
          <AvatarStack people={toAvatarPeople(attendees)} hiddenCount={hidden} max={5} size="xs" />
          {attendees.length} kommer
        </span>
      )}
      {attendees.length > 0 && size === 'xs' && (
        <span className="font-body text-xs font-bold">{attendees.length} kommer</span>
      )}
      {rsvp.errors[event._id] && (
        <p role="alert" className="font-body w-full text-sm">
          {rsvp.errors[event._id]}
        </p>
      )}
    </div>
  );
}
