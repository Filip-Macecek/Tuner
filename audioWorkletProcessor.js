import Processing from "./processing.js"

class TunerAudioProcessor extends AudioWorkletProcessor
{
    constructor()
    {
        super();
        // 110 Hz == lag 436, 440 Hz = lag 109 .. if sample rate is 48kHz.. maybe this could be tweaked somehow based on the string being played. 
        // if for example low string is being played, the buffer needs to be much higher. But if a high string is being played, only a very small buffer should be sufficient.
        // i wonder what is the perfect number of steps through buffer are necessary for the computation to be accurate?
        this.bufferSize = 2048;
        this.buffer = [];
        this.pastDetectedPitchSize = 12; // When fps is 25, 12 is equal to ~500 ms
        this.pastDetectedPitches = [];
        this.smoothingFactor = 0.05

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

        let inputData = inputChannels[0];
        this.buffer.push(... inputData);

        if (this.buffer.length >= this.bufferSize)
        {
            const now = new Date(); 
            const fps = 1000 / (now - this.lastTime);
            this.processBuffer(fps);
            // console.log(`Sampling rate: ${sampleRate}, detected pitch: ${detectedPitch}, confidence: ${estimation.confidence}, fps: ${processingTime}`);
            this.lastTime = now;
            this.buffer = [];
        }
        
        return true;
    }

    processBuffer(fps)
    {
        let processing = new Processing(sampleRate, [30, 440]);
        let estimation = processing.getEstimatedFrequency(this.buffer, this.lastDetectedPitch, 2);
        let estimatedPitch = estimation.estimatedFrequency;

        if (estimation.confidence >= 0.8)
        {
            this.pastDetectedPitches.push(estimatedPitch);
        }
        if (this.pastDetectedPitches.length > this.pastDetectedPitchSize)
        {
            this.pastDetectedPitches.shift();
        }

        if (this.pastDetectedPitches.length > 0)
        {
            let smoothedAverage = this.pastDetectedPitches[0];
            for (let i = 1; i < this.pastDetectedPitches.length; i++)
            {
                smoothedAverage = smoothedAverage + this.smoothingFactor * (this.pastDetectedPitches[i] - smoothedAverage);
            }
            this.lastDetectedPitch = smoothedAverage;
            this.port.postMessage({ pitch: smoothedAverage });
        }
    }

    
    // EXAMPLE!!!
    // process(inputList, outputList, parameters)
    // {
    //     const gain = 1;
    //     const sourceLimit = Math.min(inputList.length, outputList.length);
    //     console.log(`sourceLimit: ${sourceLimit}`);
    //     console.log(`inputListLength: ${inputList.length}`);
    //     console.log(`inputList: ${JSON.stringify(inputList)}`);
    //     console.log(`outputListLength: ${outputList.length}`);
    //     console.log(`outputList: ${JSON.stringify(outputList)}`);
    
    //     for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
    //         let input = inputList[inputNum];
    //         let output = outputList[inputNum];
    //         let channelCount = Math.min(input.length, output.length);

    //         console.log(`inputLength: ${input.length}`);
    //         console.log(`outputLength: ${output.length}`);
    //         console.log(`channelCount: ${channelCount}`);
    
    //         // The input list and output list are each arrays of
    //         // Float32Array objects, each of which contains the
    //         // samples for one channel.
        
    //         for (let channel = 0; channel < channelCount; channel++) {
    //             let sampleCount = input[channel].length;
    
    //             for (let i = 0; i < sampleCount; i++) {
    //                 let sample = input[channel][i];
    //                 let rnd = 2 * (Math.random() - 0.5); // Range: -1 to 1

    //                 sample = sample + rnd * gain;

    //                 // Prevent clipping

    //                 if (sample > 1.0) {
    //                     sample = 1.0;
    //                 } else if (sample < -1.0) {
    //                     sample = -1.0;
    //                 }

    //                 output[channel][i] = sample;
    //             }
    //         } 
    //     }
    
    //     return true;
    // }
}

registerProcessor("TunerAudioProcessor", TunerAudioProcessor)

// function loop()
// {
//     let detectedPitches = [];
//     let detectedPitchesBufferSize = 120;
//     let prevTone = null;
//     let previousPitch = null;

//     while (true)
//     {
//         audio.captureNext();

//         let processing = new Processing(audio.getSamplingRate(), [30, 440]);
//         let estimation = processing.getEstimatedFrequency(audio.audioBuffer, previousPitch, 2);
//         let detectedPitch = estimation.estimatedFrequency;

//         if (estimation.confidence > 0.8)
//         {
//             detectedPitches.push(detectedPitch);
//         }

//         if (detectedPitches.length > detectedPitchesBufferSize)
//         {
//             detectedPitches.shift();
//         }
//         let smoothedPitch = detectedPitches.length >= 1 ? smoothOut(detectedPitches) : 25;
//         const closestTone = Music.getClosestTone(smoothedPitch);
//         const cents = closestTone ? Music.getCentsDistance(smoothedPitch, closestTone.toneFrequency) : -50;

//         if (prevTone != closestTone.tone)
//         {
//             detectedPitches = [];
//             previousPitch = null;
//         }
//         prevTone = closestTone.tone;
//         previoiusPitch = smoothedPitch;

//         const peak = processing.getPeakDecibels(audio.audioBuffer);
//         const rms = processing.getRmsDecibels(audio.audioBuffer);
//         const stringNumber = Music.getStringNumber(closestTone);

//         postMessage({ 
//             rms,
//             cents,
//             closestTone,
//             detectedPitch,
//             smoothedPitch,
//             cmndCache: processing.cmndCache,
//             confidence: estimation.confidence,
//             stringNumber
//         });
//     }
// }

// let audio = new AppAudio();
// await audio.startAsync();
// loop(); // TODO: error handling

