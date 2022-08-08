import {contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('MonitoredHistory', {
    getHistoryData: (dur_days:number, timezone:number) => ipcRenderer.invoke('getHistoryData',dur_days,timezone),
  })