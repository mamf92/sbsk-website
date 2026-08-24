import { aboutPageLoader } from '../sanity/queryHelpers/about-page';
import { boardMembersLoader } from '../sanity/queryHelpers/board-members';
import { settle } from './settle';

/** Same split as `ourGamesLoader`: a failed page doc must not cost the visitor the board list. */
export async function aboutUsLoader() {
  const [aboutPage, boardMembers] = await Promise.all([
    settle(aboutPageLoader().then((result) => result.aboutPage)),
    settle(boardMembersLoader().then((result) => result.boardMembers)),
  ]);

  return {
    aboutPage: aboutPage.data ?? null,
    boardMembers: boardMembers.data ?? [],
    boardFailed: boardMembers.failed,
  };
}
