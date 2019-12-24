'use strict';

(function () {

function EdienilnoSideItem(text, url) {
   var a = document.createElement('a');
   a.classList.add('edienilno-side-item');
   a.appendChild(document.createTextNode(text));
   a.href = url;
   this.dom = {
      self: a,
      img: document.createElement('img')
   };
}

function EdienilnoScrollableView(container) {
   var div = document.createElement('div');
   var view = document.createElement('div');
   this.dom = {
      container: container,
      self: div,
      view: view
   };
   div.appendChild(view);
   container.appendChild(div);
   this.resize();
}
EdienilnoScrollableView.prototype = {
   resize: function () {
      this.dom.self.style.width = this.dom.container.offsetWidth + 'px';
      this.dom.self.style.height = this.dom.container.offsetHeight + 'px';
   },
   scrollableX: function () {
      this.dom.self.style.overflowX = 'auto';
   },
   unscrollableX: function () {
      this.dom.self.style.overflowX = 'hidden';
   },
   scrollableY: function () {
      this.dom.self.style.overflowY = 'auto';
   },
   unscrollableY: function () {
      this.dom.self.style.overflowY = 'hidden';
   },
   show: function () {
      this.dom.self.style.display = 'block';
   },
   hide: function () {
      this.dom.self.style.display = 'none';
   }
};

if (!window.edienilno) window.edienilno = {};
window.edienilno.SideItem = EdienilnoSideItem;
window.edienilno.ScrollableView = EdienilnoScrollableView;

})();