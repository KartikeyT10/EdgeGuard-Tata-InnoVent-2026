import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="text-blue-500 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}