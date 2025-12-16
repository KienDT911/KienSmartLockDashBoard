// --- Configuration ---
// !!! IMPORTANT: REPLACE WITH YOUR ESP32'S IP ADDRESS AND PORT !!!
const ESP32_IP = "192.168.1.100"; 
const TOGGLE_ENDPOINT = "/toggle"; // Endpoint to send the command
const STATUS_ENDPOINT = "/status"; // Endpoint to check the current state
const LOG_POLLING_INTERVAL = 3000; // Time in ms to check status (3 seconds)

// --- DOM Element References ---
const doorStatusElement = document.getElementById('door-status');
const statusTextElement = document.getElementById('status-text');
const statusIconElement = document.getElementById('status-icon');
const logListElement = document.getElementById('log-entries');

// --- Core Functions ---

/**
 * Sends an HTTP GET request to the ESP32 to toggle the lock state.
 */
async function toggleLock() {
    const url = `http://${ESP32_IP}${TOGGLE_ENDPOINT}`;
    try {
        // Log the action immediately for user feedback
        statusTextElement.textContent = 'TOGGLING...';
        
        const response = await fetch(url, { method: 'GET' });

        if (response.ok) {
            console.log('Toggle request sent successfully.');
        } else {
            console.error(`Toggle failed with status: ${response.status}`);
            alert(`Toggle failed. HTTP Status: ${response.status}`);
        }
        
        // Request a status update shortly after the toggle
        setTimeout(updateStatus, 500); 

    } catch (error) {
        console.error('Error sending toggle request:', error);
        alert(`Error communicating with ESP32 at ${url}. Check your network and ESP32 code.`);
        updateStatus(); // Try to revert to last known status
    }
}

/**
 * Fetches the current status from the ESP32 and updates the UI.
 */
async function updateStatus() {
    const url = `http://${ESP32_IP}${STATUS_ENDPOINT}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Assumes the ESP32 returns JSON like: { "status": "LOCKED" }
        const data = await response.json();
        const status = data.status.toUpperCase();

        doorStatusElement.classList.remove('locked', 'open', 'unknown');
        
        if (status === 'LOCKED') {
            doorStatusElement.classList.add('locked');
            statusIconElement.className = 'fas fa-lock';
            statusTextElement.textContent = 'LOCKED';
        } else if (status === 'OPEN') {
            doorStatusElement.classList.add('open');
            statusIconElement.className = 'fas fa-lock-open';
            statusTextElement.textContent = 'OPEN';
        } else {
            // Handle unexpected status
            doorStatusElement.classList.add('unknown');
            statusIconElement.className = 'fas fa-question-circle';
            statusTextElement.textContent = `UNKNOWN: ${status}`;
        }

    } catch (error) {
        console.error('Error fetching status:', error);
        doorStatusElement.classList.remove('locked', 'open');
        doorStatusElement.classList.add('unknown');
        statusIconElement.className = 'fas fa-exclamation-triangle';
        statusTextElement.textContent = 'ERROR/OFFLINE';
    }
}

/**
 * Simulates receiving a log entry from an RFID scan.
 * NOTE: In a real system, the ESP32 would need to push this data to a central server 
 * (e.g., Firebase, MQTT, or a custom API), and this function would read from that server.
 */
function logEntrance(userName, timestamp) {
    const time = new Date(timestamp).toLocaleTimeString();
    const newLogEntry = document.createElement('li');
    newLogEntry.innerHTML = `<span class="log-entry-user">${userName}</span> <span class="log-time">(${time})</span>`;
    
    // Add to the top of the list
    logListElement.prepend(newLogEntry);
    
    // Limit the log to, say, 10 entries for performance
    while (logListElement.children.length > 10) {
        logListElement.removeChild(logListElement.lastChild);
    }
}

// --- Initialization ---

/**
 * Function to run when the page first loads.
 */
function initDashboard() {
    // 1. Initial status check on page load
    updateStatus();

    // 2. Set up periodic status refresh
    setInterval(updateStatus, LOG_POLLING_INTERVAL); 

    // 3. --- DEMO ONLY: Simulating log events ---
    // In your final project, this code needs to be replaced with logic
    // that fetches real log data from your ESP32's logging mechanism.
    logEntrance("Demo User A", Date.now() - 5000);
    logEntrance("Demo User B (RFID)", Date.now());
}

// Run the initialization function when the page is fully loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// You would use a separate function (e.g., `fetchLogEntries()`) that periodically
// requests the latest log data from your server/ESP32, and then calls `logEntrance`
// for each new item.