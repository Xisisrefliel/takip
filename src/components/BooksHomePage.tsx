"use client";

import { BookCard } from "@/components/BookCard";
import { Carousel } from "@/components/Carousel";
import { Book } from "@/types";
import { motion } from "framer-motion";
import { BookOpen, Plus, Star, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BooksHomePageProps {
  books: Book[];
}

export function BooksHomePage({ books }: BooksHomePageProps) {
  const heroBook = books[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {!heroBook ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-white/50 gap-4">
          <Search size={40} className="sm:w-12 sm:h-12" strokeWidth={1} />
          <p className="text-base sm:text-lg font-light px-4 text-center">
            No books found. Try another search.
          </p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative w-full rounded-[24px] sm:rounded-[32px] md:rounded-[48px] overflow-hidden aspect-4/5 sm:aspect-video md:h-[75vh] shadow-2xl shadow-black/20 group">
            {/* Background Image - Blurred version of cover */}
            <div className="absolute inset-0">
              <Image
                src={heroBook.coverImage}
                alt={heroBook.title}
                fill
                priority
                quality={20}
                sizes="100vw"
                className="object-cover scale-110 brightness-50 transition-transform duration-1000 group-hover:scale-115"
                style={{ willChange: "transform" }}
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
              {/* Add a clearer version of the cover on the right side on large screens */}
              <div className="absolute right-4 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 hidden lg:block w-[200px] h-[300px] xl:w-[300px] xl:h-[450px] shadow-2xl rotate-[-10deg] opacity-80">
                <Image
                  src={heroBook.coverImage}
                  alt={heroBook.title}
                  fill
                  priority
                  sizes="(max-width: 1280px) 200px, 300px"
                  className="object-cover rounded-lg"
                />
              </div>

              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12 lg:p-16">
              <motion.div
                key={heroBook.id} // Animate when hero changes
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className="max-w-3xl space-y-4 sm:space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                  <span>Featured Result</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white drop-shadow-sm leading-tight">
                  {heroBook.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/90 text-xs sm:text-sm md:text-base font-medium">
                  <span>{heroBook.year}</span>
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 rounded-full" />
                  <span className="line-clamp-1">{heroBook.author}</span>
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 rounded-full" />
                  <span className="line-clamp-1">
                    {heroBook.genre.join(", ")}
                  </span>
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 rounded-full" />
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star
                      size={14}
                      className="sm:w-4 sm:h-4"
                      fill="currentColor"
                    />{" "}
                    {heroBook.rating.toFixed(1)}
                  </span>
                </div>

                <p className="text-sm sm:text-base md:text-lg text-white/80 line-clamp-2 sm:line-clamp-3 max-w-2xl font-light leading-relaxed">
                  {heroBook.description}
                </p>

                <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <Link href={`/book/${heroBook.id}`}>
                    <button className="h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg shadow-white/10 text-sm sm:text-base">
                      <BookOpen size={18} className="sm:w-5 sm:h-5" />
                      <span>Details</span>
                    </button>
                  </Link>
                  <button className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105">
                    <Plus size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Carousel Section */}
          <section>
            <Carousel title="Your Library">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  className="min-w-[120px] w-[120px] sm:min-w-[160px] sm:w-[160px] md:min-w-[180px] md:w-[180px] lg:w-[220px]"
                />
              ))}
            </Carousel>
          </section>
        </>
      )}
    </div>
  );
}
