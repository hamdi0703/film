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
  onClick?: () => void; // Interactivity hook
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
}> = {
    pink: {
        gradient: 'from-pink-500 to-rose-600',
        text: 'text-pink-600',
        textDark: 'dark:text-pink-400',
        bg: 'bg-pink-500',
        hoverText: 'hover:text-pink-600',
        hoverTextDark: 'dark:hover:text-pink-400',
        border: 'bg-pink-600'
    },
    cyan: {
        gradient: 'from-cyan-500 to-blue-600',
        text: 'text-cyan-600',
        textDark: 'dark:text-cyan-400',
        bg: 'bg-cyan-500',
        hoverText: 'hover:text-cyan-600',
        hoverTextDark: 'dark:hover:text-cyan-400',
        border: 'bg-cyan-600'
    },
    indigo: {
        gradient: 'from-indigo-500 to-purple-500',
        text: 'text-indigo-600',
        textDark: 'dark:text-indigo-400',
        bg: 'bg-indigo-500',
        hoverText: 'hover:text-indigo-600',
        hoverTextDark: 'dark:hover:text-indigo-400',
        border: 'bg-indigo-600'
    },
    amber: {
        gradient: 'from-amber-500 to-orange-600',
        text: 'text-amber-600',
        textDark: 'dark:text-amber-400',
        bg: 'bg-amber-500',
        hoverText: 'hover:text-amber-600',
        hoverTextDark: 'dark:hover:text-amber-400',
        border: 'bg-amber-600'
    },
    green: {
        gradient: 'from-green-500 to-emerald-600',
        text: 'text-green-600',
        textDark: 'dark:text-green-400',
        bg: 'bg-green-500',
        hoverText: 'hover:text-green-600',
        hoverTextDark: 'dark:hover:text-green-400',
        border: 'bg-green-600'
    }
};

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, subtitle, data, theme, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) return null;

  const styles = THEME_STYLES[theme];
  
  const visibleData = isExpanded ? data.slice(0, 10) : data.slice(0, 5);
  const hasMore = data.length > 5;
  const maxCount = data[0]?.count || 1;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] text-neutral-400">{subtitle}</span>
      </div>

      <div className="space-y-4 flex-1">
        {visibleData.map((item, index) => {
          const isClickable = !!item.onClick;
          
          return (
            <div 
                key={`${item.id}-${index}`} 
                className={`flex items-center gap-3 group animate-slide-in-up ${isClickable ? 'cursor-pointer' : ''}`} 
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => isClickable && item.onClick && item.onClick()}
            >
                
                {/* Visual Circle (Image or Icon) */}
                <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                    <div className={`absolute inset-0 bg-gradient-to-tr ${styles.gradient} rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity`}></div>
                    
                    {type === 'image' && item.image ? (
                        <img 
                            src={item.image.startsWith('http') ? item.image : `${IMAGE_BASE_URL}${item.image}`} 
                            alt={item.label}
                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-800 relative z-10 bg-neutral-200 dark:bg-neutral-800"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=?'; }}
                        />
                    ) : (
                        <div className="w-full h-full rounded-full border-2 border-white dark:border-neutral-800 relative z-10 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-col leading-none">
                            {item.metadata && <span className="text-[9px] text-neutral-400 font-medium mb-0.5">{item.metadata}</span>}
                            <span className={`text-lg filter grayscale group-hover:grayscale-0 transition-all ${item.icon && typeof item.icon === 'string' ? '' : `${styles.text} ${styles.textDark} font-bold`}`}>
                                {item.icon || item.label.charAt(0)}
                            </span>
                        </div>
                    )}

                    <div className={`absolute -bottom-1 -right-1 z-20 ${styles.border} text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-900`}>
                        {item.count}
                    </div>
                </div>
                
                {/* Content & Progress */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate transition-colors ${isClickable ? `${styles.hoverText} ${styles.hoverTextDark}` : 'text-neutral-900 dark:text-white'}`}>
                        {item.label}
                    </p>
                    {item.subLabel && <p className="text-[10px] text-neutral-500 truncate mb-0.5">{item.subLabel}</p>}
                    
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${styles.bg}`} 
                            style={{ width: `${Math.min((item.count / maxCount) * 100, 100)}%` }}
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
            className={`w-full mt-6 py-2 text-xs font-bold text-neutral-500 ${styles.hoverText} ${styles.hoverTextDark} hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1`}
        >
            {isExpanded ? (
                <>
                    <span>Daha Az Göster</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </>
            ) : (
                <>
                    <span>Daha Fazla Göster</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </>
            )}
        </button>
      )}
    </div>
  );
};

export default AnalyticsCard;