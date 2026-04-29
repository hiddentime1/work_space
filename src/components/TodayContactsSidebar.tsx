'use client';

import { useState, useEffect } from 'react';
import { Contact } from '@/types';
import { Phone, ChevronRight, Building2, MessageCircle, Users, Sparkles, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface TodayContactsSidebarProps {
  // props 제거 - 자체적으로 데이터 로드
}

export default function TodayContactsSidebar({}: TodayContactsSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 오늘 연락해야 할 거래처 로드
  const fetchTodayContacts = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/contacts?startDate=${today}&endDate=${today}&showCompleted=false`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error('오늘 거래처 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 접속 시 자동으로 열기 (하루에 한 번)
  useEffect(() => {
    fetchTodayContacts();
  }, []);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastSeen = localStorage.getItem('todayContactsSidebar_lastSeen');
    
    if (lastSeen !== today && contacts.length > 0) {
      setIsOpen(true);
    }
  }, [contacts.length]);

  // 사이드바를 닫을 때 오늘 본 것으로 기록
  const handleClose = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem('todayContactsSidebar_lastSeen', today);
    setIsOpen(false);
  };

  // 완료 처리 - 옵티미스틱 (즉시 리스트에서 제거)
  const handleToggleComplete = async (contact: Contact) => {
    const previousContacts = contacts;
    setContacts(prev => prev.filter(c => c.id !== contact.id));
    
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
      const result = await res.json();
      if (!result.success) {
        setContacts(previousContacts);
      }
    } catch (error) {
      setContacts(previousContacts);
    }
  };

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // 귀여운 응원 메시지
  const cheerMessages = [
    '오늘도 화이팅! 💪',
    '연락 한 번이면 OK! ✨',
    '당신은 일잘러! 🌟',
    '오늘 안에 해치우자! 🔥',
    '차근차근 하나씩! 🍀',
  ];
  const randomCheer = cheerMessages[Math.floor(Math.random() * cheerMessages.length)];

  return (
    <>
      {/* 토글 버튼 (사이드바가 닫혀있을 때) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-r-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1 group"
          title="오늘 연락할 업체"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {contacts.length > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {contacts.length}
              </span>
            )}
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      )}

      {/* 사이드바 */}
      <div
        className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full w-80 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 shadow-2xl border-r border-gray-200 flex flex-col">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 relative overflow-hidden">
            {/* 장식용 원들 */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white/10 rounded-full" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">오늘 연락할 업체</h2>
                  <p className="text-blue-100 text-xs">
                    {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">로딩중...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-10">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Sparkles className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="font-bold text-gray-700 mb-2">오늘은 연락할 곳이 없어요!</h3>
                <p className="text-gray-500 text-sm mb-4">
                  여유로운 하루 보내세요 ☕
                </p>
                <Link
                  href="/contacts"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  거래처 관리로 이동
                </Link>
              </div>
            ) : (
              <>
                {/* 응원 메시지 */}
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-3 border border-yellow-200 flex items-center gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      오늘 <span className="text-orange-600 font-bold">{contacts.length}곳</span>에 연락하세요!
                    </p>
                    <p className="text-xs text-gray-500">{randomCheer}</p>
                  </div>
                </div>

                {/* 업체 리스트 */}
                {contacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start gap-3">
                      {/* 순번 */}
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* 업체명 */}
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <h3 className="font-bold text-gray-800 truncate">
                            {contact.company_name}
                          </h3>
                        </div>
                        
                        {/* 연락 내용 */}
                        {contact.content && (
                          <div className="flex items-start gap-2 mb-2">
                            <MessageCircle className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {contact.content}
                            </p>
                          </div>
                        )}

                        {/* 담당자 & 전화번호 */}
                        {(contact.contact_person || contact.phone) && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            {contact.contact_person && (
                              <span>{contact.contact_person}</span>
                            )}
                            {contact.phone && (
                              <a 
                                href={`tel:${contact.phone}`}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                {contact.phone}
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* 우선순위 & 완료 버튼 */}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(contact.priority)}`}>
                            {contact.priority === 'urgent' ? '긴급' : 
                             contact.priority === 'high' ? '높음' :
                             contact.priority === 'medium' ? '보통' : '낮음'}
                          </span>
                          
                          <button
                            onClick={() => handleToggleComplete(contact)}
                            className="text-xs bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                          >
                            ✓ 완료
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* 푸터 - 거래처 관리 페이지 링크 */}
          <div className="p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
            <Link
              href="/contacts"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              거래처 관리 페이지로 이동
            </Link>
            <p className="text-xs text-gray-400 text-center mt-2">
              날짜별로 연락 일정을 관리하세요!
            </p>
          </div>
        </div>
      </div>

      {/* 오버레이 (모바일에서 사이드바 열렸을 때) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
}
