'use client';

import { useState, useEffect } from 'react';
import { Contact } from '@/types';
import { Phone, Building2, MessageCircle, Sparkles, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface TodayContactsSidebarProps {
  // props 제거 - 자체적으로 데이터 로드
}

export default function TodayContactsSidebar({}: TodayContactsSidebarProps) {
  // 초기 닫힘: 로드 시 화면을 가리지 않는다. 하루 1회 자동 열기는 아래 effect가 담당.
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모바일 여부 감지 (lg 미만 = 모바일/태블릿)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  useEffect(() => {
    fetchTodayContacts();
  }, []);

  // 접속 시 자동으로 한 번만 열기 (오늘 이미 본 경우 닫힌 채 유지)
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastSeen = localStorage.getItem('todayContactsSidebar_lastSeen');

    if (lastSeen !== today && contacts.length > 0) {
      setIsOpen(true);
    }
  }, [contacts.length]);

  // 닫을 때 오늘 본 것으로 기록
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

  // 우선순위 색상 (Toss weak 배지)
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-600';
      case 'high': return 'bg-orange-50 text-orange-700';
      case 'medium': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const priorityLabel = (priority: string) =>
    priority === 'urgent' ? '긴급' :
    priority === 'high' ? '높음' :
    priority === 'medium' ? '보통' : '낮음';

  // 리스트 본문 (데스크탑 사이드바 / 모바일 바텀시트 공용)
  const listBody = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">불러오는 중이에요</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-10">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">오늘은 연락할 곳이 없어요</h3>
          <p className="text-gray-500 text-sm mb-4">
            여유로운 하루 보내세요
          </p>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            거래처 관리로 이동
          </Link>
        </div>
      ) : (
        <>
          {/* 요약 */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-900">
              오늘 <span className="text-blue-600">{contacts.length}곳</span>에 연락하면 돼요
            </p>
            <p className="text-xs text-gray-500 mt-0.5">하나씩 차근차근 끝내볼까요?</p>
          </div>

          {/* 업체 리스트 */}
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 group"
            >
              <div className="flex items-start gap-3">
                {/* 순번 */}
                <div className="bg-blue-50 text-blue-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 업체명 */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-bold text-gray-900 truncate">
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
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-xl ${getPriorityColor(contact.priority)}`}>
                      {priorityLabel(contact.priority)}
                    </span>

                    <button
                      onClick={() => handleToggleComplete(contact)}
                      className="text-xs font-semibold bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      완료
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  // 헤더 (사이드바/바텀시트 공용)
  const header = (
    <div className="bg-blue-500 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">오늘 연락할 거래처</h2>
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
  );

  // 푸터 (사이드바/바텀시트 공용)
  const footer = (
    <div className="p-4 border-t border-gray-100 bg-white">
      <Link
        href="/contacts"
        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        거래처 관리 페이지로 이동
      </Link>
    </div>
  );

  // ===== 모바일: 바텀시트 + 우하단 위 플로팅 버튼 =====
  if (isMobile) {
    return (
      <>
        {/* 닫힘 상태: 좌하단 플로팅 버튼 (우하단 메모 버튼과 겹치지 않게) */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-blue-500 text-white pl-4 pr-3 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
            title="오늘 연락할 거래처"
          >
            <Phone className="w-5 h-5" />
            <span className="text-sm font-semibold">오늘 연락</span>
            {contacts.length > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {contacts.length}
              </span>
            )}
          </button>
        )}

        {/* 열림 상태: 바텀시트 */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={handleClose}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-2xl shadow-xl max-h-[85vh] modal-slide-up overflow-hidden">
              {/* 그랩 핸들 */}
              <div className="pt-2 pb-1 flex justify-center">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              {header}
              {listBody}
              {footer}
            </div>
          </>
        )}
      </>
    );
  }

  // ===== 데스크탑: 좌측 사이드바 드로어 =====
  return (
    <>
      {/* 닫힘 상태: 좌측 가장자리 토글 탭 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-blue-500 text-white p-3 rounded-r-2xl shadow-lg hover:bg-blue-600 transition-colors"
          title="오늘 연락할 거래처"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {contacts.length > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {contacts.length}
              </span>
            )}
          </div>
        </button>
      )}

      {/* 사이드바 */}
      <div
        className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full w-80 bg-white shadow-xl border-r border-gray-200 flex flex-col">
          {header}
          {listBody}
          {footer}
        </div>
      </div>
    </>
  );
}
