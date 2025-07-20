// Main application JavaScript for Element Sound Web App

// Initialize audio context
let audioContext;
let masterGainNode;
let activeOscillators = {};
let lastClickTime = {}; // For debouncing

// Debounce time in milliseconds
const DEBOUNCE_TIME = 300;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Create the periodic table
    createPeriodicTable();
    
    // Set up audio context when user interacts with the page
    document.addEventListener('click', initAudio, { once: true });
    
    // Set up event listeners for controls
    document.getElementById('volume').addEventListener('input', updateVolume);
    document.getElementById('stop-all').addEventListener('click', stopAllSounds);
    document.getElementById('oscillator-type').addEventListener('change', updateOscillatorType);
});

// Initialize Web Audio API
function initAudio() {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create master gain node for volume control
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = document.getElementById('volume').value;
    masterGainNode.connect(audioContext.destination);
    
    // Enable element click handlers after audio is initialized
    const elementTiles = document.querySelectorAll('.element');
    elementTiles.forEach(tile => {
        tile.addEventListener('click', handleElementClick);
    });
}

// Create the periodic table from element data
function createPeriodicTable() {
    const periodicTable = document.getElementById('periodic-table');
    
    // Clear any existing content
    periodicTable.innerHTML = '';
    
    // Create element tiles
    elements.forEach(element => {
        // Create element tile
        const elementTile = document.createElement('div');
        elementTile.className = 'element';
        elementTile.dataset.symbol = element.symbol;
        elementTile.dataset.wavelength = element.wavelength;
        
        // Set position in grid
        elementTile.style.gridColumn = element.group;
        elementTile.style.gridRow = element.period;
        
        // Add element group class for coloring
        elementTile.classList.add(getElementGroupClass(element.group, element.period));
        
        // Add element content
        elementTile.innerHTML = `
            <span class="atomic-number">${elements.indexOf(element) + 1}</span>
            <span class="symbol">${element.symbol}</span>
            <span class="name">${element.name}</span>
            <span class="wavelength">${element.wavelength} nm</span>
        `;
        
        // Add to periodic table
        periodicTable.appendChild(elementTile);
    });
    
    // Handle special positioning for lanthanides and actinides
    adjustLanthanideActinidePositions();
}

// Determine element group class for coloring
function getElementGroupClass(group, period) {
    if (group === 1) return 'alkali-metal';
    if (group === 2) return 'alkaline-earth';
    if (group >= 3 && group <= 12) return 'transition-metal';
    if (group === 13) return 'post-transition';
    if (group === 14) return 'metalloid';
    if (group === 15 || group === 16) return 'nonmetal';
    if (group === 17) return 'halogen';
    if (group === 18) return 'noble-gas';
    if (period >= 6 && group === 3) {
        if (period === 6) return 'lanthanide';
        if (period === 7) return 'actinide';
    }
    return '';
}

// Adjust positions for lanthanides and actinides
function adjustLanthanideActinidePositions() {
    // This function would handle special positioning for lanthanides and actinides
    // For a simplified version, we're keeping them in their standard positions
}

// Handle element click with debounce
function handleElementClick(event) {
    const element = event.currentTarget;
    const symbol = element.dataset.symbol;
    
    // Implement debounce
    const now = Date.now();
    if (lastClickTime[symbol] && (now - lastClickTime[symbol] < DEBOUNCE_TIME)) {
        // Ignore clicks that happen too quickly
        return;
    }
    
    // Update last click time
    lastClickTime[symbol] = now;
    
    // Toggle sound on/off
    toggleElementSound(element);
}

// Toggle sound for the clicked element
function toggleElementSound(element) {
    const symbol = element.dataset.symbol;
    
    // If sound is already playing for this element, stop it
    if (activeOscillators[symbol]) {
        stopElementSound(symbol);
    } else {
        // Otherwise, play the sound
        playElementSound(element);
    }
}

