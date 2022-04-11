import { DailyParticipant } from '@daily-co/daily-js';

export const getSample = (arr: DailyParticipant[], len: number) => {
  let chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};
