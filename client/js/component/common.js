'use strict';

(function () {

function EdienilnoPseudoId(N) {
   var random = ~~(Math.random() * N)
   var timestamp = ~~(new Date().getTime());
   return (timestamp + '-') + random;
}

function EdienilnoSideItem(url, title, desc) {
   var a = document.createElement('a');
   var d1 = document.createElement('div');
   var d2 = document.createElement('div');
   a.classList.add('edienilno-side-item');
   d1.style.fontSize = '20px';
   d1.style.textOverflow = 'ellipsis';
   d1.style.whiteSpace = 'nowrap';
   d1.style.overflow = 'hidden';
   d2.style.textOverflow = 'ellipsis';
   d2.style.whiteSpace = 'nowrap';
   d2.style.overflow = 'hidden';
   if (title) {
      d1.appendChild(document.createTextNode(title));
      a.appendChild(d1);
   }
   if (desc) {
      d2.appendChild(document.createTextNode(desc));
      a.appendChild(d2);
   }
   if (url) a.href = url;
   this.dom = {
      self: a,
      title: d1,
      desc: d2,
      img: document.createElement('img')
   };
}
EdienilnoSideItem.prototype = {
   setTitle: function (title) {
      this.dom.title.innerHTML = '';
      this.dom.title.appendChild(document.createTextNode(title));
   },
   setDescription: function (desc) {
      this.dom.desc.innerHTML = '';
      this.dom.desc.appendChild(document.createTextNode(desc));
   }
};

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
   this.hide();
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
   isVisible: function () {
      return this.displayed;
   },
   show: function () {
      this.dom.self.style.display = 'block';
      this.displayed = true;
   },
   hide: function () {
      this.dom.self.style.display = 'none';
      this.displayed = false;
   }
};

function EdienilnoDropdownView(stick_to) {
   var div = document.createElement('div');
   this.dom = {
      self: div,
      stick_to: stick_to,
      mask: null
   };
   if (stick_to) {
      stick_to.setAttribute('data-dropdown-id', this.id);
   }
   div.setAttribute('data-dropdown-id', this.id);
   div.style.backgroundColor = 'white';

   var _this = this;
   this.event = {
      mouseDown: function (evt) {
console.log('test');
         _this.hide();
      }
   };

   div.style.position = 'absolute';
   div.style.top = '0';
   div.style.left = '0';
   div.style.zIndex = '2001';
   this.dx = 0;
   this.dy = 0;
   document.body.appendChild(div);
   this.hide();
}
EdienilnoDropdownView.prototype = {
   dispose: function () {
      if (this.dom.mask) {
         this.dom.mask.removeEventListener('mousedown', this.event.mouseDown);
         if (this.dom.mask.parentNode) this.dom.mask.parentNode.removeChild(this.dom.mask);
         this.dom.mask = null;
      }
      if (this.dom.self.parentNode) {
         this.dom.self.parentNode.removeChild(this.dom.self);
      }
   },
   stick: function () {
      if (!this.dom.stick_to) return;
      this.dom.self.style.top = (this.dom.stick_to.offsetTop + this.dom.stick_to.offsetHeight + this.dy) + 'px';
      this.dom.self.style.left = (this.dom.stick_to.offsetLeft + this.dx) + 'px';
   },
   offset: function (dx, dy) {
      this.dx = dx;
      this.dy = dy;
      this.stick();
   },
   isVisible: function () {
      return this.displayed;
   },
   show: function () {
      this.dom.self.style.display = 'block';
      if (!this.dom.mask) {
         this.dom.mask = document.createElement('div');
         this.dom.mask.style.position = 'fixed';
         this.dom.mask.style.width = '100%';
         this.dom.mask.style.height = '100%';
         this.dom.mask.style.top = '0px';
         this.dom.mask.style.left = '0px';
         this.dom.mask.style.backgroundColor = 'transparent';
         this.dom.mask.style.zIndex = '2000';
      }
      document.body.appendChild(this.dom.mask);
      this.dom.mask.addEventListener('mousedown', this.event.mouseDown);
      this.displayed = true;
   },
   hide: function () {
      this.dom.self.style.display = 'none';
      if (this.dom.mask) {
         this.dom.mask.removeEventListener('mousedown', this.event.mouseDown);
         if (this.dom.mask.parentNode) this.dom.mask.parentNode.removeChild(this.dom.mask);
         this.dom.mask = null;
      }
      this.displayed = false;
   }
};

if (!window.edienilno) window.edienilno = {};
window.edienilno.pseudoId = EdienilnoPseudoId;
window.edienilno.SideItem = EdienilnoSideItem;
window.edienilno.ScrollableView = EdienilnoScrollableView;
window.edienilno.DropdownView = EdienilnoDropdownView;

})();