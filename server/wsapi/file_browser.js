const i_path = require('path');
const i_storage = require('../component/storage');
const i_common = require('../component/common');

const system = {
   baseDir: i_path.resolve(process.env.EDIENILNO_FS_STORAGE || '/tmp'),
   storage: new i_storage.LocalFilesystemStorage(),
};

const api = {
   initialize: () => {},
   process: (ws, m, env) => {
      if (!m.cmd || !m.id || !m.path) return false;
      let username = env.username;
      if (!username) return false;
      i_common.prepareUserFolder(system.storage, system.baseDir, username);
      let base = i_path.join(system.baseDir, username);
      let filename = i_common.validatePath(i_path.join(base, m.path));
      if (!filename) return false;
      let obj = { id: m.id };
      switch(m.cmd) {
         case 'fileBrowser.list':
            system.storage.readdir(filename).then((file_list) => {
               obj.list = file_list;
               ws.send(JSON.stringify(obj));
            }, (err) => {
               console.log(err);
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'fileBrowser.mkdir':
            system.storage.mkdir(filename).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'fileBrowser.rmdir':
            system.storage.rmdir(filename).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'fileBrowser.create':
            system.storage.create(filename).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'fileBrowser.delete':
            system.storage.unlink(filename).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'fileBrowser.move':
            if (!m.newpath) return false;
            let newFilename = i_common.validatePath(i_path.join(base, m.newpath));
            if (!newFilename) return false;
            system.storage.move(filename, newFilename).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         default:
            return false;
      }
      return true;
   },
};
module.exports = api;