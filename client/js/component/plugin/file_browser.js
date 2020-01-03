(function () {

var system = {
   bundle: null
};

function basename(filename) {
   if (!filename || filename === '/') return null;
   return filename.split('/').pop();
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
      nav: nav
   };
   this.dom.btnUp.innerHTML = '../';
   this.dom.btnUp.className = 'xitem xitem-yellow';
   this.dom.btnUp.style.cursor = 'pointer';
   this.dom.btnUp.setAttribute('data-folder', '../');
   system.bundle.editorTab.getDom().appendChild(nav.dom.self);
   nav.dom.self.setAttribute('data-plugin', plugin.name);
   nav.dom.self.setAttribute('data-id', id);
   this.hide();
   this.load(filename);

   var _this = this;
   this.event = {
      click: function (evt) {
         var parts;
         var value = evt.target.getAttribute('data-folder');
         if (value) {
            if (value === '../') {
               parts = _this.data.filename.split('/');
               parts.pop();
               parts.pop();
               _this.data.filename = parts.join('/') + '/';
               value = '';
            }
            _this.load(_this.data.filename + value);
            return;
         } // data-folder
         value = evt.target.getAttribute('data-file');
         if (value) {
            parts = value.split('.');
            if (parts.length > 1 && parts[parts.length-1] === 'fyat') {
               system.bundle.pluginer.open('familyAccount', _this.data.filename + value);
            }
         } // data-file
      }
   };
   this.dom.self.appendChild(this.dom.btnUp);
   this.dom.self.appendChild(this.dom.list);
   this.dom.self.addEventListener('click', this.event.click);
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
      if (path.endsWith('/')) {
         div.classList.add('xitem-yellow');
         div.setAttribute('data-folder', path);
      } else {
         div.classList.add('xitem-blue');
         div.setAttribute('data-file', path);
      }
      div.style.cursor = 'pointer';
      div.appendChild(document.createTextNode(path));
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
      this.dom.self.removeEventListener('click', this.event.click);
      system.bundle.editorTab.getDom().removeChild(this.nav.dom.self);
   }
};

var api = {
   _ui: {},
   _instances: {},
   // initialize api on first load
   initialize: function (bundle) {
      console.log('inside fileBrowser', bundle);
      system.bundle = bundle;
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
   // render for file browser with a specified ID
   render: function (id) {},
   // close an instance
   close: function (id) {}
};

var plugin = {
   name: 'fileBrowser',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

