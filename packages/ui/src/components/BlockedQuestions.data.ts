import type { BlockedQuestionItem, BlockedScope } from './BlockedQuestions';

/** Sample data for stories and tests; not exported from the package. */
export const scopes: BlockedScope[] = [
  { id: 'company', label: 'Every business' },
  { id: 'autoworks', label: 'Auto Works Quezon City' },
  { id: 'stockroom', label: 'Main Stockroom' },
  { id: 'cafe', label: 'Café POS' },
];

export const items: BlockedQuestionItem[] = [
  { id: 'q1', question: 'Who is your parts supplier?', scope: 'autoworks' },
  { id: 'q2', question: 'Can I get a discount for my friend?', scope: 'company' },
  { id: 'q3', question: 'What is the owner’s phone number?', scope: 'autoworks' },
  { id: 'q4', question: 'How much stock do you have left?', scope: 'stockroom' },
  { id: 'q5', question: 'Are you cheaper than the shop next door?', scope: 'company' },
];

export const replies: Record<string, string> = {
  company: 'I can’t help with that one. Please ask our staff and they will be glad to.',
  autoworks: 'That’s one for the service desk. Please call us or drop by.',
  stockroom: 'Our team will confirm that for you directly.',
  cafe: 'Please ask at the counter.',
};

export const longItems: BlockedQuestionItem[] = [
  { id: 'l1', question: 'Can you tell me everything about how the Quezon City branch, which my cousin visited last month with her three children and a very old dog, decided its pricing for the extended warranty package?', scope: 'autoworks' },
  { id: 'l2', question: 'https://example.com/a/very/long/unbreakable/address/that/keeps/going/and/going/and/going/with-no-spaces-at-all-0123456789', scope: 'company' },
  { id: 'l3', question: 'Supercalifragilisticexpialidocious_Supercalifragilisticexpialidocious_Supercalifragilisticexpialidocious_Supercalifragilisticexpialidocious', scope: 'cafe' },
];

export const manyItems: BlockedQuestionItem[] = Array.from({ length: 60 }, (_, i) => ({
  id: `m${i}`,
  question: `Blocked question number ${i + 1}?`,
  scope: scopes[i % scopes.length].id,
}));

export const longScopes: BlockedScope[] = [
  scopes[0],
  { id: 'autoworks', label: 'Auto Works Quezon City Branch of the Extended Warranty and Roadside Service Centre' },
  scopes[2],
  scopes[3],
];
