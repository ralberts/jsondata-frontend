/**
 */
(function() {
  'use strict';

  angular.module('frontend.core.directives')
    .directive('contentDiff', ['$compile', function directive($compile) {
      return {
        restrict: 'E',
        scope: {
          basetext: '=',
          newtext: '=',
          options: '='
        },
        replace: false,
        template: '<div id="contentDiff"></div>',
        link: function(scope, element) {

          // Based on https://github.com/red-gate/jsdifflib
          function diffUsingJS() {
            // get the baseText and newText values from the two textboxes, and split them into lines
            var base = difflib.stringAsLines(scope.basetext);
            var newtxt = difflib.stringAsLines(scope.newtext);

            // create a SequenceMatcher instance that diffs the two sets of lines
            var sm = new difflib.SequenceMatcher(base, newtxt);

            // get the opcodes from the SequenceMatcher instance
            // opcodes is a list of 3-tuples describing what changes should be made to the base text
            // in order to yield the new text
            var opcodes = sm.get_opcodes();
            var diffoutputdiv = angular.element('<div/>');
            while (diffoutputdiv.firstChild) diffoutputdiv.removeChild(diffoutputdiv.firstChild);
            //var contextSize = $("contextSize").value;
            var contextSize = 100; //contextSize ? contextSize : null;

            // build the diff view and add it to the current DOM
            //diffoutputdiv.appendChild(diffview.buildView({
            var el = diffview.buildView({
              baseTextLines: base,
              newTextLines: newtxt,
              opcodes: opcodes,
              // set the display titles for each resource
              baseTextName: scope.options.basetextName || "Base Text",
              newTextName: scope.options.newtextName || "New Text",
              contextSize: scope.options.contextSize || 100,
              viewType: scope.options.inline || 0 //$("inline").checked ? 1 : 0
            });

            $compile(el.diffOutput)(scope);
            element.html(el.diffOutput);

            // scroll down to the diff view window.
            //location = url + "#diff";
          }

          function update() {
            if(scope.basetext && scope.newtext) {
              diffUsingJS();
            } else if(scope.basetext || scope.newtext) {
              element.html('<span style="color:red">Select one more row to diff against.</span>');
            } else {
              element.html('<span style="color:red">Select two rows to diff against.</span>');
            }
          }

          scope.$watchGroup(['basetext', 'newtext', 'options'], function() {
            update();
          });
        }
      };
    }]);
}());
