// @ts-nocheck
import { Guard } from './guard.js';

export class AmplitudeMeter 
{
    constructor() 
    {
        this.canvas = null;
        this.initialized = false;
    }

    initialize()
    {
        this.canvas = document.getElementById('amplitude_meter');
        Guard.failIf(this.canvas == null, "#amplitude_meter not found.");
        this.ctx = this.canvas.getContext("2d");
        this.initialized = true;
    }

    clear()
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawAmplitude(db)
    {
        Guard.failIf(this.initialized === false, "AmplitudeMeter not initialized.")

        let maxValue = 12;
        let minValue = -66;

        let normalizedDb = Math.max(0, Math.min(1, (db - minValue) / (maxValue - minValue)));
        const barHeight = normalizedDb * this.canvas.height;
        const y = this.canvas.height - barHeight;

        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(0, y, this.canvas.width, barHeight); // Draw the amplitude tower
    }
}