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
   this.currentList = null;
   this.itemLists = {
      /* name: { prev: name, next: name, items: [], render: Fn } */
   };
}
EdienilnoEditorTabController.prototype = {};

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.controller) window.edienilno.controller = {};
window.edienilno.controller.View = EdienilnoViewController;
window.edienilno.controller.EditorTab = EdienilnoEditorTabController;
