import { getState, getPlayer, getSelectedCard, setSelectedCard, getSelectedAttacker, setSelectedAttacker, setTargetingMode, getTargetingMode } from './state.js';
import { getDOMElement } from './dom.js';
import { setMessage } from './messaging.js';
import { updateTargetHighlights } from './render.js';

export function deselectCard() {
    const selectedCard = getSelectedCard();
    if (selectedCard) {
        const player = getPlayer(selectedCard.card.owner);
        const cardEl = player?.handElement?.querySelector(`.card[data-instance-id="${selectedCard.card.instanceId}"]`);
        if (cardEl) cardEl.classList.remove('selected');

        setSelectedCard(null);
        if (getTargetingMode().mode === 'spell') {
            setTargetingMode(null);
            setMessage(`${getState().currentPlayerId}'s turn.`);
            updateTargetHighlights();
        }
    }
}

export function deselectAttacker() {
    const selectedAttacker = getSelectedAttacker();
    if (selectedAttacker) {
        const player = getPlayer(selectedAttacker.owner);
        const cardEl = player?.boardElement?.querySelector(`.card[data-instance-id="${selectedAttacker.instanceId}"]`);
        if (cardEl) cardEl.classList.remove('attacking');

        setSelectedAttacker(null);
        if (getTargetingMode().mode === 'attack') {
            setTargetingMode(null);
            setMessage(`${getState().currentPlayerId}'s turn.`);
            updateTargetHighlights();
        }
    }
}

export function showGameOverScreen(message) {
    const gameOverOverlay = getDOMElement('gameOverOverlay');
    const gameOverMessage = getDOMElement('gameOverMessage');
    const endTurnButton = getDOMElement('endTurnButton');

    if (gameOverOverlay && gameOverMessage) {
        gameOverMessage.textContent = message;
        gameOverOverlay.style.display = 'flex';
    }
    if (endTurnButton) {
        endTurnButton.disabled = true;
    }
}

export function hideGameOverScreen() {
    const gameOverOverlay = getDOMElement('gameOverOverlay');
    if (gameOverOverlay) {
        gameOverOverlay.style.display = 'none';
    }
}

export function showGameUI() {
    const gameContainer = getDOMElement('gameContainer');
    const gameMainArea = getDOMElement('gameMainArea');
    const logPanel = getDOMElement('messageLogPanelEl');
    console.log("[UIState] showGameUI called. Game Container:", gameContainer);
    if (gameContainer) gameContainer.classList.remove('hidden');
    if (logPanel) logPanel.classList.remove('hidden');
}

export function hideGameUI() {
    const gameContainer = getDOMElement('gameContainer');
    const logPanel = getDOMElement('messageLogPanelEl');
    if (gameContainer) gameContainer.classList.add('hidden');
    if (logPanel) logPanel.classList.add('hidden');
}
