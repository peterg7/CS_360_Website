//----------------- BAR CHART -----------------

const chunkSize = 2500;
const scale = 0.005;
const numXTicks = 10;
const BAR_COLOR = [66, 135, 245];

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1200;

let table; // Global object to hold results from the loadTable call
let buckets = []; // Global array to hold all bubble objects
let minVal, maxVal, maxBucket, minBucket, bucketSpan;

function preload() {
    table = loadTable("https://github.com/peterg7/CS_360_A2/blob/c329724fa7bbde5dab353169411fd01a3b831c5a/data/GlobalLandTemperaturesByCountry.csv", 
    "csv", "header");
}

// Build buckets
function preprocess() {
    const numberOfRows = table.getRowCount();
    
    const rawAverageTempData = table.getColumn("AverageTemperature");
    const averageTempData = rawAverageTempData.map(s => parseFloat(s)).filter(Boolean);
    averageTempData.sort((a, b) => a - b);
    
    const uniqueTemps = new Set(averageTempData);
    let numUnique = uniqueTemps.size;
    
    minVal = averageTempData[0];
    maxVal = averageTempData[averageTempData.length - 1];
    
    let numBuckets = Math.floor(numUnique / chunkSize) + ((numUnique % chunkSize) > 0 ? 1 : 0);
    bucketSpan = (maxVal - minVal) / numBuckets;
    
    (buckets = []).length = numBuckets;
    buckets.fill(0);
    
    let cap = minVal + bucketSpan;
    let nextBucketStepSize, bucketNum = 0;
    
    for (var i = 0; i < averageTempData.length; i++) {
        
        if (averageTempData[i] > cap) {
            nextBucketStepSize = Math.floor(Math.max((averageTempData[i] - (cap + bucketSpan + Number.MIN_VALUE)), 1));
            cap += (bucketSpan * nextBucketStepSize) + Number.MIN_VALUE;
            bucketNum += nextBucketStepSize;
            
        }
        buckets[bucketNum]++;
    }
    maxBucket = max(...buckets);
    minBucket = min(...buckets);
}


function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    preprocess();
}


function draw() {
    background(220);
    fill(0);
    
    let label, ceil = maxVal;
    
    // Y-Axis
    line(110, 20, 110, ((buckets.length - 1) * 30 + 60));
    push();
    translate(20, ((buckets.length - 1) * 30 + 150) / 2);
    rotate(radians(270));
    text("Average Temperature Range (°C)", 0, 0);
    pop();
    
    // X-Axis
    line(110, ((buckets.length - 1) * 30 + 60), 
    (maxBucket * scale) + 130, ((buckets.length - 1) * 30 + 60));
    text("Number of Data Points", ((buckets.length - 1) * 30) / 2 - 75, 
    ((buckets.length - 1) * 30 + 105));
    
    
    textAlign(RIGHT);
    for (var i = 0; i < buckets.length - 1; i++) {
        fill(color(...BAR_COLOR));
        // noStroke();
        rect(110, i * 30 + 40, (buckets[buckets.length - i] * scale), 20);
        
        // Y-labels
        yLabel = `${ceil.toPrecision(3)} - ${(ceil - bucketSpan).toPrecision(3)}`;
        
        fill(0);
        text(yLabel, 25, i * 30 + 40, 75);
        line(110 - 5, (i * 30 + 50), 110 + 5, (i * 30 + 50));
        
        ceil -= bucketSpan + Number.MIN_VALUE;
    }
    
    // X-labels
    textAlign(LEFT);
    let xTickStepSize = Math.ceil((maxBucket / numXTicks) / 10000) * 10000;
    let xTickSpacing = Math.ceil((minBucket + maxBucket) / numXTicks) * scale;
    
    for (var i = 0; i < numXTicks + 1; i++) {
        line((i * xTickSpacing + 110), ((buckets.length - 1) * 30 + 60) + 5, 
        (i * xTickSpacing + 110), ((buckets.length - 1) * 30 + 60) - 5);
        
        text(i * xTickStepSize, (i * xTickSpacing + 90), ((buckets.length - 1) * 30 + 70), 75);
    }
}
