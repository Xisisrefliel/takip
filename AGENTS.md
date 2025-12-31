# AGENTS.md

## Commands
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun lint` - Run ESLint to check for errors (always do this before committing)
- `bun db:generate` - Generate Drizzle migrations
- `bun db:migrate` - Run database migrations

## Code Style
- Use TypeScript with strict typing; avoid `any`
- Use `clsx` and `tailwind-merge` for class handling
- Use Server Actions for mutations in `src/app/actions.ts`
- Use async/await with proper error handling; handle edge cases
- Component files: `.tsx` for UI, `.ts` for utilities
- Naming: `camelCase` for functions/variables, `PascalCase` for components

## Frontend Guidelines (from Cursor rules)
- Avoid generic AI aesthetics: no Inter/Roboto, no purple gradients
- Use distinctive typography and cohesive themes with CSS variables
- Prefer CSS-only animations; use Framer Motion for React when needed
- Create atmospheric backgrounds with gradients/patterns, not solid colors

## Design & UI Guidelines

### Core Aesthetic
- **Glassmorphism & Transparency**: Extensive use of `backdrop-blur-*` combined with semi-transparent backgrounds (`bg-white/60`, `dark:bg-black/60`, `bg-black/5`) to create depth and a premium feel.
- **Roundness**: Generous border radii.
    - specialized cards: `rounded-[16px]` to `rounded-[48px]`.
    - interactive elements (buttons, inputs, pills): `rounded-full` or `rounded-2xl`.
- **Minimalism**: Content-first approach. Metadata uses lower opacity (`text-foreground/60`). Actions on cards are often revealed on hover to reduce visual noise.

### Color System
- **Neutral Base**: The design relies heavily on monochrome shades (black, white, gray) with alpha channels for adaptability in light/dark modes.
- **Accents**: 
    - Functional colors: Red (`text-red-500`) for 'Like', Yellow (`text-yellow-400`/`500`) for ratings, Accent color for active states.
    - Gradients: Subtle linear gradients for image overlays (`from-black/80 via-black/20 to-transparent`).

### Interactive Elements
- **Micro-interactions**: 
    - Hover effects: `scale-105`, `scale-1.1`, opacity changes.
    - Tap effects: `scale-0.9`, `scale-0.95`.
    - Animated transitions using `framer-motion` (e.g., `layoutId` for nav pills, `AnimatePresence` for dropdowns).
- **Navigation**:
    - "Floating Island" style navbar: detached from the top, centered, pill-shaped, containing navigation pills and search.
    - Active states are marked by background pills (`bg-foreground`) or distinct color changes.

### Typography
- **Hierarchy**:
    - Headings: Bold, `tracking-tight`, responsive sizes (`text-2xl` up to `text-6xl`).
    - Body/Meta: `text-sm` or `text-xs`, often with `font-medium` for readability at small sizes.
    - Labels: Uppercase, tracking-wider, small font size (e.g., "TRENDING NOW" badges).

### Layout Patterns
- **Responsive**: Mobile-first design using standard Tailwind breakpoints (`sm`, `md`, `lg`).
- **Cards**:
    - Aspect ratio control: `aspect-2/3` (portrait posters), `aspect-video` (landscapes).
    - Shadow depth: `shadow-2xl`, `shadow-black/20` to lift elements off the background.
    - Overlays: Gradients used over images to ensure text legibility.

## Remove AI code slop

Remove all AI generated slop introduced in unstaged changes.

This includes:

- Extra comments that a human wouldn't add or is inconsistent with the rest of the file
- Extra defensive checks or try/catch blocks that are abnormal for that area of the codebase (especially if called by trusted / validated codepaths)
- Casts to any to get around type issues - Any other style that is inconsistent with the file

Report at the end with only a 1-3sentence summary of what you changed

