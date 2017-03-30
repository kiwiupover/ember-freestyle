/* globals require, module */
'use strict';
var MergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
var path = require('path');
var fs   = require('fs');
var flatiron = require('broccoli-flatiron');
var freestyleUsageSnippetFinder = require('./freestyle-usage-snippet-finder');

var Funnel = require('broccoli-funnel');
var unwatchedTree  = require('broccoli-unwatched-tree');

module.exports = {
  name: 'ember-freestyle',

  treeForApp: function(tree) {
    var treesToMerge = [tree];
    var self = this;

    var snippets = MergeTrees(this.snippetPaths().filter(function(path) {
      return fs.existsSync(path);
    }));

    snippets = MergeTrees(this.snippetSearchPaths().map(function(path) {
      return freestyleUsageSnippetFinder(path, self.ui);
    }).concat(snippets));

    snippets = flatiron(snippets, {
      outputFile: 'snippets.js'
    });
    treesToMerge.push(snippets);

    return MergeTrees(treesToMerge);
  },

  snippetPaths: function() {
    if (this.app) {
      var freestyleOptions = this.app.options.freestyle || {};
      return freestyleOptions.snippetPaths || ['snippets'];
    }
    return ['snippets'];
  },

  snippetSearchPaths: function() {
    if (this.app) {
      var freestyleOptions = this.app.options.freestyle || {};
      return freestyleOptions.snippetSearchPaths || ['app'];
    }
    return ['app'];
  },

  treeForStyles: function(tree) {
    tree = this._super.treeForStyles.apply(this, [tree]);

    var highlightJsTree = new Funnel(unwatchedTree(path.dirname(require.resolve('highlightjs/package.json'))), {
      srcDir: '/styles',
      destDir: '/app/styles/ember-freestyle/highlight.js'
    });
    highlightJsTree = stew.rename(highlightJsTree, '.css', '.scss');

    return MergeTrees([highlightJsTree, tree], {
      overwrite: true
    });
  },

  treeForVendor(vendorTree) {
    var highlightTree = new Funnel(path.join(this.project.root, 'node_modules', 'highlightjs'), {
      files: ['highlight.pack.js'],
    });

    return new MergeTrees([vendorTree, highlightTree]);
  },

  included: function(app, parentAddon) {
    this._super.included(app);

    var target = app || parentAddon;
    if (target.import) {

      target.import('vendor/highlight.pack.js', {
        exports: {
          'highlight.js': [
            'default',
            'highlight',
            'highlightAuto',
            'highlightBlock'
          ]
        }
      });

      target.import('vendor/shims/highlight.js');
      target.import('vendor/shims/markdown-it.js');
    }

  },

  isDevelopingAddon: function() {
    return false;
  }
};
