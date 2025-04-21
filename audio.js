class AppAudio {
    constructor()
    {
        this.started = false;
        this.audioBuffer = new Float32Array(AUDIO_BUFFER_SIZE);
        this.audioContext = null;
        this.oscillator = null;
    }

    getSamplingRate()
    {
        Guard.failIf(this.started === false, "Audio not initialized.");
        return this.audioContext.sampleRate;
    }

    async startAsync()
    {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new (window.AudioContext || window.webkit.audioContext)();
        this.analyser = this.audioContext.createAnalyser();

        // Configure the analyser
        this.analyser.fftSize = AUDIO_BUFFER_SIZE;  // Buffer size (adjustable)
        
        // Connect the microphone input to the analyser
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        console.log(`audio: sampleRate: ${this.audioContext.sampleRate} Hz`);
        console.log(`audio: buffer timespan: ${(AUDIO_BUFFER_SIZE/this.audioContext.sampleRate)/1000} ms`);
        
        // Oscillator for debugging.
        // await this.audioContext.audioWorklet.addModule("oscillator.js");
        // this.oscillator = new AudioWorkletNode(this.audioContext, "Oscillator");
        // source.connect(this.oscillator);
        await this.audioContext.resume();

        this.started = true;
    }

    captureNext(buffer)
    {
        Guard.failIf(!this.started);
        Guard.failIf(buffer.length != AUDIO_BUFFER_SIZE);
        this.analyser.getFloatTimeDomainData(buffer); 
    }
}