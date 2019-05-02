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
["tinymce.plugins.suggestions.Plugin","ephox.katamari.api.Cell","tinymce.core.PluginManager","tinymce.plugins.suggestions.api.Api","tinymce.plugins.suggestions.core.Bind","global!tinymce.util.Tools.resolve","tinymce.core.util.Tools","tinymce.plugins.suggestions.api.Settings","tinymce.plugins.suggestions.core.DelimiterListener","tinymce.plugins.suggestions.api.Events","tinymce.plugins.suggestions.core.Coords","tinymce.plugins.suggestions.ui.ContextMenu","tinymce.core.Env","tinymce.core.dom.DOMUtils","tinymce.core.ui.Factory"]
jsc*/
define(
  'ephox.katamari.api.Cell',

  [
  ],

  function () {
    var Cell = function (initial) {
      var value = initial;

      var get = function () {
        return value;
      };

      var set = function (v) {
        value = v;
      };

      var clone = function () {
        return Cell(get());
      };

      return {
        get: get,
        set: set,
        clone: clone
      };
    };

    return Cell;
  }
);

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

/**
 * Api.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.suggestions.api.Api',
  [
  ],
  function () {
    var get = function (visibleState) {
      var isContextMenuVisible = function () {
        return visibleState.get();
      };

      return {
        isContextMenuVisible: isContextMenuVisible
      };
    };

    return {
      get: get
    };
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
  'tinymce.plugins.suggestions.api.Settings',
  [
  ],
  function () {

    var getDelimiters = function (editor) {
      return editor.getParam('suggestions_open_delimiters', '<<');
    };

    return {
      getDelimiters: getDelimiters
    };
  }
);
/**
 * DelimiterListener.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.suggestions.core.DelimiterListener',
  [
    'tinymce.core.util.Tools'
  ],
  function (Tools) {


    var setup = function (editor, delimiters, callback) {
      // use default value if one isn't provided
      var delim = delimiters || ['<<'], i = 0;

      // set to array if not alreay
      if (!Tools.isArray(delim)) {
        delim = [delim];
      }

      // convert delimeters to array keycodes, e.g. ['<<','@'] becomes [ [32,32],[] ]
      var keyCodes = delim.map(function (x) {
        return x.split('').map(function (y) {
          return y.charCodeAt(0);
        });
      });

      // Get maximum length of characters we need to look at
      var charLength = 0, charIndex = 0;
      for (i = 0; i < keyCodes.length; i++) {
        if (keyCodes[i].length > charLength) {
          charLength = keyCodes[i].length;
        }
      }

      // last characters pressed array, we'll keep going around in a "static" array of length charLength
      var charsPressed = [];
      for (i = 0; i < charLength; i++) {
        charsPressed[i] = 0;
      }

      function emptyKeyList() {
        for (i = 0; i < charLength; i++) {
          charsPressed[i] = 0;
        }
        charIndex = 0;
      }

      function enqueueKeyCode(keyCode) {
        charsPressed[charIndex] = keyCode;
        charIndex++;
        if (charIndex >= charLength) {
          charIndex = 0;
        }
      }
      function popLastKeyCode() {
        charsPressed[charIndex] = 0;
        charIndex--;
        if (charIndex < 0) {
          charIndex = charsPressed.length - 1;
        }
      }
      // retrieves the previous n keys pressed
      function getPreviousKeys(n) {
        var ret = [], i = charIndex - 1, j = 0;
        if (i == -1) {
          i = charLength - 1;
        }
        while (j++ < n) {
          if (i == charLength) {
            i = 0;
          }
          ret.unshift(charsPressed[i++]);
        }
        return ret;
      }

      // special case for backspace
      editor.on('keydown', function (e) {
        switch (e.which || e.keyCode) {
          case 8: popLastKeyCode(); break; // backspace
          case 46: emptyKeyList(); break;  // delete
        }
      });

      editor.on('keypress', function (e) {
        enqueueKeyCode(e.which || e.keyCode);
        var delimiterPressed = null; // will be filled in if we find one
        for (i = 0; i < delim.length; i++) {
          var x = keyCodes[i];
          var previousKeys = (x.length == 1 ? [e.which || e.keyCode] : getPreviousKeys(x.length));
          if (x.length == previousKeys.length) {
            var flag = true; // true until proven false
            for (var k = 0; k < x.length; k++) {
              if (x[k] !== previousKeys[k]) {
                flag = false;
                break;
              }
            }
            if (flag) {
              delimiterPressed = x;
            }
          }
        }

        if (delimiterPressed) {
          callback({ editor: editor, delimiter: delimiterPressed, event: e });
        }
      });

    };

    return {
      setup: setup
    };
  }
);
/**
 * Events.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.suggestions.api.Events',
  [
  ],
  function () {
    var fireGetSuggestions = function (editor, state) {
      editor.fire('getSuggestions', { state: state });
    };

    var fireSuggestionSelected = function (editor, suggestion) {
      var state = { suggestion: suggestion };
      editor.fire('suggestionSelected', state);
      return state.suggestion;
    };

    return {
      fireGetSuggestions: fireGetSuggestions,
      fireSuggestionSelected: fireSuggestionSelected
    };
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
  'tinymce.core.dom.DOMUtils',
  [
    'global!tinymce.util.Tools.resolve'
  ],
  function (resolve) {
    return resolve('tinymce.dom.DOMUtils');
  }
);

/**
 * Coords.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.suggestions.core.Coords',
  [
    'tinymce.core.Env',
    'tinymce.core.dom.DOMUtils'
  ],
  function (Env, DOMUtils) {
    var nu = function (x, y) {
      return { x: x, y: y };
    };

    var transpose = function (pos, dx, dy) {
      return nu(pos.x + dx, pos.y + dy);
    };

    var fromPageXY = function (e) {
      return nu(e.pageX, e.pageY);
    };

    var fromClientXY = function (e) {
      return nu(e.clientX, e.clientY);
    };

    var transposeUiContainer = function (element, pos) {
      if (element && DOMUtils.DOM.getStyle(element, 'position', true) !== 'static') {
        var containerPos = DOMUtils.DOM.getPos(element);
        var dx = containerPos.x - element.scrollLeft;
        var dy = containerPos.y - element.scrollTop;
        return transpose(pos, -dx, -dy);
      } else {
        return transpose(pos, 0, 0);
      }
    };

    var transposeContentAreaContainer = function (element, pos) {
      var containerPos = DOMUtils.DOM.getPos(element);
      return transpose(pos, containerPos.x, containerPos.y);
    };

    var getUiContainer = function (editor) {
      return Env.container;
    };

    var getPos = function (editor, e) {
      if (editor.inline) {
        return transposeUiContainer(getUiContainer(editor), fromPageXY(e));
      } else {
        var iframePos = transposeContentAreaContainer(editor.getContentAreaContainer(), fromClientXY(e));
        return transposeUiContainer(getUiContainer(editor), iframePos);
      }
    };

    return {
      getPos: getPos
    };
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
  'tinymce.core.ui.Factory',
  [
    'global!tinymce.util.Tools.resolve'
  ],
  function (resolve) {
    return resolve('tinymce.ui.Factory');
  }
);

/**
 * ContextMenu.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.suggestions.ui.ContextMenu',
  [
    'tinymce.core.ui.Factory',
    'tinymce.core.util.Tools',
    'tinymce.plugins.suggestions.api.Settings',
    'tinymce.plugins.suggestions.api.Events'
  ],
  function (Factory, Tools, Settings, Events) {
    var renderMenu = function (editor, visibleState, suggestions) {
      var menu; //, contextmenu, items = [];

      menu = Factory.create('menu', {
        items: suggestions, //items,
        context: 'contextmenu',
        classes: 'contextmenu'
      }).renderTo();

      menu.on('hide', function (e) {
        if (e.control === this) {
          visibleState.set(false);
        }
      });

      menu.on('select', function (e) {
        // TODO: do something with the selected menu item
        var text = (e.target || { }).text;
        if (typeof text === "function") {
          text = text.apply(e.target);
        }
        var updatedSuggestion = Events.fireSuggestionSelected(editor, text);

        // stuff the updatedSuggestion into the editor at the current location
        if (typeof updatedSuggestion.then === "function") {
          // it's a promise
          updatedSuggestion.then(function (resolvedText) {
            editor.execCommand('mceInsertContent', false, resolvedText);
          }, function (suggestionError) {
            throw suggestionError;
          });
        } else {
          editor.execCommand('mceInsertContent', false, updatedSuggestion);
        }
      });

      editor.on('remove', function () {
        menu.remove();
        menu = null;
      });

      menu.setSuggestions = function (newSuggestions) {
        //TODO: update menu items with newSuggestions
      };

      return menu;
    };

    var getFormattedSuggestions = function (suggestions) {
      var ss = suggestions;
      if (!Tools.isArray(ss)) {
        ss = [ss];
      }

      var returnValue = [];
      Tools.each(ss, function (s) {
        returnValue.push({
          type: 'menuitem',
          text: s
        });
      });

      return returnValue;
    };

    var show = function (editor, pos, visibleState, menu, suggestions) {
      var formattedSuggestions = getFormattedSuggestions(suggestions);

      if (menu.get() === null) {
        menu.set(renderMenu(editor, visibleState, formattedSuggestions));
      } else {
        menu.get().setSuggestions(formattedSuggestions);
        menu.get().show();
      }

      menu.get().moveTo(pos.x, pos.y);
      visibleState.set(true);
    };

    return {
      show: show
    };
  }
);
/**
 * Bind.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define(
  'tinymce.plugins.suggestions.core.Bind',
  [
    'tinymce.core.util.Tools',
    'tinymce.plugins.suggestions.api.Settings',
    'tinymce.plugins.suggestions.core.DelimiterListener',
    'tinymce.plugins.suggestions.api.Events',
    'tinymce.plugins.suggestions.core.Coords',
    'tinymce.plugins.suggestions.ui.ContextMenu'
  ],
  function (Tools, Settings, DelimiterListener, Events, Coords, ContextMenu) {


    var setup = function (editor, visibleState, menu) {
      DelimiterListener.setup(editor, Settings.getDelimiters(editor), function (state) {
        var suggestionsState = { suggestions: [] };
        Events.fireGetSuggestions(editor, suggestionsState);

        var updatedSuggestions = suggestionsState.suggestions;
        // Best guess at where the event came from - hard to tell because it comes from keypresses
        var eventPos = editor.selection.getNode().getBoundingClientRect();

        var newEvent = Tools.extend(state.event, { clientX: eventPos.left, clientY: eventPos.top + eventPos.height });
        var pos = Coords.getPos(state.editor, newEvent);
        if (typeof updatedSuggestions.then === "function") {
          updatedSuggestions.then(function (updatedSuggestions2) {
            ContextMenu.show(editor, pos, visibleState, menu, updatedSuggestions2);
          }, function (updatedSuggestionsError) {
            throw updatedSuggestionsError;
          });
        } else {
          ContextMenu.show(editor, pos, visibleState, menu, suggestionsState.suggestions);
        }

      });
    };

    return {
      setup: setup
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
  'tinymce.plugins.suggestions.Plugin',
  [
    'ephox.katamari.api.Cell',
    'tinymce.core.PluginManager',
    'tinymce.plugins.suggestions.api.Api',
    'tinymce.plugins.suggestions.core.Bind'
  ],
  function (Cell, PluginManager, Api, Bind) {
    PluginManager.add('suggestions', function (editor) {
      var menu = Cell(null), visibleState = Cell(false);
      Bind.setup(editor, visibleState, menu);
      return Api.get(visibleState);
    });

    return function () { };
  }
);
dem('tinymce.plugins.suggestions.Plugin')();
})();
