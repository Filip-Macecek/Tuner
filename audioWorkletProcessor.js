import Processing from "./processing.js"

class TunerAudioProcessor extends AudioWorkletProcessor
{
    constructor()
    {
        super();
        // 110 Hz == lag 436, 440 Hz = lag 109 .. if sample rate is 48kHz.. maybe this could be tweaked somehow based on the string being played. 
        // if for example low string is being played, the buffer needs to be much higher. But if a high string is being played, only a very small buffer should be sufficient.
        // i wonder what is the perfect number of steps through buffer are necessary for the computation to be accurate?
        // TODO: Figure out how to dynamically adjust the size.
        // TODO: Confirm the theory that lower buffersize means less accuracy on lower frequencies.
        // this.bufferSize = 2048;
        this.bufferSize = 1536;
        this.buffer2 = [];
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferPointer = 0;
        this.bufferIsFull = false;

        this.pastDetectedPitchSize = 200; // TODO: this could be dynamically controller
        this.pastDetectedPitches = [];
        this.smoothingFactor = 0.038

        this.lastTime = new Date();
    }

    process(inputList, outputList, parameters)
    {
        if (inputList.length === 0)
        {
            return true;
        }

        let inputChannels = inputList[0];
        if (inputChannels.length === 0)
        {
            return true;
        }

        let now = new Date();
        let inputData = inputChannels[0];
        this.adjustBuffer(inputData);

        this.buffer2.push(... inputData);

        if (this.bufferIsFull)
        {
            // TODO: Lets count these errors per second to confirm the theory about input being skipped because this takes too long!
            let inputError = this.detectDiscontinuity(this.buffer);
            if (inputError)
            {
                // Reset buffer on error in continuity of the signal. We need to stop processing that particular case so we do not introduce error
                this.buffer = new Float32Array(this.bufferSize);
                this.bufferPointer = 0;
                this.bufferIsFull = false;
                this.buffer2 = [];
            }
        }

        if (this.bufferIsFull)
        {
            this.processBuffer([...this.buffer]);

            // Check the simple buffer against the faster one for potential issues in adjust buffer algorithm.
            if (this.buffer2.length === this.bufferSize)
            {
                for (let i = 0; i < this.bufferSize; i++)
                {
                    if (this.buffer2[i] !== this.buffer[i])
                    {
                        throw new Error("MISMATCH!")
                    }
                }
            }
    
            // reset the simple buffer
            if (this.buffer2.length > this.bufferSize)
            {
                this.buffer2 = [];
            }
        }

        console.log(`processing time: ${new Date() - now}ms`)

        return true;
    }

    detectDiscontinuity(buffer)
    {
        for (let i = 1; i < buffer.length; i++)
        {
            let prev = buffer[i - 1];
            let current = buffer[i];
            let distance = Math.abs(prev - current);

            // TODO: Another random parameter :)
            if (distance > 0.05)
            {
                console.log(`Discontinuity Detected! at index ${i} with index ${i - 1}.Values ${prev} : ${current}; distance: ${distance}`);
                return true;
            }
        }

    }

    adjustBuffer(inputData)
    {
        if (inputData.length > this.bufferSize) throw new Error("input data too big.");

        // console.log(`adjustBuffer: input len ${inputData.length}; bufferPointer: ${this.bufferPointer}; zero count: ${this.buffer.reduce((s, c) => s + (c === 0 ? 1 : 0), 0)};`);
        // console.log(`INPUT zero count: ${inputData.reduce((s, c) => s + (c === 0 ? 1 : 0), 0)};`);
        if (this.bufferPointer >= this.bufferSize)
        {
            this.bufferIsFull = true;
            // console.log("SHIFTING")
            // needs shifting.
            let howMuchShift = this.bufferSize - inputData.length;
            for (let i = 0; i < howMuchShift; i++) {
                this.buffer[i] = this.buffer[i + inputData.length];
            }
            this.bufferPointer = this.bufferPointer - inputData.length;
        }

        for(let i = 0; i < inputData.length; i++)
        {
            if ((this.bufferPointer + i) >= this.bufferSize) throw new Error("Buffer overflow.");
            this.buffer[this.bufferPointer + i] = inputData[i];
        }
        this.bufferPointer += inputData.length;
        // console.log(`adjusting buffer duration: ${new Date() - before}ms`)
    }

    processBuffer(buffer)
    {
        // TODO: This could be dynamically changed
        // TOOD: The processing could also be correlated to FFT analysis for better result. 
        let processing = new Processing(sampleRate, [80, 340]);
        let before = new Date();
        let estimation = processing.getEstimatedFrequency(buffer, this.lastDetectedPitch, 2);
        let estimatedPitch = estimation.estimatedFrequency;
        console.log(`Estimating pitch duration: ${new Date() - before}ms. Pitch: ${estimatedPitch}; confidence: ${estimation.confidence}`);

        // TODO: Confidence tend to change based on the processing frequency range.. also needs to be adjusted dynamically.
        if (estimation.confidence >= 0.8)
        {
            this.pastDetectedPitches.push(estimatedPitch);
        }
        if (this.pastDetectedPitches.length > this.pastDetectedPitchSize)
        {
            this.pastDetectedPitches.shift();
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
            this.lastDetectedPitch = smoothedAverage;
            this.port.postMessage({ pitch: smoothedAverage, audioBuffer: buffer, audioBuffer2: this.buffer2, cmndCache: processing.cmndCache});
        }
    }
}

registerProcessor("TunerAudioProcessor", TunerAudioProcessor)