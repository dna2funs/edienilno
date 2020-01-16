'use strict';
//@include common.js
//@include editor.js
//@include component/layout.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
   view: dom('#p_view')
};

var _controller = {
   _cursor: null,
   switchSideTab: function (name) {
      var tab = ui.side[name];
      if (!tab) return;
      var visible = tab.isVisible();
      Object.keys(ui.side).forEach(function (name) {
         var tab = ui.side[name];
         tab.hide();
         ui.iconnav.dom.topIcons[tab.data.iconIndex].uncheck();
      });
      if (visible) {
         _controller._cursor = null;
         ui.layout.hideSide();
      } else {
         _controller._cursor = name;
         tab.show();
         ui.layout.showSide();
         ui.iconnav.dom.topIcons[tab.data.iconIndex].check();
      }
      resize();
   },
   toggleSideTab: function () {
      _controller.switchSideTab(_controller._cursor);
   }
};

var _event = {
   nav: {
      currentTab: null,
      switchSideTab: function (_, icon) {
         _controller.switchSideTab(icon.name);
      },
      connectIfOffline: function (_, icon) {
         if (!_controller.client) return;
         icon.check();
         if (_controller.client.isOnline()) return;
         _controller.client.connect();
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
   ui.btn = {};
   ui.btn.sideEditorPlus = document.createElement('div');
   ui.btn.sideEditorPlus.innerHTML = '<a class="edienilno-title-nav-caret" style="width:100%;">+</a>';
   ui.side.editor.dom.view.appendChild(ui.btn.sideEditorPlus);
   ui.btn.sideEditorPlus.addEventListener('click', function () {
      if (!_controller.pluginer) return;
      _controller.pluginer.open('/', 'fileBrowser');
   });
   ui.side.searcher.dom.view.innerHTML = 'Searcher';
   ui.side.plugins.dom.view.innerHTML = 'Plugins';
   ui.layout.dom.view.addEventListener('mousedown', function () {
      if (ui.layout.isNarrowMode() && ui.layout.isSideVisible()) {
         _controller.toggleSideTab();
      }
   });

   ui.controller = {};
   ui.controller.view = new edienilno.controller.View(ui.layout.dom.view);
   ui.controller.editorTab = new edienilno.controller.EditorTab(ui.side.editor.dom.view);
   ui.controller.editorTab.onTabClick(function (evt, navItem) {
      var id = navItem.getAttribute('data-id');
      ui.controller.view.bind(id);
      ui.controller.view.resize();
   });

   ui.iconnav = new edienilno.nav.IconNav(ui.layout.dom.nav);
   ui.iconnav.pushTop('team', './images/talk-bubbles-line.svg', _event.nav.switchSideTab);
   ui.iconnav.pushTop('editor', './images/note-line.svg', _event.nav.switchSideTab);
   ui.iconnav.pushTop('searcher', './images/search-line.svg', _event.nav.switchSideTab);
   ui.iconnav.pushTop('plugins', './images/plugin-line.svg', _event.nav.switchSideTab);
   ui.iconnav.pushBottom('settings', './images/cog-line.svg', _event.nav.showSettingsMenu);
   ui.iconnav.pushBottom('settings', './images/wifi-line.svg', _event.nav.connectIfOffline);
   ui.iconnav.dom.topIcons[0].check();

   ui.icon = {};
   ui.icon.disconnect = ui.iconnav.dom.bottomIcons[1];
   ui.icon.disconnect.check();

   ui.dropdown = {};
   ui.dropdown.settings_menu = new edienilno.DropdownView(ui.iconnav.dom.bottomIcons[0].dom);
   ui.dropdown.settings_menu.dom.self.style.width = '200px';
   ui.dropdown.settings_menu.dom.self.style.height = '200px';
   ui.dropdown.settings_menu.dom.self.style.border = '1px solid black';

   ui.titlenav = new edienilno.nav.TitleNav(document.querySelector('#nav_title'));
   ui.titlenav.dom.menu.dom.self.style.height = '200px';
   ui.titlenav.switchTab('untitled');

   _controller.client = new edienilno.WwbsocketClient('/ws');
   _controller.client.onOnline(function () {
      console.log('online');
      _controller._online = true;
      ui.icon.disconnect.check();
   });
   _controller.client.onOffline(function () {
      console.log('offline');
      _controller._online = false;
      ui.icon.disconnect.uncheck();
   });

   _controller.pluginer = new edienilno.PluginManager({
      client: _controller.client,
      view: ui.controller.view,
      editorTab: ui.controller.editorTab
   });
   _controller.pluginer.register('fileBrowser', './js/component/plugin/file_browser.js');
   _controller.pluginer.register('familyAccount', './js/component/plugin/family_account.js', ['.fyat']);
   _controller.pluginer.register('codeEditor', './js/component/plugin/code_editor.js');
   _controller.pluginer.register('simpleEditor', './js/component/plugin/simple_editor.js', [':default']);
   waitForOnline(5000, function () {
      _controller.pluginer.open('/', 'fileBrowser');
   });

   _controller.switchSideTab('editor');
   if (ui.layout.isNarrowMode()) {
      _controller.switchSideTab('editor');
   }

   // for debug only
   ui.iconnav.pushBottom('settings', './images/wifi-no-line.svg', function () {
      _controller.client.disconnect();
   });
   _controller.pluginer.register('lab.dragAndDrop', './js/component/plugin/lab/dnd.js');
   _controller.pluginer.open('@dnd', 'lab.dragAndDrop');

   function waitForOnline(timeout, fn) {
      var timestamp = new Date().getTime();
      setTimeout(_wait, 0);

      function _wait() {
         if (new Date().getTime() - timestamp >= timeout) return;
         if (!_controller._online) return setTimeout(_wait, 0);
         fn && fn();
      }
   }
}

function before_app() {
   ui_loading();
}

function resize() {
   ui.app.style.width = '100%';
   ui.app.style.height = (window.innerHeight - 60 /* header */) + 'px';
   ui.view.style.width = '100%';
   ui.view.style.height = (window.innerHeight - 60 - 36 /* sub-header */) + 'px';

   if (!_controller.resize_list) {
      _controller.resizeList = [
         ui.layout,
         ui.controller.view,
         ui.iconnav,
         ui.titlenav,
         // ui.editor,
         ui.side.team,
         ui.side.editor,
         ui.side.searcher,
         ui.side.plugins
      ].filter(function (x) {
         return x.resize;
      });
   }
   _controller.resizeList.forEach(function (component) {
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
}

var env = {};
login_and_start(env, before_app, init_app);
