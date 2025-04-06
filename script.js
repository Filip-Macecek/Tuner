class App
{
    constructor()
    {
        this.audio = new AppAudio();
        this.appCanvas = new AppCanvas();
        this.amplitudeMeter = new AmplitudeMeter();
        this.pitchMeter = new PitchMeter();
        this.frameCounter = 0;
        this.totalFrames = 60;
        this.detectedPitches = [];
        this.detectedPitchesBufferSize = 120;
        this.prevTone = null;
        this.previousPitch = null;
    }

    async initAsync()
    {
        await this.audio.startAsync();
        this.amplitudeMeter.initialize();
        this.pitchMeter.initialize();
    }

    loop()
    {
        this.audio.captureNext();

        let processing = new Processing(this.audio.getSamplingRate(), [30, 440]);
        let estimation = processing.getEstimatedFrequency(this.audio.audioBuffer, this.previousPitch, 2);
        let detectedPitch = estimation.estimatedFrequency;

        if (estimation.confidence > 0.8)
        {
            this.detectedPitches.push(detectedPitch);
        }

        if (this.detectedPitches.length > this.detectedPitchesBufferSize)
        {
            this.detectedPitches.shift();
        }
        let smoothedPitch = this.detectedPitches.length >= 1 ? this.smoothOut(this.detectedPitches) : 25;
        const closestTone = Music.getClosestTone(smoothedPitch);
        const cents = closestTone ? Music.getCentsDistance(smoothedPitch, closestTone.toneFrequency) : -50;

        if (this.prevTone != closestTone.tone)
        {
            this.detectedPitches = [];
            this.previousPitch = null;
        }
        this.prevTone = closestTone.tone;
        this.previoiusPitch = smoothedPitch;

        this.amplitudeMeter.clear();
        this.pitchMeter.clear();

        const peak = processing.getPeakDecibels(this.audio.audioBuffer);
        const rms = processing.getRmsDecibels(this.audio.audioBuffer);

        this.draw(rms, cents, closestTone, detectedPitch, smoothedPitch, processing.cmndCache, estimation.confidence);

        requestAnimationFrame(this.loop.bind(this));
    }

    draw(rms, cents, closestTone, detectedPitch, smoothedPitch, cmndCache, confidence)
    {

        if (this.frameCounter > this.totalFrames)
        {
            this.frameCounter = 0;
            this.appCanvas.cmndsReset();
        }

        this.amplitudeMeter.drawAmplitude(rms);
        console.log(`cents calculation: result: ${cents}, detectedPitch: ${detectedPitch}, smoothedPitch: ${smoothedPitch}, closestToneFrequency: ${closestTone.toneFrequency}, confidence: ${confidence}}`);
        this.pitchMeter.drawPitchOffset(cents);
        this.pitchMeter.drawReferenceTone(closestTone);

        this.appCanvas.clear();
        this.appCanvas.drawAudio(this.audio.audioBuffer);
        this.appCanvas.drawFrequency(detectedPitch);
        this.appCanvas.plotCmnds(cmndCache, this.totalFrames);

        this.frameCounter++;
    }

    smoothOut(pitches, smoothingFactor = 0.05)
    {
        Guard.failIf(smoothingFactor < 0 || smoothingFactor > 1, `Invalid smoothing factor '${smoothingFactor}.'`);
        Guard.failIf(pitches.length == 0, `Pitches must not be empty.`);

        let smoothedAverage = pitches[0];
        for (let i = 1; i < pitches.length; i ++)
        {
            smoothedAverage = smoothedAverage + smoothingFactor * (pitches[i] - smoothedAverage);
        }
        return smoothedAverage;
    }
}

let app = new App();
let initPromise = app.initAsync();
initPromise.then(() => app.loop());