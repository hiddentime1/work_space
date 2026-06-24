'use client';

import { useState, useEffect } from 'react';
import { Task, Contact } from '@/types';
import {
  StickyNote,
  Phone,
  PauseCircle,
  X,
  Save,
  Building2,
  MessageCircle,
  Sparkles,
  ExternalLink,
  CalendarPlus,
  Trash2,
  Users,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

type MenuKey = 'memo' | 'contacts' | 'onhold';

interface WorkSidebarProps {
  onSaveMemo: (content: string) => void;
  onHoldTasks: Task[];
  onAssignDate: (taskId: string, dateStr: string) => void;
  onUnhold: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function WorkSidebar({
  onSaveMemo,
  onHoldTasks,
  onAssignDate,
  onUnhold,
  onDeleteTask,
}: WorkSidebarProps) {
  const [active, setActive] = useState<MenuKey | null>(null);

  // ===== 메모 =====
  const [memoContent, setMemoContent] = useState('');
  const handleSaveMemo = () => {
    const trimmed = memoContent.trim();
    if (!trimmed) return;
    onSaveMemo(trimmed);
    setMemoContent('');
    setActive(null);
  };

  // ===== 거래처 =====
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const fetchTodayContacts = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/contacts?startDate=${today}&endDate=${today}&showCompleted=false`);
      const data = await res.json();
      if (data.success) setContacts(data.data);
    } catch (error) {
      console.error('오늘 거래처 로드 실패:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayContacts();
  }, []);

  // 접속 시 오늘 처음이면 거래처 패널 자동 열기
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastSeen = localStorage.getItem('todayContactsSidebar_lastSeen');
    if (lastSeen !== today && contacts.length > 0) {
      setActive('contacts');
    }
  }, [contacts.length]);

  const handleCompleteContact = async (contact: Contact) => {
    const prev = contacts;
    setContacts((c) => c.filter((x) => x.id !== contact.id));
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
      const result = await res.json();
      if (!result.success) setContacts(prev);
    } catch {
      setContacts(prev);
    }
  };

  const close = () => {
    if (active === 'contacts') {
      const today = format(new Date(), 'yyyy-MM-dd');
      localStorage.setItem('todayContactsSidebar_lastSeen', today);
    }
    setActive(null);
  };

  const toggle = (key: MenuKey) => {
    if (active === key) close();
    else setActive(key);
  };

  const priorityColor = (p: string) =>
    p === 'urgent' ? 'bg-red-50 text-red-600'
    : p === 'high' ? 'bg-orange-50 text-orange-700'
    : p === 'medium' ? 'bg-blue-50 text-blue-700'
    : 'bg-gray-100 text-gray-600';
  const priorityLabel = (p: string) =>
    p === 'urgent' ? '긴급' : p === 'high' ? '높음' : p === 'medium' ? '보통' : '낮음';

  const menus: { key: MenuKey; icon: typeof StickyNote; label: string; badge?: number }[] = [
    { key: 'memo', icon: StickyNote, label: '메모' },
    { key: 'contacts', icon: Phone, label: '거래처', badge: contacts.length },
    { key: 'onhold', icon: PauseCircle, label: '보류', badge: onHoldTasks.length },
  ];

  return (
    <>
      {/* 좌측 아이콘 레일 */}
      <nav
        className="fixed z-40 bg-white border-gray-200 flex
                   inset-x-0 bottom-0 h-16 flex-row items-stretch justify-around border-t
                   md:inset-x-auto md:left-0 md:top-0 md:h-full md:w-16 md:flex-col md:items-center md:justify-start md:border-t-0 md:border-r md:pt-20 md:gap-1"
      >
        {menus.map(({ key, icon: Icon, label, badge }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors
                       flex-1 md:flex-none md:w-12 md:h-14 md:rounded-xl
                       ${active === key ? 'text-blue-600 md:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}
            title={label}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
            {badge ? (
              <span className="absolute top-1.5 right-1/2 translate-x-3 md:right-1 md:translate-x-0 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* 패널 + 백드롭 */}
      {active && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30 lg:bg-black/10" onClick={close} />
          <div
            className="fixed bg-white shadow-xl z-40 flex flex-col modal-slide-up
                       inset-x-0 bottom-16 max-h-[72vh] rounded-t-2xl border-t border-gray-200
                       md:inset-x-auto md:left-16 md:top-0 md:bottom-0 md:max-h-none md:h-full md:w-[340px] md:max-w-[calc(100vw-4rem)] md:rounded-none md:border-t-0 md:border-r"
          >
            {/* ===== 메모 패널 ===== */}
            {active === 'memo' && (
              <>
                <PanelHeader icon={StickyNote} title="빠른 메모" onClose={close} />
                <div className="flex-1 p-4 flex flex-col">
                  <textarea
                    value={memoContent}
                    onChange={(e) => setMemoContent(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSaveMemo();
                    }}
                    placeholder="메모를 입력하세요..."
                    autoFocus
                    className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800
                               placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">Ctrl+Enter로 저장</span>
                    <button
                      onClick={handleSaveMemo}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                  </div>
                  <Link
                    href="/memos"
                    className="mt-3 text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                  >
                    메모 목록 보기 →
                  </Link>
                </div>
              </>
            )}

            {/* ===== 거래처 패널 ===== */}
            {active === 'contacts' && (
              <>
                <PanelHeader
                  icon={Phone}
                  title="오늘 연락할 거래처"
                  subtitle={format(new Date(), 'M월 d일 EEEE', { locale: ko })}
                  onClose={close}
                />
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {contactsLoading ? (
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
                      <p className="text-gray-500 text-sm">여유로운 하루 보내세요</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 rounded-2xl p-4">
                        <p className="text-sm font-semibold text-gray-900">
                          오늘 <span className="text-blue-600">{contacts.length}곳</span>에 연락하면 돼요
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">하나씩 차근차근 끝내볼까요?</p>
                      </div>
                      {contacts.map((contact, index) => (
                        <div key={contact.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-50 text-blue-600 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <h3 className="font-bold text-gray-900 truncate">{contact.company_name}</h3>
                              </div>
                              {contact.content && (
                                <div className="flex items-start gap-2 mb-2">
                                  <MessageCircle className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-gray-500 line-clamp-2">{contact.content}</p>
                                </div>
                              )}
                              {(contact.contact_person || contact.phone) && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                  {contact.contact_person && <span>{contact.contact_person}</span>}
                                  {contact.phone && (
                                    <a href={`tel:${contact.phone}`} className="text-blue-500 hover:text-blue-600">
                                      {contact.phone}
                                    </a>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-xl ${priorityColor(contact.priority)}`}>
                                  {priorityLabel(contact.priority)}
                                </span>
                                <button
                                  onClick={() => handleCompleteContact(contact)}
                                  className="text-xs font-semibold bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
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
                <div className="p-4 border-t border-gray-100">
                  <Link
                    href="/contacts"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    거래처 관리 페이지로 이동
                  </Link>
                </div>
              </>
            )}

            {/* ===== 보류 업무 패널 ===== */}
            {active === 'onhold' && (
              <>
                <PanelHeader
                  icon={PauseCircle}
                  title="보류 업무"
                  subtitle={`${onHoldTasks.length}개 보류 중`}
                  onClose={close}
                />
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {onHoldTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PauseCircle className="w-8 h-8 text-amber-400" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">보류 중인 업무가 없어요</h3>
                      <p className="text-gray-500 text-sm">
                        업무의 <PauseCircle className="w-3.5 h-3.5 inline -mt-0.5 text-amber-500" /> 버튼을 누르면 여기로 모여요
                      </p>
                    </div>
                  ) : (
                    onHoldTasks.map((task) => (
                      <OnHoldCard
                        key={task.id}
                        task={task}
                        onAssignDate={onAssignDate}
                        onUnhold={onUnhold}
                        onDelete={onDeleteTask}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ===== 패널 헤더 =====
function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  onClose,
}: {
  icon: typeof StickyNote;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="bg-gray-100 p-2 rounded-xl">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <X className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
}

// ===== 보류 업무 카드 =====
function OnHoldCard({
  task,
  onAssignDate,
  onUnhold,
  onDelete,
}: {
  task: Task;
  onAssignDate: (taskId: string, dateStr: string) => void;
  onUnhold: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [showAssign, setShowAssign] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-[15px] leading-snug flex-1 min-w-0">{task.title}</h3>
        <button
          onClick={() => {
            if (confirm('이 업무를 삭제하시겠습니까?')) onDelete(task.id);
          }}
          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {task.description && (
        <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap break-words">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {task.task_type === 'meeting' && (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 flex items-center gap-1">
            <Users className="w-3 h-3" />
            미팅
          </span>
        )}
        {(task.priority === 'urgent' || task.priority === 'high') && (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${task.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
            {task.priority === 'urgent' ? '긴급' : '높음'}
          </span>
        )}
        {task.category && (
          <span className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 text-gray-500">{task.category}</span>
        )}
      </div>

      {/* 날짜 배정 */}
      {!showAssign ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowAssign(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-semibold transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            날짜 배정하기
          </button>
          <button
            onClick={() => onUnhold(task.id)}
            className="px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            title="보류 해제 (대기 상태로)"
          >
            해제
          </button>
        </div>
      ) : (
        <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onAssignDate(task.id, todayStr)}
              className="flex-1 py-2 bg-white border border-gray-200 hover:border-blue-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              오늘
            </button>
            <button
              onClick={() => onAssignDate(task.id, tomorrowStr)}
              className="flex-1 py-2 bg-white border border-gray-200 hover:border-blue-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              내일
            </button>
          </div>
          <input
            type="date"
            min={todayStr}
            onChange={(e) => {
              if (e.target.value) onAssignDate(task.id, e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            onClick={() => setShowAssign(false)}
            className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
