import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from '../utils/storage';

const MAX_HISTORY = 20;

export function usePromptHistory() {
  const [history, setHistory] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.promptHistory, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.promptHistory, history);
  }, [history]);

  const addPrompt = useCallback((prompt: string) => {
    setHistory((prev) => [prompt, ...prev.filter((p) => p !== prompt)].slice(0, MAX_HISTORY));
  }, []);

  return { history, addPrompt };
}
