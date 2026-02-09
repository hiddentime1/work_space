'use client';

import { useState, useEffect, useMemo } from 'react';
import { Contact, CreateContactInput, UpdateContactInput, Priority } from '@/types';
import { 
  Phone, Plus, Building2, User, Calendar, ChevronLeft, ChevronRight, 
  Check, Trash2, Edit3, X, ArrowLeft, Sparkles, MessageCircle,
  AlertCircle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays, startOfDay, isSameDay, isToday, isBefore, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // 날짜 탭 관련
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  
  // 폼 데이터
  const [formData, setFormData] = useState<CreateContactInput>({
    company_name: '',
    contact_date: format(new Date(), 'yyyy-MM-dd'),
    content: '',
    contact_person: '',
    phone: '',
    priority: 'medium',
  });

  // 7일 날짜 배열 생성
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [weekOffset]);

  // 선택된 날짜
  const selectedDate = dateRange[selectedDateIndex];

  // 선택된 날짜의 거래처 목록
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const contactDate = parseISO(contact.contact_date);
      return isSameDay(contactDate, selectedDate);
    });
  }, [contacts, selectedDate]);

  // 날짜별 연락 개수 계산
  const contactCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(contact => {
      if (!contact.is_completed) {
        const dateKey = contact.contact_date;
        counts[dateKey] = (counts[dateKey] || 0) + 1;
      }
    });
    return counts;
  }, [contacts]);

  // 데이터 로드
  const fetchContacts = async () => {
    try {
      const startDate = format(dateRange[0], 'yyyy-MM-dd');
      const endDate = format(dateRange[6], 'yyyy-MM-dd');
      
      const res = await fetch(
        `/api/contacts?startDate=${startDate}&endDate=${endDate}&showCompleted=${showCompleted}`
      );
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error('거래처 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchContacts();
  }, [weekOffset, showCompleted]);

  // 주 변경 시 오늘이 포함되어 있으면 오늘로 선택
  useEffect(() => {
    const todayIndex = dateRange.findIndex(date => isToday(date));
    if (todayIndex !== -1) {
      setSelectedDateIndex(todayIndex);
    } else {
      setSelectedDateIndex(0);
    }
  }, [weekOffset]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_date: format(selectedDate, 'yyyy-MM-dd'),
      content: '',
      contact_person: '',
      phone: '',
      priority: 'medium',
    });
    setEditingContact(null);
  };

  // 거래처 추가/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      alert('거래처명을 입력해주세요.');
      return;
    }

    try {
      if (editingContact) {
        const res = await fetch(`/api/contacts/${editingContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          fetchContacts();
          setShowForm(false);
          resetForm();
        }
      } else {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          fetchContacts();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // 완료 토글
  const handleToggleComplete = async (contact: Contact) => {
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !contact.is_completed }),
      });
      const result = await res.json();
      if (result.success) {
        fetchContacts();
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchContacts();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // 수정 모드
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      company_name: contact.company_name,
      contact_date: contact.contact_date,
      content: contact.content || '',
      contact_person: contact.contact_person || '',
      phone: contact.phone || '',
      priority: contact.priority,
    });
    setShowForm(true);
  };

  // 새로 추가 시 선택된 날짜로 설정
  const handleAdd = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      contact_date: format(selectedDate, 'yyyy-MM-dd'),
    }));
    setShowForm(true);
  };

  // 우선순위 색상
  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      default: return '낮음';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-500 to-purple-500 text-white sticky top-0 z-40 shadow-lg">
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
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">거래처 연락</h1>
                  <p className="text-blue-100 text-xs">날짜별 연락 관리</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleAdd}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* 날짜 탭 네비게이션 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3">
            {/* 이전 주 */}
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* 날짜 탭들 */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 min-w-max">
                {dateRange.map((date, index) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const count = contactCountByDate[dateKey] || 0;
                  const isSelected = index === selectedDateIndex;
                  const isPast = isBefore(date, startOfDay(new Date())) && !isToday(date);
                  
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDateIndex(index)}
                      className={`relative px-3 py-2 rounded-xl transition-all flex-shrink-0 min-w-[60px] ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                          : isPast
                          ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="text-[10px] font-medium opacity-80">
                        {format(date, 'EEE', { locale: ko })}
                      </div>
                      <div className={`text-lg font-bold ${isToday(date) && !isSelected ? 'text-blue-600' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      {count > 0 && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                          isSelected 
                            ? 'bg-white text-blue-600' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {count}
                        </div>
                      )}
                      {isToday(date) && !isSelected && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 다음 주 */}
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 현재 선택된 날짜 & 옵션 */}
          <div className="flex items-center justify-between pb-3 border-t border-gray-100 pt-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {format(selectedDate, 'yyyy년 M월 d일 EEEE', { locale: ko })}
              </span>
              {isToday(selectedDate) && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  오늘
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300"
              />
              완료 포함
            </label>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">로딩중...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Sparkles className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {isToday(selectedDate) ? '오늘은 연락할 곳이 없어요!' : '이 날은 연락할 곳이 없어요!'}
            </h3>
            <p className="text-gray-500 mb-6">
              {isToday(selectedDate) ? '여유로운 하루 보내세요 ☕' : '거래처 연락을 추가해보세요'}
            </p>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              거래처 추가
            </button>
            
            {/* 도움말 */}
            <div className="bg-white/60 rounded-xl p-4 mt-8 text-left border border-white max-w-md mx-auto">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                도움말
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>거래처명</strong>과 <strong>연락 내용</strong>을 입력해보세요</li>
                <li>• 담당자, 전화번호도 함께 기록할 수 있어요</li>
                <li>• 날짜 탭을 스와이프해서 다른 날짜로 이동하세요</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${
                  contact.is_completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 체크박스 */}
                  <button
                    onClick={() => handleToggleComplete(contact)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      contact.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {contact.is_completed && <Check className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* 거래처명 */}
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <h3 className={`font-bold text-gray-800 ${contact.is_completed ? 'line-through' : ''}`}>
                        {contact.company_name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityStyle(contact.priority)}`}>
                        {getPriorityLabel(contact.priority)}
                      </span>
                    </div>

                    {/* 내용 */}
                    {contact.content && (
                      <div className="flex items-start gap-2 mb-2">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{contact.content}</p>
                      </div>
                    )}

                    {/* 담당자 & 전화번호 */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {contact.contact_person && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {contact.contact_person}
                        </span>
                      )}
                      {contact.phone && (
                        <a 
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
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
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">
                {editingContact ? '거래처 수정' : '거래처 추가'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* 거래처명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래처명 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="예: ABC 주식회사"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              {/* 연락 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락 날짜 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.contact_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 연락 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락 내용
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="예: 견적서 발송 요청, 납품 일정 확인"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 담당자 & 전화번호 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="홍길동"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-1234-5678"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우선순위
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.priority === p
                          ? getPriorityStyle(p) + ' ring-2 ring-offset-1'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {getPriorityLabel(p)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                >
                  {editingContact ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
