
import React, { useRef, useState, useEffect } from 'react';
import { UserRole } from '../types';
import { supabase } from '../supabaseClient';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  userName: string;
  userPhoto?: string;
  userId: string;
  onPhotoUpdate: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, userName, userPhoto, userId, onPhotoUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [displayPhoto, setDisplayPhoto] = useState(userPhoto);

  useEffect(() => {
    if (userPhoto) {
      setDisplayPhoto(userPhoto);
    }
  }, [userPhoto]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ফাইল সাইজ চেক (ম্যাক্স ৫ এমবি)
    if (file.size > 5 * 1024 * 1024) {
      alert("ফাইলটি অনেক বড়! দয়া করে ৫ এমবির নিচের ছবি দিন।");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      // ইউনিক ফাইল নেম যাতে ওভাররাইট সমস্যা না হয়
      const fileName = `profiles/${userId}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('department-assets')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: false // নতুন ফাইল হিসেবেই সেভ করা ভালো
        });

      if (uploadError) throw uploadError;

      // পাবলিক ইউআরএল পাওয়া
      const { data } = supabase.storage.from('department-assets').getPublicUrl(fileName);
      const newPhotoUrl = data.publicUrl;
      
      // প্রোফাইল টেবিলে ইউআরএল আপডেট
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: newPhotoUrl })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      setDisplayPhoto(newPhotoUrl);
      onPhotoUpdate(); // App.tsx এর স্টেট আপডেট করার জন্য
      alert("প্রোফাইল ফটো সফলভাবে পরিবর্তন হয়েছে!");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("ফটো আপলোড ব্যর্থ হয়েছে: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // ইনপুট রিসেট
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-earth-americas', minRole: 'cr' },
    { id: 'routine', label: 'Class Routine', icon: 'fa-calendar-alt', minRole: 'cr' },
    { id: 'students', label: 'Students', icon: 'fa-user-graduate', minRole: 'cr' },
    { id: 'teachers', label: 'Faculty', icon: 'fa-chalkboard-teacher', minRole: 'cr' },
    { id: 'notices', label: 'Notices', icon: 'fa-bullhorn', minRole: 'cr' },
    { id: 'gallery', label: 'Memory Gallery', icon: 'fa-images', minRole: 'cr' },
    { id: 'results', label: 'Results', icon: 'fa-poll', minRole: 'admin' },
    { id: 'user-management', label: 'User Roles', icon: 'fa-users-cog', minRole: 'admin' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/20">
          G
        </div>
        <div>
          <h2 className="text-white font-bold leading-none">GeoAdmin</h2>
          <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Geography & Environment</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          if (item.minRole === 'admin' && role !== 'admin') return null;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 translate-x-1' 
                : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="relative group">
            <img 
              src={displayPhoto || `https://ui-avatars.com/api/?name=${userName}&background=10b981&color=fff`} 
              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 bg-slate-700"
              alt="Profile"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${userName}&background=10b981&color=fff`;
              }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] text-white hover:bg-emerald-500 transition-colors border border-slate-900 shadow-sm"
              disabled={uploading}
              title="Change Photo"
            >
              <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[9px] text-emerald-400 truncate uppercase tracking-widest font-black">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
