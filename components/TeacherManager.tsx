
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Teacher } from '../types';

interface TeacherManagerProps {
  role: string;
  setActiveTab: (tab: string) => void;
}

const TeacherManager: React.FC<TeacherManagerProps> = ({ role, setActiveTab }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: 'Geography and Environment',
    degree: '',
    email: '',
    phone: '',
    bio: '',
    priority: 0,
    teacher_type: 'Major' as 'Major' | 'Non-Major' | 'Common',
    photo: null as File | null
  });

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('priority', { ascending: true }); 
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      console.error("Fetch Teachers Error:", err.message);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `teachers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('department-assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('department-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err: any) {
      console.error("Upload Error:", err);
      return null;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      designation: '',
      department: 'Geography and Environment',
      degree: '',
      email: '',
      phone: '',
      bio: '',
      priority: 0,
      teacher_type: 'Major',
      photo: null
    });
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name,
      designation: teacher.designation,
      department: teacher.department,
      degree: teacher.degree || '',
      email: (teacher.email || '').toLowerCase(),
      phone: teacher.phone || '',
      bio: teacher.bio || '',
      priority: teacher.priority || 0,
      teacher_type: (teacher.teacher_type as any) || 'Major',
      photo: null
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.designation) {
      alert("নাম এবং পদবী অবশ্যই দিতে হবে।");
      return;
    }
    
    setLoading(true);
    try {
      let photo_url = '';
      if (formData.photo) {
        const uploadedUrl = await handleUpload(formData.photo);
        if (uploadedUrl) photo_url = uploadedUrl;
      }

      const payload: any = {
        name: formData.name.trim(),
        designation: formData.designation.trim(),
        department: formData.department.trim(),
        degree: formData.degree.trim() || null,
        email: (formData.email.trim() || null)?.toLowerCase(),
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        priority: Number(formData.priority),
        teacher_type: formData.teacher_type
      };

      if (photo_url) payload.photo_url = photo_url;

      if (editingId) {
        const { error } = await supabase.from('teachers').update(payload).eq('id', editingId);
        if (error) throw error;
        alert("টিচারের তথ্য সফলভাবে আপডেট হয়েছে!");
      } else {
        const { error } = await supabase.from('teachers').insert([payload]);
        if (error) throw error;
        alert("নতুন টিচার সফলভাবে যোগ করা হয়েছে!");
      }

      handleCloseModal();
      await fetchTeachers();
    } catch (error: any) {
      console.error("Database Submit Error:", error);
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const deleteTeacher = async (id: string) => {
    if (!confirm('আপনি কি এই টিচার প্রোফাইলটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      await fetchTeachers();
    } catch (err: any) {
      alert("ডিলিট করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Faculty Management</h3>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Admin Panel Controls</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-emerald-600 transition-all">
            <i className="fas fa-plus"></i> Add Teacher
          </button>
          <button onClick={() => setActiveTab('dashboard')} className="w-12 h-12 bg-white border-2 border-red-100 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(t => (
          <div key={t.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 text-center shadow-sm relative group hover:shadow-xl transition-all">
            <div className="absolute top-6 left-6 flex flex-col items-start gap-1">
               <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-md">#{t.priority}</span>
               <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                 t.teacher_type === 'Major' ? 'bg-emerald-100 text-emerald-700' :
                 t.teacher_type === 'Non-Major' ? 'bg-blue-100 text-blue-700' :
                 'bg-amber-100 text-amber-700'
               }`}>
                 {t.teacher_type}
               </span>
            </div>
            
            <img 
              src={t.photo_url || `https://ui-avatars.com/api/?name=${t.name}&background=10b981&color=fff`} 
              className="w-24 h-24 rounded-[2rem] object-cover mx-auto mb-4 shadow-md border-2 border-slate-50" 
              alt={t.name}
            />
            <h4 className="font-black text-lg text-slate-900 leading-tight">{t.name}</h4>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">{t.designation}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-2">{(t.email || '').toLowerCase()}</p>
            
            {(role === 'admin' || role === 'cr') && (
              <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEditModal(t)} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                  <i className="fas fa-pencil-alt text-xs"></i>
                </button>
                <button onClick={() => deleteTeacher(t.id)} className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl my-8 relative animate-in zoom-in duration-300">
            <button onClick={handleCloseModal} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><i className="fas fa-times text-2xl"></i></button>
            <h3 className="text-2xl font-black mb-8 text-slate-900">{editingId ? 'Update Faculty' : 'Add New Teacher'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Full Name *</label>
                  <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Priority</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Designation *</label>
                  <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Category</label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none h-[58px]" value={formData.teacher_type} onChange={e => setFormData({...formData, teacher_type: e.target.value as any})}>
                    <option value="Major">Major</option>
                    <option value="Non-Major">Non-Major</option>
                    <option value="Common">Common</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Degree</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Phone Number</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bio / Remarks</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Photo</label>
                <input type="file" accept="image/*" onChange={e => setFormData({...formData, photo: e.target.files?.[0] || null})} className="text-xs" />
              </div>

              <button disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl uppercase">
                {loading ? 'Processing...' : 'Confirm & Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
