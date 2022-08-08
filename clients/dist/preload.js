"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // we can also expose variables, not just functions
});
electron_1.contextBridge.exposeInMainWorld('MonitoredHistory', {
    getHistoryData: (dur_days, timezone) => electron_1.ipcRenderer.invoke('getHistoryData', dur_days, timezone),
});
