
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Notice } from '../types';

const NoticeManager: React.FC<{ role: string; authorId: string; setActiveTab: (tab: string) => void }> = ({ role, authorId, setActiveTab }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchNotices = async () => {
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (data) setNotices(data);
  };
  useEffect(() => { fetchNotices(); }, []);

  const sendPushNotification = async (title: string, body: string) => {
    try {
      // ওয়ান সিগন্যাল এপিআই কল করার জন্য আমরা ফেচ মেথড ব্যবহার করছি
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Basic YOUR_ONESIGNAL_REST_API_KEY" // এখানে আপনার REST API Key বসাবেন
        },
        body: JSON.stringify({
          app_id: "YOUR_ONESIGNAL_APP_ID", // এখানে আপনার App ID বসাবেন
          included_segments: ["All"],
          headings: { "en": "New Notice Published! 📢" },
          contents: { "en": title },
          subtitle: { "en": "Geography Department, BGC" },
          url: window.location.origin
        })
      });
    } catch (err) {
      console.error("Push notification failed:", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `notices/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('department-assets')
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('department-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const createNotice = async () => {
    if (!newNotice.title) return;
    setUploading(true);
    try {
      let attachment_url = '';
      if (attachment) {
        attachment_url = await handleFileUpload(attachment);
      }

      const { error } = await supabase.from('notices').insert({
        title: newNotice.title,
        content: newNotice.content,
        author_id: authorId,
        is_published: true,
        attachment_url: attachment_url || undefined
      });

      if (!error) {
        alert("নোটিশ পাবলিশ হয়েছে এবং নোটিফিকেশন পাঠানো হয়েছে!");
        
        // Trigger Push Notification
        await sendPushNotification(newNotice.title, newNotice.content);
        
        setNewNotice({ title: '', content: '' });
        setAttachment(null);
        fetchNotices();
      } else throw error;
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteNotice = async (notice: Notice) => {
    if (!window.confirm('আপনি কি এই নোটিশটি ও এর ফাইল মুছে ফেলতে চান?')) return;
    try {
      if (notice.attachment_url) {
        const path = notice.attachment_url.split('department-assets/')[1];
        if (path) await supabase.storage.from('department-assets').remove([path]);
      }
      const { error } = await supabase.from('notices').delete().eq('id', notice.id);
      if (error) throw error;
      alert("নোটিশ ও ফাইল সফলভাবে ডিলিট হয়েছে।");
      fetchNotices();
    } catch (err: any) {
      alert("ডিলিট এরর: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Notice Board</h3>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Updates & Announcements</p>
        </div>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="w-12 h-12 bg-white border-2 border-red-100 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm group"
          title="Back to Home"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {(role === 'admin' || role === 'cr') && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative">
          <h3 className="font-bold text-lg mb-6 text-slate-900 flex items-center gap-2">
            <i className="fas fa-edit text-emerald-500"></i> Create New Notice
          </h3>
          <div className="space-y-4">
            <input placeholder="Notice Title" className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl p-4 focus:border-emerald-500 outline-none font-bold" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
            <textarea placeholder="Content..." className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl p-4 h-40 focus:border-emerald-500 outline-none font-medium" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
            <div className="p-6 bg-emerald-50 rounded-2xl border border-dashed border-emerald-200">
              <input type="file" accept="image/*,.pdf" className="text-sm font-bold text-slate-500" onChange={e => setAttachment(e.target.files?.[0] || null)} />
            </div>
            <button onClick={createNotice} disabled={uploading} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95">
              {uploading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notices.map(notice => (
          <div key={notice.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative group">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">{notice.title}</h4>
              <span className="text-[10px] text-slate-400 font-black">{new Date(notice.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed mb-6 font-medium">{notice.content}</p>
            {notice.attachment_url && (
               <a 
                href={notice.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all"
               >
                <i className="fas fa-file-alt"></i> View File
              </a>
            )}
            {role === 'admin' && (
              <button onClick={() => deleteNotice(notice)} className="absolute top-8 right-8 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoticeManager;
