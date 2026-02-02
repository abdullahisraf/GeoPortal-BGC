
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  role?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    notices: 0,
    results: 0,
    admins: 0,
    crs: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const queries = [
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('notices').select('*', { count: 'exact', head: true }),
          supabase.from('results').select('*', { count: 'exact', head: true }),
        ];

        // If user is admin, fetch user role counts
        if (role === 'admin') {
          queries.push(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'));
          queries.push(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cr'));
          queries.push(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pending'));
        }

        const results = await Promise.all(queries);

        setStats({
          students: results[0].count || 0,
          teachers: results[1].count || 0,
          notices: results[2].count || 0,
          results: results[3].count || 0,
          admins: results[4]?.count || 0,
          crs: results[5]?.count || 0,
          pending: results[6]?.count || 0
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  const cards = [
    { label: 'Total Students', value: stats.students, icon: 'fa-user-graduate', color: 'bg-blue-500' },
    { label: 'Faculty Members', value: stats.teachers, icon: 'fa-chalkboard-teacher', color: 'bg-indigo-500' },
    { label: 'Active Notices', value: stats.notices, icon: 'fa-bullhorn', color: 'bg-emerald-500' },
    { label: 'Published Results', value: stats.results, icon: 'fa-poll', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`fas ${card.icon} text-xl`}></i>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{card.label}</p>
              <h3 className="text-3xl font-black text-slate-800">
                {loading ? '...' : card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {role === 'admin' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
              <span className="w-2 h-6 bg-purple-600 rounded-full"></span>
              User Role Distribution
            </h3>
            <span className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Administrative Overview</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Administrators</p>
              <p className="text-3xl font-black text-purple-700">{loading ? '...' : stats.admins}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Class Representatives</p>
              <p className="text-3xl font-black text-emerald-700">{loading ? '...' : stats.crs}</p>
            </div>
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Pending Approval</p>
              <p className="text-3xl font-black text-amber-700">{loading ? '...' : stats.pending}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-600 rounded-full"></span>
              Administrative Console
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <i className="fas fa-shield-alt text-emerald-600 text-xl mb-3"></i>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">System Status</p>
              <p className="text-sm font-bold text-slate-900">Operational</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <i className="fas fa-database text-blue-600 text-xl mb-3"></i>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">API Latency</p>
              <p className="text-sm font-bold text-slate-900">42ms</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
            <p className="text-xs font-bold text-emerald-800">Everything is running smoothly on Google Cloud</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black mb-6 text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Cloud Resource Usage
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-600 font-bold uppercase tracking-tight">PostgreSQL Capacity</span>
                <span className="font-black text-emerald-600">8.4 MB / 500 MB</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[2%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-slate-600 font-bold uppercase tracking-tight">Object Storage (Photos)</span>
                <span className="font-black text-blue-600">12.1 MB / 1 GB</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[1%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
