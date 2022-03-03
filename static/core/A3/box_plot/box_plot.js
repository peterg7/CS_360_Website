//----------------- Box plot -----------------

const NUM_Y_TICKS = 14;
const DOT_RADIUS = 10;

const BOX_PARAMS = {
    width: 40,
    background_color: [50, 98, 168],
    line_color: [0, 0, 0],
    line_weight: 1.5,
    left_edge: (center) => center - (BOX_PARAMS.width / 2), 
    right_edge: (center) => center + (BOX_PARAMS.width / 2)
};

const SCREEN_DIMENSIONS = {
    width:900,
    height: 700,
    leftMargin: 175,
    rightMargin: 75,
    upperMargin: 75,
    lowerMargin: 75
};

let table; // Global object to hold results from the loadTable call
let dataSummary = {}, scaledSummary = {};
let minVal = Math.MIN_VALUE, maxVal = Math.MAX_VALUE;
let yTickDefs;

// Helper function for rounding tick values
const round = (num, type='', nearest=10) => {
    if (type == 'floor') {
        return Math.floor(num / nearest) * nearest;
    } else if (type == 'ceil') {
        return Math.ceil(num / nearest) * nearest;
    } else {
        return (num % nearest) > (Math.floor(num / nearest)) ? Math.ceil(num / nearest) * nearest : Math.floor(num / nearest) * nearest;
    }
}

