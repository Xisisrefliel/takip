"use client";
import React, { useState } from 'react';

interface BookData {
  title: string;
  spineColor: string;
  spineTextColor: string;
  coverImage: string;
}

const books: BookData[] = [
  {
    title: "The Creative Act",
    spineColor: "rgb(219, 219, 219)",
    spineTextColor: "rgb(22, 25, 31)",
    coverImage: "https://framerusercontent.com/images/I2ofOSfZ5O2tJk7g2xIf0GnMzd8.jpg?width=990&height=1500"
  },
  {
    title: "Wuthering Heights",
    spineColor: "rgb(76, 71, 39)",
    spineTextColor: "rgb(213, 213, 213)",
    coverImage: "https://framerusercontent.com/images/3POpDB30gM2mbKtOqKMPa16gAw.jpg?width=667&height=1000"
  },
  {
    title: "Begin Again",
    spineColor: "rgb(251, 194, 70)",
    spineTextColor: "rgb(22, 25, 31)",
    coverImage: "https://framerusercontent.com/images/JLnJZDPJ2yubUSzTzx32dzsi4N4.jpg?width=667&height=1000"
  },
  {
    title: "Genius Behind Apple",
    spineColor: "rgb(22, 40, 34)",
    spineTextColor: "rgb(237, 238, 240)",
    coverImage: "https://framerusercontent.com/images/ZgEeuI5Vhe2PEJNfH3mvaSQTrf0.jpg?width=699&height=1000"
  },
  {
    title: "The Design of Everyday Things",
    spineColor: "rgb(246, 218, 60)",
    spineTextColor: "rgb(22, 25, 31)",
    coverImage: "https://framerusercontent.com/images/zGdlx1ZDavK6xkO6kRYPTZ1YfeU.jpg?width=667&height=1000"
  },
  {
    title: "A Beautifully Foolish Endeavor",
    spineColor: "rgb(243, 58, 34)",
    spineTextColor: "rgb(22, 25, 31)",
    coverImage: "https://framerusercontent.com/images/plIcJABiUsv8NcFf8kBppbFsdl0.jpg?width=667&height=1000"
  }
];

const BookItem = ({ book, index, isHovered, onHover }: { book: BookData, index: number, isHovered: boolean, onHover: (idx: number | null) => void }) => {
  return (
    <div
      className="flex flex-row justify-start outline-none shrink-0"
      style={{
        width: 'clamp(140px, 16vw, 220px)',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        marginLeft: 'clamp(-4px, -0.5vw, -6.7px)',
        transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, margin',
        marginRight: isHovered ? 'calc(300px - clamp(140px, 16vw, 220px))' : 'clamp(-90px, -13vw, -145px)',
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Spine */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          flexShrink: 0,
          transformOrigin: 'right center',
          backgroundColor: book.spineColor,
          color: book.spineTextColor,
          transform: isHovered ? 'rotateY(-50deg)' : 'rotateY(-20deg)',
          transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          filter: 'brightness(0.8) contrast(2)',
          userSelect: 'none',
          width: '50px',
          maxWidth: '50px',
          height: '350px',
          borderRadius: '2px 0 0 2px',
        }}
      >
        <span
          className="pointer-events-none absolute z-50 h-full w-full opacity-40"
          style={{ filter: 'url("#paper")', userSelect: 'none' }}
        />
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(10px, 1.2vw, 16px)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: '1em',
            writingMode: 'vertical-rl',
            marginTop: 'clamp(6px, 1vw, 12px)',
            userSelect: 'none',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxHeight: '90%',
            overflow: 'hidden',
          }}
        >
          {book.title}
        </h2>
      </div>

      {/* Cover */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          transformOrigin: 'left center',
          transform: isHovered ? 'rotateY(0deg)' : 'rotateY(55deg)',
          transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          filter: 'brightness(0.8) contrast(2)',
          userSelect: 'none',
          height: '350px',
          width: '240px',
          maxWidth: '240px',
          borderRadius: '0 4px 4px 0',
        }}
      >
        <span
          className="pointer-events-none absolute z-50 h-full w-full opacity-40"
          style={{ filter: 'url("#paper")', userSelect: 'none' }}
        />
        <span
          className="pointer-events-none absolute top-0 left-0 z-50 h-full w-full"
          style={{
            userSelect: 'none',
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0) 2px, rgba(255, 255, 255, 0.5) 3px, rgba(255, 255, 255, 0.25) 4px, rgba(255, 255, 255, 0.25) 6px, transparent 7px, transparent 9px, rgba(255, 255, 255, 0.25) 9px, transparent 12px)'
          }}
        />
        <img
          alt={book.title}
          src={book.coverImage}
          style={{
            transition: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
            maxHeight: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            display: 'block',
            height: '350px',
            width: '240px',
            maxWidth: '240px',
          }}
        />
      </div>
    </div>
  );
};

export default function Book3DFlip() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-center gap-8 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-12">
        {/* SVG Filters */}
        <svg style={{ position: 'absolute', inset: 0, visibility: 'hidden', width: 0, height: 0 }}>
          <defs>
            <filter id="paper" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1" numOctaves="8" result="noise" />
              <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="1" result="diffLight">
                <feDistantLight azimuth="45" elevation="35" />
              </feDiffuseLighting>
            </filter>
          </defs>
        </svg>

        <div
          className="flex flex-row items-center justify-center"
          style={{
            width: '100%',
            maxWidth: '100%',
            overflow: 'auto hidden',
            perspective: '2000px',
            perspectiveOrigin: 'center center',
            scrollbarWidth: 'none',
          }}
        >
          {books.map((book, index) => (
            <BookItem
              key={index}
              book={book}
              index={index}
              isHovered={hoveredIndex === index}
              onHover={setHoveredIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}