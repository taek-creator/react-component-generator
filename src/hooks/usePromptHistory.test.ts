import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePromptHistory } from './usePromptHistory';
import { STORAGE_KEYS, loadFromStorage } from '../utils/storage';

describe('usePromptHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 history는 빈 배열이다', () => {
    const { result } = renderHook(() => usePromptHistory());
    expect(result.current.history).toEqual([]);
  });

  it('addPrompt를 호출하면 history 맨 앞에 추가된다', () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.addPrompt('첫 번째 프롬프트');
    });

    expect(result.current.history).toEqual(['첫 번째 프롬프트']);
  });

  it('이미 있는 프롬프트를 다시 추가하면 중복 없이 맨 앞으로 이동한다', () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.addPrompt('A');
      result.current.addPrompt('B');
      result.current.addPrompt('A');
    });

    expect(result.current.history).toEqual(['A', 'B']);
  });

  it('history는 localStorage에 저장되어 다음 마운트에서 복원된다', () => {
    const { result, unmount } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.addPrompt('저장된 프롬프트');
    });
    unmount();

    expect(loadFromStorage(STORAGE_KEYS.promptHistory, [])).toEqual(['저장된 프롬프트']);

    const { result: result2 } = renderHook(() => usePromptHistory());
    expect(result2.current.history).toEqual(['저장된 프롬프트']);
  });

  it('최대 20개까지만 유지한다', () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addPrompt(`prompt-${i}`);
      }
    });

    expect(result.current.history).toHaveLength(20);
    expect(result.current.history[0]).toBe('prompt-24');
  });
});
