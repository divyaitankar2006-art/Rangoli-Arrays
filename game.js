// ==========================================================================
// RANGOLI ARRAYS: THE MULTIPLICATION ADVENTURE
// Game Logic, State Management & Audio Controller
// ==========================================================================

// Traditional Indian Rangoli Gulal Powder Palette
const COLORS = [
    '#e91e63', // Rani Pink (Lotus)
    '#00b4d8', // Turquoise Teal (Peacock)
    '#ffb300', // Saffron Marigold (Genda)
    '#7b1fa2', // Royal Purple
    '#ff5722', // Coral Orange
    '#2e7d32', // Emerald Kolam Green
    '#1e88e5', // Royal Azure Blue
    '#d81b60'  // Ruby Magenta
];

let gameState = {
    totalStars: 0,
    soundEnabled: true,
    musicEnabled: true,
    progress: {
        beginner: 1, // Next level to beat
        intermediate: 1,
        advanced: 1
    }
};

let playState = {
    mode: 'beginner',
    questionsAttempted: 0,
    questionsCorrect: 0,
    timer: null,
    timeLeft: 60,
    currentLevel: 1,
    rows: 3,
    cols: 4,
    selectedColor: COLORS[0],
    gridState: [], 
    isChallengeComplete: false,
    currentChallenge: null
};

let creatorState = {
    rows: 5,
    cols: 5,
    selectedColor: COLORS[0],
    gridState: []
};

// --------------------------------------------------------------------------
// Audio Synthesizer (Web Audio API)
// --------------------------------------------------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!gameState.soundEnabled || audioCtx.state === 'suspended') return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(450, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.09);
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.09);
    } else if (type === 'success') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.45);
    } else if (type === 'celebration') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.85);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.85);
    }
}

function initAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Spoken Praises for Kids
const PRAISES = [
    "Wonderful!", "Awesome!", "Amazing!", "Fantastic!",
    "Great job!", "Brilliant!", "Excellent!", "You did it!",
    "Superstar!", "Beautiful work!"
];
let lastPraise = "";

function speakPraise() {
    if (!gameState.soundEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop previous
    
    let praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    while (praise === lastPraise && PRAISES.length > 1) {
        praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    }
    lastPraise = praise;
    
    const utterance = new SpeechSynthesisUtterance(praise);
    utterance.rate = 1.0;
    utterance.pitch = 1.25; // Cheerful friendly pitch for children
    window.speechSynthesis.speak(utterance);
}

// --------------------------------------------------------------------------
// Navigation & Modals
// --------------------------------------------------------------------------
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    
    if (screenId === 'mode-selection') {
        updateMenuStars();
    }
    
    playSound('click');
}

function showModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('hidden');
    playSound('click');
}

function hideModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.classList.add('hidden'));
    playSound('click');
}

// --------------------------------------------------------------------------
// App Initialization & Persistence
// --------------------------------------------------------------------------
function initApp() {
    loadProgress();
    updateSoundUI();
    setupEventListeners();
    setupColorPalettes();
    
    // Attempt to start BGM smoothly
    if (gameState.musicEnabled) {
        startMusic();
    }
}

function loadProgress() {
    const saved = localStorage.getItem('rangoliProgressV3');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.totalStars = data.totalStars || 0;
            gameState.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
            gameState.musicEnabled = data.musicEnabled !== undefined ? data.musicEnabled : true;
            if (data.progress) gameState.progress = data.progress;
        } catch (e) {
            console.error("Could not load progress", e);
        }
    }
}

function saveProgress() {
    try {
        localStorage.setItem('rangoliProgressV3', JSON.stringify(gameState));
    } catch(e) {
        console.warn("Local storage not available");
    }
}

function updateSoundUI() {
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
        const icon = btnSound.querySelector('.icon-sound') || btnSound;
        if (gameState.soundEnabled) {
            btnSound.classList.remove('muted');
            icon.textContent = '🔊';
        } else {
            btnSound.classList.add('muted');
            icon.textContent = '🔇';
        }
    }
    
    const btnMusic = document.getElementById('btn-music-toggle');
    if (btnMusic) {
        const icon = btnMusic.querySelector('.icon-music') || btnMusic;
        if (gameState.musicEnabled) {
            btnMusic.classList.remove('muted');
            icon.textContent = '🎵';
        } else {
            btnMusic.classList.add('muted');
            icon.textContent = '🔇';
        }
    }
}

