console.log('PRELOAD LOADED: exposing electronAPI');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Accepts either:
   *  - bill object
   *  - HTML string
   */
  printReceipt: (payload) => {
    console.log('Renderer calling printReceipt.');
    return ipcRenderer.invoke('print-receipt', payload);
  },
  printAppointment: (payload) => {
    console.log('Renderer calling printAppointment.');
    return ipcRenderer.invoke('print-appointment', payload);
  },
});
