(function () {

var system = {
   bundle: null
};

function basename(filename) {
   return filename.split('/').pop();
}

function EdienilnoTemplateEditor(id, filename) {
   this.id = id;
   if (!filename) {
      this.dispose();
      return;
   }
   var div = document.createElement('div');
   var nav = new edienilno.SideItem(null, basename(filename), filename);
   this.dom = {
      self: div,
      btnClose: document.createElement('button'),
      nav: nav
   };
   this.data = {
      filename: filename
   };

   var _this = this;
   this.event = {
      click: {
         btnClose: function () {
            api.close(_this.id);
         }
      }
   };

   var style = document.querySelector('#code-editor-style');
   if (!style) {
      style = document.createElement('style');
      style.appendChild(document.createTextNode(
         '.code-editor-btn-close {' +
            'postion:absolute; top:2px; right:16px; opacity:0.1;' +
            'background-color:white; border:1px solid black;' +
         '}\n' +
         '.code-editor-btn-close:hover { opacity:1; }\n'
      ));
      document.getElementsByTagName('head')[0].appendChild(style);
   }

   this.dom.btnClose.innerHTML = '&times;';
   this.dom.btnClose.className = 'code-editor-btn-close';
   this.dom.btnClose.style.position = 'absolute';
   this.dom.btnClose.style.top = '2px';
   this.dom.btnClose.style.right = '16px';
   this.dom.btnClose.addEventListener('click', this.event.click.btnClose);

   system.bundle.editorTab.getDom().appendChild(nav.dom.self);
   nav.dom.self.setAttribute('data-plugin', plugin.name);
   nav.dom.self.setAttribute('data-id', id);

   div.appendChild(_this.dom.btnClose);
   this.hide();
}
EdienilnoTemplateEditor.prototype = {
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
      this.resize();
   },
   hide: function () {
      this.dom.nav.dom.self.style.backgroundColor = 'white';
      this.dom.self.style.display = 'none';
   },
   dispose: function () {
      if (!this.data || !this.data.filename) return;
      this.dom.btnClose.removeEventListener('click', this.event.click.btnClose);
      system.bundle.view.getDom().removeChild(this.dom.self);
      system.bundle.editorTab.getDom().removeChild(this.dom.nav.dom.self);
   }
};

var api = {
   _instances: {},
   _ready: false,
   // initialize api on first load
   initialize: function (bundle) {
      system.bundle = bundle;
      api._ready = true;
   },
   // create a new file browser with an ID
   create: function (filename) {
      if (!api._ready) return null;
      var id = 'mobileCodeEditor-' + generate_id();
      while (api._instances[id]) id = generate_id();
      var instance = new EdienilnoTemplateEditor(id, filename);
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
      system.bundle.view.dispose(id);
      delete api._instances[id];
   }
};

var plugin = {
   name: '!!templateEditor!!',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

