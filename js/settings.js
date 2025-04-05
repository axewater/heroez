// /js/settings.js
import { getState, saveSettings } from './state.js';
import { getDOMElement } from './dom.js';
import { showOpeningMenu } from './menu.js';
import { setMusicVolume, setSfxVolume } from './audioUtils.js'; // Import volume control functions

let settingsScreenEl = null;
let musicToggleEl = null;
let musicVolumeEl = null;
let sfxToggleEl = null;
let sfxVolumeEl = null;
let backButtonEl = null;

export function initSettings() {
    console.log("Initializing Settings screen...");
    settingsScreenEl = getDOMElement('settingsScreenEl');
    musicToggleEl = getDOMElement('musicToggleEl');
    musicVolumeEl = getDOMElement('musicVolumeEl');
    sfxToggleEl = getDOMElement('sfxToggleEl');
    sfxVolumeEl = getDOMElement('sfxVolumeEl');
    backButtonEl = getDOMElement('settingsBackButtonEl');

    if (!settingsScreenEl || !musicToggleEl || !musicVolumeEl || !sfxToggleEl || !sfxVolumeEl || !backButtonEl) {
        console.error("Settings screen elements not found!");
        return;
    }

    // Add event listeners
    musicToggleEl.addEventListener('change', handleMusicToggle);
    musicVolumeEl.addEventListener('input', handleMusicVolumeChange); // 'input' for live update
    sfxToggleEl.addEventListener('change', handleSfxToggle);
    sfxVolumeEl.addEventListener('input', handleSfxVolumeChange);
    backButtonEl.addEventListener('click', hideSettingsScreen);
}

export function showSettingsScreen() {
    if (!settingsScreenEl) {
        console.error("Settings screen not initialized. Cannot show.");
        return;
    }
    console.log("Showing Settings screen");

    // Load current settings into controls
    const settings = getState().settings;
    musicToggleEl.checked = settings.musicEnabled;
    musicVolumeEl.value = settings.musicVolume;
    sfxToggleEl.checked = settings.sfxEnabled;
    sfxVolumeEl.value = settings.sfxVolume;

    // Disable volume slider if toggle is off
    musicVolumeEl.disabled = !settings.musicEnabled;
    sfxVolumeEl.disabled = !settings.sfxEnabled;

    settingsScreenEl.classList.remove('hidden');
    settingsScreenEl.style.display = 'flex'; // Ensure display is correct
    requestAnimationFrame(() => settingsScreenEl.style.opacity = '1'); // Trigger fade-in
}

function hideSettingsScreen() {
    if (settingsScreenEl) {
        settingsScreenEl.style.opacity = '0';
        setTimeout(() => {
            settingsScreenEl.style.display = 'none';
            settingsScreenEl.classList.add('hidden');
        }, 300); // Match CSS transition duration
    }
    // Show the main menu again
    showOpeningMenu();
}

// --- Event Handlers ---

function handleMusicToggle() {
    const settings = getState().settings;
    settings.musicEnabled = musicToggleEl.checked;
    musicVolumeEl.disabled = !settings.musicEnabled;
    console.log("Music Enabled:", settings.musicEnabled);
    // Immediately apply the change (e.g., stop/start music)
    setMusicVolume(settings.musicEnabled ? settings.musicVolume : 0); // Set volume to 0 if disabled
    saveSettings();
}

function handleMusicVolumeChange() {
    const settings = getState().settings;
    settings.musicVolume = parseFloat(musicVolumeEl.value);
    console.log("Music Volume:", settings.musicVolume);
    // Immediately apply the change to currently playing music
    if (settings.musicEnabled) {
        setMusicVolume(settings.musicVolume);
    }
    saveSettings();
}

function handleSfxToggle() {
    const settings = getState().settings;
    settings.sfxEnabled = sfxToggleEl.checked;
    sfxVolumeEl.disabled = !settings.sfxEnabled;
    console.log("SFX Enabled:", settings.sfxEnabled);
    // Apply change (volume control is handled in playAudio)
    setSfxVolume(settings.sfxEnabled ? settings.sfxVolume : 0); // Set base volume for future SFX
    saveSettings();
}

function handleSfxVolumeChange() {
    const settings = getState().settings;
    settings.sfxVolume = parseFloat(sfxVolumeEl.value);
    console.log("SFX Volume:", settings.sfxVolume);
    // Apply change (volume control is handled in playAudio)
    if (settings.sfxEnabled) {
        setSfxVolume(settings.sfxVolume); // Update base volume for future SFX
    }
    saveSettings();
}
