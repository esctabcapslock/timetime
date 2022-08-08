"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistoryData = void 0;
const sqlite3 = require("sqlite3");
// import Sqlite = require('better-sqlite3');
// const options = {
//     readonly:true
// }
// const db = Sqlite ('../history.sqlite', options);
const db = new sqlite3.Database('../history.sqlite');
function getHistoryData(dur_days, timezone) {
    return new Promise((resolve) => {
        const day = ((Date.now() / (24 * 3600 * 1000) | 0) - dur_days) * 24 * 3600 * 1000 + timezone * 3600 * 1000;
        db.all(`SELECT * FROM history  WHERE time>?`, day, (err, rows) => {
            resolve(rows);
        });
    });
    // const row = db.prepare(`SELECT * FROM history  WHERE time>${day}`).all()
    // return row
}
exports.getHistoryData = getHistoryData;
console.log(getHistoryData(5, 9));
