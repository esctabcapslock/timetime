const timeline_setup = {
    now : ((((Date.now()+TimezoneOffset*3600_000)/24/3600_000)|0)*24-TimezoneOffset)*3600_000,
    range: 1,
    drawNow:()=>{
        document.getElementById('timeline_ctrl_now').innerHTML = date2string(timeline_setup.now/24/3600_000) //`${now.getFullYear()}-${addZero(now.getMonth()+1)}-${addZero(now.getDate())}`
        timeline_graph(timeline_view, timeline_setup.now, timeline_setup.now + timeline_setup.range*(24*3600_000));
    }
}

/**
 * 타임라인 그리는 함수
 */
function timeline(data){
    const timeline_view = document.getElementById('timeline_view')
    if(!timeline_view) throw("timeline_view error!")

    const now = new Date()


    document.getElementById('timeline_ctrl_btn_add').addEventListener('click',e=>{
        timeline_setup.now += 24*3600_000
        timeline_setup.drawNow();
    })
    const timeline_ctrl_btn_min = document.getElementById('timeline_ctrl_btn_min').addEventListener('click',e=>{
        timeline_setup.now -= 24*3600_000
        timeline_setup.drawNow();
    })



    // const addZero = x=>x<10?`0${x}`:x;
    
    document.getElementById('timeline_ctrl_range').innerHTML = `1일`
    timeline_setup.drawNow();
}

/**
 * 타임라인 반복적으로 그래프를 그림
 * @param {da} data 
 * @param {HTMLElement} parent 
 * @param {number} start 
 * @param {number} end 
 */
