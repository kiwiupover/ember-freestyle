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

const debug = require('broccoli-stew').debug;

module.exports = {
  name: 'ember-freestyle',

  treeForApp: function(tree) {
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

    return new MergeTrees([tree, snippets]);
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

  treeForVendor(tree) {
    var highlightTree = new Funnel(path.join(this.project.root, 'node_modules', 'highlightjs'), {
      files: ['highlight.pack.js'],
    });

    return new MergeTrees([tree, highlightTree], {
      overwrite: true
    });
  },

  included: function(app) {
    this._super.included(app);

    this.import('vendor/highlight.pack.js', {
      exports: {
        'highlight.js': [
          'default',
          'highlight',
          'highlightAuto',
          'highlightBlock'
        ]
      }
    });
    this.import('vendor/markdown-it.min.js');

    this.import('vendor/shims/highlight.js');
    this.import('vendor/shims/markdown-it.js');
  },

  isDevelopingAddon: function() {
    return false;
  }
};
