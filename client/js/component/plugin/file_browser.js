(function () {

var system = {
   bundle: null
};

function generateId() {
   var timesamp = new Date().getTime();
   var rnd = ~~(Math.random() * 100);
   return timesamp + '-' + rnd;
}

function EdienilnoFileBrowser(id, filename) {
   this.id = id;
   var div = document.createElement('div');
   this.dom = {
      self: div
   };
   this.data = {
      filename: filename,
      filelist: []
   };
   div.innerHTML = 'Hello "' + filename + '"!';
   this.hide();
}
EdienilnoFileBrowser.prototype = {
   resize: function () {},
   show: function () {
      if (!this.dom.self.parentNode) {
         var view = system.bundle.view.getDom();
         view.appendChild(this.dom.self);
      }
      this.dom.self.style.display = 'block';
   },
   hide: function () {
      this.dom.self.style.display = 'none';
   },
   dispose: function () {}
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
      var id = 'fileBrowser-' + generateId();
      while (api._instances[id]) id = generateId();
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

