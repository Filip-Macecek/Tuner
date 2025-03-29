class AppAudio {
    constructor()
    {
        this.started = false;
        this.audioBuffer = new Float32Array(AUDIO_BUFFER_SIZE);
        this.tauMax = 1760; // A6
    }

    async startAsync()
    {
        // try {
            // Request access to the microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            this.analyser = audioContext.createAnalyser();
    
            // Configure the analyser
            this.analyser.fftSize = AUDIO_BUFFER_SIZE;  // Buffer size (adjustable)
            
            // Connect the microphone input to the analyser
            source.connect(this.analyser);
            console.log(`audio: sampleRate: ${audioContext.sampleRate} Hz`);
            console.log(`audio: buffer timespan: ${(AUDIO_BUFFER_SIZE/audioContext.sampleRate)/1000} ms`);
            
            this.started = true;
            
            // function processAudio() {
            //     analyser.getFloatTimeDomainData(dataArray);  // Get raw audio data
                
            //     // 🔹 At this point, you have the raw waveform in `dataArray`
            //     console.log(dataArray);  // Log to see the values
                
            //     requestAnimationFrame(processAudio);  // Keep processing audio
            // }
    
            // processAudio();
        // } catch (error) {
        //     window.alert("Microphone access denied or error:", error);
        // }
    }

    captureNext()
    {
        Guard.failIf(!this.started);
        this.analyser.getFloatTimeDomainData(this.audioBuffer); 
    }
}