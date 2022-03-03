
// NOTE: Used reference `https://bl.ocks.org/curran/e842c1b64974666c60fc3e437f8c8cf9`

const NUM_COMMUNITIES = 10;
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

var svg = d3.select('body').append('svg');
svg.attr('width', SCREEN_DIMENSIONS.width);
svg.attr('height', SCREEN_DIMENSIONS.height);


const xParams = {
    value: row => row.avgTherms,
    label: 'Average # of Thermostats',
    scale: d3.scaleLinear(),
    numTicks: NUM_COMMUNITIES,
    tickPadding: 5
};
xParams.axis = d3.axisBottom()
                .scale(xParams.scale)
                .ticks(xParams.numTicks)
                .tickPadding(xParams.tickPadding)
                .tickFormat(d3.format('.0s'))
                .tickSize(-innerHeight);

const yParams = {
    value: row => row.communityName,
    label: 'Community Name',
    scale: d3.scaleBand().paddingInner(0.3).paddingOuter(0),
    tickPadding: 5
};
yParams.axis = d3.axisLeft()
                .scale(yParams.scale)
                .tickPadding(yParams.tickPadding)
                .tickSize(-SCREEN_DIMENSIONS.innerWidth);

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
        .attr('x', -SCREEN_DIMENSIONS.topMargin)
        .attr('y', -SCREEN_DIMENSIONS.leftMargin * 4/5)
        .text(yParams.label);


const titleGroup = canvas.append("text")
        .attr("x", (SCREEN_DIMENSIONS.innerWidth / 2))             
        .attr("y", 0 - (SCREEN_DIMENSIONS.topMargin / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .style("text-decoration", "underline")  
        .text("Top 10 Communities with Most Installed Thermostats");


const row = d => {
    return {
        communityName: d['COMMUNITY AREA NAME'],
        avgTherms: d['TOTAL THERMS']
    };
};

const aggregate = (dataObj) => {
    
    let groups = dataObj.reduce((agg, curr) => {
        if (curr.avgTherms) {
            agg[curr.communityName] = agg[curr.communityName] || [];
            agg[curr.communityName].push(parseInt(curr.avgTherms));
        }
        return agg;
    }, Object.create(null));
    
    let result = Object.entries(groups).map((e) => ( { 
        'communityName': e[0],
        'avgTherms': e[1].reduce((a, b) => a + b) / e[1].length 
    } 
    ));
    return result;
};

const topX = (dataArr, x) => dataArr.sort((a, b) => a.avgTherms - b.avgTherms).slice(dataArr.length - x, dataArr.length);

d3.csv('data/energy-usage-2010.csv', row, data => {
    
    let aggData = topX(aggregate(data), NUM_COMMUNITIES);
    
    yParams.scale
        .domain(aggData.map(yParams.value).reverse())
        .range([SCREEN_DIMENSIONS.innerHeight, 0]);
    
    xParams.scale
        .domain([0, d3.max(aggData, xParams.value)])
        .range([0, SCREEN_DIMENSIONS.innerWidth])
        .nice(xParams.numTicks);
    
    canvas.selectAll('rect').data(aggData)
        .enter().append('rect')
        .attr('x', 0)
        .attr('y', d => yParams.scale(yParams.value(d)))
        .attr('width', d => xParams.scale(xParams.value(d)))
        .attr('height', d => yParams.scale.bandwidth())
        .attr('fill', 'steelblue');
    
    xAxisGroup.call(xParams.axis);
    
    yAxisGroup.call(yParams.axis);
    yAxisGroup.selectAll('.tick line').remove();
});

