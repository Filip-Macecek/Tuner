class AppAudio {
    constructor()
    {
        this.started = false;
        this.audioBuffer = new Float32Array(AUDIO_BUFFER_SIZE);
        this.tauMax = 1760; // A6
        this.audioContext = null;
        this.audioProcessor = null;
        this.pitch = null;
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
        const source = this.audioContext.createMediaStreamSource(stream);

        await this.audioContext.audioWorklet.addModule("audioWorkletProcessor.js");
        this.audioProcessor = new AudioWorkletNode(this.audioContext, "TunerAudioProcessor");
        this.audioProcessor.port.onmessage = ev => {
            // console.log(ev.data.pitch);
            this.pitch = ev.data.pitch;
        };
        source.connect(this.audioProcessor);
        // source.connect(this.audioContext.destination)
        await this.audioContext.resume();
        
        this.started = true;
    }
}