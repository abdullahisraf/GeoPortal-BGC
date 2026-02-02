
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Result, Student } from '../types';

const ResultManager: React.FC<{ role: string; setActiveTab: (tab: string) => void }> = ({ role, setActiveTab }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchRoll, setSearchRoll] = useState('');
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [semester, setSemester] = useState('1st Semester');
  
  const [subjectEntries, setSubjectEntries] = useState(Array(8).fill(null).map(() => ({
    code: '',
    name: '',
    marks: ''
  })));

  useEffect(() => {
    supabase.from('students').select('*').then(({ data }) => data && setStudents(data));
  }, []);

  const handleRollSearch = () => {
    const s = students.find(st => st.roll_number === searchRoll);
    if (s) setTargetStudent(s);
    else alert("রোল খুঁজে পাওয়া যায়নি! সঠিক রোল নাম্বার দিন।");
  };

  const handleSubjectChange = (index: number, field: string, value: string) => {
    const updated = [...subjectEntries];
    updated[index] = { ...updated[index], [field]: value };
    setSubjectEntries(updated);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;
    setLoading(true);

    try {
      const validEntries = subjectEntries.filter(s => s.code && s.name && s.marks !== '');
      if (validEntries.length === 0) throw new Error("দয়া করে অন্তত একটি সাবজেক্টের কোড, নাম এবং মার্কস দিন।");

      const payload = validEntries.map(sub => ({
        student_roll: targetStudent.roll_number,
        student_name: targetStudent.name,
        subject_name: sub.name,
        subject_code: sub.code,
        marks: Number(sub.marks), // Ensure it is sent as a number
        semester: semester
      }));

      const { error } = await supabase.from('results').insert(payload);
      if (error) throw error;
      
      alert("রেজাল্ট শিট সফলভাবে ডাটাবেসে সেভ হয়েছে!");
      setIsModalOpen(false);
      setTargetStudent(null);
      setSearchRoll('');
      setSubjectEntries(Array(8).fill(null).map(() => ({ code: '', name: '', marks: '' })));
    } catch (err: any) {
      console.error("Result save error:", err);
      alert("ডাটাবেস এরর: " + err.message + "\n\nপরামর্শ: SQL Schema রান করেছেন কি না চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const closeEverything = () => {
    setIsModalOpen(false);
    setTargetStudent(null);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
      {/* Header with Exit Cross */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Academic Results Control</h3>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Management Panel</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-lg">
            <i className="fas fa-plus mr-2"></i> Add Result Sheet
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="w-12 h-12 bg-white border-2 border-red-100 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <div className="text-center p-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
         <i className="fas fa-poll-h text-5xl text-slate-200 mb-4"></i>
         <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Click "Add Result Sheet" to start entering marks</p>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* STICKY CLOSE BUTTON FOR MODAL */}
          <button 
            onClick={closeEverything} 
            className="fixed top-8 right-8 w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl z-[60] hover:scale-110 active:scale-95 transition-all border-4 border-white"
            title="Close Sheet"
          >
            <i className="fas fa-times text-3xl"></i>
          </button>

          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in zoom-in duration-300 my-8">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-900">Marks Entry Form</h3>
             </div>
             
             <div className="p-10 space-y-8">
                {/* Search / Identify Phase */}
                {!targetStudent ? (
                  <div className="flex flex-col gap-6 animate-in slide-in-from-top-4">
                    <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 border border-slate-100">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">1. Student Roll</label>
                             <input placeholder="Roll Number" className="w-full bg-white border border-slate-200 rounded-xl p-4 font-bold text-lg outline-none focus:border-emerald-500" value={searchRoll} onChange={e => setSearchRoll(e.target.value)} />
                          </div>
                          <div>
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">2. Semester</label>
                             <select className="w-full bg-white border border-slate-200 rounded-xl p-4 font-bold h-[60px] outline-none" value={semester} onChange={e => setSemester(e.target.value)}>
                               {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => <option key={s} value={`${s} Semester`}>{s} Semester</option>)}
                             </select>
                          </div>
                       </div>
                       <button onClick={handleRollSearch} className="w-full bg-emerald-600 text-white py-5 rounded-xl font-black uppercase text-sm shadow-xl hover:bg-emerald-700 transition-all">Identify Student & Open Sheet</button>
                    </div>
                  </div>
                ) : (
                  /* THE SHEET - WHERE MARKS ARE INPUT */
                  <div className="animate-in slide-in-from-right-4 space-y-6">
                    <div className="bg-emerald-50 p-6 rounded-[2rem] flex items-center justify-between border border-emerald-100">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 font-black text-2xl shadow-sm overflow-hidden">
                             <img src={targetStudent.photo_url || `https://ui-avatars.com/api/?name=${targetStudent.name}`} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <h4 className="font-black text-emerald-900 text-xl leading-none mb-1">{targetStudent.name}</h4>
                             <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Roll: {targetStudent.roll_number} • {semester}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setTargetStudent(null)} 
                         className="flex items-center gap-2 px-5 py-3 bg-white border border-emerald-200 rounded-xl text-emerald-600 font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                       >
                         <i className="fas fa-arrow-left"></i> Change Student
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {subjectEntries.map((sub, idx) => (
                          <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 grid grid-cols-12 gap-3 group hover:bg-white hover:border-emerald-200 transition-all">
                             <div className="col-span-12 flex justify-between items-center mb-1">
                               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Course Slot {idx+1}</span>
                               {sub.marks && <i className="fas fa-check-circle text-emerald-500 text-[10px]"></i>}
                             </div>
                             <input placeholder="Code" className="col-span-3 bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 shadow-sm" value={sub.code} onChange={e => handleSubjectChange(idx, 'code', e.target.value)} />
                             <input placeholder="Course Name" className="col-span-6 bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 shadow-sm" value={sub.name} onChange={e => handleSubjectChange(idx, 'name', e.target.value)} />
                             <input type="number" placeholder="Marks" className="col-span-3 bg-white border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 shadow-sm" value={sub.marks} onChange={e => handleSubjectChange(idx, 'marks', e.target.value)} />
                          </div>
                       ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button 
                         onClick={closeEverything} 
                         className="flex-1 bg-white text-red-500 font-black py-5 rounded-[1.8rem] border-2 border-red-100 hover:bg-red-50 transition-all uppercase text-xs"
                       >
                         <i className="fas fa-times-circle mr-2"></i> Close Window
                       </button>
                       <button onClick={handleSaveAll} disabled={loading} className="flex-[2] bg-slate-900 text-white font-black py-5 rounded-[1.8rem] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest">
                         {loading ? 'Saving Results...' : 'Save & Publish Results'}
                       </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultManager;
