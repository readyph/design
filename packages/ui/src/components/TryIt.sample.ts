import type { TryItAbout, TryItAnswer, TryItQuestion } from './TryIt';

/** Sample data for the Try it stories and tests. Not exported from the package. */
export const sampleAbouts: TryItAbout[] = [
  { value: 'any', label: 'Any business' },
  { value: 'company', label: 'The company' },
  { value: 'auto', label: 'Auto Works' },
  { value: 'parts', label: 'Parts Stockroom' },
];

export const sampleQuestions: TryItQuestion[] = [
  { value: 'prices', label: 'How much is an oil change?', about: ['any', 'auto'] },
  { value: 'hours', label: 'What time do you open on Saturdays?', about: ['any', 'company', 'auto', 'parts'] },
  { value: 'stock', label: 'Do you have the brake pads for a 2016 Toyota Vios, front axle, ceramic, in stock right now?', about: ['any', 'parts'] },
  { value: 'pay', label: 'How much do you pay your mechanics?', about: ['any', 'company'] },
  { value: 'book', label: 'Can I book a service for tomorrow morning?', about: ['any', 'auto'] },
];

export interface SampleSwitches {
  prices: boolean;
  hours: boolean;
  stock: boolean;
  book: boolean;
}

export const defaultSwitches: SampleSwitches = { prices: true, hours: true, stock: false, book: true };

/** Answer from the switches as they are now (the real app reads its topics here). */
export function sampleAsk(about: string, question: string, sw: SampleSwitches = defaultSwitches): TryItAnswer {
  const from = about === 'parts' ? 'Parts Stockroom' : about === 'company' ? 'company' : 'Auto Works';
  switch (question) {
    case 'prices':
      return sw.prices
        ? { answer: 'An oil change starts at ₱1,800 for most cars, and we confirm the final price before we start.', reason: `Used the topic “Services and prices”, from ${from} data.`, tone: 'ok' }
        : { answer: 'I can’t help with that here. Please call Auto Works on 0917 555 0142.', reason: '“Services and prices” is off, so Leda can’t answer this.', tone: 'no' };
    case 'hours':
      return sw.hours
        ? { answer: 'We open at 8:00 AM on Saturdays and close at 5:00 PM.', reason: `Used the topic “Opening hours”, from ${from} data.`, tone: 'ok' }
        : { answer: 'I can’t help with that here.', reason: '“Opening hours” is off, so Leda can’t answer this.', tone: 'no' };
    case 'stock':
      return sw.stock
        ? { answer: 'Yes, we have ceramic front pads for the 2016 Vios in stock.', reason: 'Used the topic “Parts in stock”, from Parts Stockroom data.', tone: 'ok' }
        : { answer: 'I can’t help with that here. Please call Parts Stockroom.', reason: '“Parts in stock” is off, so Leda can’t answer this.', tone: 'no' };
    case 'pay':
      return { answer: 'I can’t share that.', reason: 'This is a blocked question for every business. Customers get one polite reply.', tone: 'no' };
    default:
      return sw.book
        ? { answer: 'I can ask the team to hold tomorrow morning for you. Staff confirm each booking.', reason: '“Take bookings” is on. The request goes to staff to accept.', tone: 'ok' }
        : { answer: 'I can’t take bookings here. Please call Auto Works.', reason: '“Take bookings” is off, so Leda doesn’t take this request.', tone: 'no' };
  }
}
