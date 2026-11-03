/** Settings model, time formatter only (RDY-552). RDY-546 brings the rest of the file from the source (design prototypes/sms/settingsModel.ts). */
/** "07:30" -> "7:30 am". */
export function fmt12(hm: string): string {
  const h = Number(hm.slice(0, 2)); const m = hm.slice(3, 5);
  return `${h % 12 || 12}:${m} ${h < 12 ? 'am' : 'pm'}`;
}
