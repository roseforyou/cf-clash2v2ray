import { useState } from 'react';
import { Compass, AlertCircle, RefreshCw } from 'lucide-react';
import InputPanel from './components/InputPanel';
import ResultCard from './components/ResultCard';
import SettingsModal from './components/SettingsModal';
import { convertClashToV2Ray, ConversionResult } from './lib/convert';

export default function App() {
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleConvertUrl = async (url: string) => {
    setIsLoading(true);
    setGlobalError('');
    setResult(null);

    const token = localStorage.getItem('FETCH_PROXY_TOKEN') || '';

    try {
      // 1. Send request to proxy API
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Fetch-Proxy-Token': token,
        },
        body: JSON.stringify({ url }),
      });

      // 2. Error handling
      if (response.status === 401) {
        setIsSettingsOpen(true);
        throw new Error('代理接口验证失败。可能是您没有配置密钥，或配置的密钥不正确。请在弹出的设置窗口中输入正确的密钥。');
      }

      if (response.status === 500) {
        const errJson = await response.json().catch(() => ({}));
        if (errJson.error && errJson.error.includes('FETCH_PROXY_TOKEN 未设置')) {
          setIsSettingsOpen(true);
          throw new Error('后端代理未设置 FETCH_PROXY_TOKEN 环境变量。请在 Cloudflare 部署面板中添加，并在前端本地配置相匹配的密钥。');
        }
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `请求代理失败，状态码: ${response.status}`);
      }

      const text = await response.text();
      
      // 3. Process conversion on the text
      // Wrap in setTimeout to let UI thread render spinner
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            const convResult = convertClashToV2Ray(text);
            setResult(convResult);
            resolve();
          } catch (err: any) {
            reject(err);
          }
        }, 100);
      });
    } catch (err: any) {
      setGlobalError(err.message || '订阅获取或转换失败，请重试。');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertText = (text: string) => {
    setIsLoading(true);
    setGlobalError('');
    setResult(null);

    // Timeout allows DOM spinner to render before synchronous parse freezes the main thread.
    setTimeout(() => {
      try {
        const convResult = convertClashToV2Ray(text);
        setResult(convResult);
      } catch (err: any) {
        setGlobalError(err.message || 'YAML 解析或转换失败，请检查文本格式。');
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 py-6 sm:py-10 flex flex-col min-h-screen">
      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header section */}
      <header className="flex flex-col items-center text-center mb-6 space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <Compass className="w-6 h-6 text-claude-terracotta shrink-0 animate-spin-slow" />
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-claude-text-dark">
            Clash → V2Ray 订阅转换
          </h1>
        </div>
        <p className="text-xs text-claude-text-muted max-w-md mx-auto leading-relaxed">
          极简、隐私安全、纯前端解析。支持 SS、SSR、VMess、VLESS、Trojan、HTTP/SOCKS 协议。
        </p>
      </header>

      {/* Main content Area */}
      <main className="flex-1 space-y-6">
        <InputPanel
          onConvertUrl={handleConvertUrl}
          onConvertText={handleConvertText}
          isLoading={isLoading}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Global Error Banner */}
        {globalError && (
          <div className="p-4 rounded-2xl bg-claude-card border border-claude-border text-sm text-claude-text-dark space-y-2 animate-slide-up shadow-sm">
            <div className="flex items-center gap-2.5 text-claude-terracotta font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>转换出现错误</span>
            </div>
            <p className="text-claude-text-muted leading-relaxed pl-6.5 text-xs font-medium">
              {globalError}
            </p>
          </div>
        )}

        {/* Loading Spinner Overlays */}
        {isLoading && !result && !globalError && (
          <div className="p-8 border border-claude-border bg-claude-card rounded-2xl flex flex-col items-center justify-center space-y-4 animate-slide-up">
            <RefreshCw className="w-6 h-6 text-claude-terracotta animate-spin" />
            <span className="text-xs font-medium text-claude-text-muted">正在处理 Clash 配置文件，请稍候...</span>
          </div>
        )}

        {/* Result Card */}
        {result && <ResultCard result={result} />}
      </main>

      {/* Footer */}
      <footer className="text-center mt-16 pt-6 border-t border-claude-border text-xs text-claude-text-muted space-y-1.5">
        <p>
          此转换工具为本地私有转换模式，所有的节点解密与映射均在浏览器沙箱内完成。
        </p>
        <p>
          Powered by <a href="https://pages.cloudflare.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-claude-text-dark transition-colors">Cloudflare Pages</a> &amp; Functions.
        </p>
      </footer>
    </div>
  );
}
