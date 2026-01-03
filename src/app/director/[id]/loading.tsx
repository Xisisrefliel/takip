export default function PersonPageLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="container mx-auto px-6 pt-24 md:pt-32">
        <div className="h-10 w-64 bg-surface-hover rounded mb-12" />
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-surface-hover rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