function startMusic() {
    const bgm = document.getElementById('bg-music');
    if (bgm && gameState.musicEnabled) {
        bgm.volume = 0.16; // Friendly background level
        bgm.play().catch(e => console.log("Audio autoplay prevented", e));
    }
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    updateSoundUI();
    if (gameState.soundEnabled) {
        initAudio();
        playSound('click');
    } else {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
    saveProgress();
}

function toggleMusic() {
    gameState.musicEnabled = !gameState.musicEnabled;
    updateSoundUI();
    const bgm = document.getElementById('bg-music');
    if (gameState.musicEnabled) {
        bgm.volume = 0.16;
        bgm.play().catch(e => console.log(e));
        playSound('click');
    } else {
        if (bgm) bgm.pause();
    }
    saveProgress();
}

// --------------------------------------------------------------------------
// Event Listeners
// --------------------------------------------------------------------------
function setupEventListeners() {
    // Audio Controls
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) btnSound.addEventListener('click', toggleSound);

    const btnMusic = document.getElementById('btn-music-toggle');
    if (btnMusic) btnMusic.addEventListener('click', toggleMusic);
    
    // Unlock Web Audio and BGM on user's first touch/click
    document.addEventListener('click', () => {
        initAudio();
        const bgm = document.getElementById('bg-music');
        if (gameState.musicEnabled && bgm && bgm.paused) {
            startMusic();
        }
    }, { once: true });

    // Welcome Screen Buttons
    const btnPlay = document.getElementById('btn-lets-play');
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            initAudio();
            showScreen('mode-selection');
        });
    }

    const btnHow = document.getElementById('btn-how-to-play');
    if (btnHow) {
        btnHow.addEventListener('click', () => {
            initAudio();
            showModal('instructions-modal');
        });
    }

    const btnCloseInst = document.getElementById('btn-close-instructions');
    if (btnCloseInst) btnCloseInst.addEventListener('click', hideModals);

    // Modal backdrops click to close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', hideModals);
    });

    // Back to Welcome Navigation
    const btnBackWelcome = document.getElementById('btn-back-welcome');
    if (btnBackWelcome) {
        btnBackWelcome.addEventListener('click', () => {
            showScreen('welcome-screen');
        });
    }

    // Mode Selection Cards
    const cardBeg = document.getElementById('card-beginner');
    if (cardBeg) cardBeg.addEventListener('click', () => startPlayMode('beginner'));

    const cardInt = document.getElementById('card-intermediate');
    if (cardInt) cardInt.addEventListener('click', () => startPlayMode('intermediate'));

    const cardAdv = document.getElementById('card-advanced');
    if (cardAdv) cardAdv.addEventListener('click', () => startPlayMode('advanced'));

    const cardSpd = document.getElementById('card-speed');
    if (cardSpd) cardSpd.addEventListener('click', () => startPlayMode('speed'));
    
    const cardFree = document.getElementById('card-free-creator');
    if (cardFree) {
        cardFree.addEventListener('click', () => {
            startCreator();
            showScreen('creator-screen');
        });
    }

    // Home / Menu Buttons
    document.querySelectorAll('.btn-home').forEach(btn => {
        btn.addEventListener('click', () => {
            endSpeedChallenge(); // Stops timer if running
            showScreen('mode-selection');
        });
    });

    // Results Screen Buttons
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            startPlayMode(playState.mode, playState.currentLevel);
        });
    }

    const btnNextLvl = document.getElementById('btn-next-level');
    if (btnNextLvl) {
        btnNextLvl.addEventListener('click', () => {
            startPlayMode(playState.mode, playState.currentLevel + 1);
        });
    }

    // Level Navigation in Top Bar
    const btnPrevLvl = document.getElementById('btn-prev-level');
    if (btnPrevLvl) {
        btnPrevLvl.addEventListener('click', () => {
            if (playState.currentLevel > 1) {
                startPlayMode(playState.mode, playState.currentLevel - 1);
            }
        });
    }

    const btnNextLvlTop = document.getElementById('btn-next-level-top');
    if (btnNextLvlTop) {
        btnNextLvlTop.addEventListener('click', () => {
            if (playState.currentLevel < gameState.progress[playState.mode] && playState.currentLevel < 15) {
                startPlayMode(playState.mode, playState.currentLevel + 1);
            } else {
                playSound('click');
            }
        });
    }

    // Learn & Play Dimension Controls
    const btnRowMinus = document.getElementById('btn-row-minus');
    if (btnRowMinus) btnRowMinus.addEventListener('click', () => changeDimension('play', 'rows', -1));

    const btnRowPlus = document.getElementById('btn-row-plus');
    if (btnRowPlus) btnRowPlus.addEventListener('click', () => changeDimension('play', 'rows', 1));

    const btnColMinus = document.getElementById('btn-col-minus');
    if (btnColMinus) btnColMinus.addEventListener('click', () => changeDimension('play', 'cols', -1));

    const btnColPlus = document.getElementById('btn-col-plus');
    if (btnColPlus) btnColPlus.addEventListener('click', () => changeDimension('play', 'cols', 1));
    
    // Gameplay Action Buttons
    const btnCheck = document.getElementById('btn-check');
    if (btnCheck) btnCheck.addEventListener('click', checkAnswer);

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (playState.isChallengeComplete) return;
            playState.gridState = new Array(playState.rows * playState.cols).fill(null);
            renderPlayGrid();
            hideFeedback();
            playSound('click');
        });
    }

    const btnNext = document.getElementById('btn-next');
    if (btnNext) btnNext.addEventListener('click', nextSpeedChallenge);
    
    const btnHint = document.getElementById('btn-hint');
    if (btnHint) btnHint.addEventListener('click', showHint);

    const btnCloseHint = document.getElementById('btn-close-hint');
    if (btnCloseHint) btnCloseHint.addEventListener('click', hideModals);

    // Creator Screen Controls
    const crRows = document.getElementById('creator-rows');
    if (crRows) {
        crRows.addEventListener('input', (e) => {
            creatorState.rows = parseInt(e.target.value);
            const valEl = document.getElementById('creator-rows-val');
            if (valEl) valEl.textContent = creatorState.rows;
            initCreatorGrid();
        });
    }

    const crCols = document.getElementById('creator-cols');
    if (crCols) {
        crCols.addEventListener('input', (e) => {
            creatorState.cols = parseInt(e.target.value);
            const valEl = document.getElementById('creator-cols-val');
            if (valEl) valEl.textContent = creatorState.cols;
            initCreatorGrid();
        });
    }

    const btnClear = document.getElementById('btn-clear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            creatorState.gridState = new Array(creatorState.rows * creatorState.cols).fill(null);
            renderCreatorGrid();
            playSound('click');
        });
    }

    const btnFill = document.getElementById('btn-fill');
    if (btnFill) {
        btnFill.addEventListener('click', () => {
            creatorState.gridState = new Array(creatorState.rows * creatorState.cols).fill(creatorState.selectedColor);
            renderCreatorGrid();
            playSound('click');
        });
    }
}

// --------------------------------------------------------------------------
// Color Palettes Setup
// --------------------------------------------------------------------------
function setupColorPalettes() {
    const playPalette = document.getElementById('play-palette');
    const creatorPalette = document.getElementById('creator-palette');
    
    if (playPalette) playPalette.innerHTML = '';
    if (creatorPalette) creatorPalette.innerHTML = '';

    COLORS.forEach((color, index) => {
        // Play swatch
        if (playPalette) {
            const pSwatch = document.createElement('div');
            pSwatch.className = 'color-swatch' + (index === 0 ? ' selected' : '');
            pSwatch.style.backgroundColor = color;
            pSwatch.title = `Color ${index + 1}`;
            pSwatch.addEventListener('click', () => {
                document.querySelectorAll('#play-palette .color-swatch').forEach(s => s.classList.remove('selected'));
                pSwatch.classList.add('selected');
                playState.selectedColor = color;
                playSound('click');
            });
            playPalette.appendChild(pSwatch);
        }

        // Creator swatch
        if (creatorPalette) {
            const cSwatch = document.createElement('div');
            cSwatch.className = 'color-swatch' + (index === 0 ? ' selected' : '');
            cSwatch.style.backgroundColor = color;
            cSwatch.title = `Color ${index + 1}`;
            cSwatch.addEventListener('click', () => {
                document.querySelectorAll('#creator-palette .color-swatch').forEach(s => s.classList.remove('selected'));
                cSwatch.classList.add('selected');
                creatorState.selectedColor = color;
                playSound('click');
            });
            creatorPalette.appendChild(cSwatch);
        }
    });
}

