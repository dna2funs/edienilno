const i_path = require('path');
const i_storage = require('../component/storage');
const i_common = require('../component/common');

const system = {
   baseDir: i_path.resolve(process.env.EDIENILNO_FS_STORAGE || '/tmp'),
   storage: new i_storage.LocalFilesystemStorage(),
};

const api = {
   name: 'simpleEdit',
   version: '0.1',
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
         case 'simpleEdit.load':
            if (!system.storage.sync_exists(filename)) {
               obj.data = '';
               ws.send(JSON.stringify(obj));
               break;
            }
            system.storage.loadSmallFile(filename).then((data) => {
               obj.data = data.toString();
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'simpleEdit.save':
            if (!m.data) return false;
            system.storage.saveSmallFile(filename, m.data).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         default:
            return 0;
      }
      return 1;
   },
};

module.exports = api;