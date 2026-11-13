import type { Rule } from 'sanity';
import ExternalLink from '../../../assets/icons/symbols/external-link.svg?react';
import AddLink from '../../../assets/icons/symbols/add-link.svg?react';

// The rich-text configuration every event and festival text field shares: paragraphs, two
// heading levels, lists, bold/italic/underline, and external and internal links.
export const richTextBlocks = [
  {
    type: 'block',
    styles: [
      { title: 'Normal', value: 'normal' },
      { title: 'Heading 1', value: 'h2' },
      { title: 'Heading 2', value: 'h3' },
    ],
    lists: [
      { title: 'Bullet', value: 'bullet' },
      { title: 'Numbered', value: 'number' },
    ],
    marks: {
      decorators: [
        { title: 'Strong', value: 'strong' },
        { title: 'Underline', value: 'underline' },
        { title: 'Emphasis', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Ekstern lenke',
          icon: ExternalLink,
          description: 'Brukes for lenker til eksterne nettsider',
          fields: [
            {
              name: 'url',
              type: 'url',
              validation: (rule: Rule) => rule.uri({ scheme: ['http', 'https'] }),
            },
          ],
        },
        {
          name: 'internalLink',
          type: 'object',
          title: 'Intern lenke',
          icon: AddLink,
          description: 'Brukes for lenker til andre sider på nettstedet',
          fields: [
            {
              name: 'url',
              type: 'url',
              validation: (rule: Rule) =>
                rule.uri({ scheme: ['http', 'https'], allowRelative: true }),
            },
          ],
        },
      ],
    },
  },
];
