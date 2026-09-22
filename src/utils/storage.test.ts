import { describe, it, expect, beforeEach } from 'vitest';
import { loadFromStorage, saveToStorage } from './storage';

describe('loadFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('키가 없으면 fallback 값을 반환한다', () => {
    expect(loadFromStorage('missing-key', 'fallback')).toBe('fallback');
  });

  it('저장된 값이 있으면 파싱해서 반환한다', () => {
    localStorage.setItem('my-key', JSON.stringify({ a: 1 }));
    expect(loadFromStorage('my-key', {})).toEqual({ a: 1 });
  });

  it('저장된 값이 손상된 JSON이면 fallback 값을 반환한다', () => {
    localStorage.setItem('broken-key', '{invalid json');
    expect(loadFromStorage('broken-key', 'fallback')).toBe('fallback');
  });
});

describe('saveToStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('값을 JSON으로 직렬화해 저장하고 loadFromStorage로 다시 읽을 수 있다', () => {
    saveToStorage('round-trip-key', { list: [1, 2, 3] });
    expect(loadFromStorage('round-trip-key', null)).toEqual({ list: [1, 2, 3] });
  });
});
