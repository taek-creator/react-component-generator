import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProviderSettings } from './useProviderSettings';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';

describe('useProviderSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 provider는 google, apiKey는 빈 문자열이다', () => {
    const { result } = renderHook(() => useProviderSettings());

    expect(result.current.provider).toBe('google');
    expect(result.current.apiKey).toBe('');
  });

  it('setApiKey는 현재 provider의 키만 갱신한다', () => {
    const { result } = renderHook(() => useProviderSettings());

    act(() => {
      result.current.setApiKey('google-key-123');
    });

    expect(result.current.apiKey).toBe('google-key-123');
  });

  it('provider를 전환해도 이전 provider의 키가 유지되고, 전환된 provider의 키가 보인다', () => {
    const { result } = renderHook(() => useProviderSettings());

    act(() => {
      result.current.setApiKey('google-key');
    });
    act(() => {
      result.current.setProvider('anthropic');
    });

    expect(result.current.apiKey).toBe('');

    act(() => {
      result.current.setApiKey('anthropic-key');
    });
    act(() => {
      result.current.setProvider('google');
    });

    expect(result.current.apiKey).toBe('google-key');
  });

  it('provider와 apiKey는 localStorage에 저장되어 다음 마운트에서 복원된다', () => {
    const { result, unmount } = renderHook(() => useProviderSettings());

    act(() => {
      result.current.setProvider('anthropic');
    });
    act(() => {
      result.current.setApiKey('sk-ant-abc');
    });
    unmount();

    expect(loadFromStorage(STORAGE_KEYS.provider, null)).toBe('anthropic');
    expect(loadFromStorage(STORAGE_KEYS.apiKeys, null)).toEqual({
      anthropic: 'sk-ant-abc',
      google: '',
    });

    const { result: result2 } = renderHook(() => useProviderSettings());
    expect(result2.current.provider).toBe('anthropic');
    expect(result2.current.apiKey).toBe('sk-ant-abc');
  });

  it('저장된 provider 값이 유효하지 않으면 기본값 google로 대체한다', () => {
    saveToStorage(STORAGE_KEYS.provider, 'not-a-real-provider');

    const { result } = renderHook(() => useProviderSettings());

    expect(result.current.provider).toBe('google');
  });
});
