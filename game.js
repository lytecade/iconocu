const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLORS = [
    '#be2633', '#e06f8b', '#eb8925', '#f7e26b', '#a3ce27',
    '#44891a', '#31a2f2', '#005789', '#b2dcef'
];

const SIZE = 9;
const BOX_SIZE = 3;

let gameState = 'START'; // START, PLAYING, SUCCESS
let board = [];
let initialBoard = [];
let solution = [];
let selectedCell = { r: -1, c: -1 };
let selectedColorIdx = 0;
let focus = 'BOARD'; // 'BOARD' or 'PALETTE'
let otherFocus = focus === 'BOARD' ? 'PALETTE' : 'BOARD';
let errorCell = { r: -1, c: -1 };
let errorTimer = 0;

function initCanvas() {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = minDim;
    canvas.height = minDim;
}

window.addEventListener('resize', initCanvas);
initCanvas();

function generateSudoku() {
    const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    
    function isValid(r, c, v) {
        for (let i = 0; i < SIZE; i++) {
            if (b[r][i] === v || b[i][c] === v) return false;
        }
        const br = Math.floor(r / BOX_SIZE) * BOX_SIZE;
        const bc = Math.floor(c / BOX_SIZE) * BOX_SIZE;
        for (let i = 0; i < BOX_SIZE; i++) {
            for (let j = 0; j < BOX_SIZE; j++) {
                if (b[br + i][bc + j] === v) return false;
            }
        }
        return true;
    }

    function solve(r, c) {
        if (r === SIZE) return true;
        const nextR = c === SIZE - 1 ? r + 1 : r;
        const nextC = c === SIZE - 1 ? 0 : c + 1;

        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (let v of nums) {
            if (isValid(r, c, v)) {
                b[r][c] = v;
                if (solve(nextR, nextC)) return true;
                b[r][c] = 0;
            }
        }
        return false;
    }

    solve(0, 0);
    solution = b.map(row => [...row]);
    
    const puzzle = b.map(row => [...row]);
    let attempts = 40; 
    while (attempts > 0) {
        const r = Math.floor(Math.random() * SIZE);
        const c = Math.floor(Math.random() * SIZE);
        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            attempts--;
        }
    }
    return puzzle;
}

function isPlacementValid(r, c, v) {
    for (let i = 0; i < SIZE; i++) {
        if (i !== c && board[r][i] === v) return false;
        if (i !== r && board[i][c] === v) return false;
    }
    const br = Math.floor(r / BOX_SIZE) * BOX_SIZE;
    const bc = Math.floor(c / BOX_SIZE) * BOX_SIZE;
    for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
            const currR = br + i;
            const currC = bc + j;
            if ((currR !== r || currC !== c) && board[currR][currC] === v) return false;
        }
    }
    return true;
}

function startNewGame() {
    board = generateSudoku();
    initialBoard = board.map(row => [...row]);
    gameState = 'PLAYING';
    selectedCell = { r: 0, c: 0 };
    selectedColorIdx = 0;
    focus = 'BOARD';
    errorTimer = 0;
}

