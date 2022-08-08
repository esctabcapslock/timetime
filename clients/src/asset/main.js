

const TimezoneOffset = -(new Date()).getTimezoneOffset()/60
/**
 * 유닉스시간(정수)을 날짜로 변경
 * @param {number} dateNumver 
 * @returns number
 */
function unix2date(dateNumver){
    return (dateNumver+TimezoneOffset*3600*1000)/(24*3600*1000)|0
}

/**
 * 유닉스시간(정수)을 날짜로 변경
 * @param {number} date 
 * @returns string
 */
function date2string(date){
    const p = x=>x<10?`0${x}`:x;
    const d =  (new Date(date*24*3600*1000-TimezoneOffset*3600000))//.toLocaleDateString()
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
    // return d
}

(async()=>{
    const distoryData = await MonitoredHistory.getHistoryData(7,TimezoneOffset)
    console.log('distoryData',distoryData);
    window.distoryData = distoryData;

        
    const datedict = {}
    const pathdict = {}
    let pre = null
    const record = (dateKey,path,dur,end)=>{
        if (datedict[dateKey]){
            if(datedict[dateKey][path]) datedict[dateKey][path]+=dur
            else datedict[dateKey][path] = dur
        }else datedict[dateKey] = {path:dur}

        if(pathdict[path]) pathdict[path].push({s:end-dur,e:end})
        else pathdict[path] = [{s:end-dur,e:end}]
    };

    for (const d of distoryData){
        const dateKey = unix2date(d.time)
        if(pre==null) {pre = d; continue;}

        let path=0, cons = true
        let dur = d.time-pre.time;
        if (path==pre.path) cons = true 
        else{
            cons = false
        }
        
        if((d.time-pre.time)>61*1000) {pre = d; continue;} //61초 이상 기록이 끊기면 모르는거임

        if (cons) record(dateKey,d.path, dur, d.time)
        else{
            record(dateKey,d.path, dur/2, d.time)
            record(unix2date(pre.time),pre.path, dur/2, d.time-dur/2)
        }

        pre = d; 
    }
    window.datelist = datedict
    const datelist_keys = []
    const pathlist_keys = new Set([])
    const path_all = {}

    // for (let i = -6; i<=0; i++){datelist_keys.push(i+nowkey)}
    for (const key in datedict){
        datelist_keys.push(key)
        for (const path in datedict[key]) {
            path_all[path] = (path_all[path]?path_all[path]:0)+datedict[key][path]
            pathlist_keys.add(path)
        }
    }
    const datelist_range = []
    const nowkey =  unix2date(Date.now());
    for (let i = -6; i<=0; i++){datelist_range.push(i+nowkey)}
    // datelist_keys.sort((a,b)=>a-b)

    console.log('[datedict]',datedict)
    console.log('[pathdict]',pathdict)
    console.log('[datelist_keys]',datelist_keys)
    console.log('[pathlist_keys]',pathlist_keys)
    console.log('[path_all]',path_all)

    // const datalist = datelist_keys.map(key=>{
    //     return {date:(new Date(key*24*3600*1000-TimezoneOffset*3600000)).toLocaleDateString(), ...datedict[key]}
    // })


    const  chartinput = []
    for (const date of datelist_range){
        for (const path of pathlist_keys.values()) {
            const dur = datedict[date]?(datedict[date][path]?datedict[date][path]:0):0
            chartinput.push({date:date2string(date),path, dur:dur/3600/1000})
        }
    }

    const piout = []
    for(let path in path_all){
        piout.push({path,dur:path_all[path]/3600/1000})
    }
    piout.sort((a,b)=>b.dur-a.dur)
    window.chartinput = chartinput
    window.piout = piout

    
    const pathout = []
    for(const path in pathdict){

        const newdata = []
        let preRange = null
        const timeout = 5*60*1000
        for(const range of pathdict[path]){
            if(preRange==null){preRange=range; preRange.dur = range.e-range.s; continue;}
            if (range.s - preRange.e < timeout) {preRange.e = range.e; preRange.dur += range.e-range.s}
            else{
                newdata.push(preRange)
                preRange=range
                preRange.dur = range.e-range.s
            }
            // preRange=range;
        }
        if(preRange!==null) newdata.push(preRange)
    pathout.push({path,data:newdata, total:path_all[path]})
    }

    pathout.sort((a,b)=>-path_all[a.path]+path_all[b.path])
    window.pathout = pathout



    // key = Swatches(chart.scales.color, {columns: "180px"})
    ab()
    ac()
    timeline()

})();



