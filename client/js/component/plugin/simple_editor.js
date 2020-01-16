(function () {

var system = {
   bundle: null
};

function basename(filename) {
   return filename.split('/').pop();
}

function EdienilnoSimpleEditor(id, filename) {
   this.id = id;
   if (!filename) {
      this.dispose();
      return;
   }
   var div = document.createElement('div');
   var nav = new edienilno.SideItem(null, basename(filename), filename);
   this.dom = {
      self: div,
      txt: document.createElement('textarea'),
      btnClose: document.createElement('button'),
      nav: nav
   };
   this.data = {
      filename: filename,
      changed: false
   };

   var _this = this;
   this.event = {
      change: {
         txt: function () {
            _this.data.changed = true;
         }
      },
      click: {
         btnClose: function () {
            if (_this.data.changed) {
               var value = _this.dom.txt.value;
               _this.dom.txt.classList.add('disabled');
               _this.dom.txt.value = 'Saving ...';
               system.bundle.client.request(
                  {
                     cmd: 'simpleEdit.save',
                     path: _this.data.filename,
                     data: value
                  },
                  function () {
                     alert('Saved: ' + _this.data.filename);
                  }
               );
            }
            api.close(_this.id);
         }
      }
   };

   this.dom.txt.style.width = '100%';
   this.dom.txt.style.height = '100%';
   this.dom.txt.value = 'Loading ...';
   this.dom.txt.classList.add('disabled');

   this.dom.btnClose.innerHTML = '&times;';
   this.dom.btnClose.className = 'code-editor-btn-close';
   this.dom.btnClose.style.position = 'absolute';
   this.dom.btnClose.style.top = '2px';
   this.dom.btnClose.style.right = '16px';

   system.bundle.editorTab.getDom().appendChild(nav.dom.self);
   system.bundle.client.request(
      {cmd: 'simpleEdit.load', path: _this.data.filename},
      function (data) {
         if (!data) data = {};
         if (!data.data) data.data = '';
         _this.dom.txt.value = data.data;
         _this.dom.txt.classList.remove('disabled');
      }
   );
   div.style.width = '100%';
   div.style.height = '100%';
   div.appendChild(this.dom.txt);
   div.appendChild(_this.dom.btnClose);
   nav.dom.self.setAttribute('data-plugin', plugin.name);
   nav.dom.self.setAttribute('data-id', id);

   this.dom.btnClose.addEventListener('click', this.event.click.btnClose);
   this.dom.txt.addEventListener('change', this.event.change.txt);
   this.hide();
}
EdienilnoSimpleEditor.prototype = {
   getPluginName: function () {
      return plugin.name;
   },
   getFileName: function () {
      return this.data.filename;
   },
   resize: function () {
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
      if (!this.data || !this.data.filename) return;
      this.dom.txt.removeEventListener('change', this.event.change.txt);
      this.dom.btnClose.removeEventListener('click', this.event.click.btnClose);
      system.bundle.view.getDom().removeChild(this.dom.self);
      system.bundle.editorTab.getDom().removeChild(this.dom.nav.dom.self);
   }
};

var api = {
   _instances: {},
   // initialize api on first load
   initialize: function (bundle) {
      system.bundle = bundle;
   },
   // create a new file browser with an ID
   create: function (filename) {
      var id = 'simpleEditor-' + generate_id();
      while (api._instances[id]) id = generate_id();
      var instance = new EdienilnoSimpleEditor(id, filename);
      api._instances[id] = instance;
      return id;
   },
   // get created file browser with an ID
   get: function (id) {
      return api._instances[id];
   },
   isReady: function () {
      return true;
   },
   // render for file browser with a specified ID
   render: function (id) {},
   // close an instance
   close: function (id) {
      system.bundle.view.dispose(id);
      delete api._instances[id];
   }
};

var plugin = {
   name: 'simpleEditor',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

