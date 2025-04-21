class Oscillator extends AudioWorkletProcessor {
    constructor() {
        super();
        this.step = 0;
        this.freq = 110;
    }
  
    process(inputs, outputs, parameters) {
        const output = outputs[0][0]; // mono channel
        const amplitude = 1;

        // Generate a sine wave with a 440 Hz frequency and offset by half a period
        let max = this.step + output.length;
        for (let i = 0; i < max; i++) {
            let step = this.step + i;
            let sinVal = Math.sin(2 * Math.PI * this.freq * amplitude * step / sampleRate);
            output[i] = sinVal;
        }

        this.step += output.length;

        // Prevents overflowing the step.
        if (this.step > sampleRate)
        {
            this.step -= sampleRate;
        }

        return true;
    }
  }
  
  registerProcessor('Oscillator', Oscillator);