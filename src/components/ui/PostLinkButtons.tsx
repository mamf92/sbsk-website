import { useNavigate } from 'react-router-dom';
import { Button } from './Buttons';
import { internalLinkPath } from '../../utils/internalLinks';
import type { ResolvedLink } from '../../utils/postLinks';

/** A post's editor-chosen links as buttons: ours through the router, others in this tab. */
export function PostLinkButtons({
  links,
  variant,
  size = 'sm',
}: {
  links: ResolvedLink[];
  variant: 'primary' | 'tertiary';
  size?: 'sm' | 'md';
}) {
  const navigate = useNavigate();
  return (
    <>
      {links.map((link, index) => (
        <Button
          key={index}
          variant={variant}
          size={size}
          icon="right"
          onClick={() => {
            if (link.internal) navigate(internalLinkPath(link.internal));
            else if (link.external) window.location.href = link.external;
          }}
        >
          {link.label}
        </Button>
      ))}
    </>
  );
}
