// Game Data & State
const COLORS = [
    '#d6226b', // Magenta
    '#009688', // Teal
    '#ffb300', // Saffron
    '#7b1fa2', // Purple
    '#f4511e', // Coral
    '#4caf50', // Green
    '#2196f3', // Blue
    '#e91e63'  // Pink
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


// Audio Context for synthetic sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!gameState.soundEnabled || audioCtx.state === 'suspended') return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'celebration') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.4);
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.6);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.8);
    }
}

function initAudio() {
    if(audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

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
    while(praise === lastPraise) {
        praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    }
    lastPraise = praise;
    
    const utterance = new SpeechSynthesisUtterance(praise);
    utterance.rate = 1.0;
    utterance.pitch = 1.2; // Slightly higher, friendly pitch
    window.speechSynthesis.speak(utterance);
}

// DOM Elements
const screens = document.querySelectorAll('.screen');
const modals = document.querySelectorAll('.modal');

// Navigation
function showScreen(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    screens.forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active');
    
    if(screenId === 'mode-selection') {
        updateMenuStars();
    }
    
    playSound('click');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    playSound('click');
}

function hideModals() {
    modals.forEach(m => m.classList.add('hidden'));
    playSound('click');
}

// Initialize Application
function initApp() {
    loadProgress();
    updateSoundUI();
    setupEventListeners();
    setupColorPalettes();
    
    // Attempt to start music immediately when the game opens
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
    if (gameState.soundEnabled) {
        btnSound.classList.remove('muted');
        btnSound.textContent = '🔊';
    } else {
        btnSound.classList.add('muted');
        btnSound.textContent = '🔇';
    }
    
    const btnMusic = document.getElementById('btn-music-toggle');
    if (gameState.musicEnabled) {
        btnMusic.classList.remove('muted');
    } else {
        btnMusic.classList.add('muted');
    }
}

function startMusic() {
    const bgm = document.getElementById('bg-music');
    if (bgm && gameState.musicEnabled) {
        bgm.volume = 0.15; // Low volume so it doesn't distract
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
        bgm.volume = 0.15;
        bgm.play().catch(e => console.log(e));
        playSound('click');
    } else {
        bgm.pause();
    }
    saveProgress();
}

function setupEventListeners() {
    // Audio Toggles
    document.getElementById('btn-sound-toggle').addEventListener('click', toggleSound);
    document.getElementById('btn-music-toggle').addEventListener('click', toggleMusic);
    
    // First interaction unlocks audio policies
    document.addEventListener('click', () => {
        initAudio();
        if (gameState.musicEnabled && document.getElementById('bg-music').paused) {
            startMusic();
        }
    }, { once: true });

    // Welcome Screen
    document.getElementById('btn-lets-play').addEventListener('click', () => {
        initAudio();
        showScreen('mode-selection');
    });
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
        initAudio();
        showModal('instructions-modal');
    });
    document.getElementById('btn-close-instructions').addEventListener('click', hideModals);

    // Mode Selection Back
    document.getElementById('btn-back-welcome').addEventListener('click', () => {
        showScreen('welcome-screen');
    });

    // Cards
    document.getElementById('card-beginner').addEventListener('click', () => startPlayMode('beginner'));
    document.getElementById('card-intermediate').addEventListener('click', () => startPlayMode('intermediate'));
    document.getElementById('card-advanced').addEventListener('click', () => startPlayMode('advanced'));
    document.getElementById('card-speed').addEventListener('click', () => startPlayMode('speed'));
    
    document.getElementById('card-free-creator').addEventListener('click', () => {
        startCreator();
        showScreen('creator-screen');
    });

    // Home / Menu buttons
    document.querySelectorAll('.btn-home').forEach(btn => {
        btn.addEventListener('click', () => {
            endSpeedChallenge(); // Stops timer if running
            showScreen('mode-selection');
        });
    });

    // Results buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
        startPlayMode(playState.mode, playState.currentLevel);
    });
    document.getElementById('btn-next-level').addEventListener('click', () => {
        startPlayMode(playState.mode, playState.currentLevel + 1);
    });

    // Level Navigation in Top Bar
    document.getElementById('btn-prev-level').addEventListener('click', () => {
        if (playState.currentLevel > 1) {
            startPlayMode(playState.mode, playState.currentLevel - 1);
        }
    });
    document.getElementById('btn-next-level-top').addEventListener('click', () => {
        if (playState.currentLevel < gameState.progress[playState.mode] && playState.currentLevel < 15) {
            startPlayMode(playState.mode, playState.currentLevel + 1);
        } else {
            // Cannot go beyond unlocked
            playSound('click');
        }
    });

    // Learn & Play Controls
    document.getElementById('btn-row-minus').addEventListener('click', () => changeDimension('play', 'rows', -1));
    document.getElementById('btn-row-plus').addEventListener('click', () => changeDimension('play', 'rows', 1));
    document.getElementById('btn-col-minus').addEventListener('click', () => changeDimension('play', 'cols', -1));
    document.getElementById('btn-col-plus').addEventListener('click', () => changeDimension('play', 'cols', 1));
    
    document.getElementById('btn-check').addEventListener('click', checkAnswer);
    document.getElementById('btn-reset').addEventListener('click', () => {
        if (playState.isChallengeComplete) return;
        playState.gridState = new Array(playState.rows * playState.cols).fill(null);
        renderPlayGrid();
        hideFeedback();
        playSound('click');
    });
    document.getElementById('btn-next').addEventListener('click', nextSpeedChallenge);
    
    document.getElementById('btn-hint').addEventListener('click', showHint);
    document.getElementById('btn-close-hint').addEventListener('click', hideModals);

    // Creator Controls
    document.getElementById('creator-rows').addEventListener('input', (e) => {
        creatorState.rows = parseInt(e.target.value);
        document.getElementById('creator-rows-val').textContent = creatorState.rows;
        initCreatorGrid();
    });
    document.getElementById('creator-cols').addEventListener('input', (e) => {
        creatorState.cols = parseInt(e.target.value);
        document.getElementById('creator-cols-val').textContent = creatorState.cols;
        initCreatorGrid();
    });
    document.getElementById('btn-clear').addEventListener('click', () => {
        creatorState.gridState = new Array(creatorState.rows * creatorState.cols).fill(null);
        renderCreatorGrid();
        playSound('click');
    });
    document.getElementById('btn-fill').addEventListener('click', () => {
        creatorState.gridState = new Array(creatorState.rows * creatorState.cols).fill(creatorState.selectedColor);
        renderCreatorGrid();
        playSound('click');
    });
}

