'use strict';

var system = {
   hostname: window.location.hostname
};

function dom(selector) {
   return document.querySelector(selector);
}

function generate_id() {
   var timesamp = new Date().getTime();
   var rnd = ~~(Math.random() * 100);
   return timesamp + '-' + rnd;
}

function ajax(options, done_fn, fail_fn) {
   var xhr = new XMLHttpRequest(), payload = null;
   xhr.open(options.method || 'POST', options.url + (options.data ? uriencode(options.data) : ''), true);
   xhr.addEventListener('readystatechange', function (evt) {
      if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
         if (~~(evt.target.status / 100) === 2) {
            done_fn && done_fn(evt.target.response);
         } else {
            fail_fn && fail_fn(evt.target.status);
         }
      }
   });
   if (options.json) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      payload = JSON.stringify(options.json);
   }
   xhr.send(payload);
}

function html(url, done_fn, fail_fn) {
   var xhr = new XMLHttpRequest();
   xhr.open('GET', url, true);
   xhr.addEventListener('readystatechange', function (evt) {
      if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
         if (~~(evt.target.status / 100) === 2) {
            done_fn && done_fn(evt.target.response || '<!-- empty -->');
         } else {
            fail_fn && fail_fn(evt.target.status);
         }
      }
   });
   xhr.send(null);
}

function wait_for(key, val, fn) {
   if (key && (val in key)) return fn && fn(key, val);
   setTimeout(wait_for, 0, key, val, fn);
}

function get_cookie() {
   var items = document.cookie;
   var r = {};
   if (!items) return r;
   items.split(';').forEach(function (one) {
      var p = one.indexOf('=');
      if (p < 0) r[one.trim()] = null;
      else r[one.substring(0, p).trim()] = one.substring(p + 1).trim();
   });
   return r;
}

function set_cookie(key, value) {
   document.cookie = key + '=' + escape(value) + ';domain=' + system.hostname;
}

function erase_cookie(key) {
   document.cookie = key + '=0;expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

function reload_on_hashchange() {
   window.addEventListener('hashchange', function () {
      window.location.reload(true);
   });
}

function encode_url_for_login(path) {
   var r = '/login.html#' + path + ':';
   if (window.location.hash) {
      r += window.location.hash.substring(1);
   }
   if (window.location.search) {
      r += window.location.search;
   }
   return r;
}

function remove_elem(elem) {
   elem.parentNode.removeChild(elem);
}

function dispose_component(component) {
   var elem = component.dom;
   remove_elem(elem);
   component.dom = null;
   component.ui = null;
}

function login_and_start(env, before_init, init_app, redirect_url) {
   if (!redirect_url) redirect_url = 'login.html';
   before_init && before_init();
   var cookie = get_cookie();
   env.user = {
      username: cookie.edienilno_username,
      uuid: cookie.edienilno_uuid
   };
   if (!env.user.username || !env.user.uuid) {
      window.location = redirect_url;
      return;
   }
   ajax({
      url: '/api/auth/check',
      json: {
         username: env.user.username,
         uuid: env.user.uuid
      }
   }, function () {
      init_app();
   }, function () {
      window.location = redirect_url;
   });
}

if (!String.prototype.endsWith) {
   String.prototype.endsWith = function (str) {
      if (str === '') return true;
      if (!str) return false;
      var i = this.lastIndexOf(str);
      if (i < 0) return false;
      return i + str.length === this.length;
   }
}

if (!window.Map) {
   window.Map = function () {
      this._keys = [];
      this._values = [];
      this.size = 0;
   }
   window.Map.prototype = {
      get: function (key) {
         var index = this._keys.indexOf(key);
         if (index < 0) return undefined;
         return this._values[index];
      },
      set: function (key, value) {
         var index = this._keys.indexOf(key);
         if (index < 0) {
            this._keys.push(key);
            this._values.push(value);
            this.size = this.keys.length;
         } else {
            this._values[index] = value;
         }
      },
      delete: function (key) {
         var index = this.keys.indexOf(key);
         if (index < 0) return undefined;
         var del = this.values[index];
         this._keys.splice(index, 1);
         this._values.splice(index, 1);
         this.size = this.keys.length;
         return del;
      },
      clear: function () {
         this._keys = [];
         this.values = [];
         this.size = 0;
      },
      keys: function () {
         return this._keys;
      },
      values: function () {
         return this._values;
      },
      entries: function () {
         var _this = this;
         return this._keys.map(function (key, i) {
            return [key, _this._values[i]];
         });
      },
      has: function (key) {
         return this._keys.indexOf(key) >= 0;
      },
      forEach: function (fn, thisArg) {
         for (var i = 0, n = this.size; i < n; i++) {
            var key = this._keys[i];
            var val = this._values[i];
            fn && fn.call(thisArg, val, key, this);
         }
      }
   };
}

if (!Object.assign) {
   Object.assign = function () {
      var a = arguments[0];
      if (!a) return a;
      for (var i = 1, n = arguments.length; i < n; i++) {
         var x = arguments[i];
         if (!x) continue;
         for (var key in x) {
            a[key] = x[key];
         }
      }
      return a;
   };
}
