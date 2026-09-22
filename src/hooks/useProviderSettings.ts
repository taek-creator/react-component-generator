import { useCallback, useEffect, useState } from 'react';
import type { Provider } from '../types';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';

type ApiKeys = Record<Provider, string>;

const DEFAULT_PROVIDER: Provider = 'google';
const DEFAULT_API_KEYS: ApiKeys = { anthropic: '', google: '' };

function isProvider(value: unknown): value is Provider {
  return value === 'anthropic' || value === 'google';
}

export function useProviderSettings() {
  const [provider, setProvider] = useState<Provider>(() => {
    const stored = loadFromStorage<unknown>(STORAGE_KEYS.provider, null);
    return isProvider(stored) ? stored : DEFAULT_PROVIDER;
  });
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() =>
    loadFromStorage(STORAGE_KEYS.apiKeys, DEFAULT_API_KEYS)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.provider, provider);
  }, [provider]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.apiKeys, apiKeys);
  }, [apiKeys]);

  const setApiKey = useCallback(
    (value: string) => {
      setApiKeys((prev) => ({ ...prev, [provider]: value }));
    },
    [provider]
  );

  return { provider, setProvider, apiKey: apiKeys[provider], setApiKey };
}
