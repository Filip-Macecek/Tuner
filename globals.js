// since we are capturing each animation frame, assuming FPS is 60 (period of ~16ms)
// TODO: Figure out how to optimize the buffer size, so we are not loosing audio or capture audio in seperate thread.
var AUDIO_BUFFER_SIZE = 2048;

console.log(`AUDIO_BUFFER_SIZE: ${AUDIO_BUFFER_SIZE}`);