// Play sound for the element
function playElementSound(element) {
    const symbol = element.dataset.symbol;
    const wavelength = parseFloat(element.dataset.wavelength);
    
    // Get the conversion result
    const result = convertElementWavelengthToAudibleNote(wavelength);
    
    // Update the info panel
    updateInfoPanel(symbol, result);
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = document.getElementById('oscillator-type').value;
    oscillator.frequency.value = result.quantizedFrequency;
    
    // Create envelope for softer sound
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(masterGainNode);
    
    // Apply envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.7, now + 0.1); // Attack
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.3); // Decay
    
    // Start oscillator
    oscillator.start();
    
    // Store oscillator and gain node for later stopping
    activeOscillators[symbol] = {
        oscillator: oscillator,
        gainNode: gainNode,
        element: element,
        frequency: result.quantizedFrequency
    };
    
    // Add playing class for visual feedback
    element.classList.add('playing');
    
    // Start visualization
    startVisualization();
}

// Stop sound for a specific element
function stopElementSound(symbol) {
    if (activeOscillators[symbol]) {
        const now = audioContext.currentTime;
        const { oscillator, gainNode, element } = activeOscillators[symbol];
        
        // Apply release envelope
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        
        // Schedule oscillator stop
        oscillator.stop(now + 0.3);
        
        // Remove playing class
        element.classList.remove('playing');
        
        // Remove from active oscillators after release time
        setTimeout(() => {
            delete activeOscillators[symbol];
            
            // If no more active oscillators, stop visualization
            if (Object.keys(activeOscillators).length === 0) {
                stopVisualization();
            }
        }, 300);
    }
}

// Stop all currently playing sounds
function stopAllSounds() {
    Object.keys(activeOscillators).forEach(symbol => {
        stopElementSound(symbol);
    });
}

// Update the volume
function updateVolume(event) {
    if (masterGainNode) {
        masterGainNode.gain.value = event.target.value;
    }
}

// Update oscillator type
function updateOscillatorType() {
    // The change will apply to new sounds
    const newType = document.getElementById('oscillator-type').value;
    
    // Optionally, update currently playing sounds
    Object.keys(activeOscillators).forEach(symbol => {
        if (activeOscillators[symbol] && activeOscillators[symbol].oscillator) {
            activeOscillators[symbol].oscillator.type = newType;
        }
    });
}

// Update the information panel with element details
function updateInfoPanel(symbol, result) {
    const element = elements.find(el => el.symbol === symbol);
    
    document.getElementById('element-name').textContent = `${element.name} (${symbol})`;
    document.getElementById('wavelength').textContent = `${result.originalWavelength} nm`;
    document.getElementById('em-frequency').textContent = `${(result.emFrequency / 1e12).toFixed(4)} THz`;
    document.getElementById('audio-frequency').textContent = `${result.quantizedFrequency.toFixed(2)} Hz`;
    document.getElementById('musical-note').textContent = result.note;
}

// Start audio visualization
function startVisualization() {
    if (!window.animationFrameId) {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up visualization
        ctx.strokeStyle = 'rgb(3, 218, 198)';
        ctx.lineWidth = 2;
        
        // Simple waveform visualization
        let x = 0;
        const height = canvas.height;
        const width = canvas.width;
        
        function draw() {
            // Stop if no active oscillators
            if (Object.keys(activeOscillators).length === 0) {
                window.animationFrameId = null;
                return;
            }
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw waveform for each active oscillator
            ctx.beginPath();
            
            // Calculate wave parameters based on active oscillators
            const amplitude = height / 3;
            const centerY = height / 2;
            
            // Get average frequency of all active oscillators for visualization
            const frequencies = Object.values(activeOscillators).map(osc => osc.frequency);
            const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
            
            for (let i = 0; i < width; i++) {
                const y = centerY + amplitude * Math.sin((i + x) * (avgFrequency / 1000));
                if (i === 0) {
                    ctx.moveTo(i, y);
                } else {
                    ctx.lineTo(i, y);
                }
            }
            
            ctx.stroke();
            
            // Animate
            x += 2;
            if (x > 10000) x = 0;
            
            // Request next frame
            window.animationFrameId = requestAnimationFrame(draw);
        }
        
        // Start animation
        window.animationFrameId = requestAnimationFrame(draw);
    }
}

// Stop visualization
function stopVisualization() {
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
        window.animationFrameId = null;
    }
    
    const canvas = document.getElementById('waveform');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
