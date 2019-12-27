'use strict';
//@include common.js
//@include editor.js
//@include component/layout.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
   view: dom('#p_view')
};

var controller = {
   switchSideTab: function (name) {
      Object.keys(ui.side).forEach(function (name) {
         var tab = ui.side[name];
         tab.hide();
         ui.iconnav.dom.topIcons[tab.data.iconIndex].uncheck();
      });
      var tab = ui.side[name];
      if (!tab) return;
      tab.show();
      tab.resize();
      ui.iconnav.dom.topIcons[tab.data.iconIndex].check();
   }
};

var event = {
   nav: {
      switchSideTab: function (_, icon) {
         controller.switchSideTab(icon.name);
      },
      showSettingsMenu: function (_, icon) {
         if (ui.dropdown.settings_menu.isVisible()) {
            ui.dropdown.settings_menu.hide();
            return;
         }
         ui.dropdown.settings_menu.show();
         ui.dropdown.settings_menu.offset(
            icon.dom.offsetWidth - 6,
            96 - ui.dropdown.settings_menu.dom.self.offsetHeight - 10
         );
      }
   }
};

function init_ui() {
   ui.layout = new edienilno.layout.SideNavLayout(ui.view);
   ui.side = {};
   ui.side.team = new edienilno.ScrollableView(ui.layout.dom.side);
   ui.side.editor = new edienilno.ScrollableView(ui.layout.dom.side);
   ui.side.searcher = new edienilno.ScrollableView(ui.layout.dom.side);
   ui.side.plugins = new edienilno.ScrollableView(ui.layout.dom.side);
   ui.side.team.data = { iconIndex: 0 };
   ui.side.editor.data = { iconIndex: 1 };
   ui.side.searcher.data = { iconIndex: 2 };
   ui.side.plugins.data = { iconIndex: 3 };
   ui.side.team.dom.view.innerHTML = 'Team';
   ui.side.editor.dom.view.innerHTML = 'Editor';
   ui.side.searcher.dom.view.innerHTML = 'Searcher';
   ui.side.plugins.dom.view.innerHTML = 'Plugins';

   /*
   ui.editor = new EdienilnoEditor(document.createElement('div'));
   ui.editor.self.style.height = '100%';
   ui.editor.self.style.width = '100%';
   ui.layout.dom.view.appendChild(ui.editor.self);
   ui.editor.create('edienilno://test/1.js', 'function a() {}', {}, { readOnly: false });
   ui.editor.on_content_load(function (uri) { return Promise.resolve(null);});
   ui.editor.on_content_ready(function () {
      ui.editor.resize();
   });
   */

   ui.iconnav = new edienilno.nav.IconNav(ui.layout.dom.nav);
   ui.iconnav.pushTop('team', './images/talk-bubbles-line.svg', event.nav.switchSideTab);
   ui.iconnav.pushTop('editor', './images/note-line.svg', event.nav.switchSideTab);
   ui.iconnav.pushTop('searcher', './images/search-line.svg', event.nav.switchSideTab);
   ui.iconnav.pushTop('plugins', './images/plugin-line.svg', event.nav.switchSideTab);
   ui.iconnav.pushBottom('settings', './images/cog-line.svg', event.nav.showSettingsMenu);
   ui.iconnav.dom.topIcons[0].check();

   ui.dropdown = {};
   ui.dropdown.settings_menu = new window.edienilno.DropdownView(ui.iconnav.dom.bottomIcons[0].dom);
   ui.dropdown.settings_menu.dom.self.style.width = '200px';
   ui.dropdown.settings_menu.dom.self.style.height = '200px';
   ui.dropdown.settings_menu.dom.self.style.border = '1px solid black';

   ui.titlenav = new edienilno.nav.TitleNav(document.querySelector('#nav_title'));
   ui.titlenav.dom.menu.dom.self.style.height = '200px';
   ui.titlenav.switchTab('untitled');

   // var test_item = new edienilno.SideItem('Space', '#');
   // ui.layout.dom.side.appendChild(test_item.dom.self);

   window.edienilno.loadPlugin(
      'fileBrowser',
      './js/component/plugin/file_browser.js',
      { test: 1 }
   ).then(function (plugin) {
      console.log(plugin);
   }, function () {
   });
}

function before_app() {
   ui_loading();
}

function resize() {
   ui.app.style.width = '100%';
   ui.app.style.height = (window.innerHeight - 60 /* header */) + 'px';
   ui.view.style.width = '100%';
   ui.view.style.height = (window.innerHeight - 60 - 36 /* sub-header */) + 'px';

   if (!controller.resize_list) {
      controller.resizeList = [
         ui.layout,
         ui.iconnav,
         ui.titlenav
         // ui.editor,
      ].filter(function (x) {
         return x.resize;
      });
   }
   controller.resizeList.forEach(function (component) {
      component.resize();
   });
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
   init_ui();
   controller.switchSideTab('editor');
}

var env = {};
login_and_start(env, before_app, init_app);
