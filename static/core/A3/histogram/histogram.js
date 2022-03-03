//----------------- Histogram -----------------

// MAKING BINS USING RANGE OF POPULATION VALUES (equal bin width)
const CHUNK_SIZE = 4000;

const BAR_COLOR = [66, 135, 245];
const BACKGROUND_COLOR = 220;
const DOT_COLOR = [66, 135, 245];
const DOT_SIZE = 5;
const scale = 0.1;
const numYTicks = 10;
const numXTicks = 10;

const SCREEN_DIMENSIONS = {
    width:900,
    height: 700,
    leftMargin: 175,
    rightMargin: 75,
    upperMargin: 75,
    lowerMargin: 75,
    yTitleOffset: 20,
    xTitleOffset: 40,
    yTickSize: 10,
    xTickSize: 10
};

let table; // Global object to hold results from the loadTable call
let buckets, data = []; // Global array to hold all bubble objects
let parsedPairs = [];
let minPopulation = minAvgEnergy = Number.MAX_VALUE;
let maxPopulation = maxAvgEnergy = Number.MIN_VALUE;
const roundToHundred = (num) => Math.ceil(num / 100) * 100;


function preload() {
    table = loadTable("data/energy-usage-2010.csv", "csv", "header");
}

// Mimics Python's numpy function to create an array of `n` equally spaced values
// within a range
function linspace(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}


// Build buckets
function preprocess() {
    const rawData = table.getRows();
    const numberOfRows = rawData.length;
    
    // 1. Parse and organize raw table data
    let currPopulation, currEnergy;
    for (let i = 0; i < numberOfRows; i++) {
        
        currPopulation = parseFloat(rawData[i].get("TOTAL POPULATION"));
        currEnergy = parseFloat(rawData[i].get("TOTAL KWH"));
        
        if (currPopulation && currEnergy) {
            parsedPairs.push( {
                population: currPopulation,
                energy: currEnergy
            });
            
            if (currPopulation < minPopulation) { minPopulation = currPopulation; }
            else if (currPopulation > maxPopulation) { maxPopulation = currPopulation; }
        }
    }
    
    // 2. Sort the collected pairs by their population
    parsedPairs.sort((a, b) => a.population - b.population);
    
    // 3. Setup values for use when binning the data
    let numBuckets = Math.floor((maxPopulation - minPopulation) / CHUNK_SIZE);
    (buckets = []).length = (numBuckets - 1);
    buckets.fill({
        lowerBound: 0,
        upperBound: 0,
        totalEnergyConsumed: 0,
        totalPopulationEncompassed: 0
    });
    
    // 4. Build the linspace array which serves as the bin ranges
    let bucketRanges = linspace(minPopulation, maxPopulation, numBuckets);
    
    // 5. Loop over all rows to fit each value in a bin
    let stepSize, bucketSpan, bucketIndex = 0;
    buckets[bucketIndex] = parsedPairs[0].energy;
    
    console.log(bucketRanges)
    var i = 1;
    let aggEnergy = aggPopulation = 0;
    for ( ; i < parsedPairs.length; i++) {
        
        if ((currPopulation = parsedPairs[i].population) > bucketRanges[bucketIndex + 1]) {

            bucketSpan = bucketRanges[1] - bucketRanges[0];
            stepSize = Math.max(Math.ceil(((currPopulation) - (bucketRanges[bucketIndex + 1])) / bucketSpan), 1);
            let formattedBucket;
            for (let i = 0; i < stepSize; i++) {
                formattedBucket = {
                    lowerBound: bucketRanges[bucketIndex],
                    upperBound: bucketRanges[bucketIndex + 1],
                    totalEnergyConsumed: aggEnergy,
                    totalPopulationEncompassed: aggPopulation
                };

                buckets[bucketIndex] = formattedBucket;
                bucketIndex++;
                aggEnergy = 0;
                aggPopulation = 0;
            }

            if (bucketIndex >= buckets.length - 1 || currPopulation == maxPopulation) {
                break;
            }
        }
        
        aggEnergy += parsedPairs[i].energy; // Accumulate energy of the population bin
        aggPopulation += currPopulation;
    }

    let remaining = parsedPairs.slice(i, parsedPairs.length);
    buckets[bucketIndex - 1]['totalEnergyConsumed'] += remaining.reduce((acc, val) => acc + val.energy, 0);
    buckets[bucketIndex - 1]['totalPopulationEncompassed'] += remaining.reduce((acc, val) => acc + val.population, 0);


    for (let i = 0; i < buckets.length; i++) {
        aggPopulation = buckets[i].totalPopulationEncompassed;
        aggEnergy = buckets[i].totalEnergyConsumed;
        buckets[i]['avgEnergyConsumed'] = (aggPopulation == 0) ? 0 : aggEnergy / aggPopulation;
    }
    
    minAvgEnergy = buckets.reduce((prev, curr) => prev.avgEnergyConsumed < curr.avgEnergyConsumed ? prev : curr).avgEnergyConsumed;
    maxAvgEnergy = buckets.reduce((prev, curr) => prev.avgEnergyConsumed > curr.avgEnergyConsumed ? prev : curr).avgEnergyConsumed;
    console.log(minAvgEnergy, maxAvgEnergy);
    scaledData = buckets.map(val => { 
        return { 
            lowerBound: map(val.lowerBound, minPopulation, maxPopulation, SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin, SCREEN_DIMENSIONS.upperMargin),
            upperBound:map(val.upperBound, minPopulation, maxPopulation, SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin, SCREEN_DIMENSIONS.upperMargin),
            avgEnergyConsumed: map(val.avgEnergyConsumed, minAvgEnergy, maxAvgEnergy, SCREEN_DIMENSIONS.leftMargin, SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.rightMargin + SCREEN_DIMENSIONS.leftMargin)
        }; 
    });
    
}


