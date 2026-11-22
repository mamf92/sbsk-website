import LegalDocumentSection from '../components/sections/LegalDocumentSection';
import { PRIVACY_POLICY } from '../content/legal';

export default function PrivacyPolicy() {
  return <LegalDocumentSection document={PRIVACY_POLICY} />;
}
