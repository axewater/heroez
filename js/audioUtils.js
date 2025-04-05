const AUDIO_BASE_PATH = 'audio/heroes/';
let currentAudio = null; // Keep track of the currently playing audio

/**
 * Plays an audio file from the specified path.
 * @param {string} fileName - The name of the audio file (e.g., 't1000.mp3', 'versus.mp3').
 * @returns {Promise<void>} A promise that resolves when the audio finishes playing or rejects on error.
 */
export function playAudio(fileName) {
    return new Promise((resolve, reject) => {
        // Stop any currently playing announcement audio to prevent overlap
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0; // Reset playback position
            currentAudio = null;
        }

        const audioPath = `${AUDIO_BASE_PATH}${fileName}`;
        console.log(`Attempting to play audio: ${audioPath}`);
        const audio = new Audio(audioPath);
        currentAudio = audio; // Track this audio instance

        audio.addEventListener('ended', () => {
            console.log(`Audio finished: ${fileName}`);
            currentAudio = null; // Clear tracker
            resolve();
        });

        audio.addEventListener('error', (e) => {
            console.error(`Error playing audio ${fileName}:`, e);
            currentAudio = null; // Clear tracker
            reject(e);
        });

        audio.play().catch(error => {
            // Handle browsers blocking autoplay without user interaction
            console.error(`Autoplay failed for ${fileName}:`, error);
            // We might resolve here to continue the sequence, or reject
            // For the announcement, let's resolve to not block the game start
            currentAudio = null; // Clear tracker
            resolve(); // Resolve even if autoplay fails
        });
    });
}

/**
 * Stops any currently playing announcement audio.
 */
export function stopCurrentAudio() {
    if (currentAudio) {
        console.log("Stopping current announcement audio.");
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

// Optional: Preload audio files if needed
// export function preloadAudio(fileNames) {
//     fileNames.forEach(fileName => {
//         const audio = new Audio(`${AUDIO_BASE_PATH}${fileName}`);
//         audio.preload = 'auto';
//         // You might store these preloaded audio objects if beneficial
//     });
// }
