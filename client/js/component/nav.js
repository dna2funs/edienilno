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
   img.src = imageUri;
   this.dom.appendChild(img);
   this._selected = false;
   this._actionFn = actionFn;

   var _this = this;
   this.event = {
      mouseEnter: function (evt) {
         _this.dom.style.opacity = 1;
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
   check: function () {
      this._selected = true;
      this.dom.style.opacity = 1;
      this.dom.style.borderLeft = '3px solid black';
   },
   uncheck: function () {
      this._selected = false;
      this.dom.style.opacity = 0.3;
      this.dom.style.borderLeft = null;
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

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.nav) window.edienilno.nav = {};
window.edienilno.nav.EdienilnoIcon = EdienilnoIcon;
window.edienilno.nav.EdienilnoIconNav = EdienilnoIconNav;

})();