
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Profile } from '../types';

interface UserManagerProps {
  setActiveTab: (tab: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ setActiveTab }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetModalUser, setResetModalUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setProfiles(data);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      alert(`User role updated to ${newRole}!`);
      fetchProfiles();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      alert("User profile deleted.");
      await fetchProfiles();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;
    setResetting(true);
    try {
      const { error } = await supabase.auth.admin.updateUserById(resetModalUser.id, { password: newPassword });
      if (error) throw error;
      alert(`Password updated!`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading && profiles.length === 0) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xl font-black text-slate-900 uppercase">User Roles</h3>
        <button onClick={() => setActiveTab('dashboard')} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><i className="fas fa-times text-xl"></i></button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
            <tr>
              <th className="px-8 py-5">User Info</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-8 py-5">
                  <div className="font-black text-slate-900">{p.full_name || 'Anonymous'}</div>
                  <div className="text-xs font-bold text-slate-500">{(p.email || '').toLowerCase()}</div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    p.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    p.role === 'cr' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => setResetModalUser(p)} className="text-amber-600 p-2 uppercase text-[10px] font-black"><i className="fas fa-key"></i> Pass</button>
                  {p.role === 'pending' && (
                    <button onClick={() => updateRole(p.id, 'cr')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black">Approve CR</button>
                  )}
                  {p.role !== 'admin' && (
                    <button onClick={() => updateRole(p.id, 'admin')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black">Admin</button>
                  )}
                  {p.email !== 'abdullahisraf0@gmail.com' && (
                    <button onClick={() => deleteUser(p.id)} className="text-red-300 hover:text-red-500 p-2"><i className="fas fa-trash-alt"></i></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetModalUser && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[3rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in duration-300">
            <h3 className="text-xl font-black mb-6">Reset Password</h3>
            <p className="text-xs font-bold text-slate-400 mb-4">{resetModalUser.full_name}</p>
            <input 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold mb-6"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setResetModalUser(null)} className="flex-1 py-4 text-xs font-black uppercase text-slate-400">Cancel</button>
              <button onClick={handleResetPassword} disabled={resetting} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
