# Efrem Torrisi — Portfolio Website

## Overview
Personal portfolio site for a Technical Artist, hosted on GitHub Pages at Efrem-Torrisi.github.io.

## Stack
- Pure HTML / CSS / JS (no build tools, no frameworks)
- Three.js (CDN) for the particle background
- GitHub Pages for hosting

## Structure
- `index.html` — Single-page layout: Hero, Featured Work, About, Group Projects, Contact
- `styles.css` — Dark Apple-inspired theme, CSS custom properties, responsive (768px / 480px breakpoints)
- `main.js` — WIP gate, modal system, scroll-reveal (IntersectionObserver), Three.js particle field
- `projects/*.html` — Individual project detail pages, fetched into a modal overlay via JS
- `content/` — Images, SVG icons, CV PDF, profile photos

## Key Conventions
- No build step — edit files directly, push to main to deploy
- Project cards use `data-project` attribute to link to `projects/{slug}.html`
- Modal routing uses URL hash: `#project/{slug}`
- CSS variables defined in `:root` in styles.css
