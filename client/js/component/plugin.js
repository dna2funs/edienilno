'use strict';

(function () {

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.plugins) window.edienilno.plugins = {};

var system = {
   timeout: 10 /* 10 s */,
   plugins: {}
};

function extname(filename) {
   if (!filename) return '';
   var i = filename.lastIndexOf('.');
   if (i < 0) return '';
   return filename.substring(i);
}

/*
plugin = {
   _create: function () { return plugin.api; },
   api: {
      initialize: function (bundle) {},
      create: function (filename) { return id; },
      get: function (id) {},
      ? render: function (id) {},
      ? close: function (id) {}
   }
};
window.edienilno.plugins[name] = plugin._create();
*/

function edienilnoLoadPlugin(name, path, bundle) {
   var plugin = system.plugins[name];
   var timeout = false;
   var script = null;
   var timer = setTimeout(function () {
      timeout = true;
      if (script && script.parentNode) {
         script.parentNode.removeChild(script);
      }
      console.error('load timeout for plugin:', name);
   }, system.timeout * 1000);
   return new Promise(function (r, e) {
      if (plugin) {
         return waitPluginApi();
      } else {
         plugin = {
            name: name,
            path: path
         };
         system.plugins[name] = plugin;
         script = document.createElement('script');
         script.src = path;
         script.addEventListener('load', function () {
            if (!window.edienilno || !window.edienilno.plugins[name]) {
               console.error('failed to load plugin:', name);
               return;
            }
            plugin.dom = script;
            if (timeout) return;
            plugin.api = window.edienilno.plugins[name];
            if (plugin.api) plugin.api.initialize(bundle);
         });
         document.body.appendChild(script);
         return waitPluginApi();
      }

      function waitPluginApi() {
         if (timeout) return e();
         if (!plugin.api) return setTimeout(waitPluginApi, 0);
         clearTimeout(timer);
         return r(plugin);
      }
   });
}

function EdienilnoPluginManager(bundle) {
   this.bundle = bundle;
   if (!this.bundle) this.bundle = {};
   this.bundle.pluginer = this;
   this.map = {};
   this.loaded = {};
}
EdienilnoPluginManager.prototype = {
   register: function (pluginName, path, extList) {
      this.map[pluginName] = {
         path: path,
         ext: extList || []
      };
   },
   open: function (filename, pluginName) {
      var _this = this;
      if (!pluginName) {
         var ext = extname(filename);
         pluginName = Object.keys(this.map).filter(function (name) {
            var list = _this.map[name].ext;
            return list && list.indexOf(ext) >= 0;
         })[0];
      }
      var plugin = this.loaded[pluginName];
      if (_goto_if_opened(filename, pluginName)) return;
      if (plugin) {
         _open(plugin, filename);
      } else if (this.map[pluginName]) {
         edienilnoLoadPlugin(
            pluginName, this.map[pluginName].path, this.bundle
         ).then(function (plugin) {
            _this.loaded[pluginName] = plugin;
            _open(plugin, filename);
         }, function () {
         });
      } else {
         // no such plugin
      }

      function _goto_if_opened(filename, pluginName) {
         var editors = _this.bundle.view.editors;
         var such = Object.keys(editors).filter(function (key) {
            var editor = editors[key];
            var opened = editor.getFileName && editor.getFileName();
            var ePluginName = editor.getPluginName && editor.getPluginName();
            if (ePluginName && ePluginName !== pluginName) return false;
            return opened === filename;
         });
         if (such.length > 0) {
            var editor = editors[such[0]];
            _this.bundle.view.bind(editor.id);
         } else {
            return false;
         }
         return true;
      }

      function _open(plugin, filename) {
         var id = plugin.api.create(filename);
         _this.bundle.view.register(id, plugin.api.get(id));
         _this.bundle.view.bind(id);
      }
   }
};

if (!window.edienilno) window.edienilno = {};
window.edienilno.loadPlugin = edienilnoLoadPlugin;
window.edienilno.PluginManager = EdienilnoPluginManager;

})();