import { app, BrowserWindow, shell, ipcMain  } from 'electron';
import {getHistoryData} from "./history"

// Main.main(app, BrowserWindow);
import { join } from 'path';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      
    },
  })

  ipcMain.handle('getHistoryData', async (e,dur_days:number, timezone:number) => {
    console.log('[getHistoryData]',dur_days, timezone)
    return await getHistoryData(dur_days, timezone);
  })
  win.loadFile(join(__dirname,'asset/index.html'))

  // Open the DevTools.
  win.webContents.openDevTools()
}


// 새 창 열림 공격 방지
app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      // In this example, we'll ask the operating system
      // to open this event's url in the default browser.
      //
      // See the following item for considerations regarding what
      // URLs should be allowed through to shell.openExternal.
    //   if (isSafeForExternalOpen(url)) {
        setImmediate(() => {
          shell.openExternal(url)
        })
    //   }
  
      return { action: 'deny' }
    })
  })


app.whenReady().then(() => {
  createWindow()
})