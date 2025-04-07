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
        this.scale = this.svg.getBoundingClientRect().width / this.svg.getBBox().width;

        this.canvasBoundsEl = document.getElementById("canvasBounds");
        this.canvasBoundsElRect = this.canvasBoundsEl.getBoundingClientRect();
        this.canvas = document.getElementById("test");
        this.canvas.width = this.canvas.parentElement.getBoundingClientRect().width;
        this.canvas.height = this.canvas.parentElement.getBoundingClientRect().height;
        this.canvas.style.position = 'absolute';
        this.canvas.style.zIndex = '1';

        this.centText = document.getElementById("centsOffset");
        this.stringNumberText = document.getElementById("stringNumber");
        this.toneNameText = document.getElementById("toneName");
    }

    update(cents, toneName, stringNumber)
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
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 12 * Math.PI);
            ctx.fillStyle = "white";
            ctx.fill();   
        }

        this.centText.textContent = Math.round(cents);
        this.stringNumberText.textContent = stringNumber;
        this.toneNameText.textContent = toneName;

        this.historyBuffer.push(normalizedCents);
        if(this.historyBuffer.length > this.historyBufferSize)
        {
            this.historyBuffer.shift();
        }
    }
}
