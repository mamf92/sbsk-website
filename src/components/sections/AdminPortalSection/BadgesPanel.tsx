import { Panel } from '../../ui/Panel';

/**
 * A reserved slot for giving members badges by hand. Badges are phase 3 (docs/plans/
 * phase-3-members.md): until their table and rules exist there is nothing to assign, so this
 * says what is coming rather than offering a button that does nothing.
 */
export default function BadgesPanel() {
  return (
    <Panel title="Merker" tone="orange">
      <p>
        Her skal styret kunne dele ut merker til medlemmer, for eksempel turneringsvinner. Kommer
        sammen med medlemssidene i fase 3.
      </p>
    </Panel>
  );
}
