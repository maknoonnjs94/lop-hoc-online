/* Cầu nối rất mỏng giữa app và trang web: trang chỉ biết "đang chạy trong app, cửa sổ được bảo vệ".
   Không lộ Node, không lộ hệ thống tệp — sandbox + contextIsolation bật ở main.js. */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lopHocApp', {
  protected: true,
  platform: process.platform,
  /* app dò thấy phần mềm quay / chụp màn hình vừa bật → gọi cb(['obs64.exe', …]) */
  onRecorder: function (cb) { ipcRenderer.on('lophoc:recorder', function (e, names) { cb(names || []); }); },
  /* danh sách đang chạy ngay lúc hỏi (để trang kiểm ngay sau khi đăng nhập) */
  getRecorders: function () { return ipcRenderer.invoke('lophoc:recorders'); }
});