function updateMenuStars() {
    const totalMenu = document.getElementById('total-stars-menu');
    if (totalMenu) totalMenu.textContent = gameState.totalStars;

    const playStars = document.getElementById('total-stars-play');
    if (playStars) playStars.textContent = gameState.totalStars;

    const progStars = document.getElementById('progress-stars');
    if (progStars) progStars.textContent = gameState.totalStars;

    // Update progress bars if progress screen is viewed
    const progCompleted = document.getElementById('progress-completed');
    if (progCompleted) {
        const totalDone = Math.max(0, (gameState.progress.beginner - 1)) +
                          Math.max(0, (gameState.progress.intermediate - 1)) +
                          Math.max(0, (gameState.progress.advanced - 1));
        progCompleted.textContent = totalDone;
    }

    const b1 = document.getElementById('bar-stage-1');
    if (b1) b1.style.width = Math.min(100, Math.round(((gameState.progress.beginner - 1) / 15) * 100)) + '%';

    const b2 = document.getElementById('bar-stage-2');
    if (b2) b2.style.width = Math.min(100, Math.round(((gameState.progress.intermediate - 1) / 15) * 100)) + '%';

    const b3 = document.getElementById('bar-stage-3');
    if (b3) b3.style.width = Math.min(100, Math.round(((gameState.progress.advanced - 1) / 15) * 100)) + '%';
}

// --------------------------------------------------------------------------
// Learn & Play Logic
// --------------------------------------------------------------------------
function startPlayMode(mode, level = null) {
    playState.mode = mode;
    playState.questionsAttempted = 0;
    playState.questionsCorrect = 0;
    
    if (mode === 'speed') {
        playState.currentLevel = 0;
        document.getElementById('speed-timer').classList.remove('hidden');
        document.getElementById('btn-prev-level').classList.add('hidden');
        document.getElementById('btn-next-level-top').classList.add('hidden');
        document.getElementById('total-challenge-num').classList.add('hidden');
        document.getElementById('current-mode-name').textContent = "SPEED";
        
        playState.timeLeft = 60;
        document.getElementById('time-left').textContent = playState.timeLeft;
        
        clearInterval(playState.timer);
        playState.timer = setInterval(() => {
            playState.timeLeft--;
            document.getElementById('time-left').textContent = playState.timeLeft;
            if (playState.timeLeft <= 0) {
                showSpeedResults();
            }
        }, 1000);
    } else {
        // Regular mode (Beginner, Intermediate, Advanced)
        playState.currentLevel = level !== null ? level : Math.min(15, gameState.progress[mode]);
        document.getElementById('speed-timer').classList.add('hidden');
        document.getElementById('btn-prev-level').classList.remove('hidden');
        document.getElementById('btn-next-level-top').classList.remove('hidden');
        document.getElementById('total-challenge-num').classList.remove('hidden');
        document.getElementById('total-challenge-num').textContent = "of 15";
        document.getElementById('current-mode-name').textContent = mode.toUpperCase();
        
        clearInterval(playState.timer);
    }

    loadChallenge();
    showScreen('learn-play-screen');
}

function endSpeedChallenge() {
    clearInterval(playState.timer);
}

// --------------------------------------------------------------------------
// Level Questions Data (Beginner, Intermediate, Advanced - 15 Levels Each)
// --------------------------------------------------------------------------

