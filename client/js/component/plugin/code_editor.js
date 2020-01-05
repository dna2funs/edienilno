(function () {

var system = {
   bundle: null
};

function basename(filename) {
   return filename.split('/').pop();
}

function EdienilnoCodeEditor(id, filename) {
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
            if (_this.editor) {
               system.bundle.client.request(
                  {
                     cmd: 'simpleEdit.save',
                     path: _this.data.filename,
                     data: _this.editor.api.getValue()
                  },
                  function () {
                     alert('Saved: ' + _this.data.filename);
                  }
               );
            }
            system.bundle.view.dispose(_this.id);
         }
      }
   };

   var style = document.querySelector('#code-editor-style');
   if (!style) {
      style = document.createElement('style');
      style.appendChild(document.createTextNode(
         '.code-editor-btn-close { postion: absolute; top: 2px; right: 16px; opacity: 0.1; background-color: white; border: 1px solid black; }\n' +
         '.code-editor-btn-close:hover { opacity: 1; }\n'
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
   // div.innerHTML = 'Hello "' + filename + '"!';

   this.editor = new window.EdienilnoEditor(div);
   this.editor.self.style.height = '100%';
   this.editor.self.style.width = '100%';
   this.editor.on_content_load(function (uri) {});
   this.editor.on_content_ready(function () {
      system.bundle.client.request(
         {cmd: 'simpleEdit.load', path: _this.data.filename},
         function (data) {
            if (!data) data = {};
            if (!data.data) data.data = '';
            _this.editor.api.setValue(data.data);
            alert('Load: ' + _this.data.filename);
         }
      );
      div.appendChild(_this.dom.btnClose);
   });
   this.editor.create('edienilno:/' + filename, '', {}, { readOnly: false });

   this.hide();
}
EdienilnoCodeEditor.prototype = {
   getPluginName: function () {
      return plugin.name;
   },
   getFileName: function () {
      return this.data.filename;
   },
   resize: function () {
      if (!this.editor) return;
      this.editor.resize();
   },
   show: function () {
      if (!this.dom.self.parentNode) {
         var view = system.bundle.view.getDom();
         view.appendChild(this.dom.self);
      }
      this.dom.nav.dom.self.style.backgroundColor = '#eeeeee';
      this.dom.self.style.display = 'block';
      this.editor.resize();
   },
   hide: function () {
      this.dom.nav.dom.self.style.backgroundColor = 'white';
      this.dom.self.style.display = 'none';
   },
   dispose: function () {
      if (!this.data || !this.data.filename) return;
      if (this.editor) {
         var model = this.editor.api.getModel();
         model.dispose();
         this.editor.api.dispose();
         this.editor.dispose();
      }
      this.dom.btnClose.removeEventListener('click', this.event.click.btnClose);
      system.bundle.view.getDom().removeChild(this.dom.self);
      system.bundle.editorTab.getDom().removeChild(this.dom.nav.dom.self);
   }
};

var api = {
   _ui: {},
   _instances: {},
   _ready: false,
   // initialize api on first load
   initialize: function (bundle) {
      system.bundle = bundle;
      edienilno.loadScript('./js/editor/vs/loader.js').then(function () {
         edienilno.loadScript('./js/editor.js').then(function () {
            api._ready = true;
         });
      });
   },
   // create a new file browser with an ID
   create: function (filename) {
      if (!api._ready) return null;
      var id = 'codeEditor-' + generate_id();
      while (api._instances[id]) id = generate_id();
      var instance = new EdienilnoCodeEditor(id, filename);
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
   close: function (id) {}
};

var plugin = {
   name: 'codeEditor',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

