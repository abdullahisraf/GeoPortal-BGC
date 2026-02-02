
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('cr');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName,
              requested_role: selectedRole 
            } 
          }
        });
        if (signUpError) throw signUpError;
        alert('রেজিস্ট্রেশন সফল হয়েছে! অ্যাডমিন অ্যাপ্রুভালের জন্য অপেক্ষা করুন।');
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-xl shadow-emerald-500/20">
              G
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">
              {isSignUp ? 'Registration' : 'Portal Login'}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">Geography & Environment Department</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button 
              onClick={() => setIsSignUp(false)} 
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${!isSignUp ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              লগইন
            </button>
            <button 
              onClick={() => setIsSignUp(true)} 
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${isSignUp ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              রেজিস্ট্রেশন
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                required
                placeholder="আপনার পূর্ণ নাম"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:border-emerald-500 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}

            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">লগইন/রেজিস্ট্রেশন রোল</label>
              <select 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:border-emerald-500 appearance-none cursor-pointer font-bold"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              >
                <option value="admin">Administrator (Admin)</option>
                <option value="cr">Class Representative (CR)</option>
              </select>
              <div className="absolute right-5 bottom-4 pointer-events-none text-slate-400">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>

            <input
              type="email"
              required
              placeholder="ইমেইল অ্যাড্রেস"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:border-emerald-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="পাসওয়ার্ড"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl outline-none focus:border-emerald-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-bold animate-pulse">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
            >
              {loading ? 'প্রসেসিং হচ্ছে...' : (isSignUp ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন')}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-100 pt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
              Developed by <br/>
              <span className="text-emerald-600 text-sm tracking-normal">ABDULLAH AL ISRAF</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
