/* ========================================
   ZenFlow - Interactive Application
   ======================================== */

// ========================================
// Initialize App
// ========================================
// Wait for window load since we're using defer on scripts
window.addEventListener('load', () => {
    // Initialize Lucide icons (check if available)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize all modules
    createParticles();
    AudioManager.init(); // Initialize audio system
    initSoundMixer();
    initTimer();
    initStats();
    initAchievements();
    initNavigation();
    initCTAButtons();
    initNotificationSettings(); // Initialize notification sound settings
    initMobileBottomNav(); // Initialize mobile bottom navigation

    // Add gradient definition for timer SVG
    addTimerGradient();

    // Request notification permission on first interaction
    document.body.addEventListener('click', requestNotificationPermission, { once: true });

    console.log('🧘 ZenFlow initialized');
});

// ========================================
// Particle Background
// ========================================
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

// ========================================
// Timer Gradient SVG
// ========================================
function addTimerGradient() {
    const svg = document.querySelector('.timer-svg');
    if (!svg) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'timerGradient');
    gradient.setAttribute('gradientTransform', 'rotate(90)');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#667eea');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('stop-color', '#764ba2');

    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', '#f093fb');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
}

// ========================================
// Audio Manager with Howler.js (Local Files)
// ========================================
const AudioManager = {
    sounds: {},
    notificationSound: null,

    // Local audio file paths (MP3 format for faster loading)
    soundSources: {
        rain: './audio/rain.mp3',
        thunder: './audio/thunder.mp3',
        forest: './audio/forest.mp3',
        birds: './audio/birds.mp3',
        ocean: './audio/ocean.mp3',
        fire: './audio/fire.mp3',
        cafe: './audio/cafe.mp3',
        wind: './audio/wind.mp3'
    },

    // Initialize all sounds with Howler.js
    init() {
        console.log('🎵 Initializing AudioManager with local audio files...');

        // Create Howl instances for each ambient sound
        Object.keys(this.soundSources).forEach(soundName => {
            this.sounds[soundName] = {
                howl: new Howl({
                    src: [this.soundSources[soundName]],
                    loop: true,
                    volume: 0,
                    preload: true,
                    onplay: () => console.log(`🎧 Playing: ${soundName}`),
                    onload: () => console.log(`✅ Loaded: ${soundName}`),
                    onloaderror: (id, error) => console.error(`❌ Failed to load ${soundName}:`, error)
                }),
                volume: 0,
                isPlaying: false
            };
        });

        console.log('✅ AudioManager initialized with', Object.keys(this.sounds).length, 'local audio files');
    },

    // Play or update volume for a sound
    play(soundName, volume) {
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }

        const normalizedVolume = volume / 100; // Convert 0-100 to 0-1
        sound.volume = normalizedVolume;
        sound.howl.volume(normalizedVolume);

        if (!sound.isPlaying && normalizedVolume > 0) {
            sound.howl.play();
            sound.isPlaying = true;
        }
    },

    // Stop a specific sound
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound && sound.isPlaying) {
            sound.howl.stop();
            sound.isPlaying = false;
            sound.volume = 0;
            console.log(`⏹️ Stopped: ${soundName}`);
        }
    },

    // Set volume for a sound (0-100)
    setVolume(soundName, volume) {
        const sound = this.sounds[soundName];
        if (!sound) return;

        const normalizedVolume = volume / 100;
        sound.volume = normalizedVolume;
        sound.howl.volume(normalizedVolume);

        if (normalizedVolume > 0 && !sound.isPlaying) {
            sound.howl.play();
            sound.isPlaying = true;
        } else if (normalizedVolume === 0 && sound.isPlaying) {
            sound.howl.stop();
            sound.isPlaying = false;
        }
    },

    // Stop all sounds
    stopAll() {
        Object.keys(this.sounds).forEach(soundName => {
            this.stop(soundName);
        });
        console.log('⏹️ All sounds stopped');
    },

    // Notification sound options
    notificationSounds: {
        beep: { freq: 880, type: 'sine', duration: 0.5 },
        chime: { freq: [523, 659, 784], type: 'sine', duration: 0.3 },
        bell: { freq: 1200, type: 'triangle', duration: 0.8 },
        success: { freq: [440, 550, 660, 880], type: 'sine', duration: 0.2 },
        gentle: { freq: 440, type: 'sine', duration: 1.0 }
    },

    // Current selected notification sound
    currentNotificationSound: localStorage.getItem('zenflow_notification_sound') || 'chime',

    // Set notification sound preference
    setNotificationSound(soundName) {
        if (this.notificationSounds[soundName]) {
            this.currentNotificationSound = soundName;
            localStorage.setItem('zenflow_notification_sound', soundName);
            console.log(`🔔 Notification sound set to: ${soundName}`);
        }
    },

    // Play notification sound with selected option
    playNotification(soundName = null) {
        const sound = this.notificationSounds[soundName || this.currentNotificationSound];
        if (!sound) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gain = audioContext.createGain();
            gain.connect(audioContext.destination);

            // Handle multiple frequencies (for chime/success sounds)
            const frequencies = Array.isArray(sound.freq) ? sound.freq : [sound.freq];

            frequencies.forEach((freq, index) => {
                const osc = audioContext.createOscillator();
                const oscGain = audioContext.createGain();

                osc.frequency.value = freq;
                osc.type = sound.type;

                const startTime = audioContext.currentTime + (index * sound.duration * 0.8);
                const endTime = startTime + sound.duration;

                oscGain.gain.setValueAtTime(0.4, startTime);
                oscGain.gain.exponentialRampToValueAtTime(0.01, endTime);

                osc.connect(oscGain);
                oscGain.connect(gain);

                osc.start(startTime);
                osc.stop(endTime);
            });

            console.log('🔔 Notification sound played:', soundName || this.currentNotificationSound);
        } catch (e) {
            console.warn('Could not play notification:', e);
        }
    },

    // Preview notification sound (for settings)
    previewNotificationSound(soundName) {
        this.playNotification(soundName);
    },

    // Get current playing sounds
    getActiveSounds() {
        const active = {};
        Object.keys(this.sounds).forEach(soundName => {
            if (this.sounds[soundName].isPlaying) {
                active[soundName] = this.sounds[soundName].volume * 100;
            }
        });
        return active;
    }
};


