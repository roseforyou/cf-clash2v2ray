import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, AlertTriangle } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeName: string;
  nodeUri: string;
}

export default function QRCodeModal({ isOpen, onClose, nodeName, nodeUri }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Safe limit for phone camera scanning density
  const isTooLong = nodeUri.length > 2000;

  useEffect(() => {
    if (isOpen && canvasRef.current && nodeUri && !isTooLong) {
      QRCode.toCanvas(
        canvasRef.current,
        nodeUri,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#1E1E1C', // Claude text dark
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Failed to generate QR Code:', error);
        }
      );
    }
  }, [isOpen, nodeUri, isTooLong]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-claude-text-dark/45 backdrop-blur-sm transition-all duration-300">
      <div className="bg-claude-card w-full max-w-sm mx-4 rounded-2xl border border-claude-border shadow-xl p-6 relative animate-slide-up flex flex-col items-center">
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-claude-text-muted hover:text-claude-text-dark transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-claude-terracotta" />
          <h3 className="font-serif text-base font-bold text-claude-text-dark max-w-[220px] truncate" title={nodeName}>
            {nodeName}
          </h3>
        </div>

        {/* QR Code Canvas or Warning */}
        {isTooLong ? (
          <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3 w-full">
            <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
            <h4 className="font-bold text-xs text-amber-900">节点数量过多，无法生成全订阅二维码</h4>
            
            <p className="text-[11px] text-claude-text-muted leading-relaxed">
              当前订阅内容字符长度 ({nodeUri.length}) 已大幅超出手机摄像头对焦与二维码识读的安全上限（推荐 2000 字符以内）。
            </p>
            
            <div className="text-left w-full bg-white/60 rounded-lg p-2.5 border border-claude-border text-[11px] text-claude-text-muted space-y-1.5">
              <span className="font-semibold block text-claude-text-dark">💡 建议操作：</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>点击 <strong>“复制订阅”</strong> 复制 Base64 文本直接导入客户端。</li>
                <li>点击 <strong>“下载文件”</strong> 保存为 txt 文件后进行导入。</li>
                <li>在下方的节点明细列表中，点击特定节点右侧的二维码按钮，进行 <strong>“单节点扫码导入”</strong>。</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-3 border border-claude-border rounded-xl shadow-inner flex items-center justify-center">
              <canvas ref={canvasRef} className="w-[200px] h-[200px] block" />
            </div>
            <p className="text-[11px] text-claude-text-muted mt-4 text-center leading-normal max-w-[250px] break-all select-all">
              扫码即可将该订阅的全部节点一键导入到 v2rayNG / Shadowrocket 等客户端。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
