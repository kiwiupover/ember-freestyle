/* globals require, module */
'use strict';
var mergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
var path = require('path');
var fs   = require('fs');
var flatiron = require('broccoli-flatiron');
var freestyleUsageSnippetFinder = require('./freestyle-usage-snippet-finder');

var Funnel = require('broccoli-funnel');
var unwatchedTree  = require('broccoli-unwatched-tree');

const EngineAddon = require('ember-engines/lib/engine-addon');

module.exports = EngineAddon.extend({
  name: 'ember-freestyle',
  lazyLoading: true,

  treeForApp: function(tree) {
    var treesToMerge = [tree];
    var self = this;

    var snippets = mergeTrees(this.snippetPaths().filter(function(path) {
      return fs.existsSync(path);
    }));

    snippets = mergeTrees(this.snippetSearchPaths().map(function(path) {
      return freestyleUsageSnippetFinder(path, self.ui);
    }).concat(snippets));

    snippets = flatiron(snippets, {
      outputFile: 'snippets.js'
    });
    treesToMerge.push(snippets);

    return mergeTrees(treesToMerge);
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

    var highlightJsTree = new Funnel(unwatchedTree(path.dirname(require.resolve('highlight.js/package.json'))), {
      srcDir: '/styles',
      destDir: '/app/styles/ember-freestyle/highlight.js'
    });
    highlightJsTree = stew.rename(highlightJsTree, '.css', '.scss');

    return mergeTrees([highlightJsTree, tree], {
      overwrite: true
    });
  },

  config: function(/*environment, appConfig*/) {
    return {
      remarkable: {
        excludeHighlightJs: false
      }
    }
  },

  included: function(app) {
    this._super.included.apply(this, arguments);

    var bowerDirectory = this.project.bowerDirectory;
    var importContext;

    if (this.import) {  // support for ember-cli >= 2.7
      importContext = this;
    } else { // addon support for ember-cli < 2.7
      importContext = this._findHostForLegacyEmberCLI();
    }

    var env = app.env;
    var config = this.project.config(env || 'development');
    var excludeHighlightJs = config.remarkable.excludeHighlightJs;

    importContext.import(bowerDirectory + '/remarkable/dist/remarkable.js');
    if (!excludeHighlightJs) {
      importContext.import(bowerDirectory + '/highlightjs/highlight.pack.js');
    }
    importContext.import('vendor/ember-remarkable/shim.js', {
      type: 'vendor',
      exports: { 'remarkable': ['default'] }
    });
  },

  // included: function(app, parentAddon) {
  //   this._super.included(app);
  //
  //   var target = app || parentAddon;
  //   if (target.import) {
  //     target.import(target.bowerDirectory + '/remarkable/dist/remarkable.js');
  //     target.import(target.bowerDirectory + '/highlightjs/highlight.pack.js');
  //     target.import('vendor/ember-remarkable/shim.js', {
  //       type: 'vendor',
  //       exports: { 'remarkable': ['default'] }
  //     });
  //     target.import('vendor/ember-remarkable/highlightjs-shim.js', {
  //       type: 'vendor',
  //       exports: { 'hljs': ['default'] }
  //     });
  //   }
  //
  // },

  isDevelopingAddon: function() {
    return false;
  }
});
