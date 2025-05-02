// Global constants for use throughout the application
export const AUDIO_BUFFER_SIZE = 2048;
export const BACKGROUND_COLOR = "#0d0d0d";
export const GREEN = "#87b37a";
export const WHITE = "#FFFFFF";
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE;
export const INTUNE_TOLERANCE = 2; // in cents

console.log(`AUDIO_BUFFER_SIZE: ${AUDIO_BUFFER_SIZE}`);
console.log(`DEBUG_MODE: ${DEBUG_MODE}`);