function timeline_graph(parent, start, end) {
    parent.innerHTML = ''
    
    // const pathout = window.pathout;
    // const data = pathout;

    const data = c_rawData.getTimelineByDate(start, end)
    console.log('[all-data]',data)
    const pathout = data
    

    const height = 1000;
    const width = 800;
    const color = (regions) => d3.scaleOrdinal(d3.schemeSet2).domain(regions)()
    const createTooltip = function (el) {
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





    const margin = { top: 30, right: 120, bottom: 30, left: 100 }

    const y = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([0, height - margin.bottom - margin.top])
        .padding(0.2)

    const x = d3.scaleLinear()
        .domain([start, end]) // 특정 일자 기준으로 자르기. 
        // .domain([d3.min(data, d => d.data[0].s), d3.max(data, d => d.data[d.data.length - 1].e)])
        .range([0, width - margin.left - margin.right])

    const getRect = function (d) {
        const el = d3.select(this);
        const ssx = x(d.data[0].s);
        let ww = x(d.data[d.data.length - 1].e) - x(d.data[0].s);
        const isLabelRight = false//(ssx > width/2 ? ssx+ww < width : ssx-ww>0);
        // console.log('[range]',d,d.data)
        for (const range of d.data) {
            const { s, e, dur } = range
            const sx = x(s);
            const w = x(e) - x(s);
            if(w<0) console.log('www',w,range,e-s,e,s)

            const rect = el
                .append("rect");

            rect.attr("x", sx)
                .attr("height", y.bandwidth())
                .attr("width", w)
                .attr("fill", d.color)
                .on("mouseover", function (ele) {
                    // console.log('darker',d,e)
                    // d3.select(this).select("rect").
                    rect.attr("fill", d.color.darker())

                    tooltip
                        .style("opacity", 1)
                        .html(getTooltipContent(d.path, d.color, s, e, d.total, dur))
                })
                .on("mouseleave", function (e) {
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


    const formatDate = d => (new Date(d)).toLocaleString()
    const axisTop = d3.axisTop(x)
        .tickPadding(2)
        .tickFormat(formatDate)

    const axisBottom = d3.axisBottom(x)
        .tickPadding(2)
        .tickFormat(formatDate)


    const getTooltipContent = function (path, color, s, e, total, dur) {
        return `<b>${path.split('\\').reverse()[0]}</b>
    <br/>
<!--    총 <b style="color:${color.darker()}">${totalString(total)}</b> -->
    <b style="color:${color.darker()}">${totalString(dur)}</b> 소모
    <br/>
    ${formatDate(s)} - ${formatDate(e)}
    `
    }


    const getAXISTooltipContent = function (path) {
        return `
        <b>${path.split('\\').reverse()[0]}</b><br>
        전체 경로:<br> ${path} <br>
        `
    }


    let filteredData = pathout//.sort((a,b)=>  a.path-b.start);
    filteredData.forEach(d => d.color = d3.color(color(d.path)))



    const svg = d3.create("svg")

        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width:800px; height: auto; height: intrinsic;"); //min-width: 100%; 


    const g = svg.append("g").attr("transform", (d, i) => `translate(${margin.left}, ${margin.top})`);

    const groups = g
        .selectAll("g")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "civ")


    const tooltip = d3.select(document.createElement("div")).call(createTooltip);

    const line = svg.append("line").attr("y1", margin.top - 10).attr("y2", height - margin.bottom).attr("stroke", "rgba(0,0,0,0.2)").style("pointer-events", "none");

    groups.attr("transform", (d, i) => `translate(0, ${y(i)})`)

    groups
        .each(getRect)



    svg
        .append("g")
        .attr("transform", (d, i) => `translate(${margin.left}, ${margin.top - 10})`)
        .call(axisTop)

    svg
        .append("g")
        .attr("transform", (d, i) => `translate(${margin.left}, ${height - margin.bottom})`)
        .call(axisBottom)


    svg
        .append("g")
        .attr("transform", (d, i) => `translate(${margin.left - 5}, ${margin.top})`)
        .selectAll("g")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "timeshow")
        .attr("transform", (d, i) => `translate(0, ${y(i)})`)
        .each((d, i, eles) => {
            // console.log('[d,avgs]',d,eles[i])
            const ele = eles[i]
            groups.attr("transform", (d, i) => `translate(0, ${y(i)})`)
            const el = d3.select(eles[i])//d3.select(this);
            el
                .append("text")
                .text(totalString(d.total))
                .attr("x", 0)
                .attr("y", 2.5)
                .attr("fill", "black")
                .style("text-anchor", "end")// "start"
                .style("dominant-baseline", "hanging");

        })

    svg
        .append("g")
        .attr("transform", (d, i) => `translate(${width - margin.right + 5}, ${margin.top})`)
        .selectAll("g")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "timeshow")
        .attr("transform", (d, i) => `translate(0, ${y(i)})`)
        .each((d, i, eles) => {
            //console.log('[d,avgs]',d,eles[i])
            const ele = eles[i]
            groups.attr("transform", (d, i) => `translate(0, ${y(i)})`)
            const el = d3.select(eles[i])//d3.select(this);
            el
                .append("text")
                .text(d.path.split('\\').reverse()[0])
                .attr("x", 0)
                .attr("y", 2.5)
                .attr("fill", "black")
                .style("text-anchor", "start")// "start"
                .style("dominant-baseline", "hanging");

            el
                .on("mouseover", function (ele) {
                    // console.log('darker',d,e)
                    // d3.select(this).select("rect").
                    el.attr("font-weight", "bold")

                    tooltip
                        .style("opacity", 1)
                        .html(getAXISTooltipContent(d.path))
                })
                .on("mouseleave", function (e) {
                    // d3.select(this).select("rect").
                    el.attr("font-weight", "")
                    tooltip.style("opacity", 0)
                })

        })



    svg.on("mousemove", function (d) {
        // console.log('mousemove',d)
        //document.body.addEventListener('mousemove',d=>console.log('mousemove',d.screenX, d.screenY))
        let [x, y] = [d.layerX, d.layerY]//d3.mouse(this);
        line.attr("transform", `translate(${x-8}, 0)`);
        y += 20;
        if (x > width / 2) x -= 100;

        tooltip
            .style("left", x + "px")
            .style("top", y + "px")
    })

    parent.appendChild(svg.node());
    parent.appendChild(tooltip.node());
    parent.groups = groups;



    const civs = d3.selectAll(".civ")

    civs.data(filteredData, d => d.civilization)
        .transition()
        // .delay((d,i)=>i*10)
        .ease(d3.easeCubic)
        .attr("transform", (d, i) => `translate(0, ${y(i)})`)

    // document.body.append(parent)

    // return parent
}