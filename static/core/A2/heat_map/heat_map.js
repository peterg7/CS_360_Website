
const BACKGROUND_COLOR = 220;
const SCREEN_DIMENSIONS = {
    width:1000,
    height: 700,
    leftMargin: 220,
    rightMargin: 120,
    upperMargin: 120,
    lowerMargin: 120,
    yTitleOffset: 20,
    xTitleOffset: 40,
    yTickSize: 10,
    xTickSize: 10
};

let table;
let countryData = [];
const NUM_COUNTRIES = 7; // number of tiles down
const COUNTRY_SELECT_MODE = "random";

let minVal, maxVal;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



// Load CSV data. Will be executed asynchrously
function preload() {
    table = loadTable("data/earth_surface_temperature/GlobalLandTemperaturesByCountry.csv", 
    "csv", "header");
}

function preprocess() {
    
    let rawTempData = table.getColumn("AverageTemperature").map(s => parseFloat(s)).filter(Boolean);
    rawTempData.sort((a, b) => a - b);
    minVal = rawTempData[0];
    maxVal = rawTempData[rawTempData.length - 1];
    
    let uniqueCountries = [...new Set(table.getColumn("Country"))];
    
    (countryData = []).length = NUM_COUNTRIES;
    countryData.fill({});
    
    let randRows, randCountry;
    if (COUNTRY_SELECT_MODE == "random") {
        for (let i = 0; i < NUM_COUNTRIES; i++) {
            
            randCountry = uniqueCountries[Math.floor(Math.random() * (uniqueCountries.length))];
            // Holds all rows corresponding to a random country
            randRows = table.findRows(randCountry, "Country").filter(r => r.get("AverageTemperature"));

            if (!randRows) {
                // Safety check
                i++;
                continue;
            }
            
            var monthlyTemps = Array(12);
            monthlyTemps.fill([]);
            let currRow, currMonth;
            for (let j = 0; j < randRows.length; j++) {
                currRow = randRows[j]
                currMonth = new Date(currRow.getString("dt")).getMonth();
                monthlyTemps[currMonth].push(parseFloat(currRow.get("AverageTemperature")));
            }
            
            for (let i = 0; i < monthlyTemps.length; i++) {
                monthlyTemps[i] = monthlyTemps[i].reduce((a, b) => a + b, 0) / monthlyTemps[i].length;
            }

            countryData[i] = {
                name: randRows[0].getString("Country"),
                temps: monthlyTemps,
                size: randRows.length
            };
        }
    }
}


function setup() {
    createCanvas(SCREEN_DIMENSIONS.width + (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.rightMargin), 
    SCREEN_DIMENSIONS.height + (SCREEN_DIMENSIONS.upperMargin + SCREEN_DIMENSIONS.lowerMargin));
    preprocess();
}

function draw() {
    background(BACKGROUND_COLOR);

    drawGraph();
    drawLabels();
}

let blockHeight, blockWidth;
function drawGraph() {
    let adjustedWidth = SCREEN_DIMENSIONS.width;

    blockHeight = (SCREEN_DIMENSIONS.height - (SCREEN_DIMENSIONS.upperMargin)) / NUM_COUNTRIES - 10;

    let Popup = PopupObjGenerator('headline subheadline');
    let popupInfo, currTemp, x, y;

    for (let i = 0; i < countryData.length; i++) {
        let country = countryData[i];
        blockWidth = adjustedWidth / country.temps.length;
        
        for (let j = 0; j < country.temps.length; j++) {
            currTemp = country.temps[j];
            
            x = SCREEN_DIMENSIONS.leftMargin + (j * blockWidth);
            y = ((i * blockHeight) + SCREEN_DIMENSIONS.upperMargin) - (blockHeight / 2);
            
            colorMode(HSL);
            fill(colorCode(currTemp, minVal, maxVal), 100, 50);
            rect(x, y, blockWidth, blockHeight);
            
            let showPopup = ((mouseX > x) && (mouseX < x + blockWidth) && (mouseY > y) && (mouseY < y + blockHeight));
            if (showPopup) {
                popupInfo = new Popup(country.name, formatPrecision(currTemp));
            }
        }
    }

    // Popup data
    if (popupInfo != undefined) {
        fill(255);
        textAlign(LEFT);
        textSize(12);
        stroke(18);
        text(popupInfo.headline + "\n" + popupInfo.subheadline,
        mouseX + 12,
        mouseY);
    }
}