function setupColorPalettes() {
    const playPalette = document.getElementById('play-palette');
    const creatorPalette = document.getElementById('creator-palette');
    
    COLORS.forEach((color, index) => {
        // Play swatch
        const pSwatch = document.createElement('div');
        pSwatch.className = 'color-swatch' + (index === 0 ? ' selected' : '');
        pSwatch.style.backgroundColor = color;
        pSwatch.addEventListener('click', () => {
            document.querySelectorAll('#play-palette .color-swatch').forEach(s => s.classList.remove('selected'));
            pSwatch.classList.add('selected');
            playState.selectedColor = color;
            playSound('click');
        });
        playPalette.appendChild(pSwatch);

        // Creator swatch
        const cSwatch = document.createElement('div');
        cSwatch.className = 'color-swatch' + (index === 0 ? ' selected' : '');
        cSwatch.style.backgroundColor = color;
        cSwatch.addEventListener('click', () => {
            document.querySelectorAll('#creator-palette .color-swatch').forEach(s => s.classList.remove('selected'));
            cSwatch.classList.add('selected');
            creatorState.selectedColor = color;
            playSound('click');
        });
        creatorPalette.appendChild(cSwatch);
    });
}

function updateMenuStars() {
    document.getElementById('total-stars-menu').textContent = gameState.totalStars;
    const playStars = document.getElementById('total-stars-play');
    if(playStars) playStars.textContent = gameState.totalStars;
}

