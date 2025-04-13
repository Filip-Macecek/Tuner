class PitchMeter2
{
    constructor()
    {
        this.historyBufferSize = 500;
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
        this.canvas = document.getElementById("test");
        this.canvasBoundsBBox = this.canvasBoundsEl.getBBox(); 
        this.canvas.width = this.canvasBoundsBBox.width * this.scale;
        this.canvas.height = this.canvasBoundsBBox.height * this.scale;
        const canvasY = (this.canvasBoundsBBox.y * this.scale + this.svgBRect.y + window.scrollY);
        this.canvas.style.top = `${canvasY}px`;
        this.canvas.style.left = `${(this.canvasBoundsBBox.x * this.scale + this.svgBRect.x)}px`;

        this.centText = document.getElementById("centsOffset").querySelector("tspan");
        this.stringNumberText = document.getElementById("stringNumber").querySelector("tspan");
        this.toneNameText = document.getElementById("toneName").querySelector("tspan");
        this.sharpIcon = document.getElementById("sharp").querySelector("tspan");;
    }

    update(cents, tone, stringNumber)
    {
        let normalizedCents = (cents + 50) / 100;
        let needleOffset = this.pitchScaleWidth * normalizedCents;

        this.needleEl.style.transform = `translate(${needleOffset}px, 0px)`;

        let needleRect = this.needleEl.getBoundingClientRect();
        let canvasRect = this.canvas.getBoundingClientRect();
        let canvasBoundsRect = this.canvasBoundsEl.getBoundingClientRect();
        let historyWidth = canvasBoundsRect.width;
        let historyHeight = canvasBoundsRect.height;
        let historyPointsOffset = historyHeight / this.historyBufferSize;
        
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.historyBuffer.length; i++)
        {
            let x = canvasBoundsRect.left - canvasRect.left + (historyWidth * this.historyBuffer[i]);
            let j = this.historyBuffer.length - (i + 1);
            let y = needleRect.top + needleRect.height / 2 - canvasRect.top + historyPointsOffset * j;
            let alpha = historyHeight / y;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 6 * Math.PI);
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
            ctx.fill();   
        }

        const roundedCents = Math.round(cents);
        this.centText.textContent = roundedCents > 0 ? `+${roundedCents}` : roundedCents;
        this.stringNumberText.textContent = stringNumber ? stringNumber : '-';
        this.toneNameText.textContent = `${tone.tone.baseTone}${tone.octave}`;
        this.sharpIcon.style.fill = tone.tone.isSharp ? WHITE : BACKGROUND_COLOR;

        this.historyBuffer.push(normalizedCents);
        if(this.historyBuffer.length > this.historyBufferSize)
        {
            this.historyBuffer.shift();
        }

        // ctx.fillStyle = "white";
        // ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
