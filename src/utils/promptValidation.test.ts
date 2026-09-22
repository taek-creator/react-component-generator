import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './promptValidation';

describe('validatePromptLength', () => {
  it('500자 이하 프롬프트는 유효하다 (null 반환)', () => {
    expect(validatePromptLength('a'.repeat(500))).toBeNull();
  });

  it('500자를 초과하면 에러 메시지를 반환한다', () => {
    const result = validatePromptLength('a'.repeat(501));
    expect(result).toBe(`프롬프트는 ${MAX_PROMPT_LENGTH}자를 넘을 수 없습니다. (현재 501자)`);
  });

  it('빈 문자열은 유효하다 (null 반환)', () => {
    expect(validatePromptLength('')).toBeNull();
  });
});
