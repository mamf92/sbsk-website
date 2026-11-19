import { Button } from './Buttons';
import type { ButtonVariant } from './buttonClasses';

type RsvpButtonProps = {
  attending: boolean;
  /** What the button says when the member is not signed up. */
  joinLabel: string;
  /** What it says once they are. */
  attendingLabel: string;
  /** What it offers to do while hovered or keyboard-focused in the attending state. */
  leaveLabel: string;
  /** Accessible name — describes the real action (join or leave), not the current state. */
  ariaLabel: string;
  joinVariant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
};

/**
 * The member's sign-up toggle. Signed up it reads "Påmeldt!", and under a real pointer or
 * keyboard focus it previews the action — "Meld av" — which a click then performs.
 *
 * Both labels share one grid cell, the idle one hidden with `invisible`, so the button is
 * always as wide as the widest label and the swap never shifts its neighbours. Hover is the
 * site's pointer-only variant, so on touch the label stays "Påmeldt!" and a tap cancels
 * straight away; the accessible name always says what the click will do.
 */
export function RsvpButton({
  attending,
  joinLabel,
  attendingLabel,
  leaveLabel,
  ariaLabel,
  joinVariant = 'primary',
  size = 'sm',
  disabled,
  onClick,
}: RsvpButtonProps) {
  return (
    <Button
      variant={attending ? 'toggle' : joinVariant}
      size={size}
      disabled={disabled}
      aria-label={ariaLabel}
      className="group"
      onClick={onClick}
    >
      {attending ? (
        <span className="inline-grid">
          <span
            data-rsvp-label="attending"
            className="col-start-1 row-start-1 group-hover:invisible group-focus-visible:invisible"
          >
            {attendingLabel}
          </span>
          <span
            data-rsvp-label="leave"
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 group-hover:visible group-focus-visible:visible"
          >
            {leaveLabel}
          </span>
        </span>
      ) : (
        joinLabel
      )}
    </Button>
  );
}
