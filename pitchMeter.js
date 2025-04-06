class PitchMeter 
{
    constructor() 
    {
        this.canvas = null;
        this.initialized = false;
    }

    initialize()
    {
        const pitchMeterElement = document.getElementById('pitch_meter');
        Guard.failIf(pitchMeterElement == null, "#pitch_meter not found.");

        this.canvas = document.createElement('canvas');
        this.canvas.width = pitchMeterElement.offsetWidth;
        this.canvas.height = pitchMeterElement.offsetHeight;
        pitchMeterElement.appendChild(this.canvas);

        window.addEventListener('resize', () => {
            this.canvas.width = pitchMeterElement.offsetWidth;
            this.canvas.height = pitchMeterElement.offsetHeight;
        });

        this.ctx = this.canvas.getContext("2d");

        this.initialized = true;
    }

    clear()
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPitchOffset(centsOffset)
    {
        const text = "Pitch Offset: " + centsOffset + " cents";
        this.ctx.font = "20px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "left";
        this.ctx.fillText(text, 0, 40);

        const rectWidth = this.canvas.width;
        const rectHeight = 40;
        const rectX = (this.canvas.width - rectWidth) / 2;
        const rectY = (this.canvas.height - rectHeight) / 2;

        this.ctx.fillStyle = "lightgray";
        this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

        let pitchCellX = ((centsOffset + 50) / 100) * rectWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(pitchCellX, rectY);
        this.ctx.lineTo(pitchCellX, rectY + rectHeight);
        this.ctx.strokeStyle = "red";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawReferenceTone(tone)
    {
        Guard.failIf(this.initialized === false, "PitchMeter not initialized.");
        if (!tone)
        {
            return;
        }

        this.ctx.font = "100px Arial";
        this.ctx.fillStyle = "#00ADB5";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(`${tone.tone}${tone.octave}`, this.canvas.width / 2, 3 * this.canvas.height / 4);
    }
}