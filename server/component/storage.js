/**
 * IStorage {
 *    lstat,
 *    mkdir,
 *    rmdir,
 *    readdir,
 *    rename,
 *    create,
 *    unlink,
 *    open,
 *    close,
 *    read,
 *    write
 * }
 */

const i_fs = require('fs');
const i_path = require('path');

const helper = {
   fs: {
      mkdir: async (path) => {
         return new Promise((r, e) => {
            i_fs.mkdir(path, (err) => {
               if (err) return e(err);
               r();
            });
         });
      },
      rmdir: async (path) => {
         return new Promise((r, e) => {
            i_fs.rmdir(path, (err) => {
               if (err) return e(err);
               r();
            });
         });
      },
      lstat: async (path) => {
         return new Promise((r, e) => {
            i_fs.lstat(path, (err, stat) => {
               if (err) return e(err);
               // TODO: transform to unified stat
               r({
                  mtime: stat.mtimeMs,
                  atime: stat.atimeMs,
                  ctime: stat.ctimeMs,
                  isDirectory: stat.isDirectory(),
                  isFile: stat.isFile(),
               });
            });
         });
      },
      open: async (path, flags) => {
         return new Promise((r, e) => {
            i_fs.open(path, flags, (err, fd) => {
               if (err) return e(err);
               r(fd);
            });
         });
      },
      close: async (fd) => {
         return new Promise((r, e) => {
            i_fs.close(fd, (err) => {
               if (err) return e(err);
               r();
            });
         });
      },
      unlink: async (path) => {
         return new Promise((r, e) => {
            i_fs.unlink(path, (err) => {
               if (err) return e(err);
               r();
            });
         });
      },
      readdir: async (path) => {
         return new Promise((r, e) => {
            i_fs.readdir(path, (err, files) => {
               if (err) return e(err);
               r(files);
            });
         });
      },
      rename: async (path, newpath) => {
         return new Promise((r, e) => {
            i_fs.rename(path, newpath, (err) => {
               if (err) return e(err);
               r();
            });
         });
      }
   }, // fs
};

class LocalFilesystemStorage {
   async mkdir (path) {
      await helper.fs.mkdir(path);
   }

   async rmdir (path) {
      await helper.fs.rmdir(path);
   }

   async readdir (path) {
      let files = await helper.fs.readdir(path);
      files = files.map((x) => ({ path: x }));
      for (let i = 0, n = files.length; i < n; i++) {
         let fileObj = files[i];
         let filename = i_path.join(path, fileObj.path);
         let stat = await helper.fs.lstat(filename);
         if (stat.isDirectory) {
            files[i].path += '/';
         }
      }
      return files;
   }

   async create (path) {
      let fd = await helper.fs.open(path, 'w+');
      await helper.fs.close(fd);
   }

   async unlink (path) {
      await helper.fs.unlink(path);
   }

   async move (path, newPath) {
      await helper.fs.rename(path, newPath);
   }

   sync_mkdir (path) {
      return i_fs.mkdirSync(path);
   }

   sync_exists (path) {
      return i_fs.existsSync(path);
   }
}

module.exports = {
   LocalFilesystemStorage,
};