import { AppAudio } from './audio.js';
import { Processing } from './Processing';
import { Music } from './music.js';
import { AUDIO_BUFFER_SIZE, ESTIMATION_CONFIDENCE_THRESHOLD } from './globals.js';
import { Guard } from './guard.js';

interface MusicalTone {
    tone: {
        name: string;
        isSharp: boolean;
        baseTone: string;
    };
    octave: number;
    toneFrequency: number;
}

export class Processor
{
    public buffer: Float32Array<ArrayBuffer>;
    public rms: number;
    public lastUnsmoothedPitch: number;
    public cents: number;
    public detectedTone: MusicalTone;
    public stringNumber: number;
    public lastCmndCache: {};

    private audio: AppAudio;
    private pastDetectedPitchSize: number;
    private pastDetectedPitches: number[];
    private smoothingFactor: number;
    private lastTime: Date;
    private sampleRate: number;
    private initialized: boolean;
    private detectedPitch: number;
    private peak: number;
    private lastConfidence: number;

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
        Guard.failIf(!this.initialized, "Audio processor is not");

        this.audio.captureNext(this.buffer);

        // Guard.failIf()
        // TODO: The frequencies could be dynamically changed
        // TOOD: The processing could also be correlated to FFT analysis for better result. 
        let processing = new Processing(this.sampleRate, [80, 340]);

        this.detectTone(processing);
        this.cents = this.detectedTone ? Music.getCentsDistance(this.detectedPitch, this.detectedTone.toneFrequency) : null;
        this.stringNumber = this.detectedTone ? Music.getStringNumber(this.detectedTone) : null;

        this.peak = processing.getPeakDecibels(this.buffer);
        this.lastTime = new Date();
    }

    detectTone(processing: Processing)
    {
        this.rms = processing.getRmsDecibels(this.buffer);
        // Complete silnce is somewhere between -55 to -65
        if (this.rms <= -53)
        {
            this.resetDetectedPitch();
            return;
        }

        // TODO: last parameter is the tolerance.. it should increase with lowering frequency
        let estimation = processing.getEstimatedFrequency(this.buffer, this.detectedPitch, 2);
        this.lastCmndCache = processing.cmndCache;
        this.lastUnsmoothedPitch = estimation.estimatedFrequency;
        this.lastConfidence = estimation.confidence;

        // TODO: Confidence tend to change based on the processing frequency range.. also needs to be adjusted dynamically.
        if (estimation.confidence >= ESTIMATION_CONFIDENCE_THRESHOLD)
        {
            this.pastDetectedPitches.push(this.lastUnsmoothedPitch);
        }
        if (this.pastDetectedPitches.length > this.pastDetectedPitchSize)
        {
            this.pastDetectedPitches.shift();
        }

        if (this.detectedPitch && estimation.confidence >= ESTIMATION_CONFIDENCE_THRESHOLD)
        {
            let estimatedTone = Music.getClosestTone(estimation.estimatedFrequency);

            // assuming this means a new string was plucked.
            if (estimatedTone.tone.name != this.detectedTone.tone.name)
            {
                this.resetDetectedPitch();
            }
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

        this.detectedTone = this.detectedPitch ? Music.getClosestTone(this.detectedPitch) : null;
    }

    private resetDetectedPitch() {
        this.detectedTone = null;
        this.detectedPitch = null;
        this.pastDetectedPitches = [];
    }
}