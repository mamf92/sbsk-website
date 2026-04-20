import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: '85tc4tb0',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});
