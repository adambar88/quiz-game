import React, { useState } from 'react';
import { testProviderHealth } from '../services/aiProvider.ts';
import { quizStore, useQuizStore } from '../state/useQuizStore.ts';
import type { AISettings } from '../services/storageService.ts';
import { translations } from '../i18n/translations.ts';

export const AIConfigModal: React.FC = () => {
  const { aiSettings, showAIModal, lang } = useQuizStore();
  const [formData, setFormData] = useState<AISettings>(aiSettings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const t = translations[lang];

  if (!showAIModal) return null;

  const handleProviderChange = (provider: 'server' | 'offline') => {
    setFormData((prev) => ({ ...prev, activeProvider: provider }));
    setTestResult(null);
  };

  const handleTestHealth = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testProviderHealth(formData);
    setTesting(false);
    setTestResult({
      ok: res.ok,
      message: res.ok ? t.connectionSuccess : res.message,
    });
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
            <h2 className="text-lg font-bold">{t.aiSettingsTitle}</h2>
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
              {t.engineLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['server', t.serverAiEngine],
                  ['offline', t.offlineBankEngine],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => handleProviderChange(id)}
                  className={`p-2.5 rounded-lg text-xs font-medium text-center transition-all ${
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
          {formData.activeProvider === 'server' && (
            <div className="space-y-3 p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
                <span>🤖 {t.serverAiEngine}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-dim)] mb-1">
                  {t.serverUrlLabel}
                </label>
                <input
                  type="text"
                  value={formData.serverEndpoint}
                  onChange={(e) => setFormData({ ...formData, serverEndpoint: e.target.value })}
                  placeholder="/quiz/api/ai"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-[var(--border)] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-dim)] mb-1">
                  {t.serverKeyLabel}
                </label>
                <input
                  type="password"
                  value={formData.serverApiKey}
                  onChange={(e) => setFormData({ ...formData, serverApiKey: e.target.value })}
                  placeholder={t.serverKeyPlaceholder}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-[var(--border)] text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-dim)] mb-1">
                  {t.modelLabel}
                </label>
                <input
                  type="text"
                  value={formData.serverModel}
                  onChange={(e) => setFormData({ ...formData, serverModel: e.target.value })}
                  placeholder="gpt-5-mini"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-[var(--border)] text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Fallback to Offline Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-[var(--border)]">
            <div>
              <span className="text-sm font-semibold block">{t.fallbackOfflineLabel}</span>
              <span className="text-xs text-[var(--text-dim)]">
                {t.fallbackOfflineDesc}
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
              {testing ? t.testing : t.testConnection}
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
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
