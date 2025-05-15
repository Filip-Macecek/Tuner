import { AmplitudeMeter } from "./amplitudeMeter.js";
import { DEBUG_MODE } from "./globals.js";
import { PitchMeter } from "./pitchMeter.js";
import { Processor } from "./Processor";
import { AppCanvas } from "./visualisation.js";

class App
{
    private pitchMeter: PitchMeter;
    private processor: Processor;

    // Used for debug.
    private frameCounter: number;
    private cmndfRetentionFrameCount: number;
    private appCanvas: AppCanvas;
    private amplitudeMeter: AmplitudeMeter;
    private processTimeoutId: any;
    private animationFrameRequestId: any;

    constructor()
    {
        this.pitchMeter = new PitchMeter();
        this.processor = new Processor();

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

        // clear the timeouts and start fresh in case this is called multiple times.
        this.stop();

        this.process();
        this.draw();
    }

    stop()
    {
        if (this.processTimeoutId)
        {
            clearTimeout(this.processTimeoutId);
        }

        if (this.animationFrameRequestId)
        {
            cancelAnimationFrame(this.animationFrameRequestId);
        }
    }

    process()
    {
        this.processor.process();
        this.processTimeoutId = setTimeout(this.process.bind(this), 1); // TODO: This parameter
    }

    draw()
    {
        // console.log(`cents calculation: result: ${cents}, detectedPitch: ${detectedPitch}, smoothedPitch: ${smoothedPitch}, closestToneFrequency: ${closestTone.toneFrequency}, confidence: ${confidence}}`);
        this.pitchMeter.update(this.processor.cents, this.processor.detectedTone, this.processor.stringNumber);

        if (DEBUG_MODE === true) this.drawDebug();

        this.animationFrameRequestId = requestAnimationFrame(this.draw.bind(this));
    }

    drawDebug()
    {
        this.amplitudeMeter.clear();
        this.amplitudeMeter.drawAmplitude(this.processor.rms);

        if (this.frameCounter > this.cmndfRetentionFrameCount)
        {
            this.frameCounter = 0;
            this.appCanvas.cmndsReset();
        }

        this.appCanvas.clear();
        this.appCanvas.drawAudio(this.processor.buffer);
        if (this.processor.lastUnsmoothedPitch) this.appCanvas.drawFrequency(this.processor.lastUnsmoothedPitch);
        if (this.processor.lastCmndCache) this.appCanvas.plotCmnds(this.processor.lastCmndCache, this.cmndfRetentionFrameCount);

        this.frameCounter++;
    }
}

if (document.readyState === 'complete') {
    initializeApp();
    // Wait for the load event
    window.addEventListener('load', initializeApp);
}

function toggleProcessing(app)
{
    if (document.visibilityState === 'visible')
    {
        app.start();
    }
    if (document.visibilityState === 'hidden')
    {
        app.stop();
    }  
}

function initializeApp() {
    let app = new App();
    let initPromise = app.initAsync();
    initPromise.then(() => {
        toggleProcessing(app);

        document.addEventListener('visibilitychange', () => {
            toggleProcessing(app);
        });

        // For debouncing the resize
        let resizeTimeoutId = null;
        const resizeDebounceMs = 150;
        // Doesn't work too well :/
        // This is also called on Zoom
        addEventListener('resize', () =>
        {
            if (resizeTimeoutId !== null)
            {
                clearTimeout(resizeTimeoutId);
            }

            resizeTimeoutId = setTimeout(() => 
            {
                console.log("Reloading the app.")
                location.reload();
            }, resizeDebounceMs);
        });
    });
};

initializeApp();