// ========================================
// Sound Mixer Module (UI Handler)
// ========================================
const soundMixer = {
    sounds: {},
    presets: {
        focus: { rain: 40, fire: 30 },
        relax: { ocean: 50, wind: 20 },
        nature: { forest: 50, birds: 40, wind: 20 },
        urban: { cafe: 60, rain: 20 }
    }
};

function initSoundMixer() {
    const soundCards = document.querySelectorAll('.sound-card');
    const presetBtns = document.querySelectorAll('.preset-btn');

    // Initialize sound cards
    soundCards.forEach(card => {
        const soundName = card.dataset.sound;
        const slider = card.querySelector('.volume-slider');
        const valueDisplay = card.querySelector('.volume-value');
        const toggleBtn = card.querySelector('.sound-toggle');

        // Volume slider - controls actual audio playback
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            valueDisplay.textContent = `${value}%`;

            // Update AudioManager with new volume
            AudioManager.setVolume(soundName, value);

            if (value > 0) {
                card.classList.add('active');
                toggleBtn.innerHTML = '<i data-lucide="pause"></i>';
                soundMixer.sounds[soundName] = value;
            } else {
                card.classList.remove('active');
                toggleBtn.innerHTML = '<i data-lucide="play"></i>';
                delete soundMixer.sounds[soundName];
            }
            lucide.createIcons();
        });

        // Toggle button - starts/stops audio
        toggleBtn.addEventListener('click', () => {
            const isActive = card.classList.contains('active');

            if (isActive) {
                // Stop sound
                slider.value = 0;
                valueDisplay.textContent = '0%';
                card.classList.remove('active');
                toggleBtn.innerHTML = '<i data-lucide="play"></i>';
                delete soundMixer.sounds[soundName];
                AudioManager.stop(soundName);
            } else {
                // Play sound at 50% volume
                slider.value = 50;
                valueDisplay.textContent = '50%';
                card.classList.add('active');
                toggleBtn.innerHTML = '<i data-lucide="pause"></i>';
                soundMixer.sounds[soundName] = 50;
                AudioManager.play(soundName, 50);
                showToast('🎧 Sound Playing', `${soundName.charAt(0).toUpperCase() + soundName.slice(1)} added to your mix`, 'headphones');
            }
            lucide.createIcons();
        });
    });

    // Preset buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply preset
            const presetName = btn.dataset.preset;
            const preset = soundMixer.presets[presetName];

            // Reset all sounds
            soundCards.forEach(card => {
                const soundName = card.dataset.sound;
                const slider = card.querySelector('.volume-slider');
                const valueDisplay = card.querySelector('.volume-value');
                const toggleBtn = card.querySelector('.sound-toggle');

                if (preset[soundName]) {
                    slider.value = preset[soundName];
                    valueDisplay.textContent = `${preset[soundName]}%`;
                    card.classList.add('active');
                    toggleBtn.innerHTML = '<i data-lucide="pause"></i>';
                    soundMixer.sounds[soundName] = preset[soundName];
                    AudioManager.play(soundName, preset[soundName]); // Play with preset volume
                } else {
                    slider.value = 0;
                    valueDisplay.textContent = '0%';
                    card.classList.remove('active');
                    toggleBtn.innerHTML = '<i data-lucide="play"></i>';
                    delete soundMixer.sounds[soundName];
                    AudioManager.stop(soundName); // Stop sound
                }
            });

            lucide.createIcons();
            showToast('Preset Applied', `${presetName.charAt(0).toUpperCase() + presetName.slice(1)} soundscape loaded`, 'music');
        });
    });
}

