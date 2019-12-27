'use strict';

(function () {

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.plugins) window.edienilno.plugins = {};

var system = {
   timeout: 10 /* 10 s */,
   plugins: {}
};

/*
plugin = {
   _create: function () { return plugin.api; },
   api: {
      initialize: function (bundle) {},
      create: function (filename) { return id; },
      render: function (id) {},
      close: function (id) {}
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
            path: path,
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

window.edienilno.loadPlugin = edienilnoLoadPlugin;

})();