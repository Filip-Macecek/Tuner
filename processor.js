class Processor
{
    constructor()
    {
        this.audio = new AppAudio();
        this.buffer = new Float32Array(AUDIO_BUFFER_SIZE);
        this.pastDetectedPitchSize = 200; // TODO: this could be dynamically controlled
        this.pastDetectedPitches = [];
        this.smoothingFactor = 0.038

        this.lastTime = new Date();
    }

    async initAudioAsync()
    {
        await this.audio.startAsync();
        this.sampleRate = this.audio.audioContext.sampleRate;
        this.initialized = true;
    }

    process()
    {
        this.audio.captureNext(this.buffer);
        // Guard.failIf()
        // TODO: The frequencies could be dynamically changed
        // TOOD: The processing could also be correlated to FFT analysis for better result. 
        let processing = new Processing(this.sampleRate, [80, 340]);
        // TODO: last parameter is the tolerance.. it should increase with lowering frequency
        let estimation = processing.getEstimatedFrequency(this.buffer, this.detectedPitch, 2);
        this.lastCmndCache = processing.cmndCache;
        this.lastEstimatedPitch = estimation.estimatedFrequency;
        this.lastConfidence = estimation.confidence;

        // TODO: Confidence tend to change based on the processing frequency range.. also needs to be adjusted dynamically.
        if (estimation.confidence >= 0.8)
        {
            this.pastDetectedPitches.push(this.lastEstimatedPitch);
        }
        if (this.pastDetectedPitches.length > this.pastDetectedPitchSize)
        {
            this.pastDetectedPitches.shift();
        }

        // TODOs:
        // Where to reset these past pitches??
        // Maybe we can detect a new string pluck by observing continous change in the pitches..
        // so like if last 5 are different from the previous, it's likely new stirng in which case let's reset.
        if (this.pastDetectedPitches.length > 0)
        {
            let smoothedAverage = this.pastDetectedPitches[0];
            for (let i = 1; i < this.pastDetectedPitches.length; i++)
            {
                smoothedAverage = smoothedAverage + this.smoothingFactor * (this.pastDetectedPitches[i] - smoothedAverage);
            }
            this.detectedPitch = smoothedAverage;
        }
        
        if (this.detectedPitch)
        {
            this.detectedTone = Music.getClosestTone(this.detectedPitch);
            this.cents = this.detectedTone ? Music.getCentsDistance(this.detectedPitch, this.detectedTone.toneFrequency) : -50;
            this.stringNumber = Music.getStringNumber(this.detectedTone)
        }

        this.peak = processing.getPeakDecibels(this.buffer);
        this.rms = processing.getRmsDecibels(this.buffer);
    }
}