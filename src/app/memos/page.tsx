'use client';

import { useState, useEffect } from 'react';
import { Memo } from '@/types';
import { ArrowLeft, Trash2, StickyNote, RefreshCw, Edit2, X, Save } from 'lucide-react';
import Link from 'next/link';

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchMemos = async () => {
    try {
      const res = await fetch('/api/memos');
      const data = await res.json();
      if (data.success) {
        setMemos(data.data);
      }
    } catch (error) {
      console.error('메모 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setMemos(memos.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error);
    }
  };

  const handleEdit = (memo: Memo) => {
    setEditingMemo(memo);
    setEditContent(memo.content);
  };

  const handleUpdate = async () => {
    if (!editingMemo || !editContent.trim()) return;
    
    try {
      const res = await fetch(`/api/memos/${editingMemo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      const result = await res.json();
      
      if (result.success) {
        setMemos(memos.map(m => 
          m.id === editingMemo.id ? { ...m, content: editContent.trim() } : m
        ));
        setEditingMemo(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('메모 수정 실패:', error);
    }
  };

  const handleCloseModal = () => {
    setEditingMemo(null);
    setEditContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleUpdate();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-gray-600" />
              <h1 className="text-lg font-bold text-gray-900">메모 목록</h1>
              {memos.length > 0 && (
                <span className="text-sm text-gray-400">({memos.length}개)</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500 text-sm">로딩중...</p>
          </div>
        ) : memos.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-200">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <StickyNote className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">메모가 없습니다</h3>
            <p className="text-gray-500 text-sm">
              메인 화면에서 메모를 작성해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {memos.map(memo => (
              <div 
                key={memo.id}
                className="bg-white rounded-xl p-4 border border-gray-200 group cursor-pointer
                           hover:border-gray-300 hover:shadow-sm transition-all"
                onClick={() => handleEdit(memo)}
              >
                <p className="text-gray-800 whitespace-pre-wrap">
                  {memo.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {new Date(memo.created_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(memo);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(memo.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메모 수정 모달 */}
      {editingMemo && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={handleCloseModal}
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
                <h2 className="font-bold text-gray-900">메모 수정</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 메모 수정 */}
            <div className="p-4 sm:p-5">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
                    onClick={handleCloseModal}
                    className="btn-secondary flex-1 sm:flex-none"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={!editContent.trim()}
                    className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    수정
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
