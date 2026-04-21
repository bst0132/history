import { TimeNumberToStringPipe } from './time-number-to-string.pipe';

describe('TimeConcertPipe', () => {
  it('create an instance', () => {
    const pipe = new TimeNumberToStringPipe();
    expect(pipe).toBeTruthy();
  });
});
