const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('omniDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '0.4.0',
  serverUrl: 'http://127.0.0.1:8092',
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  saveFile: (options) => ipcRenderer.invoke('save-file', options)
});
