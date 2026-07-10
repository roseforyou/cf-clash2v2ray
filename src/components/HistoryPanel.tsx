import { useState } from 'react';
import { Clock, Copy, QrCode, Trash2, ExternalLink } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

export interface HistoryItem {
  id: string;
  clashUrl: string;
  date: string;
  nodeCount: number;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onClearItem: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryPanel({ items, onClearItem, onClearAll }: HistoryPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrItem, setQrItem] = useState<{ name: string; uri: string } | null>(null);

  if (items.length === 0) return null;

  const handleCopyLink = async (item: HistoryItem) => {
    const subUrl = `${window.location.origin}/api/sub?id=${item.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(subUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = subUrl;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      alert('复制失败');
    }
  };

  const handleShowQR = (item: HistoryItem) => {
    const subUrl = `${window.location.origin}/api/sub?id=${item.id}`;
    setQrItem({
      name: '一键订阅二维码 (扫码导入所有节点)',
      uri: subUrl,
    });
  };

  return (
    <div className="bg-claude-card border border-claude-border rounded-2xl p-5 shadow-sm animate-slide-up space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-claude-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-claude-text-muted" />
          <h4 className="font-serif text-sm font-bold text-claude-text-dark">转换历史记录</h4>
        </div>
        <button
          onClick={onClearAll}
          className="text-[10px] text-claude-text-muted hover:text-claude-terracotta border-none bg-transparent hover:underline transition-all"
        >
          清空历史
        </button>
      </div>

      {/* History Items list */}
      <div className="space-y-3 max-h-[220px] overflow-y-auto divide-y divide-claude-border/50 pr-1">
        {items.map((item, idx) => {
          const subUrl = `${window.location.origin}/api/sub?id=${item.id}`;
          return (
            <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${idx > 0 ? 'pt-3' : ''}`}>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-claude-text-muted">{item.date}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100/60 text-[9px] font-semibold">
                    {item.nodeCount} 节点
                  </span>
                </div>
                <p className="font-mono text-[10px] text-claude-text-muted truncate select-all" title={item.clashUrl}>
                  源: {item.clashUrl}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={subUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-claude-border hover:bg-claude-bg text-claude-text-muted hover:text-claude-text-dark transition-colors flex items-center justify-center"
                  title="在新窗口测试打开订阅"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleShowQR(item)}
                  className="p-1.5 rounded-lg border border-claude-border hover:bg-claude-bg text-claude-text-muted hover:text-claude-terracotta transition-colors flex items-center justify-center"
                  title="查看订阅二维码"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopyLink(item)}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-all flex items-center gap-1 shadow-sm ${
                    copiedId === item.id
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-claude-border text-claude-text-muted hover:text-claude-text-dark hover:bg-claude-bg'
                  }`}
                >
                  {copiedId === item.id ? '已复制 ✓' : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制订阅
                    </>
                  )}
                </button>
                <button
                  onClick={() => onClearItem(item.id)}
                  className="p-1.5 rounded-lg border border-transparent hover:border-claude-border hover:bg-claude-bg text-claude-text-muted hover:text-claude-terracotta transition-all flex items-center justify-center"
                  title="删除此条记录"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal for history items */}
      {qrItem && (
        <QRCodeModal
          isOpen={!!qrItem}
          onClose={() => setQrItem(null)}
          nodeName={qrItem.name}
          nodeUri={qrItem.uri}
        />
      )}
    </div>
  );
}
