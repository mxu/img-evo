// GA defaults
var POLY_COUNT = 100;
var POLY_SIDES = 6;
var POP_SIZE = 20;
var POP_ELITE = 0.5;
var SOFT_MUTATE_DRIFT = 0.1;
var SOFT_MUTATE = 0.3;
var HARD_MUTATE = 0.1;
var ADD_POLY = 0.05;
var SWAP_POLY = 0.1;
var MAX_MUTATIONS = 8;

// GA parameters
var polyCount = POLY_COUNT;                 // maximum number of polygons per genome
var polySides = POLY_SIDES;                 // number of points per polygon
var popSize = POP_SIZE;                     // number of genomes per generation
var popElite = POP_ELITE;                   // percentage of each generation to reproduce
var softMutateDrift = SOFT_MUTATE_DRIFT;    // maximum amount of change for a soft mutation
var softMutate = SOFT_MUTATE;               // percentage chance of a soft mutation
var hardMutate = HARD_MUTATE;               // percentage chance of a hard mutation
var addPoly = ADD_POLY;                     // percentage chance of adding a polygon to the genome
var swapPoly = SWAP_POLY;                   // percentage chance of swapping two polygons in the genome
var maxMutations = MAX_MUTATIONS;           // maximum mutations per generation
var polyGeneSize = 4 + polySides * 2;       // number of genes to represent a complete poly
var minAlpha = 0.2;                         // minimum transparency
var maxAlpha = 0.6;                         // maximum transparency

// Globals
var srcCtx;
var srcData;
var outCtx;
var srcWidth;
var srcHeight;
var runTimer;
var startTime;
var pop;
var gen;

$(document).ready(function() {
    // Get image dimensions
    var img = $('#srcImg > img')[0];
    srcWidth = img.width;
    srcHeight = img.height;
    
    // Copy source image onto a canvas
    inCanvas = $('#srcImg > canvas')[0];
    inCanvas.width = srcWidth;
    inCanvas.height = srcHeight;
    srcCtx = inCanvas.getContext('2d');
    srcCtx.drawImage(img, 0, 0);
    // Store the pixel data for source image
    srcData = srcCtx.getImageData(0, 0, srcWidth, srcHeight).data;
    // Hide the original image DOM element
    img.style.display = 'none';

    // Setup output canvas
    outCanvas = $('#outImg > canvas')[0];
    outCanvas.width = srcWidth;
    outCanvas.height = srcHeight;
    outCtx = outCanvas.getContext('2d');

    // Bind the run button
    $('#runBtn').click(run);
});

// Start evolution
function run() {
    // Check inputs
    polyCount = checkInput(POLY_COUNT, '#txtPolyCount', parseInt);
    polySides = checkInput(POLY_SIDES, '#txtPolySides', parseInt);
    popSize = checkInput(POP_SIZE, '#txtPopSize', parseInt);
    popElite = checkInput(POP_ELITE, '#txtPopElite', parseFloat);
    softMutateDrift = checkInput(SOFT_MUTATE_DRIFT, '#txtSoftMutateDrift', parseFloat);
    softMutate = checkInput(SOFT_MUTATE, '#txtSoftMutate', parseFloat);
    hardMutate = checkInput(HARD_MUTATE, '#txtHardMutate', parseFloat);
    addPoly = checkInput(ADD_POLY, '#txtAddPoly', parseFloat);
    swapPoly = checkInput(SWAP_POLY, '#txtSwapPoly', parseFloat);
    maxMutations = checkInput(MAX_MUTATIONS, '#txtMaxMutations', parseInt);
    polyGeneSize = 4 + polySides * 2;
    // Initialize a new population
    pop = new Population(popSize);
    gen = 0;
    startTime = new Date().getTime();
    update();
    // Rebind button
    var btn = $('#runBtn');
    btn.text('Stop');
    btn.addClass('alert');
    btn.unbind('click');
    btn.click(stop);
}

function checkInput(orig, element, func) {
    var e = $(element);
    var val = func(e.val());
    if(val) return val;
    e.val(orig);
    return orig;
}

// Stop evolution
function stop() {
    clearTimeout(runTimer);
    runTimer = 0;
    drawGenome(pop.getBestFit().genome);
    // Rebind button
    var btn = $('#runBtn');
    btn.text('Run');
    btn.removeClass('alert');
    btn.unbind('click');
    btn.click(run);
}

// Step to next generation
function update() {
    pop.genStep();
    gen++;
    var runTime = ((new Date().getTime() - startTime) / 1000);
    var bestFit = pop.getBestFit();
    //drawGenome(bestFit.genome);
    log("Generation: " + gen,
        "Best fit: " + (bestFit.fitness * 100).toFixed(6) + "%",
        "Polygons: " + (bestFit.genome.length / polyGeneSize),
        "Time: " + runTime.toFixed(2),
        "Time per gen: " + (runTime / gen).toFixed(2));
    runTimer = setTimeout(update, 10);
}

// Encode genome to base 64
function encode() {
    var bestFit = pop.getBestFit();
    var encodedData = window.btoa(bestFit.genome.join());
    log(encodedData);
}

// Decode base 64 genome
function decode() {
    var encodedData = $('#console > textarea').val();
    var decodedData = window.atob(encodedData);
    var parsedDecode = decodedData.split(',');
    drawGenome(parsedDecode);
    log(decodedData);
}

// Output information to the page
function log() {
    var args = [];
    for(var i = 0; i < arguments.length; i++)
        args.push(arguments[i]);
    $('#console > textarea').val(args.join("\r\n"));
}

// Get a random integer between 0 and n
function rInt(n) {
    return Math.floor(Math.random() * n);
}

