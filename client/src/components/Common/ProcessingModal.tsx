import React from 'react';
import { Loader2, CheckCircle2, Upload, Volume2, Sparkles, X, Minimize2 } from 'lucide-react';

export type ProcessStep = 'uploading' | 'processing-audio' | 'transcribing' | 'completed' | null;

interface ProcessingModalProps {
  currentStep: ProcessStep;
  progressPercent?: number;
  statusMessage: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onCancel?: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  currentStep,
  progressPercent = 0,
  statusMessage,
  isMinimized,
  onToggleMinimize,
  onCancel
}) => {
  if (!currentStep) return null;

  const steps = [
    {
      id: 'uploading',
      label: 'Upload & Análise do Vídeo',
      desc: 'Enviando arquivo e extraindo dimensões...',
      icon: Upload
    },
    {
      id: 'processing-audio',
      label: 'Extração de Áudio & Waveform',
      desc: 'Processando faixa de áudio com FFmpeg...',
      icon: Volume2
    },
    {
      id: 'transcribing',
      label: 'Transcrição Whisper (Word Timestamps)',
      desc: 'Detectando palavras e alinhando timestamps milimétricos...',
      icon: Sparkles
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStep === 'completed') return 'done';
    if (currentStep === stepId) return 'active';

    const order = ['uploading', 'processing-audio', 'transcribing', 'completed'];
    const currentIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(stepId);

    return stepIdx < currentIdx ? 'done' : 'pending';
  };

  if (isMinimized) {
    return (
      <div
        onClick={onToggleMinimize}
        className="fixed bottom-5 right-5 z-50 bg-white border border-slate-300 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer hover:border-slate-900 transition"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
          <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900">Processando...</span>
          <span className="text-xs text-slate-600 font-mono font-medium">{statusMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-pop">
        {/* Top bar with Minimize */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Processamento em Andamento</h3>
              <p className="text-xs text-slate-500 font-medium">Aguarde enquanto preparamos seu vídeo e legendas</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMinimize}
              title="Minimizar para canto da tela"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                title="Cancelar"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Progress Card */}
        <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-800">{statusMessage}</span>
            <span className="font-mono text-slate-900">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Step Items */}
        <div className="flex flex-col gap-3 mt-4">
          {steps.map((st) => {
            const status = getStepStatus(st.id);
            const Icon = st.icon;

            return (
              <div
                key={st.id}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                  status === 'active'
                    ? 'bg-slate-100 border-slate-900 shadow-sm'
                    : status === 'done'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    status === 'active'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : status === 'done'
                      ? 'bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  {status === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-900" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-xs font-bold ${
                      status === 'active'
                        ? 'text-slate-900 font-extrabold'
                        : status === 'done'
                        ? 'text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className="text-[11px] text-slate-500">{st.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
