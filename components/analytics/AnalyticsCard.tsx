import React, { useState } from 'react';
import { IMAGE_BASE_URL } from '../../services/tmdbService';

export interface AnalyticsItem {
  id: string | number;
  label: string;
  subLabel?: string; 
  count: number;
  image?: string | null; 
  icon?: React.ReactNode; 
  metadata?: string; 
  onClick?: () => void; 
}

export type AnalyticsTheme = 'pink' | 'cyan' | 'indigo' | 'amber' | 'green';

interface AnalyticsCardProps {
  title: string;
  subtitle: string;
  data: AnalyticsItem[];
  theme: AnalyticsTheme;
  type: 'image' | 'icon'; 
}

const THEME_STYLES: Record<AnalyticsTheme, { 
    gradient: string; 
    text: string; 
    textDark: string; 
    bg: string; 
    hoverText: string;
    hoverTextDark: string;
    border: string;
    iconBg: string;
}> = {
    pink: {
        gradient: 'from-pink-500 to-rose-600',
        text: 'text-pink-600',
        textDark: 'dark:text-pink-400',
        bg: 'bg-pink-500',
        hoverText: 'hover:text-pink-700',
        hoverTextDark: 'dark:hover:text-pink-300',
        border: 'border-pink-500',
        iconBg: 'bg-pink-50 dark:bg-pink-900/20'
    },
    cyan: {
        gradient: 'from-cyan-500 to-blue-600',
        text: 'text-cyan-600',
        textDark: 'dark:text-cyan-400',
        bg: 'bg-cyan-500',
        hoverText: 'hover:text-cyan-700',
        hoverTextDark: 'dark:hover:text-cyan-300',
        border: 'border-cyan-500',
        iconBg: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    indigo: {
        gradient: 'from-indigo-500 to-purple-600',
        text: 'text-indigo-600',
        textDark: 'dark:text-indigo-400',
        bg: 'bg-indigo-500',
        hoverText: 'hover:text-indigo-700',
        hoverTextDark: 'dark:hover:text-indigo-300',
        border: 'border-indigo-500',
        iconBg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    amber: {
        // DÜZELTME: Sarı renkler daha okunabilir hale getirildi (Darker Amber)
        gradient: 'from-amber-400 to-orange-600',
        text: 'text-amber-700', 
        textDark: 'dark:text-amber-400',
        bg: 'bg-amber-500',
        hoverText: 'hover:text-amber-900',
        hoverTextDark: 'dark:hover:text-amber-300',
        border: 'border-amber-500',
        iconBg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    green: {
        gradient: 'from-emerald-500 to-teal-600',
        text: 'text-emerald-600',
        textDark: 'dark:text-emerald-400',
        bg: 'bg-emerald-500',
        hoverText: 'hover:text-emerald-700',
        hoverTextDark: 'dark:hover:text-emerald-300',
        border: 'border-emerald-500',
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
};

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, subtitle, data, theme, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Veri kontrolü
  if (!data || data.length === 0) return null;

  const styles = THEME_STYLES[theme];
  
  // MANTIK: Varsayılan 5, Genişleyince Maksimum 10
  const visibleData = isExpanded ? data.slice(0, 10) : data.slice(0, 5);
  const hasMore = data.length > 5;
  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm animate-fade-in flex flex-col h-full min-h-[320px]">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">{title}</h3>
            <span className={`text-sm font-bold ${styles.text} ${styles.textDark}`}>{subtitle}</span>
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${styles.iconBg} ${styles.text} ${styles.textDark}`}>
            {data.length > 10 ? '10+' : data.length}
        </div>
      </div>

      <div className="space-y-5 flex-1">
        {visibleData.map((item, index) => {
          const isClickable = !!item.onClick;
          const percentage = Math.max((item.count / maxCount) * 100, 5); // Min 5% width
          
          return (
            <div 
                key={`${item.id}-${index}`} 
                className={`flex items-center gap-3 group animate-slide-in-up ${isClickable ? 'cursor-pointer' : ''}`} 
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => isClickable && item.onClick && item.onClick()}
            >
                
                {/* Visual Circle (Image or Icon) */}
                <div className="relative w-10 h-10 flex-shrink-0">
                    <div className={`absolute inset-0 bg-gradient-to-tr ${styles.gradient} rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-300`}></div>
                    
                    {type === 'image' && item.image ? (
                        <img 
                            src={item.image.startsWith('http') ? item.image : `${IMAGE_BASE_URL}${item.image}`} 
                            alt={item.label}
                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-800 relative z-10 bg-neutral-200 dark:bg-neutral-800"
                            onError={(e) => { 
                                // Resim yüklenemezse gizle, fallback göster
                                (e.target as HTMLElement).style.display = 'none';
                                (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : (
                        <div className={`w-full h-full rounded-full border-2 border-white dark:border-neutral-800 relative z-10 ${styles.iconBg} flex items-center justify-center flex-col leading-none transition-colors`}>
                            {item.metadata && <span className="text-[8px] text-neutral-500 font-bold mb-0.5">{item.metadata}</span>}
                            <span className={`text-base ${styles.text} ${styles.textDark} font-bold`}>
                                {item.icon || item.label.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Hidden Fallback for Broken Images */}
                    <div className={`hidden w-full h-full rounded-full border-2 border-white dark:border-neutral-800 relative z-10 ${styles.iconBg} flex items-center justify-center absolute inset-0`}>
                        <span className={`text-sm ${styles.text} ${styles.textDark} font-bold`}>
                            {item.label.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    {/* Count Badge */}
                    <div className={`absolute -bottom-1 -right-1 z-20 bg-white dark:bg-neutral-900 text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 ${styles.border} text-neutral-900 dark:text-white`}>
                        {item.count}
                    </div>
                </div>
                
                {/* Content & Progress */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                         <p className={`text-sm font-bold truncate transition-colors ${isClickable ? `${styles.hoverText} ${styles.hoverTextDark}` : 'text-neutral-900 dark:text-white'}`}>
                            {item.label}
                        </p>
                    </div>
                    {item.subLabel && <p className="text-[10px] text-neutral-500 truncate mb-1">{item.subLabel}</p>}
                    
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full bg-gradient-to-r ${styles.gradient} opacity-80`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full mt-6 py-3 text-xs font-bold text-neutral-500 ${styles.hoverText} ${styles.hoverTextDark} bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all flex items-center justify-center gap-1 group`}
        >
            <span>{isExpanded ? 'Daha Az Göster' : 'Daha Fazla Göster'}</span>
            <svg 
                className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
      )}
    </div>
  );
};

export default AnalyticsCard;