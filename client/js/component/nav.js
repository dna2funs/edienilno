'use strict';

(function () {

var iconWidth = 60;
var iconHeight = 56;

function EdienilnoIcon(name, imageUri, actionFn) {
   this.name = name;
   this.dom = document.createElement('a');
   this.dom.setAttribute('data-name', name);
   this.dom.style.opacity = 0.3;
   this.dom.style.width = iconWidth + 'px';
   this.dom.style.height = iconHeight + 'px';
   this.dom.style.paddingTop = '8px';
   this.dom.style.paddingLeft = '10px';
   var img = document.createElement('img');
   img.style.width = '36px';
   img.style.height = '36px';
   img.style.cursor = 'pointer';
   img.src = imageUri;
   this.dom.appendChild(img);
   this._selected = false;
   this._actionFn = actionFn;

   var _this = this;
   this.event = {
      mouseEnter: function (evt) {
         _this.dom.style.opacity = 0.6;
      },
      mouseLeave: function (evt) {
         if (_this._selected) {
            _this.dom.style.opacity = 1;
         } else {
            _this.dom.style.opacity = 0.3;
         }
      },
      click: function (evt) {
         _this._actionFn && _this._actionFn(evt, _this);
      }
   };
   this.dom.addEventListener('mouseenter', this.event.mouseEnter);
   this.dom.addEventListener('mouseleave', this.event.mouseLeave);
   this.dom.addEventListener('click', this.event.click);
}
EdienilnoIcon.prototype = {
   dispose: function () {
      if (this.dom.parentNode) this.dom.parentNode.removeChild(this.dom);
      this.dom.removeEventListener('mouseenter', this.event.mouseEnter);
      this.dom.removeEventListener('mouseleave', this.event.mouseLeave);
      this.dom.removeEventListener('click', this.event.click);
   },
   check: function (fn) {
      this._selected = true;
      this.dom.style.opacity = 1;
      this.dom.style.borderLeft = '3px solid black';
      fn && fn(this.dom);
   },
   uncheck: function (fn) {
      this._selected = false;
      this.dom.style.opacity = 0.3;
      this.dom.style.borderLeft = null;
      fn && fn(this.dom);
   }
};

function EdienilnoIconNav(parent) {
   this.dom = {
      parent: parent,
      self: document.createElement('div'),
      topIcons: [],
      bottomIcons: []
   };
   this.dom.self.style.width = '100%';
   this.dom.self.style.height = '100%';
   this.dom.parent.appendChild(this.dom.self);
}
EdienilnoIconNav.prototype = {
   resize: function () {
      for (var i = 0; i < this.dom.topIcons.length; i++) {
         var icon = this.dom.topIcons[i];
         icon.dom.style.top = (8 + iconHeight * i) + 'px';
      }
      for (var i = 1; i <= this.dom.bottomIcons.length; i++) {
         var icon = this.dom.bottomIcons[i - 1];
         icon.dom.style.top = (this.dom.self.offsetHeight - iconHeight * i) + 'px';
      }
   },
   pushTop: function (name, imageUri, actionFn) {
      var icon = new EdienilnoIcon(name, imageUri, actionFn);
      icon.dom.style.position = 'absolute';
      icon.dom.style.left = '0px';
      icon.dom.style.top = (8 + iconHeight * this.dom.topIcons.length) + 'px';
      this.dom.self.appendChild(icon.dom);
      this.dom.topIcons.push(icon);
   },
   popTop: function () {
      if (!this.dom.topIcons.length) return;
      var icon = this.dom.topIcons.pop();
      icon.dispose();
   },
   pushBottom: function (name, imageUri, actionFn) {
      var icon = new EdienilnoIcon(name, imageUri, actionFn);
      this.dom.bottomIcons.push(icon);
      icon.dom.style.position = 'absolute';
      icon.dom.style.left = '0px';
      icon.dom.style.top = (this.dom.self.offsetHeight - iconHeight * this.dom.bottomIcons.length) + 'px';
      this.dom.self.appendChild(icon.dom);
   },
   popBottom: function () {
      if (!this.dom.bottomIcons.length) return;
      var icon = this.dom.bottomIcons.pop();
      icon.dispose();
   }
};

function EdienilnoTitleNav(container) {
   var div = document.createElement('div');
   var dropdown_caret = document.createElement('a');
   var title_div = document.createElement('div');
   this.dom = {
      container: container,
      self: div,
      caret: dropdown_caret,
      menu: new window.edienilno.DropdownView(div),
      title: title_div
   };
   this.dom.menu.dom.self.style.zIndex = '2001';
   this.dom.menu.dom.self.style.border = '1px solid purple';
   div.style.overflow = 'hidden';
   dropdown_caret.innerHTML = '&#8964';
   dropdown_caret.classList.add('edienilno-title-nav-caret');
   title_div.style.display = 'inline-block';
   title_div.style.marginLeft = '5px';
   div.appendChild(dropdown_caret);
   div.appendChild(title_div);
   container.appendChild(div);

   var _this = this;
   this.event = {
      click: function () {
         _this.dom.menu.stick();
         if (_this.dom.menu.isVisible()) {
            _this.dom.menu.hide();
         } else {
            _this.dom.menu.show();
         }
      }
   };
   dropdown_caret.addEventListener('click', this.event.click);

   var data = {
      tab: 'untitled',
      controller: {
         untitled: {
            render: function () {
               _this._emptyTitleContainer();
               _this.dom.title.innerHTML = '* Untitled';
            }
         }
      }
   };
   this.data = data;
}
EdienilnoTitleNav.prototype = {
   _emptyTitleContainer: function () {
      // detach element nodes
      while (this.dom.title.children.length) this.dom.title.removeChild(this.dom.title.children[0]);
      // clear text nodes
      this.dom.title.innerHTML = '';
   },
   switchTab: function (tab_name) {
      var tab = this.data.controller[tab_name];
      if (!tab) return;
      tab.render();
   },
   dispose: function () {
      this.dom.caret.removeEventListener('click', this.event.click);
   },
   resize: function () {
      var width = this.dom.container.parentNode.offsetWidth - this.dom.container.offsetLeft;
      this.dom.self.style.width = width + 'px';
      this.dom.menu.dom.self.style.width = width + 'px';
      this.dom.title.style.width = (width - this.dom.caret.offsetWidth - 5) + 'px';
   }
};

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.nav) window.edienilno.nav = {};
window.edienilno.nav.Icon = EdienilnoIcon;
window.edienilno.nav.IconNav = EdienilnoIconNav;
window.edienilno.nav.TitleNav = EdienilnoTitleNav;

})();