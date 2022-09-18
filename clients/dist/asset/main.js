//
//c_rawData.classifiDateAndPath(Date.now()-24*3600_000,Date.now())[  urlData   ][19251].map(v=>{return { s: (new Date(v.s)).toLocaleTimeString(), e: (new Date(v.e)).toLocaleTimeString()}})

class HistoryData{
    /**
     * 
     * @param {{time:number,path:number,name:string}[]} rawData 
     */
    constructor(rawData){
        this.rawData = rawData
        this.historyData = this.createHistoryData(rawData)
    }

    /**
     * raw data를 바탕으로 histroydata를 생성
     * @param {{time:number,path:number,name:string}[]} rawData 
     * @returns {{s:number,e:number, path:string, name:string}[]}
     */
    createHistoryData(rawData){

        /**  @type {{s:number,e:number}[]} */
        const HistroyData = []

        const record = (dateKey, path, dur, end, name) => HistroyData.push({ s: end - dur, e: end, path, name })
        // HistroyData.push({ s: (new Date(end - dur)).toLocaleTimeString(), e: (new Date(end)).toLocaleTimeString(), path:path })
        let pre = null
        for (const d of rawData) {
            const dateKey = unix2date(d.time)
            if (pre == null) { pre = d; continue; }
    
            const path = 0;
            const dur = d.time - pre.time;
            const cons = (path == pre.path)
    
            if (dur > 61 * 1000) { pre = d; continue; } //61초 이상 기록이 끊기면 모르는거임
            if (cons) record(dateKey, d.path, dur, d.time)
            else {
                record(unix2date(pre.time), pre.path, dur / 2, d.time - dur / 2)
                record(dateKey, d.path, dur / 2, d.time)
            }
            pre = d;
        }

        return HistroyData
    }


    /**
     * 
     * @param {number} start 
     * @param {number} end 
     * @returns {{[key:string]:{[key:string]:{s:number,e:number, path:string, name:string}}[]}}
     */
    classifiDateAndPath(start,end){
        const out = {}
        
        for(let {s,e,path,name} of this.historyData){
            if (e<=start || s>=end) continue
            if (s<start) s=start
            if (e>end) e=end


            const record = (s,e,date,path, name)=>{
                if(!out[path]) out[path]={}
                if(!out[path][date]) out[path][date] = []
                out[path][date].push({s,e,path,name})
            }

            const date_s = unix2date(s)
            let pre_time = s
            for(let now_time=(date_s+1)*24*3600_1000; now_time<e; now_time+=24*3600_1000){
                record(pre_time, now_time, unix2date(pre_time),path,name);
                pre_time = now_time
            }
            record(pre_time,e,unix2date(pre_time),path,name)
        }
        return out;
    }



    /**
     * 
     * @param {number} start 
     * @param {number} end 
     * @returns {{[key:string]:{[key:string]:number}}
     */
    sumByDateAndPath(start,end){
        const pathdatedict = this.classifiDateAndPath(start,end);
        const out = {}

        for(const path in pathdatedict) {
            out[path] = {}
            for (const  date in pathdatedict[path]) {
                out[path][date] = 0
                for (const rcords of pathdatedict[path][date]){
                    out[path][date] += (rcords.e - rcords.s)
                }
            }
        }
        return out;
    }


    /**
     * 
     * @param {number} start 
     * @param {number} end 
     * @returns {{total:number, data:{[key:string]:{[key:string]:number}}}}
     */
     sumByPath(start,end){
        const pathdatedict = this.classifiDateAndPath(start,end);
        const data = {}
        let total = 0

        for(const path in pathdatedict) {
            data[path] = 0
            for (const  date in pathdatedict[path]) {
                for (const rcords of pathdatedict[path][date]){
                    data[path] += (rcords.e - rcords.s)
                }
            }
            total += data[path]
        }
        return {total, data};
    }


