'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

// Toss 토스트는 단일 다크 배경(#191f28). 아이콘 색으로만 상태를 구분한다.
const iconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`toast flex items-center gap-3
                  transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-2'}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />
      <p className="text-white font-medium">{message}</p>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

// Toast Context를 위한 커스텀 훅
export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
}
