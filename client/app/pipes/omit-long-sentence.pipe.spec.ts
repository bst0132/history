import { OmitLongSentencePipe } from './omit-long-sentence.pipe';

describe('OmitLongSentencePipe', () => {
  it('create an instance', () => {
    const pipe = new OmitLongSentencePipe();
    expect(pipe).toBeTruthy();
  });
});
