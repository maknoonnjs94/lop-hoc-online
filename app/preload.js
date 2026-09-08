/* Cầu nối rất mỏng giữa app và trang web: trang chỉ biết "đang chạy trong app, cửa sổ được bảo vệ".
   Không lộ Node, không lộ hệ thống tệp — sandbox + contextIsolation bật ở main.js. */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('lopHocApp', {
  protected: true,
  platform: process.platform
});
