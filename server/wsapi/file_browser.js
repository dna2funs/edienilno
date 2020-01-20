const i_path = require('path');
const i_uuid = require('uuid');

const i_storage = require('../component/storage');
const i_common = require('../component/common');
const i_utils = require('../utils');

const system = {
   baseDir: i_path.resolve(process.env.EDIENILNO_FS_STORAGE || '/tmp'),
   storage: new i_storage.LocalFilesystemStorage(),
   mapping: {
      download: {}, // uuid: {filepath, timestamp}
      upload: {}, // uuid: {filepath, filesize, cursor, timestamp}
   },
   DOWNLOAD_MAX_PARALLEL: 100,
   UPLOAD_MAX_PARALLEL: 100,
   UPLOAD_MAX_FILE_SIZE: 1024 * 1024 * 10 /* 10MB */,
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
         case 'fileBrowser.download':
            if (Object.keys(system.mapping.download).length > system.DOWNLOAD_MAX_PARALLEL) {
               obj.error = 'failed: too many parallel downloading ...';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
               break;
            }
            let f_uuid = i_uuid.v4();
            while (system.mapping.download[f_uuid]) f_uuid = i_uuid.v4();
            let dobj =  {
               filepath: filename,
               timestamp: new Date().getTime(),
            };
            system.mapping.download[f_uuid] = dobj;
            obj.uuid = f_uuid;
            downloadCleanUp(dobj, f_uuid);
            ws.send(JSON.stringify(obj));

            function downloadCleanUp(obj, uuid) {
               obj.timer = setTimeout(() => {
                  obj.timer = 0;
                  if (system.mapping.download[uuid]) delete system.mapping.download[uuid];
               }, 1000 * 12);
            }
            break;
         case 'fileBrowser.upload':
            if (!m.size || !m.data) return false;
            if (Object.keys(system.mapping.upload).length > system.UPLOAD_MAX_PARALLEL) {
               obj.error = 'failed: too many parallel uploading ...';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
               break;
            }
            i_common.prepareUserFolder(system.storage, system.baseDir, '_upload_');
            let upload_base = i_path.join(system.baseDir, '_upload_');
            let u_uuid = m.uuid, uobj = system.mapping.upload[u_uuid];
            let size = m.size, offset = m.offset || 0, buf = m.data && toByteArray(m.data);
            if (size > system.UPLOAD_MAX_FILE_SIZE || offset + buf.length > system.UPLOAD_MAX_FILE_SIZE) {
               obj.error = 'failed: the file is too large ...';
               obj.code = 1;
               ws.send(JSON.stringify(obj));
               break;
            }
            if (!u_uuid) {
               u_uuid = i_uuid.v4();
               while (system.mapping.upload[u_uuid]) u_uuid = i_uuid.v4();
               uobj = {
                  filename: filename,
                  timestamp: new Date().getTime(),
                  tmp_filename: null,
               };
               system.mapping.upload[u_uuid] = uobj;
               uploadCleanUp(uobj, u_uuid);
            }
            let upload_tmp_filename = i_path.join(upload_base, u_uuid);
            uobj.tmp_filename = upload_tmp_filename;
            if (m.cancel) {
               _uploadCleanUp(uobj);
               return;
            }
            obj.uuid = u_uuid;
            system.storage.saveFile(upload_tmp_filename, offset, buf).then(() => {
               if (offset + buf.length >= size) { // treat as uploading complete
                  uobj.timer && clearTimeout(uobj.timer);
                  uobj.timer = 0;
                  delete system.mapping.upload[uobj.uuid];
                  system.storage.move(uobj.tmp_filename, uobj.filename).then(() => {
                     obj.ack = 'complete';
                     ws.send(JSON.stringify(obj));
                  }, () => {
                     console.log(new Date().toISOString(), 'failed to upload: buffer error');
                     obj.ack = 'failed';
                     ws.send(JSON.stringify(obj));
                  });
               } else {
                  obj.ack = 'uploading';
                  ws.send(JSON.stringify(obj));
               }
            }, () => {
               obj.ack = 'error';
               ws.send(JSON.stringify(obj));
            });

            function toByteArray(arr) {
               var n = arr.length;
               var b = new Uint8Array(n);
               for (var i = 0; i < n; i++) {
                  b[i] = arr[i].charCodeAt(0);
               }
               arr = null;
               return b;
            }
            function uploadCleanUp(obj, uuid) {
               obj.timer = setTimeout(() => {
                  obj.timer = 0;
                  if (system.mapping.upload[uuid]) delete system.mapping.upload[uuid];
                  _uploadCleanUp(obj);
               }, 1000 * 3600 * 24);
            }
            function _uploadCleanUp(obj) {
               if (obj.tmp_filename) system.storage.unlink(obj.tmp_filename).then(() => {}, () => {
                  console.error(new Date().toISOString(), 'failed to remove tmp file:', obj.tmp_filename);
               });
            }
            break;
         default:
            return false;
      }
      return true;
   },
   restful: {
      fileBrowser: {
         download: async (req, res, options) => {
            let uuid = options.path.pop();
            let obj = system.mapping.download[uuid];
            if (!obj) return i_utils.Web.e404(res);
            delete system.mapping.download[uuid];
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
         }, // download
      }, // fileBrowser
   }, // restful
};

module.exports = api;