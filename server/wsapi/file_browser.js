const i_path = require('path');
const i_uuid = require('uuid');

const i_storage = require('../component/storage');
const i_common = require('../component/common');
const i_utils = require('../utils');

const system = {
   baseDir: i_path.resolve(process.env.EDIENILNO_FS_STORAGE || '/tmp'),
   storage: new i_storage.LocalFilesystemStorage(),
   restful: {
      mapping: {
         // uuid: {filepath, timestamp}
      },
   },
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
            let newMoveFilename = i_common.validatePath(i_path.join(base, m.newpath));
            if (!newMoveFilename) return false;
            system.storage.move(filename, newMoveFilename).then(() => {
               ws.send(JSON.stringify(obj));
            }, () => {
               obj.error = 'failed';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
            });
            break;
         case 'fileBrowser.copy':
            if (!m.newpath) return false;
            let newCopyFilename = i_common.validatePath(i_path.join(base, m.newpath));
            if (!newCopyFilename) return false;
            system.storage.copy(filename, newCopyFilename).then(() => {
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
   restful: {
      fileBrowser: {
         raw: async (req, res, options) => {
            let uuid = options.path.pop();
            let obj = system.restful.mapping[uuid];
            if (!obj) return i_utils.Web.e404(res);
            delete system.restful.mapping[uuid];
            if (!obj.filepath || !obj.timestamp) return i_utils.Web.e400(res);
            let timestamp = new Date().getTime();
            if (timestamp - obj.timestamp >= 1000 * 10 /* 10s */) return i_utils.Web.e400(res);
            let download_filename = obj.filepath;
            let file_size = 0;
            try {
               let stat = await system.storage.lstat(download_filename);
               if (!stat.isFile) throw 'not a file';
               file_size = stat.size;
            } catch(err) {
               return i_utils.Web.e400(res);
            }
            res.writeHead(200, {
               'Content-Type': 'application/octet-stream',
               'Content-Disposition': `attachment; filename=${i_path.basename(download_filename)}`,
               'Content-Length': file_size,
            });
            system.storage.sync_createFileReadStream(download_filename).pipe(res);
         },
         download: async (req, res, options) => {
            let json = options.json;
            let username = json.username;
            let path = json.path;
            if (!username || !path) return i_utils.Web.e400(res);
            let base = i_path.join(system.baseDir, username);
            let download_filename = i_common.validatePath(i_path.join(base, path));
            let uuid = i_uuid.v4();
            while (system.restful.mapping[uuid]) uuid = i_uuid.v4();
            let obj = {
               filepath: download_filename,
               timestamp: new Date().getTime(),
            };
            system.restful.mapping[uuid] = obj;
            cleanUp(uuid);
            i_utils.Web.rjson(res, { uuid });

            function cleanUp(uuid) {
               setTimeout(() => {
                  if (system.restful.mapping[uuid]) delete system.restful.mapping[uuid];
               }, 1000 * 12);
            }
         }, // download
      }
   },
};

api.restful.fileBrowser.download = i_utils.Web.require_login(api.restful.fileBrowser.download);

module.exports = api;