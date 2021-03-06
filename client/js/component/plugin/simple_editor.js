(function () {

var system = {
   bundle: null
};

function basename(filename) {
   return filename.split('/').pop();
}

function to_byte(arr) {
   var n = arr.length;
   var b = new Uint8Array(n);
   for (var i = 0; i < n; i++) {
      b[i] = arr.charCodeAt(i);
   }
   arr = null;
   return b;
}

function to_string(arr) {
   var n = arr.length;
   var s = '';
   for (var i = 0; i < n; i++) {
      s += String.fromCharCode(arr[i]);
   }
   arr = null;
   return s;
}

function hex(n) {
   if (n < 10) return String.fromCharCode(n + 48);
   return String.fromCharCode(n + 55);
}

function buildHex(ch, id, x, y) {
   var a = ~~(ch/16), b = ch%16;
   var group = document.createElement('span');
   var H = document.createElement('span');
   var L = document.createElement('span');
   H.innerHTML = hex(a);
   L.innerHTML = hex(b);
   H.className = 'b0';
   L.className = 'b0';
   H.id = 'sebin-' + id + '-1';
   L.id = 'sebin-' + id + '-2';
   group.appendChild(H);
   group.appendChild(L);
   group.className = 'sebin';
   group.style.top = y + 'px';
   group.style.left = x + 'px';
   return group;
}

function highlight_selected(_this) {
   if (!_this.data.binSelected) return;
   var selected = document.getElementById(_this.data.binSelected);
   if (!selected) return;
   selected.classList.add('sebin-active');
   var view = selected.parentNode.parentNode;
   var charHighlightDiv = view.querySelector('.ch-highlight');
   if (!charHighlightDiv) {
      charHighlightDiv = document.createElement('div');
      charHighlightDiv.className = 'ch-highlight';
      charHighlightDiv.style.position = 'absolute';
      charHighlightDiv.style.opacity = 0.5;
      charHighlightDiv.style.backgroundColor = 'yellow';
      view.appendChild(charHighlightDiv);
   }
   var layout = _this.data.binaryLayout;
   var id = selected.getAttribute('id');
   var index = parseInt(id.split('-')[1]);
   var lineno = ~~(index / layout.lineN);
   var col = index % layout.lineN;
   var top = layout.elemH * lineno - view.parentNode.scrollTop;
   if (top < 0) {
      view.removeChild(charHighlightDiv);
      return;
   }
   charHighlightDiv.style.top = top + 'px';
   // XXX: fix slight position shift
   charHighlightDiv.style.left = (layout.elemW * (layout.lineN + 0.2) + col * selected.offsetWidth) + 'px';
   charHighlightDiv.style.width = (layout.elemW/2) + 'px';
   charHighlightDiv.style.height = layout.elemH + 'px';
}

function render_binary_data(_this, data, scrollTop) {
   // XXX: render bug
   //   - when scroll, the first line in the view should not be rendered on the top of nav bar
   var sdiv = _this.dom.binSdiv || document.createElement('div');
   if (!_this.dom.binSdiv) {
      _this.dom.binSdiv = sdiv;
      _this.dom.bin.appendChild(sdiv);
   }
   sdiv.innerHTML = '';
   var group = buildHex(data[0]);
   sdiv.appendChild(group);
   var elemH = group.offsetHeight, elemW = group.offsetWidth + 5;
   // < hex view > | < char view> |-|
   var cH = _this.dom.self.parentNode.offsetHeight, cW = _this.dom.self.parentNode.offsetWidth;
   var lineN = ~~((cW - 0) * 2 / 3 / elemW);
   if (lineN < 4) lineN = 4;
   else if (lineN < 8) lineN = 4;
   else if (lineN < 16) lineN = 8;
   else if (lineN < 32) lineN = 16;
   else if (lineN < 64) lineN = 32;
   else lineN = 64;
   var lineC = Math.ceil(data.length / lineN);
   sdiv.style.width = (lineN * elemW + 10) + 'px';
   sdiv.style.height = (lineC * elemH + 10) + 'px';
   sdiv.innerHTML = '';

   var curL = ~~(scrollTop / elemH);
   var baseY = curL * elemH, offsetY = 0;
   var curI = curL * lineN;
   while (offsetY - elemH < cH) {
      for (var i = 0, n = lineN; i < n; i++) {
         var index = curI + i;
         if (index >= data.length) break;
         var group = buildHex(data[index], index, elemW * i, baseY + offsetY - scrollTop);
         sdiv.appendChild(group);
      }
      // show characters 32-127; 0-31,128- displayed as '.'
      // TODO: move to a function
      var charLineView = document.createElement('span');
      for (var i = 0, n = lineN; i < n; i++) {
         var index = curI + i;
         if (index >= data.length) break;
         var ch = data[index];
         if (ch >= 32 && ch <= 127) {
            charLineView.appendChild(document.createTextNode(String.fromCharCode(ch)));
         } else {
            charLineView.appendChild(document.createTextNode('.'));
         }
      }
      charLineView.style.position = 'absolute';
      charLineView.style.top = (baseY + offsetY - scrollTop) + 'px';
      charLineView.style.left = (elemW * (lineN + 0.2)) + 'px';
      sdiv.appendChild(charLineView);
      curI += lineN;
      offsetY += elemH;
   }

   _this.data.binaryLayout = {
      elemH: elemH,
      elemW: elemW,
      lineN: lineN
   };
   highlight_selected(_this);
}

function render_data(_this, data) {
   if (data.indexOf('\0') >= 0) {
      // binary file
      _this.data.binary = true;
      _this.dom.txt.style.display = 'none';
      _this.dom.bin = document.createElement('div');
      _this.dom.bin.style.width = '100%';
      _this.dom.bin.style.height = '100%';
      _this.dom.bin.style.overflowX = 'hidden';
      _this.dom.bin.style.overflowY = 'auto';
      _this.dom.bin.style.fontFamily = 'monospace';
      _this.dom.self.appendChild(_this.dom.bin);
      data = to_byte(data);
      _this.data.data = data;
      render_binary_data(_this, data, 0);
      _this.event.scrollSdiv = function (evt) {
         render_binary_data(_this, data, evt.target.scrollTop);
      };
      _this.event.clickSdiv = function (evt) {
         if (!evt.target.classList.contains('b0')) return;
         if (_this.data.binSelected) {
            var selected = document.getElementById(_this.data.binSelected);
            if (selected) selected.classList.remove('sebin-active');
         }
         _this.data.binSelected = evt.target.getAttribute('id');
         highlight_selected(_this);
         // TODO: brush char view - highlight selected character
      };
      _this.event.keySdiv = function (evt) {
         if (!_this.data.binary) return;
         if (!_this.data.binSelected) return;
         var keycode = evt.keyCode;
         if (keycode >= 97 && keycode < 123) {
            keycode -= 97 - 65;
         }
         if (keycode === 64 + 26 && (evt.metaKey || evt.ctrlKey)) {
            // ctrl+Z
            console.log('TODO: ctrl + Z');
            return;
         }
         var ishex = false;
         if (keycode >= 48 && keycode < 58) {
            keycode -= 48;
            ishex = true;
         } else if (keycode >= 65 && keycode < 71) {
            keycode -= 55;
            ishex = true
         }
         if (!ishex) return;
         // A-F 0-9
         var nextId = _this.data.binSelected.split('-');
         var id = parseInt(nextId[1]);
         var sub = parseInt(nextId[2]);
         var d = _this.data.data[id];
         var H = ~~(d/16), L = d%16;
         var selected = document.getElementById(_this.data.binSelected);
         if (sub === 1) {
            nextId[2] ++;
            _this.data.data[id] = keycode * 16 + L;
            if (selected) selected.innerHTML = hex(keycode);
         } else {
            nextId[1] ++;
            nextId[2] = 1;
            _this.data.data[id] = H * 16 + keycode;
            id ++;
            if (selected) selected.innerHTML = hex(keycode);
         }
         // TODO: after modify data, apply to char view as well
         //    - find next char view (for current line)
         //    - update char view in the whole line
         nextId = nextId.join('-');
         if (_this.data.data.length > id) {
            if (selected) selected.classList.remove('sebin-active');
            selected = document.getElementById(nextId);
            if (selected) selected.classList.add('sebin-active');
            _this.data.binSelected = nextId;
         }
         _this.data.changed = true;
      }
      _this.dom.bin.addEventListener('scroll', _this.event.scrollSdiv);
      _this.dom.binSdiv.addEventListener('click', _this.event.clickSdiv);
      document.body.addEventListener('keydown', _this.event.keySdiv);
   } else {
      _this.dom.txt.value = data;
      _this.dom.txt.classList.remove('disabled');
   }
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
      changed: false,
      binary: false
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
               if (_this.data.binary) {
                  value = to_string(_this.data.data);
               }
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
         render_data(_this, data.data);
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
      if (this.data.binary) {
         render_binary_data(this, this.data.data, this.dom.bin.scrollTop);
      }
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
      if (this.dom.bin) {
         this.dom.bin.removeEventListener('scroll', this.event.scrollSdiv);
         this.dom.binSdiv.removeEventListener('click', this.event.clickSdiv);
         document.body.removeEventListener('keydown', this.event.keySdiv);
         if (this.data.binSelected) this.data.binSelected = null;
      }
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

