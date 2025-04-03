import { getDOMElement } from './dom.js';

// --- Message Logging ---

/**
 * Sets the text content of the main message area.
 * @param {string} msg - The message to display.
 */
export function setMessage(msg) {
    const messageAreaEl = getDOMElement('messageAreaEl');
    if (messageAreaEl) {
        messageAreaEl.textContent = msg;
    }
}


/**
 * Appends a message to the message log panel.
 * @param {string} message - The text message to log.
 * @param {string} [type='log-action'] - The type of message ('log-error', 'log-info', 'log-action', 'log-turn'). Used for styling.
 */
export function logMessage(message, type = 'log-action') {
    const messageLogContentEl = getDOMElement('messageLogContentEl');
    if (!messageLogContentEl) return;

    const logEntry = document.createElement('div');
    logEntry.classList.add('log-message', type);
    logEntry.textContent = message;

    messageLogContentEl.appendChild(logEntry);

    // Auto-scroll to the bottom
    messageLogContentEl.scrollTop = messageLogContentEl.scrollHeight;

    // Optionally, still update the main message area for temporary prompts
    if (type === 'log-info' || type === 'log-error') {
        setMessage(message); // Keep important prompts visible in the main bar
    }
}
