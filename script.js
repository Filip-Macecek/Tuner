class App
{
    constructor()
    {
        this.audio = new AppAudio();
        this.appCanvas = new AppCanvas();
        this.amplitudeMeter = new AmplitudeMeter();
        this.pitchMeter2 = new PitchMeter2();
        this.frameCounter = 0;
        this.totalFrames = 60;
        this.detectedPitches = [];
        this.detectedPitchesBufferSize = 120;
        this.prevTone = null;
        this.previousPitch = null;

        this.lastFrame = new Date();
    }

    async initAsync()
    {
        await this.audio.startAsync();
        this.amplitudeMeter.initialize();
        this.pitchMeter2.initialize();
    }

    loop()
    {
        this.audio.captureNext();

        let zeroCount = this.audio.audioBuffer.reduce((count, sample) => count + (sample === 0 ? 1 : 0), 0);
        console.log(`Number of zeroes in audio buffer: ${zeroCount}`);

        let processing = new Processing(this.audio.getSamplingRate(), [30, 440]);
        let estimation = { estimatedFrequency: 440, confidence: 0.9 };
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

        const peak = processing.getPeakDecibels(this.audio.audioBuffer);
        const rms = processing.getRmsDecibels(this.audio.audioBuffer);
        const stringNumber = Music.getStringNumber(closestTone);

        this.draw(rms, cents, closestTone, detectedPitch, smoothedPitch, processing.cmndCache, estimation.confidence, stringNumber);

        const now = new Date();
        const fps = 1000 / (now - this.lastFrame);
        // console.log(fps);
        this.lastFrame = now;

        requestAnimationFrame(this.loop.bind(this));
    }

    draw(rms, cents, closestTone, detectedPitch, smoothedPitch, cmndCache, confidence, stringNumber)
    {

        if (this.frameCounter > this.totalFrames)
        {
            this.frameCounter = 0;
            this.appCanvas.cmndsReset();
        }

        this.amplitudeMeter.drawAmplitude(rms);
        // console.log(`cents calculation: result: ${cents}, detectedPitch: ${detectedPitch}, smoothedPitch: ${smoothedPitch}, closestToneFrequency: ${closestTone.toneFrequency}, confidence: ${confidence}}`);
        this.pitchMeter2.update(cents, closestTone, stringNumber);

        this.appCanvas.clear();
        this.appCanvas.drawAudio(this.audio.audioBuffer);
        this.appCanvas.drawFrequency(smoothedPitch);
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

if (document.readyState === 'complete') {
    // Page is already loaded, execute immediately
    initializeApp();
} else {
    // Wait for the load event
    window.addEventListener('load', initializeApp);
}

function initializeApp() {
    let app = new App();
    let initPromise = app.initAsync();
    initPromise.then(() => {
        app.loop();
    });

    document.addEventListener('visibilitychange', () => {
         if (isInitialized && document.visibilityState === 'visible') {
             app.loop();
         }
    });
}