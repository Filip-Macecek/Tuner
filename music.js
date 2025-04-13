class Music 
{
    static SEMITONE_RATIO = 1.0594630943592953;

    static A_OCTAVES = [13.75, 27.5, 55, 110, 220, 440, 880, 1760, 3520, 7040];

    static TONES = [
        { name: "A", isSharp: false, baseTone: "A" },
        { name: "A#/Bb", isSharp: true, baseTone: "A" },
        { name: "B", isSharp: false, baseTone: "B" },
        { name: "C", isSharp: false, baseTone: "C" },
        { name: "C#/Db", isSharp: true, baseTone: "C" },
        { name: "D", isSharp: false, baseTone: "D" },
        { name: "D#/Eb", isSharp: true, baseTone: "D" },
        { name: "E", isSharp: false, baseTone: "E" },
        { name: "F", isSharp: false, baseTone: "F" },
        { name: "F#/Gb", isSharp: true, baseTone: "F" },
        { name: "G", isSharp: false, baseTone: "G" },
        { name: "G#/Ab", isSharp: true, baseTone: "G" },
        { name: "A", isSharp: false, baseTone: "A" }
    ];

    static TONEANDOCTAVE_TO_STRINGNUMBER = { "E1" : 1, "A1" : 2, "D2" : 3, "G2" : 4, "B2" : 5, "E3" : 6 };

    static getClosestTone(frequency)
    {
        if (!frequency || frequency < Music.A_OCTAVES[0])
        {
            return null;
        }

        let referenceTone;
        for (let i = 0; i < this.A_OCTAVES.length; i++) {
            let octaveTone = this.A_OCTAVES[i];
            if (octaveTone < frequency) {
                referenceTone = octaveTone;
            }
            else {
                break;
            }
        }

        let semitoneOffset = 0;
        let minDistance = Number.MAX_VALUE;
        let closestToneFrequency = 0;
        for (let i = 0; i < 13; i++)
        {
            let distance = Math.abs(referenceTone - frequency);
            if (distance > minDistance)
            {
                break;
            }
            if (distance <= minDistance)
            {
                minDistance = distance;
                semitoneOffset = i;
                closestToneFrequency = referenceTone;
            }
            referenceTone = referenceTone * Music.SEMITONE_RATIO;
        }

        return {
            tone: Music.TONES[semitoneOffset],
            octave: 1,
            toneFrequency: closestToneFrequency
        };
    }

    static getStringNumber(tone)
    {
        const stringNumber = Music.TONEANDOCTAVE_TO_STRINGNUMBER[`${tone.name}${tone.octave}`];
        if (stringNumber)
        {
            return stringNumber;
        }
        else
        {
            return 0; // TODO
        }
    }

    static getCentsDistance(tone, refTone)
    {
        Guard.failIf(!tone || !refTone, "Both tone and reference tone must be provied.");

        let difference = tone - refTone;
        let scale = 0;
        if (difference < 0)
        {
            let lowerSemitone = refTone / Music.SEMITONE_RATIO;
            scale = refTone - lowerSemitone;
        }
        else
        {
            let higherSemitone = refTone * Music.SEMITONE_RATIO;
            scale = higherSemitone - refTone;
        }

        let cents = 100 * difference / scale;
        return cents;
    }
}