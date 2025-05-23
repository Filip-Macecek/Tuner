import { Guard } from './guard.js';

export interface FrequencyEstimation
{
    estimatedFrequency: number;
    confidence: number; // expressed as a number between 0 and 1 inclusive.
}

export class Processing
{
    public cmndCache: {};
    
    private samplingRate: any;
    private lagBounds: number[];
    private dfCache: {};

    constructor(samplingRate, frequencyBounds) {
        Guard.failIf(frequencyBounds.length != 2 || frequencyBounds.some(v => v < 1 || v > 20000), "Supported frequencies are 30 Hz up to 20 kHz")
        this.samplingRate = samplingRate;
        this.lagBounds = [Math.round(this.samplingRate / frequencyBounds[1]), Math.round(this.samplingRate / frequencyBounds[0])]
        this.dfCache = {};
        this.cmndCache = {};
    }

    getPeak(audioBuffer)
    {
        return audioBuffer.reduce((prevVal, currVal, _) => Math.abs(currVal) > prevVal ? Math.abs(currVal) : prevVal, 0);
    }

    getRms(audioBuffer)
    {
        let bufferLength = audioBuffer.length;
        let squareSum = audioBuffer.reduce((prevVal, currVal, _) => prevVal + currVal ** 2, 0);
        return Math.sqrt(squareSum/bufferLength);
    }
    
    getPeakDecibels(audioBuffer)
    {
        const amplitude = this.getPeak(audioBuffer);
        return Math.log10(amplitude) * 20;
    }

    getRmsDecibels(audioBuffer)
    {
        const amplitude = this.getRms(audioBuffer);
        return Math.log10(amplitude) * 20;
    }
    
    autocorellationFunction(audioBuffer, t, tau)
    {
        let result = 0;
        let bufferLength = audioBuffer.length
        for(let j = t; j < (bufferLength - tau); j++)
        {
            result = result + (audioBuffer[j] * audioBuffer[j + tau]);
        }

        return result;
    }
    
    differenceFunction(audioBuffer, lag)
    {
        let cachedDfValue = this.dfCache[lag];
        if (cachedDfValue != null)
        {
            return this.dfCache[lag];
        }
        let df = this.autocorellationFunction(audioBuffer, 0, 0) + this.autocorellationFunction(audioBuffer, lag, 0) - (2 * this.autocorellationFunction(audioBuffer, 0, lag));
        this.dfCache[lag] = df;
        return df;
    }

    cummulativeMeanNormalizedDifferenceFunction(audioBuffer, lag)
    {
        if (lag === 0)
        {
            return 1;
        }

        let df = this.differenceFunction(audioBuffer, lag);
        let sum = 0;
        for (let j = 1; j <= lag; j++)
        {
            sum += this.differenceFunction(audioBuffer, j);
        }

        if (sum !== 0)
        {
            return lag * df / sum;
        }
        else 
        {
            return lag * df / 10e-12;
        }
    }
    
    lagToFrequency(lag)
    {
        Guard.failIf(lag < 1, `Invalid lag ${lag}.`);
        return this.samplingRate / lag;
    }

    frequencyToLag(f)
    {
        Guard.failIf(f < 1, `Invalid frequency ${f}.`);
        return Math.round(this.samplingRate / f);
    }

    // TODO: If this starts returning wrong frequency, one possible reason is that the multiples of the lagCandidate returns lower df ... it could be fixed by specifying threshold, or research more.
    getEstimatedFrequency(audioBuffer, previousPitch, tolerance) : FrequencyEstimation
    {
        let minRes = Number.MAX_VALUE;   
        let lagCandidate = this.lagBounds[0];
        let acfResults = []
        let results = []

        for (let lag = this.lagBounds[0]; lag <= this.lagBounds[1]; lag++) {
            let cmnd = this.cummulativeMeanNormalizedDifferenceFunction(audioBuffer, lag);
            this.cmndCache[lag] = cmnd;
            results.push(cmnd);
            if (cmnd < minRes)
            {
                minRes = cmnd;
                lagCandidate = lag;
            }
            acfResults.push(`lag: ${lag} = ${cmnd}`);
        }

        let average = Math.max((results.reduce((prev, curr, _) => prev + curr, 0) / results.length), 10e-12);
        let confidence = 1 - (minRes / average);
        confidence = Math.max(0, Math.min(1, confidence));

        let estimatedFrequency = this.lagToFrequency(lagCandidate);

        // TODO: This is the previous pitch correlation. Maybe let's seperate it into it's own method.
        // TODO: This correlation will stop working if for example someone tunes high E and then low E immediatelly after. This needs to be tested.
        let harmonic = previousPitch == null ? 1 : [0.25, 0.5, 1, 2].reduce((prev, multiple, _) => {
            let offset = Math.abs(previousPitch - estimatedFrequency * multiple)
            if (offset <= tolerance)
            {
                const lag = this.frequencyToLag(estimatedFrequency * multiple);
                const res = this.cmndCache[lag];

                // TODO: Another parameter for tweaking
                if (Math.abs(res - minRes) < 0.5)
                {
                    return multiple;
                }
                else {
                    return prev;
                }
            }
            else 
            {
                return prev;
            }
        }, 1);

        return {
            estimatedFrequency: estimatedFrequency * harmonic,
            confidence: confidence
        }
    }
}