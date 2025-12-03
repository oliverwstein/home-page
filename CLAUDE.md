# Kamon Start Page

Beautiful browser start page with hexagonal icons (kamon) inspired by Japanese family crests and kumiko geometric patterns.

**Tech**: Pure HTML/CSS/vanilla JS - no frameworks

## Current Implementation

Working features:
- 8 hexagonal kamon tiles (Claude, Github, Wikipedia, Twitter, Gmail, Gemini, Drive, Youtube)
- Hexagonal grid with axial coordinates for positioning
- Drag-and-drop rearrangement with grid snapping and position swapping
- Triple-border kamon design with colored regions (outer/middle/inner)
- Site logos displayed as SVG favicons in center
- Grid overlay visualization during drag
- Click-to-navigate (only if not dragged)

## Design Philosophy

**Japanese aesthetic principles:**
- **Ma (間)**: Negative space and breathing room between elements
- **Restraint**: Rich patterns without overwhelming - kumiko provides texture, not clutter
- **Layered depth**: Multiple thin borders creating subtle dimensionality
- **Geometric harmony**: Hexagonal tiling creates natural, pleasing arrangements

**Kamon structure** (from outer to inner):
1. Outer colored region (largest hexagon)
2. Thin gold border
3. Middle colored region
4. Thin gold border  
5. Inner dark region (favicon container)

**Color palette**: Earth tones, muted jewel tones, gold accents. Each site gets distinct colors in CSS via `data-site` attribute.

## Implementation Notes

**Hexagonal grid math:**
- Uses axial coordinates (q, r) for hex positioning
- Converts to pixel coords: `x = WIDTH * (q + r/2)`, `y = HEIGHT * 3/4 * r`
- Grid snapping uses cube coordinate rounding for accuracy
- Edge validation prevents tiles too close to viewport bounds

**SVG structure:**
- Three nested hexagon polygons at scales 1.0, 0.94, 0.76
- Creates visible borders where polygons don't overlap
- ViewBox 100x100 with center at (50, 50), base radius 43

**Drag behavior:**
- Shows grid overlay (gold dots at valid positions) during drag
- Yellow hex outline highlights target drop position
- Swaps positions if dropping on occupied cell
- Snaps back to original position if dropped in invalid area

## Adding New Sites

1. Add entry to `hexagonData` array in script.js with q/r coordinates and logo path
2. Add site-specific colors in style.css under `.hexagon[data-site="sitename"]`
3. Add logo SVG to `logos/` directory
4. Update preconnect/DNS prefetch hints in index.html

## Next Phase Ideas

- Kumiko pattern backgrounds (asanoha, seigaiha, hemp leaf)
- Hover glow effects on borders (golden, inspired by Inuyasha title cards)
- Shift-click alternate destinations (already partially implemented via `altUrl`)
- Time-of-day aesthetic variations (dawn/day/dusk/night color shifts)
- Persistent layout (save drag positions to localStorage)