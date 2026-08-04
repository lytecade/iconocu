/* ═══════════════════════════════════════════════════════════
   I K O N O K U  —  Gem Sudoku Arcade
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Arne16 Palette ──────────────────────────────────────
  const C = {
    black:     "#000000",
    gray:      "#9D9D9D",
    white:     "#FFFFFF",
    red:       "#BE2633",
    pink:      "#E06F8B",
    brown:     "#493C2B",
    amber:     "#A46422",
    orange:    "#EB8931",
    yellow:    "#F7E26B",
    teal:      "#2F484E",
    green:     "#44891A",
    lime:      "#A3CE27",
    navy:      "#1B2632",
    dkBlue:    "#005784",
    blue:      "#31A2F2",
    ltBlue:    "#B2DCFF",
  };

  // 9 gem colors (one per value 1-9)
  const GEM_COLORS = [
    C.red,    C.orange, C.yellow, C.green, C.blue,
    C.pink,   C.amber,  C.lime,   C.ltBlue
  ];

  // ── Canvas Setup ────────────────────────────────────────
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  let W, H; // canvas dimensions (always square)

  function resize() {
    const s = Math.min(window.innerWidth, window.innerHeight);
    W = H = s;
    canvas.width = W;
    canvas.height = H;
    render();
  }
  window.addEventListener("resize", resize);

  // ── Screen State ────────────────────────────────────────
  // STATES: "BOOT" | "TITLE" | "DIFFICULTY" | "PLAY" | "END"
  let state = "BOOT";
  let difficulty = "MEDIUM";
  let puzzle = [];     // 9x9 solution
  let given = [];      // 9x9 boolean (true = pre-filled)
  let board = [];      // 9x9 current player board
  let selectedGem = 1; // currently selected gem value (1-9)
  let cursorRow = 0, cursorCol = 0;
  let filledCount = 0;
  let totalEmpty = 0;
  let difficultyChoices = ["EASY", "MEDIUM", "HARD"];
  let diffCursor = 1; // index into difficultyChoices
  let endCursor = 0;  // 0 = "Play Again", 1 = "Change Difficulty"
  let titlePhase = 0; // for title screen animation
  let titleTimer = 0;
  let starField = [];

  // ── Boot Screen ─────────────────────────────────────────
  // Draw stars for boot/title background
  function initStars() {
    starField = [];
    for (let i = 0; i < 80; i++) {
      starField.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
  initStars();

  function drawStars(t) {
    for (const s of starField) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r * (W / 800), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Gem Drawing Functions ───────────────────────────────
  // Each gem is drawn at center (cx, cy) with radius r
  function drawGem(cx, cy, r, gemNum, alpha) {
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    const c = GEM_COLORS[gemNum - 1];
    ctx.fillStyle = c;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = Math.max(1, r * 0.1);

    switch (gemNum) {
      case 1: drawDiamond(cx, cy, r); break;
      case 2: drawCircle(cx, cy, r); break;
      case 3: drawTriangle(cx, cy, r); break;
      case 4: drawStar5(cx, cy, r); break;
      case 5: drawHexagon(cx, cy, r); break;
      case 6: drawPentagon(cx, cy, r); break;
      case 7: drawCross(cx, cy, r); break;
      case 8: drawHeart(cx, cy, r); break;
      case 9: drawCrescent(cx, cy, r); break;
    }
    ctx.globalAlpha = 1;
  }

  function drawDiamond(cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.7, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.7, cy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx, cy - r * 0.3, r * 0.25);
  }

  function drawCircle(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx - r * 0.25, cy - r * 0.25, r * 0.2);
  }

  function drawTriangle(cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.8, cy + r * 0.55);
    ctx.lineTo(cx - r * 0.8, cy + r * 0.55);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx, cy - r * 0.1, r * 0.18);
  }

  function drawStar5(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r * 0.85 : r * 0.38;
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx, cy - r * 0.15, r * 0.15);
  }

  function drawHexagon(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * i) / 3 - Math.PI / 6;
      ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx - r * 0.2, cy - r * 0.25, r * 0.18);
  }

  function drawPentagon(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx, cy - r * 0.22, r * 0.18);
  }

  function drawCross(cx, cy, r) {
    const t = r * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx - t, cy - r * 0.75);
    ctx.lineTo(cx + t, cy - r * 0.75);
    ctx.lineTo(cx + r * 0.75, cy - t);
    ctx.lineTo(cx + r * 0.75, cy + t);
    ctx.lineTo(cx + t, cy + r * 0.75);
    ctx.lineTo(cx - t, cy + r * 0.75);
    ctx.lineTo(cx - r * 0.75, cy + t);
    ctx.lineTo(cx - r * 0.75, cy - t);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx, cy, r * 0.15);
  }

  function drawHeart(cx, cy, r) {
    const s = r * 0.018;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.65);
    ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.3, cx - r * 0.5, cy - r * 1.1, cx, cy - r * 0.35);
    ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.1, cx + r * 1.2, cy - r * 0.3, cx, cy + r * 0.65);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawGemHighlight(cx - r * 0.25, cy - r * 0.15, r * 0.18);
  }

  function drawCrescent(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // cut out the inner crescent
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx + r * 0.4, cy - r * 0.1, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawGemHighlight(cx - r * 0.3, cy - r * 0.25, r * 0.15);
  }

  function drawGemHighlight(x, y, r) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Sudoku Generator ────────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function isValid(grid, row, col, val) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === val) return false;
      if (grid[i][col] === val) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (grid[r][c] === val) return false;
    return true;
  }

  function solveSudoku(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const v of nums) {
            if (isValid(grid, r, c, v)) {
              grid[r][c] = v;
              if (solveSudoku(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function generatePuzzle(diff) {
    // Create empty grid
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(grid);

    // Copy solution
    puzzle = grid.map(r => [...r]);
    board = grid.map(r => [...r]);
    given = Array.from({ length: 9 }, () => Array(9).fill(true));

    // Remove cells based on difficulty
    const removals = { EASY: 30, MEDIUM: 45, HARD: 56 };
    const removeCount = removals[diff] || 45;
    totalEmpty = removeCount;

    const positions = shuffle(
      Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
    );

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= removeCount) break;
      board[r][c] = 0;
      given[r][c] = false;
      removed++;
    }

    // Count already filled
    filledCount = 81 - totalEmpty;
    cursorRow = 0;
    cursorCol = 0;
    selectedGem = 1;

    // Move cursor to first empty cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!given[r][c]) {
          cursorRow = r;
          cursorCol = c;
          r = 9; break;
        }
      }
    }
  }

  function checkComplete() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (board[r][c] !== puzzle[r][c]) return false;
    return true;
  }

  function countFilled() {
    let n = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (board[r][c] !== 0) n++;
    return n;
  }

  // ── Drawing Helpers ─────────────────────────────────────
  function drawText(text, x, y, size, color, align) {
    ctx.fillStyle = color || C.white;
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function drawTextStroke(text, x, y, size, fillColor, strokeColor, align) {
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = strokeColor || C.black;
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor || C.white;
    ctx.fillText(text, x, y);
  }

  function drawButton(text, x, y, w, h, selected) {
    ctx.fillStyle = selected ? C.blue : C.navy;
    ctx.strokeStyle = selected ? C.white : C.ltBlue;
    ctx.lineWidth = selected ? 3 : 2;

    // Rounded rect
    const rad = Math.min(h * 0.2, 12);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const fontSize = Math.min(h * 0.45, w * 0.07, 28);
    drawText(text, x + w / 2, y + h / 2, fontSize, selected ? C.white : C.ltBlue);
  }

  // ── Screen: BOOT ────────────────────────────────────────
  function drawBoot(t) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);
    drawStars(t);

    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    const fontSize = W * 0.06;
    drawText("TAP OR PRESS ANY KEY", W / 2, H * 0.75, fontSize,
      C.gray, "center");

    // Draw a big gem in center
    const gemR = W * 0.08;
    drawGem(W / 2, H * 0.35, gemR, Math.floor(t * 1.5) % 9 + 1);
  }

  // ── Screen: TITLE ───────────────────────────────────────
  function drawTitle(t) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);
    drawStars(t);

    // Animated gems falling
    for (let i = 0; i < 12; i++) {
      const gy = ((t * 40 + i * 70) % (H + 100)) - 50;
      const gx = W * (0.1 + (i % 4) * 0.25);
      const gr = W * 0.02;
      ctx.globalAlpha = 0.3;
      drawGem(gx, gy, gr, i % 9 + 1);
    }
    ctx.globalAlpha = 1;

    // Title
    const titleSize = W * 0.12;
    drawTextStroke("IKONOKU", W / 2, H * 0.3, titleSize, C.yellow, C.brown);

    // Subtitle
    const subSize = W * 0.035;
    drawText("A Gem Puzzle Arcade", W / 2, H * 0.42, subSize, C.ltBlue);

    // Gem showcase row
    const gemR = W * 0.025;
    const startX = W * 0.15;
    const gemY = H * 0.55;
    for (let i = 0; i < 9; i++) {
      drawGem(startX + i * (W * 0.08), gemY, gemR, i + 1);
    }

    // Instructions
    const instSize = W * 0.03;
    drawText("Press ENTER or Tap to Start", W / 2, H * 0.75, instSize, C.gray);
  }

  // ── Screen: DIFFICULTY ──────────────────────────────────
  function drawDifficulty(t) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);
    drawStars(t);

    const titleSize = W * 0.08;
    drawTextStroke("SELECT DIFFICULTY", W / 2, H * 0.18, titleSize, C.yellow, C.brown);

    // Difficulty buttons
    const btnW = W * 0.5;
    const btnH = H * 0.09;
    const startY = H * 0.32;
    const gap = btnH * 0.4;

    const diffs = ["EASY", "MEDIUM", "HARD"];
    const colors = [C.green, C.orange, C.red];

    for (let i = 0; i < 3; i++) {
      const y = startY + i * (btnH + gap);
      const selected = i === diffCursor;
      const x = (W - btnW) / 2;

      ctx.fillStyle = selected ? colors[i] : C.navy;
      ctx.strokeStyle = selected ? C.white : colors[i];
      ctx.lineWidth = selected ? 3 : 2;

      const rad = Math.min(btnH * 0.2, 12);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + btnW - rad, y);
      ctx.quadraticCurveTo(x + btnW, y, x + btnW, y + rad);
      ctx.lineTo(x + btnW, y + btnH - rad);
      ctx.quadraticCurveTo(x + btnW, y + btnH, x + btnW - rad, y + btnH);
      ctx.lineTo(x + rad, y + btnH);
      ctx.quadraticCurveTo(x, y + btnH, x, y + btnH - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const fontSize = Math.min(btnH * 0.45, 28);
      drawText(diffs[i], x + btnW / 2, y + btnH / 2, fontSize,
        selected ? C.white : colors[i]);
    }

    // Hint
    const hintSize = W * 0.028;
    drawText("Use ↑↓ or Tap to select", W / 2, H * 0.72, hintSize, C.gray);
    drawText("Press ENTER or Tap to confirm", W / 2, H * 0.78, hintSize, C.gray);
  }

  // ── Screen: PLAY (Game) ─────────────────────────────────
  function drawGame(t) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);

    // Layout calculations
    const gridPx = W * 0.62;
    const cellSize = gridPx / 9;
    const gridX = (W - gridPx) / 2;
    const gridY = H * 0.08;

    // Top bar - title and score
    const topSize = W * 0.035;
    drawTextStroke("IKONOKU", W * 0.5, H * 0.03, W * 0.045, C.yellow, C.brown);

    const progress = countFilled();
    const progSize = W * 0.025;
    drawText(`${progress}/81`, W * 0.85, H * 0.035, progSize, C.ltBlue);

    drawText(difficulty, W * 0.5, H * 0.055, topSize, C.gray);

    // Draw grid background
    ctx.fillStyle = C.navy;
    ctx.fillRect(gridX - 2, gridY - 2, gridPx + 4, gridPx + 4);

    // Draw cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = gridX + c * cellSize;
        const y = gridY + r * cellSize;

        // Cell background
        if (board[r][c] !== 0) {
          ctx.fillStyle = given[r][c] ? C.teal : C.navy;
        } else {
          // Checkerboard subtle
          ctx.fillStyle = (r + c) % 2 === 0 ? C.navy : C.teal;
        }
        ctx.fillRect(x, y, cellSize, cellSize);

        // Cursor highlight
        if (r === cursorRow && c === cursorCol) {
          ctx.strokeStyle = C.yellow;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }

        // Draw gem if cell has value
        if (board[r][c] !== 0) {
          const gemR = cellSize * 0.35;
          const alpha = given[r][c] ? 1 : 0.75;
          drawGem(x + cellSize / 2, y + cellSize / 2, gemR, board[r][c], alpha);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = C.gray;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i++) {
      // Vertical
      ctx.beginPath();
      ctx.moveTo(gridX + i * cellSize, gridY);
      ctx.lineTo(gridX + i * cellSize, gridY + gridPx);
      ctx.stroke();
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(gridX, gridY + i * cellSize);
      ctx.lineTo(gridX + gridPx, gridY + i * cellSize);
      ctx.stroke();
    }

    // Thick 3x3 box lines
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 3;
    for (let i = 0; i <= 9; i += 3) {
      ctx.beginPath();
      ctx.moveTo(gridX + i * cellSize, gridY);
      ctx.lineTo(gridX + i * cellSize, gridY + gridPx);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gridX, gridY + i * cellSize);
      ctx.lineTo(gridX + gridPx, gridY + i * cellSize);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = C.yellow;
    ctx.lineWidth = 3;
    ctx.strokeRect(gridX, gridY, gridPx, gridPx);

    // ── Gem Palette (bottom) ──────────────────────────────
    const palH = H * 0.18;
    const palY = H - palH;
    const palGemW = palH * 0.85;
    const palTotalW = 9 * palGemW + 8 * (palGemW * 0.15);
    const palX = (W - palTotalW) / 2;

    // Palette background
    ctx.fillStyle = C.navy;
    ctx.fillRect(palX - 8, palY - 8, palTotalW + 16, palH + 16);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(palX - 8, palY - 8, palTotalW + 16, palH + 16);

    // Draw gems in palette
    for (let i = 0; i < 9; i++) {
      const gx = palX + i * (palGemW + palGemW * 0.15) + palGemW / 2;
      const gy = palY + palH * 0.38;
      const gR = palGemW * 0.35;

      if (i + 1 === selectedGem) {
        // Selected glow
        ctx.fillStyle = C.blue;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(gx, gy, gR * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = C.yellow;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gx, gy, gR * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawGem(gx, gy, gR, i + 1);
    }

    // Eraser button
    const eraserX = palX + palTotalW + palGemW * 0.3;
    const eraserY = palY + 4;
    const eraserW = palGemW * 1.1;
    const eraserH = palH - 8;

    ctx.fillStyle = C.navy;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.fillRect(eraserX, eraserY, eraserW, eraserH);
    ctx.strokeRect(eraserX, eraserY, eraserW, eraserH);

    const eraserSize = eraserH * 0.22;
    drawText("✕", eraserX + eraserW / 2, eraserY + eraserH * 0.4, eraserSize * 1.5, C.red);
    drawText("ERA", eraserX + eraserW / 2, eraserY + eraserH * 0.75, eraserSize, C.gray);
  }

  // ── Screen: END ─────────────────────────────────────────
  function drawEnd(t) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, W, H);
    drawStars(t);

    // Celebration gems
    for (let i = 0; i < 20; i++) {
      const gx = W * (0.1 + ((i * 37 + Math.floor(t * 20)) % 80) / 100);
      const gy = H * (0.05 + ((i * 53 + Math.floor(t * 30)) % 90) / 100);
      const gr = W * (0.012 + (i % 3) * 0.005);
      ctx.globalAlpha = 0.4 + 0.3 * Math.abs(Math.sin(t * 2 + i));
      drawGem(gx, gy, gr, i % 9 + 1);
    }
    ctx.globalAlpha = 1;

    // Title
    const titleSize = W * 0.1;
    drawTextStroke("PUZZLE COMPLETE!", W / 2, H * 0.2, titleSize, C.yellow, C.brown);

    // Stats
    const statSize = W * 0.045;
    const finalFilled = countFilled();
    drawText(`Gems Placed: ${finalFilled} / 81`, W / 2, H * 0.38, statSize, C.white);
    drawText(`Difficulty: ${difficulty}`, W / 2, H * 0.47, statSize, C.ltBlue);

    // Show all gems
    const gemR = W * 0.025;
    const gemStartX = W * 0.2;
    const gemY = H * 0.58;
    for (let i = 0; i < 9; i++) {
      drawGem(gemStartX + i * (W * 0.085), gemY, gemR, i + 1);
    }

    // Buttons
    const btnW = W * 0.5;
    const btnH = H * 0.08;
    const startY = H * 0.7;
    const gap = btnH * 0.3;

    const opts = ["PLAY AGAIN", "CHANGE DIFFICULTY"];
    for (let i = 0; i < 2; i++) {
      const y = startY + i * (btnH + gap);
      const sel = i === endCursor;
      const x = (W - btnW) / 2;

      ctx.fillStyle = sel ? C.blue : C.navy;
      ctx.strokeStyle = sel ? C.white : C.ltBlue;
      ctx.lineWidth = sel ? 3 : 2;

      const rad = Math.min(btnH * 0.2, 10);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + btnW - rad, y);
      ctx.quadraticCurveTo(x + btnW, y, x + btnW, y + rad);
      ctx.lineTo(x + btnW, y + btnH - rad);
      ctx.quadraticCurveTo(x + btnW, y + btnH, x + btnW - rad, y + btnH);
      ctx.lineTo(x + rad, y + btnH);
      ctx.quadraticCurveTo(x, y + btnH, x, y + btnH - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const fontSize = Math.min(btnH * 0.4, 24);
      drawText(opts[i], x + btnW / 2, y + btnH / 2, fontSize,
        sel ? C.white : C.ltBlue);
    }

    const hintSize = W * 0.025;
    drawText("Use ↑↓ to select, ENTER to confirm", W / 2, H * 0.92, hintSize, C.gray);
  }

  // ── Main Render Loop ────────────────────────────────────
  let lastTime = 0;

  function render() {
    const t = (performance.now() - lastTime) / 1000;

    switch (state) {
      case "BOOT": drawBoot(t); break;
      case "TITLE": drawTitle(t); break;
      case "DIFFICULTY": drawDifficulty(t); break;
      case "PLAY": drawGame(t); break;
      case "END": drawEnd(t); break;
    }
  }

  function loop(ts) {
    lastTime = ts;
    render();
    requestAnimationFrame(loop);
  }

  // ── Input Handling ──────────────────────────────────────
  let eraserMode = false;

  function getGridCell(clientX, clientY) {
    if (state !== "PLAY") return null;
    const gridPx = W * 0.62;
    const cellSize = gridPx / 9;
    const gridX = (W - gridPx) / 2;
    const gridY = H * 0.08;

    const col = Math.floor((clientX - gridX) / cellSize);
    const row = Math.floor((clientY - gridY) / cellSize);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) return { row, col };
    return null;
  }

  function getPaletteGem(clientX, clientY) {
    if (state !== "PLAY") return -1;
    const palH = H * 0.18;
    const palY = H - palH;
    const palGemW = palH * 0.85;
    const palTotalW = 9 * palGemW + 8 * (palGemW * 0.15);
    const palX = (W - palTotalW) / 2;

    for (let i = 0; i < 9; i++) {
      const gx = palX + i * (palGemW + palGemW * 0.15);
      const gy = palY;
      if (clientX >= gx && clientX < gx + palGemW && clientY >= gy && clientY < gy + palH) {
        return i + 1;
      }
    }
    return -1;
  }

  function isEraser(clientX, clientY) {
    if (state !== "PLAY") return false;
    const palH = H * 0.18;
    const palY = H - palH;
    const palGemW = palH * 0.85;
    const palTotalW = 9 * palGemW + 8 * (palGemW * 0.15);
    const palX = (W - palTotalW) / 2;

    const eraserX = palX + palTotalW + palGemW * 0.3;
    const eraserY = palY + 4;
    const eraserW = palGemW * 1.1;
    const eraserH = palH - 8;

    return clientX >= eraserX && clientX < eraserX + eraserW &&
           clientY >= eraserY && clientY < eraserY + eraserH;
  }

  function getDifficultyIndex(clientX, clientY) {
    if (state !== "DIFFICULTY") return -1;
    const btnH = H * 0.09;
    const startY = H * 0.32;
    const gap = btnH * 0.4;
    const btnW = W * 0.5;

    for (let i = 0; i < 3; i++) {
      const y = startY + i * (btnH + gap);
      const x = (W - btnW) / 2;
      if (clientY >= y && clientY < y + btnH &&
          clientX >= x && clientX < x + btnW) return i;
    }
    return -1;
  }

  function getEndOptionIndex(clientX, clientY) {
    if (state !== "END") return -1;
    const btnW = W * 0.5;
    const btnH = H * 0.08;
    const startY = H * 0.7;
    const gap = btnH * 0.3;

    for (let i = 0; i < 2; i++) {
      const y = startY + i * (btnH + gap);
      const x = (W - btnW) / 2;
      if (clientY >= y && clientY < y + btnH &&
          clientX >= x && clientX < x + btnW) return i;
    }
    return -1;
  }

  function placeGem() {
    if (state !== "PLAY") return;
    if (given[cursorRow][cursorCol]) return;
    if (eraserMode) {
      board[cursorRow][cursorCol] = 0;
      eraserMode = false;
      render();
      return;
    }
    board[cursorRow][cursorCol] = selectedGem;
    filledCount = countFilled();
    render();

    if (checkComplete()) {
      state = "END";
      endCursor = 0;
      render();
    }
  }

  // Keyboard
  document.addEventListener("keydown", (e) => {
    // BOOT → TITLE
    if (state === "BOOT") {
      state = "TITLE";
      render();
      return;
    }

    // TITLE → DIFFICULTY
    if (state === "TITLE") {
      state = "DIFFICULTY";
      render();
      return;
    }

    // DIFFICULTY
    if (state === "DIFFICULTY") {
      if (e.key === "ArrowUp") {
        diffCursor = (diffCursor - 1 + 3) % 3;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") {
        diffCursor = (diffCursor + 1) % 3;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        difficulty = difficultyChoices[diffCursor];
        generatePuzzle(difficulty);
        state = "PLAY";
        eraserMode = false;
        render();
        e.preventDefault();
        return;
      }
      return;
    }

    // PLAY
    if (state === "PLAY") {
      if (e.key === "ArrowUp") {
        cursorRow = (cursorRow - 1 + 9) % 9;
        eraserMode = false;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") {
        cursorRow = (cursorRow + 1) % 9;
        eraserMode = false;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowLeft") {
        cursorCol = (cursorCol - 1 + 9) % 9;
        eraserMode = false;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowRight") {
        cursorCol = (cursorCol + 1) % 9;
        eraserMode = false;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        placeGem();
        e.preventDefault();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!given[cursorRow][cursorCol]) {
          board[cursorRow][cursorCol] = 0;
          render();
        }
        e.preventDefault();
        return;
      }
      // Number keys 1-9
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        selectedGem = num;
        eraserMode = false;
        render();
        return;
      }
      return;
    }

    // END
    if (state === "END") {
      if (e.key === "ArrowUp") {
        endCursor = (endCursor - 1 + 2) % 2;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") {
        endCursor = (endCursor + 1) % 2;
        render();
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        if (endCursor === 0) {
          // Play again same difficulty
          generatePuzzle(difficulty);
          state = "PLAY";
          eraserMode = false;
        } else {
          state = "DIFFICULTY";
          diffCursor = 1;
        }
        render();
        e.preventDefault();
        return;
      }
    }
  });

  // Mouse
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (state === "BOOT") {
      state = "TITLE";
      render();
      return;
    }
    if (state === "TITLE") {
      state = "DIFFICULTY";
      render();
      return;
    }
    if (state === "DIFFICULTY") {
      const idx = getDifficultyIndex(x, y);
      if (idx >= 0) {
        diffCursor = idx;
        difficulty = difficultyChoices[diffCursor];
        generatePuzzle(difficulty);
        state = "PLAY";
        eraserMode = false;
        render();
      }
      return;
    }
    if (state === "PLAY") {
      // Check eraser
      if (isEraser(x, y)) {
        eraserMode = !eraserMode;
        render();
        return;
      }
      // Check palette
      const gem = getPaletteGem(x, y);
      if (gem > 0) {
        selectedGem = gem;
        eraserMode = false;
        render();
        return;
      }
      // Check grid
      const cell = getGridCell(x, y);
      if (cell) {
        cursorRow = cell.row;
        cursorCol = cell.col;
        placeGem();
      }
      return;
    }
    if (state === "END") {
      const idx = getEndOptionIndex(x, y);
      if (idx >= 0) {
        endCursor = idx;
        if (endCursor === 0) {
          generatePuzzle(difficulty);
          state = "PLAY";
          eraserMode = false;
        } else {
          state = "DIFFICULTY";
          diffCursor = 1;
        }
        render();
      }
    }
  });

  // Touch
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    // Simulate click
    canvas.dispatchEvent(new MouseEvent("click", { clientX: touch.clientX, clientY: touch.clientY }));
  }, { passive: false });

  // Prevent scrolling on mobile
  document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

  // ── Start ───────────────────────────────────────────────
  resize();
  requestAnimationFrame(loop);

})();
