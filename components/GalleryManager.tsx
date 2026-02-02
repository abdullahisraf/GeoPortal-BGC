
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { GalleryItem } from '../types';

interface GalleryManagerProps {
  role: string;
  setActiveTab: (tab: string) => void;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ role, setActiveTab }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    media_type: 'image' as 'image' | 'video',
    file: null as File | null
  });

  const fetchGallery = async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => { fetchGallery(); }, []);

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('department-assets').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('department-assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const deleteFileFromStorage = async (url: string) => {
    try {
      if (!url) return;
      const path = url.split('department-assets/')[1];
      if (path) {
        await supabase.storage.from('department-assets').remove([path]);
      }
    } catch (err) {
      console.error("Storage delete error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return alert("ফাইল সিলেক্ট করুন");
    setLoading(true);

    try {
      const media_url = await handleUpload(formData.file);
      const { error } = await supabase.from('gallery').insert({
        title: formData.title,
        media_type: formData.media_type,
        media_url
      });
      if (error) throw error;
      alert("গ্যালারিতে যোগ হয়েছে!");
      setIsModalOpen(false);
      setFormData({ title: '', media_type: 'image', file: null });
      fetchGallery();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm('আপনি কি এই মেমোরিটি ও এর মিডিয়া ডিলিট করতে চান?')) return;
    setLoading(true);
    try {
      await deleteFileFromStorage(item.media_url);
      await supabase.from('gallery').delete().eq('id', item.id);
      alert("ডিলিট করা হয়েছে।");
      fetchGallery();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Memory Gallery</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Geography Memories</p>
        </div>
        <div className="flex items-center gap-4">
          {(role === 'admin' || role === 'cr') && (
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg">
              <i className="fas fa-cloud-upload-alt mr-2"></i> Add Memory
            </button>
          )}
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm group relative">
            <img src={item.media_url} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
            <div className="p-4 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">{item.title || 'Untitled Memory'}</h4>
              {(role === 'admin' || role === 'cr') && (
                <button onClick={() => deleteItem(item)} className="text-red-300 hover:text-red-500 transition-colors">
                  <i className="fas fa-trash-alt"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl border border-white/20 p-8 animate-in zoom-in duration-200 relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Upload Memory</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Caption" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 outline-none focus:border-emerald-500 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <input type="file" accept="image/*" className="text-xs font-bold text-slate-500" onChange={e => setFormData({...formData, file: e.target.files?.[0] || null})} />
              <button disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
                {loading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
