class App
{
    constructor()
    {
        this.appCanvas = new AppCanvas();
        this.amplitudeMeter = new AmplitudeMeter();
        this.pitchMeter2 = new PitchMeter2();
        this.frameCounter = 0;
        this.totalFrames = 60;
        this.processor = null;
        this.latestData = null;
    }

    async initAsync()
    {
        this.amplitudeMeter.initialize();
        this.pitchMeter2.initialize();
        this.processor = new Worker("processorWebWorker.js");
        this.processor.onmessage = (e) => {
            this.latestData = e.data;
        };
    }

    loop()
    {
        if (this.latestData !== null) // TODO 
        {
            let rms, cents, closestTone, detectedPitch, smoothedPitch, cmndCache, confidence, stringNumber = this.latestData;
            this.draw(rms, cents, closestTone, detectedPitch, smoothedPitch, cmndCache, confidence, stringNumber);
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    draw(rms, cents, closestTone, detectedPitch, smoothedPitch, cmndCache, confidence, stringNumber)
    {
        amplitudeMeter.clear();

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

    // document.addEventListener('visibilitychange', () => {
    //      if (isInitialized && document.visibilityState === 'visible') {
    //          app.loop();
    //      }
    // });
}