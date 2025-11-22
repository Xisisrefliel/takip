import { Book } from "lucide-react";

export default function BooksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in duration-500">
      <div className="w-32 h-32 rounded-3xl bg-linear-to-br from-accent/20 to-accent/5 border border-accent/10 flex items-center justify-center text-accent shadow-2xl shadow-accent/10">
        <Book size={64} strokeWidth={1.5} />
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/50">
          Books
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
          A completely new system to track your reading journey. 
          <br />
          Coming soon to your library.
        </p>
      </div>
    </div>
  );
}

