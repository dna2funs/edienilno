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
      switch(object.getAttribute('data-type')) {
         case 'item-menu': return 'item-menu';
      }
      return 'dom';
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

function createItemMenu(parent) {
   var menu = new edienilno.DropdownView();
   var div = document.createElement('div');
   div.className = 'dropdown-menu';
   var item;
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Rename';
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Cut';
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Copy';
   div.appendChild(item);
   item = document.createElement('div');
   item.className = 'dropdown-item';
   item.innerHTML = 'Delete';
   div.appendChild(item);
   var component = menu.getDom();
   component.appendChild(div);
   component.classList.add('dropdown');
   component.classList.add('open');
   menu.hide();
   parent.appendChild(component);
   return menu;
}

function EdienilnoFileBrowser(id, filename) {
   this.id = id;
   this.data = {
      loading: true,
      filename: filename,
      filelist: []
   };
   var div = document.createElement('div');
   var nav = new edienilno.SideItem(null, basename(filename) || '(root)', filename);
   this.dom = {
      self: div,
      list: document.createElement('div'),
      btnUp: document.createElement('div'),
      nav: nav,
      menu: {
         item: createItemMenu(div)
      },
      tmp: {}
   };
   this.dom.btnUp.innerHTML = '../';
   this.dom.btnUp.className = 'xitem xitem-purple';
   this.dom.btnUp.style.cursor = 'pointer';
   this.dom.btnUp.setAttribute('data-folder', '../');
   var title = document.createElement('div');
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
      item: {
         drag: function (evt) {},
         drop: function (evt) {},
         menuClick: function (evt) {
            var type = recognize(evt.target);
            if (type !== 'item-menu') return;
            var item = getItemByMenuOject(evt.target);
            _this.data.selected = {
               filename: _this.data.filename + (item.getAttribute('data-folder') || item.getAttribute('data-file')) 
            };
            _this.dom.menu.item.stick(evt.target);
            _this.dom.menu.item.show();
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

   this.hide();
   this.load(filename);

   this.mobildeDragDrop = new window.dragDropTouch.DragDropTouch(div);
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
   resize: function () {},
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
      this.mobildeDragDrop.dispose();
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
      edienilno.loadScript('./js/3rd/DragDropTouch.js').then(function () {
         api._ready = true;
      });
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

