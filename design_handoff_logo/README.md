# Handoff: Gold Terminal — Gyroscope Logo Mark

## Overview
A rotating 3D gyroscope logo mark for a personal finance terminal. Three concentric rings animate infinitely, with the owner's name "HACHIM" inscribed on the equatorial ring as a subtle textPath. The mark is generic enough to represent any asset class (not gold-specific).

## About the Design Files
The files in this bundle are **HTML design references** — not production code. Your task is to **recreate this animation in your existing codebase** (React, Vue, Svelte, etc.) using its established patterns. Do not ship the HTML directly.

## Fidelity
**High-fidelity.** Exact colors, typography, animation timing, and proportions should be matched pixel-perfectly.

---

## The Mark

### Concept
Three concentric rings (gyroscope / armillary sphere) rotating on a compound axis. The equatorial ring carries the text `H · A · C · H · I · M ·` inscribed along its circumference. The mark conveys multi-dimensional data reading, precision, and personal ownership — without referencing any specific asset class.

### Container
- Background: `#0a0d12`
- Mark size: `180 × 180px` (scale proportionally as needed)
- Perspective: `700px` on the parent wrapper

### Animation
```css
@keyframes gyro {
  from { transform: rotateX(22deg) rotateY(0deg); }
  to   { transform: rotateX(22deg) rotateY(360deg); }
}
/* Applied to the inner rotating wrapper */
animation: gyro 12s linear infinite;
transform-style: preserve-3d;
```

### Ring 1 — Equatorial (SVG)
Use an SVG instead of a div so `textPath` works:
- Circle: `cx=90 cy=90 r=89`, `stroke: #d4a256`, `stroke-width: 1.5`, `fill: none`
- TextPath: follow the full circle path `M 90,1 A 89,89 0 0 1 90,179 A 89,89 0 0 1 90,1`
  - Font: `IBM Plex Mono`, `font-size: 10px`, `font-weight: 300`
  - Color: `#d4a256`, `opacity: 0.65`
  - Content: `H · A · C · H · I · M ·`
  - `textLength="559"` (= circumference 2π×89 ≈ 559px), `lengthAdjust="spacing"`

### Ring 2 — Vertical meridian
- `border-radius: 50%`, `border: 1.5px solid rgba(212,162,86,0.6)`
- `transform: rotateX(90deg)` (sits perpendicular to equatorial)

### Ring 3 — Perpendicular vertical
- `border-radius: 50%`, `border: 1.5px solid rgba(232,192,118,0.45)`
- `transform: rotateY(90deg)`

### Center dot
- `width: 5px`, `height: 5px`, `border-radius: 50%`
- `background: #d4a256`, `opacity: 0.5`
- Centered absolutely

### Label (optional, below mark)
- Font: `IBM Plex Mono`, `9px`, `letter-spacing: 0.3em`
- Color: `#d4a256`, `opacity: 0.25`
- Text: `Personal Finance Terminal` (or your product name)

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0a0d12` |
| Gold primary | `#d4a256` |
| Gold light | `#e8c076` |
| Font mark | IBM Plex Mono 300 |
| Animation duration | 12s linear infinite |
| Perspective | 700px |
| rotateX tilt | 22deg |

---

## React Implementation Sketch

```jsx
import { useEffect, useRef } from 'react';

export function GyroscopeMark({ size = 180 }) {
  const r = size / 2 - 1;
  const circ = Math.round(2 * Math.PI * r);
  const cx = size / 2;
  const path = `M ${cx},1 A ${r},${r} 0 0 1 ${cx},${size - 1} A ${r},${r} 0 0 1 ${cx},1`;

  return (
    <div style={{ width: size, height: size, perspective: 700 }}>
      <div style={{
        width: size, height: size,
        transformStyle: 'preserve-3d',
        animation: 'gyro 12s linear infinite',
        position: 'relative',
      }}>
        {/* Equatorial ring (SVG for textPath) */}
        <svg style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
             viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <path id="eq" d={path} />
          </defs>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#d4a256" strokeWidth="1.5" />
          <text fontFamily="IBM Plex Mono" fontSize="10" fill="#d4a256" opacity="0.65" fontWeight="300">
            <textPath href="#eq" textLength={circ} lengthAdjust="spacing">
              H · A · C · H · I · M ·
            </textPath>
          </text>
        </svg>
        {/* Vertical ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '1.5px solid rgba(212,162,86,0.6)',
          transform: 'rotateX(90deg)',
        }} />
        {/* Perpendicular ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '1.5px solid rgba(232,192,118,0.45)',
          transform: 'rotateY(90deg)',
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 5, height: 5, borderRadius: '50%',
          background: '#d4a256', opacity: 0.5,
          transform: 'translate(-50%, -50%)',
        }} />
      </div>
    </div>
  );
}
```

Add the keyframe in your global CSS or a `<style>` tag:
```css
@keyframes gyro {
  from { transform: rotateX(22deg) rotateY(0deg); }
  to   { transform: rotateX(22deg) rotateY(360deg); }
}
```

---

## Files
- `Gold Terminal Branding.dc.html` — Live animated reference (open in any browser)