// ========================================
// Timer Module
// ========================================
const timer = {
    minutes: 25,
    seconds: 0,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    isRunning: false,
    interval: null,
    label: 'Focus Session'
};

function initTimer() {
    const startBtn = document.getElementById('timerStart');
    const pauseBtn = document.getElementById('timerPause');
    const resetBtn = document.getElementById('timerReset');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const display = document.getElementById('timerDisplay');
    const label = document.getElementById('timerLabel');
    const progress = document.getElementById('timerProgress');

    // Start button
    startBtn.addEventListener('click', () => {
        timer.isRunning = true;
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';

        timer.interval = setInterval(() => {
            if (timer.remainingSeconds > 0) {
                timer.remainingSeconds--;
                updateTimerDisplay();
            } else {
                completeSession();
            }
        }, 1000);
    });

    // Pause button
    pauseBtn.addEventListener('click', () => {
        timer.isRunning = false;
        clearInterval(timer.interval);
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'flex';
        startBtn.innerHTML = '<i data-lucide="play"></i> Resume';
        lucide.createIcons();
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
        clearInterval(timer.interval);
        timer.isRunning = false;
        timer.remainingSeconds = timer.totalSeconds;
        updateTimerDisplay();
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'flex';
        startBtn.innerHTML = '<i data-lucide="play"></i> Start';
        lucide.createIcons();
    });

    // Mode buttons
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Skip custom button, handled separately
            if (btn.id === 'customTimerBtn') return;

            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const minutes = parseInt(btn.dataset.minutes);
            timer.minutes = minutes;
            timer.totalSeconds = minutes * 60;
            timer.remainingSeconds = minutes * 60;
            timer.label = btn.dataset.label;

            label.textContent = timer.label;
            updateTimerDisplay();

            // Hide custom input
            const customInput = document.getElementById('customTimerInput');
            if (customInput) customInput.style.display = 'none';

            // Reset buttons
            clearInterval(timer.interval);
            timer.isRunning = false;
            pauseBtn.style.display = 'none';
            startBtn.style.display = 'flex';
            startBtn.innerHTML = '<i data-lucide="play"></i> Start';
            lucide.createIcons();
        });
    });

    // Custom timer button - toggle input visibility
    const customTimerBtn = document.getElementById('customTimerBtn');
    const customTimerInput = document.getElementById('customTimerInput');
    const setCustomBtn = document.getElementById('setCustomTimer');
    const customMinutesInput = document.getElementById('customMinutes');
    const customSecondsInput = document.getElementById('customSeconds');

    if (customTimerBtn && customTimerInput) {
        customTimerBtn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            customTimerBtn.classList.add('active');

            // Toggle custom input visibility
            const isVisible = customTimerInput.style.display !== 'none';
            customTimerInput.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                customMinutesInput.focus();
            }
        });
    }

    // Set custom timer button
    if (setCustomBtn) {
        setCustomBtn.addEventListener('click', () => {
            const mins = parseInt(customMinutesInput.value) || 0;
            const secs = parseInt(customSecondsInput.value) || 0;
            const totalSeconds = (mins * 60) + secs;

            if (totalSeconds < 1) {
                showToast('Invalid Time', 'Please set at least 1 second', 'alert-circle');
                return;
            }

            timer.minutes = mins;
            timer.seconds = secs;
            timer.totalSeconds = totalSeconds;
            timer.remainingSeconds = totalSeconds;
            timer.label = 'Custom Timer';

            label.textContent = timer.label;
            updateTimerDisplay();

            // Reset buttons
            clearInterval(timer.interval);
            timer.isRunning = false;
            pauseBtn.style.display = 'none';
            startBtn.style.display = 'flex';
            startBtn.innerHTML = '<i data-lucide="play"></i> Start';
            lucide.createIcons();

            showToast('Timer Set', `Custom timer: ${mins}m ${secs}s`, 'clock');
        });
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timer.remainingSeconds / 60);
        const secs = timer.remainingSeconds % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Update progress ring
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - timer.remainingSeconds / timer.totalSeconds);
        progress.style.strokeDashoffset = offset;
    }

    function completeSession() {
        clearInterval(timer.interval);
        timer.isRunning = false;

        // Award XP
        const xpEarned = timer.label === 'Focus Session' ? 25 : 5;
        addXP(xpEarned);
        incrementSessions();

        // Reset
        timer.remainingSeconds = timer.totalSeconds;
        updateTimerDisplay();
        pauseBtn.style.display = 'none';
        startBtn.style.display = 'flex';
        startBtn.innerHTML = '<i data-lucide="play"></i> Start';
        lucide.createIcons();

        // Play notification sound
        AudioManager.playNotification();

        // Show browser notification
        showBrowserNotification(timer.label, xpEarned);

        showToast('Session Complete! 🎉', `You earned ${xpEarned} XP`, 'trophy');

        // Check for achievements
        checkAchievements();
    }
}

