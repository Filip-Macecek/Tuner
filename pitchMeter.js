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
        // const text = "Pitch Offset: " + centsOffset + " cents";
        // this.ctx.font = "20px Arial";
        // this.ctx.fillStyle = "white";
        // this.ctx.textAlign = "left";
        // this.ctx.fillText(text, 0, 40);

        // Scale
        const scaleWidth = this.canvas.width * 0.95;
        const scaleHeight = 5;
        const scaleX = (this.canvas.width - scaleWidth) / 8 * 2;
        const scaleY = (this.canvas.height - scaleHeight) / 8 * 2;

        const needleHeight = this.canvas.height / 16;

        this.ctx.fillStyle = "white";
        this.ctx.fillRect(scaleX, scaleY + (needleHeight - scaleHeight) / 2, scaleWidth, scaleHeight);

        let pitchCellX = ((centsOffset + 50) / 100) * scaleWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(pitchCellX, scaleY);
        this.ctx.lineTo(pitchCellX, scaleY + 30);
        this.ctx.strokeStyle = "#D7263D";
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
        this.ctx.fillStyle = "#2DBCDE";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(`${tone.tone}${tone.octave}`, this.canvas.width / 2, 3 * this.canvas.height / 4);
    }
}