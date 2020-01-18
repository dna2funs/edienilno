(function () {

//@include common.js#edienilno.DropdownView

var system = {
   bundle: null
};

function basename(filename) {
   if (!filename || filename === '/') return null;
   return filename.split('/').pop();
}

function recognize(object) {
   if (!object) return null;
   if (object.getAttribute) {
      if (object.getAttribute('data-folder')) return 'folder';
      if (object.getAttribute('data-file')) return 'file';
      return object.getAttribute('data-type') || 'dom';
   }
   return 'unkown';
}

function getItemByMenuOject(menuDom) {
   var parent = menuDom.parentNode;
   if (!parent) return null;
   parent = parent.parentNode;
   if (!parent) return null;
   return parent.children[1];
}

function actionNewFolder(_this) {
   var dialog = new edienilno.InputBox({
      titleText: 'New Folder',
      bodyText: 'Type the folder name:',
      okStyle: 'btn btn-success',
      okFn: function () {
         var newname = dialog.getValue();
         if (/[`!@&*\\|?/><:]/.test(newname)) {
            alert('invalid filename');
            return;
         }
         var path = _this.data.filename + newname;
         system.bundle.client.request(
            {
               cmd: 'fileBrowser.mkdir',
               path: path
            },
            function (obj) {
               _this.dom.tmp.actionDialog = null;
               dialog.dispose();
               if (obj.error) {
                  alert('failed to create the folder ...');
               } else {
                  _this.load(_this.data.filename);
               }
            }
         );
         _this.data.selected = null;
      },
      cancelFn: function () {
         dialog.dispose();
         _this.dom.tmp.actionDialog = null;
      }
   });
   dialog.act();
   _this.dom.tmp.actionDialog = dialog;
}

function actionNewFile(_this) {
   var dialog = new edienilno.InputBox({
      titleText: 'New File',
      bodyText: 'Type the file name:',
      okStyle: 'btn btn-success',
      okFn: function () {
         var newname = dialog.getValue();
         if (/[`!@&*\\|?/><:]/.test(newname)) {
            alert('invalid filename');
            return;
         }
         var path = _this.data.filename + newname;
         system.bundle.client.request(
            {
               cmd: 'fileBrowser.create',
               path: path
            },
            function (obj) {
               _this.dom.tmp.actionDialog = null;
               dialog.dispose();
               if (obj.error) {
                  alert('failed to create the file ...');
               } else {
                  _this.load(_this.data.filename);
               }
            }
         );
         _this.data.selected = null;
      },
      cancelFn: function () {
         dialog.dispose();
         _this.dom.tmp.actionDialog = null;
      }
   });
   dialog.act();
   _this.dom.tmp.actionDialog = dialog;
}

function actionCopy(_this) {
   var selected = _this.data.selected;
   _this.data.selected = null;
   if (selected.basename.endsWith('/')) {
      alert('Not yet support copying folder.');
      return;
   }
   _this.data.copycut.push(
      _this.data.filename,
      selected.basename,
      'copy'
   );
   _this.render();
}

function actionCut(_this) {
   var selected = _this.data.selected;
   _this.data.selected = null;
   _this.data.copycut.push(
      _this.data.filename,
      selected.basename,
      'cut'
   );
   _this.render();
}

function actionPaste(_this) {
   var filemap = {};
   _this.data.filelist.forEach(function (item) { filemap[item.path] = 1; });
   var file_list = _this.data.copycut.getAll();
   file_list = file_list && file_list.filter(function (item) {
      if (item.dirpath !== _this.data.filename || !filemap[item.basename]) return true;
      if (item.type !== 'cut') return true;
      return false;
   });
   if (!file_list || !file_list.length) {
      alert('No available files for pasting.');
      return;
   }
   var pasteMask = document.createElement('div');
   var pasteList = document.createElement('div');
   var btnBack = document.createElement('div');
   btnBack.innerHTML = 'Cancel';
   btnBack.className = 'xitem-btn xitem-orange';
   btnBack.style.width = '100%';
   pasteList.appendChild(btnBack);
   file_list.forEach(function (item) {
      var div = document.createElement('div');
      div.classList.add('xitem');
      div.style.display = 'flex';
      var actionbar = document.createElement('span');
      actionbar.style.flex = '0 1 auto';
      actionbar.style.marginRight = '2px';
      var btn;
      btn = document.createElement('button');
      btn.style.border = '0px';
      btn.style.background = 'transparent';
      btn.setAttribute('data-dirpath', item.dirpath);
      btn.setAttribute('data-name', item.basename);
      if (item.type === 'copy') {
         btn.innerHTML = 'Copy';
         btn.setAttribute('data-type', 'item-copy-paste');
      } else {
         btn.innerHTML = 'Move';
         btn.setAttribute('data-type', 'item-cut-paste');
      }
      actionbar.appendChild(btn);
      var name = document.createElement('span');
      name.style.flex = '1 1 auto';
      name.style.textOverflow = 'ellipsis';
      name.style.overflow = 'hidden';
      name.style.whiteSpace = 'nowrap';
      div.appendChild(actionbar);
      div.appendChild(name);
      div.style.cursor = 'pointer';
      div.setAttribute('draggable', 'true');
      name.appendChild(document.createTextNode(item.dirpath + item.basename));
      if (item.basename.endsWith('/')) {
         div.classList.add('xitem-purple');
      } else {
         div.classList.add('xitem-blue');
      }
      pasteList.appendChild(div);
   });
   _this.dom.self.appendChild(pasteList);
   pasteMask.style.position = 'absolute';
   pasteMask.style.opacity = 0.5;
   pasteMask.style.backgroundColor = 'white';
   pasteMask.style.top = '0px';
   pasteMask.style.left = '0px';
   pasteMask.style.width = '100%';
   pasteMask.style.height = pasteList.offsetTop + 'px';
   pasteMask.style.zIndex = '1999'; // make sure dialog 2000, 2001 on the top
   _this.dom.self.appendChild(pasteMask);

   var _event = {
      click: {
         btnBack: function (evt) {
            evt && evt.stopPropagation && evt.stopPropagation();
            btnBack.removeEventListener('click', _event.click.btnBack);
            pasteList.removeEventListener('click', _event.click.btnPaste);
            pasteMask.parentNode.removeChild(pasteMask);
            pasteList.parentNode.removeChild(pasteList);
         },
         btnPaste: function (evt) {
            var dirpath = evt.target.getAttribute('data-dirpath');
            if (!dirpath) return;
            var name = evt.target.getAttribute('data-name');
            if (!name) return;
            var type = recognize(evt.target);
            var parts = name.split('.');
            if (name.endsWith('/')) {
               parts = [name.substring(0, name.length-1), '/'];
            } else if (parts.length === 1) {
               parts = [parts[0], ''];
            } else {
               parts = [parts.slice(0, parts.length-1).join('.'), '.' + parts[parts.length-1]];
            }
            var index = 2;
            var newname = name;
            while (filemap[newname] || filemap[newname + '/']) {
               newname = parts[0] + '_' + index + parts[1];
               index ++;
            }
            var newpath = _this.data.filename + newname;
            switch(type) {
               case 'item-copy-paste':
                  system.bundle.client.request(
                     {
                        cmd: 'fileBrowser.copy',
                        path: dirpath + name,
                        newpath: newpath
                     },
                     function (obj) {
                        if (obj.error) {
                           alert('failed to copy (copy-paste) ...');
                        } else {
                           _this.data.copycut.pop(dirpath, name);
                           _this.load(_this.data.filename);
                           _event.click.btnBack();
                        }
                     }
                  );
                  break;
               case 'item-cut-paste':
                  system.bundle.client.request(
                     {
                        cmd: 'fileBrowser.move',
                        path: dirpath + name,
                        newpath: newpath
                     },
                     function (obj) {
                        if (obj.error) {
                           alert('failed to move (cut-paste) ...');
                        } else {
                           _this.data.copycut.pop(dirpath, name);
                           _this.load(_this.data.filename);
                           _event.click.btnBack();
                        }
                     }
                  );
                  break;
            }
         }
      }
   };
   btnBack.addEventListener('click', _event.click.btnBack);
   pasteList.addEventListener('click', _event.click.btnPaste);
}

function actionRename(_this) {
   var dialog = new edienilno.InputBox({
      titleText: 'Rename',
      bodyText: 'Type a new name:',
      okStyle: 'btn btn-success',
      inputValue: _this.data.selected.basename.split('/')[0],
      okFn: function () {
         var selected = _this.data.selected;
         var path = selected.filename;
         if (path.endsWith('/')) path = path.substring(0, path.length-1);
         var newname = dialog.getValue();
         if (/[`!@&*\\|?/><:]/.test(newname)) {
            alert('invalid filename');
            return;
         }
         var newpath = _this.data.filename + newname;
         system.bundle.client.request(
            {
               cmd: 'fileBrowser.move',
               path: path,
               newpath: newpath
            },
            function (obj) {
               _this.dom.tmp.actionDialog = null;
               dialog.dispose();
               if (obj.error) {
                  alert('failed to rename ...');
               } else {
                  _this.data.copycut.update(
                     selected.dirname, selected.basename.split('/')[0],
                     _this.data.filename, newname
                  );
                  _this.load(_this.data.filename);
               }
            }
         );
         _this.data.selected = null;
      },
      cancelFn: function () {
         dialog.dispose();
         _this.dom.tmp.actionDialog = null;
      }
   });
   dialog.act();
   _this.dom.tmp.actionDialog = dialog;
}

function actionDelete(_this) {
   var dialog = new edienilno.YesNoCancelBox({
      titleText: 'Delete',
      bodyText: 'Confirm to delete the file of "' + _this.data.selected.basename + '"',
      yesTitle: 'OK',
      yesStyle: 'btn btn-danger',
      cancelTitle: 'Cancel',
      yesFn: function () {
         var selected = _this.data.selected;
         var cmd = 'fileBrowser.delete';
         if (selected.isDir) cmd = 'fileBrowser.rmdir';
         system.bundle.client.request(
            {
               cmd: cmd,
               path: selected.filename
            },
            function (obj) {
               _this.dom.tmp.actionDialog = null;
               dialog.dispose();
               if (obj.error) {
                  alert('failed to delete ...');
               } else {
                  _this.data.copycut.pop(selected.dirname, selected.basename);
                  _this.load(_this.data.filename);
               }
            }
         );
         _this.data.selected = null;
      },
      cancelFn: function () {
         _this.dom.tmp.actionDialog = null;
         dialog.dispose();
      }
   });
   dialog.act();
   _this.dom.tmp.actionDialog = dialog;
}

function actionUpload(_this) {
   console.log('TODO: upload');
}

function actionDownload(_this) {
   console.log('TODO: download');
}

function createItemMenu(parent) {
   var menu = new edienilno.DropdownView();
   var div = document.createElement('div');
   div.className = 'dropdown-menu';
   var item;
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Download';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'download');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Rename';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'rename');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Cut';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'cut');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Copy';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'copy');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Delete';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'delete');
   div.appendChild(item);
   var component = menu.getDom();
   component.appendChild(div);
   component.classList.add('dropdown');
   component.classList.add('open');
   menu.hide();
   parent.appendChild(component);
   return menu;
}

function createTitleMenu(parent) {
   var menu = new edienilno.DropdownView();
   var div = document.createElement('div');
   div.className = 'dropdown-menu';
   var item;
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'New Folder';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'newdir');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'New File';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'newfile');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Paste';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'paste');
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Upload';
   item.setAttribute('data-type', 'item-action');
   item.setAttribute('data-action', 'upload');
   div.appendChild(item);
   var component = menu.getDom();
   component.appendChild(div);
   component.classList.add('dropdown');
   component.classList.add('open');
   menu.hide();
   parent.appendChild(component);
   return menu;
}

function CopyCutList() {
   this._list = [];
}
CopyCutList.prototype = {
   get: function (dirpath, basename) {
      return this._list.filter(function (item) {
         return item.dirpath === dirpath && item.basename === basename;
      })[0];
   },
   push: function (dirpath, basename, type) {
      var existing = this.get(dirpath, basename);
      if (existing) {
         existing.type = type;
      } else {
         existing = {
            dirpath: dirpath,
            basename: basename,
            type: type
         };
         this._list.push(existing);
      }
   },
   update: function (dirpath, basename, newdirpath, newbasename) {
      var existing = this.get(dirpath, basename);
      if (existing) {
         existing.dirname = newdirpath;
         existing.basename = newbasename;
      }
   },
   pop: function (dirpath, basename) {
      var existing = this.get(dirpath, basename);
      if (existing) {
         var index = this._list.indexOf(existing);
         this._list.splice(index, 1);
      }
   },
   getAll: function () {
      return this._list;
   }
};

function EdienilnoFileBrowser(id, filename) {
   this.id = id;
   this.data = {
      loading: true,
      filename: filename,
      filelist: [],
      copycut: new CopyCutList()
   };
   var div = document.createElement('div');
   var nav = new edienilno.SideItem(null, basename(filename) || '(root)', filename);
   this.dom = {
      self: div,
      list: document.createElement('div'),
      btnUp: document.createElement('div'),
      nav: nav,
      menu: {
         title: createTitleMenu(div),
         item: createItemMenu(div)
      },
      tmp: {}
   };
   this.dom.btnUp.innerHTML = '../';
   this.dom.btnUp.className = 'xitem xitem-purple';
   this.dom.btnUp.style.cursor = 'pointer';
   this.dom.btnUp.setAttribute('data-folder', '../');
   var title = document.createElement('div');
   this.dom.title_menu = document.createElement('button');
   this.dom.title_menu.style.border = '0px';
   this.dom.title_menu.style.background = 'transparent';
   this.dom.title_menu.innerHTML = '&#8942;';
   this.dom.title_menu.setAttribute('data-type', 'title-menu');
   title.appendChild(this.dom.title_menu);
   title.appendChild(document.createTextNode('File Browser'));
   title.className = 'xitem xitem-yellow';
   system.bundle.editorTab.getDom().appendChild(nav.dom.self);
   nav.dom.self.setAttribute('data-plugin', plugin.name);
   nav.dom.self.setAttribute('data-id', id);

   var _this = this;
   this.event = {
      click: function (evt) {
         var parts, value;
         switch(recognize(evt.target)) {
            case 'folder':
               value = evt.target.getAttribute('data-folder');
               if (value === '../') {
                  parts = _this.data.filename.split('/');
                  parts.pop();
                  parts.pop();
                  _this.data.filename = parts.join('/') + '/';
                  value = '';
               }
               _this.load(_this.data.filename + value);
               return;
            case 'file':
               value = evt.target.getAttribute('data-file');
               system.bundle.pluginer.open(_this.data.filename + value);
               return;
         }
      },
      title: {
         menuClick: function (evt) {
            var type = recognize(evt.target);
            if (type !== 'title-menu') return;
            _this.dom.menu.title.stick(evt.target);
            _this.dom.menu.title.show();
            var menuDom = _this.dom.menu.title.getDom();
            var menuH = menuDom.children[0].offsetHeight, menuY = menuDom.offsetTop;
            var containerH = _this.dom.self.parentNode.offsetHeight;
            if (menuY + menuH > containerH) {
               var top = menuY - menuH;
               if (_this.dom.menu.title.dom.stick_to) top -= _this.dom.menu.title.dom.stick_to.offsetHeight;
               menuDom.style.top = top + 'px';
            }
         },
         menuItemClick: function (evt) {
            var type = recognize(evt.target);
            if (type !== 'item-action') return;
            var action = evt.target.getAttribute('data-action');
            _this.dom.menu.title.hide();
            switch(action) {
               case 'newdir':
                  actionNewFolder(_this);
                  break;
               case 'newfile':
                  actionNewFile(_this);
                  break;
               case 'paste':
                  actionPaste(_this);
                  break;
               case 'upload':
                  actionUpload(_this);
                  break;
            }
         }
      },
      item: {
         drag: function (evt) {},
         drop: function (evt) {},
         menuClick: function (evt) {
            var type = recognize(evt.target);
            if (type !== 'item-menu') return;
            var item = getItemByMenuOject(evt.target);
            _this.data.selected = {
               isDir: !!item.getAttribute('data-folder'),
               isFile: !!item.getAttribute('data-file'),
               dirname: _this.data.filename,
               basename: item.getAttribute('data-folder') || item.getAttribute('data-file'),
               filename: _this.data.filename + (item.getAttribute('data-folder') || item.getAttribute('data-file')) 
            };
            _this.dom.menu.item.stick(evt.target);
            _this.dom.menu.item.show();
            var menuDom = _this.dom.menu.item.getDom();
            var menuH = menuDom.children[0].offsetHeight, menuY = menuDom.offsetTop;
            var containerH = _this.dom.self.parentNode.offsetHeight;
            if (menuY + menuH > containerH) {
               var top = menuY - menuH;
               if (_this.dom.menu.item.dom.stick_to) top -= _this.dom.menu.item.dom.stick_to.offsetHeight;
               menuDom.style.top = top + 'px';
            }
         },
         menuItemClick: function (evt) {
            var type = recognize(evt.target);
            if (type !== 'item-action') return;
            var action = evt.target.getAttribute('data-action');
            _this.dom.menu.item.hide();
            switch(action) {
               case 'rename':
                  actionRename(_this);
                  break;
               case 'cut':
                  actionCut(_this);
                  break;
               case 'copy':
                  actionCopy(_this);
                  break;
               case 'delete':
                  actionDelete(_this);
                  break;
               case 'download':
                  actionDownload(_this);
                  break;
            }
         }
      },
      itemContainer: {
         dragover: function (evt) {
            evt.preventDefault();
         },
         drop: function (evt) {
            evt.preventDefault();
         }
      },
      btnCloseClick: function (evt) {
         api.close(_this.id);
      }
   };
   var tmp;
   tmp = document.createElement('button');
   tmp.style.float = 'right';
   tmp.innerHTML = '&times;';
   tmp.style.border = '1px solid black';
   tmp.style.backgroundColor = '#fbf59f';
   tmp.style.marginTop = '-3px';
   tmp.style.marginRight = '5px';
   this.dom.btnClose = tmp;
   title.appendChild(tmp);
   this.dom.self.appendChild(title);
   this.dom.self.appendChild(this.dom.btnUp);
   this.dom.self.appendChild(this.dom.list);
   this.dom.self.addEventListener('click', this.event.click);
   this.dom.self.addEventListener('click', this.event.item.menuClick);
   this.dom.btnClose.addEventListener('click', this.event.btnCloseClick);
   this.dom.menu.item.getDom().addEventListener('click', this.event.item.menuItemClick);
   this.dom.title_menu.addEventListener('click', this.event.title.menuClick);
   this.dom.menu.title.getDom().addEventListener('click', this.event.title.menuItemClick);

   this.hide();
   this.load(filename);
}
EdienilnoFileBrowser.prototype = {
   _empty: function () {
      while (this.dom.list.children.length) {
         this.dom.list.removeChild(this.dom.list.children[0]);
      }
      this.dom.list.innerHTML = '';
   },
   load: function (path) {
      if (!system.bundle.client.isOnline()) {
         alert('Offline.');
         return;
      }
      var _this = this;
      this.data.loading = true;
      this.data.filename = path;
      if (path === '/') {
         this.dom.btnUp.style.display = 'none';
      } else {
         this.dom.btnUp.style.display = 'block';
      }
      if (path.endsWith('/')) {
         path = path.substring(0, path.length-1);
      }
      this.dom.nav.setTitle(basename(path) || '(root)');
      this.dom.nav.setDescription(this.data.filename);
      this._empty();
      this.dom.list.innerHTML = 'Loading ...';
      return new Promise(function (r, e) {
         var timeout = false;
         var timer = setTimeout(function () {
            timeout = true;
            e();
         }, 1000 * 10);
         system.bundle.client.request(
            {cmd: 'fileBrowser.list', path: _this.data.filename},
            function (data) {
               if (timeout) return;
               _this.data.loading = false;
               _this.data.filelist = data.list;
               _this.data.filelist.sort(function (a, b) {
                  if (a.path.endsWith('/')) {
                     if (b.path.endsWith('/')) {
                        return (a > b)?-1:1
                     }
                     return -1;
                  } else if (b.path.endsWith('/')) {
                     return 1;
                  } else {
                     return (a > b)?-1:1;
                  }
               });
               clearTimeout(timer);
               _this.render();
               r();
            }
         );
      });
   },
   renderOne: function (path) {
      var div = document.createElement('div');
      div.classList.add('xitem');
      div.style.display = 'flex';
      var actionbar = document.createElement('span');
      actionbar.style.flex = '0 1 auto';
      actionbar.style.marginRight = '2px';
      var btn;
      btn = document.createElement('button');
      btn.style.border = '0px';
      btn.style.background = 'transparent';
      btn.innerHTML = '&#8942;';
      btn.setAttribute('data-type', 'item-menu');
      actionbar.appendChild(btn);
      var name = document.createElement('span');
      name.style.flex = '1 1 auto';
      div.appendChild(actionbar);
      div.appendChild(name);
      if (path.endsWith('/')) {
         div.classList.add('xitem-purple');
         name.setAttribute('data-folder', path);
      } else {
         div.classList.add('xitem-blue');
         name.setAttribute('data-file', path);
      }
      var copycut = this.data.copycut.get(this.data.filename, path);
      if (copycut && copycut.type === 'cut') name.style.opacity = '0.5';
      div.style.cursor = 'pointer';
      div.setAttribute('draggable', 'true');
      name.appendChild(document.createTextNode(path));
      this.dom.list.appendChild(div);
   },
   render: function () {
      this._empty();
      if (!this.data.filelist.length) {
         var div = document.createElement('div');
         div.className = 'xitem xitem-orange';
         div.innerHTML = '(no item)';
         this.dom.list.appendChild(div);
      }
      for (var i = 0, n = this.data.filelist.length; i < n; i++) {
         var item = this.data.filelist[i];
         this.renderOne(item.path);
      }
   },
   getPluginName: function () {
      return plugin.name;
   },
   getFileName: function () {
      return this.data.filename;
   },
   resize: function () {
      if (this.dom.tmp.actionDialog) {
         this.dom.tmp.actionDialog.center();
      }
   },
   show: function () {
      if (!this.dom.self.parentNode) {
         var view = system.bundle.view.getDom();
         view.appendChild(this.dom.self);
      }
      this.dom.nav.dom.self.style.backgroundColor = '#eeeeee';
      this.dom.self.style.display = 'block';
   },
   hide: function () {
      this.dom.nav.dom.self.style.backgroundColor = 'white';
      this.dom.self.style.display = 'none';
   },
   dispose: function () {
      this.dom.title_menu.removeEventListener('click', this.event.title.menuClick);
      this.dom.menu.title.getDom().removeEventListener('click', this.event.title.menuItemClick);
      this.dom.menu.item.getDom().removeEventListener('click', this.event.item.menuItemClick);
      this.dom.btnClose.removeEventListener('click', this.event.btnCloseClick);
      this.dom.self.removeEventListener('click', this.event.item.menuClick);
      this.dom.self.removeEventListener('click', this.event.click);
      system.bundle.view.getDom().removeChild(this.dom.self);
      system.bundle.editorTab.getDom().removeChild(this.dom.nav.dom.self);
   }
};

var api = {
   _instances: {},
   _ready: false,
   // initialize api on first load
   initialize: function (bundle) {
      console.log('inside fileBrowser', bundle);
      system.bundle = bundle;
      api._ready = true;
   },
   // create a new file browser with an ID
   create: function (filename) {
      var id = 'fileBrowser-' + generate_id();
      while (api._instances[id]) id = generate_id();
      var instance = new EdienilnoFileBrowser(id, filename);
      api._instances[id] = instance;
      return id;
   },
   // get created file browser with an ID
   get: function (id) {
      return api._instances[id];
   },
   isReady: function () {
      return api._ready;
   },
   // render for file browser with a specified ID
   render: function (id) {},
   // close an instance
   close: function (id) {
      delete api._instances[id];
      system.bundle.view.dispose(id);
   }
};

var plugin = {
   name: 'fileBrowser',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

