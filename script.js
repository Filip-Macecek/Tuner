class App
{
    constructor()
    {
        this.pitchMeter = new PitchMeter();
        this.processor = new Processor();

        // For debugging the algorithm.
        if (DEBUG_MODE === true)
        {
            this.frameCounter = 0;
            this.cmndfRetentionFrameCount = 60;
            this.appCanvas = new AppCanvas();
            this.amplitudeMeter = new AmplitudeMeter();
        }
    }

    async initAsync()
    {
        await this.processor.initAudioAsync();
        this.pitchMeter.initialize();
        
        this.amplitudeMeter?.initialize();
    }

    start()
    {
        if (DEBUG_MODE === true)
        {
            document.getElementById("debug").style.display = "initial";
        }

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
        // this.amplitudeMeter.drawAmplitude(rms);
        // console.log(`cents calculation: result: ${cents}, detectedPitch: ${detectedPitch}, smoothedPitch: ${smoothedPitch}, closestToneFrequency: ${closestTone.toneFrequency}, confidence: ${confidence}}`);
        this.pitchMeter.update(this.processor.cents, this.processor.detectedTone, this.processor.stringNumber);

        if (DEBUG_MODE === true) this.drawDebug();

        requestAnimationFrame(this.draw.bind(this));
    }

    drawDebug()
    {
        // this.amplitudeMeter.clear();

        if (this.frameCounter > this.cmndfRetentionFrameCount)
        {
            this.frameCounter = 0;
            this.appCanvas.cmndsReset();
        }

        this.appCanvas.clear();
        this.appCanvas.drawAudio(this.processor.buffer);
        if (this.processor.lastEstimatedPitch) this.appCanvas.drawFrequency(this.processor.lastEstimatedPitch);
        if (this.processor.lastCmndCache) this.appCanvas.plotCmnds(this.processor.lastCmndCache, this.cmndfRetentionFrameCount);

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
        app.start();
    });

    // document.addEventListener('visibilitychange', () => {
    //      if (isInitialized && document.visibilityState === 'visible') {
    //          app.loop();
    //      }
    // });
}