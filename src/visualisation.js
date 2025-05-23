// @ts-nocheck
export class AppCanvas
{
    constructor()
    {
        this.canvasEl = document.getElementById('canvas');
        this.ctx = this.canvasEl.getContext("2d");
        this.width = this.canvasEl.width;
        this.height = this.canvasEl.height;
        
        this.cmndsCanvasEl = document.getElementById('canvasCmnds');
        this.cmndsCtx = this.cmndsCanvasEl.getContext("2d");
        this.cmndsWidth = this.cmndsCanvasEl.width;
        this.cmndsHeight = this.cmndsCanvasEl.height;
        this.cmndsIndex = 0;
    }

    clear()
    {
        this.ctx.clearRect(0, 0, this.width, this.height); // Clear canvas
    }

    drawAmplitude(db, color)
    {
        let maxValue = 12;
        let minValue = -66;

        let normalizedDb = (db - minValue) / (maxValue - minValue);
        const barHeight = normalizedDb * this.height;
        const barWidth = this.width / 10;
        const x = 200;
        const y = this.height - barHeight;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, barWidth, barHeight); // Draw the amplitude tower
    }

    drawFrequency(f)
    {
        this.ctx.font = "48px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(`${f} Hz`, this.width / 2, this.height / 2);
    }
    
    drawAudio(audioBuffer)
    {
        const bufferLength = audioBuffer.length;
        const sliceWidth = this.width / bufferLength;

        this.ctx.beginPath();
        this.ctx.strokeStyle = "pink";
        this.ctx.lineWidth = 2;

        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = -audioBuffer[i] * 0.5 + 0.5; // Normalize to [0, 1]
            const y = v * this.height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                // TODO: this draws it inverted.
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }
        
        this.ctx.stroke();
    }

    drawText(text)
    {
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.fillText(text, 10, 10);
    }

    cmndsReset()
    {
        this.cmndsIndex = 0;
        this.cmndsCtx.clearRect(0, 0, this.width, this.height); // Clear canvas
    }

    plotCmnds(cmnds, totalFrames)
    {
        let cmndCache = cmnds;
        let i = this.cmndsIndex;
        const keys = Object.keys(cmndCache).map(Number).sort((a, b) => a - b);
        const maxKey = Math.max(...keys);
        const maxValue = Math.max(...Object.values(cmndCache));

        this.cmndsCtx.beginPath();
        const alpha = (i / totalFrames) * 255;
        this.cmndsCtx.strokeStyle = `rgb(255, ${alpha}, 255)`;
        this.cmndsCtx.lineWidth = 2;

        keys.forEach((key, index) => {
            const x = (key / maxKey) * this.cmndsWidth;
            const y = this.cmndsHeight - (cmndCache[key] / maxValue) * this.cmndsHeight;

            if (index === 0) {
                this.cmndsCtx.moveTo(x, y);
            } else {
                this.cmndsCtx.lineTo(x, y);
            }
        });
        
        this.cmndsCtx.stroke();
        this.cmndsIndex++;
    }
}
