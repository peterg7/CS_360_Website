//----------------- DOT PLOT -----------------
const BACKGROUND_COLOR = 220;
const chunkSize = 2500;
const DOT_COLOR = [66, 135, 245];
const DOT_SIZE = 5;
const scale = 0.1;
const numYTicks = 10;
const numXTicks = 10;

const FILTER_DATE = '2013-09-01';

const SCREEN_DIMENSIONS = {
    width:600,
    height: 600,
    leftMargin: 75,
    rightMargin: 75,
    upperMargin: 50,
    lowerMargin: 50,
    yTitleOffset: 20,
    xTitleOffset: 40,
    yTickSize: 10,
    xTickSize: 10
};


let table; // Global object to hold results from the loadTable call
let buckets = []; // Global array to hold all bubble objects
let data = [];

let minX, maxX, minY, maxY;

function preload() {
    table = loadTable("data/earth_surface_temperature/GlobalLandTemperaturesByCountry.csv", 
    "csv", "header");
}

function preprocess() {
    const numberOfRows = table.getRowCount();
    
    maxX = Number.MIN_VALUE;
    maxY = Number.MIN_VALUE;

    minX = Number.MAX_VALUE;
    minY = Number.MAX_VALUE;

    let currX, currY;
    let extractedData = [];
    let rowValues = table.getRows();
    let numericFilterDate = Date.parse(FILTER_DATE);

    for (let i = 0; i < rowValues.length; i++) {

        if (Date.parse(rowValues[i].get("dt")) < numericFilterDate) {
            continue;
        }

        currX = parseFloat(rowValues[i].get("AverageTemperature"));
        currY = parseFloat(rowValues[i].get("AverageTemperatureUncertainty"));

        if (currX && currY) {
            extractedData.push( {
                x: currX,
                y: currY
            });

            if (currX < minX) { minX = currX; }
            else if (currX > maxX) { maxX = currX; }

            if (currY < minY) { minY = currY; }
            else if (currY > maxY) { maxY = currY; }
        }
    }

    data = extractedData.map(val => { return { 
        x: map(val.x, minX, maxX, SCREEN_DIMENSIONS.leftMargin, SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.rightMargin + SCREEN_DIMENSIONS.leftMargin), 
        y: map(val.y, minY, maxY, SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin, SCREEN_DIMENSIONS.upperMargin) }; 
    });
}


function setup() {
    createCanvas(SCREEN_DIMENSIONS.width + (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.rightMargin), 
    SCREEN_DIMENSIONS.height + (SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.lowerMargin));
    preprocess();
}

function draw() {
    background(BACKGROUND_COLOR);
    fill(0);
    
    // Y-Axis
    line(SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.upperMargin / 2, 
        SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin);
    push();
    translate((SCREEN_DIMENSIONS.leftMargin / 2) - SCREEN_DIMENSIONS.yTitleOffset, (SCREEN_DIMENSIONS.height) / 2 + SCREEN_DIMENSIONS.upperMargin);
    rotate(radians(270));
    text("Average Temperature Uncertainty (°C)", -50, 0);
    pop();
    
    // X-Axis
    line(SCREEN_DIMENSIONS.leftMargin, 
        SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin, 
        SCREEN_DIMENSIONS.width - (SCREEN_DIMENSIONS.rightMargin / 2) + SCREEN_DIMENSIONS.leftMargin,
        SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin);
    text("Average Temperature (°C)",
        SCREEN_DIMENSIONS.leftMargin + (SCREEN_DIMENSIONS.width / 2) - 100, 
        SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.xTitleOffset);
    
    
    // Draw data points
    strokeWeight(DOT_SIZE);
    stroke(...DOT_COLOR);
    for (var i = 0; i < data.length - 1; i++) {
        point(data[i].x, data[i].y);
    }

    strokeWeight(1);
    stroke(0);
    fill(0);

    // Y-labels
    let yTickLabelSpacing = (maxY - minY) / numYTicks;
    let yTickPosSpacing = (SCREEN_DIMENSIONS.height / numYTicks);
    textAlign(RIGHT);
    for (var i = 0; i < numYTicks; i++) {
        text((minY + (yTickLabelSpacing * i)).toPrecision(3), 
            SCREEN_DIMENSIONS.leftMargin - (SCREEN_DIMENSIONS.yTickSize * 1.5), 
            (yTickPosSpacing * i) + SCREEN_DIMENSIONS.upperMargin + 15);

        line(SCREEN_DIMENSIONS.leftMargin - (SCREEN_DIMENSIONS.yTickSize / 2), 
            (SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin) - (yTickPosSpacing * i),
            SCREEN_DIMENSIONS.leftMargin + (SCREEN_DIMENSIONS.yTickSize / 2), 
            (SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin) - (yTickPosSpacing * i));
    }

    // X-labels
    let xTickLabelSpacing = (maxX - minX) / numXTicks;
    let xTickPosSpacing = (SCREEN_DIMENSIONS.width / numXTicks);
    textAlign(LEFT);
    for (var i = 0; i < numXTicks; i++) {
        text((minX + (xTickLabelSpacing * i)).toPrecision(3), 
            (xTickPosSpacing * i) + SCREEN_DIMENSIONS.leftMargin - 15,
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin + (SCREEN_DIMENSIONS.xTickSize * 2));

        line((xTickPosSpacing * i) + SCREEN_DIMENSIONS.leftMargin, 
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin - (SCREEN_DIMENSIONS.xTickSize / 2), 
            (xTickPosSpacing * i) + SCREEN_DIMENSIONS.leftMargin,
            SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.lowerMargin + SCREEN_DIMENSIONS.upperMargin + (SCREEN_DIMENSIONS.xTickSize / 2))
    }
}



















