"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const history_1 = require("./history");
// Main.main(app, BrowserWindow);
const path_1 = require("path");
const createWindow = () => {
    const win = new electron_1.BrowserWindow({
        width: 1400,
        height: 800,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
    });
    electron_1.ipcMain.handle('getHistoryData', (e, dur_days, timezone) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[getHistoryData]', dur_days, timezone);
        return yield (0, history_1.getHistoryData)(dur_days, timezone);
    }));
    win.loadFile((0, path_1.join)(__dirname, 'asset/index.html'));
    // Open the DevTools.
    win.webContents.openDevTools();
};
// 새 창 열림 공격 방지
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        // In this example, we'll ask the operating system
        // to open this event's url in the default browser.
        //
        // See the following item for considerations regarding what
        // URLs should be allowed through to shell.openExternal.
        //   if (isSafeForExternalOpen(url)) {
        setImmediate(() => {
            electron_1.shell.openExternal(url);
        });
        //   }
        return { action: 'deny' };
    });
});
electron_1.app.whenReady().then(() => {
    createWindow();
});
