import React from 'react';

// Base Shimmer Effect
export const ShimmerBase = ({ className }: { className: string }) => (
  <div className={`bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden ${className}`}>
     <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
  </div>
);

export const MovieCardSkeleton = () => {
  return (
    <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden relative">
      <ShimmerBase className="w-full h-full" />
      <div className="absolute bottom-4 left-4 right-4">
         <ShimmerBase className="h-4 w-3/4 rounded mb-2 bg-neutral-300 dark:bg-neutral-700" />
         <ShimmerBase className="h-3 w-1/2 rounded bg-neutral-300 dark:bg-neutral-700" />
      </div>
    </div>
  );
};

export const DetailSkeleton = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Skeleton */}
      <div className="relative h-[50vh] md:h-[65vh] w-full bg-neutral-200 dark:bg-neutral-900 animate-pulse">
         {/* Fake Nav */}
         <div className="absolute top-0 left-0 right-0 p-8 flex justify-between">
            <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-800"></div>
            <div className="w-32 h-12 rounded-full bg-neutral-300 dark:bg-neutral-800"></div>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Poster Skeleton */}
            <div className="hidden md:block flex-shrink-0 w-64 lg:w-80">
                <ShimmerBase className="w-full aspect-[2/3] rounded-2xl shadow-2xl border-4 border-white dark:border-neutral-800" />
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 pt-4 md:pt-24 space-y-6">
                 {/* Title */}
                 <ShimmerBase className="h-10 md:h-14 w-3/4 rounded-lg" />
                 
                 {/* Metadata pills */}
                 <div className="flex gap-3">
                    <ShimmerBase className="h-6 w-16 rounded" />
                    <ShimmerBase className="h-6 w-16 rounded" />
                    <ShimmerBase className="h-6 w-16 rounded" />
                 </div>

                 {/* Overview */}
                 <div className="space-y-2 pt-4">
                    <ShimmerBase className="h-4 w-full rounded" />
                    <ShimmerBase className="h-4 w-full rounded" />
                    <ShimmerBase className="h-4 w-5/6 rounded" />
                 </div>

                 {/* Cast Circles */}
                 <div className="pt-4 flex gap-4 overflow-hidden">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2">
                             <ShimmerBase className="w-20 h-20 rounded-full" />
                             <ShimmerBase className="w-16 h-3 rounded" />
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};