// ========================================
// Browser Notification
// ========================================
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
        });
    }
}

function showBrowserNotification(sessionType, xpEarned) {
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return;
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification('ZenFlow - Session Complete! 🎉', {
            body: `${sessionType} finished! You earned ${xpEarned} XP.`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧘</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✅</text></svg>',
            tag: 'zenflow-timer',
            requireInteraction: false
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    } else if (Notification.permission === 'default') {
        // Request permission for next time
        requestNotificationPermission();
    }
}

// ========================================
// Notification Settings
// ========================================
function initNotificationSettings() {
    const soundBtns = document.querySelectorAll('.notification-sound-btn');
    const enableBtn = document.getElementById('enableNotifications');

    // Restore saved sound preference
    const savedSound = localStorage.getItem('zenflow_notification_sound') || 'chime';
    soundBtns.forEach(btn => {
        if (btn.dataset.sound === savedSound) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Sound button clicks - preview and save
    soundBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const soundName = btn.dataset.sound;

            // Update active state
            soundBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Save preference and preview
            AudioManager.setNotificationSound(soundName);
            AudioManager.previewNotificationSound(soundName);

            showToast('Sound Updated', `Notification sound set to ${soundName}`, 'bell');
        });
    });

    // Enable desktop notifications button
    if (enableBtn) {
        // Update button text based on current permission
        function updateNotificationButton() {
            if (Notification.permission === 'granted') {
                enableBtn.innerHTML = '<i data-lucide="check-circle"></i> Desktop Notifications Enabled';
                enableBtn.style.color = 'var(--zen-accent)';
                lucide.createIcons();
            } else if (Notification.permission === 'denied') {
                enableBtn.innerHTML = '<i data-lucide="x-circle"></i> Notifications Blocked';
                enableBtn.style.color = 'var(--zen-danger)';
                lucide.createIcons();
            }
        }

        updateNotificationButton();

        enableBtn.addEventListener('click', () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    updateNotificationButton();
                    if (permission === 'granted') {
                        showToast('Notifications Enabled', 'You will receive desktop notifications', 'bell');
                        // Show a test notification
                        new Notification('ZenFlow Notifications', {
                            body: 'You will now receive notifications when sessions complete!',
                            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧘</text></svg>'
                        });
                    }
                });
            } else if (Notification.permission === 'granted') {
                showToast('Already Enabled', 'Desktop notifications are active', 'check-circle');
            } else {
                showToast('Blocked', 'Enable notifications in browser settings', 'alert-circle');
            }
        });
    }
}

