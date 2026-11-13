import 'i18next';
import type { resources } from './index';

// Typed keys: `t('signup.closed')` is checked against the Norwegian JSON, so a typo or
// a removed key fails `tsc` instead of rendering the raw key to a visitor.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'events';
    resources: (typeof resources)['nb'];
  }
}
