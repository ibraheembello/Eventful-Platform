import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineTicket, HiOutlineShieldCheck, HiOutlineChartBar, HiOutlineBell,
  HiOutlineQrcode, HiOutlineCurrencyDollar, HiOutlineMoon, HiOutlineSun,
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineArrowRight,
  HiOutlineBookmark, HiOutlineClipboardList, HiOutlineDocumentDownload,
  HiOutlineUserGroup, HiOutlineCheck, HiOutlineStar, HiOutlineMenu, HiOutlineX,
  HiOutlineSearch, HiOutlineChatAlt2, HiOutlineMail, HiOutlinePhotograph,
  HiOutlineTag, HiOutlineSwitchHorizontal, HiOutlineClock,
  HiOutlineGlobeAlt, HiOutlineLightBulb, HiOutlineHeart,
} from 'react-icons/hi';
import api from '../lib/api';
import type { Event } from '../types';
import { format } from 'date-fns';

/* ─── Scroll Reveal Hook ─── */

function useScrollReveal(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    // Observe the container itself and all .reveal children
    const children = el.querySelectorAll('.reveal:not(.visible)');
    children.forEach((child) => observer.observe(child));
    if (el.classList.contains('reveal') && !el.classList.contains('visible')) observer.observe(el);

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/* ─── Animated Counter Hook ─── */

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─── CSS Mockup Components ─── */

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[8px] border-gray-800 dark:border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="bg-gray-50 dark:bg-slate-900 pt-8 pb-4 px-3 min-h-[480px]">
          {/* Status bar */}
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 rounded-sm bg-gray-800 dark:bg-gray-200" />
              <div className="w-3.5 h-2 rounded-sm bg-gray-800 dark:bg-gray-200" />
            </div>
          </div>
          {/* App header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Eventful</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[8px] font-bold">IB</div>
          </div>
          {/* Search */}
          <div className="bg-gray-200/80 dark:bg-slate-800 rounded-lg px-3 py-1.5 mb-4">
            <span className="text-[10px] text-gray-400">Search events...</span>
          </div>
          {/* Mini event cards */}
          {[
            { title: 'Afro Music Fest', cat: 'Music', color: 'from-purple-500 to-pink-600', price: '5,000' },
            { title: 'Tech Summit 2026', cat: 'Tech', color: 'from-blue-500 to-cyan-600', price: '15,000' },
            { title: 'Food & Wine Night', cat: 'Food', color: 'from-orange-500 to-red-500', price: 'Free' },
          ].map((e) => (
            <div key={e.title} className="mb-3 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className={`h-20 bg-gradient-to-br ${e.color} relative`}>
                <span className="absolute top-2 left-2 text-[8px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">{e.cat}</span>
                <span className="absolute bottom-2 right-2 text-white text-[20px] font-bold opacity-20">{e.title[0]}</span>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mb-1">{e.title}</p>
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">Mar 15, 2026</span>
                </div>
                <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-emerald-600">{e.price === 'Free' ? 'Free' : `NGN ${e.price}`}</span>
                  <span className="text-[8px] text-gray-400">120/500</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full -z-10" />
    </div>
  );
}

function DashboardMockup() {
  const bars = [
    { label: 'Music Fest', revenue: 85, tickets: 70 },
    { label: 'Tech Summit', revenue: 65, tickets: 90 },
    { label: 'Food Night', revenue: 45, tickets: 55 },
    { label: 'Art Show', revenue: 75, tickets: 60 },
    { label: 'Comedy', revenue: 55, tickets: 80 },
  ];
  return (
    <div className="relative">
      {/* Browser frame */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500">
              eventful-platform.com/analytics
            </div>
          </div>
        </div>
        {/* Dashboard content */}
        <div className="p-5">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Events', value: '26', color: 'text-emerald-600' },
              { label: 'Tickets Sold', value: '1,847', color: 'text-blue-600' },
              { label: 'Revenue', value: 'NGN 2.4M', color: 'text-purple-600' },
              { label: 'Attendees', value: '1,203', color: 'text-orange-600' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Revenue vs Tickets by Event</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-gray-500">Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-[9px] text-gray-500">Tickets</span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-3 h-32">
              {bars.map((b) => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end justify-center h-24">
                    <div
                      className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-500"
                      style={{ height: `${b.revenue}%` }}
                    />
                    <div
                      className="w-3 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-sm transition-all duration-500"
                      style={{ height: `${b.tickets}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-400 truncate w-full text-center">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Donut + Leaderboard */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Donut */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 mb-3">Ticket Status</p>
              <div className="relative w-20 h-20 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-emerald-500" strokeDasharray="55 100" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-teal-400" strokeDasharray="30 100" strokeDashoffset="-55" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-red-400" strokeDasharray="15 100" strokeDashoffset="-85" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">1,847</span>
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-2">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[8px] text-gray-500">Active</span></div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-teal-400" /><span className="text-[8px] text-gray-500">Used</span></div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-[8px] text-gray-500">Cancelled</span></div>
              </div>
            </div>
            {/* Leaderboard */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 mb-2">Top Events</p>
              {[
                { rank: 1, name: 'Music Fest', rev: 'NGN 850K', medal: 'text-yellow-500' },
                { rank: 2, name: 'Tech Summit', rev: 'NGN 650K', medal: 'text-gray-400' },
                { rank: 3, name: 'Art Show', rev: 'NGN 420K', medal: 'text-amber-700' },
              ].map((e) => (
                <div key={e.rank} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-slate-700 last:border-0">
                  <span className={`text-[10px] font-bold ${e.medal}`}>#{e.rank}</span>
                  <span className="text-[9px] text-gray-700 dark:text-gray-300 flex-1 truncate">{e.name}</span>
                  <span className="text-[9px] font-semibold text-emerald-600">{e.rev}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl rounded-full -z-10" />
    </div>
  );
}

function TicketMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-gray-800 dark:border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-2xl z-10" />
        <div className="bg-gray-50 dark:bg-slate-900 pt-8 pb-4 px-3 min-h-[480px]">
          {/* Status bar */}
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 rounded-sm bg-gray-800 dark:bg-gray-200" />
              <div className="w-3.5 h-2 rounded-sm bg-gray-800 dark:bg-gray-200" />
            </div>
          </div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">My Tickets</span>
            <span className="text-[9px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">3 Active</span>
          </div>
          {/* Ticket card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-bold">Afro Music Festival</p>
                  <p className="text-[9px] opacity-80 mt-0.5">Lagos, Nigeria</p>
                </div>
                <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <div className="flex gap-4 text-[9px] opacity-80">
                <span>Mar 15, 2026</span>
                <span>7:00 PM</span>
              </div>
            </div>
            {/* Tear line */}
            <div className="relative">
              <div className="absolute left-0 top-0 -translate-y-1/2 w-4 h-4 bg-gray-50 dark:bg-slate-900 rounded-full -translate-x-1/2" />
              <div className="absolute right-0 top-0 -translate-y-1/2 w-4 h-4 bg-gray-50 dark:bg-slate-900 rounded-full translate-x-1/2" />
              <div className="border-t-2 border-dashed border-gray-200 dark:border-slate-600 mx-4" />
            </div>
            {/* QR Code area */}
            <div className="p-4 flex flex-col items-center">
              {/* QR pattern */}
              <div className="w-28 h-28 bg-white p-2 rounded-lg shadow-inner mb-3">
                <div className="w-full h-full grid grid-cols-9 grid-rows-9 gap-px">
                  {Array.from({ length: 81 }).map((_, i) => {
                    const row = Math.floor(i / 9);
                    const col = i % 9;
                    const isCorner = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
                    const isFilled = isCorner || (i * 7 + 3) % 3 === 0;
                    return (
                      <div
                        key={i}
                        className={`rounded-[1px] ${isFilled ? 'bg-gray-900' : 'bg-white'}`}
                      />
                    );
                  })}
                </div>
              </div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">TKT-a8f3b2e1</p>
              <div className="flex gap-2 mt-3 w-full">
                <button className="flex-1 text-[9px] py-1.5 bg-emerald-600 text-white rounded-lg font-medium">Download PDF</button>
                <button className="flex-1 text-[9px] py-1.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium">View QR</button>
              </div>
            </div>
          </div>
          {/* Second ticket preview */}
          <div className="mt-3 bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">T</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">Tech Summit 2026</p>
              <p className="text-[8px] text-gray-500 dark:text-gray-400">Apr 20, 2026</p>
            </div>
            <span className="text-[8px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full flex-shrink-0">ACTIVE</span>
          </div>
        </div>
      </div>
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl rounded-full -z-10" />
    </div>
  );
}

function AttendeeTableMockup() {
  return (
    <div className="relative">
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-[10px] text-gray-400">
              eventful-platform.com/events/.../attendees
            </div>
          </div>
        </div>
        <div className="p-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total', value: '487', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
              { label: 'Checked In', value: '342', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
              { label: 'Remaining', value: '128', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
              { label: 'Cancelled', value: '17', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-lg p-2.5 text-center`}>
                <p className={`text-base font-bold ${s.text}`}>{s.value}</p>
                <p className="text-[8px] text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[9px] text-gray-500 dark:text-gray-400 mb-1">
              <span>Check-in Progress</span>
              <span className="font-semibold text-emerald-600">70.2%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '70%' }} />
            </div>
          </div>
          {/* Table */}
          <div className="border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800">
                  <th className="text-[9px] font-semibold text-gray-600 dark:text-gray-300 text-left p-2.5">Attendee</th>
                  <th className="text-[9px] font-semibold text-gray-600 dark:text-gray-300 text-left p-2.5">Status</th>
                  <th className="text-[9px] font-semibold text-gray-600 dark:text-gray-300 text-right p-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ada Okonkwo', email: 'ada@email.com', status: 'Checked In', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                  { name: 'Chidi Nwosu', email: 'chidi@email.com', status: 'Active', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                  { name: 'Fatima Yusuf', email: 'fatima@email.com', status: 'Checked In', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                  { name: 'Emeka Eze', email: 'emeka@email.com', status: 'Active', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                ].map((a) => (
                  <tr key={a.name} className="border-t border-gray-50 dark:border-slate-800">
                    <td className="p-2.5">
                      <p className="text-[10px] font-medium text-gray-800 dark:text-gray-200">{a.name}</p>
                      <p className="text-[8px] text-gray-400">{a.email}</p>
                    </td>
                    <td className="p-2.5">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-medium ${a.color}`}>{a.status}</span>
                    </td>
                    <td className="p-2.5 text-right">
                      {a.status === 'Active' && (
                        <button className="text-[8px] px-2 py-1 bg-emerald-600 text-white rounded-md">Check In</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl rounded-full -z-10" />
    </div>
  );
}

function WaitlistMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-gray-800 dark:border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-2xl z-10" />
        <div className="bg-gray-50 dark:bg-slate-900 pt-8 pb-4 px-3 min-h-[480px]">
          {/* Status bar */}
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">9:41</span>
            <div className="flex gap-1">
              <div className="w-3.5 h-2 rounded-sm bg-gray-800 dark:bg-gray-200" />
              <div className="w-3.5 h-2 rounded-sm bg-gray-800 dark:bg-gray-200" />
            </div>
          </div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Eventful</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[8px] font-bold">IB</div>
          </div>

          {/* Sold out event card */}
          <div className="mb-3 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="h-24 bg-gradient-to-br from-amber-500 to-orange-600 relative">
              <span className="absolute top-2 left-2 text-[8px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">Music</span>
              <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">SOLD OUT</div>
              <span className="absolute bottom-2 right-2 text-white text-[24px] font-bold opacity-20">A</span>
            </div>
            <div className="p-3">
              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mb-1">Afro Beats Live Concert</p>
              <div className="flex items-center gap-1 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Mar 22, 2026 &bull; Lagos</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-red-500">500/500 tickets</span>
                <span className="text-[10px] font-semibold text-emerald-600">NGN 8,000</span>
              </div>
            </div>
          </div>

          {/* Join Waitlist button */}
          <button className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold rounded-xl mb-3 shadow-lg">
            Join Waitlist
          </button>

          {/* Waitlist position card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-amber-200 dark:border-amber-900/40 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <HiOutlineClock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">You are on the waitlist</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Afro Beats Live Concert</p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Your Position</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">#3</p>
              <p className="text-[8px] text-gray-500 dark:text-gray-400">out of 12 people waiting</p>
            </div>
          </div>

          {/* Notification card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-emerald-200 dark:border-emerald-900/40 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <HiOutlineBell className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">A spot opened up!</p>
                <p className="text-[8px] text-gray-500 dark:text-gray-400">You can now purchase a ticket</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-3xl rounded-full -z-10" />
    </div>
  );
}

/* ─── Testimonial Data ─── */
const testimonials = [
  { name: 'Adaeze Okoro', role: 'Event Creator', text: 'Eventful transformed how I manage my events. The QR check-in system is flawless and the analytics dashboard helps me make better decisions.' },
  { name: 'Tunde Adeyemi', role: 'Music Promoter', text: 'Sold out my concert in 3 hours using Eventful. The waitlist feature kept my audience engaged even after tickets were gone.' },
  { name: 'Ngozi Eze', role: 'Conference Organizer', text: 'The attendee management tools are incredible. I can track check-ins in real-time and export reports with one click.' },
];

/* ─── Main Component ─── */

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  // Scroll reveal refs
  const statsRef = useScrollReveal();
  const showcase1Ref = useScrollReveal();
  const showcase2Ref = useScrollReveal();
  const showcase3Ref = useScrollReveal();
  const showcase4Ref = useScrollReveal();
  const featuresGridRef = useScrollReveal();
  const featuredEventsRef = useScrollReveal([featuredEvents.length]);
  const testimonialsRef = useScrollReveal();
  const aboutRef = useScrollReveal();
  const howItWorksRef = useScrollReveal();
  const contactRef = useScrollReveal();

  // Animated counters
  const eventsCounter = useCountUp(26, 1200);
  const ticketsCounter = useCountUp(1800, 1500);
  const attendeesCounter = useCountUp(1200, 1500);

  useEffect(() => {
    api.get('/events', { params: { limit: 6 } })
      .then((res) => setFeaturedEvents(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenu(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] transition-colors duration-200">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[rgb(var(--bg-primary))]/80 border-b border-[rgb(var(--border-primary))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Eventful
          </span>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/events" className="text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Events</Link>
            <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#about" onClick={(e) => handleSmoothScroll(e, 'about')} className="text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About</a>
            <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#contact" onClick={(e) => handleSmoothScroll(e, 'contact')} className="text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-[rgb(var(--bg-secondary))] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
            </button>
            {user ? (
              <>
                <Link to="/events" className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="flex items-center gap-2">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button type="button" onClick={toggleTheme} className="p-2 text-[rgb(var(--text-secondary))]" aria-label="Toggle theme">
              {theme === 'light' ? <HiOutlineMoon className="w-5 h-5" /> : <HiOutlineSun className="w-5 h-5" />}
            </button>
            <button type="button" onClick={() => setMobileMenu(!mobileMenu)} className="p-2 text-[rgb(var(--text-secondary))]" aria-label="Toggle menu">
              {mobileMenu ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] px-4 py-4 space-y-3">
            <Link to="/events" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600" onClick={() => setMobileMenu(false)}>Events</Link>
            <a href="#features" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600" onClick={(e) => handleSmoothScroll(e, 'features')}>Features</a>
            <a href="#about" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600" onClick={(e) => handleSmoothScroll(e, 'about')}>About</a>
            <a href="#how-it-works" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600" onClick={(e) => handleSmoothScroll(e, 'how-it-works')}>How It Works</a>
            <a href="#contact" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600" onClick={(e) => handleSmoothScroll(e, 'contact')}>Contact</a>
            <div className="pt-3 border-t border-[rgb(var(--border-primary))] flex gap-3">
              {user ? (
                <Link to="/events" className="flex-1 text-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg" onClick={() => setMobileMenu(false)}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1 text-center px-4 py-2 border border-[rgb(var(--border-secondary))] text-[rgb(var(--text-primary))] text-sm font-medium rounded-lg" onClick={() => setMobileMenu(false)}>Login</Link>
                  <Link to="/register" className="flex-1 text-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg" onClick={() => setMobileMenu(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900" />
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-8 animate-[fadeIn_0.6s_ease-out]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                The #1 Event Management Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[rgb(var(--text-primary))] leading-tight mb-6 animate-[fadeIn_0.8s_ease-out]">
                Create, Discover &{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Experience
                </span>{' '}
                Unforgettable Events
              </h1>
              <p className="text-lg sm:text-xl text-[rgb(var(--text-secondary))] mb-10 max-w-xl mx-auto lg:mx-0 animate-[fadeIn_1s_ease-out]">
                From concert halls to conference rooms. Manage events, sell tickets with secure QR codes, track analytics, and grow your audience — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start animate-[fadeIn_1.2s_ease-out]">
                {user ? (
                  <Link
                    to="/events"
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Start for Free
                    </Link>
                    <Link
                      to="/events"
                      className="w-full sm:w-auto px-8 py-3.5 border border-[rgb(var(--border-secondary))] text-[rgb(var(--text-primary))] font-semibold rounded-xl hover:bg-[rgb(var(--bg-secondary))] transition-all"
                    >
                      Browse Events
                    </Link>
                  </>
                )}
              </div>
              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start animate-[fadeIn_1.4s_ease-out]">
                <div className="flex -space-x-2">
                  {['bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-orange-500'].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <HiOutlineStar key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">Trusted by event creators</p>
                </div>
              </div>
            </div>
            {/* Right - Phone Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="transform hover:scale-[1.02] transition-transform duration-500">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-secondary))]" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: `${eventsCounter.count}+`, label: 'Events Created', icon: <HiOutlineCalendar className="w-6 h-6" />, counterRef: eventsCounter.ref },
              { value: `${ticketsCounter.count.toLocaleString()}+`, label: 'Tickets Sold', icon: <HiOutlineTicket className="w-6 h-6" />, counterRef: ticketsCounter.ref },
              { value: `${attendeesCounter.count.toLocaleString()}+`, label: 'Happy Attendees', icon: <HiOutlineUserGroup className="w-6 h-6" />, counterRef: attendeesCounter.ref },
              { value: '99.9%', label: 'Uptime', icon: <HiOutlineShieldCheck className="w-6 h-6" />, counterRef: null },
            ].map((stat, i) => (
              <div key={stat.label} className={`reveal reveal-delay-${i + 1} text-center`} ref={stat.counterRef}>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  {stat.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">{stat.value}</p>
                <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 1: Analytics Dashboard ─── */}
      <section id="features" className="py-20 lg:py-28 bg-[rgb(var(--bg-primary))]" ref={showcase1Ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal order-2 lg:order-1">
              <DashboardMockup />
            </div>
            <div className="reveal reveal-delay-2 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium mb-4">
                <HiOutlineChartBar className="w-3.5 h-3.5" /> Analytics
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
                Real-time Analytics Dashboard
              </h2>
              <p className="text-lg text-[rgb(var(--text-secondary))] mb-8">
                Make data-driven decisions with comprehensive charts and insights. Track every metric that matters for your events.
              </p>
              <div className="space-y-4">
                {[
                  'Revenue & ticket sales bar charts',
                  'Ticket status donut chart (active, used, cancelled)',
                  'Top events leaderboard with rank badges',
                  'Per-event performance breakdown',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HiOutlineCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[rgb(var(--text-secondary))]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 2: QR Tickets & PDF ─── */}
      <section className="py-20 lg:py-28 bg-[rgb(var(--bg-secondary))]" ref={showcase2Ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-4">
                <HiOutlineQrcode className="w-3.5 h-3.5" /> Ticketing
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
                Smart QR Tickets with PDF Export
              </h2>
              <p className="text-lg text-[rgb(var(--text-secondary))] mb-8">
                Every ticket comes with a unique QR code. Download as beautifully designed PDF tickets, ready for print or mobile.
              </p>
              <div className="space-y-4">
                {[
                  'Unique QR codes for fraud-proof entry',
                  'Download tickets as professional PDF documents',
                  'Instant scan-and-verify at the door',
                  'Track ticket status: active, used, cancelled',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HiOutlineCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[rgb(var(--text-secondary))]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal reveal-delay-2 flex justify-center lg:justify-end">
              <div className="transform hover:scale-[1.02] transition-transform duration-500">
                <TicketMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 3: Attendee Management ─── */}
      <section className="py-20 lg:py-28 bg-[rgb(var(--bg-primary))]" ref={showcase3Ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal order-2 lg:order-1">
              <AttendeeTableMockup />
            </div>
            <div className="reveal reveal-delay-2 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium mb-4">
                <HiOutlineClipboardList className="w-3.5 h-3.5" /> Management
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
                Complete Attendee Management
              </h2>
              <p className="text-lg text-[rgb(var(--text-secondary))] mb-8">
                Track every attendee from purchase to check-in. Search, filter, sort, and manage your event's audience with powerful tools.
              </p>
              <div className="space-y-4">
                {[
                  'Real-time check-in progress tracking',
                  'Search attendees by name or email',
                  'Manual check-in with one click',
                  'Export attendee list as CSV',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HiOutlineCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[rgb(var(--text-secondary))]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase 4: Waitlist System ─── */}
      <section className="py-20 lg:py-28 bg-[rgb(var(--bg-secondary))]" ref={showcase4Ref}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium mb-4">
                <HiOutlineClock className="w-3.5 h-3.5" /> Waitlist
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
                Never Miss a Sold-Out Event
              </h2>
              <p className="text-lg text-[rgb(var(--text-secondary))] mb-8">
                When events sell out, the excitement doesn't stop. Join the waitlist and get notified instantly when a spot opens up.
              </p>
              <div className="space-y-4">
                {[
                  'Auto-notification when a ticket is cancelled',
                  'Real-time position tracking in the queue',
                  'One-click join — no extra steps needed',
                  'Creators see waitlist analytics in dashboard',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HiOutlineCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-[rgb(var(--text-secondary))]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal reveal-delay-2 flex justify-center lg:justify-end">
              <div className="transform hover:scale-[1.02] transition-transform duration-500">
                <WaitlistMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── All Features Grid ─── */}
      <section className="py-20 bg-[rgb(var(--bg-primary))]" ref={featuresGridRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Everything you need to run events
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
              A complete toolkit for event creators and attendees, built with modern tools that just work.
            </p>
          </div>
          <div className="reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <HiOutlineQrcode className="w-6 h-6" />,
                title: 'QR Code Tickets',
                description: 'Unique QR codes for seamless, fraud-proof check-in at every event.',
                color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
              },
              {
                icon: <HiOutlineCurrencyDollar className="w-6 h-6" />,
                title: 'Secure Payments',
                description: 'Integrated with Paystack for safe, instant payment processing.',
                color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
              },
              {
                icon: <HiOutlineChartBar className="w-6 h-6" />,
                title: 'Analytics & Charts',
                description: 'Interactive charts for revenue, tickets, and attendee insights.',
                color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
              },
              {
                icon: <HiOutlineShieldCheck className="w-6 h-6" />,
                title: 'Ticket Verification',
                description: 'Scan and verify tickets instantly at the door. No fakes.',
                color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
              },
              {
                icon: <HiOutlineSearch className="w-6 h-6" />,
                title: 'Search & Filters',
                description: 'Find events by keyword, category, date range, and price.',
                color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
              },
              {
                icon: <HiOutlineBookmark className="w-6 h-6" />,
                title: 'Bookmark Events',
                description: 'Save events you love and come back to them anytime.',
                color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
              },
              {
                icon: <HiOutlineClock className="w-6 h-6" />,
                title: 'Waitlist System',
                description: 'Join the waitlist for sold-out events and get notified instantly when a spot opens up.',
                color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
              },
              {
                icon: <HiOutlineBell className="w-6 h-6" />,
                title: 'Smart Reminders',
                description: 'Set reminders for upcoming events so you never miss a moment.',
                color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
              },
              {
                icon: <HiOutlineDocumentDownload className="w-6 h-6" />,
                title: 'PDF Ticket Export',
                description: 'Download beautifully designed tickets with QR codes as PDF.',
                color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
              },
              {
                icon: <HiOutlineUserGroup className="w-6 h-6" />,
                title: 'Attendee Check-in',
                description: 'Track check-ins live with search, filters, and CSV export.',
                color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
              },
              {
                icon: <HiOutlineChatAlt2 className="w-6 h-6" />,
                title: 'Comments & Reviews',
                description: 'Rate events with stars and leave reviews for the community.',
                color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
              },
              {
                icon: <HiOutlineTag className="w-6 h-6" />,
                title: 'Promo Codes & Discounts',
                description: 'Create discount codes to boost sales and reward early attendees.',
                color: 'bg-lime-100 dark:bg-lime-900/40 text-lime-600 dark:text-lime-400',
              },
              {
                icon: <HiOutlineSwitchHorizontal className="w-6 h-6" />,
                title: 'Creator + Attendee',
                description: 'Creators can attend other creators\' events without a separate account.',
                color: 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400',
              },
              {
                icon: <HiOutlineMoon className="w-6 h-6" />,
                title: 'Dark Mode',
                description: 'Beautiful dark theme that\'s easy on the eyes, day or night.',
                color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
              },
              {
                icon: <HiOutlinePhotograph className="w-6 h-6" />,
                title: 'Image Gallery',
                description: 'Multi-image galleries with drag-to-reorder, captions, and lightbox viewing.',
                color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
              },
              {
                icon: <HiOutlineGlobeAlt className="w-6 h-6" />,
                title: 'Event Update Alerts',
                description: 'Ticket holders are automatically notified when event details change.',
                color: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
              },
              {
                icon: <HiOutlineMail className="w-6 h-6" />,
                title: 'Social Sharing',
                description: 'Share events on Twitter, Facebook, LinkedIn, and WhatsApp.',
                color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
              },
              {
                icon: <HiOutlineUserGroup className="w-6 h-6" />,
                title: 'Social Sign-In',
                description: 'Sign in with Google or GitHub. Forgot your password? Reset it securely via email.',
                color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-2">{feature.title}</h3>
                <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Events ─── */}
      {featuredEvents.length > 0 && (
        <section className="py-20 bg-[rgb(var(--bg-secondary))]" ref={featuredEventsRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="reveal text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
                Live on Eventful
              </h2>
              <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
                Real events happening now. Browse, discover, and get your tickets.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event, i) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className={`reveal reveal-delay-${(i % 3) + 1} glass border border-[rgb(var(--border-primary))] rounded-2xl overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="relative h-48 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 overflow-hidden">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-6xl font-bold opacity-20">{event.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {event.category && (
                      <div className="absolute top-3 left-3">
                        <div className="glass-light px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-white">{event.category}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-1">
                      {event.title}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineCalendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <HiOutlineLocationMarker className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[rgb(var(--border-primary))] flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {event.price > 0 ? `NGN ${event.price.toLocaleString()}` : 'Free'}
                      </span>
                      <span className="text-xs text-[rgb(var(--text-tertiary))]">
                        {event._count?.tickets || 0}/{event.capacity} spots
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="reveal text-center mt-10">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[rgb(var(--border-secondary))] text-[rgb(var(--text-primary))] font-semibold rounded-xl hover:bg-[rgb(var(--bg-primary))] transition-all"
              >
                View All Events <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Testimonials ─── */}
      <section className="py-20 bg-[rgb(var(--bg-primary))]" ref={testimonialsRef}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Loved by Event Creators
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg">
              See what our users have to say about Eventful
            </p>
          </div>
          <div className="reveal relative">
            <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-8 sm:p-12 text-center">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <HiOutlineStar key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <div className="min-h-[100px] flex items-center justify-center">
                <p
                  key={activeTestimonial}
                  className="text-lg sm:text-xl text-[rgb(var(--text-primary))] mb-8 leading-relaxed italic max-w-2xl mx-auto animate-[fadeIn_0.5s_ease-out]"
                >
                  &ldquo;{testimonials[activeTestimonial].text}&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                  {testimonials[activeTestimonial].name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[rgb(var(--text-primary))]">{testimonials[activeTestimonial].name}</p>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? 'bg-emerald-600 w-8'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 w-2.5'
                  }`}
                  aria-label={`View testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── About Us ─── */}
      <section id="about" className="py-20 bg-[rgb(var(--bg-secondary))]" ref={aboutRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Built for the African Event Community
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
              Eventful was born from a simple idea: event management should be accessible, affordable, and delightful for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <HiOutlineLightBulb className="w-8 h-8" />,
                title: 'Our Mission',
                description: 'Making event management accessible to every creator — from small meetups to large festivals. No complexity, no ridiculous fees.',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                icon: <HiOutlineGlobeAlt className="w-8 h-8" />,
                title: 'Built in Africa',
                description: 'Created by Ibrahim Bello as part of AltSchool Africa\'s School of Software Engineering. Designed for the African market, open to the world.',
                color: 'from-blue-500 to-cyan-600',
              },
              {
                icon: <HiOutlineHeart className="w-8 h-8" />,
                title: 'Open & Growing',
                description: 'Open source and community-driven. We believe in building together — contributions, feedback, and ideas are always welcome.',
                color: 'from-purple-500 to-pink-600',
              },
            ].map((item, i) => (
              <div key={item.title} className={`reveal reveal-delay-${i + 1} text-center`}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-3">{item.title}</h3>
                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 bg-[rgb(var(--bg-primary))]" ref={howItWorksRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Get started in minutes
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg">Three simple steps to your next event</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Create your account',
                description: 'Sign up as an event creator or attendee in seconds. No credit card required.',
                icon: <HiOutlineUserGroup className="w-8 h-8" />,
              },
              {
                step: '2',
                title: 'Create or discover events',
                description: 'Publish your event with images, pricing, and capacity — or browse amazing events near you.',
                icon: <HiOutlineCalendar className="w-8 h-8" />,
              },
              {
                step: '3',
                title: 'Sell tickets & manage',
                description: 'Accept payments, track sales with analytics, verify tickets with QR codes, and manage attendees.',
                icon: <HiOutlineTicket className="w-8 h-8" />,
              },
            ].map((item, index) => (
              <div key={item.step} className={`reveal reveal-delay-${index + 1} relative text-center group`}>
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-emerald-300 dark:from-emerald-700 to-transparent" />
                )}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
                  Step {item.step}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">{item.title}</h3>
                <p className="text-sm text-[rgb(var(--text-secondary))] max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact Us ─── */}
      <section id="contact" className="py-20 bg-[rgb(var(--bg-secondary))]" ref={contactRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text-primary))] mb-4">
              Get in Touch
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
              Have questions, feedback, or partnership ideas? We'd love to hear from you.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Form */}
            <div className="reveal">
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">Message</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Send Message
                </button>
                {contactSent && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-[fadeIn_0.3s_ease-out]">
                    <HiOutlineCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">Message sent! We'll get back to you soon.</p>
                  </div>
                )}
              </form>
            </div>
            {/* Info panel */}
            <div className="reveal reveal-delay-2 space-y-8">
              <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <HiOutlineMail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-1">Email Us</h4>
                    <a href="mailto:hello@eventful-platform.com" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">hello@eventful-platform.com</a>
                  </div>
                </div>
              </div>
              <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <HiOutlineGlobeAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-1">GitHub</h4>
                    <a href="https://github.com/ibraheembello/Eventful-Platform" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">ibraheembello/Eventful-Platform</a>
                  </div>
                </div>
              </div>
              <div className="glass border border-[rgb(var(--border-primary))] rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <HiOutlineClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-1">Response Time</h4>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">We typically respond within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to create something amazing?
          </h2>
          <p className="text-emerald-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
            Join event creators and attendees on Eventful. Start managing your events like a pro — for free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg text-lg"
            >
              Get Started - It's Free
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto px-10 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[rgb(var(--bg-primary))] border-t border-[rgb(var(--border-primary))] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Eventful
              </span>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2 max-w-xs">
                The complete event management platform for creators and attendees.
              </p>
            </div>
            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Platform</h4>
              <div className="space-y-2.5">
                <Link to="/events" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Browse Events</Link>
                <Link to="/register" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Create Account</Link>
                <Link to="/login" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Sign In</Link>
              </div>
            </div>
            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Features</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-[rgb(var(--text-secondary))]">QR Code Tickets</span>
                <span className="block text-sm text-[rgb(var(--text-secondary))]">Analytics Dashboard</span>
                <span className="block text-sm text-[rgb(var(--text-secondary))]">Waitlist System</span>
                <span className="block text-sm text-[rgb(var(--text-secondary))]">Promo Codes & Discounts</span>
                <span className="block text-sm text-[rgb(var(--text-secondary))]">Social Sign-In (Google & GitHub)</span>
                <span className="block text-sm text-[rgb(var(--text-secondary))]">Password Reset via Email</span>
              </div>
            </div>
            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">Resources</h4>
              <div className="space-y-2.5">
                <a href="https://eventful-platform.com/api/docs" target="_blank" rel="noopener noreferrer" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">API Documentation</a>
                <a href="https://github.com/ibraheembello/Eventful-Platform" target="_blank" rel="noopener noreferrer" className="block text-sm text-[rgb(var(--text-secondary))] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">GitHub</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[rgb(var(--border-primary))] flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Built by Ibrahim Bello &mdash; AltSchool Africa
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              &copy; {new Date().getFullYear()} Eventful. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
