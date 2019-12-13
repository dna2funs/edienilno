'use strict';

(function () {

function EdienilnoSideNavLayout(parent) {
   this.dom = {
      parent: parent,
      self: document.createElement('div'),
      nav: document.createElement('div'),
      side: document.createElement('div'),
      view: document.createElement('div'),
   };
   this.dom.self.style.height = '100%';
   this.dom.self.style.width = '100%';

   this.dom.self.appendChild(this.dom.nav);
   this.dom.self.appendChild(this.dom.side);
   this.dom.self.appendChild(this.dom.view);
   this.dom.parent.appendChild(this.dom.self);

   this.options = {};
   this.options.navWidth = 60;
   this.options.sideWidth = 100;
   this.options.minViewWidth = 360 - 60;
   this.resize();
}
EdienilnoSideNavLayout.prototype = {
   resize: function () {
      this.dom.nav.style.position = 'absolute';
      this.dom.nav.style.left = '0px';
      this.dom.nav.style.top = this.dom.parent.offsetTop + 'px';
      this.dom.nav.style.width = this.options.navWidth + 'px';
      this.dom.nav.style.height = this.dom.parent.offsetHeight + 'px';
      this.dom.nav.style.border = '1px solid red';

      if (this.dom.parent.offsetWidth - this.options.navWidth - this.options.sideWidth < this.options.minViewWidth) {
         this._resizeForNarrowScreen();
      } else {
         this._resizeForBroadScreen();
      }
   },
   updateOptions: function (options) {
      Object.assign(this.options, options);
   },
   _resizeForBroadScreen: function () {
      this.dom.side.style.position = 'absolute';
      this.dom.side.style.left = this.options.navWidth + 'px';
      this.dom.side.style.top = this.dom.parent.offsetTop + 'px';
      this.dom.side.style.width = this.options.sideWidth + 'px';
      this.dom.side.style.height = this.dom.parent.offsetHeight + 'px';
      this.dom.side.style.border = '1px solid blue';

      this.dom.view.style.position = 'absolute';
      this.dom.view.style.left = (this.options.navWidth + this.options.sideWidth) + 'px';
      this.dom.view.style.top = this.dom.parent.offsetTop + 'px';
      this.dom.view.style.width = (this.dom.parent.offsetWidth - this.options.sideWidth - this.options.navWidth) + 'px';
      this.dom.view.style.height = this.dom.parent.offsetHeight + 'px';
      this.dom.view.style.border = '1px solid green';
   },
   _resizeForNarrowScreen: function () {
      this.dom.side.style.position = 'absolute';
      // this.dom.side.style.display = 'none';
      this.dom.side.style.left = this.options.navWidth + 'px';
      this.dom.side.style.top = this.dom.parent.offsetTop + 'px';
      this.dom.side.style.width = this.options.sideWidth + 'px';
      this.dom.side.style.height = this.dom.parent.offsetHeight + 'px';
      this.dom.side.style.border = '1px solid blue';

      this.dom.view.style.position = 'absolute';
      this.dom.view.style.left = this.options.navWidth + 'px';
      this.dom.view.style.top = this.dom.parent.offsetTop + 'px';
      this.dom.view.style.width = (this.dom.parent.offsetWidth - this.options.navWidth) + 'px';
      this.dom.view.style.height = this.dom.parent.offsetHeight + 'px';
      this.dom.view.style.border = '1px solid green';
   }
};

if (!window.edienilno) window.edienilno = {};
if (!window.edienilno.layout) window.edienilno.layout = {};
window.edienilno.layout.SideNavLayout = EdienilnoSideNavLayout;

})();