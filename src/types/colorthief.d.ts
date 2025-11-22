declare module 'colorthief' {
  export type Color = [number, number, number];
  export type Palette = Color[];

  export default class ColorThief {
    getColor(sourceImage: HTMLImageElement | null, quality?: number): Color;
    getPalette(sourceImage: HTMLImageElement | null, colorCount?: number, quality?: number): Palette;
    getColorAsync(imageUrl: string, callback: (color: Color, element: HTMLImageElement) => void, quality?: number): void;
  }
}

