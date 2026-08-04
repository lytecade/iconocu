# Ikonoku

An arcade-style cyberpunk Sudoku game that replaces numbers with **9 unique color blocks**.

## Overview

Ikonoku is a logic puzzle where you fill a 9×9 grid with color blocks. Each row, column, and 3×3 section must contain every unique color block exactly once — no math required, just pure logic.

## How to Play

1. **Open** `index.html` in any modern browser
2. **Title Screen** — Press a key, click, or tap to begin
3. **Choose Difficulty** — Easy, Medium, or Hard
4. **Select a Color** — Tap/click or use arrow keys + Enter to pick one of the 9 color blocks
5. **Place It** — Tap/click a grid cell or navigate with arrow keys and press Enter/Space
6. **Complete the Grid** — Fill all empty cells to win!

## Controls

| Action | Mouse/Touch | Keyboard |
|---|---|---|
| Navigate cells | Click/tap cell | Arrow keys |
| Select color | Click/tap color block | Arrow keys + Enter |
| Place color | Click/tap cell after selecting color | Space / Enter |
| Start game | Click/tap/press any key | Any key |
| Confirm difficulty | Click/tap difficulty | Arrow keys + Enter |

## Color Scheme

Uses the **Arne16** palette exclusively:

| Hex | Role |
|---|---|
| `#000000` | Deep black |
| `#9D9D9D` | Mid gray |
| `#FFFFFF` | White |
| `#BE2633` | Crimson (Game Color 1) |
| `#E06F8B` | Rose (Game Color 2) |
| `#493C2B` | Brown |
| `#A46422` | Amber (Game Color 3) |
| `#EB8931` | Orange (Game Color 4) |
| `#F7E26B` | Yellow (Game Color 5) |
| `#2F484E` | Slate (Background) |
| `#44891A` | Green (Game Color 6) |
| `#A3CE27` | Lime (Game Color 7) |
| `#1B2632` | Navy (Dark BG) |
| `#005784` | Steel Blue (Game Color 8) |
| `#31A2F2` | Sky Blue (Game Color 9) |
| `#B2DCF0` | Ice Blue |

## Technical Details

- **No external libraries** — pure HTML5 Canvas + JavaScript
- **Responsive** — canvas scales to maximum browser fit while remaining square
- **Mobile-friendly** — full touch support alongside keyboard controls
- **Three difficulty levels** affecting the number of pre-filled cells

