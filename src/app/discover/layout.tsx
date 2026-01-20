export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2">
      {children}
    </div>
  );
}
