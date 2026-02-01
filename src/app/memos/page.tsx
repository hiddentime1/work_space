'use client';

import { useState, useEffect } from 'react';
import { Memo } from '@/types';
import { ArrowLeft, Trash2, StickyNote, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
                className="bg-white rounded-xl p-4 border border-gray-200 group"
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
                  <button
                    onClick={() => handleDelete(memo.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                               rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