// Draw a genome onto the output canvas
function drawGenome(genome) {
    // Clear the canvas
    outCtx.fillStyle = '#000';
    outCtx.fillRect(0, 0, srcWidth, srcHeight);
    // Loop through the genome and draw each poly
    for(var i = 0; i < genome.length; i += polyGeneSize) {
        outCtx.fillStyle = 'rgba(' + 
            Math.floor(genome[i] * 255) + ',' + 
            Math.floor(genome[i+1] * 255) + ',' + 
            Math.floor(genome[i+2] * 255) + ',' + 
            genome[i+3] + ')';
        outCtx.beginPath();
        outCtx.moveTo(genome[i+4] * srcWidth, genome[i+5] * srcHeight);for(var j = 1; j < polySides; j++)
            outCtx.lineTo(genome[i+5+j] * srcWidth, genome[i+6+j] * srcHeight);
        outCtx.closePath();
        outCtx.fill();
    }
    return outCtx.getImageData(0, 0, srcWidth, srcHeight).data;
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

// Produce the next generation of genomes
Population.prototype.genStep = function() {
    // Cull the lower end of population
    var numParents = Math.floor(popSize * popElite);
    this.members.length = numParents;
    // Refill population by breeding the upper end of current population
    while(this.members.length < popSize) {
        var a = rInt(numParents);
        var b = rInt(numParents);
        while(b == a)
            b = rInt(numParents);
        var p1 = this.members[a];
        var p2 = this.members[b];
        this.members.push(new Phenotype(p1.genome, p2.genome));
    }
}

// Sort the population and return the highest fit member
Population.prototype.getBestFit = function() {
    this.members = this.members.sort(fitSort);
    return this.members[0];
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
        // Breed from 2 parents
        if(p1.length == p2.length) {
            // Uniform crossover
            for(var i = 0; i < p1.length; i += polyGeneSize) {
                var p = (Math.random() < 5) ? p1 : p2;
                for(var j = 0; j < polyGeneSize; j++)
                    this.genome.push(p[i + j]);
            }
        } else {
            // One point crossover
            var i = 0;
            var cross = Math.floor(Math.random() * p1.length / polyGeneSize) * polyGeneSize;
            for(; i < cross; i += polyGeneSize)
                for(var j = 0; j < polyGeneSize; j++)
                    this.genome.push(p1[i + j]);
            for(; i < p2.length; i += polyGeneSize)
                for(var j = 0; j < polyGeneSize; j++)
                    this.genome.push(p2[i + j]);
        }
        // Mutations
        for(var i = 0; i < maxMutations; i++) {
            if(Math.random() < softMutate) {
                this.softMutate();
            } else if(Math.random() < hardMutate) {
                this.hardMutate();  
            } else if(this.genome.length / polyGeneSize < polyCount && Math.random() < addPoly) {
                this.addPoly();
            } else if(Math.random() < swapPoly) {
                this.swapPoly();
            }
        }
    } else {
        // Random spawn
        this.addPoly();
    }

    // Calculate fitness
    this.fitness = this.evalFitness();
}

// Soft mutation
// Shifts one gene by a small amount
Phenotype.prototype.softMutate = function() {
    var mIndex = rInt(this.genome.length);
    var val = this.genome[mIndex] + Math.random() * softMutateDrift * 2 - softMutateDrift;
    if(mIndex % polyGeneSize == 3)
        this.genome[mIndex] = Math.min(maxAlpha, Math.max(minAlpha, val));
    else    
        this.genome[mIndex] = Math.min(1, Math.max(0, val));
}

// Hard mutation
// Set one gene to a random value
Phenotype.prototype.hardMutate = function() {
    var mIndex = rInt(this.genome.length);
    if(mIndex % polyGeneSize == 3)
        this.genome[mIndex] = minAlpha + Math.random() * (maxAlpha - minAlpha);
    else
        this.genome[mIndex] = Math.random();
}

// Add a randomly parameterized polygon to the genome
// All values normalized from 0 - 1
Phenotype.prototype.addPoly = function() {
    // RGB components
    this.genome.push(Math.random());
    this.genome.push(Math.random());
    this.genome.push(Math.random());
    // Alpha component
    this.genome.push(minAlpha + Math.random() * (maxAlpha - minAlpha));
    // Polygon vert coordinates
    for(var j = 0; j < polySides; j++) {
        this.genome.push(Math.random());
        this.genome.push(Math.random());
    }
}

// Swap two polygones in the genome
// Affects the order in which they are rendered
Phenotype.prototype.swapPoly = function() {
    if(this.genome.length <= polyGeneSize) return;
    var a = rInt(this.genome.length / polyGeneSize);
    b = rInt(this.genome.length / polyGeneSize);
    while(b == a)
        b = rInt(this.genome.length / polyGeneSize);
    var temp = [];
    for(var i = 0; i < polyGeneSize; i++) {
        temp[i] = this.genome[a + i];
        this.genome[a * polyGeneSize + i] = this.genome[b * polyGeneSize + i];
        this.genome[b * polyGeneSize + i] = temp[i];
    }
}

// Calculate fitness of this genome
Phenotype.prototype.evalFitness = function() {
    // Generate output canvas pixel data as repeating array of RGBA values
    var outData = drawGenome(this.genome);
    var dif = 0;
    // Accumulate square of differences of RGB values
    for(var i = 0; i < outData.length; i++){
        // Skip alpha values
        if(i % 4 == 3) continue;
        var d = srcData[i] - outData[i];
        dif += d * d;
    }
    // Return normalized fitness percentage
    return 1 - dif / (srcWidth * srcHeight * 3 * 256 * 256);
}