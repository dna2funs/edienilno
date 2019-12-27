(function () {

function generateId() {
   var timesamp = new Date().getTime();
   var rnd = ~~(Math.random() * 100);
   return timesamp + '-' + rnd;
}

function EdienilnoFileBrowser(filename) {
   this.data = {
      filename: filename,
      filelist: []
   };
}
EdienilnoFileBrowser.prototype = {};

var api = {
   _ui: {},
   _instances: {},
   // initialize api on first load
   initialize: function (bundle) {
      console.log('inside fileBrowser', bundle);
   },
   // create a new file browser with an ID
   create: function (filename) {
      var id = generateId();
      while (api._instances[id]) id = generateId();
      var instance = new EdienilnoFileBrowser(filename);
      api._instances[id] = instance;
      return id;
   },
   // render for file browser with a specified ID
   render: function (id) {},
   // close an instance
   close: function (id) {},
};

var plugin = {
   name: 'fileBrowser',
   version: '0.1',
   _create: function () { return api; },
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

