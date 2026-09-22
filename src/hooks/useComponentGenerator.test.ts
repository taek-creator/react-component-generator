import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';
import type { GeneratedComponent } from '../types';

describe('useComponentGenerator - 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 components는 빈 배열이다', () => {
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([]);
  });

  it('localStorage에 저장된 컴포넌트를 불러오고 createdAt을 Date로 복원한다', () => {
    saveToStorage(STORAGE_KEYS.components, [
      { id: '1', prompt: '카드', code: 'const A = () => null;', createdAt: '2024-01-01T00:00:00.000Z' },
    ]);

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
    expect(result.current.components[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('removeComponent로 제거하면 localStorage에도 반영된다', () => {
    saveToStorage(STORAGE_KEYS.components, [
      { id: '1', prompt: '카드', code: 'x', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', prompt: '버튼', code: 'y', createdAt: '2024-01-02T00:00:00.000Z' },
    ]);

    const { result } = renderHook(() => useComponentGenerator());

    act(() => {
      result.current.removeComponent('1');
    });

    const stored = loadFromStorage<GeneratedComponent[]>(STORAGE_KEYS.components, []);
    expect(stored.map((c) => c.id)).toEqual(['2']);
  });

  it('clearAll을 호출하면 localStorage도 빈 배열이 된다', () => {
    saveToStorage(STORAGE_KEYS.components, [
      { id: '1', prompt: '카드', code: 'x', createdAt: '2024-01-01T00:00:00.000Z' },
    ]);

    const { result } = renderHook(() => useComponentGenerator());

    act(() => {
      result.current.clearAll();
    });

    expect(loadFromStorage(STORAGE_KEYS.components, null)).toEqual([]);
  });
});
