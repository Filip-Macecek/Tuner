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
        this.processor = null;
        this.latestData = null;
    }

    async initAsync()
    {
        await this.audio.startAsync();
        this.amplitudeMeter.initialize();
        this.pitchMeter2.initialize();
    }

    loop()
    {
        const pitch = JSON.parse(JSON.stringify(this.audio.pitch));
        if (pitch !== null) // TODO 
        {
            let closestTone = Music.getClosestTone(pitch);
            let cents = Music.getCentsDistance(pitch, closestTone.toneFrequency)
            this.draw(1, cents, closestTone, pitch, pitch, this.audio.audioBuffer, this.audio.cmndCache, 0.9, null);
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    draw(rms, cents, closestTone, detectedPitch, smoothedPitch, buffer, cmndCache, confidence, stringNumber)
    {
        // this.amplitudeMeter.clear();

        if (this.frameCounter > this.totalFrames)
        {
            this.frameCounter = 0;
            this.appCanvas.cmndsReset();
        }

        // this.amplitudeMeter.drawAmplitude(rms);
        // console.log(`cents calculation: result: ${cents}, detectedPitch: ${detectedPitch}, smoothedPitch: ${smoothedPitch}, closestToneFrequency: ${closestTone.toneFrequency}, confidence: ${confidence}}`);
        this.pitchMeter2.update(cents, closestTone, stringNumber);

        this.appCanvas.clear();
        if (buffer) this.appCanvas.drawAudio(buffer);
        if (buffer) this.appCanvas.drawAudio2(this.audio.audioBuffer2);
        if (smoothedPitch) this.appCanvas.drawFrequency(smoothedPitch);
        if (cmndCache) this.appCanvas.plotCmnds(cmndCache, this.totalFrames);

        this.frameCounter++;
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