    /** 
     * @param {number} start 
     * @param {number} end 
     * @returns {{chartinput:{date:string,path:string,dur:number}[], piechartinput:{path:string, dur:number}[]} */
    getTotalTimeByDate(start, end){
        const data = this.sumByDateAndPath(start,end)
        /** @type {{date:string,path:string,dur:number}[]} */
        const chartinput = []
        const pathList = []
        const dateList = []
        for(let date = unix2date(start); (unix2date(end)==unix2date(end-1))?date<=unix2date(end):date<unix2date(end); date++) dateList.push(date);
        for(const path in data) pathList.push(path);

        for(const path of pathList){
            for(const date of dateList){
                const dur = (data[path]?(data[path][date]?data[path][date]:0):0)
                chartinput.push({ date: date2string(date), path, dur: dur / 3600_000 })
            }
        }
        chartinput.sort((a,b)=>a.dur-b.dur).sort((a,b)=>(a.date>b.date)?1:-1)
        console.log('[chartinput]',chartinput)

        /** @type {{path:string, dur:number}[]} */
        const piechartinput = []
        for (const path in data){
            let dur_sum = 0
            for(const date in data[path]) dur_sum += data[path][date]
            piechartinput.push({path,dur:dur_sum})
        }
        piechartinput.sort((a,b)=>-a.dur+b.dur)
        return {chartinput, piechartinput}
    }
    /** 
     * @param {number} start 
     * @param {number} end 
     * @returns {{color:{r:number,g:number,b:number},path:string,total:number,data:{s:number,e:number,dur:number}[]}[]} */
    getTimelineByDate(start, end){
        const data = []
        const pathdatedict = this.classifiDateAndPath(start,end)
        const pathsum = this.sumByPath(start,end)
        const pathdict = {}
        for(const path in pathdatedict) {
            pathdict[path] = []
            for (const  date in pathdatedict[path]) {
                for(const records of pathdatedict[path][date]){
                    pathdict[path].push(records)
                    data.push(records)
                }
            }
        }
        data.sort((a,b)=>a.s-b.s)
        console.log('pathsum',data)
        /**
         * 
         * @param {{s:number,e:number}[]} pathHistory 
         * @returns {s:number,e:number,dur:number}
         */
        function getForPathdictEle(pathHistory) {
            // console.log('[path]',pathHistory)
            // pathHistory = pathHistory.sort((a,b)=>a.s-b.s)
            const newdata = []
            let preRange = null
            const timeout = 2 * 60 * 1000
            for (const range of pathHistory) {
                if((range.e-range.s)<0) console.log('kkkkkkkk')

                if (preRange == null) { preRange = {...range}; preRange.dur = (range.e - range.s); continue; }
                if ((range.s - preRange.e) < timeout) { preRange.e = range.e; preRange.dur += (range.e - range.s) }
                else {
                    newdata.push(preRange)
                    preRange = {...range};
                    preRange.dur = (range.e - range.s)
                }

                if(preRange.e<preRange.s) throw('outs')
                // preRange=range;
            }
            if (preRange !== null) newdata.push(preRange)
            // console.log('[newdata]',newdata.map(v=>(v.e-v.s)));
            return newdata
        }
    
        /**
         * timeline 막대 차트를 위한 변수
         * @type {{color:{r:number,g:number,b:number},path:string,total:number,data:{s:number,e:number,dur:number}[]}[]}
         */
        const pathout = [{ path:'전체', data: getForPathdictEle(data), total: pathsum.total }]
        for (const path in pathdict) pathout.push({ path, data: getForPathdictEle(pathdict[path]), total: pathsum.data[path] })

        pathout.sort((a, b) => -pathsum.data[a.path] + pathsum.data[b.path])
        return pathout;
    }
}

(async () => {
    // const rawData = historyData//await MonitoredHistory.getHistoryData(7,TimezoneOffset)
    const rawData = await MonitoredHistory.getHistoryData(7,TimezoneOffset)
    const c_rawData = new HistoryData(rawData);
    window.c_rawData = c_rawData
    console.log('[rawData]', rawData);

    window.distoryData = rawData;


    

    const {chartinput, piechartinput} =  c_rawData.getTotalTimeByDate(Date.now()-7*24*3600_000,Date.now())
    const stackchart_view = document.getElementById('stackchart_view')
    if(!stackchart_view) throw("stackchart_view error!")
    else ab(stackchart_view, chartinput)

    const piechart_view = document.getElementById('piechart_view')
    if(!piechart_view) throw("piechart_view error!")
    else ac(piechart_view, piechartinput)
    
    timeline()

})();



// function aa() {
//     //https://observablehq.com/@d3/stacked-area-chart#key
//     var chart = StackedAreaChart(chartinput, {
//         x: d => d.date,
//         y: d => d.dur,
//         z: d => d.path,
//         yLabel: "↑ 시각",
//         xLabel: "날짜",
//         width: 500,
//         height: 500
//     })

//     document.body.append(chart)

// }


/**
 * stack bar 차트 그리는 함수
 * @param {HTMLElement} parent 
 * @param {{date:string,path:string,dur:number}[]} inputData
 */
 function ab(parent, inputData) {
    var chart = StackedBarChart(inputData, {
        x: d => d.date,
        y: d => d.dur,
        z: d => d.path,
        yLabel: "↑ 시간",
        xLabel: "날짜",
        width: 500,
        height: 500
    })
    parent.append(chart)

}


/**
 * 파이 차트 그리는 함수
 * @param {HTMLElement} parent 
 * @param {{path:string, dur:number}[]} inputData
 */
function ac(parent, inputData) {
    const sum = inputData.reduce((a, b) => a + b.dur, 0)
    let pi_else = 0
    const piout_f = inputData.filter(v => {
        if (v.dur < sum / 50) { pi_else += v.dur; return false }
        else return true
    }).map(d => {
        let { path, dur } = d;
        // console.log('p',path,dur);
        const k = path.split('\\');
        k.reverse()
        path = k[0]//k[1]+'\\'+
        return { path, dur }

    })
    piout_f.push({ path: 'else', dur: pi_else })
    console.log('[piout_f]', piout_f)
    var chart = DonutChart(piout_f, {
        name: d => d.path,
        value: d => d.dur,
        width: 500,
        height: 500
    })

    parent.append(chart)
}
