'use client';

import { useState } from 'react';
import { StickyNote, X, Save, Trash2 } from 'lucide-react';
import { Memo } from '@/types';

interface MemoButtonProps {
  onSave: (content: string) => void;
  recentMemos: Memo[];
  onDeleteMemo: (id: string) => void;
}

export default function MemoButton({ onSave, recentMemos, onDeleteMemo }: MemoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content.trim());
    setContent('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 hover:bg-gray-800 
                   text-white rounded-full shadow-lg flex items-center justify-center
                   transition-all hover:scale-105 z-40"
        title="메모 작성"
      >
        <StickyNote className="w-6 h-6" />
      </button>

      {/* 메모 모달 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-gray-600" />
                <h2 className="font-bold text-gray-900">메모</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRecent(!showRecent)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                             ${showRecent ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  최근 메모
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {showRecent ? (
              /* 최근 메모 목록 */
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {recentMemos.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">
                    저장된 메모가 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentMemos.slice(0, 5).map(memo => (
                      <div 
                        key={memo.id}
                        className="p-3 bg-gray-50 rounded-lg group"
                      >
                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {memo.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(memo.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <button
                            onClick={() => onDeleteMemo(memo.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {recentMemos.length > 5 && (
                      <a
                        href="/memos"
                        className="block text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                      >
                        전체 메모 보기 ({recentMemos.length}개)
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* 메모 작성 */
              <div className="p-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={6}
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg 
                             text-gray-800 text-sm placeholder:text-gray-400 resize-none
                             focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    Ctrl+Enter로 저장
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={!content.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    저장
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
