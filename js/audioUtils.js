import { getState } from './state.js'; // Import getState to access settings

const HERO_AUDIO_PATH = 'audio/heroes/';
const MUSIC_AUDIO_PATH = 'audio/music/';
let currentAnnouncementAudio = null; // Keep track of the currently playing announcement audio
let currentBackgroundMusic = null; // Keep track of the background music Audio object
const MENU_MUSIC_TRACKS = ['menumusictrack01.mp3', 'menumusictrack02.mp3'];
const GAME_MUSIC_TRACKS = ['gamemusictrack01.mp3', 'gamemusictrack02.mp3']; // Added game music tracks
let baseSfxVolume = 0.7; // Store the base SFX volume from settings

/**
 * Plays a hero announcement audio file.
 * @param {string} fileName - The name of the audio file (e.g., 't1000.mp3', 'versus.mp3').
 * @returns {Promise<void>} A promise that resolves when the audio finishes playing or rejects on error.
 */
export function playAudio(fileName) {
    return new Promise((resolve, reject) => {
        const settings = getState().settings;
        if (!settings.sfxEnabled) {
            console.log(`SFX disabled, skipping audio: ${fileName}`);
            resolve(); // Resolve immediately if SFX are off
            return;
        }
        // Stop any currently playing announcement audio to prevent overlap
        if (currentAnnouncementAudio) {
            currentAnnouncementAudio.pause();
            currentAnnouncementAudio.currentTime = 0; // Reset playback position
            currentAnnouncementAudio = null;
        }

        const audioPath = `${HERO_AUDIO_PATH}${fileName}`;
        console.log(`Attempting to play audio: ${audioPath}`);
        const audio = new Audio(audioPath);
        currentAnnouncementAudio = audio; // Track this audio instance
        audio.volume = baseSfxVolume; // Use the stored base SFX volume

        audio.addEventListener('ended', () => {
            console.log(`Audio finished: ${fileName}`);
            currentAnnouncementAudio = null; // Clear tracker
            resolve();
        });

        audio.addEventListener('error', (e) => {
            console.error(`Error playing audio ${fileName}:`, e);
            currentAnnouncementAudio = null; // Clear tracker
            reject(e);
        });

        audio.play().catch(error => {
            // Handle browsers blocking autoplay without user interaction
            console.error(`Autoplay failed for ${fileName}:`, error);
            // We might resolve here to continue the sequence, or reject
            // For the announcement, let's resolve to not block the game start
            currentAnnouncementAudio = null; // Clear tracker
            resolve(); // Resolve even if autoplay fails
        });
    });
}

/**
 * Stops any currently playing announcement audio.
 */
export function stopCurrentAudio() {
    if (currentAnnouncementAudio) {
        console.log("Stopping current announcement audio.");
        currentAnnouncementAudio.pause();
        currentAnnouncementAudio.currentTime = 0;
        currentAnnouncementAudio = null;
    }
}

/**
 * Plays a random menu music track on loop.
 */
export function playMenuMusic() {
    const settings = getState().settings;
    if (!settings.musicEnabled) {
        console.log("Music disabled, skipping menu music.");
        stopBackgroundMusic(); // Ensure any previous music is stopped
        return;
    }

    stopBackgroundMusic(); // Stop any existing music first

    const randomTrack = MENU_MUSIC_TRACKS[Math.floor(Math.random() * MENU_MUSIC_TRACKS.length)];
    const audioPath = `${MUSIC_AUDIO_PATH}${randomTrack}`;
    console.log(`Attempting to play menu music: ${audioPath}`);
    currentBackgroundMusic = new Audio(audioPath);
    currentBackgroundMusic.loop = true; // Enable looping
    // Use volume from settings
    currentBackgroundMusic.volume = settings.musicVolume;

    currentBackgroundMusic.play().then(() => {
        console.log(`Playing menu music: ${randomTrack}`);
    }).catch(error => {
        console.error(`Error playing menu music ${randomTrack}:`, error);
        // Autoplay likely failed, user interaction needed first.
        // The intro screen should handle this.
        currentBackgroundMusic = null;
    });
}

/**
 * Plays a random game music track on loop.
 */
export function playGameMusic() {
    const settings = getState().settings;
    if (!settings.musicEnabled) {
        console.log("Music disabled, skipping game music.");
        stopBackgroundMusic(); // Ensure any previous music is stopped
        return;
    }

    stopBackgroundMusic(); // Stop any existing music first

    if (GAME_MUSIC_TRACKS.length === 0) {
        console.warn("No game music tracks defined.");
        return;
    }

    const randomTrack = GAME_MUSIC_TRACKS[Math.floor(Math.random() * GAME_MUSIC_TRACKS.length)];
    const audioPath = `${MUSIC_AUDIO_PATH}${randomTrack}`;
    console.log(`Attempting to play game music: ${audioPath}`);

    currentBackgroundMusic = new Audio(audioPath);
    currentBackgroundMusic.loop = true; // Enable looping
    // Use volume from settings
    currentBackgroundMusic.volume = settings.musicVolume;

    currentBackgroundMusic.play().then(() => {
        console.log(`Playing game music: ${randomTrack}`);
    }).catch(error => {
        console.error(`Error playing game music ${randomTrack}:`, error);
        currentBackgroundMusic = null;
    });
}

/**
 * Stops the currently playing background music.
 */
export function stopBackgroundMusic() {
    if (currentBackgroundMusic) {
        console.log("Stopping background music.");
        currentBackgroundMusic.pause();
        currentBackgroundMusic.currentTime = 0;
        currentBackgroundMusic.loop = false; // Ensure loop is off before setting to null
        currentBackgroundMusic = null;
    }
}

/**
 * Sets the volume for currently playing background music.
 * @param {number} volume - Volume level from 0.0 to 1.0.
 */
export function setMusicVolume(volume) {
    if (currentBackgroundMusic) {
        currentBackgroundMusic.volume = volume;
        console.log(`Music volume set to: ${volume}`);
    }
}

/**
 * Sets the base volume for future sound effects.
 * @param {number} volume - Volume level from 0.0 to 1.0.
 */
export function setSfxVolume(volume) {
    baseSfxVolume = volume;
    console.log(`Base SFX volume set to: ${volume}`);
}

// Optional: Preload audio files if needed
// export function preloadAudio(fileNames) {
//     fileNames.forEach(fileName => {
//         const audio = new Audio(`${HERO_AUDIO_PATH}${fileName}`);
//         audio.preload = 'auto';
//         // You might store these preloaded audio objects if beneficial
//     });
// }
