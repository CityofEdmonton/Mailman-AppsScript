(function () {

var defs = {}; // id -> {dependencies, definition, instance (possibly undefined)}

// Used when there is no 'main' module.
// The name is probably (hopefully) unique so minification removes for releases.
var register_3795 = function (id) {
  var module = dem(id);
  var fragments = id.split('.');
  var target = Function('return this;')();
  for (var i = 0; i < fragments.length - 1; ++i) {
    if (target[fragments[i]] === undefined)
      target[fragments[i]] = {};
    target = target[fragments[i]];
  }
  target[fragments[fragments.length - 1]] = module;
};

var instantiate = function (id) {
  var actual = defs[id];
  var dependencies = actual.deps;
  var definition = actual.defn;
  var len = dependencies.length;
  var instances = new Array(len);
  for (var i = 0; i < len; ++i)
    instances[i] = dem(dependencies[i]);
  var defResult = definition.apply(null, instances);
  if (defResult === undefined)
     throw 'module [' + id + '] returned undefined';
  actual.instance = defResult;
};

var def = function (id, dependencies, definition) {
  if (typeof id !== 'string')
    throw 'module id must be a string';
  else if (dependencies === undefined)
    throw 'no dependencies for ' + id;
  else if (definition === undefined)
    throw 'no definition function for ' + id;
  defs[id] = {
    deps: dependencies,
    defn: definition,
    instance: undefined
  };
};

var dem = function (id) {
  var actual = defs[id];
  if (actual === undefined)
    throw 'module [' + id + '] was undefined';
  else if (actual.instance === undefined)
    instantiate(id);
  return actual.instance;
};

var req = function (ids, callback) {
  var len = ids.length;
  var instances = new Array(len);
  for (var i = 0; i < len; ++i)
    instances[i] = dem(ids[i]);
  callback.apply(null, instances);
};

var ephox = {};

ephox.bolt = {
  module: {
    api: {
      define: def,
      require: req,
      demand: dem
    }
  }
};

var define = def;
var require = req;
var demand = dem;
// this helps with minification when using a lot of global references
var defineGlobal = function (id, ref) {
  define(id, [], function () { return ref; });
};
/*jsc
["tinymce.plugins.window.Plugin","tinymce.core.PluginManager","tinymce.plugins.window.api.Commands","tinymce.plugins.window.ui.Buttons","global!tinymce.util.Tools.resolve","tinymce.plugins.window.ui.Window","global!window","tinymce.core.Env","tinymce.core.util.Tools","tinymce.plugins.window.api.Settings"]
jsc*/
defineGlobal("global!tinymce.util.Tools.resolve", tinymce.util.Tools.resolve);
/**
 * ResolveGlobal.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.core.PluginManager',
  [
    'global!tinymce.util.Tools.resolve'
  ],
  function (resolve) {
    return resolve('tinymce.PluginManager');
  }
);

defineGlobal("global!window", window);
/**
 * ResolveGlobal.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.core.Env',
  [
    'global!tinymce.util.Tools.resolve'
  ],
  function (resolve) {
    return resolve('tinymce.Env');
  }
);

/**
 * ResolveGlobal.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.core.util.Tools',
  [
    'global!tinymce.util.Tools.resolve'
  ],
  function (resolve) {
    return resolve('tinymce.util.Tools');
  }
);

/**
 * Settings.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.window.api.Settings',
  [
  ],
  function () {
    var getWindowDialogWidth = function (editor) {
      return parseInt(editor.getParam('plugin_window_width', '820'), 10);
    };

    var getWindowDialogHeight = function (editor) {
      return parseInt(editor.getParam('plugin_window_height', '600'), 10);
    };

    var getWindowUrl = function (editor) {
      return editor.getParam('plugin_window_url', 'https://gdev.edmonton.ca/mailman/tinymce/popup.html');
    };

    var getWindowStyle = function (editor) {
      return "toolbar=no," +
        "location=no," +
        "directories=no," +
        "status=no," +
        "menubar=no," +
        "scrollbars=yes," +
        "resizable=yes," +
        "width=" + getWindowDialogWidth(editor) +
        ",height=" + getWindowDialogHeight(editor);
    };

    // var getContentStyle = function (editor) {
    //   return editor.getParam('content_style', '');
    // };

    return {
      getWindowDialogWidth: getWindowDialogWidth,
      getWindowDialogHeight: getWindowDialogHeight,
      getWindowUrl: getWindowUrl,
      getWindowStyle: getWindowStyle
    };
  }
);
/**
 * Dialog.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.window.ui.Window',
  [
    'global!window',
    'tinymce.core.Env',
    'tinymce.core.util.Tools',
    'tinymce.plugins.window.api.Settings'
  ],
  function (window, Env, Tools, Settings) {
    var open = function (editor) {
      var windowStyle = Settings.getWindowStyle(editor);

      var popup = window.open(Settings.getWindowUrl(editor), "Editor", windowStyle);

      // auto-close popup window when parent closes
      window.onunload = function () {
        if (popup && !popup.closed) {
          popup.close();
        }
      };

      window.addEventListener("message", function (e) {
        if (e.origin !== "https://gdev.edmonton.ca") {
          return;
        }
        var eventSource = e.source;
        if (e.data.message === "Loaded") {
          eventSource.postMessage({ message: "Content", content: editor.getContent() }, "https://gdev.edmonton.ca");
        } else if (e.data.message === "UpdateContent") {
          editor.setContent(e.data.content);
        } else if (e.data.message === "PreviewRequest") {
          // a little bit of cross-concerns here but I'm not sure how else to do it
          var previewState = e.data.state;
          // I don't understand why, but sometimes multiple messages occur with the promise in the previewStae
          // this prevents errors from that promise...
          if (previewState.content && typeof previewState.content.then === "function") {
            return;
          }
          editor.fire('Previewing', { state: previewState });
          var updatedContent = previewState.content;
          if (updatedContent && typeof (updatedContent.then) === 'function') {
            updatedContent.then(function (previewText) {
              previewState.content = previewText;
              eventSource.postMessage({ message: "PreviewResponse", state: previewState }, "https://gdev.edmonton.ca");
            }, function (previewError) {
              eventSource.postMessage({ message: "PreviewResponse", error: previewError }, "https://gdev.edmonton.ca");
            });
          } else {
            eventSource.postMessage({ message: "PreviewResponse", state: previewState }, "https://gdev.edmonton.ca");
          }
        } else if (e.data.message === "SuggestionsRequest") {
          var suggestionsState = e.data.state;
          editor.fire('getSuggestions', { state: suggestionsState });
          var updatedSuggestions = suggestionsState.suggestions;
          if (updatedSuggestions && typeof (updatedSuggestions.then) === 'function') {
            updatedSuggestions.then(function (updateSuggestionsContent) {
              suggestionsState.suggestions = updateSuggestionsContent;
              eventSource.postMessage({ message: "SuggestionsResponse", state: suggestionsState }, "https://gdev.edmonton.ca");
            }, function (suggestionsError) {
              eventSource.postMessage({ message: "SuggestionsResponse", error: suggestionsError }, "https://gdev.edmonton.ca");
            });
          } else {
            eventSource.postMessage({ message: "SuggestionsResponse", state: suggestionsState }, "https://gdev.edmonton.ca");
          }
        }
      }, false);
    };

    return {
      open: open
    };
  }
);
/**
 * Commands.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.window.api.Commands',
  [
    'tinymce.plugins.window.ui.Window'
  ],
  function (Window) {
    var register = function (editor) {
      editor.addCommand('mceWindow', function () {
        Window.open(editor);
      });
    };

    return {
      register: register
    };
  }
);
/**
 * Buttons.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.window.ui.Buttons',
  [
  ],
  function () {
    var register = function (editor) {
      editor.addButton('window', {
        title: 'Window',
        cmd: 'mceWindow',
        image: 'https://gdev.edmonton.ca/mailman/tinymce/icons/window.png'
      });

      editor.addMenuItem('window', {
        text: 'Window',
        cmd: 'mceWindow',
        context: 'view'
      });
    };

    return {
      register: register
    };
  }
);
/**
 * Plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.window.Plugin',
  [
    'tinymce.core.PluginManager',
    'tinymce.plugins.window.api.Commands',
    'tinymce.plugins.window.ui.Buttons'
  ],
  function (PluginManager, Commands, Buttons) {
    PluginManager.add('window', function (editor) {
      Commands.register(editor);
      Buttons.register(editor);
    });

    return function () { };
  }
);
dem('tinymce.plugins.window.Plugin')();
})();
