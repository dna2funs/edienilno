'use strict';

function EdienilnoViewController(ui_view) {
   this.view = ui_view;
   this.editors = {
      /* name: editor{ resize, show, hide, dispose } */
   };
   this.bindName = null;
}
EdienilnoViewController.prototype = {
   getDom: function () {
      return this.view;
   },
   empty: function () {
      while (this.view.children.length) {
         this.view.removeChild(this.view.children[0]);
      }
      this.view.innerHTML = '';
   },
   register: function (name, editor) {
      this.editors[name] = editor;
   },
   dispose: function (name) {
      var editor = this.editors[name];
      if (!editor) return;
      delete this.editors[name];
      if (editor.dispose) editor.dispose();
   },
   bind: function (name) {
      var editor = this.editors[name];
      if (!editor) return;
      this.unbind(this.bindName);
      editor.show && editor.show();
      this.bindName = name;
   },
   unbind: function (name) {
      var editor = this.editors[name];
      if (editor) {
         editor.hide && editor.hide();
         if (this.bindName === name) this.bindName = null;
      } else {
         var names = Object.keys(this.editors);
         for (var i = 0, n = names.length; i < n; i++) {
            editor = this.editors[names[i]];
            editor && editor.hide && editor.hide();
         }
         this.bindName = null;
      }
   },
   resize: function () {
      var editor = this.editors[this.bind];
      if (editor && editor.resize) editor.resize();
   }
};

function EdienilnoEditorTabController(ui_side_editor_tab) {
   this.tab = ui_side_editor_tab;
   this.stack = [];
   this.index = 0;
   var div = document.createElement('div');
   this.stack.push(div);
   this.tab.appendChild(div);

   var _this = this;
   this.nav_event = {
      _clicks: [],
      click: function (evt) {
         var nav_item = getTargetRoot(evt.target);
         if (!nav_item) return;
         _this.nav_event._clicks.forEach(function (fn) {
            fn(evt, nav_item);
         });

         function getTargetRoot(dom) {
            var cur = dom;
            if (!cur) return null;
            while (!cur.getAttribute('data-plugin') || !cur.getAttribute('data-id')) {
               cur = cur.parentNode;
               if (!cur || cur === document.body) return null;
            }
            return cur;
         }
      }
   };
   div.addEventListener('click', this.nav_event.click);
}
EdienilnoEditorTabController.prototype = {
   getDom: function () {
      return this.stack[this.index];
   },
   empty: function () {
      while (this.tab.children.length) {
         this.tab.removeChild(this.tab.children[0]);
      }
      this.tab.innerHTML = '';
   },
   snapshot: function () {
      var div = document.createElement('div');
      div.style.display = 'block';
      var cur = this.stack[this.index];
      if (!cur) return;
      cur.style.display = 'none';
      this.index ++;
      this.stack.push(div);
      this.tab.appendChild(div);
   },
   restore: function () {
      if (!this.index) return;
      var div = this.stack.pop();
      if (!div) return;
      div.parentNode && div.parentNode.removeChild(div);
      this.index --;
      var cur = this.stack[this.index];
      if (!cur) return;
      cur.style.display = 'block';
   },
   dispose: function () {
      this.dom.self.removeEventListener('click', this.nav_event.click);
   },
   onTabClick: function (fn) {
      if (!fn || this.nav_event._clicks.indexOf(fn) >= 0) return;
      this.nav_event._clicks.push(fn);
   }
};

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.controller) window.edienilno.controller = {};
window.edienilno.controller.View = EdienilnoViewController;
window.edienilno.controller.EditorTab = EdienilnoEditorTabController;
