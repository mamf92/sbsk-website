import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface BoardMemberTypes {
  _id: string;
  name: string;
  role?: string;
  bio?: string;
  image?: SanityImageSource;
  order?: number;
}

const BOARD_MEMBERS_QUERY = `*[
  _type == "boardMember"
] | order(order asc, name asc){
  _id,
  name,
  role,
  bio,
  image,
  order
}`;

export async function boardMembersLoader() {
  return { boardMembers: await client.fetch<BoardMemberTypes[]>(BOARD_MEMBERS_QUERY) };
}
