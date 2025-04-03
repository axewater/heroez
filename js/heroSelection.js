import { heroData } from './heroes.js';
import { getDOMElement } from './dom.js'; // Import getDOMElement
import { showDeckSelection, initDeckSelection } from './deckSelection.js'; // Import deck selection functions

let heroSelectionScreenEl = null;
let heroOptionsContainerEl = null;
let selectedHero = null;
let isDebugMode = false; // Store debug mode choice

export function initHeroSelection() {
    console.log("Initializing Hero Selection...");
    heroSelectionScreenEl = getDOMElement('heroSelectionScreenEl'); // Use getDOMElement
    heroOptionsContainerEl = getDOMElement('heroOptionsContainerEl'); // Use getDOMElement
    // initDeckSelection(); // No longer needed here, called from main.js

    if (!heroSelectionScreenEl || !heroOptionsContainerEl) {
        console.error("Hero selection elements not found!");
        return;
    }

    populateHeroOptions();
}

function populateHeroOptions() {
    heroOptionsContainerEl.innerHTML = ''; // Clear previous options
    selectedHero = null; // Reset selection

    heroData.forEach(hero => {
        const heroOptionEl = document.createElement('div');
        heroOptionEl.classList.add('hero-option');
        heroOptionEl.dataset.heroId = hero.id;

        heroOptionEl.innerHTML = `
            <div class="hero-portrait">${hero.portrait ? `<img src="${hero.portrait}" alt="${hero.name}">` : hero.name[0]}</div>
            <h3>${hero.name}</h3>
            <p class="hero-description">${hero.description}</p>
            <button class="select-hero-button" disabled>Select</button>
        `;

        // Add click listener to the whole option div for selection feedback
        heroOptionEl.addEventListener('click', () => selectHero(hero, heroOptionEl));

        // Add click listener specifically to the button to confirm selection
        const button = heroOptionEl.querySelector('.select-hero-button');
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the div click from firing again
            confirmHeroSelection();
        });

        heroOptionsContainerEl.appendChild(heroOptionEl);
    });
}

function selectHero(hero, element) {
    console.log(`Selected hero: ${hero.name}`);
    selectedHero = hero;

    // Remove 'selected' class from all options and disable buttons
    heroOptionsContainerEl.querySelectorAll('.hero-option').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.select-hero-button').disabled = true;
    });

    // Add 'selected' class to the clicked option and enable its button
    element.classList.add('selected');
    element.querySelector('.select-hero-button').disabled = false;
}

export function confirmHeroSelection() {
    if (selectedHero) {
        console.log("[HeroSelection] confirmHeroSelection called for:", selectedHero.name);
        console.log(`Confirmed hero selection: ${selectedHero.name}`);
        hideHeroSelection(); // Hide this screen
        showDeckSelection(selectedHero, isDebugMode); // Show deck selection
    } else {
        console.warn("Attempted to confirm hero selection, but none was selected.");
    }
}

export function showHeroSelection(debug = false) {
    if (heroSelectionScreenEl) {
        isDebugMode = debug; // Store the debug mode choice
        populateHeroOptions(); // Repopulate in case it's shown again
        heroSelectionScreenEl.style.display = 'flex';
        heroSelectionScreenEl.style.opacity = '1';
        heroSelectionScreenEl.classList.remove('hidden');
    }
}

export function hideHeroSelection() {
    if (heroSelectionScreenEl) {
        console.log("[HeroSelection] hideHeroSelection called.");
        heroSelectionScreenEl.style.opacity = '0';
        setTimeout(() => {
            heroSelectionScreenEl.style.display = 'none';
            heroSelectionScreenEl.classList.add('hidden');
        }, 500); // Match CSS transition duration
    }
}