// 1. Beginner Mode: 15 levels covering basic dot arrays, rows & columns,
// repeated addition, and simple multiplication for Class 3-4.
const BEGINNER_LEVELS = [
    {
        level: 1,
        type: 'standard',
        rows: 2,
        cols: 2,
        text: "Make a 2 × 2 rangoli array: 2 rows of 2 dots.",
        equationText: "2 × 2 = ?",
        hint: "Set Rows to 2 and Columns to 2. Count: 2, 4 dots in total!"
    },
    {
        level: 2,
        type: 'standard',
        rows: 2,
        cols: 3,
        text: "Rows go across, columns go down! Make 2 rows of 3 dots.",
        equationText: "2 × 3 = ?",
        hint: "Set Rows = 2 and Columns = 3. 2 groups of 3 dots make 6 dots."
    },
    {
        level: 3,
        type: 'standard',
        rows: 2,
        cols: 3,
        text: "Repeated Addition: 3 + 3 is 2 groups of 3 dots. Make 2 rows of 3 dots!",
        equationText: "3 + 3 = 2 × 3 = ?",
        hint: "Adding 3 two times is the same as 2 × 3. Set Rows = 2, Columns = 3."
    },
    {
        level: 4,
        type: 'standard',
        rows: 3,
        cols: 2,
        text: "Turn the array! Make 3 rows of 2 dots. Notice: 3 × 2 gives the same 6 dots as 2 × 3!",
        equationText: "3 × 2 = ?",
        hint: "Set Rows = 3 and Columns = 2. 3 rows of 2 dots = 6 dots."
    },
    {
        level: 5,
        type: 'standard',
        rows: 3,
        cols: 3,
        text: "Square Rangoli: Make 3 rows of 3 dots to form a square array.",
        equationText: "3 × 3 = ?",
        hint: "Set Rows = 3 and Columns = 3. Count: 3, 6, 9 dots!"
    },
    {
        level: 6,
        type: 'standard',
        rows: 2,
        cols: 4,
        text: "Repeated Addition: 4 + 4 is 2 rows of 4 dots. Build this array!",
        equationText: "4 + 4 = 2 × 4 = ?",
        hint: "Set Rows = 2 and Columns = 4. 4 + 4 = 8 dots."
    },
    {
        level: 7,
        type: 'standard',
        rows: 3,
        cols: 4,
        text: "Rangoli Border: Make 3 rows of 4 colourful dots.",
        equationText: "3 × 4 = ?",
        hint: "3 rows with 4 dots in each row: 4 + 4 + 4 = 12 dots."
    },
    {
        level: 8,
        type: 'standard',
        rows: 4,
        cols: 2,
        text: "Repeated Addition: 2 + 2 + 2 + 2 is 4 groups of 2. Make 4 rows of 2 dots!",
        equationText: "2 + 2 + 2 + 2 = 4 × 2 = ?",
        hint: "Set Rows = 4 and Columns = 2. Four rows with 2 dots each equal 8."
    },
    {
        level: 9,
        type: 'standard',
        rows: 4,
        cols: 3,
        text: "Simple Multiplication: 4 rows × 3 columns. Build the array and colour all dots!",
        equationText: "4 × 3 = ?",
        hint: "Set Rows = 4 and Columns = 3. 4 × 3 = 12 dots."
    },
    {
        level: 10,
        type: 'standard',
        rows: 4,
        cols: 4,
        text: "Flower Mat: Create a 4 × 4 square array for the rangoli center!",
        equationText: "4 × 4 = ?",
        hint: "Set Rows = 4 and Columns = 4. 4 rows of 4 dots = 16 dots."
    },
    {
        level: 11,
        type: 'standard',
        rows: 2,
        cols: 5,
        text: "Repeated Addition: 5 + 5. Make 2 rows of 5 dots!",
        equationText: "5 + 5 = 2 × 5 = ?",
        hint: "Set Rows = 2 and Columns = 5. Skip count by fives: 5, 10!"
    },
    {
        level: 12,
        type: 'standard',
        rows: 5,
        cols: 2,
        text: "Turn the pattern: Make 5 rows of 2 dots. 5 × 2 has the same total as 2 × 5!",
        equationText: "5 × 2 = ?",
        hint: "Set Rows = 5 and Columns = 2. 5 rows of 2 dots = 10 dots."
    },
    {
        level: 13,
        type: 'standard',
        rows: 3,
        cols: 5,
        text: "Repeated Addition: 5 + 5 + 5 is 3 groups of 5. Build 3 rows of 5 dots!",
        equationText: "5 + 5 + 5 = 3 × 5 = ?",
        hint: "Set Rows = 3 and Columns = 5. 3 rows of 5 dots = 15 dots."
    },
    {
        level: 14,
        type: 'standard',
        rows: 4,
        cols: 5,
        text: "Kolam Grid: Build 4 rows with 5 dots in each row.",
        equationText: "4 × 5 = ?",
        hint: "Set Rows = 4 and Columns = 5. Skip count: 5, 10, 15, 20 dots!"
    },
    {
        level: 15,
        type: 'standard',
        rows: 5,
        cols: 5,
        text: "Beginner Finale! Build the grand 5 × 5 Lotus Array: 5 rows of 5 dots.",
        equationText: "5 × 5 = ?",
        hint: "Set Rows = 5 and Columns = 5. Colour all 25 dots to complete Beginner Mode!"
    }
];

// 2. Intermediate Mode: 15 levels covering missing factors, larger arrays,
// multiplication comparisons, and simple two-step questions.
const INTERMEDIATE_LEVELS = [
    {
        level: 1,
        type: 'missing_col',
        rows: 3,
        cols: 6,
        text: "Missing Factor: 3 × ? = 18. We have 3 rows. How many columns are needed to make 18 dots?",
        equationText: "3 × ? = 18",
        hint: "Think: What number times 3 equals 18? Set Columns to 6!"
    },
    {
        level: 2,
        type: 'standard',
        rows: 6,
        cols: 3,
        text: "Larger Array: Turn the array to make 6 rows of 3 dots. Find 6 × 3!",
        equationText: "6 × 3 = ?",
        hint: "Set Rows to 6 and Columns to 3. 6 × 3 = 18 dots."
    },
    {
        level: 3,
        type: 'missing_col',
        rows: 4,
        cols: 6,
        text: "Missing Factor: 4 × ? = 24. We have 4 rows of dots. Find how many dots in each row!",
        equationText: "4 × ? = 24",
        hint: "24 divided into 4 equal rows gives 6 in each row. Set Columns = 6!"
    },
    {
        level: 4,
        type: 'standard',
        rows: 4,
        cols: 4,
        text: "Multiplication Comparison: 2 × 8 = 16. Build an array with 4 rows that has the same 16 dots!",
        equationText: "4 × ? = 16 (same as 2 × 8)",
        hint: "4 rows of 4 dots also make 16 dots! Set Rows = 4 and Columns = 4."
    },
    {
        level: 5,
        type: 'standard',
        rows: 2,
        cols: 6,
        text: "Simple Two-Step: Aarav starts with 2 rows of 3 dots, then doubles the columns! Build 2 rows of 6 dots.",
        equationText: "2 × (3 × 2) = 2 × 6 = ?",
        hint: "Doubling 3 gives 6. Build 2 rows of 6 dots = 12 dots!"
    },
    {
        level: 6,
        type: 'standard',
        rows: 6,
        cols: 4,
        text: "Larger Array: Festive Kolam! Build an array with 6 rows and 4 columns.",
        equationText: "6 × 4 = ?",
        hint: "Set Rows = 6 and Columns = 4. 6 × 4 = 24 dots."
    },
    {
        level: 7,
        type: 'missing_row',
        rows: 7,
        cols: 5,
        text: "Missing Factor: ? × 5 = 35. Each row has 5 dots. How many rows make 35 dots?",
        equationText: "? × 5 = 35",
        hint: "Count by fives to 35: 5, 10, 15, 20, 25, 30, 35 (7 rows). Set Rows = 7, Columns = 5."
    },
    {
        level: 8,
        type: 'standard',
        rows: 6,
        cols: 4,
        text: "Multiplication Comparison: 3 × 8 = 24. Make an equivalent array with 6 rows that has the same 24 dots!",
        equationText: "6 × ? = 24 (same as 3 × 8)",
        hint: "6 × 4 is also 24! Set Rows to 6 and Columns to 4."
    },
    {
        level: 9,
        type: 'standard',
        rows: 7,
        cols: 4,
        text: "Larger Array: Peacock Pattern! Build a 7 rows by 4 columns rangoli array.",
        equationText: "7 × 4 = ?",
        hint: "Set Rows = 7 and Columns = 4. 7 × 4 = 28 dots."
    },
    {
        level: 10,
        type: 'standard',
        rows: 5,
        cols: 5,
        text: "Simple Two-Step: Meera has 4 rows of 5 dots. She adds 1 more row of 5! Build the new 5 × 5 array.",
        equationText: "(4 × 5) + 5 = 5 × 5 = ?",
        hint: "4 rows of 5 is 20. Adding 5 more gives 5 rows of 5 = 25 dots!"
    },
    {
        level: 11,
        type: 'missing_col',
        rows: 6,
        cols: 6,
        text: "Missing Factor: 6 × ? = 36. A square rangoli has 6 rows. How many columns are needed for 36 dots?",
        equationText: "6 × ? = 36",
        hint: "6 × 6 = 36! Set Columns to 6."
    },
    {
        level: 12,
        type: 'standard',
        rows: 8,
        cols: 4,
        text: "Larger Array: Mandala Grid! Create 8 rows of 4 colourful dots.",
        equationText: "8 × 4 = ?",
        hint: "Set Rows = 8 and Columns = 4. 8 × 4 = 32 dots."
    },
    {
        level: 13,
        type: 'standard',
        rows: 4,
        cols: 9,
        text: "Multiplication Comparison: Both 4 × 9 and 6 × 6 equal 36! Build the array with 4 rows and 9 columns.",
        equationText: "4 × 9 = 36 (same as 6 × 6)",
        hint: "Set Rows to 4 and Columns to 9. 4 × 9 = 36 dots."
    },
    {
        level: 14,
        type: 'standard',
        rows: 6,
        cols: 6,
        text: "Simple Two-Step: Start with 3 rows of 6 dots, then double the rows! Build 6 rows of 6 dots.",
        equationText: "(3 × 2) rows × 6 = 6 × 6 = ?",
        hint: "Doubling 3 gives 6 rows. Build 6 rows of 6 dots = 36 dots!"
    },
    {
        level: 15,
        type: 'standard',
        rows: 7,
        cols: 6,
        text: "Colour Master Finale! Build a magnificent 7 rows by 6 columns rangoli array.",
        equationText: "7 × 6 = ?",
        hint: "Set Rows = 7 and Columns = 6. Colour all 42 dots to complete Intermediate Mode!"
    }
];

