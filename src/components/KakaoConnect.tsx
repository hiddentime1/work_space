'use client';

import { useState } from 'react';
import { MessageCircle, Check, RefreshCw, Bell, BellOff } from 'lucide-react';

interface KakaoConnectProps {
  isConnected: boolean;
  isActive: boolean;
  onConnect: () => void;
  onToggleActive: () => void;
  onTestNotification: () => void;
}

export default function KakaoConnect({ 
  isConnected, 
  isActive,
  onConnect, 
  onToggleActive,
  onTestNotification 
}: KakaoConnectProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    await onTestNotification();
    setTimeout(() => setIsTesting(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-yellow-400' : 'bg-gray-100'}`}>
            <MessageCircle className={`w-4 h-4 ${isConnected ? 'text-gray-900' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 text-sm">카카오톡</h3>
            <p className="text-xs text-gray-500">
              {isConnected ? '연결됨' : '연결 필요'}
            </p>
          </div>
        </div>

        {isConnected && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Check className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-2">
          {/* 알림 토글 */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {isActive ? (
                <Bell className="w-4 h-4 text-gray-600" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs text-gray-600">
                알림 {isActive ? 'ON' : 'OFF'}
              </span>
            </div>
            <button
              onClick={onToggleActive}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                isActive ? 'bg-gray-800' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 테스트 버튼 */}
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="w-full btn-secondary text-xs flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                전송중...
              </>
            ) : (
              <>
                <MessageCircle className="w-3.5 h-3.5" />
                테스트 메시지
              </>
            )}
          </button>
        </div>
      ) : (
        <button onClick={onConnect} className="w-full btn-kakao justify-center text-sm">
          <MessageCircle className="w-4 h-4" />
          연결하기
        </button>
      )}
    </div>
  );
}
