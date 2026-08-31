export default function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-16 px-8 flex items-center justify-between">
        {/* Logo and Bank Name Skeleton */}
        <div className="flex items-center gap-3">
          {/* Logo skeleton */}
          <div className="w-10 h-10 bg-slate-200 rounded-lg animate-shimmer"></div>

          {/* Text skeleton */}
          <div className="hidden sm:flex flex-col gap-2">
            <div className="h-4 w-32 bg-slate-200 rounded animate-shimmer"></div>
            <div className="h-3 w-24 bg-slate-100 rounded animate-shimmer"></div>
          </div>
        </div>

        {/* Center Navigation Skeleton */}
        <nav className="hidden md:flex items-center gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-lg animate-shimmer"></div>
          ))}
        </nav>

        {/* User Section Skeleton */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
            {/* User info skeleton */}
            <div className="flex flex-col gap-2 text-right">
              <div className="h-4 w-20 bg-slate-200 rounded animate-shimmer"></div>
              <div className="h-3 w-24 bg-slate-100 rounded animate-shimmer"></div>
            </div>
            {/* Logout button skeleton */}
            <div className="w-8 h-8 bg-slate-100 rounded-lg animate-shimmer"></div>
          </div>

          {/* Mobile menu skeleton */}
          <div className="md:hidden w-8 h-8 bg-slate-100 rounded-lg animate-shimmer"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>
    </header>
  );
}
