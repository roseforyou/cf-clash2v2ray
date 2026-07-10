import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeName: string;
  nodeUri: string;
}

export default function QRCodeModal({ isOpen, onClose, nodeName, nodeUri }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current && nodeUri) {
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
  }, [isOpen, nodeUri]);

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
          <h3 className="font-serif text-base font-bold text-claude-text-dark max-w-[200px] truncate" title={nodeName}>
            {nodeName}
          </h3>
        </div>

        {/* QR Code Canvas */}
        <div className="bg-white p-3 border border-claude-border rounded-xl shadow-inner flex items-center justify-center">
          <canvas ref={canvasRef} className="w-[200px] h-[200px] block" />
        </div>

        {/* Node URI text / info */}
        <p className="text-[11px] text-claude-text-muted mt-4 text-center leading-normal max-w-[250px] break-all select-all">
          扫码即可将该节点快速导入到 v2rayNG / Shadowrocket / v2rayN 等客户端。
        </p>
      </div>
    </div>
  );
}
