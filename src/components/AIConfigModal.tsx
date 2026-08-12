import React, { useState } from 'react';
import type { AIProvider } from '../types/quiz.ts';
import { testProviderHealth } from '../services/aiProvider.ts';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import type { AISettings } from '../services/storageService.ts';

export const AIConfigModal: React.FC = () => {
  const { aiSettings, showAIModal } = useQuizStore();
  const [formData, setFormData] = useState<AISettings>(aiSettings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!showAIModal) return null;

  const handleProviderChange = (provider: AIProvider | 'ollama' | 'offline') => {
    setFormData((prev) => ({ ...prev, activeProvider: provider }));
    setTestResult(null);
  };

  const handleTestHealth = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testProviderHealth(formData);
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    quizStore.updateAISettings(formData);
    quizStore.setShowAIModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-bold">AI Provider Engine Settings</h2>
          </div>
          <button
            onClick={() => quizStore.setShowAIModal(false)}
            className="p-1 rounded hover:bg-white/10 text-[var(--text-dim)]"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text-dim)] mb-2">
              Active Question Provider
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {(
                [
                  ['offline', 'Offline Static'],
                  ['groq', 'Groq Llama3'],
                  ['openai', 'GPT-4o mini'],
                  ['gemini', 'Gemini 1.5'],
                  ['ollama', 'Ollama Local'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => handleProviderChange(id)}
                  className={`p-2 rounded-lg text-xs font-medium text-center transition-all ${
                    formData.activeProvider === id
                      ? 'bg-emerald-500 text-black font-bold ring-2 ring-emerald-400'
                      : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider API Credentials */}
          {formData.activeProvider === 'groq' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-dim)] mb-1">
                Groq API Key (llama-3.3-70b-versatile)
              </label>
              <input
                type="password"
                value={formData.groqApiKey}
                onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                placeholder="gsk_..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {formData.activeProvider === 'openai' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-dim)] mb-1">
                OpenAI API Key (gpt-4o-mini)
              </label>
              <input
                type="password"
                value={formData.openaiApiKey}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                placeholder="sk-proj-..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {formData.activeProvider === 'gemini' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-dim)] mb-1">
                Gemini API Key (gemini-1.5-flash)
              </label>
              <input
                type="password"
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {formData.activeProvider === 'ollama' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-dim)] mb-1">
                Ollama Endpoint URL
              </label>
              <input
                type="text"
                value={formData.ollamaEndpoint}
                onChange={(e) => setFormData({ ...formData, ollamaEndpoint: e.target.value })}
                placeholder="http://localhost:11434/api/generate"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {/* Fallback to Offline Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-[var(--border)]">
            <div>
              <span className="text-sm font-semibold block">Fallback to Offline Bank</span>
              <span className="text-xs text-[var(--text-dim)]">
                Seamlessly use 36 static questions if AI call fails or key invalid.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.fallbackToOffline}
              onChange={(e) => setFormData({ ...formData, fallbackToOffline: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Health Check Test */}
          <div className="pt-2">
            <button
              onClick={handleTestHealth}
              disabled={testing}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              {testing ? 'Pinging Provider...' : '🏥 Test Provider Connection'}
            </button>

            {testResult && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs border ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={() => quizStore.setShowAIModal(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-dim)] hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