// Helpber object to serve as a "statistics calculator"
const statistics = (() => {
    const sorted = (arr) => arr.sort((a, b) => a - b);
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    const mean = (arr) => sum(arr) / arr.length;
    const min = (arr) => sorted(arr)[0];
    const max = (arr) => sorted(arr)[arr.length - 1]; 
    const median = (arr) => {
        const midIdx = Math.floor(arr.length / 2), sortedVals = sorted(arr);
        return sortedVals.length % 2 !== 0 ? sortedVals[midIdx] : (sortedVals[midIdx - 1] + sortedVals[midIdx]) / 2;
    };
    const mode = (arr) => {
        const counts = {};
        for (const val of arr) {
            counts[val] = counts[val] ? counts[val] + 1 : 1;
        }
        return parseInt(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
    };
    const range = (arr) => {
        const sortedVals = sorted(arr);
        return [sortedVals[0], sortedVals[sortedVals.length - 1]];
    };
    const std = (arr) => {
        const m = mean(arr);
        const squaredDevs = arr.map(a => (a - m) ** 2);
        return Math.sqrt(sum(squaredDevs) / (arr.length - 1));
    };
    const percentile = (arr, per) => {
        const sortedVals = sorted(arr);
        const q_idx = (sortedVals.length - 1) * per, base_idx = Math.floor(q_idx);
        const remainder = q_idx - base_idx;
        let result;
        if (sortedVals[base_idx + 1] !== undefined) {
            result = sortedVals[base_idx] + remainder * (sortedVals[base_idx + 1] - sortedVals[base_idx]);
        } else {
            result =  sortedVals[base_idx];
        }
        return parseInt(result);
    };
    const iqr = (arr) => percentile(arr, 0.75) - percentile(arr, 0.25);
    const thresholds = (arr, ratio) => {
        const _iqr = iqr(arr);
        return [ (percentile(arr, 0.25) - (_iqr * ratio)), (percentile(arr, 0.75) + (_iqr * ratio)) ];
    };
    const outliers = (arr, ratio) => {
        const low = lowerThresh(arr, ratio), high = upperThresh(arr, ratio);
        let outliers = [];
        for (const val of arr) {
            if (val < low || val > high) { outliers.push(val) };
        }
        return outliers;
    };
    const summary = (arr, outlierThreshold=1.5) => {
        const _sortedArr = sorted(arr);
        const _q1 = percentile(arr, 0.25), _q3 = percentile(arr, 0.75);
        const _iqr = _q3 - _q1;
        const _lowerBound = _q1 - (_iqr * outlierThreshold), _upperBound = _q3 + (_iqr * outlierThreshold);
        const _outliers = arr.filter(a => (a < _lowerBound || a > _upperBound));
        
        return {
            count: arr.length,
            mean: mean(arr),
            std: std(arr),
            min: _sortedArr[0],
            q1: _q1,
            median: median(arr),
            q3: _q3,
            max: _sortedArr[arr.length - 1],
            iqr: _iqr,
            lowerBound: _lowerBound,
            upperBound: _upperBound,
            outliers: _outliers
        };
    };
    
    return {
        sorted,
        sum,
        mean,
        min,
        max,
        median,
        mode,
        range,
        std,
        percentile,
        iqr,
        thresholds,
        outliers,
        summary
    };
})();

// Helper mapping function between graph & screen space
const mapToCanvas = (val, localMin, localMax) => map(val, localMin, localMax, SCREEN_DIMENSIONS.upperMargin, SCREEN_DIMENSIONS.height + SCREEN_DIMENSIONS.upperMargin);

function preload() {
    table = loadTable("data/energy-usage-2010.csv", "csv", "header");
}

function preprocess() {
    let cleanedData = table.getColumn("AVERAGE BUILDING AGE").map(s => parseInt(s)).filter(Boolean);
    dataSummary = statistics.summary(cleanedData);
    minVal = dataSummary.min, maxVal = dataSummary.max;
    
    scaledSummary = {
        min: mapToCanvas(minVal, minVal, maxVal),
        q1: mapToCanvas(dataSummary.q1, minVal, maxVal),
        median: mapToCanvas(dataSummary.median, minVal, maxVal),
        q3: mapToCanvas(dataSummary.q3, minVal, maxVal),
        max: mapToCanvas(maxVal, minVal, maxVal),
        outliers: dataSummary.outliers.map((a) => mapToCanvas(a, minVal, maxVal))
    };
}


function setup() {
    createCanvas(SCREEN_DIMENSIONS.width + (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.rightMargin), 
    SCREEN_DIMENSIONS.height + (SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.lowerMargin));
    preprocess();

    // Build Y-Ticks
    let minYTickVal = round(minVal, 'floor');
    let maxYTickVal = round(maxVal, 'ceil');

    let yTickSpacing = round((maxYTickVal - minYTickVal) / NUM_Y_TICKS, 'floor');
    let topTickDiff = maxYTickVal - (yTickSpacing * NUM_Y_TICKS);

    let adjustedNumTicks = topTickDiff >= 0 ? NUM_Y_TICKS + Math.ceil(topTickDiff / yTickSpacing) : NUM_Y_TICKS;
    yTickSpacing = round((maxYTickVal - minYTickVal) / adjustedNumTicks);

    let yTickVals = Array.from(Array(adjustedNumTicks + 1), (e, i) => i * yTickSpacing);
    let yTickPoses = yTickVals.map(a => mapToCanvas(a, yTickVals[0], yTickVals[yTickVals.length - 1])).reverse();

    yTickDefs = Object.assign(...yTickVals.map((x, i)=>({ [x]: yTickPoses[i] })));
}


function draw() {
    background(220);
    fill(0);
    stroke("grey");
    strokeWeight(0.5);
    
    const screenCenterX = SCREEN_DIMENSIONS.width/2 + SCREEN_DIMENSIONS.leftMargin;

    // Y-Axis
    line(SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.upperMargin / 2, 
        SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.height + SCREEN_DIMENSIONS.upperMargin);

    // X-Axis
    line(SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.height + SCREEN_DIMENSIONS.upperMargin, 
        SCREEN_DIMENSIONS.width + (SCREEN_DIMENSIONS.leftMargin),
        SCREEN_DIMENSIONS.height + SCREEN_DIMENSIONS.upperMargin);
    
    // Y-ticks
    textAlign(RIGHT)
    for (const [val, pos] of Object.entries(yTickDefs)) {
        text(val, SCREEN_DIMENSIONS.leftMargin - 10, pos);

        line(SCREEN_DIMENSIONS.leftMargin,  pos,
            SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.width, pos);
    }

    // outliers
    scaledSummary.outliers.map(item => circle(screenCenterX, item, DOT_RADIUS))
    
    stroke("black")
    strokeWeight(1.5)
    fill("steelblue")

    // Core body
    rect(BOX_PARAMS.left_edge(screenCenterX), scaledSummary.q3, BOX_PARAMS.width, (scaledSummary.q1 - scaledSummary.q3))
    // lower boundary
    line(BOX_PARAMS.left_edge(screenCenterX), scaledSummary.min, BOX_PARAMS.right_edge(screenCenterX), scaledSummary.min )
    // median
    line(BOX_PARAMS.left_edge(screenCenterX), scaledSummary.median, BOX_PARAMS.right_edge(screenCenterX), scaledSummary.median)
    // upper boundary
    line(BOX_PARAMS.left_edge(screenCenterX), scaledSummary.max, BOX_PARAMS.right_edge(screenCenterX), scaledSummary.max)
    // q1
    line(BOX_PARAMS.left_edge(screenCenterX), scaledSummary.q1, BOX_PARAMS.right_edge(screenCenterX), scaledSummary.q1)
    // q3
    line(BOX_PARAMS.left_edge(screenCenterX), scaledSummary.q3, BOX_PARAMS.right_edge(screenCenterX), scaledSummary.q3)
    // vertical lines
    line(screenCenterX, scaledSummary.max, screenCenterX, scaledSummary.q3)
    line(screenCenterX, scaledSummary.q1, screenCenterX, scaledSummary.min)
    
    fill("black");
    strokeWeight(1);
    textAlign(CENTER);
    textSize(18);

    // Title
    text("Average Building Age In Each Census Block", 
            SCREEN_DIMENSIONS.width/2 + SCREEN_DIMENSIONS.leftMargin, 
            SCREEN_DIMENSIONS.upperMargin/2)
    
    textSize(16);

    // Y-Axis label
    push();
    translate((SCREEN_DIMENSIONS.leftMargin / 2), (SCREEN_DIMENSIONS.height) / 2 + SCREEN_DIMENSIONS.upperMargin);
    rotate(radians(270));
    text("Age (years)", -50, -20);
    pop();

    textSize(12);
    
    // Tooltip
    if (((mouseX > BOX_PARAMS.left_edge(screenCenterX)) && (mouseX < BOX_PARAMS.right_edge(screenCenterX))) && // check x coords
        ((mouseY > scaledSummary.q1) && (mouseY < scaledSummary.q3))) { // check y coords

        fill("lightgrey")
        rect(mouseX + 10, mouseY, 125, 100)
        fill("black")
        strokeWeight(0.5);
        textAlign(LEFT)
        text(`Maximum : ${dataSummary.max}`, mouseX + 15, mouseY + 15)
        text(`Q3 : ${dataSummary.q3}`, mouseX + 15, mouseY + 30)
        text(`Median : ${dataSummary.median}`, mouseX + 15, mouseY + 45)
        text(`Q1 : ${dataSummary.q1}`, mouseX + 15, mouseY + 60)
        text(`Minimun : ${dataSummary.min}`, mouseX + 15, mouseY + 75)
        text(`Outliers : ${dataSummary.outliers.join(", ")}`, mouseX + 15, mouseY + 90)
    }   
}
    