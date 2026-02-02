
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Student } from '../types';

interface StudentManagerProps {
  role: string;
  setActiveTab: (tab: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ role, setActiveTab }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    email: '',
    phone: '',
    session: '',
    department: 'Geography and Environment',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    photo: null as File | null
  });

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*').order('roll_number');
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error("Fetch Students Error:", err.message);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `students/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('department-assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('department-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      return null;
    }
  };

  const openEditModal = (student: Student) => {
    setEditingId(student.id);
    setFormData({
      roll_number: student.roll_number,
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      session: student.session,
      department: student.department || 'Geography and Environment',
      gender: (student.gender as any) || 'Male',
      photo: null
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ roll_number: '', name: '', email: '', phone: '', session: '', department: 'Geography and Environment', gender: 'Male', photo: null });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photo_url = '';
      if (formData.photo) {
        const uploaded = await handleUpload(formData.photo);
        if (uploaded) photo_url = uploaded;
      }

      const payload: any = {
        roll_number: formData.roll_number.trim(),
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        session: formData.session.trim(),
        department: formData.department.trim(),
        gender: formData.gender,
      };

      if (photo_url) payload.photo_url = photo_url;

      const { error } = await supabase.from('students').upsert(payload, { onConflict: 'roll_number' });
      if (error) throw error;
      
      alert(editingId ? "Updated!" : "Registered!");
      handleCloseModal();
      fetchStudents();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('Confirm delete?')) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Student Registry</h3>
          <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Manage Records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Add Student</button>
          <button onClick={() => setActiveTab('dashboard')} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:text-red-500 transition-colors border border-slate-100">
            <i className="fas fa-times text-[10px]"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(s => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group relative hover:shadow-xl hover:border-emerald-100 transition-all">
            <img 
              src={s.photo_url || `https://ui-avatars.com/api/?name=${s.name}&background=10b981&color=fff`} 
              className="w-14 h-14 rounded-xl object-cover border border-slate-50 shadow-sm" 
              alt={s.name}
            />
            <div className="flex-1 overflow-hidden">
              <h4 className="font-black text-slate-900 text-[11px] leading-tight truncate">{s.name}</h4>
              <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mt-0.5">ID: {s.roll_number}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[7px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">{s.gender || 'M'}</span>
                <span className="text-[7px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md font-black tracking-widest">{s.session}</span>
                {s.phone && <span className="text-[7px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black tracking-widest"><i className="fas fa-phone mr-1"></i>{s.phone}</span>}
              </div>
            </div>
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEditModal(s)} className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                  <i className="fas fa-pencil-alt text-[8px]"></i>
                </button>
                <button onClick={() => deleteStudent(s.id)} className="w-6 h-6 bg-red-50 text-red-500 rounded-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <i className="fas fa-trash text-[8px]"></i>
                </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={handleCloseModal} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
            <h3 className="text-[14px] font-black mb-8 text-slate-900 uppercase tracking-widest">{editingId ? 'Edit Profile' : 'Student Registry'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="ID / Roll Number" className="bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-[10px] outline-none focus:border-emerald-500" value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} disabled={!!editingId} />
                <input required placeholder="Full Identity Name" className="bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-[10px] outline-none focus:border-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Session (2021-22)" className="bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-[10px] outline-none focus:border-emerald-500" value={formData.session} onChange={e => setFormData({...formData, session: e.target.value})} />
                <input placeholder="Contact Phone" className="bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-[10px] outline-none focus:border-emerald-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-[10px] outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-2">Profile Media Upload</p>
                 <input type="file" accept="image/*" onChange={e => setFormData({...formData, photo: e.target.files?.[0] || null})} className="text-[9px]" />
              </div>
              <button disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl active:scale-95 transition-all text-[9px] uppercase tracking-widest">
                {loading ? 'Processing Registry...' : 'Commit Data'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
