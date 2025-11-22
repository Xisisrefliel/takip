import Book3DFlip from "@/components/Book3DFlip";

export default function BooksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="w-full flex justify-center">
        <Book3DFlip />
      </div>
    </div>
  );
}
