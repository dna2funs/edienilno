'use strict';

// @include common.js
// @include monaco-editor/vs/loader.js

require.config({ paths: {
   'vs': './js/editor/vs',
   'edienilno': './js/editor.js'
}});

(function (window, document) {
   function guess_lang_from_ext(path) {
      var langs = monaco.languages.getLanguages();
      var ext = path.split('.');
      if (ext.length > 1) ext = ext.pop(); else ext = null;
      if (!ext) return null;
      ext = '.' + ext;
      var lang = langs.filter(function (lang) {
         if (!lang.extensions) return false;
         return lang.extensions.indexOf(ext) >= 0;
      })[0];
      if (!lang) return null;
      return lang.id;
   }

   function EdienilnoTextModelService (options) {
      this.options = options;
   }
   EdienilnoTextModelService.prototype = {
      createModelReference: function (uri) {
         return this.getModel(uri);
      },
      registerTextModelContentProvider: function () {
         return { dispose: function () {} };
      },
      hasTextModelContentProvider: function (schema) {
         return true;
      },
      _buildReference: function (model) {
         var lifecycle = require('vs/base/common/lifecycle');
         var ref = new lifecycle.ImmortalReference({ textEditorModel: model });
         return {
            object: ref.object,
            dispose: function () { ref.dispose(); }
         };
      },
      getModel: function (uri) {
         var _this = this;
         return new Promise(function (r) {
            if (!uri || !uri.path || !uri.authority) return r(null);
            if (uri.path.endsWith('/')) {
               return r(monaco.editor.createModel('', '', uri));
            }
            var model = monaco.editor.getModel(uri);
            if (!model) {
               // e.g. monaco.editor.createModel('', 'javascript', uri);
               if (_this.options && _this.options.fetchText) {
                  _this.options.fetchText(uri).then(
                     function (text) {
                        model = monaco.editor.createModel(text, '', uri);
                        r(_this._buildReference(model));
                     },
                     function () {
                        r(null);
                     }
                  );
                  return;
               }
            }
            r(_this._buildReference(model));
         });
      }
   };

   function EdienilnoEditor (dom) {
      this.self = dom;
      this.api = null;
      this.global = null;
      this.hook = {};
   }
   EdienilnoEditor.prototype = {
      create: function (filename, text, information, options) {
         var _this = this;
         if (_this._content_loading) return e(_this._content_loading);
         if (!options) options = {};
         // options.readOnly = true;
         require(['vs/editor/editor.main'], function () {
            var lang =  guess_lang_from_ext(filename);
            var modelService = new EdienilnoTextModelService({
               fetchText: function (uri) {
                  if (_this.hook.on_content_load) return _this.hook.on_content_load(uri);
                  return Promise.resolve(null);
               }
            });
            _this.global = monaco;
            _this.api = monaco.editor.create(_this.self, options, {
               textModelService: modelService,
               automaticLayout: true,
            });
            modelService.createModelReference(monaco.Uri.parse(filename)).then(function (model) {
               if (model) model = model.object.textEditorModel;
                     else model = monaco.editor.createModel(text, lang, monaco.Uri.parse(filename));
               _this.api.setModel(model);
               _this.set_language(lang);
            }, function () {
               // TODO: deal with loading fail
            });
         });
      },
      resize: function () {
         if (!this.api) return;
         this.api.layout();
      },
      dispose: function () {
         if (!this.api) return;
         if (this._backup.on_definition_click) this._backup.on_definition_click = null;
         if (this._backup.decorations) this._backup.decorations = null;
         this.api.dispose();
      },
      on_content_ready: function (fn, self) {
         if (!self) self = this;
         if (!self.api) {
            return setTimeout(self.on_content_ready, 0, fn, self);
         }
         fn && fn();
      },
      on_content_load: function (fn) {
         this.hook.on_content_load = fn;
      },
      set_language: function (lang) {
         if(!this.api) return;
         var model = this.api.getModel();
         if (!model) return;
         lang = lang || 'plain';
         monaco.editor.setModelLanguage(model, lang);
      },
      set_text: function (text) {
         this.api.setValue(text);
      },
      set_position: function (line_no, column) {
         this.api.revealPositionInCenter({
            lineNumber: line_no,
            column: column
         });
      },
      set_selection: function (start_line_no, start_column, end_line_no, end_column) {
         this.api.setSelection({
            startLineNumber: start_line_no,
            startColumn: start_column,
            endLineNumber: end_line_no,
            endColumn: end_column
         });
      },
      define_directory_lang: function () {
         var lang = 'flameInternalDirectory';
         var lang_item = monaco.languages.getLanguages().filter(
            function (x) { return x.id == lang; }
         )[0];
         if (!lang_item) {
            monaco.languages.register({
               id: lang,
               extensions: ['.__dir__']
            });
            monaco.languages.setMonarchTokensProvider(lang, {
               tokenizer: {
                  root: [
                     [/\.\/[^\s]+[\s]/, 'custom-file']
                  ]
               }
            });
            monaco.editor.defineTheme(lang, {
               base: 'vs',
               inherit: false,
               rules: [
                  { token: 'custom-file', foreground: '008888' }
               ]
            });
         }
         this.set_language(lang, lang);
      },
      show: function () {
         this.self.style.display = 'block';
      },
      hide: function () {
         this.self.style.display = 'none';
      },
      /*
         model.deltaDecorations(
            [], // deleting decoration ID list (model.getAllDecorations, model.getLineDecorations)
            [], // adding decoration, { range, options }
         )
         e.g. ['c;1'], [{
            range: new monaco.Range(lineNumber, column, lineNumber, column+length),
            options: { inlineClassName: 'mark_test' }
         }]
      */
      decoration_backup: function () {
         if (!this.api) return;
         var m = this.api.getModel();
         let list = m.getAllDecorations();
         this._backup.decorations = list.map(function (x) { return x.id; });
      },
      decoration_restore: function () {
         if (!this.api) return;
         if (!this._backup.decorations) return;
         this._backup.decorations = [];
         var m = this.api.getModel();
         let list = m.getAllDecorations();
         let map = {};
         this._backup.decorations.forEach(function (x) { map[x] = 1; });
         m.deltaDecorations(list.map(function (x) {
            return x.id;
         }).filter(function (x) {
            return !map[x];
         }), []);
      }
   };

   window.EdienilnoTextModelService = EdienilnoTextModelService;
   window.EdienilnoEditor = EdienilnoEditor;
})(window, document);
