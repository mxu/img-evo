// GA configurations
var polyCount = 50;
var polySides = 6;
var minAlpha = 0.1;
var maxAlpha = 0.6;
var popSize = 20;
var popElite = 0.25;
var polyGeneSize = 4 + polySides * 2;
var hardMutate = 0.001;
var softMutate = 0.01;
var softMutateDrift = 0.1;
var addPoly = 0.05;
// Globals
var inCtx;
var inData;
var outCtx;
var imgWidth;
var imgHeight;
var runTimer;
var startTime;

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

// Primary loop
function run() {
    // Reset timer
    if(runTimer) {
        clearTimeout(runTimer);
        runTimer = 0;
    }
    // Create initial population
    var pop = new Population(popSize);
    var gen = 0;

    function update() {
        pop.genStep();
        gen++;
        var bestFit = pop.getBestFit();
        drawGenome(bestFit.genome);
        var runTime = ((new Date().getTime() - startTime) / 1000);
        log("Generation: " + gen,
            "Best fit: " + (bestFit.fitness * 100).toFixed(6) + "%",
            "Polygons: " + (bestFit.genome.length / polyGeneSize),
            "Time: " + runTime.toFixed(2),
            "Time per gen: " + (runTime / gen).toFixed(2));
        runTimer = setTimeout(update, 10);
    }
    startTime = new Date().getTime();
    update();
}

// Output information to the page
function log() {
    var args = [];
    for(var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);
    $('#console > textarea').text(args.join("\r\n"));
}

// Get a random integer between 0 and n
function rInt(n) {
    return Math.floor(Math.random() * n);
}

// Draw a genome onto the output canvas
function drawGenome(genome) {
    // Clear the canvas
    outCtx.fillStyle = '#000';
    outCtx.fillRect(0, 0, imgWidth, imgHeight);
    // Loop through the genome and draw each poly
    for(var i = 0; i < genome.length; i += polyGeneSize) {
        outCtx.fillStyle = 'rgba(' + Math.floor(genome[i] * 255) +
            ',' + Math.floor(genome[i+1] * 255) +
            ',' + Math.floor(genome[i+2] * 255) +
            ',' + genome[i+3] + ')';
        outCtx.beginPath();
        outCtx.moveTo(genome[i+4] * imgWidth, genome[i+5] * imgHeight);
        for(var j = 1; j < polySides; j++)
            outCtx.lineTo(genome[i+5+j] * imgWidth, genome[i+6+j] * imgHeight);
        outCtx.closePath();
        outCtx.fill();
    }
    return outCtx.getImageData(0, 0, imgWidth, imgHeight).data;
}

// Sort phenotypes by fitness comparator
function fitSort(a, b) {
    return b.fitness - a.fitness;
}

// Calculate a random bounded mutation
function mutate(n, lower, upper) {
    var result = n + (Math.random() < 0.5 ? -1 : 1) * Math.random() * softMutateDrift * (upper - lower);
    if (result < lower) result = lower;
    if (result > upper) result = upper;
    return result;
}

/***
* Population Class
* @param n: number of phenotypes per generation
***/
function Population(n) {
    this.members = [];
    // Spawn initial population
    for(var i = 0; i < n; i++)
        this.members.push(new Phenotype());
}

Population.prototype.genStep = function() {
    // Sort current population
    this.members = this.members.sort(fitSort);
    var children = [];
    // Cull the lower end of population
    var numParents = Math.floor(popSize * popElite);
    var numChildren = popSize - numParents;
    // Refill population by breeding the upper end of current population
    while(children.length < popSize) {
        var a = rInt(numParents);
        var b = rInt(numParents);
        while(b == a)
            b = rInt(numParents);
        var p1 = this.members[a];
        var p2 = this.members[b];
        children.push(new Phenotype(p1.genome, p2.genome));
    }
    this.members = children;
}

Population.prototype.getBestFit = function() {
    return this.members.sort(fitSort)[0];
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
        if(p1.length >= p2.length) {
            a = p1;
            b = p2;
        } else {
            a = p2;
            b = p1;
        }

        // Born from 2 parent genomes
        // Step through shorter genome and encode set of genes for each polygon
        for(var i = 0; i < b.length; i += polyGeneSize) {
            var p = (Math.random() < 0.5) ? p1 : p2;
            for(var j = 0; j < polyGeneSize; j++) {
                var val = p[i + j];
                if(Math.random() < softMutate) {
                    val += Math.random() * softMutateDrift * 2 - softMutateDrift;
                } else if(Math.random() < hardMutate) {
                    val = Math.random();
                }
                if(val < 0) val = 0;
                    if(val > 1) val = 1;
                    if(j == 3) {
                        if(val < minAlpha) val = minAlpha;
                        if(val > maxAlpha) val = maxAlpha;
                    }
                this.genome.push(val);
            }
        }
        // Fill in from the longer genome
        if(a.length > b.length) {
            for(var i = b.length; i < a.length; i += polyGeneSize) {
                for(var j = 0; j < polyGeneSize; j++) {
                    this.genome.push(a[i + j]);
                }
            }
        }
        // Add polygon
        if(a.length / polyGeneSize < polyCount && Math.random() < addPoly) {
            this.addPoly();
        }
    } else {
        // Random spawn
        this.addPoly();
    }

    // Calculate fitness
    this.fitness = this.evalFitness();
}

Phenotype.prototype.addPoly = function() {
    // RGB components 0-255
    this.genome.push(Math.random());
    this.genome.push(Math.random());
    this.genome.push(Math.random());
    // Alpha component 0-1
    this.genome.push(minAlpha + Math.random() * (maxAlpha - minAlpha));
    // Polygon vert coordinates
    for(var j = 0; j < polySides; j++) {
        this.genome.push(Math.random());
        this.genome.push(Math.random());
    }
}

// Calculate fitness of this genome
Phenotype.prototype.evalFitness = function() {
    // Generate output canvas pixel data as repeating array of RGBA values
    var outData = drawGenome(this.genome);
    var dif = 0;
    // Accumulate square of differences of RGB values
    for(var i = 0; i < outData.length; i++){
        if(i % 4 == 3) continue;
        var d = inData[i] - outData[i];
        dif += d * d;
    }
    // Return normalized fitness percentage
    return 1 - dif / (imgWidth * imgHeight * 3 * 256 * 256);
}