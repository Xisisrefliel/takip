export default function MediaDetailLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-[2/3] bg-surface-hover rounded-2xl" />
          </div>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-10 w-3/4 bg-surface-hover rounded" />
              <div className="h-6 w-1/2 bg-surface-hover rounded" />
            </div>
            
            <div className="h-32 bg-surface-hover rounded-xl" />
            
            <div className="space-y-4">
              <div className="h-8 w-32 bg-surface-hover rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-surface-hover rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
