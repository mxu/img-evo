// GA configurations
var polyCount = 50;
var polySides = 6;
var minAlpha = 0.2;
var maxAlpha = 0.8;
// Globals
var inCtx;
var inData;
var outCtx;
var imgWidth;
var imgHeight;

$(document).ready(function() {
    // Get image dimensions
    var img = $('#srcImg > img')[0];
    imgWidth = img.width;
    imgHeight = img.height;
    
    // Copy source image onto a canvas
    inCanvas = $('#srcImg > canvas')[0];
    inCanvas.width = imgWidth;
    inCanvas.height = imgHeight;
    inCtx = inCanvas.getContext('2d');
    inCtx.drawImage(img, 0, 0);
    // Store the pixel data for source image
    inData = inCtx.getImageData(0, 0, imgWidth, imgHeight).data;
    // Hide the original image DOM element
    img.style.display = 'none';

    // Setup output canvas
    outCanvas = $('#outImg > canvas')[0];
    outCanvas.width = imgWidth;
    outCanvas.height = imgHeight;
    outCtx = outCanvas.getContext('2d');
});

function drawRandom() {
    drawGenome(new Phenotype().genome);
}

function evalFitness() {
    var dif = 0;
    // Get the output canvas pixel data
    var outData = outCtx.getImageData(0, 0, imgWidth, imgHeight).data;
    // Image data stored as repeating array of RGBA
    for(var i = 0; i < outData.length; i++){
        // Accumulate square of differences of RGB values
        if(i%4 < 3) {
            var d = inData[i] - outData[i];
            dif += d * d;
        }
    }
    // Return fitness percentage
    var fitness = 1 - dif / (imgWidth * imgHeight * 3 * 255 * 255);
    return fitness;
}

// Get a random integer between 0 and n
function rInt(n) {
    return Math.floor(Math.random() * n);
}

function drawGenome(genome) {
    // Clear the canvas
    outCtx.fillStyle = '#fff';
    outCtx.fillRect(0, 0, imgWidth, imgHeight);
    // Number of genes to define each poly
    var polyGeneSize = 4 + polySides * 2;
    // Loop through the genome and draw each poly
    for(var i = 0; i < genome.length; i += polyGeneSize) {
        outCtx.fillStyle = 'rgba(' + genome[i] + ',' + genome[i+1] + ',' + genome[i+2] + ',' + genome[i+3] + ')';
        outCtx.beginPath();
        outCtx.moveTo(genome[i+4], genome[i+5]);
        for(var j = 1; j < polySides; j++)
            outCtx.lineTo(genome[i+5+j], genome[i+6+j]);
        outCtx.closePath();
        outCtx.fill();
    }
}

/***
* Phenotype Class
* @param p1: genome of parent 1
* @param p2: genome of parent 2
***/
function Phenotype(p1, p2) {
    this.genome = [];
    this.fitness = 0;

    if(p1 && p2) {
        // crossover
        // mutate
    } else {
        this.genome = this.spawn();
    }

    // set fitness    
}

// Generate random genome for initial population
Phenotype.prototype.spawn = function() {
    var genome = [];
    for(var i = 0; i < polyCount; i++) {
        // RGB components 0-255
        genome.push(rInt(256));
        genome.push(rInt(256));
        genome.push(rInt(256));
        // Alpha component 0-1
        genome.push(minAlpha + Math.random() * (maxAlpha - minAlpha));
        // Polygon vert coordinates
        for(var j = 0; j < polySides; j++) {
            genome.push(rInt(imgWidth));
            genome.push(rInt(imgHeight));
        }
    }
    return genome;
}
