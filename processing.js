class Processing
{
    static TauMax = 500;

    static getPeak(audioBuffer)
    {
        return audioBuffer.reduce((prevVal, currVal, _) => Math.abs(currVal) > prevVal ? Math.abs(currVal) : prevVal, 0);
    }

    static getRms(audioBuffer)
    {
        let bufferLength = audioBuffer.length;
        let squareSum = audioBuffer.reduce((prevVal, currVal, _) => prevVal + currVal ** 2, 0);
        return Math.sqrt(squareSum/bufferLength);
    }
    
    static getPeakDecibels(audioBuffer)
    {
        const amplitude = Processing.getPeak(audioBuffer);
        return Math.log10(amplitude) * 20;
    }

    static getRmsDecibels(audioBuffer)
    {
        const amplitude = Processing.getRms(audioBuffer);
        return Math.log10(amplitude) * 20;
    }
    
    static autocorellationFunction(audioBuffer, t, tau)
    {
        let result = 0;
        let bufferLength = audioBuffer.length
        for(let j = t; j < (bufferLength - tau); j++)
        {
            result = result + (audioBuffer[j] * audioBuffer[j + tau]);
        }

        return result;
    }
    
    static differenceFunction(audioBuffer, lag)
    {
        return this.autocorellationFunction(audioBuffer, 0, 0) + this.autocorellationFunction(audioBuffer, lag, 0) - (2 * this.autocorellationFunction(audioBuffer, 0, lag));
    }

    static cummulativeMeanNormalizedDifferenceFunction(audioBuffer, lag)
    {
        if (lag === 0)
        {
            return 1;
        }


        let df = Processing.differenceFunction(audioBuffer, lag);
        let sum = 0;
        for (let j = 1; j <= lag; j++)
        {
            sum += Processing.differenceFunction(audioBuffer, j);
        }

        return lag * df / sum;
    }
    
    static getLags(frequencyBounds, samplingRate)
    {
        Guard.failIf(frequencyBounds.length != 2 || frequencyBounds.some(v => v < 1 || v > 20000), "Supported frequencies are 30 Hz up to 20 kHz")

        let result = {};
        for (let f = frequencyBounds[0] - 1; f <= frequencyBounds[1] + 1; f++)
        {
            result[f] = Math.round(samplingRate / f);
        }

        return result;
    }

    static getEstimatedFrequency(audioBuffer, frequencyBounds, samplingRate)
    {
        let prevRes = Number.MAX_VALUE;   
        let fCandidates = [];
        let acfResults = []

        let lags = Processing.getLags(frequencyBounds, samplingRate);

        for (let frequency in lags) {
            let lag = lags[frequency];
            let df = Processing.cummulativeMeanNormalizedDifferenceFunction(audioBuffer, lag);
            if (df < prevRes)
            {
                prevRes = df;
                fCandidates = [Number(frequency)];
            }

            // TODO: Improve so it does not calculate over the same lag twice
            if (df === prevRes)
            {
                fCandidates.push(Number(frequency));
            }
            acfResults.push(`f: ${frequency}, lag: ${lag} = ${df}`);
        }
        
        return fCandidates.reduce((s, f, _) => f + s, 0) / fCandidates.length;
    }
}