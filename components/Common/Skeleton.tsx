import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({
  className = '',
  width,
  height,
  circle = false,
  variant = 'rectangular',
}: SkeletonProps) {
  const baseClass =
    'bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse';

  const variantClass = {
    text: 'rounded-md h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  return (
    <div
      className={`${baseClass} ${variantClass[variant]} ${className}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100px'),
      }}
    />
  );
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton height={16} width="30%" variant="text" />
      <Skeleton height={40} width="100%" variant="rectangular" />
    </div>
  );
}

export function FormSkeleton({ fields = 6 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, idx) => (
        <FormFieldSkeleton key={idx} />
      ))}
    </div>
  );
}

export function PaymentFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Skeleton height={8} width="30%" variant="text" />
        <Skeleton height={12} width="100%" variant="rectangular" />
      </div>

      {/* Form Fields */}
      <FormSkeleton fields={4} />

      {/* Buttons */}
      <div className="flex gap-4">
        <Skeleton height={40} width="20%" variant="rectangular" />
        <Skeleton height={40} width="20%" variant="rectangular" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="space-y-4">
        <Skeleton height={16} width="60%" variant="text" />
        <Skeleton height={32} width="80%" variant="text" />
        <Skeleton height={12} width="40%" variant="text" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height={32} width="40%" variant="text" />
        <Skeleton height={16} width="60%" variant="text" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <StatCardSkeleton key={idx} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Skeleton height={20} width="30%" variant="text" className="mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} height={16} width="100%" variant="text" />
          ))}
        </div>
      </div>
    </div>
  );
}
