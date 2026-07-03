# Iconocu

Iconocu is a blocky, pixel-art re-invention of Sudoku. Instead of numbers, players use a curated palette of colors to fill a 9x9 grid based on classic Sudoku logic.

## Game Rules
The objective is to fill the 9x9 grid such that:
1. Each **row** contains every color exactly once.
2. Each **column** contains every color exactly once.
3. Each **3x3 sub-grid** contains every color exactly once.

## How to Play

### Getting Started
- Run the local server: `python3 server.py`
- Open `http://localhost:8000` in your browser.
- Press **Enter** to start a new game.

### Controls
| Key | Action (Board Focus) | Action (Palette Focus) |
| :--- | :--- | :--- |
| **Arrow Keys** | Move selection cursor | Cycle through colors |
| **Tab** | Switch focus to Palette | Switch focus to Board |
| **Enter** | Place selected color in cell | Confirm color and switch to Board |

### Gameplay Tips
- **Validation**: If you attempt to place a color that violates Sudoku rules, a red **X** will blink on the cell to warn you.
- **Winning**: The game is won when the entire board is filled correctly.

## Technical Details
- **Graphics**: HTML5 Canvas with `pixelated` image rendering.
- **Color Palette**: Arne16 color scheme.
- **Language**: JavaScript (Frontend), Python (Local Server).
