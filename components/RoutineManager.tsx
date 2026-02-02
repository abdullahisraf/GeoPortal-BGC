
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Routine, Teacher } from '../types';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const RoutineManager: React.FC<{ role: string; setActiveTab: (tab: string) => void }> = ({ role, setActiveTab }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    day: 'Sunday',
    subject: '',
    teacher_id: '',
    start_time: '10:00',
    end_time: '11:00',
    room_number: '',
    session: '',
    course_type: 'Major' as 'Major' | 'Non-Major' | 'Common'
  });

  const fetchData = async () => {
    const { data: routineData } = await supabase
      .from('routines')
      .select('*, teachers(name)')
      .order('day')
      .order('start_time', { ascending: true });
    
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
      
    if (routineData) setRoutines(routineData);
    if (teacherData) setTeachers(teacherData);
  };

  useEffect(() => { fetchData(); }, []);

  const calculateNextHour = (timeStr: string) => {
    if (!timeStr) return '11:00';
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h + 1, m);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const openAddModal = (day: string) => {
    setEditingId(null);
    setFormData({
      day: day,
      subject: '',
      teacher_id: teachers[0]?.id || '',
      start_time: '10:00',
      end_time: '11:00',
      room_number: '',
      session: '',
      course_type: 'Major'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent, keepOpen = false) => {
    e.preventDefault();
    if (!formData.subject || !formData.teacher_id) return alert("Please fill mandatory fields.");
    
    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('routines').update(formData).eq('id', editingId);
      } else {
        await supabase.from('routines').insert([formData]);
      }
      
      await fetchData();
      if (keepOpen && !editingId) {
        setFormData(prev => ({ 
          ...prev, 
          subject: '', 
          start_time: prev.end_time,
          end_time: calculateNextHour(prev.end_time)
        }));
        alert("Class added! Next slot prepared.");
      } else {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoutine = async (id: string) => {
    if(!confirm('Delete this slot?')) return;
    await supabase.from('routines').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800 uppercase">Scheduler</h3>
        <button onClick={() => setActiveTab('dashboard')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {DAYS.map(day => {
          const dayRoutines = routines.filter(r => r.day === day);
          return (
            <div key={day} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-black text-slate-900">{day}</h4>
                <button onClick={() => openAddModal(day)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2">
                  <i className="fas fa-plus"></i> Add Class
                </button>
              </div>
              <div className="space-y-3">
                {dayRoutines.map(r => (
                  <div key={r.id} className="p-4 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex justify-between items-center group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-emerald-600">{r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}</span>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                          r.course_type === 'Major' ? 'bg-emerald-100 text-emerald-600' : 
                          r.course_type === 'Non-Major' ? 'bg-blue-100 text-blue-600' : 
                          'bg-purple-100 text-purple-600'
                        }`}>{r.course_type}</span>
                      </div>
                      <h5 className="font-black text-slate-900 text-[12px] uppercase">{r.subject}</h5>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{r.teachers?.name} • RM: {r.room_number || 'N/A'}</p>
                    </div>
                    <button onClick={() => deleteRoutine(r.id)} className="w-8 h-8 bg-white text-red-300 rounded-xl flex items-center justify-center hover:text-red-500 border border-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl my-8 relative animate-in zoom-in duration-300">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-2xl"></i></button>
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Scheduling {formData.day}</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Course Name</label>
                  <input required placeholder="e.g. Physical Geography" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Select Course Type</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {['Major', 'Non-Major', 'Common'].map(type => (
                      <button 
                        key={type} 
                        type="button"
                        onClick={() => setFormData({...formData, course_type: type as any})}
                        className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                          formData.course_type === type 
                          ? (type === 'Major' ? 'bg-emerald-600 text-white shadow-lg' : type === 'Non-Major' ? 'bg-blue-600 text-white shadow-lg' : 'bg-purple-600 text-white shadow-lg')
                          : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Assign Professor</label>
                <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none h-[60px]" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
                  <option value="">Select Professor...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Start Time</label>
                   <input type="time" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase ml-2">End Time</label>
                   <input type="time" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>
              <input placeholder="Room Number (e.g. 402)" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} />
              <div className="flex gap-4 pt-4">
                 {!editingId && (
                   <button type="button" onClick={(e) => handleSubmit(e, true)} className="flex-1 bg-emerald-50 text-emerald-700 font-black py-4 rounded-2xl border-2 border-emerald-100 uppercase text-[10px] tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Save & Add Next</button>
                 )}
                 <button onClick={(e) => handleSubmit(e, false)} disabled={loading} className="flex-[1.5] bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">{loading ? 'Processing...' : 'Finish Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineManager;
