import { useState } from 'react';
import { Copy, Download, CheckCircle, Info, ChevronDown, ChevronUp, QrCode } from 'lucide-react';
import { ConversionResult } from '../lib/convert';
import QRCodeModal from './QRCodeModal';

interface ResultCardProps {
  result: ConversionResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showNodeList, setShowNodeList] = useState(false);
  const [qrNode, setQrNode] = useState<{ name: string; uri: string } | null>(null);

  const handleCopy = async () => {
    const text = result.subscriptionText;
    
    // Copy logic with Safari / older iOS fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older iOS Safari
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error('Fallback execCommand failed');
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      alert('复制失败，请手动选择文本复制。');
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([result.subscriptionText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'v2ray_sub.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShowQR = (name: string, uri: string) => {
    setQrNode({ name, uri });
  };

  const successCount = result.nodes.length;
  const skippedCount = result.skipped.length;

  return (
    <div className="bg-claude-card border border-claude-border rounded-2xl p-6 shadow-sm animate-slide-up space-y-6">
      {/* Header and Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-claude-border">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <h3 className="font-serif text-lg font-bold text-claude-text-dark">转换完成</h3>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
            成功节点: {successCount}
          </span>
          {skippedCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100 font-medium">
              已跳过: {skippedCount}
            </span>
          )}
        </div>
      </div>

      {/* Output base64 text box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="output-box" className="block text-xs font-semibold text-claude-text-muted uppercase tracking-wider">
            V2Ray 订阅内容 (Base64 编码)
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-claude-card border-claude-border text-claude-text-muted hover:text-claude-text-dark hover:bg-claude-bg'
              }`}
            >
              {copied ? (
                <>已复制 ✓</>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  复制订阅
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl border border-claude-border bg-claude-card text-claude-text-muted hover:text-claude-text-dark hover:bg-claude-bg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              下载文件
            </button>
            <button
              onClick={() => handleShowQR('全节点订阅二维码', result.subscriptionText)}
              className="px-3 py-1.5 rounded-xl border border-claude-border bg-claude-card text-claude-text-muted hover:text-claude-text-dark hover:bg-claude-bg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              订阅二维码
            </button>
          </div>
        </div>
        
        <textarea
          id="output-box"
          readOnly
          value={result.subscriptionText}
          className="w-full px-4 py-3 rounded-xl border border-claude-border bg-claude-bg text-claude-text-muted font-mono text-xs focus:outline-none resize-none leading-relaxed h-[130px] break-all select-all select-text overflow-y-auto"
        />
      </div>

      {/* Warnings block */}
      {result.nodes.some(n => n.warning) && (
        <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100/60 text-xs text-amber-800 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>注意事项</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 leading-relaxed">
            {result.nodes.filter(n => n.warning).map((node, i) => (
              <li key={i}>
                <strong>{node.name}</strong> ({node.type.toUpperCase()}): {node.warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accordion list for nodes details */}
      <div className="border border-claude-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowNodeList(!showNodeList)}
          className="w-full px-4 py-3 bg-claude-bg/40 hover:bg-claude-bg/80 border-none flex items-center justify-between text-xs font-medium text-claude-text-dark transition-colors"
        >
          <span>查看节点列表明细 ({successCount} 个已转换, {skippedCount} 个已跳过)</span>
          {showNodeList ? <ChevronUp className="w-4 h-4 text-claude-text-muted" /> : <ChevronDown className="w-4 h-4 text-claude-text-muted" />}
        </button>

        {showNodeList && (
          <div className="p-4 border-t border-claude-border bg-white text-xs divide-y divide-claude-border max-h-[250px] overflow-y-auto">
            {/* Success list */}
            {result.nodes.map((node, idx) => (
              <div key={`succ-${idx}`} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-claude-text-dark break-all">{node.name}</span>
                  {node.warning && <span className="text-[10px] text-amber-600 font-medium">{node.warning}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleShowQR(node.name, node.uri)}
                    className="p-1.5 rounded-lg border border-claude-border hover:bg-claude-bg text-claude-text-muted hover:text-claude-terracotta transition-colors flex items-center justify-center"
                    title="显示二维码"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                  <span className="shrink-0 uppercase px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-semibold tracking-wide border border-slate-200">
                    {node.type}
                  </span>
                </div>
              </div>
            ))}

            {/* Skipped list */}
            {result.skipped.map((node, idx) => (
              <div key={`skip-${idx}`} className="py-2.5 flex items-center justify-between gap-4 bg-amber-50/10">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-claude-text-muted break-all">{node.name}</span>
                  <span className="text-[10px] text-claude-terracotta-dark font-medium leading-relaxed">{node.reason}</span>
                </div>
                <div className="flex gap-1.5 shrink-0 items-center">
                  <span className="uppercase px-2 py-0.5 rounded bg-amber-100 text-[10px] text-amber-800 font-semibold tracking-wide border border-amber-200">
                    {node.type}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">已跳过</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Node QR Code Modal */}
      {qrNode && (
        <QRCodeModal
          isOpen={!!qrNode}
          onClose={() => setQrNode(null)}
          nodeName={qrNode.name}
          nodeUri={qrNode.uri}
        />
      )}
    </div>
  );
}
