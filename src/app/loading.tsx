export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="container mx-auto px-4 pt-24">
        <div className="h-8 w-48 bg-surface-hover rounded mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-surface-hover rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
