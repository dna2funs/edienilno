(function () {

var system = {
   bundle: null
};

function basename(filename) {
   return filename.split('/').pop();
}

function EdienilnoCodeEditor(id, filename) {
   this.id = id;
   var div = document.createElement('div');
   var nav = new edienilno.SideItem(null, basename(filename), filename);
   this.dom = {
      self: div,
      nav: nav
   };
   this.data = {
      filename: filename
   };
   system.bundle.editorTab.getDom().appendChild(nav.dom.self);
   nav.dom.self.setAttribute('data-plugin', plugin.name);
   nav.dom.self.setAttribute('data-id', id);
   // div.innerHTML = 'Hello "' + filename + '"!';

   this.editor = new EdienilnoEditor(div);
   this.editor.self.style.height = '100%';
   this.editor.self.style.width = '100%';
   this.editor.create('edienilno://' + filename, '', {}, { readOnly: false });
   this.editor.on_content_load(function (uri) { return Promise.resolve(null);});
   this.editor.on_content_ready(function () {});

   this.hide();
}
EdienilnoCodeEditor.prototype = {
   resize: function () {
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
      var instance = new EdienilnoCodeEditor(id, filename);
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
   name: 'codeEditor',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();
