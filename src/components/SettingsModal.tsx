import { useState, useEffect } from 'react';
import { X, Key, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('FETCH_PROXY_TOKEN') || '';
    setToken(savedToken);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('FETCH_PROXY_TOKEN', token.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-claude-text-dark/45 backdrop-blur-sm transition-all duration-300">
      <div className="bg-claude-card w-full max-w-md mx-4 rounded-2xl border border-claude-border shadow-xl p-6 relative animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-claude-border pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-claude-terracotta" />
            <h3 className="font-serif text-lg font-bold text-claude-text-dark">代理密钥设置</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-claude-text-muted hover:text-claude-text-dark transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-claude-text-muted leading-relaxed">
            为了避免你的 Cloudflare Pages Functions 代理端点被他人滥用，你需要提供一个密钥。此密钥仅保存在你本地浏览器的 
            <code className="px-1.5 py-0.5 mx-1 bg-claude-bg rounded text-xs border border-claude-border">localStorage</code> 
            中，并将在每次获取订阅链接时，自动附加在请求头 <code className="px-1.5 py-0.5 bg-claude-bg rounded text-xs border border-claude-border">X-Fetch-Proxy-Token</code> 中。
          </p>
          
          <div className="space-y-2">
            <label htmlFor="token-input" className="block text-xs font-semibold text-claude-text-muted uppercase tracking-wider">
              FETCH_PROXY_TOKEN 密钥值
            </label>
            <input
              id="token-input"
              type="password"
              placeholder="请输入您在 Cloudflare 环境变量中配置的密钥"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-claude-border bg-claude-input text-claude-text-dark focus:outline-none focus:border-claude-terracotta focus:ring-1 focus:ring-claude-terracotta transition-all text-sm"
            />
          </div>

          <div className="bg-claude-bg/50 border border-claude-border rounded-xl p-3 flex gap-2.5 items-start">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="text-xs text-claude-text-muted leading-normal">
              <strong>提示：</strong>密钥绝不会随项目源码上传或泄露。请确保该值与您在 Cloudflare Pages 环境变量中部署的密钥一致。
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-claude-text-muted hover:text-claude-text-dark font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-5 py-2 rounded-xl bg-claude-terracotta hover:bg-claude-terracotta-dark text-white font-medium text-sm transition-all shadow-sm active:translate-y-0.5 disabled:bg-emerald-600"
          >
            {saved ? '已保存 ✓' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
