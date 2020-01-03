(function () {

var system = {
   localKey: 'edienilno.family_account',
   bundle: null
};

function basename(filename) {
   return filename.split('/').pop();
}

function EdienilnoFamilyAccountEditor(id, filename) {
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
   this._initUI();
   this.hide();
}
EdienilnoFamilyAccountEditor.prototype = {
   _initUI: function () {
      var tmp;
      var div = document.createElement('div');
      div.classList.add('xitem');
      div.classList.add('xitem-yellow');
      div.innerHTML = 'Records';
      tmp = document.createElement('button');
      tmp.style.float = 'right';
      tmp.innerHTML = '&times;';
      tmp.style.border = '1px solid black';
      tmp.style.backgroundColor = '#fbf59f';
      tmp.style.marginTop = '-3px';
      tmp.style.marginRight = '5px';
      this.dom.btnClose = tmp;
      div.appendChild(tmp);
      this.dom.self.appendChild(div);

      div = document.createElement('div');
      div.style.width = '100%';
      div.classList.add('xitem-btn');
      div.classList.add('xitem-blue');
      div.innerHTML = 'Push';
      this.dom.btnPush = div;
      this.dom.self.appendChild(div);

      div = document.createElement('div');
      div.style.width = '100%';
      div.classList.add('xitem-btn');
      div.classList.add('xitem-blue');
      div.innerHTML = 'Pull';
      this.dom.btnPull = div;
      this.dom.self.appendChild(div);

      div = document.createElement('div');
      div.style.width = '100%';
      div.classList.add('xitem-btn');
      div.classList.add('xitem-blue');
      div.innerHTML = 'Add Item';
      this.dom.btnAdd = div;
      this.dom.self.appendChild(div);

      div = document.createElement('div');
      this.dom.panelAdd = div;
      this.dom.self.appendChild(div);
      div = document.createElement('div');
      div.classList.add('xitem');
      div.appendChild(document.createTextNode('Cost: '));
      var input = document.createElement('input');
      input.classList.add('xitem-input');
      input.setAttribute('placeholder', 'paid amount, e.g. 15.4');
      this.dom.txtCost = input;
      div.appendChild(input);
      this.dom.panelAdd.appendChild(div);
      div = document.createElement('div');
      div.classList.add('xitem');
      div.appendChild(document.createTextNode('Description: '));
      input = document.createElement('input');
      input.classList.add('xitem-input');
      input.setAttribute('placeholder', 'goods description, e.g. 1/1 10 bottles of water');
      this.dom.txtDesc = input;
      div.appendChild(input);
      this.dom.panelAdd.appendChild(div);
      div = document.createElement('div');
      div.style.width = '100%';
      div.classList.add('xitem-btn');
      div.classList.add('xitem-green');
      div.innerHTML = 'Submit';
      this.dom.btnSubmit = div;
      this.dom.panelAdd.appendChild(div);
      div = document.createElement('div');
      div.style.width = '100%';
      div.classList.add('xitem-btn');
      div.innerHTML = 'cancel';
      this.dom.btnCancel = div;
      this.dom.panelAdd.appendChild(div);
      this.dom.panelAdd.style.display = 'none';

      div = document.createElement('div');
      div.style.marginTop = '5px';
      this.dom.panelList = div;
      this.dom.self.appendChild(div);

      div = document.createElement('div');
      div.classList.add('xitem');
      div.classList.add('xitem-yellow');
      div.innerHTML = 'Total: 0';
      this.dom.labelTotal = div;
      this.dom.self.appendChild(div);

      div = document.createElement('div');
      div.style.width = '100%';
      div.classList.add('xitem-btn');
      div.classList.add('xitem-red');
      div.innerHTML = 'Reset';
      this.dom.btnReset = div;
      this.dom.self.appendChild(div);

      var _this = this;
      this._api = {
         list: [],
         loadFromLocal: function () {
            var data = localStorage.getItem(system.localKey);
            if (!data) data = '{}';
            var json = JSON.parse(data);
            _this._api.list = json.list || [];
            _this._api.renderList();
            _this._api.buildReport();
         },
         loadFromRemote: function () {
            system.bundle.client.request(
               {cmd: 'simpleEdit.load', path: _this.data.filename},
               function (data) {
                  if (!data) data = {};
                  if (!data.data) data.data = '{}';
                  var json = JSON.parse(data.data);
                  _this._api.list = json.list || [];
                  _this._api.renderList();
                  _this._api.buildReport();
                  _this._api.saveToLocal();
                  alert('Loaded.');
               }
            );
         },
         saveToLocal: function () {
            var data = JSON.stringify({
               list: _this._api.list.filter(
                  function (item) { return !!item; }
               )
            });
            localStorage.setItem(system.localKey, data);
         },
         saveToRemote: function () {
            var data = JSON.stringify({
               list: _this._api.list.filter(
                  function (item) { return !!item; }
               )
            });
            system.bundle.client.request(
               {cmd: 'simpleEdit.save', path: _this.data.filename, data: data},
               function () {
                  alert('Saved.');
               }
            );
         },
         renderOne: function (item, index) {
            var div = document.createElement('div');
            var x = document.createElement('a');
            x.className = 'xitem-btn xitem-red btn-delete';
            x.setAttribute('data-id', index+1);
            x.innerHTML = 'Delete';
            div.appendChild(x);
            x = document.createElement('span');
            x.appendChild(document.createTextNode(' ( ' + item.m + ' ) '));
            div.appendChild(x);
            x = document.createElement('a');
            if (item.o) {
               x.className = 'xitem-btn xitem-green btn-check';
               x.innerHTML = 'checked';
            } else {
               x.className = 'xitem-btn xitem-yellow btn-check';
               x.innerHTML = 'unchecked';
            }
            x.setAttribute('data-id', index+1);
            div.appendChild(x);
            x = document.createElement('div');
            x.appendChild(document.createTextNode(item.d));
            div.appendChild(x);
            _this.dom.panelList.appendChild(div);
         },
         renderList: function () {
            while (_this.dom.panelList.children.length) {
               _this.dom.panelList.removeChild(_this.dom.panelList.children[0]);
            }
            _this.dom.panelList.innerHTML = '';
            _this._api.list.forEach(function (item, index) {
               _this._api.renderOne(item, index);
            });
         },
         buildReport: function () {
            var totalList = _this._api.list.filter(
               function (item) { return !!item; }
            ).map(
               function (item) { return item.m; }
            );
            var total = totalList.length?totalList.reduce(
               function (x, y) { return x+y; }
            ):0;
            var uncheckedList = _this._api.list.filter(
               function (item) { return item && !item.o; }
            ).map(
               function (item) { return item.m; }
            );
            var unchecked = uncheckedList.length?uncheckedList.reduce(
               function (x, y) { return x+y; }
            ):0;
            var txt = 'Total: ';
            if (unchecked) {
               txt += unchecked + ' / ';
            }
            txt += total;
            _this.dom.labelTotal.innerHTML = txt;
         },
         add: function (m, d) {
            var item = { m: m, d: d, o: false };
            _this._api.list.push(item);
            _this._api.renderOne(item, _this._api.list.length-1);
            _this._api.buildReport();
            _this._api.saveToLocal();
         },
         del: function (dom) {
            var i = parseInt(dom.getAttribute('data-id'));
            dom.parentNode.parentNode.removeChild(dom.parentNode);
            _this._api.list[i-1] = null;
            _this._api.buildReport();
            _this._api.saveToLocal();
         },
         toggle: function (dom) {
            var i = parseInt(dom.getAttribute('data-id'));
            var item = _this._api.list[i-1];
            if (!item) return;
            item.o = !item.o;
            if (item.o) {
               dom.classList.remove('xitem-yellow');
               dom.classList.add('xitem-green');
               dom.innerHTML = 'checked';
            } else {
               dom.classList.remove('xitem-green');
               dom.classList.add('xitem-yellow');
               dom.innerHTML = 'unchecked';
            }
            _this._api.buildReport();
            _this._api.saveToLocal();
         },
         reset: function () {
            _this._api.list = [];
            while (_this.dom.panelList.children.length) {
               _this.dom.panelList.removeChild(_this.dom.panelList.children[0]);
            }
            _this.dom.panelList.innerHTML = '';
            _this._api.buildReport();
            _this._api.saveToLocal();
         }
      };

      this.event = {
         click: {
            btnAdd: function () {
               _this.dom.btnAdd.style.display = 'none';
               _this.dom.panelAdd.style.display = 'block';
               _this.dom.txtCost.style.borderBottom = '1px solid black';
               _this.dom.txtDesc.style.borderBottom = '1px solid black';
            },
            btnCancel: function () {
               _this.dom.btnAdd.style.display = 'block';
               _this.dom.panelAdd.style.display = 'none';
            },
            btnSubmit: function () {
               var cost = parseFloat(_this.dom.txtCost.value);
               var desc = _this.dom.txtDesc.value;
               if (isNaN(cost)) {
                  _this.dom.txtCost.selectionStart = 0;
                  _this.dom.txtCost.selectionEnd = _this.dom.txtCost.value.length;
                  _this.dom.txtCost.style.borderBottom = '1px solid red';
                  _this.dom.txtCost.focus();
                  return;
               } else {
                  _this.dom.txtCost.style.borderBottom = '1px solid black';
               }
               if (!desc) {
                  _this.dom.txtDesc.selectionStart = 0;
                  _this.dom.txtDesc.selectionEnd = _this.dom.txtDesc.value.length;
                  _this.dom.txtDesc.style.borderBottom = '1px solid red';
                  _this.dom.txtDesc.focus();
                  return;
               } else {
                  _this.dom.txtDesc.style.borderBottom = '1px solid black';
               }
               _this._api.add(cost, desc);
               _this.dom.btnAdd.style.display = 'block';
               _this.dom.panelAdd.style.display = 'none';
               _this.dom.txtCost.value = '';
               _this.dom.txtDesc.value = '';
            },
            btnReset: function () {
               _this._api.reset();
            },
            btnPush: function () {
               _this._api.saveToRemote();
            },
            btnPull: function () {
               _this._api.loadFromRemote();
            },
            panelList: function (evt) {
               var target = evt.target;
               var id = target.getAttribute('data-id');
               if (!id) return;
               if (target.classList.contains('btn-check')) {
                  _this._api.toggle(target);
               } else if (target.classList.contains('btn-delete')) {
                  _this._api.del(target);
               }
            },
            btnClose: function () {
               _this.dispose();
            }
         }
      };

      this.dom.btnAdd.addEventListener('click', this.event.click.btnAdd);
      this.dom.btnCancel.addEventListener('click', this.event.click.btnCancel);
      this.dom.btnSubmit.addEventListener('click', this.event.click.btnSubmit);
      this.dom.btnReset.addEventListener('click', this.event.click.btnReset);
      this.dom.btnPush.addEventListener('click', this.event.click.btnPush);
      this.dom.btnPull.addEventListener('click', this.event.click.btnPull);
      this.dom.panelList.addEventListener('click', this.event.click.panelList);
      this.dom.btnClose.addEventListener('click', this.event.click.btnClose);

      this._api.loadFromLocal();
   },
   resize: function () {},
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
      this.dom.btnAdd.removeEventListener('click', this.event.click.btnAdd);
      this.dom.btnCancel.removeEventListener('click', this.event.click.btnCancel);
      this.dom.btnSubmit.removeEventListener('click', this.event.click.btnSubmit);
      this.dom.btnReset.removeEventListener('click', this.event.click.btnReset);
      this.dom.btnPush.removeEventListener('click', this.event.click.btnPush);
      this.dom.btnPull.removeEventListener('click', this.event.click.btnPull);
      this.dom.panelList.removeEventListener('click', this.event.click.panelList);
      this.dom.btnClose.removeEventListener('click', this.event.click.btnClose);
      system.bundle.editorTab.getDom().removeChild(this.dom.nav.dom.self);
      system.bundle.view.getDom().removeChild(this.dom.self);
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
      var instance = new EdienilnoFamilyAccountEditor(id, filename);
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
   name: 'familyAccount',
   version: '0.1',
   _create: function () { return api; }
};
window.edienilno.plugins[plugin.name] = plugin._create();


})();

