class App
{
    constructor()
    {
        this.audio = new AppAudio();
        this.appCanvas = new AppCanvas();
    }

    async initAsync()
    {
        await this.audio.startAsync();
    }

    loop()
    {
        // TODO: Actual audio
        // this.audio.captureNext();
        // this.appCanvas.clear();
        // this.appCanvas.drawAmplitude(Processing.getPeakDecibels(this.audio.audioBuffer), "RED");
        // this.appCanvas.drawAmplitude(Processing.getRmsDecibels(this.audio.audioBuffer), "GREEN");
        // this.appCanvas.drawFrequency(Processing.getEstimatedFrequency(this.audio.audioBuffer));
        // this.appCanvas.drawAudio(this.audio.audioBuffer);

        const sampleRate = 4096; // Standard audio sample rate
        const frequency = 50; // Frequency of the sine wave in Hz
        const amplitude = 1; // Amplitude of the sine wave
        const bufferLength = 4096;
        let buffer = new Float32Array(bufferLength);
        let decayRate = 1;

        // Generate a sine wave with a 440 Hz frequency and offset by half a period
        for (let i = 0; i < bufferLength; i++) {
            let timeStep = i * (1 / sampleRate);
            let sinVal = Math.sin(2 * Math.PI * frequency * amplitude * timeStep);
            let step = 1 - (i / (bufferLength - 1));
            buffer[i] = sinVal * step ** 5;
        }

        this.appCanvas.clear();
        this.appCanvas.drawAudio(buffer);
        this.appCanvas.drawAmplitude(Processing.getPeakDecibels(buffer), "RED");
        this.appCanvas.drawAmplitude(Processing.getRmsDecibels(buffer), "GREEN");
        this.appCanvas.drawFrequency(Processing.getEstimatedFrequency(buffer, [1, 1000], sampleRate));

        // TODO: What is the FPS and how do i synchronize it with the audio buffer?
        // If the audio buffer is too small, it captures only part of the audio in the frame.. if it's too big, it will contain zeroes
        requestAnimationFrame(this.loop.bind(this));
    }
}

let app = new App();
let initPromise = app.initAsync();
initPromise.then(() => app.loop());