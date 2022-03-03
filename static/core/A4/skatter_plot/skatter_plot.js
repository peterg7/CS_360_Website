
// NOTE: Used reference `http://bl.ocks.org/jfreels/6816504`


const SCREEN_DIMENSIONS = { 
    width: 960,
    height: 500,
    leftMargin: 250,
    rightMargin: 50,
    topMargin: 50,
    bottomMargin: 100
}
SCREEN_DIMENSIONS.innerWidth = SCREEN_DIMENSIONS.width - SCREEN_DIMENSIONS.leftMargin - SCREEN_DIMENSIONS.rightMargin;
SCREEN_DIMENSIONS.innerHeight = SCREEN_DIMENSIONS.height - SCREEN_DIMENSIONS.topMargin - SCREEN_DIMENSIONS.bottomMargin;

var svg = d3.select('body').append('svg')
    .attr('width', SCREEN_DIMENSIONS.width)
    .attr('height', SCREEN_DIMENSIONS.height);

const xParams = {
    value: row => row.population,
    label: 'Population',
    scale: d3.scaleLinear(),
    tickPadding: 5
};
xParams.axis = d3.axisBottom()
                .scale(xParams.scale)
                .tickPadding(xParams.tickPadding)
                .tickFormat(d3.format('.0s'))
                .tickSize(-SCREEN_DIMENSIONS.innerHeight);

const yParams = {
    value: row => row.numTherms,
    label: 'Total # of Thermostats',
    scale: d3.scaleLinear(),
    tickPadding: 5
};
yParams.axis = d3.axisLeft()
                .scale(yParams.scale)
                .tickPadding(yParams.tickPadding)
                .tickFormat(d3.format('.0s'))
                .tickSize(-SCREEN_DIMENSIONS.innerWidth)


const canvas = svg.append('g')
    .attr('transform', `translate(${SCREEN_DIMENSIONS.leftMargin},${SCREEN_DIMENSIONS.topMargin})`);


const xAxisGroup = canvas.append('g')
    .attr('transform', `translate(0, ${SCREEN_DIMENSIONS.innerHeight})`);
                
            
const yAxisGroup = canvas.append('g');

xAxisGroup.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', SCREEN_DIMENSIONS.innerWidth / 2)
        .attr('y', 75)
        .text(xParams.label);

yAxisGroup.append('text')
        .attr('class', 'y-axis-label')
        .attr('x', -SCREEN_DIMENSIONS.leftMargin * .1)
        .attr('y', -SCREEN_DIMENSIONS.topMargin * 2.5)
        .text(yParams.label);


const titleGroup = canvas.append("text")
        .attr("x", (SCREEN_DIMENSIONS.innerWidth / 2))             
        .attr("y", 0 - (SCREEN_DIMENSIONS.topMargin / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .style("text-decoration", "underline")  
        .text("Census Block Population vs. Installed Thermostats");


const row = d => {
    return {
        population: +d['TOTAL POPULATION'],
        numTherms: +d['TOTAL THERMS']
    };
};

d3.csv('data/energy-usage-2010.csv', row, data => {

    yParams.scale
        .domain([d3.min(data, yParams.value), d3.max(data, yParams.value)])
        .range([SCREEN_DIMENSIONS.innerHeight, 0]);
    
    xParams.scale
        .domain([0, d3.max(data, xParams.value)])
        .range([0, SCREEN_DIMENSIONS.innerWidth])

        
    canvas.selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('cx', d => xParams.scale(xParams.value(d)))
        .attr('cy', d => yParams.scale(yParams.value(d)))
        .attr('r','6')
        .attr('fill', 'steelblue')

    xAxisGroup.call(xParams.axis);
    
    yAxisGroup.call(yParams.axis);
  })

  