function aa(){
    //https://observablehq.com/@d3/stacked-area-chart#key
    var chart = StackedAreaChart(chartinput, {
        x: d => d.date,
        y: d => d.dur,
        z: d => d.path,
        yLabel: "↑ 시각",
        xLabel: "날짜",
        width: 500,
        height: 500
    })

    document.body.append(chart)

}


function ab(){
    var chart = StackedBarChart(chartinput,{
        x: d => d.date,
        y: d => d.dur,
        z: d => d.path,
        yLabel: "↑ 시간",
        xLabel: "날짜",
        width: 500,
        height: 500
    })
    document.body.append(chart)

}


function ac(){
    const sum = piout.reduce((a,b)=>a+b.dur,0)
    let pi_else = 0
    const piout_f = piout.filter(v=>{
        if(v.dur<sum/50) {pi_else+=v.dur; return false}
        else return true
    }).map(d=>{
        let {path,dur} = d;
        // console.log('p',path,dur);
        const k=path.split('\\');
        k.reverse()
        path = k[0]//k[1]+'\\'+
        return {path,dur}

    })
    piout_f.push({path:'else',dur:pi_else})
    console.log('[piout_f]',piout_f)
    var chart = DonutChart(piout_f, {
        name: d => d.path,
        value: d => d.dur,
        width: 500,
        height: 500
      })

      document.body.append(chart)
}



