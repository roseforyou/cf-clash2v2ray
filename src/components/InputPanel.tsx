import { useState } from 'react';
import { Link2, FileText, Sparkles, Settings } from 'lucide-react';

interface InputPanelProps {
  onConvertUrl: (url: string) => Promise<void>;
  onConvertText: (text: string) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
}

export default function InputPanel({ onConvertUrl, onConvertText, isLoading, onOpenSettings }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'url') {
      if (!url.trim()) {
        setError('请输入 Clash 订阅链接');
        return;
      }
      if (!url.trim().startsWith('http://') && !url.trim().startsWith('https://')) {
        setError('订阅链接必须以 http:// 或 https:// 开头');
        return;
      }
      try {
        await onConvertUrl(url.trim());
      } catch (err: any) {
        setError(err.message || '抓取或解析订阅失败');
      }
    } else {
      if (!text.trim()) {
        setError('请粘贴 Clash YAML 配置文件');
        return;
      }
      try {
        onConvertText(text);
      } catch (err: any) {
        setError(err.message || '解析 YAML 失败');
      }
    }
  };

  return (
    <div className="bg-claude-card border border-claude-border rounded-2xl p-6 shadow-sm">
      {/* Tabs Headers */}
      <div className="flex items-center justify-between border-b border-claude-border pb-3 mb-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('url'); setError(''); }}
            className={`flex items-center gap-2 pb-3 -mb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-claude-terracotta text-claude-terracotta'
                : 'border-transparent text-claude-text-muted hover:text-claude-text-dark'
            }`}
          >
            <Link2 className="w-4 h-4" />
            订阅链接模式
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setError(''); }}
            className={`flex items-center gap-2 pb-3 -mb-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-claude-terracotta text-claude-terracotta'
                : 'border-transparent text-claude-text-muted hover:text-claude-text-dark'
            }`}
          >
            <FileText className="w-4 h-4" />
            YAML 文本模式
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-claude-text-muted hover:text-claude-text-dark hover:bg-claude-bg transition-all flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-claude-border"
          title="设置代理密钥"
        >
          <Settings className="w-4 h-4" />
          <span>配置代理</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'url' ? (
          <div className="space-y-2 animate-fade-in">
            <label htmlFor="url-input" className="block text-xs font-semibold text-claude-text-muted uppercase tracking-wider">
              Clash 订阅地址
            </label>
            <input
              id="url-input"
              type="text"
              placeholder="https://example.com/link/to/clash.yaml"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-claude-border bg-claude-input text-claude-text-dark focus:outline-none focus:border-claude-terracotta focus:ring-1 focus:ring-claude-terracotta transition-all text-sm disabled:opacity-60"
            />
            <p className="text-xs text-claude-text-muted">
              提示：程序会通过 Pages Functions 代理端点抓取，绕过浏览器 CORS 跨域限制。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="text-input" className="block text-xs font-semibold text-claude-text-muted uppercase tracking-wider">
              粘贴 Clash 配置 (YAML 文本 或 Base64 编码文本)
            </label>
            <textarea
              id="text-input"
              rows={8}
              placeholder="proxies:&#10;  - name: SS-Node&#10;    type: ss&#10;    server: 1.2.3.4&#10;    port: 443&#10;    cipher: chacha20-ietf-poly1305&#10;    password: yourpassword"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-claude-border bg-claude-input text-claude-text-dark focus:outline-none focus:border-claude-terracotta focus:ring-1 focus:ring-claude-terracotta transition-all text-sm font-mono placeholder:font-sans disabled:opacity-60 resize-y min-h-[160px]"
            />
          </div>
        )}

        {/* Error Alert (Claude style: light card, not harsh red) */}
        {error && (
          <div className="p-4 rounded-xl bg-claude-bg border border-claude-border text-sm text-claude-terracotta-dark flex items-start gap-2.5 animate-slide-up">
            <span className="font-semibold select-none mt-0.5">⚠️</span>
            <div className="flex-1 leading-normal font-medium">{error}</div>
          </div>
        )}

        {/* Convert Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-claude-terracotta hover:bg-claude-terracotta-dark text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-claude-terracotta/60 disabled:cursor-not-allowed active:translate-y-0.5"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>正在解析并转换中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>一键转换为 V2Ray 订阅</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