// 3. Advanced Mode: 15 levels covering clearly harder questions, age-appropriate
// word problems with real-life Indian festival examples (rangoli dots, flowers, sweets,
// beads, decorations), multi-step problems, reasoning questions, and boss array.
const ADVANCED_LEVELS = [
    {
        level: 1,
        type: 'standard',
        rows: 6,
        cols: 7,
        allowCommutative: true,
        text: "Diwali Rangoli: Priya draws a courtyard rangoli with 6 rows of 7 dots. Build this array to find how many dots she drew!",
        equationText: "6 × 7 = ?",
        hint: "Set Rows = 6 and Columns = 7 (or 7 × 6). Total: 42 dots!"
    },
    {
        level: 2,
        type: 'standard',
        rows: 7,
        cols: 7,
        allowCommutative: true,
        text: "Marigold Flowers: Ananya strings fresh marigold flowers in 7 equal rows with 7 flowers in each row. How many flowers did she use in all?",
        equationText: "7 × 7 = ?",
        hint: "Set Rows = 7 and Columns = 7. A square array: 7 × 7 = 49 flowers."
    },
    {
        level: 3,
        type: 'standard',
        rows: 6,
        cols: 8,
        allowCommutative: true,
        text: "Festive Sweets: A halwai packs besan laddoos in a festive tray of 6 rows with 8 laddoos in each row. Build the array to find the total laddoos!",
        equationText: "6 × 8 = ?",
        hint: "Set Rows = 6 and Columns = 8 (or 8 × 6). 6 × 8 = 48 laddoos."
    },
    {
        level: 4,
        type: 'standard',
        rows: 8,
        cols: 6,
        allowCommutative: true,
        text: "Toran Beads: Rohan stitches shiny golden beads onto a doorway toran in 8 rows with 6 beads in each row. How many beads are on the toran?",
        equationText: "8 × 6 = ?",
        hint: "Set Rows = 8 and Columns = 6 (or 6 × 8). 8 × 6 = 48 beads."
    },
    {
        level: 5,
        type: 'missing_col',
        rows: 6,
        cols: 4,
        allowCommutative: true,
        text: "Festival Diyas: Kavi had 24 lamps in 3 rows of 8. She rearranges them into 6 equal rows. How many lamps are in each row? (6 × ? = 24). Build the new array!",
        equationText: "6 × ? = 24",
        hint: "24 lamps divided into 6 equal rows gives 4 lamps in each row. Set Rows = 6, Columns = 4."
    },
    {
        level: 6,
        type: 'standard',
        rows: 8,
        cols: 7,
        allowCommutative: true,
        text: "Flower Rangoli: For Onam, Grandma places fragrant rose petals in 8 rows of 7 petals each. Build the array to find the total petals!",
        equationText: "8 × 7 = ?",
        hint: "Set Rows = 8 and Columns = 7 (or 7 × 8). 8 × 7 = 56 petals."
    },
    {
        level: 7,
        type: 'standard',
        rows: 6,
        cols: 6,
        allowCommutative: false,
        text: "Reasoning Challenge: Vikram has 36 kaju katli pieces. He wants a square array where rows and columns are equal. Build this square array of 36 sweets!",
        equationText: "? × ? = 36 (Square Array)",
        hint: "A square array has equal rows and columns. 6 × 6 = 36! Set Rows = 6, Columns = 6."
    },
    {
        level: 8,
        type: 'standard',
        rows: 9,
        cols: 5,
        allowCommutative: true,
        text: "Festival Decorations: An artisan hangs clay bells on a wall hanging in 9 rows with 5 bells in each row. How many bells hang on the wall?",
        equationText: "9 × 5 = ?",
        hint: "Set Rows = 9 and Columns = 5 (or 5 × 9). 9 × 5 = 45 bells."
    },
    {
        level: 9,
        type: 'missing_col',
        rows: 5,
        cols: 8,
        allowCommutative: true,
        text: "Jasmine Flowers: Diya makes 5 strings of 6 flowers (30). Her sister gives her 10 more to reach 40 flowers! Build an array of 5 rows that equals 40 flowers.",
        equationText: "5 × ? = 40",
        hint: "40 flowers in 5 rows means 8 flowers per row: 5 × 8 = 40. Set Rows = 5, Columns = 8."
    },
    {
        level: 10,
        type: 'standard',
        rows: 9,
        cols: 6,
        allowCommutative: true,
        text: "Grand Kolam Dots: An expert artist draws 9 rows with 6 white chalk dots in each row for a big temple festival. Build the array to find the total dots!",
        equationText: "9 × 6 = ?",
        hint: "Set Rows = 9 and Columns = 6 (or 6 × 9). 9 × 6 = 54 dots."
    },
    {
        level: 11,
        type: 'missing_row',
        rows: 6,
        cols: 8,
        allowCommutative: true,
        text: "Gift Box Reasoning: 48 sweet boxes are placed on display with 8 boxes in each row. How many rows are needed? (? × 8 = 48). Build the array!",
        equationText: "? × 8 = 48",
        hint: "Think: What number times 8 equals 48? 6 × 8 = 48! Set Rows = 6, Columns = 8."
    },
    {
        level: 12,
        type: 'standard',
        rows: 8,
        cols: 8,
        allowCommutative: true,
        text: "Mirror Embroidery: A craftsman embroiders sparkling mirrors on a festival dupatta in 8 rows of 8 mirrors. Build this square array!",
        equationText: "8 × 8 = ?",
        hint: "Set Rows = 8 and Columns = 8. 8 × 8 = 64 mirrors."
    },
    {
        level: 13,
        type: 'standard',
        rows: 7,
        cols: 8,
        allowCommutative: true,
        text: "Festival Lights: 7 rows of decorative paper lanterns are hung along the street, with 8 lanterns in each row. Build the array to find the total lanterns!",
        equationText: "7 × 8 = ?",
        hint: "Set Rows = 7 and Columns = 8 (or 8 × 7). 7 × 8 = 56 lanterns."
    },
    {
        level: 14,
        type: 'standard',
        rows: 9,
        cols: 7,
        allowCommutative: true,
        text: "Brass Lamps: 9 rows of brass diyas are lit for the evening aarti, with 7 lamps in each row. How many radiant lamps are shining in all?",
        equationText: "9 × 7 = ?",
        hint: "Set Rows = 9 and Columns = 7 (or 7 × 9). 9 × 7 = 63 lamps."
    },
    {
        level: 15,
        type: 'boss',
        targetDots: 48,
        rows: 6,
        cols: 8,
        text: "🏆 Grand Rangoli Boss Challenge! Create ANY rectangular array that uses exactly 48 dots (such as 6 × 8 or 8 × 6). Fill every dot to become the Rangoli Champion!",
        equationText: "? × ? = 48",
        hint: "Find two factors that multiply to 48! For example: 6 × 8 = 48 or 8 × 6 = 48. Set rows and columns, then colour all 48 dots!"
    }
];