// chart = ()=>{
1;
const timeline = ()=>{

const height = 1000;
const width = 800;
const color = (regions)=>d3.scaleOrdinal(d3.schemeSet2).domain(regions)()
const createTooltip = function(el) {
    el
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("top", 0)
        .style("opacity", 0)
        .style("background", "white")
        .style("border-radius", "5px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
        .style("padding", "10px")
        .style("line-height", "1.3")
        .style("font", "11px sans-serif")
    }



const pathout = window.pathout;
const data = pathout


const margin = {top: 30,right: 100,bottom: 30,left: 45}

const y= d3.scaleBand()
.domain(d3.range(data.length))
.range([0,height - margin.bottom - margin.top])
.padding(0.2)

const x = d3.scaleLinear()
.domain([d3.min(data, d => d.data[0].s), d3.max(data, d => d.data[d.data.length-1].e)])
.range([0, width - margin.left - margin.right])

const getRect = function(d){
    const el = d3.select(this);
    const ssx = x(d.data[0].s);
    let ww = x(d.data[d.data.length-1].e) - x(d.data[0].s);
    const isLabelRight = false//(ssx > width/2 ? ssx+ww < width : ssx-ww>0);
    // console.log('[range]',d,d.data)
    for(let range of d.data){
        const {s,e, dur} = range
        const sx = x(s);
        const w = x(e) - x(s);
        
        const rect = el
        .append("rect");
        
        rect.attr("x", sx)
        .attr("height", y.bandwidth())
        .attr("width", w)
        .attr("fill", d.color)
        .on("mouseover", function(event) {
            // console.log('darker',d,e)
        // d3.select(this).select("rect").
        rect.attr("fill", d.color.darker())
        
        tooltip
            .style("opacity", 1)
            .html(getTooltipContent(d.path,d.color,s,e, d.total,dur ))
        })
        .on("mouseleave", function(e) {
        // d3.select(this).select("rect").
        rect.attr("fill", d.color)
        tooltip.style("opacity", 0)
        })
    }
    
    
    el.style("cursor", "pointer")
    
    // el
    //     .append("text")
    //     .text(d.path.split('\\').reverse()[0])
    //     .attr("x",isLabelRight ? ssx-5 : ssx+ww+5)
    //     .attr("y", 2.5)
    //     .attr("fill", "black")
    //     .style("text-anchor", isLabelRight ? "end" : "start")
    //     .style("dominant-baseline", "hanging");
}


const formatDate = d=> (new Date(d)).toLocaleString()
const axisTop = d3.axisTop(x)
    .tickPadding(2)
    .tickFormat(formatDate)

const  axisBottom = d3.axisBottom(x)
.tickPadding(2)
.tickFormat(formatDate)


const totalString = total=>{
    total /= 1000
    const p = x=>x<10?`0${x}`:x;
    return `${p(total/3600|0)}:${p((total/60|0)%60)}`
}

const getTooltipContent = function(path,color,s,e,total,dur) {
    return `<b>${path.split('\\').reverse()[0]}</b>
    <br/>
    총 <b style="color:${color.darker()}">${totalString(total)}</b>
    이거 <b style="color:${color.darker()}">${totalString(dur)}</b>
    <br/>
    ${formatDate(s)} - ${formatDate(e)}
    `
}


let filteredData = pathout//.sort((a,b)=>  a.path-b.start);



filteredData.forEach(d=> d.color = d3.color(color(d.path)))


const parent = document.createElement("div")
parent.style.position =  "relative";

const svg = d3.create("svg")

.attr("width", width)
.attr("height", height)
.attr("viewBox", [0, 0, width, height])
.attr("style", "max-width: 100%; height: auto; height: intrinsic;");


const g = svg.append("g").attr("transform", (d,i)=>`translate(${margin.left}, ${margin.top})`);

const groups = g
.selectAll("g")
.data(filteredData)
.enter()
.append("g")
.attr("class", "civ")


const tooltip = d3.select(document.createElement("div")).call(createTooltip);

const line = svg.append("line").attr("y1", margin.top-10).attr("y2", height-margin.bottom).attr("stroke", "rgba(0,0,0,0.2)").style("pointer-events","none");

groups.attr("transform", (d,i)=>`translate(0, ${y(i)})`)

groups
.each(getRect)



svg
.append("g")
.attr("transform", (d,i)=>`translate(${margin.left}, ${margin.top-10})`)
.call(axisTop)

svg
.append("g")
.attr("transform", (d,i)=>`translate(${margin.left}, ${height-margin.bottom})`)
.call(axisBottom)


svg
.append("g")
.attr("transform", (d,i)=>`translate(${margin.left-5}, ${margin.top})`)
.selectAll("g")
.data(filteredData)
.enter()
.append("g")
.attr("class", "timeshow")
.attr("transform", (d,i)=>`translate(0, ${y(i)})`)
.each((d,i,eles)=>{
    // console.log('[d,avgs]',d,eles[i])
    const ele = eles[i]
    groups.attr("transform", (d,i)=>`translate(0, ${y(i)})`)
    const el = d3.select(eles[i])//d3.select(this);
    el
    .append("text")
    .text(totalString(d.total))
    .attr("x",0)
    .attr("y", 2.5)
    .attr("fill", "black")
    .style("text-anchor", "end")// "start"
    .style("dominant-baseline", "hanging");

})

svg
.append("g")
.attr("transform", (d,i)=>`translate(${width - margin.right+5}, ${margin.top})`)
.selectAll("g")
.data(filteredData)
.enter()
.append("g")
.attr("class", "timeshow")
.attr("transform", (d,i)=>`translate(0, ${y(i)})`)
.each((d,i,eles)=>{
    console.log('[d,avgs]',d,eles[i])
    const ele = eles[i]
    groups.attr("transform", (d,i)=>`translate(0, ${y(i)})`)
    const el = d3.select(eles[i])//d3.select(this);
    el
    .append("text")
    .text(d.path.split('\\').reverse()[0])
    .attr("x",0)
    .attr("y", 2.5)
    .attr("fill", "black")
    .style("text-anchor", "start")// "start"
    .style("dominant-baseline", "hanging");

})



svg.on("mousemove", function(d) {
    // console.log('mousemove',d)
    //document.body.addEventListener('mousemove',d=>console.log('mousemove',d.screenX, d.screenY))
let [x,y] = [d.layerX, d.layerY]//d3.mouse(this);
line.attr("transform", `translate(${x}, 0)`);
y +=20;
if(x>width/2) x-= 100;

tooltip
    .style("left", x + "px")
    .style("top", y + "px")
})

parent.appendChild(svg.node());
parent.appendChild(tooltip.node());
parent.groups = groups;



const civs = d3.selectAll(".civ")

civs.data(filteredData, d=>d.civilization)
.transition()
// .delay((d,i)=>i*10)
.ease(d3.easeCubic)
.attr("transform", (d,i)=>`translate(0, ${y(i)})`)

document.body.append(parent)

    // return parent
}
  