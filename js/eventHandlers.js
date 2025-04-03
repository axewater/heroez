import { getState, getCurrentPlayer, getSelectedCard, setSelectedCard, getSelectedAttacker, setSelectedAttacker, setTargetingMode, getTargetingMode } from './state.js';
import { playCard } from './playerActions.js';
import { creatureAttack } from './combat.js';
import { getTargetFromElement } from './actionUtils.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { renderGame } from './render.js';
import { deselectCard, deselectAttacker } from './uiState.js';
import { setMessage, logMessage } from './messaging.js';

// --- Event Handlers (Player Interaction Logic) ---

export function handleHandCardClick(card, index) {
    console.log(`Clicked hand card: ${card.name} at index ${index}`);
    const player = getCurrentPlayer();
    const targetingMode = getTargetingMode().mode;

    if (getState().currentPlayerId !== 'player' || targetingMode) return; // Not player's turn or already targeting

    const selectedCard = getSelectedCard();

    if (selectedCard && selectedCard.card.instanceId === card.instanceId) {
        // Clicked the same card again, deselect
        deselectCard();
    } else {
        // Select this card
        deselectCard(); // Deselect previous if any
        deselectAttacker(); // Deselect attacker if any

        if (player.currentMana >= card.cost) {
            const cardEl = player.handElement?.querySelector(`.card[data-hand-index="${index}"]`);
            if (cardEl) {
                // Don't add 'selected' class here, renderGame will do it based on state
                setSelectedCard({ card: card, location: 'hand', index: index });

                // Determine next action based on card type
                if (card.type === 'Creature') {
                    // Check board space before playing
                    if (player.board.length < MAX_BOARD_SIZE) {
                        playCard(player, card, index); // Play immediately (no target needed initially)
                        // deselectCard() is called within playCard's flow
                    } else {
                         setMessage("Board is full!");
                         logMessage(`Cannot play ${card.name}: Board is full!`, 'log-error');
                         setSelectedCard(null); // Deselect invalid play
                    }
                } else if (card.type === 'Spell') {
                    // Enter targeting mode if the spell requires it
                    if (card.target && card.target !== 'self' && card.target !== 'opponent-board' && card.target !== 'none') { // Needs specific target
                        setTargetingMode('spell', card.target);
                        setMessage(`Select a target for ${card.name}`);
                        // Highlights updated in renderGame
                    } else {
                        // Play spell immediately (targets self, whole board, or none)
                        playCard(player, card, index, null); // Pass null target for self/board/none spells
                        // deselectCard() called within playCard's flow
                    }
                }
            }
        } else {
            setMessage("Not enough mana!");
            logMessage(`Cannot play ${card.name}: Not enough mana!`, 'log-error');
        }
    }
    renderGame(); // Update UI with selection/deselection/highlights
}

export function handleBoardCardClick(card) {
    console.log(`Clicked own board card: ${card.name} (${card.instanceId})`);
    const player = getCurrentPlayer();
    const targeting = getTargetingMode();

    if (getState().currentPlayerId !== 'player') return; // Not player's turn

    if (targeting.mode === 'spell') {
        // Clicked own creature while targeting for a spell
        const spell = getSelectedCard()?.card;
        const targetElement = player.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
        const targetData = getTargetFromElement(targetElement, targeting.spellTargetType, player); // Check if target is valid for spell

        if (targetData !== "invalid" && targetElement && targetElement.classList.contains('targetable') && spell) {
            playCard(player, spell, getSelectedCard().index, targetElement);
            // deselectCard/renderGame called within playCard's flow
        } else {
            setMessage("Invalid target for spell.");
            logMessage(`Invalid target for ${spell?.name || 'spell'}.`, 'log-error');
        }
    } else if (targeting.mode === 'attack') {
        // Clicked own creature while selecting target for attack - invalid action
        setMessage("Select an enemy target to attack.");
        // Maybe deselect attacker? For now, do nothing.
    } else {
        // No targeting active, try selecting this creature for attack
        deselectCard();    // Deselect any hand card
        const currentAttacker = getSelectedAttacker();

        if (currentAttacker && currentAttacker.instanceId === card.instanceId) {
            // Clicked selected attacker again, deselect
            deselectAttacker();
        } else {
            deselectAttacker(); // Deselect previous attacker if any
            if (card.canAttack && !card.hasAttacked && !card.isFrozen && card.currentAttack > 0) {
                const cardEl = player.boardElement?.querySelector(`.card[data-instance-id="${card.instanceId}"]`);
                if (cardEl) {
                    // Don't add 'attacking' class here, renderGame will do it based on state
                    setSelectedAttacker(card);
                    setTargetingMode('attack');
                    setMessage(`Select target for ${card.name} to attack.`);
                    // Highlights updated in renderGame
                }
            } else if (card.hasAttacked) {
                setMessage(`${card.name} has already attacked this turn.`);
                logMessage(`${card.name} cannot attack: Already attacked.`, 'log-info');
            } else if (card.isFrozen) {
                setMessage(`${card.name} is frozen.`);
                logMessage(`${card.name} cannot attack: Frozen.`, 'log-info');
            } else if (card.currentAttack <= 0) {
                setMessage(`${card.name} has 0 Attack.`);
                logMessage(`${card.name} cannot attack: 0 Attack.`, 'log-info');
            } else {
                setMessage(`${card.name} cannot attack yet.`);
                logMessage(`${card.name} cannot attack: Summoning sickness.`, 'log-info');
            }
        }
    }
    renderGame(); // Update highlights etc.
}

// Handles clicks on potential targets (opponent cards, opponent hero, potentially own cards/hero for spells)
export function handleTargetClick(targetElement) {
    console.log("Clicked target element:", targetElement);
    const player = getCurrentPlayer(); // The player initiating the action
    const targeting = getTargetingMode();

    if (getState().currentPlayerId !== 'player' || !targeting.mode) return;

    if (!targetElement.classList.contains('targetable')) {
        setMessage("Invalid target.");
        logMessage("Invalid target selected.", 'log-error');
        // Consider deselecting spell/attacker here if needed
        return;
    }

    if (targeting.mode === 'spell') {
        const spellData = getSelectedCard();
        if (spellData) {
            playCard(player, spellData.card, spellData.index, targetElement);
            // deselectCard/renderGame called within playCard's flow
        } else {
             console.error("Targeting spell, but no spell selected in state.");
             setTargetingMode(null); // Reset targeting state
             logMessage("Error: Spell targeting failed (no spell selected).", 'log-error');
             renderGame();
        }
    } else if (targeting.mode === 'attack') {
        const attacker = getSelectedAttacker();
        if (attacker) {
            creatureAttack(attacker, targetElement);
            // deselectAttacker/renderGame called within creatureAttack's flow
        } else {
             console.error("Targeting attack, but no attacker selected in state.");
             setTargetingMode(null); // Reset targeting state
             logMessage("Error: Attack targeting failed (no attacker selected).", 'log-error');
             renderGame();
        }
    }
}
