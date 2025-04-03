import { getState, getPlayer, getOpponentId, isGameOver } from './state.js';
import { renderGame, updatePlayableCards } from './render.js';
import { deselectCard } from './uiState.js';
import { logMessage } from './messaging.js';
import { updateBoardStats } from './boardLogic.js';
import { checkWinCondition } from './gameLogic.js';
import { MAX_BOARD_SIZE } from './constants.js';
import { cardLibrary } from './cards.js';
import { getTargetFromElement } from './actionUtils.js';
import { triggerCardEffect } from './cardEffects.js';

export function playCard(player, card, cardIndexInHand, targetElement = null) {
    console.log(`${player.id} attempts to play ${card.name}`);

    if (player.currentMana < card.cost) {
        logMessage(`Cannot play ${card.name}: Not enough mana!`, 'log-error');
        console.log("Not enough mana");
        deselectCard();
        renderGame();
        return;
    }
    if (card.type === "Creature" && player.board.length >= MAX_BOARD_SIZE) {
         logMessage(`Cannot play ${card.name}: Board is full!`, 'log-error');
         console.log("Board is full");
         deselectCard();
         renderGame();
         return;
    }

    player.currentMana -= card.cost;

    const playedCard = player.hand.splice(cardIndexInHand, 1)[0];

    let success = true;
    if (playedCard.type === "Creature") {
        console.log(`Playing creature: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);
        playedCard.justPlayed = true;
        playedCard.canAttack = !!playedCard.mechanics?.includes("Swift");
        playedCard.hasAttacked = false;
        playedCard.isFrozen = false;
        console.log(`[Play Creature] ${playedCard.name} (${playedCard.instanceId}) played. Initial state: justPlayed=${playedCard.justPlayed}, canAttack=${playedCard.canAttack}`);
        const libraryCard = cardLibrary.find(c => c.id === playedCard.id);
        playedCard.health = libraryCard.health;
        playedCard.attack = libraryCard.attack;

        player.board.push(playedCard);

        if (playedCard.deployActionId) {
            triggerCardEffect(player, playedCard, playedCard.deployActionId, playedCard.deployParams || {}, null);
        }

        updateBoardStats(player.id);
        updateBoardStats(getOpponentId(player.id));

    } else if (playedCard.type === "Spell") {
        console.log(`Playing spell: ${playedCard.name}`);
        logMessage(`${player.id} plays ${playedCard.name}.`);
        if (playedCard.actionId) {
            const target = getTargetFromElement(targetElement, playedCard.target, player);

            if (target !== "invalid") {
                console.log(`Executing spell action ${playedCard.actionId} on target:`, target);
                success = triggerCardEffect(player, playedCard, playedCard.actionId, playedCard.actionParams || {}, target);
            } else {
                console.log("Invalid target for spell.");
                logMessage(`Invalid target for ${playedCard.name}.`, 'log-error');
                player.hand.splice(cardIndexInHand, 0, playedCard);
                player.currentMana += playedCard.cost;
                success = false;
            }
        } else {
             console.log(`Spell ${playedCard.name} has no defined action.`);
        }
        // Add successfully played spell to discard pile
        if (success) {
            player.discardPile.push(playedCard);
            console.log(`${playedCard.name} added to ${player.id}'s discard pile.`);
        }
    }

    deselectCard();
    if (success && !isGameOver()) {
        checkWinCondition();
    }
    if (!isGameOver()) {
        renderGame();
        updatePlayableCards(player);
    }
}
