
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Teacher, Notice, Student, Routine, GalleryItem, Profile } from '../types';

const PublicUI: React.FC<{ onOpenLogin: () => void }> = ({ onOpenLogin }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<{ data: any, type: 'teacher' | 'student' | 'admin' } | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  const [studentSearchRoll, setStudentSearchRoll] = useState('');
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [searchRoll, setSearchRoll] = useState('');
  const [searchResultData, setSearchResultData] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [typedHeader, setTypedHeader] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const headerFullText = "Geography & Environment";

  // Countdown State
  const [nextClassInfo, setNextClassInfo] = useState<{ routine: Routine | null, timeLeft: string, isOngoing: boolean }>({ routine: null, timeLeft: '', isOngoing: false });

  useEffect(() => {
    let timeout: any;
    const handleTyping = () => {
      if (!isDeleting && typedHeader.length < headerFullText.length) {
        timeout = setTimeout(() => setTypedHeader(headerFullText.slice(0, typedHeader.length + 1)), 150);
      } else if (!isDeleting && typedHeader.length === headerFullText.length) {
        timeout = setTimeout(() => setIsDeleting(true), 3000);
      } else if (isDeleting && typedHeader.length > 0) {
        timeout = setTimeout(() => setTypedHeader(headerFullText.slice(0, typedHeader.length - 1)), 75);
      } else if (isDeleting && typedHeader.length === 0) {
        timeout = setTimeout(() => setIsDeleting(false), 500);
      }
    };
    handleTyping();
    return () => clearTimeout(timeout);
  }, [typedHeader, isDeleting]);

  const navigateTo = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchResultData(null);
    setSelectedPerson(null);
    setStudentSearchRoll('');
    setSearchRoll('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, aData, nData, gData, rData, sCount] = await Promise.all([
        supabase.from('teachers').select('*').order('priority', { ascending: true }),
        supabase.from('profiles').select('*').eq('role', 'admin').order('full_name'),
        supabase.from('notices').select('*').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('gallery').select('*').order('created_at', { ascending: false }),
        supabase.from('routines').select('*, teachers(name)').order('start_time', { ascending: true }),
        supabase.from('students').select('*', { count: 'exact', head: true })
      ]);

      if (tData.data) setTeachers(tData.data);
      if (aData.data) setAdmins(aData.data);
      if (nData.data) setNotices(nData.data);
      if (gData.data) setGallery(gData.data);
      if (rData.data) setRoutines(rData.data);
      if (sCount.count !== null) setStudentCount(sCount.count);
    } catch (err) { console.error("Fetch Error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Class Countdown Logic
  useEffect(() => {
    if (routines.length === 0) return;

    const daysMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const interval = setInterval(() => {
      const now = new Date();
      const currentDayNum = now.getDay();
      const currentDayStr = Object.keys(daysMap).find(key => daysMap[key] === currentDayNum);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const ongoingClass = routines.find(r => {
        if (r.day !== currentDayStr) return false;
        const [sH, sM] = r.start_time.split(':').map(Number);
        const [eH, eM] = r.end_time.split(':').map(Number);
        const startTotal = sH * 60 + sM;
        const endTotal = eH * 60 + eM;
        return currentMinutes >= startTotal && currentMinutes < endTotal;
      });

      if (ongoingClass) {
        setNextClassInfo({
          routine: ongoingClass,
          timeLeft: 'এখনই ক্লাস চলছে',
          isOngoing: true
        });
        return;
      }

      let closestRoutine: Routine | null = null;
      let minDiff = Infinity;

      routines.forEach(r => {
        const routineDayNum = daysMap[r.day];
        const [hours, mins] = r.start_time.split(':').map(Number);
        const routineMinutes = hours * 60 + mins;

        let dayDiff = (routineDayNum - currentDayNum + 7) % 7;
        if (dayDiff === 0 && routineMinutes <= currentMinutes) {
          dayDiff = 7;
        }

        const totalDiffInMinutes = dayDiff * 24 * 60 + (routineMinutes - currentMinutes);
        if (totalDiffInMinutes < minDiff) {
          minDiff = totalDiffInMinutes;
          closestRoutine = r;
        }
      });

      if (closestRoutine) {
        const d = Math.floor(minDiff / (24 * 60));
        const h = Math.floor((minDiff % (24 * 60)) / 60);
        const m = Math.floor(minDiff % 60);
        const s = 60 - now.getSeconds();
        const adjM = s === 60 ? m : m - 1;
        const displayS = s === 60 ? 0 : s;

        setNextClassInfo({
          routine: closestRoutine,
          timeLeft: `${d > 0 ? d + 'd ' : ''}${h.toString().padStart(2, '0')}h ${adjM.toString().padStart(2, '0')}m ${displayS.toString().padStart(2, '0')}s`,
          isOngoing: false
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [routines]);

  useEffect(() => {
    if (!loading && studentCount > 0) {
      let start = 0;
      const end = studentCount;
      const duration = 2000; 
      const intervalTime = 16; 
      const steps = duration / intervalTime;
      const increment = end / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) { 
          setDisplayCount(end); 
          clearInterval(timer); 
        } else { 
          setDisplayCount(Math.floor(start)); 
        }
      }, intervalTime);
      return () => clearInterval(timer);
    }
  }, [loading, studentCount]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleStudentSearch = async () => {
    if (!studentSearchRoll) return;
    setSearchingStudent(true);
    try {
      const { data, error } = await supabase.from('students').select('*').eq('roll_number', studentSearchRoll).single();
      if (error || !data) alert("Student not found.");
      else setSelectedPerson({ data, type: 'student' });
    } catch (err) { alert("Search error."); }
    finally { setSearchingStudent(false); }
  };

  const handleResultSearch = async () => {
    if (!searchRoll) return;
    setSearching(true);
    try {
      const { data } = await supabase.from('results').select('*').eq('student_roll', searchRoll);
      setSearchResultData(Array.isArray(data) && data.length > 0 ? data : 'empty');
    } catch (err) { alert("Error loading result."); }
    finally { setSearching(false); }
  };

  const ProfileModal = ({ person, onClose }: { person: { data: any, type: 'teacher' | 'student' | 'admin' }, onClose: () => void }) => {
    const isTeacher = person.type === 'teacher';
    const isAdmin = person.type === 'admin';
    const d = person.data;
    const name = isAdmin ? d.full_name : d.name;
    const subtitle = isAdmin ? 'System Authority' : (isTeacher ? d.designation : 'Verified Student');
    const colorClass = isAdmin ? 'bg-slate-900' : (isTeacher ? 'bg-emerald-600' : 'bg-indigo-600');
    const iconColor = isAdmin ? 'text-slate-900' : (isTeacher ? 'text-emerald-600' : 'text-indigo-600');

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative animate-in zoom-in duration-300">
          <div className={`h-24 ${colorClass} relative`}>
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <img src={d.photo_url || `https://ui-avatars.com/api/?name=${name}&background=10b981&color=fff`} className="w-24 h-24 rounded-2xl object-cover border-[6px] border-white shadow-xl" />
            </div>
          </div>
          <div className="pt-14 pb-8 px-8 text-center">
            <h4 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{name}</h4>
            <span className={`text-[8px] font-black ${iconColor} uppercase tracking-widest block mb-4`}>{subtitle}</span>
            <div className="space-y-2 text-left relative">
              {copyStatus && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full animate-bounce font-black uppercase z-20 shadow-lg border border-slate-700">
                   {copyStatus} Copied!
                </div>
              )}
              {[
                { label: 'Email Address', value: (d.email || 'N/A').toLowerCase(), icon: 'fa-envelope', isCopyable: !!d.email },
                { label: 'Phone Number', value: d.phone || 'N/A', icon: 'fa-phone-alt', isCopyable: !!d.phone },
                { label: isTeacher ? 'Qualification' : (isAdmin ? 'Admin Rights' : 'ID Roll'), value: isTeacher ? d.degree : (isAdmin ? 'System Full Access' : d.roll_number), icon: 'fa-id-card', isCopyable: false }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center ${iconColor} border border-slate-100 shadow-sm`}>
                      <i className={`fas ${item.icon} text-[10px]`}></i>
                    </div>
                    <div>
                      <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{item.value}</p>
                    </div>
                  </div>
                  {item.isCopyable && (
                    <button onClick={() => handleCopy(item.value, item.label)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center active:scale-90">
                      <i className="fas fa-copy text-[12px]"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="mt-6 w-full bg-slate-900 text-white font-black py-3 rounded-xl uppercase text-[9px] tracking-widest shadow-lg active:scale-95">Dismiss</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans pb-24 md:pb-0 relative overflow-x-hidden">
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-100 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-slate-900 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest min-w-[220px]">
               {typedHeader}<span className="ml-1 w-1 h-3 bg-emerald-500 animate-pulse inline-block"></span>
            </div>
          </div>
          <button onClick={onOpenLogin} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm transition-transform active:scale-90"><i className="fas fa-user-lock text-xs"></i></button>
        </div>
      </header>

      {activeTab === 'home' && notices.length > 0 && (
        <div className="w-full relative z-20">
          <div className="w-full bg-slate-900 py-3 overflow-hidden marquee-container relative">
            <div className="absolute left-0 top-0 bottom-0 px-4 bg-emerald-600 text-white flex items-center z-[20] font-black text-[9px] uppercase tracking-widest shadow-xl">Latest Notice</div>
            <div className="animate-marquee whitespace-nowrap flex items-center pl-[120px]">
              {notices.slice(0, 5).map(n => (
                <span key={n.id} className="text-white/80 font-bold text-[11px] mx-10 uppercase tracking-tight flex items-center gap-2">
                  <i className="fas fa-bullhorn text-emerald-400 text-[10px]"></i> {n.title}
                </span>
              ))}
            </div>
          </div>
          
          {/* COMPACT ANIMATED STUDENT COUNTER - REFINED SMALL BADGE */}
          <div className="flex justify-center py-3 animate-in slide-in-from-top duration-700">
            <div className="inline-flex items-center gap-3 bg-white border border-slate-100 px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
              <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                <i className="fas fa-user-graduate text-[10px]"></i>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-2 mr-0.5">Community</span>
                <span className="text-[15px] font-black text-slate-900 tracking-tighter tabular-nums flex items-baseline">
                  {displayCount.toLocaleString()}<span className="text-emerald-500 ml-0.5 text-xs font-black">+</span>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight ml-1.5">Students</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 relative z-10">
        {loading ? (
           <div className="py-48 flex justify-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {activeTab === 'home' && (
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-full h-[240px] md:h-[480px] rounded-[3rem] overflow-hidden shadow-3xl border-[8px] border-white group">
                  <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center text-white w-full px-6">
                    <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-2">Geography</h2>
                    <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.5em] text-emerald-400">Bhola Govt College</p>
                  </div>
                </div>

                <div className="w-full max-md grid grid-cols-1 gap-3">
                  {[
                    { id: 'notices', label: 'Department Notices', icon: 'fa-bullhorn', color: 'bg-orange-500' },
                    { id: 'faculty', label: 'Faculty Profiles', icon: 'fa-chalkboard-teacher', color: 'bg-emerald-600' },
                    { id: 'authority', label: 'System Admin', icon: 'fa-shield-halved', color: 'bg-slate-900' },
                    { id: 'routine', label: 'Academic Routine', icon: 'fa-calendar-day', color: 'bg-blue-600' },
                    { id: 'students-info', label: 'Identity Search', icon: 'fa-id-card', color: 'bg-indigo-600' },
                    { id: 'results', label: 'Results & Archive', icon: 'fa-poll', color: 'bg-rose-600' },
                    { id: 'gallery', label: 'Memory Archive', icon: 'fa-images', color: 'bg-violet-600' }
                  ].map(item => (
                    <button key={item.id} onClick={() => navigateTo(item.id)} className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-x-2 transition-all flex items-center justify-between group active:scale-95">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><i className={`fas ${item.icon}`}></i></div>
                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{item.label}</h4>
                      </div>
                      <i className="fas fa-arrow-right text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">Developed By</p>
                    <h5 className="text-[16px] font-black text-slate-900 uppercase tracking-tight mb-4">Abdullah Al Israf</h5>
                    <a href="https://www.facebook.com/abdullahal.israf.9" target="_blank" className="inline-flex w-10 h-10 bg-blue-50 text-blue-600 rounded-xl items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><i className="fab fa-facebook-f"></i></a>
                </div>
              </div>
            )}

            {activeTab === 'routine' && (
              <div className="w-full py-4 animate-in fade-in slide-in-from-bottom-5">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Academic Routine</h3>
                </div>

                {nextClassInfo.routine && (
                  <div className={`mb-10 rounded-2xl p-4 text-white shadow-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 px-8 relative overflow-hidden group transition-all duration-500 ${nextClassInfo.isOngoing ? 'bg-emerald-950 border-emerald-500/30' : 'bg-slate-950 border-white/10'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none ${nextClassInfo.isOngoing ? 'opacity-100' : 'opacity-50'}`}></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 ${nextClassInfo.isOngoing ? 'animate-bounce shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'animate-pulse'}`}>
                         <i className={`fas ${nextClassInfo.isOngoing ? 'fa-play-circle' : 'fa-satellite-dish'} text-[10px]`}></i>
                      </div>
                      <div>
                        <p className={`text-[7px] font-black uppercase tracking-[0.3em] mb-0.5 ${nextClassInfo.isOngoing ? 'text-emerald-400' : 'text-slate-500'}`}>{nextClassInfo.isOngoing ? 'Class Status' : 'Live Next Class'}</p>
                        <h4 className="text-[12px] font-black uppercase text-white/90 truncate max-w-[150px]">{nextClassInfo.routine.subject}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="flex flex-col items-center sm:items-end">
                        <span className={`text-2xl font-black tracking-tighter tabular-nums ${nextClassInfo.isOngoing ? 'text-emerald-400' : 'text-white'}`}>
                          {nextClassInfo.timeLeft}
                        </span>
                        <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                          {nextClassInfo.isOngoing ? 'Active Session' : 'Time Remaining'}
                        </span>
                      </div>
                      <div className="hidden sm:block w-px h-6 bg-white/10"></div>
                      <div className="hidden sm:block text-right">
                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{nextClassInfo.isOngoing ? 'Room No' : 'Schedule'}</p>
                        <p className="text-[10px] font-black text-white/70 uppercase">
                          {nextClassInfo.isOngoing ? `RM: ${nextClassInfo.routine.room_number || 'N/A'}` : `${nextClassInfo.routine.day} @ ${nextClassInfo.routine.start_time.slice(0, 5)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const dayClasses = routines.filter(r => r.day === day);
                    if (dayClasses.length === 0) return null;
                    return (
                      <div key={day} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="text-lg font-black mb-6 text-slate-900 uppercase tracking-tight border-b pb-4">{day}</h4>
                        <div className="space-y-4">
                          {dayClasses.map(c => (
                            <div key={c.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 hover:border-emerald-200 transition-all group">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-black text-emerald-600">{c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}</span>
                                  <span className={`text-[6px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] ${
                                    c.course_type === 'Major' ? 'bg-emerald-100 text-emerald-600' : 
                                    c.course_type === 'Non-Major' ? 'bg-blue-100 text-blue-600' : 
                                    'bg-purple-100 text-purple-600'
                                  }`}>{c.course_type}</span>
                                </div>
                                <h5 className="font-black text-[12px] text-slate-900 uppercase group-hover:text-emerald-700 transition-colors">{c.subject}</h5>
                                <p className="text-[8px] text-slate-400 font-bold uppercase">{c.teachers?.name} • RM: {c.room_number || 'N/A'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'faculty' && (
              <div className="w-full py-4">
                <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Academic Faculty</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {teachers.map(t => (
                    <button key={t.id} onClick={() => setSelectedPerson({ data: t, type: 'teacher' })} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 text-center shadow-sm hover:shadow-xl transition-all group">
                       <div className="relative mb-4">
                         <img src={t.photo_url || `https://ui-avatars.com/api/?name=${t.name}&background=10b981&color=fff`} className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-lg border-2 border-white group-hover:scale-110 transition-transform" />
                         <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[6px] font-black px-2 py-1 rounded-full uppercase">{t.teacher_type}</span>
                       </div>
                       <h4 className="text-[12px] font-black text-slate-900 uppercase leading-none mb-1">{t.name}</h4>
                       <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">{t.designation}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="w-full py-4">
                <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Notice Board</h3>
                </div>
                <div className="space-y-4">
                  {notices.map(n => (
                    <div key={n.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-black">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 font-medium whitespace-pre-wrap mb-4">{n.content}</p>
                      {n.attachment_url && <a href={n.attachment_url} target="_blank" className="inline-flex bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">View Attachment</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'students-info' && (
              <div className="w-full py-4 max-w-lg mx-auto">
                 <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Identity Search</h3>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Verify Student Profile</p>
                  <div className="flex gap-2">
                    <input placeholder="Enter Student Roll Number" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold outline-none focus:border-emerald-500" value={studentSearchRoll} onChange={e => setStudentSearchRoll(e.target.value)} />
                    <button onClick={handleStudentSearch} disabled={searchingStudent} className="bg-slate-900 text-white px-8 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">{searchingStudent ? '...' : 'Search'}</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="w-full py-4 max-w-2xl mx-auto">
                 <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Result Terminal</h3>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Fetch Academic Transcript</p>
                  <div className="flex gap-2">
                    <input placeholder="Roll Number" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold outline-none focus:border-rose-500" value={searchRoll} onChange={e => setSearchRoll(e.target.value)} />
                    <button onClick={handleResultSearch} disabled={searching} className="bg-rose-600 text-white px-8 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">{searching ? '...' : 'Get Result'}</button>
                  </div>
                </div>
                {searchResultData === 'empty' ? (
                  <div className="text-center p-10 bg-white rounded-[2rem] border border-dashed text-slate-400 font-bold">No results found for this roll number.</div>
                ) : searchResultData && (
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-10">
                    <div className="bg-slate-900 p-8 text-center">
                       <h4 className="text-white font-black uppercase text-xl">{searchResultData[0].student_name}</h4>
                       <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mt-1">Roll: {searchResultData[0].student_roll} • {searchResultData[0].semester}</p>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                        <tr><th className="px-8 py-4">Course</th><th className="px-8 py-4 text-center">Marks</th><th className="px-8 py-4 text-right">Grade</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {searchResultData.map((res: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-8 py-5">
                              <p className="font-black text-slate-800 text-xs uppercase">{res.subject_name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{res.subject_code}</p>
                            </td>
                            <td className="px-8 py-5 text-center font-black text-slate-900">{res.marks}</td>
                            <td className="px-8 py-5 text-right">
                               <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black">
                                 {res.marks >= 80 ? 'A+' : res.marks >= 70 ? 'A' : res.marks >= 60 ? 'A-' : res.marks >= 50 ? 'B' : res.marks >= 40 ? 'C' : 'F'}
                               </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="w-full py-4">
                <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Memory Archive</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery.map(item => (
                    <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group">
                      <div className="h-56 overflow-hidden">
                        <img src={item.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                      </div>
                      <div className="p-6">
                        <h4 className="font-black text-slate-800 text-[13px] uppercase truncate">{item.title || 'Untitled Memory'}</h4>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'authority' && (
              <div className="w-full py-4">
                <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => navigateTo('home')} className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-arrow-left"></i></button>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">System Admins</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {admins.map(p => (
                    <button key={p.id} onClick={() => setSelectedPerson({ data: p, type: 'admin' })} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 text-center shadow-sm hover:shadow-xl transition-all group">
                       <img src={p.photo_url || `https://ui-avatars.com/api/?name=${p.full_name}&background=0f172a&color=fff`} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg border-2 border-white group-hover:scale-110 transition-transform" />
                       <h4 className="text-[12px] font-black text-slate-900 uppercase leading-none mb-1">{p.full_name}</h4>
                       <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Administrator</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedPerson && <ProfileModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 py-6 flex justify-between items-center z-[150] shadow-2xl md:hidden rounded-t-[2.5rem]">
        {['home', 'faculty', 'notices', 'routine'].map(tab => (
          <button key={tab} onClick={() => navigateTo(tab)} className={`relative text-xl transition-all ${activeTab === tab ? 'text-emerald-600 scale-125 -translate-y-1' : 'text-slate-300'}`}>
            <i className={`fas ${tab === 'home' ? 'fa-house' : tab === 'faculty' ? 'fa-chalkboard-teacher' : tab === 'notices' ? 'fa-bullhorn' : 'fa-calendar-alt'}`}></i>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default PublicUI;
