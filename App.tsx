import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UserManager from './components/UserManager';
import StudentManager from './components/StudentManager';
import TeacherManager from './components/TeacherManager';
import NoticeManager from './components/NoticeManager';
import ResultManager from './components/ResultManager';
import GalleryManager from './components/GalleryManager';
import RoutineManager from './components/RoutineManager';
import Auth from './components/Auth';
import PublicUI from './components/PublicUI';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
    else setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        setViewMode('admin');
      } else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        setViewMode('admin');
      } else {
        setProfile(null);
        setViewMode('public');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 space-y-4">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black animate-bounce">G</div>
        <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-[7px]">Initializing Core System...</p>
      </div>
    );
  }

  if (viewMode === 'public') return <PublicUI onOpenLogin={() => setViewMode('admin')} />;

  if (!session) {
    return (
      <div className="relative">
        <button 
          onClick={() => setViewMode('public')}
          className="fixed top-6 left-6 z-50 bg-white/80 backdrop-blur-md text-slate-900 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-200 shadow-xl"
        >
          <i className="fas fa-arrow-left mr-2"></i> Exit Admin
        </button>
        <Auth />
      </div>
    );
  }

  if (!profile || profile.role === 'pending') {
    return (
      <div className="flex items-center justify-center h-screen bg-white p-4">
        <div className="bg-slate-50 p-10 rounded-[2rem] shadow-sm max-w-sm text-center border border-slate-100">
          <div className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
            <i className="fas fa-shield-halved text-xl"></i>
          </div>
          <h1 className="text-[11px] font-black text-slate-900 mb-2 uppercase tracking-widest">Awaiting Verification</h1>
          <p className="text-slate-500 mb-8 text-[10px] leading-relaxed font-medium">
            Identity verification is in progress. Please wait for an administrator to grant access.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-emerald-600 transition-all text-[9px] uppercase tracking-widest active:scale-95 shadow-lg">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={profile?.role || 'pending'} 
        userName={profile?.full_name || 'Staff'}
        userPhoto={profile?.photo_url}
        userId={profile?.id}
        onPhotoUpdate={() => fetchProfile(profile.id)}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-1 h-5 bg-slate-900 rounded-full"></div>
             <div>
               <h1 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{activeTab.replace('-', ' ')}</h1>
               <p className="text-emerald-600 text-[6px] font-bold uppercase tracking-[0.3em] mt-0.5">Control Terminal</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('public')} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest border border-slate-100">View Site</button>
            <button onClick={() => supabase.auth.signOut()} className="w-8 h-8 bg-slate-50 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-slate-100">
               <i className="fas fa-power-off text-[10px]"></i>
            </button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto pb-20">
          {activeTab === 'dashboard' && <Dashboard role={profile?.role} />}
          {activeTab === 'routine' && <RoutineManager role={profile?.role!} setActiveTab={setActiveTab} />}
          {activeTab === 'students' && <StudentManager role={profile?.role!} setActiveTab={setActiveTab} />}
          {activeTab === 'teachers' && <TeacherManager role={profile?.role!} setActiveTab={setActiveTab} />}
          {activeTab === 'notices' && <NoticeManager role={profile?.role!} authorId={profile?.id!} setActiveTab={setActiveTab} />}
          {activeTab === 'results' && <ResultManager role={profile?.role!} setActiveTab={setActiveTab} />}
          {activeTab === 'gallery' && <GalleryManager role={profile?.role!} setActiveTab={setActiveTab} />}
          {activeTab === 'user-management' && profile?.role === 'admin' && <UserManager setActiveTab={setActiveTab} />}
        </div>
      </main>
    </div>
  );
};

export default App;