// ========================================
// Stats Module
// ========================================
const stats = {
    totalXP: 0,
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    bestStreak: 0,
    weekSessions: 0,
    todaySessions: 0,
    level: 1,
    lastSessionDate: null,
    // Daily sessions for the week (keyed by date string)
    dailySessions: {}
};

function initStats() {
    // Load from localStorage
    const saved = localStorage.getItem('zenflow_stats');
    if (saved) {
        Object.assign(stats, JSON.parse(saved));
    }

    updateStatsDisplay();
}

function saveStats() {
    localStorage.setItem('zenflow_stats', JSON.stringify(stats));
}

function addXP(amount) {
    stats.totalXP += amount;

    // Check for level up
    const newLevel = calculateLevel(stats.totalXP);
    if (newLevel > stats.level) {
        stats.level = newLevel;
        showToast('Level Up! 🚀', `You reached Level ${stats.level}!`, 'star');
    }

    saveStats();
    updateStatsDisplay();
}

function calculateLevel(xp) {
    // XP required: Level 1 = 0, Level 2 = 100, Level 3 = 250, etc.
    const levels = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000];
    for (let i = levels.length - 1; i >= 0; i--) {
        if (xp >= levels[i]) {
            return i + 1;
        }
    }
    return 1;
}

function getLevelName(level) {
    const names = [
        'Novice', 'Apprentice', 'Practitioner', 'Journeyman', 'Expert',
        'Master', 'Grandmaster', 'Sage', 'Enlightened', 'Zen Master'
    ];
    return names[Math.min(level - 1, names.length - 1)];
}

function incrementSessions() {
    stats.totalSessions++;
    stats.totalMinutes += 25;

    // Get today's date key (YYYY-MM-DD format)
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const todayString = today.toDateString();

    // Track daily sessions
    if (!stats.dailySessions[todayKey]) {
        stats.dailySessions[todayKey] = 0;
    }
    stats.dailySessions[todayKey]++;
    stats.todaySessions = stats.dailySessions[todayKey];

    // Recalculate week sessions from dailySessions
    stats.weekSessions = calculateWeekSessions();

    // Update streak
    if (stats.lastSessionDate !== todayString) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (stats.lastSessionDate === yesterday.toDateString()) {
            stats.currentStreak++;
        } else if (stats.lastSessionDate !== todayString) {
            stats.currentStreak = 1;
        }

        stats.lastSessionDate = todayString;

        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }
    }

    // Clean up old daily data (keep only last 14 days)
    cleanupOldDailySessions();

    saveStats();
    updateStatsDisplay();
}

// Calculate sessions for this week (Monday to Sunday)
function calculateWeekSessions() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    let total = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        const dateKey = date.toISOString().split('T')[0];
        total += stats.dailySessions[dateKey] || 0;
    }
    return total;
}

