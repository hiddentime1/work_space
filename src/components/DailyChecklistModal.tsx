'use client';

import { useState, useEffect } from 'react';
import { ChecklistItemWithStatus } from '@/types';
import { X, Check, Sparkles, Trophy, RefreshCw, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface DailyChecklistModalProps {
  date: string; // 'YYYY-MM-DD'
  onClose: () => void;
}

export default function DailyChecklistModal({ date, onClose }: DailyChecklistModalProps) {
  const [items, setItems] = useState<ChecklistItemWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/daily-checklist?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('체크리스트 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [date]);

  const handleToggle = async (item: ChecklistItemWithStatus) => {
    const newChecked = !item.is_checked;
    setUpdatingId(item.id);

    // 옵티미스틱 업데이트
    setItems(prev => prev.map(i => 
      i.id === item.id 
        ? { ...i, is_checked: newChecked, checked_at: newChecked ? new Date().toISOString() : undefined }
        : i
    ));

    try {
      const res = await fetch('/api/daily-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          item_id: item.id,
          is_checked: newChecked,
        }),
      });
      const result = await res.json();
      
      if (!result.success) {
        // 실패 시 롤백
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, is_checked: !newChecked } : i
        ));
      } else {
        // 모든 항목 체크 시 축하 효과
        const allChecked = items.every(i => i.id === item.id ? newChecked : i.is_checked);
        if (newChecked && allChecked && items.length > 0) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
    } catch (error) {
      console.error('체크 실패:', error);
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_checked: !newChecked } : i
      ));
    } finally {
      setUpdatingId(null);
    }
  };

  const checkedCount = items.filter(i => i.is_checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isAllCompleted = totalCount > 0 && checkedCount === totalCount;

  const dateObj = new Date(date + 'T00:00:00');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 modal-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl modal-slide-up">
        {/* 그라데이션 헤더 */}
        <div className={`relative overflow-hidden ${
          isAllCompleted 
            ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500'
            : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
        } text-white p-5 sm:p-6 transition-all duration-500`}>
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm">
                  {format(dateObj, 'yyyy년 M월 d일', { locale: ko })}
                </p>
                <h2 className="text-2xl font-bold mt-1 flex items-center gap-2">
                  {isAllCompleted ? (
                    <>
                      <Trophy className="w-7 h-7" />
                      하루 마무리 완료!
                    </>
                  ) : (
                    <>
                      <ListChecks className="w-7 h-7" />
                      오늘의 체크리스트
                    </>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 진행률 */}
            {totalCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 text-sm font-medium">
                  <span>진행률</span>
                  <span className="text-lg font-bold">
                    {checkedCount} / {totalCount}
                  </span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/90">
                  {isAllCompleted 
                    ? '🎉 모든 항목을 완료했어요! 수고하셨습니다.'
                    : `${Math.round(progress)}% 완료 · 조금만 더 힘내요!`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 체크리스트 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gradient-to-b from-gray-50 to-white">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">로딩중...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ListChecks className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-700 mb-2">체크리스트 항목이 없어요</h3>
              <p className="text-sm text-gray-500 mb-4">
                먼저 매일 체크할 항목을 만들어 주세요
              </p>
              <Link
                href="/checklist"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                체크리스트 만들기
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const isUpdating = updatingId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggle(item)}
                    disabled={isUpdating}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 transform active:scale-[0.98] ${
                      item.is_checked
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* 커스텀 체크박스 */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                          item.is_checked
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg scale-110'
                            : 'bg-gray-100 border-2 border-gray-300'
                        }`}
                      >
                        {item.is_checked && (
                          <Check className="w-5 h-5 text-white check-pop" strokeWidth={3} />
                        )}
                      </div>

                      {/* 이모지 */}
                      <div className={`text-2xl transition-transform ${item.is_checked ? 'scale-110' : ''}`}>
                        {item.emoji || '✅'}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold transition-all ${
                          item.is_checked 
                            ? 'text-gray-400 line-through' 
                            : 'text-gray-800'
                        }`}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className={`text-sm mt-0.5 ${
                            item.is_checked ? 'text-gray-400 line-through' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* 완료 시 작은 효과 */}
                      {item.is_checked && (
                        <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-white">
            <Link
              href="/checklist"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              체크리스트 항목 관리하기
            </Link>
          </div>
        )}
      </div>

      {/* 모두 완료 축하 효과 */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}
    </div>
  );
}
