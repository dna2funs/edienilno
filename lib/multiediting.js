'use strict';

(function () {

function _rangePointGt(L1, C1, L2, C2) {
   if (L1 > L2) return true;
   if (L1 < L2) return false;
   if (C1 > C2) return true;
   return false;
}

function _rangePointEq(L1, C1, L2, C2) {
   return L1 === L2 && C1 === C2;
}

function _rangePointGte(L1, C1, L2, C2) {
   return _rangePointGt(L1, C1, L2, C2) || _rangePointEq(L1, C1, L2, C2);
}

function _isRangeCrossing(range1, range2) {
   if (_isPointRange(range1)) {
      if (_isPointRange(range2)) return false; // never treat 2 point range crossing
   }
   var r1 = _rangePointGt(range1.endLineNumber, range1.endColumn, range2.startLineNumber, range2.startColumn);
   var r2 = _rangePointGt(range2.endLineNumber, range2.endColumn, range1.startLineNumber, range1.startColumn);
   return r1 && r2;
}

function _isPointRange(range) {
   if (!range.startLineNumber || !range.startColumn) return false;
   if (!range.endLineNumber && !range.endColumn) return true;
   return range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn;
}

function _isSingleLineRange(range) {
   if (!range.startLineNumber || !range.startColumn) return false;
   if (!range.endLineNumber && !range.endColumn) return false;
   return range.startLineNumber === range.endLineNumber && range.startColumn !== range.endColumn;
}

function _isMultiLineRange (range) {
   if (!range.startLineNumber || !range.startColumn) return false;
   if (!range.endLineNumber || !range.endColumn) return false;
   return range.startLineNumber !== range.endLineNumber;
}


function EdienilnoAuthor(id) {
   this.id = id;
   this.selectDirection = 1; // 1 ->, -1 <-
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
      // TODO: select(...) to update selectDirection
   },
   select: function (stL, stC, edL, edC) {
      if (edL) {
         if (!edC) edC = 1;
      } else {
         edL = stL;
         if (!edC) edC = stC;
      }
      this.selectDirection = 1;
      if (_rangePointGt(stL, stC, edL, edC)) {
         var tL, tC;
         tL = stL; stL = edL; edL = tL;
         tC = stC; stC = edC; edC = tC;
         this.selectDirection = -1;
      }
      this.range.startLineNumber = stL;
      this.range.startColumn = stC;
      this.range.endLineNumber = edL;
      this.range.endColumn = edC;
   },
   getSelectedText: function (lines) {
      var text = [];
      var firstLine = lines[this.range.startLineNumber - 1];
      var firstLineKeep = firstLine.substring(this.range.startColumn - 1);
      text.push(firstLineKeep);
      for (var i = this.range.startLineNumber + 1; i <= this.range.endLineNumber - 1; i++) {
         text.push(lines[i - 1]);
      }
      if (this.range.startLineNumber === this.range.endLineNumber) {
         text[0] = firstLineKeep.substring(0, this.range.endColumn - this.range.startColumn);
         if (!text[0]) text.pop();
      } else {
         var lastLine = lines[this.range.endLineNumber - 1];
         var lastLineKeep = lastLine.substring(0, this.range.endColumn - 1);
         text.push(lastLineKeep);
      }
      return text.join('\n');
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
      this._notifyAuthors(authorId, oldRange, impactRange);
      return impact;
   },
   _notifyAuthors: function (authorId, oldRange, replaceRange) {
      for (var i = 0, n = this.authors.length; i < n; i ++) {
         var author = this.authors[i];
         if (author.id === authorId) continue;
         var authorRange = author.getRange();
         var offsetL, offsetC;
         // before impact range
         if (_rangePointGte(
            oldRange.startLineNumber, oldRange.startColumn,
            authorRange.endLineNumber, authorRange.endColumn
         )) continue;
         // after impact range
         if (_rangePointGte(
            authorRange.startLineNumber, authorRange.startColumn,
            oldRange.endLineNumber, oldRange.endColumn
         )) {
            offsetL = authorRange.startLineNumber - oldRange.endLineNumber;
            offsetC = authorRange.startColumn - oldRange.endColumn;
            if (offsetL === 0) {
               authorRange.startLineNumber = replaceRange.endLineNumber;
               authorRange.startColumn = replaceRange.endColumn + offsetC;
            } else {
               authorRange.startLineNumber = replaceRange.startLineNumber + offsetL;
            }
            offsetL = authorRange.endLineNumber - oldRange.endLineNumber;
            offsetC = authorRange.endColumn - oldRange.endColumn;
            if (offsetL === 0) {
               authorRange.endLineNumber = replaceRange.endLineNumber;
               authorRange.endColumn = replaceRange.endColumn + offsetC;
            } else {
               authorRange.endLineNumber = replaceRange.endLineNumber + offsetL;
            }
            author.setRange(authorRange);
            continue;
         }
         // crossing
         if (_rangePointGte(
            authorRange.startLineNumber, authorRange.startColumn,
            oldRange.startLineNumber, oldRange.startColumn
         )) {
            //    | .............      oldRange
            // 1)   <- | ___           authorRange
            // 2)      | ____________ ->
            if (_rangePointGte(
               authorRange.endLineNumber, authorRange.endColumn,
               oldRange.endLineNumber, oldRange.endColumn
            )) {
               // 2)
               authorRange.startLineNumber = replaceRange.endLineNumber;
               authorRange.startColumn = replaceRange.endColumn;
               offsetL = authorRange.endLineNumber - oldRange.endLineNumber;
               offsetC = authorRange.endColumn - oldRange.endColumn;
               if (offsetL === 0) {
                  authorRange.endLineNumber = replaceRange.endLineNumber;
                  authorRange.endColumn = replaceRange.endColumn + offsetC;
               } else {
                  authorRange.endLineNumber = replaceRange.endLineNumber + offsetL;
               }
            } else {
               // 1)
               authorRange.startLineNumber = replaceRange.startLineNumber;
               authorRange.startColumn = replaceRange.startColumn;
               authorRange.endLineNumber = authorRange.startLineNumber;
               authorRange.endColumn = authorRange.startColumn;
            }
         } else {
            //        | .............      oldRange
            // 1) | ____________ <-        authorRange
            // 2) | _______________________
            if (_rangePointGte(
               authorRange.endLineNumber, authorRange.endColumn,
               oldRange.endLineNumber, oldRange.endColumn
            )) {
               // 2)
               offsetL = authorRange.endLineNumber - oldRange.endLineNumber;
               offsetC = authorRange.endColumn - oldRange.endColumn;
               if (offsetL === 0) {
                  authorRange.endLineNumber = replaceRange.endLineNumber;
                  authorRange.endColumn = replaceRange.endColumn + offsetC;
               } else {
                  authorRange.endLineNumber = replaceRange.endLineNumber + offsetL;
               }
            } else {
               // 1)
               authorRange.endLineNumber = replaceRange.startLineNumber;
               authorRange.endColumn = replaceRange.startColumn;
            }
         }
         author.setRange(authorRange);
      }
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
   }
};

function _smokeTest4MergeLines() {
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

function _smokeTest4NotifyAhuthors() {
   var model = new EdienilnoTextModel('');
   var a1 = new EdienilnoAuthor('a1'), a2 = new EdienilnoAuthor('a2');
   model.authors.push(a1);
   model.authors.push(a2);
   // a1 insert "1", "2", "3": "123"
   model.applyEditing('a1', { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 2 }, { insertText: '1' });
   model.applyEditing('a1', { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 3 }, { insertText: '2' });
   model.applyEditing('a1', { startLineNumber: 1, startColumn: 4, endLineNumber: 1, endColumn: 4 }, { insertText: '3' });
   // a2 select "2" in "123"
   a2.select(1, 2, 1, 3);
   console.log(a2.getSelectedText(model.text));
   // a1 select "123"
   a1.select(1, 1, 1, 4);
   // a2 replace "2" with "4": "123" -> "143"
   model.applyEditing('a2', { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 3 }, { insertText: '4' });
   console.log(model.text, a1.range, a2.range);
   // a1 select "3" in "143"
   a1.select(1, 3, 1, 4);
   // a1 replace "3" with "987": "143" -> "14987"
   model.applyEditing('a1', { startLineNumber: 1, startColumn: 6, endLineNumber: 1, endColumn: 6 }, { insertText: '987' });
   console.log(model.text, a1.range, a2.range);
   // a1 select "4987" in "14987"
   a1.select(1, 2, 1, 6);
   // a1 replace "4987" with "23": "14987" -> "123"
   model.applyEditing('a1', { startLineNumber: 1, startColumn: 6, endLineNumber: 1, endColumn: 6 }, { insertText: '23' });
   console.log(model.text, a1.range, a2.range);
   // a1 move to the head: |123
   a1.select(1, 1, 1, 1);
   // a1 insert "0": "0123"
   model.applyEditing('a1', { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 2 }, { insertText: '0' });
   console.log(model.text, a1.range, a2.range);
}

if (typeof(window) === 'undefined') {
   module.exports = {
      EdienilnoAuthor: EdienilnoAuthor,
      EdienilnoTextModel: EdienilnoTextModel
   };
   if (require.main === module) {
      _smokeTest4MergeLines();
      _smokeTest4NotifyAhuthors();
   }
} else {
   window.EdienilnoAuthor = EdienilnoAuthor;
   window.EdienilnoTextModel = EdienilnoTextModel;
}

})();