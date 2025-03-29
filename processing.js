class Processing
{
    constructor(samplingRate, frequencyBounds) {
        Guard.failIf(frequencyBounds.length != 2 || frequencyBounds.some(v => v < 1 || v > 20000), "Supported frequencies are 30 Hz up to 20 kHz")
        this.samplingRate = samplingRate;
        this.lagBounds = [Math.round(this.samplingRate / frequencyBounds[1]), Math.round(this.samplingRate / frequencyBounds[0])]
        this.dfCache = {};
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
        if (cachedDfValue)
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

        return lag * df / sum;
    }
    
    lagToFrequency(lag)
    {
        Guard.failIf(lag < 1, `Invalid lag ${lag}.`);
        return this.samplingRate / lag;
    }

    // TODO: If this starts returning wrong frequency, one possible reason is that the multiples of the lagCandidate returns lower df ... it could be fixed by specifying threshold, or research more.
    getEstimatedFrequency(audioBuffer)
    {
        let prevRes = Number.MAX_VALUE;   
        let lagCandidate = this.lagBounds[0];
        let acfResults = []

        for (let lag = this.lagBounds[0]; lag <= this.lagBounds[1]; lag++) {
            let df = this.cummulativeMeanNormalizedDifferenceFunction(audioBuffer, lag);
            if (df < prevRes)
            {
                prevRes = df;
                lagCandidate = lag;
            }
            acfResults.push(`lag: ${lag} = ${df}`);
        }

        return this.lagToFrequency(lagCandidate);
    }
}