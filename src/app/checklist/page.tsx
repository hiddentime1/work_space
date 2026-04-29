'use client';

import { useState, useEffect } from 'react';
import { ChecklistItem, CreateChecklistItemInput } from '@/types';
import { 
  ArrowLeft, Plus, Trash2, Edit3, X, CheckSquare, 
  GripVertical, Eye, EyeOff, Save, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const EMOJI_OPTIONS = ['✅', '📋', '📅', '📧', '🧹', '💼', '☕', '🎯', '📊', '💡', '🔥', '⭐', '🌟', '🚀', '💪', '🎉'];

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  
  const [formData, setFormData] = useState<CreateChecklistItemInput>({
    title: '',
    description: '',
    emoji: '✅',
    sort_order: 0,
    is_active: true,
  });

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/checklist-items');
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('체크리스트 항목 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      emoji: '✅',
      sort_order: items.length,
      is_active: true,
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    try {
      if (editingItem) {
        const res = await fetch(`/api/checklist-items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          fetchItems();
          setShowForm(false);
          resetForm();
        }
      } else {
        const res = await fetch('/api/checklist-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          fetchItems();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?\n해당 항목의 모든 체크 기록도 함께 삭제됩니다.')) return;
    try {
      const res = await fetch(`/api/checklist-items/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchItems();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleToggleActive = async (item: ChecklistItem) => {
    try {
      const res = await fetch(`/api/checklist-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        fetchItems();
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      emoji: item.emoji || '✅',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    resetForm();
    setFormData(prev => ({ ...prev, sort_order: items.length }));
    setShowForm(true);
  };

  // 순서 변경 (위/아래) - 옵티미스틱 + 전체 재정렬
  const handleReorder = async (item: ChecklistItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // 두 항목 위치 교환 + sort_order를 0,1,2... 로 정규화
    const newOrder = [...items];
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    
    const reindexed = newOrder.map((it, idx) => ({ ...it, sort_order: idx }));
    
    // 옵티미스틱: UI 즉시 업데이트
    const previousItems = items;
    setItems(reindexed);
    
    try {
      // 실제로 sort_order가 바뀐 항목만 백엔드 업데이트
      const changed = reindexed.filter(it => {
        const original = previousItems.find(o => o.id === it.id);
        return !original || original.sort_order !== it.sort_order;
      });
      
      const results = await Promise.all(
        changed.map(it =>
          fetch(`/api/checklist-items/${it.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: it.sort_order }),
          }).then(r => r.ok)
        )
      );
      
      if (results.some(ok => !ok)) {
        setItems(previousItems);
        alert('순서 변경에 실패했습니다.');
      }
    } catch (error) {
      setItems(previousItems);
      console.error('순서 변경 실패:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">데일리 체크리스트</h1>
                  <p className="text-emerald-100 text-xs">매일 반복할 체크 항목 관리</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleAdd}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">항목 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 안내 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 mb-1">사용 방법</h2>
              <p className="text-sm text-gray-600">
                여기서 만든 체크리스트 항목들이 <strong>매일 캘린더</strong>에 자동으로 나타나요. 
                각 날짜의 체크박스를 눌러 하루를 마무리해보세요!
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">로딩중...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckSquare className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              체크리스트 항목이 없어요
            </h3>
            <p className="text-gray-500 mb-6">
              매일 반복할 체크 항목을 추가해보세요
            </p>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              첫 항목 추가
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${
                  !item.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 순서 컨트롤 */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleReorder(item, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="위로"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 12l5-5 5 5H5z" />
                      </svg>
                    </button>
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <button
                      onClick={() => handleReorder(item, 'down')}
                      disabled={index === items.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="아래로"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8l-5 5-5-5h10z" />
                      </svg>
                    </button>
                  </div>

                  {/* 이모지 */}
                  <div className="text-3xl flex-shrink-0">
                    {item.emoji || '✅'}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    {!item.is_active && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                        비활성
                      </span>
                    )}
                  </div>

                  {/* 액션 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      title={item.is_active ? '비활성화' : '활성화'}
                    >
                      {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">
                {editingItem ? '항목 수정' : '새 항목 추가'}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* 이모지 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이모지
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        formData.emoji === emoji
                          ? 'bg-emerald-100 ring-2 ring-emerald-500 scale-110'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 오늘의 업무 정리"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명 (선택)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="간단한 설명을 입력하세요"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 활성 여부 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer flex-1">
                  활성화 (캘린더에 표시)
                </label>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
