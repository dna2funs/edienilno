'use strict';
//@include common.js
//@include editor.js
//@include layout.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
   view: dom('#p_view'),
   // editor: new EdienilnoEditor(dom('#editor_container'))
};
ui.layout = new edienilno.layout.SideNavLayout(ui.view);
ui.editor = new EdienilnoEditor(document.createElement('div'));
ui.editor.self.style.height = '100%';
ui.editor.self.style.width = '100%';
ui.layout.dom.view.appendChild(ui.editor.self);
ui.editor.create('edienilno://test/1.js', 'function a() {}', {}, { readOnly: false });
ui.editor.on_content_load(function (uri) { return Promise.resolve(null); });
ui.editor.on_content_ready(function () {});

function before_app() {
   ui_loading();
}

function resize() {
   ui.app.style.width = '100%';
   ui.app.style.height = (window.innerHeight - 60 /* header */) + 'px';
   ui.view.style.width = '100%';
   ui.view.style.height = (window.innerHeight - 60 - 36 /* sub-header */) + 'px';
   ui.layout.resize();
   ui.editor.resize();
}

function register_events() {
   window.addEventListener('resize', resize);
}

function init_app() {
   ui_loaded();
   register_events();
   resize();
}

function ui_loading() {
   ui.app.classList.add('hide');
   ui.loading.classList.remove('hide');
}

function ui_loaded() {
   ui.loading.classList.add('hide');
   ui.app.classList.remove('hide');
}

var env = {};
login_and_start(env, before_app, init_app);
