
import React, { useEffect, useState } from 'react';
import { AdminService, AdminDashboardData } from '../../services/adminService';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, growth, icon, colorClass }: any) => (
  <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 ${colorClass}`}>
      {icon}
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-2">
         <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass}`}>
             {React.cloneElement(icon, { className: "w-5 h-5" })}
         </div>
         <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-neutral-900 dark:text-white">{value}</h3>
        {growth !== undefined && (
             <span className="text-xs font-bold text-green-500 flex items-center bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                +{growth} bu ay
             </span>
        )}
      </div>
    </div>
  </div>
);

// CSS-only Simple Bar Chart to avoid heavy libraries
const ActivityChart = ({ data }: { data: { date: string; count: number }[] }) => {
    if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-neutral-400 text-xs">Veri yok</div>;
    
    const max = Math.max(...data.map(d => d.count));
    
    return (
        <div className="flex items-end justify-between h-48 gap-2 pt-8 pb-2">
            {data.map((point, idx) => {
                const heightPercent = max > 0 ? (point.count / max) * 100 : 0;
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full relative flex items-end h-full bg-neutral-100 dark:bg-neutral-800 rounded-t-lg overflow-hidden">
                             <div 
                                className="w-full bg-indigo-500 dark:bg-indigo-600 transition-all duration-1000 ease-out group-hover:bg-indigo-400"
                                style={{ height: `${Math.max(heightPercent, 5)}%` }}
                             ></div>
                             {/* Tooltip */}
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                 {point.count}
                             </div>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400">{point.date}</span>
                    </div>
                )
            })}
        </div>
    )
}

const AdminView: React.FC = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            const data = await AdminService.getDashboardData();
            setStats(data);
        } catch (e: any) {
            showToast('Admin verileri alınamadı: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [showToast]);

  if (loading) {
      return (
          <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Header Section */}
      <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider mb-4 border border-red-100 dark:border-red-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Sistem Yöneticisi
          </div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Kontrol Paneli</h1>
          <p className="text-neutral-500 mt-2">Platform metrikleri ve sistem durumu.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Toplam Kullanıcı" 
            value={stats?.total_users} 
            growth={stats?.new_users_monthly}
            colorClass="text-blue-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
          <StatCard 
            title="Aktif Listeler" 
            value={stats?.total_lists} 
            growth={stats?.new_lists_monthly}
            colorClass="text-purple-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
          <StatCard 
            title="Toplam İnceleme" 
            value={stats?.total_reviews} 
            colorClass="text-amber-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
          />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">Aktivite Grafiği</h3>
                      <p className="text-xs text-neutral-500">Son 7 günde oluşturulan listeler</p>
                  </div>
                  <div className="flex gap-2">
                       <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                       <span className="text-xs font-medium text-neutral-500">Listeler</span>
                  </div>
              </div>
              <ActivityChart data={stats?.chart_data || []} />
          </div>

          {/* Quick Actions / Status */}
          <div className="space-y-6">
              <div className="bg-neutral-900 dark:bg-white rounded-3xl p-6 text-white dark:text-black shadow-xl">
                  <h3 className="font-bold mb-2">Sistem Durumu</h3>
                  <div className="flex items-center gap-2 mb-4">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium opacity-90">Tüm sistemler operasyonel</span>
                  </div>
                  <div className="h-px bg-white/20 dark:bg-black/10 w-full mb-4"></div>
                  <div className="grid grid-cols-2 gap-4 text-xs opacity-80">
                      <div>
                          <span className="block font-bold">Veritabanı</span>
                          <span>Supabase (PostgreSQL)</span>
                      </div>
                      <div>
                          <span className="block font-bold">API</span>
                          <span>TMDB v3</span>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Hızlı İşlemler</h3>
                  <div className="space-y-3">
                      <button disabled className="w-full py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-xs font-bold text-left flex items-center justify-between cursor-not-allowed">
                          <span>Kullanıcı Yönetimi</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </button>
                      <button disabled className="w-full py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-xs font-bold text-left flex items-center justify-between cursor-not-allowed">
                          <span>Duyuru Yayınla</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminView;
