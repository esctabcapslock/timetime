import sqlite3 = require('sqlite3');

// import Sqlite = require('better-sqlite3');
// const options = {
//     readonly:true
// }
// const db = Sqlite ('../history.sqlite', options);

const db = new sqlite3.Database('../history.sqlite');


export function getHistoryData(dur_days:number, timezone:number, ):Promise<{time:number,name:string,path:string}[]>{
    return new Promise((resolve)=>{
    
    const day =  ((Date.now()/(24*3600_000)|0)-dur_days)*24*3600_000 - timezone*3600_000
    console.log('[sql]',`SELECT * FROM history  WHERE time>?`,day);
    db.all(`SELECT * FROM history`,(err,rows)=>{
    // db.all(`SELECT * FROM history  WHERE time>?`,day,(err,rows)=>{
        console.log('[length]',rows.length)
        resolve(rows)
    })
    })
    
    // const row = db.prepare(`SELECT * FROM history  WHERE time>${day}`).all()
    // return row
}

// only test
// console.log(getHistoryData(5,9))