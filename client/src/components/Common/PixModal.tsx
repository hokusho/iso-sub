import React from 'react';
import { X } from 'lucide-react';
import pixQrCode from '../../assets/pix_qrcode.png';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PixModal: React.FC<PixModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white border-2 border-neutral-300 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center relative animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Badge */}
        <div className="flex flex-col items-center pt-1">
          <span className="text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            APOIE O PROJETO
          </span>
        </div>

        {/* Title & Creator */}
        <div>
          <h3 className="font-black text-neutral-900 text-base">Me pague uma coquinha gelada!</h3>
          <p className="text-xs text-neutral-500 font-bold mt-0.5">
            Chave PIX de <span className="text-neutral-950 font-black">Raphael Hannesberg</span>
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center bg-neutral-50 p-4 rounded-2xl border-2 border-dashed border-neutral-300">
          <img
            src={pixQrCode}
            alt="PIX QR Code Raphael Hannesberg"
            className="w-44 h-44 rounded-xl object-contain bg-white p-2 border border-neutral-200 shadow-sm transition-transform hover:scale-105"
          />
          <p className="text-[11px] font-bold text-neutral-500 mt-2.5">
            Abra o app do seu banco e escaneie o código
          </p>
        </div>

        {/* Thank You Note (Centered, no icon) */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
            Muito obrigado por apoiar o <span className="font-black">ISO SUB</span>! Sua contribuição ajuda a manter o projeto ativo e sempre atualizado.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-black transition active:scale-95 shadow-sm"
        >
          Fechar
        </button>

      </div>
    </div>
  );
};
