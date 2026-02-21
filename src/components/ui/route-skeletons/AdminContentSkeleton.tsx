import React from 'react';

const AdminContentSkeleton: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
      
      {/* Main content skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-36 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminContentSkeleton;
