
import React, { useEffect, useState } from 'react';
import { AdminService, AdminDashboardData } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getAvatarUrl } from '../../utils/avatarUtils';

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, subValue, icon, colorClass, trend }: any) => (
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
      <div className="flex items-end gap-2">
        <h3 className="text-3xl font-black text-neutral-900 dark:text-white">{value}</h3>
        {subValue && <span className="text-sm font-medium text-neutral-400 mb-1">{subValue}</span>}
      </div>
      {trend && (
         <div className="mt-2 text-[10px] font-bold text-neutral-400">
            {trend}
         </div>
      )}
    </div>
  </div>
);

// CSS-only Simple Bar Chart
const ActivityChart = ({ data }: { data: { date: string; count: number }[] }) => {
    if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-neutral-400 text-xs">Veri yok</div>;
    const max = Math.max(...data.map(d => d.count), 1);
    
    return (
        <div className="flex items-end justify-between h-48 gap-2 pt-8 pb-2">
            {data.map((point, idx) => {
                const heightPercent = (point.count / max) * 100;
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full relative flex items-end h-full bg-neutral-100 dark:bg-neutral-800 rounded-t-lg overflow-hidden">
                             <div 
                                className="w-full bg-indigo-500 dark:bg-indigo-600 transition-all duration-1000 ease-out group-hover:bg-indigo-400"
                                style={{ height: `${Math.max(heightPercent, 5)}%` }}
                             ></div>
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

// Donut Chart (CSS Conic Gradient)
const PrivacyDonut = ({ publicCount, privateCount }: { publicCount: number, privateCount: number }) => {
    const total = publicCount + privateCount;
    const publicPercent = total > 0 ? (publicCount / total) * 100 : 0;
    
    return (
        <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                 style={{ background: `conic-gradient(#10b981 ${publicPercent}%, #3f3f46 0)` }}
            >
                <div className="w-16 h-16 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-neutral-500">%{(publicPercent).toFixed(0)}</span>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Herkese Açık ({publicCount})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-neutral-700"></span>
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Gizli ({privateCount})</span>
                </div>
            </div>
        </div>
    );
};

const Leaderboard = ({ curators }: { curators: any[] }) => (
    <div className="space-y-4">
        {curators.map((user, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="font-bold text-neutral-400 w-4 text-center">{idx + 1}</div>
                <img src={getAvatarUrl(user.avatar_url)} alt={user.username} className="w-8 h-8 rounded-full bg-white" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user.username || 'Anonim'}</div>
                </div>
                <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded">
                    {user.list_count} Liste
                </div>
            </div>
        ))}
        {curators.length === 0 && <div className="text-xs text-neutral-400 text-center py-4">Veri yok</div>}
    </div>
);

const ProgressBar = ({ label, value, max, color }: any) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-neutral-500">{label}</span>
            <span className={color}>{value} / {max}</span>
        </div>
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${Math.min((value/max)*100, 100)}%` }}></div>
        </div>
    </div>
);

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

  // Calculate percentages or fallbacks
  const listFillRate = stats ? Math.min(Math.round(stats.avg_list_size), 100) : 0;

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Header */}
      <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider mb-4 border border-red-100 dark:border-red-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Sistem Yöneticisi
          </div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Kontrol Paneli</h1>
          <p className="text-neutral-500 mt-2">Platform metrikleri ve sistem durumu.</p>
      </div>

      {/* 1. KEY METRICS ROW (DAU/MAU EMPHASIS) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Günlük Aktif (DAU)" 
            value={stats?.dau} 
            colorClass="text-emerald-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            trend="Son 24 saat"
          />
          <StatCard 
            title="Aylık Aktif (MAU)" 
            value={stats?.mau} 
            colorClass="text-blue-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            trend="Son 30 gün"
          />
          <StatCard 
            title="Tutunma Oranı" 
            value={`%${stats?.retention_rate}`} 
            colorClass="text-indigo-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
            trend="Aktiflik / Toplam"
          />
          <StatCard 
            title="Kayıp Adayı" 
            value={stats?.churn_candidates} 
            colorClass="text-red-500"
            icon={<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            trend=">60 gün inaktif"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* 2. ACTIVITY CHART & PRIVACY */}
          <div className="lg:col-span-2 space-y-6">
              {/* Activity */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                      <div>
                          <h3 className="font-bold text-neutral-900 dark:text-white">Liste Oluşturma Aktivitesi</h3>
                          <p className="text-xs text-neutral-500">Son 7 günlük trend</p>
                      </div>
                  </div>
                  <ActivityChart data={stats?.chart_data || []} />
              </div>

              {/* Advanced Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Privacy Donut */}
                  <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                      <h3 className="font-bold text-neutral-900 dark:text-white mb-6">Gizlilik Tercihleri</h3>
                      <PrivacyDonut publicCount={stats?.public_lists || 0} privateCount={stats?.private_lists || 0} />
                  </div>

                  {/* Avg List Size */}
                  <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                      <h3 className="font-bold text-neutral-900 dark:text-white mb-2">Ortalama Liste Doluluğu</h3>
                      <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-2">
                          {stats?.avg_list_size} <span className="text-base font-medium text-neutral-400">film/liste</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${listFillRate}%` }}></div>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-2 text-right">Hedef: 20+</p>
                  </div>
              </div>
          </div>

          {/* 3. RIGHT SIDEBAR (LEADERBOARD & SYSTEM) */}
          <div className="space-y-6">
              
              {/* Leaderboard */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      En Aktif Küratörler
                  </h3>
                  <Leaderboard curators={stats?.top_curators || []} />
              </div>

              {/* Database Health */}
              <div className="bg-neutral-900 dark:bg-white rounded-3xl p-6 text-white dark:text-black shadow-xl">
                  <h3 className="font-bold mb-4">Veritabanı Sağlığı</h3>
                  <ProgressBar label="Kullanıcı Kotası" value={stats?.total_users} max={10000} color="text-green-400 dark:text-green-600" />
                  <ProgressBar label="Liste Kotası" value={stats?.total_lists} max={50000} color="text-blue-400 dark:text-blue-600" />
                  <ProgressBar label="Depolama (İncelemeler)" value={stats?.total_reviews} max={100000} color="text-purple-400 dark:text-purple-600" />
                  
                  <div className="mt-4 pt-4 border-t border-white/10 dark:border-black/10 flex items-center justify-between text-xs opacity-70">
                      <span>Durum</span>
                      <span className="font-bold text-green-400 dark:text-green-600">Sağlıklı</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminView;