function draw() {
    ctx.fillStyle = '#1b2632';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Define Layout Constants
    const PADDING = 20;
    const TEXT_HEIGHT = 60; // Space reserved for text at the top
    const PALETTE_HEIGHT = 60; // Space reserved for palette at the bottom
    
    let gridWidth = canvas.width;
    let gridHeight = canvas.height - TEXT_HEIGHT - PALETTE_HEIGHT - (2 * PADDING);

    // Ensure square aspect ratio for the grid
    const gridSize = Math.min(gridWidth, gridHeight);
    const cellSize = gridSize / SIZE;
    
    // Calculate grid top-left position
    const gridX = (canvas.width - gridSize) / 2;
    const gridY = PADDING + TEXT_HEIGHT;

    if (gameState === 'START') {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${canvas.width * 0.05}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('ICONOCU', canvas.width / 2, canvas.height * 0.4);
        ctx.font = `${canvas.width * 0.03}px monospace`;
        ctx.fillText('Press Enter to Start', canvas.width / 2, canvas.height * 0.6);
    } else if (gameState === 'PLAYING') {
        
        // 1. Draw UI Text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${canvas.width * 0.02}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`FOCUS: ${focus}`, PADDING, 30);
        ctx.fillText(`Press <Tab> for ${otherFocus}`, PADDING, 50);

        // 2. Draw Board Grid Background (Subtle container)
        ctx.fillStyle = '#2f484e';
        ctx.fillRect(gridX, gridY, gridSize, gridSize);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX, gridY, gridSize, gridSize);

        // 3. Draw Grid Lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i <= SIZE; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(gridX + (i * cellSize), gridY);
            ctx.lineTo(gridX + (i * cellSize), gridY + gridSize);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(gridX, gridY + (i * cellSize));
            ctx.lineTo(gridX + gridSize, gridY + (i * cellSize));
            ctx.stroke();
        }
        
        // 4. Draw Thick Box Lines
        ctx.lineWidth = 6;
        for (let i = 0; i <= SIZE; i += BOX_SIZE) {
            // Vertical
            ctx.beginPath();
            ctx.moveTo(gridX + (i * cellSize), gridY);
            ctx.lineTo(gridX + (i * cellSize), gridY + gridSize);
            ctx.stroke();
            
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(gridX, gridY + (i * cellSize));
            ctx.lineTo(gridX + gridSize, gridY + (i * cellSize));
            ctx.stroke();
        }

        // 5. Draw Cells and Selection
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                // Draw filled cells
                if (board[r][c] !== 0) {
                    ctx.fillStyle = COLORS[board[r][c] - 1];
                    // Add small padding inside cell
                    ctx.fillRect(
                        gridX + (c * cellSize) + 6, 
                        gridY + (r * cellSize) + 6, 
                        cellSize - 12, 
                        cellSize - 12
                    );
                }
                
                // Draw selection box
                if (selectedCell.r === r && selectedCell.c === c) {
                    ctx.strokeStyle = focus === 'BOARD' ? '#ffffff' : '#9d9d9d';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(
                        gridX + (c * cellSize) + 2, 
                        gridY + (r * cellSize) + 2, 
                        cellSize - 4, 
                        cellSize - 4
                    );
                }
            }
        }

        // 6. Draw Error Indicator
        if (errorTimer > 0) {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 4;
                const ex = gridX + (errorCell.c * cellSize);
                const ey = gridY + (errorCell.r * cellSize);
                
                ctx.beginPath();
                ctx.moveTo(ex + cellSize * 0.3, ey + cellSize * 0.3);
                ctx.lineTo(ex + cellSize * 0.7, ey + cellSize * 0.7);
                ctx.moveTo(ex + cellSize * 0.7, ey + cellSize * 0.3);
                ctx.lineTo(ex + cellSize * 0.3, ey + cellSize * 0.7);
                ctx.stroke();
            }
            errorTimer--;
        }

        // 7. Draw Palette (Bottom)
        const paletteY = canvas.height - PALETTE_HEIGHT + (PALETTE_HEIGHT - 40) / 2;
        const paletteWidth = gridSize / 9; // Match palette width to grid width
        
        for (let i = 0; i < 9; i++) {
            ctx.fillStyle = COLORS[i];
            ctx.fillRect(
                gridX + (i * paletteWidth) + 5, 
                paletteY, 
                paletteWidth - 10, 
                40
            );
            if (selectedColorIdx === i) {
                ctx.strokeStyle = focus === 'PALETTE' ? '#ffffff' : '#9d9d9d';
                ctx.lineWidth = 4;
                ctx.strokeRect(
                    gridX + (i * paletteWidth) + 2, 
                    paletteY - 2, 
                    paletteWidth - 4, 
                    44
                );
            }
        }
        
    } else if (gameState === 'SUCCESS') {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${canvas.width * 0.05}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height * 0.4);
        ctx.font = `${canvas.width * 0.03}px monospace`;
        ctx.fillText('Press Enter to Play Again', canvas.width / 2, canvas.height * 0.6);
    }

    requestAnimationFrame(draw);
}

window.addEventListener('keydown', (e) => {
    if (gameState === 'START' && e.key === 'Enter') {
        startNewGame();
    } else if (gameState === 'SUCCESS' && e.key === 'Enter') {
        startNewGame();
    } else if (gameState === 'PLAYING') {
        if (e.key === 'Tab') {
            e.preventDefault();
            focus = focus === 'BOARD' ? 'PALETTE' : 'BOARD';
            otherFocus = focus === 'BOARD' ? 'PALETTE' : 'BOARD';
            return;
        }

        if (focus === 'BOARD') {
            if (e.key === 'ArrowUp') selectedCell.r = Math.max(0, selectedCell.r - 1);
            if (e.key === 'ArrowDown') selectedCell.r = Math.min(SIZE - 1, selectedCell.r + 1);
            if (e.key === 'ArrowLeft') selectedCell.c = Math.max(0, selectedCell.c - 1);
            if (e.key === 'ArrowRight') selectedCell.c = Math.min(SIZE - 1, selectedCell.c + 1);
            
            if (e.key === 'Enter') {
                const r = selectedCell.r;
                const c = selectedCell.c;
                const v = selectedColorIdx + 1;
                
                if (initialBoard[r][c] !== 0) return;
                
                if (isPlacementValid(r, c, v)) {
                    board[r][c] = v;
                    errorTimer = 0;
                } else {
                    errorCell = { r, c };
                    errorTimer = 60;
                }
            }
        } else {
            if (e.key === 'ArrowLeft') selectedColorIdx = (selectedColorIdx - 1 + 9) % 9;
            if (e.key === 'ArrowRight') selectedColorIdx = (selectedColorIdx + 1) % 9;
            if (e.key === 'Enter') {
                focus = 'BOARD';
                otherFocus = focus === 'BOARD' ? 'PALETTE' : 'BOARD';
            }
        }

        let win = true;
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === 0 || board[r][c] !== solution[r][c]) {
                    win = false;
                    break;
                }
            }
        }
        if (win) gameState = 'SUCCESS';
    }
});

draw();