// --- LEARN & PLAY LOGIC ---

function startPlayMode(mode, level = null) {
    playState.mode = mode;
    playState.questionsAttempted = 0;
    playState.questionsCorrect = 0;
    
    if (mode === 'speed') {
        playState.currentLevel = 0; // Not level based
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

function generateChallenge(mode, level) {
    if (mode === 'speed') {
        const r = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 8) + 2;
        return { type: 'standard', rows: r, cols: c, text: `Quick! Make ${r} rows of ${c}!` };
    }
    
    if (mode === 'beginner') {
        let maxFact = 3;
        if (level > 5) maxFact = 4;
        if (level > 10) maxFact = 5;
        
        const r = Math.floor(Math.random() * maxFact) + 1;
        const c = Math.floor(Math.random() * maxFact) + 1;
        
        if (level > 10 && Math.random() > 0.5) {
            return { type: 'missing_col', rows: r, cols: c, text: `We need ${r*c} dots total in ${r} rows. How many in each row?` };
        }
        return { type: 'standard', rows: r, cols: c, text: `Make ${r} rows of ${c}!` };
    }
    
    if (mode === 'intermediate') {
        let maxFact = 5;
        if (level > 5) maxFact = 7;
        if (level > 10) maxFact = 8;
        
        const r = Math.floor(Math.random() * (maxFact - 1)) + 2;
        const c = Math.floor(Math.random() * (maxFact - 1)) + 2;
        
        if (level > 5 && Math.random() > 0.5) {
            return { type: 'missing_col', rows: r, cols: c, text: `Missing factor! ${r} × ? = ${r*c}` };
        }
        
        if (level > 10 && Math.random() > 0.5) {
            return { type: 'boss', targetDots: r*c, text: `Complete the rangoli! We need exactly ${r*c} dots total.` };
        }
        return { type: 'standard', rows: r, cols: c, text: `Make ${r} rows of ${c}!` };
    }
    
    if (mode === 'advanced') {
        let maxFact = 6;
        if (level > 5) maxFact = 8;
        if (level > 10) maxFact = 10;
        
        const r = Math.floor(Math.random() * (maxFact - 1)) + 2;
        const c = Math.floor(Math.random() * (maxFact - 1)) + 2;
        
        if (level > 8 && Math.random() > 0.4) {
            const totals = [12, 16, 18, 20, 24, 30, 36, 40, 42, 48, 54, 60, 64, 72, 80, 81, 100];
            const target = totals[Math.floor(Math.random() * totals.length)];
            return { type: 'boss', targetDots: target, text: `Boss Challenge! Create ANY rectangular array with exactly ${target} dots.` };
        }
        
        if (level > 3 && Math.random() > 0.5) {
            return { type: 'missing_col', rows: r, cols: c, text: `Missing Factor! ${r} × ? = ${r*c}` };
        }
        
        return { type: 'standard', rows: r, cols: c, text: `Make ${r} rows of ${c}!` };
    }
}

function loadChallenge() {
    playState.questionsAttempted++;
    
    if (playState.mode === 'speed') {
        document.getElementById('current-challenge-num').textContent = playState.questionsAttempted;
    } else {
        document.getElementById('current-challenge-num').textContent = playState.currentLevel;
        
        // Update top bar buttons visual state
        document.getElementById('btn-prev-level').style.opacity = playState.currentLevel > 1 ? 1 : 0.5;
        document.getElementById('btn-next-level-top').style.opacity = (playState.currentLevel < gameState.progress[playState.mode] && playState.currentLevel < 15) ? 1 : 0.5;
    }
    
    playState.currentChallenge = generateChallenge(playState.mode, playState.currentLevel);
    let ch = playState.currentChallenge;
    
    document.getElementById('challenge-instruction').textContent = ch.text;
    
    if (ch.type === 'boss') {
        document.getElementById('challenge-equation').textContent = `? × ? = ${ch.targetDots}`;
    } else if (ch.type === 'missing_col') {
        document.getElementById('challenge-equation').textContent = `${ch.rows} × ? = ${ch.rows * ch.cols}`;
    } else {
        document.getElementById('challenge-equation').textContent = `${ch.rows} × ${ch.cols} = ?`;
    }

    // Default UI
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
    if (ch.type === 'boss') {
        document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ?`;
    } else if (ch.type === 'missing_col') {
        document.getElementById('challenge-equation').textContent = `${ch.rows} × ${playState.cols} = ?`;
    } else {
        document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ?`;
    }
    
    renderPlayGrid();
}

function renderPlayGrid() {
    const grid = document.getElementById('play-grid');
    grid.style.gridTemplateColumns = `repeat(${playState.cols}, 40px)`;
    grid.innerHTML = '';
    
    let coloredCount = 0;
    
    for (let i = 0; i < playState.rows * playState.cols; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        
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
    
    document.getElementById('colored-count').textContent = coloredCount;
}

function checkAnswer() {
    if (playState.isChallengeComplete) return;
    
    const ch = playState.currentChallenge;
    const coloredCount = playState.gridState.filter(c => c !== null).length;
    
    const feedback = document.getElementById('challenge-feedback');
    feedback.classList.remove('hidden', 'success', 'error');
    
    if (ch.type === 'boss') {
        if (playState.rows * playState.cols !== ch.targetDots) {
            feedback.textContent = `You need ${ch.targetDots} dots total. Your grid makes ${playState.rows * playState.cols}.`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        if (coloredCount !== ch.targetDots) {
            feedback.textContent = `Fill all ${ch.targetDots} dots!`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        document.getElementById('challenge-equation').textContent = `${playState.rows} × ${playState.cols} = ${ch.targetDots}`;
    } else {
        // Standard and missing_col
        if (playState.rows !== ch.rows || playState.cols !== ch.cols) {
            feedback.textContent = `Almost there! You need ${ch.rows} rows and ${ch.cols} columns.`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        
        const targetDots = ch.rows * ch.cols;
        if (coloredCount !== targetDots) {
            feedback.textContent = `Check your dots! You must colour exactly ${targetDots} dots.`;
            feedback.classList.add('error');
            playSound('click');
            return;
        }
        document.getElementById('challenge-equation').textContent = `${ch.rows} × ${ch.cols} = ${targetDots}`;
    }
    
    // Success!
    playState.isChallengeComplete = true;
    feedback.textContent = `Correct! ${playState.rows} × ${playState.cols} = ${playState.rows * playState.cols}`;
    feedback.classList.add('success');
    
    document.getElementById('btn-check').classList.add('hidden');
    
    playSound('success');
    speakPraise();
    
    if (playState.mode === 'speed') {
        playState.questionsCorrect++;
        document.getElementById('btn-next').classList.remove('hidden');
    } else {
        // Level Complete for regular modes
        // Unlock next level and award star only if playing highest available level
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
        }, 1500); // 1.5s delay to hear praise and see result
    }
}

function nextSpeedChallenge() {
    loadChallenge();
}

function showHint() {
    const ch = playState.currentChallenge;
    let text = "";
    if (ch.type === 'boss') {
        text = `Think of two numbers that multiply to make ${ch.targetDots}. Set your rows to one and columns to the other!`;
    } else if (ch.type === 'missing_col') {
        text = `You have ${ch.rows} rows. What number multiplied by ${ch.rows} gives ${ch.rows * ch.cols}? That's your column count!`;
    } else {
        text = `Try making ${ch.rows} equal rows. Put ${ch.cols} dots in every row.`;
    }
    document.getElementById('hint-text').textContent = text;
    showModal('hint-modal');
}

function hideFeedback() {
    document.getElementById('challenge-feedback').classList.add('hidden');
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#d6226b', '#009688', '#ffb300', '#7b1fa2', '#f4511e'];
    
    for (let i = 0; i < 60; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        container.appendChild(conf);
    }
}

function showLevelComplete() {
    showScreen('results-screen');
    createConfetti();
    playSound('celebration');
    
    const isModeComplete = playState.currentLevel === 15;
    
    document.getElementById('results-title').textContent = isModeComplete ? "Mode Complete!" : "Level Complete!";
    document.getElementById('results-mode').textContent = playState.mode.toUpperCase() + " - LEVEL " + playState.currentLevel;
    document.getElementById('results-message').textContent = isModeComplete ? "You are a Rangoli Champion!" : "Beautiful work!";
    
    // Hide speed stats
    document.querySelectorAll('.stats-card').forEach(el => {
        if(el.querySelector('h4')) el.style.display = 'none';
    });
    
    document.getElementById('results-stars').textContent = gameState.totalStars;
    
    document.getElementById('btn-next-level').classList.remove('hidden');
    document.getElementById('btn-play-again').classList.remove('hidden');
    
    if (isModeComplete) {
        document.getElementById('btn-next-level').classList.add('hidden');
    }
}

function showSpeedResults() {
    endSpeedChallenge();
    showScreen('results-screen');
    document.getElementById('confetti-container').innerHTML = ''; // no confetti
    
    document.getElementById('results-title').textContent = "Session Complete!";
    document.getElementById('results-mode').textContent = "SPEED CHALLENGE";
    document.getElementById('results-message').textContent = "Time's Up!";
    
    // Show speed stats
    document.querySelectorAll('.stats-card').forEach(el => {
        if(el.querySelector('h4')) el.style.display = 'block';
    });
    
    document.getElementById('results-attempted').textContent = playState.questionsAttempted;
    document.getElementById('results-correct').textContent = playState.questionsCorrect;
    
    let acc = 0;
    if (playState.questionsAttempted > 0) {
        acc = Math.round((playState.questionsCorrect / playState.questionsAttempted) * 100);
    }
    document.getElementById('results-accuracy').textContent = acc + "%";
    
    // speed challenge doesn't award global stars, but shows how many answered right
    document.getElementById('results-stars').textContent = playState.questionsCorrect;
    
    document.getElementById('btn-next-level').classList.add('hidden');
    document.getElementById('btn-play-again').classList.remove('hidden');
}

// --- FREE RANGOLI CREATOR LOGIC ---

function startCreator() {
    initCreatorGrid();
}

function initCreatorGrid() {
    creatorState.gridState = new Array(creatorState.rows * creatorState.cols).fill(null);
    renderCreatorGrid();
}

function renderCreatorGrid() {
    const grid = document.getElementById('creator-grid');
    grid.style.gridTemplateColumns = `repeat(${creatorState.cols}, 40px)`;
    grid.innerHTML = '';
    
    let coloredCount = 0;
    
    for (let i = 0; i < creatorState.rows * creatorState.cols; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        
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
    
    document.getElementById('creator-dim-text').textContent = `${creatorState.rows} × ${creatorState.cols}`;
    document.getElementById('creator-count').textContent = coloredCount;
    
    const eq = document.getElementById('creator-equation');
    const totalDots = creatorState.rows * creatorState.cols;
    if (coloredCount === totalDots) {
        eq.textContent = `Complete Array! ${creatorState.rows} × ${creatorState.cols} = ${totalDots}`;
        eq.style.color = 'var(--color-primary)';
    } else {
        eq.textContent = "Creative arrangement! Not a full array.";
        eq.style.color = 'var(--color-text-light)';
    }
}

// Start up
document.addEventListener('DOMContentLoaded', initApp);