function drawLabels() {
    colorMode(RGB);
    fill(18, 18, 18);
    
    // Add labels to the chart header
    let header_label_location_x = SCREEN_DIMENSIONS.width / 2 + SCREEN_DIMENSIONS.leftMargin;
    textSize(12);
    textAlign(CENTER);
    noStroke();
    text("Monthly Average Temperatures", header_label_location_x, SCREEN_DIMENSIONS.upperMargin / 2);
    
    // Add labels to the chart y - axis
    let y_label_location_y = (SCREEN_DIMENSIONS.height / 2);
    rotateText("Country", SCREEN_DIMENSIONS.leftMargin / 4, y_label_location_y, 270);
    
    let x_label_location_x = SCREEN_DIMENSIONS.width / 2 + SCREEN_DIMENSIONS.leftMargin;
    let x_label_location_y = SCREEN_DIMENSIONS.height - 24;
    textSize(12);
    textAlign(CENTER);
    noStroke();
    text("Month", x_label_location_x, x_label_location_y);
    
    for (let i = 0; i < MONTHS.length; i += 1) {
        
        let labelX_location = (i * blockWidth) + SCREEN_DIMENSIONS.leftMargin + (blockWidth / 2);
        
        //Label of the totals
        noStroke();
        textSize(12);
        text(MONTHS[i], labelX_location,
            SCREEN_DIMENSIONS.height - (SCREEN_DIMENSIONS.lowerMargin - (blockHeight / 2)))
    }
        
    //Names of the key dimension that will positioned along the y-axis
    let measureCount = countryData.length;
    
    textAlign(RIGHT);
    for (let i = 0; i < measureCount; i += 1) {
        
        //The labels for the dimension used
        text(countryData[i].name, SCREEN_DIMENSIONS.leftMargin - 21, (i*blockHeight) + SCREEN_DIMENSIONS.upperMargin);
    }
    
    // Legend
    let legendSize = 50;
    let chartWidth = 120;
    let chartHeight = 25;
    for (let i = 0; i < legendSize; i += 1) {
        let legend_color_for_locale = colorCode(i, 0, legendSize);
        colorMode(HSL);
        fill(legend_color_for_locale, 120, 50);
        noStroke();
        rect((SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.width - chartWidth) + ((chartWidth/legendSize) * i), SCREEN_DIMENSIONS.height - 24, (chartWidth/legendSize), chartHeight);
    }
    stroke(400);
    
    // Labels for the legend
    colorMode(RGB);
    fill(18, 18, 18);
    textSize(12);
    textAlign(RIGHT);
    text(formatPrecision(minVal), (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.width - chartWidth) - 4, SCREEN_DIMENSIONS.height - 8);
    textAlign(LEFT);
    text(formatPrecision(maxVal), (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.width) + 4 , SCREEN_DIMENSIONS.height - 8);
    text("Average Temp", (SCREEN_DIMENSIONS.leftMargin + SCREEN_DIMENSIONS.width - (chartWidth * 0.75)), SCREEN_DIMENSIONS.height - chartHeight -4);
}


function formatPrecision(num) {
    return num.toPrecision(3);
}


function rotateText(input, x, y, ang) {
    push();
    translate(x, y);
    rotate(radians(ang));
    textAlign(CENTER, TOP);
    text(input, 0, 0);
    pop();
}


function colorCode(value, min, max) {
    let frac = map(value, min, max, 0, 1.0);
    let hue = (1.0 - frac) * 240;
    return hue;
}


function PopupObjGenerator(names) {
    var names = names.split(' ');
    var count = names.length;
    function constructor() {
        for (var i = 0; i < count; i++) {
            this[names[i]] = arguments[i];
        }
    }
    return constructor;
}