function generateChallenge(mode, level) {
    // Speed sprint remains 100% untouched
    if (mode === 'speed') {
        const r = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 8) + 2;
        return { type: 'standard', rows: r, cols: c, text: `Quick! Make ${r} rows of ${c}!` };
    }
    
    const lvlIndex = Math.max(0, Math.min(14, (level || 1) - 1));
    
    if (mode === 'beginner') {
        return BEGINNER_LEVELS[lvlIndex];
    }
    
    if (mode === 'intermediate') {
        return INTERMEDIATE_LEVELS[lvlIndex];
    }
    
    if (mode === 'advanced') {
        return ADVANCED_LEVELS[lvlIndex];
    }
}

function loadChallenge() {
    playState.questionsAttempted++;
    
    if (playState.mode === 'speed') {
        document.getElementById('current-challenge-num').textContent = playState.questionsAttempted;
    } else {
        document.getElementById('current-challenge-num').textContent = playState.currentLevel;
        
        // Update top bar buttons visual state
        const prevBtn = document.getElementById('btn-prev-level');
        const nextBtn = document.getElementById('btn-next-level-top');
        if (prevBtn) prevBtn.style.opacity = playState.currentLevel > 1 ? "1" : "0.4";
        if (nextBtn) nextBtn.style.opacity = (playState.currentLevel < gameState.progress[playState.mode] && playState.currentLevel < 15) ? "1" : "0.4";
    }
    
    playState.currentChallenge = generateChallenge(playState.mode, playState.currentLevel);
    let ch = playState.currentChallenge;
    
    document.getElementById('challenge-instruction').textContent = ch.text;
    
    if (ch.type === 'boss') {
        document.getElementById('challenge-equation').textContent = `? × ? = ${ch.targetDots}`;
    } else if (ch.type === 'missing_col') {
        document.getElementById('challenge-equation').textContent = `${ch.rows} × ? = ${ch.rows * ch.cols}`;
    } else if (ch.type === 'missing_row') {
        document.getElementById('challenge-equation').textContent = `? × ${ch.cols} = ${ch.rows * ch.cols}`;
    } else if (ch.equationText) {
        document.getElementById('challenge-equation').textContent = ch.equationText;
    } else {
        document.getElementById('challenge-equation').textContent = `${ch.rows} × ${ch.cols} = ?`;
    }

    // Default UI grid size - start off by 1 so child interacts with steppers
    playState.rows = Math.max(1, (ch.rows || 3) - 1);
    playState.cols = Math.max(1, (ch.cols || 4) - 1);
    
    playState.gridState = new Array(playState.rows * playState.cols).fill(null);
    playState.isChallengeComplete = false;
    
    updatePlayUI();
    hideFeedback();
    
    document.getElementById('btn-check').classList.remove('hidden');
    document.getElementById('btn-next').classList.add('hidden');
    
    if (playState.mode === 'speed') {
        document.getElementById('btn-hint').classList.add('hidden'); 
        document.getElementById('btn-next').textContent = "Next Fast! ➡️";
    } else {
        document.getElementById('btn-hint').classList.remove('hidden');
    }
}

