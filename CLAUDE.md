# Kamon Start Page

## Project Overview

A minimal, aesthetically-focused browser start page featuring hexagonal navigation icons (kamon) inspired by Japanese family crests, with traditional kumiko geometric backgrounds.

**Purpose**: Replace Chrome's default new tab page with a beautiful, functional custom start page.

**Tech Stack**: Pure HTML/CSS/vanilla JavaScript (no frameworks)

## Project Structure

```
/
├── index.html          # Main page structure
├── style.css           # Styling, kumiko patterns, hexagon layout
├── script.js           # Click handlers for navigation
└── CLAUDE.md           # This file
```

## Design Goals

1. **Minimal MVP first**: 4 hexagonal icons on the left side with favicons
2. **Progressive enhancement**: Add kumiko backgrounds, hover effects, shift-click alternates later
3. **Performance**: Lightweight, fast loading, no dependencies

## Initial Implementation Requirements

### Phase 1: Hexagons + Favicons (Current)
- 4 hexagonal shapes positioned on left side of viewport
- Each hexagon contains a favicon for: Claude, Wikipedia, Twitter, Gmail
- SVG hexagons for crisp rendering at any scale
- Simple click handlers to navigate to each site

### Future Phases (Not Yet)
- Kumiko geometric background patterns
- Golden border glow on hover (like Inuyasha title cards)
- Shift-click alternates (Claude→AI Studio, Gmail→Drive)
- CSS filters to unify favicon aesthetics
- Time-of-day background variations

## Navigation Targets

Primary (click):
- Claude: https://claude.ai
- Wikipedia: https://wikipedia.org
- Twitter: https://twitter.com
- Gmail: https://mail.google.com

Secondary (shift+click, future):
- AI Studio: https://aistudio.google.com
- Google Drive: https://drive.google.com

## Technical Notes

- Use CSS Grid or Flexbox for hexagon positioning
- SVG paths for hexagon shapes (6-sided polygon)
- Favicons can be loaded via `https://www.google.com/s2/favicons?domain=example.com` or directly from each site
- Keep all styling inline in single HTML file initially for easy browser bookmark/home page setup

## How to Test

Open `index.html` in browser. Hexagons should be visible on left side with recognizable favicons, clicking should navigate to target sites.