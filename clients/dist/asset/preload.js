const TimezoneOffset = 9//-(new Date()).getTimezoneOffset() / 60
/**
 * 유닉스시간(정수)을 날짜로 변경
 * @param {number} dateNumver 
 * @returns number
 */
function unix2date(dateNumver) {
    return (dateNumver + TimezoneOffset * 3600 * 1000) / (24 * 3600 * 1000) | 0
}

function totalString(total) {
    total /= 1000
    const p = x => x < 10 ? `0${x}` : x;
    return `${p(total / 3600 | 0)}ʰ ${p((total / 60 | 0) % 60)}ᵐ ${p((total%60)|0)}ˢ`
}

/**
 * 유닉스시간(정수)을 날짜로 변경
 * @param {number} date 
 * @returns string
 */
function date2string(date) {
    const p = x => x < 10 ? `0${x}` : x;
    const d = (new Date(date * 24 * 3600 * 1000 - 0 * 3600000))//.toLocaleDateString()
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    // return d
}

// 데이터 복사
function copy_historyData(){
    historyData.map(v=>(new Date(v.time)).toLocaleString()+'\t'+v.name+'\t'+v.path).join('\n')
}


function deepcopy(obj){
    return JSON.parse(JSON.stringify(obj)) 
}