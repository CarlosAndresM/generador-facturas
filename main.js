const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const db = require('./db');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // Esto puede ayudar a evitar problemas de CORS en desarrollo
        }, 

    });
    Menu.setApplicationMenu(null);


    win.loadFile('public/index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('add-store', (event, store) => {
    db.addStore(store, (err) => {
        if (err) console.error(err);
        event.reply('store-added');
        db.getStores((err, stores) => {
            if (err) console.error(err);
            event.sender.send('store-list', stores);
        });
    });
});

ipcMain.on('get-stores', (event) => {
    db.getStores((err, stores) => {
        if (err) console.error(err);
        event.reply('store-list', stores);
        event.reply('store-select-list', stores);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