// Remove daily session data older than 14 days
function cleanupOldDailySessions() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffKey = cutoff.toISOString().split('T')[0];

    Object.keys(stats.dailySessions).forEach(key => {
        if (key < cutoffKey) {
            delete stats.dailySessions[key];
        }
    });
}

function updateStatsDisplay() {
    const totalXPEl = document.getElementById('totalXP');
    const xpProgressEl = document.getElementById('xpProgress');
    const currentLevelEl = document.getElementById('currentLevel');
    const xpToNextEl = document.getElementById('xpToNext');
    const totalFocusTimeEl = document.getElementById('totalFocusTime');
    const totalSessionsEl = document.getElementById('totalSessions');
    const bestStreakEl = document.getElementById('bestStreak');
    const weekSessionsEl = document.getElementById('weekSessions');
    const todaySessionsEl = document.getElementById('todaySessions');
    const currentStreakEl = document.getElementById('currentStreak');

    if (totalXPEl) totalXPEl.textContent = stats.totalXP.toLocaleString();

    // Calculate XP progress
    const levels = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000];
    const currentLevelXP = levels[stats.level - 1] || 0;
    const nextLevelXP = levels[stats.level] || levels[levels.length - 1];
    const progressXP = stats.totalXP - currentLevelXP;
    const totalNeeded = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min((progressXP / totalNeeded) * 100, 100);

    if (xpProgressEl) xpProgressEl.style.width = `${progressPercent}%`;
    if (currentLevelEl) currentLevelEl.textContent = `Level ${stats.level}: ${getLevelName(stats.level)}`;
    if (xpToNextEl) xpToNextEl.textContent = `${progressXP} / ${totalNeeded} XP`;

    // Time
    const hours = Math.floor(stats.totalMinutes / 60);
    const mins = stats.totalMinutes % 60;
    if (totalFocusTimeEl) totalFocusTimeEl.textContent = `${hours}h ${mins}m`;

    // Other stats
    if (totalSessionsEl) totalSessionsEl.textContent = stats.totalSessions;
    if (bestStreakEl) bestStreakEl.textContent = `${stats.bestStreak} days`;
    if (weekSessionsEl) weekSessionsEl.textContent = `${stats.weekSessions} sessions`;
    if (todaySessionsEl) todaySessionsEl.textContent = stats.todaySessions;
    if (currentStreakEl) currentStreakEl.textContent = stats.currentStreak;

    // Update weekly chart
    updateWeeklyChart();
}

// Update weekly chart dynamically
function updateWeeklyChart() {
    const chartContainer = document.getElementById('weeklyChart');
    if (!chartContainer) return;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    // Get sessions for each day of the week
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData.push({
            day: dayNames[i],
            sessions: stats.dailySessions[dateKey] || 0,
            isToday: date.toDateString() === today.toDateString()
        });
    }

    // Find max for percentage calculation
    const maxSessions = Math.max(...dailyData.map(d => d.sessions), 1);

    // Update chart bars
    chartContainer.innerHTML = dailyData.map(data => {
        const heightPercent = (data.sessions / maxSessions) * 100;
        const todayClass = data.isToday ? ' today' : '';
        const sessionText = data.sessions > 0 ? data.sessions : '';

        return `
            <div class="chart-bar${todayClass}" data-day="${data.day}" data-sessions="${data.sessions}">
                <div class="bar-fill" style="height: ${heightPercent}%">
                    <span class="bar-value">${sessionText}</span>
                </div>
                <span>${data.day}</span>
            </div>
        `;
    }).join('');
}

// ========================================
// Achievements Module
// ========================================
const achievements = {
    unlocked: []
};

