console.log("Processor start.");

import "globals.js";
import "audio.js";

function loop()
{
    console.log("start of loop.");
    let detectedPitches = [];
    let detectedPitchesBufferSize = 120;
    let prevTone = null;
    let previousPitch = null;

    while (true)
    {
        audio.captureNext();

        let processing = new Processing(audio.getSamplingRate(), [30, 440]);
        let estimation = processing.getEstimatedFrequency(audio.audioBuffer, previousPitch, 2);
        let detectedPitch = estimation.estimatedFrequency;

        if (estimation.confidence > 0.8)
        {
            detectedPitches.push(detectedPitch);
        }

        if (detectedPitches.length > detectedPitchesBufferSize)
        {
            detectedPitches.shift();
        }
        let smoothedPitch = detectedPitches.length >= 1 ? smoothOut(detectedPitches) : 25;
        const closestTone = Music.getClosestTone(smoothedPitch);
        const cents = closestTone ? Music.getCentsDistance(smoothedPitch, closestTone.toneFrequency) : -50;

        if (prevTone != closestTone.tone)
        {
            detectedPitches = [];
            previousPitch = null;
        }
        prevTone = closestTone.tone;
        previoiusPitch = smoothedPitch;

        const peak = processing.getPeakDecibels(audio.audioBuffer);
        const rms = processing.getRmsDecibels(audio.audioBuffer);
        const stringNumber = Music.getStringNumber(closestTone);

        postMessage({ 
            rms,
            cents,
            closestTone,
            detectedPitch,
            smoothedPitch,
            cmndCache: processing.cmndCache,
            confidence: estimation.confidence,
            stringNumber
        });
    }
}

let audio = new AppAudio();
console.log("audio instance.")
await audio.startAsync();
console.log("after await start async");
loop(); // TODO: error handling

