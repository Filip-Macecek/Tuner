// @ts-nocheck
import { GREEN, WHITE, BACKGROUND_COLOR, INTUNE_TOLERANCE } from './globals.js';

export class PitchMeter
{
    constructor()
    {
        this.historyBufferSize = 400;
        this.historyBuffer = [];
    }

    initialize()
    {
        this.pitchScaleEl = document.getElementById("pitchScale");
        this.pitchScaleBBox = this.pitchScaleEl.getBBox();
        this.pitchScaleWidth = this.pitchScaleBBox.width;

        this.needleEl = document.getElementById("needle");

        this.toneNameEl = document.getElementById("toneName");
        this.stringNumberEl = document.getElementById("stringNumber");
        this.cent = document.getElementById("stringNumber");

        this.svg = document.getElementsByTagName("svg")[0];
        this.svgBBox = this.svg.getBBox();
        this.svgBRect = this.svg.getBoundingClientRect();
        this.scale = this.svgBRect.width / this.svg.viewBox.baseVal.width;

        this.canvasBoundsEl = document.getElementById("canvasBounds");
        this.canvasBoundsElRect = this.canvasBoundsEl.getBoundingClientRect();
        this.canvas = document.getElementById("mainCanvas");
        this.canvasBoundsBBox = this.canvasBoundsEl.getBBox(); 
        this.canvas.width = this.canvasBoundsBBox.width * this.scale;
        this.canvas.height = this.canvasBoundsBBox.height * this.scale;
        const canvasY = (this.canvasBoundsBBox.y * this.scale + this.svgBRect.y + window.scrollY);
        this.canvas.style.top = `${canvasY}px`;
        this.canvas.style.left = `${(this.canvasBoundsBBox.x * this.scale + this.svgBRect.x + window.scrollX)}px`;
        this.ctx = this.canvas.getContext("2d");

        // this.centText = document.getElementById("centsOffset").querySelector("tspan");
        // this.stringNumberText = document.getElementById("stringNumber").querySelector("tspan");
        this.toneNameText = document.getElementById("toneName").querySelector("tspan");
        this.sharpIcon = document.getElementById("sharp").querySelector("tspan");

        this.leftArrow = document.getElementById("leftArrow");
        this.rightArrow = document.getElementById("rightArrow");
    }

    update(cents, tone, stringNumber)
    {
        this.drawHistory();

        if (cents != null)
        {
            let normalizedCents = (cents + 50) / 100;
            this.moveNeedle(normalizedCents);
            // const roundedCents = Math.round(cents);

            // this.centText.textContent = roundedCents > 0 ? `+${roundedCents}` : roundedCents;
            // this.stringNumberText.textContent = stringNumber;
            this.toneNameText.textContent = `${tone.tone.baseTone}${tone.octave}`;
            this.toneNameText.style.fill = WHITE;
            this.sharpIcon.style.fill = tone.tone.isSharp ? WHITE : BACKGROUND_COLOR;
            this.leftArrow.style.fill = cents > 0 ? WHITE : BACKGROUND_COLOR;
            this.rightArrow.style.fill = cents < 0 ? WHITE : BACKGROUND_COLOR;
            const isTuned = Math.abs(cents) < INTUNE_TOLERANCE;
            if (isTuned)
            {
                this.leftArrow.style.fill = GREEN;
                this.rightArrow.style.fill = GREEN;
                this.toneNameText.style.fill = GREEN;

                if (tone.tone.isSharp)
                {
                    this.sharpIcon.style.fill = GREEN;
                }
            }

            this.historyBuffer.push({ normalizedCents: normalizedCents, inTune: isTuned });
        }
        else
        {
            this.moveNeedle(0);
            // this.centText.textContent = '-';
            // this.stringNumberText.textContent = '-';
            this.toneNameText.textContent = '';
            this.sharpIcon.style.fill = BACKGROUND_COLOR;
            this.sharpIcon.style.fill = BACKGROUND_COLOR;
            this.leftArrow.style.fill = BACKGROUND_COLOR;
            this.rightArrow.style.fill = BACKGROUND_COLOR;

            this.historyBuffer.push({ normalizedCents: -1000, inTune: false });
        }

        if(this.historyBuffer.length > this.historyBufferSize)
        {
            this.historyBuffer.shift();
        }
    }

    drawHistory()
    {
        let canvasRect = this.canvas.getBoundingClientRect();
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let points = []
        for (let i = this.historyBuffer.length - 1; i >= 0; i--)
        {
            let o = this.historyBuffer[i];
            let x = canvasRect.width * o.normalizedCents;
            let y = canvasRect.height / this.historyBufferSize * (this.historyBuffer.length - i);
            points.push({ x: x, y: y, color: o.inTune ? GREEN : WHITE });
        }

        const pointWidth = 2 * this.scale;
        // const notTunedColor = 0xFFFFFF;
        // const tunedColor = 0x87b37a;
        for (let i = 0; i < points.length - 1; i++)
        {
            let x = points[i].x;
            let y = points[i].y;
            this.ctx.beginPath();
            this.ctx.arc(x, y, pointWidth, 0, 2 * Math.PI);
            let alpha = 1 - (y / canvasRect.height) ** 4;
            // let colorProgression = Math.max(0, 1 - 2 * Math.abs((x / canvasRect.width) - 0.5) ** 0.68);
            let color = points[i].color;
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
    }

    // Applies gradient from base to target based on a normalized number k
    getColor(base, target, k)
    {
        const baseRed = (base & 0xFF0000) >> 16;
        const baseGreen = (base & 0x00FF00) >> 8;
        const baseBlue = (base & 0x0000FF);

        const targetRed = (target & 0xFF0000) >> 16;
        const targetGreen = (target & 0x00FF00) >> 8;
        const targetBlue = (target & 0x0000FF);

        const diffRed = targetRed - baseRed;
        const diffGreen = targetGreen - baseGreen;
        const diffBlue = targetBlue - baseBlue;

        return [baseRed + diffRed * k, baseGreen + diffGreen * k, baseBlue + diffBlue * k];
    }

    moveNeedle(normalizedCents)
    {
        let needleOffset = this.pitchScaleWidth * normalizedCents;
        this.needleEl.style.transform = `translate(${needleOffset}px, 0px)`;
    }
}