function setup() {
    createCanvas(SCREEN_DIMENSIONS.width + (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.rightMargin), 
    SCREEN_DIMENSIONS.height + (SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.lowerMargin));
    preprocess();
}



function draw() {
    background(220);
    fill(0);

    stroke(195, 207, 227);

    // Background grid
    let gridSpacing = 20;
    for (let xLoc = SCREEN_DIMENSIONS.leftMargin; xLoc < (SCREEN_DIMENSIONS.leftMargin * 1.2) + SCREEN_DIMENSIONS.width; xLoc += gridSpacing) {
        line(xLoc, SCREEN_DIMENSIONS.upperMargin / 2, 
            xLoc, SCREEN_DIMENSIONS.height); // vertical
    }
    for (let yLoc = SCREEN_DIMENSIONS.upperMargin / 2; yLoc < (SCREEN_DIMENSIONS.upperMargin / 8) + SCREEN_DIMENSIONS.height; yLoc += gridSpacing) {
        line(SCREEN_DIMENSIONS.leftMargin, yLoc, 
            (SCREEN_DIMENSIONS.leftMargin * 1.1) + SCREEN_DIMENSIONS.width, yLoc); // horizontal
    }

    stroke(0);

    // Y-Axis
    line(SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.upperMargin / 2, 
        SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin);
    push();
    translate((SCREEN_DIMENSIONS.leftMargin / 2) - SCREEN_DIMENSIONS.yTitleOffset, (SCREEN_DIMENSIONS.height) / 2 + SCREEN_DIMENSIONS.upperMargin);
    rotate(radians(270));
    text("Population Range", -50, -20);
    pop();
    
    // X-Axis
    line(SCREEN_DIMENSIONS.leftMargin, 
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin, 
            SCREEN_DIMENSIONS.width + (SCREEN_DIMENSIONS.leftMargin * 1.1),
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin);
    text("Avg Energy Consumption (kWh)",
    SCREEN_DIMENSIONS.leftMargin + (SCREEN_DIMENSIONS.width / 2) - 100, 
    SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.xTitleOffset + 20);


    textAlign(RIGHT);
    let currBucket;
    let ySpacing = SCREEN_DIMENSIONS.height / scaledData.length;
    for (var i = 0; i < scaledData.length - 1; i++) {
        fill(color(...BAR_COLOR));
        currBucket = scaledData[i];
        rect(SCREEN_DIMENSIONS.leftMargin, 
            SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.height - ((i + 2.65) * ySpacing),
            SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.width - currBucket.avgEnergyConsumed, 
            ySpacing);
    }
    
    
    strokeWeight(1);
    stroke(0);
    fill(0);
    
    // Y-labels
    let yTickLabelSpacing = (maxPopulation - minPopulation) / scaledData.length;
    let yTickPosSpacing = (SCREEN_DIMENSIONS.height / scaledData.length);
    
    textAlign(RIGHT);
    text(`[${roundToHundred(buckets[0].lowerBound)}, ${roundToHundred(buckets[0].upperBound)})`,
        SCREEN_DIMENSIONS.leftMargin - (SCREEN_DIMENSIONS.yTickSize * 1.5),
        (SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin) - (yTickPosSpacing * 0) + 5);

    line(SCREEN_DIMENSIONS.leftMargin - (SCREEN_DIMENSIONS.yTickSize / 2), 
        (SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin) - (yTickPosSpacing * 0) - 3,
        SCREEN_DIMENSIONS.leftMargin + (SCREEN_DIMENSIONS.yTickSize / 2), 
        (SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin) - (yTickPosSpacing * 0) - 3);
    
    let yLabel;
    for (let i = 1; i < scaledData.length; i++) {
        yLabel = `[${roundToHundred(buckets[i].lowerBound)}, ${roundToHundred(buckets[i].upperBound)})`;
        text(yLabel,
            SCREEN_DIMENSIONS.leftMargin - (SCREEN_DIMENSIONS.yTickSize * 1.5),
            (SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin) - (yTickPosSpacing * i) + 20);

        line(SCREEN_DIMENSIONS.leftMargin - (SCREEN_DIMENSIONS.yTickSize / 2), 
            (SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin) - (yTickPosSpacing * i) + 20,
            SCREEN_DIMENSIONS.leftMargin + (SCREEN_DIMENSIONS.yTickSize / 2), 
            (SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin) - (yTickPosSpacing * i) + 20);
    }
    
    // X-labels
    let xTickLabelSpacing = (maxPopulation - minPopulation) / numXTicks;
    let xTickPosSpacing = (SCREEN_DIMENSIONS.width / numXTicks);
    
    textAlign(LEFT);
    for (let i = 0; i < scaledData.length - 1; i++) {
        text(roundToHundred(minAvgEnergy + (i * xTickLabelSpacing)),
            (xTickPosSpacing * i) + SCREEN_DIMENSIONS.leftMargin - 15,
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin + (SCREEN_DIMENSIONS.xTickSize * 2));
    
        line((xTickPosSpacing * i) + SCREEN_DIMENSIONS.leftMargin, 
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin - (SCREEN_DIMENSIONS.xTickSize / 2), 
            (xTickPosSpacing * i) + SCREEN_DIMENSIONS.leftMargin,
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin + (SCREEN_DIMENSIONS.xTickSize / 2))
    }
}
    