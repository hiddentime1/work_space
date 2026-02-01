'use client';

import { useState } from 'react';
import { StickyNote, X, Save } from 'lucide-react';
import { Memo } from '@/types';

interface MemoButtonProps {
  onSave: (content: string) => void;
  onUpdate?: (id: string, content: string) => void;
  editingMemo?: Memo | null;
  onClearEditing?: () => void;
}

export default function MemoButton({ onSave, onUpdate, editingMemo, onClearEditing }: MemoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  // 외부에서 editingMemo가 설정되면 모달 열기
  const isEditing = !!editingMemo;
  const modalOpen = isOpen || isEditing;
  const currentContent = isEditing ? (editingMemo?.content || '') : content;

  const handleSave = () => {
    const trimmed = isEditing ? (editingMemo?.content || '').trim() : content.trim();
    if (!trimmed && !isEditing) return;
    
    if (isEditing && editingMemo && onUpdate) {
      // 수정 모드
      const textArea = document.getElementById('memo-textarea') as HTMLTextAreaElement;
      const newContent = textArea?.value.trim();
      if (newContent) {
        onUpdate(editingMemo.id, newContent);
      }
    } else {
      // 새 메모
      onSave(content.trim());
      setContent('');
    }
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setContent('');
    if (onClearEditing) {
      onClearEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
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
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={handleClose}
        >
          <div 
            className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl sm:mx-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-gray-600" />
                <h2 className="font-bold text-gray-900">
                  {isEditing ? '메모 수정' : '새 메모'}
                </h2>
              </div>
              <button 
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 메모 작성/수정 */}
            <div className="p-4 sm:p-5">
              <textarea
                id="memo-textarea"
                defaultValue={currentContent}
                onChange={(e) => !isEditing && setContent(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={10}
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-lg 
                           text-gray-800 placeholder:text-gray-400 resize-none
                           focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                <span className="hidden sm:block text-sm text-gray-400">
                  Ctrl+Enter로 저장
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isEditing ? '수정' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
