// Frequency conversion algorithm
// This script converts electromagnetic frequencies to audible piano range frequencies

// Constants for frequency conversion
const SPEED_OF_LIGHT = 299792458; // meters per second
const MIDDLE_C_FREQUENCY = 261.63; // Hz (Middle C on piano)
const MIN_AUDIBLE_FREQ = 27.5; // Hz (A0 on piano)
const MAX_AUDIBLE_FREQ = 4186.01; // Hz (C8 on piano)

// Western tempered tuning - 12 semitones per octave
// Frequency ratio between adjacent semitones is 2^(1/12)
const SEMITONE_RATIO = Math.pow(2, 1/12);

// Function to convert wavelength in nm to frequency in Hz
function wavelengthToFrequency(wavelength) {
    // Convert wavelength from nm to m
    const wavelengthInMeters = wavelength * 1e-9;
    
    // Calculate frequency using f = c/λ
    const frequency = SPEED_OF_LIGHT / wavelengthInMeters;
    
    return frequency;
}

// Function to convert electromagnetic frequency to audible range
function convertToAudibleRange(emFrequency) {
    // Start with the electromagnetic frequency
    let audioFreq = emFrequency;
    
    // Divide by octaves until we're in the audible range
    // We want to get as close to middle C as possible
    while (audioFreq > MAX_AUDIBLE_FREQ) {
        audioFreq /= 2;
    }
    
    while (audioFreq < MIN_AUDIBLE_FREQ) {
        audioFreq *= 2;
    }
    
    // Now fine-tune to get closer to middle C
    while (audioFreq > MIDDLE_C_FREQUENCY * 2) {
        audioFreq /= 2;
    }
    
    while (audioFreq < MIDDLE_C_FREQUENCY / 2) {
        audioFreq *= 2;
    }
    
    return audioFreq;
}

// Function to quantize a frequency to the nearest semitone in western tempered tuning
function quantizeToSemitone(frequency) {
    // A4 is 440Hz, which is 9 semitones above middle C
    const A4 = 440;
    
    // Calculate how many semitones away from A4 our frequency is
    const semitonesFromA4 = Math.round(12 * Math.log2(frequency / A4));
    
    // Calculate the quantized frequency
    const quantizedFrequency = A4 * Math.pow(SEMITONE_RATIO, semitonesFromA4);
    
    return {
        frequency: quantizedFrequency,
        note: getNoteNameFromSemitones(semitonesFromA4)
    };
}

// Function to get note name from semitones away from A4
function getNoteNameFromSemitones(semitonesFromA4) {
    const noteNames = ['A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab'];
    const octave = 4 + Math.floor((semitonesFromA4 + 9) / 12);
    const noteIndex = (semitonesFromA4 + 9) % 12;
    if (noteIndex < 0) {
        return noteNames[noteIndex + 12] + (octave - 1);
    }
    return noteNames[noteIndex] + octave;
}

// Main conversion function that takes a wavelength in nm and returns an audible frequency
function convertElementWavelengthToAudibleNote(wavelength) {
    // Convert wavelength to electromagnetic frequency
    const emFrequency = wavelengthToFrequency(wavelength);
    
    // Convert to audible range
    const audibleFrequency = convertToAudibleRange(emFrequency);
    
    // Quantize to nearest semitone
    const quantizedNote = quantizeToSemitone(audibleFrequency);
    
    return {
        originalWavelength: wavelength,
        emFrequency: emFrequency,
        audibleFrequency: audibleFrequency,
        quantizedFrequency: quantizedNote.frequency,
        note: quantizedNote.note
    };
}

// Example usage for hydrogen spectral lines
const hydrogenLines = [
    { wavelength: 656.28, name: "Hα (red)" },
    { wavelength: 486.13, name: "Hβ (blue-green)" },
    { wavelength: 434.05, name: "Hγ (violet)" },
    { wavelength: 410.17, name: "Hδ (violet)" }
];

// Process hydrogen lines
console.log("Hydrogen Spectral Lines Converted to Audible Notes:");
hydrogenLines.forEach(line => {
    const result = convertElementWavelengthToAudibleNote(line.wavelength);
    console.log(`${line.name}: ${line.wavelength} nm → ${result.note} (${result.quantizedFrequency.toFixed(2)} Hz)`);
});
