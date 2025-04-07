class Music 
{
    static SEMITONE_RATIO = 1.0594630943592953;

    static A_OCTAVES = [13.75, 27.5, 55, 110, 220, 440, 880, 1760, 3520, 7040];

    static TONE_NAMES = ["A", "A#/Bb", "B", "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A"];

    static TONENAME_TO_STRING = { "E1" : 1, "A1" : 2, "D2" : 3, "G2" : 4, "B2" : 5, "E3" : 6 };

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
            tone: Music.TONE_NAMES[semitoneOffset],
            octave: 1,
            toneFrequency: closestToneFrequency
        };
    }

    static getStringNumber(toneName)
    {
        if (Music.TONENAME_TO_STRING[toneName])
        {
            return Music.TONENAME_TO_STRING[toneName];
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