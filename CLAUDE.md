# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint (uses eslint, not next lint)
```

No test suite is configured.

## Architecture

Next.js 16 app router project using **Mantine v8** as the primary UI library, with **Tailwind CSS v4** also available.

**Key setup in `app/layout.tsx`:**
- `MantineProvider` wraps the entire app — required for all Mantine components to work
- `ColorSchemeScript` must stay in `<head>` for Mantine's color scheme support
- `@mantine/core/styles.css` is imported here; all other Mantine packages (except `@mantine/hooks`) also need their styles imported at this level

**Component conventions:**
- Components live under `app/components/` organized by category (e.g. `navigation/`, `images/hero/`)
- Each component uses a co-located CSS Module (`.module.css`) for styles
- Interactive components use `"use client"` directive

**Styling approach:** Mantine component props + CSS Modules for custom styles. Tailwind is available but Mantine is the primary styling system. PostCSS runs `postcss-preset-mantine` → `postcss-simple-vars` → `@tailwindcss/postcss` in that order. CSS Modules can use Mantine mixins (e.g. `@mixin hover`) and breakpoint variables in `@media` queries (e.g. `var(--mantine-breakpoint-xs)`) — these are resolved at build time by those plugins.
