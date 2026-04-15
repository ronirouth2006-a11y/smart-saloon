import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-background-card border border-white/5 rounded-2xl p-4 w-full animate-pulse shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          {/* Title and Badge Placeholder */}
          <div className="flex items-center gap-3">
            <div className="h-5 bg-white/10 rounded-md w-1/2"></div>
            <div className="h-4 bg-white/10 rounded-full w-4"></div>
          </div>
          {/* Subtitle Placeholder */}
          <div className="h-3 bg-white/10 rounded-md w-3/4 opacity-60"></div>
        </div>
        {/* Status Badge Placeholder */}
        <div className="h-6 bg-white/10 rounded-full w-24"></div>
      </div>

      {/* Stats Grid Placeholder */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="h-14 bg-white/5 rounded-xl border border-white/5"></div>
        <div className="h-14 bg-white/5 rounded-xl border border-white/5"></div>
      </div>

      {/* Buttons Placeholder */}
      <div className="flex gap-2 mt-4">
        <div className="h-10 bg-white/10 rounded-xl flex-1"></div>
        <div className="h-10 bg-white/10 rounded-xl w-10"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
