'use strict';

function EdienilnoAuthor(id) {
   this.id = id;
   this.range = { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
   this.permissions = {};
}
EdienilnoAuthor.prototype = {
   getRange: function () {
      return Object.assign({}, this.range);
   },
   setRange: function (range) {
      if (!range) return;
      this.range.startLineNumber = range.startLineNumber || 1;
      this.range.startColumn = range.startColumn || 1;
      this.range.endLineNumber = range.endLineNumber || this.range.startLineNumber;
      this.range.endColumn = range.endColumn || this.range.endColumn;
   }
};

function EdienilnoTextModel(text) {
   this.text = this.splitTextIntoLines(text);
   this.updateTextHash();
   this.hash = null;
   this.authors = [];
   this.editingRequests = [];
}
EdienilnoTextModel.prototype = {
   updateTextHash: function () {
      // hash is used to confirm data synced
      // if not synced, it should load entire data from server
      // otherwise, we can do a quick patch to sync data
      this.hash = null;
   },
   splitTextIntoLines: function (text) {
      return text.split(/\r\n|\n|\r/);
   },
   getLineContent: function (lineNumber) {
      var line = this.text[lineNumber - 1];
      return line;
   },
   getAuthor: function (authorId) {
      var author = this.authors.filter(function (x) { return x.id === authorId; })[0];
      return author;
   },
   applyEditing: function (authorId, newRange, editingObj) {
      // editingObj = null | { insertText: String }
      var author = this.getAuthor(authorId);
      if (!author) return; // TODO: error handler here for author not found
      var oldRange = author.getRange();
      author.setRange(newRange);
      var impact = { oldRange: oldRange, replaceRange: oldRange, insertText: null };
      if (!editingObj || !editingObj.insertText) return impact; // merely cursor moves
      var newContents = this.splitTextIntoLines(editingObj.insertText);
      var impactRange = this._mergeLines(this.text, newContents, oldRange);
      this.updateTextHash();
      impact.replaceRange = impactRange;
      impact.insertText = editingObj.insertText;
      return impact;
   },
   _mergeLines: function (originalLines, replaceLines, replaceRange) {
      var stL = replaceRange.startLineNumber;
      var edL = replaceRange.endLineNumber;
      var stC = replaceRange.startColumn;
      var edC = replaceRange.endColumn;
      var offset = stL - 1;
      var n = edL - stL + 1;
      var m = replaceLines.length;
      var firstLine = originalLines[offset];
      var lastLine = originalLines[offset + n - 1];
      var firstLineKeep = firstLine.substring(0, stC - 1);
      var lastLineKeep = lastLine.substring(edC - 1);

      var min = Math.min(n, m);
      for (var i = 1; i < min - 1; i ++) {
         originalLines[offset + i] = replaceLines[i];
      }
      if (n > m) {
         originalLines.splice(offset + m - 1, n - m);
      } else {
         originalLines.splice(offset + n, 0, ...replaceLines.slice(n, m));
      }
      originalLines[offset] = firstLineKeep + replaceLines[0];
      if (m - 1 === 0) {
         originalLines[offset] = originalLines[offset] + lastLineKeep;
      } else {
         originalLines[offset + m - 1] = replaceLines[m - 1] + lastLineKeep;
      }
      var impactRange = {
         startLineNumber: stL,
         startColumn: stC,
         endLineNumber: stL + m - 1,
         endColumn: originalLines[offset + m - 1].length - lastLineKeep.length + 1
      };
      return impactRange;
   },
   _isPointRange: function (range) {
      if (!range.startLineNumber || !range.startColumn) return false;
      if (!range.endLineNumber && !range.endColumn) return true;
      return range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn;
   },
   _isSingleLineRange: function (range) {
      if (!range.startLineNumber || !range.startColumn) return false;
      if (!range.endLineNumber && !range.endColumn) return false;
      return range.startLineNumber === range.endLineNumber && range.startColumn !== range.endColumn;
   },
   _isMultiLineRange: function (range) {
      if (!range.startLineNumber || !range.startColumn) return false;
      if (!range.endLineNumber || !range.endColumn) return false;
      return range.startLineNumber !== range.endLineNumber;
   }
};

if (require.main === module) {
   // test
   var x = new EdienilnoTextModel(`function a() {
   console.log(Math.round(
      Math.random() *
      100
   ));
}`);
   x._mergeLines(x.text, x.splitTextIntoLines(`2`), {
      startLineNumber: 2,
      startColumn: 16,
      endLineNumber: 5,
      endColumn: 5
   });
   console.log(x.text);
   
   x = new EdienilnoTextModel(`function a() {
   console.log(1);
}`);
   x._mergeLines(x.text, x.splitTextIntoLines(`2`), {
      startLineNumber: 2,
      startColumn: 16,
      endLineNumber: 2,
      endColumn: 17
   });
   console.log(x.text);
   
   x = new EdienilnoTextModel(`function a() {
   console.log(1);
}`);
   x._mergeLines(x.text, x.splitTextIntoLines(`Math.round(
      4.3
   )`), {
      startLineNumber: 2,
      startColumn: 16,
      endLineNumber: 2,
      endColumn: 17
   });
   console.log(x.text);
   
   
   x = new EdienilnoTextModel(`function a() {
   console.log(Math.round(
      Math.random() *
      100
   ));
}`);
   x._mergeLines(x.text, x.splitTextIntoLines(`Math.round(
      4.3
   )`), {
      startLineNumber: 2,
      startColumn: 16,
      endLineNumber: 5,
      endColumn: 5
   });
   console.log(x.text);
   
   x = new EdienilnoTextModel(`function a() {
   console.log(1);
}`);
   x._mergeLines(x.text, x.splitTextIntoLines(`2`), {
      startLineNumber: 2,
      startColumn: 17,
      endLineNumber: 2,
      endColumn: 17
   });
   console.log(x.text);
}
