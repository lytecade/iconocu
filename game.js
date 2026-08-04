// ============================================================
// Ikonoku — Cyberpunk Color Sudoku
// Pure HTML5 Canvas + JavaScript, no external libraries
// ============================================================

(function () {
  "use strict";

  // ---- Polyfill: roundRect ----
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === "number") r = [r, r, r, r];
      var rtl = r[0] || 0, rtr = r[1] || 0, rbr = r[2] || 0, rbl = r[3] || 0;
      this.moveTo(x + rtl, y);
      this.lineTo(x + w - rtr, y);
      this.quadraticCurveTo(x + w, y, x + w, y + rtr);
      this.lineTo(x + w, y + h - rbr);
      this.quadraticCurveTo(x + w, y + h, x + w - rbr, y + h);
      this.lineTo(x + rbl, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - rbl);
      this.lineTo(x, y + rtl);
      this.quadraticCurveTo(x, y, x + rtl, y);
      this.closePath();
      return this;
    };
  }

  // ---- Arne16 Palette ----
  var COLORS = {
    black:       "#000000",
    gray:        "#9D9D9D",
    white:       "#FFFFFF",
    crimson:     "#BE2633",
    rose:        "#E06F8B",
    brown:       "#493C2B",
    amber:       "#A46422",
    orange:      "#EB8931",
    yellow:      "#F7E26B",
    slate:       "#2F484E",
    green:       "#44891A",
    lime:        "#A3CE27",
    navy:        "#1B2632",
    steelBlue:   "#005784",
    skyBlue:     "#31A2F2",
    iceBlue:     "#B2DCF0",
  };

  // 9 playable color blocks
  var GAME_COLORS = [
    COLORS.crimson,   // 1
    COLORS.rose,       // 2
    COLORS.amber,      // 3
    COLORS.orange,     // 4
    COLORS.yellow,     // 5
    COLORS.green,      // 6
    COLORS.lime,       // 7
    COLORS.steelBlue,  // 8
    COLORS.skyBlue,    // 9
  ];

  // ---- Game States ----
  var STATE_TITLE = 0;
  var STATE_DIFFICULTY = 1;
  var STATE_PLAYING = 2;
  var STATE_WIN = 3;

  // ---- Difficulty Config ----
  var DIFF_CONFIG = {
    Easy:   { removed: 30, label: "EASY" },
    Medium: { removed: 45, label: "MEDIUM" },
    Hard:   { removed: 55, label: "HARD" },
  };
  var DIFF_KEYS = ["Easy", "Medium", "Hard"];
  var DIFF_LABELS = ["EASY", "MEDIUM", "HARD"];
  var DIFF_DESCS  = ["~51 clues shown", "~36 clues shown", "~26 clues shown"];
  var DIFF_COLORS = [COLORS.lime, COLORS.orange, COLORS.crimson];

  // ---- Canvas & Context ----
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  // ---- Game State Variables ----
  var gameState = STATE_TITLE;
  var difficulty = "Medium";
  var solvedBoard = [];
  var puzzleBoard = [];
  var initialBoard = [];
  var cellGrid = [];

  var selectedColor = 1;
  var cursorRow = 0;
  var cursorCol = 0;
  var paletteCursor = 0;

  // Input focus: "grid" or "palette"
  var inputFocus = "grid";

  var totalCells = 81;
  var filledCells = 0;
  var difficultyCursor = 1; // start at Medium

  // Flash effect for invalid placement
  var flashCell = null;
  var flashTimer = 0;

  // ---- Sudoku Generation ----

  function isValid(board, row, col, num) {
    for (var c = 0; c < 9; c++) { if (board[row][c] === num) return false; }
    for (var r = 0; r < 9; r++) { if (board[r][col] === num) return false; }
    var br = Math.floor(row / 3) * 3;
    var bc = Math.floor(col / 3) * 3;
    for (var i = br; i < br + 3; i++) {
      for (var j = bc; j < bc + 3; j++) {
        if (board[i][j] === num) return false;
      }
    }
    return true;
  }

  function solveSudoku(board) {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          shuffle(nums);
          for (var n = 0; n < nums.length; n++) {
            if (isValid(board, r, c, nums[n])) {
              board[r][c] = nums[n];
              if (solveSudoku(board)) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function generateSolvedBoard() {
    var board = [];
    for (var i = 0; i < 9; i++) {
      board[i] = [];
      for (var j = 0; j < 9; j++) { board[i][j] = 0; }
    }
    solveSudoku(board);
    return board;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  function createPuzzle(solved, removedCount) {
    var puzzle = [];
    for (var r = 0; r < 9; r++) {
      puzzle[r] = [];
      for (var c = 0; c < 9; c++) { puzzle[r][c] = solved[r][c]; }
    }
    var positions = [];
    for (var i = 0; i < 81; i++) {
      positions.push([Math.floor(i / 9), i % 9]);
    }
    shuffle(positions);
    var removed = 0;
    for (var k = 0; k < positions.length && removed < removedCount; k++) {
      puzzle[positions[k][0]][positions[k][1]] = 0;
      removed++;
    }
    return puzzle;
  }

  function initGame() {
    solvedBoard = generateSolvedBoard();
    puzzleBoard = createPuzzle(solvedBoard, DIFF_CONFIG[difficulty].removed);
    initialBoard = [];
    cellGrid = [];
    filledCells = 0;
    for (var r = 0; r < 9; r++) {
      initialBoard[r] = [];
      cellGrid[r] = [];
      for (var c = 0; c < 9; c++) {
        initialBoard[r][c] = puzzleBoard[r][c];
        cellGrid[r][c] = puzzleBoard[r][c];
        if (puzzleBoard[r][c] !== 0) filledCells++;
      }
    }
    cursorRow = 0; cursorCol = 0;
    for (var rr = 0; rr < 9; rr++) {
      for (var cc = 0; cc < 9; cc++) {
        if (puzzleBoard[rr][cc] === 0) { cursorRow = rr; cursorCol = cc; break; }
      }
    }
    selectedColor = 1;
    paletteCursor = 0;
    inputFocus = "grid";
    flashCell = null;
    flashTimer = 0;
  }

  // ---- Layout Calculation ----

  function recalcLayout() {
    var size = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = size;
    canvas.height = size;
    var s = size;

    var topBarH = s * 0.07;
    var boardSize = s * 0.65;
    var gap = s * 0.025;
    var paletteH = s * 0.22;

    var boardX = (s - boardSize) / 2;
    var boardY = topBarH;
    var cellSize = boardSize / 9;
    var paletteY = boardY + boardSize + gap;
    var palBlockW = (s * 0.82) / 9;
    var palBlockH = paletteH * 0.65;
    var palXStart = (s - 9 * palBlockW) / 2;

    window._layout = {
      s: s, topBarH: topBarH,
      boardX: boardX, boardY: boardY,
      boardSize: boardSize, cellSize: cellSize,
      gap: gap, paletteY: paletteY, paletteH: paletteH,
      palBlockW: palBlockW, palBlockH: palBlockH, palXStart: palXStart
    };
  }

  // ---- Drawing Helpers ----

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  }

  function drawRoundRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, typeof r === "number" ? r : r[0]);
    ctx.fill();
  }

  function drawText(text, x, y, fontSize, color, align) {
    ctx.fillStyle = color;
    ctx.font = "bold " + fontSize + 'px "Courier New", monospace';
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function drawTextOutline(text, x, y, fontSize, outlineColor, fillColor, align) {
    ctx.font = "bold " + fontSize + 'px "Courier New", monospace';
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = Math.max(2, fontSize / 8);
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  }

  function drawScanlines() {
    ctx.fillStyle = "rgba(0,0,0,0.055)";
    for (var i = 0; i < window._layout.s; i += 3) {
      ctx.fillRect(0, i, window._layout.s, 1);
    }
  }

  function drawCorners(color) {
    var L = window._layout;
    var cs = L.s * 0.06;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, L.s * 0.004);
    // TL
    ctx.beginPath(); ctx.moveTo(L.s * 0.05, L.s * 0.05 + cs); ctx.lineTo(L.s * 0.05, L.s * 0.05); ctx.lineTo(L.s * 0.05 + cs, L.s * 0.05); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(L.s * 0.95 - cs, L.s * 0.05); ctx.lineTo(L.s * 0.95, L.s * 0.05); ctx.lineTo(L.s * 0.95, L.s * 0.05 + cs); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(L.s * 0.05, L.s * 0.95 - cs); ctx.lineTo(L.s * 0.05, L.s * 0.95); ctx.lineTo(L.s * 0.05 + cs, L.s * 0.95); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(L.s * 0.95 - cs, L.s * 0.95); ctx.lineTo(L.s * 0.95, L.s * 0.95); ctx.lineTo(L.s * 0.95, L.s * 0.95 - cs); ctx.stroke();
  }

  function drawGridPattern() {
    var L = window._layout;
    ctx.strokeStyle = "rgba(49,162,242,0.07)";
    ctx.lineWidth = 1;
    var step = L.s * 0.04;
    for (var i = 0; i < L.s; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, L.s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(L.s, i); ctx.stroke();
    }
  }

  // ---- Draw Title Screen ----

  function drawTitleScreen() {
    var L = window._layout;
    var s = L.s;
    var cx = s / 2;
    var cy = s / 2;
    var t = performance.now() * 0.001;

    drawRect(0, 0, s, s, COLORS.navy);
    drawGridPattern();

    // Animated circuit lines
    ctx.strokeStyle = "rgba(163,206,39,0.12)";
    ctx.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
      var sx = (Math.sin(t * 0.7 + i * 1.3) * 0.5 + 0.5) * s;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, s); ctx.stroke();
    }

    // Title glow
    var pulse = Math.sin(t * 2) * 0.3 + 0.7;
    ctx.save();
    ctx.shadowColor = COLORS.skyBlue;
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(cx - s * 0.28, cy - s * 0.18, s * 0.56, s * 0.22);
    ctx.restore();

    // Title
    var titleSize = s * 0.14;
    drawTextOutline("IKONOKU", cx, cy - s * 0.06, titleSize, COLORS.skyBlue, COLORS.white);

    // Blinking prompt
    if (Math.sin(t * 3) > 0) {
      var promptSize = s * 0.03;
      drawText("[ PRESS ANY KEY / TAP TO START ]", cx, cy + s * 0.18, promptSize, COLORS.skyBlue);
    }

    // Color preview row
    var blockSz = s * 0.035;
    var blockY = cy + s * 0.35;
    for (var b = 0; b < 9; b++) {
      var bx = cx - (9 * blockSz) / 2 + b * blockSz + blockSz * 0.1;
      var by = blockY + Math.sin(t * 2 + b * 0.5) * blockSz * 0.12;
      var bs = blockSz * 0.8;
      drawRoundRect(bx, by, bs, bs, bs * 0.15, GAME_COLORS[b]);
    }

    drawCorners(COLORS.skyBlue);
    drawScanlines();
  }

  // ---- Draw Difficulty Screen ----

  function drawDifficultyScreen() {
    var L = window._layout;
    var s = L.s;
    var cx = s / 2;
    var cy = s / 2;
    var t = performance.now() * 0.001;

    drawRect(0, 0, s, s, COLORS.navy);
    drawGridPattern();

    // Title
    var titleSize = s * 0.06;
    drawTextOutline("SELECT DIFFICULTY", cx, cy - s * 0.28, titleSize, COLORS.iceBlue, COLORS.white);

    // Buttons
    var btnW = s * 0.48;
    var btnH = s * 0.08;
    var btnGap = s * 0.035;
    var startY = cy - s * 0.1;

    for (var i = 0; i < 3; i++) {
      var bx = cx - btnW / 2;
      var by = startY + i * (btnH + btnGap);
      var isActive = (difficultyCursor === i);

      if (isActive) {
        ctx.save();
        ctx.shadowColor = DIFF_COLORS[i];
        ctx.shadowBlur = 15;
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(bx - 3, by - 3, btnW + 6, btnH + 6);
        ctx.restore();
        drawRoundRect(bx, by, btnW, btnH, btnH * 0.3, DIFF_COLORS[i]);
        drawText(DIFF_LABELS[i], cx, by + btnH / 2, s * 0.038, COLORS.black);
      } else {
        drawRoundRect(bx, by, btnW, btnH, btnH * 0.3, COLORS.slate);
        drawText(DIFF_LABELS[i], cx, by + btnH / 2, s * 0.038, DIFF_COLORS[i]);
        ctx.strokeStyle = DIFF_COLORS[i];
        ctx.lineWidth = Math.max(1, s * 0.003);
        ctx.beginPath();
        ctx.roundRect(bx, by, btnW, btnH, btnH * 0.3);
        ctx.stroke();
      }
      // Description
      var descSize = s * 0.018;
      drawText(DIFF_DESCS[i], cx, by + btnH + s * 0.015, descSize, COLORS.gray);
    }

    // Hint
    if (Math.sin(t * 3) > 0) {
      var hintSize = s * 0.02;
      drawText("[ ARROW KEYS / TAP — ENTER / TAP TO CONFIRM ]", cx, cy + s * 0.26, hintSize, COLORS.gray);
    }

    drawCorners(COLORS.skyBlue);
    drawScanlines();
  }

  // ---- Draw Game Board ----

  function drawGameScreen() {
    var L = window._layout;
    var s = L.s;
    var t = performance.now() * 0.001;

    drawRect(0, 0, s, s, COLORS.navy);

    // ---- Top Info Bar ----
    drawRect(0, 0, s, L.topBarH, COLORS.slate);
    var infoSize = s * 0.02;
    drawText("IKONOKU — " + DIFF_CONFIG[difficulty].label, s * 0.05, L.topBarH / 2, infoSize, COLORS.iceBlue, "left");
    drawText("FILLED: " + filledCells + "/" + totalCells, s * 0.95, L.topBarH / 2, infoSize, COLORS.yellow, "right");

    // ---- Board Border ----
    drawRect(L.boardX - 2, L.boardY - 2, L.boardSize + 4, L.boardSize + 4, COLORS.gray);

    // ---- Grid Cells ----
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var x = L.boardX + c * L.cellSize;
        var y = L.boardY + r * L.cellSize;
        var cs = L.cellSize;
        var val = cellGrid[r][c];

        // Cell background
        if (val !== 0) {
          drawRect(x, y, cs, cs, GAME_COLORS[val - 1]);
          // Inner glow for filled cells
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(x + cs * 0.1, y + cs * 0.1, cs * 0.8, cs * 0.8);
        } else {
          drawRect(x, y, cs, cs, ((r + c) % 2 === 0) ? COLORS.navy : "#152029");
        }

        // Thin cell border
        ctx.strokeStyle = "rgba(157,157,157,0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
    }

    // ---- Thick 3x3 box borders ----
    var thick = Math.max(2, L.cellSize * 0.05);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = thick;
    // Vertical dividers
    for (var vc = 0; vc <= 9; vc++) {
      if (vc % 3 === 0) {
        var vx = L.boardX + vc * L.cellSize;
        ctx.beginPath(); ctx.moveTo(vx, L.boardY); ctx.lineTo(vx, L.boardY + L.boardSize); ctx.stroke();
      }
    }
    // Horizontal dividers
    for (var vh = 0; vh <= 9; vh++) {
      if (vh % 3 === 0) {
        var vy = L.boardY + vh * L.cellSize;
        ctx.beginPath(); ctx.moveTo(L.boardX, vy); ctx.lineTo(L.boardX + L.boardSize, vy); ctx.stroke();
      }
    }

    // ---- Invalid placement flash ----
    if (flashCell && flashTimer > 0) {
      var fx = L.boardX + flashCell.col * L.cellSize;
      var fy = L.boardY + flashCell.row * L.cellSize;
      var alpha = (flashTimer / 30) * 0.5;
      ctx.fillStyle = "rgba(190,38,51," + alpha + ")";
      ctx.fillRect(fx, fy, L.cellSize, L.cellSize);
    }

    // ---- Cursor Highlight ----
    var cx = L.boardX + cursorCol * L.cellSize;
    var cy = L.boardY + cursorRow * L.cellSize;
    var pulseAlpha = 0.25 + Math.sin(t * 4) * 0.12;
    ctx.fillStyle = "rgba(178,220,240," + pulseAlpha + ")";
    ctx.fillRect(cx + 1, cy + 1, L.cellSize - 2, L.cellSize - 2);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = Math.max(2, L.cellSize * 0.04);
    ctx.strokeRect(cx + 1, cy + 1, L.cellSize - 2, L.cellSize - 2);

    // ---- Color Palette ----
    var palY = L.paletteY;
    drawRect(0, palY, s, L.paletteH + 10, "#152029");

    // Palette label
    var labelSize = s * 0.018;
    var palLabel = "SELECT COLOR" + (inputFocus === "palette" ? " \u25B6" : "");
    drawText(palLabel, s / 2, palY + s * 0.01, labelSize, inputFocus === "palette" ? COLORS.skyBlue : COLORS.gray);

    for (var i = 0; i < 9; i++) {
      var bx = L.palXStart + i * L.palBlockW;
      var by = palY + L.paletteH * 0.18;
      var bw = L.palBlockW * 0.78;
      var bh = L.palBlockH;
      var blockX = bx + (L.palBlockW - bw) / 2;

      if (i === paletteCursor) {
        ctx.save();
        ctx.shadowColor = GAME_COLORS[i];
        ctx.shadowBlur = 15;
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(blockX - 3, by - 3, bw + 6, bh + 6);
        ctx.restore();
      }
      drawRoundRect(blockX, by, bw, bh, bh * 0.15, GAME_COLORS[i]);

      if (i === paletteCursor) {
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = Math.max(2, s * 0.004);
        ctx.beginPath();
        ctx.roundRect(blockX, by, bw, bh, bh * 0.15);
        ctx.stroke();
        // Arrow above
        var ax = blockX + bw / 2;
        var ay = by - s * 0.012;
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.moveTo(ax, ay + 6); ctx.lineTo(ax - 5, ay); ctx.lineTo(ax + 5, ay);
        ctx.closePath(); ctx.fill();
      }

      // Number label
      var numSize = s * 0.015;
      drawText("" + (i + 1), blockX + bw / 2, by + bh + s * 0.012, numSize, COLORS.gray);
    }

    // ---- Bottom controls hint ----
    var hintSize = s * 0.015;
    var hintY = palY + L.paletteH + s * 0.022;
    if (hintY < s * 0.98) {
      if (inputFocus === "palette") {
        drawText("\u25B6 PALETTE: \u2190 \u2192 NAVIGATE — ENTER SELECT — TAB GRID", s / 2, hintY, hintSize, COLORS.skyBlue);
      } else {
        drawText("TAP TO PLACE \u00B7 \u2191 \u2193 \u2190 \u2192 NAVIGATE \u00B7 1-9 COLORS \u00B7 ENTER/SPACE PLACE \u00B7 TAB PALETTE", s / 2, hintY, hintSize, COLORS.gray);
      }
    }

    drawScanlines();
  }

  // ---- Draw Win Screen ----

  function drawWinScreen() {
    var L = window._layout;
    var s = L.s;
    var cx = s / 2;
    var cy = s / 2;
    var t = performance.now() * 0.001;

    drawRect(0, 0, s, s, COLORS.navy);

    // Floating color blocks (confetti)
    for (var i = 0; i < 40; i++) {
      var px = (Math.sin(t * 0.8 + i * 2.1) * 0.5 + 0.5) * s;
      var py = ((t * 0.12 + i * 0.07) % 1.2) * s;
      var sz = s * 0.015 + Math.sin(i * 1.5) * s * 0.004;
      ctx.fillStyle = GAME_COLORS[i % 9];
      ctx.globalAlpha = 0.35;
      ctx.fillRect(px, py, sz, sz);
    }
    ctx.globalAlpha = 1;

    drawGridPattern();

    // Win title
    var pulse = Math.sin(t * 3) * 0.3 + 0.7;
    ctx.save();
    ctx.shadowColor = COLORS.lime;
    ctx.shadowBlur = 25 * pulse;
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(cx - s * 0.25, cy - s * 0.22, s * 0.5, s * 0.14);
    ctx.restore();

    var titleSize = s * 0.09;
    drawTextOutline("PUZZLE COMPLETE", cx, cy - s * 0.18, titleSize, COLORS.lime, COLORS.white);

    // Stats
    var statSize = s * 0.028;
    drawText("DIFFICULTY: " + DIFF_CONFIG[difficulty].label, cx, cy - s * 0.03, statSize, COLORS.iceBlue);
    drawText("CELLS FILLED: " + filledCells + "/" + totalCells, cx, cy + s * 0.03, statSize, COLORS.yellow);

    // Difficulty stars
    var starCount = (difficulty === "Hard" ? 3 : difficulty === "Medium" ? 2 : 1);
    var starSize = s * 0.04;
    var starY = cy + s * 0.1;
    for (var st = 0; st < 3; st++) {
      var sx = cx - starSize + st * starSize * 1.3;
      ctx.fillStyle = st < starCount ? COLORS.yellow : COLORS.gray;
      ctx.globalAlpha = st < starCount ? 1 : 0.3;
      ctx.font = starSize + 'px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u2605", sx + starSize / 2, starY);
    }
    ctx.globalAlpha = 1;

    // Color display
    var dBlockW = s * 0.05;
    var dBlockH = s * 0.03;
    var dStartX = cx - (9 * dBlockW * 0.65) / 2;
    var dY = cy + s * 0.17;
    for (var d = 0; d < 9; d++) {
      drawRoundRect(dStartX + d * dBlockW, dY, dBlockW * 0.6, dBlockH, dBlockH * 0.2, GAME_COLORS[d]);
    }

    // Play again
    if (Math.sin(t * 3) > 0) {
      var promptSize = s * 0.028;
      drawText("[ TAP / PRESS ANY KEY TO PLAY AGAIN ]", cx, cy + s * 0.3, promptSize, COLORS.skyBlue);
    }

    drawCorners(COLORS.lime);
    drawScanlines();
  }

  // ---- Hit Testing ----

  function getGridCell(px, py) {
    var L = window._layout;
    if (px >= L.boardX && px < L.boardX + L.boardSize &&
        py >= L.boardY && py < L.boardY + L.boardSize) {
      var col = Math.floor((px - L.boardX) / L.cellSize);
      var row = Math.floor((py - L.boardY) / L.cellSize);
      if (row >= 0 && row < 9 && col >= 0 && col < 9) return { row: row, col: col };
    }
    return null;
  }

  function getPaletteIndex(px, py) {
    var L = window._layout;
    for (var i = 0; i < 9; i++) {
      var bx = L.palXStart + i * L.palBlockW;
      var by = L.paletteY + L.paletteH * 0.18;
      var bw = L.palBlockW * 0.78;
      var bh = L.paletteH * 0.65;
      var blockX = bx + (L.palBlockW - bw) / 2;
      if (px >= blockX && px < blockX + bw && py >= by && py < by + bh) return i;
    }
    return -1;
  }

  function getDifficultyButton(py) {
    var L = window._layout;
    var s = L.s;
    var cx = s / 2;
    var btnW = s * 0.48;
    var btnH = s * 0.08;
    var btnGap = s * 0.035;
    var startY = s / 2 - s * 0.1;
    for (var i = 0; i < 3; i++) {
      var by = startY + i * (btnH + btnGap);
      if (py >= by && py < by + btnH) return i;
    }
    return -1;
  }

  // ---- Game Actions ----

  function placeColor() {
    if (initialBoard[cursorRow][cursorCol] !== 0) return;
    if (selectedColor < 1 || selectedColor > 9) return;

    if (!isValid(cellGrid, cursorRow, cursorCol, selectedColor)) {
      // Invalid placement — flash red
      flashCell = { row: cursorRow, col: cursorCol };
      flashTimer = 30;
      return;
    }

    cellGrid[cursorRow][cursorCol] = selectedColor;
    filledCells++;

    // Advance cursor to next empty cell
    var found = false;
    for (var sr = cursorRow; sr < 9 && !found; sr++) {
      for (var sc = (sr === cursorRow ? cursorCol : 0); sc < 9 && !found; sc++) {
        if (initialBoard[sr][sc] === 0 && cellGrid[sr][sc] === 0) {
          cursorRow = sr;
          cursorCol = sc;
          found = true;
        }
      }
    }
    // If no empty cell found below, search from top
    if (!found) {
      for (var sr2 = 0; sr2 < 9 && !found; sr2++) {
        for (var sc2 = 0; sc2 < 9 && !found; sc2++) {
          if (initialBoard[sr2][sc2] === 0 && cellGrid[sr2][sc2] === 0) {
            cursorRow = sr2;
            cursorCol = sc2;
            found = true;
          }
        }
      }
    }

    if (filledCells === totalCells) {
      gameState = STATE_WIN;
    }
  }

  // ---- Input Handlers ----

  function handlePointerDown(px, py) {
    var L = window._layout;
    if (!L.s) return;

    if (gameState === STATE_TITLE) {
      gameState = STATE_DIFFICULTY;
      return;
    }

    if (gameState === STATE_DIFFICULTY) {
      var btn = getDifficultyButton(py);
      if (btn >= 0) {
        difficultyCursor = btn;
        difficulty = DIFF_KEYS[btn];
        gameState = STATE_PLAYING;
        initGame();
      }
      return;
    }

    if (gameState === STATE_PLAYING) {
      // Check palette
      var palIdx = getPaletteIndex(px, py);
      if (palIdx >= 0) {
        paletteCursor = palIdx;
        selectedColor = palIdx + 1;
        inputFocus = "grid";
        return;
      }

      // Check grid
      var cell = getGridCell(px, py);
      if (cell) {
        cursorRow = cell.row;
        cursorCol = cell.col;
        if (initialBoard[cell.row][cell.col] === 0 && selectedColor > 0) {
          placeColor();
        }
        return;
      }
      return;
    }

    if (gameState === STATE_WIN) {
      gameState = STATE_DIFFICULTY;
      return;
    }
  }

  function handleKeyDown(e) {
    var key = e.key;

    if (gameState === STATE_TITLE) {
      gameState = STATE_DIFFICULTY;
      e.preventDefault();
      return;
    }

    if (gameState === STATE_DIFFICULTY) {
      if (key === "ArrowUp") {
        difficultyCursor = (difficultyCursor + 2) % 3;
        e.preventDefault();
      } else if (key === "ArrowDown") {
        difficultyCursor = (difficultyCursor + 1) % 3;
        e.preventDefault();
      } else if (key === "ArrowLeft") {
        difficultyCursor = (difficultyCursor + 2) % 3;
        e.preventDefault();
      } else if (key === "ArrowRight") {
        difficultyCursor = (difficultyCursor + 1) % 3;
        e.preventDefault();
      } else if (key === "Enter" || key === " ") {
        difficulty = DIFF_KEYS[difficultyCursor];
        gameState = STATE_PLAYING;
        initGame();
        e.preventDefault();
      }
      return;
    }

    if (gameState === STATE_PLAYING) {
      // Tab: toggle focus between grid and palette
      if (key === "Tab") {
        inputFocus = (inputFocus === "grid" ? "palette" : "grid");
        e.preventDefault();
        return;
      }

      if (inputFocus === "palette") {
        if (key === "ArrowLeft" || key === "ArrowUp") {
          paletteCursor = (paletteCursor + 8) % 9;
          selectedColor = paletteCursor + 1;
          e.preventDefault();
        } else if (key === "ArrowRight" || key === "ArrowDown") {
          paletteCursor = (paletteCursor + 1) % 9;
          selectedColor = paletteCursor + 1;
          e.preventDefault();
        } else if (key === "Enter") {
          selectedColor = paletteCursor + 1;
          inputFocus = "grid";
          e.preventDefault();
        }
        return;
      }

      // Grid focus
      if (key === "ArrowUp") {
        cursorRow = Math.max(0, cursorRow - 1);
        e.preventDefault();
      } else if (key === "ArrowDown") {
        cursorRow = Math.min(8, cursorRow + 1);
        e.preventDefault();
      } else if (key === "ArrowLeft") {
        cursorCol = Math.max(0, cursorCol - 1);
        e.preventDefault();
      } else if (key === "ArrowRight") {
        cursorCol = Math.min(8, cursorCol + 1);
        e.preventDefault();
      } else if (key === "Enter" || key === " ") {
        if (initialBoard[cursorRow][cursorCol] === 0) {
          placeColor();
        }
        e.preventDefault();
      } else if (key >= "1" && key <= "9") {
        selectedColor = parseInt(key);
        paletteCursor = selectedColor - 1;
      } else if (key === "Backspace" || key === "Delete") {
        // Clear a player-placed cell
        if (initialBoard[cursorRow][cursorCol] === 0 && cellGrid[cursorRow][cursorCol] !== 0) {
          cellGrid[cursorRow][cursorCol] = 0;
          filledCells--;
        }
      }
      return;
    }

    if (gameState === STATE_WIN) {
      gameState = STATE_DIFFICULTY;
      e.preventDefault();
      return;
    }
  }

  // ---- Event Listeners ----

  function getCanvasCoords(cx, cy) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (cx - rect.left) * (canvas.width / rect.width),
      y: (cy - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener("mousedown", function (e) {
    var c = getCanvasCoords(e.clientX, e.clientY);
    handlePointerDown(c.x, c.y);
  });

  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      var c = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      handlePointerDown(c.x, c.y);
    }
  }, { passive: false });

  document.addEventListener("keydown", handleKeyDown);

  window.addEventListener("resize", recalcLayout);

  // ---- Game Loop ----

  function gameLoop() {
    recalcLayout();

    // Update flash timer
    if (flashTimer > 0) {
      flashTimer--;
      if (flashTimer <= 0) flashCell = null;
    }

    switch (gameState) {
      case STATE_TITLE:    drawTitleScreen();    break;
      case STATE_DIFFICULTY: drawDifficultyScreen(); break;
      case STATE_PLAYING:  drawGameScreen();    break;
      case STATE_WIN:      drawWinScreen();     break;
    }

    requestAnimationFrame(gameLoop);
  }

  // ---- Start ----
  recalcLayout();
  requestAnimationFrame(gameLoop);

})();