function changeDimension(mode, dim, amount) {
    if (mode === 'play') {
        if (playState.isChallengeComplete) return; 
        
        const newVal = playState[dim] + amount;
        if (newVal >= 1 && newVal <= 10) {
            playState[dim] = newVal;
            const newGrid = new Array(playState.rows * playState.cols).fill(null);
            playState.gridState = newGrid; 
            updatePlayUI();
            hideFeedback();
            playSound('click');
        }
    }
}

function updatePlayUI() {
    document.getElementById('display-rows').textContent = playState.rows;
    document.getElementById('display-cols').textContent = playState.cols;
    
    const ch = playState.currentChallenge;
    if (ch) {
        if (ch.type === 'boss') {
            document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ?`;
        } else if (ch.type === 'missing_col') {
            document.getElementById('challenge-equation').textContent = `${ch.rows} × ${playState.cols} = ?`;
        } else if (ch.type === 'missing_row') {
            document.getElementById('challenge-equation').textContent = `${playState.rows} × ${ch.cols} = ?`;
        } else {
            document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ?`;
        }
    }
    
    renderPlayGrid();
}

function renderPlayGrid() {
    const grid = document.getElementById('play-grid');
    if (!grid) return;

    // Use CSS variable dot-size for responsive scaling
    grid.style.gridTemplateColumns = `repeat(${playState.cols}, var(--dot-size, 44px))`;
    grid.innerHTML = '';
    
    // Update Row and Column Guides for easy Class 3-4 understanding
    const colGuides = document.getElementById('play-col-guides');
    if (colGuides) {
        colGuides.innerHTML = '';
        for (let c = 1; c <= playState.cols; c++) {
            const chip = document.createElement('div');
            chip.className = 'col-guide-chip';
            chip.textContent = `${c}`;
            chip.title = `Column ${c}`;
            colGuides.appendChild(chip);
        }
    }

    const rowGuides = document.getElementById('play-row-guides');
    if (rowGuides) {
        rowGuides.innerHTML = '';
        for (let r = 1; r <= playState.rows; r++) {
            const chip = document.createElement('div');
            chip.className = 'row-guide-chip';
            chip.textContent = `Row ${r}`;
            rowGuides.appendChild(chip);
        }
    }

    let coloredCount = 0;
    
    for (let i = 0; i < playState.rows * playState.cols; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', `Dot ${i + 1}`);
        
        if (playState.gridState[i]) {
            dot.style.backgroundColor = playState.gridState[i];
            dot.classList.add('colored');
            coloredCount++;
        }
        
        dot.addEventListener('click', () => {
            if (playState.isChallengeComplete) return;
            
            if (playState.gridState[i] === playState.selectedColor) {
                playState.gridState[i] = null;
            } else {
                playState.gridState[i] = playState.selectedColor;
            }
            playSound('click');
            renderPlayGrid();
        });
        
        grid.appendChild(dot);
    }
    
    const countDisplay = document.getElementById('colored-count');
    if (countDisplay) countDisplay.textContent = coloredCount;
}