const achievementList = [
    { id: 'first-session', name: 'First Steps', condition: () => stats.totalSessions >= 1, xp: 10 },
    { id: 'streak-3', name: 'On Fire', condition: () => stats.currentStreak >= 3, xp: 25 },
    { id: 'streak-7', name: 'Week Warrior', condition: () => stats.currentStreak >= 7, xp: 50 },
    { id: 'sessions-10', name: 'Dedicated', condition: () => stats.totalSessions >= 10, xp: 30 },
    { id: 'sessions-50', name: 'Focus Master', condition: () => stats.totalSessions >= 50, xp: 100 },
    { id: 'night-owl', name: 'Night Owl', condition: () => new Date().getHours() >= 0 && new Date().getHours() < 5, xp: 15 },
    { id: 'early-bird', name: 'Early Bird', condition: () => new Date().getHours() >= 5 && new Date().getHours() < 7, xp: 15 },
    { id: 'zen-master', name: 'Zen Master', condition: () => stats.level >= 10, xp: 200 }
];

function initAchievements() {
    // Load from localStorage
    const saved = localStorage.getItem('zenflow_achievements');
    if (saved) {
        achievements.unlocked = JSON.parse(saved);
    }

    updateAchievementsDisplay();
}

function saveAchievements() {
    localStorage.setItem('zenflow_achievements', JSON.stringify(achievements.unlocked));
}

function checkAchievements() {
    achievementList.forEach(achievement => {
        if (!achievements.unlocked.includes(achievement.id) && achievement.condition()) {
            unlockAchievement(achievement);
        }
    });
}

function unlockAchievement(achievement) {
    achievements.unlocked.push(achievement.id);
    addXP(achievement.xp);
    saveAchievements();
    updateAchievementsDisplay();

    showToast('Achievement Unlocked! 🏆', achievement.name, 'award');
}

function updateAchievementsDisplay() {
    const cards = document.querySelectorAll('.achievement-card');

    cards.forEach(card => {
        const id = card.dataset.achievement;
        if (achievements.unlocked.includes(id)) {
            card.classList.add('unlocked');
        } else {
            card.classList.remove('unlocked');
        }
    });
}

// ========================================
// Navigation
// ========================================
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const mobileStartBtn = document.getElementById('mobileStartBtn');

    // Toggle mobile menu
    function toggleMobileMenu() {
        const isOpen = mobileMenuToggle.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        mobileMenuToggle.setAttribute('aria-expanded', isOpen);
        mobileMenuOverlay.setAttribute('aria-hidden', !isOpen);

        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    // Close mobile menu
    function closeMobileMenu() {
        mobileMenuToggle.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Mobile menu toggle click
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Mobile nav item clicks
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);

            closeMobileMenu();

            // Delay scroll to allow menu close animation
            setTimeout(() => {
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        });
    });

    // Mobile Start Focus button
    if (mobileStartBtn) {
        mobileStartBtn.addEventListener('click', () => {
            closeMobileMenu();
            setTimeout(() => {
                document.getElementById('sounds').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        });
    }

    // Desktop nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 26, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 26, 0.8)';
        }
    });
}

// ========================================
// CTA Buttons
// ========================================
function initCTAButtons() {
    const startBtns = [
        document.getElementById('startBtn'),
        document.getElementById('heroStartBtn'),
        document.getElementById('ctaStartBtn')
    ];

    startBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                document.getElementById('sounds').scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
}

// ========================================
// Toast Notifications
// ========================================
function showToast(title, message, icon = 'bell') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${icon}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Auto remove
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// ========================================
// Mobile Bottom Navigation
// ========================================
function initMobileBottomNav() {
    const bottomNav = document.getElementById('mobileBottomNav');
    if (!bottomNav) return;

    const navItems = bottomNav.querySelectorAll('.bottom-nav-item, .bottom-nav-fab');
    const sections = ['hero', 'sounds', 'timer', 'stats', 'achievements'];

    // Handle nav item clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;
            const target = document.getElementById(sectionId);

            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Update active state based on scroll position
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                navItems.forEach(item => {
                    if (item.dataset.section === sectionId) {
                        navItems.forEach(nav => nav.classList.remove('active'));
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    // Observe all sections
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            observer.observe(section);
        }
    });

    // Re-create icons after adding bottom nav
    lucide.createIcons();
}

// ========================================
// Export for potential future modules
// ========================================
window.ZenFlow = {
    timer,
    stats,
    achievements,
    soundMixer,
    showToast
};
