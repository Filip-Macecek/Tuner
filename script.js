class App
{
    constructor()
    {
        this.appCanvas = new AppCanvas();
        this.amplitudeMeter = new AmplitudeMeter();
        this.pitchMeter2 = new PitchMeter2();
        this.frameCounter = 0;
        this.cmndfRetentionFrameCount = 60;
        this.processor = new Processor();
    }

    async initAsync()
    {
        await this.processor.initAudioAsync();
        this.amplitudeMeter.initialize();
        this.pitchMeter2.initialize();
    }

    start()
    {
        this.process();
        this.draw();
    }

    process()
    {
        this.processor.process();
        setTimeout(this.process.bind(this), 1); // TODO: This parameter
    }

    draw()
    {
        // this.amplitudeMeter.clear();

        if (this.frameCounter > this.cmndfRetentionFrameCount)
        {
            this.frameCounter = 0;
            this.appCanvas.cmndsReset();
        }

        // this.amplitudeMeter.drawAmplitude(rms);
        // console.log(`cents calculation: result: ${cents}, detectedPitch: ${detectedPitch}, smoothedPitch: ${smoothedPitch}, closestToneFrequency: ${closestTone.toneFrequency}, confidence: ${confidence}}`);
        if (this.processor.cents)
        {
            this.pitchMeter2.update(this.processor.cents, this.processor.detectedTone, this.processor.stringNumber);
        }

        this.appCanvas.clear();
        this.appCanvas.drawAudio(this.processor.buffer);
        if (this.processor.lastEstimatedPitch) this.appCanvas.drawFrequency(this.processor.lastEstimatedPitch);
        if (this.processor.lastCmndCache) this.appCanvas.plotCmnds(this.processor.lastCmndCache, this.cmndfRetentionFrameCount);

        this.frameCounter++;

        requestAnimationFrame(this.draw.bind(this));
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
        app.start();
    });

    // document.addEventListener('visibilitychange', () => {
    //      if (isInitialized && document.visibilityState === 'visible') {
    //          app.loop();
    //      }
    // });
}