function checkAnswer() {
    if (playState.isChallengeComplete) return;
    
    const ch = playState.currentChallenge;
    const coloredCount = playState.gridState.filter(c => c !== null).length;
    
    const feedback = document.getElementById('challenge-feedback');
    feedback.classList.remove('hidden', 'success', 'error');
    
    if (ch.type === 'boss') {
        if (playState.rows * playState.cols !== ch.targetDots) {
            feedback.textContent = `You need ${ch.targetDots} dots total. Your grid currently makes ${playState.rows * playState.cols}.`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        if (coloredCount !== ch.targetDots) {
            feedback.textContent = `Fill all ${ch.targetDots} dots with colourful powder!`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ${ch.targetDots}`;
    } else {
        // Match exact or commutative if allowed
        const isMatch = (playState.rows === ch.rows && playState.cols === ch.cols) ||
                        (ch.allowCommutative && playState.rows === ch.cols && playState.cols === ch.rows);
                        
        if (!isMatch) {
            if (ch.allowCommutative) {
                feedback.textContent = `Almost there! You need ${ch.rows} × ${ch.cols} (or ${ch.cols} × ${ch.rows}) dots.`;
            } else {
                feedback.textContent = `Almost there! You need ${ch.rows} rows and ${ch.cols} columns.`;
            }
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        
        const targetDots = ch.rows * ch.cols;
        if (coloredCount !== targetDots) {
            feedback.textContent = `Check your dots! Please colour all ${targetDots} dots.`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ${targetDots}`;
    }
    
    // Correct!
    playState.isChallengeComplete = true;
    feedback.textContent = `✨ Correct! ${playState.rows} × ${playState.cols} = ${playState.rows * playState.cols}`;
    feedback.classList.add('success');
    
    document.getElementById('btn-check').classList.add('hidden');
    
    playSound('success');
    speakPraise();
    
    if (playState.mode === 'speed') {
        playState.questionsCorrect++;
        document.getElementById('btn-next').classList.remove('hidden');
    } else {
        // Regular mode level completion
        if (playState.currentLevel === gameState.progress[playState.mode]) {
            if (gameState.progress[playState.mode] < 15) {
                gameState.progress[playState.mode]++;
            }
            gameState.totalStars++;
            saveProgress();
            updateMenuStars();
        }
        
        setTimeout(() => {
            showLevelComplete();
        }, 1400);
    }
}

function nextSpeedChallenge() {
    loadChallenge();
}

function showHint() {
    const ch = playState.currentChallenge;
    let text = "";
    if (ch.hint) {
        text = ch.hint;
    } else if (ch.type === 'boss') {
        text = `Think of two numbers that multiply to make ${ch.targetDots}. Set your rows to one and columns to the other!`;
    } else if (ch.type === 'missing_col') {
        text = `You have ${ch.rows} rows. What number multiplied by ${ch.rows} gives ${ch.rows * ch.cols}? That's your column count!`;
    } else if (ch.type === 'missing_row') {
        text = `You have ${ch.cols} columns. What number multiplied by ${ch.cols} gives ${ch.rows * ch.cols}? That's your row count!`;
    } else {
        text = `Try making ${ch.rows} equal rows. Put ${ch.cols} dots in every row. Then colour each dot!`;
    }
    document.getElementById('hint-text').textContent = text;
    showModal('hint-modal');
}

function hideFeedback() {
    const fb = document.getElementById('challenge-feedback');
    if (fb) fb.classList.add('hidden');
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#e91e63', '#00b4d8', '#ffb300', '#7b1fa2', '#ff5722', '#4caf50'];
    
    const count = playState.currentLevel === 15 ? 100 : 65;

    for (let i = 0; i < count; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDuration = (Math.random() * 2 + 1.2) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        
        // Random shapes: petals, circles, stars
        if (Math.random() > 0.5) {
            conf.style.borderRadius = '50%';
        } else if (Math.random() > 0.7) {
            conf.style.width = '14px';
            conf.style.height = '6px';
        }
        
        container.appendChild(conf);
    }
}

function showLevelComplete() {
    showScreen('results-screen');
    createConfetti();
    playSound('celebration');
    
    const isModeComplete = playState.currentLevel === 15;
    
    const titleEl = document.getElementById('results-title');
    const modeEl = document.getElementById('results-mode');
    const msgEl = document.getElementById('results-message');
    
    if (isModeComplete) {
        titleEl.textContent = "🏆 GRAND VICTORY! 🏆";
        modeEl.textContent = playState.mode.toUpperCase() + " COMPLETE!";
        msgEl.textContent = "You completed all 15 levels! True Rangoli Champion!";
    } else {
        titleEl.textContent = "Level Complete! 🌟";
        modeEl.textContent = playState.mode.toUpperCase() + " • LEVEL " + playState.currentLevel;
        msgEl.textContent = "Wonderful Rangoli Mastery!";
    }
    
    // Hide speed challenge stats
    document.querySelectorAll('.stats-card').forEach(el => {
        if (el.querySelector('h4')) el.style.display = 'none';
    });
    
    document.getElementById('results-stars').textContent = gameState.totalStars;
    
    const btnNextLvl = document.getElementById('btn-next-level');
    const btnPlayAgain = document.getElementById('btn-play-again');
    
    btnNextLvl.classList.remove('hidden');
    btnPlayAgain.classList.remove('hidden');
    
    if (isModeComplete) {
        btnNextLvl.classList.add('hidden');
    }
}

function showSpeedResults() {
    endSpeedChallenge();
    showScreen('results-screen');
    const conf = document.getElementById('confetti-container');
    if (conf) conf.innerHTML = '';
    
    document.getElementById('results-title').textContent = "Time's Up! ⏱️";
    document.getElementById('results-mode').textContent = "SPEED SPRINT FINISH";
    document.getElementById('results-message').textContent = "Fantastic effort!";
    
    // Show speed stats
    document.querySelectorAll('.stats-card').forEach(el => {
        if (el.querySelector('h4')) el.style.display = 'block';
    });
    
    document.getElementById('results-attempted').textContent = playState.questionsAttempted;
    document.getElementById('results-correct').textContent = playState.questionsCorrect;
    
    let acc = 0;
    if (playState.questionsAttempted > 0) {
        acc = Math.round((playState.questionsCorrect / playState.questionsAttempted) * 100);
    }
    document.getElementById('results-accuracy').textContent = acc + "%";
    
    // Show correct count in star counter
    document.getElementById('results-stars').textContent = playState.questionsCorrect;
    
    document.getElementById('btn-next-level').classList.add('hidden');
    document.getElementById('btn-play-again').classList.remove('hidden');
}

// --------------------------------------------------------------------------
// Free Rangoli Creator Screen Logic
// --------------------------------------------------------------------------
function startCreator() {
    initCreatorGrid();
}

function initCreatorGrid() {
    creatorState.gridState = new Array(creatorState.rows * creatorState.cols).fill(null);
    renderCreatorGrid();
}

function renderCreatorGrid() {
    const grid = document.getElementById('creator-grid');
    if (!grid) return;

    grid.style.gridTemplateColumns = `repeat(${creatorState.cols}, var(--dot-size, 44px))`;
    grid.innerHTML = '';
    
    let coloredCount = 0;
    
    for (let i = 0; i < creatorState.rows * creatorState.cols; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', `Creator Dot ${i + 1}`);
        
        if (creatorState.gridState[i]) {
            dot.style.backgroundColor = creatorState.gridState[i];
            dot.classList.add('colored');
            coloredCount++;
        }
        
        dot.addEventListener('click', () => {
            if (creatorState.gridState[i] === creatorState.selectedColor) {
                creatorState.gridState[i] = null;
            } else {
                creatorState.gridState[i] = creatorState.selectedColor;
            }
            playSound('click');
            renderCreatorGrid();
        });
        
        grid.appendChild(dot);
    }
    
    const dimText = document.getElementById('creator-dim-text');
    if (dimText) dimText.textContent = `${creatorState.rows} × ${creatorState.cols}`;

    const countText = document.getElementById('creator-count');
    if (countText) countText.textContent = coloredCount;
    
    const eq = document.getElementById('creator-equation');
    if (eq) {
        const totalDots = creatorState.rows * creatorState.cols;
        if (coloredCount === totalDots) {
            eq.textContent = `🌟 Full Array! ${creatorState.rows} rows × ${creatorState.cols} columns = ${totalDots} dots`;
            eq.style.color = 'var(--color-rani-pink)';
        } else {
            eq.textContent = `Creative Pattern! ${coloredCount} of ${totalDots} dots coloured.`;
            eq.style.color = 'var(--color-text-muted)';
        }
    }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', initApp);
