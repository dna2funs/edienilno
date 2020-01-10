(function () {

   var system = {
      bundle: null
   };
   
   function basename(filename) {
      return filename.split('/').pop();
   }
   
   function EdienilnoDragAndDropLab(id, filename) {
      this.id = id;
      var div = document.createElement('div');
      var nav = new edienilno.SideItem(null, basename(filename), filename);
      this.dom = {
         self: div,
         nav: nav,
         box1: document.createElement('div'),
         box2: document.createElement('div')
      };
      this.data = {
         filename: filename
      };
      system.bundle.editorTab.getDom().appendChild(nav.dom.self);
      nav.dom.self.setAttribute('data-plugin', plugin.name);
      nav.dom.self.setAttribute('data-id', id);

      div.style.width = '100%';
      div.style.height = '100%';

      this.dom.box1.id = 'box1';
      this.dom.box1.setAttribute('draggable', 'true');
      this.dom.box1.style.width = '50px';
      this.dom.box1.style.height = '50px';
      this.dom.box1.style.margin = '2px';
      this.dom.box1.style.border = '1px solid black';
      this.dom.box1.style.backgroundColor = 'green';

      this.dom.box2.id = 'box2';
      this.dom.box2.style.width = '150px';
      this.dom.box2.style.height = '150px';
      this.dom.box2.style.margin = '2px';
      this.dom.box2.style.border = '1px solid black';
      this.dom.box2.style.backgroundColor = 'red';

      div.innerHTML = 'Drag and Drop!';
      div.appendChild(this.dom.box2);
      div.appendChild(this.dom.box1);

      var _this = this;
      this.event = {
         obj: {
            _target: null,
            drag: function (evt) {
               _this.event.obj._target = evt.target;
               evt.target.style.opacity = 0.5;
            },
            drop: function (evt) {
               evt.target.style.opacity = '';
            }
         },
         container: {
            dragover: function (evt) {
               evt.preventDefault();
               evt.stopPropagation();
            },
            drop: function (evt) {
               evt.preventDefault();
               var elem = _this.event.obj._target;
               if (!elem) return;
               if (evt.target === elem) return;
               _this.event.obj._target = null;
               evt.target.appendChild(elem);
            }
         }
      };

      this.dom.box1.addEventListener('dragstart', this.event.obj.drag);
      this.dom.box1.addEventListener('dragend', this.event.obj.drop);
      div.addEventListener('dragover', this.event.container.dragover);
      div.addEventListener('drop', this.event.container.drop);

      this.hide();
   }
   EdienilnoDragAndDropLab.prototype = {
      getPluginName: function () {
         return plugin.name;
      },
      getFileName: function () {
         return this.data.filename;
      },
      resize: function () {},
      show: function () {
         if (!this.dom.self.parentNode) {
            var view = system.bundle.view.getDom();
            view.appendChild(this.dom.self);
         }
         this.dom.nav.dom.self.style.backgroundColor = '#eeeeee';
         this.dom.self.style.display = 'block';
      },
      hide: function () {
         this.dom.nav.dom.self.style.backgroundColor = 'white';
         this.dom.self.style.display = 'none';
      },
      dispose: function () {
         this.dom.box1.removeEventListener('dragstart', this.event.obj.drag);
         this.dom.box1.removeEventListener('dragend', this.event.obj.drop);
         this.dom.self.removeEventListener('dragover', this.event.container.dragover);
         this.dom.self.removeEventListener('drop', this.event.container.drop);
         system.bundle.editorTab.getDom().removeChild(this.dom.nav.dom.self);
         system.bundle.view.getDom().removeChild(this.dom.self);
      }
   };
   
   var api = {
      _instances: {},
      _ready: false,
      // initialize api on first load
      initialize: function (bundle) {
         system.bundle = bundle;
         edienilno.loadScript('./js/3rd/DragDropTouch.js').then(function () {
            api._ready = true;
         });
      },
      // create a new file browser with an ID
      create: function (filename) {
         var id = 'lab.dragAndDrop-' + generate_id();
         while (api._instances[id]) id = generate_id();
         var instance = new EdienilnoDragAndDropLab(id, filename);
         api._instances[id] = instance;
         return id;
      },
      // get created file browser with an ID
      get: function (id) {
         return api._instances[id];
      },
      isReady: function () {
         return api._ready;
      },
      // render for file browser with a specified ID
      render: function (id) {},
      // close an instance
      close: function (id) {
         delete api._instances[id];
         system.bundle.view.dispose(id);
      }
   };
   
   var plugin = {
      name: 'lab.dragAndDrop',
      version: '0.1',
      _create: function () { return api; }
   };
   window.edienilno.plugins[plugin.name] = plugin._create();
   
   
   })();
   
   