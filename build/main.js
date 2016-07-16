(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _ = require('./lodash.min').runInContext();
module.exports = require('./fp/_baseConvert')(_, _);

},{"./fp/_baseConvert":2,"./lodash.min":5}],2:[function(require,module,exports){
var mapping = require('./_mapping'),
    mutateMap = mapping.mutate,
    fallbackHolder = require('./placeholder');

/**
 * Creates a function, with an arity of `n`, that invokes `func` with the
 * arguments it receives.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} n The arity of the new function.
 * @returns {Function} Returns the new function.
 */
function baseArity(func, n) {
  return n == 2
    ? function(a, b) { return func.apply(undefined, arguments); }
    : function(a) { return func.apply(undefined, arguments); };
}

/**
 * Creates a function that invokes `func`, with up to `n` arguments, ignoring
 * any additional arguments.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @param {number} n The arity cap.
 * @returns {Function} Returns the new function.
 */
function baseAry(func, n) {
  return n == 2
    ? function(a, b) { return func(a, b); }
    : function(a) { return func(a); };
}

/**
 * Creates a clone of `array`.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the cloned array.
 */
function cloneArray(array) {
  var length = array ? array.length : 0,
      result = Array(length);

  while (length--) {
    result[length] = array[length];
  }
  return result;
}

/**
 * Creates a function that clones a given object using the assignment `func`.
 *
 * @private
 * @param {Function} func The assignment function.
 * @returns {Function} Returns the new cloner function.
 */
function createCloner(func) {
  return function(object) {
    return func({}, object);
  };
}

/**
 * Creates a function that wraps `func` and uses `cloner` to clone the first
 * argument it receives.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} cloner The function to clone arguments.
 * @returns {Function} Returns the new immutable function.
 */
function immutWrap(func, cloner) {
  return function() {
    var length = arguments.length;
    if (!length) {
      return result;
    }
    var args = Array(length);
    while (length--) {
      args[length] = arguments[length];
    }
    var result = args[0] = cloner.apply(undefined, args);
    func.apply(undefined, args);
    return result;
  };
}

/**
 * The base implementation of `convert` which accepts a `util` object of methods
 * required to perform conversions.
 *
 * @param {Object} util The util object.
 * @param {string} name The name of the function to convert.
 * @param {Function} func The function to convert.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.cap=true] Specify capping iteratee arguments.
 * @param {boolean} [options.curry=true] Specify currying.
 * @param {boolean} [options.fixed=true] Specify fixed arity.
 * @param {boolean} [options.immutable=true] Specify immutable operations.
 * @param {boolean} [options.rearg=true] Specify rearranging arguments.
 * @returns {Function|Object} Returns the converted function or object.
 */
function baseConvert(util, name, func, options) {
  var setPlaceholder,
      isLib = typeof name == 'function',
      isObj = name === Object(name);

  if (isObj) {
    options = func;
    func = name;
    name = undefined;
  }
  if (func == null) {
    throw new TypeError;
  }
  options || (options = {});

  var config = {
    'cap': 'cap' in options ? options.cap : true,
    'curry': 'curry' in options ? options.curry : true,
    'fixed': 'fixed' in options ? options.fixed : true,
    'immutable': 'immutable' in options ? options.immutable : true,
    'rearg': 'rearg' in options ? options.rearg : true
  };

  var forceCurry = ('curry' in options) && options.curry,
      forceFixed = ('fixed' in options) && options.fixed,
      forceRearg = ('rearg' in options) && options.rearg,
      placeholder = isLib ? func : fallbackHolder,
      pristine = isLib ? func.runInContext() : undefined;

  var helpers = isLib ? func : {
    'ary': util.ary,
    'assign': util.assign,
    'clone': util.clone,
    'curry': util.curry,
    'forEach': util.forEach,
    'isArray': util.isArray,
    'isFunction': util.isFunction,
    'iteratee': util.iteratee,
    'keys': util.keys,
    'rearg': util.rearg,
    'spread': util.spread,
    'toPath': util.toPath
  };

  var ary = helpers.ary,
      assign = helpers.assign,
      clone = helpers.clone,
      curry = helpers.curry,
      each = helpers.forEach,
      isArray = helpers.isArray,
      isFunction = helpers.isFunction,
      keys = helpers.keys,
      rearg = helpers.rearg,
      spread = helpers.spread,
      toPath = helpers.toPath;

  var aryMethodKeys = keys(mapping.aryMethod);

  var wrappers = {
    'castArray': function(castArray) {
      return function() {
        var value = arguments[0];
        return isArray(value)
          ? castArray(cloneArray(value))
          : castArray.apply(undefined, arguments);
      };
    },
    'iteratee': function(iteratee) {
      return function() {
        var func = arguments[0],
            arity = arguments[1],
            result = iteratee(func, arity),
            length = result.length;

        if (config.cap && typeof arity == 'number') {
          arity = arity > 2 ? (arity - 2) : 1;
          return (length && length <= arity) ? result : baseAry(result, arity);
        }
        return result;
      };
    },
    'mixin': function(mixin) {
      return function(source) {
        var func = this;
        if (!isFunction(func)) {
          return mixin(func, Object(source));
        }
        var pairs = [];
        each(keys(source), function(key) {
          if (isFunction(source[key])) {
            pairs.push([key, func.prototype[key]]);
          }
        });

        mixin(func, Object(source));

        each(pairs, function(pair) {
          var value = pair[1];
          if (isFunction(value)) {
            func.prototype[pair[0]] = value;
          } else {
            delete func.prototype[pair[0]];
          }
        });
        return func;
      };
    },
    'runInContext': function(runInContext) {
      return function(context) {
        return baseConvert(util, runInContext(context), options);
      };
    }
  };

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a clone of `object` by `path`.
   *
   * @private
   * @param {Object} object The object to clone.
   * @param {Array|string} path The path to clone by.
   * @returns {Object} Returns the cloned object.
   */
  function cloneByPath(object, path) {
    path = toPath(path);

    var index = -1,
        length = path.length,
        lastIndex = length - 1,
        result = clone(Object(object)),
        nested = result;

    while (nested != null && ++index < length) {
      var key = path[index],
          value = nested[key];

      if (value != null) {
        nested[path[index]] = clone(index == lastIndex ? value : Object(value));
      }
      nested = nested[key];
    }
    return result;
  }

  /**
   * Converts `lodash` to an immutable auto-curried iteratee-first data-last
   * version with conversion `options` applied.
   *
   * @param {Object} [options] The options object. See `baseConvert` for more details.
   * @returns {Function} Returns the converted `lodash`.
   */
  function convertLib(options) {
    return _.runInContext.convert(options)(undefined);
  }

  /**
   * Create a converter function for `func` of `name`.
   *
   * @param {string} name The name of the function to convert.
   * @param {Function} func The function to convert.
   * @returns {Function} Returns the new converter function.
   */
  function createConverter(name, func) {
    var oldOptions = options;
    return function(options) {
      var newUtil = isLib ? pristine : helpers,
          newFunc = isLib ? pristine[name] : func,
          newOptions = assign(assign({}, oldOptions), options);

      return baseConvert(newUtil, name, newFunc, newOptions);
    };
  }

  /**
   * Creates a function that wraps `func` to invoke its iteratee, with up to `n`
   * arguments, ignoring any additional arguments.
   *
   * @private
   * @param {Function} func The function to cap iteratee arguments for.
   * @param {number} n The arity cap.
   * @returns {Function} Returns the new function.
   */
  function iterateeAry(func, n) {
    return overArg(func, function(func) {
      return typeof func == 'function' ? baseAry(func, n) : func;
    });
  }

  /**
   * Creates a function that wraps `func` to invoke its iteratee with arguments
   * arranged according to the specified `indexes` where the argument value at
   * the first index is provided as the first argument, the argument value at
   * the second index is provided as the second argument, and so on.
   *
   * @private
   * @param {Function} func The function to rearrange iteratee arguments for.
   * @param {number[]} indexes The arranged argument indexes.
   * @returns {Function} Returns the new function.
   */
  function iterateeRearg(func, indexes) {
    return overArg(func, function(func) {
      var n = indexes.length;
      return baseArity(rearg(baseAry(func, n), indexes), n);
    });
  }

  /**
   * Creates a function that invokes `func` with its first argument passed
   * thru `transform`.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {...Function} transform The functions to transform the first argument.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function() {
      var length = arguments.length;
      if (!length) {
        return func();
      }
      var args = Array(length);
      while (length--) {
        args[length] = arguments[length];
      }
      var index = config.rearg ? 0 : (length - 1);
      args[index] = transform(args[index]);
      return func.apply(undefined, args);
    };
  }

  /**
   * Creates a function that wraps `func` and applys the conversions
   * rules by `name`.
   *
   * @private
   * @param {string} name The name of the function to wrap.
   * @param {Function} func The function to wrap.
   * @returns {Function} Returns the converted function.
   */
  function wrap(name, func) {
    name = mapping.aliasToReal[name] || name;

    var result,
        wrapped = func,
        wrapper = wrappers[name];

    if (wrapper) {
      wrapped = wrapper(func);
    }
    else if (config.immutable) {
      if (mutateMap.array[name]) {
        wrapped = immutWrap(func, cloneArray);
      }
      else if (mutateMap.object[name]) {
        wrapped = immutWrap(func, createCloner(func));
      }
      else if (mutateMap.set[name]) {
        wrapped = immutWrap(func, cloneByPath);
      }
    }
    each(aryMethodKeys, function(aryKey) {
      each(mapping.aryMethod[aryKey], function(otherName) {
        if (name == otherName) {
          var aryN = !isLib && mapping.iterateeAry[name],
              reargIndexes = mapping.iterateeRearg[name],
              spreadStart = mapping.methodSpread[name];

          result = wrapped;
          if (config.fixed && (forceFixed || !mapping.skipFixed[name])) {
            result = spreadStart === undefined
              ? ary(result, aryKey)
              : spread(result, spreadStart);
          }
          if (config.rearg && aryKey > 1 && (forceRearg || !mapping.skipRearg[name])) {
            result = rearg(result, mapping.methodRearg[name] || mapping.aryRearg[aryKey]);
          }
          if (config.cap) {
            if (reargIndexes) {
              result = iterateeRearg(result, reargIndexes);
            } else if (aryN) {
              result = iterateeAry(result, aryN);
            }
          }
          if (forceCurry || (config.curry && aryKey > 1)) {
            forceCurry  && console.log(forceCurry, name);
            result = curry(result, aryKey);
          }
          return false;
        }
      });
      return !result;
    });

    result || (result = wrapped);
    if (result == func) {
      result = forceCurry ? curry(result, 1) : function() {
        return func.apply(this, arguments);
      };
    }
    result.convert = createConverter(name, func);
    if (mapping.placeholder[name]) {
      setPlaceholder = true;
      result.placeholder = func.placeholder = placeholder;
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  if (!isObj) {
    return wrap(name, func);
  }
  var _ = func;

  // Convert methods by ary cap.
  var pairs = [];
  each(aryMethodKeys, function(aryKey) {
    each(mapping.aryMethod[aryKey], function(key) {
      var func = _[mapping.remap[key] || key];
      if (func) {
        pairs.push([key, wrap(key, func)]);
      }
    });
  });

  // Convert remaining methods.
  each(keys(_), function(key) {
    var func = _[key];
    if (typeof func == 'function') {
      var length = pairs.length;
      while (length--) {
        if (pairs[length][0] == key) {
          return;
        }
      }
      func.convert = createConverter(key, func);
      pairs.push([key, func]);
    }
  });

  // Assign to `_` leaving `_.prototype` unchanged to allow chaining.
  each(pairs, function(pair) {
    _[pair[0]] = pair[1];
  });

  _.convert = convertLib;
  if (setPlaceholder) {
    _.placeholder = placeholder;
  }
  // Assign aliases.
  each(keys(_), function(key) {
    each(mapping.realToAlias[key] || [], function(alias) {
      _[alias] = _[key];
    });
  });

  return _;
}

module.exports = baseConvert;

},{"./_mapping":3,"./placeholder":4}],3:[function(require,module,exports){
/** Used to map aliases to their real names. */
exports.aliasToReal = {

  // Lodash aliases.
  'each': 'forEach',
  'eachRight': 'forEachRight',
  'entries': 'toPairs',
  'entriesIn': 'toPairsIn',
  'extend': 'assignIn',
  'extendWith': 'assignInWith',
  'first': 'head',

  // Ramda aliases.
  '__': 'placeholder',
  'all': 'every',
  'allPass': 'overEvery',
  'always': 'constant',
  'any': 'some',
  'anyPass': 'overSome',
  'apply': 'spread',
  'assoc': 'set',
  'assocPath': 'set',
  'complement': 'negate',
  'compose': 'flowRight',
  'contains': 'includes',
  'dissoc': 'unset',
  'dissocPath': 'unset',
  'equals': 'isEqual',
  'identical': 'eq',
  'init': 'initial',
  'invertObj': 'invert',
  'juxt': 'over',
  'omitAll': 'omit',
  'nAry': 'ary',
  'path': 'get',
  'pathEq': 'matchesProperty',
  'pathOr': 'getOr',
  'paths': 'at',
  'pickAll': 'pick',
  'pipe': 'flow',
  'pluck': 'map',
  'prop': 'get',
  'propEq': 'matchesProperty',
  'propOr': 'getOr',
  'props': 'at',
  'unapply': 'rest',
  'unnest': 'flatten',
  'useWith': 'overArgs',
  'whereEq': 'filter',
  'zipObj': 'zipObject'
};

/** Used to map ary to method names. */
exports.aryMethod = {
  '1': [
    'attempt', 'castArray', 'ceil', 'create', 'curry', 'curryRight', 'floor',
    'flow', 'flowRight', 'fromPairs', 'invert', 'iteratee', 'memoize', 'method',
    'methodOf', 'mixin', 'over', 'overEvery', 'overSome', 'rest', 'reverse',
    'round', 'runInContext', 'spread', 'template', 'trim', 'trimEnd', 'trimStart',
    'uniqueId', 'words'
  ],
  '2': [
    'add', 'after', 'ary', 'assign', 'assignIn', 'at', 'before', 'bind', 'bindAll',
    'bindKey', 'chunk', 'cloneDeepWith', 'cloneWith', 'concat', 'countBy', 'curryN',
    'curryRightN', 'debounce', 'defaults', 'defaultsDeep', 'delay', 'difference',
    'divide', 'drop', 'dropRight', 'dropRightWhile', 'dropWhile', 'endsWith',
    'eq', 'every', 'filter', 'find', 'findIndex', 'findKey', 'findLast',
    'findLastIndex', 'findLastKey', 'flatMap', 'flatMapDeep', 'flattenDepth',
    'forEach', 'forEachRight', 'forIn', 'forInRight', 'forOwn', 'forOwnRight',
    'get', 'groupBy', 'gt', 'gte', 'has', 'hasIn', 'includes', 'indexOf',
    'intersection', 'invertBy', 'invoke', 'invokeMap', 'isEqual', 'isMatch',
    'join', 'keyBy', 'lastIndexOf', 'lt', 'lte', 'map', 'mapKeys', 'mapValues',
    'matchesProperty', 'maxBy', 'meanBy', 'merge', 'minBy', 'multiply', 'nth',
    'omit', 'omitBy', 'overArgs', 'pad', 'padEnd', 'padStart', 'parseInt',
    'partial', 'partialRight', 'partition', 'pick', 'pickBy', 'pull', 'pullAll',
    'pullAt', 'random', 'range', 'rangeRight', 'rearg', 'reject', 'remove',
    'repeat', 'restFrom', 'result', 'sampleSize', 'some', 'sortBy', 'sortedIndex',
    'sortedIndexOf', 'sortedLastIndex', 'sortedLastIndexOf', 'sortedUniqBy',
    'split', 'spreadFrom', 'startsWith', 'subtract', 'sumBy', 'take', 'takeRight',
    'takeRightWhile', 'takeWhile', 'tap', 'throttle', 'thru', 'times', 'trimChars',
    'trimCharsEnd', 'trimCharsStart', 'truncate', 'union', 'uniqBy', 'uniqWith',
    'unset', 'unzipWith', 'without', 'wrap', 'xor', 'zip', 'zipObject',
    'zipObjectDeep'
  ],
  '3': [
    'assignInWith', 'assignWith', 'clamp', 'differenceBy', 'differenceWith',
    'findFrom', 'findIndexFrom', 'findLastFrom', 'findLastIndexFrom', 'getOr',
    'includesFrom', 'indexOfFrom', 'inRange', 'intersectionBy', 'intersectionWith',
    'invokeArgs', 'invokeArgsMap', 'isEqualWith', 'isMatchWith', 'flatMapDepth',
    'lastIndexOfFrom', 'mergeWith', 'orderBy', 'padChars', 'padCharsEnd',
    'padCharsStart', 'pullAllBy', 'pullAllWith', 'reduce', 'reduceRight', 'replace',
    'set', 'slice', 'sortedIndexBy', 'sortedLastIndexBy', 'transform', 'unionBy',
    'unionWith', 'update', 'xorBy', 'xorWith', 'zipWith'
  ],
  '4': [
    'fill', 'setWith', 'updateWith'
  ]
};

/** Used to map ary to rearg configs. */
exports.aryRearg = {
  '2': [1, 0],
  '3': [2, 0, 1],
  '4': [3, 2, 0, 1]
};

/** Used to map method names to their iteratee ary. */
exports.iterateeAry = {
  'dropRightWhile': 1,
  'dropWhile': 1,
  'every': 1,
  'filter': 1,
  'find': 1,
  'findFrom': 1,
  'findIndex': 1,
  'findIndexFrom': 1,
  'findKey': 1,
  'findLast': 1,
  'findLastFrom': 1,
  'findLastIndex': 1,
  'findLastIndexFrom': 1,
  'findLastKey': 1,
  'flatMap': 1,
  'flatMapDeep': 1,
  'flatMapDepth': 1,
  'forEach': 1,
  'forEachRight': 1,
  'forIn': 1,
  'forInRight': 1,
  'forOwn': 1,
  'forOwnRight': 1,
  'map': 1,
  'mapKeys': 1,
  'mapValues': 1,
  'partition': 1,
  'reduce': 2,
  'reduceRight': 2,
  'reject': 1,
  'remove': 1,
  'some': 1,
  'takeRightWhile': 1,
  'takeWhile': 1,
  'times': 1,
  'transform': 2
};

/** Used to map method names to iteratee rearg configs. */
exports.iterateeRearg = {
  'mapKeys': [1]
};

/** Used to map method names to rearg configs. */
exports.methodRearg = {
  'assignInWith': [1, 2, 0],
  'assignWith': [1, 2, 0],
  'differenceBy': [1, 2, 0],
  'differenceWith': [1, 2, 0],
  'getOr': [2, 1, 0],
  'intersectionBy': [1, 2, 0],
  'intersectionWith': [1, 2, 0],
  'isEqualWith': [1, 2, 0],
  'isMatchWith': [2, 1, 0],
  'mergeWith': [1, 2, 0],
  'padChars': [2, 1, 0],
  'padCharsEnd': [2, 1, 0],
  'padCharsStart': [2, 1, 0],
  'pullAllBy': [2, 1, 0],
  'pullAllWith': [2, 1, 0],
  'setWith': [3, 1, 2, 0],
  'sortedIndexBy': [2, 1, 0],
  'sortedLastIndexBy': [2, 1, 0],
  'unionBy': [1, 2, 0],
  'unionWith': [1, 2, 0],
  'updateWith': [3, 1, 2, 0],
  'xorBy': [1, 2, 0],
  'xorWith': [1, 2, 0],
  'zipWith': [1, 2, 0]
};

/** Used to map method names to spread configs. */
exports.methodSpread = {
  'invokeArgs': 2,
  'invokeArgsMap': 2,
  'partial': 1,
  'partialRight': 1,
  'without': 1
};

/** Used to identify methods which mutate arrays or objects. */
exports.mutate = {
  'array': {
    'fill': true,
    'pull': true,
    'pullAll': true,
    'pullAllBy': true,
    'pullAllWith': true,
    'pullAt': true,
    'remove': true,
    'reverse': true
  },
  'object': {
    'assign': true,
    'assignIn': true,
    'assignInWith': true,
    'assignWith': true,
    'defaults': true,
    'defaultsDeep': true,
    'merge': true,
    'mergeWith': true
  },
  'set': {
    'set': true,
    'setWith': true,
    'unset': true,
    'update': true,
    'updateWith': true
  }
};

/** Used to track methods with placeholder support */
exports.placeholder = {
  'bind': true,
  'bindKey': true,
  'curry': true,
  'curryRight': true,
  'partial': true,
  'partialRight': true
};

/** Used to map real names to their aliases. */
exports.realToAlias = (function() {
  var hasOwnProperty = Object.prototype.hasOwnProperty,
      object = exports.aliasToReal,
      result = {};

  for (var key in object) {
    var value = object[key];
    if (hasOwnProperty.call(result, value)) {
      result[value].push(key);
    } else {
      result[value] = [key];
    }
  }
  return result;
}());

/** Used to map method names to other names. */
exports.remap = {
  'curryN': 'curry',
  'curryRightN': 'curryRight',
  'findFrom': 'find',
  'findIndexFrom': 'findIndex',
  'findLastFrom': 'findLast',
  'findLastIndexFrom': 'findLastIndex',
  'getOr': 'get',
  'includesFrom': 'includes',
  'indexOfFrom': 'indexOf',
  'invokeArgs': 'invoke',
  'invokeArgsMap': 'invokeMap',
  'lastIndexOfFrom': 'lastIndexOf',
  'padChars': 'pad',
  'padCharsEnd': 'padEnd',
  'padCharsStart': 'padStart',
  'restFrom': 'rest',
  'spreadFrom': 'spread',
  'trimChars': 'trim',
  'trimCharsEnd': 'trimEnd',
  'trimCharsStart': 'trimStart'
};

/** Used to track methods that skip fixing their arity. */
exports.skipFixed = {
  'castArray': true,
  'flow': true,
  'flowRight': true,
  'iteratee': true,
  'mixin': true,
  'runInContext': true
};

/** Used to track methods that skip rearranging arguments. */
exports.skipRearg = {
  'add': true,
  'assign': true,
  'assignIn': true,
  'bind': true,
  'bindKey': true,
  'concat': true,
  'difference': true,
  'divide': true,
  'eq': true,
  'gt': true,
  'gte': true,
  'isEqual': true,
  'lt': true,
  'lte': true,
  'matchesProperty': true,
  'merge': true,
  'multiply': true,
  'overArgs': true,
  'partial': true,
  'partialRight': true,
  'random': true,
  'range': true,
  'rangeRight': true,
  'subtract': true,
  'zip': true,
  'zipObject': true
};

},{}],4:[function(require,module,exports){
/**
 * The default argument placeholder value for methods.
 *
 * @type {Object}
 */
module.exports = {};

},{}],5:[function(require,module,exports){
(function (global){
/**
 * @license
 * lodash lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 */
;(function(){function t(t,n){return t.set(n[0],n[1]),t}function n(t,n){return t.add(n),t}function r(t,n,r){switch(r.length){case 0:return t.call(n);case 1:return t.call(n,r[0]);case 2:return t.call(n,r[0],r[1]);case 3:return t.call(n,r[0],r[1],r[2])}return t.apply(n,r)}function e(t,n,r,e){for(var u=-1,o=t?t.length:0;++u<o;){var i=t[u];n(e,i,r(i),t)}return e}function u(t,n){for(var r=-1,e=t?t.length:0;++r<e&&false!==n(t[r],r,t););return t}function o(t,n){for(var r=t?t.length:0;r--&&false!==n(t[r],r,t););
return t}function i(t,n){for(var r=-1,e=t?t.length:0;++r<e;)if(!n(t[r],r,t))return false;return true}function f(t,n){for(var r=-1,e=t?t.length:0,u=0,o=[];++r<e;){var i=t[r];n(i,r,t)&&(o[u++]=i)}return o}function c(t,n){return!(!t||!t.length)&&-1<d(t,n,0)}function a(t,n,r){for(var e=-1,u=t?t.length:0;++e<u;)if(r(n,t[e]))return true;return false}function l(t,n){for(var r=-1,e=t?t.length:0,u=Array(e);++r<e;)u[r]=n(t[r],r,t);return u}function s(t,n){for(var r=-1,e=n.length,u=t.length;++r<e;)t[u+r]=n[r];return t}function h(t,n,r,e){
var u=-1,o=t?t.length:0;for(e&&o&&(r=t[++u]);++u<o;)r=n(r,t[u],u,t);return r}function p(t,n,r,e){var u=t?t.length:0;for(e&&u&&(r=t[--u]);u--;)r=n(r,t[u],u,t);return r}function _(t,n){for(var r=-1,e=t?t.length:0;++r<e;)if(n(t[r],r,t))return true;return false}function v(t,n,r){var e;return r(t,function(t,r,u){return n(t,r,u)?(e=r,false):void 0}),e}function g(t,n,r,e){var u=t.length;for(r+=e?1:-1;e?r--:++r<u;)if(n(t[r],r,t))return r;return-1}function d(t,n,r){if(n!==n)return M(t,r);--r;for(var e=t.length;++r<e;)if(t[r]===n)return r;
return-1}function y(t,n,r,e){--r;for(var u=t.length;++r<u;)if(e(t[r],n))return r;return-1}function b(t,n){var r=t?t.length:0;return r?w(t,n)/r:V}function x(t,n,r,e,u){return u(t,function(t,u,o){r=e?(e=false,t):n(r,t,u,o)}),r}function j(t,n){var r=t.length;for(t.sort(n);r--;)t[r]=t[r].c;return t}function w(t,n){for(var r,e=-1,u=t.length;++e<u;){var o=n(t[e]);o!==T&&(r=r===T?o:r+o)}return r}function m(t,n){for(var r=-1,e=Array(t);++r<t;)e[r]=n(r);return e}function A(t,n){return l(n,function(n){return[n,t[n]];
})}function O(t){return function(n){return t(n)}}function k(t,n){return l(n,function(n){return t[n]})}function E(t,n){return t.has(n)}function S(t,n){for(var r=-1,e=t.length;++r<e&&-1<d(n,t[r],0););return r}function I(t,n){for(var r=t.length;r--&&-1<d(n,t[r],0););return r}function R(t){return t&&t.Object===Object?t:null}function W(t){return zt[t]}function B(t){return Ut[t]}function L(t){return"\\"+Dt[t]}function M(t,n,r){var e=t.length;for(n+=r?1:-1;r?n--:++n<e;){var u=t[n];if(u!==u)return n}return-1;
}function C(t){var n=false;if(null!=t&&typeof t.toString!="function")try{n=!!(t+"")}catch(r){}return n}function z(t){for(var n,r=[];!(n=t.next()).done;)r.push(n.value);return r}function U(t){var n=-1,r=Array(t.size);return t.forEach(function(t,e){r[++n]=[e,t]}),r}function $(t,n){for(var r=-1,e=t.length,u=0,o=[];++r<e;){var i=t[r];i!==n&&"__lodash_placeholder__"!==i||(t[r]="__lodash_placeholder__",o[u++]=r)}return o}function D(t){var n=-1,r=Array(t.size);return t.forEach(function(t){r[++n]=t}),r}function F(t){
var n=-1,r=Array(t.size);return t.forEach(function(t){r[++n]=[t,t]}),r}function N(t){if(!t||!Wt.test(t))return t.length;for(var n=It.lastIndex=0;It.test(t);)n++;return n}function P(t){return $t[t]}function Z(R){function At(t,n){return R.setTimeout.call(Kt,t,n)}function Ot(t){if(Te(t)&&!yi(t)&&!(t instanceof Ut)){if(t instanceof zt)return t;if(Wu.call(t,"__wrapped__"))return ae(t)}return new zt(t)}function kt(){}function zt(t,n){this.__wrapped__=t,this.__actions__=[],this.__chain__=!!n,this.__index__=0,
this.__values__=T}function Ut(t){this.__wrapped__=t,this.__actions__=[],this.__dir__=1,this.__filtered__=false,this.__iteratees__=[],this.__takeCount__=4294967295,this.__views__=[]}function $t(t){var n=-1,r=t?t.length:0;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function Dt(t){var n=-1,r=t?t.length:0;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function Pt(t){var n=-1,r=t?t.length:0;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function Zt(t){var n=-1,r=t?t.length:0;
for(this.__data__=new Pt;++n<r;)this.add(t[n])}function qt(t){this.__data__=new Dt(t)}function Vt(t,n,r,e){return t===T||Ce(t,ku[r])&&!Wu.call(e,r)?n:t}function Jt(t,n,r){(r===T||Ce(t[n],r))&&(typeof n!="number"||r!==T||n in t)||(t[n]=r)}function Yt(t,n,r){var e=t[n];Wu.call(t,n)&&Ce(e,r)&&(r!==T||n in t)||(t[n]=r)}function Ht(t,n){for(var r=t.length;r--;)if(Ce(t[r][0],n))return r;return-1}function Qt(t,n,r,e){return Ao(t,function(t,u,o){n(e,t,r(t),o)}),e}function Xt(t,n){return t&&sr(n,iu(n),t)}
function tn(t,n){for(var r=-1,e=null==t,u=n.length,o=Array(u);++r<u;)o[r]=e?T:uu(t,n[r]);return o}function nn(t,n,r){return t===t&&(r!==T&&(t=r>=t?t:r),n!==T&&(t=t>=n?t:n)),t}function rn(t,n,r,e,o,i,f){var c;if(e&&(c=i?e(t,o,i,f):e(t)),c!==T)return c;if(!Ze(t))return t;if(o=yi(t)){if(c=Kr(t),!n)return lr(t,c)}else{var a=qr(t),l="[object Function]"==a||"[object GeneratorFunction]"==a;if(bi(t))return or(t,n);if("[object Object]"==a||"[object Arguments]"==a||l&&!i){if(C(t))return i?t:{};if(c=Gr(l?{}:t),
!n)return hr(t,Xt(c,t))}else{if(!Ct[a])return i?t:{};c=Jr(t,a,rn,n)}}if(f||(f=new qt),i=f.get(t))return i;if(f.set(t,c),!o)var s=r?gn(t,iu,Tr):iu(t);return u(s||t,function(u,o){s&&(o=u,u=t[o]),Yt(c,o,rn(u,n,r,e,o,t,f))}),c}function en(t){var n=iu(t),r=n.length;return function(e){if(null==e)return!r;for(var u=r;u--;){var o=n[u],i=t[o],f=e[o];if(f===T&&!(o in Object(e))||!i(f))return false}return true}}function un(t){return Ze(t)?Tu(t):{}}function on(t,n,r){if(typeof t!="function")throw new Au("Expected a function");
return At(function(){t.apply(T,r)},n)}function fn(t,n,r,e){var u=-1,o=c,i=true,f=t.length,s=[],h=n.length;if(!f)return s;r&&(n=l(n,O(r))),e?(o=a,i=false):n.length>=200&&(o=E,i=false,n=new Zt(n));t:for(;++u<f;){var p=t[u],_=r?r(p):p,p=e||0!==p?p:0;if(i&&_===_){for(var v=h;v--;)if(n[v]===_)continue t;s.push(p)}else o(n,_,e)||s.push(p)}return s}function cn(t,n){var r=true;return Ao(t,function(t,e,u){return r=!!n(t,e,u)}),r}function an(t,n,r){for(var e=-1,u=t.length;++e<u;){var o=t[e],i=n(o);if(null!=i&&(f===T?i===i&&!Je(i):r(i,f)))var f=i,c=o;
}return c}function ln(t,n){var r=[];return Ao(t,function(t,e,u){n(t,e,u)&&r.push(t)}),r}function sn(t,n,r,e,u){var o=-1,i=t.length;for(r||(r=Hr),u||(u=[]);++o<i;){var f=t[o];n>0&&r(f)?n>1?sn(f,n-1,r,e,u):s(u,f):e||(u[u.length]=f)}return u}function hn(t,n){return t&&ko(t,n,iu)}function pn(t,n){return t&&Eo(t,n,iu)}function _n(t,n){return f(n,function(n){return Fe(t[n])})}function vn(t,n){n=ne(n,t)?[n]:er(n);for(var r=0,e=n.length;null!=t&&e>r;)t=t[fe(n[r++])];return r&&r==e?t:T}function gn(t,n,r){
return n=n(t),yi(t)?n:s(n,r(t))}function dn(t,n){return t>n}function yn(t,n){return null!=t&&(Wu.call(t,n)||typeof t=="object"&&n in t&&null===Ju(Object(t)))}function bn(t,n){return null!=t&&n in Object(t)}function xn(t,n,r){for(var e=r?a:c,u=t[0].length,o=t.length,i=o,f=Array(o),s=1/0,h=[];i--;){var p=t[i];i&&n&&(p=l(p,O(n))),s=to(p.length,s),f[i]=!r&&(n||u>=120&&p.length>=120)?new Zt(i&&p):T}var p=t[0],_=-1,v=f[0];t:for(;++_<u&&s>h.length;){var g=p[_],d=n?n(g):g,g=r||0!==g?g:0;if(v?!E(v,d):!e(h,d,r)){
for(i=o;--i;){var y=f[i];if(y?!E(y,d):!e(t[i],d,r))continue t}v&&v.push(d),h.push(g)}}return h}function jn(t,n,r){var e={};return hn(t,function(t,u,o){n(e,r(t),u,o)}),e}function wn(t,n,e){return ne(n,t)||(n=er(n),t=ie(t,n),n=ve(n)),n=null==t?t:t[fe(n)],null==n?T:r(n,t,e)}function mn(t,n,r,e,u){if(t===n)n=true;else if(null==t||null==n||!Ze(t)&&!Te(n))n=t!==t&&n!==n;else t:{var o=yi(t),i=yi(n),f="[object Array]",c="[object Array]";o||(f=qr(t),f="[object Arguments]"==f?"[object Object]":f),i||(c=qr(n),
c="[object Arguments]"==c?"[object Object]":c);var a="[object Object]"==f&&!C(t),i="[object Object]"==c&&!C(n);if((c=f==c)&&!a)u||(u=new qt),n=o||Ye(t)?zr(t,n,mn,r,e,u):Ur(t,n,f,mn,r,e,u);else{if(!(2&e)&&(o=a&&Wu.call(t,"__wrapped__"),f=i&&Wu.call(n,"__wrapped__"),o||f)){t=o?t.value():t,n=f?n.value():n,u||(u=new qt),n=mn(t,n,r,e,u);break t}if(c)n:if(u||(u=new qt),o=2&e,f=iu(t),i=f.length,c=iu(n).length,i==c||o){for(a=i;a--;){var l=f[a];if(!(o?l in n:yn(n,l))){n=false;break n}}if(c=u.get(t))n=c==n;else{
c=true,u.set(t,n);for(var s=o;++a<i;){var l=f[a],h=t[l],p=n[l];if(r)var _=o?r(p,h,l,n,t,u):r(h,p,l,t,n,u);if(_===T?h!==p&&!mn(h,p,r,e,u):!_){c=false;break}s||(s="constructor"==l)}c&&!s&&(r=t.constructor,e=n.constructor,r!=e&&"constructor"in t&&"constructor"in n&&!(typeof r=="function"&&r instanceof r&&typeof e=="function"&&e instanceof e)&&(c=false)),u["delete"](t),n=c}}else n=false;else n=false}}return n}function An(t,n,r,e){var u=r.length,o=u,i=!e;if(null==t)return!o;for(t=Object(t);u--;){var f=r[u];if(i&&f[2]?f[1]!==t[f[0]]:!(f[0]in t))return false;
}for(;++u<o;){var f=r[u],c=f[0],a=t[c],l=f[1];if(i&&f[2]){if(a===T&&!(c in t))return false}else{if(f=new qt,e)var s=e(a,l,c,t,n,f);if(s===T?!mn(l,a,e,3,f):!s)return false}}return true}function On(t){return!Ze(t)||Iu&&Iu in t?false:(Fe(t)||C(t)?zu:yt).test(ce(t))}function kn(t){return typeof t=="function"?t:null==t?pu:typeof t=="object"?yi(t)?Wn(t[0],t[1]):Rn(t):du(t)}function En(t){t=null==t?t:Object(t);var n,r=[];for(n in t)r.push(n);return r}function Sn(t,n){return n>t}function In(t,n){var r=-1,e=Ue(t)?Array(t.length):[];
return Ao(t,function(t,u,o){e[++r]=n(t,u,o)}),e}function Rn(t){var n=Pr(t);return 1==n.length&&n[0][2]?ue(n[0][0],n[0][1]):function(r){return r===t||An(r,t,n)}}function Wn(t,n){return ne(t)&&n===n&&!Ze(n)?ue(fe(t),n):function(r){var e=uu(r,t);return e===T&&e===n?ou(r,t):mn(n,e,T,3)}}function Bn(t,n,r,e,o){if(t!==n){if(!yi(n)&&!Ye(n))var i=fu(n);u(i||n,function(u,f){if(i&&(f=u,u=n[f]),Ze(u)){o||(o=new qt);var c=f,a=o,l=t[c],s=n[c],h=a.get(s);if(h)Jt(t,c,h);else{var h=e?e(l,s,c+"",t,n,a):T,p=h===T;p&&(h=s,
yi(s)||Ye(s)?yi(l)?h=l:$e(l)?h=lr(l):(p=false,h=rn(s,true)):Ve(s)||ze(s)?ze(l)?h=ru(l):!Ze(l)||r&&Fe(l)?(p=false,h=rn(s,true)):h=l:p=false),a.set(s,h),p&&Bn(h,s,r,e,a),a["delete"](s),Jt(t,c,h)}}else c=e?e(t[f],u,f+"",t,n,o):T,c===T&&(c=u),Jt(t,f,c)})}}function Ln(t,n){var r=t.length;return r?(n+=0>n?r:0,Xr(n,r)?t[n]:T):void 0}function Mn(t,n,r){var e=-1;return n=l(n.length?n:[pu],O(Fr())),t=In(t,function(t){return{a:l(n,function(n){return n(t)}),b:++e,c:t}}),j(t,function(t,n){var e;t:{e=-1;for(var u=t.a,o=n.a,i=u.length,f=r.length;++e<i;){
var c=fr(u[e],o[e]);if(c){e=e>=f?c:c*("desc"==r[e]?-1:1);break t}}e=t.b-n.b}return e})}function Cn(t,n){return t=Object(t),h(n,function(n,r){return r in t&&(n[r]=t[r]),n},{})}function zn(t,n){for(var r=-1,e=gn(t,fu,Bo),u=e.length,o={};++r<u;){var i=e[r],f=t[i];n(f,i)&&(o[i]=f)}return o}function Un(t){return function(n){return null==n?T:n[t]}}function $n(t){return function(n){return vn(n,t)}}function Dn(t,n,r,e){var u=e?y:d,o=-1,i=n.length,f=t;for(t===n&&(n=lr(n)),r&&(f=l(t,O(r)));++o<i;)for(var c=0,a=n[o],a=r?r(a):a;-1<(c=u(f,a,c,e));)f!==t&&Vu.call(f,c,1),
Vu.call(t,c,1);return t}function Fn(t,n){for(var r=t?n.length:0,e=r-1;r--;){var u=n[r];if(r==e||u!==o){var o=u;if(Xr(u))Vu.call(t,u,1);else if(ne(u,t))delete t[fe(u)];else{var u=er(u),i=ie(t,u);null!=i&&delete i[fe(ve(u))]}}}}function Nn(t,n){return t+Gu(ro()*(n-t+1))}function Pn(t,n){var r="";if(!t||1>n||n>9007199254740991)return r;do n%2&&(r+=t),(n=Gu(n/2))&&(t+=t);while(n);return r}function Zn(t,n,r,e){n=ne(n,t)?[n]:er(n);for(var u=-1,o=n.length,i=o-1,f=t;null!=f&&++u<o;){var c=fe(n[u]);if(Ze(f)){
var a=r;if(u!=i){var l=f[c],a=e?e(l,c,f):T;a===T&&(a=null==l?Xr(n[u+1])?[]:{}:l)}Yt(f,c,a)}f=f[c]}return t}function Tn(t,n,r){var e=-1,u=t.length;for(0>n&&(n=-n>u?0:u+n),r=r>u?u:r,0>r&&(r+=u),u=n>r?0:r-n>>>0,n>>>=0,r=Array(u);++e<u;)r[e]=t[e+n];return r}function qn(t,n){var r;return Ao(t,function(t,e,u){return r=n(t,e,u),!r}),!!r}function Vn(t,n,r){var e=0,u=t?t.length:e;if(typeof n=="number"&&n===n&&2147483647>=u){for(;u>e;){var o=e+u>>>1,i=t[o];null!==i&&!Je(i)&&(r?n>=i:n>i)?e=o+1:u=o}return u}
return Kn(t,n,pu,r)}function Kn(t,n,r,e){n=r(n);for(var u=0,o=t?t.length:0,i=n!==n,f=null===n,c=Je(n),a=n===T;o>u;){var l=Gu((u+o)/2),s=r(t[l]),h=s!==T,p=null===s,_=s===s,v=Je(s);(i?e||_:a?_&&(e||h):f?_&&h&&(e||!p):c?_&&h&&!p&&(e||!v):p||v?0:e?n>=s:n>s)?u=l+1:o=l}return to(o,4294967294)}function Gn(t,n){for(var r=-1,e=t.length,u=0,o=[];++r<e;){var i=t[r],f=n?n(i):i;if(!r||!Ce(f,c)){var c=f;o[u++]=0===i?0:i}}return o}function Jn(t){return typeof t=="number"?t:Je(t)?V:+t}function Yn(t){if(typeof t=="string")return t;
if(Je(t))return mo?mo.call(t):"";var n=t+"";return"0"==n&&1/t==-q?"-0":n}function Hn(t,n,r){var e=-1,u=c,o=t.length,i=true,f=[],l=f;if(r)i=false,u=a;else if(o>=200){if(u=n?null:Io(t))return D(u);i=false,u=E,l=new Zt}else l=n?[]:f;t:for(;++e<o;){var s=t[e],h=n?n(s):s,s=r||0!==s?s:0;if(i&&h===h){for(var p=l.length;p--;)if(l[p]===h)continue t;n&&l.push(h),f.push(s)}else u(l,h,r)||(l!==f&&l.push(h),f.push(s))}return f}function Qn(t,n,r,e){for(var u=t.length,o=e?u:-1;(e?o--:++o<u)&&n(t[o],o,t););return r?Tn(t,e?0:o,e?o+1:u):Tn(t,e?o+1:0,e?u:o);
}function Xn(t,n){var r=t;return r instanceof Ut&&(r=r.value()),h(n,function(t,n){return n.func.apply(n.thisArg,s([t],n.args))},r)}function tr(t,n,r){for(var e=-1,u=t.length;++e<u;)var o=o?s(fn(o,t[e],n,r),fn(t[e],o,n,r)):t[e];return o&&o.length?Hn(o,n,r):[]}function nr(t,n,r){for(var e=-1,u=t.length,o=n.length,i={};++e<u;)r(i,t[e],o>e?n[e]:T);return i}function rr(t){return $e(t)?t:[]}function er(t){return yi(t)?t:Co(t)}function ur(t,n,r){var e=t.length;return r=r===T?e:r,!n&&r>=e?t:Tn(t,n,r)}function or(t,n){
if(n)return t.slice();var r=new t.constructor(t.length);return t.copy(r),r}function ir(t){var n=new t.constructor(t.byteLength);return new Fu(n).set(new Fu(t)),n}function fr(t,n){if(t!==n){var r=t!==T,e=null===t,u=t===t,o=Je(t),i=n!==T,f=null===n,c=n===n,a=Je(n);if(!f&&!a&&!o&&t>n||o&&i&&c&&!f&&!a||e&&i&&c||!r&&c||!u)return 1;if(!e&&!o&&!a&&n>t||a&&r&&u&&!e&&!o||f&&r&&u||!i&&u||!c)return-1}return 0}function cr(t,n,r,e){var u=-1,o=t.length,i=r.length,f=-1,c=n.length,a=Xu(o-i,0),l=Array(c+a);for(e=!e;++f<c;)l[f]=n[f];
for(;++u<i;)(e||o>u)&&(l[r[u]]=t[u]);for(;a--;)l[f++]=t[u++];return l}function ar(t,n,r,e){var u=-1,o=t.length,i=-1,f=r.length,c=-1,a=n.length,l=Xu(o-f,0),s=Array(l+a);for(e=!e;++u<l;)s[u]=t[u];for(l=u;++c<a;)s[l+c]=n[c];for(;++i<f;)(e||o>u)&&(s[l+r[i]]=t[u++]);return s}function lr(t,n){var r=-1,e=t.length;for(n||(n=Array(e));++r<e;)n[r]=t[r];return n}function sr(t,n,r,e){r||(r={});for(var u=-1,o=n.length;++u<o;){var i=n[u],f=e?e(r[i],t[i],i,r,t):t[i];Yt(r,i,f)}return r}function hr(t,n){return sr(t,Tr(t),n);
}function pr(t,n){return function(r,u){var o=yi(r)?e:Qt,i=n?n():{};return o(r,t,Fr(u),i)}}function _r(t){return Me(function(n,r){var e=-1,u=r.length,o=u>1?r[u-1]:T,i=u>2?r[2]:T,o=t.length>3&&typeof o=="function"?(u--,o):T;for(i&&te(r[0],r[1],i)&&(o=3>u?T:o,u=1),n=Object(n);++e<u;)(i=r[e])&&t(n,i,e,o);return n})}function vr(t,n){return function(r,e){if(null==r)return r;if(!Ue(r))return t(r,e);for(var u=r.length,o=n?u:-1,i=Object(r);(n?o--:++o<u)&&false!==e(i[o],o,i););return r}}function gr(t){return function(n,r,e){
var u=-1,o=Object(n);e=e(n);for(var i=e.length;i--;){var f=e[t?i:++u];if(false===r(o[f],f,o))break}return n}}function dr(t,n,r){function e(){return(this&&this!==Kt&&this instanceof e?o:t).apply(u?r:this,arguments)}var u=1&n,o=xr(t);return e}function yr(t){return function(n){n=eu(n);var r=Wt.test(n)?n.match(It):T,e=r?r[0]:n.charAt(0);return n=r?ur(r,1).join(""):n.slice(1),e[t]()+n}}function br(t){return function(n){return h(su(lu(n).replace(Et,"")),t,"")}}function xr(t){return function(){var n=arguments;
switch(n.length){case 0:return new t;case 1:return new t(n[0]);case 2:return new t(n[0],n[1]);case 3:return new t(n[0],n[1],n[2]);case 4:return new t(n[0],n[1],n[2],n[3]);case 5:return new t(n[0],n[1],n[2],n[3],n[4]);case 6:return new t(n[0],n[1],n[2],n[3],n[4],n[5]);case 7:return new t(n[0],n[1],n[2],n[3],n[4],n[5],n[6])}var r=un(t.prototype),n=t.apply(r,n);return Ze(n)?n:r}}function jr(t,n,e){function u(){for(var i=arguments.length,f=Array(i),c=i,a=Dr(u);c--;)f[c]=arguments[c];return c=3>i&&f[0]!==a&&f[i-1]!==a?[]:$(f,a),
i-=c.length,e>i?Br(t,n,Ar,u.placeholder,T,f,c,T,T,e-i):r(this&&this!==Kt&&this instanceof u?o:t,this,f)}var o=xr(t);return u}function wr(t){return function(n,r,e){var u=Object(n);if(r=Fr(r,3),!Ue(n))var o=iu(n);return e=t(o||n,function(t,n){return o&&(n=t,t=u[n]),r(t,n,u)},e),e>-1?n[o?o[e]:e]:T}}function mr(t){return Me(function(n){n=sn(n,1);var r=n.length,e=r,u=zt.prototype.thru;for(t&&n.reverse();e--;){var o=n[e];if(typeof o!="function")throw new Au("Expected a function");if(u&&!i&&"wrapper"==$r(o))var i=new zt([],true);
}for(e=i?e:r;++e<r;)var o=n[e],u=$r(o),f="wrapper"==u?Ro(o):T,i=f&&re(f[0])&&424==f[1]&&!f[4].length&&1==f[9]?i[$r(f[0])].apply(i,f[3]):1==o.length&&re(o)?i[u]():i.thru(o);return function(){var t=arguments,e=t[0];if(i&&1==t.length&&yi(e)&&e.length>=200)return i.plant(e).value();for(var u=0,t=r?n[u].apply(this,t):e;++u<r;)t=n[u].call(this,t);return t}})}function Ar(t,n,r,e,u,o,i,f,c,a){function l(){for(var d=arguments.length,y=Array(d),b=d;b--;)y[b]=arguments[b];if(_){var x,j=Dr(l),b=y.length;for(x=0;b--;)y[b]===j&&x++;
}if(e&&(y=cr(y,e,u,_)),o&&(y=ar(y,o,i,_)),d-=x,_&&a>d)return j=$(y,j),Br(t,n,Ar,l.placeholder,r,y,j,f,c,a-d);if(j=h?r:this,b=p?j[t]:t,d=y.length,f){x=y.length;for(var w=to(f.length,x),m=lr(y);w--;){var A=f[w];y[w]=Xr(A,x)?m[A]:T}}else v&&d>1&&y.reverse();return s&&d>c&&(y.length=c),this&&this!==Kt&&this instanceof l&&(b=g||xr(b)),b.apply(j,y)}var s=128&n,h=1&n,p=2&n,_=24&n,v=512&n,g=p?T:xr(t);return l}function Or(t,n){return function(r,e){return jn(r,t,n(e))}}function kr(t){return function(n,r){var e;
if(n===T&&r===T)return 0;if(n!==T&&(e=n),r!==T){if(e===T)return r;typeof n=="string"||typeof r=="string"?(n=Yn(n),r=Yn(r)):(n=Jn(n),r=Jn(r)),e=t(n,r)}return e}}function Er(t){return Me(function(n){return n=1==n.length&&yi(n[0])?l(n[0],O(Fr())):l(sn(n,1,Qr),O(Fr())),Me(function(e){var u=this;return t(n,function(t){return r(t,u,e)})})})}function Sr(t,n){n=n===T?" ":Yn(n);var r=n.length;return 2>r?r?Pn(n,t):n:(r=Pn(n,Ku(t/N(n))),Wt.test(n)?ur(r.match(It),0,t).join(""):r.slice(0,t))}function Ir(t,n,e,u){
function o(){for(var n=-1,c=arguments.length,a=-1,l=u.length,s=Array(l+c),h=this&&this!==Kt&&this instanceof o?f:t;++a<l;)s[a]=u[a];for(;c--;)s[a++]=arguments[++n];return r(h,i?e:this,s)}var i=1&n,f=xr(t);return o}function Rr(t){return function(n,r,e){e&&typeof e!="number"&&te(n,r,e)&&(r=e=T),n=nu(n),n=n===n?n:0,r===T?(r=n,n=0):r=nu(r)||0,e=e===T?r>n?1:-1:nu(e)||0;var u=-1;r=Xu(Ku((r-n)/(e||1)),0);for(var o=Array(r);r--;)o[t?r:++u]=n,n+=e;return o}}function Wr(t){return function(n,r){return typeof n=="string"&&typeof r=="string"||(n=nu(n),
r=nu(r)),t(n,r)}}function Br(t,n,r,e,u,o,i,f,c,a){var l=8&n,s=l?i:T;i=l?T:i;var h=l?o:T;return o=l?T:o,n=(n|(l?32:64))&~(l?64:32),4&n||(n&=-4),n=[t,n,u,h,s,o,i,f,c,a],r=r.apply(T,n),re(t)&&Mo(r,n),r.placeholder=e,r}function Lr(t){var n=wu[t];return function(t,r){if(t=nu(t),r=to(Xe(r),292)){var e=(eu(t)+"e").split("e"),e=n(e[0]+"e"+(+e[1]+r)),e=(eu(e)+"e").split("e");return+(e[0]+"e"+(+e[1]-r))}return n(t)}}function Mr(t){return function(n){var r=qr(n);return"[object Map]"==r?U(n):"[object Set]"==r?F(n):A(n,t(n));
}}function Cr(t,n,r,e,u,o,i,f){var c=2&n;if(!c&&typeof t!="function")throw new Au("Expected a function");var a=e?e.length:0;if(a||(n&=-97,e=u=T),i=i===T?i:Xu(Xe(i),0),f=f===T?f:Xe(f),a-=u?u.length:0,64&n){var l=e,s=u;e=u=T}var h=c?T:Ro(t);return o=[t,n,r,e,u,l,s,o,i,f],h&&(r=o[1],t=h[1],n=r|t,e=128==t&&8==r||128==t&&256==r&&h[8]>=o[7].length||384==t&&h[8]>=h[7].length&&8==r,131>n||e)&&(1&t&&(o[2]=h[2],n|=1&r?0:4),(r=h[3])&&(e=o[3],o[3]=e?cr(e,r,h[4]):r,o[4]=e?$(o[3],"__lodash_placeholder__"):h[4]),
(r=h[5])&&(e=o[5],o[5]=e?ar(e,r,h[6]):r,o[6]=e?$(o[5],"__lodash_placeholder__"):h[6]),(r=h[7])&&(o[7]=r),128&t&&(o[8]=null==o[8]?h[8]:to(o[8],h[8])),null==o[9]&&(o[9]=h[9]),o[0]=h[0],o[1]=n),t=o[0],n=o[1],r=o[2],e=o[3],u=o[4],f=o[9]=null==o[9]?c?0:t.length:Xu(o[9]-a,0),!f&&24&n&&(n&=-25),(h?So:Mo)(n&&1!=n?8==n||16==n?jr(t,n,f):32!=n&&33!=n||u.length?Ar.apply(T,o):Ir(t,n,r,e):dr(t,n,r),o)}function zr(t,n,r,e,u,o){var i=2&u,f=t.length,c=n.length;if(f!=c&&!(i&&c>f))return false;if(c=o.get(t))return c==n;
var c=-1,a=true,l=1&u?new Zt:T;for(o.set(t,n);++c<f;){var s=t[c],h=n[c];if(e)var p=i?e(h,s,c,n,t,o):e(s,h,c,t,n,o);if(p!==T){if(p)continue;a=false;break}if(l){if(!_(n,function(t,n){return l.has(n)||s!==t&&!r(s,t,e,u,o)?void 0:l.add(n)})){a=false;break}}else if(s!==h&&!r(s,h,e,u,o)){a=false;break}}return o["delete"](t),a}function Ur(t,n,r,e,u,o,i){switch(r){case"[object DataView]":if(t.byteLength!=n.byteLength||t.byteOffset!=n.byteOffset)break;t=t.buffer,n=n.buffer;case"[object ArrayBuffer]":if(t.byteLength!=n.byteLength||!e(new Fu(t),new Fu(n)))break;
return true;case"[object Boolean]":case"[object Date]":return+t==+n;case"[object Error]":return t.name==n.name&&t.message==n.message;case"[object Number]":return t!=+t?n!=+n:t==+n;case"[object RegExp]":case"[object String]":return t==n+"";case"[object Map]":var f=U;case"[object Set]":if(f||(f=D),t.size!=n.size&&!(2&o))break;return(r=i.get(t))?r==n:(o|=1,i.set(t,n),zr(f(t),f(n),e,u,o,i));case"[object Symbol]":if(wo)return wo.call(t)==wo.call(n)}return false}function $r(t){for(var n=t.name+"",r=_o[n],e=Wu.call(_o,n)?r.length:0;e--;){
var u=r[e],o=u.func;if(null==o||o==t)return u.name}return n}function Dr(t){return(Wu.call(Ot,"placeholder")?Ot:t).placeholder}function Fr(){var t=Ot.iteratee||_u,t=t===_u?kn:t;return arguments.length?t(arguments[0],arguments[1]):t}function Nr(t,n){var r=t.__data__,e=typeof n;return("string"==e||"number"==e||"symbol"==e||"boolean"==e?"__proto__"!==n:null===n)?r[typeof n=="string"?"string":"hash"]:r.map}function Pr(t){for(var n=iu(t),r=n.length;r--;){var e=n[r],u=t[e];n[r]=[e,u,u===u&&!Ze(u)]}return n;
}function Zr(t,n){var r=null==t?T:t[n];return On(r)?r:T}function Tr(t){return Pu(Object(t))}function qr(t){return Mu.call(t)}function Vr(t,n,r){n=ne(n,t)?[n]:er(n);for(var e,u=-1,o=n.length;++u<o;){var i=fe(n[u]);if(!(e=null!=t&&r(t,i)))break;t=t[i]}return e?e:(o=t?t.length:0,!!o&&Pe(o)&&Xr(i,o)&&(yi(t)||Ge(t)||ze(t)))}function Kr(t){var n=t.length,r=t.constructor(n);return n&&"string"==typeof t[0]&&Wu.call(t,"index")&&(r.index=t.index,r.input=t.input),r}function Gr(t){return typeof t.constructor!="function"||ee(t)?{}:un(Ju(Object(t)));
}function Jr(r,e,u,o){var i=r.constructor;switch(e){case"[object ArrayBuffer]":return ir(r);case"[object Boolean]":case"[object Date]":return new i(+r);case"[object DataView]":return e=o?ir(r.buffer):r.buffer,new r.constructor(e,r.byteOffset,r.byteLength);case"[object Float32Array]":case"[object Float64Array]":case"[object Int8Array]":case"[object Int16Array]":case"[object Int32Array]":case"[object Uint8Array]":case"[object Uint8ClampedArray]":case"[object Uint16Array]":case"[object Uint32Array]":
return e=o?ir(r.buffer):r.buffer,new r.constructor(e,r.byteOffset,r.length);case"[object Map]":return e=o?u(U(r),true):U(r),h(e,t,new r.constructor);case"[object Number]":case"[object String]":return new i(r);case"[object RegExp]":return e=new r.constructor(r.source,_t.exec(r)),e.lastIndex=r.lastIndex,e;case"[object Set]":return e=o?u(D(r),true):D(r),h(e,n,new r.constructor);case"[object Symbol]":return wo?Object(wo.call(r)):{}}}function Yr(t){var n=t?t.length:T;return Pe(n)&&(yi(t)||Ge(t)||ze(t))?m(n,String):null;
}function Hr(t){return yi(t)||ze(t)}function Qr(t){return yi(t)&&!(2==t.length&&!Fe(t[0]))}function Xr(t,n){return n=null==n?9007199254740991:n,!!n&&(typeof t=="number"||xt.test(t))&&t>-1&&0==t%1&&n>t}function te(t,n,r){if(!Ze(r))return false;var e=typeof n;return("number"==e?Ue(r)&&Xr(n,r.length):"string"==e&&n in r)?Ce(r[n],t):false}function ne(t,n){if(yi(t))return false;var r=typeof t;return"number"==r||"symbol"==r||"boolean"==r||null==t||Je(t)?true:ut.test(t)||!et.test(t)||null!=n&&t in Object(n)}function re(t){
var n=$r(t),r=Ot[n];return typeof r=="function"&&n in Ut.prototype?t===r?true:(n=Ro(r),!!n&&t===n[0]):false}function ee(t){var n=t&&t.constructor;return t===(typeof n=="function"&&n.prototype||ku)}function ue(t,n){return function(r){return null==r?false:r[t]===n&&(n!==T||t in Object(r))}}function oe(t,n,r,e,u,o){return Ze(t)&&Ze(n)&&Bn(t,n,T,oe,o.set(n,t)),t}function ie(t,n){return 1==n.length?t:vn(t,Tn(n,0,-1))}function fe(t){if(typeof t=="string"||Je(t))return t;var n=t+"";return"0"==n&&1/t==-q?"-0":n}function ce(t){
if(null!=t){try{return Ru.call(t)}catch(n){}return t+""}return""}function ae(t){if(t instanceof Ut)return t.clone();var n=new zt(t.__wrapped__,t.__chain__);return n.__actions__=lr(t.__actions__),n.__index__=t.__index__,n.__values__=t.__values__,n}function le(t,n,r){var e=t?t.length:0;return e?(n=r||n===T?1:Xe(n),Tn(t,0>n?0:n,e)):[]}function se(t,n,r){var e=t?t.length:0;return e?(n=r||n===T?1:Xe(n),n=e-n,Tn(t,0,0>n?0:n)):[]}function he(t,n,r){var e=t?t.length:0;return e?(r=null==r?0:Xe(r),0>r&&(r=Xu(e+r,0)),
g(t,Fr(n,3),r)):-1}function pe(t,n,r){var e=t?t.length:0;if(!e)return-1;var u=e-1;return r!==T&&(u=Xe(r),u=0>r?Xu(e+u,0):to(u,e-1)),g(t,Fr(n,3),u,true)}function _e(t){return t&&t.length?t[0]:T}function ve(t){var n=t?t.length:0;return n?t[n-1]:T}function ge(t,n){return t&&t.length&&n&&n.length?Dn(t,n):t}function de(t){return t?uo.call(t):t}function ye(t){if(!t||!t.length)return[];var n=0;return t=f(t,function(t){return $e(t)?(n=Xu(t.length,n),true):void 0}),m(n,function(n){return l(t,Un(n))})}function be(t,n){
if(!t||!t.length)return[];var e=ye(t);return null==n?e:l(e,function(t){return r(n,T,t)})}function xe(t){return t=Ot(t),t.__chain__=true,t}function je(t,n){return n(t)}function we(){return this}function me(t,n){return(yi(t)?u:Ao)(t,Fr(n,3))}function Ae(t,n){return(yi(t)?o:Oo)(t,Fr(n,3))}function Oe(t,n){return(yi(t)?l:In)(t,Fr(n,3))}function ke(t,n,r){var e=-1,u=He(t),o=u.length,i=o-1;for(n=(r?te(t,n,r):n===T)?1:nn(Xe(n),0,o);++e<n;)t=Nn(e,i),r=u[t],u[t]=u[e],u[e]=r;return u.length=n,u}function Ee(){
return xu.now()}function Se(t,n,r){return n=r?T:n,n=t&&null==n?t.length:n,Cr(t,128,T,T,T,T,n)}function Ie(t,n){var r;if(typeof n!="function")throw new Au("Expected a function");return t=Xe(t),function(){return 0<--t&&(r=n.apply(this,arguments)),1>=t&&(n=T),r}}function Re(t,n,r){return n=r?T:n,t=Cr(t,8,T,T,T,T,T,n),t.placeholder=Re.placeholder,t}function We(t,n,r){return n=r?T:n,t=Cr(t,16,T,T,T,T,T,n),t.placeholder=We.placeholder,t}function Be(t,n,r){function e(n){var r=c,e=a;return c=a=T,_=n,s=t.apply(e,r);
}function u(t){var r=t-p;return t-=_,p===T||r>=n||0>r||g&&t>=l}function o(){var t=Ee();if(u(t))return i(t);var r;r=t-_,t=n-(t-p),r=g?to(t,l-r):t,h=At(o,r)}function i(t){return h=T,d&&c?e(t):(c=a=T,s)}function f(){var t=Ee(),r=u(t);if(c=arguments,a=this,p=t,r){if(h===T)return _=t=p,h=At(o,n),v?e(t):s;if(g)return h=At(o,n),e(p)}return h===T&&(h=At(o,n)),s}var c,a,l,s,h,p,_=0,v=false,g=false,d=true;if(typeof t!="function")throw new Au("Expected a function");return n=nu(n)||0,Ze(r)&&(v=!!r.leading,l=(g="maxWait"in r)?Xu(nu(r.maxWait)||0,n):l,
d="trailing"in r?!!r.trailing:d),f.cancel=function(){_=0,c=p=a=h=T},f.flush=function(){return h===T?s:i(Ee())},f}function Le(t,n){function r(){var e=arguments,u=n?n.apply(this,e):e[0],o=r.cache;return o.has(u)?o.get(u):(e=t.apply(this,e),r.cache=o.set(u,e),e)}if(typeof t!="function"||n&&typeof n!="function")throw new Au("Expected a function");return r.cache=new(Le.Cache||Pt),r}function Me(t,n){if(typeof t!="function")throw new Au("Expected a function");return n=Xu(n===T?t.length-1:Xe(n),0),function(){
for(var e=arguments,u=-1,o=Xu(e.length-n,0),i=Array(o);++u<o;)i[u]=e[n+u];switch(n){case 0:return t.call(this,i);case 1:return t.call(this,e[0],i);case 2:return t.call(this,e[0],e[1],i)}for(o=Array(n+1),u=-1;++u<n;)o[u]=e[u];return o[n]=i,r(t,this,o)}}function Ce(t,n){return t===n||t!==t&&n!==n}function ze(t){return $e(t)&&Wu.call(t,"callee")&&(!qu.call(t,"callee")||"[object Arguments]"==Mu.call(t))}function Ue(t){return null!=t&&Pe(Wo(t))&&!Fe(t)}function $e(t){return Te(t)&&Ue(t)}function De(t){
return Te(t)?"[object Error]"==Mu.call(t)||typeof t.message=="string"&&typeof t.name=="string":false}function Fe(t){return t=Ze(t)?Mu.call(t):"","[object Function]"==t||"[object GeneratorFunction]"==t}function Ne(t){return typeof t=="number"&&t==Xe(t)}function Pe(t){return typeof t=="number"&&t>-1&&0==t%1&&9007199254740991>=t}function Ze(t){var n=typeof t;return!!t&&("object"==n||"function"==n)}function Te(t){return!!t&&typeof t=="object"}function qe(t){return typeof t=="number"||Te(t)&&"[object Number]"==Mu.call(t);
}function Ve(t){return!Te(t)||"[object Object]"!=Mu.call(t)||C(t)?false:(t=Ju(Object(t)),null===t?true:(t=Wu.call(t,"constructor")&&t.constructor,typeof t=="function"&&t instanceof t&&Ru.call(t)==Lu))}function Ke(t){return Ze(t)&&"[object RegExp]"==Mu.call(t)}function Ge(t){return typeof t=="string"||!yi(t)&&Te(t)&&"[object String]"==Mu.call(t)}function Je(t){return typeof t=="symbol"||Te(t)&&"[object Symbol]"==Mu.call(t)}function Ye(t){return Te(t)&&Pe(t.length)&&!!Mt[Mu.call(t)]}function He(t){if(!t)return[];
if(Ue(t))return Ge(t)?t.match(It):lr(t);if(Zu&&t[Zu])return z(t[Zu]());var n=qr(t);return("[object Map]"==n?U:"[object Set]"==n?D:cu)(t)}function Qe(t){return t?(t=nu(t),t===q||t===-q?1.7976931348623157e308*(0>t?-1:1):t===t?t:0):0===t?t:0}function Xe(t){t=Qe(t);var n=t%1;return t===t?n?t-n:t:0}function tu(t){return t?nn(Xe(t),0,4294967295):0}function nu(t){if(typeof t=="number")return t;if(Je(t))return V;if(Ze(t)&&(t=Fe(t.valueOf)?t.valueOf():t,t=Ze(t)?t+"":t),typeof t!="string")return 0===t?t:+t;
t=t.replace(ct,"");var n=dt.test(t);return n||bt.test(t)?Nt(t.slice(2),n?2:8):gt.test(t)?V:+t}function ru(t){return sr(t,fu(t))}function eu(t){return null==t?"":Yn(t)}function uu(t,n,r){return t=null==t?T:vn(t,n),t===T?r:t}function ou(t,n){return null!=t&&Vr(t,n,bn)}function iu(t){var n=ee(t);if(!n&&!Ue(t))return Qu(Object(t));var r,e=Yr(t),u=!!e,e=e||[],o=e.length;for(r in t)!yn(t,r)||u&&("length"==r||Xr(r,o))||n&&"constructor"==r||e.push(r);return e}function fu(t){for(var n=-1,r=ee(t),e=En(t),u=e.length,o=Yr(t),i=!!o,o=o||[],f=o.length;++n<u;){
var c=e[n];i&&("length"==c||Xr(c,f))||"constructor"==c&&(r||!Wu.call(t,c))||o.push(c)}return o}function cu(t){return t?k(t,iu(t)):[]}function au(t){return qi(eu(t).toLowerCase())}function lu(t){return(t=eu(t))&&t.replace(jt,W).replace(St,"")}function su(t,n,r){return t=eu(t),n=r?T:n,n===T&&(n=Bt.test(t)?Rt:st),t.match(n)||[]}function hu(t){return function(){return t}}function pu(t){return t}function _u(t){return kn(typeof t=="function"?t:rn(t,true))}function vu(t,n,r){var e=iu(n),o=_n(n,e);null!=r||Ze(n)&&(o.length||!e.length)||(r=n,
n=t,t=this,o=_n(n,iu(n)));var i=!(Ze(r)&&"chain"in r&&!r.chain),f=Fe(t);return u(o,function(r){var e=n[r];t[r]=e,f&&(t.prototype[r]=function(){var n=this.__chain__;if(i||n){var r=t(this.__wrapped__);return(r.__actions__=lr(this.__actions__)).push({func:e,args:arguments,thisArg:t}),r.__chain__=n,r}return e.apply(t,s([this.value()],arguments))})}),t}function gu(){}function du(t){return ne(t)?Un(fe(t)):$n(t)}function yu(){return[]}function bu(){return false}R=R?Gt.defaults({},R,Gt.pick(Kt,Lt)):Kt;var xu=R.Date,ju=R.Error,wu=R.Math,mu=R.RegExp,Au=R.TypeError,Ou=R.Array.prototype,ku=R.Object.prototype,Eu=R.String.prototype,Su=R["__core-js_shared__"],Iu=function(){
var t=/[^.]+$/.exec(Su&&Su.keys&&Su.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}(),Ru=R.Function.prototype.toString,Wu=ku.hasOwnProperty,Bu=0,Lu=Ru.call(Object),Mu=ku.toString,Cu=Kt._,zu=mu("^"+Ru.call(Wu).replace(it,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),Uu=Tt?R.Buffer:T,$u=R.Reflect,Du=R.Symbol,Fu=R.Uint8Array,Nu=$u?$u.f:T,Pu=Object.getOwnPropertySymbols,Zu=typeof(Zu=Du&&Du.iterator)=="symbol"?Zu:T,Tu=Object.create,qu=ku.propertyIsEnumerable,Vu=Ou.splice,Ku=wu.ceil,Gu=wu.floor,Ju=Object.getPrototypeOf,Yu=R.isFinite,Hu=Ou.join,Qu=Object.keys,Xu=wu.max,to=wu.min,no=R.parseInt,ro=wu.random,eo=Eu.replace,uo=Ou.reverse,oo=Eu.split,io=Zr(R,"DataView"),fo=Zr(R,"Map"),co=Zr(R,"Promise"),ao=Zr(R,"Set"),lo=Zr(R,"WeakMap"),so=Zr(Object,"create"),ho=lo&&new lo,po=!qu.call({
valueOf:1},"valueOf"),_o={},vo=ce(io),go=ce(fo),yo=ce(co),bo=ce(ao),xo=ce(lo),jo=Du?Du.prototype:T,wo=jo?jo.valueOf:T,mo=jo?jo.toString:T;Ot.templateSettings={escape:tt,evaluate:nt,interpolate:rt,variable:"",imports:{_:Ot}},Ot.prototype=kt.prototype,Ot.prototype.constructor=Ot,zt.prototype=un(kt.prototype),zt.prototype.constructor=zt,Ut.prototype=un(kt.prototype),Ut.prototype.constructor=Ut,$t.prototype.clear=function(){this.__data__=so?so(null):{}},$t.prototype["delete"]=function(t){return this.has(t)&&delete this.__data__[t];
},$t.prototype.get=function(t){var n=this.__data__;return so?(t=n[t],"__lodash_hash_undefined__"===t?T:t):Wu.call(n,t)?n[t]:T},$t.prototype.has=function(t){var n=this.__data__;return so?n[t]!==T:Wu.call(n,t)},$t.prototype.set=function(t,n){return this.__data__[t]=so&&n===T?"__lodash_hash_undefined__":n,this},Dt.prototype.clear=function(){this.__data__=[]},Dt.prototype["delete"]=function(t){var n=this.__data__;return t=Ht(n,t),0>t?false:(t==n.length-1?n.pop():Vu.call(n,t,1),true)},Dt.prototype.get=function(t){
var n=this.__data__;return t=Ht(n,t),0>t?T:n[t][1]},Dt.prototype.has=function(t){return-1<Ht(this.__data__,t)},Dt.prototype.set=function(t,n){var r=this.__data__,e=Ht(r,t);return 0>e?r.push([t,n]):r[e][1]=n,this},Pt.prototype.clear=function(){this.__data__={hash:new $t,map:new(fo||Dt),string:new $t}},Pt.prototype["delete"]=function(t){return Nr(this,t)["delete"](t)},Pt.prototype.get=function(t){return Nr(this,t).get(t)},Pt.prototype.has=function(t){return Nr(this,t).has(t)},Pt.prototype.set=function(t,n){
return Nr(this,t).set(t,n),this},Zt.prototype.add=Zt.prototype.push=function(t){return this.__data__.set(t,"__lodash_hash_undefined__"),this},Zt.prototype.has=function(t){return this.__data__.has(t)},qt.prototype.clear=function(){this.__data__=new Dt},qt.prototype["delete"]=function(t){return this.__data__["delete"](t)},qt.prototype.get=function(t){return this.__data__.get(t)},qt.prototype.has=function(t){return this.__data__.has(t)},qt.prototype.set=function(t,n){var r=this.__data__;return r instanceof Dt&&200==r.__data__.length&&(r=this.__data__=new Pt(r.__data__)),
r.set(t,n),this};var Ao=vr(hn),Oo=vr(pn,true),ko=gr(),Eo=gr(true);Nu&&!qu.call({valueOf:1},"valueOf")&&(En=function(t){return z(Nu(t))});var So=ho?function(t,n){return ho.set(t,n),t}:pu,Io=ao&&1/D(new ao([,-0]))[1]==q?function(t){return new ao(t)}:gu,Ro=ho?function(t){return ho.get(t)}:gu,Wo=Un("length");Pu||(Tr=yu);var Bo=Pu?function(t){for(var n=[];t;)s(n,Tr(t)),t=Ju(Object(t));return n}:Tr;(io&&"[object DataView]"!=qr(new io(new ArrayBuffer(1)))||fo&&"[object Map]"!=qr(new fo)||co&&"[object Promise]"!=qr(co.resolve())||ao&&"[object Set]"!=qr(new ao)||lo&&"[object WeakMap]"!=qr(new lo))&&(qr=function(t){
var n=Mu.call(t);if(t=(t="[object Object]"==n?t.constructor:T)?ce(t):T)switch(t){case vo:return"[object DataView]";case go:return"[object Map]";case yo:return"[object Promise]";case bo:return"[object Set]";case xo:return"[object WeakMap]"}return n});var Lo=Su?Fe:bu,Mo=function(){var t=0,n=0;return function(r,e){var u=Ee(),o=16-(u-n);if(n=u,o>0){if(150<=++t)return r}else t=0;return So(r,e)}}(),Co=Le(function(t){var n=[];return eu(t).replace(ot,function(t,r,e,u){n.push(e?u.replace(ht,"$1"):r||t)}),
n}),zo=Me(function(t,n){return $e(t)?fn(t,sn(n,1,$e,true)):[]}),Uo=Me(function(t,n){var r=ve(n);return $e(r)&&(r=T),$e(t)?fn(t,sn(n,1,$e,true),Fr(r)):[]}),$o=Me(function(t,n){var r=ve(n);return $e(r)&&(r=T),$e(t)?fn(t,sn(n,1,$e,true),T,r):[]}),Do=Me(function(t){var n=l(t,rr);return n.length&&n[0]===t[0]?xn(n):[]}),Fo=Me(function(t){var n=ve(t),r=l(t,rr);return n===ve(r)?n=T:r.pop(),r.length&&r[0]===t[0]?xn(r,Fr(n)):[]}),No=Me(function(t){var n=ve(t),r=l(t,rr);return n===ve(r)?n=T:r.pop(),r.length&&r[0]===t[0]?xn(r,T,n):[];
}),Po=Me(ge),Zo=Me(function(t,n){n=sn(n,1);var r=t?t.length:0,e=tn(t,n);return Fn(t,l(n,function(t){return Xr(t,r)?+t:t}).sort(fr)),e}),To=Me(function(t){return Hn(sn(t,1,$e,true))}),qo=Me(function(t){var n=ve(t);return $e(n)&&(n=T),Hn(sn(t,1,$e,true),Fr(n))}),Vo=Me(function(t){var n=ve(t);return $e(n)&&(n=T),Hn(sn(t,1,$e,true),T,n)}),Ko=Me(function(t,n){return $e(t)?fn(t,n):[]}),Go=Me(function(t){return tr(f(t,$e))}),Jo=Me(function(t){var n=ve(t);return $e(n)&&(n=T),tr(f(t,$e),Fr(n))}),Yo=Me(function(t){
var n=ve(t);return $e(n)&&(n=T),tr(f(t,$e),T,n)}),Ho=Me(ye),Qo=Me(function(t){var n=t.length,n=n>1?t[n-1]:T,n=typeof n=="function"?(t.pop(),n):T;return be(t,n)}),Xo=Me(function(t){function n(n){return tn(n,t)}t=sn(t,1);var r=t.length,e=r?t[0]:0,u=this.__wrapped__;return!(r>1||this.__actions__.length)&&u instanceof Ut&&Xr(e)?(u=u.slice(e,+e+(r?1:0)),u.__actions__.push({func:je,args:[n],thisArg:T}),new zt(u,this.__chain__).thru(function(t){return r&&!t.length&&t.push(T),t})):this.thru(n)}),ti=pr(function(t,n,r){
Wu.call(t,r)?++t[r]:t[r]=1}),ni=wr(he),ri=wr(pe),ei=pr(function(t,n,r){Wu.call(t,r)?t[r].push(n):t[r]=[n]}),ui=Me(function(t,n,e){var u=-1,o=typeof n=="function",i=ne(n),f=Ue(t)?Array(t.length):[];return Ao(t,function(t){var c=o?n:i&&null!=t?t[n]:T;f[++u]=c?r(c,t,e):wn(t,n,e)}),f}),oi=pr(function(t,n,r){t[r]=n}),ii=pr(function(t,n,r){t[r?0:1].push(n)},function(){return[[],[]]}),fi=Me(function(t,n){if(null==t)return[];var r=n.length;return r>1&&te(t,n[0],n[1])?n=[]:r>2&&te(n[0],n[1],n[2])&&(n=[n[0]]),
n=1==n.length&&yi(n[0])?n[0]:sn(n,1,Qr),Mn(t,n,[])}),ci=Me(function(t,n,r){var e=1;if(r.length)var u=$(r,Dr(ci)),e=32|e;return Cr(t,e,n,r,u)}),ai=Me(function(t,n,r){var e=3;if(r.length)var u=$(r,Dr(ai)),e=32|e;return Cr(n,e,t,r,u)}),li=Me(function(t,n){return on(t,1,n)}),si=Me(function(t,n,r){return on(t,nu(n)||0,r)});Le.Cache=Pt;var hi=Me(function(t,n){n=1==n.length&&yi(n[0])?l(n[0],O(Fr())):l(sn(n,1,Qr),O(Fr()));var e=n.length;return Me(function(u){for(var o=-1,i=to(u.length,e);++o<i;)u[o]=n[o].call(this,u[o]);
return r(t,this,u)})}),pi=Me(function(t,n){var r=$(n,Dr(pi));return Cr(t,32,T,n,r)}),_i=Me(function(t,n){var r=$(n,Dr(_i));return Cr(t,64,T,n,r)}),vi=Me(function(t,n){return Cr(t,256,T,T,T,sn(n,1))}),gi=Wr(dn),di=Wr(function(t,n){return t>=n}),yi=Array.isArray,bi=Uu?function(t){return t instanceof Uu}:bu,xi=Wr(Sn),ji=Wr(function(t,n){return n>=t}),wi=_r(function(t,n){if(po||ee(n)||Ue(n))sr(n,iu(n),t);else for(var r in n)Wu.call(n,r)&&Yt(t,r,n[r])}),mi=_r(function(t,n){if(po||ee(n)||Ue(n))sr(n,fu(n),t);else for(var r in n)Yt(t,r,n[r]);
}),Ai=_r(function(t,n,r,e){sr(n,fu(n),t,e)}),Oi=_r(function(t,n,r,e){sr(n,iu(n),t,e)}),ki=Me(function(t,n){return tn(t,sn(n,1))}),Ei=Me(function(t){return t.push(T,Vt),r(Ai,T,t)}),Si=Me(function(t){return t.push(T,oe),r(Li,T,t)}),Ii=Or(function(t,n,r){t[n]=r},hu(pu)),Ri=Or(function(t,n,r){Wu.call(t,n)?t[n].push(r):t[n]=[r]},Fr),Wi=Me(wn),Bi=_r(function(t,n,r){Bn(t,n,r)}),Li=_r(function(t,n,r,e){Bn(t,n,r,e)}),Mi=Me(function(t,n){return null==t?{}:(n=l(sn(n,1),fe),Cn(t,fn(gn(t,fu,Bo),n)))}),Ci=Me(function(t,n){
return null==t?{}:Cn(t,l(sn(n,1),fe))}),zi=Mr(iu),Ui=Mr(fu),$i=br(function(t,n,r){return n=n.toLowerCase(),t+(r?au(n):n)}),Di=br(function(t,n,r){return t+(r?"-":"")+n.toLowerCase()}),Fi=br(function(t,n,r){return t+(r?" ":"")+n.toLowerCase()}),Ni=yr("toLowerCase"),Pi=br(function(t,n,r){return t+(r?"_":"")+n.toLowerCase()}),Zi=br(function(t,n,r){return t+(r?" ":"")+qi(n)}),Ti=br(function(t,n,r){return t+(r?" ":"")+n.toUpperCase()}),qi=yr("toUpperCase"),Vi=Me(function(t,n){try{return r(t,T,n)}catch(e){
return De(e)?e:new ju(e)}}),Ki=Me(function(t,n){return u(sn(n,1),function(n){n=fe(n),t[n]=ci(t[n],t)}),t}),Gi=mr(),Ji=mr(true),Yi=Me(function(t,n){return function(r){return wn(r,t,n)}}),Hi=Me(function(t,n){return function(r){return wn(t,r,n)}}),Qi=Er(l),Xi=Er(i),tf=Er(_),nf=Rr(),rf=Rr(true),ef=kr(function(t,n){return t+n}),uf=Lr("ceil"),of=kr(function(t,n){return t/n}),ff=Lr("floor"),cf=kr(function(t,n){return t*n}),af=Lr("round"),lf=kr(function(t,n){return t-n});return Ot.after=function(t,n){if(typeof n!="function")throw new Au("Expected a function");
return t=Xe(t),function(){return 1>--t?n.apply(this,arguments):void 0}},Ot.ary=Se,Ot.assign=wi,Ot.assignIn=mi,Ot.assignInWith=Ai,Ot.assignWith=Oi,Ot.at=ki,Ot.before=Ie,Ot.bind=ci,Ot.bindAll=Ki,Ot.bindKey=ai,Ot.castArray=function(){if(!arguments.length)return[];var t=arguments[0];return yi(t)?t:[t]},Ot.chain=xe,Ot.chunk=function(t,n,r){if(n=(r?te(t,n,r):n===T)?1:Xu(Xe(n),0),r=t?t.length:0,!r||1>n)return[];for(var e=0,u=0,o=Array(Ku(r/n));r>e;)o[u++]=Tn(t,e,e+=n);return o},Ot.compact=function(t){for(var n=-1,r=t?t.length:0,e=0,u=[];++n<r;){
var o=t[n];o&&(u[e++]=o)}return u},Ot.concat=function(){for(var t=arguments.length,n=Array(t?t-1:0),r=arguments[0],e=t;e--;)n[e-1]=arguments[e];return t?s(yi(r)?lr(r):[r],sn(n,1)):[]},Ot.cond=function(t){var n=t?t.length:0,e=Fr();return t=n?l(t,function(t){if("function"!=typeof t[1])throw new Au("Expected a function");return[e(t[0]),t[1]]}):[],Me(function(e){for(var u=-1;++u<n;){var o=t[u];if(r(o[0],this,e))return r(o[1],this,e)}})},Ot.conforms=function(t){return en(rn(t,true))},Ot.constant=hu,Ot.countBy=ti,
Ot.create=function(t,n){var r=un(t);return n?Xt(r,n):r},Ot.curry=Re,Ot.curryRight=We,Ot.debounce=Be,Ot.defaults=Ei,Ot.defaultsDeep=Si,Ot.defer=li,Ot.delay=si,Ot.difference=zo,Ot.differenceBy=Uo,Ot.differenceWith=$o,Ot.drop=le,Ot.dropRight=se,Ot.dropRightWhile=function(t,n){return t&&t.length?Qn(t,Fr(n,3),true,true):[]},Ot.dropWhile=function(t,n){return t&&t.length?Qn(t,Fr(n,3),true):[]},Ot.fill=function(t,n,r,e){var u=t?t.length:0;if(!u)return[];for(r&&typeof r!="number"&&te(t,n,r)&&(r=0,e=u),u=t.length,
r=Xe(r),0>r&&(r=-r>u?0:u+r),e=e===T||e>u?u:Xe(e),0>e&&(e+=u),e=r>e?0:tu(e);e>r;)t[r++]=n;return t},Ot.filter=function(t,n){return(yi(t)?f:ln)(t,Fr(n,3))},Ot.flatMap=function(t,n){return sn(Oe(t,n),1)},Ot.flatMapDeep=function(t,n){return sn(Oe(t,n),q)},Ot.flatMapDepth=function(t,n,r){return r=r===T?1:Xe(r),sn(Oe(t,n),r)},Ot.flatten=function(t){return t&&t.length?sn(t,1):[]},Ot.flattenDeep=function(t){return t&&t.length?sn(t,q):[]},Ot.flattenDepth=function(t,n){return t&&t.length?(n=n===T?1:Xe(n),sn(t,n)):[];
},Ot.flip=function(t){return Cr(t,512)},Ot.flow=Gi,Ot.flowRight=Ji,Ot.fromPairs=function(t){for(var n=-1,r=t?t.length:0,e={};++n<r;){var u=t[n];e[u[0]]=u[1]}return e},Ot.functions=function(t){return null==t?[]:_n(t,iu(t))},Ot.functionsIn=function(t){return null==t?[]:_n(t,fu(t))},Ot.groupBy=ei,Ot.initial=function(t){return se(t,1)},Ot.intersection=Do,Ot.intersectionBy=Fo,Ot.intersectionWith=No,Ot.invert=Ii,Ot.invertBy=Ri,Ot.invokeMap=ui,Ot.iteratee=_u,Ot.keyBy=oi,Ot.keys=iu,Ot.keysIn=fu,Ot.map=Oe,
Ot.mapKeys=function(t,n){var r={};return n=Fr(n,3),hn(t,function(t,e,u){r[n(t,e,u)]=t}),r},Ot.mapValues=function(t,n){var r={};return n=Fr(n,3),hn(t,function(t,e,u){r[e]=n(t,e,u)}),r},Ot.matches=function(t){return Rn(rn(t,true))},Ot.matchesProperty=function(t,n){return Wn(t,rn(n,true))},Ot.memoize=Le,Ot.merge=Bi,Ot.mergeWith=Li,Ot.method=Yi,Ot.methodOf=Hi,Ot.mixin=vu,Ot.negate=function(t){if(typeof t!="function")throw new Au("Expected a function");return function(){return!t.apply(this,arguments)}},Ot.nthArg=function(t){
return t=Xe(t),Me(function(n){return Ln(n,t)})},Ot.omit=Mi,Ot.omitBy=function(t,n){return n=Fr(n),zn(t,function(t,r){return!n(t,r)})},Ot.once=function(t){return Ie(2,t)},Ot.orderBy=function(t,n,r,e){return null==t?[]:(yi(n)||(n=null==n?[]:[n]),r=e?T:r,yi(r)||(r=null==r?[]:[r]),Mn(t,n,r))},Ot.over=Qi,Ot.overArgs=hi,Ot.overEvery=Xi,Ot.overSome=tf,Ot.partial=pi,Ot.partialRight=_i,Ot.partition=ii,Ot.pick=Ci,Ot.pickBy=function(t,n){return null==t?{}:zn(t,Fr(n))},Ot.property=du,Ot.propertyOf=function(t){
return function(n){return null==t?T:vn(t,n)}},Ot.pull=Po,Ot.pullAll=ge,Ot.pullAllBy=function(t,n,r){return t&&t.length&&n&&n.length?Dn(t,n,Fr(r)):t},Ot.pullAllWith=function(t,n,r){return t&&t.length&&n&&n.length?Dn(t,n,T,r):t},Ot.pullAt=Zo,Ot.range=nf,Ot.rangeRight=rf,Ot.rearg=vi,Ot.reject=function(t,n){var r=yi(t)?f:ln;return n=Fr(n,3),r(t,function(t,r,e){return!n(t,r,e)})},Ot.remove=function(t,n){var r=[];if(!t||!t.length)return r;var e=-1,u=[],o=t.length;for(n=Fr(n,3);++e<o;){var i=t[e];n(i,e,t)&&(r.push(i),
u.push(e))}return Fn(t,u),r},Ot.rest=Me,Ot.reverse=de,Ot.sampleSize=ke,Ot.set=function(t,n,r){return null==t?t:Zn(t,n,r)},Ot.setWith=function(t,n,r,e){return e=typeof e=="function"?e:T,null==t?t:Zn(t,n,r,e)},Ot.shuffle=function(t){return ke(t,4294967295)},Ot.slice=function(t,n,r){var e=t?t.length:0;return e?(r&&typeof r!="number"&&te(t,n,r)?(n=0,r=e):(n=null==n?0:Xe(n),r=r===T?e:Xe(r)),Tn(t,n,r)):[]},Ot.sortBy=fi,Ot.sortedUniq=function(t){return t&&t.length?Gn(t):[]},Ot.sortedUniqBy=function(t,n){
return t&&t.length?Gn(t,Fr(n)):[]},Ot.split=function(t,n,r){return r&&typeof r!="number"&&te(t,n,r)&&(n=r=T),r=r===T?4294967295:r>>>0,r?(t=eu(t))&&(typeof n=="string"||null!=n&&!Ke(n))&&(n=Yn(n),""==n&&Wt.test(t))?ur(t.match(It),0,r):oo.call(t,n,r):[]},Ot.spread=function(t,n){if(typeof t!="function")throw new Au("Expected a function");return n=n===T?0:Xu(Xe(n),0),Me(function(e){var u=e[n];return e=ur(e,0,n),u&&s(e,u),r(t,this,e)})},Ot.tail=function(t){return le(t,1)},Ot.take=function(t,n,r){return t&&t.length?(n=r||n===T?1:Xe(n),
Tn(t,0,0>n?0:n)):[]},Ot.takeRight=function(t,n,r){var e=t?t.length:0;return e?(n=r||n===T?1:Xe(n),n=e-n,Tn(t,0>n?0:n,e)):[]},Ot.takeRightWhile=function(t,n){return t&&t.length?Qn(t,Fr(n,3),false,true):[]},Ot.takeWhile=function(t,n){return t&&t.length?Qn(t,Fr(n,3)):[]},Ot.tap=function(t,n){return n(t),t},Ot.throttle=function(t,n,r){var e=true,u=true;if(typeof t!="function")throw new Au("Expected a function");return Ze(r)&&(e="leading"in r?!!r.leading:e,u="trailing"in r?!!r.trailing:u),Be(t,n,{leading:e,maxWait:n,
trailing:u})},Ot.thru=je,Ot.toArray=He,Ot.toPairs=zi,Ot.toPairsIn=Ui,Ot.toPath=function(t){return yi(t)?l(t,fe):Je(t)?[t]:lr(Co(t))},Ot.toPlainObject=ru,Ot.transform=function(t,n,r){var e=yi(t)||Ye(t);if(n=Fr(n,4),null==r)if(e||Ze(t)){var o=t.constructor;r=e?yi(t)?new o:[]:Fe(o)?un(Ju(Object(t))):{}}else r={};return(e?u:hn)(t,function(t,e,u){return n(r,t,e,u)}),r},Ot.unary=function(t){return Se(t,1)},Ot.union=To,Ot.unionBy=qo,Ot.unionWith=Vo,Ot.uniq=function(t){return t&&t.length?Hn(t):[]},Ot.uniqBy=function(t,n){
return t&&t.length?Hn(t,Fr(n)):[]},Ot.uniqWith=function(t,n){return t&&t.length?Hn(t,T,n):[]},Ot.unset=function(t,n){var r;if(null==t)r=true;else{r=t;var e=n,e=ne(e,r)?[e]:er(e);r=ie(r,e),e=fe(ve(e)),r=!(null!=r&&yn(r,e))||delete r[e]}return r},Ot.unzip=ye,Ot.unzipWith=be,Ot.update=function(t,n,r){return null==t?t:Zn(t,n,(typeof r=="function"?r:pu)(vn(t,n)),void 0)},Ot.updateWith=function(t,n,r,e){return e=typeof e=="function"?e:T,null!=t&&(t=Zn(t,n,(typeof r=="function"?r:pu)(vn(t,n)),e)),t},Ot.values=cu,
Ot.valuesIn=function(t){return null==t?[]:k(t,fu(t))},Ot.without=Ko,Ot.words=su,Ot.wrap=function(t,n){return n=null==n?pu:n,pi(n,t)},Ot.xor=Go,Ot.xorBy=Jo,Ot.xorWith=Yo,Ot.zip=Ho,Ot.zipObject=function(t,n){return nr(t||[],n||[],Yt)},Ot.zipObjectDeep=function(t,n){return nr(t||[],n||[],Zn)},Ot.zipWith=Qo,Ot.entries=zi,Ot.entriesIn=Ui,Ot.extend=mi,Ot.extendWith=Ai,vu(Ot,Ot),Ot.add=ef,Ot.attempt=Vi,Ot.camelCase=$i,Ot.capitalize=au,Ot.ceil=uf,Ot.clamp=function(t,n,r){return r===T&&(r=n,n=T),r!==T&&(r=nu(r),
r=r===r?r:0),n!==T&&(n=nu(n),n=n===n?n:0),nn(nu(t),n,r)},Ot.clone=function(t){return rn(t,false,true)},Ot.cloneDeep=function(t){return rn(t,true,true)},Ot.cloneDeepWith=function(t,n){return rn(t,true,true,n)},Ot.cloneWith=function(t,n){return rn(t,false,true,n)},Ot.deburr=lu,Ot.divide=of,Ot.endsWith=function(t,n,r){t=eu(t),n=Yn(n);var e=t.length;return r=r===T?e:nn(Xe(r),0,e),r-=n.length,r>=0&&t.indexOf(n,r)==r},Ot.eq=Ce,Ot.escape=function(t){return(t=eu(t))&&X.test(t)?t.replace(H,B):t},Ot.escapeRegExp=function(t){
return(t=eu(t))&&ft.test(t)?t.replace(it,"\\$&"):t},Ot.every=function(t,n,r){var e=yi(t)?i:cn;return r&&te(t,n,r)&&(n=T),e(t,Fr(n,3))},Ot.find=ni,Ot.findIndex=he,Ot.findKey=function(t,n){return v(t,Fr(n,3),hn)},Ot.findLast=ri,Ot.findLastIndex=pe,Ot.findLastKey=function(t,n){return v(t,Fr(n,3),pn)},Ot.floor=ff,Ot.forEach=me,Ot.forEachRight=Ae,Ot.forIn=function(t,n){return null==t?t:ko(t,Fr(n,3),fu)},Ot.forInRight=function(t,n){return null==t?t:Eo(t,Fr(n,3),fu)},Ot.forOwn=function(t,n){return t&&hn(t,Fr(n,3));
},Ot.forOwnRight=function(t,n){return t&&pn(t,Fr(n,3))},Ot.get=uu,Ot.gt=gi,Ot.gte=di,Ot.has=function(t,n){return null!=t&&Vr(t,n,yn)},Ot.hasIn=ou,Ot.head=_e,Ot.identity=pu,Ot.includes=function(t,n,r,e){return t=Ue(t)?t:cu(t),r=r&&!e?Xe(r):0,e=t.length,0>r&&(r=Xu(e+r,0)),Ge(t)?e>=r&&-1<t.indexOf(n,r):!!e&&-1<d(t,n,r)},Ot.indexOf=function(t,n,r){var e=t?t.length:0;return e?(r=null==r?0:Xe(r),0>r&&(r=Xu(e+r,0)),d(t,n,r)):-1},Ot.inRange=function(t,n,r){return n=nu(n)||0,r===T?(r=n,n=0):r=nu(r)||0,t=nu(t),
t>=to(n,r)&&t<Xu(n,r)},Ot.invoke=Wi,Ot.isArguments=ze,Ot.isArray=yi,Ot.isArrayBuffer=function(t){return Te(t)&&"[object ArrayBuffer]"==Mu.call(t)},Ot.isArrayLike=Ue,Ot.isArrayLikeObject=$e,Ot.isBoolean=function(t){return true===t||false===t||Te(t)&&"[object Boolean]"==Mu.call(t)},Ot.isBuffer=bi,Ot.isDate=function(t){return Te(t)&&"[object Date]"==Mu.call(t)},Ot.isElement=function(t){return!!t&&1===t.nodeType&&Te(t)&&!Ve(t)},Ot.isEmpty=function(t){if(Ue(t)&&(yi(t)||Ge(t)||Fe(t.splice)||ze(t)||bi(t)))return!t.length;
if(Te(t)){var n=qr(t);if("[object Map]"==n||"[object Set]"==n)return!t.size}for(var r in t)if(Wu.call(t,r))return false;return!(po&&iu(t).length)},Ot.isEqual=function(t,n){return mn(t,n)},Ot.isEqualWith=function(t,n,r){var e=(r=typeof r=="function"?r:T)?r(t,n):T;return e===T?mn(t,n,r):!!e},Ot.isError=De,Ot.isFinite=function(t){return typeof t=="number"&&Yu(t)},Ot.isFunction=Fe,Ot.isInteger=Ne,Ot.isLength=Pe,Ot.isMap=function(t){return Te(t)&&"[object Map]"==qr(t)},Ot.isMatch=function(t,n){return t===n||An(t,n,Pr(n));
},Ot.isMatchWith=function(t,n,r){return r=typeof r=="function"?r:T,An(t,n,Pr(n),r)},Ot.isNaN=function(t){return qe(t)&&t!=+t},Ot.isNative=function(t){if(Lo(t))throw new ju("This method is not supported with `core-js`. Try https://github.com/es-shims.");return On(t)},Ot.isNil=function(t){return null==t},Ot.isNull=function(t){return null===t},Ot.isNumber=qe,Ot.isObject=Ze,Ot.isObjectLike=Te,Ot.isPlainObject=Ve,Ot.isRegExp=Ke,Ot.isSafeInteger=function(t){return Ne(t)&&t>=-9007199254740991&&9007199254740991>=t;
},Ot.isSet=function(t){return Te(t)&&"[object Set]"==qr(t)},Ot.isString=Ge,Ot.isSymbol=Je,Ot.isTypedArray=Ye,Ot.isUndefined=function(t){return t===T},Ot.isWeakMap=function(t){return Te(t)&&"[object WeakMap]"==qr(t)},Ot.isWeakSet=function(t){return Te(t)&&"[object WeakSet]"==Mu.call(t)},Ot.join=function(t,n){return t?Hu.call(t,n):""},Ot.kebabCase=Di,Ot.last=ve,Ot.lastIndexOf=function(t,n,r){var e=t?t.length:0;if(!e)return-1;var u=e;if(r!==T&&(u=Xe(r),u=(0>u?Xu(e+u,0):to(u,e-1))+1),n!==n)return M(t,u-1,true);
for(;u--;)if(t[u]===n)return u;return-1},Ot.lowerCase=Fi,Ot.lowerFirst=Ni,Ot.lt=xi,Ot.lte=ji,Ot.max=function(t){return t&&t.length?an(t,pu,dn):T},Ot.maxBy=function(t,n){return t&&t.length?an(t,Fr(n),dn):T},Ot.mean=function(t){return b(t,pu)},Ot.meanBy=function(t,n){return b(t,Fr(n))},Ot.min=function(t){return t&&t.length?an(t,pu,Sn):T},Ot.minBy=function(t,n){return t&&t.length?an(t,Fr(n),Sn):T},Ot.stubArray=yu,Ot.stubFalse=bu,Ot.stubObject=function(){return{}},Ot.stubString=function(){return""},Ot.stubTrue=function(){
return true},Ot.multiply=cf,Ot.nth=function(t,n){return t&&t.length?Ln(t,Xe(n)):T},Ot.noConflict=function(){return Kt._===this&&(Kt._=Cu),this},Ot.noop=gu,Ot.now=Ee,Ot.pad=function(t,n,r){t=eu(t);var e=(n=Xe(n))?N(t):0;return!n||e>=n?t:(n=(n-e)/2,Sr(Gu(n),r)+t+Sr(Ku(n),r))},Ot.padEnd=function(t,n,r){t=eu(t);var e=(n=Xe(n))?N(t):0;return n&&n>e?t+Sr(n-e,r):t},Ot.padStart=function(t,n,r){t=eu(t);var e=(n=Xe(n))?N(t):0;return n&&n>e?Sr(n-e,r)+t:t},Ot.parseInt=function(t,n,r){return r||null==n?n=0:n&&(n=+n),
t=eu(t).replace(ct,""),no(t,n||(vt.test(t)?16:10))},Ot.random=function(t,n,r){if(r&&typeof r!="boolean"&&te(t,n,r)&&(n=r=T),r===T&&(typeof n=="boolean"?(r=n,n=T):typeof t=="boolean"&&(r=t,t=T)),t===T&&n===T?(t=0,n=1):(t=nu(t)||0,n===T?(n=t,t=0):n=nu(n)||0),t>n){var e=t;t=n,n=e}return r||t%1||n%1?(r=ro(),to(t+r*(n-t+Ft("1e-"+((r+"").length-1))),n)):Nn(t,n)},Ot.reduce=function(t,n,r){var e=yi(t)?h:x,u=3>arguments.length;return e(t,Fr(n,4),r,u,Ao)},Ot.reduceRight=function(t,n,r){var e=yi(t)?p:x,u=3>arguments.length;
return e(t,Fr(n,4),r,u,Oo)},Ot.repeat=function(t,n,r){return n=(r?te(t,n,r):n===T)?1:Xe(n),Pn(eu(t),n)},Ot.replace=function(){var t=arguments,n=eu(t[0]);return 3>t.length?n:eo.call(n,t[1],t[2])},Ot.result=function(t,n,r){n=ne(n,t)?[n]:er(n);var e=-1,u=n.length;for(u||(t=T,u=1);++e<u;){var o=null==t?T:t[fe(n[e])];o===T&&(e=u,o=r),t=Fe(o)?o.call(t):o}return t},Ot.round=af,Ot.runInContext=Z,Ot.sample=function(t){t=Ue(t)?t:cu(t);var n=t.length;return n>0?t[Nn(0,n-1)]:T},Ot.size=function(t){if(null==t)return 0;
if(Ue(t)){var n=t.length;return n&&Ge(t)?N(t):n}return Te(t)&&(n=qr(t),"[object Map]"==n||"[object Set]"==n)?t.size:iu(t).length},Ot.snakeCase=Pi,Ot.some=function(t,n,r){var e=yi(t)?_:qn;return r&&te(t,n,r)&&(n=T),e(t,Fr(n,3))},Ot.sortedIndex=function(t,n){return Vn(t,n)},Ot.sortedIndexBy=function(t,n,r){return Kn(t,n,Fr(r))},Ot.sortedIndexOf=function(t,n){var r=t?t.length:0;if(r){var e=Vn(t,n);if(r>e&&Ce(t[e],n))return e}return-1},Ot.sortedLastIndex=function(t,n){return Vn(t,n,true)},Ot.sortedLastIndexBy=function(t,n,r){
return Kn(t,n,Fr(r),true)},Ot.sortedLastIndexOf=function(t,n){if(t&&t.length){var r=Vn(t,n,true)-1;if(Ce(t[r],n))return r}return-1},Ot.startCase=Zi,Ot.startsWith=function(t,n,r){return t=eu(t),r=nn(Xe(r),0,t.length),t.lastIndexOf(Yn(n),r)==r},Ot.subtract=lf,Ot.sum=function(t){return t&&t.length?w(t,pu):0},Ot.sumBy=function(t,n){return t&&t.length?w(t,Fr(n)):0},Ot.template=function(t,n,r){var e=Ot.templateSettings;r&&te(t,n,r)&&(n=T),t=eu(t),n=Ai({},n,e,Vt),r=Ai({},n.imports,e.imports,Vt);var u,o,i=iu(r),f=k(r,i),c=0;
r=n.interpolate||wt;var a="__p+='";r=mu((n.escape||wt).source+"|"+r.source+"|"+(r===rt?pt:wt).source+"|"+(n.evaluate||wt).source+"|$","g");var l="sourceURL"in n?"//# sourceURL="+n.sourceURL+"\n":"";if(t.replace(r,function(n,r,e,i,f,l){return e||(e=i),a+=t.slice(c,l).replace(mt,L),r&&(u=true,a+="'+__e("+r+")+'"),f&&(o=true,a+="';"+f+";\n__p+='"),e&&(a+="'+((__t=("+e+"))==null?'':__t)+'"),c=l+n.length,n}),a+="';",(n=n.variable)||(a="with(obj){"+a+"}"),a=(o?a.replace(K,""):a).replace(G,"$1").replace(J,"$1;"),
a="function("+(n||"obj")+"){"+(n?"":"obj||(obj={});")+"var __t,__p=''"+(u?",__e=_.escape":"")+(o?",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}":";")+a+"return __p}",n=Vi(function(){return Function(i,l+"return "+a).apply(T,f)}),n.source=a,De(n))throw n;return n},Ot.times=function(t,n){if(t=Xe(t),1>t||t>9007199254740991)return[];var r=4294967295,e=to(t,4294967295);for(n=Fr(n),t-=4294967295,e=m(e,n);++r<t;)n(r);return e},Ot.toFinite=Qe,Ot.toInteger=Xe,Ot.toLength=tu,Ot.toLower=function(t){
return eu(t).toLowerCase()},Ot.toNumber=nu,Ot.toSafeInteger=function(t){return nn(Xe(t),-9007199254740991,9007199254740991)},Ot.toString=eu,Ot.toUpper=function(t){return eu(t).toUpperCase()},Ot.trim=function(t,n,r){return(t=eu(t))&&(r||n===T)?t.replace(ct,""):t&&(n=Yn(n))?(t=t.match(It),n=n.match(It),ur(t,S(t,n),I(t,n)+1).join("")):t},Ot.trimEnd=function(t,n,r){return(t=eu(t))&&(r||n===T)?t.replace(lt,""):t&&(n=Yn(n))?(t=t.match(It),n=I(t,n.match(It))+1,ur(t,0,n).join("")):t},Ot.trimStart=function(t,n,r){
return(t=eu(t))&&(r||n===T)?t.replace(at,""):t&&(n=Yn(n))?(t=t.match(It),n=S(t,n.match(It)),ur(t,n).join("")):t},Ot.truncate=function(t,n){var r=30,e="...";if(Ze(n))var u="separator"in n?n.separator:u,r="length"in n?Xe(n.length):r,e="omission"in n?Yn(n.omission):e;t=eu(t);var o=t.length;if(Wt.test(t))var i=t.match(It),o=i.length;if(r>=o)return t;if(o=r-N(e),1>o)return e;if(r=i?ur(i,0,o).join(""):t.slice(0,o),u===T)return r+e;if(i&&(o+=r.length-o),Ke(u)){if(t.slice(o).search(u)){var f=r;for(u.global||(u=mu(u.source,eu(_t.exec(u))+"g")),
u.lastIndex=0;i=u.exec(f);)var c=i.index;r=r.slice(0,c===T?o:c)}}else t.indexOf(Yn(u),o)!=o&&(u=r.lastIndexOf(u),u>-1&&(r=r.slice(0,u)));return r+e},Ot.unescape=function(t){return(t=eu(t))&&Q.test(t)?t.replace(Y,P):t},Ot.uniqueId=function(t){var n=++Bu;return eu(t)+n},Ot.upperCase=Ti,Ot.upperFirst=qi,Ot.each=me,Ot.eachRight=Ae,Ot.first=_e,vu(Ot,function(){var t={};return hn(Ot,function(n,r){Wu.call(Ot.prototype,r)||(t[r]=n)}),t}(),{chain:false}),Ot.VERSION="4.13.1",u("bind bindKey curry curryRight partial partialRight".split(" "),function(t){
Ot[t].placeholder=Ot}),u(["drop","take"],function(t,n){Ut.prototype[t]=function(r){var e=this.__filtered__;if(e&&!n)return new Ut(this);r=r===T?1:Xu(Xe(r),0);var u=this.clone();return e?u.__takeCount__=to(r,u.__takeCount__):u.__views__.push({size:to(r,4294967295),type:t+(0>u.__dir__?"Right":"")}),u},Ut.prototype[t+"Right"]=function(n){return this.reverse()[t](n).reverse()}}),u(["filter","map","takeWhile"],function(t,n){var r=n+1,e=1==r||3==r;Ut.prototype[t]=function(t){var n=this.clone();return n.__iteratees__.push({
iteratee:Fr(t,3),type:r}),n.__filtered__=n.__filtered__||e,n}}),u(["head","last"],function(t,n){var r="take"+(n?"Right":"");Ut.prototype[t]=function(){return this[r](1).value()[0]}}),u(["initial","tail"],function(t,n){var r="drop"+(n?"":"Right");Ut.prototype[t]=function(){return this.__filtered__?new Ut(this):this[r](1)}}),Ut.prototype.compact=function(){return this.filter(pu)},Ut.prototype.find=function(t){return this.filter(t).head()},Ut.prototype.findLast=function(t){return this.reverse().find(t);
},Ut.prototype.invokeMap=Me(function(t,n){return typeof t=="function"?new Ut(this):this.map(function(r){return wn(r,t,n)})}),Ut.prototype.reject=function(t){return t=Fr(t,3),this.filter(function(n){return!t(n)})},Ut.prototype.slice=function(t,n){t=Xe(t);var r=this;return r.__filtered__&&(t>0||0>n)?new Ut(r):(0>t?r=r.takeRight(-t):t&&(r=r.drop(t)),n!==T&&(n=Xe(n),r=0>n?r.dropRight(-n):r.take(n-t)),r)},Ut.prototype.takeRightWhile=function(t){return this.reverse().takeWhile(t).reverse()},Ut.prototype.toArray=function(){
return this.take(4294967295)},hn(Ut.prototype,function(t,n){var r=/^(?:filter|find|map|reject)|While$/.test(n),e=/^(?:head|last)$/.test(n),u=Ot[e?"take"+("last"==n?"Right":""):n],o=e||/^find/.test(n);u&&(Ot.prototype[n]=function(){function n(t){return t=u.apply(Ot,s([t],f)),e&&h?t[0]:t}var i=this.__wrapped__,f=e?[1]:arguments,c=i instanceof Ut,a=f[0],l=c||yi(i);l&&r&&typeof a=="function"&&1!=a.length&&(c=l=false);var h=this.__chain__,p=!!this.__actions__.length,a=o&&!h,c=c&&!p;return!o&&l?(i=c?i:new Ut(this),
i=t.apply(i,f),i.__actions__.push({func:je,args:[n],thisArg:T}),new zt(i,h)):a&&c?t.apply(this,f):(i=this.thru(n),a?e?i.value()[0]:i.value():i)})}),u("pop push shift sort splice unshift".split(" "),function(t){var n=Ou[t],r=/^(?:push|sort|unshift)$/.test(t)?"tap":"thru",e=/^(?:pop|shift)$/.test(t);Ot.prototype[t]=function(){var t=arguments;if(e&&!this.__chain__){var u=this.value();return n.apply(yi(u)?u:[],t)}return this[r](function(r){return n.apply(yi(r)?r:[],t)})}}),hn(Ut.prototype,function(t,n){
var r=Ot[n];if(r){var e=r.name+"";(_o[e]||(_o[e]=[])).push({name:n,func:r})}}),_o[Ar(T,2).name]=[{name:"wrapper",func:T}],Ut.prototype.clone=function(){var t=new Ut(this.__wrapped__);return t.__actions__=lr(this.__actions__),t.__dir__=this.__dir__,t.__filtered__=this.__filtered__,t.__iteratees__=lr(this.__iteratees__),t.__takeCount__=this.__takeCount__,t.__views__=lr(this.__views__),t},Ut.prototype.reverse=function(){if(this.__filtered__){var t=new Ut(this);t.__dir__=-1,t.__filtered__=true}else t=this.clone(),
t.__dir__*=-1;return t},Ut.prototype.value=function(){var t,n=this.__wrapped__.value(),r=this.__dir__,e=yi(n),u=0>r,o=e?n.length:0;t=o;for(var i=this.__views__,f=0,c=-1,a=i.length;++c<a;){var l=i[c],s=l.size;switch(l.type){case"drop":f+=s;break;case"dropRight":t-=s;break;case"take":t=to(t,f+s);break;case"takeRight":f=Xu(f,t-s)}}if(t={start:f,end:t},i=t.start,f=t.end,t=f-i,u=u?f:i-1,i=this.__iteratees__,f=i.length,c=0,a=to(t,this.__takeCount__),!e||200>o||o==t&&a==t)return Xn(n,this.__actions__);e=[];
t:for(;t--&&a>c;){for(u+=r,o=-1,l=n[u];++o<f;){var h=i[o],s=h.type,h=(0,h.iteratee)(l);if(2==s)l=h;else if(!h){if(1==s)continue t;break t}}e[c++]=l}return e},Ot.prototype.at=Xo,Ot.prototype.chain=function(){return xe(this)},Ot.prototype.commit=function(){return new zt(this.value(),this.__chain__)},Ot.prototype.next=function(){this.__values__===T&&(this.__values__=He(this.value()));var t=this.__index__>=this.__values__.length,n=t?T:this.__values__[this.__index__++];return{done:t,value:n}},Ot.prototype.plant=function(t){
for(var n,r=this;r instanceof kt;){var e=ae(r);e.__index__=0,e.__values__=T,n?u.__wrapped__=e:n=e;var u=e,r=r.__wrapped__}return u.__wrapped__=t,n},Ot.prototype.reverse=function(){var t=this.__wrapped__;return t instanceof Ut?(this.__actions__.length&&(t=new Ut(this)),t=t.reverse(),t.__actions__.push({func:je,args:[de],thisArg:T}),new zt(t,this.__chain__)):this.thru(de)},Ot.prototype.toJSON=Ot.prototype.valueOf=Ot.prototype.value=function(){return Xn(this.__wrapped__,this.__actions__)},Zu&&(Ot.prototype[Zu]=we),
Ot}var T,q=1/0,V=NaN,K=/\b__p\+='';/g,G=/\b(__p\+=)''\+/g,J=/(__e\(.*?\)|\b__t\))\+'';/g,Y=/&(?:amp|lt|gt|quot|#39|#96);/g,H=/[&<>"'`]/g,Q=RegExp(Y.source),X=RegExp(H.source),tt=/<%-([\s\S]+?)%>/g,nt=/<%([\s\S]+?)%>/g,rt=/<%=([\s\S]+?)%>/g,et=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,ut=/^\w*$/,ot=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(\.|\[\])(?:\4|$))/g,it=/[\\^$.*+?()[\]{}|]/g,ft=RegExp(it.source),ct=/^\s+|\s+$/g,at=/^\s+/,lt=/\s+$/,st=/[a-zA-Z0-9]+/g,ht=/\\(\\)?/g,pt=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,_t=/\w*$/,vt=/^0x/i,gt=/^[-+]0x[0-9a-f]+$/i,dt=/^0b[01]+$/i,yt=/^\[object .+?Constructor\]$/,bt=/^0o[0-7]+$/i,xt=/^(?:0|[1-9]\d*)$/,jt=/[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g,wt=/($^)/,mt=/['\n\r\u2028\u2029\\]/g,At="[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|\\ud83c[\\udffb-\\udfff])?(?:\\u200d(?:[^\\ud800-\\udfff]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])[\\ufe0e\\ufe0f]?(?:[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|\\ud83c[\\udffb-\\udfff])?)*",Ot="(?:[\\u2700-\\u27bf]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff])"+At,kt="(?:[^\\ud800-\\udfff][\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]?|[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]|(?:\\ud83c[\\udde6-\\uddff]){2}|[\\ud800-\\udbff][\\udc00-\\udfff]|[\\ud800-\\udfff])",Et=RegExp("['\u2019]","g"),St=RegExp("[\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0]","g"),It=RegExp("\\ud83c[\\udffb-\\udfff](?=\\ud83c[\\udffb-\\udfff])|"+kt+At,"g"),Rt=RegExp(["[A-Z\\xc0-\\xd6\\xd8-\\xde]?[a-z\\xdf-\\xf6\\xf8-\\xff]+(?:['\u2019](?:d|ll|m|re|s|t|ve))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde]|$)|(?:[A-Z\\xc0-\\xd6\\xd8-\\xde]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['\u2019](?:D|LL|M|RE|S|T|VE))?(?=[\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000]|[A-Z\\xc0-\\xd6\\xd8-\\xde](?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])|$)|[A-Z\\xc0-\\xd6\\xd8-\\xde]?(?:[a-z\\xdf-\\xf6\\xf8-\\xff]|[^\\ud800-\\udfff\\xac\\xb1\\xd7\\xf7\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf\\u2000-\\u206f \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\d+\\u2700-\\u27bfa-z\\xdf-\\xf6\\xf8-\\xffA-Z\\xc0-\\xd6\\xd8-\\xde])+(?:['\u2019](?:d|ll|m|re|s|t|ve))?|[A-Z\\xc0-\\xd6\\xd8-\\xde]+(?:['\u2019](?:D|LL|M|RE|S|T|VE))?|\\d+",Ot].join("|"),"g"),Wt=RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe23\\u20d0-\\u20f0\\ufe0e\\ufe0f]"),Bt=/[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,Lt="Array Buffer DataView Date Error Float32Array Float64Array Function Int8Array Int16Array Int32Array Map Math Object Promise Reflect RegExp Set String Symbol TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array WeakMap _ isFinite parseInt setTimeout".split(" "),Mt={};
Mt["[object Float32Array]"]=Mt["[object Float64Array]"]=Mt["[object Int8Array]"]=Mt["[object Int16Array]"]=Mt["[object Int32Array]"]=Mt["[object Uint8Array]"]=Mt["[object Uint8ClampedArray]"]=Mt["[object Uint16Array]"]=Mt["[object Uint32Array]"]=true,Mt["[object Arguments]"]=Mt["[object Array]"]=Mt["[object ArrayBuffer]"]=Mt["[object Boolean]"]=Mt["[object DataView]"]=Mt["[object Date]"]=Mt["[object Error]"]=Mt["[object Function]"]=Mt["[object Map]"]=Mt["[object Number]"]=Mt["[object Object]"]=Mt["[object RegExp]"]=Mt["[object Set]"]=Mt["[object String]"]=Mt["[object WeakMap]"]=false;
var Ct={};Ct["[object Arguments]"]=Ct["[object Array]"]=Ct["[object ArrayBuffer]"]=Ct["[object DataView]"]=Ct["[object Boolean]"]=Ct["[object Date]"]=Ct["[object Float32Array]"]=Ct["[object Float64Array]"]=Ct["[object Int8Array]"]=Ct["[object Int16Array]"]=Ct["[object Int32Array]"]=Ct["[object Map]"]=Ct["[object Number]"]=Ct["[object Object]"]=Ct["[object RegExp]"]=Ct["[object Set]"]=Ct["[object String]"]=Ct["[object Symbol]"]=Ct["[object Uint8Array]"]=Ct["[object Uint8ClampedArray]"]=Ct["[object Uint16Array]"]=Ct["[object Uint32Array]"]=true,
Ct["[object Error]"]=Ct["[object Function]"]=Ct["[object WeakMap]"]=false;var zt={"\xc0":"A","\xc1":"A","\xc2":"A","\xc3":"A","\xc4":"A","\xc5":"A","\xe0":"a","\xe1":"a","\xe2":"a","\xe3":"a","\xe4":"a","\xe5":"a","\xc7":"C","\xe7":"c","\xd0":"D","\xf0":"d","\xc8":"E","\xc9":"E","\xca":"E","\xcb":"E","\xe8":"e","\xe9":"e","\xea":"e","\xeb":"e","\xcc":"I","\xcd":"I","\xce":"I","\xcf":"I","\xec":"i","\xed":"i","\xee":"i","\xef":"i","\xd1":"N","\xf1":"n","\xd2":"O","\xd3":"O","\xd4":"O","\xd5":"O","\xd6":"O",
"\xd8":"O","\xf2":"o","\xf3":"o","\xf4":"o","\xf5":"o","\xf6":"o","\xf8":"o","\xd9":"U","\xda":"U","\xdb":"U","\xdc":"U","\xf9":"u","\xfa":"u","\xfb":"u","\xfc":"u","\xdd":"Y","\xfd":"y","\xff":"y","\xc6":"Ae","\xe6":"ae","\xde":"Th","\xfe":"th","\xdf":"ss"},Ut={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"},$t={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'","&#96;":"`"},Dt={"\\":"\\","'":"'","\n":"n","\r":"r","\u2028":"u2028","\u2029":"u2029"},Ft=parseFloat,Nt=parseInt,Pt=typeof exports=="object"&&exports,Zt=Pt&&typeof module=="object"&&module,Tt=Zt&&Zt.exports===Pt,qt=R(typeof self=="object"&&self),Vt=R(typeof this=="object"&&this),Kt=R(typeof global=="object"&&global)||qt||Vt||Function("return this")(),Gt=Z();
(qt||{})._=Gt,typeof define=="function"&&typeof define.amd=="object"&&define.amd? define(function(){return Gt}):Zt?((Zt.exports=Gt)._=Gt,Pt._=Gt):Kt._=Gt}).call(this);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
(function (process,global){
/*
	This is rot.js, the ROguelike Toolkit in JavaScript.
	Version 0.6~dev, generated on Mon Nov 30 10:34:42 CET 2015.
*/
/**
 * Add objects for Node.js environment
 */
global.requestAnimationFrame = function(cb) {
	return setTimeout(cb, 1000/60);
};

global.document = {
	body: {
		appendChild: function(child) {},
		scrollLeft: 0,
		scrollTop: 0
	},
	createElement: function(type) {
		var canvas;
		return canvas = {
			getBoundingClientRect: function() {
				var rect;
				return rect = {
					left: 0,
					top: 0
				};
			},
			getContext: function(type) {
				var context;
				return context = {
					_termcolor: null,
					beginPath: function() {},
					canvas: canvas,
					clearRect: function(x, y, w, h) {
						if(this._termcolor !== null) {
							var clearCmd = this._termcolor.clearToAnsi(this.fillStyle);
							process.stdout.write(clearCmd);
						}
					},
					drawImage: function(a, b, c, d, e, f, g, h, i) {},
					fill: function() {},
					fillRect: function(x, y, w, h) {
						if(this._termcolor !== null) {
							var clearCmd = this._termcolor.clearToAnsi(this.fillStyle);
							process.stdout.write(clearCmd);
						}
					},
					fillStyle: "#000",
					fillText: function(chs, x, y) {},
					font: "monospace",
					lineTo: function(x, y) {},
					measureText: function(ch) {
						var result;
						return result = {
							width: 12
						};
					},
					moveTo: function(x, y) {},
					textAlign: "center",
					textBaseline: "middle"
				};
			},
			height: 0,
			style: {
				left: "100px",
				position: "absolute",
				top: "100px",
				visibility: "hidden"
			},
			width: 0
		};
	},
	documentElement: {
		scrollLeft: 0,
		scrollTop: 0
	}
};
/**
 * @namespace Top-level ROT namespace
 */
var ROT = {
	/**
	 * @returns {bool} Is rot.js supported by this browser?
	 */
	isSupported: function() {
		return !!(document.createElement("canvas").getContext && Function.prototype.bind);
	},

	/** Default with for display and map generators */
	DEFAULT_WIDTH: 80,
	/** Default height for display and map generators */
	DEFAULT_HEIGHT: 25,

	/** Directional constants. Ordering is important! */
	DIRS: {
		"4": [
			[ 0, -1],
			[ 1,  0],
			[ 0,  1],
			[-1,  0]
		],
		"8": [
			[ 0, -1],
			[ 1, -1],
			[ 1,  0],
			[ 1,  1],
			[ 0,  1],
			[-1,  1],
			[-1,  0],
			[-1, -1]
		],
		"6": [
			[-1, -1],
			[ 1, -1],
			[ 2,  0],
			[ 1,  1],
			[-1,  1],
			[-2,  0]
		]
	},

	/** Cancel key. */
	VK_CANCEL: 3, 
	/** Help key. */
	VK_HELP: 6, 
	/** Backspace key. */
	VK_BACK_SPACE: 8, 
	/** Tab key. */
	VK_TAB: 9, 
	/** 5 key on Numpad when NumLock is unlocked. Or on Mac, clear key which is positioned at NumLock key. */
	VK_CLEAR: 12, 
	/** Return/enter key on the main keyboard. */
	VK_RETURN: 13, 
	/** Reserved, but not used. */
	VK_ENTER: 14, 
	/** Shift key. */
	VK_SHIFT: 16, 
	/** Control key. */
	VK_CONTROL: 17, 
	/** Alt (Option on Mac) key. */
	VK_ALT: 18, 
	/** Pause key. */
	VK_PAUSE: 19, 
	/** Caps lock. */
	VK_CAPS_LOCK: 20, 
	/** Escape key. */
	VK_ESCAPE: 27, 
	/** Space bar. */
	VK_SPACE: 32, 
	/** Page Up key. */
	VK_PAGE_UP: 33, 
	/** Page Down key. */
	VK_PAGE_DOWN: 34, 
	/** End key. */
	VK_END: 35, 
	/** Home key. */
	VK_HOME: 36, 
	/** Left arrow. */
	VK_LEFT: 37, 
	/** Up arrow. */
	VK_UP: 38, 
	/** Right arrow. */
	VK_RIGHT: 39, 
	/** Down arrow. */
	VK_DOWN: 40, 
	/** Print Screen key. */
	VK_PRINTSCREEN: 44, 
	/** Ins(ert) key. */
	VK_INSERT: 45, 
	/** Del(ete) key. */
	VK_DELETE: 46, 
	/***/
	VK_0: 48,
	/***/
	VK_1: 49,
	/***/
	VK_2: 50,
	/***/
	VK_3: 51,
	/***/
	VK_4: 52,
	/***/
	VK_5: 53,
	/***/
	VK_6: 54,
	/***/
	VK_7: 55,
	/***/
	VK_8: 56,
	/***/
	VK_9: 57,
	/** Colon (:) key. Requires Gecko 15.0 */
	VK_COLON: 58, 
	/** Semicolon (;) key. */
	VK_SEMICOLON: 59, 
	/** Less-than (<) key. Requires Gecko 15.0 */
	VK_LESS_THAN: 60, 
	/** Equals (=) key. */
	VK_EQUALS: 61, 
	/** Greater-than (>) key. Requires Gecko 15.0 */
	VK_GREATER_THAN: 62, 
	/** Question mark (?) key. Requires Gecko 15.0 */
	VK_QUESTION_MARK: 63, 
	/** Atmark (@) key. Requires Gecko 15.0 */
	VK_AT: 64, 
	/***/
	VK_A: 65,
	/***/
	VK_B: 66,
	/***/
	VK_C: 67,
	/***/
	VK_D: 68,
	/***/
	VK_E: 69,
	/***/
	VK_F: 70,
	/***/
	VK_G: 71,
	/***/
	VK_H: 72,
	/***/
	VK_I: 73,
	/***/
	VK_J: 74,
	/***/
	VK_K: 75,
	/***/
	VK_L: 76,
	/***/
	VK_M: 77,
	/***/
	VK_N: 78,
	/***/
	VK_O: 79,
	/***/
	VK_P: 80,
	/***/
	VK_Q: 81,
	/***/
	VK_R: 82,
	/***/
	VK_S: 83,
	/***/
	VK_T: 84,
	/***/
	VK_U: 85,
	/***/
	VK_V: 86,
	/***/
	VK_W: 87,
	/***/
	VK_X: 88,
	/***/
	VK_Y: 89,
	/***/
	VK_Z: 90,
	/***/
	VK_CONTEXT_MENU: 93,
	/** 0 on the numeric keypad. */
	VK_NUMPAD0: 96, 
	/** 1 on the numeric keypad. */
	VK_NUMPAD1: 97, 
	/** 2 on the numeric keypad. */
	VK_NUMPAD2: 98, 
	/** 3 on the numeric keypad. */
	VK_NUMPAD3: 99, 
	/** 4 on the numeric keypad. */
	VK_NUMPAD4: 100, 
	/** 5 on the numeric keypad. */
	VK_NUMPAD5: 101, 
	/** 6 on the numeric keypad. */
	VK_NUMPAD6: 102, 
	/** 7 on the numeric keypad. */
	VK_NUMPAD7: 103, 
	/** 8 on the numeric keypad. */
	VK_NUMPAD8: 104, 
	/** 9 on the numeric keypad. */
	VK_NUMPAD9: 105, 
	/** * on the numeric keypad. */
	VK_MULTIPLY: 106,
	/** + on the numeric keypad. */
	VK_ADD: 107, 
	/***/
	VK_SEPARATOR: 108,
	/** - on the numeric keypad. */
	VK_SUBTRACT: 109, 
	/** Decimal point on the numeric keypad. */
	VK_DECIMAL: 110, 
	/** / on the numeric keypad. */
	VK_DIVIDE: 111, 
	/** F1 key. */
	VK_F1: 112, 
	/** F2 key. */
	VK_F2: 113, 
	/** F3 key. */
	VK_F3: 114, 
	/** F4 key. */
	VK_F4: 115, 
	/** F5 key. */
	VK_F5: 116, 
	/** F6 key. */
	VK_F6: 117, 
	/** F7 key. */
	VK_F7: 118, 
	/** F8 key. */
	VK_F8: 119, 
	/** F9 key. */
	VK_F9: 120, 
	/** F10 key. */
	VK_F10: 121, 
	/** F11 key. */
	VK_F11: 122, 
	/** F12 key. */
	VK_F12: 123, 
	/** F13 key. */
	VK_F13: 124, 
	/** F14 key. */
	VK_F14: 125, 
	/** F15 key. */
	VK_F15: 126, 
	/** F16 key. */
	VK_F16: 127, 
	/** F17 key. */
	VK_F17: 128, 
	/** F18 key. */
	VK_F18: 129, 
	/** F19 key. */
	VK_F19: 130, 
	/** F20 key. */
	VK_F20: 131, 
	/** F21 key. */
	VK_F21: 132, 
	/** F22 key. */
	VK_F22: 133, 
	/** F23 key. */
	VK_F23: 134, 
	/** F24 key. */
	VK_F24: 135, 
	/** Num Lock key. */
	VK_NUM_LOCK: 144, 
	/** Scroll Lock key. */
	VK_SCROLL_LOCK: 145, 
	/** Circumflex (^) key. Requires Gecko 15.0 */
	VK_CIRCUMFLEX: 160, 
	/** Exclamation (!) key. Requires Gecko 15.0 */
	VK_EXCLAMATION: 161, 
	/** Double quote () key. Requires Gecko 15.0 */
	VK_DOUBLE_QUOTE: 162, 
	/** Hash (#) key. Requires Gecko 15.0 */
	VK_HASH: 163, 
	/** Dollar sign ($) key. Requires Gecko 15.0 */
	VK_DOLLAR: 164, 
	/** Percent (%) key. Requires Gecko 15.0 */
	VK_PERCENT: 165, 
	/** Ampersand (&) key. Requires Gecko 15.0 */
	VK_AMPERSAND: 166, 
	/** Underscore (_) key. Requires Gecko 15.0 */
	VK_UNDERSCORE: 167, 
	/** Open parenthesis (() key. Requires Gecko 15.0 */
	VK_OPEN_PAREN: 168, 
	/** Close parenthesis ()) key. Requires Gecko 15.0 */
	VK_CLOSE_PAREN: 169, 
	/* Asterisk (*) key. Requires Gecko 15.0 */
	VK_ASTERISK: 170,
	/** Plus (+) key. Requires Gecko 15.0 */
	VK_PLUS: 171, 
	/** Pipe (|) key. Requires Gecko 15.0 */
	VK_PIPE: 172, 
	/** Hyphen-US/docs/Minus (-) key. Requires Gecko 15.0 */
	VK_HYPHEN_MINUS: 173, 
	/** Open curly bracket ({) key. Requires Gecko 15.0 */
	VK_OPEN_CURLY_BRACKET: 174, 
	/** Close curly bracket (}) key. Requires Gecko 15.0 */
	VK_CLOSE_CURLY_BRACKET: 175, 
	/** Tilde (~) key. Requires Gecko 15.0 */
	VK_TILDE: 176, 
	/** Comma (,) key. */
	VK_COMMA: 188, 
	/** Period (.) key. */
	VK_PERIOD: 190, 
	/** Slash (/) key. */
	VK_SLASH: 191, 
	/** Back tick (`) key. */
	VK_BACK_QUOTE: 192, 
	/** Open square bracket ([) key. */
	VK_OPEN_BRACKET: 219, 
	/** Back slash (\) key. */
	VK_BACK_SLASH: 220, 
	/** Close square bracket (]) key. */
	VK_CLOSE_BRACKET: 221, 
	/** Quote (''') key. */
	VK_QUOTE: 222, 
	/** Meta key on Linux, Command key on Mac. */
	VK_META: 224, 
	/** AltGr key on Linux. Requires Gecko 15.0 */
	VK_ALTGR: 225, 
	/** Windows logo key on Windows. Or Super or Hyper key on Linux. Requires Gecko 15.0 */
	VK_WIN: 91, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_KANA: 21, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_HANGUL: 21, 
	/** 英数 key on Japanese Mac keyboard. Requires Gecko 15.0 */
	VK_EISU: 22, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_JUNJA: 23, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_FINAL: 24, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_HANJA: 25, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_KANJI: 25, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_CONVERT: 28, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_NONCONVERT: 29, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_ACCEPT: 30, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_MODECHANGE: 31, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_SELECT: 41, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_PRINT: 42, 
	/** Linux support for this keycode was added in Gecko 4.0. */
	VK_EXECUTE: 43, 
	/** Linux support for this keycode was added in Gecko 4.0.	 */
	VK_SLEEP: 95 
};
/**
 * @namespace
 * Contains text tokenization and breaking routines
 */
ROT.Text = {
	RE_COLORS: /%([bc]){([^}]*)}/g,

	/* token types */
	TYPE_TEXT:		0,
	TYPE_NEWLINE:	1,
	TYPE_FG:		2,
	TYPE_BG:		3,

	/**
	 * Measure size of a resulting text block
	 */
	measure: function(str, maxWidth) {
		var result = {width:0, height:1};
		var tokens = this.tokenize(str, maxWidth);
		var lineWidth = 0;

		for (var i=0;i<tokens.length;i++) {
			var token = tokens[i];
			switch (token.type) {
				case this.TYPE_TEXT:
					lineWidth += token.value.length;
				break;

				case this.TYPE_NEWLINE:
					result.height++;
					result.width = Math.max(result.width, lineWidth);
					lineWidth = 0;
				break;
			}
		}
		result.width = Math.max(result.width, lineWidth);

		return result;
	},

	/**
	 * Convert string to a series of a formatting commands
	 */
	tokenize: function(str, maxWidth) {
		var result = [];

		/* first tokenization pass - split texts and color formatting commands */
		var offset = 0;
		str.replace(this.RE_COLORS, function(match, type, name, index) {
			/* string before */
			var part = str.substring(offset, index);
			if (part.length) {
				result.push({
					type: ROT.Text.TYPE_TEXT,
					value: part
				});
			}

			/* color command */
			result.push({
				type: (type == "c" ? ROT.Text.TYPE_FG : ROT.Text.TYPE_BG),
				value: name.trim()
			});

			offset = index + match.length;
			return "";
		});

		/* last remaining part */
		var part = str.substring(offset);
		if (part.length) {
			result.push({
				type: ROT.Text.TYPE_TEXT,
				value: part
			});
		}

		return this._breakLines(result, maxWidth);
	},

	/* insert line breaks into first-pass tokenized data */
	_breakLines: function(tokens, maxWidth) {
		if (!maxWidth) { maxWidth = Infinity; };

		var i = 0;
		var lineLength = 0;
		var lastTokenWithSpace = -1;

		while (i < tokens.length) { /* take all text tokens, remove space, apply linebreaks */
			var token = tokens[i];
			if (token.type == ROT.Text.TYPE_NEWLINE) { /* reset */
				lineLength = 0; 
				lastTokenWithSpace = -1;
			}
			if (token.type != ROT.Text.TYPE_TEXT) { /* skip non-text tokens */
				i++;
				continue; 
			}

			/* remove spaces at the beginning of line */
			while (lineLength == 0 && token.value.charAt(0) == " ") { token.value = token.value.substring(1); }

			/* forced newline? insert two new tokens after this one */
			var index = token.value.indexOf("\n");
			if (index != -1) { 
				token.value = this._breakInsideToken(tokens, i, index, true); 

				/* if there are spaces at the end, we must remove them (we do not want the line too long) */
				var arr = token.value.split("");
				while (arr.length && arr[arr.length-1] == " ") { arr.pop(); }
				token.value = arr.join("");
			}

			/* token degenerated? */
			if (!token.value.length) {
				tokens.splice(i, 1);
				continue;
			}

			if (lineLength + token.value.length > maxWidth) { /* line too long, find a suitable breaking spot */

				/* is it possible to break within this token? */
				var index = -1;
				while (1) {
					var nextIndex = token.value.indexOf(" ", index+1);
					if (nextIndex == -1) { break; }
					if (lineLength + nextIndex > maxWidth) { break; }
					index = nextIndex;
				}

				if (index != -1) { /* break at space within this one */
					token.value = this._breakInsideToken(tokens, i, index, true);
				} else if (lastTokenWithSpace != -1) { /* is there a previous token where a break can occur? */
					var token = tokens[lastTokenWithSpace];
					var breakIndex = token.value.lastIndexOf(" ");
					token.value = this._breakInsideToken(tokens, lastTokenWithSpace, breakIndex, true);
					i = lastTokenWithSpace;
				} else { /* force break in this token */
					token.value = this._breakInsideToken(tokens, i, maxWidth-lineLength, false);
				}

			} else { /* line not long, continue */
				lineLength += token.value.length;
				if (token.value.indexOf(" ") != -1) { lastTokenWithSpace = i; }
			}
			
			i++; /* advance to next token */
		}


		tokens.push({type: ROT.Text.TYPE_NEWLINE}); /* insert fake newline to fix the last text line */

		/* remove trailing space from text tokens before newlines */
		var lastTextToken = null;
		for (var i=0;i<tokens.length;i++) {
			var token = tokens[i];
			switch (token.type) {
				case ROT.Text.TYPE_TEXT: lastTextToken = token; break;
				case ROT.Text.TYPE_NEWLINE: 
					if (lastTextToken) { /* remove trailing space */
						var arr = lastTextToken.value.split("");
						while (arr.length && arr[arr.length-1] == " ") { arr.pop(); }
						lastTextToken.value = arr.join("");
					}
					lastTextToken = null;
				break;
			}
		}

		tokens.pop(); /* remove fake token */

		return tokens;
	},

	/**
	 * Create new tokens and insert them into the stream
	 * @param {object[]} tokens
	 * @param {int} tokenIndex Token being processed
	 * @param {int} breakIndex Index within current token's value
	 * @param {bool} removeBreakChar Do we want to remove the breaking character?
	 * @returns {string} remaining unbroken token value
	 */
	_breakInsideToken: function(tokens, tokenIndex, breakIndex, removeBreakChar) {
		var newBreakToken = {
			type: ROT.Text.TYPE_NEWLINE
		}
		var newTextToken = {
			type: ROT.Text.TYPE_TEXT,
			value: tokens[tokenIndex].value.substring(breakIndex + (removeBreakChar ? 1 : 0))
		}
		tokens.splice(tokenIndex+1, 0, newBreakToken, newTextToken);
		return tokens[tokenIndex].value.substring(0, breakIndex);
	}
}
/**
 * @returns {any} Randomly picked item, null when length=0
 */
Array.prototype.random = Array.prototype.random || function() {
	if (!this.length) { return null; }
	return this[Math.floor(ROT.RNG.getUniform() * this.length)];
}

/**
 * @returns {array} New array with randomized items
 * FIXME destroys this!
 */
Array.prototype.randomize = Array.prototype.randomize || function() {
	var result = [];
	while (this.length) {
		var index = this.indexOf(this.random());
		result.push(this.splice(index, 1)[0]);
	}
	return result;
}
/**
 * Always positive modulus
 * @param {int} n Modulus
 * @returns {int} this modulo n
 */
Number.prototype.mod = Number.prototype.mod || function(n) {
	return ((this%n)+n)%n;
}
/**
 * @returns {string} First letter capitalized
 */
String.prototype.capitalize = String.prototype.capitalize || function() {
	return this.charAt(0).toUpperCase() + this.substring(1);
}

/** 
 * Left pad
 * @param {string} [character="0"]
 * @param {int} [count=2]
 */
String.prototype.lpad = String.prototype.lpad || function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return s+this;
}

/** 
 * Right pad
 * @param {string} [character="0"]
 * @param {int} [count=2]
 */
String.prototype.rpad = String.prototype.rpad || function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return this+s;
}

/**
 * Format a string in a flexible way. Scans for %s strings and replaces them with arguments. List of patterns is modifiable via String.format.map.
 * @param {string} template
 * @param {any} [argv]
 */
String.format = String.format || function(template) {
	var map = String.format.map;
	var args = Array.prototype.slice.call(arguments, 1);

	var replacer = function(match, group1, group2, index) {
		if (template.charAt(index-1) == "%") { return match.substring(1); }
		if (!args.length) { return match; }
		var obj = args[0];

		var group = group1 || group2;
		var parts = group.split(",");
		var name = parts.shift();
		var method = map[name.toLowerCase()];
		if (!method) { return match; }

		var obj = args.shift();
		var replaced = obj[method].apply(obj, parts);

		var first = name.charAt(0);
		if (first != first.toLowerCase()) { replaced = replaced.capitalize(); }

		return replaced;
	}
	return template.replace(/%(?:([a-z]+)|(?:{([^}]+)}))/gi, replacer);
}

String.format.map = String.format.map || {
	"s": "toString"
}

/**
 * Convenience shortcut to String.format(this)
 */
String.prototype.format = String.prototype.format || function() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift(this);
	return String.format.apply(String, args);
}

if (!Object.create) {  
	/**
	 * ES5 Object.create
	 */
	Object.create = function(o) {  
		var tmp = function() {};
		tmp.prototype = o;
		return new tmp();
	};  
}  
/**
 * Sets prototype of this function to an instance of parent function
 * @param {function} parent
 */
Function.prototype.extend = Function.prototype.extend || function(parent) {
	this.prototype = Object.create(parent.prototype);
	this.prototype.constructor = this;
	return this;
}
if (typeof window != "undefined") {
	window.requestAnimationFrame =
		window.requestAnimationFrame
		|| window.mozRequestAnimationFrame
		|| window.webkitRequestAnimationFrame
		|| window.oRequestAnimationFrame
		|| window.msRequestAnimationFrame
		|| function(cb) { return setTimeout(cb, 1000/60); };

	window.cancelAnimationFrame =
		window.cancelAnimationFrame
		|| window.mozCancelAnimationFrame
		|| window.webkitCancelAnimationFrame
		|| window.oCancelAnimationFrame
		|| window.msCancelAnimationFrame
		|| function(id) { return clearTimeout(id); };
}
/**
 * @class Visual map display
 * @param {object} [options]
 * @param {int} [options.width=ROT.DEFAULT_WIDTH]
 * @param {int} [options.height=ROT.DEFAULT_HEIGHT]
 * @param {int} [options.fontSize=15]
 * @param {string} [options.fontFamily="monospace"]
 * @param {string} [options.fontStyle=""] bold/italic/none/both
 * @param {string} [options.fg="#ccc"]
 * @param {string} [options.bg="#000"]
 * @param {float} [options.spacing=1]
 * @param {float} [options.border=0]
 * @param {string} [options.layout="rect"]
 * @param {bool} [options.forceSquareRatio=false]
 * @param {int} [options.tileWidth=32]
 * @param {int} [options.tileHeight=32]
 * @param {object} [options.tileMap={}]
 * @param {image} [options.tileSet=null]
 * @param {image} [options.tileColorize=false]
 */
ROT.Display = function(options) {
	var canvas = document.createElement("canvas");
	this._context = canvas.getContext("2d");
	this._data = {};
	this._dirty = false; /* false = nothing, true = all, object = dirty cells */
	this._options = {};
	this._backend = null;
	
	var defaultOptions = {
		width: ROT.DEFAULT_WIDTH,
		height: ROT.DEFAULT_HEIGHT,
		transpose: false,
		layout: "rect",
		fontSize: 15,
		spacing: 1,
		border: 0,
		forceSquareRatio: false,
		fontFamily: "monospace",
		fontStyle: "",
		fg: "#ccc",
		bg: "#000",
		tileWidth: 32,
		tileHeight: 32,
		tileMap: {},
		tileSet: null,
		tileColorize: false,
		termColor: "xterm"
	};
	for (var p in options) { defaultOptions[p] = options[p]; }
	this.setOptions(defaultOptions);
	this.DEBUG = this.DEBUG.bind(this);

	this._tick = this._tick.bind(this);
	requestAnimationFrame(this._tick);
}

/**
 * Debug helper, ideal as a map generator callback. Always bound to this.
 * @param {int} x
 * @param {int} y
 * @param {int} what
 */
ROT.Display.prototype.DEBUG = function(x, y, what) {
	var colors = [this._options.bg, this._options.fg];
	this.draw(x, y, null, null, colors[what % colors.length]);
}

/**
 * Clear the whole display (cover it with background color)
 */
ROT.Display.prototype.clear = function() {
	this._data = {};
	this._dirty = true;
}

/**
 * @see ROT.Display
 */
ROT.Display.prototype.setOptions = function(options) {
	for (var p in options) { this._options[p] = options[p]; }
	if (options.width || options.height || options.fontSize || options.fontFamily || options.spacing || options.layout) {
		if (options.layout) { 
			this._backend = new ROT.Display[options.layout.capitalize()](this._context);
		}

		var font = (this._options.fontStyle ? this._options.fontStyle + " " : "") + this._options.fontSize + "px " + this._options.fontFamily;
		this._context.font = font;
		this._backend.compute(this._options);
		this._context.font = font;
		this._context.textAlign = "center";
		this._context.textBaseline = "middle";
		this._dirty = true;
	}
	return this;
}

/**
 * Returns currently set options
 * @returns {object} Current options object 
 */
ROT.Display.prototype.getOptions = function() {
	return this._options;
}

/**
 * Returns the DOM node of this display
 * @returns {node} DOM node
 */
ROT.Display.prototype.getContainer = function() {
	return this._context.canvas;
}

/**
 * Compute the maximum width/height to fit into a set of given constraints
 * @param {int} availWidth Maximum allowed pixel width
 * @param {int} availHeight Maximum allowed pixel height
 * @returns {int[2]} cellWidth,cellHeight
 */
ROT.Display.prototype.computeSize = function(availWidth, availHeight) {
	return this._backend.computeSize(availWidth, availHeight, this._options);
}

/**
 * Compute the maximum font size to fit into a set of given constraints
 * @param {int} availWidth Maximum allowed pixel width
 * @param {int} availHeight Maximum allowed pixel height
 * @returns {int} fontSize
 */
ROT.Display.prototype.computeFontSize = function(availWidth, availHeight) {
	return this._backend.computeFontSize(availWidth, availHeight, this._options);
}

/**
 * Convert a DOM event (mouse or touch) to map coordinates. Uses first touch for multi-touch.
 * @param {Event} e event
 * @returns {int[2]} -1 for values outside of the canvas
 */
ROT.Display.prototype.eventToPosition = function(e) {
	if (e.touches) {
		var x = e.touches[0].clientX;
		var y = e.touches[0].clientY;
	} else {
		var x = e.clientX;
		var y = e.clientY;
	}

	var rect = this._context.canvas.getBoundingClientRect();
	x -= rect.left;
	y -= rect.top;
	
	if (x < 0 || y < 0 || x >= this._context.canvas.width || y >= this._context.canvas.height) { return [-1, -1]; }

	return this._backend.eventToPosition(x, y);
}

/**
 * @param {int} x
 * @param {int} y
 * @param {string || string[]} ch One or more chars (will be overlapping themselves)
 * @param {string} [fg] foreground color
 * @param {string} [bg] background color
 */
ROT.Display.prototype.draw = function(x, y, ch, fg, bg) {
	if (!fg) { fg = this._options.fg; }
	if (!bg) { bg = this._options.bg; }
	this._data[x+","+y] = [x, y, ch, fg, bg];
	
	if (this._dirty === true) { return; } /* will already redraw everything */
	if (!this._dirty) { this._dirty = {}; } /* first! */
	this._dirty[x+","+y] = true;
}

/**
 * Draws a text at given position. Optionally wraps at a maximum length. Currently does not work with hex layout.
 * @param {int} x
 * @param {int} y
 * @param {string} text May contain color/background format specifiers, %c{name}/%b{name}, both optional. %c{}/%b{} resets to default.
 * @param {int} [maxWidth] wrap at what width?
 * @returns {int} lines drawn
 */
ROT.Display.prototype.drawText = function(x, y, text, maxWidth) {
	var fg = null;
	var bg = null;
	var cx = x;
	var cy = y;
	var lines = 1;
	if (!maxWidth) { maxWidth = this._options.width-x; }

	var tokens = ROT.Text.tokenize(text, maxWidth);

	while (tokens.length) { /* interpret tokenized opcode stream */
		var token = tokens.shift();
		switch (token.type) {
			case ROT.Text.TYPE_TEXT:
				var isSpace = false, isPrevSpace = false, isFullWidth = false, isPrevFullWidth = false;
				for (var i=0;i<token.value.length;i++) {
					var cc = token.value.charCodeAt(i);
					var c = token.value.charAt(i);
					// Assign to `true` when the current char is full-width.
					isFullWidth = (cc > 0xff && cc < 0xff61) || (cc > 0xffdc && cc < 0xffe8) && cc > 0xffee;
					// Current char is space, whatever full-width or half-width both are OK.
					isSpace = (c.charCodeAt(0) == 0x20 || c.charCodeAt(0) == 0x3000);
					// The previous char is full-width and
					// current char is nether half-width nor a space.
					if (isPrevFullWidth && !isFullWidth && !isSpace) { cx++; } // add an extra position
					// The current char is full-width and
					// the previous char is not a space.
					if(isFullWidth && !isPrevSpace) { cx++; } // add an extra position
					this.draw(cx++, cy, c, fg, bg);
					isPrevSpace = isSpace;
					isPrevFullWidth = isFullWidth;
				}
			break;

			case ROT.Text.TYPE_FG:
				fg = token.value || null;
			break;

			case ROT.Text.TYPE_BG:
				bg = token.value || null;
			break;

			case ROT.Text.TYPE_NEWLINE:
				cx = x;
				cy++;
				lines++
			break;
		}
	}

	return lines;
}

/**
 * Timer tick: update dirty parts
 */
ROT.Display.prototype._tick = function() {
	requestAnimationFrame(this._tick);

	if (!this._dirty) { return; }

	if (this._dirty === true) { /* draw all */
		this._context.fillStyle = this._options.bg;
		this._context.fillRect(0, 0, this._context.canvas.width, this._context.canvas.height);

		for (var id in this._data) { /* redraw cached data */
			this._draw(id, false);
		}

	} else { /* draw only dirty */
		for (var key in this._dirty) {
			this._draw(key, true);
		}
	}

	this._dirty = false;
}

/**
 * @param {string} key What to draw
 * @param {bool} clearBefore Is it necessary to clean before?
 */
ROT.Display.prototype._draw = function(key, clearBefore) {
	var data = this._data[key];
	if (data[4] != this._options.bg) { clearBefore = true; }

	this._backend.draw(data, clearBefore);
}
/**
 * @class Abstract display backend module
 * @private
 */
ROT.Display.Backend = function(context) {
	this._context = context;
}

ROT.Display.Backend.prototype.compute = function(options) {
}

ROT.Display.Backend.prototype.draw = function(data, clearBefore) {
}

ROT.Display.Backend.prototype.computeSize = function(availWidth, availHeight) {
}

ROT.Display.Backend.prototype.computeFontSize = function(availWidth, availHeight) {
}

ROT.Display.Backend.prototype.eventToPosition = function(x, y) {
}
/**
 * @class Rectangular backend
 * @private
 */
ROT.Display.Rect = function(context) {
	ROT.Display.Backend.call(this, context);
	
	this._spacingX = 0;
	this._spacingY = 0;
	this._canvasCache = {};
	this._options = {};
}
ROT.Display.Rect.extend(ROT.Display.Backend);

ROT.Display.Rect.cache = false;

ROT.Display.Rect.prototype.compute = function(options) {
	this._canvasCache = {};
	this._options = options;

	var charWidth = Math.ceil(this._context.measureText("W").width);
	this._spacingX = Math.ceil(options.spacing * charWidth);
	this._spacingY = Math.ceil(options.spacing * options.fontSize);

	if (this._options.forceSquareRatio) {
		this._spacingX = this._spacingY = Math.max(this._spacingX, this._spacingY);
	}

	this._context.canvas.width = options.width * this._spacingX;
	this._context.canvas.height = options.height * this._spacingY;
}

ROT.Display.Rect.prototype.draw = function(data, clearBefore) {
	if (this.constructor.cache) {
		this._drawWithCache(data, clearBefore);
	} else {
		this._drawNoCache(data, clearBefore);
	}
}

ROT.Display.Rect.prototype._drawWithCache = function(data, clearBefore) {
	var x = data[0];
	var y = data[1];
	var ch = data[2];
	var fg = data[3];
	var bg = data[4];

	var hash = ""+ch+fg+bg;
	if (hash in this._canvasCache) {
		var canvas = this._canvasCache[hash];
	} else {
		var b = this._options.border;
		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");
		canvas.width = this._spacingX;
		canvas.height = this._spacingY;
		ctx.fillStyle = bg;
		ctx.fillRect(b, b, canvas.width-b, canvas.height-b);
		
		if (ch) {
			ctx.fillStyle = fg;
			ctx.font = this._context.font;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			var chars = [].concat(ch);
			for (var i=0;i<chars.length;i++) {
				ctx.fillText(chars[i], this._spacingX/2, Math.ceil(this._spacingY/2));
			}
		}
		this._canvasCache[hash] = canvas;
	}
	
	this._context.drawImage(canvas, x*this._spacingX, y*this._spacingY);
}

ROT.Display.Rect.prototype._drawNoCache = function(data, clearBefore) {
	var x = data[0];
	var y = data[1];
	var ch = data[2];
	var fg = data[3];
	var bg = data[4];

	if (clearBefore) { 
		var b = this._options.border;
		this._context.fillStyle = bg;
		this._context.fillRect(x*this._spacingX + b, y*this._spacingY + b, this._spacingX - b, this._spacingY - b);
	}
	
	if (!ch) { return; }

	this._context.fillStyle = fg;

	var chars = [].concat(ch);
	for (var i=0;i<chars.length;i++) {
		this._context.fillText(chars[i], (x+0.5) * this._spacingX, Math.ceil((y+0.5) * this._spacingY));
	}
}

ROT.Display.Rect.prototype.computeSize = function(availWidth, availHeight) {
	var width = Math.floor(availWidth / this._spacingX);
	var height = Math.floor(availHeight / this._spacingY);
	return [width, height];
}

ROT.Display.Rect.prototype.computeFontSize = function(availWidth, availHeight) {
	var boxWidth = Math.floor(availWidth / this._options.width);
	var boxHeight = Math.floor(availHeight / this._options.height);

	/* compute char ratio */
	var oldFont = this._context.font;
	this._context.font = "100px " + this._options.fontFamily;
	var width = Math.ceil(this._context.measureText("W").width);
	this._context.font = oldFont;
	var ratio = width / 100;
		
	var widthFraction = ratio * boxHeight / boxWidth;
	if (widthFraction > 1) { /* too wide with current aspect ratio */
		boxHeight = Math.floor(boxHeight / widthFraction);
	}
	return Math.floor(boxHeight / this._options.spacing);
}

ROT.Display.Rect.prototype.eventToPosition = function(x, y) {
	return [Math.floor(x/this._spacingX), Math.floor(y/this._spacingY)];
}
/**
 * @class Hexagonal backend
 * @private
 */
ROT.Display.Hex = function(context) {
	ROT.Display.Backend.call(this, context);

	this._spacingX = 0;
	this._spacingY = 0;
	this._hexSize = 0;
	this._options = {};
}
ROT.Display.Hex.extend(ROT.Display.Backend);

ROT.Display.Hex.prototype.compute = function(options) {
	this._options = options;

	/* FIXME char size computation does not respect transposed hexes */
	var charWidth = Math.ceil(this._context.measureText("W").width);
	this._hexSize = Math.floor(options.spacing * (options.fontSize + charWidth/Math.sqrt(3)) / 2);
	this._spacingX = this._hexSize * Math.sqrt(3) / 2;
	this._spacingY = this._hexSize * 1.5;

	if (options.transpose) {
		var xprop = "height";
		var yprop = "width";
	} else {
		var xprop = "width";
		var yprop = "height";
	}
	this._context.canvas[xprop] = Math.ceil( (options.width + 1) * this._spacingX );
	this._context.canvas[yprop] = Math.ceil( (options.height - 1) * this._spacingY + 2*this._hexSize );
}

ROT.Display.Hex.prototype.draw = function(data, clearBefore) {
	var x = data[0];
	var y = data[1];
	var ch = data[2];
	var fg = data[3];
	var bg = data[4];

	var px = [
		(x+1) * this._spacingX,
		y * this._spacingY + this._hexSize
	];
	if (this._options.transpose) { px.reverse(); }

	if (clearBefore) { 
		this._context.fillStyle = bg;
		this._fill(px[0], px[1]);
	}
	
	if (!ch) { return; }

	this._context.fillStyle = fg;

	var chars = [].concat(ch);
	for (var i=0;i<chars.length;i++) {
		this._context.fillText(chars[i], px[0], Math.ceil(px[1]));
	}
}

ROT.Display.Hex.prototype.computeSize = function(availWidth, availHeight) {
	if (this._options.transpose) {
		availWidth += availHeight;
		availHeight = availWidth - availHeight;
		availWidth -= availHeight;
	}

	var width = Math.floor(availWidth / this._spacingX) - 1;
	var height = Math.floor((availHeight - 2*this._hexSize) / this._spacingY + 1);
	return [width, height];
}

ROT.Display.Hex.prototype.computeFontSize = function(availWidth, availHeight) {
	if (this._options.transpose) {
		availWidth += availHeight;
		availHeight = availWidth - availHeight;
		availWidth -= availHeight;
	}

	var hexSizeWidth = 2*availWidth / ((this._options.width+1) * Math.sqrt(3)) - 1;
	var hexSizeHeight = availHeight / (2 + 1.5*(this._options.height-1));
	var hexSize = Math.min(hexSizeWidth, hexSizeHeight);

	/* compute char ratio */
	var oldFont = this._context.font;
	this._context.font = "100px " + this._options.fontFamily;
	var width = Math.ceil(this._context.measureText("W").width);
	this._context.font = oldFont;
	var ratio = width / 100;

	hexSize = Math.floor(hexSize)+1; /* closest larger hexSize */

	/* FIXME char size computation does not respect transposed hexes */
	var fontSize = 2*hexSize / (this._options.spacing * (1 + ratio / Math.sqrt(3)));

	/* closest smaller fontSize */
	return Math.ceil(fontSize)-1;
}

ROT.Display.Hex.prototype.eventToPosition = function(x, y) {
	if (this._options.transpose) {
		x += y;
		y = x-y;
		x -= y;
		var prop = "width";
	} else {
		var prop = "height";
	}
	var size = this._context.canvas[prop] / this._options[prop];
	y = Math.floor(y/size);

	if (y.mod(2)) { /* odd row */
		x -= this._spacingX;
		x = 1 + 2*Math.floor(x/(2*this._spacingX));
	} else {
		x = 2*Math.floor(x/(2*this._spacingX));
	}
	
	return [x, y];
}

/**
 * Arguments are pixel values. If "transposed" mode is enabled, then these two are already swapped.
 */
ROT.Display.Hex.prototype._fill = function(cx, cy) {
	var a = this._hexSize;
	var b = this._options.border;
	
	this._context.beginPath();

	if (this._options.transpose) {
		this._context.moveTo(cx-a+b,	cy);
		this._context.lineTo(cx-a/2+b,	cy+this._spacingX-b);
		this._context.lineTo(cx+a/2-b,	cy+this._spacingX-b);
		this._context.lineTo(cx+a-b,	cy);
		this._context.lineTo(cx+a/2-b,	cy-this._spacingX+b);
		this._context.lineTo(cx-a/2+b,	cy-this._spacingX+b);
		this._context.lineTo(cx-a+b,	cy);
	} else {
		this._context.moveTo(cx,					cy-a+b);
		this._context.lineTo(cx+this._spacingX-b,	cy-a/2+b);
		this._context.lineTo(cx+this._spacingX-b,	cy+a/2-b);
		this._context.lineTo(cx,					cy+a-b);
		this._context.lineTo(cx-this._spacingX+b,	cy+a/2-b);
		this._context.lineTo(cx-this._spacingX+b,	cy-a/2+b);
		this._context.lineTo(cx,					cy-a+b);
	}
	this._context.fill();
}
/**
 * @class Tile backend
 * @private
 */
ROT.Display.Tile = function(context) {
	ROT.Display.Rect.call(this, context);
	
	this._options = {};
	this._colorCanvas = document.createElement("canvas");
}
ROT.Display.Tile.extend(ROT.Display.Rect);

ROT.Display.Tile.prototype.compute = function(options) {
	this._options = options;
	this._context.canvas.width = options.width * options.tileWidth;
	this._context.canvas.height = options.height * options.tileHeight;
	this._colorCanvas.width = options.tileWidth;
	this._colorCanvas.height = options.tileHeight;
}

ROT.Display.Tile.prototype.draw = function(data, clearBefore) {
	var x = data[0];
	var y = data[1];
	var ch = data[2];
	var fg = data[3];
	var bg = data[4];

	var tileWidth = this._options.tileWidth;
	var tileHeight = this._options.tileHeight;

	if (clearBefore) {
		if (this._options.tileColorize) {
			this._context.clearRect(x*tileWidth, y*tileHeight, tileWidth, tileHeight);
		} else {
			this._context.fillStyle = bg;
			this._context.fillRect(x*tileWidth, y*tileHeight, tileWidth, tileHeight);
		}
	}

	if (!ch) { return; }

	var chars = [].concat(ch);
	for (var i=0;i<chars.length;i++) {
		var tile = this._options.tileMap[chars[i]];
		if (!tile) { throw new Error("Char '" + chars[i] + "' not found in tileMap"); }
		
		if (this._options.tileColorize) { /* apply colorization */
			var canvas = this._colorCanvas;
			var context = canvas.getContext("2d");
			context.clearRect(0, 0, tileWidth, tileHeight);

			context.drawImage(
				this._options.tileSet,
				tile[0], tile[1], tileWidth, tileHeight,
				0, 0, tileWidth, tileHeight
			);

			if (fg != "transparent") {
				context.fillStyle = fg;
				context.globalCompositeOperation = "source-atop";
				context.fillRect(0, 0, tileWidth, tileHeight);
			}

			if (bg != "transparent") {
				context.fillStyle = bg;
				context.globalCompositeOperation = "destination-over";
				context.fillRect(0, 0, tileWidth, tileHeight);
			}

			this._context.drawImage(canvas, x*tileWidth, y*tileHeight, tileWidth, tileHeight);

		} else { /* no colorizing, easy */
			this._context.drawImage(
				this._options.tileSet,
				tile[0], tile[1], tileWidth, tileHeight,
				x*tileWidth, y*tileHeight, tileWidth, tileHeight
			);
		}
	}
}

ROT.Display.Tile.prototype.computeSize = function(availWidth, availHeight) {
	var width = Math.floor(availWidth / this._options.tileWidth);
	var height = Math.floor(availHeight / this._options.tileHeight);
	return [width, height];
}

ROT.Display.Tile.prototype.computeFontSize = function(availWidth, availHeight) {
	var width = Math.floor(availWidth / this._options.width);
	var height = Math.floor(availHeight / this._options.height);
	return [width, height];
}

ROT.Display.Tile.prototype.eventToPosition = function(x, y) {
	return [Math.floor(x/this._options.tileWidth), Math.floor(y/this._options.tileHeight)];
}
/**
 * @namespace
 * This code is an implementation of Alea algorithm; (C) 2010 Johannes Baagøe.
 * Alea is licensed according to the http://en.wikipedia.org/wiki/MIT_License.
 */
ROT.RNG = {
	/**
	 * @returns {number} 
	 */
	getSeed: function() {
		return this._seed;
	},

	/**
	 * @param {number} seed Seed the number generator
	 */
	setSeed: function(seed) {
		seed = (seed < 1 ? 1/seed : seed);

		this._seed = seed;
		this._s0 = (seed >>> 0) * this._frac;

		seed = (seed*69069 + 1) >>> 0;
		this._s1 = seed * this._frac;

		seed = (seed*69069 + 1) >>> 0;
		this._s2 = seed * this._frac;

		this._c = 1;
		return this;
	},

	/**
	 * @returns {float} Pseudorandom value [0,1), uniformly distributed
	 */
	getUniform: function() {
		var t = 2091639 * this._s0 + this._c * this._frac;
		this._s0 = this._s1;
		this._s1 = this._s2;
		this._c = t | 0;
		this._s2 = t - this._c;
		return this._s2;
	},

	/**
	 * @param {int} lowerBound The lower end of the range to return a value from, inclusive
	 * @param {int} upperBound The upper end of the range to return a value from, inclusive
	 * @returns {int} Pseudorandom value [lowerBound, upperBound], using ROT.RNG.getUniform() to distribute the value
	 */
	getUniformInt: function(lowerBound, upperBound) {
		var max = Math.max(lowerBound, upperBound);
		var min = Math.min(lowerBound, upperBound);
		return Math.floor(this.getUniform() * (max - min + 1)) + min;
	},

	/**
	 * @param {float} [mean=0] Mean value
	 * @param {float} [stddev=1] Standard deviation. ~95% of the absolute values will be lower than 2*stddev.
	 * @returns {float} A normally distributed pseudorandom value
	 */
	getNormal: function(mean, stddev) {
		do {
			var u = 2*this.getUniform()-1;
			var v = 2*this.getUniform()-1;
			var r = u*u + v*v;
		} while (r > 1 || r == 0);

		var gauss = u * Math.sqrt(-2*Math.log(r)/r);
		return (mean || 0) + gauss*(stddev || 1);
	},

	/**
	 * @returns {int} Pseudorandom value [1,100] inclusive, uniformly distributed
	 */
	getPercentage: function() {
		return 1 + Math.floor(this.getUniform()*100);
	},
	
	/**
	 * @param {object} data key=whatever, value=weight (relative probability)
	 * @returns {string} whatever
	 */
	getWeightedValue: function(data) {
		var total = 0;
		
		for (var id in data) {
			total += data[id];
		}
		var random = this.getUniform()*total;
		
		var part = 0;
		for (var id in data) {
			part += data[id];
			if (random < part) { return id; }
		}

		// If by some floating-point annoyance we have
		// random >= total, just return the last id.
		return id;
	},

	/**
	 * Get RNG state. Useful for storing the state and re-setting it via setState.
	 * @returns {?} Internal state
	 */
	getState: function() {
		return [this._s0, this._s1, this._s2, this._c];
	},

	/**
	 * Set a previously retrieved state.
	 * @param {?} state
	 */
	setState: function(state) {
		this._s0 = state[0];
		this._s1 = state[1];
		this._s2 = state[2];
		this._c  = state[3];
		return this;
	},

	/**
	 * Returns a cloned RNG
	 */
	clone: function() {
		var clone = Object.create(this);
		clone.setState(this.getState());
		return clone;
	},

	_s0: 0,
	_s1: 0,
	_s2: 0,
	_c: 0,
	_frac: 2.3283064365386963e-10 /* 2^-32 */
}

ROT.RNG.setSeed(Date.now());
/**
 * @class (Markov process)-based string generator. 
 * Copied from a <a href="http://www.roguebasin.roguelikedevelopment.org/index.php?title=Names_from_a_high_order_Markov_Process_and_a_simplified_Katz_back-off_scheme">RogueBasin article</a>. 
 * Offers configurable order and prior.
 * @param {object} [options]
 * @param {bool} [options.words=false] Use word mode?
 * @param {int} [options.order=3]
 * @param {float} [options.prior=0.001]
 */
ROT.StringGenerator = function(options) {
	this._options = {
		words: false,
		order: 3,
		prior: 0.001
	}
	for (var p in options) { this._options[p] = options[p]; }

	this._boundary = String.fromCharCode(0);
	this._suffix = this._boundary;
	this._prefix = [];
	for (var i=0;i<this._options.order;i++) { this._prefix.push(this._boundary); }

	this._priorValues = {};
	this._priorValues[this._boundary] = this._options.prior;

	this._data = {};
}

/**
 * Remove all learning data
 */
ROT.StringGenerator.prototype.clear = function() {
	this._data = {};
	this._priorValues = {};
}

/**
 * @returns {string} Generated string
 */
ROT.StringGenerator.prototype.generate = function() {
	var result = [this._sample(this._prefix)];
	while (result[result.length-1] != this._boundary) {
		result.push(this._sample(result));
	}
	return this._join(result.slice(0, -1));
}

/**
 * Observe (learn) a string from a training set
 */
ROT.StringGenerator.prototype.observe = function(string) {
	var tokens = this._split(string);

	for (var i=0; i<tokens.length; i++) {
		this._priorValues[tokens[i]] = this._options.prior;
	}

	tokens = this._prefix.concat(tokens).concat(this._suffix); /* add boundary symbols */

	for (var i=this._options.order; i<tokens.length; i++) {
		var context = tokens.slice(i-this._options.order, i);
		var event = tokens[i];
		for (var j=0; j<context.length; j++) {
			var subcontext = context.slice(j);
			this._observeEvent(subcontext, event);
		}
	}
}

ROT.StringGenerator.prototype.getStats = function() {
	var parts = [];

	var priorCount = 0;
	for (var p in this._priorValues) { priorCount++; }
	priorCount--; /* boundary */
	parts.push("distinct samples: " + priorCount);

	var dataCount = 0;
	var eventCount = 0;
	for (var p in this._data) { 
		dataCount++; 
		for (var key in this._data[p]) {
			eventCount++;
		}
	}
	parts.push("dictionary size (contexts): " + dataCount);
	parts.push("dictionary size (events): " + eventCount);

	return parts.join(", ");
}

/**
 * @param {string}
 * @returns {string[]}
 */
ROT.StringGenerator.prototype._split = function(str) {
	return str.split(this._options.words ? /\s+/ : "");
}

/**
 * @param {string[]}
 * @returns {string} 
 */
ROT.StringGenerator.prototype._join = function(arr) {
	return arr.join(this._options.words ? " " : "");
}

/**
 * @param {string[]} context
 * @param {string} event
 */
ROT.StringGenerator.prototype._observeEvent = function(context, event) {
	var key = this._join(context);
	if (!(key in this._data)) { this._data[key] = {}; }
	var data = this._data[key];

	if (!(event in data)) { data[event] = 0; }
	data[event]++;
}

/**
 * @param {string[]}
 * @returns {string}
 */
ROT.StringGenerator.prototype._sample = function(context) {
	context = this._backoff(context);
	var key = this._join(context);
	var data = this._data[key];

	var available = {};

	if (this._options.prior) {
		for (var event in this._priorValues) { available[event] = this._priorValues[event]; }
		for (var event in data) { available[event] += data[event]; }
	} else { 
		available = data;
	}

	return ROT.RNG.getWeightedValue(available);
}

/**
 * @param {string[]}
 * @returns {string[]}
 */
ROT.StringGenerator.prototype._backoff = function(context) {
	if (context.length > this._options.order) {
		context = context.slice(-this._options.order);
	} else if (context.length < this._options.order) {
		context = this._prefix.slice(0, this._options.order - context.length).concat(context);
	}

	while (!(this._join(context) in this._data) && context.length > 0) { context = context.slice(1); }

	return context;
}
/**
 * @class Generic event queue: stores events and retrieves them based on their time
 */
ROT.EventQueue = function() {
	this._time = 0;
	this._events = [];
	this._eventTimes = [];
}

/**
 * @returns {number} Elapsed time
 */
ROT.EventQueue.prototype.getTime = function() {
	return this._time;
}

/**
 * Clear all scheduled events
 */
ROT.EventQueue.prototype.clear = function() {
	this._events = [];
	this._eventTimes = [];
	return this;
}

/**
 * @param {?} event
 * @param {number} time
 */
ROT.EventQueue.prototype.add = function(event, time) {
	var index = this._events.length;
	for (var i=0;i<this._eventTimes.length;i++) {
		if (this._eventTimes[i] > time) {
			index = i;
			break;
		}
	}

	this._events.splice(index, 0, event);
	this._eventTimes.splice(index, 0, time);
}

/**
 * Locates the nearest event, advances time if necessary. Returns that event and removes it from the queue.
 * @returns {? || null} The event previously added by addEvent, null if no event available
 */
ROT.EventQueue.prototype.get = function() {
	if (!this._events.length) { return null; }

	var time = this._eventTimes.splice(0, 1)[0];
	if (time > 0) { /* advance */
		this._time += time;
		for (var i=0;i<this._eventTimes.length;i++) { this._eventTimes[i] -= time; }
	}

	return this._events.splice(0, 1)[0];
}

/**
 * Remove an event from the queue
 * @param {?} event
 * @returns {bool} success?
 */
ROT.EventQueue.prototype.remove = function(event) {
	var index = this._events.indexOf(event);
	if (index == -1) { return false }
	this._remove(index);
	return true;
}

/**
 * Remove an event from the queue
 * @param {int} index
 */
ROT.EventQueue.prototype._remove = function(index) {
	this._events.splice(index, 1);
	this._eventTimes.splice(index, 1);
}
/**
 * @class Abstract scheduler
 */
ROT.Scheduler = function() {
	this._queue = new ROT.EventQueue();
	this._repeat = [];
	this._current = null;
}

/**
 * @see ROT.EventQueue#getTime
 */
ROT.Scheduler.prototype.getTime = function() {
	return this._queue.getTime();
}

/**
 * @param {?} item
 * @param {bool} repeat
 */
ROT.Scheduler.prototype.add = function(item, repeat) {
	if (repeat) { this._repeat.push(item); }
	return this;
}

/**
 * Clear all items
 */
ROT.Scheduler.prototype.clear = function() {
	this._queue.clear();
	this._repeat = [];
	this._current = null;
	return this;
}

/**
 * Remove a previously added item
 * @param {?} item
 * @returns {bool} successful?
 */
ROT.Scheduler.prototype.remove = function(item) {
	var result = this._queue.remove(item);

	var index = this._repeat.indexOf(item);
	if (index != -1) { this._repeat.splice(index, 1); }

	if (this._current == item) { this._current = null; }

	return result;
}

/**
 * Schedule next item
 * @returns {?}
 */
ROT.Scheduler.prototype.next = function() {
	this._current = this._queue.get();
	return this._current;
}
/**
 * @class Simple fair scheduler (round-robin style)
 * @augments ROT.Scheduler
 */
ROT.Scheduler.Simple = function() {
	ROT.Scheduler.call(this);
}
ROT.Scheduler.Simple.extend(ROT.Scheduler);

/**
 * @see ROT.Scheduler#add
 */
ROT.Scheduler.Simple.prototype.add = function(item, repeat) {
	this._queue.add(item, 0);
	return ROT.Scheduler.prototype.add.call(this, item, repeat);
}

/**
 * @see ROT.Scheduler#next
 */
ROT.Scheduler.Simple.prototype.next = function() {
	if (this._current && this._repeat.indexOf(this._current) != -1) {
		this._queue.add(this._current, 0);
	}
	return ROT.Scheduler.prototype.next.call(this);
}
/**
 * @class Speed-based scheduler
 * @augments ROT.Scheduler
 */
ROT.Scheduler.Speed = function() {
	ROT.Scheduler.call(this);
}
ROT.Scheduler.Speed.extend(ROT.Scheduler);

/**
 * @param {object} item anything with "getSpeed" method
 * @param {bool} repeat
 * @see ROT.Scheduler#add
 */
ROT.Scheduler.Speed.prototype.add = function(item, repeat) {
	this._queue.add(item, 1/item.getSpeed());
	return ROT.Scheduler.prototype.add.call(this, item, repeat);
}

/**
 * @see ROT.Scheduler#next
 */
ROT.Scheduler.Speed.prototype.next = function() {
	if (this._current && this._repeat.indexOf(this._current) != -1) {
		this._queue.add(this._current, 1/this._current.getSpeed());
	}
	return ROT.Scheduler.prototype.next.call(this);
}
/**
 * @class Action-based scheduler
 * @augments ROT.Scheduler
 */
ROT.Scheduler.Action = function() {
	ROT.Scheduler.call(this);
	this._defaultDuration = 1; /* for newly added */
	this._duration = this._defaultDuration; /* for this._current */
}
ROT.Scheduler.Action.extend(ROT.Scheduler);

/**
 * @param {object} item
 * @param {bool} repeat
 * @param {number} [time=1]
 * @see ROT.Scheduler#add
 */
ROT.Scheduler.Action.prototype.add = function(item, repeat, time) {
	this._queue.add(item, time || this._defaultDuration);
	return ROT.Scheduler.prototype.add.call(this, item, repeat);
}

ROT.Scheduler.Action.prototype.clear = function() {
	this._duration = this._defaultDuration;
	return ROT.Scheduler.prototype.clear.call(this);
}

ROT.Scheduler.Action.prototype.remove = function(item) {
	if (item == this._current) { this._duration = this._defaultDuration; }
	return ROT.Scheduler.prototype.remove.call(this, item);
}

/**
 * @see ROT.Scheduler#next
 */
ROT.Scheduler.Action.prototype.next = function() {
	if (this._current && this._repeat.indexOf(this._current) != -1) {
		this._queue.add(this._current, this._duration || this._defaultDuration);
		this._duration = this._defaultDuration;
	}
	return ROT.Scheduler.prototype.next.call(this);
}

/**
 * Set duration for the active item
 */
ROT.Scheduler.Action.prototype.setDuration = function(time) {
	if (this._current) { this._duration = time; }
	return this;
}
/**
 * @class Asynchronous main loop
 * @param {ROT.Scheduler} scheduler
 */
ROT.Engine = function(scheduler) {
	this._scheduler = scheduler;
	this._lock = 1;
}

/**
 * Start the main loop. When this call returns, the loop is locked.
 */
ROT.Engine.prototype.start = function() {
	return this.unlock();
}

/**
 * Interrupt the engine by an asynchronous action
 */
ROT.Engine.prototype.lock = function() {
	this._lock++;
	return this;
}

/**
 * Resume execution (paused by a previous lock)
 */
ROT.Engine.prototype.unlock = function() {
	if (!this._lock) { throw new Error("Cannot unlock unlocked engine"); }
	this._lock--;

	while (!this._lock) {
		var actor = this._scheduler.next();
		if (!actor) { return this.lock(); } /* no actors */
		var result = actor.act();
		if (result && result.then) { /* actor returned a "thenable", looks like a Promise */
			this.lock();
			result.then(this.unlock.bind(this));
		}
	}

	return this;
}
/**
 * @class Base map generator
 * @param {int} [width=ROT.DEFAULT_WIDTH]
 * @param {int} [height=ROT.DEFAULT_HEIGHT]
 */
ROT.Map = function(width, height) {
	this._width = width || ROT.DEFAULT_WIDTH;
	this._height = height || ROT.DEFAULT_HEIGHT;
};

ROT.Map.prototype.create = function(callback) {}

ROT.Map.prototype._fillMap = function(value) {
	var map = [];
	for (var i=0;i<this._width;i++) {
		map.push([]);
		for (var j=0;j<this._height;j++) { map[i].push(value); }
	}
	return map;
}
/**
 * @class Simple empty rectangular room
 * @augments ROT.Map
 */
ROT.Map.Arena = function(width, height) {
	ROT.Map.call(this, width, height);
}
ROT.Map.Arena.extend(ROT.Map);

ROT.Map.Arena.prototype.create = function(callback) {
	var w = this._width-1;
	var h = this._height-1;
	for (var i=0;i<=w;i++) {
		for (var j=0;j<=h;j++) {
			var empty = (i && j && i<w && j<h);
			callback(i, j, empty ? 0 : 1);
		}
	}
	return this;
}
/**
 * @class Recursively divided maze, http://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method
 * @augments ROT.Map
 */
ROT.Map.DividedMaze = function(width, height) {
	ROT.Map.call(this, width, height);
	this._stack = [];
}
ROT.Map.DividedMaze.extend(ROT.Map);

ROT.Map.DividedMaze.prototype.create = function(callback) {
	var w = this._width;
	var h = this._height;
	
	this._map = [];
	
	for (var i=0;i<w;i++) {
		this._map.push([]);
		for (var j=0;j<h;j++) {
			var border = (i == 0 || j == 0 || i+1 == w || j+1 == h);
			this._map[i].push(border ? 1 : 0);
		}
	}
	
	this._stack = [
		[1, 1, w-2, h-2]
	];
	this._process();
	
	for (var i=0;i<w;i++) {
		for (var j=0;j<h;j++) {
			callback(i, j, this._map[i][j]);
		}
	}
	this._map = null;
	return this;
}

ROT.Map.DividedMaze.prototype._process = function() {
	while (this._stack.length) {
		var room = this._stack.shift(); /* [left, top, right, bottom] */
		this._partitionRoom(room);
	}
}

ROT.Map.DividedMaze.prototype._partitionRoom = function(room) {
	var availX = [];
	var availY = [];
	
	for (var i=room[0]+1;i<room[2];i++) {
		var top = this._map[i][room[1]-1];
		var bottom = this._map[i][room[3]+1];
		if (top && bottom && !(i % 2)) { availX.push(i); }
	}
	
	for (var j=room[1]+1;j<room[3];j++) {
		var left = this._map[room[0]-1][j];
		var right = this._map[room[2]+1][j];
		if (left && right && !(j % 2)) { availY.push(j); }
	}

	if (!availX.length || !availY.length) { return; }

	var x = availX.random();
	var y = availY.random();
	
	this._map[x][y] = 1;
	
	var walls = [];
	
	var w = []; walls.push(w); /* left part */
	for (var i=room[0]; i<x; i++) { 
		this._map[i][y] = 1;
		w.push([i, y]); 
	}
	
	var w = []; walls.push(w); /* right part */
	for (var i=x+1; i<=room[2]; i++) { 
		this._map[i][y] = 1;
		w.push([i, y]); 
	}

	var w = []; walls.push(w); /* top part */
	for (var j=room[1]; j<y; j++) { 
		this._map[x][j] = 1;
		w.push([x, j]); 
	}
	
	var w = []; walls.push(w); /* bottom part */
	for (var j=y+1; j<=room[3]; j++) { 
		this._map[x][j] = 1;
		w.push([x, j]); 
	}
		
	var solid = walls.random();
	for (var i=0;i<walls.length;i++) {
		var w = walls[i];
		if (w == solid) { continue; }
		
		var hole = w.random();
		this._map[hole[0]][hole[1]] = 0;
	}

	this._stack.push([room[0], room[1], x-1, y-1]); /* left top */
	this._stack.push([x+1, room[1], room[2], y-1]); /* right top */
	this._stack.push([room[0], y+1, x-1, room[3]]); /* left bottom */
	this._stack.push([x+1, y+1, room[2], room[3]]); /* right bottom */
}
/**
 * @class Icey's Maze generator
 * See http://www.roguebasin.roguelikedevelopment.org/index.php?title=Simple_maze for explanation
 * @augments ROT.Map
 */
ROT.Map.IceyMaze = function(width, height, regularity) {
	ROT.Map.call(this, width, height);
	this._regularity = regularity || 0;
}
ROT.Map.IceyMaze.extend(ROT.Map);

ROT.Map.IceyMaze.prototype.create = function(callback) {
	var width = this._width;
	var height = this._height;
	
	var map = this._fillMap(1);
	
	width -= (width % 2 ? 1 : 2);
	height -= (height % 2 ? 1 : 2);

	var cx = 0;
	var cy = 0;
	var nx = 0;
	var ny = 0;

	var done = 0;
	var blocked = false;
	var dirs = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0]
	];
	do {
		cx = 1 + 2*Math.floor(ROT.RNG.getUniform()*(width-1) / 2);
		cy = 1 + 2*Math.floor(ROT.RNG.getUniform()*(height-1) / 2);

		if (!done) { map[cx][cy] = 0; }
		
		if (!map[cx][cy]) {
			this._randomize(dirs);
			do {
				if (Math.floor(ROT.RNG.getUniform()*(this._regularity+1)) == 0) { this._randomize(dirs); }
				blocked = true;
				for (var i=0;i<4;i++) {
					nx = cx + dirs[i][0]*2;
					ny = cy + dirs[i][1]*2;
					if (this._isFree(map, nx, ny, width, height)) {
						map[nx][ny] = 0;
						map[cx + dirs[i][0]][cy + dirs[i][1]] = 0;
						
						cx = nx;
						cy = ny;
						blocked = false;
						done++;
						break;
					}
				}
			} while (!blocked);
		}
	} while (done+1 < width*height/4);
	
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			callback(i, j, map[i][j]);
		}
	}
	this._map = null;
	return this;
}

ROT.Map.IceyMaze.prototype._randomize = function(dirs) {
	for (var i=0;i<4;i++) {
		dirs[i][0] = 0;
		dirs[i][1] = 0;
	}
	
	switch (Math.floor(ROT.RNG.getUniform()*4)) {
		case 0:
			dirs[0][0] = -1; dirs[1][0] = 1;
			dirs[2][1] = -1; dirs[3][1] = 1;
		break;
		case 1:
			dirs[3][0] = -1; dirs[2][0] = 1;
			dirs[1][1] = -1; dirs[0][1] = 1;
		break;
		case 2:
			dirs[2][0] = -1; dirs[3][0] = 1;
			dirs[0][1] = -1; dirs[1][1] = 1;
		break;
		case 3:
			dirs[1][0] = -1; dirs[0][0] = 1;
			dirs[3][1] = -1; dirs[2][1] = 1;
		break;
	}
}

ROT.Map.IceyMaze.prototype._isFree = function(map, x, y, width, height) {
	if (x < 1 || y < 1 || x >= width || y >= height) { return false; }
	return map[x][y];
}
/**
 * @class Maze generator - Eller's algorithm
 * See http://homepages.cwi.nl/~tromp/maze.html for explanation
 * @augments ROT.Map
 */
ROT.Map.EllerMaze = function(width, height) {
	ROT.Map.call(this, width, height);
}
ROT.Map.EllerMaze.extend(ROT.Map);

ROT.Map.EllerMaze.prototype.create = function(callback) {
	var map = this._fillMap(1);
	var w = Math.ceil((this._width-2)/2);
	
	var rand = 9/24;
	
	var L = [];
	var R = [];
	
	for (var i=0;i<w;i++) {
		L.push(i);
		R.push(i);
	}
	L.push(w-1); /* fake stop-block at the right side */

	for (var j=1;j+3<this._height;j+=2) {
		/* one row */
		for (var i=0;i<w;i++) {
			/* cell coords (will be always empty) */
			var x = 2*i+1;
			var y = j;
			map[x][y] = 0;
			
			/* right connection */
			if (i != L[i+1] && ROT.RNG.getUniform() > rand) {
				this._addToList(i, L, R);
				map[x+1][y] = 0;
			}
			
			/* bottom connection */
			if (i != L[i] && ROT.RNG.getUniform() > rand) {
				/* remove connection */
				this._removeFromList(i, L, R);
			} else {
				/* create connection */
				map[x][y+1] = 0;
			}
		}
	}

	/* last row */
	for (var i=0;i<w;i++) {
		/* cell coords (will be always empty) */
		var x = 2*i+1;
		var y = j;
		map[x][y] = 0;
		
		/* right connection */
		if (i != L[i+1] && (i == L[i] || ROT.RNG.getUniform() > rand)) {
			/* dig right also if the cell is separated, so it gets connected to the rest of maze */
			this._addToList(i, L, R);
			map[x+1][y] = 0;
		}
		
		this._removeFromList(i, L, R);
	}
	
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			callback(i, j, map[i][j]);
		}
	}
	
	return this;
}

/**
 * Remove "i" from its list
 */
ROT.Map.EllerMaze.prototype._removeFromList = function(i, L, R) {
	R[L[i]] = R[i];
	L[R[i]] = L[i];
	R[i] = i;
	L[i] = i;
}

/**
 * Join lists with "i" and "i+1"
 */
ROT.Map.EllerMaze.prototype._addToList = function(i, L, R) {
	R[L[i+1]] = R[i];
	L[R[i]] = L[i+1];
	R[i] = i+1;
	L[i+1] = i;
}
/**
 * @class Cellular automaton map generator
 * @augments ROT.Map
 * @param {int} [width=ROT.DEFAULT_WIDTH]
 * @param {int} [height=ROT.DEFAULT_HEIGHT]
 * @param {object} [options] Options
 * @param {int[]} [options.born] List of neighbor counts for a new cell to be born in empty space
 * @param {int[]} [options.survive] List of neighbor counts for an existing  cell to survive
 * @param {int} [options.topology] Topology 4 or 6 or 8
 */
ROT.Map.Cellular = function(width, height, options) {
	ROT.Map.call(this, width, height);
	this._options = {
		born: [5, 6, 7, 8],
		survive: [4, 5, 6, 7, 8],
		topology: 8,
		connected: false
	};
	this.setOptions(options);
	
	this._dirs = ROT.DIRS[this._options.topology];
	this._map = this._fillMap(0);
}
ROT.Map.Cellular.extend(ROT.Map);

/**
 * Fill the map with random values
 * @param {float} probability Probability for a cell to become alive; 0 = all empty, 1 = all full
 */
ROT.Map.Cellular.prototype.randomize = function(probability) {
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			this._map[i][j] = (ROT.RNG.getUniform() < probability ? 1 : 0);
		}
	}
	return this;
}

/**
 * Change options.
 * @see ROT.Map.Cellular
 */
ROT.Map.Cellular.prototype.setOptions = function(options) {
	for (var p in options) { this._options[p] = options[p]; }
}

ROT.Map.Cellular.prototype.set = function(x, y, value) {
	this._map[x][y] = value;
}

ROT.Map.Cellular.prototype.create = function(callback) {
	var newMap = this._fillMap(0);
	var born = this._options.born;
	var survive = this._options.survive;


	for (var j=0;j<this._height;j++) {
		var widthStep = 1;
		var widthStart = 0;
		if (this._options.topology == 6) { 
			widthStep = 2;
			widthStart = j%2;
		}

		for (var i=widthStart; i<this._width; i+=widthStep) {

			var cur = this._map[i][j];
			var ncount = this._getNeighbors(i, j);
			
			if (cur && survive.indexOf(ncount) != -1) { /* survive */
				newMap[i][j] = 1;
			} else if (!cur && born.indexOf(ncount) != -1) { /* born */
				newMap[i][j] = 1;
			}			
		}
	}
	
	this._map = newMap;

	if (this._options.connected) { this._completeMaze(); } // optionally connect every space

	if (!callback) { return; }

	for (var j=0;j<this._height;j++) {
		var widthStep = 1;
		var widthStart = 0;
		if (this._options.topology == 6) { 
			widthStep = 2;
			widthStart = j%2;
		}
		for (var i=widthStart; i<this._width; i+=widthStep) {
			callback(i, j, newMap[i][j]);
		}
	}
}

/**
 * Get neighbor count at [i,j] in this._map
 */
ROT.Map.Cellular.prototype._getNeighbors = function(cx, cy) {
	var result = 0;
	for (var i=0;i<this._dirs.length;i++) {
		var dir = this._dirs[i];
		var x = cx + dir[0];
		var y = cy + dir[1];
		
		if (x < 0 || x >= this._width || x < 0 || y >= this._width) { continue; }
		result += (this._map[x][y] == 1 ? 1 : 0);
	}
	
	return result;
}

/**
 * Make sure every non-wall space is accessible.
 */
ROT.Map.Cellular.prototype._completeMaze = function() {
	var allFreeSpace = [];
	var notConnected = {};
	// find all free space
	for (var x = 0; x < this._width; x++) {
		for (var y = 0; y < this._height; y++) {
			if (this._freeSpace(x, y)) {
				var p = [x, y];
				notConnected[this._pointKey(p)] = p;
				allFreeSpace.push([x, y]);
			}
		}
	}
	var start = allFreeSpace[ROT.RNG.getUniformInt(0, allFreeSpace.length - 1)];

	var key = this._pointKey(start);
	var connected = {};
	connected[key] = start;
	delete notConnected[key]

	// find what's connected to the starting point
	this._findConnected(connected, notConnected, [start]);

	while (Object.keys(notConnected).length > 0) {

		// find two points from notConnected to connected
		var p = this._getFromTo(connected, notConnected);
		var from = p[0]; // notConnected
		var to = p[1]; // connected

		// find everything connected to the starting point
		var local = {};
		local[this._pointKey(from)] = from;
		this._findConnected(local, notConnected, [from], true);

		// connect to a connected square
		this._tunnelToConnected(to, from, connected, notConnected);

		// now all of local is connected
		for (var k in local) {
			var pp = local[k];
			this._map[pp[0]][pp[1]] = 0;
			connected[k] = pp;
			delete notConnected[k];
		}
	}
}

/**
 * Find random points to connect. Search for the closest point in the larger space. 
 * This is to minimize the length of the passage while maintaining good performance.
 */
ROT.Map.Cellular.prototype._getFromTo = function(connected, notConnected) {
	var from, to, d;
	var connectedKeys = Object.keys(connected);
	var notConnectedKeys = Object.keys(notConnected);
	for (var i = 0; i < 5; i++) {
		if (connectedKeys.length < notConnectedKeys.length) {
			var keys = connectedKeys;
			to = connected[keys[ROT.RNG.getUniformInt(0, keys.length - 1)]]
			from = this._getClosest(to, notConnected);
		} else {
			var keys = notConnectedKeys;
			from = notConnected[keys[ROT.RNG.getUniformInt(0, keys.length - 1)]]
			to = this._getClosest(from, connected);
		}
		d = (from[0] - to[0]) * (from[0] - to[0]) + (from[1] - to[1]) * (from[1] - to[1]);
		if (d < 64) {
			break;
		}
	}
	// console.log(">>> connected=" + to + " notConnected=" + from + " dist=" + d);
	return [from, to];
}

ROT.Map.Cellular.prototype._getClosest = function(point, space) {
	var minPoint = null;
	var minDist = null;
	for (k in space) {
		var p = space[k];
		var d = (p[0] - point[0]) * (p[0] - point[0]) + (p[1] - point[1]) * (p[1] - point[1]);
		if (minDist == null || d < minDist) {
			minDist = d;
			minPoint = p;
		}
	}
	return minPoint;
}

ROT.Map.Cellular.prototype._findConnected = function(connected, notConnected, stack, keepNotConnected) {
	while(stack.length > 0) {
		var p = stack.splice(0, 1)[0];
		var tests = [
			[p[0] + 1, p[1]],
			[p[0] - 1, p[1]],
			[p[0],     p[1] + 1],
			[p[0],     p[1] - 1]
		];
		for (var i = 0; i < tests.length; i++) {
			var key = this._pointKey(tests[i]);
			if (connected[key] == null && this._freeSpace(tests[i][0], tests[i][1])) {
				connected[key] = tests[i];
				if (!keepNotConnected) {
					delete notConnected[key];
				}
				stack.push(tests[i]);
			}
		}
	}
}

ROT.Map.Cellular.prototype._tunnelToConnected = function(to, from, connected, notConnected) {
	var key = this._pointKey(from);
	var a, b;
	if (from[0] < to[0]) {
		a = from;
		b = to;
	} else {
		a = to;
		b = from;
	}
	for (var xx = a[0]; xx <= b[0]; xx++) {
		this._map[xx][a[1]] = 0;
		var p = [xx, a[1]];
		var pkey = this._pointKey(p);
		connected[pkey] = p;
		delete notConnected[pkey];
	}

	// x is now fixed
	var x = b[0];

	if (from[1] < to[1]) {
		a = from;
		b = to;
	} else {
		a = to;
		b = from;
	}
	for (var yy = a[1]; yy < b[1]; yy++) {
		this._map[x][yy] = 0;
		var p = [x, yy];
		var pkey = this._pointKey(p);
		connected[pkey] = p;
		delete notConnected[pkey];
	}
}

ROT.Map.Cellular.prototype._freeSpace = function(x, y) {
	return x >= 0 && x < this._width && y >= 0 && y < this._height && this._map[x][y] != 1;
}

ROT.Map.Cellular.prototype._pointKey = function(p) {
	return p[0] + "." + p[1];
}

/**
 * @class Dungeon map: has rooms and corridors
 * @augments ROT.Map
 */
ROT.Map.Dungeon = function(width, height) {
	ROT.Map.call(this, width, height);
	this._rooms = []; /* list of all rooms */
	this._corridors = [];
}
ROT.Map.Dungeon.extend(ROT.Map);

/**
 * Get all generated rooms
 * @returns {ROT.Map.Feature.Room[]}
 */
ROT.Map.Dungeon.prototype.getRooms = function() {
	return this._rooms;
}

/**
 * Get all generated corridors
 * @returns {ROT.Map.Feature.Corridor[]}
 */
ROT.Map.Dungeon.prototype.getCorridors = function() {
	return this._corridors;
}
/**
 * @class Random dungeon generator using human-like digging patterns.
 * Heavily based on Mike Anderson's ideas from the "Tyrant" algo, mentioned at 
 * http://www.roguebasin.roguelikedevelopment.org/index.php?title=Dungeon-Building_Algorithm.
 * @augments ROT.Map.Dungeon
 */
ROT.Map.Digger = function(width, height, options) {
	ROT.Map.Dungeon.call(this, width, height);
	
	this._options = {
		roomWidth: [3, 9], /* room minimum and maximum width */
		roomHeight: [3, 5], /* room minimum and maximum height */
		corridorLength: [3, 10], /* corridor minimum and maximum length */
		dugPercentage: 0.2, /* we stop after this percentage of level area has been dug out */
		timeLimit: 1000 /* we stop after this much time has passed (msec) */
	}
	for (var p in options) { this._options[p] = options[p]; }
	
	this._features = {
		"Room": 4,
		"Corridor": 4
	}
	this._featureAttempts = 20; /* how many times do we try to create a feature on a suitable wall */
	this._walls = {}; /* these are available for digging */
	
	this._digCallback = this._digCallback.bind(this);
	this._canBeDugCallback = this._canBeDugCallback.bind(this);
	this._isWallCallback = this._isWallCallback.bind(this);
	this._priorityWallCallback = this._priorityWallCallback.bind(this);
}
ROT.Map.Digger.extend(ROT.Map.Dungeon);

/**
 * Create a map
 * @see ROT.Map#create
 */
ROT.Map.Digger.prototype.create = function(callback) {
	this._rooms = [];
	this._corridors = [];
	this._map = this._fillMap(1);
	this._walls = {};
	this._dug = 0;
	var area = (this._width-2) * (this._height-2);

	this._firstRoom();
	
	var t1 = Date.now();

	do {
		var t2 = Date.now();
		if (t2 - t1 > this._options.timeLimit) { break; }

		/* find a good wall */
		var wall = this._findWall();
		if (!wall) { break; } /* no more walls */
		
		var parts = wall.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		var dir = this._getDiggingDirection(x, y);
		if (!dir) { continue; } /* this wall is not suitable */
		
//		console.log("wall", x, y);

		/* try adding a feature */
		var featureAttempts = 0;
		do {
			featureAttempts++;
			if (this._tryFeature(x, y, dir[0], dir[1])) { /* feature added */
				//if (this._rooms.length + this._corridors.length == 2) { this._rooms[0].addDoor(x, y); } /* first room oficially has doors */
				this._removeSurroundingWalls(x, y);
				this._removeSurroundingWalls(x-dir[0], y-dir[1]);
				break; 
			}
		} while (featureAttempts < this._featureAttempts);
		
		var priorityWalls = 0;
		for (var id in this._walls) { 
			if (this._walls[id] > 1) { priorityWalls++; }
		}

	} while (this._dug/area < this._options.dugPercentage || priorityWalls); /* fixme number of priority walls */

	this._addDoors();

	if (callback) {
		for (var i=0;i<this._width;i++) {
			for (var j=0;j<this._height;j++) {
				callback(i, j, this._map[i][j]);
			}
		}
	}
	
	this._walls = {};
	this._map = null;

	return this;
}

ROT.Map.Digger.prototype._digCallback = function(x, y, value) {
	if (value == 0 || value == 2) { /* empty */
		this._map[x][y] = 0;
		this._dug++;
	} else { /* wall */
		this._walls[x+","+y] = 1;
	}
}

ROT.Map.Digger.prototype._isWallCallback = function(x, y) {
	if (x < 0 || y < 0 || x >= this._width || y >= this._height) { return false; }
	return (this._map[x][y] == 1);
}

ROT.Map.Digger.prototype._canBeDugCallback = function(x, y) {
	if (x < 1 || y < 1 || x+1 >= this._width || y+1 >= this._height) { return false; }
	return (this._map[x][y] == 1);
}

ROT.Map.Digger.prototype._priorityWallCallback = function(x, y) {
	this._walls[x+","+y] = 2;
}

ROT.Map.Digger.prototype._firstRoom = function() {
	var cx = Math.floor(this._width/2);
	var cy = Math.floor(this._height/2);
	var room = ROT.Map.Feature.Room.createRandomCenter(cx, cy, this._options);
	this._rooms.push(room);
	room.create(this._digCallback);
}

/**
 * Get a suitable wall
 */
ROT.Map.Digger.prototype._findWall = function() {
	var prio1 = [];
	var prio2 = [];
	for (var id in this._walls) {
		var prio = this._walls[id];
		if (prio == 2) { 
			prio2.push(id); 
		} else {
			prio1.push(id);
		}
	}
	
	var arr = (prio2.length ? prio2 : prio1);
	if (!arr.length) { return null; } /* no walls :/ */
	
	var id = arr.random();
	delete this._walls[id];

	return id;
}

/**
 * Tries adding a feature
 * @returns {bool} was this a successful try?
 */
ROT.Map.Digger.prototype._tryFeature = function(x, y, dx, dy) {
	var feature = ROT.RNG.getWeightedValue(this._features);
	feature = ROT.Map.Feature[feature].createRandomAt(x, y, dx, dy, this._options);
	
	if (!feature.isValid(this._isWallCallback, this._canBeDugCallback)) {
//		console.log("not valid");
//		feature.debug();
		return false;
	}
	
	feature.create(this._digCallback);
//	feature.debug();

	if (feature instanceof ROT.Map.Feature.Room) { this._rooms.push(feature); }
	if (feature instanceof ROT.Map.Feature.Corridor) { 
		feature.createPriorityWalls(this._priorityWallCallback);
		this._corridors.push(feature); 
	}
	
	return true;
}

ROT.Map.Digger.prototype._removeSurroundingWalls = function(cx, cy) {
	var deltas = ROT.DIRS[4];

	for (var i=0;i<deltas.length;i++) {
		var delta = deltas[i];
		var x = cx + delta[0];
		var y = cy + delta[1];
		delete this._walls[x+","+y];
		var x = cx + 2*delta[0];
		var y = cy + 2*delta[1];
		delete this._walls[x+","+y];
	}
}

/**
 * Returns vector in "digging" direction, or false, if this does not exist (or is not unique)
 */
ROT.Map.Digger.prototype._getDiggingDirection = function(cx, cy) {
	if (cx <= 0 || cy <= 0 || cx >= this._width - 1 || cy >= this._height - 1) { return null; }

	var result = null;
	var deltas = ROT.DIRS[4];
	
	for (var i=0;i<deltas.length;i++) {
		var delta = deltas[i];
		var x = cx + delta[0];
		var y = cy + delta[1];
		
		if (!this._map[x][y]) { /* there already is another empty neighbor! */
			if (result) { return null; }
			result = delta;
		}
	}
	
	/* no empty neighbor */
	if (!result) { return null; }
	
	return [-result[0], -result[1]];
}

/**
 * Find empty spaces surrounding rooms, and apply doors.
 */
ROT.Map.Digger.prototype._addDoors = function() {
	var data = this._map;
	var isWallCallback = function(x, y) {
		return (data[x][y] == 1);
	}
	for (var i = 0; i < this._rooms.length; i++ ) {
		var room = this._rooms[i];
		room.clearDoors();
		room.addDoors(isWallCallback);
	}
}
/**
 * @class Dungeon generator which tries to fill the space evenly. Generates independent rooms and tries to connect them.
 * @augments ROT.Map.Dungeon
 */
ROT.Map.Uniform = function(width, height, options) {
	ROT.Map.Dungeon.call(this, width, height);

	this._options = {
		roomWidth: [3, 9], /* room minimum and maximum width */
		roomHeight: [3, 5], /* room minimum and maximum height */
		roomDugPercentage: 0.1, /* we stop after this percentage of level area has been dug out by rooms */
		timeLimit: 1000 /* we stop after this much time has passed (msec) */
	}
	for (var p in options) { this._options[p] = options[p]; }

	this._roomAttempts = 20; /* new room is created N-times until is considered as impossible to generate */
	this._corridorAttempts = 20; /* corridors are tried N-times until the level is considered as impossible to connect */

	this._connected = []; /* list of already connected rooms */
	this._unconnected = []; /* list of remaining unconnected rooms */
	
	this._digCallback = this._digCallback.bind(this);
	this._canBeDugCallback = this._canBeDugCallback.bind(this);
	this._isWallCallback = this._isWallCallback.bind(this);
}
ROT.Map.Uniform.extend(ROT.Map.Dungeon);

/**
 * Create a map. If the time limit has been hit, returns null.
 * @see ROT.Map#create
 */
ROT.Map.Uniform.prototype.create = function(callback) {
	var t1 = Date.now();
	while (1) {
		var t2 = Date.now();
		if (t2 - t1 > this._options.timeLimit) { return null; } /* time limit! */
	
		this._map = this._fillMap(1);
		this._dug = 0;
		this._rooms = [];
		this._unconnected = [];
		this._generateRooms();
		if (this._rooms.length < 2) { continue; }
		if (this._generateCorridors()) { break; }
	}
	
	if (callback) {
		for (var i=0;i<this._width;i++) {
			for (var j=0;j<this._height;j++) {
				callback(i, j, this._map[i][j]);
			}
		}
	}
	
	return this;
}

/**
 * Generates a suitable amount of rooms
 */
ROT.Map.Uniform.prototype._generateRooms = function() {
	var w = this._width-2;
	var h = this._height-2;

	do {
		var room = this._generateRoom();
		if (this._dug/(w*h) > this._options.roomDugPercentage) { break; } /* achieved requested amount of free space */
	} while (room);

	/* either enough rooms, or not able to generate more of them :) */
}

/**
 * Try to generate one room
 */
ROT.Map.Uniform.prototype._generateRoom = function() {
	var count = 0;
	while (count < this._roomAttempts) {
		count++;
		
		var room = ROT.Map.Feature.Room.createRandom(this._width, this._height, this._options);
		if (!room.isValid(this._isWallCallback, this._canBeDugCallback)) { continue; }
		
		room.create(this._digCallback);
		this._rooms.push(room);
		return room;
	} 

	/* no room was generated in a given number of attempts */
	return null;
}

/**
 * Generates connectors beween rooms
 * @returns {bool} success Was this attempt successfull?
 */
ROT.Map.Uniform.prototype._generateCorridors = function() {
	var cnt = 0;
	while (cnt < this._corridorAttempts) {
		cnt++;
		this._corridors = [];

		/* dig rooms into a clear map */
		this._map = this._fillMap(1);
		for (var i=0;i<this._rooms.length;i++) { 
			var room = this._rooms[i];
			room.clearDoors();
			room.create(this._digCallback); 
		}

		this._unconnected = this._rooms.slice().randomize();
		this._connected = [];
		if (this._unconnected.length) { this._connected.push(this._unconnected.pop()); } /* first one is always connected */
		
		while (1) {
			/* 1. pick random connected room */
			var connected = this._connected.random();
			
			/* 2. find closest unconnected */
			var room1 = this._closestRoom(this._unconnected, connected);
			
			/* 3. connect it to closest connected */
			var room2 = this._closestRoom(this._connected, room1);
			
			var ok = this._connectRooms(room1, room2);
			if (!ok) { break; } /* stop connecting, re-shuffle */
			
			if (!this._unconnected.length) { return true; } /* done; no rooms remain */
		}
	}
	return false;
}

/**
 * For a given room, find the closest one from the list
 */
ROT.Map.Uniform.prototype._closestRoom = function(rooms, room) {
	var dist = Infinity;
	var center = room.getCenter();
	var result = null;
	
	for (var i=0;i<rooms.length;i++) {
		var r = rooms[i];
		var c = r.getCenter();
		var dx = c[0]-center[0];
		var dy = c[1]-center[1];
		var d = dx*dx+dy*dy;
		
		if (d < dist) {
			dist = d;
			result = r;
		}
	}
	
	return result;
}

ROT.Map.Uniform.prototype._connectRooms = function(room1, room2) {
	/*
		room1.debug();
		room2.debug();
	*/

	var center1 = room1.getCenter();
	var center2 = room2.getCenter();

	var diffX = center2[0] - center1[0];
	var diffY = center2[1] - center1[1];

	if (Math.abs(diffX) < Math.abs(diffY)) { /* first try connecting north-south walls */
		var dirIndex1 = (diffY > 0 ? 2 : 0);
		var dirIndex2 = (dirIndex1 + 2) % 4;
		var min = room2.getLeft();
		var max = room2.getRight();
		var index = 0;
	} else { /* first try connecting east-west walls */
		var dirIndex1 = (diffX > 0 ? 1 : 3);
		var dirIndex2 = (dirIndex1 + 2) % 4;
		var min = room2.getTop();
		var max = room2.getBottom();
		var index = 1;
	}

	var start = this._placeInWall(room1, dirIndex1); /* corridor will start here */
	if (!start) { return false; }

	if (start[index] >= min && start[index] <= max) { /* possible to connect with straight line (I-like) */
		var end = start.slice();
		var value = null;
		switch (dirIndex2) {
			case 0: value = room2.getTop()-1; break;
			case 1: value = room2.getRight()+1; break;
			case 2: value = room2.getBottom()+1; break;
			case 3: value = room2.getLeft()-1; break;
		}
		end[(index+1)%2] = value;
		this._digLine([start, end]);
		
	} else if (start[index] < min-1 || start[index] > max+1) { /* need to switch target wall (L-like) */

		var diff = start[index] - center2[index];
		switch (dirIndex2) {
			case 0:
			case 1:	var rotation = (diff < 0 ? 3 : 1); break;
			case 2:
			case 3:	var rotation = (diff < 0 ? 1 : 3); break;
		}
		dirIndex2 = (dirIndex2 + rotation) % 4;
		
		var end = this._placeInWall(room2, dirIndex2);
		if (!end) { return false; }

		var mid = [0, 0];
		mid[index] = start[index];
		var index2 = (index+1)%2;
		mid[index2] = end[index2];
		this._digLine([start, mid, end]);
		
	} else { /* use current wall pair, but adjust the line in the middle (S-like) */
	
		var index2 = (index+1)%2;
		var end = this._placeInWall(room2, dirIndex2);
		if (!end) { return false; }
		var mid = Math.round((end[index2] + start[index2])/2);

		var mid1 = [0, 0];
		var mid2 = [0, 0];
		mid1[index] = start[index];
		mid1[index2] = mid;
		mid2[index] = end[index];
		mid2[index2] = mid;
		this._digLine([start, mid1, mid2, end]);
	}

	room1.addDoor(start[0], start[1]);
	room2.addDoor(end[0], end[1]);
	
	var index = this._unconnected.indexOf(room1);
	if (index != -1) {
		this._unconnected.splice(index, 1);
		this._connected.push(room1);
	}

	var index = this._unconnected.indexOf(room2);
	if (index != -1) {
		this._unconnected.splice(index, 1);
		this._connected.push(room2);
	}
	
	return true;
}

ROT.Map.Uniform.prototype._placeInWall = function(room, dirIndex) {
	var start = [0, 0];
	var dir = [0, 0];
	var length = 0;
	
	switch (dirIndex) {
		case 0:
			dir = [1, 0];
			start = [room.getLeft(), room.getTop()-1];
			length = room.getRight()-room.getLeft()+1;
		break;
		case 1:
			dir = [0, 1];
			start = [room.getRight()+1, room.getTop()];
			length = room.getBottom()-room.getTop()+1;
		break;
		case 2:
			dir = [1, 0];
			start = [room.getLeft(), room.getBottom()+1];
			length = room.getRight()-room.getLeft()+1;
		break;
		case 3:
			dir = [0, 1];
			start = [room.getLeft()-1, room.getTop()];
			length = room.getBottom()-room.getTop()+1;
		break;
	}
	
	var avail = [];
	var lastBadIndex = -2;

	for (var i=0;i<length;i++) {
		var x = start[0] + i*dir[0];
		var y = start[1] + i*dir[1];
		avail.push(null);
		
		var isWall = (this._map[x][y] == 1);
		if (isWall) {
			if (lastBadIndex != i-1) { avail[i] = [x, y]; }
		} else {
			lastBadIndex = i;
			if (i) { avail[i-1] = null; }
		}
	}
	
	for (var i=avail.length-1; i>=0; i--) {
		if (!avail[i]) { avail.splice(i, 1); }
	}
	return (avail.length ? avail.random() : null);
}

/**
 * Dig a polyline.
 */
ROT.Map.Uniform.prototype._digLine = function(points) {
	for (var i=1;i<points.length;i++) {
		var start = points[i-1];
		var end = points[i];
		var corridor = new ROT.Map.Feature.Corridor(start[0], start[1], end[0], end[1]);
		corridor.create(this._digCallback);
		this._corridors.push(corridor);
	}
}

ROT.Map.Uniform.prototype._digCallback = function(x, y, value) {
	this._map[x][y] = value;
	if (value == 0) { this._dug++; }
}

ROT.Map.Uniform.prototype._isWallCallback = function(x, y) {
	if (x < 0 || y < 0 || x >= this._width || y >= this._height) { return false; }
	return (this._map[x][y] == 1);
}

ROT.Map.Uniform.prototype._canBeDugCallback = function(x, y) {
	if (x < 1 || y < 1 || x+1 >= this._width || y+1 >= this._height) { return false; }
	return (this._map[x][y] == 1);
}

/**
 * @author hyakugei
 * @class Dungeon generator which uses the "orginal" Rogue dungeon generation algorithm. See http://kuoi.com/~kamikaze/GameDesign/art07_rogue_dungeon.php
 * @augments ROT.Map
 * @param {int} [width=ROT.DEFAULT_WIDTH]
 * @param {int} [height=ROT.DEFAULT_HEIGHT]
 * @param {object} [options] Options
 * @param {int[]} [options.cellWidth=3] Number of cells to create on the horizontal (number of rooms horizontally)
 * @param {int[]} [options.cellHeight=3] Number of cells to create on the vertical (number of rooms vertically) 
 * @param {int} [options.roomWidth] Room min and max width - normally set auto-magically via the constructor.
 * @param {int} [options.roomHeight] Room min and max height - normally set auto-magically via the constructor. 
 */
ROT.Map.Rogue = function(width, height, options) {
	ROT.Map.call(this, width, height);
	
	this._options = {
		cellWidth: 3,  // NOTE to self, these could probably work the same as the roomWidth/room Height values
		cellHeight: 3  //     ie. as an array with min-max values for each direction....
	}
	
	for (var p in options) { this._options[p] = options[p]; }
	
	/*
	Set the room sizes according to the over-all width of the map, 
	and the cell sizes. 
	*/
	
	if (!this._options.hasOwnProperty("roomWidth")) {
		this._options["roomWidth"] = this._calculateRoomSize(this._width, this._options["cellWidth"]);
	}
	if (!this._options.hasOwnProperty("roomHeight")) {
		this._options["roomHeight"] = this._calculateRoomSize(this._height, this._options["cellHeight"]);
	}
	
}

ROT.Map.Rogue.extend(ROT.Map); 

/**
 * @see ROT.Map#create
 */
ROT.Map.Rogue.prototype.create = function(callback) {
	this.map = this._fillMap(1);
	this.rooms = [];
	this.connectedCells = [];
	
	this._initRooms();
	this._connectRooms();
	this._connectUnconnectedRooms();
	this._createRandomRoomConnections();
	this._createRooms();
	this._createCorridors();
	
	if (callback) {
		for (var i = 0; i < this._width; i++) {
			for (var j = 0; j < this._height; j++) {
				callback(i, j, this.map[i][j]);   
			}
		}
	}
	
	return this;
}

ROT.Map.Rogue.prototype._calculateRoomSize = function(size, cell) {
	var max = Math.floor((size/cell) * 0.8);
	var min = Math.floor((size/cell) * 0.25);
	if (min < 2) min = 2;
	if (max < 2) max = 2;
	return [min, max];
}

ROT.Map.Rogue.prototype._initRooms = function () { 
	// create rooms array. This is the "grid" list from the algo.  
	for (var i = 0; i < this._options.cellWidth; i++) {  
		this.rooms.push([]);
		for(var j = 0; j < this._options.cellHeight; j++) {
			this.rooms[i].push({"x":0, "y":0, "width":0, "height":0, "connections":[], "cellx":i, "celly":j});
		}
	}
}

ROT.Map.Rogue.prototype._connectRooms = function() {
	//pick random starting grid
	var cgx = ROT.RNG.getUniformInt(0, this._options.cellWidth-1);
	var cgy = ROT.RNG.getUniformInt(0, this._options.cellHeight-1);
	
	var idx;
	var ncgx;
	var ncgy;
	
	var found = false;
	var room;
	var otherRoom;
	
	// find  unconnected neighbour cells
	do {
	
		//var dirToCheck = [0,1,2,3,4,5,6,7];
		var dirToCheck = [0,2,4,6];
		dirToCheck = dirToCheck.randomize();
		
		do {
			found = false;
			idx = dirToCheck.pop();
			
			
			ncgx = cgx + ROT.DIRS[8][idx][0];
			ncgy = cgy + ROT.DIRS[8][idx][1];
			
			if(ncgx < 0 || ncgx >= this._options.cellWidth) continue;
			if(ncgy < 0 || ncgy >= this._options.cellHeight) continue;
			
			room = this.rooms[cgx][cgy];
			
			if(room["connections"].length > 0)
			{
				// as long as this room doesn't already coonect to me, we are ok with it. 
				if(room["connections"][0][0] == ncgx &&
				room["connections"][0][1] == ncgy)
				{
					break;
				}
			}
			
			otherRoom = this.rooms[ncgx][ncgy];
			
			if (otherRoom["connections"].length == 0) { 
				otherRoom["connections"].push([cgx,cgy]);
				
				this.connectedCells.push([ncgx, ncgy]);
				cgx = ncgx;
				cgy = ncgy;
				found = true;
			}
					
		} while (dirToCheck.length > 0 && found == false)
		
	} while (dirToCheck.length > 0)

}

ROT.Map.Rogue.prototype._connectUnconnectedRooms = function() {
	//While there are unconnected rooms, try to connect them to a random connected neighbor 
	//(if a room has no connected neighbors yet, just keep cycling, you'll fill out to it eventually).
	var cw = this._options.cellWidth;
	var ch = this._options.cellHeight;
	
	var randomConnectedCell;
	this.connectedCells = this.connectedCells.randomize();
	var room;
	var otherRoom;
	var validRoom;
	
	for (var i = 0; i < this._options.cellWidth; i++) {
		for (var j = 0; j < this._options.cellHeight; j++)  {
				
			room = this.rooms[i][j];
			
			if (room["connections"].length == 0) {
				var directions = [0,2,4,6];
				directions = directions.randomize();
				
				var validRoom = false;
				
				do {
					
					var dirIdx = directions.pop();
					var newI = i + ROT.DIRS[8][dirIdx][0];
					var newJ = j + ROT.DIRS[8][dirIdx][1];
					
					if (newI < 0 || newI >= cw || 
					newJ < 0 || newJ >= ch) {
						continue;
					}
					
					otherRoom = this.rooms[newI][newJ];
					
					validRoom = true;
					
					if (otherRoom["connections"].length == 0) {
						break;
					}
					
					for (var k = 0; k < otherRoom["connections"].length; k++) {
						if(otherRoom["connections"][k][0] == i && 
						otherRoom["connections"][k][1] == j) {
							validRoom = false;
							break;
						}
					}
					
					if (validRoom) break;
					
				} while (directions.length)
				
				if(validRoom) { 
					room["connections"].push( [otherRoom["cellx"], otherRoom["celly"]] );  
				} else {
					console.log("-- Unable to connect room.");
				}
			}
		}
	}
}

ROT.Map.Rogue.prototype._createRandomRoomConnections = function(connections) {
	// Empty for now. 
}


ROT.Map.Rogue.prototype._createRooms = function() {
	// Create Rooms 
	
	var w = this._width;
	var h = this._height;
	
	var cw = this._options.cellWidth;
	var ch = this._options.cellHeight;
	
	var cwp = Math.floor(this._width / cw);
	var chp = Math.floor(this._height / ch);
	
	var roomw;
	var roomh;
	var roomWidth = this._options["roomWidth"];
	var roomHeight = this._options["roomHeight"];
	var sx;
	var sy;
	var tx;
	var ty;
	var otherRoom;
	
	for (var i = 0; i < cw; i++) {
		for (var j = 0; j < ch; j++) {
			sx = cwp * i;
			sy = chp * j;
			
			if (sx == 0) sx = 1;
			if (sy == 0) sy = 1;
			
			roomw = ROT.RNG.getUniformInt(roomWidth[0], roomWidth[1]);
			roomh = ROT.RNG.getUniformInt(roomHeight[0], roomHeight[1]);
			
			if (j > 0) {
				otherRoom = this.rooms[i][j-1];
				while (sy - (otherRoom["y"] + otherRoom["height"] ) < 3) {
					sy++;
				}
			}
			
			if (i > 0) {
				otherRoom = this.rooms[i-1][j];
				while(sx - (otherRoom["x"] + otherRoom["width"]) < 3) {
					sx++;
				}
			}
			
			var sxOffset = Math.round(ROT.RNG.getUniformInt(0, cwp-roomw)/2);
			var syOffset = Math.round(ROT.RNG.getUniformInt(0, chp-roomh)/2);
			
			while (sx + sxOffset + roomw >= w) {
				if(sxOffset) {
					sxOffset--;
				} else {
					roomw--; 
				}
			}
			
			while (sy + syOffset + roomh >= h) { 
				if(syOffset) {
					syOffset--;
				} else {
					roomh--; 
				}
			}
			
			sx = sx + sxOffset;
			sy = sy + syOffset;
			
			this.rooms[i][j]["x"] = sx;
			this.rooms[i][j]["y"] = sy;
			this.rooms[i][j]["width"] = roomw;
			this.rooms[i][j]["height"] = roomh;  
			
			for (var ii = sx; ii < sx + roomw; ii++) {
				for (var jj = sy; jj < sy + roomh; jj++) {
					this.map[ii][jj] = 0;
				}
			}  
		}
	}
}

ROT.Map.Rogue.prototype._getWallPosition = function(aRoom, aDirection) {
	var rx;
	var ry;
	var door;
	
	if (aDirection == 1 || aDirection == 3) {
		rx = ROT.RNG.getUniformInt(aRoom["x"] + 1, aRoom["x"] + aRoom["width"] - 2);
		if (aDirection == 1) {
			ry = aRoom["y"] - 2;
			door = ry + 1;
		} else {
			ry = aRoom["y"] + aRoom["height"] + 1;
			door = ry -1;
		}
		
		this.map[rx][door] = 0; // i'm not setting a specific 'door' tile value right now, just empty space. 
		
	} else if (aDirection == 2 || aDirection == 4) {
		ry = ROT.RNG.getUniformInt(aRoom["y"] + 1, aRoom["y"] + aRoom["height"] - 2);
		if(aDirection == 2) {
			rx = aRoom["x"] + aRoom["width"] + 1;
			door = rx - 1;
		} else {
			rx = aRoom["x"] - 2;
			door = rx + 1;
		}
		
		this.map[door][ry] = 0; // i'm not setting a specific 'door' tile value right now, just empty space. 
		
	}
	return [rx, ry];
}

/***
* @param startPosition a 2 element array
* @param endPosition a 2 element array
*/
ROT.Map.Rogue.prototype._drawCorridore = function (startPosition, endPosition) {
	var xOffset = endPosition[0] - startPosition[0];
	var yOffset = endPosition[1] - startPosition[1];
	
	var xpos = startPosition[0];
	var ypos = startPosition[1];
	
	var tempDist;
	var xDir;
	var yDir;
	
	var move; // 2 element array, element 0 is the direction, element 1 is the total value to move. 
	var moves = []; // a list of 2 element arrays
	
	var xAbs = Math.abs(xOffset);
	var yAbs = Math.abs(yOffset);
	
	var percent = ROT.RNG.getUniform(); // used to split the move at different places along the long axis
	var firstHalf = percent;
	var secondHalf = 1 - percent;
	
	xDir = xOffset > 0 ? 2 : 6;
	yDir = yOffset > 0 ? 4 : 0;
	
	if (xAbs < yAbs) {
		// move firstHalf of the y offset
		tempDist = Math.ceil(yAbs * firstHalf);
		moves.push([yDir, tempDist]);
		// move all the x offset
		moves.push([xDir, xAbs]);
		// move sendHalf of the  y offset
		tempDist = Math.floor(yAbs * secondHalf);
		moves.push([yDir, tempDist]);
	} else {
		//  move firstHalf of the x offset
		tempDist = Math.ceil(xAbs * firstHalf);
		moves.push([xDir, tempDist]);
		// move all the y offset
		moves.push([yDir, yAbs]);
		// move secondHalf of the x offset.
		tempDist = Math.floor(xAbs * secondHalf);
		moves.push([xDir, tempDist]);  
	}
	
	this.map[xpos][ypos] = 0;
	
	while (moves.length > 0) {
		move = moves.pop();
		while (move[1] > 0) {
			xpos += ROT.DIRS[8][move[0]][0];
			ypos += ROT.DIRS[8][move[0]][1];
			this.map[xpos][ypos] = 0;
			move[1] = move[1] - 1;
		}
	}
}

ROT.Map.Rogue.prototype._createCorridors = function () {
	// Draw Corridors between connected rooms
	
	var cw = this._options.cellWidth;
	var ch = this._options.cellHeight;
	var room;
	var connection;
	var otherRoom;
	var wall;
	var otherWall;
	
	for (var i = 0; i < cw; i++) {
		for (var j = 0; j < ch; j++) {
			room = this.rooms[i][j];
			
			for (var k = 0; k < room["connections"].length; k++) {
					
				connection = room["connections"][k]; 
				
				otherRoom = this.rooms[connection[0]][connection[1]];
				
				// figure out what wall our corridor will start one.
				// figure out what wall our corridor will end on. 
				if (otherRoom["cellx"] > room["cellx"] ) {
					wall = 2;
					otherWall = 4;
				} else if (otherRoom["cellx"] < room["cellx"] ) {
					wall = 4;
					otherWall = 2;
				} else if(otherRoom["celly"] > room["celly"]) {
					wall = 3;
					otherWall = 1;
				} else if(otherRoom["celly"] < room["celly"]) {
					wall = 1;
					otherWall = 3;
				}
				
				this._drawCorridore(this._getWallPosition(room, wall), this._getWallPosition(otherRoom, otherWall));
			}
		}
	}
}
/**
 * @class Dungeon feature; has own .create() method
 */
ROT.Map.Feature = function() {}
ROT.Map.Feature.prototype.isValid = function(canBeDugCallback) {}
ROT.Map.Feature.prototype.create = function(digCallback) {}
ROT.Map.Feature.prototype.debug = function() {}
ROT.Map.Feature.createRandomAt = function(x, y, dx, dy, options) {}

/**
 * @class Room
 * @augments ROT.Map.Feature
 * @param {int} x1
 * @param {int} y1
 * @param {int} x2
 * @param {int} y2
 * @param {int} [doorX]
 * @param {int} [doorY]
 */
ROT.Map.Feature.Room = function(x1, y1, x2, y2, doorX, doorY) {
	this._x1 = x1;
	this._y1 = y1;
	this._x2 = x2;
	this._y2 = y2;
	this._doors = {};
	if (arguments.length > 4) { this.addDoor(doorX, doorY); }
}
ROT.Map.Feature.Room.extend(ROT.Map.Feature);

/**
 * Room of random size, with a given doors and direction
 */
ROT.Map.Feature.Room.createRandomAt = function(x, y, dx, dy, options) {
	var min = options.roomWidth[0];
	var max = options.roomWidth[1];
	var width = ROT.RNG.getUniformInt(min, max);
	
	var min = options.roomHeight[0];
	var max = options.roomHeight[1];
	var height = ROT.RNG.getUniformInt(min, max);
	
	if (dx == 1) { /* to the right */
		var y2 = y - Math.floor(ROT.RNG.getUniform() * height);
		return new this(x+1, y2, x+width, y2+height-1, x, y);
	}
	
	if (dx == -1) { /* to the left */
		var y2 = y - Math.floor(ROT.RNG.getUniform() * height);
		return new this(x-width, y2, x-1, y2+height-1, x, y);
	}

	if (dy == 1) { /* to the bottom */
		var x2 = x - Math.floor(ROT.RNG.getUniform() * width);
		return new this(x2, y+1, x2+width-1, y+height, x, y);
	}

	if (dy == -1) { /* to the top */
		var x2 = x - Math.floor(ROT.RNG.getUniform() * width);
		return new this(x2, y-height, x2+width-1, y-1, x, y);
	}

        throw new Error("dx or dy must be 1 or -1");
}

/**
 * Room of random size, positioned around center coords
 */
ROT.Map.Feature.Room.createRandomCenter = function(cx, cy, options) {
	var min = options.roomWidth[0];
	var max = options.roomWidth[1];
	var width = ROT.RNG.getUniformInt(min, max);
	
	var min = options.roomHeight[0];
	var max = options.roomHeight[1];
	var height = ROT.RNG.getUniformInt(min, max);

	var x1 = cx - Math.floor(ROT.RNG.getUniform()*width);
	var y1 = cy - Math.floor(ROT.RNG.getUniform()*height);
	var x2 = x1 + width - 1;
	var y2 = y1 + height - 1;

	return new this(x1, y1, x2, y2);
}

/**
 * Room of random size within a given dimensions
 */
ROT.Map.Feature.Room.createRandom = function(availWidth, availHeight, options) {
	var min = options.roomWidth[0];
	var max = options.roomWidth[1];
	var width = ROT.RNG.getUniformInt(min, max);
	
	var min = options.roomHeight[0];
	var max = options.roomHeight[1];
	var height = ROT.RNG.getUniformInt(min, max);
	
	var left = availWidth - width - 1;
	var top = availHeight - height - 1;

	var x1 = 1 + Math.floor(ROT.RNG.getUniform()*left);
	var y1 = 1 + Math.floor(ROT.RNG.getUniform()*top);
	var x2 = x1 + width - 1;
	var y2 = y1 + height - 1;

	return new this(x1, y1, x2, y2);
}

ROT.Map.Feature.Room.prototype.addDoor = function(x, y) {
	this._doors[x+","+y] = 1;
	return this;
}

/**
 * @param {function}
 */
ROT.Map.Feature.Room.prototype.getDoors = function(callback) {
	for (var key in this._doors) {
		var parts = key.split(",");
		callback(parseInt(parts[0]), parseInt(parts[1]));
	}
	return this;
}

ROT.Map.Feature.Room.prototype.clearDoors = function() {
	this._doors = {};
	return this;
}

ROT.Map.Feature.Room.prototype.addDoors = function(isWallCallback) {
	var left = this._x1-1;
	var right = this._x2+1;
	var top = this._y1-1;
	var bottom = this._y2+1;

	for (var x=left; x<=right; x++) {
		for (var y=top; y<=bottom; y++) {
			if (x != left && x != right && y != top && y != bottom) { continue; }
			if (isWallCallback(x, y)) { continue; }

			this.addDoor(x, y);
		}
	}

	return this;
}

ROT.Map.Feature.Room.prototype.debug = function() {
	console.log("room", this._x1, this._y1, this._x2, this._y2);
}

ROT.Map.Feature.Room.prototype.isValid = function(isWallCallback, canBeDugCallback) { 
	var left = this._x1-1;
	var right = this._x2+1;
	var top = this._y1-1;
	var bottom = this._y2+1;
	
	for (var x=left; x<=right; x++) {
		for (var y=top; y<=bottom; y++) {
			if (x == left || x == right || y == top || y == bottom) {
				if (!isWallCallback(x, y)) { return false; }
			} else {
				if (!canBeDugCallback(x, y)) { return false; }
			}
		}
	}

	return true;
}

/**
 * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty, 1 = wall, 2 = door. Multiple doors are allowed.
 */
ROT.Map.Feature.Room.prototype.create = function(digCallback) { 
	var left = this._x1-1;
	var right = this._x2+1;
	var top = this._y1-1;
	var bottom = this._y2+1;
	
	var value = 0;
	for (var x=left; x<=right; x++) {
		for (var y=top; y<=bottom; y++) {
			if (x+","+y in this._doors) {
				value = 2;
			} else if (x == left || x == right || y == top || y == bottom) {
				value = 1;
			} else {
				value = 0;
			}
			digCallback(x, y, value);
		}
	}
}

ROT.Map.Feature.Room.prototype.getCenter = function() {
	return [Math.round((this._x1 + this._x2)/2), Math.round((this._y1 + this._y2)/2)];
}

ROT.Map.Feature.Room.prototype.getLeft = function() {
	return this._x1;
}

ROT.Map.Feature.Room.prototype.getRight = function() {
	return this._x2;
}

ROT.Map.Feature.Room.prototype.getTop = function() {
	return this._y1;
}

ROT.Map.Feature.Room.prototype.getBottom = function() {
	return this._y2;
}

/**
 * @class Corridor
 * @augments ROT.Map.Feature
 * @param {int} startX
 * @param {int} startY
 * @param {int} endX
 * @param {int} endY
 */
ROT.Map.Feature.Corridor = function(startX, startY, endX, endY) {
	this._startX = startX;
	this._startY = startY;
	this._endX = endX; 
	this._endY = endY;
	this._endsWithAWall = true;
}
ROT.Map.Feature.Corridor.extend(ROT.Map.Feature);

ROT.Map.Feature.Corridor.createRandomAt = function(x, y, dx, dy, options) {
	var min = options.corridorLength[0];
	var max = options.corridorLength[1];
	var length = ROT.RNG.getUniformInt(min, max);
	
	return new this(x, y, x + dx*length, y + dy*length);
}

ROT.Map.Feature.Corridor.prototype.debug = function() {
	console.log("corridor", this._startX, this._startY, this._endX, this._endY);
}

ROT.Map.Feature.Corridor.prototype.isValid = function(isWallCallback, canBeDugCallback){ 
	var sx = this._startX;
	var sy = this._startY;
	var dx = this._endX-sx;
	var dy = this._endY-sy;
	var length = 1 + Math.max(Math.abs(dx), Math.abs(dy));
	
	if (dx) { dx = dx/Math.abs(dx); }
	if (dy) { dy = dy/Math.abs(dy); }
	var nx = dy;
	var ny = -dx;
	
	var ok = true;
	for (var i=0; i<length; i++) {
		var x = sx + i*dx;
		var y = sy + i*dy;

		if (!canBeDugCallback(     x,      y)) { ok = false; }
		if (!isWallCallback  (x + nx, y + ny)) { ok = false; }
		if (!isWallCallback  (x - nx, y - ny)) { ok = false; }
		
		if (!ok) {
			length = i;
			this._endX = x-dx;
			this._endY = y-dy;
			break;
		}
	}
	
	/**
	 * If the length degenerated, this corridor might be invalid
	 */
	 
	/* not supported */
	if (length == 0) { return false; } 
	
	 /* length 1 allowed only if the next space is empty */
	if (length == 1 && isWallCallback(this._endX + dx, this._endY + dy)) { return false; }
	
	/**
	 * We do not want the corridor to crash into a corner of a room;
	 * if any of the ending corners is empty, the N+1th cell of this corridor must be empty too.
	 * 
	 * Situation:
	 * #######1
	 * .......?
	 * #######2
	 * 
	 * The corridor was dug from left to right.
	 * 1, 2 - problematic corners, ? = N+1th cell (not dug)
	 */
	var firstCornerBad = !isWallCallback(this._endX + dx + nx, this._endY + dy + ny);
	var secondCornerBad = !isWallCallback(this._endX + dx - nx, this._endY + dy - ny);
	this._endsWithAWall = isWallCallback(this._endX + dx, this._endY + dy);
	if ((firstCornerBad || secondCornerBad) && this._endsWithAWall) { return false; }

	return true;
}

/**
 * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty.
 */
ROT.Map.Feature.Corridor.prototype.create = function(digCallback) { 
	var sx = this._startX;
	var sy = this._startY;
	var dx = this._endX-sx;
	var dy = this._endY-sy;
	var length = 1+Math.max(Math.abs(dx), Math.abs(dy));
	
	if (dx) { dx = dx/Math.abs(dx); }
	if (dy) { dy = dy/Math.abs(dy); }
	var nx = dy;
	var ny = -dx;
	
	for (var i=0; i<length; i++) {
		var x = sx + i*dx;
		var y = sy + i*dy;
		digCallback(x, y, 0);
	}
	
	return true;
}

ROT.Map.Feature.Corridor.prototype.createPriorityWalls = function(priorityWallCallback) {
	if (!this._endsWithAWall) { return; }

	var sx = this._startX;
	var sy = this._startY;

	var dx = this._endX-sx;
	var dy = this._endY-sy;
	if (dx) { dx = dx/Math.abs(dx); }
	if (dy) { dy = dy/Math.abs(dy); }
	var nx = dy;
	var ny = -dx;

	priorityWallCallback(this._endX + dx, this._endY + dy);
	priorityWallCallback(this._endX + nx, this._endY + ny);
	priorityWallCallback(this._endX - nx, this._endY - ny);
}
/**
 * @class Base noise generator
 */
ROT.Noise = function() {
};

ROT.Noise.prototype.get = function(x, y) {}
/**
 * A simple 2d implementation of simplex noise by Ondrej Zara
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 */

/**
 * @class 2D simplex noise generator
 * @param {int} [gradients=256] Random gradients
 */
ROT.Noise.Simplex = function(gradients) {
	ROT.Noise.call(this);

	this._F2 = 0.5 * (Math.sqrt(3) - 1);
	this._G2 = (3 - Math.sqrt(3)) / 6;

	this._gradients = [
		[ 0, -1],
		[ 1, -1],
		[ 1,  0],
		[ 1,  1],
		[ 0,  1],
		[-1,  1],
		[-1,  0],
		[-1, -1]
	];

	var permutations = [];
	var count = gradients || 256;
	for (var i=0;i<count;i++) { permutations.push(i); }
	permutations = permutations.randomize();

	this._perms = [];
	this._indexes = [];

	for (var i=0;i<2*count;i++) {
		this._perms.push(permutations[i % count]);
		this._indexes.push(this._perms[i] % this._gradients.length);
	}

};
ROT.Noise.Simplex.extend(ROT.Noise);

ROT.Noise.Simplex.prototype.get = function(xin, yin) {
	var perms = this._perms;
	var indexes = this._indexes;
	var count = perms.length/2;
	var G2 = this._G2;

	var n0 =0, n1 = 0, n2 = 0, gi; // Noise contributions from the three corners

	// Skew the input space to determine which simplex cell we're in
	var s = (xin + yin) * this._F2; // Hairy factor for 2D
	var i = Math.floor(xin + s);
	var j = Math.floor(yin + s);
	var t = (i + j) * G2;
	var X0 = i - t; // Unskew the cell origin back to (x,y) space
	var Y0 = j - t;
	var x0 = xin - X0; // The x,y distances from the cell origin
	var y0 = yin - Y0;

	// For the 2D case, the simplex shape is an equilateral triangle.
	// Determine which simplex we are in.
	var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
	if (x0 > y0) {
		i1 = 1;
		j1 = 0;
	} else { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
		i1 = 0;
		j1 = 1;
	} // upper triangle, YX order: (0,0)->(0,1)->(1,1)

	// A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
	// a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
	// c = (3-sqrt(3))/6
	var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
	var y1 = y0 - j1 + G2;
	var x2 = x0 - 1 + 2*G2; // Offsets for last corner in (x,y) unskewed coords
	var y2 = y0 - 1 + 2*G2;

	// Work out the hashed gradient indices of the three simplex corners
	var ii = i.mod(count);
	var jj = j.mod(count);

	// Calculate the contribution from the three corners
	var t0 = 0.5 - x0*x0 - y0*y0;
	if (t0 >= 0) {
		t0 *= t0;
		gi = indexes[ii+perms[jj]];
		var grad = this._gradients[gi];
		n0 = t0 * t0 * (grad[0] * x0 + grad[1] * y0);
	}
	
	var t1 = 0.5 - x1*x1 - y1*y1;
	if (t1 >= 0) {
		t1 *= t1;
		gi = indexes[ii+i1+perms[jj+j1]];
		var grad = this._gradients[gi];
		n1 = t1 * t1 * (grad[0] * x1 + grad[1] * y1);
	}
	
	var t2 = 0.5 - x2*x2 - y2*y2;
	if (t2 >= 0) {
		t2 *= t2;
		gi = indexes[ii+1+perms[jj+1]];
		var grad = this._gradients[gi];
		n2 = t2 * t2 * (grad[0] * x2 + grad[1] * y2);
	}

	// Add contributions from each corner to get the final noise value.
	// The result is scaled to return values in the interval [-1,1].
	return 70 * (n0 + n1 + n2);
}
/**
 * @class Abstract FOV algorithm
 * @param {function} lightPassesCallback Does the light pass through x,y?
 * @param {object} [options]
 * @param {int} [options.topology=8] 4/6/8
 */
ROT.FOV = function(lightPassesCallback, options) {
	this._lightPasses = lightPassesCallback;
	this._options = {
		topology: 8
	}
	for (var p in options) { this._options[p] = options[p]; }
};

/**
 * Compute visibility for a 360-degree circle
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {function} callback
 */
ROT.FOV.prototype.compute = function(x, y, R, callback) {}

/**
 * Return all neighbors in a concentric ring
 * @param {int} cx center-x
 * @param {int} cy center-y
 * @param {int} r range
 */
ROT.FOV.prototype._getCircle = function(cx, cy, r) {
	var result = [];
	var dirs, countFactor, startOffset;

	switch (this._options.topology) {
		case 4:
			countFactor = 1;
			startOffset = [0, 1];
			dirs = [
				ROT.DIRS[8][7],
				ROT.DIRS[8][1],
				ROT.DIRS[8][3],
				ROT.DIRS[8][5]
			]
		break;

		case 6:
			dirs = ROT.DIRS[6];
			countFactor = 1;
			startOffset = [-1, 1];
		break;

		case 8:
			dirs = ROT.DIRS[4];
			countFactor = 2;
			startOffset = [-1, 1];
		break;
	}

	/* starting neighbor */
	var x = cx + startOffset[0]*r;
	var y = cy + startOffset[1]*r;

	/* circle */
	for (var i=0;i<dirs.length;i++) {
		for (var j=0;j<r*countFactor;j++) {
			result.push([x, y]);
			x += dirs[i][0];
			y += dirs[i][1];

		}
	}

	return result;
}
/**
 * @class Discrete shadowcasting algorithm. Obsoleted by Precise shadowcasting.
 * @augments ROT.FOV
 */
ROT.FOV.DiscreteShadowcasting = function(lightPassesCallback, options) {
	ROT.FOV.call(this, lightPassesCallback, options);
}
ROT.FOV.DiscreteShadowcasting.extend(ROT.FOV);

/**
 * @see ROT.FOV#compute
 */
ROT.FOV.DiscreteShadowcasting.prototype.compute = function(x, y, R, callback) {
	var center = this._coords;
	var map = this._map;

	/* this place is always visible */
	callback(x, y, 0, 1);

	/* standing in a dark place. FIXME is this a good idea?  */
	if (!this._lightPasses(x, y)) { return; }
	
	/* start and end angles */
	var DATA = [];
	
	var A, B, cx, cy, blocks;

	/* analyze surrounding cells in concentric rings, starting from the center */
	for (var r=1; r<=R; r++) {
		var neighbors = this._getCircle(x, y, r);
		var angle = 360 / neighbors.length;

		for (var i=0;i<neighbors.length;i++) {
			cx = neighbors[i][0];
			cy = neighbors[i][1];
			A = angle * (i - 0.5);
			B = A + angle;
			
			blocks = !this._lightPasses(cx, cy);
			if (this._visibleCoords(Math.floor(A), Math.ceil(B), blocks, DATA)) { callback(cx, cy, r, 1); }
			
			if (DATA.length == 2 && DATA[0] == 0 && DATA[1] == 360) { return; } /* cutoff? */

		} /* for all cells in this ring */
	} /* for all rings */
}

/**
 * @param {int} A start angle
 * @param {int} B end angle
 * @param {bool} blocks Does current cell block visibility?
 * @param {int[][]} DATA shadowed angle pairs
 */
ROT.FOV.DiscreteShadowcasting.prototype._visibleCoords = function(A, B, blocks, DATA) {
	if (A < 0) { 
		var v1 = arguments.callee(0, B, blocks, DATA);
		var v2 = arguments.callee(360+A, 360, blocks, DATA);
		return v1 || v2;
	}
	
	var index = 0;
	while (index < DATA.length && DATA[index] < A) { index++; }
	
	if (index == DATA.length) { /* completely new shadow */
		if (blocks) { DATA.push(A, B); } 
		return true;
	}
	
	var count = 0;
	
	if (index % 2) { /* this shadow starts in an existing shadow, or within its ending boundary */
		while (index < DATA.length && DATA[index] < B) {
			index++;
			count++;
		}
		
		if (count == 0) { return false; }
		
		if (blocks) { 
			if (count % 2) {
				DATA.splice(index-count, count, B);
			} else {
				DATA.splice(index-count, count);
			}
		}
		
		return true;

	} else { /* this shadow starts outside an existing shadow, or within a starting boundary */
		while (index < DATA.length && DATA[index] < B) {
			index++;
			count++;
		}
		
		/* visible when outside an existing shadow, or when overlapping */
		if (A == DATA[index-count] && count == 1) { return false; }
		
		if (blocks) { 
			if (count % 2) {
				DATA.splice(index-count, count, A);
			} else {
				DATA.splice(index-count, count, A, B);
			}
		}
			
		return true;
	}
}
/**
 * @class Precise shadowcasting algorithm
 * @augments ROT.FOV
 */
ROT.FOV.PreciseShadowcasting = function(lightPassesCallback, options) {
	ROT.FOV.call(this, lightPassesCallback, options);
}
ROT.FOV.PreciseShadowcasting.extend(ROT.FOV);

/**
 * @see ROT.FOV#compute
 */
ROT.FOV.PreciseShadowcasting.prototype.compute = function(x, y, R, callback) {
	/* this place is always visible */
	callback(x, y, 0, 1);

	/* standing in a dark place. FIXME is this a good idea?  */
	if (!this._lightPasses(x, y)) { return; }
	
	/* list of all shadows */
	var SHADOWS = [];
	
	var cx, cy, blocks, A1, A2, visibility;

	/* analyze surrounding cells in concentric rings, starting from the center */
	for (var r=1; r<=R; r++) {
		var neighbors = this._getCircle(x, y, r);
		var neighborCount = neighbors.length;

		for (var i=0;i<neighborCount;i++) {
			cx = neighbors[i][0];
			cy = neighbors[i][1];
			/* shift half-an-angle backwards to maintain consistency of 0-th cells */
			A1 = [i ? 2*i-1 : 2*neighborCount-1, 2*neighborCount];
			A2 = [2*i+1, 2*neighborCount]; 
			
			blocks = !this._lightPasses(cx, cy);
			visibility = this._checkVisibility(A1, A2, blocks, SHADOWS);
			if (visibility) { callback(cx, cy, r, visibility); }

			if (SHADOWS.length == 2 && SHADOWS[0][0] == 0 && SHADOWS[1][0] == SHADOWS[1][1]) { return; } /* cutoff? */

		} /* for all cells in this ring */
	} /* for all rings */
}

/**
 * @param {int[2]} A1 arc start
 * @param {int[2]} A2 arc end
 * @param {bool} blocks Does current arc block visibility?
 * @param {int[][]} SHADOWS list of active shadows
 */
ROT.FOV.PreciseShadowcasting.prototype._checkVisibility = function(A1, A2, blocks, SHADOWS) {
	if (A1[0] > A2[0]) { /* split into two sub-arcs */
		var v1 = this._checkVisibility(A1, [A1[1], A1[1]], blocks, SHADOWS);
		var v2 = this._checkVisibility([0, 1], A2, blocks, SHADOWS);
		return (v1+v2)/2;
	}

	/* index1: first shadow >= A1 */
	var index1 = 0, edge1 = false;
	while (index1 < SHADOWS.length) {
		var old = SHADOWS[index1];
		var diff = old[0]*A1[1] - A1[0]*old[1];
		if (diff >= 0) { /* old >= A1 */
			if (diff == 0 && !(index1 % 2)) { edge1 = true; }
			break;
		}
		index1++;
	}

	/* index2: last shadow <= A2 */
	var index2 = SHADOWS.length, edge2 = false;
	while (index2--) {
		var old = SHADOWS[index2];
		var diff = A2[0]*old[1] - old[0]*A2[1];
		if (diff >= 0) { /* old <= A2 */
			if (diff == 0 && (index2 % 2)) { edge2 = true; }
			break;
		}
	}

	var visible = true;
	if (index1 == index2 && (edge1 || edge2)) {  /* subset of existing shadow, one of the edges match */
		visible = false; 
	} else if (edge1 && edge2 && index1+1==index2 && (index2 % 2)) { /* completely equivalent with existing shadow */
		visible = false;
	} else if (index1 > index2 && (index1 % 2)) { /* subset of existing shadow, not touching */
		visible = false;
	}
	
	if (!visible) { return 0; } /* fast case: not visible */
	
	var visibleLength, P;

	/* compute the length of visible arc, adjust list of shadows (if blocking) */
	var remove = index2-index1+1;
	if (remove % 2) {
		if (index1 % 2) { /* first edge within existing shadow, second outside */
			var P = SHADOWS[index1];
			visibleLength = (A2[0]*P[1] - P[0]*A2[1]) / (P[1] * A2[1]);
			if (blocks) { SHADOWS.splice(index1, remove, A2); }
		} else { /* second edge within existing shadow, first outside */
			var P = SHADOWS[index2];
			visibleLength = (P[0]*A1[1] - A1[0]*P[1]) / (A1[1] * P[1]);
			if (blocks) { SHADOWS.splice(index1, remove, A1); }
		}
	} else {
		if (index1 % 2) { /* both edges within existing shadows */
			var P1 = SHADOWS[index1];
			var P2 = SHADOWS[index2];
			visibleLength = (P2[0]*P1[1] - P1[0]*P2[1]) / (P1[1] * P2[1]);
			if (blocks) { SHADOWS.splice(index1, remove); }
		} else { /* both edges outside existing shadows */
			if (blocks) { SHADOWS.splice(index1, remove, A1, A2); }
			return 1; /* whole arc visible! */
		}
	}

	var arcLength = (A2[0]*A1[1] - A1[0]*A2[1]) / (A1[1] * A2[1]);

	return visibleLength/arcLength;
}
/**
 * @class Recursive shadowcasting algorithm
 * Currently only supports 4/8 topologies, not hexagonal.
 * Based on Peter Harkins' implementation of Björn Bergström's algorithm described here: http://www.roguebasin.com/index.php?title=FOV_using_recursive_shadowcasting
 * @augments ROT.FOV
 */
ROT.FOV.RecursiveShadowcasting = function(lightPassesCallback, options) {
	ROT.FOV.call(this, lightPassesCallback, options);
}
ROT.FOV.RecursiveShadowcasting.extend(ROT.FOV);

/** Octants used for translating recursive shadowcasting offsets */
ROT.FOV.RecursiveShadowcasting.OCTANTS = [
	[-1,  0,  0,  1],
	[ 0, -1,  1,  0],
	[ 0, -1, -1,  0],
	[-1,  0,  0, -1],
	[ 1,  0,  0, -1],
	[ 0,  1, -1,  0],
	[ 0,  1,  1,  0],
	[ 1,  0,  0,  1]
];

/**
 * Compute visibility for a 360-degree circle
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {function} callback
 */
ROT.FOV.RecursiveShadowcasting.prototype.compute = function(x, y, R, callback) {
	//You can always see your own tile
	callback(x, y, 0, 1);
	for(var i = 0; i < ROT.FOV.RecursiveShadowcasting.OCTANTS.length; i++) {
		this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[i], R, callback);
	}
}

/**
 * Compute visibility for a 180-degree arc
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {int} dir Direction to look in (expressed in a ROT.DIRS value);
 * @param {function} callback
 */
ROT.FOV.RecursiveShadowcasting.prototype.compute180 = function(x, y, R, dir, callback) {
	//You can always see your own tile
	callback(x, y, 0, 1);
	var previousOctant = (dir - 1 + 8) % 8; //Need to retrieve the previous octant to render a full 180 degrees
	var nextPreviousOctant = (dir - 2 + 8) % 8; //Need to retrieve the previous two octants to render a full 180 degrees
	var nextOctant = (dir+ 1 + 8) % 8; //Need to grab to next octant to render a full 180 degrees
	this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[nextPreviousOctant], R, callback);
	this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[previousOctant], R, callback);
	this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[dir], R, callback);
	this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[nextOctant], R, callback);
}

/**
 * Compute visibility for a 90-degree arc
 * @param {int} x
 * @param {int} y
 * @param {int} R Maximum visibility radius
 * @param {int} dir Direction to look in (expressed in a ROT.DIRS value);
 * @param {function} callback
 */
ROT.FOV.RecursiveShadowcasting.prototype.compute90 = function(x, y, R, dir, callback) {
	//You can always see your own tile
	callback(x, y, 0, 1);
	var previousOctant = (dir - 1 + 8) % 8; //Need to retrieve the previous octant to render a full 90 degrees
	this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[dir], R, callback);
	this._renderOctant(x, y, ROT.FOV.RecursiveShadowcasting.OCTANTS[previousOctant], R, callback);
}

/**
 * Render one octant (45-degree arc) of the viewshed
 * @param {int} x
 * @param {int} y
 * @param {int} octant Octant to be rendered
 * @param {int} R Maximum visibility radius
 * @param {function} callback
 */
ROT.FOV.RecursiveShadowcasting.prototype._renderOctant = function(x, y, octant, R, callback) {
	//Radius incremented by 1 to provide same coverage area as other shadowcasting radiuses
	this._castVisibility(x, y, 1, 1.0, 0.0, R + 1, octant[0], octant[1], octant[2], octant[3], callback);
}

/**
 * Actually calculates the visibility
 * @param {int} startX The starting X coordinate
 * @param {int} startY The starting Y coordinate
 * @param {int} row The row to render
 * @param {float} visSlopeStart The slope to start at
 * @param {float} visSlopeEnd The slope to end at
 * @param {int} radius The radius to reach out to
 * @param {int} xx 
 * @param {int} xy 
 * @param {int} yx 
 * @param {int} yy 
 * @param {function} callback The callback to use when we hit a block that is visible
 */
ROT.FOV.RecursiveShadowcasting.prototype._castVisibility = function(startX, startY, row, visSlopeStart, visSlopeEnd, radius, xx, xy, yx, yy, callback) {
	if(visSlopeStart < visSlopeEnd) { return; }
	for(var i = row; i <= radius; i++) {
		var dx = -i - 1;
		var dy = -i;
		var blocked = false;
		var newStart = 0;

		//'Row' could be column, names here assume octant 0 and would be flipped for half the octants
		while(dx <= 0) {
			dx += 1;

			//Translate from relative coordinates to map coordinates
			var mapX = startX + dx * xx + dy * xy;
			var mapY = startY + dx * yx + dy * yy;

			//Range of the row
			var slopeStart = (dx - 0.5) / (dy + 0.5);
			var slopeEnd = (dx + 0.5) / (dy - 0.5);
		
			//Ignore if not yet at left edge of Octant
			if(slopeEnd > visSlopeStart) { continue; }
			
			//Done if past right edge
			if(slopeStart < visSlopeEnd) { break; }
				
			//If it's in range, it's visible
			if((dx * dx + dy * dy) < (radius * radius)) {
				callback(mapX, mapY, i, 1);
			}
	
			if(!blocked) {
				//If tile is a blocking tile, cast around it
				if(!this._lightPasses(mapX, mapY) && i < radius) {
					blocked = true;
					this._castVisibility(startX, startY, i + 1, visSlopeStart, slopeStart, radius, xx, xy, yx, yy, callback);
					newStart = slopeEnd;
				}
			} else {
				//Keep narrowing if scanning across a block
				if(!this._lightPasses(mapX, mapY)) {
					newStart = slopeEnd;
					continue;
				}
			
				//Block has ended
				blocked = false;
				visSlopeStart = newStart;
			}
		}
		if(blocked) { break; }
	}
}
/**
 * @namespace Color operations
 */
ROT.Color = {
	fromString: function(str) {
		var cached, r;
		if (str in this._cache) {
			cached = this._cache[str];
		} else {
			if (str.charAt(0) == "#") { /* hex rgb */

				var values = str.match(/[0-9a-f]/gi).map(function(x) { return parseInt(x, 16); });
				if (values.length == 3) {
					cached = values.map(function(x) { return x*17; });
				} else {
					for (var i=0;i<3;i++) {
						values[i+1] += 16*values[i];
						values.splice(i, 1);
					}
					cached = values;
				}

			} else if ((r = str.match(/rgb\(([0-9, ]+)\)/i))) { /* decimal rgb */
				cached = r[1].split(/\s*,\s*/).map(function(x) { return parseInt(x); });
			} else { /* html name */
				cached = [0, 0, 0];
			}

			this._cache[str] = cached;
		}

		return cached.slice();
	},

	/**
	 * Add two or more colors
	 * @param {number[]} color1
	 * @param {number[]} color2
	 * @returns {number[]}
	 */
	add: function(color1, color2) {
		var result = color1.slice();
		for (var i=0;i<3;i++) {
			for (var j=1;j<arguments.length;j++) {
				result[i] += arguments[j][i];
			}
		}
		return result;
	},

	/**
	 * Add two or more colors, MODIFIES FIRST ARGUMENT
	 * @param {number[]} color1
	 * @param {number[]} color2
	 * @returns {number[]}
	 */
	add_: function(color1, color2) {
		for (var i=0;i<3;i++) {
			for (var j=1;j<arguments.length;j++) {
				color1[i] += arguments[j][i];
			}
		}
		return color1;
	},

	/**
	 * Multiply (mix) two or more colors
	 * @param {number[]} color1
	 * @param {number[]} color2
	 * @returns {number[]}
	 */
	multiply: function(color1, color2) {
		var result = color1.slice();
		for (var i=0;i<3;i++) {
			for (var j=1;j<arguments.length;j++) {
				result[i] *= arguments[j][i] / 255;
			}
			result[i] = Math.round(result[i]);
		}
		return result;
	},

	/**
	 * Multiply (mix) two or more colors, MODIFIES FIRST ARGUMENT
	 * @param {number[]} color1
	 * @param {number[]} color2
	 * @returns {number[]}
	 */
	multiply_: function(color1, color2) {
		for (var i=0;i<3;i++) {
			for (var j=1;j<arguments.length;j++) {
				color1[i] *= arguments[j][i] / 255;
			}
			color1[i] = Math.round(color1[i]);
		}
		return color1;
	},

	/**
	 * Interpolate (blend) two colors with a given factor
	 * @param {number[]} color1
	 * @param {number[]} color2
	 * @param {float} [factor=0.5] 0..1
	 * @returns {number[]}
	 */
	interpolate: function(color1, color2, factor) {
		if (arguments.length < 3) { factor = 0.5; }
		var result = color1.slice();
		for (var i=0;i<3;i++) {
			result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
		}
		return result;
	},

	/**
	 * Interpolate (blend) two colors with a given factor in HSL mode
	 * @param {number[]} color1
	 * @param {number[]} color2
	 * @param {float} [factor=0.5] 0..1
	 * @returns {number[]}
	 */
	interpolateHSL: function(color1, color2, factor) {
		if (arguments.length < 3) { factor = 0.5; }
		var hsl1 = this.rgb2hsl(color1);
		var hsl2 = this.rgb2hsl(color2);
		for (var i=0;i<3;i++) {
			hsl1[i] += factor*(hsl2[i]-hsl1[i]);
		}
		return this.hsl2rgb(hsl1);
	},

	/**
	 * Create a new random color based on this one
	 * @param {number[]} color
	 * @param {number[]} diff Set of standard deviations
	 * @returns {number[]}
	 */
	randomize: function(color, diff) {
		if (!(diff instanceof Array)) { diff = Math.round(ROT.RNG.getNormal(0, diff)); }
		var result = color.slice();
		for (var i=0;i<3;i++) {
			result[i] += (diff instanceof Array ? Math.round(ROT.RNG.getNormal(0, diff[i])) : diff);
		}
		return result;
	},

	/**
	 * Converts an RGB color value to HSL. Expects 0..255 inputs, produces 0..1 outputs.
	 * @param {number[]} color
	 * @returns {number[]}
	 */
	rgb2hsl: function(color) {
		var r = color[0]/255;
		var g = color[1]/255;
		var b = color[2]/255;

		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if (max == min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
			switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}

		return [h, s, l];
	},

	/**
	 * Converts an HSL color value to RGB. Expects 0..1 inputs, produces 0..255 outputs.
	 * @param {number[]} color
	 * @returns {number[]}
	 */
	hsl2rgb: function(color) {
		var l = color[2];

		if (color[1] == 0) {
			l = Math.round(l*255);
			return [l, l, l];
		} else {
			var hue2rgb = function(p, q, t) {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			}

			var s = color[1];
			var q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
			var p = 2 * l - q;
			var r = hue2rgb(p, q, color[0] + 1/3);
			var g = hue2rgb(p, q, color[0]);
			var b = hue2rgb(p, q, color[0] - 1/3);
			return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
		}
	},

	toRGB: function(color) {
		return "rgb(" + this._clamp(color[0]) + "," + this._clamp(color[1]) + "," + this._clamp(color[2]) + ")";
	},

	toHex: function(color) {
		var parts = [];
		for (var i=0;i<3;i++) {
			parts.push(this._clamp(color[i]).toString(16).lpad("0", 2));
		}
		return "#" + parts.join("");
	},

	_clamp: function(num) {
		if (num < 0) {
			return 0;
		} else if (num > 255) {
			return 255;
		} else {
			return num;
		}
	},

	_cache: {
		"black": [0,0,0],
		"navy": [0,0,128],
		"darkblue": [0,0,139],
		"mediumblue": [0,0,205],
		"blue": [0,0,255],
		"darkgreen": [0,100,0],
		"green": [0,128,0],
		"teal": [0,128,128],
		"darkcyan": [0,139,139],
		"deepskyblue": [0,191,255],
		"darkturquoise": [0,206,209],
		"mediumspringgreen": [0,250,154],
		"lime": [0,255,0],
		"springgreen": [0,255,127],
		"aqua": [0,255,255],
		"cyan": [0,255,255],
		"midnightblue": [25,25,112],
		"dodgerblue": [30,144,255],
		"forestgreen": [34,139,34],
		"seagreen": [46,139,87],
		"darkslategray": [47,79,79],
		"darkslategrey": [47,79,79],
		"limegreen": [50,205,50],
		"mediumseagreen": [60,179,113],
		"turquoise": [64,224,208],
		"royalblue": [65,105,225],
		"steelblue": [70,130,180],
		"darkslateblue": [72,61,139],
		"mediumturquoise": [72,209,204],
		"indigo": [75,0,130],
		"darkolivegreen": [85,107,47],
		"cadetblue": [95,158,160],
		"cornflowerblue": [100,149,237],
		"mediumaquamarine": [102,205,170],
		"dimgray": [105,105,105],
		"dimgrey": [105,105,105],
		"slateblue": [106,90,205],
		"olivedrab": [107,142,35],
		"slategray": [112,128,144],
		"slategrey": [112,128,144],
		"lightslategray": [119,136,153],
		"lightslategrey": [119,136,153],
		"mediumslateblue": [123,104,238],
		"lawngreen": [124,252,0],
		"chartreuse": [127,255,0],
		"aquamarine": [127,255,212],
		"maroon": [128,0,0],
		"purple": [128,0,128],
		"olive": [128,128,0],
		"gray": [128,128,128],
		"grey": [128,128,128],
		"skyblue": [135,206,235],
		"lightskyblue": [135,206,250],
		"blueviolet": [138,43,226],
		"darkred": [139,0,0],
		"darkmagenta": [139,0,139],
		"saddlebrown": [139,69,19],
		"darkseagreen": [143,188,143],
		"lightgreen": [144,238,144],
		"mediumpurple": [147,112,216],
		"darkviolet": [148,0,211],
		"palegreen": [152,251,152],
		"darkorchid": [153,50,204],
		"yellowgreen": [154,205,50],
		"sienna": [160,82,45],
		"brown": [165,42,42],
		"darkgray": [169,169,169],
		"darkgrey": [169,169,169],
		"lightblue": [173,216,230],
		"greenyellow": [173,255,47],
		"paleturquoise": [175,238,238],
		"lightsteelblue": [176,196,222],
		"powderblue": [176,224,230],
		"firebrick": [178,34,34],
		"darkgoldenrod": [184,134,11],
		"mediumorchid": [186,85,211],
		"rosybrown": [188,143,143],
		"darkkhaki": [189,183,107],
		"silver": [192,192,192],
		"mediumvioletred": [199,21,133],
		"indianred": [205,92,92],
		"peru": [205,133,63],
		"chocolate": [210,105,30],
		"tan": [210,180,140],
		"lightgray": [211,211,211],
		"lightgrey": [211,211,211],
		"palevioletred": [216,112,147],
		"thistle": [216,191,216],
		"orchid": [218,112,214],
		"goldenrod": [218,165,32],
		"crimson": [220,20,60],
		"gainsboro": [220,220,220],
		"plum": [221,160,221],
		"burlywood": [222,184,135],
		"lightcyan": [224,255,255],
		"lavender": [230,230,250],
		"darksalmon": [233,150,122],
		"violet": [238,130,238],
		"palegoldenrod": [238,232,170],
		"lightcoral": [240,128,128],
		"khaki": [240,230,140],
		"aliceblue": [240,248,255],
		"honeydew": [240,255,240],
		"azure": [240,255,255],
		"sandybrown": [244,164,96],
		"wheat": [245,222,179],
		"beige": [245,245,220],
		"whitesmoke": [245,245,245],
		"mintcream": [245,255,250],
		"ghostwhite": [248,248,255],
		"salmon": [250,128,114],
		"antiquewhite": [250,235,215],
		"linen": [250,240,230],
		"lightgoldenrodyellow": [250,250,210],
		"oldlace": [253,245,230],
		"red": [255,0,0],
		"fuchsia": [255,0,255],
		"magenta": [255,0,255],
		"deeppink": [255,20,147],
		"orangered": [255,69,0],
		"tomato": [255,99,71],
		"hotpink": [255,105,180],
		"coral": [255,127,80],
		"darkorange": [255,140,0],
		"lightsalmon": [255,160,122],
		"orange": [255,165,0],
		"lightpink": [255,182,193],
		"pink": [255,192,203],
		"gold": [255,215,0],
		"peachpuff": [255,218,185],
		"navajowhite": [255,222,173],
		"moccasin": [255,228,181],
		"bisque": [255,228,196],
		"mistyrose": [255,228,225],
		"blanchedalmond": [255,235,205],
		"papayawhip": [255,239,213],
		"lavenderblush": [255,240,245],
		"seashell": [255,245,238],
		"cornsilk": [255,248,220],
		"lemonchiffon": [255,250,205],
		"floralwhite": [255,250,240],
		"snow": [255,250,250],
		"yellow": [255,255,0],
		"lightyellow": [255,255,224],
		"ivory": [255,255,240],
		"white": [255,255,255]
	}
}
/**
 * @class Lighting computation, based on a traditional FOV for multiple light sources and multiple passes.
 * @param {function} reflectivityCallback Callback to retrieve cell reflectivity (0..1)
 * @param {object} [options]
 * @param {int} [options.passes=1] Number of passes. 1 equals to simple FOV of all light sources, >1 means a *highly simplified* radiosity-like algorithm.
 * @param {int} [options.emissionThreshold=100] Cells with emissivity > threshold will be treated as light source in the next pass.
 * @param {int} [options.range=10] Max light range
 */
ROT.Lighting = function(reflectivityCallback, options) {
	this._reflectivityCallback = reflectivityCallback;
	this._options = {
		passes: 1,
		emissionThreshold: 100,
		range: 10
	};
	this._fov = null;

	this._lights = {};
	this._reflectivityCache = {};
	this._fovCache = {};

	this.setOptions(options);
}

/**
 * Adjust options at runtime
 * @see ROT.Lighting
 * @param {object} [options]
 */
ROT.Lighting.prototype.setOptions = function(options) {
	for (var p in options) { this._options[p] = options[p]; }
	if (options && options.range) { this.reset(); }
	return this;
}

/**
 * Set the used Field-Of-View algo
 * @param {ROT.FOV} fov
 */
ROT.Lighting.prototype.setFOV = function(fov) {
	this._fov = fov;
	this._fovCache = {};
	return this;
}

/**
 * Set (or remove) a light source
 * @param {int} x
 * @param {int} y
 * @param {null || string || number[3]} color
 */
ROT.Lighting.prototype.setLight = function(x, y, color) {
	var key = x+","+y;

	if (color) {
		this._lights[key] = (typeof(color) == "string" ? ROT.Color.fromString(color) : color);
	} else {
		delete this._lights[key];
	}
	return this;
}

/**
 * Remove all light sources
 */
ROT.Lighting.prototype.clearLights = function() {
    this._lights = {};
}

/**
 * Reset the pre-computed topology values. Call whenever the underlying map changes its light-passability.
 */
ROT.Lighting.prototype.reset = function() {
	this._reflectivityCache = {};
	this._fovCache = {};

	return this;
}

/**
 * Compute the lighting
 * @param {function} lightingCallback Will be called with (x, y, color) for every lit cell
 */
ROT.Lighting.prototype.compute = function(lightingCallback) {
	var doneCells = {};
	var emittingCells = {};
	var litCells = {};

	for (var key in this._lights) { /* prepare emitters for first pass */
		var light = this._lights[key];
		emittingCells[key] = [0, 0, 0];
		ROT.Color.add_(emittingCells[key], light);
	}

	for (var i=0;i<this._options.passes;i++) { /* main loop */
		this._emitLight(emittingCells, litCells, doneCells);
		if (i+1 == this._options.passes) { continue; } /* not for the last pass */
		emittingCells = this._computeEmitters(litCells, doneCells);
	}

	for (var litKey in litCells) { /* let the user know what and how is lit */
		var parts = litKey.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		lightingCallback(x, y, litCells[litKey]);
	}

	return this;
}

/**
 * Compute one iteration from all emitting cells
 * @param {object} emittingCells These emit light
 * @param {object} litCells Add projected light to these
 * @param {object} doneCells These already emitted, forbid them from further calculations
 */
ROT.Lighting.prototype._emitLight = function(emittingCells, litCells, doneCells) {
	for (var key in emittingCells) {
		var parts = key.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		this._emitLightFromCell(x, y, emittingCells[key], litCells);
		doneCells[key] = 1;
	}
	return this;
}

/**
 * Prepare a list of emitters for next pass
 * @param {object} litCells
 * @param {object} doneCells
 * @returns {object}
 */
ROT.Lighting.prototype._computeEmitters = function(litCells, doneCells) {
	var result = {};

	for (var key in litCells) {
		if (key in doneCells) { continue; } /* already emitted */

		var color = litCells[key];

		if (key in this._reflectivityCache) {
			var reflectivity = this._reflectivityCache[key];
		} else {
			var parts = key.split(",");
			var x = parseInt(parts[0]);
			var y = parseInt(parts[1]);
			var reflectivity = this._reflectivityCallback(x, y);
			this._reflectivityCache[key] = reflectivity;
		}

		if (reflectivity == 0) { continue; } /* will not reflect at all */

		/* compute emission color */
		var emission = [];
		var intensity = 0;
		for (var i=0;i<3;i++) {
			var part = Math.round(color[i]*reflectivity);
			emission[i] = part;
			intensity += part;
		}
		if (intensity > this._options.emissionThreshold) { result[key] = emission; }
	}

	return result;
}

/**
 * Compute one iteration from one cell
 * @param {int} x
 * @param {int} y
 * @param {number[]} color
 * @param {object} litCells Cell data to by updated
 */
ROT.Lighting.prototype._emitLightFromCell = function(x, y, color, litCells) {
	var key = x+","+y;
	if (key in this._fovCache) {
		var fov = this._fovCache[key];
	} else {
		var fov = this._updateFOV(x, y);
	}

	for (var fovKey in fov) {
		var formFactor = fov[fovKey];

		if (fovKey in litCells) { /* already lit */
			var result = litCells[fovKey];
		} else { /* newly lit */
			var result = [0, 0, 0];
			litCells[fovKey] = result;
		}

		for (var i=0;i<3;i++) { result[i] += Math.round(color[i]*formFactor); } /* add light color */
	}

	return this;
}

/**
 * Compute FOV ("form factor") for a potential light source at [x,y]
 * @param {int} x
 * @param {int} y
 * @returns {object}
 */
ROT.Lighting.prototype._updateFOV = function(x, y) {
	var key1 = x+","+y;
	var cache = {};
	this._fovCache[key1] = cache;
	var range = this._options.range;
	var cb = function(x, y, r, vis) {
		var key2 = x+","+y;
		var formFactor = vis * (1-r/range);
		if (formFactor == 0) { return; }
		cache[key2] = formFactor;
	}
	this._fov.compute(x, y, range, cb.bind(this));

	return cache;
}
/**
 * @class Abstract pathfinder
 * @param {int} toX Target X coord
 * @param {int} toY Target Y coord
 * @param {function} passableCallback Callback to determine map passability
 * @param {object} [options]
 * @param {int} [options.topology=8]
 */
ROT.Path = function(toX, toY, passableCallback, options) {
	this._toX = toX;
	this._toY = toY;
	this._fromX = null;
	this._fromY = null;
	this._passableCallback = passableCallback;
	this._options = {
		topology: 8
	}
	for (var p in options) { this._options[p] = options[p]; }

	this._dirs = ROT.DIRS[this._options.topology];
	if (this._options.topology == 8) { /* reorder dirs for more aesthetic result (vertical/horizontal first) */
		this._dirs = [
			this._dirs[0],
			this._dirs[2],
			this._dirs[4],
			this._dirs[6],
			this._dirs[1],
			this._dirs[3],
			this._dirs[5],
			this._dirs[7]
		]
	}
}

/**
 * Compute a path from a given point
 * @param {int} fromX
 * @param {int} fromY
 * @param {function} callback Will be called for every path item with arguments "x" and "y"
 */
ROT.Path.prototype.compute = function(fromX, fromY, callback) {
}

ROT.Path.prototype._getNeighbors = function(cx, cy) {
	var result = [];
	for (var i=0;i<this._dirs.length;i++) {
		var dir = this._dirs[i];
		var x = cx + dir[0];
		var y = cy + dir[1];
		
		if (!this._passableCallback(x, y)) { continue; }
		result.push([x, y]);
	}
	
	return result;
}
/**
 * @class Simplified Dijkstra's algorithm: all edges have a value of 1
 * @augments ROT.Path
 * @see ROT.Path
 */
ROT.Path.Dijkstra = function(toX, toY, passableCallback, options) {
	ROT.Path.call(this, toX, toY, passableCallback, options);

	this._computed = {};
	this._todo = [];
	this._add(toX, toY, null);
}
ROT.Path.Dijkstra.extend(ROT.Path);

/**
 * Compute a path from a given point
 * @see ROT.Path#compute
 */
ROT.Path.Dijkstra.prototype.compute = function(fromX, fromY, callback) {
	var key = fromX+","+fromY;
	if (!(key in this._computed)) { this._compute(fromX, fromY); }
	if (!(key in this._computed)) { return; }
	
	var item = this._computed[key];
	while (item) {
		callback(item.x, item.y);
		item = item.prev;
	}
}

/**
 * Compute a non-cached value
 */
ROT.Path.Dijkstra.prototype._compute = function(fromX, fromY) {
	while (this._todo.length) {
		var item = this._todo.shift();
		if (item.x == fromX && item.y == fromY) { return; }
		
		var neighbors = this._getNeighbors(item.x, item.y);
		
		for (var i=0;i<neighbors.length;i++) {
			var neighbor = neighbors[i];
			var x = neighbor[0];
			var y = neighbor[1];
			var id = x+","+y;
			if (id in this._computed) { continue; } /* already done */	
			this._add(x, y, item); 
		}
	}
}

ROT.Path.Dijkstra.prototype._add = function(x, y, prev) {
	var obj = {
		x: x,
		y: y,
		prev: prev
	}
	this._computed[x+","+y] = obj;
	this._todo.push(obj);
}
/**
 * @class Simplified A* algorithm: all edges have a value of 1
 * @augments ROT.Path
 * @see ROT.Path
 */
ROT.Path.AStar = function(toX, toY, passableCallback, options) {
	ROT.Path.call(this, toX, toY, passableCallback, options);

	this._todo = [];
	this._done = {};
	this._fromX = null;
	this._fromY = null;
}
ROT.Path.AStar.extend(ROT.Path);

/**
 * Compute a path from a given point
 * @see ROT.Path#compute
 */
ROT.Path.AStar.prototype.compute = function(fromX, fromY, callback) {
	this._todo = [];
	this._done = {};
	this._fromX = fromX;
	this._fromY = fromY;
	this._add(this._toX, this._toY, null);

	while (this._todo.length) {
		var item = this._todo.shift();
		if (item.x == fromX && item.y == fromY) { break; }
		var neighbors = this._getNeighbors(item.x, item.y);

		for (var i=0;i<neighbors.length;i++) {
			var neighbor = neighbors[i];
			var x = neighbor[0];
			var y = neighbor[1];
			var id = x+","+y;
			if (id in this._done) { continue; }
			this._add(x, y, item); 
		}
	}
	
	var item = this._done[fromX+","+fromY];
	if (!item) { return; }
	
	while (item) {
		callback(item.x, item.y);
		item = item.prev;
	}
}

ROT.Path.AStar.prototype._add = function(x, y, prev) {
	var obj = {
		x: x,
		y: y,
		prev: prev,
		g: (prev ? prev.g+1 : 0),
		h: this._distance(x, y)
	}
	this._done[x+","+y] = obj;
	
	/* insert into priority queue */
	
	var f = obj.g + obj.h;
	for (var i=0;i<this._todo.length;i++) {
		var item = this._todo[i];
		if (f < item.g + item.h) {
			this._todo.splice(i, 0, obj);
			return;
		}
	}
	
	this._todo.push(obj);
}

ROT.Path.AStar.prototype._distance = function(x, y) {
	switch (this._options.topology) {
		case 4:
			return (Math.abs(x-this._fromX) + Math.abs(y-this._fromY));
		break;

		case 6:
			var dx = Math.abs(x - this._fromX);
			var dy = Math.abs(y - this._fromY);
			return dy + Math.max(0, (dx-dy)/2);
		break;

		case 8: 
			return Math.max(Math.abs(x-this._fromX), Math.abs(y-this._fromY));
		break;
	}

        throw new Error("Illegal topology");
}
/**
 * @class Terminal backend
 * @private
 */
ROT.Display.Term = function(context) {
	ROT.Display.Backend.call(this, context);
	this._cx = -1;
	this._cy = -1;
	this._lastColor = "";
	this._options = {};
	this._ox = 0;
	this._oy = 0;
	this._termcolor = {};
}
ROT.Display.Term.extend(ROT.Display.Backend);

ROT.Display.Term.prototype.compute = function(options) {
	this._options = options;
	this._ox = Math.floor((process.stdout.columns - options.width) / 2);
	this._oy = Math.floor((process.stdout.rows - options.height) / 2);
	this._termcolor = new ROT.Display.Term[options.termColor.capitalize()](this._context);
	this._context._termcolor = this._termcolor;
}

ROT.Display.Term.prototype.draw = function(data, clearBefore) {
	// determine where to draw what with what colors
	var x = data[0];
	var y = data[1];
	var ch = data[2];
	var fg = data[3];
	var bg = data[4];

	// determine if we need to move the terminal cursor
	var dx = this._ox + x;
	var dy = this._oy + y;
	if (dx < 0 || dx >= process.stdout.columns) { return; }
	if (dy < 0 || dy >= process.stdout.rows) { return; }
	if (dx !== this._cx || dy !== this._cy) {
		process.stdout.write(this._termcolor.positionToAnsi(dx,dy));
		this._cx = dx;
		this._cy = dy;
	}

	// terminals automatically clear, but if we're clearing when we're
	// not otherwise provided with a character, just use a space instead
	if (clearBefore) {
		if (!ch) {
			ch = " ";
		}
	}
		
	// if we're not clearing and not provided with a character, do nothing
	if (!ch) { return; }

	// determine if we need to change colors
	var newColor = this._termcolor.colorToAnsi(fg,bg);
	if (newColor !== this._lastColor) {
		process.stdout.write(newColor);
		this._lastColor = newColor;
	}

	// write the provided symbol to the display
	var chars = [].concat(ch);
	process.stdout.write(chars[0]);

	// update our position, given that we wrote a character
	this._cx++;
	if (this._cx >= process.stdout.columns) {
		this._cx = 0;
		this._cy++;
	}
}

ROT.Display.Term.prototype.computeSize = function(availWidth, availHeight) {
	return [process.stdout.columns, process.stdout.rows];
}

ROT.Display.Term.prototype.computeFontSize = function(availWidth, availHeight) {
	return 12;
}

ROT.Display.Term.prototype.eventToPosition = function(x, y) {
	return [x,y]
}
/**
 * @class Abstract terminal code module
 * @private
 */
ROT.Display.Term.Color = function(context) {
	this._context = context;
}

ROT.Display.Term.Color.prototype.clearToAnsi = function(bg) {
}

ROT.Display.Term.Color.prototype.colorToAnsi = function(fg, bg) {
}

ROT.Display.Term.Color.prototype.positionToAnsi = function(x, y) {
}
/**
 * @class xterm terminal code module
 * @private
 */
ROT.Display.Term.Xterm = function(context) {
	ROT.Display.Term.Color.call(this, context);
}
ROT.Display.Term.Xterm.extend(ROT.Display.Term.Color);

ROT.Display.Term.Xterm.prototype.clearToAnsi = function(bg) {
	return "\x1b[0;48;5;"
		+ this._termcolor(bg)
		+ "m\x1b[2J";
}

ROT.Display.Term.Xterm.prototype.colorToAnsi = function(fg, bg) {
	return "\x1b[0;38;5;"
		+ this._termcolor(fg)
		+ ";48;5;"
		+ this._termcolor(bg)
		+ "m";
}

ROT.Display.Term.Xterm.prototype.positionToAnsi = function(x, y) {
	return "\x1b[" + (y+1) + ";" + (x+1) + "H";
}

ROT.Display.Term.Xterm.prototype._termcolor = function(color) {
	var SRC_COLORS = 256.0;
	var DST_COLORS = 6.0;
	var COLOR_RATIO = DST_COLORS / SRC_COLORS;
	var rgb = ROT.Color.fromString(color);
	var r = Math.floor(rgb[0] * COLOR_RATIO);
	var g = Math.floor(rgb[1] * COLOR_RATIO);
	var b = Math.floor(rgb[2] * COLOR_RATIO);
	return r*36 + g*6 + b*1 + 16;
}
/**
 * Export to Node.js module
 */
for (var p in ROT) {
	exports[p] = ROT[p];
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":6}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _rotJs = require('rot-js');

var _rotJs2 = _interopRequireDefault(_rotJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var width = void 0,
    height = void 0;
/**
 * @type {Map}
 */
var map = void 0;
var tileSet = void 0;
/**
 * @type {ROT.Display}
 */
var renderer = void 0;
var cursor = [0, 0];

function setCursor(x, y) {
  return cursor = [_fp2.default.clamp(0, map.getWidth() - 1, x), _fp2.default.clamp(0, map.getHeight() - 1, y)];
}

var Display = function () {
  function Display(_width, _height, _tileSet) {
    _classCallCheck(this, Display);

    width = _width;
    height = _height;
    tileSet = _tileSet;
    renderer = new _rotJs2.default.Display(_fp2.default.assign(tileSet, { layout: 'tile', width: width, height: height }));
    document.getElementById('screen').appendChild(renderer.getContainer());
  }

  _createClass(Display, [{
    key: 'setMap',
    value: function setMap(_map) {
      map = _map;
      return this;
    }
  }, {
    key: 'panUp',
    value: function panUp() {
      setCursor(cursor[0], cursor[1] - 1);
      return this;
    }
  }, {
    key: 'panRight',
    value: function panRight() {
      setCursor(cursor[0] + 1, cursor[1]);
      return this;
    }
  }, {
    key: 'panDown',
    value: function panDown() {
      setCursor(cursor[0], cursor[1] + 1);
      return this;
    }
  }, {
    key: 'panLeft',
    value: function panLeft() {
      setCursor(cursor[0] - 1, cursor[1]);
      return this;
    }
  }, {
    key: 'draw',
    value: function draw() {
      var offset = [_fp2.default.clamp(0, map.getWidth() - width, cursor[0] - _fp2.default.floor(width / 2)), _fp2.default.clamp(0, map.getHeight() - height, cursor[1] - _fp2.default.floor(height / 2))];
      for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
          renderer.draw(x, y, getGraphic(map.getTile(x + offset[0], y + offset[1]).type));
        }
      }
      renderer.draw(cursor[0] - offset[0], cursor[1] - offset[1], getGraphic(0));

      return this;
    }
  }, {
    key: 'showText',
    value: function showText() {
      var text = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      var textBox = document.getElementById('text');
      if (text) {
        textBox.innerText = text;
      }
      textBox.setAttribute('class', '');
      return this;
    }
  }, {
    key: 'hideText',
    value: function hideText() {
      document.getElementById('text').setAttribute('class', 'hidden');
      return this;
    }
  }]);

  return Display;
}();

exports.default = Display;


function getGraphic(id) {
  switch (id) {
    case 0:
      return 'cursor';
    default:
      if ([1, 2, 3, 4].includes(id)) {
        return 'grass' + id;
      }
  }
}

},{"lodash/fp":1,"rot-js":7}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var data = {};
var width = void 0,
    height = void 0;

var Tile = function Tile(type) {
  _classCallCheck(this, Tile);

  this.type = type;
};

function setTile(x, y, tile) {
  data[x + ',' + y] = tile;
}

var Map = function () {
  function Map(src) {
    _classCallCheck(this, Map);

    width = src.length;
    height = src[0].length;
    src.forEach(function (row, y) {
      row.forEach(function (type, x) {
        setTile(x, y, new Tile(type));
      });
    });
  }

  _createClass(Map, [{
    key: 'getWidth',
    value: function getWidth() {
      return width;
    }
  }, {
    key: 'getHeight',
    value: function getHeight() {
      return height;
    }
  }, {
    key: 'getTile',
    value: function getTile(x, y) {
      return _fp2.default.get(x + ',' + y, data);
    }
  }]);

  return Map;
}();

exports.default = Map;

},{"lodash/fp":1}],10:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _utils = require('./utils');

var _Display = require('./Display');

var _Display2 = _interopRequireDefault(_Display);

var _Map = require('./Map');

var _Map2 = _interopRequireDefault(_Map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var paused = false;

var map = new _Map2.default([[1, 2, 2, 1, 4, 4, 4, 1, 1, 1], [1, 1, 2, 2, 2, 4, 4, 4, 3, 3], [4, 4, 3, 2, 2, 2, 2, 1, 3, 3], [4, 4, 3, 3, 2, 1, 1, 1, 1, 3], [1, 1, 1, 1, 1, 1, 1, 2, 2, 1], [2, 1, 4, 4, 4, 3, 1, 2, 2, 1], [2, 2, 4, 4, 4, 3, 3, 1, 2, 1], [2, 2, 1, 1, 1, 3, 3, 1, 4, 4], [3, 3, 3, 2, 4, 4, 1, 1, 4, 4], [1, 1, 3, 3, 4, 4, 1, 1, 1, 1]]);
var tileSize = [16, 16];
var display = new _Display2.default(5, 5, {
  tileSet: document.getElementById('tiles'),
  bg: 'transparent',
  tileWidth: tileSize[0],
  tileHeight: tileSize[1],
  tileMap: (0, _utils.forOwn)(function (pos, key, tileMap) {
    return tileMap[key] = pos.map(function (val, i) {
      return val * tileSize[i];
    });
  }, {
    grass1: [0, 0],
    grass2: [1, 0],
    grass3: [2, 0],
    grass4: [3, 0],
    cursor: [3, 42]
  })
}).setMap(map);
var renderLoop = new _utils.Loop(60, display.draw).start();

var controls = { down: {}, up: {} };
var keyPos = (0, _utils.keysToVals)(controls);
var commands = (0, _utils.forOwn)(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 3);

  var pos = _ref2[0];
  var cb = _ref2[1];
  var keys = _ref2[2];
  return keys.forEach(function (key) {
    return controls[pos][key] = cb;
  });
}, {
  ScrollUp: [keyPos.down, function () {
    return paused ? null : display.panUp();
  }, ['ArrowUp', 'KeyW']],
  ScrollRight: [keyPos.down, function () {
    return paused ? null : display.panRight();
  }, ['ArrowRight', 'KeyD']],
  ScrollDown: [keyPos.down, function () {
    return paused ? null : display.panDown();
  }, ['ArrowDown', 'KeyS']],
  ScrollLeft: [keyPos.down, function () {
    return paused ? null : display.panLeft();
  }, ['ArrowLeft', 'KeyA']],
  Pause: [keyPos.down, function () {
    paused = !paused;
    (renderLoop.isRunning() ? renderLoop.stop : renderLoop.start).apply(renderLoop);
  }, ['Space']],
  ShowHelp: [keyPos.down, function () {
    _fp2.default.flow([_fp2.default.toPairs.bind(_fp2.default), _fp2.default.map.bind(_fp2.default, function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2);

      var prop = _ref4[0];

      var _ref4$ = _slicedToArray(_ref4[1], 3);

      var pos = _ref4$[0];
      var cb = _ref4$[1];
      var bindings = _ref4$[2];
      return prop + ': ' + bindings.join(', ');
    }), _fp2.default.join.bind(_fp2.default, '\n'), display.showText.bind(display)])(commands);
  }, ['Tab']],
  HideHelp: [keyPos.up, function () {
    return display.hideText();
  }, ['Tab']]
});

_fp2.default.keys(controls).forEach(function (pos) {
  return window['onkey' + pos] = (0, _utils.overrideEvent)(function (e) {
    var command = _fp2.default.get(e.code, controls[pos]);
    if (_fp2.default.isFunction(command)) {
      command();
    }
  });
});

},{"./Display":8,"./Map":9,"./utils":11,"lodash/fp":1}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function keysToVals(obj) {
  var res = {};
  forOwn(function (val, prop) {
    return res[prop] = prop;
  }, obj);
  return res;
}

function forOwn(cb, obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cb(obj[prop], prop, obj);
    }
  }
  return obj;
}

function overrideEvent() {
  var cb = arguments.length <= 0 || arguments[0] === undefined ? function () {
    return false;
  } : arguments[0];

  return function (e) {
    e.preventDefault();
    cb(e);
    return e;
  };
}

function loopInterval(loop) {
  var start = new Date().getMilliseconds();
  loop.cb();
  if (loop.running) {
    setTimeout(loopInterval.bind(this, loop), loop.timing - (start - new Date().getMilliseconds()));
  }
}

var Loop = function () {
  function Loop(timing, cb) {
    _classCallCheck(this, Loop);

    this.timing = timing;
    this.cb = cb;
    this.running = false;
    this.interval = function () {
      return false;
    };
  }

  _createClass(Loop, [{
    key: 'isRunning',
    value: function isRunning() {
      return this.running;
    }
  }, {
    key: 'start',
    value: function start() {
      this.running = true;
      this.interval = loopInterval.bind(loopInterval, this);
      this.interval();
      return this;
    }
  }, {
    key: 'stop',
    value: function stop() {
      this.running = false;
      this.interval = function () {
        return false;
      };
      return this;
    }
  }]);

  return Loop;
}();

exports.keysToVals = keysToVals;
exports.forOwn = forOwn;
exports.overrideEvent = overrideEvent;
exports.Loop = Loop;

},{}]},{},[10])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ZwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9mcC9fYmFzZUNvbnZlcnQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ZwL19tYXBwaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9mcC9wbGFjZWhvbGRlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbG9kYXNoLm1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcm90LWpzL2xpYi9yb3QuanMiLCJzcmMvRGlzcGxheS5qcyIsInNyYy9NYXAuanMiLCJzcmMvbWFpbi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy80S0E7Ozs7Ozs7O0FBRUE7Ozs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFJLGNBQUo7QUFBQSxJQUFXLGVBQVg7QUFDQTs7O0FBR0EsSUFBSSxZQUFKO0FBQ0EsSUFBSSxnQkFBSjtBQUNBOzs7QUFHQSxJQUFJLGlCQUFKO0FBQ0EsSUFBSSxTQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBYjs7QUFFQSxTQUFTLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUI7QUFDdkIsU0FBTyxTQUFTLENBQ2QsYUFBRSxLQUFGLENBQVEsQ0FBUixFQUFXLElBQUksUUFBSixLQUFpQixDQUE1QixFQUErQixDQUEvQixDQURjLEVBRWQsYUFBRSxLQUFGLENBQVEsQ0FBUixFQUFXLElBQUksU0FBSixLQUFrQixDQUE3QixFQUFnQyxDQUFoQyxDQUZjLENBQWhCO0FBSUQ7O0lBRW9CLE87QUFDbkIsbUJBQVksTUFBWixFQUFvQixPQUFwQixFQUE2QixRQUE3QixFQUF1QztBQUFBOztBQUNyQyxZQUFRLE1BQVI7QUFDQSxhQUFTLE9BQVQ7QUFDQSxjQUFVLFFBQVY7QUFDQSxlQUFXLElBQUksZ0JBQUksT0FBUixDQUFnQixhQUFFLE1BQUYsQ0FBUyxPQUFULEVBQWtCLEVBQUMsUUFBUSxNQUFULEVBQWlCLFlBQWpCLEVBQXdCLGNBQXhCLEVBQWxCLENBQWhCLENBQVg7QUFDQSxhQUFTLGNBQVQsQ0FBd0IsUUFBeEIsRUFBa0MsV0FBbEMsQ0FBOEMsU0FBUyxZQUFULEVBQTlDO0FBQ0Q7Ozs7MkJBRU0sSSxFQUFNO0FBQ1gsWUFBTSxJQUFOO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs0QkFFTztBQUNOLGdCQUFVLE9BQU8sQ0FBUCxDQUFWLEVBQXFCLE9BQU8sQ0FBUCxJQUFZLENBQWpDO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OzsrQkFFVTtBQUNULGdCQUFVLE9BQU8sQ0FBUCxJQUFZLENBQXRCLEVBQXlCLE9BQU8sQ0FBUCxDQUF6QjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7OEJBRVM7QUFDUixnQkFBVSxPQUFPLENBQVAsQ0FBVixFQUFxQixPQUFPLENBQVAsSUFBWSxDQUFqQztBQUNBLGFBQU8sSUFBUDtBQUNEOzs7OEJBRVM7QUFDUixnQkFBVSxPQUFPLENBQVAsSUFBWSxDQUF0QixFQUF5QixPQUFPLENBQVAsQ0FBekI7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzJCQUVNO0FBQ0wsVUFBTSxTQUFTLENBQ2IsYUFBRSxLQUFGLENBQVEsQ0FBUixFQUFXLElBQUksUUFBSixLQUFpQixLQUE1QixFQUFtQyxPQUFPLENBQVAsSUFBWSxhQUFFLEtBQUYsQ0FBUSxRQUFRLENBQWhCLENBQS9DLENBRGEsRUFFYixhQUFFLEtBQUYsQ0FBUSxDQUFSLEVBQVcsSUFBSSxTQUFKLEtBQWtCLE1BQTdCLEVBQXFDLE9BQU8sQ0FBUCxJQUFZLGFBQUUsS0FBRixDQUFRLFNBQVMsQ0FBakIsQ0FBakQsQ0FGYSxDQUFmO0FBSUEsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQXBCLEVBQTJCLEdBQTNCLEVBQWdDO0FBQzlCLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFwQixFQUE0QixHQUE1QixFQUFpQztBQUMvQixtQkFBUyxJQUFULENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixXQUFXLElBQUksT0FBSixDQUFZLElBQUksT0FBTyxDQUFQLENBQWhCLEVBQTJCLElBQUksT0FBTyxDQUFQLENBQS9CLEVBQTBDLElBQXJELENBQXBCO0FBQ0Q7QUFDRjtBQUNELGVBQVMsSUFBVCxDQUFjLE9BQU8sQ0FBUCxJQUFZLE9BQU8sQ0FBUCxDQUExQixFQUFxQyxPQUFPLENBQVAsSUFBWSxPQUFPLENBQVAsQ0FBakQsRUFBNEQsV0FBVyxDQUFYLENBQTVEOztBQUVBLGFBQU8sSUFBUDtBQUNEOzs7K0JBRXFCO0FBQUEsVUFBYixJQUFhLHlEQUFOLElBQU07O0FBQ3BCLFVBQU0sVUFBVSxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBaEI7QUFDQSxVQUFJLElBQUosRUFBVTtBQUNSLGdCQUFRLFNBQVIsR0FBb0IsSUFBcEI7QUFDRDtBQUNELGNBQVEsWUFBUixDQUFxQixPQUFyQixFQUE4QixFQUE5QjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7K0JBRVU7QUFDVCxlQUNHLGNBREgsQ0FDa0IsTUFEbEIsRUFFRyxZQUZILENBRWdCLE9BRmhCLEVBRXlCLFFBRnpCO0FBR0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkEvRGtCLE87OztBQWtFckIsU0FBUyxVQUFULENBQW9CLEVBQXBCLEVBQXdCO0FBQ3RCLFVBQVEsRUFBUjtBQUNFLFNBQUssQ0FBTDtBQUNFLGFBQU8sUUFBUDtBQUNGO0FBQ0UsVUFBSSxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxRQUFiLENBQXNCLEVBQXRCLENBQUosRUFBK0I7QUFDN0IseUJBQWUsRUFBZjtBQUNEO0FBTkw7QUFRRDs7O0FDbkdEOzs7Ozs7OztBQUVBOzs7Ozs7OztBQUNBLElBQU0sT0FBTyxFQUFiO0FBQ0EsSUFBSSxjQUFKO0FBQUEsSUFBVyxlQUFYOztJQUVNLEksR0FDSixjQUFZLElBQVosRUFBa0I7QUFBQTs7QUFDaEIsT0FBSyxJQUFMLEdBQVksSUFBWjtBQUNELEM7O0FBR0gsU0FBUyxPQUFULENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLElBQXZCLEVBQTZCO0FBQzNCLE9BQVEsQ0FBUixTQUFhLENBQWIsSUFBb0IsSUFBcEI7QUFDRDs7SUFFb0IsRztBQUNuQixlQUFZLEdBQVosRUFBaUI7QUFBQTs7QUFDZixZQUFRLElBQUksTUFBWjtBQUNBLGFBQVMsSUFBSSxDQUFKLEVBQU8sTUFBaEI7QUFDQSxRQUFJLE9BQUosQ0FBWSxVQUFDLEdBQUQsRUFBTSxDQUFOLEVBQVk7QUFDdEIsVUFBSSxPQUFKLENBQVksVUFBQyxJQUFELEVBQU8sQ0FBUCxFQUFhO0FBQ3ZCLGdCQUFRLENBQVIsRUFBVyxDQUFYLEVBQWMsSUFBSSxJQUFKLENBQVMsSUFBVCxDQUFkO0FBQ0QsT0FGRDtBQUdELEtBSkQ7QUFLRDs7OzsrQkFFVTtBQUNULGFBQU8sS0FBUDtBQUNEOzs7Z0NBRVc7QUFDVixhQUFPLE1BQVA7QUFDRDs7OzRCQUVPLEMsRUFBRyxDLEVBQUc7QUFDWixhQUFPLGFBQUUsR0FBRixDQUFTLENBQVQsU0FBYyxDQUFkLEVBQW1CLElBQW5CLENBQVA7QUFDRDs7Ozs7O2tCQXJCa0IsRzs7O0FDaEJyQjs7OztBQUVBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBSSxTQUFTLEtBQWI7O0FBRUEsSUFBTSxNQUFNLGtCQUFRLENBQ2xCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FEa0IsRUFFbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUZrQixFQUdsQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBSGtCLEVBSWxCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FKa0IsRUFLbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUxrQixFQU1sQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBTmtCLEVBT2xCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FQa0IsRUFRbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVJrQixFQVNsQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBVGtCLEVBVWxCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FWa0IsQ0FBUixDQUFaO0FBWUEsSUFBTSxXQUFXLENBQUMsRUFBRCxFQUFLLEVBQUwsQ0FBakI7QUFDQSxJQUFNLFVBQVUsc0JBQVksQ0FBWixFQUFlLENBQWYsRUFBa0I7QUFDaEMsV0FBUyxTQUFTLGNBQVQsQ0FBd0IsT0FBeEIsQ0FEdUI7QUFFaEMsTUFBSSxhQUY0QjtBQUdoQyxhQUFXLFNBQVMsQ0FBVCxDQUhxQjtBQUloQyxjQUFZLFNBQVMsQ0FBVCxDQUpvQjtBQUtoQyxXQUFTLG1CQUFPLFVBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxPQUFYO0FBQUEsV0FBdUIsUUFBUSxHQUFSLElBQWUsSUFBSSxHQUFKLENBQVEsVUFBQyxHQUFELEVBQU0sQ0FBTjtBQUFBLGFBQVksTUFBTSxTQUFTLENBQVQsQ0FBbEI7QUFBQSxLQUFSLENBQXRDO0FBQUEsR0FBUCxFQUFxRjtBQUM1RixZQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEb0Y7QUFFNUYsWUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRm9GO0FBRzVGLFlBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUhvRjtBQUk1RixZQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FKb0Y7QUFLNUYsWUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKO0FBTG9GLEdBQXJGO0FBTHVCLENBQWxCLEVBWWIsTUFaYSxDQVlOLEdBWk0sQ0FBaEI7QUFhQSxJQUFNLGFBQWEsZ0JBQVMsRUFBVCxFQUFhLFFBQVEsSUFBckIsRUFBMkIsS0FBM0IsRUFBbkI7O0FBRUEsSUFBTSxXQUFXLEVBQUMsTUFBTSxFQUFQLEVBQVcsSUFBSSxFQUFmLEVBQWpCO0FBQ0EsSUFBTSxTQUFTLHVCQUFXLFFBQVgsQ0FBZjtBQUNBLElBQU0sV0FBVyxtQkFBTztBQUFBOztBQUFBLE1BQUUsR0FBRjtBQUFBLE1BQU8sRUFBUDtBQUFBLE1BQVcsSUFBWDtBQUFBLFNBQXFCLEtBQUssT0FBTCxDQUFhO0FBQUEsV0FBTyxTQUFTLEdBQVQsRUFBYyxHQUFkLElBQXFCLEVBQTVCO0FBQUEsR0FBYixDQUFyQjtBQUFBLENBQVAsRUFBMEU7QUFDekYsWUFBVSxDQUFDLE9BQU8sSUFBUixFQUFjO0FBQUEsV0FBTSxTQUFTLElBQVQsR0FBZ0IsUUFBUSxLQUFSLEVBQXRCO0FBQUEsR0FBZCxFQUFxRCxDQUFDLFNBQUQsRUFBWSxNQUFaLENBQXJELENBRCtFO0FBRXpGLGVBQWEsQ0FBQyxPQUFPLElBQVIsRUFBYztBQUFBLFdBQU0sU0FBUyxJQUFULEdBQWdCLFFBQVEsUUFBUixFQUF0QjtBQUFBLEdBQWQsRUFBd0QsQ0FBQyxZQUFELEVBQWUsTUFBZixDQUF4RCxDQUY0RTtBQUd6RixjQUFZLENBQUMsT0FBTyxJQUFSLEVBQWM7QUFBQSxXQUFNLFNBQVMsSUFBVCxHQUFnQixRQUFRLE9BQVIsRUFBdEI7QUFBQSxHQUFkLEVBQXVELENBQUMsV0FBRCxFQUFjLE1BQWQsQ0FBdkQsQ0FINkU7QUFJekYsY0FBWSxDQUFDLE9BQU8sSUFBUixFQUFjO0FBQUEsV0FBTSxTQUFTLElBQVQsR0FBZ0IsUUFBUSxPQUFSLEVBQXRCO0FBQUEsR0FBZCxFQUF1RCxDQUFDLFdBQUQsRUFBYyxNQUFkLENBQXZELENBSjZFO0FBS3pGLFNBQU8sQ0FBQyxPQUFPLElBQVIsRUFBYyxZQUFNO0FBQ3pCLGFBQVMsQ0FBQyxNQUFWO0FBQ0EsS0FBQyxXQUFXLFNBQVgsS0FBeUIsV0FBVyxJQUFwQyxHQUEyQyxXQUFXLEtBQXZELEVBQThELEtBQTlELENBQW9FLFVBQXBFO0FBQ0QsR0FITSxFQUdKLENBQUMsT0FBRCxDQUhJLENBTGtGO0FBU3pGLFlBQVUsQ0FBQyxPQUFPLElBQVIsRUFBYyxZQUFNO0FBQzVCLGlCQUFFLElBQUYsQ0FBTyxDQUNMLGFBQUUsT0FBRixDQUFVLElBQVYsY0FESyxFQUVMLGFBQUUsR0FBRixDQUFNLElBQU4sZUFBYztBQUFBOztBQUFBLFVBQUUsSUFBRjs7QUFBQTs7QUFBQSxVQUFTLEdBQVQ7QUFBQSxVQUFjLEVBQWQ7QUFBQSxVQUFrQixRQUFsQjtBQUFBLGFBQW9DLElBQXBDLFVBQTZDLFNBQVMsSUFBVCxDQUFjLElBQWQsQ0FBN0M7QUFBQSxLQUFkLENBRkssRUFHTCxhQUFFLElBQUYsQ0FBTyxJQUFQLGVBQWUsSUFBZixDQUhLLEVBSUwsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLE9BQXRCLENBSkssQ0FBUCxFQUtHLFFBTEg7QUFNRCxHQVBTLEVBT1AsQ0FBQyxLQUFELENBUE8sQ0FUK0U7QUFpQnpGLFlBQVUsQ0FBQyxPQUFPLEVBQVIsRUFBWTtBQUFBLFdBQU0sUUFBUSxRQUFSLEVBQU47QUFBQSxHQUFaLEVBQXNDLENBQUMsS0FBRCxDQUF0QztBQWpCK0UsQ0FBMUUsQ0FBakI7O0FBb0JBLGFBQUUsSUFBRixDQUFPLFFBQVAsRUFBaUIsT0FBakIsQ0FBeUI7QUFBQSxTQUFPLGlCQUFlLEdBQWYsSUFBd0IsMEJBQWMsYUFBSztBQUN6RSxRQUFNLFVBQVUsYUFBRSxHQUFGLENBQU0sRUFBRSxJQUFSLEVBQWMsU0FBUyxHQUFULENBQWQsQ0FBaEI7QUFDQSxRQUFJLGFBQUUsVUFBRixDQUFhLE9BQWIsQ0FBSixFQUEyQjtBQUN6QjtBQUNEO0FBQ0YsR0FMdUQsQ0FBL0I7QUFBQSxDQUF6Qjs7O0FDM0RBOzs7Ozs7Ozs7O0FBRUEsU0FBUyxVQUFULENBQW9CLEdBQXBCLEVBQXlCO0FBQ3ZCLE1BQU0sTUFBTSxFQUFaO0FBQ0EsU0FBTyxVQUFDLEdBQUQsRUFBTSxJQUFOO0FBQUEsV0FBZSxJQUFJLElBQUosSUFBWSxJQUEzQjtBQUFBLEdBQVAsRUFBd0MsR0FBeEM7QUFDQSxTQUFPLEdBQVA7QUFDRDs7QUFFRCxTQUFTLE1BQVQsQ0FBZ0IsRUFBaEIsRUFBb0IsR0FBcEIsRUFBeUI7QUFDdkIsT0FBSyxJQUFJLElBQVQsSUFBaUIsR0FBakIsRUFBc0I7QUFDcEIsUUFBSSxJQUFJLGNBQUosQ0FBbUIsSUFBbkIsQ0FBSixFQUE4QjtBQUM1QixTQUFHLElBQUksSUFBSixDQUFILEVBQWMsSUFBZCxFQUFvQixHQUFwQjtBQUNEO0FBQ0Y7QUFDRCxTQUFPLEdBQVA7QUFDRDs7QUFFRCxTQUFTLGFBQVQsR0FBMkM7QUFBQSxNQUFwQixFQUFvQix5REFBZDtBQUFBLFdBQU0sS0FBTjtBQUFBLEdBQWM7O0FBQ3pDLFNBQU8sYUFBSztBQUNWLE1BQUUsY0FBRjtBQUNBLE9BQUcsQ0FBSDtBQUNBLFdBQU8sQ0FBUDtBQUNELEdBSkQ7QUFLRDs7QUFFRCxTQUFTLFlBQVQsQ0FBc0IsSUFBdEIsRUFBNEI7QUFDMUIsTUFBTSxRQUFRLElBQUksSUFBSixHQUFXLGVBQVgsRUFBZDtBQUNBLE9BQUssRUFBTDtBQUNBLE1BQUksS0FBSyxPQUFULEVBQWtCO0FBQ2hCLGVBQVcsYUFBYSxJQUFiLENBQWtCLElBQWxCLEVBQXdCLElBQXhCLENBQVgsRUFBMEMsS0FBSyxNQUFMLElBQWUsUUFBUSxJQUFJLElBQUosR0FBVyxlQUFYLEVBQXZCLENBQTFDO0FBQ0Q7QUFDRjs7SUFFSyxJO0FBQ0osZ0JBQVksTUFBWixFQUFvQixFQUFwQixFQUF3QjtBQUFBOztBQUN0QixTQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxTQUFLLFFBQUwsR0FBZ0I7QUFBQSxhQUFNLEtBQU47QUFBQSxLQUFoQjtBQUNEOzs7O2dDQUVXO0FBQ1YsYUFBTyxLQUFLLE9BQVo7QUFDRDs7OzRCQUVPO0FBQ04sV0FBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLFdBQUssUUFBTCxHQUFnQixhQUFhLElBQWIsQ0FBa0IsWUFBbEIsRUFBZ0MsSUFBaEMsQ0FBaEI7QUFDQSxXQUFLLFFBQUw7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzJCQUVNO0FBQ0wsV0FBSyxPQUFMLEdBQWUsS0FBZjtBQUNBLFdBQUssUUFBTCxHQUFnQjtBQUFBLGVBQU0sS0FBTjtBQUFBLE9BQWhCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztRQUlELFUsR0FBQSxVO1FBQ0EsTSxHQUFBLE07UUFDQSxhLEdBQUEsYTtRQUNBLEksR0FBQSxJIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gubWluJykucnVuSW5Db250ZXh0KCk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZnAvX2Jhc2VDb252ZXJ0JykoXywgXyk7XG4iLCJ2YXIgbWFwcGluZyA9IHJlcXVpcmUoJy4vX21hcHBpbmcnKSxcbiAgICBtdXRhdGVNYXAgPSBtYXBwaW5nLm11dGF0ZSxcbiAgICBmYWxsYmFja0hvbGRlciA9IHJlcXVpcmUoJy4vcGxhY2Vob2xkZXInKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24sIHdpdGggYW4gYXJpdHkgb2YgYG5gLCB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggdGhlXG4gKiBhcmd1bWVudHMgaXQgcmVjZWl2ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gKiBAcGFyYW0ge251bWJlcn0gbiBUaGUgYXJpdHkgb2YgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlQXJpdHkoZnVuYywgbikge1xuICByZXR1cm4gbiA9PSAyXG4gICAgPyBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTsgfVxuICAgIDogZnVuY3Rpb24oYSkgeyByZXR1cm4gZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cyk7IH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2AsIHdpdGggdXAgdG8gYG5gIGFyZ3VtZW50cywgaWdub3JpbmdcbiAqIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FwIGFyZ3VtZW50cyBmb3IuXG4gKiBAcGFyYW0ge251bWJlcn0gbiBUaGUgYXJpdHkgY2FwLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VBcnkoZnVuYywgbikge1xuICByZXR1cm4gbiA9PSAyXG4gICAgPyBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBmdW5jKGEsIGIpOyB9XG4gICAgOiBmdW5jdGlvbihhKSB7IHJldHVybiBmdW5jKGEpOyB9O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBjbG9uZSBvZiBgYXJyYXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gY2xvbmUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGNsb25lZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gY2xvbmVBcnJheShhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICByZXN1bHRbbGVuZ3RoXSA9IGFycmF5W2xlbmd0aF07XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBjbG9uZXMgYSBnaXZlbiBvYmplY3QgdXNpbmcgdGhlIGFzc2lnbm1lbnQgYGZ1bmNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBhc3NpZ25tZW50IGZ1bmN0aW9uLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY2xvbmVyIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVDbG9uZXIoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmMoe30sIG9iamVjdCk7XG4gIH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgd3JhcHMgYGZ1bmNgIGFuZCB1c2VzIGBjbG9uZXJgIHRvIGNsb25lIHRoZSBmaXJzdFxuICogYXJndW1lbnQgaXQgcmVjZWl2ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjbG9uZXIgVGhlIGZ1bmN0aW9uIHRvIGNsb25lIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGltbXV0YWJsZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaW1tdXRXcmFwKGZ1bmMsIGNsb25lcikge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHZhciBhcmdzID0gQXJyYXkobGVuZ3RoKTtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIGFyZ3NbbGVuZ3RoXSA9IGFyZ3VtZW50c1tsZW5ndGhdO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gYXJnc1swXSA9IGNsb25lci5hcHBseSh1bmRlZmluZWQsIGFyZ3MpO1xuICAgIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBjb252ZXJ0YCB3aGljaCBhY2NlcHRzIGEgYHV0aWxgIG9iamVjdCBvZiBtZXRob2RzXG4gKiByZXF1aXJlZCB0byBwZXJmb3JtIGNvbnZlcnNpb25zLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB1dGlsIFRoZSB1dGlsIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY29udmVydC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYXA9dHJ1ZV0gU3BlY2lmeSBjYXBwaW5nIGl0ZXJhdGVlIGFyZ3VtZW50cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY3Vycnk9dHJ1ZV0gU3BlY2lmeSBjdXJyeWluZy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZml4ZWQ9dHJ1ZV0gU3BlY2lmeSBmaXhlZCBhcml0eS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuaW1tdXRhYmxlPXRydWVdIFNwZWNpZnkgaW1tdXRhYmxlIG9wZXJhdGlvbnMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnJlYXJnPXRydWVdIFNwZWNpZnkgcmVhcnJhbmdpbmcgYXJndW1lbnRzLlxuICogQHJldHVybnMge0Z1bmN0aW9ufE9iamVjdH0gUmV0dXJucyB0aGUgY29udmVydGVkIGZ1bmN0aW9uIG9yIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gYmFzZUNvbnZlcnQodXRpbCwgbmFtZSwgZnVuYywgb3B0aW9ucykge1xuICB2YXIgc2V0UGxhY2Vob2xkZXIsXG4gICAgICBpc0xpYiA9IHR5cGVvZiBuYW1lID09ICdmdW5jdGlvbicsXG4gICAgICBpc09iaiA9IG5hbWUgPT09IE9iamVjdChuYW1lKTtcblxuICBpZiAoaXNPYmopIHtcbiAgICBvcHRpb25zID0gZnVuYztcbiAgICBmdW5jID0gbmFtZTtcbiAgICBuYW1lID0gdW5kZWZpbmVkO1xuICB9XG4gIGlmIChmdW5jID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICB9XG4gIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgdmFyIGNvbmZpZyA9IHtcbiAgICAnY2FwJzogJ2NhcCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuY2FwIDogdHJ1ZSxcbiAgICAnY3VycnknOiAnY3VycnknIGluIG9wdGlvbnMgPyBvcHRpb25zLmN1cnJ5IDogdHJ1ZSxcbiAgICAnZml4ZWQnOiAnZml4ZWQnIGluIG9wdGlvbnMgPyBvcHRpb25zLmZpeGVkIDogdHJ1ZSxcbiAgICAnaW1tdXRhYmxlJzogJ2ltbXV0YWJsZScgaW4gb3B0aW9ucyA/IG9wdGlvbnMuaW1tdXRhYmxlIDogdHJ1ZSxcbiAgICAncmVhcmcnOiAncmVhcmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnJlYXJnIDogdHJ1ZVxuICB9O1xuXG4gIHZhciBmb3JjZUN1cnJ5ID0gKCdjdXJyeScgaW4gb3B0aW9ucykgJiYgb3B0aW9ucy5jdXJyeSxcbiAgICAgIGZvcmNlRml4ZWQgPSAoJ2ZpeGVkJyBpbiBvcHRpb25zKSAmJiBvcHRpb25zLmZpeGVkLFxuICAgICAgZm9yY2VSZWFyZyA9ICgncmVhcmcnIGluIG9wdGlvbnMpICYmIG9wdGlvbnMucmVhcmcsXG4gICAgICBwbGFjZWhvbGRlciA9IGlzTGliID8gZnVuYyA6IGZhbGxiYWNrSG9sZGVyLFxuICAgICAgcHJpc3RpbmUgPSBpc0xpYiA/IGZ1bmMucnVuSW5Db250ZXh0KCkgOiB1bmRlZmluZWQ7XG5cbiAgdmFyIGhlbHBlcnMgPSBpc0xpYiA/IGZ1bmMgOiB7XG4gICAgJ2FyeSc6IHV0aWwuYXJ5LFxuICAgICdhc3NpZ24nOiB1dGlsLmFzc2lnbixcbiAgICAnY2xvbmUnOiB1dGlsLmNsb25lLFxuICAgICdjdXJyeSc6IHV0aWwuY3VycnksXG4gICAgJ2ZvckVhY2gnOiB1dGlsLmZvckVhY2gsXG4gICAgJ2lzQXJyYXknOiB1dGlsLmlzQXJyYXksXG4gICAgJ2lzRnVuY3Rpb24nOiB1dGlsLmlzRnVuY3Rpb24sXG4gICAgJ2l0ZXJhdGVlJzogdXRpbC5pdGVyYXRlZSxcbiAgICAna2V5cyc6IHV0aWwua2V5cyxcbiAgICAncmVhcmcnOiB1dGlsLnJlYXJnLFxuICAgICdzcHJlYWQnOiB1dGlsLnNwcmVhZCxcbiAgICAndG9QYXRoJzogdXRpbC50b1BhdGhcbiAgfTtcblxuICB2YXIgYXJ5ID0gaGVscGVycy5hcnksXG4gICAgICBhc3NpZ24gPSBoZWxwZXJzLmFzc2lnbixcbiAgICAgIGNsb25lID0gaGVscGVycy5jbG9uZSxcbiAgICAgIGN1cnJ5ID0gaGVscGVycy5jdXJyeSxcbiAgICAgIGVhY2ggPSBoZWxwZXJzLmZvckVhY2gsXG4gICAgICBpc0FycmF5ID0gaGVscGVycy5pc0FycmF5LFxuICAgICAgaXNGdW5jdGlvbiA9IGhlbHBlcnMuaXNGdW5jdGlvbixcbiAgICAgIGtleXMgPSBoZWxwZXJzLmtleXMsXG4gICAgICByZWFyZyA9IGhlbHBlcnMucmVhcmcsXG4gICAgICBzcHJlYWQgPSBoZWxwZXJzLnNwcmVhZCxcbiAgICAgIHRvUGF0aCA9IGhlbHBlcnMudG9QYXRoO1xuXG4gIHZhciBhcnlNZXRob2RLZXlzID0ga2V5cyhtYXBwaW5nLmFyeU1ldGhvZCk7XG5cbiAgdmFyIHdyYXBwZXJzID0ge1xuICAgICdjYXN0QXJyYXknOiBmdW5jdGlvbihjYXN0QXJyYXkpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXJndW1lbnRzWzBdO1xuICAgICAgICByZXR1cm4gaXNBcnJheSh2YWx1ZSlcbiAgICAgICAgICA/IGNhc3RBcnJheShjbG9uZUFycmF5KHZhbHVlKSlcbiAgICAgICAgICA6IGNhc3RBcnJheS5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH0sXG4gICAgJ2l0ZXJhdGVlJzogZnVuY3Rpb24oaXRlcmF0ZWUpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZ1bmMgPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBhcml0eSA9IGFyZ3VtZW50c1sxXSxcbiAgICAgICAgICAgIHJlc3VsdCA9IGl0ZXJhdGVlKGZ1bmMsIGFyaXR5KSxcbiAgICAgICAgICAgIGxlbmd0aCA9IHJlc3VsdC5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5jYXAgJiYgdHlwZW9mIGFyaXR5ID09ICdudW1iZXInKSB7XG4gICAgICAgICAgYXJpdHkgPSBhcml0eSA+IDIgPyAoYXJpdHkgLSAyKSA6IDE7XG4gICAgICAgICAgcmV0dXJuIChsZW5ndGggJiYgbGVuZ3RoIDw9IGFyaXR5KSA/IHJlc3VsdCA6IGJhc2VBcnkocmVzdWx0LCBhcml0eSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH07XG4gICAgfSxcbiAgICAnbWl4aW4nOiBmdW5jdGlvbihtaXhpbikge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICB2YXIgZnVuYyA9IHRoaXM7XG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICAgIHJldHVybiBtaXhpbihmdW5jLCBPYmplY3Qoc291cmNlKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJzID0gW107XG4gICAgICAgIGVhY2goa2V5cyhzb3VyY2UpLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICBpZiAoaXNGdW5jdGlvbihzb3VyY2Vba2V5XSkpIHtcbiAgICAgICAgICAgIHBhaXJzLnB1c2goW2tleSwgZnVuYy5wcm90b3R5cGVba2V5XV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWl4aW4oZnVuYywgT2JqZWN0KHNvdXJjZSkpO1xuXG4gICAgICAgIGVhY2gocGFpcnMsIGZ1bmN0aW9uKHBhaXIpIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBwYWlyWzFdO1xuICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgICAgZnVuYy5wcm90b3R5cGVbcGFpclswXV0gPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIGZ1bmMucHJvdG90eXBlW3BhaXJbMF1dO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmdW5jO1xuICAgICAgfTtcbiAgICB9LFxuICAgICdydW5JbkNvbnRleHQnOiBmdW5jdGlvbihydW5JbkNvbnRleHQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBiYXNlQ29udmVydCh1dGlsLCBydW5JbkNvbnRleHQoY29udGV4dCksIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjbG9uZSBvZiBgb2JqZWN0YCBieSBgcGF0aGAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjbG9uZS5cbiAgICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggdG8gY2xvbmUgYnkuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGNsb25lZCBvYmplY3QuXG4gICAqL1xuICBmdW5jdGlvbiBjbG9uZUJ5UGF0aChvYmplY3QsIHBhdGgpIHtcbiAgICBwYXRoID0gdG9QYXRoKHBhdGgpO1xuXG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoLFxuICAgICAgICBsYXN0SW5kZXggPSBsZW5ndGggLSAxLFxuICAgICAgICByZXN1bHQgPSBjbG9uZShPYmplY3Qob2JqZWN0KSksXG4gICAgICAgIG5lc3RlZCA9IHJlc3VsdDtcblxuICAgIHdoaWxlIChuZXN0ZWQgIT0gbnVsbCAmJiArK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICB2YXIga2V5ID0gcGF0aFtpbmRleF0sXG4gICAgICAgICAgdmFsdWUgPSBuZXN0ZWRba2V5XTtcblxuICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgbmVzdGVkW3BhdGhbaW5kZXhdXSA9IGNsb25lKGluZGV4ID09IGxhc3RJbmRleCA/IHZhbHVlIDogT2JqZWN0KHZhbHVlKSk7XG4gICAgICB9XG4gICAgICBuZXN0ZWQgPSBuZXN0ZWRba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBgbG9kYXNoYCB0byBhbiBpbW11dGFibGUgYXV0by1jdXJyaWVkIGl0ZXJhdGVlLWZpcnN0IGRhdGEtbGFzdFxuICAgKiB2ZXJzaW9uIHdpdGggY29udmVyc2lvbiBgb3B0aW9uc2AgYXBwbGllZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuIFNlZSBgYmFzZUNvbnZlcnRgIGZvciBtb3JlIGRldGFpbHMuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgY29udmVydGVkIGBsb2Rhc2hgLlxuICAgKi9cbiAgZnVuY3Rpb24gY29udmVydExpYihvcHRpb25zKSB7XG4gICAgcmV0dXJuIF8ucnVuSW5Db250ZXh0LmNvbnZlcnQob3B0aW9ucykodW5kZWZpbmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBjb252ZXJ0ZXIgZnVuY3Rpb24gZm9yIGBmdW5jYCBvZiBgbmFtZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBjb252ZXJ0ZXIgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBjcmVhdGVDb252ZXJ0ZXIobmFtZSwgZnVuYykge1xuICAgIHZhciBvbGRPcHRpb25zID0gb3B0aW9ucztcbiAgICByZXR1cm4gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdmFyIG5ld1V0aWwgPSBpc0xpYiA/IHByaXN0aW5lIDogaGVscGVycyxcbiAgICAgICAgICBuZXdGdW5jID0gaXNMaWIgPyBwcmlzdGluZVtuYW1lXSA6IGZ1bmMsXG4gICAgICAgICAgbmV3T3B0aW9ucyA9IGFzc2lnbihhc3NpZ24oe30sIG9sZE9wdGlvbnMpLCBvcHRpb25zKTtcblxuICAgICAgcmV0dXJuIGJhc2VDb252ZXJ0KG5ld1V0aWwsIG5hbWUsIG5ld0Z1bmMsIG5ld09wdGlvbnMpO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgd3JhcHMgYGZ1bmNgIHRvIGludm9rZSBpdHMgaXRlcmF0ZWUsIHdpdGggdXAgdG8gYG5gXG4gICAqIGFyZ3VtZW50cywgaWdub3JpbmcgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYXAgaXRlcmF0ZWUgYXJndW1lbnRzIGZvci5cbiAgICogQHBhcmFtIHtudW1iZXJ9IG4gVGhlIGFyaXR5IGNhcC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBpdGVyYXRlZUFyeShmdW5jLCBuKSB7XG4gICAgcmV0dXJuIG92ZXJBcmcoZnVuYywgZnVuY3Rpb24oZnVuYykge1xuICAgICAgcmV0dXJuIHR5cGVvZiBmdW5jID09ICdmdW5jdGlvbicgPyBiYXNlQXJ5KGZ1bmMsIG4pIDogZnVuYztcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3cmFwcyBgZnVuY2AgdG8gaW52b2tlIGl0cyBpdGVyYXRlZSB3aXRoIGFyZ3VtZW50c1xuICAgKiBhcnJhbmdlZCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCBgaW5kZXhlc2Agd2hlcmUgdGhlIGFyZ3VtZW50IHZhbHVlIGF0XG4gICAqIHRoZSBmaXJzdCBpbmRleCBpcyBwcm92aWRlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQsIHRoZSBhcmd1bWVudCB2YWx1ZSBhdFxuICAgKiB0aGUgc2Vjb25kIGluZGV4IGlzIHByb3ZpZGVkIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQsIGFuZCBzbyBvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gcmVhcnJhbmdlIGl0ZXJhdGVlIGFyZ3VtZW50cyBmb3IuXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGluZGV4ZXMgVGhlIGFycmFuZ2VkIGFyZ3VtZW50IGluZGV4ZXMuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gaXRlcmF0ZWVSZWFyZyhmdW5jLCBpbmRleGVzKSB7XG4gICAgcmV0dXJuIG92ZXJBcmcoZnVuYywgZnVuY3Rpb24oZnVuYykge1xuICAgICAgdmFyIG4gPSBpbmRleGVzLmxlbmd0aDtcbiAgICAgIHJldHVybiBiYXNlQXJpdHkocmVhcmcoYmFzZUFyeShmdW5jLCBuKSwgaW5kZXhlcyksIG4pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYGZ1bmNgIHdpdGggaXRzIGZpcnN0IGFyZ3VtZW50IHBhc3NlZFxuICAgKiB0aHJ1IGB0cmFuc2Zvcm1gLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSB0cmFuc2Zvcm0gVGhlIGZ1bmN0aW9ucyB0byB0cmFuc2Zvcm0gdGhlIGZpcnN0IGFyZ3VtZW50LlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIG92ZXJBcmcoZnVuYywgdHJhbnNmb3JtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZnVuYygpO1xuICAgICAgfVxuICAgICAgdmFyIGFyZ3MgPSBBcnJheShsZW5ndGgpO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGFyZ3NbbGVuZ3RoXSA9IGFyZ3VtZW50c1tsZW5ndGhdO1xuICAgICAgfVxuICAgICAgdmFyIGluZGV4ID0gY29uZmlnLnJlYXJnID8gMCA6IChsZW5ndGggLSAxKTtcbiAgICAgIGFyZ3NbaW5kZXhdID0gdHJhbnNmb3JtKGFyZ3NbaW5kZXhdKTtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3cmFwcyBgZnVuY2AgYW5kIGFwcGx5cyB0aGUgY29udmVyc2lvbnNcbiAgICogcnVsZXMgYnkgYG5hbWVgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiB3cmFwKG5hbWUsIGZ1bmMpIHtcbiAgICBuYW1lID0gbWFwcGluZy5hbGlhc1RvUmVhbFtuYW1lXSB8fCBuYW1lO1xuXG4gICAgdmFyIHJlc3VsdCxcbiAgICAgICAgd3JhcHBlZCA9IGZ1bmMsXG4gICAgICAgIHdyYXBwZXIgPSB3cmFwcGVyc1tuYW1lXTtcblxuICAgIGlmICh3cmFwcGVyKSB7XG4gICAgICB3cmFwcGVkID0gd3JhcHBlcihmdW5jKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY29uZmlnLmltbXV0YWJsZSkge1xuICAgICAgaWYgKG11dGF0ZU1hcC5hcnJheVtuYW1lXSkge1xuICAgICAgICB3cmFwcGVkID0gaW1tdXRXcmFwKGZ1bmMsIGNsb25lQXJyYXkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAobXV0YXRlTWFwLm9iamVjdFtuYW1lXSkge1xuICAgICAgICB3cmFwcGVkID0gaW1tdXRXcmFwKGZ1bmMsIGNyZWF0ZUNsb25lcihmdW5jKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChtdXRhdGVNYXAuc2V0W25hbWVdKSB7XG4gICAgICAgIHdyYXBwZWQgPSBpbW11dFdyYXAoZnVuYywgY2xvbmVCeVBhdGgpO1xuICAgICAgfVxuICAgIH1cbiAgICBlYWNoKGFyeU1ldGhvZEtleXMsIGZ1bmN0aW9uKGFyeUtleSkge1xuICAgICAgZWFjaChtYXBwaW5nLmFyeU1ldGhvZFthcnlLZXldLCBmdW5jdGlvbihvdGhlck5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUgPT0gb3RoZXJOYW1lKSB7XG4gICAgICAgICAgdmFyIGFyeU4gPSAhaXNMaWIgJiYgbWFwcGluZy5pdGVyYXRlZUFyeVtuYW1lXSxcbiAgICAgICAgICAgICAgcmVhcmdJbmRleGVzID0gbWFwcGluZy5pdGVyYXRlZVJlYXJnW25hbWVdLFxuICAgICAgICAgICAgICBzcHJlYWRTdGFydCA9IG1hcHBpbmcubWV0aG9kU3ByZWFkW25hbWVdO1xuXG4gICAgICAgICAgcmVzdWx0ID0gd3JhcHBlZDtcbiAgICAgICAgICBpZiAoY29uZmlnLmZpeGVkICYmIChmb3JjZUZpeGVkIHx8ICFtYXBwaW5nLnNraXBGaXhlZFtuYW1lXSkpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHNwcmVhZFN0YXJ0ID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgPyBhcnkocmVzdWx0LCBhcnlLZXkpXG4gICAgICAgICAgICAgIDogc3ByZWFkKHJlc3VsdCwgc3ByZWFkU3RhcnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY29uZmlnLnJlYXJnICYmIGFyeUtleSA+IDEgJiYgKGZvcmNlUmVhcmcgfHwgIW1hcHBpbmcuc2tpcFJlYXJnW25hbWVdKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVhcmcocmVzdWx0LCBtYXBwaW5nLm1ldGhvZFJlYXJnW25hbWVdIHx8IG1hcHBpbmcuYXJ5UmVhcmdbYXJ5S2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb25maWcuY2FwKSB7XG4gICAgICAgICAgICBpZiAocmVhcmdJbmRleGVzKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGl0ZXJhdGVlUmVhcmcocmVzdWx0LCByZWFyZ0luZGV4ZXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhcnlOKSB7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGl0ZXJhdGVlQXJ5KHJlc3VsdCwgYXJ5Tik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChmb3JjZUN1cnJ5IHx8IChjb25maWcuY3VycnkgJiYgYXJ5S2V5ID4gMSkpIHtcbiAgICAgICAgICAgIGZvcmNlQ3VycnkgICYmIGNvbnNvbGUubG9nKGZvcmNlQ3VycnksIG5hbWUpO1xuICAgICAgICAgICAgcmVzdWx0ID0gY3VycnkocmVzdWx0LCBhcnlLZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuICFyZXN1bHQ7XG4gICAgfSk7XG5cbiAgICByZXN1bHQgfHwgKHJlc3VsdCA9IHdyYXBwZWQpO1xuICAgIGlmIChyZXN1bHQgPT0gZnVuYykge1xuICAgICAgcmVzdWx0ID0gZm9yY2VDdXJyeSA/IGN1cnJ5KHJlc3VsdCwgMSkgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJlc3VsdC5jb252ZXJ0ID0gY3JlYXRlQ29udmVydGVyKG5hbWUsIGZ1bmMpO1xuICAgIGlmIChtYXBwaW5nLnBsYWNlaG9sZGVyW25hbWVdKSB7XG4gICAgICBzZXRQbGFjZWhvbGRlciA9IHRydWU7XG4gICAgICByZXN1bHQucGxhY2Vob2xkZXIgPSBmdW5jLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICBpZiAoIWlzT2JqKSB7XG4gICAgcmV0dXJuIHdyYXAobmFtZSwgZnVuYyk7XG4gIH1cbiAgdmFyIF8gPSBmdW5jO1xuXG4gIC8vIENvbnZlcnQgbWV0aG9kcyBieSBhcnkgY2FwLlxuICB2YXIgcGFpcnMgPSBbXTtcbiAgZWFjaChhcnlNZXRob2RLZXlzLCBmdW5jdGlvbihhcnlLZXkpIHtcbiAgICBlYWNoKG1hcHBpbmcuYXJ5TWV0aG9kW2FyeUtleV0sIGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW21hcHBpbmcucmVtYXBba2V5XSB8fCBrZXldO1xuICAgICAgaWYgKGZ1bmMpIHtcbiAgICAgICAgcGFpcnMucHVzaChba2V5LCB3cmFwKGtleSwgZnVuYyldKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gQ29udmVydCByZW1haW5pbmcgbWV0aG9kcy5cbiAgZWFjaChrZXlzKF8pLCBmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgZnVuYyA9IF9ba2V5XTtcbiAgICBpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIGxlbmd0aCA9IHBhaXJzLmxlbmd0aDtcbiAgICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgICBpZiAocGFpcnNbbGVuZ3RoXVswXSA9PSBrZXkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmMuY29udmVydCA9IGNyZWF0ZUNvbnZlcnRlcihrZXksIGZ1bmMpO1xuICAgICAgcGFpcnMucHVzaChba2V5LCBmdW5jXSk7XG4gICAgfVxuICB9KTtcblxuICAvLyBBc3NpZ24gdG8gYF9gIGxlYXZpbmcgYF8ucHJvdG90eXBlYCB1bmNoYW5nZWQgdG8gYWxsb3cgY2hhaW5pbmcuXG4gIGVhY2gocGFpcnMsIGZ1bmN0aW9uKHBhaXIpIHtcbiAgICBfW3BhaXJbMF1dID0gcGFpclsxXTtcbiAgfSk7XG5cbiAgXy5jb252ZXJ0ID0gY29udmVydExpYjtcbiAgaWYgKHNldFBsYWNlaG9sZGVyKSB7XG4gICAgXy5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyO1xuICB9XG4gIC8vIEFzc2lnbiBhbGlhc2VzLlxuICBlYWNoKGtleXMoXyksIGZ1bmN0aW9uKGtleSkge1xuICAgIGVhY2gobWFwcGluZy5yZWFsVG9BbGlhc1trZXldIHx8IFtdLCBmdW5jdGlvbihhbGlhcykge1xuICAgICAgX1thbGlhc10gPSBfW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBfO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VDb252ZXJ0O1xuIiwiLyoqIFVzZWQgdG8gbWFwIGFsaWFzZXMgdG8gdGhlaXIgcmVhbCBuYW1lcy4gKi9cbmV4cG9ydHMuYWxpYXNUb1JlYWwgPSB7XG5cbiAgLy8gTG9kYXNoIGFsaWFzZXMuXG4gICdlYWNoJzogJ2ZvckVhY2gnLFxuICAnZWFjaFJpZ2h0JzogJ2ZvckVhY2hSaWdodCcsXG4gICdlbnRyaWVzJzogJ3RvUGFpcnMnLFxuICAnZW50cmllc0luJzogJ3RvUGFpcnNJbicsXG4gICdleHRlbmQnOiAnYXNzaWduSW4nLFxuICAnZXh0ZW5kV2l0aCc6ICdhc3NpZ25JbldpdGgnLFxuICAnZmlyc3QnOiAnaGVhZCcsXG5cbiAgLy8gUmFtZGEgYWxpYXNlcy5cbiAgJ19fJzogJ3BsYWNlaG9sZGVyJyxcbiAgJ2FsbCc6ICdldmVyeScsXG4gICdhbGxQYXNzJzogJ292ZXJFdmVyeScsXG4gICdhbHdheXMnOiAnY29uc3RhbnQnLFxuICAnYW55JzogJ3NvbWUnLFxuICAnYW55UGFzcyc6ICdvdmVyU29tZScsXG4gICdhcHBseSc6ICdzcHJlYWQnLFxuICAnYXNzb2MnOiAnc2V0JyxcbiAgJ2Fzc29jUGF0aCc6ICdzZXQnLFxuICAnY29tcGxlbWVudCc6ICduZWdhdGUnLFxuICAnY29tcG9zZSc6ICdmbG93UmlnaHQnLFxuICAnY29udGFpbnMnOiAnaW5jbHVkZXMnLFxuICAnZGlzc29jJzogJ3Vuc2V0JyxcbiAgJ2Rpc3NvY1BhdGgnOiAndW5zZXQnLFxuICAnZXF1YWxzJzogJ2lzRXF1YWwnLFxuICAnaWRlbnRpY2FsJzogJ2VxJyxcbiAgJ2luaXQnOiAnaW5pdGlhbCcsXG4gICdpbnZlcnRPYmonOiAnaW52ZXJ0JyxcbiAgJ2p1eHQnOiAnb3ZlcicsXG4gICdvbWl0QWxsJzogJ29taXQnLFxuICAnbkFyeSc6ICdhcnknLFxuICAncGF0aCc6ICdnZXQnLFxuICAncGF0aEVxJzogJ21hdGNoZXNQcm9wZXJ0eScsXG4gICdwYXRoT3InOiAnZ2V0T3InLFxuICAncGF0aHMnOiAnYXQnLFxuICAncGlja0FsbCc6ICdwaWNrJyxcbiAgJ3BpcGUnOiAnZmxvdycsXG4gICdwbHVjayc6ICdtYXAnLFxuICAncHJvcCc6ICdnZXQnLFxuICAncHJvcEVxJzogJ21hdGNoZXNQcm9wZXJ0eScsXG4gICdwcm9wT3InOiAnZ2V0T3InLFxuICAncHJvcHMnOiAnYXQnLFxuICAndW5hcHBseSc6ICdyZXN0JyxcbiAgJ3VubmVzdCc6ICdmbGF0dGVuJyxcbiAgJ3VzZVdpdGgnOiAnb3ZlckFyZ3MnLFxuICAnd2hlcmVFcSc6ICdmaWx0ZXInLFxuICAnemlwT2JqJzogJ3ppcE9iamVjdCdcbn07XG5cbi8qKiBVc2VkIHRvIG1hcCBhcnkgdG8gbWV0aG9kIG5hbWVzLiAqL1xuZXhwb3J0cy5hcnlNZXRob2QgPSB7XG4gICcxJzogW1xuICAgICdhdHRlbXB0JywgJ2Nhc3RBcnJheScsICdjZWlsJywgJ2NyZWF0ZScsICdjdXJyeScsICdjdXJyeVJpZ2h0JywgJ2Zsb29yJyxcbiAgICAnZmxvdycsICdmbG93UmlnaHQnLCAnZnJvbVBhaXJzJywgJ2ludmVydCcsICdpdGVyYXRlZScsICdtZW1vaXplJywgJ21ldGhvZCcsXG4gICAgJ21ldGhvZE9mJywgJ21peGluJywgJ292ZXInLCAnb3ZlckV2ZXJ5JywgJ292ZXJTb21lJywgJ3Jlc3QnLCAncmV2ZXJzZScsXG4gICAgJ3JvdW5kJywgJ3J1bkluQ29udGV4dCcsICdzcHJlYWQnLCAndGVtcGxhdGUnLCAndHJpbScsICd0cmltRW5kJywgJ3RyaW1TdGFydCcsXG4gICAgJ3VuaXF1ZUlkJywgJ3dvcmRzJ1xuICBdLFxuICAnMic6IFtcbiAgICAnYWRkJywgJ2FmdGVyJywgJ2FyeScsICdhc3NpZ24nLCAnYXNzaWduSW4nLCAnYXQnLCAnYmVmb3JlJywgJ2JpbmQnLCAnYmluZEFsbCcsXG4gICAgJ2JpbmRLZXknLCAnY2h1bmsnLCAnY2xvbmVEZWVwV2l0aCcsICdjbG9uZVdpdGgnLCAnY29uY2F0JywgJ2NvdW50QnknLCAnY3VycnlOJyxcbiAgICAnY3VycnlSaWdodE4nLCAnZGVib3VuY2UnLCAnZGVmYXVsdHMnLCAnZGVmYXVsdHNEZWVwJywgJ2RlbGF5JywgJ2RpZmZlcmVuY2UnLFxuICAgICdkaXZpZGUnLCAnZHJvcCcsICdkcm9wUmlnaHQnLCAnZHJvcFJpZ2h0V2hpbGUnLCAnZHJvcFdoaWxlJywgJ2VuZHNXaXRoJyxcbiAgICAnZXEnLCAnZXZlcnknLCAnZmlsdGVyJywgJ2ZpbmQnLCAnZmluZEluZGV4JywgJ2ZpbmRLZXknLCAnZmluZExhc3QnLFxuICAgICdmaW5kTGFzdEluZGV4JywgJ2ZpbmRMYXN0S2V5JywgJ2ZsYXRNYXAnLCAnZmxhdE1hcERlZXAnLCAnZmxhdHRlbkRlcHRoJyxcbiAgICAnZm9yRWFjaCcsICdmb3JFYWNoUmlnaHQnLCAnZm9ySW4nLCAnZm9ySW5SaWdodCcsICdmb3JPd24nLCAnZm9yT3duUmlnaHQnLFxuICAgICdnZXQnLCAnZ3JvdXBCeScsICdndCcsICdndGUnLCAnaGFzJywgJ2hhc0luJywgJ2luY2x1ZGVzJywgJ2luZGV4T2YnLFxuICAgICdpbnRlcnNlY3Rpb24nLCAnaW52ZXJ0QnknLCAnaW52b2tlJywgJ2ludm9rZU1hcCcsICdpc0VxdWFsJywgJ2lzTWF0Y2gnLFxuICAgICdqb2luJywgJ2tleUJ5JywgJ2xhc3RJbmRleE9mJywgJ2x0JywgJ2x0ZScsICdtYXAnLCAnbWFwS2V5cycsICdtYXBWYWx1ZXMnLFxuICAgICdtYXRjaGVzUHJvcGVydHknLCAnbWF4QnknLCAnbWVhbkJ5JywgJ21lcmdlJywgJ21pbkJ5JywgJ211bHRpcGx5JywgJ250aCcsXG4gICAgJ29taXQnLCAnb21pdEJ5JywgJ292ZXJBcmdzJywgJ3BhZCcsICdwYWRFbmQnLCAncGFkU3RhcnQnLCAncGFyc2VJbnQnLFxuICAgICdwYXJ0aWFsJywgJ3BhcnRpYWxSaWdodCcsICdwYXJ0aXRpb24nLCAncGljaycsICdwaWNrQnknLCAncHVsbCcsICdwdWxsQWxsJyxcbiAgICAncHVsbEF0JywgJ3JhbmRvbScsICdyYW5nZScsICdyYW5nZVJpZ2h0JywgJ3JlYXJnJywgJ3JlamVjdCcsICdyZW1vdmUnLFxuICAgICdyZXBlYXQnLCAncmVzdEZyb20nLCAncmVzdWx0JywgJ3NhbXBsZVNpemUnLCAnc29tZScsICdzb3J0QnknLCAnc29ydGVkSW5kZXgnLFxuICAgICdzb3J0ZWRJbmRleE9mJywgJ3NvcnRlZExhc3RJbmRleCcsICdzb3J0ZWRMYXN0SW5kZXhPZicsICdzb3J0ZWRVbmlxQnknLFxuICAgICdzcGxpdCcsICdzcHJlYWRGcm9tJywgJ3N0YXJ0c1dpdGgnLCAnc3VidHJhY3QnLCAnc3VtQnknLCAndGFrZScsICd0YWtlUmlnaHQnLFxuICAgICd0YWtlUmlnaHRXaGlsZScsICd0YWtlV2hpbGUnLCAndGFwJywgJ3Rocm90dGxlJywgJ3RocnUnLCAndGltZXMnLCAndHJpbUNoYXJzJyxcbiAgICAndHJpbUNoYXJzRW5kJywgJ3RyaW1DaGFyc1N0YXJ0JywgJ3RydW5jYXRlJywgJ3VuaW9uJywgJ3VuaXFCeScsICd1bmlxV2l0aCcsXG4gICAgJ3Vuc2V0JywgJ3VuemlwV2l0aCcsICd3aXRob3V0JywgJ3dyYXAnLCAneG9yJywgJ3ppcCcsICd6aXBPYmplY3QnLFxuICAgICd6aXBPYmplY3REZWVwJ1xuICBdLFxuICAnMyc6IFtcbiAgICAnYXNzaWduSW5XaXRoJywgJ2Fzc2lnbldpdGgnLCAnY2xhbXAnLCAnZGlmZmVyZW5jZUJ5JywgJ2RpZmZlcmVuY2VXaXRoJyxcbiAgICAnZmluZEZyb20nLCAnZmluZEluZGV4RnJvbScsICdmaW5kTGFzdEZyb20nLCAnZmluZExhc3RJbmRleEZyb20nLCAnZ2V0T3InLFxuICAgICdpbmNsdWRlc0Zyb20nLCAnaW5kZXhPZkZyb20nLCAnaW5SYW5nZScsICdpbnRlcnNlY3Rpb25CeScsICdpbnRlcnNlY3Rpb25XaXRoJyxcbiAgICAnaW52b2tlQXJncycsICdpbnZva2VBcmdzTWFwJywgJ2lzRXF1YWxXaXRoJywgJ2lzTWF0Y2hXaXRoJywgJ2ZsYXRNYXBEZXB0aCcsXG4gICAgJ2xhc3RJbmRleE9mRnJvbScsICdtZXJnZVdpdGgnLCAnb3JkZXJCeScsICdwYWRDaGFycycsICdwYWRDaGFyc0VuZCcsXG4gICAgJ3BhZENoYXJzU3RhcnQnLCAncHVsbEFsbEJ5JywgJ3B1bGxBbGxXaXRoJywgJ3JlZHVjZScsICdyZWR1Y2VSaWdodCcsICdyZXBsYWNlJyxcbiAgICAnc2V0JywgJ3NsaWNlJywgJ3NvcnRlZEluZGV4QnknLCAnc29ydGVkTGFzdEluZGV4QnknLCAndHJhbnNmb3JtJywgJ3VuaW9uQnknLFxuICAgICd1bmlvbldpdGgnLCAndXBkYXRlJywgJ3hvckJ5JywgJ3hvcldpdGgnLCAnemlwV2l0aCdcbiAgXSxcbiAgJzQnOiBbXG4gICAgJ2ZpbGwnLCAnc2V0V2l0aCcsICd1cGRhdGVXaXRoJ1xuICBdXG59O1xuXG4vKiogVXNlZCB0byBtYXAgYXJ5IHRvIHJlYXJnIGNvbmZpZ3MuICovXG5leHBvcnRzLmFyeVJlYXJnID0ge1xuICAnMic6IFsxLCAwXSxcbiAgJzMnOiBbMiwgMCwgMV0sXG4gICc0JzogWzMsIDIsIDAsIDFdXG59O1xuXG4vKiogVXNlZCB0byBtYXAgbWV0aG9kIG5hbWVzIHRvIHRoZWlyIGl0ZXJhdGVlIGFyeS4gKi9cbmV4cG9ydHMuaXRlcmF0ZWVBcnkgPSB7XG4gICdkcm9wUmlnaHRXaGlsZSc6IDEsXG4gICdkcm9wV2hpbGUnOiAxLFxuICAnZXZlcnknOiAxLFxuICAnZmlsdGVyJzogMSxcbiAgJ2ZpbmQnOiAxLFxuICAnZmluZEZyb20nOiAxLFxuICAnZmluZEluZGV4JzogMSxcbiAgJ2ZpbmRJbmRleEZyb20nOiAxLFxuICAnZmluZEtleSc6IDEsXG4gICdmaW5kTGFzdCc6IDEsXG4gICdmaW5kTGFzdEZyb20nOiAxLFxuICAnZmluZExhc3RJbmRleCc6IDEsXG4gICdmaW5kTGFzdEluZGV4RnJvbSc6IDEsXG4gICdmaW5kTGFzdEtleSc6IDEsXG4gICdmbGF0TWFwJzogMSxcbiAgJ2ZsYXRNYXBEZWVwJzogMSxcbiAgJ2ZsYXRNYXBEZXB0aCc6IDEsXG4gICdmb3JFYWNoJzogMSxcbiAgJ2ZvckVhY2hSaWdodCc6IDEsXG4gICdmb3JJbic6IDEsXG4gICdmb3JJblJpZ2h0JzogMSxcbiAgJ2Zvck93bic6IDEsXG4gICdmb3JPd25SaWdodCc6IDEsXG4gICdtYXAnOiAxLFxuICAnbWFwS2V5cyc6IDEsXG4gICdtYXBWYWx1ZXMnOiAxLFxuICAncGFydGl0aW9uJzogMSxcbiAgJ3JlZHVjZSc6IDIsXG4gICdyZWR1Y2VSaWdodCc6IDIsXG4gICdyZWplY3QnOiAxLFxuICAncmVtb3ZlJzogMSxcbiAgJ3NvbWUnOiAxLFxuICAndGFrZVJpZ2h0V2hpbGUnOiAxLFxuICAndGFrZVdoaWxlJzogMSxcbiAgJ3RpbWVzJzogMSxcbiAgJ3RyYW5zZm9ybSc6IDJcbn07XG5cbi8qKiBVc2VkIHRvIG1hcCBtZXRob2QgbmFtZXMgdG8gaXRlcmF0ZWUgcmVhcmcgY29uZmlncy4gKi9cbmV4cG9ydHMuaXRlcmF0ZWVSZWFyZyA9IHtcbiAgJ21hcEtleXMnOiBbMV1cbn07XG5cbi8qKiBVc2VkIHRvIG1hcCBtZXRob2QgbmFtZXMgdG8gcmVhcmcgY29uZmlncy4gKi9cbmV4cG9ydHMubWV0aG9kUmVhcmcgPSB7XG4gICdhc3NpZ25JbldpdGgnOiBbMSwgMiwgMF0sXG4gICdhc3NpZ25XaXRoJzogWzEsIDIsIDBdLFxuICAnZGlmZmVyZW5jZUJ5JzogWzEsIDIsIDBdLFxuICAnZGlmZmVyZW5jZVdpdGgnOiBbMSwgMiwgMF0sXG4gICdnZXRPcic6IFsyLCAxLCAwXSxcbiAgJ2ludGVyc2VjdGlvbkJ5JzogWzEsIDIsIDBdLFxuICAnaW50ZXJzZWN0aW9uV2l0aCc6IFsxLCAyLCAwXSxcbiAgJ2lzRXF1YWxXaXRoJzogWzEsIDIsIDBdLFxuICAnaXNNYXRjaFdpdGgnOiBbMiwgMSwgMF0sXG4gICdtZXJnZVdpdGgnOiBbMSwgMiwgMF0sXG4gICdwYWRDaGFycyc6IFsyLCAxLCAwXSxcbiAgJ3BhZENoYXJzRW5kJzogWzIsIDEsIDBdLFxuICAncGFkQ2hhcnNTdGFydCc6IFsyLCAxLCAwXSxcbiAgJ3B1bGxBbGxCeSc6IFsyLCAxLCAwXSxcbiAgJ3B1bGxBbGxXaXRoJzogWzIsIDEsIDBdLFxuICAnc2V0V2l0aCc6IFszLCAxLCAyLCAwXSxcbiAgJ3NvcnRlZEluZGV4QnknOiBbMiwgMSwgMF0sXG4gICdzb3J0ZWRMYXN0SW5kZXhCeSc6IFsyLCAxLCAwXSxcbiAgJ3VuaW9uQnknOiBbMSwgMiwgMF0sXG4gICd1bmlvbldpdGgnOiBbMSwgMiwgMF0sXG4gICd1cGRhdGVXaXRoJzogWzMsIDEsIDIsIDBdLFxuICAneG9yQnknOiBbMSwgMiwgMF0sXG4gICd4b3JXaXRoJzogWzEsIDIsIDBdLFxuICAnemlwV2l0aCc6IFsxLCAyLCAwXVxufTtcblxuLyoqIFVzZWQgdG8gbWFwIG1ldGhvZCBuYW1lcyB0byBzcHJlYWQgY29uZmlncy4gKi9cbmV4cG9ydHMubWV0aG9kU3ByZWFkID0ge1xuICAnaW52b2tlQXJncyc6IDIsXG4gICdpbnZva2VBcmdzTWFwJzogMixcbiAgJ3BhcnRpYWwnOiAxLFxuICAncGFydGlhbFJpZ2h0JzogMSxcbiAgJ3dpdGhvdXQnOiAxXG59O1xuXG4vKiogVXNlZCB0byBpZGVudGlmeSBtZXRob2RzIHdoaWNoIG11dGF0ZSBhcnJheXMgb3Igb2JqZWN0cy4gKi9cbmV4cG9ydHMubXV0YXRlID0ge1xuICAnYXJyYXknOiB7XG4gICAgJ2ZpbGwnOiB0cnVlLFxuICAgICdwdWxsJzogdHJ1ZSxcbiAgICAncHVsbEFsbCc6IHRydWUsXG4gICAgJ3B1bGxBbGxCeSc6IHRydWUsXG4gICAgJ3B1bGxBbGxXaXRoJzogdHJ1ZSxcbiAgICAncHVsbEF0JzogdHJ1ZSxcbiAgICAncmVtb3ZlJzogdHJ1ZSxcbiAgICAncmV2ZXJzZSc6IHRydWVcbiAgfSxcbiAgJ29iamVjdCc6IHtcbiAgICAnYXNzaWduJzogdHJ1ZSxcbiAgICAnYXNzaWduSW4nOiB0cnVlLFxuICAgICdhc3NpZ25JbldpdGgnOiB0cnVlLFxuICAgICdhc3NpZ25XaXRoJzogdHJ1ZSxcbiAgICAnZGVmYXVsdHMnOiB0cnVlLFxuICAgICdkZWZhdWx0c0RlZXAnOiB0cnVlLFxuICAgICdtZXJnZSc6IHRydWUsXG4gICAgJ21lcmdlV2l0aCc6IHRydWVcbiAgfSxcbiAgJ3NldCc6IHtcbiAgICAnc2V0JzogdHJ1ZSxcbiAgICAnc2V0V2l0aCc6IHRydWUsXG4gICAgJ3Vuc2V0JzogdHJ1ZSxcbiAgICAndXBkYXRlJzogdHJ1ZSxcbiAgICAndXBkYXRlV2l0aCc6IHRydWVcbiAgfVxufTtcblxuLyoqIFVzZWQgdG8gdHJhY2sgbWV0aG9kcyB3aXRoIHBsYWNlaG9sZGVyIHN1cHBvcnQgKi9cbmV4cG9ydHMucGxhY2Vob2xkZXIgPSB7XG4gICdiaW5kJzogdHJ1ZSxcbiAgJ2JpbmRLZXknOiB0cnVlLFxuICAnY3VycnknOiB0cnVlLFxuICAnY3VycnlSaWdodCc6IHRydWUsXG4gICdwYXJ0aWFsJzogdHJ1ZSxcbiAgJ3BhcnRpYWxSaWdodCc6IHRydWVcbn07XG5cbi8qKiBVc2VkIHRvIG1hcCByZWFsIG5hbWVzIHRvIHRoZWlyIGFsaWFzZXMuICovXG5leHBvcnRzLnJlYWxUb0FsaWFzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgb2JqZWN0ID0gZXhwb3J0cy5hbGlhc1RvUmVhbCxcbiAgICAgIHJlc3VsdCA9IHt9O1xuXG4gIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3Rba2V5XTtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChyZXN1bHQsIHZhbHVlKSkge1xuICAgICAgcmVzdWx0W3ZhbHVlXS5wdXNoKGtleSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdFt2YWx1ZV0gPSBba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn0oKSk7XG5cbi8qKiBVc2VkIHRvIG1hcCBtZXRob2QgbmFtZXMgdG8gb3RoZXIgbmFtZXMuICovXG5leHBvcnRzLnJlbWFwID0ge1xuICAnY3VycnlOJzogJ2N1cnJ5JyxcbiAgJ2N1cnJ5UmlnaHROJzogJ2N1cnJ5UmlnaHQnLFxuICAnZmluZEZyb20nOiAnZmluZCcsXG4gICdmaW5kSW5kZXhGcm9tJzogJ2ZpbmRJbmRleCcsXG4gICdmaW5kTGFzdEZyb20nOiAnZmluZExhc3QnLFxuICAnZmluZExhc3RJbmRleEZyb20nOiAnZmluZExhc3RJbmRleCcsXG4gICdnZXRPcic6ICdnZXQnLFxuICAnaW5jbHVkZXNGcm9tJzogJ2luY2x1ZGVzJyxcbiAgJ2luZGV4T2ZGcm9tJzogJ2luZGV4T2YnLFxuICAnaW52b2tlQXJncyc6ICdpbnZva2UnLFxuICAnaW52b2tlQXJnc01hcCc6ICdpbnZva2VNYXAnLFxuICAnbGFzdEluZGV4T2ZGcm9tJzogJ2xhc3RJbmRleE9mJyxcbiAgJ3BhZENoYXJzJzogJ3BhZCcsXG4gICdwYWRDaGFyc0VuZCc6ICdwYWRFbmQnLFxuICAncGFkQ2hhcnNTdGFydCc6ICdwYWRTdGFydCcsXG4gICdyZXN0RnJvbSc6ICdyZXN0JyxcbiAgJ3NwcmVhZEZyb20nOiAnc3ByZWFkJyxcbiAgJ3RyaW1DaGFycyc6ICd0cmltJyxcbiAgJ3RyaW1DaGFyc0VuZCc6ICd0cmltRW5kJyxcbiAgJ3RyaW1DaGFyc1N0YXJ0JzogJ3RyaW1TdGFydCdcbn07XG5cbi8qKiBVc2VkIHRvIHRyYWNrIG1ldGhvZHMgdGhhdCBza2lwIGZpeGluZyB0aGVpciBhcml0eS4gKi9cbmV4cG9ydHMuc2tpcEZpeGVkID0ge1xuICAnY2FzdEFycmF5JzogdHJ1ZSxcbiAgJ2Zsb3cnOiB0cnVlLFxuICAnZmxvd1JpZ2h0JzogdHJ1ZSxcbiAgJ2l0ZXJhdGVlJzogdHJ1ZSxcbiAgJ21peGluJzogdHJ1ZSxcbiAgJ3J1bkluQ29udGV4dCc6IHRydWVcbn07XG5cbi8qKiBVc2VkIHRvIHRyYWNrIG1ldGhvZHMgdGhhdCBza2lwIHJlYXJyYW5naW5nIGFyZ3VtZW50cy4gKi9cbmV4cG9ydHMuc2tpcFJlYXJnID0ge1xuICAnYWRkJzogdHJ1ZSxcbiAgJ2Fzc2lnbic6IHRydWUsXG4gICdhc3NpZ25Jbic6IHRydWUsXG4gICdiaW5kJzogdHJ1ZSxcbiAgJ2JpbmRLZXknOiB0cnVlLFxuICAnY29uY2F0JzogdHJ1ZSxcbiAgJ2RpZmZlcmVuY2UnOiB0cnVlLFxuICAnZGl2aWRlJzogdHJ1ZSxcbiAgJ2VxJzogdHJ1ZSxcbiAgJ2d0JzogdHJ1ZSxcbiAgJ2d0ZSc6IHRydWUsXG4gICdpc0VxdWFsJzogdHJ1ZSxcbiAgJ2x0JzogdHJ1ZSxcbiAgJ2x0ZSc6IHRydWUsXG4gICdtYXRjaGVzUHJvcGVydHknOiB0cnVlLFxuICAnbWVyZ2UnOiB0cnVlLFxuICAnbXVsdGlwbHknOiB0cnVlLFxuICAnb3ZlckFyZ3MnOiB0cnVlLFxuICAncGFydGlhbCc6IHRydWUsXG4gICdwYXJ0aWFsUmlnaHQnOiB0cnVlLFxuICAncmFuZG9tJzogdHJ1ZSxcbiAgJ3JhbmdlJzogdHJ1ZSxcbiAgJ3JhbmdlUmlnaHQnOiB0cnVlLFxuICAnc3VidHJhY3QnOiB0cnVlLFxuICAnemlwJzogdHJ1ZSxcbiAgJ3ppcE9iamVjdCc6IHRydWVcbn07XG4iLCIvKipcbiAqIFRoZSBkZWZhdWx0IGFyZ3VtZW50IHBsYWNlaG9sZGVyIHZhbHVlIGZvciBtZXRob2RzLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge307XG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBsb2Rhc2ggbG9kYXNoLmNvbS9saWNlbnNlIHwgVW5kZXJzY29yZS5qcyAxLjguMyB1bmRlcnNjb3JlanMub3JnL0xJQ0VOU0VcbiAqL1xuOyhmdW5jdGlvbigpe2Z1bmN0aW9uIHQodCxuKXtyZXR1cm4gdC5zZXQoblswXSxuWzFdKSx0fWZ1bmN0aW9uIG4odCxuKXtyZXR1cm4gdC5hZGQobiksdH1mdW5jdGlvbiByKHQsbixyKXtzd2l0Y2goci5sZW5ndGgpe2Nhc2UgMDpyZXR1cm4gdC5jYWxsKG4pO2Nhc2UgMTpyZXR1cm4gdC5jYWxsKG4sclswXSk7Y2FzZSAyOnJldHVybiB0LmNhbGwobixyWzBdLHJbMV0pO2Nhc2UgMzpyZXR1cm4gdC5jYWxsKG4sclswXSxyWzFdLHJbMl0pfXJldHVybiB0LmFwcGx5KG4scil9ZnVuY3Rpb24gZSh0LG4scixlKXtmb3IodmFyIHU9LTEsbz10P3QubGVuZ3RoOjA7Kyt1PG87KXt2YXIgaT10W3VdO24oZSxpLHIoaSksdCl9cmV0dXJuIGV9ZnVuY3Rpb24gdSh0LG4pe2Zvcih2YXIgcj0tMSxlPXQ/dC5sZW5ndGg6MDsrK3I8ZSYmZmFsc2UhPT1uKHRbcl0scix0KTspO3JldHVybiB0fWZ1bmN0aW9uIG8odCxuKXtmb3IodmFyIHI9dD90Lmxlbmd0aDowO3ItLSYmZmFsc2UhPT1uKHRbcl0scix0KTspO1xucmV0dXJuIHR9ZnVuY3Rpb24gaSh0LG4pe2Zvcih2YXIgcj0tMSxlPXQ/dC5sZW5ndGg6MDsrK3I8ZTspaWYoIW4odFtyXSxyLHQpKXJldHVybiBmYWxzZTtyZXR1cm4gdHJ1ZX1mdW5jdGlvbiBmKHQsbil7Zm9yKHZhciByPS0xLGU9dD90Lmxlbmd0aDowLHU9MCxvPVtdOysrcjxlOyl7dmFyIGk9dFtyXTtuKGkscix0KSYmKG9bdSsrXT1pKX1yZXR1cm4gb31mdW5jdGlvbiBjKHQsbil7cmV0dXJuISghdHx8IXQubGVuZ3RoKSYmLTE8ZCh0LG4sMCl9ZnVuY3Rpb24gYSh0LG4scil7Zm9yKHZhciBlPS0xLHU9dD90Lmxlbmd0aDowOysrZTx1OylpZihyKG4sdFtlXSkpcmV0dXJuIHRydWU7cmV0dXJuIGZhbHNlfWZ1bmN0aW9uIGwodCxuKXtmb3IodmFyIHI9LTEsZT10P3QubGVuZ3RoOjAsdT1BcnJheShlKTsrK3I8ZTspdVtyXT1uKHRbcl0scix0KTtyZXR1cm4gdX1mdW5jdGlvbiBzKHQsbil7Zm9yKHZhciByPS0xLGU9bi5sZW5ndGgsdT10Lmxlbmd0aDsrK3I8ZTspdFt1K3JdPW5bcl07cmV0dXJuIHR9ZnVuY3Rpb24gaCh0LG4scixlKXtcbnZhciB1PS0xLG89dD90Lmxlbmd0aDowO2ZvcihlJiZvJiYocj10WysrdV0pOysrdTxvOylyPW4ocix0W3VdLHUsdCk7cmV0dXJuIHJ9ZnVuY3Rpb24gcCh0LG4scixlKXt2YXIgdT10P3QubGVuZ3RoOjA7Zm9yKGUmJnUmJihyPXRbLS11XSk7dS0tOylyPW4ocix0W3VdLHUsdCk7cmV0dXJuIHJ9ZnVuY3Rpb24gXyh0LG4pe2Zvcih2YXIgcj0tMSxlPXQ/dC5sZW5ndGg6MDsrK3I8ZTspaWYobih0W3JdLHIsdCkpcmV0dXJuIHRydWU7cmV0dXJuIGZhbHNlfWZ1bmN0aW9uIHYodCxuLHIpe3ZhciBlO3JldHVybiByKHQsZnVuY3Rpb24odCxyLHUpe3JldHVybiBuKHQscix1KT8oZT1yLGZhbHNlKTp2b2lkIDB9KSxlfWZ1bmN0aW9uIGcodCxuLHIsZSl7dmFyIHU9dC5sZW5ndGg7Zm9yKHIrPWU/MTotMTtlP3ItLTorK3I8dTspaWYobih0W3JdLHIsdCkpcmV0dXJuIHI7cmV0dXJuLTF9ZnVuY3Rpb24gZCh0LG4scil7aWYobiE9PW4pcmV0dXJuIE0odCxyKTstLXI7Zm9yKHZhciBlPXQubGVuZ3RoOysrcjxlOylpZih0W3JdPT09bilyZXR1cm4gcjtcbnJldHVybi0xfWZ1bmN0aW9uIHkodCxuLHIsZSl7LS1yO2Zvcih2YXIgdT10Lmxlbmd0aDsrK3I8dTspaWYoZSh0W3JdLG4pKXJldHVybiByO3JldHVybi0xfWZ1bmN0aW9uIGIodCxuKXt2YXIgcj10P3QubGVuZ3RoOjA7cmV0dXJuIHI/dyh0LG4pL3I6Vn1mdW5jdGlvbiB4KHQsbixyLGUsdSl7cmV0dXJuIHUodCxmdW5jdGlvbih0LHUsbyl7cj1lPyhlPWZhbHNlLHQpOm4ocix0LHUsbyl9KSxyfWZ1bmN0aW9uIGoodCxuKXt2YXIgcj10Lmxlbmd0aDtmb3IodC5zb3J0KG4pO3ItLTspdFtyXT10W3JdLmM7cmV0dXJuIHR9ZnVuY3Rpb24gdyh0LG4pe2Zvcih2YXIgcixlPS0xLHU9dC5sZW5ndGg7KytlPHU7KXt2YXIgbz1uKHRbZV0pO28hPT1UJiYocj1yPT09VD9vOnIrbyl9cmV0dXJuIHJ9ZnVuY3Rpb24gbSh0LG4pe2Zvcih2YXIgcj0tMSxlPUFycmF5KHQpOysrcjx0OyllW3JdPW4ocik7cmV0dXJuIGV9ZnVuY3Rpb24gQSh0LG4pe3JldHVybiBsKG4sZnVuY3Rpb24obil7cmV0dXJuW24sdFtuXV07XG59KX1mdW5jdGlvbiBPKHQpe3JldHVybiBmdW5jdGlvbihuKXtyZXR1cm4gdChuKX19ZnVuY3Rpb24gayh0LG4pe3JldHVybiBsKG4sZnVuY3Rpb24obil7cmV0dXJuIHRbbl19KX1mdW5jdGlvbiBFKHQsbil7cmV0dXJuIHQuaGFzKG4pfWZ1bmN0aW9uIFModCxuKXtmb3IodmFyIHI9LTEsZT10Lmxlbmd0aDsrK3I8ZSYmLTE8ZChuLHRbcl0sMCk7KTtyZXR1cm4gcn1mdW5jdGlvbiBJKHQsbil7Zm9yKHZhciByPXQubGVuZ3RoO3ItLSYmLTE8ZChuLHRbcl0sMCk7KTtyZXR1cm4gcn1mdW5jdGlvbiBSKHQpe3JldHVybiB0JiZ0Lk9iamVjdD09PU9iamVjdD90Om51bGx9ZnVuY3Rpb24gVyh0KXtyZXR1cm4genRbdF19ZnVuY3Rpb24gQih0KXtyZXR1cm4gVXRbdF19ZnVuY3Rpb24gTCh0KXtyZXR1cm5cIlxcXFxcIitEdFt0XX1mdW5jdGlvbiBNKHQsbixyKXt2YXIgZT10Lmxlbmd0aDtmb3Iobis9cj8xOi0xO3I/bi0tOisrbjxlOyl7dmFyIHU9dFtuXTtpZih1IT09dSlyZXR1cm4gbn1yZXR1cm4tMTtcbn1mdW5jdGlvbiBDKHQpe3ZhciBuPWZhbHNlO2lmKG51bGwhPXQmJnR5cGVvZiB0LnRvU3RyaW5nIT1cImZ1bmN0aW9uXCIpdHJ5e249ISEodCtcIlwiKX1jYXRjaChyKXt9cmV0dXJuIG59ZnVuY3Rpb24geih0KXtmb3IodmFyIG4scj1bXTshKG49dC5uZXh0KCkpLmRvbmU7KXIucHVzaChuLnZhbHVlKTtyZXR1cm4gcn1mdW5jdGlvbiBVKHQpe3ZhciBuPS0xLHI9QXJyYXkodC5zaXplKTtyZXR1cm4gdC5mb3JFYWNoKGZ1bmN0aW9uKHQsZSl7clsrK25dPVtlLHRdfSkscn1mdW5jdGlvbiAkKHQsbil7Zm9yKHZhciByPS0xLGU9dC5sZW5ndGgsdT0wLG89W107KytyPGU7KXt2YXIgaT10W3JdO2khPT1uJiZcIl9fbG9kYXNoX3BsYWNlaG9sZGVyX19cIiE9PWl8fCh0W3JdPVwiX19sb2Rhc2hfcGxhY2Vob2xkZXJfX1wiLG9bdSsrXT1yKX1yZXR1cm4gb31mdW5jdGlvbiBEKHQpe3ZhciBuPS0xLHI9QXJyYXkodC5zaXplKTtyZXR1cm4gdC5mb3JFYWNoKGZ1bmN0aW9uKHQpe3JbKytuXT10fSkscn1mdW5jdGlvbiBGKHQpe1xudmFyIG49LTEscj1BcnJheSh0LnNpemUpO3JldHVybiB0LmZvckVhY2goZnVuY3Rpb24odCl7clsrK25dPVt0LHRdfSkscn1mdW5jdGlvbiBOKHQpe2lmKCF0fHwhV3QudGVzdCh0KSlyZXR1cm4gdC5sZW5ndGg7Zm9yKHZhciBuPUl0Lmxhc3RJbmRleD0wO0l0LnRlc3QodCk7KW4rKztyZXR1cm4gbn1mdW5jdGlvbiBQKHQpe3JldHVybiAkdFt0XX1mdW5jdGlvbiBaKFIpe2Z1bmN0aW9uIEF0KHQsbil7cmV0dXJuIFIuc2V0VGltZW91dC5jYWxsKEt0LHQsbil9ZnVuY3Rpb24gT3QodCl7aWYoVGUodCkmJiF5aSh0KSYmISh0IGluc3RhbmNlb2YgVXQpKXtpZih0IGluc3RhbmNlb2YgenQpcmV0dXJuIHQ7aWYoV3UuY2FsbCh0LFwiX193cmFwcGVkX19cIikpcmV0dXJuIGFlKHQpfXJldHVybiBuZXcgenQodCl9ZnVuY3Rpb24ga3QoKXt9ZnVuY3Rpb24genQodCxuKXt0aGlzLl9fd3JhcHBlZF9fPXQsdGhpcy5fX2FjdGlvbnNfXz1bXSx0aGlzLl9fY2hhaW5fXz0hIW4sdGhpcy5fX2luZGV4X189MCxcbnRoaXMuX192YWx1ZXNfXz1UfWZ1bmN0aW9uIFV0KHQpe3RoaXMuX193cmFwcGVkX189dCx0aGlzLl9fYWN0aW9uc19fPVtdLHRoaXMuX19kaXJfXz0xLHRoaXMuX19maWx0ZXJlZF9fPWZhbHNlLHRoaXMuX19pdGVyYXRlZXNfXz1bXSx0aGlzLl9fdGFrZUNvdW50X189NDI5NDk2NzI5NSx0aGlzLl9fdmlld3NfXz1bXX1mdW5jdGlvbiAkdCh0KXt2YXIgbj0tMSxyPXQ/dC5sZW5ndGg6MDtmb3IodGhpcy5jbGVhcigpOysrbjxyOyl7dmFyIGU9dFtuXTt0aGlzLnNldChlWzBdLGVbMV0pfX1mdW5jdGlvbiBEdCh0KXt2YXIgbj0tMSxyPXQ/dC5sZW5ndGg6MDtmb3IodGhpcy5jbGVhcigpOysrbjxyOyl7dmFyIGU9dFtuXTt0aGlzLnNldChlWzBdLGVbMV0pfX1mdW5jdGlvbiBQdCh0KXt2YXIgbj0tMSxyPXQ/dC5sZW5ndGg6MDtmb3IodGhpcy5jbGVhcigpOysrbjxyOyl7dmFyIGU9dFtuXTt0aGlzLnNldChlWzBdLGVbMV0pfX1mdW5jdGlvbiBadCh0KXt2YXIgbj0tMSxyPXQ/dC5sZW5ndGg6MDtcbmZvcih0aGlzLl9fZGF0YV9fPW5ldyBQdDsrK248cjspdGhpcy5hZGQodFtuXSl9ZnVuY3Rpb24gcXQodCl7dGhpcy5fX2RhdGFfXz1uZXcgRHQodCl9ZnVuY3Rpb24gVnQodCxuLHIsZSl7cmV0dXJuIHQ9PT1UfHxDZSh0LGt1W3JdKSYmIVd1LmNhbGwoZSxyKT9uOnR9ZnVuY3Rpb24gSnQodCxuLHIpeyhyPT09VHx8Q2UodFtuXSxyKSkmJih0eXBlb2YgbiE9XCJudW1iZXJcInx8ciE9PVR8fG4gaW4gdCl8fCh0W25dPXIpfWZ1bmN0aW9uIFl0KHQsbixyKXt2YXIgZT10W25dO1d1LmNhbGwodCxuKSYmQ2UoZSxyKSYmKHIhPT1UfHxuIGluIHQpfHwodFtuXT1yKX1mdW5jdGlvbiBIdCh0LG4pe2Zvcih2YXIgcj10Lmxlbmd0aDtyLS07KWlmKENlKHRbcl1bMF0sbikpcmV0dXJuIHI7cmV0dXJuLTF9ZnVuY3Rpb24gUXQodCxuLHIsZSl7cmV0dXJuIEFvKHQsZnVuY3Rpb24odCx1LG8pe24oZSx0LHIodCksbyl9KSxlfWZ1bmN0aW9uIFh0KHQsbil7cmV0dXJuIHQmJnNyKG4saXUobiksdCl9XG5mdW5jdGlvbiB0bih0LG4pe2Zvcih2YXIgcj0tMSxlPW51bGw9PXQsdT1uLmxlbmd0aCxvPUFycmF5KHUpOysrcjx1OylvW3JdPWU/VDp1dSh0LG5bcl0pO3JldHVybiBvfWZ1bmN0aW9uIG5uKHQsbixyKXtyZXR1cm4gdD09PXQmJihyIT09VCYmKHQ9cj49dD90OnIpLG4hPT1UJiYodD10Pj1uP3Q6bikpLHR9ZnVuY3Rpb24gcm4odCxuLHIsZSxvLGksZil7dmFyIGM7aWYoZSYmKGM9aT9lKHQsbyxpLGYpOmUodCkpLGMhPT1UKXJldHVybiBjO2lmKCFaZSh0KSlyZXR1cm4gdDtpZihvPXlpKHQpKXtpZihjPUtyKHQpLCFuKXJldHVybiBscih0LGMpfWVsc2V7dmFyIGE9cXIodCksbD1cIltvYmplY3QgRnVuY3Rpb25dXCI9PWF8fFwiW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl1cIj09YTtpZihiaSh0KSlyZXR1cm4gb3IodCxuKTtpZihcIltvYmplY3QgT2JqZWN0XVwiPT1hfHxcIltvYmplY3QgQXJndW1lbnRzXVwiPT1hfHxsJiYhaSl7aWYoQyh0KSlyZXR1cm4gaT90Ont9O2lmKGM9R3IobD97fTp0KSxcbiFuKXJldHVybiBocih0LFh0KGMsdCkpfWVsc2V7aWYoIUN0W2FdKXJldHVybiBpP3Q6e307Yz1Kcih0LGEscm4sbil9fWlmKGZ8fChmPW5ldyBxdCksaT1mLmdldCh0KSlyZXR1cm4gaTtpZihmLnNldCh0LGMpLCFvKXZhciBzPXI/Z24odCxpdSxUcik6aXUodCk7cmV0dXJuIHUoc3x8dCxmdW5jdGlvbih1LG8pe3MmJihvPXUsdT10W29dKSxZdChjLG8scm4odSxuLHIsZSxvLHQsZikpfSksY31mdW5jdGlvbiBlbih0KXt2YXIgbj1pdSh0KSxyPW4ubGVuZ3RoO3JldHVybiBmdW5jdGlvbihlKXtpZihudWxsPT1lKXJldHVybiFyO2Zvcih2YXIgdT1yO3UtLTspe3ZhciBvPW5bdV0saT10W29dLGY9ZVtvXTtpZihmPT09VCYmIShvIGluIE9iamVjdChlKSl8fCFpKGYpKXJldHVybiBmYWxzZX1yZXR1cm4gdHJ1ZX19ZnVuY3Rpb24gdW4odCl7cmV0dXJuIFplKHQpP1R1KHQpOnt9fWZ1bmN0aW9uIG9uKHQsbixyKXtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7XG5yZXR1cm4gQXQoZnVuY3Rpb24oKXt0LmFwcGx5KFQscil9LG4pfWZ1bmN0aW9uIGZuKHQsbixyLGUpe3ZhciB1PS0xLG89YyxpPXRydWUsZj10Lmxlbmd0aCxzPVtdLGg9bi5sZW5ndGg7aWYoIWYpcmV0dXJuIHM7ciYmKG49bChuLE8ocikpKSxlPyhvPWEsaT1mYWxzZSk6bi5sZW5ndGg+PTIwMCYmKG89RSxpPWZhbHNlLG49bmV3IFp0KG4pKTt0OmZvcig7Kyt1PGY7KXt2YXIgcD10W3VdLF89cj9yKHApOnAscD1lfHwwIT09cD9wOjA7aWYoaSYmXz09PV8pe2Zvcih2YXIgdj1oO3YtLTspaWYoblt2XT09PV8pY29udGludWUgdDtzLnB1c2gocCl9ZWxzZSBvKG4sXyxlKXx8cy5wdXNoKHApfXJldHVybiBzfWZ1bmN0aW9uIGNuKHQsbil7dmFyIHI9dHJ1ZTtyZXR1cm4gQW8odCxmdW5jdGlvbih0LGUsdSl7cmV0dXJuIHI9ISFuKHQsZSx1KX0pLHJ9ZnVuY3Rpb24gYW4odCxuLHIpe2Zvcih2YXIgZT0tMSx1PXQubGVuZ3RoOysrZTx1Oyl7dmFyIG89dFtlXSxpPW4obyk7aWYobnVsbCE9aSYmKGY9PT1UP2k9PT1pJiYhSmUoaSk6cihpLGYpKSl2YXIgZj1pLGM9bztcbn1yZXR1cm4gY31mdW5jdGlvbiBsbih0LG4pe3ZhciByPVtdO3JldHVybiBBbyh0LGZ1bmN0aW9uKHQsZSx1KXtuKHQsZSx1KSYmci5wdXNoKHQpfSkscn1mdW5jdGlvbiBzbih0LG4scixlLHUpe3ZhciBvPS0xLGk9dC5sZW5ndGg7Zm9yKHJ8fChyPUhyKSx1fHwodT1bXSk7KytvPGk7KXt2YXIgZj10W29dO24+MCYmcihmKT9uPjE/c24oZixuLTEscixlLHUpOnModSxmKTplfHwodVt1Lmxlbmd0aF09Zil9cmV0dXJuIHV9ZnVuY3Rpb24gaG4odCxuKXtyZXR1cm4gdCYma28odCxuLGl1KX1mdW5jdGlvbiBwbih0LG4pe3JldHVybiB0JiZFbyh0LG4saXUpfWZ1bmN0aW9uIF9uKHQsbil7cmV0dXJuIGYobixmdW5jdGlvbihuKXtyZXR1cm4gRmUodFtuXSl9KX1mdW5jdGlvbiB2bih0LG4pe249bmUobix0KT9bbl06ZXIobik7Zm9yKHZhciByPTAsZT1uLmxlbmd0aDtudWxsIT10JiZlPnI7KXQ9dFtmZShuW3IrK10pXTtyZXR1cm4gciYmcj09ZT90OlR9ZnVuY3Rpb24gZ24odCxuLHIpe1xucmV0dXJuIG49bih0KSx5aSh0KT9uOnMobixyKHQpKX1mdW5jdGlvbiBkbih0LG4pe3JldHVybiB0Pm59ZnVuY3Rpb24geW4odCxuKXtyZXR1cm4gbnVsbCE9dCYmKFd1LmNhbGwodCxuKXx8dHlwZW9mIHQ9PVwib2JqZWN0XCImJm4gaW4gdCYmbnVsbD09PUp1KE9iamVjdCh0KSkpfWZ1bmN0aW9uIGJuKHQsbil7cmV0dXJuIG51bGwhPXQmJm4gaW4gT2JqZWN0KHQpfWZ1bmN0aW9uIHhuKHQsbixyKXtmb3IodmFyIGU9cj9hOmMsdT10WzBdLmxlbmd0aCxvPXQubGVuZ3RoLGk9byxmPUFycmF5KG8pLHM9MS8wLGg9W107aS0tOyl7dmFyIHA9dFtpXTtpJiZuJiYocD1sKHAsTyhuKSkpLHM9dG8ocC5sZW5ndGgscyksZltpXT0hciYmKG58fHU+PTEyMCYmcC5sZW5ndGg+PTEyMCk/bmV3IFp0KGkmJnApOlR9dmFyIHA9dFswXSxfPS0xLHY9ZlswXTt0OmZvcig7KytfPHUmJnM+aC5sZW5ndGg7KXt2YXIgZz1wW19dLGQ9bj9uKGcpOmcsZz1yfHwwIT09Zz9nOjA7aWYodj8hRSh2LGQpOiFlKGgsZCxyKSl7XG5mb3IoaT1vOy0taTspe3ZhciB5PWZbaV07aWYoeT8hRSh5LGQpOiFlKHRbaV0sZCxyKSljb250aW51ZSB0fXYmJnYucHVzaChkKSxoLnB1c2goZyl9fXJldHVybiBofWZ1bmN0aW9uIGpuKHQsbixyKXt2YXIgZT17fTtyZXR1cm4gaG4odCxmdW5jdGlvbih0LHUsbyl7bihlLHIodCksdSxvKX0pLGV9ZnVuY3Rpb24gd24odCxuLGUpe3JldHVybiBuZShuLHQpfHwobj1lcihuKSx0PWllKHQsbiksbj12ZShuKSksbj1udWxsPT10P3Q6dFtmZShuKV0sbnVsbD09bj9UOnIobix0LGUpfWZ1bmN0aW9uIG1uKHQsbixyLGUsdSl7aWYodD09PW4pbj10cnVlO2Vsc2UgaWYobnVsbD09dHx8bnVsbD09bnx8IVplKHQpJiYhVGUobikpbj10IT09dCYmbiE9PW47ZWxzZSB0Ont2YXIgbz15aSh0KSxpPXlpKG4pLGY9XCJbb2JqZWN0IEFycmF5XVwiLGM9XCJbb2JqZWN0IEFycmF5XVwiO298fChmPXFyKHQpLGY9XCJbb2JqZWN0IEFyZ3VtZW50c11cIj09Zj9cIltvYmplY3QgT2JqZWN0XVwiOmYpLGl8fChjPXFyKG4pLFxuYz1cIltvYmplY3QgQXJndW1lbnRzXVwiPT1jP1wiW29iamVjdCBPYmplY3RdXCI6Yyk7dmFyIGE9XCJbb2JqZWN0IE9iamVjdF1cIj09ZiYmIUModCksaT1cIltvYmplY3QgT2JqZWN0XVwiPT1jJiYhQyhuKTtpZigoYz1mPT1jKSYmIWEpdXx8KHU9bmV3IHF0KSxuPW98fFllKHQpP3pyKHQsbixtbixyLGUsdSk6VXIodCxuLGYsbW4scixlLHUpO2Vsc2V7aWYoISgyJmUpJiYobz1hJiZXdS5jYWxsKHQsXCJfX3dyYXBwZWRfX1wiKSxmPWkmJld1LmNhbGwobixcIl9fd3JhcHBlZF9fXCIpLG98fGYpKXt0PW8/dC52YWx1ZSgpOnQsbj1mP24udmFsdWUoKTpuLHV8fCh1PW5ldyBxdCksbj1tbih0LG4scixlLHUpO2JyZWFrIHR9aWYoYyluOmlmKHV8fCh1PW5ldyBxdCksbz0yJmUsZj1pdSh0KSxpPWYubGVuZ3RoLGM9aXUobikubGVuZ3RoLGk9PWN8fG8pe2ZvcihhPWk7YS0tOyl7dmFyIGw9ZlthXTtpZighKG8/bCBpbiBuOnluKG4sbCkpKXtuPWZhbHNlO2JyZWFrIG59fWlmKGM9dS5nZXQodCkpbj1jPT1uO2Vsc2V7XG5jPXRydWUsdS5zZXQodCxuKTtmb3IodmFyIHM9bzsrK2E8aTspe3ZhciBsPWZbYV0saD10W2xdLHA9bltsXTtpZihyKXZhciBfPW8/cihwLGgsbCxuLHQsdSk6cihoLHAsbCx0LG4sdSk7aWYoXz09PVQ/aCE9PXAmJiFtbihoLHAscixlLHUpOiFfKXtjPWZhbHNlO2JyZWFrfXN8fChzPVwiY29uc3RydWN0b3JcIj09bCl9YyYmIXMmJihyPXQuY29uc3RydWN0b3IsZT1uLmNvbnN0cnVjdG9yLHIhPWUmJlwiY29uc3RydWN0b3JcImluIHQmJlwiY29uc3RydWN0b3JcImluIG4mJiEodHlwZW9mIHI9PVwiZnVuY3Rpb25cIiYmciBpbnN0YW5jZW9mIHImJnR5cGVvZiBlPT1cImZ1bmN0aW9uXCImJmUgaW5zdGFuY2VvZiBlKSYmKGM9ZmFsc2UpKSx1W1wiZGVsZXRlXCJdKHQpLG49Y319ZWxzZSBuPWZhbHNlO2Vsc2Ugbj1mYWxzZX19cmV0dXJuIG59ZnVuY3Rpb24gQW4odCxuLHIsZSl7dmFyIHU9ci5sZW5ndGgsbz11LGk9IWU7aWYobnVsbD09dClyZXR1cm4hbztmb3IodD1PYmplY3QodCk7dS0tOyl7dmFyIGY9clt1XTtpZihpJiZmWzJdP2ZbMV0hPT10W2ZbMF1dOiEoZlswXWluIHQpKXJldHVybiBmYWxzZTtcbn1mb3IoOysrdTxvOyl7dmFyIGY9clt1XSxjPWZbMF0sYT10W2NdLGw9ZlsxXTtpZihpJiZmWzJdKXtpZihhPT09VCYmIShjIGluIHQpKXJldHVybiBmYWxzZX1lbHNle2lmKGY9bmV3IHF0LGUpdmFyIHM9ZShhLGwsYyx0LG4sZik7aWYocz09PVQ/IW1uKGwsYSxlLDMsZik6IXMpcmV0dXJuIGZhbHNlfX1yZXR1cm4gdHJ1ZX1mdW5jdGlvbiBPbih0KXtyZXR1cm4hWmUodCl8fEl1JiZJdSBpbiB0P2ZhbHNlOihGZSh0KXx8Qyh0KT96dTp5dCkudGVzdChjZSh0KSl9ZnVuY3Rpb24ga24odCl7cmV0dXJuIHR5cGVvZiB0PT1cImZ1bmN0aW9uXCI/dDpudWxsPT10P3B1OnR5cGVvZiB0PT1cIm9iamVjdFwiP3lpKHQpP1duKHRbMF0sdFsxXSk6Um4odCk6ZHUodCl9ZnVuY3Rpb24gRW4odCl7dD1udWxsPT10P3Q6T2JqZWN0KHQpO3ZhciBuLHI9W107Zm9yKG4gaW4gdClyLnB1c2gobik7cmV0dXJuIHJ9ZnVuY3Rpb24gU24odCxuKXtyZXR1cm4gbj50fWZ1bmN0aW9uIEluKHQsbil7dmFyIHI9LTEsZT1VZSh0KT9BcnJheSh0Lmxlbmd0aCk6W107XG5yZXR1cm4gQW8odCxmdW5jdGlvbih0LHUsbyl7ZVsrK3JdPW4odCx1LG8pfSksZX1mdW5jdGlvbiBSbih0KXt2YXIgbj1Qcih0KTtyZXR1cm4gMT09bi5sZW5ndGgmJm5bMF1bMl0/dWUoblswXVswXSxuWzBdWzFdKTpmdW5jdGlvbihyKXtyZXR1cm4gcj09PXR8fEFuKHIsdCxuKX19ZnVuY3Rpb24gV24odCxuKXtyZXR1cm4gbmUodCkmJm49PT1uJiYhWmUobik/dWUoZmUodCksbik6ZnVuY3Rpb24ocil7dmFyIGU9dXUocix0KTtyZXR1cm4gZT09PVQmJmU9PT1uP291KHIsdCk6bW4obixlLFQsMyl9fWZ1bmN0aW9uIEJuKHQsbixyLGUsbyl7aWYodCE9PW4pe2lmKCF5aShuKSYmIVllKG4pKXZhciBpPWZ1KG4pO3UoaXx8bixmdW5jdGlvbih1LGYpe2lmKGkmJihmPXUsdT1uW2ZdKSxaZSh1KSl7b3x8KG89bmV3IHF0KTt2YXIgYz1mLGE9byxsPXRbY10scz1uW2NdLGg9YS5nZXQocyk7aWYoaClKdCh0LGMsaCk7ZWxzZXt2YXIgaD1lP2UobCxzLGMrXCJcIix0LG4sYSk6VCxwPWg9PT1UO3AmJihoPXMsXG55aShzKXx8WWUocyk/eWkobCk/aD1sOiRlKGwpP2g9bHIobCk6KHA9ZmFsc2UsaD1ybihzLHRydWUpKTpWZShzKXx8emUocyk/emUobCk/aD1ydShsKTohWmUobCl8fHImJkZlKGwpPyhwPWZhbHNlLGg9cm4ocyx0cnVlKSk6aD1sOnA9ZmFsc2UpLGEuc2V0KHMsaCkscCYmQm4oaCxzLHIsZSxhKSxhW1wiZGVsZXRlXCJdKHMpLEp0KHQsYyxoKX19ZWxzZSBjPWU/ZSh0W2ZdLHUsZitcIlwiLHQsbixvKTpULGM9PT1UJiYoYz11KSxKdCh0LGYsYyl9KX19ZnVuY3Rpb24gTG4odCxuKXt2YXIgcj10Lmxlbmd0aDtyZXR1cm4gcj8obis9MD5uP3I6MCxYcihuLHIpP3Rbbl06VCk6dm9pZCAwfWZ1bmN0aW9uIE1uKHQsbixyKXt2YXIgZT0tMTtyZXR1cm4gbj1sKG4ubGVuZ3RoP246W3B1XSxPKEZyKCkpKSx0PUluKHQsZnVuY3Rpb24odCl7cmV0dXJue2E6bChuLGZ1bmN0aW9uKG4pe3JldHVybiBuKHQpfSksYjorK2UsYzp0fX0pLGoodCxmdW5jdGlvbih0LG4pe3ZhciBlO3Q6e2U9LTE7Zm9yKHZhciB1PXQuYSxvPW4uYSxpPXUubGVuZ3RoLGY9ci5sZW5ndGg7KytlPGk7KXtcbnZhciBjPWZyKHVbZV0sb1tlXSk7aWYoYyl7ZT1lPj1mP2M6YyooXCJkZXNjXCI9PXJbZV0/LTE6MSk7YnJlYWsgdH19ZT10LmItbi5ifXJldHVybiBlfSl9ZnVuY3Rpb24gQ24odCxuKXtyZXR1cm4gdD1PYmplY3QodCksaChuLGZ1bmN0aW9uKG4scil7cmV0dXJuIHIgaW4gdCYmKG5bcl09dFtyXSksbn0se30pfWZ1bmN0aW9uIHpuKHQsbil7Zm9yKHZhciByPS0xLGU9Z24odCxmdSxCbyksdT1lLmxlbmd0aCxvPXt9Oysrcjx1Oyl7dmFyIGk9ZVtyXSxmPXRbaV07bihmLGkpJiYob1tpXT1mKX1yZXR1cm4gb31mdW5jdGlvbiBVbih0KXtyZXR1cm4gZnVuY3Rpb24obil7cmV0dXJuIG51bGw9PW4/VDpuW3RdfX1mdW5jdGlvbiAkbih0KXtyZXR1cm4gZnVuY3Rpb24obil7cmV0dXJuIHZuKG4sdCl9fWZ1bmN0aW9uIERuKHQsbixyLGUpe3ZhciB1PWU/eTpkLG89LTEsaT1uLmxlbmd0aCxmPXQ7Zm9yKHQ9PT1uJiYobj1scihuKSksciYmKGY9bCh0LE8ocikpKTsrK288aTspZm9yKHZhciBjPTAsYT1uW29dLGE9cj9yKGEpOmE7LTE8KGM9dShmLGEsYyxlKSk7KWYhPT10JiZWdS5jYWxsKGYsYywxKSxcblZ1LmNhbGwodCxjLDEpO3JldHVybiB0fWZ1bmN0aW9uIEZuKHQsbil7Zm9yKHZhciByPXQ/bi5sZW5ndGg6MCxlPXItMTtyLS07KXt2YXIgdT1uW3JdO2lmKHI9PWV8fHUhPT1vKXt2YXIgbz11O2lmKFhyKHUpKVZ1LmNhbGwodCx1LDEpO2Vsc2UgaWYobmUodSx0KSlkZWxldGUgdFtmZSh1KV07ZWxzZXt2YXIgdT1lcih1KSxpPWllKHQsdSk7bnVsbCE9aSYmZGVsZXRlIGlbZmUodmUodSkpXX19fX1mdW5jdGlvbiBObih0LG4pe3JldHVybiB0K0d1KHJvKCkqKG4tdCsxKSl9ZnVuY3Rpb24gUG4odCxuKXt2YXIgcj1cIlwiO2lmKCF0fHwxPm58fG4+OTAwNzE5OTI1NDc0MDk5MSlyZXR1cm4gcjtkbyBuJTImJihyKz10KSwobj1HdShuLzIpKSYmKHQrPXQpO3doaWxlKG4pO3JldHVybiByfWZ1bmN0aW9uIFpuKHQsbixyLGUpe249bmUobix0KT9bbl06ZXIobik7Zm9yKHZhciB1PS0xLG89bi5sZW5ndGgsaT1vLTEsZj10O251bGwhPWYmJisrdTxvOyl7dmFyIGM9ZmUoblt1XSk7aWYoWmUoZikpe1xudmFyIGE9cjtpZih1IT1pKXt2YXIgbD1mW2NdLGE9ZT9lKGwsYyxmKTpUO2E9PT1UJiYoYT1udWxsPT1sP1hyKG5bdSsxXSk/W106e306bCl9WXQoZixjLGEpfWY9ZltjXX1yZXR1cm4gdH1mdW5jdGlvbiBUbih0LG4scil7dmFyIGU9LTEsdT10Lmxlbmd0aDtmb3IoMD5uJiYobj0tbj51PzA6dStuKSxyPXI+dT91OnIsMD5yJiYocis9dSksdT1uPnI/MDpyLW4+Pj4wLG4+Pj49MCxyPUFycmF5KHUpOysrZTx1OylyW2VdPXRbZStuXTtyZXR1cm4gcn1mdW5jdGlvbiBxbih0LG4pe3ZhciByO3JldHVybiBBbyh0LGZ1bmN0aW9uKHQsZSx1KXtyZXR1cm4gcj1uKHQsZSx1KSwhcn0pLCEhcn1mdW5jdGlvbiBWbih0LG4scil7dmFyIGU9MCx1PXQ/dC5sZW5ndGg6ZTtpZih0eXBlb2Ygbj09XCJudW1iZXJcIiYmbj09PW4mJjIxNDc0ODM2NDc+PXUpe2Zvcig7dT5lOyl7dmFyIG89ZSt1Pj4+MSxpPXRbb107bnVsbCE9PWkmJiFKZShpKSYmKHI/bj49aTpuPmkpP2U9bysxOnU9b31yZXR1cm4gdX1cbnJldHVybiBLbih0LG4scHUscil9ZnVuY3Rpb24gS24odCxuLHIsZSl7bj1yKG4pO2Zvcih2YXIgdT0wLG89dD90Lmxlbmd0aDowLGk9biE9PW4sZj1udWxsPT09bixjPUplKG4pLGE9bj09PVQ7bz51Oyl7dmFyIGw9R3UoKHUrbykvMikscz1yKHRbbF0pLGg9cyE9PVQscD1udWxsPT09cyxfPXM9PT1zLHY9SmUocyk7KGk/ZXx8XzphP18mJihlfHxoKTpmP18mJmgmJihlfHwhcCk6Yz9fJiZoJiYhcCYmKGV8fCF2KTpwfHx2PzA6ZT9uPj1zOm4+cyk/dT1sKzE6bz1sfXJldHVybiB0byhvLDQyOTQ5NjcyOTQpfWZ1bmN0aW9uIEduKHQsbil7Zm9yKHZhciByPS0xLGU9dC5sZW5ndGgsdT0wLG89W107KytyPGU7KXt2YXIgaT10W3JdLGY9bj9uKGkpOmk7aWYoIXJ8fCFDZShmLGMpKXt2YXIgYz1mO29bdSsrXT0wPT09aT8wOml9fXJldHVybiBvfWZ1bmN0aW9uIEpuKHQpe3JldHVybiB0eXBlb2YgdD09XCJudW1iZXJcIj90OkplKHQpP1Y6K3R9ZnVuY3Rpb24gWW4odCl7aWYodHlwZW9mIHQ9PVwic3RyaW5nXCIpcmV0dXJuIHQ7XG5pZihKZSh0KSlyZXR1cm4gbW8/bW8uY2FsbCh0KTpcIlwiO3ZhciBuPXQrXCJcIjtyZXR1cm5cIjBcIj09biYmMS90PT0tcT9cIi0wXCI6bn1mdW5jdGlvbiBIbih0LG4scil7dmFyIGU9LTEsdT1jLG89dC5sZW5ndGgsaT10cnVlLGY9W10sbD1mO2lmKHIpaT1mYWxzZSx1PWE7ZWxzZSBpZihvPj0yMDApe2lmKHU9bj9udWxsOklvKHQpKXJldHVybiBEKHUpO2k9ZmFsc2UsdT1FLGw9bmV3IFp0fWVsc2UgbD1uP1tdOmY7dDpmb3IoOysrZTxvOyl7dmFyIHM9dFtlXSxoPW4/bihzKTpzLHM9cnx8MCE9PXM/czowO2lmKGkmJmg9PT1oKXtmb3IodmFyIHA9bC5sZW5ndGg7cC0tOylpZihsW3BdPT09aCljb250aW51ZSB0O24mJmwucHVzaChoKSxmLnB1c2gocyl9ZWxzZSB1KGwsaCxyKXx8KGwhPT1mJiZsLnB1c2goaCksZi5wdXNoKHMpKX1yZXR1cm4gZn1mdW5jdGlvbiBRbih0LG4scixlKXtmb3IodmFyIHU9dC5sZW5ndGgsbz1lP3U6LTE7KGU/by0tOisrbzx1KSYmbih0W29dLG8sdCk7KTtyZXR1cm4gcj9Ubih0LGU/MDpvLGU/bysxOnUpOlRuKHQsZT9vKzE6MCxlP3U6byk7XG59ZnVuY3Rpb24gWG4odCxuKXt2YXIgcj10O3JldHVybiByIGluc3RhbmNlb2YgVXQmJihyPXIudmFsdWUoKSksaChuLGZ1bmN0aW9uKHQsbil7cmV0dXJuIG4uZnVuYy5hcHBseShuLnRoaXNBcmcscyhbdF0sbi5hcmdzKSl9LHIpfWZ1bmN0aW9uIHRyKHQsbixyKXtmb3IodmFyIGU9LTEsdT10Lmxlbmd0aDsrK2U8dTspdmFyIG89bz9zKGZuKG8sdFtlXSxuLHIpLGZuKHRbZV0sbyxuLHIpKTp0W2VdO3JldHVybiBvJiZvLmxlbmd0aD9IbihvLG4scik6W119ZnVuY3Rpb24gbnIodCxuLHIpe2Zvcih2YXIgZT0tMSx1PXQubGVuZ3RoLG89bi5sZW5ndGgsaT17fTsrK2U8dTspcihpLHRbZV0sbz5lP25bZV06VCk7cmV0dXJuIGl9ZnVuY3Rpb24gcnIodCl7cmV0dXJuICRlKHQpP3Q6W119ZnVuY3Rpb24gZXIodCl7cmV0dXJuIHlpKHQpP3Q6Q28odCl9ZnVuY3Rpb24gdXIodCxuLHIpe3ZhciBlPXQubGVuZ3RoO3JldHVybiByPXI9PT1UP2U6ciwhbiYmcj49ZT90OlRuKHQsbixyKX1mdW5jdGlvbiBvcih0LG4pe1xuaWYobilyZXR1cm4gdC5zbGljZSgpO3ZhciByPW5ldyB0LmNvbnN0cnVjdG9yKHQubGVuZ3RoKTtyZXR1cm4gdC5jb3B5KHIpLHJ9ZnVuY3Rpb24gaXIodCl7dmFyIG49bmV3IHQuY29uc3RydWN0b3IodC5ieXRlTGVuZ3RoKTtyZXR1cm4gbmV3IEZ1KG4pLnNldChuZXcgRnUodCkpLG59ZnVuY3Rpb24gZnIodCxuKXtpZih0IT09bil7dmFyIHI9dCE9PVQsZT1udWxsPT09dCx1PXQ9PT10LG89SmUodCksaT1uIT09VCxmPW51bGw9PT1uLGM9bj09PW4sYT1KZShuKTtpZighZiYmIWEmJiFvJiZ0Pm58fG8mJmkmJmMmJiFmJiYhYXx8ZSYmaSYmY3x8IXImJmN8fCF1KXJldHVybiAxO2lmKCFlJiYhbyYmIWEmJm4+dHx8YSYmciYmdSYmIWUmJiFvfHxmJiZyJiZ1fHwhaSYmdXx8IWMpcmV0dXJuLTF9cmV0dXJuIDB9ZnVuY3Rpb24gY3IodCxuLHIsZSl7dmFyIHU9LTEsbz10Lmxlbmd0aCxpPXIubGVuZ3RoLGY9LTEsYz1uLmxlbmd0aCxhPVh1KG8taSwwKSxsPUFycmF5KGMrYSk7Zm9yKGU9IWU7KytmPGM7KWxbZl09bltmXTtcbmZvcig7Kyt1PGk7KShlfHxvPnUpJiYobFtyW3VdXT10W3VdKTtmb3IoO2EtLTspbFtmKytdPXRbdSsrXTtyZXR1cm4gbH1mdW5jdGlvbiBhcih0LG4scixlKXt2YXIgdT0tMSxvPXQubGVuZ3RoLGk9LTEsZj1yLmxlbmd0aCxjPS0xLGE9bi5sZW5ndGgsbD1YdShvLWYsMCkscz1BcnJheShsK2EpO2ZvcihlPSFlOysrdTxsOylzW3VdPXRbdV07Zm9yKGw9dTsrK2M8YTspc1tsK2NdPW5bY107Zm9yKDsrK2k8ZjspKGV8fG8+dSkmJihzW2wrcltpXV09dFt1KytdKTtyZXR1cm4gc31mdW5jdGlvbiBscih0LG4pe3ZhciByPS0xLGU9dC5sZW5ndGg7Zm9yKG58fChuPUFycmF5KGUpKTsrK3I8ZTspbltyXT10W3JdO3JldHVybiBufWZ1bmN0aW9uIHNyKHQsbixyLGUpe3J8fChyPXt9KTtmb3IodmFyIHU9LTEsbz1uLmxlbmd0aDsrK3U8bzspe3ZhciBpPW5bdV0sZj1lP2UocltpXSx0W2ldLGkscix0KTp0W2ldO1l0KHIsaSxmKX1yZXR1cm4gcn1mdW5jdGlvbiBocih0LG4pe3JldHVybiBzcih0LFRyKHQpLG4pO1xufWZ1bmN0aW9uIHByKHQsbil7cmV0dXJuIGZ1bmN0aW9uKHIsdSl7dmFyIG89eWkocik/ZTpRdCxpPW4/bigpOnt9O3JldHVybiBvKHIsdCxGcih1KSxpKX19ZnVuY3Rpb24gX3IodCl7cmV0dXJuIE1lKGZ1bmN0aW9uKG4scil7dmFyIGU9LTEsdT1yLmxlbmd0aCxvPXU+MT9yW3UtMV06VCxpPXU+Mj9yWzJdOlQsbz10Lmxlbmd0aD4zJiZ0eXBlb2Ygbz09XCJmdW5jdGlvblwiPyh1LS0sbyk6VDtmb3IoaSYmdGUoclswXSxyWzFdLGkpJiYobz0zPnU/VDpvLHU9MSksbj1PYmplY3Qobik7KytlPHU7KShpPXJbZV0pJiZ0KG4saSxlLG8pO3JldHVybiBufSl9ZnVuY3Rpb24gdnIodCxuKXtyZXR1cm4gZnVuY3Rpb24ocixlKXtpZihudWxsPT1yKXJldHVybiByO2lmKCFVZShyKSlyZXR1cm4gdChyLGUpO2Zvcih2YXIgdT1yLmxlbmd0aCxvPW4/dTotMSxpPU9iamVjdChyKTsobj9vLS06KytvPHUpJiZmYWxzZSE9PWUoaVtvXSxvLGkpOyk7cmV0dXJuIHJ9fWZ1bmN0aW9uIGdyKHQpe3JldHVybiBmdW5jdGlvbihuLHIsZSl7XG52YXIgdT0tMSxvPU9iamVjdChuKTtlPWUobik7Zm9yKHZhciBpPWUubGVuZ3RoO2ktLTspe3ZhciBmPWVbdD9pOisrdV07aWYoZmFsc2U9PT1yKG9bZl0sZixvKSlicmVha31yZXR1cm4gbn19ZnVuY3Rpb24gZHIodCxuLHIpe2Z1bmN0aW9uIGUoKXtyZXR1cm4odGhpcyYmdGhpcyE9PUt0JiZ0aGlzIGluc3RhbmNlb2YgZT9vOnQpLmFwcGx5KHU/cjp0aGlzLGFyZ3VtZW50cyl9dmFyIHU9MSZuLG89eHIodCk7cmV0dXJuIGV9ZnVuY3Rpb24geXIodCl7cmV0dXJuIGZ1bmN0aW9uKG4pe249ZXUobik7dmFyIHI9V3QudGVzdChuKT9uLm1hdGNoKEl0KTpULGU9cj9yWzBdOm4uY2hhckF0KDApO3JldHVybiBuPXI/dXIociwxKS5qb2luKFwiXCIpOm4uc2xpY2UoMSksZVt0XSgpK259fWZ1bmN0aW9uIGJyKHQpe3JldHVybiBmdW5jdGlvbihuKXtyZXR1cm4gaChzdShsdShuKS5yZXBsYWNlKEV0LFwiXCIpKSx0LFwiXCIpfX1mdW5jdGlvbiB4cih0KXtyZXR1cm4gZnVuY3Rpb24oKXt2YXIgbj1hcmd1bWVudHM7XG5zd2l0Y2gobi5sZW5ndGgpe2Nhc2UgMDpyZXR1cm4gbmV3IHQ7Y2FzZSAxOnJldHVybiBuZXcgdChuWzBdKTtjYXNlIDI6cmV0dXJuIG5ldyB0KG5bMF0sblsxXSk7Y2FzZSAzOnJldHVybiBuZXcgdChuWzBdLG5bMV0sblsyXSk7Y2FzZSA0OnJldHVybiBuZXcgdChuWzBdLG5bMV0sblsyXSxuWzNdKTtjYXNlIDU6cmV0dXJuIG5ldyB0KG5bMF0sblsxXSxuWzJdLG5bM10sbls0XSk7Y2FzZSA2OnJldHVybiBuZXcgdChuWzBdLG5bMV0sblsyXSxuWzNdLG5bNF0sbls1XSk7Y2FzZSA3OnJldHVybiBuZXcgdChuWzBdLG5bMV0sblsyXSxuWzNdLG5bNF0sbls1XSxuWzZdKX12YXIgcj11bih0LnByb3RvdHlwZSksbj10LmFwcGx5KHIsbik7cmV0dXJuIFplKG4pP246cn19ZnVuY3Rpb24ganIodCxuLGUpe2Z1bmN0aW9uIHUoKXtmb3IodmFyIGk9YXJndW1lbnRzLmxlbmd0aCxmPUFycmF5KGkpLGM9aSxhPURyKHUpO2MtLTspZltjXT1hcmd1bWVudHNbY107cmV0dXJuIGM9Mz5pJiZmWzBdIT09YSYmZltpLTFdIT09YT9bXTokKGYsYSksXG5pLT1jLmxlbmd0aCxlPmk/QnIodCxuLEFyLHUucGxhY2Vob2xkZXIsVCxmLGMsVCxULGUtaSk6cih0aGlzJiZ0aGlzIT09S3QmJnRoaXMgaW5zdGFuY2VvZiB1P286dCx0aGlzLGYpfXZhciBvPXhyKHQpO3JldHVybiB1fWZ1bmN0aW9uIHdyKHQpe3JldHVybiBmdW5jdGlvbihuLHIsZSl7dmFyIHU9T2JqZWN0KG4pO2lmKHI9RnIociwzKSwhVWUobikpdmFyIG89aXUobik7cmV0dXJuIGU9dChvfHxuLGZ1bmN0aW9uKHQsbil7cmV0dXJuIG8mJihuPXQsdD11W25dKSxyKHQsbix1KX0sZSksZT4tMT9uW28/b1tlXTplXTpUfX1mdW5jdGlvbiBtcih0KXtyZXR1cm4gTWUoZnVuY3Rpb24obil7bj1zbihuLDEpO3ZhciByPW4ubGVuZ3RoLGU9cix1PXp0LnByb3RvdHlwZS50aHJ1O2Zvcih0JiZuLnJldmVyc2UoKTtlLS07KXt2YXIgbz1uW2VdO2lmKHR5cGVvZiBvIT1cImZ1bmN0aW9uXCIpdGhyb3cgbmV3IEF1KFwiRXhwZWN0ZWQgYSBmdW5jdGlvblwiKTtpZih1JiYhaSYmXCJ3cmFwcGVyXCI9PSRyKG8pKXZhciBpPW5ldyB6dChbXSx0cnVlKTtcbn1mb3IoZT1pP2U6cjsrK2U8cjspdmFyIG89bltlXSx1PSRyKG8pLGY9XCJ3cmFwcGVyXCI9PXU/Um8obyk6VCxpPWYmJnJlKGZbMF0pJiY0MjQ9PWZbMV0mJiFmWzRdLmxlbmd0aCYmMT09Zls5XT9pWyRyKGZbMF0pXS5hcHBseShpLGZbM10pOjE9PW8ubGVuZ3RoJiZyZShvKT9pW3VdKCk6aS50aHJ1KG8pO3JldHVybiBmdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cyxlPXRbMF07aWYoaSYmMT09dC5sZW5ndGgmJnlpKGUpJiZlLmxlbmd0aD49MjAwKXJldHVybiBpLnBsYW50KGUpLnZhbHVlKCk7Zm9yKHZhciB1PTAsdD1yP25bdV0uYXBwbHkodGhpcyx0KTplOysrdTxyOyl0PW5bdV0uY2FsbCh0aGlzLHQpO3JldHVybiB0fX0pfWZ1bmN0aW9uIEFyKHQsbixyLGUsdSxvLGksZixjLGEpe2Z1bmN0aW9uIGwoKXtmb3IodmFyIGQ9YXJndW1lbnRzLmxlbmd0aCx5PUFycmF5KGQpLGI9ZDtiLS07KXlbYl09YXJndW1lbnRzW2JdO2lmKF8pe3ZhciB4LGo9RHIobCksYj15Lmxlbmd0aDtmb3IoeD0wO2ItLTspeVtiXT09PWomJngrKztcbn1pZihlJiYoeT1jcih5LGUsdSxfKSksbyYmKHk9YXIoeSxvLGksXykpLGQtPXgsXyYmYT5kKXJldHVybiBqPSQoeSxqKSxCcih0LG4sQXIsbC5wbGFjZWhvbGRlcixyLHksaixmLGMsYS1kKTtpZihqPWg/cjp0aGlzLGI9cD9qW3RdOnQsZD15Lmxlbmd0aCxmKXt4PXkubGVuZ3RoO2Zvcih2YXIgdz10byhmLmxlbmd0aCx4KSxtPWxyKHkpO3ctLTspe3ZhciBBPWZbd107eVt3XT1YcihBLHgpP21bQV06VH19ZWxzZSB2JiZkPjEmJnkucmV2ZXJzZSgpO3JldHVybiBzJiZkPmMmJih5Lmxlbmd0aD1jKSx0aGlzJiZ0aGlzIT09S3QmJnRoaXMgaW5zdGFuY2VvZiBsJiYoYj1nfHx4cihiKSksYi5hcHBseShqLHkpfXZhciBzPTEyOCZuLGg9MSZuLHA9MiZuLF89MjQmbix2PTUxMiZuLGc9cD9UOnhyKHQpO3JldHVybiBsfWZ1bmN0aW9uIE9yKHQsbil7cmV0dXJuIGZ1bmN0aW9uKHIsZSl7cmV0dXJuIGpuKHIsdCxuKGUpKX19ZnVuY3Rpb24ga3IodCl7cmV0dXJuIGZ1bmN0aW9uKG4scil7dmFyIGU7XG5pZihuPT09VCYmcj09PVQpcmV0dXJuIDA7aWYobiE9PVQmJihlPW4pLHIhPT1UKXtpZihlPT09VClyZXR1cm4gcjt0eXBlb2Ygbj09XCJzdHJpbmdcInx8dHlwZW9mIHI9PVwic3RyaW5nXCI/KG49WW4obikscj1ZbihyKSk6KG49Sm4obikscj1KbihyKSksZT10KG4scil9cmV0dXJuIGV9fWZ1bmN0aW9uIEVyKHQpe3JldHVybiBNZShmdW5jdGlvbihuKXtyZXR1cm4gbj0xPT1uLmxlbmd0aCYmeWkoblswXSk/bChuWzBdLE8oRnIoKSkpOmwoc24obiwxLFFyKSxPKEZyKCkpKSxNZShmdW5jdGlvbihlKXt2YXIgdT10aGlzO3JldHVybiB0KG4sZnVuY3Rpb24odCl7cmV0dXJuIHIodCx1LGUpfSl9KX0pfWZ1bmN0aW9uIFNyKHQsbil7bj1uPT09VD9cIiBcIjpZbihuKTt2YXIgcj1uLmxlbmd0aDtyZXR1cm4gMj5yP3I/UG4obix0KTpuOihyPVBuKG4sS3UodC9OKG4pKSksV3QudGVzdChuKT91cihyLm1hdGNoKEl0KSwwLHQpLmpvaW4oXCJcIik6ci5zbGljZSgwLHQpKX1mdW5jdGlvbiBJcih0LG4sZSx1KXtcbmZ1bmN0aW9uIG8oKXtmb3IodmFyIG49LTEsYz1hcmd1bWVudHMubGVuZ3RoLGE9LTEsbD11Lmxlbmd0aCxzPUFycmF5KGwrYyksaD10aGlzJiZ0aGlzIT09S3QmJnRoaXMgaW5zdGFuY2VvZiBvP2Y6dDsrK2E8bDspc1thXT11W2FdO2Zvcig7Yy0tOylzW2ErK109YXJndW1lbnRzWysrbl07cmV0dXJuIHIoaCxpP2U6dGhpcyxzKX12YXIgaT0xJm4sZj14cih0KTtyZXR1cm4gb31mdW5jdGlvbiBScih0KXtyZXR1cm4gZnVuY3Rpb24obixyLGUpe2UmJnR5cGVvZiBlIT1cIm51bWJlclwiJiZ0ZShuLHIsZSkmJihyPWU9VCksbj1udShuKSxuPW49PT1uP246MCxyPT09VD8ocj1uLG49MCk6cj1udShyKXx8MCxlPWU9PT1UP3I+bj8xOi0xOm51KGUpfHwwO3ZhciB1PS0xO3I9WHUoS3UoKHItbikvKGV8fDEpKSwwKTtmb3IodmFyIG89QXJyYXkocik7ci0tOylvW3Q/cjorK3VdPW4sbis9ZTtyZXR1cm4gb319ZnVuY3Rpb24gV3IodCl7cmV0dXJuIGZ1bmN0aW9uKG4scil7cmV0dXJuIHR5cGVvZiBuPT1cInN0cmluZ1wiJiZ0eXBlb2Ygcj09XCJzdHJpbmdcInx8KG49bnUobiksXG5yPW51KHIpKSx0KG4scil9fWZ1bmN0aW9uIEJyKHQsbixyLGUsdSxvLGksZixjLGEpe3ZhciBsPTgmbixzPWw/aTpUO2k9bD9UOmk7dmFyIGg9bD9vOlQ7cmV0dXJuIG89bD9UOm8sbj0obnwobD8zMjo2NCkpJn4obD82NDozMiksNCZufHwobiY9LTQpLG49W3Qsbix1LGgscyxvLGksZixjLGFdLHI9ci5hcHBseShULG4pLHJlKHQpJiZNbyhyLG4pLHIucGxhY2Vob2xkZXI9ZSxyfWZ1bmN0aW9uIExyKHQpe3ZhciBuPXd1W3RdO3JldHVybiBmdW5jdGlvbih0LHIpe2lmKHQ9bnUodCkscj10byhYZShyKSwyOTIpKXt2YXIgZT0oZXUodCkrXCJlXCIpLnNwbGl0KFwiZVwiKSxlPW4oZVswXStcImVcIisoK2VbMV0rcikpLGU9KGV1KGUpK1wiZVwiKS5zcGxpdChcImVcIik7cmV0dXJuKyhlWzBdK1wiZVwiKygrZVsxXS1yKSl9cmV0dXJuIG4odCl9fWZ1bmN0aW9uIE1yKHQpe3JldHVybiBmdW5jdGlvbihuKXt2YXIgcj1xcihuKTtyZXR1cm5cIltvYmplY3QgTWFwXVwiPT1yP1Uobik6XCJbb2JqZWN0IFNldF1cIj09cj9GKG4pOkEobix0KG4pKTtcbn19ZnVuY3Rpb24gQ3IodCxuLHIsZSx1LG8saSxmKXt2YXIgYz0yJm47aWYoIWMmJnR5cGVvZiB0IT1cImZ1bmN0aW9uXCIpdGhyb3cgbmV3IEF1KFwiRXhwZWN0ZWQgYSBmdW5jdGlvblwiKTt2YXIgYT1lP2UubGVuZ3RoOjA7aWYoYXx8KG4mPS05NyxlPXU9VCksaT1pPT09VD9pOlh1KFhlKGkpLDApLGY9Zj09PVQ/ZjpYZShmKSxhLT11P3UubGVuZ3RoOjAsNjQmbil7dmFyIGw9ZSxzPXU7ZT11PVR9dmFyIGg9Yz9UOlJvKHQpO3JldHVybiBvPVt0LG4scixlLHUsbCxzLG8saSxmXSxoJiYocj1vWzFdLHQ9aFsxXSxuPXJ8dCxlPTEyOD09dCYmOD09cnx8MTI4PT10JiYyNTY9PXImJmhbOF0+PW9bN10ubGVuZ3RofHwzODQ9PXQmJmhbOF0+PWhbN10ubGVuZ3RoJiY4PT1yLDEzMT5ufHxlKSYmKDEmdCYmKG9bMl09aFsyXSxufD0xJnI/MDo0KSwocj1oWzNdKSYmKGU9b1szXSxvWzNdPWU/Y3IoZSxyLGhbNF0pOnIsb1s0XT1lPyQob1szXSxcIl9fbG9kYXNoX3BsYWNlaG9sZGVyX19cIik6aFs0XSksXG4ocj1oWzVdKSYmKGU9b1s1XSxvWzVdPWU/YXIoZSxyLGhbNl0pOnIsb1s2XT1lPyQob1s1XSxcIl9fbG9kYXNoX3BsYWNlaG9sZGVyX19cIik6aFs2XSksKHI9aFs3XSkmJihvWzddPXIpLDEyOCZ0JiYob1s4XT1udWxsPT1vWzhdP2hbOF06dG8ob1s4XSxoWzhdKSksbnVsbD09b1s5XSYmKG9bOV09aFs5XSksb1swXT1oWzBdLG9bMV09biksdD1vWzBdLG49b1sxXSxyPW9bMl0sZT1vWzNdLHU9b1s0XSxmPW9bOV09bnVsbD09b1s5XT9jPzA6dC5sZW5ndGg6WHUob1s5XS1hLDApLCFmJiYyNCZuJiYobiY9LTI1KSwoaD9TbzpNbykobiYmMSE9bj84PT1ufHwxNj09bj9qcih0LG4sZik6MzIhPW4mJjMzIT1ufHx1Lmxlbmd0aD9Bci5hcHBseShULG8pOklyKHQsbixyLGUpOmRyKHQsbixyKSxvKX1mdW5jdGlvbiB6cih0LG4scixlLHUsbyl7dmFyIGk9MiZ1LGY9dC5sZW5ndGgsYz1uLmxlbmd0aDtpZihmIT1jJiYhKGkmJmM+ZikpcmV0dXJuIGZhbHNlO2lmKGM9by5nZXQodCkpcmV0dXJuIGM9PW47XG52YXIgYz0tMSxhPXRydWUsbD0xJnU/bmV3IFp0OlQ7Zm9yKG8uc2V0KHQsbik7KytjPGY7KXt2YXIgcz10W2NdLGg9bltjXTtpZihlKXZhciBwPWk/ZShoLHMsYyxuLHQsbyk6ZShzLGgsYyx0LG4sbyk7aWYocCE9PVQpe2lmKHApY29udGludWU7YT1mYWxzZTticmVha31pZihsKXtpZighXyhuLGZ1bmN0aW9uKHQsbil7cmV0dXJuIGwuaGFzKG4pfHxzIT09dCYmIXIocyx0LGUsdSxvKT92b2lkIDA6bC5hZGQobil9KSl7YT1mYWxzZTticmVha319ZWxzZSBpZihzIT09aCYmIXIocyxoLGUsdSxvKSl7YT1mYWxzZTticmVha319cmV0dXJuIG9bXCJkZWxldGVcIl0odCksYX1mdW5jdGlvbiBVcih0LG4scixlLHUsbyxpKXtzd2l0Y2gocil7Y2FzZVwiW29iamVjdCBEYXRhVmlld11cIjppZih0LmJ5dGVMZW5ndGghPW4uYnl0ZUxlbmd0aHx8dC5ieXRlT2Zmc2V0IT1uLmJ5dGVPZmZzZXQpYnJlYWs7dD10LmJ1ZmZlcixuPW4uYnVmZmVyO2Nhc2VcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI6aWYodC5ieXRlTGVuZ3RoIT1uLmJ5dGVMZW5ndGh8fCFlKG5ldyBGdSh0KSxuZXcgRnUobikpKWJyZWFrO1xucmV0dXJuIHRydWU7Y2FzZVwiW29iamVjdCBCb29sZWFuXVwiOmNhc2VcIltvYmplY3QgRGF0ZV1cIjpyZXR1cm4rdD09K247Y2FzZVwiW29iamVjdCBFcnJvcl1cIjpyZXR1cm4gdC5uYW1lPT1uLm5hbWUmJnQubWVzc2FnZT09bi5tZXNzYWdlO2Nhc2VcIltvYmplY3QgTnVtYmVyXVwiOnJldHVybiB0IT0rdD9uIT0rbjp0PT0rbjtjYXNlXCJbb2JqZWN0IFJlZ0V4cF1cIjpjYXNlXCJbb2JqZWN0IFN0cmluZ11cIjpyZXR1cm4gdD09bitcIlwiO2Nhc2VcIltvYmplY3QgTWFwXVwiOnZhciBmPVU7Y2FzZVwiW29iamVjdCBTZXRdXCI6aWYoZnx8KGY9RCksdC5zaXplIT1uLnNpemUmJiEoMiZvKSlicmVhaztyZXR1cm4ocj1pLmdldCh0KSk/cj09bjoob3w9MSxpLnNldCh0LG4pLHpyKGYodCksZihuKSxlLHUsbyxpKSk7Y2FzZVwiW29iamVjdCBTeW1ib2xdXCI6aWYod28pcmV0dXJuIHdvLmNhbGwodCk9PXdvLmNhbGwobil9cmV0dXJuIGZhbHNlfWZ1bmN0aW9uICRyKHQpe2Zvcih2YXIgbj10Lm5hbWUrXCJcIixyPV9vW25dLGU9V3UuY2FsbChfbyxuKT9yLmxlbmd0aDowO2UtLTspe1xudmFyIHU9cltlXSxvPXUuZnVuYztpZihudWxsPT1vfHxvPT10KXJldHVybiB1Lm5hbWV9cmV0dXJuIG59ZnVuY3Rpb24gRHIodCl7cmV0dXJuKFd1LmNhbGwoT3QsXCJwbGFjZWhvbGRlclwiKT9PdDp0KS5wbGFjZWhvbGRlcn1mdW5jdGlvbiBGcigpe3ZhciB0PU90Lml0ZXJhdGVlfHxfdSx0PXQ9PT1fdT9rbjp0O3JldHVybiBhcmd1bWVudHMubGVuZ3RoP3QoYXJndW1lbnRzWzBdLGFyZ3VtZW50c1sxXSk6dH1mdW5jdGlvbiBOcih0LG4pe3ZhciByPXQuX19kYXRhX18sZT10eXBlb2YgbjtyZXR1cm4oXCJzdHJpbmdcIj09ZXx8XCJudW1iZXJcIj09ZXx8XCJzeW1ib2xcIj09ZXx8XCJib29sZWFuXCI9PWU/XCJfX3Byb3RvX19cIiE9PW46bnVsbD09PW4pP3JbdHlwZW9mIG49PVwic3RyaW5nXCI/XCJzdHJpbmdcIjpcImhhc2hcIl06ci5tYXB9ZnVuY3Rpb24gUHIodCl7Zm9yKHZhciBuPWl1KHQpLHI9bi5sZW5ndGg7ci0tOyl7dmFyIGU9bltyXSx1PXRbZV07bltyXT1bZSx1LHU9PT11JiYhWmUodSldfXJldHVybiBuO1xufWZ1bmN0aW9uIFpyKHQsbil7dmFyIHI9bnVsbD09dD9UOnRbbl07cmV0dXJuIE9uKHIpP3I6VH1mdW5jdGlvbiBUcih0KXtyZXR1cm4gUHUoT2JqZWN0KHQpKX1mdW5jdGlvbiBxcih0KXtyZXR1cm4gTXUuY2FsbCh0KX1mdW5jdGlvbiBWcih0LG4scil7bj1uZShuLHQpP1tuXTplcihuKTtmb3IodmFyIGUsdT0tMSxvPW4ubGVuZ3RoOysrdTxvOyl7dmFyIGk9ZmUoblt1XSk7aWYoIShlPW51bGwhPXQmJnIodCxpKSkpYnJlYWs7dD10W2ldfXJldHVybiBlP2U6KG89dD90Lmxlbmd0aDowLCEhbyYmUGUobykmJlhyKGksbykmJih5aSh0KXx8R2UodCl8fHplKHQpKSl9ZnVuY3Rpb24gS3IodCl7dmFyIG49dC5sZW5ndGgscj10LmNvbnN0cnVjdG9yKG4pO3JldHVybiBuJiZcInN0cmluZ1wiPT10eXBlb2YgdFswXSYmV3UuY2FsbCh0LFwiaW5kZXhcIikmJihyLmluZGV4PXQuaW5kZXgsci5pbnB1dD10LmlucHV0KSxyfWZ1bmN0aW9uIEdyKHQpe3JldHVybiB0eXBlb2YgdC5jb25zdHJ1Y3RvciE9XCJmdW5jdGlvblwifHxlZSh0KT97fTp1bihKdShPYmplY3QodCkpKTtcbn1mdW5jdGlvbiBKcihyLGUsdSxvKXt2YXIgaT1yLmNvbnN0cnVjdG9yO3N3aXRjaChlKXtjYXNlXCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiOnJldHVybiBpcihyKTtjYXNlXCJbb2JqZWN0IEJvb2xlYW5dXCI6Y2FzZVwiW29iamVjdCBEYXRlXVwiOnJldHVybiBuZXcgaSgrcik7Y2FzZVwiW29iamVjdCBEYXRhVmlld11cIjpyZXR1cm4gZT1vP2lyKHIuYnVmZmVyKTpyLmJ1ZmZlcixuZXcgci5jb25zdHJ1Y3RvcihlLHIuYnl0ZU9mZnNldCxyLmJ5dGVMZW5ndGgpO2Nhc2VcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiOmNhc2VcIltvYmplY3QgRmxvYXQ2NEFycmF5XVwiOmNhc2VcIltvYmplY3QgSW50OEFycmF5XVwiOmNhc2VcIltvYmplY3QgSW50MTZBcnJheV1cIjpjYXNlXCJbb2JqZWN0IEludDMyQXJyYXldXCI6Y2FzZVwiW29iamVjdCBVaW50OEFycmF5XVwiOmNhc2VcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCI6Y2FzZVwiW29iamVjdCBVaW50MTZBcnJheV1cIjpjYXNlXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiOlxucmV0dXJuIGU9bz9pcihyLmJ1ZmZlcik6ci5idWZmZXIsbmV3IHIuY29uc3RydWN0b3IoZSxyLmJ5dGVPZmZzZXQsci5sZW5ndGgpO2Nhc2VcIltvYmplY3QgTWFwXVwiOnJldHVybiBlPW8/dShVKHIpLHRydWUpOlUociksaChlLHQsbmV3IHIuY29uc3RydWN0b3IpO2Nhc2VcIltvYmplY3QgTnVtYmVyXVwiOmNhc2VcIltvYmplY3QgU3RyaW5nXVwiOnJldHVybiBuZXcgaShyKTtjYXNlXCJbb2JqZWN0IFJlZ0V4cF1cIjpyZXR1cm4gZT1uZXcgci5jb25zdHJ1Y3RvcihyLnNvdXJjZSxfdC5leGVjKHIpKSxlLmxhc3RJbmRleD1yLmxhc3RJbmRleCxlO2Nhc2VcIltvYmplY3QgU2V0XVwiOnJldHVybiBlPW8/dShEKHIpLHRydWUpOkQociksaChlLG4sbmV3IHIuY29uc3RydWN0b3IpO2Nhc2VcIltvYmplY3QgU3ltYm9sXVwiOnJldHVybiB3bz9PYmplY3Qod28uY2FsbChyKSk6e319fWZ1bmN0aW9uIFlyKHQpe3ZhciBuPXQ/dC5sZW5ndGg6VDtyZXR1cm4gUGUobikmJih5aSh0KXx8R2UodCl8fHplKHQpKT9tKG4sU3RyaW5nKTpudWxsO1xufWZ1bmN0aW9uIEhyKHQpe3JldHVybiB5aSh0KXx8emUodCl9ZnVuY3Rpb24gUXIodCl7cmV0dXJuIHlpKHQpJiYhKDI9PXQubGVuZ3RoJiYhRmUodFswXSkpfWZ1bmN0aW9uIFhyKHQsbil7cmV0dXJuIG49bnVsbD09bj85MDA3MTk5MjU0NzQwOTkxOm4sISFuJiYodHlwZW9mIHQ9PVwibnVtYmVyXCJ8fHh0LnRlc3QodCkpJiZ0Pi0xJiYwPT10JTEmJm4+dH1mdW5jdGlvbiB0ZSh0LG4scil7aWYoIVplKHIpKXJldHVybiBmYWxzZTt2YXIgZT10eXBlb2YgbjtyZXR1cm4oXCJudW1iZXJcIj09ZT9VZShyKSYmWHIobixyLmxlbmd0aCk6XCJzdHJpbmdcIj09ZSYmbiBpbiByKT9DZShyW25dLHQpOmZhbHNlfWZ1bmN0aW9uIG5lKHQsbil7aWYoeWkodCkpcmV0dXJuIGZhbHNlO3ZhciByPXR5cGVvZiB0O3JldHVyblwibnVtYmVyXCI9PXJ8fFwic3ltYm9sXCI9PXJ8fFwiYm9vbGVhblwiPT1yfHxudWxsPT10fHxKZSh0KT90cnVlOnV0LnRlc3QodCl8fCFldC50ZXN0KHQpfHxudWxsIT1uJiZ0IGluIE9iamVjdChuKX1mdW5jdGlvbiByZSh0KXtcbnZhciBuPSRyKHQpLHI9T3Rbbl07cmV0dXJuIHR5cGVvZiByPT1cImZ1bmN0aW9uXCImJm4gaW4gVXQucHJvdG90eXBlP3Q9PT1yP3RydWU6KG49Um8ociksISFuJiZ0PT09blswXSk6ZmFsc2V9ZnVuY3Rpb24gZWUodCl7dmFyIG49dCYmdC5jb25zdHJ1Y3RvcjtyZXR1cm4gdD09PSh0eXBlb2Ygbj09XCJmdW5jdGlvblwiJiZuLnByb3RvdHlwZXx8a3UpfWZ1bmN0aW9uIHVlKHQsbil7cmV0dXJuIGZ1bmN0aW9uKHIpe3JldHVybiBudWxsPT1yP2ZhbHNlOnJbdF09PT1uJiYobiE9PVR8fHQgaW4gT2JqZWN0KHIpKX19ZnVuY3Rpb24gb2UodCxuLHIsZSx1LG8pe3JldHVybiBaZSh0KSYmWmUobikmJkJuKHQsbixULG9lLG8uc2V0KG4sdCkpLHR9ZnVuY3Rpb24gaWUodCxuKXtyZXR1cm4gMT09bi5sZW5ndGg/dDp2bih0LFRuKG4sMCwtMSkpfWZ1bmN0aW9uIGZlKHQpe2lmKHR5cGVvZiB0PT1cInN0cmluZ1wifHxKZSh0KSlyZXR1cm4gdDt2YXIgbj10K1wiXCI7cmV0dXJuXCIwXCI9PW4mJjEvdD09LXE/XCItMFwiOm59ZnVuY3Rpb24gY2UodCl7XG5pZihudWxsIT10KXt0cnl7cmV0dXJuIFJ1LmNhbGwodCl9Y2F0Y2gobil7fXJldHVybiB0K1wiXCJ9cmV0dXJuXCJcIn1mdW5jdGlvbiBhZSh0KXtpZih0IGluc3RhbmNlb2YgVXQpcmV0dXJuIHQuY2xvbmUoKTt2YXIgbj1uZXcgenQodC5fX3dyYXBwZWRfXyx0Ll9fY2hhaW5fXyk7cmV0dXJuIG4uX19hY3Rpb25zX189bHIodC5fX2FjdGlvbnNfXyksbi5fX2luZGV4X189dC5fX2luZGV4X18sbi5fX3ZhbHVlc19fPXQuX192YWx1ZXNfXyxufWZ1bmN0aW9uIGxlKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7cmV0dXJuIGU/KG49cnx8bj09PVQ/MTpYZShuKSxUbih0LDA+bj8wOm4sZSkpOltdfWZ1bmN0aW9uIHNlKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7cmV0dXJuIGU/KG49cnx8bj09PVQ/MTpYZShuKSxuPWUtbixUbih0LDAsMD5uPzA6bikpOltdfWZ1bmN0aW9uIGhlKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7cmV0dXJuIGU/KHI9bnVsbD09cj8wOlhlKHIpLDA+ciYmKHI9WHUoZStyLDApKSxcbmcodCxGcihuLDMpLHIpKTotMX1mdW5jdGlvbiBwZSh0LG4scil7dmFyIGU9dD90Lmxlbmd0aDowO2lmKCFlKXJldHVybi0xO3ZhciB1PWUtMTtyZXR1cm4gciE9PVQmJih1PVhlKHIpLHU9MD5yP1h1KGUrdSwwKTp0byh1LGUtMSkpLGcodCxGcihuLDMpLHUsdHJ1ZSl9ZnVuY3Rpb24gX2UodCl7cmV0dXJuIHQmJnQubGVuZ3RoP3RbMF06VH1mdW5jdGlvbiB2ZSh0KXt2YXIgbj10P3QubGVuZ3RoOjA7cmV0dXJuIG4/dFtuLTFdOlR9ZnVuY3Rpb24gZ2UodCxuKXtyZXR1cm4gdCYmdC5sZW5ndGgmJm4mJm4ubGVuZ3RoP0RuKHQsbik6dH1mdW5jdGlvbiBkZSh0KXtyZXR1cm4gdD91by5jYWxsKHQpOnR9ZnVuY3Rpb24geWUodCl7aWYoIXR8fCF0Lmxlbmd0aClyZXR1cm5bXTt2YXIgbj0wO3JldHVybiB0PWYodCxmdW5jdGlvbih0KXtyZXR1cm4gJGUodCk/KG49WHUodC5sZW5ndGgsbiksdHJ1ZSk6dm9pZCAwfSksbShuLGZ1bmN0aW9uKG4pe3JldHVybiBsKHQsVW4obikpfSl9ZnVuY3Rpb24gYmUodCxuKXtcbmlmKCF0fHwhdC5sZW5ndGgpcmV0dXJuW107dmFyIGU9eWUodCk7cmV0dXJuIG51bGw9PW4/ZTpsKGUsZnVuY3Rpb24odCl7cmV0dXJuIHIobixULHQpfSl9ZnVuY3Rpb24geGUodCl7cmV0dXJuIHQ9T3QodCksdC5fX2NoYWluX189dHJ1ZSx0fWZ1bmN0aW9uIGplKHQsbil7cmV0dXJuIG4odCl9ZnVuY3Rpb24gd2UoKXtyZXR1cm4gdGhpc31mdW5jdGlvbiBtZSh0LG4pe3JldHVybih5aSh0KT91OkFvKSh0LEZyKG4sMykpfWZ1bmN0aW9uIEFlKHQsbil7cmV0dXJuKHlpKHQpP286T28pKHQsRnIobiwzKSl9ZnVuY3Rpb24gT2UodCxuKXtyZXR1cm4oeWkodCk/bDpJbikodCxGcihuLDMpKX1mdW5jdGlvbiBrZSh0LG4scil7dmFyIGU9LTEsdT1IZSh0KSxvPXUubGVuZ3RoLGk9by0xO2ZvcihuPShyP3RlKHQsbixyKTpuPT09VCk/MTpubihYZShuKSwwLG8pOysrZTxuOyl0PU5uKGUsaSkscj11W3RdLHVbdF09dVtlXSx1W2VdPXI7cmV0dXJuIHUubGVuZ3RoPW4sdX1mdW5jdGlvbiBFZSgpe1xucmV0dXJuIHh1Lm5vdygpfWZ1bmN0aW9uIFNlKHQsbixyKXtyZXR1cm4gbj1yP1Q6bixuPXQmJm51bGw9PW4/dC5sZW5ndGg6bixDcih0LDEyOCxULFQsVCxULG4pfWZ1bmN0aW9uIEllKHQsbil7dmFyIHI7aWYodHlwZW9mIG4hPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO3JldHVybiB0PVhlKHQpLGZ1bmN0aW9uKCl7cmV0dXJuIDA8LS10JiYocj1uLmFwcGx5KHRoaXMsYXJndW1lbnRzKSksMT49dCYmKG49VCkscn19ZnVuY3Rpb24gUmUodCxuLHIpe3JldHVybiBuPXI/VDpuLHQ9Q3IodCw4LFQsVCxULFQsVCxuKSx0LnBsYWNlaG9sZGVyPVJlLnBsYWNlaG9sZGVyLHR9ZnVuY3Rpb24gV2UodCxuLHIpe3JldHVybiBuPXI/VDpuLHQ9Q3IodCwxNixULFQsVCxULFQsbiksdC5wbGFjZWhvbGRlcj1XZS5wbGFjZWhvbGRlcix0fWZ1bmN0aW9uIEJlKHQsbixyKXtmdW5jdGlvbiBlKG4pe3ZhciByPWMsZT1hO3JldHVybiBjPWE9VCxfPW4scz10LmFwcGx5KGUscik7XG59ZnVuY3Rpb24gdSh0KXt2YXIgcj10LXA7cmV0dXJuIHQtPV8scD09PVR8fHI+PW58fDA+cnx8ZyYmdD49bH1mdW5jdGlvbiBvKCl7dmFyIHQ9RWUoKTtpZih1KHQpKXJldHVybiBpKHQpO3ZhciByO3I9dC1fLHQ9bi0odC1wKSxyPWc/dG8odCxsLXIpOnQsaD1BdChvLHIpfWZ1bmN0aW9uIGkodCl7cmV0dXJuIGg9VCxkJiZjP2UodCk6KGM9YT1ULHMpfWZ1bmN0aW9uIGYoKXt2YXIgdD1FZSgpLHI9dSh0KTtpZihjPWFyZ3VtZW50cyxhPXRoaXMscD10LHIpe2lmKGg9PT1UKXJldHVybiBfPXQ9cCxoPUF0KG8sbiksdj9lKHQpOnM7aWYoZylyZXR1cm4gaD1BdChvLG4pLGUocCl9cmV0dXJuIGg9PT1UJiYoaD1BdChvLG4pKSxzfXZhciBjLGEsbCxzLGgscCxfPTAsdj1mYWxzZSxnPWZhbHNlLGQ9dHJ1ZTtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIG49bnUobil8fDAsWmUocikmJih2PSEhci5sZWFkaW5nLGw9KGc9XCJtYXhXYWl0XCJpbiByKT9YdShudShyLm1heFdhaXQpfHwwLG4pOmwsXG5kPVwidHJhaWxpbmdcImluIHI/ISFyLnRyYWlsaW5nOmQpLGYuY2FuY2VsPWZ1bmN0aW9uKCl7Xz0wLGM9cD1hPWg9VH0sZi5mbHVzaD1mdW5jdGlvbigpe3JldHVybiBoPT09VD9zOmkoRWUoKSl9LGZ9ZnVuY3Rpb24gTGUodCxuKXtmdW5jdGlvbiByKCl7dmFyIGU9YXJndW1lbnRzLHU9bj9uLmFwcGx5KHRoaXMsZSk6ZVswXSxvPXIuY2FjaGU7cmV0dXJuIG8uaGFzKHUpP28uZ2V0KHUpOihlPXQuYXBwbHkodGhpcyxlKSxyLmNhY2hlPW8uc2V0KHUsZSksZSl9aWYodHlwZW9mIHQhPVwiZnVuY3Rpb25cInx8biYmdHlwZW9mIG4hPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO3JldHVybiByLmNhY2hlPW5ldyhMZS5DYWNoZXx8UHQpLHJ9ZnVuY3Rpb24gTWUodCxuKXtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIG49WHUobj09PVQ/dC5sZW5ndGgtMTpYZShuKSwwKSxmdW5jdGlvbigpe1xuZm9yKHZhciBlPWFyZ3VtZW50cyx1PS0xLG89WHUoZS5sZW5ndGgtbiwwKSxpPUFycmF5KG8pOysrdTxvOylpW3VdPWVbbit1XTtzd2l0Y2gobil7Y2FzZSAwOnJldHVybiB0LmNhbGwodGhpcyxpKTtjYXNlIDE6cmV0dXJuIHQuY2FsbCh0aGlzLGVbMF0saSk7Y2FzZSAyOnJldHVybiB0LmNhbGwodGhpcyxlWzBdLGVbMV0saSl9Zm9yKG89QXJyYXkobisxKSx1PS0xOysrdTxuOylvW3VdPWVbdV07cmV0dXJuIG9bbl09aSxyKHQsdGhpcyxvKX19ZnVuY3Rpb24gQ2UodCxuKXtyZXR1cm4gdD09PW58fHQhPT10JiZuIT09bn1mdW5jdGlvbiB6ZSh0KXtyZXR1cm4gJGUodCkmJld1LmNhbGwodCxcImNhbGxlZVwiKSYmKCFxdS5jYWxsKHQsXCJjYWxsZWVcIil8fFwiW29iamVjdCBBcmd1bWVudHNdXCI9PU11LmNhbGwodCkpfWZ1bmN0aW9uIFVlKHQpe3JldHVybiBudWxsIT10JiZQZShXbyh0KSkmJiFGZSh0KX1mdW5jdGlvbiAkZSh0KXtyZXR1cm4gVGUodCkmJlVlKHQpfWZ1bmN0aW9uIERlKHQpe1xucmV0dXJuIFRlKHQpP1wiW29iamVjdCBFcnJvcl1cIj09TXUuY2FsbCh0KXx8dHlwZW9mIHQubWVzc2FnZT09XCJzdHJpbmdcIiYmdHlwZW9mIHQubmFtZT09XCJzdHJpbmdcIjpmYWxzZX1mdW5jdGlvbiBGZSh0KXtyZXR1cm4gdD1aZSh0KT9NdS5jYWxsKHQpOlwiXCIsXCJbb2JqZWN0IEZ1bmN0aW9uXVwiPT10fHxcIltvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dXCI9PXR9ZnVuY3Rpb24gTmUodCl7cmV0dXJuIHR5cGVvZiB0PT1cIm51bWJlclwiJiZ0PT1YZSh0KX1mdW5jdGlvbiBQZSh0KXtyZXR1cm4gdHlwZW9mIHQ9PVwibnVtYmVyXCImJnQ+LTEmJjA9PXQlMSYmOTAwNzE5OTI1NDc0MDk5MT49dH1mdW5jdGlvbiBaZSh0KXt2YXIgbj10eXBlb2YgdDtyZXR1cm4hIXQmJihcIm9iamVjdFwiPT1ufHxcImZ1bmN0aW9uXCI9PW4pfWZ1bmN0aW9uIFRlKHQpe3JldHVybiEhdCYmdHlwZW9mIHQ9PVwib2JqZWN0XCJ9ZnVuY3Rpb24gcWUodCl7cmV0dXJuIHR5cGVvZiB0PT1cIm51bWJlclwifHxUZSh0KSYmXCJbb2JqZWN0IE51bWJlcl1cIj09TXUuY2FsbCh0KTtcbn1mdW5jdGlvbiBWZSh0KXtyZXR1cm4hVGUodCl8fFwiW29iamVjdCBPYmplY3RdXCIhPU11LmNhbGwodCl8fEModCk/ZmFsc2U6KHQ9SnUoT2JqZWN0KHQpKSxudWxsPT09dD90cnVlOih0PVd1LmNhbGwodCxcImNvbnN0cnVjdG9yXCIpJiZ0LmNvbnN0cnVjdG9yLHR5cGVvZiB0PT1cImZ1bmN0aW9uXCImJnQgaW5zdGFuY2VvZiB0JiZSdS5jYWxsKHQpPT1MdSkpfWZ1bmN0aW9uIEtlKHQpe3JldHVybiBaZSh0KSYmXCJbb2JqZWN0IFJlZ0V4cF1cIj09TXUuY2FsbCh0KX1mdW5jdGlvbiBHZSh0KXtyZXR1cm4gdHlwZW9mIHQ9PVwic3RyaW5nXCJ8fCF5aSh0KSYmVGUodCkmJlwiW29iamVjdCBTdHJpbmddXCI9PU11LmNhbGwodCl9ZnVuY3Rpb24gSmUodCl7cmV0dXJuIHR5cGVvZiB0PT1cInN5bWJvbFwifHxUZSh0KSYmXCJbb2JqZWN0IFN5bWJvbF1cIj09TXUuY2FsbCh0KX1mdW5jdGlvbiBZZSh0KXtyZXR1cm4gVGUodCkmJlBlKHQubGVuZ3RoKSYmISFNdFtNdS5jYWxsKHQpXX1mdW5jdGlvbiBIZSh0KXtpZighdClyZXR1cm5bXTtcbmlmKFVlKHQpKXJldHVybiBHZSh0KT90Lm1hdGNoKEl0KTpscih0KTtpZihadSYmdFtadV0pcmV0dXJuIHoodFtadV0oKSk7dmFyIG49cXIodCk7cmV0dXJuKFwiW29iamVjdCBNYXBdXCI9PW4/VTpcIltvYmplY3QgU2V0XVwiPT1uP0Q6Y3UpKHQpfWZ1bmN0aW9uIFFlKHQpe3JldHVybiB0Pyh0PW51KHQpLHQ9PT1xfHx0PT09LXE/MS43OTc2OTMxMzQ4NjIzMTU3ZTMwOCooMD50Py0xOjEpOnQ9PT10P3Q6MCk6MD09PXQ/dDowfWZ1bmN0aW9uIFhlKHQpe3Q9UWUodCk7dmFyIG49dCUxO3JldHVybiB0PT09dD9uP3Qtbjp0OjB9ZnVuY3Rpb24gdHUodCl7cmV0dXJuIHQ/bm4oWGUodCksMCw0Mjk0OTY3Mjk1KTowfWZ1bmN0aW9uIG51KHQpe2lmKHR5cGVvZiB0PT1cIm51bWJlclwiKXJldHVybiB0O2lmKEplKHQpKXJldHVybiBWO2lmKFplKHQpJiYodD1GZSh0LnZhbHVlT2YpP3QudmFsdWVPZigpOnQsdD1aZSh0KT90K1wiXCI6dCksdHlwZW9mIHQhPVwic3RyaW5nXCIpcmV0dXJuIDA9PT10P3Q6K3Q7XG50PXQucmVwbGFjZShjdCxcIlwiKTt2YXIgbj1kdC50ZXN0KHQpO3JldHVybiBufHxidC50ZXN0KHQpP050KHQuc2xpY2UoMiksbj8yOjgpOmd0LnRlc3QodCk/VjordH1mdW5jdGlvbiBydSh0KXtyZXR1cm4gc3IodCxmdSh0KSl9ZnVuY3Rpb24gZXUodCl7cmV0dXJuIG51bGw9PXQ/XCJcIjpZbih0KX1mdW5jdGlvbiB1dSh0LG4scil7cmV0dXJuIHQ9bnVsbD09dD9UOnZuKHQsbiksdD09PVQ/cjp0fWZ1bmN0aW9uIG91KHQsbil7cmV0dXJuIG51bGwhPXQmJlZyKHQsbixibil9ZnVuY3Rpb24gaXUodCl7dmFyIG49ZWUodCk7aWYoIW4mJiFVZSh0KSlyZXR1cm4gUXUoT2JqZWN0KHQpKTt2YXIgcixlPVlyKHQpLHU9ISFlLGU9ZXx8W10sbz1lLmxlbmd0aDtmb3IociBpbiB0KSF5bih0LHIpfHx1JiYoXCJsZW5ndGhcIj09cnx8WHIocixvKSl8fG4mJlwiY29uc3RydWN0b3JcIj09cnx8ZS5wdXNoKHIpO3JldHVybiBlfWZ1bmN0aW9uIGZ1KHQpe2Zvcih2YXIgbj0tMSxyPWVlKHQpLGU9RW4odCksdT1lLmxlbmd0aCxvPVlyKHQpLGk9ISFvLG89b3x8W10sZj1vLmxlbmd0aDsrK248dTspe1xudmFyIGM9ZVtuXTtpJiYoXCJsZW5ndGhcIj09Y3x8WHIoYyxmKSl8fFwiY29uc3RydWN0b3JcIj09YyYmKHJ8fCFXdS5jYWxsKHQsYykpfHxvLnB1c2goYyl9cmV0dXJuIG99ZnVuY3Rpb24gY3UodCl7cmV0dXJuIHQ/ayh0LGl1KHQpKTpbXX1mdW5jdGlvbiBhdSh0KXtyZXR1cm4gcWkoZXUodCkudG9Mb3dlckNhc2UoKSl9ZnVuY3Rpb24gbHUodCl7cmV0dXJuKHQ9ZXUodCkpJiZ0LnJlcGxhY2UoanQsVykucmVwbGFjZShTdCxcIlwiKX1mdW5jdGlvbiBzdSh0LG4scil7cmV0dXJuIHQ9ZXUodCksbj1yP1Q6bixuPT09VCYmKG49QnQudGVzdCh0KT9SdDpzdCksdC5tYXRjaChuKXx8W119ZnVuY3Rpb24gaHUodCl7cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIHR9fWZ1bmN0aW9uIHB1KHQpe3JldHVybiB0fWZ1bmN0aW9uIF91KHQpe3JldHVybiBrbih0eXBlb2YgdD09XCJmdW5jdGlvblwiP3Q6cm4odCx0cnVlKSl9ZnVuY3Rpb24gdnUodCxuLHIpe3ZhciBlPWl1KG4pLG89X24obixlKTtudWxsIT1yfHxaZShuKSYmKG8ubGVuZ3RofHwhZS5sZW5ndGgpfHwocj1uLFxubj10LHQ9dGhpcyxvPV9uKG4saXUobikpKTt2YXIgaT0hKFplKHIpJiZcImNoYWluXCJpbiByJiYhci5jaGFpbiksZj1GZSh0KTtyZXR1cm4gdShvLGZ1bmN0aW9uKHIpe3ZhciBlPW5bcl07dFtyXT1lLGYmJih0LnByb3RvdHlwZVtyXT1mdW5jdGlvbigpe3ZhciBuPXRoaXMuX19jaGFpbl9fO2lmKGl8fG4pe3ZhciByPXQodGhpcy5fX3dyYXBwZWRfXyk7cmV0dXJuKHIuX19hY3Rpb25zX189bHIodGhpcy5fX2FjdGlvbnNfXykpLnB1c2goe2Z1bmM6ZSxhcmdzOmFyZ3VtZW50cyx0aGlzQXJnOnR9KSxyLl9fY2hhaW5fXz1uLHJ9cmV0dXJuIGUuYXBwbHkodCxzKFt0aGlzLnZhbHVlKCldLGFyZ3VtZW50cykpfSl9KSx0fWZ1bmN0aW9uIGd1KCl7fWZ1bmN0aW9uIGR1KHQpe3JldHVybiBuZSh0KT9VbihmZSh0KSk6JG4odCl9ZnVuY3Rpb24geXUoKXtyZXR1cm5bXX1mdW5jdGlvbiBidSgpe3JldHVybiBmYWxzZX1SPVI/R3QuZGVmYXVsdHMoe30sUixHdC5waWNrKEt0LEx0KSk6S3Q7dmFyIHh1PVIuRGF0ZSxqdT1SLkVycm9yLHd1PVIuTWF0aCxtdT1SLlJlZ0V4cCxBdT1SLlR5cGVFcnJvcixPdT1SLkFycmF5LnByb3RvdHlwZSxrdT1SLk9iamVjdC5wcm90b3R5cGUsRXU9Ui5TdHJpbmcucHJvdG90eXBlLFN1PVJbXCJfX2NvcmUtanNfc2hhcmVkX19cIl0sSXU9ZnVuY3Rpb24oKXtcbnZhciB0PS9bXi5dKyQvLmV4ZWMoU3UmJlN1LmtleXMmJlN1LmtleXMuSUVfUFJPVE98fFwiXCIpO3JldHVybiB0P1wiU3ltYm9sKHNyYylfMS5cIit0OlwiXCJ9KCksUnU9Ui5GdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcsV3U9a3UuaGFzT3duUHJvcGVydHksQnU9MCxMdT1SdS5jYWxsKE9iamVjdCksTXU9a3UudG9TdHJpbmcsQ3U9S3QuXyx6dT1tdShcIl5cIitSdS5jYWxsKFd1KS5yZXBsYWNlKGl0LFwiXFxcXCQmXCIpLnJlcGxhY2UoL2hhc093blByb3BlcnR5fChmdW5jdGlvbikuKj8oPz1cXFxcXFwoKXwgZm9yIC4rPyg/PVxcXFxcXF0pL2csXCIkMS4qP1wiKStcIiRcIiksVXU9VHQ/Ui5CdWZmZXI6VCwkdT1SLlJlZmxlY3QsRHU9Ui5TeW1ib2wsRnU9Ui5VaW50OEFycmF5LE51PSR1PyR1LmY6VCxQdT1PYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzLFp1PXR5cGVvZihadT1EdSYmRHUuaXRlcmF0b3IpPT1cInN5bWJvbFwiP1p1OlQsVHU9T2JqZWN0LmNyZWF0ZSxxdT1rdS5wcm9wZXJ0eUlzRW51bWVyYWJsZSxWdT1PdS5zcGxpY2UsS3U9d3UuY2VpbCxHdT13dS5mbG9vcixKdT1PYmplY3QuZ2V0UHJvdG90eXBlT2YsWXU9Ui5pc0Zpbml0ZSxIdT1PdS5qb2luLFF1PU9iamVjdC5rZXlzLFh1PXd1Lm1heCx0bz13dS5taW4sbm89Ui5wYXJzZUludCxybz13dS5yYW5kb20sZW89RXUucmVwbGFjZSx1bz1PdS5yZXZlcnNlLG9vPUV1LnNwbGl0LGlvPVpyKFIsXCJEYXRhVmlld1wiKSxmbz1acihSLFwiTWFwXCIpLGNvPVpyKFIsXCJQcm9taXNlXCIpLGFvPVpyKFIsXCJTZXRcIiksbG89WnIoUixcIldlYWtNYXBcIiksc289WnIoT2JqZWN0LFwiY3JlYXRlXCIpLGhvPWxvJiZuZXcgbG8scG89IXF1LmNhbGwoe1xudmFsdWVPZjoxfSxcInZhbHVlT2ZcIiksX289e30sdm89Y2UoaW8pLGdvPWNlKGZvKSx5bz1jZShjbyksYm89Y2UoYW8pLHhvPWNlKGxvKSxqbz1EdT9EdS5wcm90b3R5cGU6VCx3bz1qbz9qby52YWx1ZU9mOlQsbW89am8/am8udG9TdHJpbmc6VDtPdC50ZW1wbGF0ZVNldHRpbmdzPXtlc2NhcGU6dHQsZXZhbHVhdGU6bnQsaW50ZXJwb2xhdGU6cnQsdmFyaWFibGU6XCJcIixpbXBvcnRzOntfOk90fX0sT3QucHJvdG90eXBlPWt0LnByb3RvdHlwZSxPdC5wcm90b3R5cGUuY29uc3RydWN0b3I9T3QsenQucHJvdG90eXBlPXVuKGt0LnByb3RvdHlwZSksenQucHJvdG90eXBlLmNvbnN0cnVjdG9yPXp0LFV0LnByb3RvdHlwZT11bihrdC5wcm90b3R5cGUpLFV0LnByb3RvdHlwZS5jb25zdHJ1Y3Rvcj1VdCwkdC5wcm90b3R5cGUuY2xlYXI9ZnVuY3Rpb24oKXt0aGlzLl9fZGF0YV9fPXNvP3NvKG51bGwpOnt9fSwkdC5wcm90b3R5cGVbXCJkZWxldGVcIl09ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuaGFzKHQpJiZkZWxldGUgdGhpcy5fX2RhdGFfX1t0XTtcbn0sJHQucHJvdG90eXBlLmdldD1mdW5jdGlvbih0KXt2YXIgbj10aGlzLl9fZGF0YV9fO3JldHVybiBzbz8odD1uW3RdLFwiX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfX1wiPT09dD9UOnQpOld1LmNhbGwobix0KT9uW3RdOlR9LCR0LnByb3RvdHlwZS5oYXM9ZnVuY3Rpb24odCl7dmFyIG49dGhpcy5fX2RhdGFfXztyZXR1cm4gc28/blt0XSE9PVQ6V3UuY2FsbChuLHQpfSwkdC5wcm90b3R5cGUuc2V0PWZ1bmN0aW9uKHQsbil7cmV0dXJuIHRoaXMuX19kYXRhX19bdF09c28mJm49PT1UP1wiX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfX1wiOm4sdGhpc30sRHQucHJvdG90eXBlLmNsZWFyPWZ1bmN0aW9uKCl7dGhpcy5fX2RhdGFfXz1bXX0sRHQucHJvdG90eXBlW1wiZGVsZXRlXCJdPWZ1bmN0aW9uKHQpe3ZhciBuPXRoaXMuX19kYXRhX187cmV0dXJuIHQ9SHQobix0KSwwPnQ/ZmFsc2U6KHQ9PW4ubGVuZ3RoLTE/bi5wb3AoKTpWdS5jYWxsKG4sdCwxKSx0cnVlKX0sRHQucHJvdG90eXBlLmdldD1mdW5jdGlvbih0KXtcbnZhciBuPXRoaXMuX19kYXRhX187cmV0dXJuIHQ9SHQobix0KSwwPnQ/VDpuW3RdWzFdfSxEdC5wcm90b3R5cGUuaGFzPWZ1bmN0aW9uKHQpe3JldHVybi0xPEh0KHRoaXMuX19kYXRhX18sdCl9LER0LnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24odCxuKXt2YXIgcj10aGlzLl9fZGF0YV9fLGU9SHQocix0KTtyZXR1cm4gMD5lP3IucHVzaChbdCxuXSk6cltlXVsxXT1uLHRoaXN9LFB0LnByb3RvdHlwZS5jbGVhcj1mdW5jdGlvbigpe3RoaXMuX19kYXRhX189e2hhc2g6bmV3ICR0LG1hcDpuZXcoZm98fER0KSxzdHJpbmc6bmV3ICR0fX0sUHQucHJvdG90eXBlW1wiZGVsZXRlXCJdPWZ1bmN0aW9uKHQpe3JldHVybiBOcih0aGlzLHQpW1wiZGVsZXRlXCJdKHQpfSxQdC5wcm90b3R5cGUuZ2V0PWZ1bmN0aW9uKHQpe3JldHVybiBOcih0aGlzLHQpLmdldCh0KX0sUHQucHJvdG90eXBlLmhhcz1mdW5jdGlvbih0KXtyZXR1cm4gTnIodGhpcyx0KS5oYXModCl9LFB0LnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24odCxuKXtcbnJldHVybiBOcih0aGlzLHQpLnNldCh0LG4pLHRoaXN9LFp0LnByb3RvdHlwZS5hZGQ9WnQucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuX19kYXRhX18uc2V0KHQsXCJfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fXCIpLHRoaXN9LFp0LnByb3RvdHlwZS5oYXM9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuX19kYXRhX18uaGFzKHQpfSxxdC5wcm90b3R5cGUuY2xlYXI9ZnVuY3Rpb24oKXt0aGlzLl9fZGF0YV9fPW5ldyBEdH0scXQucHJvdG90eXBlW1wiZGVsZXRlXCJdPWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLl9fZGF0YV9fW1wiZGVsZXRlXCJdKHQpfSxxdC5wcm90b3R5cGUuZ2V0PWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLl9fZGF0YV9fLmdldCh0KX0scXQucHJvdG90eXBlLmhhcz1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5fX2RhdGFfXy5oYXModCl9LHF0LnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24odCxuKXt2YXIgcj10aGlzLl9fZGF0YV9fO3JldHVybiByIGluc3RhbmNlb2YgRHQmJjIwMD09ci5fX2RhdGFfXy5sZW5ndGgmJihyPXRoaXMuX19kYXRhX189bmV3IFB0KHIuX19kYXRhX18pKSxcbnIuc2V0KHQsbiksdGhpc307dmFyIEFvPXZyKGhuKSxPbz12cihwbix0cnVlKSxrbz1ncigpLEVvPWdyKHRydWUpO051JiYhcXUuY2FsbCh7dmFsdWVPZjoxfSxcInZhbHVlT2ZcIikmJihFbj1mdW5jdGlvbih0KXtyZXR1cm4geihOdSh0KSl9KTt2YXIgU289aG8/ZnVuY3Rpb24odCxuKXtyZXR1cm4gaG8uc2V0KHQsbiksdH06cHUsSW89YW8mJjEvRChuZXcgYW8oWywtMF0pKVsxXT09cT9mdW5jdGlvbih0KXtyZXR1cm4gbmV3IGFvKHQpfTpndSxSbz1obz9mdW5jdGlvbih0KXtyZXR1cm4gaG8uZ2V0KHQpfTpndSxXbz1VbihcImxlbmd0aFwiKTtQdXx8KFRyPXl1KTt2YXIgQm89UHU/ZnVuY3Rpb24odCl7Zm9yKHZhciBuPVtdO3Q7KXMobixUcih0KSksdD1KdShPYmplY3QodCkpO3JldHVybiBufTpUcjsoaW8mJlwiW29iamVjdCBEYXRhVmlld11cIiE9cXIobmV3IGlvKG5ldyBBcnJheUJ1ZmZlcigxKSkpfHxmbyYmXCJbb2JqZWN0IE1hcF1cIiE9cXIobmV3IGZvKXx8Y28mJlwiW29iamVjdCBQcm9taXNlXVwiIT1xcihjby5yZXNvbHZlKCkpfHxhbyYmXCJbb2JqZWN0IFNldF1cIiE9cXIobmV3IGFvKXx8bG8mJlwiW29iamVjdCBXZWFrTWFwXVwiIT1xcihuZXcgbG8pKSYmKHFyPWZ1bmN0aW9uKHQpe1xudmFyIG49TXUuY2FsbCh0KTtpZih0PSh0PVwiW29iamVjdCBPYmplY3RdXCI9PW4/dC5jb25zdHJ1Y3RvcjpUKT9jZSh0KTpUKXN3aXRjaCh0KXtjYXNlIHZvOnJldHVyblwiW29iamVjdCBEYXRhVmlld11cIjtjYXNlIGdvOnJldHVyblwiW29iamVjdCBNYXBdXCI7Y2FzZSB5bzpyZXR1cm5cIltvYmplY3QgUHJvbWlzZV1cIjtjYXNlIGJvOnJldHVyblwiW29iamVjdCBTZXRdXCI7Y2FzZSB4bzpyZXR1cm5cIltvYmplY3QgV2Vha01hcF1cIn1yZXR1cm4gbn0pO3ZhciBMbz1TdT9GZTpidSxNbz1mdW5jdGlvbigpe3ZhciB0PTAsbj0wO3JldHVybiBmdW5jdGlvbihyLGUpe3ZhciB1PUVlKCksbz0xNi0odS1uKTtpZihuPXUsbz4wKXtpZigxNTA8PSsrdClyZXR1cm4gcn1lbHNlIHQ9MDtyZXR1cm4gU28ocixlKX19KCksQ289TGUoZnVuY3Rpb24odCl7dmFyIG49W107cmV0dXJuIGV1KHQpLnJlcGxhY2Uob3QsZnVuY3Rpb24odCxyLGUsdSl7bi5wdXNoKGU/dS5yZXBsYWNlKGh0LFwiJDFcIik6cnx8dCl9KSxcbm59KSx6bz1NZShmdW5jdGlvbih0LG4pe3JldHVybiAkZSh0KT9mbih0LHNuKG4sMSwkZSx0cnVlKSk6W119KSxVbz1NZShmdW5jdGlvbih0LG4pe3ZhciByPXZlKG4pO3JldHVybiAkZShyKSYmKHI9VCksJGUodCk/Zm4odCxzbihuLDEsJGUsdHJ1ZSksRnIocikpOltdfSksJG89TWUoZnVuY3Rpb24odCxuKXt2YXIgcj12ZShuKTtyZXR1cm4gJGUocikmJihyPVQpLCRlKHQpP2ZuKHQsc24obiwxLCRlLHRydWUpLFQscik6W119KSxEbz1NZShmdW5jdGlvbih0KXt2YXIgbj1sKHQscnIpO3JldHVybiBuLmxlbmd0aCYmblswXT09PXRbMF0/eG4obik6W119KSxGbz1NZShmdW5jdGlvbih0KXt2YXIgbj12ZSh0KSxyPWwodCxycik7cmV0dXJuIG49PT12ZShyKT9uPVQ6ci5wb3AoKSxyLmxlbmd0aCYmclswXT09PXRbMF0/eG4ocixGcihuKSk6W119KSxObz1NZShmdW5jdGlvbih0KXt2YXIgbj12ZSh0KSxyPWwodCxycik7cmV0dXJuIG49PT12ZShyKT9uPVQ6ci5wb3AoKSxyLmxlbmd0aCYmclswXT09PXRbMF0/eG4ocixULG4pOltdO1xufSksUG89TWUoZ2UpLFpvPU1lKGZ1bmN0aW9uKHQsbil7bj1zbihuLDEpO3ZhciByPXQ/dC5sZW5ndGg6MCxlPXRuKHQsbik7cmV0dXJuIEZuKHQsbChuLGZ1bmN0aW9uKHQpe3JldHVybiBYcih0LHIpPyt0OnR9KS5zb3J0KGZyKSksZX0pLFRvPU1lKGZ1bmN0aW9uKHQpe3JldHVybiBIbihzbih0LDEsJGUsdHJ1ZSkpfSkscW89TWUoZnVuY3Rpb24odCl7dmFyIG49dmUodCk7cmV0dXJuICRlKG4pJiYobj1UKSxIbihzbih0LDEsJGUsdHJ1ZSksRnIobikpfSksVm89TWUoZnVuY3Rpb24odCl7dmFyIG49dmUodCk7cmV0dXJuICRlKG4pJiYobj1UKSxIbihzbih0LDEsJGUsdHJ1ZSksVCxuKX0pLEtvPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuICRlKHQpP2ZuKHQsbik6W119KSxHbz1NZShmdW5jdGlvbih0KXtyZXR1cm4gdHIoZih0LCRlKSl9KSxKbz1NZShmdW5jdGlvbih0KXt2YXIgbj12ZSh0KTtyZXR1cm4gJGUobikmJihuPVQpLHRyKGYodCwkZSksRnIobikpfSksWW89TWUoZnVuY3Rpb24odCl7XG52YXIgbj12ZSh0KTtyZXR1cm4gJGUobikmJihuPVQpLHRyKGYodCwkZSksVCxuKX0pLEhvPU1lKHllKSxRbz1NZShmdW5jdGlvbih0KXt2YXIgbj10Lmxlbmd0aCxuPW4+MT90W24tMV06VCxuPXR5cGVvZiBuPT1cImZ1bmN0aW9uXCI/KHQucG9wKCksbik6VDtyZXR1cm4gYmUodCxuKX0pLFhvPU1lKGZ1bmN0aW9uKHQpe2Z1bmN0aW9uIG4obil7cmV0dXJuIHRuKG4sdCl9dD1zbih0LDEpO3ZhciByPXQubGVuZ3RoLGU9cj90WzBdOjAsdT10aGlzLl9fd3JhcHBlZF9fO3JldHVybiEocj4xfHx0aGlzLl9fYWN0aW9uc19fLmxlbmd0aCkmJnUgaW5zdGFuY2VvZiBVdCYmWHIoZSk/KHU9dS5zbGljZShlLCtlKyhyPzE6MCkpLHUuX19hY3Rpb25zX18ucHVzaCh7ZnVuYzpqZSxhcmdzOltuXSx0aGlzQXJnOlR9KSxuZXcgenQodSx0aGlzLl9fY2hhaW5fXykudGhydShmdW5jdGlvbih0KXtyZXR1cm4gciYmIXQubGVuZ3RoJiZ0LnB1c2goVCksdH0pKTp0aGlzLnRocnUobil9KSx0aT1wcihmdW5jdGlvbih0LG4scil7XG5XdS5jYWxsKHQscik/Kyt0W3JdOnRbcl09MX0pLG5pPXdyKGhlKSxyaT13cihwZSksZWk9cHIoZnVuY3Rpb24odCxuLHIpe1d1LmNhbGwodCxyKT90W3JdLnB1c2gobik6dFtyXT1bbl19KSx1aT1NZShmdW5jdGlvbih0LG4sZSl7dmFyIHU9LTEsbz10eXBlb2Ygbj09XCJmdW5jdGlvblwiLGk9bmUobiksZj1VZSh0KT9BcnJheSh0Lmxlbmd0aCk6W107cmV0dXJuIEFvKHQsZnVuY3Rpb24odCl7dmFyIGM9bz9uOmkmJm51bGwhPXQ/dFtuXTpUO2ZbKyt1XT1jP3IoYyx0LGUpOnduKHQsbixlKX0pLGZ9KSxvaT1wcihmdW5jdGlvbih0LG4scil7dFtyXT1ufSksaWk9cHIoZnVuY3Rpb24odCxuLHIpe3Rbcj8wOjFdLnB1c2gobil9LGZ1bmN0aW9uKCl7cmV0dXJuW1tdLFtdXX0pLGZpPU1lKGZ1bmN0aW9uKHQsbil7aWYobnVsbD09dClyZXR1cm5bXTt2YXIgcj1uLmxlbmd0aDtyZXR1cm4gcj4xJiZ0ZSh0LG5bMF0sblsxXSk/bj1bXTpyPjImJnRlKG5bMF0sblsxXSxuWzJdKSYmKG49W25bMF1dKSxcbm49MT09bi5sZW5ndGgmJnlpKG5bMF0pP25bMF06c24obiwxLFFyKSxNbih0LG4sW10pfSksY2k9TWUoZnVuY3Rpb24odCxuLHIpe3ZhciBlPTE7aWYoci5sZW5ndGgpdmFyIHU9JChyLERyKGNpKSksZT0zMnxlO3JldHVybiBDcih0LGUsbixyLHUpfSksYWk9TWUoZnVuY3Rpb24odCxuLHIpe3ZhciBlPTM7aWYoci5sZW5ndGgpdmFyIHU9JChyLERyKGFpKSksZT0zMnxlO3JldHVybiBDcihuLGUsdCxyLHUpfSksbGk9TWUoZnVuY3Rpb24odCxuKXtyZXR1cm4gb24odCwxLG4pfSksc2k9TWUoZnVuY3Rpb24odCxuLHIpe3JldHVybiBvbih0LG51KG4pfHwwLHIpfSk7TGUuQ2FjaGU9UHQ7dmFyIGhpPU1lKGZ1bmN0aW9uKHQsbil7bj0xPT1uLmxlbmd0aCYmeWkoblswXSk/bChuWzBdLE8oRnIoKSkpOmwoc24obiwxLFFyKSxPKEZyKCkpKTt2YXIgZT1uLmxlbmd0aDtyZXR1cm4gTWUoZnVuY3Rpb24odSl7Zm9yKHZhciBvPS0xLGk9dG8odS5sZW5ndGgsZSk7KytvPGk7KXVbb109bltvXS5jYWxsKHRoaXMsdVtvXSk7XG5yZXR1cm4gcih0LHRoaXMsdSl9KX0pLHBpPU1lKGZ1bmN0aW9uKHQsbil7dmFyIHI9JChuLERyKHBpKSk7cmV0dXJuIENyKHQsMzIsVCxuLHIpfSksX2k9TWUoZnVuY3Rpb24odCxuKXt2YXIgcj0kKG4sRHIoX2kpKTtyZXR1cm4gQ3IodCw2NCxULG4scil9KSx2aT1NZShmdW5jdGlvbih0LG4pe3JldHVybiBDcih0LDI1NixULFQsVCxzbihuLDEpKX0pLGdpPVdyKGRuKSxkaT1XcihmdW5jdGlvbih0LG4pe3JldHVybiB0Pj1ufSkseWk9QXJyYXkuaXNBcnJheSxiaT1VdT9mdW5jdGlvbih0KXtyZXR1cm4gdCBpbnN0YW5jZW9mIFV1fTpidSx4aT1XcihTbiksamk9V3IoZnVuY3Rpb24odCxuKXtyZXR1cm4gbj49dH0pLHdpPV9yKGZ1bmN0aW9uKHQsbil7aWYocG98fGVlKG4pfHxVZShuKSlzcihuLGl1KG4pLHQpO2Vsc2UgZm9yKHZhciByIGluIG4pV3UuY2FsbChuLHIpJiZZdCh0LHIsbltyXSl9KSxtaT1fcihmdW5jdGlvbih0LG4pe2lmKHBvfHxlZShuKXx8VWUobikpc3IobixmdShuKSx0KTtlbHNlIGZvcih2YXIgciBpbiBuKVl0KHQscixuW3JdKTtcbn0pLEFpPV9yKGZ1bmN0aW9uKHQsbixyLGUpe3NyKG4sZnUobiksdCxlKX0pLE9pPV9yKGZ1bmN0aW9uKHQsbixyLGUpe3NyKG4saXUobiksdCxlKX0pLGtpPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHRuKHQsc24obiwxKSl9KSxFaT1NZShmdW5jdGlvbih0KXtyZXR1cm4gdC5wdXNoKFQsVnQpLHIoQWksVCx0KX0pLFNpPU1lKGZ1bmN0aW9uKHQpe3JldHVybiB0LnB1c2goVCxvZSkscihMaSxULHQpfSksSWk9T3IoZnVuY3Rpb24odCxuLHIpe3Rbbl09cn0saHUocHUpKSxSaT1PcihmdW5jdGlvbih0LG4scil7V3UuY2FsbCh0LG4pP3Rbbl0ucHVzaChyKTp0W25dPVtyXX0sRnIpLFdpPU1lKHduKSxCaT1fcihmdW5jdGlvbih0LG4scil7Qm4odCxuLHIpfSksTGk9X3IoZnVuY3Rpb24odCxuLHIsZSl7Qm4odCxuLHIsZSl9KSxNaT1NZShmdW5jdGlvbih0LG4pe3JldHVybiBudWxsPT10P3t9OihuPWwoc24obiwxKSxmZSksQ24odCxmbihnbih0LGZ1LEJvKSxuKSkpfSksQ2k9TWUoZnVuY3Rpb24odCxuKXtcbnJldHVybiBudWxsPT10P3t9OkNuKHQsbChzbihuLDEpLGZlKSl9KSx6aT1NcihpdSksVWk9TXIoZnUpLCRpPWJyKGZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gbj1uLnRvTG93ZXJDYXNlKCksdCsocj9hdShuKTpuKX0pLERpPWJyKGZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gdCsocj9cIi1cIjpcIlwiKStuLnRvTG93ZXJDYXNlKCl9KSxGaT1icihmdW5jdGlvbih0LG4scil7cmV0dXJuIHQrKHI/XCIgXCI6XCJcIikrbi50b0xvd2VyQ2FzZSgpfSksTmk9eXIoXCJ0b0xvd2VyQ2FzZVwiKSxQaT1icihmdW5jdGlvbih0LG4scil7cmV0dXJuIHQrKHI/XCJfXCI6XCJcIikrbi50b0xvd2VyQ2FzZSgpfSksWmk9YnIoZnVuY3Rpb24odCxuLHIpe3JldHVybiB0KyhyP1wiIFwiOlwiXCIpK3FpKG4pfSksVGk9YnIoZnVuY3Rpb24odCxuLHIpe3JldHVybiB0KyhyP1wiIFwiOlwiXCIpK24udG9VcHBlckNhc2UoKX0pLHFpPXlyKFwidG9VcHBlckNhc2VcIiksVmk9TWUoZnVuY3Rpb24odCxuKXt0cnl7cmV0dXJuIHIodCxULG4pfWNhdGNoKGUpe1xucmV0dXJuIERlKGUpP2U6bmV3IGp1KGUpfX0pLEtpPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHUoc24obiwxKSxmdW5jdGlvbihuKXtuPWZlKG4pLHRbbl09Y2kodFtuXSx0KX0pLHR9KSxHaT1tcigpLEppPW1yKHRydWUpLFlpPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuIGZ1bmN0aW9uKHIpe3JldHVybiB3bihyLHQsbil9fSksSGk9TWUoZnVuY3Rpb24odCxuKXtyZXR1cm4gZnVuY3Rpb24ocil7cmV0dXJuIHduKHQscixuKX19KSxRaT1FcihsKSxYaT1FcihpKSx0Zj1FcihfKSxuZj1ScigpLHJmPVJyKHRydWUpLGVmPWtyKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHQrbn0pLHVmPUxyKFwiY2VpbFwiKSxvZj1rcihmdW5jdGlvbih0LG4pe3JldHVybiB0L259KSxmZj1McihcImZsb29yXCIpLGNmPWtyKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHQqbn0pLGFmPUxyKFwicm91bmRcIiksbGY9a3IoZnVuY3Rpb24odCxuKXtyZXR1cm4gdC1ufSk7cmV0dXJuIE90LmFmdGVyPWZ1bmN0aW9uKHQsbil7aWYodHlwZW9mIG4hPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO1xucmV0dXJuIHQ9WGUodCksZnVuY3Rpb24oKXtyZXR1cm4gMT4tLXQ/bi5hcHBseSh0aGlzLGFyZ3VtZW50cyk6dm9pZCAwfX0sT3QuYXJ5PVNlLE90LmFzc2lnbj13aSxPdC5hc3NpZ25Jbj1taSxPdC5hc3NpZ25JbldpdGg9QWksT3QuYXNzaWduV2l0aD1PaSxPdC5hdD1raSxPdC5iZWZvcmU9SWUsT3QuYmluZD1jaSxPdC5iaW5kQWxsPUtpLE90LmJpbmRLZXk9YWksT3QuY2FzdEFycmF5PWZ1bmN0aW9uKCl7aWYoIWFyZ3VtZW50cy5sZW5ndGgpcmV0dXJuW107dmFyIHQ9YXJndW1lbnRzWzBdO3JldHVybiB5aSh0KT90Olt0XX0sT3QuY2hhaW49eGUsT3QuY2h1bms9ZnVuY3Rpb24odCxuLHIpe2lmKG49KHI/dGUodCxuLHIpOm49PT1UKT8xOlh1KFhlKG4pLDApLHI9dD90Lmxlbmd0aDowLCFyfHwxPm4pcmV0dXJuW107Zm9yKHZhciBlPTAsdT0wLG89QXJyYXkoS3Uoci9uKSk7cj5lOylvW3UrK109VG4odCxlLGUrPW4pO3JldHVybiBvfSxPdC5jb21wYWN0PWZ1bmN0aW9uKHQpe2Zvcih2YXIgbj0tMSxyPXQ/dC5sZW5ndGg6MCxlPTAsdT1bXTsrK248cjspe1xudmFyIG89dFtuXTtvJiYodVtlKytdPW8pfXJldHVybiB1fSxPdC5jb25jYXQ9ZnVuY3Rpb24oKXtmb3IodmFyIHQ9YXJndW1lbnRzLmxlbmd0aCxuPUFycmF5KHQ/dC0xOjApLHI9YXJndW1lbnRzWzBdLGU9dDtlLS07KW5bZS0xXT1hcmd1bWVudHNbZV07cmV0dXJuIHQ/cyh5aShyKT9scihyKTpbcl0sc24obiwxKSk6W119LE90LmNvbmQ9ZnVuY3Rpb24odCl7dmFyIG49dD90Lmxlbmd0aDowLGU9RnIoKTtyZXR1cm4gdD1uP2wodCxmdW5jdGlvbih0KXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiB0WzFdKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuW2UodFswXSksdFsxXV19KTpbXSxNZShmdW5jdGlvbihlKXtmb3IodmFyIHU9LTE7Kyt1PG47KXt2YXIgbz10W3VdO2lmKHIob1swXSx0aGlzLGUpKXJldHVybiByKG9bMV0sdGhpcyxlKX19KX0sT3QuY29uZm9ybXM9ZnVuY3Rpb24odCl7cmV0dXJuIGVuKHJuKHQsdHJ1ZSkpfSxPdC5jb25zdGFudD1odSxPdC5jb3VudEJ5PXRpLFxuT3QuY3JlYXRlPWZ1bmN0aW9uKHQsbil7dmFyIHI9dW4odCk7cmV0dXJuIG4/WHQocixuKTpyfSxPdC5jdXJyeT1SZSxPdC5jdXJyeVJpZ2h0PVdlLE90LmRlYm91bmNlPUJlLE90LmRlZmF1bHRzPUVpLE90LmRlZmF1bHRzRGVlcD1TaSxPdC5kZWZlcj1saSxPdC5kZWxheT1zaSxPdC5kaWZmZXJlbmNlPXpvLE90LmRpZmZlcmVuY2VCeT1VbyxPdC5kaWZmZXJlbmNlV2l0aD0kbyxPdC5kcm9wPWxlLE90LmRyb3BSaWdodD1zZSxPdC5kcm9wUmlnaHRXaGlsZT1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9Rbih0LEZyKG4sMyksdHJ1ZSx0cnVlKTpbXX0sT3QuZHJvcFdoaWxlPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQmJnQubGVuZ3RoP1FuKHQsRnIobiwzKSx0cnVlKTpbXX0sT3QuZmlsbD1mdW5jdGlvbih0LG4scixlKXt2YXIgdT10P3QubGVuZ3RoOjA7aWYoIXUpcmV0dXJuW107Zm9yKHImJnR5cGVvZiByIT1cIm51bWJlclwiJiZ0ZSh0LG4scikmJihyPTAsZT11KSx1PXQubGVuZ3RoLFxucj1YZShyKSwwPnImJihyPS1yPnU/MDp1K3IpLGU9ZT09PVR8fGU+dT91OlhlKGUpLDA+ZSYmKGUrPXUpLGU9cj5lPzA6dHUoZSk7ZT5yOyl0W3IrK109bjtyZXR1cm4gdH0sT3QuZmlsdGVyPWZ1bmN0aW9uKHQsbil7cmV0dXJuKHlpKHQpP2Y6bG4pKHQsRnIobiwzKSl9LE90LmZsYXRNYXA9ZnVuY3Rpb24odCxuKXtyZXR1cm4gc24oT2UodCxuKSwxKX0sT3QuZmxhdE1hcERlZXA9ZnVuY3Rpb24odCxuKXtyZXR1cm4gc24oT2UodCxuKSxxKX0sT3QuZmxhdE1hcERlcHRoPWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gcj1yPT09VD8xOlhlKHIpLHNuKE9lKHQsbikscil9LE90LmZsYXR0ZW49ZnVuY3Rpb24odCl7cmV0dXJuIHQmJnQubGVuZ3RoP3NuKHQsMSk6W119LE90LmZsYXR0ZW5EZWVwPWZ1bmN0aW9uKHQpe3JldHVybiB0JiZ0Lmxlbmd0aD9zbih0LHEpOltdfSxPdC5mbGF0dGVuRGVwdGg9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmdC5sZW5ndGg/KG49bj09PVQ/MTpYZShuKSxzbih0LG4pKTpbXTtcbn0sT3QuZmxpcD1mdW5jdGlvbih0KXtyZXR1cm4gQ3IodCw1MTIpfSxPdC5mbG93PUdpLE90LmZsb3dSaWdodD1KaSxPdC5mcm9tUGFpcnM9ZnVuY3Rpb24odCl7Zm9yKHZhciBuPS0xLHI9dD90Lmxlbmd0aDowLGU9e307KytuPHI7KXt2YXIgdT10W25dO2VbdVswXV09dVsxXX1yZXR1cm4gZX0sT3QuZnVuY3Rpb25zPWZ1bmN0aW9uKHQpe3JldHVybiBudWxsPT10P1tdOl9uKHQsaXUodCkpfSxPdC5mdW5jdGlvbnNJbj1mdW5jdGlvbih0KXtyZXR1cm4gbnVsbD09dD9bXTpfbih0LGZ1KHQpKX0sT3QuZ3JvdXBCeT1laSxPdC5pbml0aWFsPWZ1bmN0aW9uKHQpe3JldHVybiBzZSh0LDEpfSxPdC5pbnRlcnNlY3Rpb249RG8sT3QuaW50ZXJzZWN0aW9uQnk9Rm8sT3QuaW50ZXJzZWN0aW9uV2l0aD1ObyxPdC5pbnZlcnQ9SWksT3QuaW52ZXJ0Qnk9UmksT3QuaW52b2tlTWFwPXVpLE90Lml0ZXJhdGVlPV91LE90LmtleUJ5PW9pLE90LmtleXM9aXUsT3Qua2V5c0luPWZ1LE90Lm1hcD1PZSxcbk90Lm1hcEtleXM9ZnVuY3Rpb24odCxuKXt2YXIgcj17fTtyZXR1cm4gbj1GcihuLDMpLGhuKHQsZnVuY3Rpb24odCxlLHUpe3Jbbih0LGUsdSldPXR9KSxyfSxPdC5tYXBWYWx1ZXM9ZnVuY3Rpb24odCxuKXt2YXIgcj17fTtyZXR1cm4gbj1GcihuLDMpLGhuKHQsZnVuY3Rpb24odCxlLHUpe3JbZV09bih0LGUsdSl9KSxyfSxPdC5tYXRjaGVzPWZ1bmN0aW9uKHQpe3JldHVybiBSbihybih0LHRydWUpKX0sT3QubWF0Y2hlc1Byb3BlcnR5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIFduKHQscm4obix0cnVlKSl9LE90Lm1lbW9pemU9TGUsT3QubWVyZ2U9QmksT3QubWVyZ2VXaXRoPUxpLE90Lm1ldGhvZD1ZaSxPdC5tZXRob2RPZj1IaSxPdC5taXhpbj12dSxPdC5uZWdhdGU9ZnVuY3Rpb24odCl7aWYodHlwZW9mIHQhPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO3JldHVybiBmdW5jdGlvbigpe3JldHVybiF0LmFwcGx5KHRoaXMsYXJndW1lbnRzKX19LE90Lm50aEFyZz1mdW5jdGlvbih0KXtcbnJldHVybiB0PVhlKHQpLE1lKGZ1bmN0aW9uKG4pe3JldHVybiBMbihuLHQpfSl9LE90Lm9taXQ9TWksT3Qub21pdEJ5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIG49RnIobiksem4odCxmdW5jdGlvbih0LHIpe3JldHVybiFuKHQscil9KX0sT3Qub25jZT1mdW5jdGlvbih0KXtyZXR1cm4gSWUoMix0KX0sT3Qub3JkZXJCeT1mdW5jdGlvbih0LG4scixlKXtyZXR1cm4gbnVsbD09dD9bXTooeWkobil8fChuPW51bGw9PW4/W106W25dKSxyPWU/VDpyLHlpKHIpfHwocj1udWxsPT1yP1tdOltyXSksTW4odCxuLHIpKX0sT3Qub3Zlcj1RaSxPdC5vdmVyQXJncz1oaSxPdC5vdmVyRXZlcnk9WGksT3Qub3ZlclNvbWU9dGYsT3QucGFydGlhbD1waSxPdC5wYXJ0aWFsUmlnaHQ9X2ksT3QucGFydGl0aW9uPWlpLE90LnBpY2s9Q2ksT3QucGlja0J5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIG51bGw9PXQ/e306em4odCxGcihuKSl9LE90LnByb3BlcnR5PWR1LE90LnByb3BlcnR5T2Y9ZnVuY3Rpb24odCl7XG5yZXR1cm4gZnVuY3Rpb24obil7cmV0dXJuIG51bGw9PXQ/VDp2bih0LG4pfX0sT3QucHVsbD1QbyxPdC5wdWxsQWxsPWdlLE90LnB1bGxBbGxCeT1mdW5jdGlvbih0LG4scil7cmV0dXJuIHQmJnQubGVuZ3RoJiZuJiZuLmxlbmd0aD9Ebih0LG4sRnIocikpOnR9LE90LnB1bGxBbGxXaXRoPWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gdCYmdC5sZW5ndGgmJm4mJm4ubGVuZ3RoP0RuKHQsbixULHIpOnR9LE90LnB1bGxBdD1abyxPdC5yYW5nZT1uZixPdC5yYW5nZVJpZ2h0PXJmLE90LnJlYXJnPXZpLE90LnJlamVjdD1mdW5jdGlvbih0LG4pe3ZhciByPXlpKHQpP2Y6bG47cmV0dXJuIG49RnIobiwzKSxyKHQsZnVuY3Rpb24odCxyLGUpe3JldHVybiFuKHQscixlKX0pfSxPdC5yZW1vdmU9ZnVuY3Rpb24odCxuKXt2YXIgcj1bXTtpZighdHx8IXQubGVuZ3RoKXJldHVybiByO3ZhciBlPS0xLHU9W10sbz10Lmxlbmd0aDtmb3Iobj1GcihuLDMpOysrZTxvOyl7dmFyIGk9dFtlXTtuKGksZSx0KSYmKHIucHVzaChpKSxcbnUucHVzaChlKSl9cmV0dXJuIEZuKHQsdSkscn0sT3QucmVzdD1NZSxPdC5yZXZlcnNlPWRlLE90LnNhbXBsZVNpemU9a2UsT3Quc2V0PWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gbnVsbD09dD90OlpuKHQsbixyKX0sT3Quc2V0V2l0aD1mdW5jdGlvbih0LG4scixlKXtyZXR1cm4gZT10eXBlb2YgZT09XCJmdW5jdGlvblwiP2U6VCxudWxsPT10P3Q6Wm4odCxuLHIsZSl9LE90LnNodWZmbGU9ZnVuY3Rpb24odCl7cmV0dXJuIGtlKHQsNDI5NDk2NzI5NSl9LE90LnNsaWNlPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7cmV0dXJuIGU/KHImJnR5cGVvZiByIT1cIm51bWJlclwiJiZ0ZSh0LG4scik/KG49MCxyPWUpOihuPW51bGw9PW4/MDpYZShuKSxyPXI9PT1UP2U6WGUocikpLFRuKHQsbixyKSk6W119LE90LnNvcnRCeT1maSxPdC5zb3J0ZWRVbmlxPWZ1bmN0aW9uKHQpe3JldHVybiB0JiZ0Lmxlbmd0aD9Hbih0KTpbXX0sT3Quc29ydGVkVW5pcUJ5PWZ1bmN0aW9uKHQsbil7XG5yZXR1cm4gdCYmdC5sZW5ndGg/R24odCxGcihuKSk6W119LE90LnNwbGl0PWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gciYmdHlwZW9mIHIhPVwibnVtYmVyXCImJnRlKHQsbixyKSYmKG49cj1UKSxyPXI9PT1UPzQyOTQ5NjcyOTU6cj4+PjAscj8odD1ldSh0KSkmJih0eXBlb2Ygbj09XCJzdHJpbmdcInx8bnVsbCE9biYmIUtlKG4pKSYmKG49WW4obiksXCJcIj09biYmV3QudGVzdCh0KSk/dXIodC5tYXRjaChJdCksMCxyKTpvby5jYWxsKHQsbixyKTpbXX0sT3Quc3ByZWFkPWZ1bmN0aW9uKHQsbil7aWYodHlwZW9mIHQhPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO3JldHVybiBuPW49PT1UPzA6WHUoWGUobiksMCksTWUoZnVuY3Rpb24oZSl7dmFyIHU9ZVtuXTtyZXR1cm4gZT11cihlLDAsbiksdSYmcyhlLHUpLHIodCx0aGlzLGUpfSl9LE90LnRhaWw9ZnVuY3Rpb24odCl7cmV0dXJuIGxlKHQsMSl9LE90LnRha2U9ZnVuY3Rpb24odCxuLHIpe3JldHVybiB0JiZ0Lmxlbmd0aD8obj1yfHxuPT09VD8xOlhlKG4pLFxuVG4odCwwLDA+bj8wOm4pKTpbXX0sT3QudGFrZVJpZ2h0PWZ1bmN0aW9uKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7cmV0dXJuIGU/KG49cnx8bj09PVQ/MTpYZShuKSxuPWUtbixUbih0LDA+bj8wOm4sZSkpOltdfSxPdC50YWtlUmlnaHRXaGlsZT1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9Rbih0LEZyKG4sMyksZmFsc2UsdHJ1ZSk6W119LE90LnRha2VXaGlsZT1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9Rbih0LEZyKG4sMykpOltdfSxPdC50YXA9ZnVuY3Rpb24odCxuKXtyZXR1cm4gbih0KSx0fSxPdC50aHJvdHRsZT1mdW5jdGlvbih0LG4scil7dmFyIGU9dHJ1ZSx1PXRydWU7aWYodHlwZW9mIHQhPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO3JldHVybiBaZShyKSYmKGU9XCJsZWFkaW5nXCJpbiByPyEhci5sZWFkaW5nOmUsdT1cInRyYWlsaW5nXCJpbiByPyEhci50cmFpbGluZzp1KSxCZSh0LG4se2xlYWRpbmc6ZSxtYXhXYWl0Om4sXG50cmFpbGluZzp1fSl9LE90LnRocnU9amUsT3QudG9BcnJheT1IZSxPdC50b1BhaXJzPXppLE90LnRvUGFpcnNJbj1VaSxPdC50b1BhdGg9ZnVuY3Rpb24odCl7cmV0dXJuIHlpKHQpP2wodCxmZSk6SmUodCk/W3RdOmxyKENvKHQpKX0sT3QudG9QbGFpbk9iamVjdD1ydSxPdC50cmFuc2Zvcm09ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXlpKHQpfHxZZSh0KTtpZihuPUZyKG4sNCksbnVsbD09cilpZihlfHxaZSh0KSl7dmFyIG89dC5jb25zdHJ1Y3RvcjtyPWU/eWkodCk/bmV3IG86W106RmUobyk/dW4oSnUoT2JqZWN0KHQpKSk6e319ZWxzZSByPXt9O3JldHVybihlP3U6aG4pKHQsZnVuY3Rpb24odCxlLHUpe3JldHVybiBuKHIsdCxlLHUpfSkscn0sT3QudW5hcnk9ZnVuY3Rpb24odCl7cmV0dXJuIFNlKHQsMSl9LE90LnVuaW9uPVRvLE90LnVuaW9uQnk9cW8sT3QudW5pb25XaXRoPVZvLE90LnVuaXE9ZnVuY3Rpb24odCl7cmV0dXJuIHQmJnQubGVuZ3RoP0huKHQpOltdfSxPdC51bmlxQnk9ZnVuY3Rpb24odCxuKXtcbnJldHVybiB0JiZ0Lmxlbmd0aD9Ibih0LEZyKG4pKTpbXX0sT3QudW5pcVdpdGg9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmdC5sZW5ndGg/SG4odCxULG4pOltdfSxPdC51bnNldD1mdW5jdGlvbih0LG4pe3ZhciByO2lmKG51bGw9PXQpcj10cnVlO2Vsc2V7cj10O3ZhciBlPW4sZT1uZShlLHIpP1tlXTplcihlKTtyPWllKHIsZSksZT1mZSh2ZShlKSkscj0hKG51bGwhPXImJnluKHIsZSkpfHxkZWxldGUgcltlXX1yZXR1cm4gcn0sT3QudW56aXA9eWUsT3QudW56aXBXaXRoPWJlLE90LnVwZGF0ZT1mdW5jdGlvbih0LG4scil7cmV0dXJuIG51bGw9PXQ/dDpabih0LG4sKHR5cGVvZiByPT1cImZ1bmN0aW9uXCI/cjpwdSkodm4odCxuKSksdm9pZCAwKX0sT3QudXBkYXRlV2l0aD1mdW5jdGlvbih0LG4scixlKXtyZXR1cm4gZT10eXBlb2YgZT09XCJmdW5jdGlvblwiP2U6VCxudWxsIT10JiYodD1abih0LG4sKHR5cGVvZiByPT1cImZ1bmN0aW9uXCI/cjpwdSkodm4odCxuKSksZSkpLHR9LE90LnZhbHVlcz1jdSxcbk90LnZhbHVlc0luPWZ1bmN0aW9uKHQpe3JldHVybiBudWxsPT10P1tdOmsodCxmdSh0KSl9LE90LndpdGhvdXQ9S28sT3Qud29yZHM9c3UsT3Qud3JhcD1mdW5jdGlvbih0LG4pe3JldHVybiBuPW51bGw9PW4/cHU6bixwaShuLHQpfSxPdC54b3I9R28sT3QueG9yQnk9Sm8sT3QueG9yV2l0aD1ZbyxPdC56aXA9SG8sT3QuemlwT2JqZWN0PWZ1bmN0aW9uKHQsbil7cmV0dXJuIG5yKHR8fFtdLG58fFtdLFl0KX0sT3QuemlwT2JqZWN0RGVlcD1mdW5jdGlvbih0LG4pe3JldHVybiBucih0fHxbXSxufHxbXSxabil9LE90LnppcFdpdGg9UW8sT3QuZW50cmllcz16aSxPdC5lbnRyaWVzSW49VWksT3QuZXh0ZW5kPW1pLE90LmV4dGVuZFdpdGg9QWksdnUoT3QsT3QpLE90LmFkZD1lZixPdC5hdHRlbXB0PVZpLE90LmNhbWVsQ2FzZT0kaSxPdC5jYXBpdGFsaXplPWF1LE90LmNlaWw9dWYsT3QuY2xhbXA9ZnVuY3Rpb24odCxuLHIpe3JldHVybiByPT09VCYmKHI9bixuPVQpLHIhPT1UJiYocj1udShyKSxcbnI9cj09PXI/cjowKSxuIT09VCYmKG49bnUobiksbj1uPT09bj9uOjApLG5uKG51KHQpLG4scil9LE90LmNsb25lPWZ1bmN0aW9uKHQpe3JldHVybiBybih0LGZhbHNlLHRydWUpfSxPdC5jbG9uZURlZXA9ZnVuY3Rpb24odCl7cmV0dXJuIHJuKHQsdHJ1ZSx0cnVlKX0sT3QuY2xvbmVEZWVwV2l0aD1mdW5jdGlvbih0LG4pe3JldHVybiBybih0LHRydWUsdHJ1ZSxuKX0sT3QuY2xvbmVXaXRoPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHJuKHQsZmFsc2UsdHJ1ZSxuKX0sT3QuZGVidXJyPWx1LE90LmRpdmlkZT1vZixPdC5lbmRzV2l0aD1mdW5jdGlvbih0LG4scil7dD1ldSh0KSxuPVluKG4pO3ZhciBlPXQubGVuZ3RoO3JldHVybiByPXI9PT1UP2U6bm4oWGUociksMCxlKSxyLT1uLmxlbmd0aCxyPj0wJiZ0LmluZGV4T2YobixyKT09cn0sT3QuZXE9Q2UsT3QuZXNjYXBlPWZ1bmN0aW9uKHQpe3JldHVybih0PWV1KHQpKSYmWC50ZXN0KHQpP3QucmVwbGFjZShILEIpOnR9LE90LmVzY2FwZVJlZ0V4cD1mdW5jdGlvbih0KXtcbnJldHVybih0PWV1KHQpKSYmZnQudGVzdCh0KT90LnJlcGxhY2UoaXQsXCJcXFxcJCZcIik6dH0sT3QuZXZlcnk9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXlpKHQpP2k6Y247cmV0dXJuIHImJnRlKHQsbixyKSYmKG49VCksZSh0LEZyKG4sMykpfSxPdC5maW5kPW5pLE90LmZpbmRJbmRleD1oZSxPdC5maW5kS2V5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIHYodCxGcihuLDMpLGhuKX0sT3QuZmluZExhc3Q9cmksT3QuZmluZExhc3RJbmRleD1wZSxPdC5maW5kTGFzdEtleT1mdW5jdGlvbih0LG4pe3JldHVybiB2KHQsRnIobiwzKSxwbil9LE90LmZsb29yPWZmLE90LmZvckVhY2g9bWUsT3QuZm9yRWFjaFJpZ2h0PUFlLE90LmZvckluPWZ1bmN0aW9uKHQsbil7cmV0dXJuIG51bGw9PXQ/dDprbyh0LEZyKG4sMyksZnUpfSxPdC5mb3JJblJpZ2h0PWZ1bmN0aW9uKHQsbil7cmV0dXJuIG51bGw9PXQ/dDpFbyh0LEZyKG4sMyksZnUpfSxPdC5mb3JPd249ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmaG4odCxGcihuLDMpKTtcbn0sT3QuZm9yT3duUmlnaHQ9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmcG4odCxGcihuLDMpKX0sT3QuZ2V0PXV1LE90Lmd0PWdpLE90Lmd0ZT1kaSxPdC5oYXM9ZnVuY3Rpb24odCxuKXtyZXR1cm4gbnVsbCE9dCYmVnIodCxuLHluKX0sT3QuaGFzSW49b3UsT3QuaGVhZD1fZSxPdC5pZGVudGl0eT1wdSxPdC5pbmNsdWRlcz1mdW5jdGlvbih0LG4scixlKXtyZXR1cm4gdD1VZSh0KT90OmN1KHQpLHI9ciYmIWU/WGUocik6MCxlPXQubGVuZ3RoLDA+ciYmKHI9WHUoZStyLDApKSxHZSh0KT9lPj1yJiYtMTx0LmluZGV4T2YobixyKTohIWUmJi0xPGQodCxuLHIpfSxPdC5pbmRleE9mPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7cmV0dXJuIGU/KHI9bnVsbD09cj8wOlhlKHIpLDA+ciYmKHI9WHUoZStyLDApKSxkKHQsbixyKSk6LTF9LE90LmluUmFuZ2U9ZnVuY3Rpb24odCxuLHIpe3JldHVybiBuPW51KG4pfHwwLHI9PT1UPyhyPW4sbj0wKTpyPW51KHIpfHwwLHQ9bnUodCksXG50Pj10byhuLHIpJiZ0PFh1KG4scil9LE90Lmludm9rZT1XaSxPdC5pc0FyZ3VtZW50cz16ZSxPdC5pc0FycmF5PXlpLE90LmlzQXJyYXlCdWZmZXI9ZnVuY3Rpb24odCl7cmV0dXJuIFRlKHQpJiZcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PU11LmNhbGwodCl9LE90LmlzQXJyYXlMaWtlPVVlLE90LmlzQXJyYXlMaWtlT2JqZWN0PSRlLE90LmlzQm9vbGVhbj1mdW5jdGlvbih0KXtyZXR1cm4gdHJ1ZT09PXR8fGZhbHNlPT09dHx8VGUodCkmJlwiW29iamVjdCBCb29sZWFuXVwiPT1NdS5jYWxsKHQpfSxPdC5pc0J1ZmZlcj1iaSxPdC5pc0RhdGU9ZnVuY3Rpb24odCl7cmV0dXJuIFRlKHQpJiZcIltvYmplY3QgRGF0ZV1cIj09TXUuY2FsbCh0KX0sT3QuaXNFbGVtZW50PWZ1bmN0aW9uKHQpe3JldHVybiEhdCYmMT09PXQubm9kZVR5cGUmJlRlKHQpJiYhVmUodCl9LE90LmlzRW1wdHk9ZnVuY3Rpb24odCl7aWYoVWUodCkmJih5aSh0KXx8R2UodCl8fEZlKHQuc3BsaWNlKXx8emUodCl8fGJpKHQpKSlyZXR1cm4hdC5sZW5ndGg7XG5pZihUZSh0KSl7dmFyIG49cXIodCk7aWYoXCJbb2JqZWN0IE1hcF1cIj09bnx8XCJbb2JqZWN0IFNldF1cIj09bilyZXR1cm4hdC5zaXplfWZvcih2YXIgciBpbiB0KWlmKFd1LmNhbGwodCxyKSlyZXR1cm4gZmFsc2U7cmV0dXJuIShwbyYmaXUodCkubGVuZ3RoKX0sT3QuaXNFcXVhbD1mdW5jdGlvbih0LG4pe3JldHVybiBtbih0LG4pfSxPdC5pc0VxdWFsV2l0aD1mdW5jdGlvbih0LG4scil7dmFyIGU9KHI9dHlwZW9mIHI9PVwiZnVuY3Rpb25cIj9yOlQpP3IodCxuKTpUO3JldHVybiBlPT09VD9tbih0LG4scik6ISFlfSxPdC5pc0Vycm9yPURlLE90LmlzRmluaXRlPWZ1bmN0aW9uKHQpe3JldHVybiB0eXBlb2YgdD09XCJudW1iZXJcIiYmWXUodCl9LE90LmlzRnVuY3Rpb249RmUsT3QuaXNJbnRlZ2VyPU5lLE90LmlzTGVuZ3RoPVBlLE90LmlzTWFwPWZ1bmN0aW9uKHQpe3JldHVybiBUZSh0KSYmXCJbb2JqZWN0IE1hcF1cIj09cXIodCl9LE90LmlzTWF0Y2g9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdD09PW58fEFuKHQsbixQcihuKSk7XG59LE90LmlzTWF0Y2hXaXRoPWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gcj10eXBlb2Ygcj09XCJmdW5jdGlvblwiP3I6VCxBbih0LG4sUHIobikscil9LE90LmlzTmFOPWZ1bmN0aW9uKHQpe3JldHVybiBxZSh0KSYmdCE9K3R9LE90LmlzTmF0aXZlPWZ1bmN0aW9uKHQpe2lmKExvKHQpKXRocm93IG5ldyBqdShcIlRoaXMgbWV0aG9kIGlzIG5vdCBzdXBwb3J0ZWQgd2l0aCBgY29yZS1qc2AuIFRyeSBodHRwczovL2dpdGh1Yi5jb20vZXMtc2hpbXMuXCIpO3JldHVybiBPbih0KX0sT3QuaXNOaWw9ZnVuY3Rpb24odCl7cmV0dXJuIG51bGw9PXR9LE90LmlzTnVsbD1mdW5jdGlvbih0KXtyZXR1cm4gbnVsbD09PXR9LE90LmlzTnVtYmVyPXFlLE90LmlzT2JqZWN0PVplLE90LmlzT2JqZWN0TGlrZT1UZSxPdC5pc1BsYWluT2JqZWN0PVZlLE90LmlzUmVnRXhwPUtlLE90LmlzU2FmZUludGVnZXI9ZnVuY3Rpb24odCl7cmV0dXJuIE5lKHQpJiZ0Pj0tOTAwNzE5OTI1NDc0MDk5MSYmOTAwNzE5OTI1NDc0MDk5MT49dDtcbn0sT3QuaXNTZXQ9ZnVuY3Rpb24odCl7cmV0dXJuIFRlKHQpJiZcIltvYmplY3QgU2V0XVwiPT1xcih0KX0sT3QuaXNTdHJpbmc9R2UsT3QuaXNTeW1ib2w9SmUsT3QuaXNUeXBlZEFycmF5PVllLE90LmlzVW5kZWZpbmVkPWZ1bmN0aW9uKHQpe3JldHVybiB0PT09VH0sT3QuaXNXZWFrTWFwPWZ1bmN0aW9uKHQpe3JldHVybiBUZSh0KSYmXCJbb2JqZWN0IFdlYWtNYXBdXCI9PXFyKHQpfSxPdC5pc1dlYWtTZXQ9ZnVuY3Rpb24odCl7cmV0dXJuIFRlKHQpJiZcIltvYmplY3QgV2Vha1NldF1cIj09TXUuY2FsbCh0KX0sT3Quam9pbj1mdW5jdGlvbih0LG4pe3JldHVybiB0P0h1LmNhbGwodCxuKTpcIlwifSxPdC5rZWJhYkNhc2U9RGksT3QubGFzdD12ZSxPdC5sYXN0SW5kZXhPZj1mdW5jdGlvbih0LG4scil7dmFyIGU9dD90Lmxlbmd0aDowO2lmKCFlKXJldHVybi0xO3ZhciB1PWU7aWYociE9PVQmJih1PVhlKHIpLHU9KDA+dT9YdShlK3UsMCk6dG8odSxlLTEpKSsxKSxuIT09bilyZXR1cm4gTSh0LHUtMSx0cnVlKTtcbmZvcig7dS0tOylpZih0W3VdPT09bilyZXR1cm4gdTtyZXR1cm4tMX0sT3QubG93ZXJDYXNlPUZpLE90Lmxvd2VyRmlyc3Q9TmksT3QubHQ9eGksT3QubHRlPWppLE90Lm1heD1mdW5jdGlvbih0KXtyZXR1cm4gdCYmdC5sZW5ndGg/YW4odCxwdSxkbik6VH0sT3QubWF4Qnk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmdC5sZW5ndGg/YW4odCxGcihuKSxkbik6VH0sT3QubWVhbj1mdW5jdGlvbih0KXtyZXR1cm4gYih0LHB1KX0sT3QubWVhbkJ5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIGIodCxGcihuKSl9LE90Lm1pbj1mdW5jdGlvbih0KXtyZXR1cm4gdCYmdC5sZW5ndGg/YW4odCxwdSxTbik6VH0sT3QubWluQnk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmdC5sZW5ndGg/YW4odCxGcihuKSxTbik6VH0sT3Quc3R1YkFycmF5PXl1LE90LnN0dWJGYWxzZT1idSxPdC5zdHViT2JqZWN0PWZ1bmN0aW9uKCl7cmV0dXJue319LE90LnN0dWJTdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm5cIlwifSxPdC5zdHViVHJ1ZT1mdW5jdGlvbigpe1xucmV0dXJuIHRydWV9LE90Lm11bHRpcGx5PWNmLE90Lm50aD1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9Mbih0LFhlKG4pKTpUfSxPdC5ub0NvbmZsaWN0PWZ1bmN0aW9uKCl7cmV0dXJuIEt0Ll89PT10aGlzJiYoS3QuXz1DdSksdGhpc30sT3Qubm9vcD1ndSxPdC5ub3c9RWUsT3QucGFkPWZ1bmN0aW9uKHQsbixyKXt0PWV1KHQpO3ZhciBlPShuPVhlKG4pKT9OKHQpOjA7cmV0dXJuIW58fGU+PW4/dDoobj0obi1lKS8yLFNyKEd1KG4pLHIpK3QrU3IoS3UobikscikpfSxPdC5wYWRFbmQ9ZnVuY3Rpb24odCxuLHIpe3Q9ZXUodCk7dmFyIGU9KG49WGUobikpP04odCk6MDtyZXR1cm4gbiYmbj5lP3QrU3Iobi1lLHIpOnR9LE90LnBhZFN0YXJ0PWZ1bmN0aW9uKHQsbixyKXt0PWV1KHQpO3ZhciBlPShuPVhlKG4pKT9OKHQpOjA7cmV0dXJuIG4mJm4+ZT9TcihuLWUscikrdDp0fSxPdC5wYXJzZUludD1mdW5jdGlvbih0LG4scil7cmV0dXJuIHJ8fG51bGw9PW4/bj0wOm4mJihuPStuKSxcbnQ9ZXUodCkucmVwbGFjZShjdCxcIlwiKSxubyh0LG58fCh2dC50ZXN0KHQpPzE2OjEwKSl9LE90LnJhbmRvbT1mdW5jdGlvbih0LG4scil7aWYociYmdHlwZW9mIHIhPVwiYm9vbGVhblwiJiZ0ZSh0LG4scikmJihuPXI9VCkscj09PVQmJih0eXBlb2Ygbj09XCJib29sZWFuXCI/KHI9bixuPVQpOnR5cGVvZiB0PT1cImJvb2xlYW5cIiYmKHI9dCx0PVQpKSx0PT09VCYmbj09PVQ/KHQ9MCxuPTEpOih0PW51KHQpfHwwLG49PT1UPyhuPXQsdD0wKTpuPW51KG4pfHwwKSx0Pm4pe3ZhciBlPXQ7dD1uLG49ZX1yZXR1cm4gcnx8dCUxfHxuJTE/KHI9cm8oKSx0byh0K3IqKG4tdCtGdChcIjFlLVwiKygocitcIlwiKS5sZW5ndGgtMSkpKSxuKSk6Tm4odCxuKX0sT3QucmVkdWNlPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT15aSh0KT9oOngsdT0zPmFyZ3VtZW50cy5sZW5ndGg7cmV0dXJuIGUodCxGcihuLDQpLHIsdSxBbyl9LE90LnJlZHVjZVJpZ2h0PWZ1bmN0aW9uKHQsbixyKXt2YXIgZT15aSh0KT9wOngsdT0zPmFyZ3VtZW50cy5sZW5ndGg7XG5yZXR1cm4gZSh0LEZyKG4sNCkscix1LE9vKX0sT3QucmVwZWF0PWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gbj0ocj90ZSh0LG4scik6bj09PVQpPzE6WGUobiksUG4oZXUodCksbil9LE90LnJlcGxhY2U9ZnVuY3Rpb24oKXt2YXIgdD1hcmd1bWVudHMsbj1ldSh0WzBdKTtyZXR1cm4gMz50Lmxlbmd0aD9uOmVvLmNhbGwobix0WzFdLHRbMl0pfSxPdC5yZXN1bHQ9ZnVuY3Rpb24odCxuLHIpe249bmUobix0KT9bbl06ZXIobik7dmFyIGU9LTEsdT1uLmxlbmd0aDtmb3IodXx8KHQ9VCx1PTEpOysrZTx1Oyl7dmFyIG89bnVsbD09dD9UOnRbZmUobltlXSldO289PT1UJiYoZT11LG89ciksdD1GZShvKT9vLmNhbGwodCk6b31yZXR1cm4gdH0sT3Qucm91bmQ9YWYsT3QucnVuSW5Db250ZXh0PVosT3Quc2FtcGxlPWZ1bmN0aW9uKHQpe3Q9VWUodCk/dDpjdSh0KTt2YXIgbj10Lmxlbmd0aDtyZXR1cm4gbj4wP3RbTm4oMCxuLTEpXTpUfSxPdC5zaXplPWZ1bmN0aW9uKHQpe2lmKG51bGw9PXQpcmV0dXJuIDA7XG5pZihVZSh0KSl7dmFyIG49dC5sZW5ndGg7cmV0dXJuIG4mJkdlKHQpP04odCk6bn1yZXR1cm4gVGUodCkmJihuPXFyKHQpLFwiW29iamVjdCBNYXBdXCI9PW58fFwiW29iamVjdCBTZXRdXCI9PW4pP3Quc2l6ZTppdSh0KS5sZW5ndGh9LE90LnNuYWtlQ2FzZT1QaSxPdC5zb21lPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT15aSh0KT9fOnFuO3JldHVybiByJiZ0ZSh0LG4scikmJihuPVQpLGUodCxGcihuLDMpKX0sT3Quc29ydGVkSW5kZXg9ZnVuY3Rpb24odCxuKXtyZXR1cm4gVm4odCxuKX0sT3Quc29ydGVkSW5kZXhCeT1mdW5jdGlvbih0LG4scil7cmV0dXJuIEtuKHQsbixGcihyKSl9LE90LnNvcnRlZEluZGV4T2Y9ZnVuY3Rpb24odCxuKXt2YXIgcj10P3QubGVuZ3RoOjA7aWYocil7dmFyIGU9Vm4odCxuKTtpZihyPmUmJkNlKHRbZV0sbikpcmV0dXJuIGV9cmV0dXJuLTF9LE90LnNvcnRlZExhc3RJbmRleD1mdW5jdGlvbih0LG4pe3JldHVybiBWbih0LG4sdHJ1ZSl9LE90LnNvcnRlZExhc3RJbmRleEJ5PWZ1bmN0aW9uKHQsbixyKXtcbnJldHVybiBLbih0LG4sRnIociksdHJ1ZSl9LE90LnNvcnRlZExhc3RJbmRleE9mPWZ1bmN0aW9uKHQsbil7aWYodCYmdC5sZW5ndGgpe3ZhciByPVZuKHQsbix0cnVlKS0xO2lmKENlKHRbcl0sbikpcmV0dXJuIHJ9cmV0dXJuLTF9LE90LnN0YXJ0Q2FzZT1aaSxPdC5zdGFydHNXaXRoPWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gdD1ldSh0KSxyPW5uKFhlKHIpLDAsdC5sZW5ndGgpLHQubGFzdEluZGV4T2YoWW4obikscik9PXJ9LE90LnN1YnRyYWN0PWxmLE90LnN1bT1mdW5jdGlvbih0KXtyZXR1cm4gdCYmdC5sZW5ndGg/dyh0LHB1KTowfSxPdC5zdW1CeT1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD93KHQsRnIobikpOjB9LE90LnRlbXBsYXRlPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT1PdC50ZW1wbGF0ZVNldHRpbmdzO3ImJnRlKHQsbixyKSYmKG49VCksdD1ldSh0KSxuPUFpKHt9LG4sZSxWdCkscj1BaSh7fSxuLmltcG9ydHMsZS5pbXBvcnRzLFZ0KTt2YXIgdSxvLGk9aXUociksZj1rKHIsaSksYz0wO1xucj1uLmludGVycG9sYXRlfHx3dDt2YXIgYT1cIl9fcCs9J1wiO3I9bXUoKG4uZXNjYXBlfHx3dCkuc291cmNlK1wifFwiK3Iuc291cmNlK1wifFwiKyhyPT09cnQ/cHQ6d3QpLnNvdXJjZStcInxcIisobi5ldmFsdWF0ZXx8d3QpLnNvdXJjZStcInwkXCIsXCJnXCIpO3ZhciBsPVwic291cmNlVVJMXCJpbiBuP1wiLy8jIHNvdXJjZVVSTD1cIituLnNvdXJjZVVSTCtcIlxcblwiOlwiXCI7aWYodC5yZXBsYWNlKHIsZnVuY3Rpb24obixyLGUsaSxmLGwpe3JldHVybiBlfHwoZT1pKSxhKz10LnNsaWNlKGMsbCkucmVwbGFjZShtdCxMKSxyJiYodT10cnVlLGErPVwiJytfX2UoXCIrcitcIikrJ1wiKSxmJiYobz10cnVlLGErPVwiJztcIitmK1wiO1xcbl9fcCs9J1wiKSxlJiYoYSs9XCInKygoX190PShcIitlK1wiKSk9PW51bGw/Jyc6X190KSsnXCIpLGM9bCtuLmxlbmd0aCxufSksYSs9XCInO1wiLChuPW4udmFyaWFibGUpfHwoYT1cIndpdGgob2JqKXtcIithK1wifVwiKSxhPShvP2EucmVwbGFjZShLLFwiXCIpOmEpLnJlcGxhY2UoRyxcIiQxXCIpLnJlcGxhY2UoSixcIiQxO1wiKSxcbmE9XCJmdW5jdGlvbihcIisobnx8XCJvYmpcIikrXCIpe1wiKyhuP1wiXCI6XCJvYmp8fChvYmo9e30pO1wiKStcInZhciBfX3QsX19wPScnXCIrKHU/XCIsX19lPV8uZXNjYXBlXCI6XCJcIikrKG8/XCIsX19qPUFycmF5LnByb3RvdHlwZS5qb2luO2Z1bmN0aW9uIHByaW50KCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpfVwiOlwiO1wiKSthK1wicmV0dXJuIF9fcH1cIixuPVZpKGZ1bmN0aW9uKCl7cmV0dXJuIEZ1bmN0aW9uKGksbCtcInJldHVybiBcIithKS5hcHBseShULGYpfSksbi5zb3VyY2U9YSxEZShuKSl0aHJvdyBuO3JldHVybiBufSxPdC50aW1lcz1mdW5jdGlvbih0LG4pe2lmKHQ9WGUodCksMT50fHx0PjkwMDcxOTkyNTQ3NDA5OTEpcmV0dXJuW107dmFyIHI9NDI5NDk2NzI5NSxlPXRvKHQsNDI5NDk2NzI5NSk7Zm9yKG49RnIobiksdC09NDI5NDk2NzI5NSxlPW0oZSxuKTsrK3I8dDspbihyKTtyZXR1cm4gZX0sT3QudG9GaW5pdGU9UWUsT3QudG9JbnRlZ2VyPVhlLE90LnRvTGVuZ3RoPXR1LE90LnRvTG93ZXI9ZnVuY3Rpb24odCl7XG5yZXR1cm4gZXUodCkudG9Mb3dlckNhc2UoKX0sT3QudG9OdW1iZXI9bnUsT3QudG9TYWZlSW50ZWdlcj1mdW5jdGlvbih0KXtyZXR1cm4gbm4oWGUodCksLTkwMDcxOTkyNTQ3NDA5OTEsOTAwNzE5OTI1NDc0MDk5MSl9LE90LnRvU3RyaW5nPWV1LE90LnRvVXBwZXI9ZnVuY3Rpb24odCl7cmV0dXJuIGV1KHQpLnRvVXBwZXJDYXNlKCl9LE90LnRyaW09ZnVuY3Rpb24odCxuLHIpe3JldHVybih0PWV1KHQpKSYmKHJ8fG49PT1UKT90LnJlcGxhY2UoY3QsXCJcIik6dCYmKG49WW4obikpPyh0PXQubWF0Y2goSXQpLG49bi5tYXRjaChJdCksdXIodCxTKHQsbiksSSh0LG4pKzEpLmpvaW4oXCJcIikpOnR9LE90LnRyaW1FbmQ9ZnVuY3Rpb24odCxuLHIpe3JldHVybih0PWV1KHQpKSYmKHJ8fG49PT1UKT90LnJlcGxhY2UobHQsXCJcIik6dCYmKG49WW4obikpPyh0PXQubWF0Y2goSXQpLG49SSh0LG4ubWF0Y2goSXQpKSsxLHVyKHQsMCxuKS5qb2luKFwiXCIpKTp0fSxPdC50cmltU3RhcnQ9ZnVuY3Rpb24odCxuLHIpe1xucmV0dXJuKHQ9ZXUodCkpJiYocnx8bj09PVQpP3QucmVwbGFjZShhdCxcIlwiKTp0JiYobj1ZbihuKSk/KHQ9dC5tYXRjaChJdCksbj1TKHQsbi5tYXRjaChJdCkpLHVyKHQsbikuam9pbihcIlwiKSk6dH0sT3QudHJ1bmNhdGU9ZnVuY3Rpb24odCxuKXt2YXIgcj0zMCxlPVwiLi4uXCI7aWYoWmUobikpdmFyIHU9XCJzZXBhcmF0b3JcImluIG4/bi5zZXBhcmF0b3I6dSxyPVwibGVuZ3RoXCJpbiBuP1hlKG4ubGVuZ3RoKTpyLGU9XCJvbWlzc2lvblwiaW4gbj9ZbihuLm9taXNzaW9uKTplO3Q9ZXUodCk7dmFyIG89dC5sZW5ndGg7aWYoV3QudGVzdCh0KSl2YXIgaT10Lm1hdGNoKEl0KSxvPWkubGVuZ3RoO2lmKHI+PW8pcmV0dXJuIHQ7aWYobz1yLU4oZSksMT5vKXJldHVybiBlO2lmKHI9aT91cihpLDAsbykuam9pbihcIlwiKTp0LnNsaWNlKDAsbyksdT09PVQpcmV0dXJuIHIrZTtpZihpJiYobys9ci5sZW5ndGgtbyksS2UodSkpe2lmKHQuc2xpY2Uobykuc2VhcmNoKHUpKXt2YXIgZj1yO2Zvcih1Lmdsb2JhbHx8KHU9bXUodS5zb3VyY2UsZXUoX3QuZXhlYyh1KSkrXCJnXCIpKSxcbnUubGFzdEluZGV4PTA7aT11LmV4ZWMoZik7KXZhciBjPWkuaW5kZXg7cj1yLnNsaWNlKDAsYz09PVQ/bzpjKX19ZWxzZSB0LmluZGV4T2YoWW4odSksbykhPW8mJih1PXIubGFzdEluZGV4T2YodSksdT4tMSYmKHI9ci5zbGljZSgwLHUpKSk7cmV0dXJuIHIrZX0sT3QudW5lc2NhcGU9ZnVuY3Rpb24odCl7cmV0dXJuKHQ9ZXUodCkpJiZRLnRlc3QodCk/dC5yZXBsYWNlKFksUCk6dH0sT3QudW5pcXVlSWQ9ZnVuY3Rpb24odCl7dmFyIG49KytCdTtyZXR1cm4gZXUodCkrbn0sT3QudXBwZXJDYXNlPVRpLE90LnVwcGVyRmlyc3Q9cWksT3QuZWFjaD1tZSxPdC5lYWNoUmlnaHQ9QWUsT3QuZmlyc3Q9X2UsdnUoT3QsZnVuY3Rpb24oKXt2YXIgdD17fTtyZXR1cm4gaG4oT3QsZnVuY3Rpb24obixyKXtXdS5jYWxsKE90LnByb3RvdHlwZSxyKXx8KHRbcl09bil9KSx0fSgpLHtjaGFpbjpmYWxzZX0pLE90LlZFUlNJT049XCI0LjEzLjFcIix1KFwiYmluZCBiaW5kS2V5IGN1cnJ5IGN1cnJ5UmlnaHQgcGFydGlhbCBwYXJ0aWFsUmlnaHRcIi5zcGxpdChcIiBcIiksZnVuY3Rpb24odCl7XG5PdFt0XS5wbGFjZWhvbGRlcj1PdH0pLHUoW1wiZHJvcFwiLFwidGFrZVwiXSxmdW5jdGlvbih0LG4pe1V0LnByb3RvdHlwZVt0XT1mdW5jdGlvbihyKXt2YXIgZT10aGlzLl9fZmlsdGVyZWRfXztpZihlJiYhbilyZXR1cm4gbmV3IFV0KHRoaXMpO3I9cj09PVQ/MTpYdShYZShyKSwwKTt2YXIgdT10aGlzLmNsb25lKCk7cmV0dXJuIGU/dS5fX3Rha2VDb3VudF9fPXRvKHIsdS5fX3Rha2VDb3VudF9fKTp1Ll9fdmlld3NfXy5wdXNoKHtzaXplOnRvKHIsNDI5NDk2NzI5NSksdHlwZTp0KygwPnUuX19kaXJfXz9cIlJpZ2h0XCI6XCJcIil9KSx1fSxVdC5wcm90b3R5cGVbdCtcIlJpZ2h0XCJdPWZ1bmN0aW9uKG4pe3JldHVybiB0aGlzLnJldmVyc2UoKVt0XShuKS5yZXZlcnNlKCl9fSksdShbXCJmaWx0ZXJcIixcIm1hcFwiLFwidGFrZVdoaWxlXCJdLGZ1bmN0aW9uKHQsbil7dmFyIHI9bisxLGU9MT09cnx8Mz09cjtVdC5wcm90b3R5cGVbdF09ZnVuY3Rpb24odCl7dmFyIG49dGhpcy5jbG9uZSgpO3JldHVybiBuLl9faXRlcmF0ZWVzX18ucHVzaCh7XG5pdGVyYXRlZTpGcih0LDMpLHR5cGU6cn0pLG4uX19maWx0ZXJlZF9fPW4uX19maWx0ZXJlZF9ffHxlLG59fSksdShbXCJoZWFkXCIsXCJsYXN0XCJdLGZ1bmN0aW9uKHQsbil7dmFyIHI9XCJ0YWtlXCIrKG4/XCJSaWdodFwiOlwiXCIpO1V0LnByb3RvdHlwZVt0XT1mdW5jdGlvbigpe3JldHVybiB0aGlzW3JdKDEpLnZhbHVlKClbMF19fSksdShbXCJpbml0aWFsXCIsXCJ0YWlsXCJdLGZ1bmN0aW9uKHQsbil7dmFyIHI9XCJkcm9wXCIrKG4/XCJcIjpcIlJpZ2h0XCIpO1V0LnByb3RvdHlwZVt0XT1mdW5jdGlvbigpe3JldHVybiB0aGlzLl9fZmlsdGVyZWRfXz9uZXcgVXQodGhpcyk6dGhpc1tyXSgxKX19KSxVdC5wcm90b3R5cGUuY29tcGFjdD1mdW5jdGlvbigpe3JldHVybiB0aGlzLmZpbHRlcihwdSl9LFV0LnByb3RvdHlwZS5maW5kPWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLmZpbHRlcih0KS5oZWFkKCl9LFV0LnByb3RvdHlwZS5maW5kTGFzdD1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5yZXZlcnNlKCkuZmluZCh0KTtcbn0sVXQucHJvdG90eXBlLmludm9rZU1hcD1NZShmdW5jdGlvbih0LG4pe3JldHVybiB0eXBlb2YgdD09XCJmdW5jdGlvblwiP25ldyBVdCh0aGlzKTp0aGlzLm1hcChmdW5jdGlvbihyKXtyZXR1cm4gd24ocix0LG4pfSl9KSxVdC5wcm90b3R5cGUucmVqZWN0PWZ1bmN0aW9uKHQpe3JldHVybiB0PUZyKHQsMyksdGhpcy5maWx0ZXIoZnVuY3Rpb24obil7cmV0dXJuIXQobil9KX0sVXQucHJvdG90eXBlLnNsaWNlPWZ1bmN0aW9uKHQsbil7dD1YZSh0KTt2YXIgcj10aGlzO3JldHVybiByLl9fZmlsdGVyZWRfXyYmKHQ+MHx8MD5uKT9uZXcgVXQocik6KDA+dD9yPXIudGFrZVJpZ2h0KC10KTp0JiYocj1yLmRyb3AodCkpLG4hPT1UJiYobj1YZShuKSxyPTA+bj9yLmRyb3BSaWdodCgtbik6ci50YWtlKG4tdCkpLHIpfSxVdC5wcm90b3R5cGUudGFrZVJpZ2h0V2hpbGU9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMucmV2ZXJzZSgpLnRha2VXaGlsZSh0KS5yZXZlcnNlKCl9LFV0LnByb3RvdHlwZS50b0FycmF5PWZ1bmN0aW9uKCl7XG5yZXR1cm4gdGhpcy50YWtlKDQyOTQ5NjcyOTUpfSxobihVdC5wcm90b3R5cGUsZnVuY3Rpb24odCxuKXt2YXIgcj0vXig/OmZpbHRlcnxmaW5kfG1hcHxyZWplY3QpfFdoaWxlJC8udGVzdChuKSxlPS9eKD86aGVhZHxsYXN0KSQvLnRlc3QobiksdT1PdFtlP1widGFrZVwiKyhcImxhc3RcIj09bj9cIlJpZ2h0XCI6XCJcIik6bl0sbz1lfHwvXmZpbmQvLnRlc3Qobik7dSYmKE90LnByb3RvdHlwZVtuXT1mdW5jdGlvbigpe2Z1bmN0aW9uIG4odCl7cmV0dXJuIHQ9dS5hcHBseShPdCxzKFt0XSxmKSksZSYmaD90WzBdOnR9dmFyIGk9dGhpcy5fX3dyYXBwZWRfXyxmPWU/WzFdOmFyZ3VtZW50cyxjPWkgaW5zdGFuY2VvZiBVdCxhPWZbMF0sbD1jfHx5aShpKTtsJiZyJiZ0eXBlb2YgYT09XCJmdW5jdGlvblwiJiYxIT1hLmxlbmd0aCYmKGM9bD1mYWxzZSk7dmFyIGg9dGhpcy5fX2NoYWluX18scD0hIXRoaXMuX19hY3Rpb25zX18ubGVuZ3RoLGE9byYmIWgsYz1jJiYhcDtyZXR1cm4hbyYmbD8oaT1jP2k6bmV3IFV0KHRoaXMpLFxuaT10LmFwcGx5KGksZiksaS5fX2FjdGlvbnNfXy5wdXNoKHtmdW5jOmplLGFyZ3M6W25dLHRoaXNBcmc6VH0pLG5ldyB6dChpLGgpKTphJiZjP3QuYXBwbHkodGhpcyxmKTooaT10aGlzLnRocnUobiksYT9lP2kudmFsdWUoKVswXTppLnZhbHVlKCk6aSl9KX0pLHUoXCJwb3AgcHVzaCBzaGlmdCBzb3J0IHNwbGljZSB1bnNoaWZ0XCIuc3BsaXQoXCIgXCIpLGZ1bmN0aW9uKHQpe3ZhciBuPU91W3RdLHI9L14oPzpwdXNofHNvcnR8dW5zaGlmdCkkLy50ZXN0KHQpP1widGFwXCI6XCJ0aHJ1XCIsZT0vXig/OnBvcHxzaGlmdCkkLy50ZXN0KHQpO090LnByb3RvdHlwZVt0XT1mdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cztpZihlJiYhdGhpcy5fX2NoYWluX18pe3ZhciB1PXRoaXMudmFsdWUoKTtyZXR1cm4gbi5hcHBseSh5aSh1KT91OltdLHQpfXJldHVybiB0aGlzW3JdKGZ1bmN0aW9uKHIpe3JldHVybiBuLmFwcGx5KHlpKHIpP3I6W10sdCl9KX19KSxobihVdC5wcm90b3R5cGUsZnVuY3Rpb24odCxuKXtcbnZhciByPU90W25dO2lmKHIpe3ZhciBlPXIubmFtZStcIlwiOyhfb1tlXXx8KF9vW2VdPVtdKSkucHVzaCh7bmFtZTpuLGZ1bmM6cn0pfX0pLF9vW0FyKFQsMikubmFtZV09W3tuYW1lOlwid3JhcHBlclwiLGZ1bmM6VH1dLFV0LnByb3RvdHlwZS5jbG9uZT1mdW5jdGlvbigpe3ZhciB0PW5ldyBVdCh0aGlzLl9fd3JhcHBlZF9fKTtyZXR1cm4gdC5fX2FjdGlvbnNfXz1scih0aGlzLl9fYWN0aW9uc19fKSx0Ll9fZGlyX189dGhpcy5fX2Rpcl9fLHQuX19maWx0ZXJlZF9fPXRoaXMuX19maWx0ZXJlZF9fLHQuX19pdGVyYXRlZXNfXz1scih0aGlzLl9faXRlcmF0ZWVzX18pLHQuX190YWtlQ291bnRfXz10aGlzLl9fdGFrZUNvdW50X18sdC5fX3ZpZXdzX189bHIodGhpcy5fX3ZpZXdzX18pLHR9LFV0LnByb3RvdHlwZS5yZXZlcnNlPWZ1bmN0aW9uKCl7aWYodGhpcy5fX2ZpbHRlcmVkX18pe3ZhciB0PW5ldyBVdCh0aGlzKTt0Ll9fZGlyX189LTEsdC5fX2ZpbHRlcmVkX189dHJ1ZX1lbHNlIHQ9dGhpcy5jbG9uZSgpLFxudC5fX2Rpcl9fKj0tMTtyZXR1cm4gdH0sVXQucHJvdG90eXBlLnZhbHVlPWZ1bmN0aW9uKCl7dmFyIHQsbj10aGlzLl9fd3JhcHBlZF9fLnZhbHVlKCkscj10aGlzLl9fZGlyX18sZT15aShuKSx1PTA+cixvPWU/bi5sZW5ndGg6MDt0PW87Zm9yKHZhciBpPXRoaXMuX192aWV3c19fLGY9MCxjPS0xLGE9aS5sZW5ndGg7KytjPGE7KXt2YXIgbD1pW2NdLHM9bC5zaXplO3N3aXRjaChsLnR5cGUpe2Nhc2VcImRyb3BcIjpmKz1zO2JyZWFrO2Nhc2VcImRyb3BSaWdodFwiOnQtPXM7YnJlYWs7Y2FzZVwidGFrZVwiOnQ9dG8odCxmK3MpO2JyZWFrO2Nhc2VcInRha2VSaWdodFwiOmY9WHUoZix0LXMpfX1pZih0PXtzdGFydDpmLGVuZDp0fSxpPXQuc3RhcnQsZj10LmVuZCx0PWYtaSx1PXU/ZjppLTEsaT10aGlzLl9faXRlcmF0ZWVzX18sZj1pLmxlbmd0aCxjPTAsYT10byh0LHRoaXMuX190YWtlQ291bnRfXyksIWV8fDIwMD5vfHxvPT10JiZhPT10KXJldHVybiBYbihuLHRoaXMuX19hY3Rpb25zX18pO2U9W107XG50OmZvcig7dC0tJiZhPmM7KXtmb3IodSs9cixvPS0xLGw9blt1XTsrK288Zjspe3ZhciBoPWlbb10scz1oLnR5cGUsaD0oMCxoLml0ZXJhdGVlKShsKTtpZigyPT1zKWw9aDtlbHNlIGlmKCFoKXtpZigxPT1zKWNvbnRpbnVlIHQ7YnJlYWsgdH19ZVtjKytdPWx9cmV0dXJuIGV9LE90LnByb3RvdHlwZS5hdD1YbyxPdC5wcm90b3R5cGUuY2hhaW49ZnVuY3Rpb24oKXtyZXR1cm4geGUodGhpcyl9LE90LnByb3RvdHlwZS5jb21taXQ9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IHp0KHRoaXMudmFsdWUoKSx0aGlzLl9fY2hhaW5fXyl9LE90LnByb3RvdHlwZS5uZXh0PWZ1bmN0aW9uKCl7dGhpcy5fX3ZhbHVlc19fPT09VCYmKHRoaXMuX192YWx1ZXNfXz1IZSh0aGlzLnZhbHVlKCkpKTt2YXIgdD10aGlzLl9faW5kZXhfXz49dGhpcy5fX3ZhbHVlc19fLmxlbmd0aCxuPXQ/VDp0aGlzLl9fdmFsdWVzX19bdGhpcy5fX2luZGV4X18rK107cmV0dXJue2RvbmU6dCx2YWx1ZTpufX0sT3QucHJvdG90eXBlLnBsYW50PWZ1bmN0aW9uKHQpe1xuZm9yKHZhciBuLHI9dGhpcztyIGluc3RhbmNlb2Yga3Q7KXt2YXIgZT1hZShyKTtlLl9faW5kZXhfXz0wLGUuX192YWx1ZXNfXz1ULG4/dS5fX3dyYXBwZWRfXz1lOm49ZTt2YXIgdT1lLHI9ci5fX3dyYXBwZWRfX31yZXR1cm4gdS5fX3dyYXBwZWRfXz10LG59LE90LnByb3RvdHlwZS5yZXZlcnNlPWZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5fX3dyYXBwZWRfXztyZXR1cm4gdCBpbnN0YW5jZW9mIFV0Pyh0aGlzLl9fYWN0aW9uc19fLmxlbmd0aCYmKHQ9bmV3IFV0KHRoaXMpKSx0PXQucmV2ZXJzZSgpLHQuX19hY3Rpb25zX18ucHVzaCh7ZnVuYzpqZSxhcmdzOltkZV0sdGhpc0FyZzpUfSksbmV3IHp0KHQsdGhpcy5fX2NoYWluX18pKTp0aGlzLnRocnUoZGUpfSxPdC5wcm90b3R5cGUudG9KU09OPU90LnByb3RvdHlwZS52YWx1ZU9mPU90LnByb3RvdHlwZS52YWx1ZT1mdW5jdGlvbigpe3JldHVybiBYbih0aGlzLl9fd3JhcHBlZF9fLHRoaXMuX19hY3Rpb25zX18pfSxadSYmKE90LnByb3RvdHlwZVtadV09d2UpLFxuT3R9dmFyIFQscT0xLzAsVj1OYU4sSz0vXFxiX19wXFwrPScnOy9nLEc9L1xcYihfX3BcXCs9KScnXFwrL2csSj0vKF9fZVxcKC4qP1xcKXxcXGJfX3RcXCkpXFwrJyc7L2csWT0vJig/OmFtcHxsdHxndHxxdW90fCMzOXwjOTYpOy9nLEg9L1smPD5cIidgXS9nLFE9UmVnRXhwKFkuc291cmNlKSxYPVJlZ0V4cChILnNvdXJjZSksdHQ9LzwlLShbXFxzXFxTXSs/KSU+L2csbnQ9LzwlKFtcXHNcXFNdKz8pJT4vZyxydD0vPCU9KFtcXHNcXFNdKz8pJT4vZyxldD0vXFwufFxcWyg/OlteW1xcXV0qfChbXCInXSkoPzooPyFcXDEpW15cXFxcXXxcXFxcLikqP1xcMSlcXF0vLHV0PS9eXFx3KiQvLG90PS9bXi5bXFxdXSt8XFxbKD86KC0/XFxkKyg/OlxcLlxcZCspPyl8KFtcIiddKSgoPzooPyFcXDIpW15cXFxcXXxcXFxcLikqPylcXDIpXFxdfCg/PShcXC58XFxbXFxdKSg/OlxcNHwkKSkvZyxpdD0vW1xcXFxeJC4qKz8oKVtcXF17fXxdL2csZnQ9UmVnRXhwKGl0LnNvdXJjZSksY3Q9L15cXHMrfFxccyskL2csYXQ9L15cXHMrLyxsdD0vXFxzKyQvLHN0PS9bYS16QS1aMC05XSsvZyxodD0vXFxcXChcXFxcKT8vZyxwdD0vXFwkXFx7KFteXFxcXH1dKig/OlxcXFwuW15cXFxcfV0qKSopXFx9L2csX3Q9L1xcdyokLyx2dD0vXjB4L2ksZ3Q9L15bLStdMHhbMC05YS1mXSskL2ksZHQ9L14wYlswMV0rJC9pLHl0PS9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC8sYnQ9L14wb1swLTddKyQvaSx4dD0vXig/OjB8WzEtOV1cXGQqKSQvLGp0PS9bXFx4YzAtXFx4ZDZcXHhkOC1cXHhkZVxceGRmLVxceGY2XFx4ZjgtXFx4ZmZdL2csd3Q9LygkXikvLG10PS9bJ1xcblxcclxcdTIwMjhcXHUyMDI5XFxcXF0vZyxBdD1cIltcXFxcdWZlMGVcXFxcdWZlMGZdPyg/OltcXFxcdTAzMDAtXFxcXHUwMzZmXFxcXHVmZTIwLVxcXFx1ZmUyM1xcXFx1MjBkMC1cXFxcdTIwZjBdfFxcXFx1ZDgzY1tcXFxcdWRmZmItXFxcXHVkZmZmXSk/KD86XFxcXHUyMDBkKD86W15cXFxcdWQ4MDAtXFxcXHVkZmZmXXwoPzpcXFxcdWQ4M2NbXFxcXHVkZGU2LVxcXFx1ZGRmZl0pezJ9fFtcXFxcdWQ4MDAtXFxcXHVkYmZmXVtcXFxcdWRjMDAtXFxcXHVkZmZmXSlbXFxcXHVmZTBlXFxcXHVmZTBmXT8oPzpbXFxcXHUwMzAwLVxcXFx1MDM2ZlxcXFx1ZmUyMC1cXFxcdWZlMjNcXFxcdTIwZDAtXFxcXHUyMGYwXXxcXFxcdWQ4M2NbXFxcXHVkZmZiLVxcXFx1ZGZmZl0pPykqXCIsT3Q9XCIoPzpbXFxcXHUyNzAwLVxcXFx1MjdiZl18KD86XFxcXHVkODNjW1xcXFx1ZGRlNi1cXFxcdWRkZmZdKXsyfXxbXFxcXHVkODAwLVxcXFx1ZGJmZl1bXFxcXHVkYzAwLVxcXFx1ZGZmZl0pXCIrQXQsa3Q9XCIoPzpbXlxcXFx1ZDgwMC1cXFxcdWRmZmZdW1xcXFx1MDMwMC1cXFxcdTAzNmZcXFxcdWZlMjAtXFxcXHVmZTIzXFxcXHUyMGQwLVxcXFx1MjBmMF0/fFtcXFxcdTAzMDAtXFxcXHUwMzZmXFxcXHVmZTIwLVxcXFx1ZmUyM1xcXFx1MjBkMC1cXFxcdTIwZjBdfCg/OlxcXFx1ZDgzY1tcXFxcdWRkZTYtXFxcXHVkZGZmXSl7Mn18W1xcXFx1ZDgwMC1cXFxcdWRiZmZdW1xcXFx1ZGMwMC1cXFxcdWRmZmZdfFtcXFxcdWQ4MDAtXFxcXHVkZmZmXSlcIixFdD1SZWdFeHAoXCJbJ1xcdTIwMTldXCIsXCJnXCIpLFN0PVJlZ0V4cChcIltcXFxcdTAzMDAtXFxcXHUwMzZmXFxcXHVmZTIwLVxcXFx1ZmUyM1xcXFx1MjBkMC1cXFxcdTIwZjBdXCIsXCJnXCIpLEl0PVJlZ0V4cChcIlxcXFx1ZDgzY1tcXFxcdWRmZmItXFxcXHVkZmZmXSg/PVxcXFx1ZDgzY1tcXFxcdWRmZmItXFxcXHVkZmZmXSl8XCIra3QrQXQsXCJnXCIpLFJ0PVJlZ0V4cChbXCJbQS1aXFxcXHhjMC1cXFxceGQ2XFxcXHhkOC1cXFxceGRlXT9bYS16XFxcXHhkZi1cXFxceGY2XFxcXHhmOC1cXFxceGZmXSsoPzpbJ1xcdTIwMTldKD86ZHxsbHxtfHJlfHN8dHx2ZSkpPyg/PVtcXFxceGFjXFxcXHhiMVxcXFx4ZDdcXFxceGY3XFxcXHgwMC1cXFxceDJmXFxcXHgzYS1cXFxceDQwXFxcXHg1Yi1cXFxceDYwXFxcXHg3Yi1cXFxceGJmXFxcXHUyMDAwLVxcXFx1MjA2ZiBcXFxcdFxcXFx4MGJcXFxcZlxcXFx4YTBcXFxcdWZlZmZcXFxcblxcXFxyXFxcXHUyMDI4XFxcXHUyMDI5XFxcXHUxNjgwXFxcXHUxODBlXFxcXHUyMDAwXFxcXHUyMDAxXFxcXHUyMDAyXFxcXHUyMDAzXFxcXHUyMDA0XFxcXHUyMDA1XFxcXHUyMDA2XFxcXHUyMDA3XFxcXHUyMDA4XFxcXHUyMDA5XFxcXHUyMDBhXFxcXHUyMDJmXFxcXHUyMDVmXFxcXHUzMDAwXXxbQS1aXFxcXHhjMC1cXFxceGQ2XFxcXHhkOC1cXFxceGRlXXwkKXwoPzpbQS1aXFxcXHhjMC1cXFxceGQ2XFxcXHhkOC1cXFxceGRlXXxbXlxcXFx1ZDgwMC1cXFxcdWRmZmZcXFxceGFjXFxcXHhiMVxcXFx4ZDdcXFxceGY3XFxcXHgwMC1cXFxceDJmXFxcXHgzYS1cXFxceDQwXFxcXHg1Yi1cXFxceDYwXFxcXHg3Yi1cXFxceGJmXFxcXHUyMDAwLVxcXFx1MjA2ZiBcXFxcdFxcXFx4MGJcXFxcZlxcXFx4YTBcXFxcdWZlZmZcXFxcblxcXFxyXFxcXHUyMDI4XFxcXHUyMDI5XFxcXHUxNjgwXFxcXHUxODBlXFxcXHUyMDAwXFxcXHUyMDAxXFxcXHUyMDAyXFxcXHUyMDAzXFxcXHUyMDA0XFxcXHUyMDA1XFxcXHUyMDA2XFxcXHUyMDA3XFxcXHUyMDA4XFxcXHUyMDA5XFxcXHUyMDBhXFxcXHUyMDJmXFxcXHUyMDVmXFxcXHUzMDAwXFxcXGQrXFxcXHUyNzAwLVxcXFx1MjdiZmEtelxcXFx4ZGYtXFxcXHhmNlxcXFx4ZjgtXFxcXHhmZkEtWlxcXFx4YzAtXFxcXHhkNlxcXFx4ZDgtXFxcXHhkZV0pKyg/OlsnXFx1MjAxOV0oPzpEfExMfE18UkV8U3xUfFZFKSk/KD89W1xcXFx4YWNcXFxceGIxXFxcXHhkN1xcXFx4ZjdcXFxceDAwLVxcXFx4MmZcXFxceDNhLVxcXFx4NDBcXFxceDViLVxcXFx4NjBcXFxceDdiLVxcXFx4YmZcXFxcdTIwMDAtXFxcXHUyMDZmIFxcXFx0XFxcXHgwYlxcXFxmXFxcXHhhMFxcXFx1ZmVmZlxcXFxuXFxcXHJcXFxcdTIwMjhcXFxcdTIwMjlcXFxcdTE2ODBcXFxcdTE4MGVcXFxcdTIwMDBcXFxcdTIwMDFcXFxcdTIwMDJcXFxcdTIwMDNcXFxcdTIwMDRcXFxcdTIwMDVcXFxcdTIwMDZcXFxcdTIwMDdcXFxcdTIwMDhcXFxcdTIwMDlcXFxcdTIwMGFcXFxcdTIwMmZcXFxcdTIwNWZcXFxcdTMwMDBdfFtBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdKD86W2EtelxcXFx4ZGYtXFxcXHhmNlxcXFx4ZjgtXFxcXHhmZl18W15cXFxcdWQ4MDAtXFxcXHVkZmZmXFxcXHhhY1xcXFx4YjFcXFxceGQ3XFxcXHhmN1xcXFx4MDAtXFxcXHgyZlxcXFx4M2EtXFxcXHg0MFxcXFx4NWItXFxcXHg2MFxcXFx4N2ItXFxcXHhiZlxcXFx1MjAwMC1cXFxcdTIwNmYgXFxcXHRcXFxceDBiXFxcXGZcXFxceGEwXFxcXHVmZWZmXFxcXG5cXFxcclxcXFx1MjAyOFxcXFx1MjAyOVxcXFx1MTY4MFxcXFx1MTgwZVxcXFx1MjAwMFxcXFx1MjAwMVxcXFx1MjAwMlxcXFx1MjAwM1xcXFx1MjAwNFxcXFx1MjAwNVxcXFx1MjAwNlxcXFx1MjAwN1xcXFx1MjAwOFxcXFx1MjAwOVxcXFx1MjAwYVxcXFx1MjAyZlxcXFx1MjA1ZlxcXFx1MzAwMFxcXFxkK1xcXFx1MjcwMC1cXFxcdTI3YmZhLXpcXFxceGRmLVxcXFx4ZjZcXFxceGY4LVxcXFx4ZmZBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdKXwkKXxbQS1aXFxcXHhjMC1cXFxceGQ2XFxcXHhkOC1cXFxceGRlXT8oPzpbYS16XFxcXHhkZi1cXFxceGY2XFxcXHhmOC1cXFxceGZmXXxbXlxcXFx1ZDgwMC1cXFxcdWRmZmZcXFxceGFjXFxcXHhiMVxcXFx4ZDdcXFxceGY3XFxcXHgwMC1cXFxceDJmXFxcXHgzYS1cXFxceDQwXFxcXHg1Yi1cXFxceDYwXFxcXHg3Yi1cXFxceGJmXFxcXHUyMDAwLVxcXFx1MjA2ZiBcXFxcdFxcXFx4MGJcXFxcZlxcXFx4YTBcXFxcdWZlZmZcXFxcblxcXFxyXFxcXHUyMDI4XFxcXHUyMDI5XFxcXHUxNjgwXFxcXHUxODBlXFxcXHUyMDAwXFxcXHUyMDAxXFxcXHUyMDAyXFxcXHUyMDAzXFxcXHUyMDA0XFxcXHUyMDA1XFxcXHUyMDA2XFxcXHUyMDA3XFxcXHUyMDA4XFxcXHUyMDA5XFxcXHUyMDBhXFxcXHUyMDJmXFxcXHUyMDVmXFxcXHUzMDAwXFxcXGQrXFxcXHUyNzAwLVxcXFx1MjdiZmEtelxcXFx4ZGYtXFxcXHhmNlxcXFx4ZjgtXFxcXHhmZkEtWlxcXFx4YzAtXFxcXHhkNlxcXFx4ZDgtXFxcXHhkZV0pKyg/OlsnXFx1MjAxOV0oPzpkfGxsfG18cmV8c3x0fHZlKSk/fFtBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdKyg/OlsnXFx1MjAxOV0oPzpEfExMfE18UkV8U3xUfFZFKSk/fFxcXFxkK1wiLE90XS5qb2luKFwifFwiKSxcImdcIiksV3Q9UmVnRXhwKFwiW1xcXFx1MjAwZFxcXFx1ZDgwMC1cXFxcdWRmZmZcXFxcdTAzMDAtXFxcXHUwMzZmXFxcXHVmZTIwLVxcXFx1ZmUyM1xcXFx1MjBkMC1cXFxcdTIwZjBcXFxcdWZlMGVcXFxcdWZlMGZdXCIpLEJ0PS9bYS16XVtBLVpdfFtBLVpdezIsfVthLXpdfFswLTldW2EtekEtWl18W2EtekEtWl1bMC05XXxbXmEtekEtWjAtOSBdLyxMdD1cIkFycmF5IEJ1ZmZlciBEYXRhVmlldyBEYXRlIEVycm9yIEZsb2F0MzJBcnJheSBGbG9hdDY0QXJyYXkgRnVuY3Rpb24gSW50OEFycmF5IEludDE2QXJyYXkgSW50MzJBcnJheSBNYXAgTWF0aCBPYmplY3QgUHJvbWlzZSBSZWZsZWN0IFJlZ0V4cCBTZXQgU3RyaW5nIFN5bWJvbCBUeXBlRXJyb3IgVWludDhBcnJheSBVaW50OENsYW1wZWRBcnJheSBVaW50MTZBcnJheSBVaW50MzJBcnJheSBXZWFrTWFwIF8gaXNGaW5pdGUgcGFyc2VJbnQgc2V0VGltZW91dFwiLnNwbGl0KFwiIFwiKSxNdD17fTtcbk10W1wiW29iamVjdCBGbG9hdDMyQXJyYXldXCJdPU10W1wiW29iamVjdCBGbG9hdDY0QXJyYXldXCJdPU10W1wiW29iamVjdCBJbnQ4QXJyYXldXCJdPU10W1wiW29iamVjdCBJbnQxNkFycmF5XVwiXT1NdFtcIltvYmplY3QgSW50MzJBcnJheV1cIl09TXRbXCJbb2JqZWN0IFVpbnQ4QXJyYXldXCJdPU10W1wiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIl09TXRbXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiXT1NdFtcIltvYmplY3QgVWludDMyQXJyYXldXCJdPXRydWUsTXRbXCJbb2JqZWN0IEFyZ3VtZW50c11cIl09TXRbXCJbb2JqZWN0IEFycmF5XVwiXT1NdFtcIltvYmplY3QgQXJyYXlCdWZmZXJdXCJdPU10W1wiW29iamVjdCBCb29sZWFuXVwiXT1NdFtcIltvYmplY3QgRGF0YVZpZXddXCJdPU10W1wiW29iamVjdCBEYXRlXVwiXT1NdFtcIltvYmplY3QgRXJyb3JdXCJdPU10W1wiW29iamVjdCBGdW5jdGlvbl1cIl09TXRbXCJbb2JqZWN0IE1hcF1cIl09TXRbXCJbb2JqZWN0IE51bWJlcl1cIl09TXRbXCJbb2JqZWN0IE9iamVjdF1cIl09TXRbXCJbb2JqZWN0IFJlZ0V4cF1cIl09TXRbXCJbb2JqZWN0IFNldF1cIl09TXRbXCJbb2JqZWN0IFN0cmluZ11cIl09TXRbXCJbb2JqZWN0IFdlYWtNYXBdXCJdPWZhbHNlO1xudmFyIEN0PXt9O0N0W1wiW29iamVjdCBBcmd1bWVudHNdXCJdPUN0W1wiW29iamVjdCBBcnJheV1cIl09Q3RbXCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiXT1DdFtcIltvYmplY3QgRGF0YVZpZXddXCJdPUN0W1wiW29iamVjdCBCb29sZWFuXVwiXT1DdFtcIltvYmplY3QgRGF0ZV1cIl09Q3RbXCJbb2JqZWN0IEZsb2F0MzJBcnJheV1cIl09Q3RbXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIl09Q3RbXCJbb2JqZWN0IEludDhBcnJheV1cIl09Q3RbXCJbb2JqZWN0IEludDE2QXJyYXldXCJdPUN0W1wiW29iamVjdCBJbnQzMkFycmF5XVwiXT1DdFtcIltvYmplY3QgTWFwXVwiXT1DdFtcIltvYmplY3QgTnVtYmVyXVwiXT1DdFtcIltvYmplY3QgT2JqZWN0XVwiXT1DdFtcIltvYmplY3QgUmVnRXhwXVwiXT1DdFtcIltvYmplY3QgU2V0XVwiXT1DdFtcIltvYmplY3QgU3RyaW5nXVwiXT1DdFtcIltvYmplY3QgU3ltYm9sXVwiXT1DdFtcIltvYmplY3QgVWludDhBcnJheV1cIl09Q3RbXCJbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XVwiXT1DdFtcIltvYmplY3QgVWludDE2QXJyYXldXCJdPUN0W1wiW29iamVjdCBVaW50MzJBcnJheV1cIl09dHJ1ZSxcbkN0W1wiW29iamVjdCBFcnJvcl1cIl09Q3RbXCJbb2JqZWN0IEZ1bmN0aW9uXVwiXT1DdFtcIltvYmplY3QgV2Vha01hcF1cIl09ZmFsc2U7dmFyIHp0PXtcIlxceGMwXCI6XCJBXCIsXCJcXHhjMVwiOlwiQVwiLFwiXFx4YzJcIjpcIkFcIixcIlxceGMzXCI6XCJBXCIsXCJcXHhjNFwiOlwiQVwiLFwiXFx4YzVcIjpcIkFcIixcIlxceGUwXCI6XCJhXCIsXCJcXHhlMVwiOlwiYVwiLFwiXFx4ZTJcIjpcImFcIixcIlxceGUzXCI6XCJhXCIsXCJcXHhlNFwiOlwiYVwiLFwiXFx4ZTVcIjpcImFcIixcIlxceGM3XCI6XCJDXCIsXCJcXHhlN1wiOlwiY1wiLFwiXFx4ZDBcIjpcIkRcIixcIlxceGYwXCI6XCJkXCIsXCJcXHhjOFwiOlwiRVwiLFwiXFx4YzlcIjpcIkVcIixcIlxceGNhXCI6XCJFXCIsXCJcXHhjYlwiOlwiRVwiLFwiXFx4ZThcIjpcImVcIixcIlxceGU5XCI6XCJlXCIsXCJcXHhlYVwiOlwiZVwiLFwiXFx4ZWJcIjpcImVcIixcIlxceGNjXCI6XCJJXCIsXCJcXHhjZFwiOlwiSVwiLFwiXFx4Y2VcIjpcIklcIixcIlxceGNmXCI6XCJJXCIsXCJcXHhlY1wiOlwiaVwiLFwiXFx4ZWRcIjpcImlcIixcIlxceGVlXCI6XCJpXCIsXCJcXHhlZlwiOlwiaVwiLFwiXFx4ZDFcIjpcIk5cIixcIlxceGYxXCI6XCJuXCIsXCJcXHhkMlwiOlwiT1wiLFwiXFx4ZDNcIjpcIk9cIixcIlxceGQ0XCI6XCJPXCIsXCJcXHhkNVwiOlwiT1wiLFwiXFx4ZDZcIjpcIk9cIixcblwiXFx4ZDhcIjpcIk9cIixcIlxceGYyXCI6XCJvXCIsXCJcXHhmM1wiOlwib1wiLFwiXFx4ZjRcIjpcIm9cIixcIlxceGY1XCI6XCJvXCIsXCJcXHhmNlwiOlwib1wiLFwiXFx4ZjhcIjpcIm9cIixcIlxceGQ5XCI6XCJVXCIsXCJcXHhkYVwiOlwiVVwiLFwiXFx4ZGJcIjpcIlVcIixcIlxceGRjXCI6XCJVXCIsXCJcXHhmOVwiOlwidVwiLFwiXFx4ZmFcIjpcInVcIixcIlxceGZiXCI6XCJ1XCIsXCJcXHhmY1wiOlwidVwiLFwiXFx4ZGRcIjpcIllcIixcIlxceGZkXCI6XCJ5XCIsXCJcXHhmZlwiOlwieVwiLFwiXFx4YzZcIjpcIkFlXCIsXCJcXHhlNlwiOlwiYWVcIixcIlxceGRlXCI6XCJUaFwiLFwiXFx4ZmVcIjpcInRoXCIsXCJcXHhkZlwiOlwic3NcIn0sVXQ9e1wiJlwiOlwiJmFtcDtcIixcIjxcIjpcIiZsdDtcIixcIj5cIjpcIiZndDtcIiwnXCInOlwiJnF1b3Q7XCIsXCInXCI6XCImIzM5O1wiLFwiYFwiOlwiJiM5NjtcIn0sJHQ9e1wiJmFtcDtcIjpcIiZcIixcIiZsdDtcIjpcIjxcIixcIiZndDtcIjpcIj5cIixcIiZxdW90O1wiOidcIicsXCImIzM5O1wiOlwiJ1wiLFwiJiM5NjtcIjpcImBcIn0sRHQ9e1wiXFxcXFwiOlwiXFxcXFwiLFwiJ1wiOlwiJ1wiLFwiXFxuXCI6XCJuXCIsXCJcXHJcIjpcInJcIixcIlxcdTIwMjhcIjpcInUyMDI4XCIsXCJcXHUyMDI5XCI6XCJ1MjAyOVwifSxGdD1wYXJzZUZsb2F0LE50PXBhcnNlSW50LFB0PXR5cGVvZiBleHBvcnRzPT1cIm9iamVjdFwiJiZleHBvcnRzLFp0PVB0JiZ0eXBlb2YgbW9kdWxlPT1cIm9iamVjdFwiJiZtb2R1bGUsVHQ9WnQmJlp0LmV4cG9ydHM9PT1QdCxxdD1SKHR5cGVvZiBzZWxmPT1cIm9iamVjdFwiJiZzZWxmKSxWdD1SKHR5cGVvZiB0aGlzPT1cIm9iamVjdFwiJiZ0aGlzKSxLdD1SKHR5cGVvZiBnbG9iYWw9PVwib2JqZWN0XCImJmdsb2JhbCl8fHF0fHxWdHx8RnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpLEd0PVooKTtcbihxdHx8e30pLl89R3QsdHlwZW9mIGRlZmluZT09XCJmdW5jdGlvblwiJiZ0eXBlb2YgZGVmaW5lLmFtZD09XCJvYmplY3RcIiYmZGVmaW5lLmFtZD8gZGVmaW5lKGZ1bmN0aW9uKCl7cmV0dXJuIEd0fSk6WnQ/KChadC5leHBvcnRzPUd0KS5fPUd0LFB0Ll89R3QpOkt0Ll89R3R9KS5jYWxsKHRoaXMpOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbihmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgfVxuICB9XG4gIHRyeSB7XG4gICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaXMgbm90IGRlZmluZWQnKTtcbiAgICB9XG4gIH1cbn0gKCkpXG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBjYWNoZWRTZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjYWNoZWRDbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLypcblx0VGhpcyBpcyByb3QuanMsIHRoZSBST2d1ZWxpa2UgVG9vbGtpdCBpbiBKYXZhU2NyaXB0LlxuXHRWZXJzaW9uIDAuNn5kZXYsIGdlbmVyYXRlZCBvbiBNb24gTm92IDMwIDEwOjM0OjQyIENFVCAyMDE1LlxuKi9cbi8qKlxuICogQWRkIG9iamVjdHMgZm9yIE5vZGUuanMgZW52aXJvbm1lbnRcbiAqL1xuZ2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNiKSB7XG5cdHJldHVybiBzZXRUaW1lb3V0KGNiLCAxMDAwLzYwKTtcbn07XG5cbmdsb2JhbC5kb2N1bWVudCA9IHtcblx0Ym9keToge1xuXHRcdGFwcGVuZENoaWxkOiBmdW5jdGlvbihjaGlsZCkge30sXG5cdFx0c2Nyb2xsTGVmdDogMCxcblx0XHRzY3JvbGxUb3A6IDBcblx0fSxcblx0Y3JlYXRlRWxlbWVudDogZnVuY3Rpb24odHlwZSkge1xuXHRcdHZhciBjYW52YXM7XG5cdFx0cmV0dXJuIGNhbnZhcyA9IHtcblx0XHRcdGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciByZWN0O1xuXHRcdFx0XHRyZXR1cm4gcmVjdCA9IHtcblx0XHRcdFx0XHRsZWZ0OiAwLFxuXHRcdFx0XHRcdHRvcDogMFxuXHRcdFx0XHR9O1xuXHRcdFx0fSxcblx0XHRcdGdldENvbnRleHQ6IGZ1bmN0aW9uKHR5cGUpIHtcblx0XHRcdFx0dmFyIGNvbnRleHQ7XG5cdFx0XHRcdHJldHVybiBjb250ZXh0ID0ge1xuXHRcdFx0XHRcdF90ZXJtY29sb3I6IG51bGwsXG5cdFx0XHRcdFx0YmVnaW5QYXRoOiBmdW5jdGlvbigpIHt9LFxuXHRcdFx0XHRcdGNhbnZhczogY2FudmFzLFxuXHRcdFx0XHRcdGNsZWFyUmVjdDogZnVuY3Rpb24oeCwgeSwgdywgaCkge1xuXHRcdFx0XHRcdFx0aWYodGhpcy5fdGVybWNvbG9yICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBjbGVhckNtZCA9IHRoaXMuX3Rlcm1jb2xvci5jbGVhclRvQW5zaSh0aGlzLmZpbGxTdHlsZSk7XG5cdFx0XHRcdFx0XHRcdHByb2Nlc3Muc3Rkb3V0LndyaXRlKGNsZWFyQ21kKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGRyYXdJbWFnZTogZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaSkge30sXG5cdFx0XHRcdFx0ZmlsbDogZnVuY3Rpb24oKSB7fSxcblx0XHRcdFx0XHRmaWxsUmVjdDogZnVuY3Rpb24oeCwgeSwgdywgaCkge1xuXHRcdFx0XHRcdFx0aWYodGhpcy5fdGVybWNvbG9yICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBjbGVhckNtZCA9IHRoaXMuX3Rlcm1jb2xvci5jbGVhclRvQW5zaSh0aGlzLmZpbGxTdHlsZSk7XG5cdFx0XHRcdFx0XHRcdHByb2Nlc3Muc3Rkb3V0LndyaXRlKGNsZWFyQ21kKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGZpbGxTdHlsZTogXCIjMDAwXCIsXG5cdFx0XHRcdFx0ZmlsbFRleHQ6IGZ1bmN0aW9uKGNocywgeCwgeSkge30sXG5cdFx0XHRcdFx0Zm9udDogXCJtb25vc3BhY2VcIixcblx0XHRcdFx0XHRsaW5lVG86IGZ1bmN0aW9uKHgsIHkpIHt9LFxuXHRcdFx0XHRcdG1lYXN1cmVUZXh0OiBmdW5jdGlvbihjaCkge1xuXHRcdFx0XHRcdFx0dmFyIHJlc3VsdDtcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQgPSB7XG5cdFx0XHRcdFx0XHRcdHdpZHRoOiAxMlxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG1vdmVUbzogZnVuY3Rpb24oeCwgeSkge30sXG5cdFx0XHRcdFx0dGV4dEFsaWduOiBcImNlbnRlclwiLFxuXHRcdFx0XHRcdHRleHRCYXNlbGluZTogXCJtaWRkbGVcIlxuXHRcdFx0XHR9O1xuXHRcdFx0fSxcblx0XHRcdGhlaWdodDogMCxcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGxlZnQ6IFwiMTAwcHhcIixcblx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0dG9wOiBcIjEwMHB4XCIsXG5cdFx0XHRcdHZpc2liaWxpdHk6IFwiaGlkZGVuXCJcblx0XHRcdH0sXG5cdFx0XHR3aWR0aDogMFxuXHRcdH07XG5cdH0sXG5cdGRvY3VtZW50RWxlbWVudDoge1xuXHRcdHNjcm9sbExlZnQ6IDAsXG5cdFx0c2Nyb2xsVG9wOiAwXG5cdH1cbn07XG4vKipcbiAqIEBuYW1lc3BhY2UgVG9wLWxldmVsIFJPVCBuYW1lc3BhY2VcbiAqL1xudmFyIFJPVCA9IHtcblx0LyoqXG5cdCAqIEByZXR1cm5zIHtib29sfSBJcyByb3QuanMgc3VwcG9ydGVkIGJ5IHRoaXMgYnJvd3Nlcj9cblx0ICovXG5cdGlzU3VwcG9ydGVkOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gISEoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKS5nZXRDb250ZXh0ICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKTtcblx0fSxcblxuXHQvKiogRGVmYXVsdCB3aXRoIGZvciBkaXNwbGF5IGFuZCBtYXAgZ2VuZXJhdG9ycyAqL1xuXHRERUZBVUxUX1dJRFRIOiA4MCxcblx0LyoqIERlZmF1bHQgaGVpZ2h0IGZvciBkaXNwbGF5IGFuZCBtYXAgZ2VuZXJhdG9ycyAqL1xuXHRERUZBVUxUX0hFSUdIVDogMjUsXG5cblx0LyoqIERpcmVjdGlvbmFsIGNvbnN0YW50cy4gT3JkZXJpbmcgaXMgaW1wb3J0YW50ISAqL1xuXHRESVJTOiB7XG5cdFx0XCI0XCI6IFtcblx0XHRcdFsgMCwgLTFdLFxuXHRcdFx0WyAxLCAgMF0sXG5cdFx0XHRbIDAsICAxXSxcblx0XHRcdFstMSwgIDBdXG5cdFx0XSxcblx0XHRcIjhcIjogW1xuXHRcdFx0WyAwLCAtMV0sXG5cdFx0XHRbIDEsIC0xXSxcblx0XHRcdFsgMSwgIDBdLFxuXHRcdFx0WyAxLCAgMV0sXG5cdFx0XHRbIDAsICAxXSxcblx0XHRcdFstMSwgIDFdLFxuXHRcdFx0Wy0xLCAgMF0sXG5cdFx0XHRbLTEsIC0xXVxuXHRcdF0sXG5cdFx0XCI2XCI6IFtcblx0XHRcdFstMSwgLTFdLFxuXHRcdFx0WyAxLCAtMV0sXG5cdFx0XHRbIDIsICAwXSxcblx0XHRcdFsgMSwgIDFdLFxuXHRcdFx0Wy0xLCAgMV0sXG5cdFx0XHRbLTIsICAwXVxuXHRcdF1cblx0fSxcblxuXHQvKiogQ2FuY2VsIGtleS4gKi9cblx0VktfQ0FOQ0VMOiAzLCBcblx0LyoqIEhlbHAga2V5LiAqL1xuXHRWS19IRUxQOiA2LCBcblx0LyoqIEJhY2tzcGFjZSBrZXkuICovXG5cdFZLX0JBQ0tfU1BBQ0U6IDgsIFxuXHQvKiogVGFiIGtleS4gKi9cblx0VktfVEFCOiA5LCBcblx0LyoqIDUga2V5IG9uIE51bXBhZCB3aGVuIE51bUxvY2sgaXMgdW5sb2NrZWQuIE9yIG9uIE1hYywgY2xlYXIga2V5IHdoaWNoIGlzIHBvc2l0aW9uZWQgYXQgTnVtTG9jayBrZXkuICovXG5cdFZLX0NMRUFSOiAxMiwgXG5cdC8qKiBSZXR1cm4vZW50ZXIga2V5IG9uIHRoZSBtYWluIGtleWJvYXJkLiAqL1xuXHRWS19SRVRVUk46IDEzLCBcblx0LyoqIFJlc2VydmVkLCBidXQgbm90IHVzZWQuICovXG5cdFZLX0VOVEVSOiAxNCwgXG5cdC8qKiBTaGlmdCBrZXkuICovXG5cdFZLX1NISUZUOiAxNiwgXG5cdC8qKiBDb250cm9sIGtleS4gKi9cblx0VktfQ09OVFJPTDogMTcsIFxuXHQvKiogQWx0IChPcHRpb24gb24gTWFjKSBrZXkuICovXG5cdFZLX0FMVDogMTgsIFxuXHQvKiogUGF1c2Uga2V5LiAqL1xuXHRWS19QQVVTRTogMTksIFxuXHQvKiogQ2FwcyBsb2NrLiAqL1xuXHRWS19DQVBTX0xPQ0s6IDIwLCBcblx0LyoqIEVzY2FwZSBrZXkuICovXG5cdFZLX0VTQ0FQRTogMjcsIFxuXHQvKiogU3BhY2UgYmFyLiAqL1xuXHRWS19TUEFDRTogMzIsIFxuXHQvKiogUGFnZSBVcCBrZXkuICovXG5cdFZLX1BBR0VfVVA6IDMzLCBcblx0LyoqIFBhZ2UgRG93biBrZXkuICovXG5cdFZLX1BBR0VfRE9XTjogMzQsIFxuXHQvKiogRW5kIGtleS4gKi9cblx0VktfRU5EOiAzNSwgXG5cdC8qKiBIb21lIGtleS4gKi9cblx0VktfSE9NRTogMzYsIFxuXHQvKiogTGVmdCBhcnJvdy4gKi9cblx0VktfTEVGVDogMzcsIFxuXHQvKiogVXAgYXJyb3cuICovXG5cdFZLX1VQOiAzOCwgXG5cdC8qKiBSaWdodCBhcnJvdy4gKi9cblx0VktfUklHSFQ6IDM5LCBcblx0LyoqIERvd24gYXJyb3cuICovXG5cdFZLX0RPV046IDQwLCBcblx0LyoqIFByaW50IFNjcmVlbiBrZXkuICovXG5cdFZLX1BSSU5UU0NSRUVOOiA0NCwgXG5cdC8qKiBJbnMoZXJ0KSBrZXkuICovXG5cdFZLX0lOU0VSVDogNDUsIFxuXHQvKiogRGVsKGV0ZSkga2V5LiAqL1xuXHRWS19ERUxFVEU6IDQ2LCBcblx0LyoqKi9cblx0VktfMDogNDgsXG5cdC8qKiovXG5cdFZLXzE6IDQ5LFxuXHQvKioqL1xuXHRWS18yOiA1MCxcblx0LyoqKi9cblx0VktfMzogNTEsXG5cdC8qKiovXG5cdFZLXzQ6IDUyLFxuXHQvKioqL1xuXHRWS181OiA1Myxcblx0LyoqKi9cblx0VktfNjogNTQsXG5cdC8qKiovXG5cdFZLXzc6IDU1LFxuXHQvKioqL1xuXHRWS184OiA1Nixcblx0LyoqKi9cblx0VktfOTogNTcsXG5cdC8qKiBDb2xvbiAoOikga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0NPTE9OOiA1OCwgXG5cdC8qKiBTZW1pY29sb24gKDspIGtleS4gKi9cblx0VktfU0VNSUNPTE9OOiA1OSwgXG5cdC8qKiBMZXNzLXRoYW4gKDwpIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19MRVNTX1RIQU46IDYwLCBcblx0LyoqIEVxdWFscyAoPSkga2V5LiAqL1xuXHRWS19FUVVBTFM6IDYxLCBcblx0LyoqIEdyZWF0ZXItdGhhbiAoPikga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0dSRUFURVJfVEhBTjogNjIsIFxuXHQvKiogUXVlc3Rpb24gbWFyayAoPykga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX1FVRVNUSU9OX01BUks6IDYzLCBcblx0LyoqIEF0bWFyayAoQCkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0FUOiA2NCwgXG5cdC8qKiovXG5cdFZLX0E6IDY1LFxuXHQvKioqL1xuXHRWS19COiA2Nixcblx0LyoqKi9cblx0VktfQzogNjcsXG5cdC8qKiovXG5cdFZLX0Q6IDY4LFxuXHQvKioqL1xuXHRWS19FOiA2OSxcblx0LyoqKi9cblx0VktfRjogNzAsXG5cdC8qKiovXG5cdFZLX0c6IDcxLFxuXHQvKioqL1xuXHRWS19IOiA3Mixcblx0LyoqKi9cblx0VktfSTogNzMsXG5cdC8qKiovXG5cdFZLX0o6IDc0LFxuXHQvKioqL1xuXHRWS19LOiA3NSxcblx0LyoqKi9cblx0VktfTDogNzYsXG5cdC8qKiovXG5cdFZLX006IDc3LFxuXHQvKioqL1xuXHRWS19OOiA3OCxcblx0LyoqKi9cblx0VktfTzogNzksXG5cdC8qKiovXG5cdFZLX1A6IDgwLFxuXHQvKioqL1xuXHRWS19ROiA4MSxcblx0LyoqKi9cblx0VktfUjogODIsXG5cdC8qKiovXG5cdFZLX1M6IDgzLFxuXHQvKioqL1xuXHRWS19UOiA4NCxcblx0LyoqKi9cblx0VktfVTogODUsXG5cdC8qKiovXG5cdFZLX1Y6IDg2LFxuXHQvKioqL1xuXHRWS19XOiA4Nyxcblx0LyoqKi9cblx0VktfWDogODgsXG5cdC8qKiovXG5cdFZLX1k6IDg5LFxuXHQvKioqL1xuXHRWS19aOiA5MCxcblx0LyoqKi9cblx0VktfQ09OVEVYVF9NRU5VOiA5Myxcblx0LyoqIDAgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQwOiA5NiwgXG5cdC8qKiAxIG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTlVNUEFEMTogOTcsIFxuXHQvKiogMiBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDI6IDk4LCBcblx0LyoqIDMgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQzOiA5OSwgXG5cdC8qKiA0IG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTlVNUEFENDogMTAwLCBcblx0LyoqIDUgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQ1OiAxMDEsIFxuXHQvKiogNiBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDY6IDEwMiwgXG5cdC8qKiA3IG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTlVNUEFENzogMTAzLCBcblx0LyoqIDggb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQ4OiAxMDQsIFxuXHQvKiogOSBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDk6IDEwNSwgXG5cdC8qKiAqIG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTVVMVElQTFk6IDEwNixcblx0LyoqICsgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19BREQ6IDEwNywgXG5cdC8qKiovXG5cdFZLX1NFUEFSQVRPUjogMTA4LFxuXHQvKiogLSBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX1NVQlRSQUNUOiAxMDksIFxuXHQvKiogRGVjaW1hbCBwb2ludCBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX0RFQ0lNQUw6IDExMCwgXG5cdC8qKiAvIG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfRElWSURFOiAxMTEsIFxuXHQvKiogRjEga2V5LiAqL1xuXHRWS19GMTogMTEyLCBcblx0LyoqIEYyIGtleS4gKi9cblx0VktfRjI6IDExMywgXG5cdC8qKiBGMyBrZXkuICovXG5cdFZLX0YzOiAxMTQsIFxuXHQvKiogRjQga2V5LiAqL1xuXHRWS19GNDogMTE1LCBcblx0LyoqIEY1IGtleS4gKi9cblx0VktfRjU6IDExNiwgXG5cdC8qKiBGNiBrZXkuICovXG5cdFZLX0Y2OiAxMTcsIFxuXHQvKiogRjcga2V5LiAqL1xuXHRWS19GNzogMTE4LCBcblx0LyoqIEY4IGtleS4gKi9cblx0VktfRjg6IDExOSwgXG5cdC8qKiBGOSBrZXkuICovXG5cdFZLX0Y5OiAxMjAsIFxuXHQvKiogRjEwIGtleS4gKi9cblx0VktfRjEwOiAxMjEsIFxuXHQvKiogRjExIGtleS4gKi9cblx0VktfRjExOiAxMjIsIFxuXHQvKiogRjEyIGtleS4gKi9cblx0VktfRjEyOiAxMjMsIFxuXHQvKiogRjEzIGtleS4gKi9cblx0VktfRjEzOiAxMjQsIFxuXHQvKiogRjE0IGtleS4gKi9cblx0VktfRjE0OiAxMjUsIFxuXHQvKiogRjE1IGtleS4gKi9cblx0VktfRjE1OiAxMjYsIFxuXHQvKiogRjE2IGtleS4gKi9cblx0VktfRjE2OiAxMjcsIFxuXHQvKiogRjE3IGtleS4gKi9cblx0VktfRjE3OiAxMjgsIFxuXHQvKiogRjE4IGtleS4gKi9cblx0VktfRjE4OiAxMjksIFxuXHQvKiogRjE5IGtleS4gKi9cblx0VktfRjE5OiAxMzAsIFxuXHQvKiogRjIwIGtleS4gKi9cblx0VktfRjIwOiAxMzEsIFxuXHQvKiogRjIxIGtleS4gKi9cblx0VktfRjIxOiAxMzIsIFxuXHQvKiogRjIyIGtleS4gKi9cblx0VktfRjIyOiAxMzMsIFxuXHQvKiogRjIzIGtleS4gKi9cblx0VktfRjIzOiAxMzQsIFxuXHQvKiogRjI0IGtleS4gKi9cblx0VktfRjI0OiAxMzUsIFxuXHQvKiogTnVtIExvY2sga2V5LiAqL1xuXHRWS19OVU1fTE9DSzogMTQ0LCBcblx0LyoqIFNjcm9sbCBMb2NrIGtleS4gKi9cblx0VktfU0NST0xMX0xPQ0s6IDE0NSwgXG5cdC8qKiBDaXJjdW1mbGV4ICheKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQ0lSQ1VNRkxFWDogMTYwLCBcblx0LyoqIEV4Y2xhbWF0aW9uICghKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfRVhDTEFNQVRJT046IDE2MSwgXG5cdC8qKiBEb3VibGUgcXVvdGUgKCkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0RPVUJMRV9RVU9URTogMTYyLCBcblx0LyoqIEhhc2ggKCMpIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19IQVNIOiAxNjMsIFxuXHQvKiogRG9sbGFyIHNpZ24gKCQpIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19ET0xMQVI6IDE2NCwgXG5cdC8qKiBQZXJjZW50ICglKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfUEVSQ0VOVDogMTY1LCBcblx0LyoqIEFtcGVyc2FuZCAoJikga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0FNUEVSU0FORDogMTY2LCBcblx0LyoqIFVuZGVyc2NvcmUgKF8pIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19VTkRFUlNDT1JFOiAxNjcsIFxuXHQvKiogT3BlbiBwYXJlbnRoZXNpcyAoKCkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX09QRU5fUEFSRU46IDE2OCwgXG5cdC8qKiBDbG9zZSBwYXJlbnRoZXNpcyAoKSkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0NMT1NFX1BBUkVOOiAxNjksIFxuXHQvKiBBc3RlcmlzayAoKikga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0FTVEVSSVNLOiAxNzAsXG5cdC8qKiBQbHVzICgrKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfUExVUzogMTcxLCBcblx0LyoqIFBpcGUgKHwpIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19QSVBFOiAxNzIsIFxuXHQvKiogSHlwaGVuLVVTL2RvY3MvTWludXMgKC0pIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19IWVBIRU5fTUlOVVM6IDE3MywgXG5cdC8qKiBPcGVuIGN1cmx5IGJyYWNrZXQgKHspIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19PUEVOX0NVUkxZX0JSQUNLRVQ6IDE3NCwgXG5cdC8qKiBDbG9zZSBjdXJseSBicmFja2V0ICh9KSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQ0xPU0VfQ1VSTFlfQlJBQ0tFVDogMTc1LCBcblx0LyoqIFRpbGRlICh+KSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfVElMREU6IDE3NiwgXG5cdC8qKiBDb21tYSAoLCkga2V5LiAqL1xuXHRWS19DT01NQTogMTg4LCBcblx0LyoqIFBlcmlvZCAoLikga2V5LiAqL1xuXHRWS19QRVJJT0Q6IDE5MCwgXG5cdC8qKiBTbGFzaCAoLykga2V5LiAqL1xuXHRWS19TTEFTSDogMTkxLCBcblx0LyoqIEJhY2sgdGljayAoYCkga2V5LiAqL1xuXHRWS19CQUNLX1FVT1RFOiAxOTIsIFxuXHQvKiogT3BlbiBzcXVhcmUgYnJhY2tldCAoWykga2V5LiAqL1xuXHRWS19PUEVOX0JSQUNLRVQ6IDIxOSwgXG5cdC8qKiBCYWNrIHNsYXNoIChcXCkga2V5LiAqL1xuXHRWS19CQUNLX1NMQVNIOiAyMjAsIFxuXHQvKiogQ2xvc2Ugc3F1YXJlIGJyYWNrZXQgKF0pIGtleS4gKi9cblx0VktfQ0xPU0VfQlJBQ0tFVDogMjIxLCBcblx0LyoqIFF1b3RlICgnJycpIGtleS4gKi9cblx0VktfUVVPVEU6IDIyMiwgXG5cdC8qKiBNZXRhIGtleSBvbiBMaW51eCwgQ29tbWFuZCBrZXkgb24gTWFjLiAqL1xuXHRWS19NRVRBOiAyMjQsIFxuXHQvKiogQWx0R3Iga2V5IG9uIExpbnV4LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0FMVEdSOiAyMjUsIFxuXHQvKiogV2luZG93cyBsb2dvIGtleSBvbiBXaW5kb3dzLiBPciBTdXBlciBvciBIeXBlciBrZXkgb24gTGludXguIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfV0lOOiA5MSwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfS0FOQTogMjEsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX0hBTkdVTDogMjEsIFxuXHQvKiog6Iux5pWwIGtleSBvbiBKYXBhbmVzZSBNYWMga2V5Ym9hcmQuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfRUlTVTogMjIsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX0pVTkpBOiAyMywgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfRklOQUw6IDI0LCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19IQU5KQTogMjUsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX0tBTkpJOiAyNSwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfQ09OVkVSVDogMjgsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX05PTkNPTlZFUlQ6IDI5LCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19BQ0NFUFQ6IDMwLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19NT0RFQ0hBTkdFOiAzMSwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfU0VMRUNUOiA0MSwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfUFJJTlQ6IDQyLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19FWEVDVVRFOiA0MywgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC5cdCAqL1xuXHRWS19TTEVFUDogOTUgXG59O1xuLyoqXG4gKiBAbmFtZXNwYWNlXG4gKiBDb250YWlucyB0ZXh0IHRva2VuaXphdGlvbiBhbmQgYnJlYWtpbmcgcm91dGluZXNcbiAqL1xuUk9ULlRleHQgPSB7XG5cdFJFX0NPTE9SUzogLyUoW2JjXSl7KFtefV0qKX0vZyxcblxuXHQvKiB0b2tlbiB0eXBlcyAqL1xuXHRUWVBFX1RFWFQ6XHRcdDAsXG5cdFRZUEVfTkVXTElORTpcdDEsXG5cdFRZUEVfRkc6XHRcdDIsXG5cdFRZUEVfQkc6XHRcdDMsXG5cblx0LyoqXG5cdCAqIE1lYXN1cmUgc2l6ZSBvZiBhIHJlc3VsdGluZyB0ZXh0IGJsb2NrXG5cdCAqL1xuXHRtZWFzdXJlOiBmdW5jdGlvbihzdHIsIG1heFdpZHRoKSB7XG5cdFx0dmFyIHJlc3VsdCA9IHt3aWR0aDowLCBoZWlnaHQ6MX07XG5cdFx0dmFyIHRva2VucyA9IHRoaXMudG9rZW5pemUoc3RyLCBtYXhXaWR0aCk7XG5cdFx0dmFyIGxpbmVXaWR0aCA9IDA7XG5cblx0XHRmb3IgKHZhciBpPTA7aTx0b2tlbnMubGVuZ3RoO2krKykge1xuXHRcdFx0dmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHRcdFx0c3dpdGNoICh0b2tlbi50eXBlKSB7XG5cdFx0XHRcdGNhc2UgdGhpcy5UWVBFX1RFWFQ6XG5cdFx0XHRcdFx0bGluZVdpZHRoICs9IHRva2VuLnZhbHVlLmxlbmd0aDtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSB0aGlzLlRZUEVfTkVXTElORTpcblx0XHRcdFx0XHRyZXN1bHQuaGVpZ2h0Kys7XG5cdFx0XHRcdFx0cmVzdWx0LndpZHRoID0gTWF0aC5tYXgocmVzdWx0LndpZHRoLCBsaW5lV2lkdGgpO1xuXHRcdFx0XHRcdGxpbmVXaWR0aCA9IDA7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXN1bHQud2lkdGggPSBNYXRoLm1heChyZXN1bHQud2lkdGgsIGxpbmVXaWR0aCk7XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0IHN0cmluZyB0byBhIHNlcmllcyBvZiBhIGZvcm1hdHRpbmcgY29tbWFuZHNcblx0ICovXG5cdHRva2VuaXplOiBmdW5jdGlvbihzdHIsIG1heFdpZHRoKSB7XG5cdFx0dmFyIHJlc3VsdCA9IFtdO1xuXG5cdFx0LyogZmlyc3QgdG9rZW5pemF0aW9uIHBhc3MgLSBzcGxpdCB0ZXh0cyBhbmQgY29sb3IgZm9ybWF0dGluZyBjb21tYW5kcyAqL1xuXHRcdHZhciBvZmZzZXQgPSAwO1xuXHRcdHN0ci5yZXBsYWNlKHRoaXMuUkVfQ09MT1JTLCBmdW5jdGlvbihtYXRjaCwgdHlwZSwgbmFtZSwgaW5kZXgpIHtcblx0XHRcdC8qIHN0cmluZyBiZWZvcmUgKi9cblx0XHRcdHZhciBwYXJ0ID0gc3RyLnN1YnN0cmluZyhvZmZzZXQsIGluZGV4KTtcblx0XHRcdGlmIChwYXJ0Lmxlbmd0aCkge1xuXHRcdFx0XHRyZXN1bHQucHVzaCh7XG5cdFx0XHRcdFx0dHlwZTogUk9ULlRleHQuVFlQRV9URVhULFxuXHRcdFx0XHRcdHZhbHVlOiBwYXJ0XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBjb2xvciBjb21tYW5kICovXG5cdFx0XHRyZXN1bHQucHVzaCh7XG5cdFx0XHRcdHR5cGU6ICh0eXBlID09IFwiY1wiID8gUk9ULlRleHQuVFlQRV9GRyA6IFJPVC5UZXh0LlRZUEVfQkcpLFxuXHRcdFx0XHR2YWx1ZTogbmFtZS50cmltKClcblx0XHRcdH0pO1xuXG5cdFx0XHRvZmZzZXQgPSBpbmRleCArIG1hdGNoLmxlbmd0aDtcblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdH0pO1xuXG5cdFx0LyogbGFzdCByZW1haW5pbmcgcGFydCAqL1xuXHRcdHZhciBwYXJ0ID0gc3RyLnN1YnN0cmluZyhvZmZzZXQpO1xuXHRcdGlmIChwYXJ0Lmxlbmd0aCkge1xuXHRcdFx0cmVzdWx0LnB1c2goe1xuXHRcdFx0XHR0eXBlOiBST1QuVGV4dC5UWVBFX1RFWFQsXG5cdFx0XHRcdHZhbHVlOiBwYXJ0XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5fYnJlYWtMaW5lcyhyZXN1bHQsIG1heFdpZHRoKTtcblx0fSxcblxuXHQvKiBpbnNlcnQgbGluZSBicmVha3MgaW50byBmaXJzdC1wYXNzIHRva2VuaXplZCBkYXRhICovXG5cdF9icmVha0xpbmVzOiBmdW5jdGlvbih0b2tlbnMsIG1heFdpZHRoKSB7XG5cdFx0aWYgKCFtYXhXaWR0aCkgeyBtYXhXaWR0aCA9IEluZmluaXR5OyB9O1xuXG5cdFx0dmFyIGkgPSAwO1xuXHRcdHZhciBsaW5lTGVuZ3RoID0gMDtcblx0XHR2YXIgbGFzdFRva2VuV2l0aFNwYWNlID0gLTE7XG5cblx0XHR3aGlsZSAoaSA8IHRva2Vucy5sZW5ndGgpIHsgLyogdGFrZSBhbGwgdGV4dCB0b2tlbnMsIHJlbW92ZSBzcGFjZSwgYXBwbHkgbGluZWJyZWFrcyAqL1xuXHRcdFx0dmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHRcdFx0aWYgKHRva2VuLnR5cGUgPT0gUk9ULlRleHQuVFlQRV9ORVdMSU5FKSB7IC8qIHJlc2V0ICovXG5cdFx0XHRcdGxpbmVMZW5ndGggPSAwOyBcblx0XHRcdFx0bGFzdFRva2VuV2l0aFNwYWNlID0gLTE7XG5cdFx0XHR9XG5cdFx0XHRpZiAodG9rZW4udHlwZSAhPSBST1QuVGV4dC5UWVBFX1RFWFQpIHsgLyogc2tpcCBub24tdGV4dCB0b2tlbnMgKi9cblx0XHRcdFx0aSsrO1xuXHRcdFx0XHRjb250aW51ZTsgXG5cdFx0XHR9XG5cblx0XHRcdC8qIHJlbW92ZSBzcGFjZXMgYXQgdGhlIGJlZ2lubmluZyBvZiBsaW5lICovXG5cdFx0XHR3aGlsZSAobGluZUxlbmd0aCA9PSAwICYmIHRva2VuLnZhbHVlLmNoYXJBdCgwKSA9PSBcIiBcIikgeyB0b2tlbi52YWx1ZSA9IHRva2VuLnZhbHVlLnN1YnN0cmluZygxKTsgfVxuXG5cdFx0XHQvKiBmb3JjZWQgbmV3bGluZT8gaW5zZXJ0IHR3byBuZXcgdG9rZW5zIGFmdGVyIHRoaXMgb25lICovXG5cdFx0XHR2YXIgaW5kZXggPSB0b2tlbi52YWx1ZS5pbmRleE9mKFwiXFxuXCIpO1xuXHRcdFx0aWYgKGluZGV4ICE9IC0xKSB7IFxuXHRcdFx0XHR0b2tlbi52YWx1ZSA9IHRoaXMuX2JyZWFrSW5zaWRlVG9rZW4odG9rZW5zLCBpLCBpbmRleCwgdHJ1ZSk7IFxuXG5cdFx0XHRcdC8qIGlmIHRoZXJlIGFyZSBzcGFjZXMgYXQgdGhlIGVuZCwgd2UgbXVzdCByZW1vdmUgdGhlbSAod2UgZG8gbm90IHdhbnQgdGhlIGxpbmUgdG9vIGxvbmcpICovXG5cdFx0XHRcdHZhciBhcnIgPSB0b2tlbi52YWx1ZS5zcGxpdChcIlwiKTtcblx0XHRcdFx0d2hpbGUgKGFyci5sZW5ndGggJiYgYXJyW2Fyci5sZW5ndGgtMV0gPT0gXCIgXCIpIHsgYXJyLnBvcCgpOyB9XG5cdFx0XHRcdHRva2VuLnZhbHVlID0gYXJyLmpvaW4oXCJcIik7XG5cdFx0XHR9XG5cblx0XHRcdC8qIHRva2VuIGRlZ2VuZXJhdGVkPyAqL1xuXHRcdFx0aWYgKCF0b2tlbi52YWx1ZS5sZW5ndGgpIHtcblx0XHRcdFx0dG9rZW5zLnNwbGljZShpLCAxKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChsaW5lTGVuZ3RoICsgdG9rZW4udmFsdWUubGVuZ3RoID4gbWF4V2lkdGgpIHsgLyogbGluZSB0b28gbG9uZywgZmluZCBhIHN1aXRhYmxlIGJyZWFraW5nIHNwb3QgKi9cblxuXHRcdFx0XHQvKiBpcyBpdCBwb3NzaWJsZSB0byBicmVhayB3aXRoaW4gdGhpcyB0b2tlbj8gKi9cblx0XHRcdFx0dmFyIGluZGV4ID0gLTE7XG5cdFx0XHRcdHdoaWxlICgxKSB7XG5cdFx0XHRcdFx0dmFyIG5leHRJbmRleCA9IHRva2VuLnZhbHVlLmluZGV4T2YoXCIgXCIsIGluZGV4KzEpO1xuXHRcdFx0XHRcdGlmIChuZXh0SW5kZXggPT0gLTEpIHsgYnJlYWs7IH1cblx0XHRcdFx0XHRpZiAobGluZUxlbmd0aCArIG5leHRJbmRleCA+IG1heFdpZHRoKSB7IGJyZWFrOyB9XG5cdFx0XHRcdFx0aW5kZXggPSBuZXh0SW5kZXg7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaW5kZXggIT0gLTEpIHsgLyogYnJlYWsgYXQgc3BhY2Ugd2l0aGluIHRoaXMgb25lICovXG5cdFx0XHRcdFx0dG9rZW4udmFsdWUgPSB0aGlzLl9icmVha0luc2lkZVRva2VuKHRva2VucywgaSwgaW5kZXgsIHRydWUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGxhc3RUb2tlbldpdGhTcGFjZSAhPSAtMSkgeyAvKiBpcyB0aGVyZSBhIHByZXZpb3VzIHRva2VuIHdoZXJlIGEgYnJlYWsgY2FuIG9jY3VyPyAqL1xuXHRcdFx0XHRcdHZhciB0b2tlbiA9IHRva2Vuc1tsYXN0VG9rZW5XaXRoU3BhY2VdO1xuXHRcdFx0XHRcdHZhciBicmVha0luZGV4ID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIgXCIpO1xuXHRcdFx0XHRcdHRva2VuLnZhbHVlID0gdGhpcy5fYnJlYWtJbnNpZGVUb2tlbih0b2tlbnMsIGxhc3RUb2tlbldpdGhTcGFjZSwgYnJlYWtJbmRleCwgdHJ1ZSk7XG5cdFx0XHRcdFx0aSA9IGxhc3RUb2tlbldpdGhTcGFjZTtcblx0XHRcdFx0fSBlbHNlIHsgLyogZm9yY2UgYnJlYWsgaW4gdGhpcyB0b2tlbiAqL1xuXHRcdFx0XHRcdHRva2VuLnZhbHVlID0gdGhpcy5fYnJlYWtJbnNpZGVUb2tlbih0b2tlbnMsIGksIG1heFdpZHRoLWxpbmVMZW5ndGgsIGZhbHNlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgeyAvKiBsaW5lIG5vdCBsb25nLCBjb250aW51ZSAqL1xuXHRcdFx0XHRsaW5lTGVuZ3RoICs9IHRva2VuLnZhbHVlLmxlbmd0aDtcblx0XHRcdFx0aWYgKHRva2VuLnZhbHVlLmluZGV4T2YoXCIgXCIpICE9IC0xKSB7IGxhc3RUb2tlbldpdGhTcGFjZSA9IGk7IH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aSsrOyAvKiBhZHZhbmNlIHRvIG5leHQgdG9rZW4gKi9cblx0XHR9XG5cblxuXHRcdHRva2Vucy5wdXNoKHt0eXBlOiBST1QuVGV4dC5UWVBFX05FV0xJTkV9KTsgLyogaW5zZXJ0IGZha2UgbmV3bGluZSB0byBmaXggdGhlIGxhc3QgdGV4dCBsaW5lICovXG5cblx0XHQvKiByZW1vdmUgdHJhaWxpbmcgc3BhY2UgZnJvbSB0ZXh0IHRva2VucyBiZWZvcmUgbmV3bGluZXMgKi9cblx0XHR2YXIgbGFzdFRleHRUb2tlbiA9IG51bGw7XG5cdFx0Zm9yICh2YXIgaT0wO2k8dG9rZW5zLmxlbmd0aDtpKyspIHtcblx0XHRcdHZhciB0b2tlbiA9IHRva2Vuc1tpXTtcblx0XHRcdHN3aXRjaCAodG9rZW4udHlwZSkge1xuXHRcdFx0XHRjYXNlIFJPVC5UZXh0LlRZUEVfVEVYVDogbGFzdFRleHRUb2tlbiA9IHRva2VuOyBicmVhaztcblx0XHRcdFx0Y2FzZSBST1QuVGV4dC5UWVBFX05FV0xJTkU6IFxuXHRcdFx0XHRcdGlmIChsYXN0VGV4dFRva2VuKSB7IC8qIHJlbW92ZSB0cmFpbGluZyBzcGFjZSAqL1xuXHRcdFx0XHRcdFx0dmFyIGFyciA9IGxhc3RUZXh0VG9rZW4udmFsdWUuc3BsaXQoXCJcIik7XG5cdFx0XHRcdFx0XHR3aGlsZSAoYXJyLmxlbmd0aCAmJiBhcnJbYXJyLmxlbmd0aC0xXSA9PSBcIiBcIikgeyBhcnIucG9wKCk7IH1cblx0XHRcdFx0XHRcdGxhc3RUZXh0VG9rZW4udmFsdWUgPSBhcnIuam9pbihcIlwiKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bGFzdFRleHRUb2tlbiA9IG51bGw7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRva2Vucy5wb3AoKTsgLyogcmVtb3ZlIGZha2UgdG9rZW4gKi9cblxuXHRcdHJldHVybiB0b2tlbnM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSBuZXcgdG9rZW5zIGFuZCBpbnNlcnQgdGhlbSBpbnRvIHRoZSBzdHJlYW1cblx0ICogQHBhcmFtIHtvYmplY3RbXX0gdG9rZW5zXG5cdCAqIEBwYXJhbSB7aW50fSB0b2tlbkluZGV4IFRva2VuIGJlaW5nIHByb2Nlc3NlZFxuXHQgKiBAcGFyYW0ge2ludH0gYnJlYWtJbmRleCBJbmRleCB3aXRoaW4gY3VycmVudCB0b2tlbidzIHZhbHVlXG5cdCAqIEBwYXJhbSB7Ym9vbH0gcmVtb3ZlQnJlYWtDaGFyIERvIHdlIHdhbnQgdG8gcmVtb3ZlIHRoZSBicmVha2luZyBjaGFyYWN0ZXI/XG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IHJlbWFpbmluZyB1bmJyb2tlbiB0b2tlbiB2YWx1ZVxuXHQgKi9cblx0X2JyZWFrSW5zaWRlVG9rZW46IGZ1bmN0aW9uKHRva2VucywgdG9rZW5JbmRleCwgYnJlYWtJbmRleCwgcmVtb3ZlQnJlYWtDaGFyKSB7XG5cdFx0dmFyIG5ld0JyZWFrVG9rZW4gPSB7XG5cdFx0XHR0eXBlOiBST1QuVGV4dC5UWVBFX05FV0xJTkVcblx0XHR9XG5cdFx0dmFyIG5ld1RleHRUb2tlbiA9IHtcblx0XHRcdHR5cGU6IFJPVC5UZXh0LlRZUEVfVEVYVCxcblx0XHRcdHZhbHVlOiB0b2tlbnNbdG9rZW5JbmRleF0udmFsdWUuc3Vic3RyaW5nKGJyZWFrSW5kZXggKyAocmVtb3ZlQnJlYWtDaGFyID8gMSA6IDApKVxuXHRcdH1cblx0XHR0b2tlbnMuc3BsaWNlKHRva2VuSW5kZXgrMSwgMCwgbmV3QnJlYWtUb2tlbiwgbmV3VGV4dFRva2VuKTtcblx0XHRyZXR1cm4gdG9rZW5zW3Rva2VuSW5kZXhdLnZhbHVlLnN1YnN0cmluZygwLCBicmVha0luZGV4KTtcblx0fVxufVxuLyoqXG4gKiBAcmV0dXJucyB7YW55fSBSYW5kb21seSBwaWNrZWQgaXRlbSwgbnVsbCB3aGVuIGxlbmd0aD0wXG4gKi9cbkFycmF5LnByb3RvdHlwZS5yYW5kb20gPSBBcnJheS5wcm90b3R5cGUucmFuZG9tIHx8IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMubGVuZ3RoKSB7IHJldHVybiBudWxsOyB9XG5cdHJldHVybiB0aGlzW01hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkgKiB0aGlzLmxlbmd0aCldO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHthcnJheX0gTmV3IGFycmF5IHdpdGggcmFuZG9taXplZCBpdGVtc1xuICogRklYTUUgZGVzdHJveXMgdGhpcyFcbiAqL1xuQXJyYXkucHJvdG90eXBlLnJhbmRvbWl6ZSA9IEFycmF5LnByb3RvdHlwZS5yYW5kb21pemUgfHwgZnVuY3Rpb24oKSB7XG5cdHZhciByZXN1bHQgPSBbXTtcblx0d2hpbGUgKHRoaXMubGVuZ3RoKSB7XG5cdFx0dmFyIGluZGV4ID0gdGhpcy5pbmRleE9mKHRoaXMucmFuZG9tKCkpO1xuXHRcdHJlc3VsdC5wdXNoKHRoaXMuc3BsaWNlKGluZGV4LCAxKVswXSk7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuICogQWx3YXlzIHBvc2l0aXZlIG1vZHVsdXNcbiAqIEBwYXJhbSB7aW50fSBuIE1vZHVsdXNcbiAqIEByZXR1cm5zIHtpbnR9IHRoaXMgbW9kdWxvIG5cbiAqL1xuTnVtYmVyLnByb3RvdHlwZS5tb2QgPSBOdW1iZXIucHJvdG90eXBlLm1vZCB8fCBmdW5jdGlvbihuKSB7XG5cdHJldHVybiAoKHRoaXMlbikrbiklbjtcbn1cbi8qKlxuICogQHJldHVybnMge3N0cmluZ30gRmlyc3QgbGV0dGVyIGNhcGl0YWxpemVkXG4gKi9cblN0cmluZy5wcm90b3R5cGUuY2FwaXRhbGl6ZSA9IFN0cmluZy5wcm90b3R5cGUuY2FwaXRhbGl6ZSB8fCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0aGlzLnN1YnN0cmluZygxKTtcbn1cblxuLyoqIFxuICogTGVmdCBwYWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY2hhcmFjdGVyPVwiMFwiXVxuICogQHBhcmFtIHtpbnR9IFtjb3VudD0yXVxuICovXG5TdHJpbmcucHJvdG90eXBlLmxwYWQgPSBTdHJpbmcucHJvdG90eXBlLmxwYWQgfHwgZnVuY3Rpb24oY2hhcmFjdGVyLCBjb3VudCkge1xuXHR2YXIgY2ggPSBjaGFyYWN0ZXIgfHwgXCIwXCI7XG5cdHZhciBjbnQgPSBjb3VudCB8fCAyO1xuXG5cdHZhciBzID0gXCJcIjtcblx0d2hpbGUgKHMubGVuZ3RoIDwgKGNudCAtIHRoaXMubGVuZ3RoKSkgeyBzICs9IGNoOyB9XG5cdHMgPSBzLnN1YnN0cmluZygwLCBjbnQtdGhpcy5sZW5ndGgpO1xuXHRyZXR1cm4gcyt0aGlzO1xufVxuXG4vKiogXG4gKiBSaWdodCBwYWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY2hhcmFjdGVyPVwiMFwiXVxuICogQHBhcmFtIHtpbnR9IFtjb3VudD0yXVxuICovXG5TdHJpbmcucHJvdG90eXBlLnJwYWQgPSBTdHJpbmcucHJvdG90eXBlLnJwYWQgfHwgZnVuY3Rpb24oY2hhcmFjdGVyLCBjb3VudCkge1xuXHR2YXIgY2ggPSBjaGFyYWN0ZXIgfHwgXCIwXCI7XG5cdHZhciBjbnQgPSBjb3VudCB8fCAyO1xuXG5cdHZhciBzID0gXCJcIjtcblx0d2hpbGUgKHMubGVuZ3RoIDwgKGNudCAtIHRoaXMubGVuZ3RoKSkgeyBzICs9IGNoOyB9XG5cdHMgPSBzLnN1YnN0cmluZygwLCBjbnQtdGhpcy5sZW5ndGgpO1xuXHRyZXR1cm4gdGhpcytzO1xufVxuXG4vKipcbiAqIEZvcm1hdCBhIHN0cmluZyBpbiBhIGZsZXhpYmxlIHdheS4gU2NhbnMgZm9yICVzIHN0cmluZ3MgYW5kIHJlcGxhY2VzIHRoZW0gd2l0aCBhcmd1bWVudHMuIExpc3Qgb2YgcGF0dGVybnMgaXMgbW9kaWZpYWJsZSB2aWEgU3RyaW5nLmZvcm1hdC5tYXAuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGVtcGxhdGVcbiAqIEBwYXJhbSB7YW55fSBbYXJndl1cbiAqL1xuU3RyaW5nLmZvcm1hdCA9IFN0cmluZy5mb3JtYXQgfHwgZnVuY3Rpb24odGVtcGxhdGUpIHtcblx0dmFyIG1hcCA9IFN0cmluZy5mb3JtYXQubWFwO1xuXHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0dmFyIHJlcGxhY2VyID0gZnVuY3Rpb24obWF0Y2gsIGdyb3VwMSwgZ3JvdXAyLCBpbmRleCkge1xuXHRcdGlmICh0ZW1wbGF0ZS5jaGFyQXQoaW5kZXgtMSkgPT0gXCIlXCIpIHsgcmV0dXJuIG1hdGNoLnN1YnN0cmluZygxKTsgfVxuXHRcdGlmICghYXJncy5sZW5ndGgpIHsgcmV0dXJuIG1hdGNoOyB9XG5cdFx0dmFyIG9iaiA9IGFyZ3NbMF07XG5cblx0XHR2YXIgZ3JvdXAgPSBncm91cDEgfHwgZ3JvdXAyO1xuXHRcdHZhciBwYXJ0cyA9IGdyb3VwLnNwbGl0KFwiLFwiKTtcblx0XHR2YXIgbmFtZSA9IHBhcnRzLnNoaWZ0KCk7XG5cdFx0dmFyIG1ldGhvZCA9IG1hcFtuYW1lLnRvTG93ZXJDYXNlKCldO1xuXHRcdGlmICghbWV0aG9kKSB7IHJldHVybiBtYXRjaDsgfVxuXG5cdFx0dmFyIG9iaiA9IGFyZ3Muc2hpZnQoKTtcblx0XHR2YXIgcmVwbGFjZWQgPSBvYmpbbWV0aG9kXS5hcHBseShvYmosIHBhcnRzKTtcblxuXHRcdHZhciBmaXJzdCA9IG5hbWUuY2hhckF0KDApO1xuXHRcdGlmIChmaXJzdCAhPSBmaXJzdC50b0xvd2VyQ2FzZSgpKSB7IHJlcGxhY2VkID0gcmVwbGFjZWQuY2FwaXRhbGl6ZSgpOyB9XG5cblx0XHRyZXR1cm4gcmVwbGFjZWQ7XG5cdH1cblx0cmV0dXJuIHRlbXBsYXRlLnJlcGxhY2UoLyUoPzooW2Etel0rKXwoPzp7KFtefV0rKX0pKS9naSwgcmVwbGFjZXIpO1xufVxuXG5TdHJpbmcuZm9ybWF0Lm1hcCA9IFN0cmluZy5mb3JtYXQubWFwIHx8IHtcblx0XCJzXCI6IFwidG9TdHJpbmdcIlxufVxuXG4vKipcbiAqIENvbnZlbmllbmNlIHNob3J0Y3V0IHRvIFN0cmluZy5mb3JtYXQodGhpcylcbiAqL1xuU3RyaW5nLnByb3RvdHlwZS5mb3JtYXQgPSBTdHJpbmcucHJvdG90eXBlLmZvcm1hdCB8fCBmdW5jdGlvbigpIHtcblx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRhcmdzLnVuc2hpZnQodGhpcyk7XG5cdHJldHVybiBTdHJpbmcuZm9ybWF0LmFwcGx5KFN0cmluZywgYXJncyk7XG59XG5cbmlmICghT2JqZWN0LmNyZWF0ZSkgeyAgXG5cdC8qKlxuXHQgKiBFUzUgT2JqZWN0LmNyZWF0ZVxuXHQgKi9cblx0T2JqZWN0LmNyZWF0ZSA9IGZ1bmN0aW9uKG8pIHsgIFxuXHRcdHZhciB0bXAgPSBmdW5jdGlvbigpIHt9O1xuXHRcdHRtcC5wcm90b3R5cGUgPSBvO1xuXHRcdHJldHVybiBuZXcgdG1wKCk7XG5cdH07ICBcbn0gIFxuLyoqXG4gKiBTZXRzIHByb3RvdHlwZSBvZiB0aGlzIGZ1bmN0aW9uIHRvIGFuIGluc3RhbmNlIG9mIHBhcmVudCBmdW5jdGlvblxuICogQHBhcmFtIHtmdW5jdGlvbn0gcGFyZW50XG4gKi9cbkZ1bmN0aW9uLnByb3RvdHlwZS5leHRlbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuZXh0ZW5kIHx8IGZ1bmN0aW9uKHBhcmVudCkge1xuXHR0aGlzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50LnByb3RvdHlwZSk7XG5cdHRoaXMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gdGhpcztcblx0cmV0dXJuIHRoaXM7XG59XG5pZiAodHlwZW9mIHdpbmRvdyAhPSBcInVuZGVmaW5lZFwiKSB7XG5cdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPVxuXHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcblx0XHR8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZVxuXHRcdHx8IHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgZnVuY3Rpb24oY2IpIHsgcmV0dXJuIHNldFRpbWVvdXQoY2IsIDEwMDAvNjApOyB9O1xuXG5cdHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9XG5cdFx0d2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93Lm9DYW5jZWxBbmltYXRpb25GcmFtZVxuXHRcdHx8IHdpbmRvdy5tc0NhbmNlbEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgZnVuY3Rpb24oaWQpIHsgcmV0dXJuIGNsZWFyVGltZW91dChpZCk7IH07XG59XG4vKipcbiAqIEBjbGFzcyBWaXN1YWwgbWFwIGRpc3BsYXlcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy53aWR0aD1ST1QuREVGQVVMVF9XSURUSF1cbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy5oZWlnaHQ9Uk9ULkRFRkFVTFRfSEVJR0hUXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLmZvbnRTaXplPTE1XVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZvbnRGYW1pbHk9XCJtb25vc3BhY2VcIl1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5mb250U3R5bGU9XCJcIl0gYm9sZC9pdGFsaWMvbm9uZS9ib3RoXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZmc9XCIjY2NjXCJdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuYmc9XCIjMDAwXCJdXG4gKiBAcGFyYW0ge2Zsb2F0fSBbb3B0aW9ucy5zcGFjaW5nPTFdXG4gKiBAcGFyYW0ge2Zsb2F0fSBbb3B0aW9ucy5ib3JkZXI9MF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5sYXlvdXQ9XCJyZWN0XCJdXG4gKiBAcGFyYW0ge2Jvb2x9IFtvcHRpb25zLmZvcmNlU3F1YXJlUmF0aW89ZmFsc2VdXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMudGlsZVdpZHRoPTMyXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLnRpbGVIZWlnaHQ9MzJdXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMudGlsZU1hcD17fV1cbiAqIEBwYXJhbSB7aW1hZ2V9IFtvcHRpb25zLnRpbGVTZXQ9bnVsbF1cbiAqIEBwYXJhbSB7aW1hZ2V9IFtvcHRpb25zLnRpbGVDb2xvcml6ZT1mYWxzZV1cbiAqL1xuUk9ULkRpc3BsYXkgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXHR0aGlzLl9jb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblx0dGhpcy5fZGF0YSA9IHt9O1xuXHR0aGlzLl9kaXJ0eSA9IGZhbHNlOyAvKiBmYWxzZSA9IG5vdGhpbmcsIHRydWUgPSBhbGwsIG9iamVjdCA9IGRpcnR5IGNlbGxzICovXG5cdHRoaXMuX29wdGlvbnMgPSB7fTtcblx0dGhpcy5fYmFja2VuZCA9IG51bGw7XG5cdFxuXHR2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cdFx0d2lkdGg6IFJPVC5ERUZBVUxUX1dJRFRILFxuXHRcdGhlaWdodDogUk9ULkRFRkFVTFRfSEVJR0hULFxuXHRcdHRyYW5zcG9zZTogZmFsc2UsXG5cdFx0bGF5b3V0OiBcInJlY3RcIixcblx0XHRmb250U2l6ZTogMTUsXG5cdFx0c3BhY2luZzogMSxcblx0XHRib3JkZXI6IDAsXG5cdFx0Zm9yY2VTcXVhcmVSYXRpbzogZmFsc2UsXG5cdFx0Zm9udEZhbWlseTogXCJtb25vc3BhY2VcIixcblx0XHRmb250U3R5bGU6IFwiXCIsXG5cdFx0Zmc6IFwiI2NjY1wiLFxuXHRcdGJnOiBcIiMwMDBcIixcblx0XHR0aWxlV2lkdGg6IDMyLFxuXHRcdHRpbGVIZWlnaHQ6IDMyLFxuXHRcdHRpbGVNYXA6IHt9LFxuXHRcdHRpbGVTZXQ6IG51bGwsXG5cdFx0dGlsZUNvbG9yaXplOiBmYWxzZSxcblx0XHR0ZXJtQ29sb3I6IFwieHRlcm1cIlxuXHR9O1xuXHRmb3IgKHZhciBwIGluIG9wdGlvbnMpIHsgZGVmYXVsdE9wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cdHRoaXMuc2V0T3B0aW9ucyhkZWZhdWx0T3B0aW9ucyk7XG5cdHRoaXMuREVCVUcgPSB0aGlzLkRFQlVHLmJpbmQodGhpcyk7XG5cblx0dGhpcy5fdGljayA9IHRoaXMuX3RpY2suYmluZCh0aGlzKTtcblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3RpY2spO1xufVxuXG4vKipcbiAqIERlYnVnIGhlbHBlciwgaWRlYWwgYXMgYSBtYXAgZ2VuZXJhdG9yIGNhbGxiYWNrLiBBbHdheXMgYm91bmQgdG8gdGhpcy5cbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtpbnR9IHdoYXRcbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLkRFQlVHID0gZnVuY3Rpb24oeCwgeSwgd2hhdCkge1xuXHR2YXIgY29sb3JzID0gW3RoaXMuX29wdGlvbnMuYmcsIHRoaXMuX29wdGlvbnMuZmddO1xuXHR0aGlzLmRyYXcoeCwgeSwgbnVsbCwgbnVsbCwgY29sb3JzW3doYXQgJSBjb2xvcnMubGVuZ3RoXSk7XG59XG5cbi8qKlxuICogQ2xlYXIgdGhlIHdob2xlIGRpc3BsYXkgKGNvdmVyIGl0IHdpdGggYmFja2dyb3VuZCBjb2xvcilcbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX2RhdGEgPSB7fTtcblx0dGhpcy5fZGlydHkgPSB0cnVlO1xufVxuXG4vKipcbiAqIEBzZWUgUk9ULkRpc3BsYXlcbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyB0aGlzLl9vcHRpb25zW3BdID0gb3B0aW9uc1twXTsgfVxuXHRpZiAob3B0aW9ucy53aWR0aCB8fCBvcHRpb25zLmhlaWdodCB8fCBvcHRpb25zLmZvbnRTaXplIHx8IG9wdGlvbnMuZm9udEZhbWlseSB8fCBvcHRpb25zLnNwYWNpbmcgfHwgb3B0aW9ucy5sYXlvdXQpIHtcblx0XHRpZiAob3B0aW9ucy5sYXlvdXQpIHsgXG5cdFx0XHR0aGlzLl9iYWNrZW5kID0gbmV3IFJPVC5EaXNwbGF5W29wdGlvbnMubGF5b3V0LmNhcGl0YWxpemUoKV0odGhpcy5fY29udGV4dCk7XG5cdFx0fVxuXG5cdFx0dmFyIGZvbnQgPSAodGhpcy5fb3B0aW9ucy5mb250U3R5bGUgPyB0aGlzLl9vcHRpb25zLmZvbnRTdHlsZSArIFwiIFwiIDogXCJcIikgKyB0aGlzLl9vcHRpb25zLmZvbnRTaXplICsgXCJweCBcIiArIHRoaXMuX29wdGlvbnMuZm9udEZhbWlseTtcblx0XHR0aGlzLl9jb250ZXh0LmZvbnQgPSBmb250O1xuXHRcdHRoaXMuX2JhY2tlbmQuY29tcHV0ZSh0aGlzLl9vcHRpb25zKTtcblx0XHR0aGlzLl9jb250ZXh0LmZvbnQgPSBmb250O1xuXHRcdHRoaXMuX2NvbnRleHQudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcblx0XHR0aGlzLl9jb250ZXh0LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XG5cdFx0dGhpcy5fZGlydHkgPSB0cnVlO1xuXHR9XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJldHVybnMgY3VycmVudGx5IHNldCBvcHRpb25zXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBDdXJyZW50IG9wdGlvbnMgb2JqZWN0IFxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fb3B0aW9ucztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBET00gbm9kZSBvZiB0aGlzIGRpc3BsYXlcbiAqIEByZXR1cm5zIHtub2RlfSBET00gbm9kZVxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuZ2V0Q29udGFpbmVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl9jb250ZXh0LmNhbnZhcztcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBtYXhpbXVtIHdpZHRoL2hlaWdodCB0byBmaXQgaW50byBhIHNldCBvZiBnaXZlbiBjb25zdHJhaW50c1xuICogQHBhcmFtIHtpbnR9IGF2YWlsV2lkdGggTWF4aW11bSBhbGxvd2VkIHBpeGVsIHdpZHRoXG4gKiBAcGFyYW0ge2ludH0gYXZhaWxIZWlnaHQgTWF4aW11bSBhbGxvd2VkIHBpeGVsIGhlaWdodFxuICogQHJldHVybnMge2ludFsyXX0gY2VsbFdpZHRoLGNlbGxIZWlnaHRcbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLmNvbXB1dGVTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0cmV0dXJuIHRoaXMuX2JhY2tlbmQuY29tcHV0ZVNpemUoYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQsIHRoaXMuX29wdGlvbnMpO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIG1heGltdW0gZm9udCBzaXplIHRvIGZpdCBpbnRvIGEgc2V0IG9mIGdpdmVuIGNvbnN0cmFpbnRzXG4gKiBAcGFyYW0ge2ludH0gYXZhaWxXaWR0aCBNYXhpbXVtIGFsbG93ZWQgcGl4ZWwgd2lkdGhcbiAqIEBwYXJhbSB7aW50fSBhdmFpbEhlaWdodCBNYXhpbXVtIGFsbG93ZWQgcGl4ZWwgaGVpZ2h0XG4gKiBAcmV0dXJucyB7aW50fSBmb250U2l6ZVxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuY29tcHV0ZUZvbnRTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0cmV0dXJuIHRoaXMuX2JhY2tlbmQuY29tcHV0ZUZvbnRTaXplKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0LCB0aGlzLl9vcHRpb25zKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgRE9NIGV2ZW50IChtb3VzZSBvciB0b3VjaCkgdG8gbWFwIGNvb3JkaW5hdGVzLiBVc2VzIGZpcnN0IHRvdWNoIGZvciBtdWx0aS10b3VjaC5cbiAqIEBwYXJhbSB7RXZlbnR9IGUgZXZlbnRcbiAqIEByZXR1cm5zIHtpbnRbMl19IC0xIGZvciB2YWx1ZXMgb3V0c2lkZSBvZiB0aGUgY2FudmFzXG4gKi9cblJPVC5EaXNwbGF5LnByb3RvdHlwZS5ldmVudFRvUG9zaXRpb24gPSBmdW5jdGlvbihlKSB7XG5cdGlmIChlLnRvdWNoZXMpIHtcblx0XHR2YXIgeCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdHZhciB5ID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG5cdH0gZWxzZSB7XG5cdFx0dmFyIHggPSBlLmNsaWVudFg7XG5cdFx0dmFyIHkgPSBlLmNsaWVudFk7XG5cdH1cblxuXHR2YXIgcmVjdCA9IHRoaXMuX2NvbnRleHQuY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHR4IC09IHJlY3QubGVmdDtcblx0eSAtPSByZWN0LnRvcDtcblx0XG5cdGlmICh4IDwgMCB8fCB5IDwgMCB8fCB4ID49IHRoaXMuX2NvbnRleHQuY2FudmFzLndpZHRoIHx8IHkgPj0gdGhpcy5fY29udGV4dC5jYW52YXMuaGVpZ2h0KSB7IHJldHVybiBbLTEsIC0xXTsgfVxuXG5cdHJldHVybiB0aGlzLl9iYWNrZW5kLmV2ZW50VG9Qb3NpdGlvbih4LCB5KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7c3RyaW5nIHx8IHN0cmluZ1tdfSBjaCBPbmUgb3IgbW9yZSBjaGFycyAod2lsbCBiZSBvdmVybGFwcGluZyB0aGVtc2VsdmVzKVxuICogQHBhcmFtIHtzdHJpbmd9IFtmZ10gZm9yZWdyb3VuZCBjb2xvclxuICogQHBhcmFtIHtzdHJpbmd9IFtiZ10gYmFja2dyb3VuZCBjb2xvclxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHgsIHksIGNoLCBmZywgYmcpIHtcblx0aWYgKCFmZykgeyBmZyA9IHRoaXMuX29wdGlvbnMuZmc7IH1cblx0aWYgKCFiZykgeyBiZyA9IHRoaXMuX29wdGlvbnMuYmc7IH1cblx0dGhpcy5fZGF0YVt4K1wiLFwiK3ldID0gW3gsIHksIGNoLCBmZywgYmddO1xuXHRcblx0aWYgKHRoaXMuX2RpcnR5ID09PSB0cnVlKSB7IHJldHVybjsgfSAvKiB3aWxsIGFscmVhZHkgcmVkcmF3IGV2ZXJ5dGhpbmcgKi9cblx0aWYgKCF0aGlzLl9kaXJ0eSkgeyB0aGlzLl9kaXJ0eSA9IHt9OyB9IC8qIGZpcnN0ISAqL1xuXHR0aGlzLl9kaXJ0eVt4K1wiLFwiK3ldID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBEcmF3cyBhIHRleHQgYXQgZ2l2ZW4gcG9zaXRpb24uIE9wdGlvbmFsbHkgd3JhcHMgYXQgYSBtYXhpbXVtIGxlbmd0aC4gQ3VycmVudGx5IGRvZXMgbm90IHdvcmsgd2l0aCBoZXggbGF5b3V0LlxuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBNYXkgY29udGFpbiBjb2xvci9iYWNrZ3JvdW5kIGZvcm1hdCBzcGVjaWZpZXJzLCAlY3tuYW1lfS8lYntuYW1lfSwgYm90aCBvcHRpb25hbC4gJWN7fS8lYnt9IHJlc2V0cyB0byBkZWZhdWx0LlxuICogQHBhcmFtIHtpbnR9IFttYXhXaWR0aF0gd3JhcCBhdCB3aGF0IHdpZHRoP1xuICogQHJldHVybnMge2ludH0gbGluZXMgZHJhd25cbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLmRyYXdUZXh0ID0gZnVuY3Rpb24oeCwgeSwgdGV4dCwgbWF4V2lkdGgpIHtcblx0dmFyIGZnID0gbnVsbDtcblx0dmFyIGJnID0gbnVsbDtcblx0dmFyIGN4ID0geDtcblx0dmFyIGN5ID0geTtcblx0dmFyIGxpbmVzID0gMTtcblx0aWYgKCFtYXhXaWR0aCkgeyBtYXhXaWR0aCA9IHRoaXMuX29wdGlvbnMud2lkdGgteDsgfVxuXG5cdHZhciB0b2tlbnMgPSBST1QuVGV4dC50b2tlbml6ZSh0ZXh0LCBtYXhXaWR0aCk7XG5cblx0d2hpbGUgKHRva2Vucy5sZW5ndGgpIHsgLyogaW50ZXJwcmV0IHRva2VuaXplZCBvcGNvZGUgc3RyZWFtICovXG5cdFx0dmFyIHRva2VuID0gdG9rZW5zLnNoaWZ0KCk7XG5cdFx0c3dpdGNoICh0b2tlbi50eXBlKSB7XG5cdFx0XHRjYXNlIFJPVC5UZXh0LlRZUEVfVEVYVDpcblx0XHRcdFx0dmFyIGlzU3BhY2UgPSBmYWxzZSwgaXNQcmV2U3BhY2UgPSBmYWxzZSwgaXNGdWxsV2lkdGggPSBmYWxzZSwgaXNQcmV2RnVsbFdpZHRoID0gZmFsc2U7XG5cdFx0XHRcdGZvciAodmFyIGk9MDtpPHRva2VuLnZhbHVlLmxlbmd0aDtpKyspIHtcblx0XHRcdFx0XHR2YXIgY2MgPSB0b2tlbi52YWx1ZS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0XHRcdHZhciBjID0gdG9rZW4udmFsdWUuY2hhckF0KGkpO1xuXHRcdFx0XHRcdC8vIEFzc2lnbiB0byBgdHJ1ZWAgd2hlbiB0aGUgY3VycmVudCBjaGFyIGlzIGZ1bGwtd2lkdGguXG5cdFx0XHRcdFx0aXNGdWxsV2lkdGggPSAoY2MgPiAweGZmICYmIGNjIDwgMHhmZjYxKSB8fCAoY2MgPiAweGZmZGMgJiYgY2MgPCAweGZmZTgpICYmIGNjID4gMHhmZmVlO1xuXHRcdFx0XHRcdC8vIEN1cnJlbnQgY2hhciBpcyBzcGFjZSwgd2hhdGV2ZXIgZnVsbC13aWR0aCBvciBoYWxmLXdpZHRoIGJvdGggYXJlIE9LLlxuXHRcdFx0XHRcdGlzU3BhY2UgPSAoYy5jaGFyQ29kZUF0KDApID09IDB4MjAgfHwgYy5jaGFyQ29kZUF0KDApID09IDB4MzAwMCk7XG5cdFx0XHRcdFx0Ly8gVGhlIHByZXZpb3VzIGNoYXIgaXMgZnVsbC13aWR0aCBhbmRcblx0XHRcdFx0XHQvLyBjdXJyZW50IGNoYXIgaXMgbmV0aGVyIGhhbGYtd2lkdGggbm9yIGEgc3BhY2UuXG5cdFx0XHRcdFx0aWYgKGlzUHJldkZ1bGxXaWR0aCAmJiAhaXNGdWxsV2lkdGggJiYgIWlzU3BhY2UpIHsgY3grKzsgfSAvLyBhZGQgYW4gZXh0cmEgcG9zaXRpb25cblx0XHRcdFx0XHQvLyBUaGUgY3VycmVudCBjaGFyIGlzIGZ1bGwtd2lkdGggYW5kXG5cdFx0XHRcdFx0Ly8gdGhlIHByZXZpb3VzIGNoYXIgaXMgbm90IGEgc3BhY2UuXG5cdFx0XHRcdFx0aWYoaXNGdWxsV2lkdGggJiYgIWlzUHJldlNwYWNlKSB7IGN4Kys7IH0gLy8gYWRkIGFuIGV4dHJhIHBvc2l0aW9uXG5cdFx0XHRcdFx0dGhpcy5kcmF3KGN4KyssIGN5LCBjLCBmZywgYmcpO1xuXHRcdFx0XHRcdGlzUHJldlNwYWNlID0gaXNTcGFjZTtcblx0XHRcdFx0XHRpc1ByZXZGdWxsV2lkdGggPSBpc0Z1bGxXaWR0aDtcblx0XHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgUk9ULlRleHQuVFlQRV9GRzpcblx0XHRcdFx0ZmcgPSB0b2tlbi52YWx1ZSB8fCBudWxsO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgUk9ULlRleHQuVFlQRV9CRzpcblx0XHRcdFx0YmcgPSB0b2tlbi52YWx1ZSB8fCBudWxsO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgUk9ULlRleHQuVFlQRV9ORVdMSU5FOlxuXHRcdFx0XHRjeCA9IHg7XG5cdFx0XHRcdGN5Kys7XG5cdFx0XHRcdGxpbmVzKytcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBsaW5lcztcbn1cblxuLyoqXG4gKiBUaW1lciB0aWNrOiB1cGRhdGUgZGlydHkgcGFydHNcbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLl90aWNrID0gZnVuY3Rpb24oKSB7XG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl90aWNrKTtcblxuXHRpZiAoIXRoaXMuX2RpcnR5KSB7IHJldHVybjsgfVxuXG5cdGlmICh0aGlzLl9kaXJ0eSA9PT0gdHJ1ZSkgeyAvKiBkcmF3IGFsbCAqL1xuXHRcdHRoaXMuX2NvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5fb3B0aW9ucy5iZztcblx0XHR0aGlzLl9jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuX2NvbnRleHQuY2FudmFzLndpZHRoLCB0aGlzLl9jb250ZXh0LmNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0Zm9yICh2YXIgaWQgaW4gdGhpcy5fZGF0YSkgeyAvKiByZWRyYXcgY2FjaGVkIGRhdGEgKi9cblx0XHRcdHRoaXMuX2RyYXcoaWQsIGZhbHNlKTtcblx0XHR9XG5cblx0fSBlbHNlIHsgLyogZHJhdyBvbmx5IGRpcnR5ICovXG5cdFx0Zm9yICh2YXIga2V5IGluIHRoaXMuX2RpcnR5KSB7XG5cdFx0XHR0aGlzLl9kcmF3KGtleSwgdHJ1ZSk7XG5cdFx0fVxuXHR9XG5cblx0dGhpcy5fZGlydHkgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFdoYXQgdG8gZHJhd1xuICogQHBhcmFtIHtib29sfSBjbGVhckJlZm9yZSBJcyBpdCBuZWNlc3NhcnkgdG8gY2xlYW4gYmVmb3JlP1xuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuX2RyYXcgPSBmdW5jdGlvbihrZXksIGNsZWFyQmVmb3JlKSB7XG5cdHZhciBkYXRhID0gdGhpcy5fZGF0YVtrZXldO1xuXHRpZiAoZGF0YVs0XSAhPSB0aGlzLl9vcHRpb25zLmJnKSB7IGNsZWFyQmVmb3JlID0gdHJ1ZTsgfVxuXG5cdHRoaXMuX2JhY2tlbmQuZHJhdyhkYXRhLCBjbGVhckJlZm9yZSk7XG59XG4vKipcbiAqIEBjbGFzcyBBYnN0cmFjdCBkaXNwbGF5IGJhY2tlbmQgbW9kdWxlXG4gKiBAcHJpdmF0ZVxuICovXG5ST1QuRGlzcGxheS5CYWNrZW5kID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHR0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbn1cblxuUk9ULkRpc3BsYXkuQmFja2VuZC5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbn1cblxuUk9ULkRpc3BsYXkuQmFja2VuZC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGRhdGEsIGNsZWFyQmVmb3JlKSB7XG59XG5cblJPVC5EaXNwbGF5LkJhY2tlbmQucHJvdG90eXBlLmNvbXB1dGVTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcbn1cblxuUk9ULkRpc3BsYXkuQmFja2VuZC5wcm90b3R5cGUuY29tcHV0ZUZvbnRTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcbn1cblxuUk9ULkRpc3BsYXkuQmFja2VuZC5wcm90b3R5cGUuZXZlbnRUb1Bvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xufVxuLyoqXG4gKiBAY2xhc3MgUmVjdGFuZ3VsYXIgYmFja2VuZFxuICogQHByaXZhdGVcbiAqL1xuUk9ULkRpc3BsYXkuUmVjdCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcblx0Uk9ULkRpc3BsYXkuQmFja2VuZC5jYWxsKHRoaXMsIGNvbnRleHQpO1xuXHRcblx0dGhpcy5fc3BhY2luZ1ggPSAwO1xuXHR0aGlzLl9zcGFjaW5nWSA9IDA7XG5cdHRoaXMuX2NhbnZhc0NhY2hlID0ge307XG5cdHRoaXMuX29wdGlvbnMgPSB7fTtcbn1cblJPVC5EaXNwbGF5LlJlY3QuZXh0ZW5kKFJPVC5EaXNwbGF5LkJhY2tlbmQpO1xuXG5ST1QuRGlzcGxheS5SZWN0LmNhY2hlID0gZmFsc2U7XG5cblJPVC5EaXNwbGF5LlJlY3QucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHRoaXMuX2NhbnZhc0NhY2hlID0ge307XG5cdHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuXG5cdHZhciBjaGFyV2lkdGggPSBNYXRoLmNlaWwodGhpcy5fY29udGV4dC5tZWFzdXJlVGV4dChcIldcIikud2lkdGgpO1xuXHR0aGlzLl9zcGFjaW5nWCA9IE1hdGguY2VpbChvcHRpb25zLnNwYWNpbmcgKiBjaGFyV2lkdGgpO1xuXHR0aGlzLl9zcGFjaW5nWSA9IE1hdGguY2VpbChvcHRpb25zLnNwYWNpbmcgKiBvcHRpb25zLmZvbnRTaXplKTtcblxuXHRpZiAodGhpcy5fb3B0aW9ucy5mb3JjZVNxdWFyZVJhdGlvKSB7XG5cdFx0dGhpcy5fc3BhY2luZ1ggPSB0aGlzLl9zcGFjaW5nWSA9IE1hdGgubWF4KHRoaXMuX3NwYWNpbmdYLCB0aGlzLl9zcGFjaW5nWSk7XG5cdH1cblxuXHR0aGlzLl9jb250ZXh0LmNhbnZhcy53aWR0aCA9IG9wdGlvbnMud2lkdGggKiB0aGlzLl9zcGFjaW5nWDtcblx0dGhpcy5fY29udGV4dC5jYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgKiB0aGlzLl9zcGFjaW5nWTtcbn1cblxuUk9ULkRpc3BsYXkuUmVjdC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGRhdGEsIGNsZWFyQmVmb3JlKSB7XG5cdGlmICh0aGlzLmNvbnN0cnVjdG9yLmNhY2hlKSB7XG5cdFx0dGhpcy5fZHJhd1dpdGhDYWNoZShkYXRhLCBjbGVhckJlZm9yZSk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5fZHJhd05vQ2FjaGUoZGF0YSwgY2xlYXJCZWZvcmUpO1xuXHR9XG59XG5cblJPVC5EaXNwbGF5LlJlY3QucHJvdG90eXBlLl9kcmF3V2l0aENhY2hlID0gZnVuY3Rpb24oZGF0YSwgY2xlYXJCZWZvcmUpIHtcblx0dmFyIHggPSBkYXRhWzBdO1xuXHR2YXIgeSA9IGRhdGFbMV07XG5cdHZhciBjaCA9IGRhdGFbMl07XG5cdHZhciBmZyA9IGRhdGFbM107XG5cdHZhciBiZyA9IGRhdGFbNF07XG5cblx0dmFyIGhhc2ggPSBcIlwiK2NoK2ZnK2JnO1xuXHRpZiAoaGFzaCBpbiB0aGlzLl9jYW52YXNDYWNoZSkge1xuXHRcdHZhciBjYW52YXMgPSB0aGlzLl9jYW52YXNDYWNoZVtoYXNoXTtcblx0fSBlbHNlIHtcblx0XHR2YXIgYiA9IHRoaXMuX29wdGlvbnMuYm9yZGVyO1xuXHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXHRcdHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXHRcdGNhbnZhcy53aWR0aCA9IHRoaXMuX3NwYWNpbmdYO1xuXHRcdGNhbnZhcy5oZWlnaHQgPSB0aGlzLl9zcGFjaW5nWTtcblx0XHRjdHguZmlsbFN0eWxlID0gYmc7XG5cdFx0Y3R4LmZpbGxSZWN0KGIsIGIsIGNhbnZhcy53aWR0aC1iLCBjYW52YXMuaGVpZ2h0LWIpO1xuXHRcdFxuXHRcdGlmIChjaCkge1xuXHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGZnO1xuXHRcdFx0Y3R4LmZvbnQgPSB0aGlzLl9jb250ZXh0LmZvbnQ7XG5cdFx0XHRjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcblx0XHRcdGN0eC50ZXh0QmFzZWxpbmUgPSBcIm1pZGRsZVwiO1xuXG5cdFx0XHR2YXIgY2hhcnMgPSBbXS5jb25jYXQoY2gpO1xuXHRcdFx0Zm9yICh2YXIgaT0wO2k8Y2hhcnMubGVuZ3RoO2krKykge1xuXHRcdFx0XHRjdHguZmlsbFRleHQoY2hhcnNbaV0sIHRoaXMuX3NwYWNpbmdYLzIsIE1hdGguY2VpbCh0aGlzLl9zcGFjaW5nWS8yKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuX2NhbnZhc0NhY2hlW2hhc2hdID0gY2FudmFzO1xuXHR9XG5cdFxuXHR0aGlzLl9jb250ZXh0LmRyYXdJbWFnZShjYW52YXMsIHgqdGhpcy5fc3BhY2luZ1gsIHkqdGhpcy5fc3BhY2luZ1kpO1xufVxuXG5ST1QuRGlzcGxheS5SZWN0LnByb3RvdHlwZS5fZHJhd05vQ2FjaGUgPSBmdW5jdGlvbihkYXRhLCBjbGVhckJlZm9yZSkge1xuXHR2YXIgeCA9IGRhdGFbMF07XG5cdHZhciB5ID0gZGF0YVsxXTtcblx0dmFyIGNoID0gZGF0YVsyXTtcblx0dmFyIGZnID0gZGF0YVszXTtcblx0dmFyIGJnID0gZGF0YVs0XTtcblxuXHRpZiAoY2xlYXJCZWZvcmUpIHsgXG5cdFx0dmFyIGIgPSB0aGlzLl9vcHRpb25zLmJvcmRlcjtcblx0XHR0aGlzLl9jb250ZXh0LmZpbGxTdHlsZSA9IGJnO1xuXHRcdHRoaXMuX2NvbnRleHQuZmlsbFJlY3QoeCp0aGlzLl9zcGFjaW5nWCArIGIsIHkqdGhpcy5fc3BhY2luZ1kgKyBiLCB0aGlzLl9zcGFjaW5nWCAtIGIsIHRoaXMuX3NwYWNpbmdZIC0gYik7XG5cdH1cblx0XG5cdGlmICghY2gpIHsgcmV0dXJuOyB9XG5cblx0dGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBmZztcblxuXHR2YXIgY2hhcnMgPSBbXS5jb25jYXQoY2gpO1xuXHRmb3IgKHZhciBpPTA7aTxjaGFycy5sZW5ndGg7aSsrKSB7XG5cdFx0dGhpcy5fY29udGV4dC5maWxsVGV4dChjaGFyc1tpXSwgKHgrMC41KSAqIHRoaXMuX3NwYWNpbmdYLCBNYXRoLmNlaWwoKHkrMC41KSAqIHRoaXMuX3NwYWNpbmdZKSk7XG5cdH1cbn1cblxuUk9ULkRpc3BsYXkuUmVjdC5wcm90b3R5cGUuY29tcHV0ZVNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHR2YXIgd2lkdGggPSBNYXRoLmZsb29yKGF2YWlsV2lkdGggLyB0aGlzLl9zcGFjaW5nWCk7XG5cdHZhciBoZWlnaHQgPSBNYXRoLmZsb29yKGF2YWlsSGVpZ2h0IC8gdGhpcy5fc3BhY2luZ1kpO1xuXHRyZXR1cm4gW3dpZHRoLCBoZWlnaHRdO1xufVxuXG5ST1QuRGlzcGxheS5SZWN0LnByb3RvdHlwZS5jb21wdXRlRm9udFNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHR2YXIgYm94V2lkdGggPSBNYXRoLmZsb29yKGF2YWlsV2lkdGggLyB0aGlzLl9vcHRpb25zLndpZHRoKTtcblx0dmFyIGJveEhlaWdodCA9IE1hdGguZmxvb3IoYXZhaWxIZWlnaHQgLyB0aGlzLl9vcHRpb25zLmhlaWdodCk7XG5cblx0LyogY29tcHV0ZSBjaGFyIHJhdGlvICovXG5cdHZhciBvbGRGb250ID0gdGhpcy5fY29udGV4dC5mb250O1xuXHR0aGlzLl9jb250ZXh0LmZvbnQgPSBcIjEwMHB4IFwiICsgdGhpcy5fb3B0aW9ucy5mb250RmFtaWx5O1xuXHR2YXIgd2lkdGggPSBNYXRoLmNlaWwodGhpcy5fY29udGV4dC5tZWFzdXJlVGV4dChcIldcIikud2lkdGgpO1xuXHR0aGlzLl9jb250ZXh0LmZvbnQgPSBvbGRGb250O1xuXHR2YXIgcmF0aW8gPSB3aWR0aCAvIDEwMDtcblx0XHRcblx0dmFyIHdpZHRoRnJhY3Rpb24gPSByYXRpbyAqIGJveEhlaWdodCAvIGJveFdpZHRoO1xuXHRpZiAod2lkdGhGcmFjdGlvbiA+IDEpIHsgLyogdG9vIHdpZGUgd2l0aCBjdXJyZW50IGFzcGVjdCByYXRpbyAqL1xuXHRcdGJveEhlaWdodCA9IE1hdGguZmxvb3IoYm94SGVpZ2h0IC8gd2lkdGhGcmFjdGlvbik7XG5cdH1cblx0cmV0dXJuIE1hdGguZmxvb3IoYm94SGVpZ2h0IC8gdGhpcy5fb3B0aW9ucy5zcGFjaW5nKTtcbn1cblxuUk9ULkRpc3BsYXkuUmVjdC5wcm90b3R5cGUuZXZlbnRUb1Bvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gW01hdGguZmxvb3IoeC90aGlzLl9zcGFjaW5nWCksIE1hdGguZmxvb3IoeS90aGlzLl9zcGFjaW5nWSldO1xufVxuLyoqXG4gKiBAY2xhc3MgSGV4YWdvbmFsIGJhY2tlbmRcbiAqIEBwcml2YXRlXG4gKi9cblJPVC5EaXNwbGF5LkhleCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcblx0Uk9ULkRpc3BsYXkuQmFja2VuZC5jYWxsKHRoaXMsIGNvbnRleHQpO1xuXG5cdHRoaXMuX3NwYWNpbmdYID0gMDtcblx0dGhpcy5fc3BhY2luZ1kgPSAwO1xuXHR0aGlzLl9oZXhTaXplID0gMDtcblx0dGhpcy5fb3B0aW9ucyA9IHt9O1xufVxuUk9ULkRpc3BsYXkuSGV4LmV4dGVuZChST1QuRGlzcGxheS5CYWNrZW5kKTtcblxuUk9ULkRpc3BsYXkuSGV4LnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHR0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcblxuXHQvKiBGSVhNRSBjaGFyIHNpemUgY29tcHV0YXRpb24gZG9lcyBub3QgcmVzcGVjdCB0cmFuc3Bvc2VkIGhleGVzICovXG5cdHZhciBjaGFyV2lkdGggPSBNYXRoLmNlaWwodGhpcy5fY29udGV4dC5tZWFzdXJlVGV4dChcIldcIikud2lkdGgpO1xuXHR0aGlzLl9oZXhTaXplID0gTWF0aC5mbG9vcihvcHRpb25zLnNwYWNpbmcgKiAob3B0aW9ucy5mb250U2l6ZSArIGNoYXJXaWR0aC9NYXRoLnNxcnQoMykpIC8gMik7XG5cdHRoaXMuX3NwYWNpbmdYID0gdGhpcy5faGV4U2l6ZSAqIE1hdGguc3FydCgzKSAvIDI7XG5cdHRoaXMuX3NwYWNpbmdZID0gdGhpcy5faGV4U2l6ZSAqIDEuNTtcblxuXHRpZiAob3B0aW9ucy50cmFuc3Bvc2UpIHtcblx0XHR2YXIgeHByb3AgPSBcImhlaWdodFwiO1xuXHRcdHZhciB5cHJvcCA9IFwid2lkdGhcIjtcblx0fSBlbHNlIHtcblx0XHR2YXIgeHByb3AgPSBcIndpZHRoXCI7XG5cdFx0dmFyIHlwcm9wID0gXCJoZWlnaHRcIjtcblx0fVxuXHR0aGlzLl9jb250ZXh0LmNhbnZhc1t4cHJvcF0gPSBNYXRoLmNlaWwoIChvcHRpb25zLndpZHRoICsgMSkgKiB0aGlzLl9zcGFjaW5nWCApO1xuXHR0aGlzLl9jb250ZXh0LmNhbnZhc1t5cHJvcF0gPSBNYXRoLmNlaWwoIChvcHRpb25zLmhlaWdodCAtIDEpICogdGhpcy5fc3BhY2luZ1kgKyAyKnRoaXMuX2hleFNpemUgKTtcbn1cblxuUk9ULkRpc3BsYXkuSGV4LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oZGF0YSwgY2xlYXJCZWZvcmUpIHtcblx0dmFyIHggPSBkYXRhWzBdO1xuXHR2YXIgeSA9IGRhdGFbMV07XG5cdHZhciBjaCA9IGRhdGFbMl07XG5cdHZhciBmZyA9IGRhdGFbM107XG5cdHZhciBiZyA9IGRhdGFbNF07XG5cblx0dmFyIHB4ID0gW1xuXHRcdCh4KzEpICogdGhpcy5fc3BhY2luZ1gsXG5cdFx0eSAqIHRoaXMuX3NwYWNpbmdZICsgdGhpcy5faGV4U2l6ZVxuXHRdO1xuXHRpZiAodGhpcy5fb3B0aW9ucy50cmFuc3Bvc2UpIHsgcHgucmV2ZXJzZSgpOyB9XG5cblx0aWYgKGNsZWFyQmVmb3JlKSB7IFxuXHRcdHRoaXMuX2NvbnRleHQuZmlsbFN0eWxlID0gYmc7XG5cdFx0dGhpcy5fZmlsbChweFswXSwgcHhbMV0pO1xuXHR9XG5cdFxuXHRpZiAoIWNoKSB7IHJldHVybjsgfVxuXG5cdHRoaXMuX2NvbnRleHQuZmlsbFN0eWxlID0gZmc7XG5cblx0dmFyIGNoYXJzID0gW10uY29uY2F0KGNoKTtcblx0Zm9yICh2YXIgaT0wO2k8Y2hhcnMubGVuZ3RoO2krKykge1xuXHRcdHRoaXMuX2NvbnRleHQuZmlsbFRleHQoY2hhcnNbaV0sIHB4WzBdLCBNYXRoLmNlaWwocHhbMV0pKTtcblx0fVxufVxuXG5ST1QuRGlzcGxheS5IZXgucHJvdG90eXBlLmNvbXB1dGVTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0aWYgKHRoaXMuX29wdGlvbnMudHJhbnNwb3NlKSB7XG5cdFx0YXZhaWxXaWR0aCArPSBhdmFpbEhlaWdodDtcblx0XHRhdmFpbEhlaWdodCA9IGF2YWlsV2lkdGggLSBhdmFpbEhlaWdodDtcblx0XHRhdmFpbFdpZHRoIC09IGF2YWlsSGVpZ2h0O1xuXHR9XG5cblx0dmFyIHdpZHRoID0gTWF0aC5mbG9vcihhdmFpbFdpZHRoIC8gdGhpcy5fc3BhY2luZ1gpIC0gMTtcblx0dmFyIGhlaWdodCA9IE1hdGguZmxvb3IoKGF2YWlsSGVpZ2h0IC0gMip0aGlzLl9oZXhTaXplKSAvIHRoaXMuX3NwYWNpbmdZICsgMSk7XG5cdHJldHVybiBbd2lkdGgsIGhlaWdodF07XG59XG5cblJPVC5EaXNwbGF5LkhleC5wcm90b3R5cGUuY29tcHV0ZUZvbnRTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0aWYgKHRoaXMuX29wdGlvbnMudHJhbnNwb3NlKSB7XG5cdFx0YXZhaWxXaWR0aCArPSBhdmFpbEhlaWdodDtcblx0XHRhdmFpbEhlaWdodCA9IGF2YWlsV2lkdGggLSBhdmFpbEhlaWdodDtcblx0XHRhdmFpbFdpZHRoIC09IGF2YWlsSGVpZ2h0O1xuXHR9XG5cblx0dmFyIGhleFNpemVXaWR0aCA9IDIqYXZhaWxXaWR0aCAvICgodGhpcy5fb3B0aW9ucy53aWR0aCsxKSAqIE1hdGguc3FydCgzKSkgLSAxO1xuXHR2YXIgaGV4U2l6ZUhlaWdodCA9IGF2YWlsSGVpZ2h0IC8gKDIgKyAxLjUqKHRoaXMuX29wdGlvbnMuaGVpZ2h0LTEpKTtcblx0dmFyIGhleFNpemUgPSBNYXRoLm1pbihoZXhTaXplV2lkdGgsIGhleFNpemVIZWlnaHQpO1xuXG5cdC8qIGNvbXB1dGUgY2hhciByYXRpbyAqL1xuXHR2YXIgb2xkRm9udCA9IHRoaXMuX2NvbnRleHQuZm9udDtcblx0dGhpcy5fY29udGV4dC5mb250ID0gXCIxMDBweCBcIiArIHRoaXMuX29wdGlvbnMuZm9udEZhbWlseTtcblx0dmFyIHdpZHRoID0gTWF0aC5jZWlsKHRoaXMuX2NvbnRleHQubWVhc3VyZVRleHQoXCJXXCIpLndpZHRoKTtcblx0dGhpcy5fY29udGV4dC5mb250ID0gb2xkRm9udDtcblx0dmFyIHJhdGlvID0gd2lkdGggLyAxMDA7XG5cblx0aGV4U2l6ZSA9IE1hdGguZmxvb3IoaGV4U2l6ZSkrMTsgLyogY2xvc2VzdCBsYXJnZXIgaGV4U2l6ZSAqL1xuXG5cdC8qIEZJWE1FIGNoYXIgc2l6ZSBjb21wdXRhdGlvbiBkb2VzIG5vdCByZXNwZWN0IHRyYW5zcG9zZWQgaGV4ZXMgKi9cblx0dmFyIGZvbnRTaXplID0gMipoZXhTaXplIC8gKHRoaXMuX29wdGlvbnMuc3BhY2luZyAqICgxICsgcmF0aW8gLyBNYXRoLnNxcnQoMykpKTtcblxuXHQvKiBjbG9zZXN0IHNtYWxsZXIgZm9udFNpemUgKi9cblx0cmV0dXJuIE1hdGguY2VpbChmb250U2l6ZSktMTtcbn1cblxuUk9ULkRpc3BsYXkuSGV4LnByb3RvdHlwZS5ldmVudFRvUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG5cdGlmICh0aGlzLl9vcHRpb25zLnRyYW5zcG9zZSkge1xuXHRcdHggKz0geTtcblx0XHR5ID0geC15O1xuXHRcdHggLT0geTtcblx0XHR2YXIgcHJvcCA9IFwid2lkdGhcIjtcblx0fSBlbHNlIHtcblx0XHR2YXIgcHJvcCA9IFwiaGVpZ2h0XCI7XG5cdH1cblx0dmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LmNhbnZhc1twcm9wXSAvIHRoaXMuX29wdGlvbnNbcHJvcF07XG5cdHkgPSBNYXRoLmZsb29yKHkvc2l6ZSk7XG5cblx0aWYgKHkubW9kKDIpKSB7IC8qIG9kZCByb3cgKi9cblx0XHR4IC09IHRoaXMuX3NwYWNpbmdYO1xuXHRcdHggPSAxICsgMipNYXRoLmZsb29yKHgvKDIqdGhpcy5fc3BhY2luZ1gpKTtcblx0fSBlbHNlIHtcblx0XHR4ID0gMipNYXRoLmZsb29yKHgvKDIqdGhpcy5fc3BhY2luZ1gpKTtcblx0fVxuXHRcblx0cmV0dXJuIFt4LCB5XTtcbn1cblxuLyoqXG4gKiBBcmd1bWVudHMgYXJlIHBpeGVsIHZhbHVlcy4gSWYgXCJ0cmFuc3Bvc2VkXCIgbW9kZSBpcyBlbmFibGVkLCB0aGVuIHRoZXNlIHR3byBhcmUgYWxyZWFkeSBzd2FwcGVkLlxuICovXG5ST1QuRGlzcGxheS5IZXgucHJvdG90eXBlLl9maWxsID0gZnVuY3Rpb24oY3gsIGN5KSB7XG5cdHZhciBhID0gdGhpcy5faGV4U2l6ZTtcblx0dmFyIGIgPSB0aGlzLl9vcHRpb25zLmJvcmRlcjtcblx0XG5cdHRoaXMuX2NvbnRleHQuYmVnaW5QYXRoKCk7XG5cblx0aWYgKHRoaXMuX29wdGlvbnMudHJhbnNwb3NlKSB7XG5cdFx0dGhpcy5fY29udGV4dC5tb3ZlVG8oY3gtYStiLFx0Y3kpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4LWEvMitiLFx0Y3krdGhpcy5fc3BhY2luZ1gtYik7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3grYS8yLWIsXHRjeSt0aGlzLl9zcGFjaW5nWC1iKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeCthLWIsXHRjeSk7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3grYS8yLWIsXHRjeS10aGlzLl9zcGFjaW5nWCtiKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeC1hLzIrYixcdGN5LXRoaXMuX3NwYWNpbmdYK2IpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4LWErYixcdGN5KTtcblx0fSBlbHNlIHtcblx0XHR0aGlzLl9jb250ZXh0Lm1vdmVUbyhjeCxcdFx0XHRcdFx0Y3ktYStiKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeCt0aGlzLl9zcGFjaW5nWC1iLFx0Y3ktYS8yK2IpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4K3RoaXMuX3NwYWNpbmdYLWIsXHRjeSthLzItYik7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3gsXHRcdFx0XHRcdGN5K2EtYik7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3gtdGhpcy5fc3BhY2luZ1grYixcdGN5K2EvMi1iKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeC10aGlzLl9zcGFjaW5nWCtiLFx0Y3ktYS8yK2IpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4LFx0XHRcdFx0XHRjeS1hK2IpO1xuXHR9XG5cdHRoaXMuX2NvbnRleHQuZmlsbCgpO1xufVxuLyoqXG4gKiBAY2xhc3MgVGlsZSBiYWNrZW5kXG4gKiBAcHJpdmF0ZVxuICovXG5ST1QuRGlzcGxheS5UaWxlID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRST1QuRGlzcGxheS5SZWN0LmNhbGwodGhpcywgY29udGV4dCk7XG5cdFxuXHR0aGlzLl9vcHRpb25zID0ge307XG5cdHRoaXMuX2NvbG9yQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbn1cblJPVC5EaXNwbGF5LlRpbGUuZXh0ZW5kKFJPVC5EaXNwbGF5LlJlY3QpO1xuXG5ST1QuRGlzcGxheS5UaWxlLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHR0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcblx0dGhpcy5fY29udGV4dC5jYW52YXMud2lkdGggPSBvcHRpb25zLndpZHRoICogb3B0aW9ucy50aWxlV2lkdGg7XG5cdHRoaXMuX2NvbnRleHQuY2FudmFzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0ICogb3B0aW9ucy50aWxlSGVpZ2h0O1xuXHR0aGlzLl9jb2xvckNhbnZhcy53aWR0aCA9IG9wdGlvbnMudGlsZVdpZHRoO1xuXHR0aGlzLl9jb2xvckNhbnZhcy5oZWlnaHQgPSBvcHRpb25zLnRpbGVIZWlnaHQ7XG59XG5cblJPVC5EaXNwbGF5LlRpbGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihkYXRhLCBjbGVhckJlZm9yZSkge1xuXHR2YXIgeCA9IGRhdGFbMF07XG5cdHZhciB5ID0gZGF0YVsxXTtcblx0dmFyIGNoID0gZGF0YVsyXTtcblx0dmFyIGZnID0gZGF0YVszXTtcblx0dmFyIGJnID0gZGF0YVs0XTtcblxuXHR2YXIgdGlsZVdpZHRoID0gdGhpcy5fb3B0aW9ucy50aWxlV2lkdGg7XG5cdHZhciB0aWxlSGVpZ2h0ID0gdGhpcy5fb3B0aW9ucy50aWxlSGVpZ2h0O1xuXG5cdGlmIChjbGVhckJlZm9yZSkge1xuXHRcdGlmICh0aGlzLl9vcHRpb25zLnRpbGVDb2xvcml6ZSkge1xuXHRcdFx0dGhpcy5fY29udGV4dC5jbGVhclJlY3QoeCp0aWxlV2lkdGgsIHkqdGlsZUhlaWdodCwgdGlsZVdpZHRoLCB0aWxlSGVpZ2h0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBiZztcblx0XHRcdHRoaXMuX2NvbnRleHQuZmlsbFJlY3QoeCp0aWxlV2lkdGgsIHkqdGlsZUhlaWdodCwgdGlsZVdpZHRoLCB0aWxlSGVpZ2h0KTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIWNoKSB7IHJldHVybjsgfVxuXG5cdHZhciBjaGFycyA9IFtdLmNvbmNhdChjaCk7XG5cdGZvciAodmFyIGk9MDtpPGNoYXJzLmxlbmd0aDtpKyspIHtcblx0XHR2YXIgdGlsZSA9IHRoaXMuX29wdGlvbnMudGlsZU1hcFtjaGFyc1tpXV07XG5cdFx0aWYgKCF0aWxlKSB7IHRocm93IG5ldyBFcnJvcihcIkNoYXIgJ1wiICsgY2hhcnNbaV0gKyBcIicgbm90IGZvdW5kIGluIHRpbGVNYXBcIik7IH1cblx0XHRcblx0XHRpZiAodGhpcy5fb3B0aW9ucy50aWxlQ29sb3JpemUpIHsgLyogYXBwbHkgY29sb3JpemF0aW9uICovXG5cdFx0XHR2YXIgY2FudmFzID0gdGhpcy5fY29sb3JDYW52YXM7XG5cdFx0XHR2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cdFx0XHRjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuXG5cdFx0XHRjb250ZXh0LmRyYXdJbWFnZShcblx0XHRcdFx0dGhpcy5fb3B0aW9ucy50aWxlU2V0LFxuXHRcdFx0XHR0aWxlWzBdLCB0aWxlWzFdLCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQsXG5cdFx0XHRcdDAsIDAsIHRpbGVXaWR0aCwgdGlsZUhlaWdodFxuXHRcdFx0KTtcblxuXHRcdFx0aWYgKGZnICE9IFwidHJhbnNwYXJlbnRcIikge1xuXHRcdFx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IGZnO1xuXHRcdFx0XHRjb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLWF0b3BcIjtcblx0XHRcdFx0Y29udGV4dC5maWxsUmVjdCgwLCAwLCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYmcgIT0gXCJ0cmFuc3BhcmVudFwiKSB7XG5cdFx0XHRcdGNvbnRleHQuZmlsbFN0eWxlID0gYmc7XG5cdFx0XHRcdGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdmVyXCI7XG5cdFx0XHRcdGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGlsZVdpZHRoLCB0aWxlSGVpZ2h0KTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fY29udGV4dC5kcmF3SW1hZ2UoY2FudmFzLCB4KnRpbGVXaWR0aCwgeSp0aWxlSGVpZ2h0LCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuXG5cdFx0fSBlbHNlIHsgLyogbm8gY29sb3JpemluZywgZWFzeSAqL1xuXHRcdFx0dGhpcy5fY29udGV4dC5kcmF3SW1hZ2UoXG5cdFx0XHRcdHRoaXMuX29wdGlvbnMudGlsZVNldCxcblx0XHRcdFx0dGlsZVswXSwgdGlsZVsxXSwgdGlsZVdpZHRoLCB0aWxlSGVpZ2h0LFxuXHRcdFx0XHR4KnRpbGVXaWR0aCwgeSp0aWxlSGVpZ2h0LCB0aWxlV2lkdGgsIHRpbGVIZWlnaHRcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG59XG5cblJPVC5EaXNwbGF5LlRpbGUucHJvdG90eXBlLmNvbXB1dGVTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0dmFyIHdpZHRoID0gTWF0aC5mbG9vcihhdmFpbFdpZHRoIC8gdGhpcy5fb3B0aW9ucy50aWxlV2lkdGgpO1xuXHR2YXIgaGVpZ2h0ID0gTWF0aC5mbG9vcihhdmFpbEhlaWdodCAvIHRoaXMuX29wdGlvbnMudGlsZUhlaWdodCk7XG5cdHJldHVybiBbd2lkdGgsIGhlaWdodF07XG59XG5cblJPVC5EaXNwbGF5LlRpbGUucHJvdG90eXBlLmNvbXB1dGVGb250U2l6ZSA9IGZ1bmN0aW9uKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0KSB7XG5cdHZhciB3aWR0aCA9IE1hdGguZmxvb3IoYXZhaWxXaWR0aCAvIHRoaXMuX29wdGlvbnMud2lkdGgpO1xuXHR2YXIgaGVpZ2h0ID0gTWF0aC5mbG9vcihhdmFpbEhlaWdodCAvIHRoaXMuX29wdGlvbnMuaGVpZ2h0KTtcblx0cmV0dXJuIFt3aWR0aCwgaGVpZ2h0XTtcbn1cblxuUk9ULkRpc3BsYXkuVGlsZS5wcm90b3R5cGUuZXZlbnRUb1Bvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gW01hdGguZmxvb3IoeC90aGlzLl9vcHRpb25zLnRpbGVXaWR0aCksIE1hdGguZmxvb3IoeS90aGlzLl9vcHRpb25zLnRpbGVIZWlnaHQpXTtcbn1cbi8qKlxuICogQG5hbWVzcGFjZVxuICogVGhpcyBjb2RlIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIEFsZWEgYWxnb3JpdGhtOyAoQykgMjAxMCBKb2hhbm5lcyBCYWFnw7hlLlxuICogQWxlYSBpcyBsaWNlbnNlZCBhY2NvcmRpbmcgdG8gdGhlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UuXG4gKi9cblJPVC5STkcgPSB7XG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBcblx0ICovXG5cdGdldFNlZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLl9zZWVkO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge251bWJlcn0gc2VlZCBTZWVkIHRoZSBudW1iZXIgZ2VuZXJhdG9yXG5cdCAqL1xuXHRzZXRTZWVkOiBmdW5jdGlvbihzZWVkKSB7XG5cdFx0c2VlZCA9IChzZWVkIDwgMSA/IDEvc2VlZCA6IHNlZWQpO1xuXG5cdFx0dGhpcy5fc2VlZCA9IHNlZWQ7XG5cdFx0dGhpcy5fczAgPSAoc2VlZCA+Pj4gMCkgKiB0aGlzLl9mcmFjO1xuXG5cdFx0c2VlZCA9IChzZWVkKjY5MDY5ICsgMSkgPj4+IDA7XG5cdFx0dGhpcy5fczEgPSBzZWVkICogdGhpcy5fZnJhYztcblxuXHRcdHNlZWQgPSAoc2VlZCo2OTA2OSArIDEpID4+PiAwO1xuXHRcdHRoaXMuX3MyID0gc2VlZCAqIHRoaXMuX2ZyYWM7XG5cblx0XHR0aGlzLl9jID0gMTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogQHJldHVybnMge2Zsb2F0fSBQc2V1ZG9yYW5kb20gdmFsdWUgWzAsMSksIHVuaWZvcm1seSBkaXN0cmlidXRlZFxuXHQgKi9cblx0Z2V0VW5pZm9ybTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHQgPSAyMDkxNjM5ICogdGhpcy5fczAgKyB0aGlzLl9jICogdGhpcy5fZnJhYztcblx0XHR0aGlzLl9zMCA9IHRoaXMuX3MxO1xuXHRcdHRoaXMuX3MxID0gdGhpcy5fczI7XG5cdFx0dGhpcy5fYyA9IHQgfCAwO1xuXHRcdHRoaXMuX3MyID0gdCAtIHRoaXMuX2M7XG5cdFx0cmV0dXJuIHRoaXMuX3MyO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge2ludH0gbG93ZXJCb3VuZCBUaGUgbG93ZXIgZW5kIG9mIHRoZSByYW5nZSB0byByZXR1cm4gYSB2YWx1ZSBmcm9tLCBpbmNsdXNpdmVcblx0ICogQHBhcmFtIHtpbnR9IHVwcGVyQm91bmQgVGhlIHVwcGVyIGVuZCBvZiB0aGUgcmFuZ2UgdG8gcmV0dXJuIGEgdmFsdWUgZnJvbSwgaW5jbHVzaXZlXG5cdCAqIEByZXR1cm5zIHtpbnR9IFBzZXVkb3JhbmRvbSB2YWx1ZSBbbG93ZXJCb3VuZCwgdXBwZXJCb3VuZF0sIHVzaW5nIFJPVC5STkcuZ2V0VW5pZm9ybSgpIHRvIGRpc3RyaWJ1dGUgdGhlIHZhbHVlXG5cdCAqL1xuXHRnZXRVbmlmb3JtSW50OiBmdW5jdGlvbihsb3dlckJvdW5kLCB1cHBlckJvdW5kKSB7XG5cdFx0dmFyIG1heCA9IE1hdGgubWF4KGxvd2VyQm91bmQsIHVwcGVyQm91bmQpO1xuXHRcdHZhciBtaW4gPSBNYXRoLm1pbihsb3dlckJvdW5kLCB1cHBlckJvdW5kKTtcblx0XHRyZXR1cm4gTWF0aC5mbG9vcih0aGlzLmdldFVuaWZvcm0oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7ZmxvYXR9IFttZWFuPTBdIE1lYW4gdmFsdWVcblx0ICogQHBhcmFtIHtmbG9hdH0gW3N0ZGRldj0xXSBTdGFuZGFyZCBkZXZpYXRpb24uIH45NSUgb2YgdGhlIGFic29sdXRlIHZhbHVlcyB3aWxsIGJlIGxvd2VyIHRoYW4gMipzdGRkZXYuXG5cdCAqIEByZXR1cm5zIHtmbG9hdH0gQSBub3JtYWxseSBkaXN0cmlidXRlZCBwc2V1ZG9yYW5kb20gdmFsdWVcblx0ICovXG5cdGdldE5vcm1hbDogZnVuY3Rpb24obWVhbiwgc3RkZGV2KSB7XG5cdFx0ZG8ge1xuXHRcdFx0dmFyIHUgPSAyKnRoaXMuZ2V0VW5pZm9ybSgpLTE7XG5cdFx0XHR2YXIgdiA9IDIqdGhpcy5nZXRVbmlmb3JtKCktMTtcblx0XHRcdHZhciByID0gdSp1ICsgdip2O1xuXHRcdH0gd2hpbGUgKHIgPiAxIHx8IHIgPT0gMCk7XG5cblx0XHR2YXIgZ2F1c3MgPSB1ICogTWF0aC5zcXJ0KC0yKk1hdGgubG9nKHIpL3IpO1xuXHRcdHJldHVybiAobWVhbiB8fCAwKSArIGdhdXNzKihzdGRkZXYgfHwgMSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIHtpbnR9IFBzZXVkb3JhbmRvbSB2YWx1ZSBbMSwxMDBdIGluY2x1c2l2ZSwgdW5pZm9ybWx5IGRpc3RyaWJ1dGVkXG5cdCAqL1xuXHRnZXRQZXJjZW50YWdlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gMSArIE1hdGguZmxvb3IodGhpcy5nZXRVbmlmb3JtKCkqMTAwKTtcblx0fSxcblx0XG5cdC8qKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBrZXk9d2hhdGV2ZXIsIHZhbHVlPXdlaWdodCAocmVsYXRpdmUgcHJvYmFiaWxpdHkpXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IHdoYXRldmVyXG5cdCAqL1xuXHRnZXRXZWlnaHRlZFZhbHVlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIHRvdGFsID0gMDtcblx0XHRcblx0XHRmb3IgKHZhciBpZCBpbiBkYXRhKSB7XG5cdFx0XHR0b3RhbCArPSBkYXRhW2lkXTtcblx0XHR9XG5cdFx0dmFyIHJhbmRvbSA9IHRoaXMuZ2V0VW5pZm9ybSgpKnRvdGFsO1xuXHRcdFxuXHRcdHZhciBwYXJ0ID0gMDtcblx0XHRmb3IgKHZhciBpZCBpbiBkYXRhKSB7XG5cdFx0XHRwYXJ0ICs9IGRhdGFbaWRdO1xuXHRcdFx0aWYgKHJhbmRvbSA8IHBhcnQpIHsgcmV0dXJuIGlkOyB9XG5cdFx0fVxuXG5cdFx0Ly8gSWYgYnkgc29tZSBmbG9hdGluZy1wb2ludCBhbm5veWFuY2Ugd2UgaGF2ZVxuXHRcdC8vIHJhbmRvbSA+PSB0b3RhbCwganVzdCByZXR1cm4gdGhlIGxhc3QgaWQuXG5cdFx0cmV0dXJuIGlkO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgUk5HIHN0YXRlLiBVc2VmdWwgZm9yIHN0b3JpbmcgdGhlIHN0YXRlIGFuZCByZS1zZXR0aW5nIGl0IHZpYSBzZXRTdGF0ZS5cblx0ICogQHJldHVybnMgez99IEludGVybmFsIHN0YXRlXG5cdCAqL1xuXHRnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFt0aGlzLl9zMCwgdGhpcy5fczEsIHRoaXMuX3MyLCB0aGlzLl9jXTtcblx0fSxcblxuXHQvKipcblx0ICogU2V0IGEgcHJldmlvdXNseSByZXRyaWV2ZWQgc3RhdGUuXG5cdCAqIEBwYXJhbSB7P30gc3RhdGVcblx0ICovXG5cdHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSkge1xuXHRcdHRoaXMuX3MwID0gc3RhdGVbMF07XG5cdFx0dGhpcy5fczEgPSBzdGF0ZVsxXTtcblx0XHR0aGlzLl9zMiA9IHN0YXRlWzJdO1xuXHRcdHRoaXMuX2MgID0gc3RhdGVbM107XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBjbG9uZWQgUk5HXG5cdCAqL1xuXHRjbG9uZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsb25lID0gT2JqZWN0LmNyZWF0ZSh0aGlzKTtcblx0XHRjbG9uZS5zZXRTdGF0ZSh0aGlzLmdldFN0YXRlKCkpO1xuXHRcdHJldHVybiBjbG9uZTtcblx0fSxcblxuXHRfczA6IDAsXG5cdF9zMTogMCxcblx0X3MyOiAwLFxuXHRfYzogMCxcblx0X2ZyYWM6IDIuMzI4MzA2NDM2NTM4Njk2M2UtMTAgLyogMl4tMzIgKi9cbn1cblxuUk9ULlJORy5zZXRTZWVkKERhdGUubm93KCkpO1xuLyoqXG4gKiBAY2xhc3MgKE1hcmtvdiBwcm9jZXNzKS1iYXNlZCBzdHJpbmcgZ2VuZXJhdG9yLiBcbiAqIENvcGllZCBmcm9tIGEgPGEgaHJlZj1cImh0dHA6Ly93d3cucm9ndWViYXNpbi5yb2d1ZWxpa2VkZXZlbG9wbWVudC5vcmcvaW5kZXgucGhwP3RpdGxlPU5hbWVzX2Zyb21fYV9oaWdoX29yZGVyX01hcmtvdl9Qcm9jZXNzX2FuZF9hX3NpbXBsaWZpZWRfS2F0el9iYWNrLW9mZl9zY2hlbWVcIj5Sb2d1ZUJhc2luIGFydGljbGU8L2E+LiBcbiAqIE9mZmVycyBjb25maWd1cmFibGUgb3JkZXIgYW5kIHByaW9yLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtib29sfSBbb3B0aW9ucy53b3Jkcz1mYWxzZV0gVXNlIHdvcmQgbW9kZT9cbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy5vcmRlcj0zXVxuICogQHBhcmFtIHtmbG9hdH0gW29wdGlvbnMucHJpb3I9MC4wMDFdXG4gKi9cblJPVC5TdHJpbmdHZW5lcmF0b3IgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHRoaXMuX29wdGlvbnMgPSB7XG5cdFx0d29yZHM6IGZhbHNlLFxuXHRcdG9yZGVyOiAzLFxuXHRcdHByaW9yOiAwLjAwMVxuXHR9XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyB0aGlzLl9vcHRpb25zW3BdID0gb3B0aW9uc1twXTsgfVxuXG5cdHRoaXMuX2JvdW5kYXJ5ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgwKTtcblx0dGhpcy5fc3VmZml4ID0gdGhpcy5fYm91bmRhcnk7XG5cdHRoaXMuX3ByZWZpeCA9IFtdO1xuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl9vcHRpb25zLm9yZGVyO2krKykgeyB0aGlzLl9wcmVmaXgucHVzaCh0aGlzLl9ib3VuZGFyeSk7IH1cblxuXHR0aGlzLl9wcmlvclZhbHVlcyA9IHt9O1xuXHR0aGlzLl9wcmlvclZhbHVlc1t0aGlzLl9ib3VuZGFyeV0gPSB0aGlzLl9vcHRpb25zLnByaW9yO1xuXG5cdHRoaXMuX2RhdGEgPSB7fTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxlYXJuaW5nIGRhdGFcbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fZGF0YSA9IHt9O1xuXHR0aGlzLl9wcmlvclZhbHVlcyA9IHt9O1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEdlbmVyYXRlZCBzdHJpbmdcbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuZ2VuZXJhdGUgPSBmdW5jdGlvbigpIHtcblx0dmFyIHJlc3VsdCA9IFt0aGlzLl9zYW1wbGUodGhpcy5fcHJlZml4KV07XG5cdHdoaWxlIChyZXN1bHRbcmVzdWx0Lmxlbmd0aC0xXSAhPSB0aGlzLl9ib3VuZGFyeSkge1xuXHRcdHJlc3VsdC5wdXNoKHRoaXMuX3NhbXBsZShyZXN1bHQpKTtcblx0fVxuXHRyZXR1cm4gdGhpcy5fam9pbihyZXN1bHQuc2xpY2UoMCwgLTEpKTtcbn1cblxuLyoqXG4gKiBPYnNlcnZlIChsZWFybikgYSBzdHJpbmcgZnJvbSBhIHRyYWluaW5nIHNldFxuICovXG5ST1QuU3RyaW5nR2VuZXJhdG9yLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG5cdHZhciB0b2tlbnMgPSB0aGlzLl9zcGxpdChzdHJpbmcpO1xuXG5cdGZvciAodmFyIGk9MDsgaTx0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0XHR0aGlzLl9wcmlvclZhbHVlc1t0b2tlbnNbaV1dID0gdGhpcy5fb3B0aW9ucy5wcmlvcjtcblx0fVxuXG5cdHRva2VucyA9IHRoaXMuX3ByZWZpeC5jb25jYXQodG9rZW5zKS5jb25jYXQodGhpcy5fc3VmZml4KTsgLyogYWRkIGJvdW5kYXJ5IHN5bWJvbHMgKi9cblxuXHRmb3IgKHZhciBpPXRoaXMuX29wdGlvbnMub3JkZXI7IGk8dG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGNvbnRleHQgPSB0b2tlbnMuc2xpY2UoaS10aGlzLl9vcHRpb25zLm9yZGVyLCBpKTtcblx0XHR2YXIgZXZlbnQgPSB0b2tlbnNbaV07XG5cdFx0Zm9yICh2YXIgaj0wOyBqPGNvbnRleHQubGVuZ3RoOyBqKyspIHtcblx0XHRcdHZhciBzdWJjb250ZXh0ID0gY29udGV4dC5zbGljZShqKTtcblx0XHRcdHRoaXMuX29ic2VydmVFdmVudChzdWJjb250ZXh0LCBldmVudCk7XG5cdFx0fVxuXHR9XG59XG5cblJPVC5TdHJpbmdHZW5lcmF0b3IucHJvdG90eXBlLmdldFN0YXRzID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwYXJ0cyA9IFtdO1xuXG5cdHZhciBwcmlvckNvdW50ID0gMDtcblx0Zm9yICh2YXIgcCBpbiB0aGlzLl9wcmlvclZhbHVlcykgeyBwcmlvckNvdW50Kys7IH1cblx0cHJpb3JDb3VudC0tOyAvKiBib3VuZGFyeSAqL1xuXHRwYXJ0cy5wdXNoKFwiZGlzdGluY3Qgc2FtcGxlczogXCIgKyBwcmlvckNvdW50KTtcblxuXHR2YXIgZGF0YUNvdW50ID0gMDtcblx0dmFyIGV2ZW50Q291bnQgPSAwO1xuXHRmb3IgKHZhciBwIGluIHRoaXMuX2RhdGEpIHsgXG5cdFx0ZGF0YUNvdW50Kys7IFxuXHRcdGZvciAodmFyIGtleSBpbiB0aGlzLl9kYXRhW3BdKSB7XG5cdFx0XHRldmVudENvdW50Kys7XG5cdFx0fVxuXHR9XG5cdHBhcnRzLnB1c2goXCJkaWN0aW9uYXJ5IHNpemUgKGNvbnRleHRzKTogXCIgKyBkYXRhQ291bnQpO1xuXHRwYXJ0cy5wdXNoKFwiZGljdGlvbmFyeSBzaXplIChldmVudHMpOiBcIiArIGV2ZW50Q291bnQpO1xuXG5cdHJldHVybiBwYXJ0cy5qb2luKFwiLCBcIik7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9XG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cblJPVC5TdHJpbmdHZW5lcmF0b3IucHJvdG90eXBlLl9zcGxpdCA9IGZ1bmN0aW9uKHN0cikge1xuXHRyZXR1cm4gc3RyLnNwbGl0KHRoaXMuX29wdGlvbnMud29yZHMgPyAvXFxzKy8gOiBcIlwiKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfVxuICogQHJldHVybnMge3N0cmluZ30gXG4gKi9cblJPVC5TdHJpbmdHZW5lcmF0b3IucHJvdG90eXBlLl9qb2luID0gZnVuY3Rpb24oYXJyKSB7XG5cdHJldHVybiBhcnIuam9pbih0aGlzLl9vcHRpb25zLndvcmRzID8gXCIgXCIgOiBcIlwiKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBjb250ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRcbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuX29ic2VydmVFdmVudCA9IGZ1bmN0aW9uKGNvbnRleHQsIGV2ZW50KSB7XG5cdHZhciBrZXkgPSB0aGlzLl9qb2luKGNvbnRleHQpO1xuXHRpZiAoIShrZXkgaW4gdGhpcy5fZGF0YSkpIHsgdGhpcy5fZGF0YVtrZXldID0ge307IH1cblx0dmFyIGRhdGEgPSB0aGlzLl9kYXRhW2tleV07XG5cblx0aWYgKCEoZXZlbnQgaW4gZGF0YSkpIHsgZGF0YVtldmVudF0gPSAwOyB9XG5cdGRhdGFbZXZlbnRdKys7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmdbXX1cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cblJPVC5TdHJpbmdHZW5lcmF0b3IucHJvdG90eXBlLl9zYW1wbGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdGNvbnRleHQgPSB0aGlzLl9iYWNrb2ZmKGNvbnRleHQpO1xuXHR2YXIga2V5ID0gdGhpcy5fam9pbihjb250ZXh0KTtcblx0dmFyIGRhdGEgPSB0aGlzLl9kYXRhW2tleV07XG5cblx0dmFyIGF2YWlsYWJsZSA9IHt9O1xuXG5cdGlmICh0aGlzLl9vcHRpb25zLnByaW9yKSB7XG5cdFx0Zm9yICh2YXIgZXZlbnQgaW4gdGhpcy5fcHJpb3JWYWx1ZXMpIHsgYXZhaWxhYmxlW2V2ZW50XSA9IHRoaXMuX3ByaW9yVmFsdWVzW2V2ZW50XTsgfVxuXHRcdGZvciAodmFyIGV2ZW50IGluIGRhdGEpIHsgYXZhaWxhYmxlW2V2ZW50XSArPSBkYXRhW2V2ZW50XTsgfVxuXHR9IGVsc2UgeyBcblx0XHRhdmFpbGFibGUgPSBkYXRhO1xuXHR9XG5cblx0cmV0dXJuIFJPVC5STkcuZ2V0V2VpZ2h0ZWRWYWx1ZShhdmFpbGFibGUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119XG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cblJPVC5TdHJpbmdHZW5lcmF0b3IucHJvdG90eXBlLl9iYWNrb2ZmID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRpZiAoY29udGV4dC5sZW5ndGggPiB0aGlzLl9vcHRpb25zLm9yZGVyKSB7XG5cdFx0Y29udGV4dCA9IGNvbnRleHQuc2xpY2UoLXRoaXMuX29wdGlvbnMub3JkZXIpO1xuXHR9IGVsc2UgaWYgKGNvbnRleHQubGVuZ3RoIDwgdGhpcy5fb3B0aW9ucy5vcmRlcikge1xuXHRcdGNvbnRleHQgPSB0aGlzLl9wcmVmaXguc2xpY2UoMCwgdGhpcy5fb3B0aW9ucy5vcmRlciAtIGNvbnRleHQubGVuZ3RoKS5jb25jYXQoY29udGV4dCk7XG5cdH1cblxuXHR3aGlsZSAoISh0aGlzLl9qb2luKGNvbnRleHQpIGluIHRoaXMuX2RhdGEpICYmIGNvbnRleHQubGVuZ3RoID4gMCkgeyBjb250ZXh0ID0gY29udGV4dC5zbGljZSgxKTsgfVxuXG5cdHJldHVybiBjb250ZXh0O1xufVxuLyoqXG4gKiBAY2xhc3MgR2VuZXJpYyBldmVudCBxdWV1ZTogc3RvcmVzIGV2ZW50cyBhbmQgcmV0cmlldmVzIHRoZW0gYmFzZWQgb24gdGhlaXIgdGltZVxuICovXG5ST1QuRXZlbnRRdWV1ZSA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl90aW1lID0gMDtcblx0dGhpcy5fZXZlbnRzID0gW107XG5cdHRoaXMuX2V2ZW50VGltZXMgPSBbXTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBFbGFwc2VkIHRpbWVcbiAqL1xuUk9ULkV2ZW50UXVldWUucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3RpbWU7XG59XG5cbi8qKlxuICogQ2xlYXIgYWxsIHNjaGVkdWxlZCBldmVudHNcbiAqL1xuUk9ULkV2ZW50UXVldWUucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX2V2ZW50cyA9IFtdO1xuXHR0aGlzLl9ldmVudFRpbWVzID0gW107XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7P30gZXZlbnRcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lXG4gKi9cblJPVC5FdmVudFF1ZXVlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihldmVudCwgdGltZSkge1xuXHR2YXIgaW5kZXggPSB0aGlzLl9ldmVudHMubGVuZ3RoO1xuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl9ldmVudFRpbWVzLmxlbmd0aDtpKyspIHtcblx0XHRpZiAodGhpcy5fZXZlbnRUaW1lc1tpXSA+IHRpbWUpIHtcblx0XHRcdGluZGV4ID0gaTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdHRoaXMuX2V2ZW50cy5zcGxpY2UoaW5kZXgsIDAsIGV2ZW50KTtcblx0dGhpcy5fZXZlbnRUaW1lcy5zcGxpY2UoaW5kZXgsIDAsIHRpbWUpO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIG5lYXJlc3QgZXZlbnQsIGFkdmFuY2VzIHRpbWUgaWYgbmVjZXNzYXJ5LiBSZXR1cm5zIHRoYXQgZXZlbnQgYW5kIHJlbW92ZXMgaXQgZnJvbSB0aGUgcXVldWUuXG4gKiBAcmV0dXJucyB7PyB8fCBudWxsfSBUaGUgZXZlbnQgcHJldmlvdXNseSBhZGRlZCBieSBhZGRFdmVudCwgbnVsbCBpZiBubyBldmVudCBhdmFpbGFibGVcbiAqL1xuUk9ULkV2ZW50UXVldWUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuX2V2ZW50cy5sZW5ndGgpIHsgcmV0dXJuIG51bGw7IH1cblxuXHR2YXIgdGltZSA9IHRoaXMuX2V2ZW50VGltZXMuc3BsaWNlKDAsIDEpWzBdO1xuXHRpZiAodGltZSA+IDApIHsgLyogYWR2YW5jZSAqL1xuXHRcdHRoaXMuX3RpbWUgKz0gdGltZTtcblx0XHRmb3IgKHZhciBpPTA7aTx0aGlzLl9ldmVudFRpbWVzLmxlbmd0aDtpKyspIHsgdGhpcy5fZXZlbnRUaW1lc1tpXSAtPSB0aW1lOyB9XG5cdH1cblxuXHRyZXR1cm4gdGhpcy5fZXZlbnRzLnNwbGljZSgwLCAxKVswXTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgZnJvbSB0aGUgcXVldWVcbiAqIEBwYXJhbSB7P30gZXZlbnRcbiAqIEByZXR1cm5zIHtib29sfSBzdWNjZXNzP1xuICovXG5ST1QuRXZlbnRRdWV1ZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0dmFyIGluZGV4ID0gdGhpcy5fZXZlbnRzLmluZGV4T2YoZXZlbnQpO1xuXHRpZiAoaW5kZXggPT0gLTEpIHsgcmV0dXJuIGZhbHNlIH1cblx0dGhpcy5fcmVtb3ZlKGluZGV4KTtcblx0cmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmVtb3ZlIGFuIGV2ZW50IGZyb20gdGhlIHF1ZXVlXG4gKiBAcGFyYW0ge2ludH0gaW5kZXhcbiAqL1xuUk9ULkV2ZW50UXVldWUucHJvdG90eXBlLl9yZW1vdmUgPSBmdW5jdGlvbihpbmRleCkge1xuXHR0aGlzLl9ldmVudHMuc3BsaWNlKGluZGV4LCAxKTtcblx0dGhpcy5fZXZlbnRUaW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xufVxuLyoqXG4gKiBAY2xhc3MgQWJzdHJhY3Qgc2NoZWR1bGVyXG4gKi9cblJPVC5TY2hlZHVsZXIgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fcXVldWUgPSBuZXcgUk9ULkV2ZW50UXVldWUoKTtcblx0dGhpcy5fcmVwZWF0ID0gW107XG5cdHRoaXMuX2N1cnJlbnQgPSBudWxsO1xufVxuXG4vKipcbiAqIEBzZWUgUk9ULkV2ZW50UXVldWUjZ2V0VGltZVxuICovXG5ST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl9xdWV1ZS5nZXRUaW1lKCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHs/fSBpdGVtXG4gKiBAcGFyYW0ge2Jvb2x9IHJlcGVhdFxuICovXG5ST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtLCByZXBlYXQpIHtcblx0aWYgKHJlcGVhdCkgeyB0aGlzLl9yZXBlYXQucHVzaChpdGVtKTsgfVxuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBDbGVhciBhbGwgaXRlbXNcbiAqL1xuUk9ULlNjaGVkdWxlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fcXVldWUuY2xlYXIoKTtcblx0dGhpcy5fcmVwZWF0ID0gW107XG5cdHRoaXMuX2N1cnJlbnQgPSBudWxsO1xuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBSZW1vdmUgYSBwcmV2aW91c2x5IGFkZGVkIGl0ZW1cbiAqIEBwYXJhbSB7P30gaXRlbVxuICogQHJldHVybnMge2Jvb2x9IHN1Y2Nlc3NmdWw/XG4gKi9cblJPVC5TY2hlZHVsZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0dmFyIHJlc3VsdCA9IHRoaXMuX3F1ZXVlLnJlbW92ZShpdGVtKTtcblxuXHR2YXIgaW5kZXggPSB0aGlzLl9yZXBlYXQuaW5kZXhPZihpdGVtKTtcblx0aWYgKGluZGV4ICE9IC0xKSB7IHRoaXMuX3JlcGVhdC5zcGxpY2UoaW5kZXgsIDEpOyB9XG5cblx0aWYgKHRoaXMuX2N1cnJlbnQgPT0gaXRlbSkgeyB0aGlzLl9jdXJyZW50ID0gbnVsbDsgfVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogU2NoZWR1bGUgbmV4dCBpdGVtXG4gKiBAcmV0dXJucyB7P31cbiAqL1xuUk9ULlNjaGVkdWxlci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9jdXJyZW50ID0gdGhpcy5fcXVldWUuZ2V0KCk7XG5cdHJldHVybiB0aGlzLl9jdXJyZW50O1xufVxuLyoqXG4gKiBAY2xhc3MgU2ltcGxlIGZhaXIgc2NoZWR1bGVyIChyb3VuZC1yb2JpbiBzdHlsZSlcbiAqIEBhdWdtZW50cyBST1QuU2NoZWR1bGVyXG4gKi9cblJPVC5TY2hlZHVsZXIuU2ltcGxlID0gZnVuY3Rpb24oKSB7XG5cdFJPVC5TY2hlZHVsZXIuY2FsbCh0aGlzKTtcbn1cblJPVC5TY2hlZHVsZXIuU2ltcGxlLmV4dGVuZChST1QuU2NoZWR1bGVyKTtcblxuLyoqXG4gKiBAc2VlIFJPVC5TY2hlZHVsZXIjYWRkXG4gKi9cblJPVC5TY2hlZHVsZXIuU2ltcGxlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtLCByZXBlYXQpIHtcblx0dGhpcy5fcXVldWUuYWRkKGl0ZW0sIDApO1xuXHRyZXR1cm4gUk9ULlNjaGVkdWxlci5wcm90b3R5cGUuYWRkLmNhbGwodGhpcywgaXRlbSwgcmVwZWF0KTtcbn1cblxuLyoqXG4gKiBAc2VlIFJPVC5TY2hlZHVsZXIjbmV4dFxuICovXG5ST1QuU2NoZWR1bGVyLlNpbXBsZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAodGhpcy5fY3VycmVudCAmJiB0aGlzLl9yZXBlYXQuaW5kZXhPZih0aGlzLl9jdXJyZW50KSAhPSAtMSkge1xuXHRcdHRoaXMuX3F1ZXVlLmFkZCh0aGlzLl9jdXJyZW50LCAwKTtcblx0fVxuXHRyZXR1cm4gUk9ULlNjaGVkdWxlci5wcm90b3R5cGUubmV4dC5jYWxsKHRoaXMpO1xufVxuLyoqXG4gKiBAY2xhc3MgU3BlZWQtYmFzZWQgc2NoZWR1bGVyXG4gKiBAYXVnbWVudHMgUk9ULlNjaGVkdWxlclxuICovXG5ST1QuU2NoZWR1bGVyLlNwZWVkID0gZnVuY3Rpb24oKSB7XG5cdFJPVC5TY2hlZHVsZXIuY2FsbCh0aGlzKTtcbn1cblJPVC5TY2hlZHVsZXIuU3BlZWQuZXh0ZW5kKFJPVC5TY2hlZHVsZXIpO1xuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBpdGVtIGFueXRoaW5nIHdpdGggXCJnZXRTcGVlZFwiIG1ldGhvZFxuICogQHBhcmFtIHtib29sfSByZXBlYXRcbiAqIEBzZWUgUk9ULlNjaGVkdWxlciNhZGRcbiAqL1xuUk9ULlNjaGVkdWxlci5TcGVlZC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oaXRlbSwgcmVwZWF0KSB7XG5cdHRoaXMuX3F1ZXVlLmFkZChpdGVtLCAxL2l0ZW0uZ2V0U3BlZWQoKSk7XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5hZGQuY2FsbCh0aGlzLCBpdGVtLCByZXBlYXQpO1xufVxuXG4vKipcbiAqIEBzZWUgUk9ULlNjaGVkdWxlciNuZXh0XG4gKi9cblJPVC5TY2hlZHVsZXIuU3BlZWQucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcblx0aWYgKHRoaXMuX2N1cnJlbnQgJiYgdGhpcy5fcmVwZWF0LmluZGV4T2YodGhpcy5fY3VycmVudCkgIT0gLTEpIHtcblx0XHR0aGlzLl9xdWV1ZS5hZGQodGhpcy5fY3VycmVudCwgMS90aGlzLl9jdXJyZW50LmdldFNwZWVkKCkpO1xuXHR9XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5uZXh0LmNhbGwodGhpcyk7XG59XG4vKipcbiAqIEBjbGFzcyBBY3Rpb24tYmFzZWQgc2NoZWR1bGVyXG4gKiBAYXVnbWVudHMgUk9ULlNjaGVkdWxlclxuICovXG5ST1QuU2NoZWR1bGVyLkFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRST1QuU2NoZWR1bGVyLmNhbGwodGhpcyk7XG5cdHRoaXMuX2RlZmF1bHREdXJhdGlvbiA9IDE7IC8qIGZvciBuZXdseSBhZGRlZCAqL1xuXHR0aGlzLl9kdXJhdGlvbiA9IHRoaXMuX2RlZmF1bHREdXJhdGlvbjsgLyogZm9yIHRoaXMuX2N1cnJlbnQgKi9cbn1cblJPVC5TY2hlZHVsZXIuQWN0aW9uLmV4dGVuZChST1QuU2NoZWR1bGVyKTtcblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gaXRlbVxuICogQHBhcmFtIHtib29sfSByZXBlYXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZT0xXVxuICogQHNlZSBST1QuU2NoZWR1bGVyI2FkZFxuICovXG5ST1QuU2NoZWR1bGVyLkFjdGlvbi5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oaXRlbSwgcmVwZWF0LCB0aW1lKSB7XG5cdHRoaXMuX3F1ZXVlLmFkZChpdGVtLCB0aW1lIHx8IHRoaXMuX2RlZmF1bHREdXJhdGlvbik7XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5hZGQuY2FsbCh0aGlzLCBpdGVtLCByZXBlYXQpO1xufVxuXG5ST1QuU2NoZWR1bGVyLkFjdGlvbi5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fZHVyYXRpb24gPSB0aGlzLl9kZWZhdWx0RHVyYXRpb247XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5jbGVhci5jYWxsKHRoaXMpO1xufVxuXG5ST1QuU2NoZWR1bGVyLkFjdGlvbi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oaXRlbSkge1xuXHRpZiAoaXRlbSA9PSB0aGlzLl9jdXJyZW50KSB7IHRoaXMuX2R1cmF0aW9uID0gdGhpcy5fZGVmYXVsdER1cmF0aW9uOyB9XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBpdGVtKTtcbn1cblxuLyoqXG4gKiBAc2VlIFJPVC5TY2hlZHVsZXIjbmV4dFxuICovXG5ST1QuU2NoZWR1bGVyLkFjdGlvbi5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAodGhpcy5fY3VycmVudCAmJiB0aGlzLl9yZXBlYXQuaW5kZXhPZih0aGlzLl9jdXJyZW50KSAhPSAtMSkge1xuXHRcdHRoaXMuX3F1ZXVlLmFkZCh0aGlzLl9jdXJyZW50LCB0aGlzLl9kdXJhdGlvbiB8fCB0aGlzLl9kZWZhdWx0RHVyYXRpb24pO1xuXHRcdHRoaXMuX2R1cmF0aW9uID0gdGhpcy5fZGVmYXVsdER1cmF0aW9uO1xuXHR9XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5uZXh0LmNhbGwodGhpcyk7XG59XG5cbi8qKlxuICogU2V0IGR1cmF0aW9uIGZvciB0aGUgYWN0aXZlIGl0ZW1cbiAqL1xuUk9ULlNjaGVkdWxlci5BY3Rpb24ucHJvdG90eXBlLnNldER1cmF0aW9uID0gZnVuY3Rpb24odGltZSkge1xuXHRpZiAodGhpcy5fY3VycmVudCkgeyB0aGlzLl9kdXJhdGlvbiA9IHRpbWU7IH1cblx0cmV0dXJuIHRoaXM7XG59XG4vKipcbiAqIEBjbGFzcyBBc3luY2hyb25vdXMgbWFpbiBsb29wXG4gKiBAcGFyYW0ge1JPVC5TY2hlZHVsZXJ9IHNjaGVkdWxlclxuICovXG5ST1QuRW5naW5lID0gZnVuY3Rpb24oc2NoZWR1bGVyKSB7XG5cdHRoaXMuX3NjaGVkdWxlciA9IHNjaGVkdWxlcjtcblx0dGhpcy5fbG9jayA9IDE7XG59XG5cbi8qKlxuICogU3RhcnQgdGhlIG1haW4gbG9vcC4gV2hlbiB0aGlzIGNhbGwgcmV0dXJucywgdGhlIGxvb3AgaXMgbG9ja2VkLlxuICovXG5ST1QuRW5naW5lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy51bmxvY2soKTtcbn1cblxuLyoqXG4gKiBJbnRlcnJ1cHQgdGhlIGVuZ2luZSBieSBhbiBhc3luY2hyb25vdXMgYWN0aW9uXG4gKi9cblJPVC5FbmdpbmUucHJvdG90eXBlLmxvY2sgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fbG9jaysrO1xuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBSZXN1bWUgZXhlY3V0aW9uIChwYXVzZWQgYnkgYSBwcmV2aW91cyBsb2NrKVxuICovXG5ST1QuRW5naW5lLnByb3RvdHlwZS51bmxvY2sgPSBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLl9sb2NrKSB7IHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCB1bmxvY2sgdW5sb2NrZWQgZW5naW5lXCIpOyB9XG5cdHRoaXMuX2xvY2stLTtcblxuXHR3aGlsZSAoIXRoaXMuX2xvY2spIHtcblx0XHR2YXIgYWN0b3IgPSB0aGlzLl9zY2hlZHVsZXIubmV4dCgpO1xuXHRcdGlmICghYWN0b3IpIHsgcmV0dXJuIHRoaXMubG9jaygpOyB9IC8qIG5vIGFjdG9ycyAqL1xuXHRcdHZhciByZXN1bHQgPSBhY3Rvci5hY3QoKTtcblx0XHRpZiAocmVzdWx0ICYmIHJlc3VsdC50aGVuKSB7IC8qIGFjdG9yIHJldHVybmVkIGEgXCJ0aGVuYWJsZVwiLCBsb29rcyBsaWtlIGEgUHJvbWlzZSAqL1xuXHRcdFx0dGhpcy5sb2NrKCk7XG5cdFx0XHRyZXN1bHQudGhlbih0aGlzLnVubG9jay5iaW5kKHRoaXMpKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn1cbi8qKlxuICogQGNsYXNzIEJhc2UgbWFwIGdlbmVyYXRvclxuICogQHBhcmFtIHtpbnR9IFt3aWR0aD1ST1QuREVGQVVMVF9XSURUSF1cbiAqIEBwYXJhbSB7aW50fSBbaGVpZ2h0PVJPVC5ERUZBVUxUX0hFSUdIVF1cbiAqL1xuUk9ULk1hcCA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcblx0dGhpcy5fd2lkdGggPSB3aWR0aCB8fCBST1QuREVGQVVMVF9XSURUSDtcblx0dGhpcy5faGVpZ2h0ID0gaGVpZ2h0IHx8IFJPVC5ERUZBVUxUX0hFSUdIVDtcbn07XG5cblJPVC5NYXAucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7fVxuXG5ST1QuTWFwLnByb3RvdHlwZS5fZmlsbE1hcCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdHZhciBtYXAgPSBbXTtcblx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fd2lkdGg7aSsrKSB7XG5cdFx0bWFwLnB1c2goW10pO1xuXHRcdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHsgbWFwW2ldLnB1c2godmFsdWUpOyB9XG5cdH1cblx0cmV0dXJuIG1hcDtcbn1cbi8qKlxuICogQGNsYXNzIFNpbXBsZSBlbXB0eSByZWN0YW5ndWxhciByb29tXG4gKiBAYXVnbWVudHMgUk9ULk1hcFxuICovXG5ST1QuTWFwLkFyZW5hID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuXHRST1QuTWFwLmNhbGwodGhpcywgd2lkdGgsIGhlaWdodCk7XG59XG5ST1QuTWFwLkFyZW5hLmV4dGVuZChST1QuTWFwKTtcblxuUk9ULk1hcC5BcmVuYS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dmFyIHcgPSB0aGlzLl93aWR0aC0xO1xuXHR2YXIgaCA9IHRoaXMuX2hlaWdodC0xO1xuXHRmb3IgKHZhciBpPTA7aTw9dztpKyspIHtcblx0XHRmb3IgKHZhciBqPTA7ajw9aDtqKyspIHtcblx0XHRcdHZhciBlbXB0eSA9IChpICYmIGogJiYgaTx3ICYmIGo8aCk7XG5cdFx0XHRjYWxsYmFjayhpLCBqLCBlbXB0eSA/IDAgOiAxKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRoaXM7XG59XG4vKipcbiAqIEBjbGFzcyBSZWN1cnNpdmVseSBkaXZpZGVkIG1hemUsIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWF6ZV9nZW5lcmF0aW9uX2FsZ29yaXRobSNSZWN1cnNpdmVfZGl2aXNpb25fbWV0aG9kXG4gKiBAYXVnbWVudHMgUk9ULk1hcFxuICovXG5ST1QuTWFwLkRpdmlkZWRNYXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuXHRST1QuTWFwLmNhbGwodGhpcywgd2lkdGgsIGhlaWdodCk7XG5cdHRoaXMuX3N0YWNrID0gW107XG59XG5ST1QuTWFwLkRpdmlkZWRNYXplLmV4dGVuZChST1QuTWFwKTtcblxuUk9ULk1hcC5EaXZpZGVkTWF6ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dmFyIHcgPSB0aGlzLl93aWR0aDtcblx0dmFyIGggPSB0aGlzLl9oZWlnaHQ7XG5cdFxuXHR0aGlzLl9tYXAgPSBbXTtcblx0XG5cdGZvciAodmFyIGk9MDtpPHc7aSsrKSB7XG5cdFx0dGhpcy5fbWFwLnB1c2goW10pO1xuXHRcdGZvciAodmFyIGo9MDtqPGg7aisrKSB7XG5cdFx0XHR2YXIgYm9yZGVyID0gKGkgPT0gMCB8fCBqID09IDAgfHwgaSsxID09IHcgfHwgaisxID09IGgpO1xuXHRcdFx0dGhpcy5fbWFwW2ldLnB1c2goYm9yZGVyID8gMSA6IDApO1xuXHRcdH1cblx0fVxuXHRcblx0dGhpcy5fc3RhY2sgPSBbXG5cdFx0WzEsIDEsIHctMiwgaC0yXVxuXHRdO1xuXHR0aGlzLl9wcm9jZXNzKCk7XG5cdFxuXHRmb3IgKHZhciBpPTA7aTx3O2krKykge1xuXHRcdGZvciAodmFyIGo9MDtqPGg7aisrKSB7XG5cdFx0XHRjYWxsYmFjayhpLCBqLCB0aGlzLl9tYXBbaV1bal0pO1xuXHRcdH1cblx0fVxuXHR0aGlzLl9tYXAgPSBudWxsO1xuXHRyZXR1cm4gdGhpcztcbn1cblxuUk9ULk1hcC5EaXZpZGVkTWF6ZS5wcm90b3R5cGUuX3Byb2Nlc3MgPSBmdW5jdGlvbigpIHtcblx0d2hpbGUgKHRoaXMuX3N0YWNrLmxlbmd0aCkge1xuXHRcdHZhciByb29tID0gdGhpcy5fc3RhY2suc2hpZnQoKTsgLyogW2xlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbV0gKi9cblx0XHR0aGlzLl9wYXJ0aXRpb25Sb29tKHJvb20pO1xuXHR9XG59XG5cblJPVC5NYXAuRGl2aWRlZE1hemUucHJvdG90eXBlLl9wYXJ0aXRpb25Sb29tID0gZnVuY3Rpb24ocm9vbSkge1xuXHR2YXIgYXZhaWxYID0gW107XG5cdHZhciBhdmFpbFkgPSBbXTtcblx0XG5cdGZvciAodmFyIGk9cm9vbVswXSsxO2k8cm9vbVsyXTtpKyspIHtcblx0XHR2YXIgdG9wID0gdGhpcy5fbWFwW2ldW3Jvb21bMV0tMV07XG5cdFx0dmFyIGJvdHRvbSA9IHRoaXMuX21hcFtpXVtyb29tWzNdKzFdO1xuXHRcdGlmICh0b3AgJiYgYm90dG9tICYmICEoaSAlIDIpKSB7IGF2YWlsWC5wdXNoKGkpOyB9XG5cdH1cblx0XG5cdGZvciAodmFyIGo9cm9vbVsxXSsxO2o8cm9vbVszXTtqKyspIHtcblx0XHR2YXIgbGVmdCA9IHRoaXMuX21hcFtyb29tWzBdLTFdW2pdO1xuXHRcdHZhciByaWdodCA9IHRoaXMuX21hcFtyb29tWzJdKzFdW2pdO1xuXHRcdGlmIChsZWZ0ICYmIHJpZ2h0ICYmICEoaiAlIDIpKSB7IGF2YWlsWS5wdXNoKGopOyB9XG5cdH1cblxuXHRpZiAoIWF2YWlsWC5sZW5ndGggfHwgIWF2YWlsWS5sZW5ndGgpIHsgcmV0dXJuOyB9XG5cblx0dmFyIHggPSBhdmFpbFgucmFuZG9tKCk7XG5cdHZhciB5ID0gYXZhaWxZLnJhbmRvbSgpO1xuXHRcblx0dGhpcy5fbWFwW3hdW3ldID0gMTtcblx0XG5cdHZhciB3YWxscyA9IFtdO1xuXHRcblx0dmFyIHcgPSBbXTsgd2FsbHMucHVzaCh3KTsgLyogbGVmdCBwYXJ0ICovXG5cdGZvciAodmFyIGk9cm9vbVswXTsgaTx4OyBpKyspIHsgXG5cdFx0dGhpcy5fbWFwW2ldW3ldID0gMTtcblx0XHR3LnB1c2goW2ksIHldKTsgXG5cdH1cblx0XG5cdHZhciB3ID0gW107IHdhbGxzLnB1c2godyk7IC8qIHJpZ2h0IHBhcnQgKi9cblx0Zm9yICh2YXIgaT14KzE7IGk8PXJvb21bMl07IGkrKykgeyBcblx0XHR0aGlzLl9tYXBbaV1beV0gPSAxO1xuXHRcdHcucHVzaChbaSwgeV0pOyBcblx0fVxuXG5cdHZhciB3ID0gW107IHdhbGxzLnB1c2godyk7IC8qIHRvcCBwYXJ0ICovXG5cdGZvciAodmFyIGo9cm9vbVsxXTsgajx5OyBqKyspIHsgXG5cdFx0dGhpcy5fbWFwW3hdW2pdID0gMTtcblx0XHR3LnB1c2goW3gsIGpdKTsgXG5cdH1cblx0XG5cdHZhciB3ID0gW107IHdhbGxzLnB1c2godyk7IC8qIGJvdHRvbSBwYXJ0ICovXG5cdGZvciAodmFyIGo9eSsxOyBqPD1yb29tWzNdOyBqKyspIHsgXG5cdFx0dGhpcy5fbWFwW3hdW2pdID0gMTtcblx0XHR3LnB1c2goW3gsIGpdKTsgXG5cdH1cblx0XHRcblx0dmFyIHNvbGlkID0gd2FsbHMucmFuZG9tKCk7XG5cdGZvciAodmFyIGk9MDtpPHdhbGxzLmxlbmd0aDtpKyspIHtcblx0XHR2YXIgdyA9IHdhbGxzW2ldO1xuXHRcdGlmICh3ID09IHNvbGlkKSB7IGNvbnRpbnVlOyB9XG5cdFx0XG5cdFx0dmFyIGhvbGUgPSB3LnJhbmRvbSgpO1xuXHRcdHRoaXMuX21hcFtob2xlWzBdXVtob2xlWzFdXSA9IDA7XG5cdH1cblxuXHR0aGlzLl9zdGFjay5wdXNoKFtyb29tWzBdLCByb29tWzFdLCB4LTEsIHktMV0pOyAvKiBsZWZ0IHRvcCAqL1xuXHR0aGlzLl9zdGFjay5wdXNoKFt4KzEsIHJvb21bMV0sIHJvb21bMl0sIHktMV0pOyAvKiByaWdodCB0b3AgKi9cblx0dGhpcy5fc3RhY2sucHVzaChbcm9vbVswXSwgeSsxLCB4LTEsIHJvb21bM11dKTsgLyogbGVmdCBib3R0b20gKi9cblx0dGhpcy5fc3RhY2sucHVzaChbeCsxLCB5KzEsIHJvb21bMl0sIHJvb21bM11dKTsgLyogcmlnaHQgYm90dG9tICovXG59XG4vKipcbiAqIEBjbGFzcyBJY2V5J3MgTWF6ZSBnZW5lcmF0b3JcbiAqIFNlZSBodHRwOi8vd3d3LnJvZ3VlYmFzaW4ucm9ndWVsaWtlZGV2ZWxvcG1lbnQub3JnL2luZGV4LnBocD90aXRsZT1TaW1wbGVfbWF6ZSBmb3IgZXhwbGFuYXRpb25cbiAqIEBhdWdtZW50cyBST1QuTWFwXG4gKi9cblJPVC5NYXAuSWNleU1hemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCByZWd1bGFyaXR5KSB7XG5cdFJPVC5NYXAuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcblx0dGhpcy5fcmVndWxhcml0eSA9IHJlZ3VsYXJpdHkgfHwgMDtcbn1cblJPVC5NYXAuSWNleU1hemUuZXh0ZW5kKFJPVC5NYXApO1xuXG5ST1QuTWFwLkljZXlNYXplLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHR2YXIgd2lkdGggPSB0aGlzLl93aWR0aDtcblx0dmFyIGhlaWdodCA9IHRoaXMuX2hlaWdodDtcblx0XG5cdHZhciBtYXAgPSB0aGlzLl9maWxsTWFwKDEpO1xuXHRcblx0d2lkdGggLT0gKHdpZHRoICUgMiA/IDEgOiAyKTtcblx0aGVpZ2h0IC09IChoZWlnaHQgJSAyID8gMSA6IDIpO1xuXG5cdHZhciBjeCA9IDA7XG5cdHZhciBjeSA9IDA7XG5cdHZhciBueCA9IDA7XG5cdHZhciBueSA9IDA7XG5cblx0dmFyIGRvbmUgPSAwO1xuXHR2YXIgYmxvY2tlZCA9IGZhbHNlO1xuXHR2YXIgZGlycyA9IFtcblx0XHRbMCwgMF0sXG5cdFx0WzAsIDBdLFxuXHRcdFswLCAwXSxcblx0XHRbMCwgMF1cblx0XTtcblx0ZG8ge1xuXHRcdGN4ID0gMSArIDIqTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSood2lkdGgtMSkgLyAyKTtcblx0XHRjeSA9IDEgKyAyKk1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkqKGhlaWdodC0xKSAvIDIpO1xuXG5cdFx0aWYgKCFkb25lKSB7IG1hcFtjeF1bY3ldID0gMDsgfVxuXHRcdFxuXHRcdGlmICghbWFwW2N4XVtjeV0pIHtcblx0XHRcdHRoaXMuX3JhbmRvbWl6ZShkaXJzKTtcblx0XHRcdGRvIHtcblx0XHRcdFx0aWYgKE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkqKHRoaXMuX3JlZ3VsYXJpdHkrMSkpID09IDApIHsgdGhpcy5fcmFuZG9taXplKGRpcnMpOyB9XG5cdFx0XHRcdGJsb2NrZWQgPSB0cnVlO1xuXHRcdFx0XHRmb3IgKHZhciBpPTA7aTw0O2krKykge1xuXHRcdFx0XHRcdG54ID0gY3ggKyBkaXJzW2ldWzBdKjI7XG5cdFx0XHRcdFx0bnkgPSBjeSArIGRpcnNbaV1bMV0qMjtcblx0XHRcdFx0XHRpZiAodGhpcy5faXNGcmVlKG1hcCwgbngsIG55LCB3aWR0aCwgaGVpZ2h0KSkge1xuXHRcdFx0XHRcdFx0bWFwW254XVtueV0gPSAwO1xuXHRcdFx0XHRcdFx0bWFwW2N4ICsgZGlyc1tpXVswXV1bY3kgKyBkaXJzW2ldWzFdXSA9IDA7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGN4ID0gbng7XG5cdFx0XHRcdFx0XHRjeSA9IG55O1xuXHRcdFx0XHRcdFx0YmxvY2tlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0ZG9uZSsrO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IHdoaWxlICghYmxvY2tlZCk7XG5cdFx0fVxuXHR9IHdoaWxlIChkb25lKzEgPCB3aWR0aCpoZWlnaHQvNCk7XG5cdFxuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl93aWR0aDtpKyspIHtcblx0XHRmb3IgKHZhciBqPTA7ajx0aGlzLl9oZWlnaHQ7aisrKSB7XG5cdFx0XHRjYWxsYmFjayhpLCBqLCBtYXBbaV1bal0pO1xuXHRcdH1cblx0fVxuXHR0aGlzLl9tYXAgPSBudWxsO1xuXHRyZXR1cm4gdGhpcztcbn1cblxuUk9ULk1hcC5JY2V5TWF6ZS5wcm90b3R5cGUuX3JhbmRvbWl6ZSA9IGZ1bmN0aW9uKGRpcnMpIHtcblx0Zm9yICh2YXIgaT0wO2k8NDtpKyspIHtcblx0XHRkaXJzW2ldWzBdID0gMDtcblx0XHRkaXJzW2ldWzFdID0gMDtcblx0fVxuXHRcblx0c3dpdGNoIChNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpKjQpKSB7XG5cdFx0Y2FzZSAwOlxuXHRcdFx0ZGlyc1swXVswXSA9IC0xOyBkaXJzWzFdWzBdID0gMTtcblx0XHRcdGRpcnNbMl1bMV0gPSAtMTsgZGlyc1szXVsxXSA9IDE7XG5cdFx0YnJlYWs7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0ZGlyc1szXVswXSA9IC0xOyBkaXJzWzJdWzBdID0gMTtcblx0XHRcdGRpcnNbMV1bMV0gPSAtMTsgZGlyc1swXVsxXSA9IDE7XG5cdFx0YnJlYWs7XG5cdFx0Y2FzZSAyOlxuXHRcdFx0ZGlyc1syXVswXSA9IC0xOyBkaXJzWzNdWzBdID0gMTtcblx0XHRcdGRpcnNbMF1bMV0gPSAtMTsgZGlyc1sxXVsxXSA9IDE7XG5cdFx0YnJlYWs7XG5cdFx0Y2FzZSAzOlxuXHRcdFx0ZGlyc1sxXVswXSA9IC0xOyBkaXJzWzBdWzBdID0gMTtcblx0XHRcdGRpcnNbM11bMV0gPSAtMTsgZGlyc1syXVsxXSA9IDE7XG5cdFx0YnJlYWs7XG5cdH1cbn1cblxuUk9ULk1hcC5JY2V5TWF6ZS5wcm90b3R5cGUuX2lzRnJlZSA9IGZ1bmN0aW9uKG1hcCwgeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuXHRpZiAoeCA8IDEgfHwgeSA8IDEgfHwgeCA+PSB3aWR0aCB8fCB5ID49IGhlaWdodCkgeyByZXR1cm4gZmFsc2U7IH1cblx0cmV0dXJuIG1hcFt4XVt5XTtcbn1cbi8qKlxuICogQGNsYXNzIE1hemUgZ2VuZXJhdG9yIC0gRWxsZXIncyBhbGdvcml0aG1cbiAqIFNlZSBodHRwOi8vaG9tZXBhZ2VzLmN3aS5ubC9+dHJvbXAvbWF6ZS5odG1sIGZvciBleHBsYW5hdGlvblxuICogQGF1Z21lbnRzIFJPVC5NYXBcbiAqL1xuUk9ULk1hcC5FbGxlck1hemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG5cdFJPVC5NYXAuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcbn1cblJPVC5NYXAuRWxsZXJNYXplLmV4dGVuZChST1QuTWFwKTtcblxuUk9ULk1hcC5FbGxlck1hemUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdHZhciBtYXAgPSB0aGlzLl9maWxsTWFwKDEpO1xuXHR2YXIgdyA9IE1hdGguY2VpbCgodGhpcy5fd2lkdGgtMikvMik7XG5cdFxuXHR2YXIgcmFuZCA9IDkvMjQ7XG5cdFxuXHR2YXIgTCA9IFtdO1xuXHR2YXIgUiA9IFtdO1xuXHRcblx0Zm9yICh2YXIgaT0wO2k8dztpKyspIHtcblx0XHRMLnB1c2goaSk7XG5cdFx0Ui5wdXNoKGkpO1xuXHR9XG5cdEwucHVzaCh3LTEpOyAvKiBmYWtlIHN0b3AtYmxvY2sgYXQgdGhlIHJpZ2h0IHNpZGUgKi9cblxuXHRmb3IgKHZhciBqPTE7aiszPHRoaXMuX2hlaWdodDtqKz0yKSB7XG5cdFx0Lyogb25lIHJvdyAqL1xuXHRcdGZvciAodmFyIGk9MDtpPHc7aSsrKSB7XG5cdFx0XHQvKiBjZWxsIGNvb3JkcyAod2lsbCBiZSBhbHdheXMgZW1wdHkpICovXG5cdFx0XHR2YXIgeCA9IDIqaSsxO1xuXHRcdFx0dmFyIHkgPSBqO1xuXHRcdFx0bWFwW3hdW3ldID0gMDtcblx0XHRcdFxuXHRcdFx0LyogcmlnaHQgY29ubmVjdGlvbiAqL1xuXHRcdFx0aWYgKGkgIT0gTFtpKzFdICYmIFJPVC5STkcuZ2V0VW5pZm9ybSgpID4gcmFuZCkge1xuXHRcdFx0XHR0aGlzLl9hZGRUb0xpc3QoaSwgTCwgUik7XG5cdFx0XHRcdG1hcFt4KzFdW3ldID0gMDtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0LyogYm90dG9tIGNvbm5lY3Rpb24gKi9cblx0XHRcdGlmIChpICE9IExbaV0gJiYgUk9ULlJORy5nZXRVbmlmb3JtKCkgPiByYW5kKSB7XG5cdFx0XHRcdC8qIHJlbW92ZSBjb25uZWN0aW9uICovXG5cdFx0XHRcdHRoaXMuX3JlbW92ZUZyb21MaXN0KGksIEwsIFIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0LyogY3JlYXRlIGNvbm5lY3Rpb24gKi9cblx0XHRcdFx0bWFwW3hdW3krMV0gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qIGxhc3Qgcm93ICovXG5cdGZvciAodmFyIGk9MDtpPHc7aSsrKSB7XG5cdFx0LyogY2VsbCBjb29yZHMgKHdpbGwgYmUgYWx3YXlzIGVtcHR5KSAqL1xuXHRcdHZhciB4ID0gMippKzE7XG5cdFx0dmFyIHkgPSBqO1xuXHRcdG1hcFt4XVt5XSA9IDA7XG5cdFx0XG5cdFx0LyogcmlnaHQgY29ubmVjdGlvbiAqL1xuXHRcdGlmIChpICE9IExbaSsxXSAmJiAoaSA9PSBMW2ldIHx8IFJPVC5STkcuZ2V0VW5pZm9ybSgpID4gcmFuZCkpIHtcblx0XHRcdC8qIGRpZyByaWdodCBhbHNvIGlmIHRoZSBjZWxsIGlzIHNlcGFyYXRlZCwgc28gaXQgZ2V0cyBjb25uZWN0ZWQgdG8gdGhlIHJlc3Qgb2YgbWF6ZSAqL1xuXHRcdFx0dGhpcy5fYWRkVG9MaXN0KGksIEwsIFIpO1xuXHRcdFx0bWFwW3grMV1beV0gPSAwO1xuXHRcdH1cblx0XHRcblx0XHR0aGlzLl9yZW1vdmVGcm9tTGlzdChpLCBMLCBSKTtcblx0fVxuXHRcblx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fd2lkdGg7aSsrKSB7XG5cdFx0Zm9yICh2YXIgaj0wO2o8dGhpcy5faGVpZ2h0O2orKykge1xuXHRcdFx0Y2FsbGJhY2soaSwgaiwgbWFwW2ldW2pdKTtcblx0XHR9XG5cdH1cblx0XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlbW92ZSBcImlcIiBmcm9tIGl0cyBsaXN0XG4gKi9cblJPVC5NYXAuRWxsZXJNYXplLnByb3RvdHlwZS5fcmVtb3ZlRnJvbUxpc3QgPSBmdW5jdGlvbihpLCBMLCBSKSB7XG5cdFJbTFtpXV0gPSBSW2ldO1xuXHRMW1JbaV1dID0gTFtpXTtcblx0UltpXSA9IGk7XG5cdExbaV0gPSBpO1xufVxuXG4vKipcbiAqIEpvaW4gbGlzdHMgd2l0aCBcImlcIiBhbmQgXCJpKzFcIlxuICovXG5ST1QuTWFwLkVsbGVyTWF6ZS5wcm90b3R5cGUuX2FkZFRvTGlzdCA9IGZ1bmN0aW9uKGksIEwsIFIpIHtcblx0UltMW2krMV1dID0gUltpXTtcblx0TFtSW2ldXSA9IExbaSsxXTtcblx0UltpXSA9IGkrMTtcblx0TFtpKzFdID0gaTtcbn1cbi8qKlxuICogQGNsYXNzIENlbGx1bGFyIGF1dG9tYXRvbiBtYXAgZ2VuZXJhdG9yXG4gKiBAYXVnbWVudHMgUk9ULk1hcFxuICogQHBhcmFtIHtpbnR9IFt3aWR0aD1ST1QuREVGQVVMVF9XSURUSF1cbiAqIEBwYXJhbSB7aW50fSBbaGVpZ2h0PVJPVC5ERUZBVUxUX0hFSUdIVF1cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uc1xuICogQHBhcmFtIHtpbnRbXX0gW29wdGlvbnMuYm9ybl0gTGlzdCBvZiBuZWlnaGJvciBjb3VudHMgZm9yIGEgbmV3IGNlbGwgdG8gYmUgYm9ybiBpbiBlbXB0eSBzcGFjZVxuICogQHBhcmFtIHtpbnRbXX0gW29wdGlvbnMuc3Vydml2ZV0gTGlzdCBvZiBuZWlnaGJvciBjb3VudHMgZm9yIGFuIGV4aXN0aW5nICBjZWxsIHRvIHN1cnZpdmVcbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy50b3BvbG9neV0gVG9wb2xvZ3kgNCBvciA2IG9yIDhcbiAqL1xuUk9ULk1hcC5DZWxsdWxhciA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMpIHtcblx0Uk9ULk1hcC5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xuXHR0aGlzLl9vcHRpb25zID0ge1xuXHRcdGJvcm46IFs1LCA2LCA3LCA4XSxcblx0XHRzdXJ2aXZlOiBbNCwgNSwgNiwgNywgOF0sXG5cdFx0dG9wb2xvZ3k6IDgsXG5cdFx0Y29ubmVjdGVkOiBmYWxzZVxuXHR9O1xuXHR0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG5cdFxuXHR0aGlzLl9kaXJzID0gUk9ULkRJUlNbdGhpcy5fb3B0aW9ucy50b3BvbG9neV07XG5cdHRoaXMuX21hcCA9IHRoaXMuX2ZpbGxNYXAoMCk7XG59XG5ST1QuTWFwLkNlbGx1bGFyLmV4dGVuZChST1QuTWFwKTtcblxuLyoqXG4gKiBGaWxsIHRoZSBtYXAgd2l0aCByYW5kb20gdmFsdWVzXG4gKiBAcGFyYW0ge2Zsb2F0fSBwcm9iYWJpbGl0eSBQcm9iYWJpbGl0eSBmb3IgYSBjZWxsIHRvIGJlY29tZSBhbGl2ZTsgMCA9IGFsbCBlbXB0eSwgMSA9IGFsbCBmdWxsXG4gKi9cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLnJhbmRvbWl6ZSA9IGZ1bmN0aW9uKHByb2JhYmlsaXR5KSB7XG5cdGZvciAodmFyIGk9MDtpPHRoaXMuX3dpZHRoO2krKykge1xuXHRcdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHtcblx0XHRcdHRoaXMuX21hcFtpXVtqXSA9IChST1QuUk5HLmdldFVuaWZvcm0oKSA8IHByb2JhYmlsaXR5ID8gMSA6IDApO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBDaGFuZ2Ugb3B0aW9ucy5cbiAqIEBzZWUgUk9ULk1hcC5DZWxsdWxhclxuICovXG5ST1QuTWFwLkNlbGx1bGFyLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRmb3IgKHZhciBwIGluIG9wdGlvbnMpIHsgdGhpcy5fb3B0aW9uc1twXSA9IG9wdGlvbnNbcF07IH1cbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcblx0dGhpcy5fbWFwW3hdW3ldID0gdmFsdWU7XG59XG5cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdHZhciBuZXdNYXAgPSB0aGlzLl9maWxsTWFwKDApO1xuXHR2YXIgYm9ybiA9IHRoaXMuX29wdGlvbnMuYm9ybjtcblx0dmFyIHN1cnZpdmUgPSB0aGlzLl9vcHRpb25zLnN1cnZpdmU7XG5cblxuXHRmb3IgKHZhciBqPTA7ajx0aGlzLl9oZWlnaHQ7aisrKSB7XG5cdFx0dmFyIHdpZHRoU3RlcCA9IDE7XG5cdFx0dmFyIHdpZHRoU3RhcnQgPSAwO1xuXHRcdGlmICh0aGlzLl9vcHRpb25zLnRvcG9sb2d5ID09IDYpIHsgXG5cdFx0XHR3aWR0aFN0ZXAgPSAyO1xuXHRcdFx0d2lkdGhTdGFydCA9IGolMjtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpPXdpZHRoU3RhcnQ7IGk8dGhpcy5fd2lkdGg7IGkrPXdpZHRoU3RlcCkge1xuXG5cdFx0XHR2YXIgY3VyID0gdGhpcy5fbWFwW2ldW2pdO1xuXHRcdFx0dmFyIG5jb3VudCA9IHRoaXMuX2dldE5laWdoYm9ycyhpLCBqKTtcblx0XHRcdFxuXHRcdFx0aWYgKGN1ciAmJiBzdXJ2aXZlLmluZGV4T2YobmNvdW50KSAhPSAtMSkgeyAvKiBzdXJ2aXZlICovXG5cdFx0XHRcdG5ld01hcFtpXVtqXSA9IDE7XG5cdFx0XHR9IGVsc2UgaWYgKCFjdXIgJiYgYm9ybi5pbmRleE9mKG5jb3VudCkgIT0gLTEpIHsgLyogYm9ybiAqL1xuXHRcdFx0XHRuZXdNYXBbaV1bal0gPSAxO1xuXHRcdFx0fVx0XHRcdFxuXHRcdH1cblx0fVxuXHRcblx0dGhpcy5fbWFwID0gbmV3TWFwO1xuXG5cdGlmICh0aGlzLl9vcHRpb25zLmNvbm5lY3RlZCkgeyB0aGlzLl9jb21wbGV0ZU1hemUoKTsgfSAvLyBvcHRpb25hbGx5IGNvbm5lY3QgZXZlcnkgc3BhY2VcblxuXHRpZiAoIWNhbGxiYWNrKSB7IHJldHVybjsgfVxuXG5cdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHtcblx0XHR2YXIgd2lkdGhTdGVwID0gMTtcblx0XHR2YXIgd2lkdGhTdGFydCA9IDA7XG5cdFx0aWYgKHRoaXMuX29wdGlvbnMudG9wb2xvZ3kgPT0gNikgeyBcblx0XHRcdHdpZHRoU3RlcCA9IDI7XG5cdFx0XHR3aWR0aFN0YXJ0ID0gaiUyO1xuXHRcdH1cblx0XHRmb3IgKHZhciBpPXdpZHRoU3RhcnQ7IGk8dGhpcy5fd2lkdGg7IGkrPXdpZHRoU3RlcCkge1xuXHRcdFx0Y2FsbGJhY2soaSwgaiwgbmV3TWFwW2ldW2pdKTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBHZXQgbmVpZ2hib3IgY291bnQgYXQgW2ksal0gaW4gdGhpcy5fbWFwXG4gKi9cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLl9nZXROZWlnaGJvcnMgPSBmdW5jdGlvbihjeCwgY3kpIHtcblx0dmFyIHJlc3VsdCA9IDA7XG5cdGZvciAodmFyIGk9MDtpPHRoaXMuX2RpcnMubGVuZ3RoO2krKykge1xuXHRcdHZhciBkaXIgPSB0aGlzLl9kaXJzW2ldO1xuXHRcdHZhciB4ID0gY3ggKyBkaXJbMF07XG5cdFx0dmFyIHkgPSBjeSArIGRpclsxXTtcblx0XHRcblx0XHRpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLl93aWR0aCB8fCB4IDwgMCB8fCB5ID49IHRoaXMuX3dpZHRoKSB7IGNvbnRpbnVlOyB9XG5cdFx0cmVzdWx0ICs9ICh0aGlzLl9tYXBbeF1beV0gPT0gMSA/IDEgOiAwKTtcblx0fVxuXHRcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBNYWtlIHN1cmUgZXZlcnkgbm9uLXdhbGwgc3BhY2UgaXMgYWNjZXNzaWJsZS5cbiAqL1xuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX2NvbXBsZXRlTWF6ZSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgYWxsRnJlZVNwYWNlID0gW107XG5cdHZhciBub3RDb25uZWN0ZWQgPSB7fTtcblx0Ly8gZmluZCBhbGwgZnJlZSBzcGFjZVxuXHRmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuX3dpZHRoOyB4KyspIHtcblx0XHRmb3IgKHZhciB5ID0gMDsgeSA8IHRoaXMuX2hlaWdodDsgeSsrKSB7XG5cdFx0XHRpZiAodGhpcy5fZnJlZVNwYWNlKHgsIHkpKSB7XG5cdFx0XHRcdHZhciBwID0gW3gsIHldO1xuXHRcdFx0XHRub3RDb25uZWN0ZWRbdGhpcy5fcG9pbnRLZXkocCldID0gcDtcblx0XHRcdFx0YWxsRnJlZVNwYWNlLnB1c2goW3gsIHldKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0dmFyIHN0YXJ0ID0gYWxsRnJlZVNwYWNlW1JPVC5STkcuZ2V0VW5pZm9ybUludCgwLCBhbGxGcmVlU3BhY2UubGVuZ3RoIC0gMSldO1xuXG5cdHZhciBrZXkgPSB0aGlzLl9wb2ludEtleShzdGFydCk7XG5cdHZhciBjb25uZWN0ZWQgPSB7fTtcblx0Y29ubmVjdGVkW2tleV0gPSBzdGFydDtcblx0ZGVsZXRlIG5vdENvbm5lY3RlZFtrZXldXG5cblx0Ly8gZmluZCB3aGF0J3MgY29ubmVjdGVkIHRvIHRoZSBzdGFydGluZyBwb2ludFxuXHR0aGlzLl9maW5kQ29ubmVjdGVkKGNvbm5lY3RlZCwgbm90Q29ubmVjdGVkLCBbc3RhcnRdKTtcblxuXHR3aGlsZSAoT2JqZWN0LmtleXMobm90Q29ubmVjdGVkKS5sZW5ndGggPiAwKSB7XG5cblx0XHQvLyBmaW5kIHR3byBwb2ludHMgZnJvbSBub3RDb25uZWN0ZWQgdG8gY29ubmVjdGVkXG5cdFx0dmFyIHAgPSB0aGlzLl9nZXRGcm9tVG8oY29ubmVjdGVkLCBub3RDb25uZWN0ZWQpO1xuXHRcdHZhciBmcm9tID0gcFswXTsgLy8gbm90Q29ubmVjdGVkXG5cdFx0dmFyIHRvID0gcFsxXTsgLy8gY29ubmVjdGVkXG5cblx0XHQvLyBmaW5kIGV2ZXJ5dGhpbmcgY29ubmVjdGVkIHRvIHRoZSBzdGFydGluZyBwb2ludFxuXHRcdHZhciBsb2NhbCA9IHt9O1xuXHRcdGxvY2FsW3RoaXMuX3BvaW50S2V5KGZyb20pXSA9IGZyb207XG5cdFx0dGhpcy5fZmluZENvbm5lY3RlZChsb2NhbCwgbm90Q29ubmVjdGVkLCBbZnJvbV0sIHRydWUpO1xuXG5cdFx0Ly8gY29ubmVjdCB0byBhIGNvbm5lY3RlZCBzcXVhcmVcblx0XHR0aGlzLl90dW5uZWxUb0Nvbm5lY3RlZCh0bywgZnJvbSwgY29ubmVjdGVkLCBub3RDb25uZWN0ZWQpO1xuXG5cdFx0Ly8gbm93IGFsbCBvZiBsb2NhbCBpcyBjb25uZWN0ZWRcblx0XHRmb3IgKHZhciBrIGluIGxvY2FsKSB7XG5cdFx0XHR2YXIgcHAgPSBsb2NhbFtrXTtcblx0XHRcdHRoaXMuX21hcFtwcFswXV1bcHBbMV1dID0gMDtcblx0XHRcdGNvbm5lY3RlZFtrXSA9IHBwO1xuXHRcdFx0ZGVsZXRlIG5vdENvbm5lY3RlZFtrXTtcblx0XHR9XG5cdH1cbn1cblxuLyoqXG4gKiBGaW5kIHJhbmRvbSBwb2ludHMgdG8gY29ubmVjdC4gU2VhcmNoIGZvciB0aGUgY2xvc2VzdCBwb2ludCBpbiB0aGUgbGFyZ2VyIHNwYWNlLiBcbiAqIFRoaXMgaXMgdG8gbWluaW1pemUgdGhlIGxlbmd0aCBvZiB0aGUgcGFzc2FnZSB3aGlsZSBtYWludGFpbmluZyBnb29kIHBlcmZvcm1hbmNlLlxuICovXG5ST1QuTWFwLkNlbGx1bGFyLnByb3RvdHlwZS5fZ2V0RnJvbVRvID0gZnVuY3Rpb24oY29ubmVjdGVkLCBub3RDb25uZWN0ZWQpIHtcblx0dmFyIGZyb20sIHRvLCBkO1xuXHR2YXIgY29ubmVjdGVkS2V5cyA9IE9iamVjdC5rZXlzKGNvbm5lY3RlZCk7XG5cdHZhciBub3RDb25uZWN0ZWRLZXlzID0gT2JqZWN0LmtleXMobm90Q29ubmVjdGVkKTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCA1OyBpKyspIHtcblx0XHRpZiAoY29ubmVjdGVkS2V5cy5sZW5ndGggPCBub3RDb25uZWN0ZWRLZXlzLmxlbmd0aCkge1xuXHRcdFx0dmFyIGtleXMgPSBjb25uZWN0ZWRLZXlzO1xuXHRcdFx0dG8gPSBjb25uZWN0ZWRba2V5c1tST1QuUk5HLmdldFVuaWZvcm1JbnQoMCwga2V5cy5sZW5ndGggLSAxKV1dXG5cdFx0XHRmcm9tID0gdGhpcy5fZ2V0Q2xvc2VzdCh0bywgbm90Q29ubmVjdGVkKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGtleXMgPSBub3RDb25uZWN0ZWRLZXlzO1xuXHRcdFx0ZnJvbSA9IG5vdENvbm5lY3RlZFtrZXlzW1JPVC5STkcuZ2V0VW5pZm9ybUludCgwLCBrZXlzLmxlbmd0aCAtIDEpXV1cblx0XHRcdHRvID0gdGhpcy5fZ2V0Q2xvc2VzdChmcm9tLCBjb25uZWN0ZWQpO1xuXHRcdH1cblx0XHRkID0gKGZyb21bMF0gLSB0b1swXSkgKiAoZnJvbVswXSAtIHRvWzBdKSArIChmcm9tWzFdIC0gdG9bMV0pICogKGZyb21bMV0gLSB0b1sxXSk7XG5cdFx0aWYgKGQgPCA2NCkge1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cdC8vIGNvbnNvbGUubG9nKFwiPj4+IGNvbm5lY3RlZD1cIiArIHRvICsgXCIgbm90Q29ubmVjdGVkPVwiICsgZnJvbSArIFwiIGRpc3Q9XCIgKyBkKTtcblx0cmV0dXJuIFtmcm9tLCB0b107XG59XG5cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLl9nZXRDbG9zZXN0ID0gZnVuY3Rpb24ocG9pbnQsIHNwYWNlKSB7XG5cdHZhciBtaW5Qb2ludCA9IG51bGw7XG5cdHZhciBtaW5EaXN0ID0gbnVsbDtcblx0Zm9yIChrIGluIHNwYWNlKSB7XG5cdFx0dmFyIHAgPSBzcGFjZVtrXTtcblx0XHR2YXIgZCA9IChwWzBdIC0gcG9pbnRbMF0pICogKHBbMF0gLSBwb2ludFswXSkgKyAocFsxXSAtIHBvaW50WzFdKSAqIChwWzFdIC0gcG9pbnRbMV0pO1xuXHRcdGlmIChtaW5EaXN0ID09IG51bGwgfHwgZCA8IG1pbkRpc3QpIHtcblx0XHRcdG1pbkRpc3QgPSBkO1xuXHRcdFx0bWluUG9pbnQgPSBwO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbWluUG9pbnQ7XG59XG5cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLl9maW5kQ29ubmVjdGVkID0gZnVuY3Rpb24oY29ubmVjdGVkLCBub3RDb25uZWN0ZWQsIHN0YWNrLCBrZWVwTm90Q29ubmVjdGVkKSB7XG5cdHdoaWxlKHN0YWNrLmxlbmd0aCA+IDApIHtcblx0XHR2YXIgcCA9IHN0YWNrLnNwbGljZSgwLCAxKVswXTtcblx0XHR2YXIgdGVzdHMgPSBbXG5cdFx0XHRbcFswXSArIDEsIHBbMV1dLFxuXHRcdFx0W3BbMF0gLSAxLCBwWzFdXSxcblx0XHRcdFtwWzBdLCAgICAgcFsxXSArIDFdLFxuXHRcdFx0W3BbMF0sICAgICBwWzFdIC0gMV1cblx0XHRdO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGVzdHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBrZXkgPSB0aGlzLl9wb2ludEtleSh0ZXN0c1tpXSk7XG5cdFx0XHRpZiAoY29ubmVjdGVkW2tleV0gPT0gbnVsbCAmJiB0aGlzLl9mcmVlU3BhY2UodGVzdHNbaV1bMF0sIHRlc3RzW2ldWzFdKSkge1xuXHRcdFx0XHRjb25uZWN0ZWRba2V5XSA9IHRlc3RzW2ldO1xuXHRcdFx0XHRpZiAoIWtlZXBOb3RDb25uZWN0ZWQpIHtcblx0XHRcdFx0XHRkZWxldGUgbm90Q29ubmVjdGVkW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdFx0c3RhY2sucHVzaCh0ZXN0c1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLl90dW5uZWxUb0Nvbm5lY3RlZCA9IGZ1bmN0aW9uKHRvLCBmcm9tLCBjb25uZWN0ZWQsIG5vdENvbm5lY3RlZCkge1xuXHR2YXIga2V5ID0gdGhpcy5fcG9pbnRLZXkoZnJvbSk7XG5cdHZhciBhLCBiO1xuXHRpZiAoZnJvbVswXSA8IHRvWzBdKSB7XG5cdFx0YSA9IGZyb207XG5cdFx0YiA9IHRvO1xuXHR9IGVsc2Uge1xuXHRcdGEgPSB0bztcblx0XHRiID0gZnJvbTtcblx0fVxuXHRmb3IgKHZhciB4eCA9IGFbMF07IHh4IDw9IGJbMF07IHh4KyspIHtcblx0XHR0aGlzLl9tYXBbeHhdW2FbMV1dID0gMDtcblx0XHR2YXIgcCA9IFt4eCwgYVsxXV07XG5cdFx0dmFyIHBrZXkgPSB0aGlzLl9wb2ludEtleShwKTtcblx0XHRjb25uZWN0ZWRbcGtleV0gPSBwO1xuXHRcdGRlbGV0ZSBub3RDb25uZWN0ZWRbcGtleV07XG5cdH1cblxuXHQvLyB4IGlzIG5vdyBmaXhlZFxuXHR2YXIgeCA9IGJbMF07XG5cblx0aWYgKGZyb21bMV0gPCB0b1sxXSkge1xuXHRcdGEgPSBmcm9tO1xuXHRcdGIgPSB0bztcblx0fSBlbHNlIHtcblx0XHRhID0gdG87XG5cdFx0YiA9IGZyb207XG5cdH1cblx0Zm9yICh2YXIgeXkgPSBhWzFdOyB5eSA8IGJbMV07IHl5KyspIHtcblx0XHR0aGlzLl9tYXBbeF1beXldID0gMDtcblx0XHR2YXIgcCA9IFt4LCB5eV07XG5cdFx0dmFyIHBrZXkgPSB0aGlzLl9wb2ludEtleShwKTtcblx0XHRjb25uZWN0ZWRbcGtleV0gPSBwO1xuXHRcdGRlbGV0ZSBub3RDb25uZWN0ZWRbcGtleV07XG5cdH1cbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX2ZyZWVTcGFjZSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0cmV0dXJuIHggPj0gMCAmJiB4IDwgdGhpcy5fd2lkdGggJiYgeSA+PSAwICYmIHkgPCB0aGlzLl9oZWlnaHQgJiYgdGhpcy5fbWFwW3hdW3ldICE9IDE7XG59XG5cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLl9wb2ludEtleSA9IGZ1bmN0aW9uKHApIHtcblx0cmV0dXJuIHBbMF0gKyBcIi5cIiArIHBbMV07XG59XG5cbi8qKlxuICogQGNsYXNzIER1bmdlb24gbWFwOiBoYXMgcm9vbXMgYW5kIGNvcnJpZG9yc1xuICogQGF1Z21lbnRzIFJPVC5NYXBcbiAqL1xuUk9ULk1hcC5EdW5nZW9uID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuXHRST1QuTWFwLmNhbGwodGhpcywgd2lkdGgsIGhlaWdodCk7XG5cdHRoaXMuX3Jvb21zID0gW107IC8qIGxpc3Qgb2YgYWxsIHJvb21zICovXG5cdHRoaXMuX2NvcnJpZG9ycyA9IFtdO1xufVxuUk9ULk1hcC5EdW5nZW9uLmV4dGVuZChST1QuTWFwKTtcblxuLyoqXG4gKiBHZXQgYWxsIGdlbmVyYXRlZCByb29tc1xuICogQHJldHVybnMge1JPVC5NYXAuRmVhdHVyZS5Sb29tW119XG4gKi9cblJPVC5NYXAuRHVuZ2Vvbi5wcm90b3R5cGUuZ2V0Um9vbXMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3Jvb21zO1xufVxuXG4vKipcbiAqIEdldCBhbGwgZ2VuZXJhdGVkIGNvcnJpZG9yc1xuICogQHJldHVybnMge1JPVC5NYXAuRmVhdHVyZS5Db3JyaWRvcltdfVxuICovXG5ST1QuTWFwLkR1bmdlb24ucHJvdG90eXBlLmdldENvcnJpZG9ycyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fY29ycmlkb3JzO1xufVxuLyoqXG4gKiBAY2xhc3MgUmFuZG9tIGR1bmdlb24gZ2VuZXJhdG9yIHVzaW5nIGh1bWFuLWxpa2UgZGlnZ2luZyBwYXR0ZXJucy5cbiAqIEhlYXZpbHkgYmFzZWQgb24gTWlrZSBBbmRlcnNvbidzIGlkZWFzIGZyb20gdGhlIFwiVHlyYW50XCIgYWxnbywgbWVudGlvbmVkIGF0IFxuICogaHR0cDovL3d3dy5yb2d1ZWJhc2luLnJvZ3VlbGlrZWRldmVsb3BtZW50Lm9yZy9pbmRleC5waHA/dGl0bGU9RHVuZ2Vvbi1CdWlsZGluZ19BbGdvcml0aG0uXG4gKiBAYXVnbWVudHMgUk9ULk1hcC5EdW5nZW9uXG4gKi9cblJPVC5NYXAuRGlnZ2VyID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgb3B0aW9ucykge1xuXHRST1QuTWFwLkR1bmdlb24uY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcblx0XG5cdHRoaXMuX29wdGlvbnMgPSB7XG5cdFx0cm9vbVdpZHRoOiBbMywgOV0sIC8qIHJvb20gbWluaW11bSBhbmQgbWF4aW11bSB3aWR0aCAqL1xuXHRcdHJvb21IZWlnaHQ6IFszLCA1XSwgLyogcm9vbSBtaW5pbXVtIGFuZCBtYXhpbXVtIGhlaWdodCAqL1xuXHRcdGNvcnJpZG9yTGVuZ3RoOiBbMywgMTBdLCAvKiBjb3JyaWRvciBtaW5pbXVtIGFuZCBtYXhpbXVtIGxlbmd0aCAqL1xuXHRcdGR1Z1BlcmNlbnRhZ2U6IDAuMiwgLyogd2Ugc3RvcCBhZnRlciB0aGlzIHBlcmNlbnRhZ2Ugb2YgbGV2ZWwgYXJlYSBoYXMgYmVlbiBkdWcgb3V0ICovXG5cdFx0dGltZUxpbWl0OiAxMDAwIC8qIHdlIHN0b3AgYWZ0ZXIgdGhpcyBtdWNoIHRpbWUgaGFzIHBhc3NlZCAobXNlYykgKi9cblx0fVxuXHRmb3IgKHZhciBwIGluIG9wdGlvbnMpIHsgdGhpcy5fb3B0aW9uc1twXSA9IG9wdGlvbnNbcF07IH1cblx0XG5cdHRoaXMuX2ZlYXR1cmVzID0ge1xuXHRcdFwiUm9vbVwiOiA0LFxuXHRcdFwiQ29ycmlkb3JcIjogNFxuXHR9XG5cdHRoaXMuX2ZlYXR1cmVBdHRlbXB0cyA9IDIwOyAvKiBob3cgbWFueSB0aW1lcyBkbyB3ZSB0cnkgdG8gY3JlYXRlIGEgZmVhdHVyZSBvbiBhIHN1aXRhYmxlIHdhbGwgKi9cblx0dGhpcy5fd2FsbHMgPSB7fTsgLyogdGhlc2UgYXJlIGF2YWlsYWJsZSBmb3IgZGlnZ2luZyAqL1xuXHRcblx0dGhpcy5fZGlnQ2FsbGJhY2sgPSB0aGlzLl9kaWdDYWxsYmFjay5iaW5kKHRoaXMpO1xuXHR0aGlzLl9jYW5CZUR1Z0NhbGxiYWNrID0gdGhpcy5fY2FuQmVEdWdDYWxsYmFjay5iaW5kKHRoaXMpO1xuXHR0aGlzLl9pc1dhbGxDYWxsYmFjayA9IHRoaXMuX2lzV2FsbENhbGxiYWNrLmJpbmQodGhpcyk7XG5cdHRoaXMuX3ByaW9yaXR5V2FsbENhbGxiYWNrID0gdGhpcy5fcHJpb3JpdHlXYWxsQ2FsbGJhY2suYmluZCh0aGlzKTtcbn1cblJPVC5NYXAuRGlnZ2VyLmV4dGVuZChST1QuTWFwLkR1bmdlb24pO1xuXG4vKipcbiAqIENyZWF0ZSBhIG1hcFxuICogQHNlZSBST1QuTWFwI2NyZWF0ZVxuICovXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dGhpcy5fcm9vbXMgPSBbXTtcblx0dGhpcy5fY29ycmlkb3JzID0gW107XG5cdHRoaXMuX21hcCA9IHRoaXMuX2ZpbGxNYXAoMSk7XG5cdHRoaXMuX3dhbGxzID0ge307XG5cdHRoaXMuX2R1ZyA9IDA7XG5cdHZhciBhcmVhID0gKHRoaXMuX3dpZHRoLTIpICogKHRoaXMuX2hlaWdodC0yKTtcblxuXHR0aGlzLl9maXJzdFJvb20oKTtcblx0XG5cdHZhciB0MSA9IERhdGUubm93KCk7XG5cblx0ZG8ge1xuXHRcdHZhciB0MiA9IERhdGUubm93KCk7XG5cdFx0aWYgKHQyIC0gdDEgPiB0aGlzLl9vcHRpb25zLnRpbWVMaW1pdCkgeyBicmVhazsgfVxuXG5cdFx0LyogZmluZCBhIGdvb2Qgd2FsbCAqL1xuXHRcdHZhciB3YWxsID0gdGhpcy5fZmluZFdhbGwoKTtcblx0XHRpZiAoIXdhbGwpIHsgYnJlYWs7IH0gLyogbm8gbW9yZSB3YWxscyAqL1xuXHRcdFxuXHRcdHZhciBwYXJ0cyA9IHdhbGwuc3BsaXQoXCIsXCIpO1xuXHRcdHZhciB4ID0gcGFyc2VJbnQocGFydHNbMF0pO1xuXHRcdHZhciB5ID0gcGFyc2VJbnQocGFydHNbMV0pO1xuXHRcdHZhciBkaXIgPSB0aGlzLl9nZXREaWdnaW5nRGlyZWN0aW9uKHgsIHkpO1xuXHRcdGlmICghZGlyKSB7IGNvbnRpbnVlOyB9IC8qIHRoaXMgd2FsbCBpcyBub3Qgc3VpdGFibGUgKi9cblx0XHRcbi8vXHRcdGNvbnNvbGUubG9nKFwid2FsbFwiLCB4LCB5KTtcblxuXHRcdC8qIHRyeSBhZGRpbmcgYSBmZWF0dXJlICovXG5cdFx0dmFyIGZlYXR1cmVBdHRlbXB0cyA9IDA7XG5cdFx0ZG8ge1xuXHRcdFx0ZmVhdHVyZUF0dGVtcHRzKys7XG5cdFx0XHRpZiAodGhpcy5fdHJ5RmVhdHVyZSh4LCB5LCBkaXJbMF0sIGRpclsxXSkpIHsgLyogZmVhdHVyZSBhZGRlZCAqL1xuXHRcdFx0XHQvL2lmICh0aGlzLl9yb29tcy5sZW5ndGggKyB0aGlzLl9jb3JyaWRvcnMubGVuZ3RoID09IDIpIHsgdGhpcy5fcm9vbXNbMF0uYWRkRG9vcih4LCB5KTsgfSAvKiBmaXJzdCByb29tIG9maWNpYWxseSBoYXMgZG9vcnMgKi9cblx0XHRcdFx0dGhpcy5fcmVtb3ZlU3Vycm91bmRpbmdXYWxscyh4LCB5KTtcblx0XHRcdFx0dGhpcy5fcmVtb3ZlU3Vycm91bmRpbmdXYWxscyh4LWRpclswXSwgeS1kaXJbMV0pO1xuXHRcdFx0XHRicmVhazsgXG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAoZmVhdHVyZUF0dGVtcHRzIDwgdGhpcy5fZmVhdHVyZUF0dGVtcHRzKTtcblx0XHRcblx0XHR2YXIgcHJpb3JpdHlXYWxscyA9IDA7XG5cdFx0Zm9yICh2YXIgaWQgaW4gdGhpcy5fd2FsbHMpIHsgXG5cdFx0XHRpZiAodGhpcy5fd2FsbHNbaWRdID4gMSkgeyBwcmlvcml0eVdhbGxzKys7IH1cblx0XHR9XG5cblx0fSB3aGlsZSAodGhpcy5fZHVnL2FyZWEgPCB0aGlzLl9vcHRpb25zLmR1Z1BlcmNlbnRhZ2UgfHwgcHJpb3JpdHlXYWxscyk7IC8qIGZpeG1lIG51bWJlciBvZiBwcmlvcml0eSB3YWxscyAqL1xuXG5cdHRoaXMuX2FkZERvb3JzKCk7XG5cblx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fd2lkdGg7aSsrKSB7XG5cdFx0XHRmb3IgKHZhciBqPTA7ajx0aGlzLl9oZWlnaHQ7aisrKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGksIGosIHRoaXMuX21hcFtpXVtqXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdFxuXHR0aGlzLl93YWxscyA9IHt9O1xuXHR0aGlzLl9tYXAgPSBudWxsO1xuXG5cdHJldHVybiB0aGlzO1xufVxuXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX2RpZ0NhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcblx0aWYgKHZhbHVlID09IDAgfHwgdmFsdWUgPT0gMikgeyAvKiBlbXB0eSAqL1xuXHRcdHRoaXMuX21hcFt4XVt5XSA9IDA7XG5cdFx0dGhpcy5fZHVnKys7XG5cdH0gZWxzZSB7IC8qIHdhbGwgKi9cblx0XHR0aGlzLl93YWxsc1t4K1wiLFwiK3ldID0gMTtcblx0fVxufVxuXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX2lzV2FsbENhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHRpZiAoeCA8IDAgfHwgeSA8IDAgfHwgeCA+PSB0aGlzLl93aWR0aCB8fCB5ID49IHRoaXMuX2hlaWdodCkgeyByZXR1cm4gZmFsc2U7IH1cblx0cmV0dXJuICh0aGlzLl9tYXBbeF1beV0gPT0gMSk7XG59XG5cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5fY2FuQmVEdWdDYWxsYmFjayA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0aWYgKHggPCAxIHx8IHkgPCAxIHx8IHgrMSA+PSB0aGlzLl93aWR0aCB8fCB5KzEgPj0gdGhpcy5faGVpZ2h0KSB7IHJldHVybiBmYWxzZTsgfVxuXHRyZXR1cm4gKHRoaXMuX21hcFt4XVt5XSA9PSAxKTtcbn1cblxuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl9wcmlvcml0eVdhbGxDYWxsYmFjayA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0dGhpcy5fd2FsbHNbeCtcIixcIit5XSA9IDI7XG59XG5cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5fZmlyc3RSb29tID0gZnVuY3Rpb24oKSB7XG5cdHZhciBjeCA9IE1hdGguZmxvb3IodGhpcy5fd2lkdGgvMik7XG5cdHZhciBjeSA9IE1hdGguZmxvb3IodGhpcy5faGVpZ2h0LzIpO1xuXHR2YXIgcm9vbSA9IFJPVC5NYXAuRmVhdHVyZS5Sb29tLmNyZWF0ZVJhbmRvbUNlbnRlcihjeCwgY3ksIHRoaXMuX29wdGlvbnMpO1xuXHR0aGlzLl9yb29tcy5wdXNoKHJvb20pO1xuXHRyb29tLmNyZWF0ZSh0aGlzLl9kaWdDYWxsYmFjayk7XG59XG5cbi8qKlxuICogR2V0IGEgc3VpdGFibGUgd2FsbFxuICovXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX2ZpbmRXYWxsID0gZnVuY3Rpb24oKSB7XG5cdHZhciBwcmlvMSA9IFtdO1xuXHR2YXIgcHJpbzIgPSBbXTtcblx0Zm9yICh2YXIgaWQgaW4gdGhpcy5fd2FsbHMpIHtcblx0XHR2YXIgcHJpbyA9IHRoaXMuX3dhbGxzW2lkXTtcblx0XHRpZiAocHJpbyA9PSAyKSB7IFxuXHRcdFx0cHJpbzIucHVzaChpZCk7IFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcmlvMS5wdXNoKGlkKTtcblx0XHR9XG5cdH1cblx0XG5cdHZhciBhcnIgPSAocHJpbzIubGVuZ3RoID8gcHJpbzIgOiBwcmlvMSk7XG5cdGlmICghYXJyLmxlbmd0aCkgeyByZXR1cm4gbnVsbDsgfSAvKiBubyB3YWxscyA6LyAqL1xuXHRcblx0dmFyIGlkID0gYXJyLnJhbmRvbSgpO1xuXHRkZWxldGUgdGhpcy5fd2FsbHNbaWRdO1xuXG5cdHJldHVybiBpZDtcbn1cblxuLyoqXG4gKiBUcmllcyBhZGRpbmcgYSBmZWF0dXJlXG4gKiBAcmV0dXJucyB7Ym9vbH0gd2FzIHRoaXMgYSBzdWNjZXNzZnVsIHRyeT9cbiAqL1xuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl90cnlGZWF0dXJlID0gZnVuY3Rpb24oeCwgeSwgZHgsIGR5KSB7XG5cdHZhciBmZWF0dXJlID0gUk9ULlJORy5nZXRXZWlnaHRlZFZhbHVlKHRoaXMuX2ZlYXR1cmVzKTtcblx0ZmVhdHVyZSA9IFJPVC5NYXAuRmVhdHVyZVtmZWF0dXJlXS5jcmVhdGVSYW5kb21BdCh4LCB5LCBkeCwgZHksIHRoaXMuX29wdGlvbnMpO1xuXHRcblx0aWYgKCFmZWF0dXJlLmlzVmFsaWQodGhpcy5faXNXYWxsQ2FsbGJhY2ssIHRoaXMuX2NhbkJlRHVnQ2FsbGJhY2spKSB7XG4vL1x0XHRjb25zb2xlLmxvZyhcIm5vdCB2YWxpZFwiKTtcbi8vXHRcdGZlYXR1cmUuZGVidWcoKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0XG5cdGZlYXR1cmUuY3JlYXRlKHRoaXMuX2RpZ0NhbGxiYWNrKTtcbi8vXHRmZWF0dXJlLmRlYnVnKCk7XG5cblx0aWYgKGZlYXR1cmUgaW5zdGFuY2VvZiBST1QuTWFwLkZlYXR1cmUuUm9vbSkgeyB0aGlzLl9yb29tcy5wdXNoKGZlYXR1cmUpOyB9XG5cdGlmIChmZWF0dXJlIGluc3RhbmNlb2YgUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yKSB7IFxuXHRcdGZlYXR1cmUuY3JlYXRlUHJpb3JpdHlXYWxscyh0aGlzLl9wcmlvcml0eVdhbGxDYWxsYmFjayk7XG5cdFx0dGhpcy5fY29ycmlkb3JzLnB1c2goZmVhdHVyZSk7IFxuXHR9XG5cdFxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl9yZW1vdmVTdXJyb3VuZGluZ1dhbGxzID0gZnVuY3Rpb24oY3gsIGN5KSB7XG5cdHZhciBkZWx0YXMgPSBST1QuRElSU1s0XTtcblxuXHRmb3IgKHZhciBpPTA7aTxkZWx0YXMubGVuZ3RoO2krKykge1xuXHRcdHZhciBkZWx0YSA9IGRlbHRhc1tpXTtcblx0XHR2YXIgeCA9IGN4ICsgZGVsdGFbMF07XG5cdFx0dmFyIHkgPSBjeSArIGRlbHRhWzFdO1xuXHRcdGRlbGV0ZSB0aGlzLl93YWxsc1t4K1wiLFwiK3ldO1xuXHRcdHZhciB4ID0gY3ggKyAyKmRlbHRhWzBdO1xuXHRcdHZhciB5ID0gY3kgKyAyKmRlbHRhWzFdO1xuXHRcdGRlbGV0ZSB0aGlzLl93YWxsc1t4K1wiLFwiK3ldO1xuXHR9XG59XG5cbi8qKlxuICogUmV0dXJucyB2ZWN0b3IgaW4gXCJkaWdnaW5nXCIgZGlyZWN0aW9uLCBvciBmYWxzZSwgaWYgdGhpcyBkb2VzIG5vdCBleGlzdCAob3IgaXMgbm90IHVuaXF1ZSlcbiAqL1xuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl9nZXREaWdnaW5nRGlyZWN0aW9uID0gZnVuY3Rpb24oY3gsIGN5KSB7XG5cdGlmIChjeCA8PSAwIHx8IGN5IDw9IDAgfHwgY3ggPj0gdGhpcy5fd2lkdGggLSAxIHx8IGN5ID49IHRoaXMuX2hlaWdodCAtIDEpIHsgcmV0dXJuIG51bGw7IH1cblxuXHR2YXIgcmVzdWx0ID0gbnVsbDtcblx0dmFyIGRlbHRhcyA9IFJPVC5ESVJTWzRdO1xuXHRcblx0Zm9yICh2YXIgaT0wO2k8ZGVsdGFzLmxlbmd0aDtpKyspIHtcblx0XHR2YXIgZGVsdGEgPSBkZWx0YXNbaV07XG5cdFx0dmFyIHggPSBjeCArIGRlbHRhWzBdO1xuXHRcdHZhciB5ID0gY3kgKyBkZWx0YVsxXTtcblx0XHRcblx0XHRpZiAoIXRoaXMuX21hcFt4XVt5XSkgeyAvKiB0aGVyZSBhbHJlYWR5IGlzIGFub3RoZXIgZW1wdHkgbmVpZ2hib3IhICovXG5cdFx0XHRpZiAocmVzdWx0KSB7IHJldHVybiBudWxsOyB9XG5cdFx0XHRyZXN1bHQgPSBkZWx0YTtcblx0XHR9XG5cdH1cblx0XG5cdC8qIG5vIGVtcHR5IG5laWdoYm9yICovXG5cdGlmICghcmVzdWx0KSB7IHJldHVybiBudWxsOyB9XG5cdFxuXHRyZXR1cm4gWy1yZXN1bHRbMF0sIC1yZXN1bHRbMV1dO1xufVxuXG4vKipcbiAqIEZpbmQgZW1wdHkgc3BhY2VzIHN1cnJvdW5kaW5nIHJvb21zLCBhbmQgYXBwbHkgZG9vcnMuXG4gKi9cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5fYWRkRG9vcnMgPSBmdW5jdGlvbigpIHtcblx0dmFyIGRhdGEgPSB0aGlzLl9tYXA7XG5cdHZhciBpc1dhbGxDYWxsYmFjayA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0XHRyZXR1cm4gKGRhdGFbeF1beV0gPT0gMSk7XG5cdH1cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9yb29tcy5sZW5ndGg7IGkrKyApIHtcblx0XHR2YXIgcm9vbSA9IHRoaXMuX3Jvb21zW2ldO1xuXHRcdHJvb20uY2xlYXJEb29ycygpO1xuXHRcdHJvb20uYWRkRG9vcnMoaXNXYWxsQ2FsbGJhY2spO1xuXHR9XG59XG4vKipcbiAqIEBjbGFzcyBEdW5nZW9uIGdlbmVyYXRvciB3aGljaCB0cmllcyB0byBmaWxsIHRoZSBzcGFjZSBldmVubHkuIEdlbmVyYXRlcyBpbmRlcGVuZGVudCByb29tcyBhbmQgdHJpZXMgdG8gY29ubmVjdCB0aGVtLlxuICogQGF1Z21lbnRzIFJPVC5NYXAuRHVuZ2VvblxuICovXG5ST1QuTWFwLlVuaWZvcm0gPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBvcHRpb25zKSB7XG5cdFJPVC5NYXAuRHVuZ2Vvbi5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xuXG5cdHRoaXMuX29wdGlvbnMgPSB7XG5cdFx0cm9vbVdpZHRoOiBbMywgOV0sIC8qIHJvb20gbWluaW11bSBhbmQgbWF4aW11bSB3aWR0aCAqL1xuXHRcdHJvb21IZWlnaHQ6IFszLCA1XSwgLyogcm9vbSBtaW5pbXVtIGFuZCBtYXhpbXVtIGhlaWdodCAqL1xuXHRcdHJvb21EdWdQZXJjZW50YWdlOiAwLjEsIC8qIHdlIHN0b3AgYWZ0ZXIgdGhpcyBwZXJjZW50YWdlIG9mIGxldmVsIGFyZWEgaGFzIGJlZW4gZHVnIG91dCBieSByb29tcyAqL1xuXHRcdHRpbWVMaW1pdDogMTAwMCAvKiB3ZSBzdG9wIGFmdGVyIHRoaXMgbXVjaCB0aW1lIGhhcyBwYXNzZWQgKG1zZWMpICovXG5cdH1cblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cblx0dGhpcy5fcm9vbUF0dGVtcHRzID0gMjA7IC8qIG5ldyByb29tIGlzIGNyZWF0ZWQgTi10aW1lcyB1bnRpbCBpcyBjb25zaWRlcmVkIGFzIGltcG9zc2libGUgdG8gZ2VuZXJhdGUgKi9cblx0dGhpcy5fY29ycmlkb3JBdHRlbXB0cyA9IDIwOyAvKiBjb3JyaWRvcnMgYXJlIHRyaWVkIE4tdGltZXMgdW50aWwgdGhlIGxldmVsIGlzIGNvbnNpZGVyZWQgYXMgaW1wb3NzaWJsZSB0byBjb25uZWN0ICovXG5cblx0dGhpcy5fY29ubmVjdGVkID0gW107IC8qIGxpc3Qgb2YgYWxyZWFkeSBjb25uZWN0ZWQgcm9vbXMgKi9cblx0dGhpcy5fdW5jb25uZWN0ZWQgPSBbXTsgLyogbGlzdCBvZiByZW1haW5pbmcgdW5jb25uZWN0ZWQgcm9vbXMgKi9cblx0XG5cdHRoaXMuX2RpZ0NhbGxiYWNrID0gdGhpcy5fZGlnQ2FsbGJhY2suYmluZCh0aGlzKTtcblx0dGhpcy5fY2FuQmVEdWdDYWxsYmFjayA9IHRoaXMuX2NhbkJlRHVnQ2FsbGJhY2suYmluZCh0aGlzKTtcblx0dGhpcy5faXNXYWxsQ2FsbGJhY2sgPSB0aGlzLl9pc1dhbGxDYWxsYmFjay5iaW5kKHRoaXMpO1xufVxuUk9ULk1hcC5Vbmlmb3JtLmV4dGVuZChST1QuTWFwLkR1bmdlb24pO1xuXG4vKipcbiAqIENyZWF0ZSBhIG1hcC4gSWYgdGhlIHRpbWUgbGltaXQgaGFzIGJlZW4gaGl0LCByZXR1cm5zIG51bGwuXG4gKiBAc2VlIFJPVC5NYXAjY3JlYXRlXG4gKi9cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dmFyIHQxID0gRGF0ZS5ub3coKTtcblx0d2hpbGUgKDEpIHtcblx0XHR2YXIgdDIgPSBEYXRlLm5vdygpO1xuXHRcdGlmICh0MiAtIHQxID4gdGhpcy5fb3B0aW9ucy50aW1lTGltaXQpIHsgcmV0dXJuIG51bGw7IH0gLyogdGltZSBsaW1pdCEgKi9cblx0XG5cdFx0dGhpcy5fbWFwID0gdGhpcy5fZmlsbE1hcCgxKTtcblx0XHR0aGlzLl9kdWcgPSAwO1xuXHRcdHRoaXMuX3Jvb21zID0gW107XG5cdFx0dGhpcy5fdW5jb25uZWN0ZWQgPSBbXTtcblx0XHR0aGlzLl9nZW5lcmF0ZVJvb21zKCk7XG5cdFx0aWYgKHRoaXMuX3Jvb21zLmxlbmd0aCA8IDIpIHsgY29udGludWU7IH1cblx0XHRpZiAodGhpcy5fZ2VuZXJhdGVDb3JyaWRvcnMoKSkgeyBicmVhazsgfVxuXHR9XG5cdFxuXHRpZiAoY2FsbGJhY2spIHtcblx0XHRmb3IgKHZhciBpPTA7aTx0aGlzLl93aWR0aDtpKyspIHtcblx0XHRcdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHtcblx0XHRcdFx0Y2FsbGJhY2soaSwgaiwgdGhpcy5fbWFwW2ldW2pdKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHN1aXRhYmxlIGFtb3VudCBvZiByb29tc1xuICovXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9nZW5lcmF0ZVJvb21zID0gZnVuY3Rpb24oKSB7XG5cdHZhciB3ID0gdGhpcy5fd2lkdGgtMjtcblx0dmFyIGggPSB0aGlzLl9oZWlnaHQtMjtcblxuXHRkbyB7XG5cdFx0dmFyIHJvb20gPSB0aGlzLl9nZW5lcmF0ZVJvb20oKTtcblx0XHRpZiAodGhpcy5fZHVnLyh3KmgpID4gdGhpcy5fb3B0aW9ucy5yb29tRHVnUGVyY2VudGFnZSkgeyBicmVhazsgfSAvKiBhY2hpZXZlZCByZXF1ZXN0ZWQgYW1vdW50IG9mIGZyZWUgc3BhY2UgKi9cblx0fSB3aGlsZSAocm9vbSk7XG5cblx0LyogZWl0aGVyIGVub3VnaCByb29tcywgb3Igbm90IGFibGUgdG8gZ2VuZXJhdGUgbW9yZSBvZiB0aGVtIDopICovXG59XG5cbi8qKlxuICogVHJ5IHRvIGdlbmVyYXRlIG9uZSByb29tXG4gKi9cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2dlbmVyYXRlUm9vbSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgY291bnQgPSAwO1xuXHR3aGlsZSAoY291bnQgPCB0aGlzLl9yb29tQXR0ZW1wdHMpIHtcblx0XHRjb3VudCsrO1xuXHRcdFxuXHRcdHZhciByb29tID0gUk9ULk1hcC5GZWF0dXJlLlJvb20uY3JlYXRlUmFuZG9tKHRoaXMuX3dpZHRoLCB0aGlzLl9oZWlnaHQsIHRoaXMuX29wdGlvbnMpO1xuXHRcdGlmICghcm9vbS5pc1ZhbGlkKHRoaXMuX2lzV2FsbENhbGxiYWNrLCB0aGlzLl9jYW5CZUR1Z0NhbGxiYWNrKSkgeyBjb250aW51ZTsgfVxuXHRcdFxuXHRcdHJvb20uY3JlYXRlKHRoaXMuX2RpZ0NhbGxiYWNrKTtcblx0XHR0aGlzLl9yb29tcy5wdXNoKHJvb20pO1xuXHRcdHJldHVybiByb29tO1xuXHR9IFxuXG5cdC8qIG5vIHJvb20gd2FzIGdlbmVyYXRlZCBpbiBhIGdpdmVuIG51bWJlciBvZiBhdHRlbXB0cyAqL1xuXHRyZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgY29ubmVjdG9ycyBiZXdlZW4gcm9vbXNcbiAqIEByZXR1cm5zIHtib29sfSBzdWNjZXNzIFdhcyB0aGlzIGF0dGVtcHQgc3VjY2Vzc2Z1bGw/XG4gKi9cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2dlbmVyYXRlQ29ycmlkb3JzID0gZnVuY3Rpb24oKSB7XG5cdHZhciBjbnQgPSAwO1xuXHR3aGlsZSAoY250IDwgdGhpcy5fY29ycmlkb3JBdHRlbXB0cykge1xuXHRcdGNudCsrO1xuXHRcdHRoaXMuX2NvcnJpZG9ycyA9IFtdO1xuXG5cdFx0LyogZGlnIHJvb21zIGludG8gYSBjbGVhciBtYXAgKi9cblx0XHR0aGlzLl9tYXAgPSB0aGlzLl9maWxsTWFwKDEpO1xuXHRcdGZvciAodmFyIGk9MDtpPHRoaXMuX3Jvb21zLmxlbmd0aDtpKyspIHsgXG5cdFx0XHR2YXIgcm9vbSA9IHRoaXMuX3Jvb21zW2ldO1xuXHRcdFx0cm9vbS5jbGVhckRvb3JzKCk7XG5cdFx0XHRyb29tLmNyZWF0ZSh0aGlzLl9kaWdDYWxsYmFjayk7IFxuXHRcdH1cblxuXHRcdHRoaXMuX3VuY29ubmVjdGVkID0gdGhpcy5fcm9vbXMuc2xpY2UoKS5yYW5kb21pemUoKTtcblx0XHR0aGlzLl9jb25uZWN0ZWQgPSBbXTtcblx0XHRpZiAodGhpcy5fdW5jb25uZWN0ZWQubGVuZ3RoKSB7IHRoaXMuX2Nvbm5lY3RlZC5wdXNoKHRoaXMuX3VuY29ubmVjdGVkLnBvcCgpKTsgfSAvKiBmaXJzdCBvbmUgaXMgYWx3YXlzIGNvbm5lY3RlZCAqL1xuXHRcdFxuXHRcdHdoaWxlICgxKSB7XG5cdFx0XHQvKiAxLiBwaWNrIHJhbmRvbSBjb25uZWN0ZWQgcm9vbSAqL1xuXHRcdFx0dmFyIGNvbm5lY3RlZCA9IHRoaXMuX2Nvbm5lY3RlZC5yYW5kb20oKTtcblx0XHRcdFxuXHRcdFx0LyogMi4gZmluZCBjbG9zZXN0IHVuY29ubmVjdGVkICovXG5cdFx0XHR2YXIgcm9vbTEgPSB0aGlzLl9jbG9zZXN0Um9vbSh0aGlzLl91bmNvbm5lY3RlZCwgY29ubmVjdGVkKTtcblx0XHRcdFxuXHRcdFx0LyogMy4gY29ubmVjdCBpdCB0byBjbG9zZXN0IGNvbm5lY3RlZCAqL1xuXHRcdFx0dmFyIHJvb20yID0gdGhpcy5fY2xvc2VzdFJvb20odGhpcy5fY29ubmVjdGVkLCByb29tMSk7XG5cdFx0XHRcblx0XHRcdHZhciBvayA9IHRoaXMuX2Nvbm5lY3RSb29tcyhyb29tMSwgcm9vbTIpO1xuXHRcdFx0aWYgKCFvaykgeyBicmVhazsgfSAvKiBzdG9wIGNvbm5lY3RpbmcsIHJlLXNodWZmbGUgKi9cblx0XHRcdFxuXHRcdFx0aWYgKCF0aGlzLl91bmNvbm5lY3RlZC5sZW5ndGgpIHsgcmV0dXJuIHRydWU7IH0gLyogZG9uZTsgbm8gcm9vbXMgcmVtYWluICovXG5cdFx0fVxuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBGb3IgYSBnaXZlbiByb29tLCBmaW5kIHRoZSBjbG9zZXN0IG9uZSBmcm9tIHRoZSBsaXN0XG4gKi9cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2Nsb3Nlc3RSb29tID0gZnVuY3Rpb24ocm9vbXMsIHJvb20pIHtcblx0dmFyIGRpc3QgPSBJbmZpbml0eTtcblx0dmFyIGNlbnRlciA9IHJvb20uZ2V0Q2VudGVyKCk7XG5cdHZhciByZXN1bHQgPSBudWxsO1xuXHRcblx0Zm9yICh2YXIgaT0wO2k8cm9vbXMubGVuZ3RoO2krKykge1xuXHRcdHZhciByID0gcm9vbXNbaV07XG5cdFx0dmFyIGMgPSByLmdldENlbnRlcigpO1xuXHRcdHZhciBkeCA9IGNbMF0tY2VudGVyWzBdO1xuXHRcdHZhciBkeSA9IGNbMV0tY2VudGVyWzFdO1xuXHRcdHZhciBkID0gZHgqZHgrZHkqZHk7XG5cdFx0XG5cdFx0aWYgKGQgPCBkaXN0KSB7XG5cdFx0XHRkaXN0ID0gZDtcblx0XHRcdHJlc3VsdCA9IHI7XG5cdFx0fVxuXHR9XG5cdFxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9jb25uZWN0Um9vbXMgPSBmdW5jdGlvbihyb29tMSwgcm9vbTIpIHtcblx0Lypcblx0XHRyb29tMS5kZWJ1ZygpO1xuXHRcdHJvb20yLmRlYnVnKCk7XG5cdCovXG5cblx0dmFyIGNlbnRlcjEgPSByb29tMS5nZXRDZW50ZXIoKTtcblx0dmFyIGNlbnRlcjIgPSByb29tMi5nZXRDZW50ZXIoKTtcblxuXHR2YXIgZGlmZlggPSBjZW50ZXIyWzBdIC0gY2VudGVyMVswXTtcblx0dmFyIGRpZmZZID0gY2VudGVyMlsxXSAtIGNlbnRlcjFbMV07XG5cblx0aWYgKE1hdGguYWJzKGRpZmZYKSA8IE1hdGguYWJzKGRpZmZZKSkgeyAvKiBmaXJzdCB0cnkgY29ubmVjdGluZyBub3J0aC1zb3V0aCB3YWxscyAqL1xuXHRcdHZhciBkaXJJbmRleDEgPSAoZGlmZlkgPiAwID8gMiA6IDApO1xuXHRcdHZhciBkaXJJbmRleDIgPSAoZGlySW5kZXgxICsgMikgJSA0O1xuXHRcdHZhciBtaW4gPSByb29tMi5nZXRMZWZ0KCk7XG5cdFx0dmFyIG1heCA9IHJvb20yLmdldFJpZ2h0KCk7XG5cdFx0dmFyIGluZGV4ID0gMDtcblx0fSBlbHNlIHsgLyogZmlyc3QgdHJ5IGNvbm5lY3RpbmcgZWFzdC13ZXN0IHdhbGxzICovXG5cdFx0dmFyIGRpckluZGV4MSA9IChkaWZmWCA+IDAgPyAxIDogMyk7XG5cdFx0dmFyIGRpckluZGV4MiA9IChkaXJJbmRleDEgKyAyKSAlIDQ7XG5cdFx0dmFyIG1pbiA9IHJvb20yLmdldFRvcCgpO1xuXHRcdHZhciBtYXggPSByb29tMi5nZXRCb3R0b20oKTtcblx0XHR2YXIgaW5kZXggPSAxO1xuXHR9XG5cblx0dmFyIHN0YXJ0ID0gdGhpcy5fcGxhY2VJbldhbGwocm9vbTEsIGRpckluZGV4MSk7IC8qIGNvcnJpZG9yIHdpbGwgc3RhcnQgaGVyZSAqL1xuXHRpZiAoIXN0YXJ0KSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmIChzdGFydFtpbmRleF0gPj0gbWluICYmIHN0YXJ0W2luZGV4XSA8PSBtYXgpIHsgLyogcG9zc2libGUgdG8gY29ubmVjdCB3aXRoIHN0cmFpZ2h0IGxpbmUgKEktbGlrZSkgKi9cblx0XHR2YXIgZW5kID0gc3RhcnQuc2xpY2UoKTtcblx0XHR2YXIgdmFsdWUgPSBudWxsO1xuXHRcdHN3aXRjaCAoZGlySW5kZXgyKSB7XG5cdFx0XHRjYXNlIDA6IHZhbHVlID0gcm9vbTIuZ2V0VG9wKCktMTsgYnJlYWs7XG5cdFx0XHRjYXNlIDE6IHZhbHVlID0gcm9vbTIuZ2V0UmlnaHQoKSsxOyBicmVhaztcblx0XHRcdGNhc2UgMjogdmFsdWUgPSByb29tMi5nZXRCb3R0b20oKSsxOyBicmVhaztcblx0XHRcdGNhc2UgMzogdmFsdWUgPSByb29tMi5nZXRMZWZ0KCktMTsgYnJlYWs7XG5cdFx0fVxuXHRcdGVuZFsoaW5kZXgrMSklMl0gPSB2YWx1ZTtcblx0XHR0aGlzLl9kaWdMaW5lKFtzdGFydCwgZW5kXSk7XG5cdFx0XG5cdH0gZWxzZSBpZiAoc3RhcnRbaW5kZXhdIDwgbWluLTEgfHwgc3RhcnRbaW5kZXhdID4gbWF4KzEpIHsgLyogbmVlZCB0byBzd2l0Y2ggdGFyZ2V0IHdhbGwgKEwtbGlrZSkgKi9cblxuXHRcdHZhciBkaWZmID0gc3RhcnRbaW5kZXhdIC0gY2VudGVyMltpbmRleF07XG5cdFx0c3dpdGNoIChkaXJJbmRleDIpIHtcblx0XHRcdGNhc2UgMDpcblx0XHRcdGNhc2UgMTpcdHZhciByb3RhdGlvbiA9IChkaWZmIDwgMCA/IDMgOiAxKTsgYnJlYWs7XG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRjYXNlIDM6XHR2YXIgcm90YXRpb24gPSAoZGlmZiA8IDAgPyAxIDogMyk7IGJyZWFrO1xuXHRcdH1cblx0XHRkaXJJbmRleDIgPSAoZGlySW5kZXgyICsgcm90YXRpb24pICUgNDtcblx0XHRcblx0XHR2YXIgZW5kID0gdGhpcy5fcGxhY2VJbldhbGwocm9vbTIsIGRpckluZGV4Mik7XG5cdFx0aWYgKCFlbmQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0XHR2YXIgbWlkID0gWzAsIDBdO1xuXHRcdG1pZFtpbmRleF0gPSBzdGFydFtpbmRleF07XG5cdFx0dmFyIGluZGV4MiA9IChpbmRleCsxKSUyO1xuXHRcdG1pZFtpbmRleDJdID0gZW5kW2luZGV4Ml07XG5cdFx0dGhpcy5fZGlnTGluZShbc3RhcnQsIG1pZCwgZW5kXSk7XG5cdFx0XG5cdH0gZWxzZSB7IC8qIHVzZSBjdXJyZW50IHdhbGwgcGFpciwgYnV0IGFkanVzdCB0aGUgbGluZSBpbiB0aGUgbWlkZGxlIChTLWxpa2UpICovXG5cdFxuXHRcdHZhciBpbmRleDIgPSAoaW5kZXgrMSklMjtcblx0XHR2YXIgZW5kID0gdGhpcy5fcGxhY2VJbldhbGwocm9vbTIsIGRpckluZGV4Mik7XG5cdFx0aWYgKCFlbmQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0dmFyIG1pZCA9IE1hdGgucm91bmQoKGVuZFtpbmRleDJdICsgc3RhcnRbaW5kZXgyXSkvMik7XG5cblx0XHR2YXIgbWlkMSA9IFswLCAwXTtcblx0XHR2YXIgbWlkMiA9IFswLCAwXTtcblx0XHRtaWQxW2luZGV4XSA9IHN0YXJ0W2luZGV4XTtcblx0XHRtaWQxW2luZGV4Ml0gPSBtaWQ7XG5cdFx0bWlkMltpbmRleF0gPSBlbmRbaW5kZXhdO1xuXHRcdG1pZDJbaW5kZXgyXSA9IG1pZDtcblx0XHR0aGlzLl9kaWdMaW5lKFtzdGFydCwgbWlkMSwgbWlkMiwgZW5kXSk7XG5cdH1cblxuXHRyb29tMS5hZGREb29yKHN0YXJ0WzBdLCBzdGFydFsxXSk7XG5cdHJvb20yLmFkZERvb3IoZW5kWzBdLCBlbmRbMV0pO1xuXHRcblx0dmFyIGluZGV4ID0gdGhpcy5fdW5jb25uZWN0ZWQuaW5kZXhPZihyb29tMSk7XG5cdGlmIChpbmRleCAhPSAtMSkge1xuXHRcdHRoaXMuX3VuY29ubmVjdGVkLnNwbGljZShpbmRleCwgMSk7XG5cdFx0dGhpcy5fY29ubmVjdGVkLnB1c2gocm9vbTEpO1xuXHR9XG5cblx0dmFyIGluZGV4ID0gdGhpcy5fdW5jb25uZWN0ZWQuaW5kZXhPZihyb29tMik7XG5cdGlmIChpbmRleCAhPSAtMSkge1xuXHRcdHRoaXMuX3VuY29ubmVjdGVkLnNwbGljZShpbmRleCwgMSk7XG5cdFx0dGhpcy5fY29ubmVjdGVkLnB1c2gocm9vbTIpO1xuXHR9XG5cdFxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuUk9ULk1hcC5Vbmlmb3JtLnByb3RvdHlwZS5fcGxhY2VJbldhbGwgPSBmdW5jdGlvbihyb29tLCBkaXJJbmRleCkge1xuXHR2YXIgc3RhcnQgPSBbMCwgMF07XG5cdHZhciBkaXIgPSBbMCwgMF07XG5cdHZhciBsZW5ndGggPSAwO1xuXHRcblx0c3dpdGNoIChkaXJJbmRleCkge1xuXHRcdGNhc2UgMDpcblx0XHRcdGRpciA9IFsxLCAwXTtcblx0XHRcdHN0YXJ0ID0gW3Jvb20uZ2V0TGVmdCgpLCByb29tLmdldFRvcCgpLTFdO1xuXHRcdFx0bGVuZ3RoID0gcm9vbS5nZXRSaWdodCgpLXJvb20uZ2V0TGVmdCgpKzE7XG5cdFx0YnJlYWs7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0ZGlyID0gWzAsIDFdO1xuXHRcdFx0c3RhcnQgPSBbcm9vbS5nZXRSaWdodCgpKzEsIHJvb20uZ2V0VG9wKCldO1xuXHRcdFx0bGVuZ3RoID0gcm9vbS5nZXRCb3R0b20oKS1yb29tLmdldFRvcCgpKzE7XG5cdFx0YnJlYWs7XG5cdFx0Y2FzZSAyOlxuXHRcdFx0ZGlyID0gWzEsIDBdO1xuXHRcdFx0c3RhcnQgPSBbcm9vbS5nZXRMZWZ0KCksIHJvb20uZ2V0Qm90dG9tKCkrMV07XG5cdFx0XHRsZW5ndGggPSByb29tLmdldFJpZ2h0KCktcm9vbS5nZXRMZWZ0KCkrMTtcblx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRkaXIgPSBbMCwgMV07XG5cdFx0XHRzdGFydCA9IFtyb29tLmdldExlZnQoKS0xLCByb29tLmdldFRvcCgpXTtcblx0XHRcdGxlbmd0aCA9IHJvb20uZ2V0Qm90dG9tKCktcm9vbS5nZXRUb3AoKSsxO1xuXHRcdGJyZWFrO1xuXHR9XG5cdFxuXHR2YXIgYXZhaWwgPSBbXTtcblx0dmFyIGxhc3RCYWRJbmRleCA9IC0yO1xuXG5cdGZvciAodmFyIGk9MDtpPGxlbmd0aDtpKyspIHtcblx0XHR2YXIgeCA9IHN0YXJ0WzBdICsgaSpkaXJbMF07XG5cdFx0dmFyIHkgPSBzdGFydFsxXSArIGkqZGlyWzFdO1xuXHRcdGF2YWlsLnB1c2gobnVsbCk7XG5cdFx0XG5cdFx0dmFyIGlzV2FsbCA9ICh0aGlzLl9tYXBbeF1beV0gPT0gMSk7XG5cdFx0aWYgKGlzV2FsbCkge1xuXHRcdFx0aWYgKGxhc3RCYWRJbmRleCAhPSBpLTEpIHsgYXZhaWxbaV0gPSBbeCwgeV07IH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bGFzdEJhZEluZGV4ID0gaTtcblx0XHRcdGlmIChpKSB7IGF2YWlsW2ktMV0gPSBudWxsOyB9XG5cdFx0fVxuXHR9XG5cdFxuXHRmb3IgKHZhciBpPWF2YWlsLmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcblx0XHRpZiAoIWF2YWlsW2ldKSB7IGF2YWlsLnNwbGljZShpLCAxKTsgfVxuXHR9XG5cdHJldHVybiAoYXZhaWwubGVuZ3RoID8gYXZhaWwucmFuZG9tKCkgOiBudWxsKTtcbn1cblxuLyoqXG4gKiBEaWcgYSBwb2x5bGluZS5cbiAqL1xuUk9ULk1hcC5Vbmlmb3JtLnByb3RvdHlwZS5fZGlnTGluZSA9IGZ1bmN0aW9uKHBvaW50cykge1xuXHRmb3IgKHZhciBpPTE7aTxwb2ludHMubGVuZ3RoO2krKykge1xuXHRcdHZhciBzdGFydCA9IHBvaW50c1tpLTFdO1xuXHRcdHZhciBlbmQgPSBwb2ludHNbaV07XG5cdFx0dmFyIGNvcnJpZG9yID0gbmV3IFJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvcihzdGFydFswXSwgc3RhcnRbMV0sIGVuZFswXSwgZW5kWzFdKTtcblx0XHRjb3JyaWRvci5jcmVhdGUodGhpcy5fZGlnQ2FsbGJhY2spO1xuXHRcdHRoaXMuX2NvcnJpZG9ycy5wdXNoKGNvcnJpZG9yKTtcblx0fVxufVxuXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9kaWdDYWxsYmFjayA9IGZ1bmN0aW9uKHgsIHksIHZhbHVlKSB7XG5cdHRoaXMuX21hcFt4XVt5XSA9IHZhbHVlO1xuXHRpZiAodmFsdWUgPT0gMCkgeyB0aGlzLl9kdWcrKzsgfVxufVxuXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9pc1dhbGxDYWxsYmFjayA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0aWYgKHggPCAwIHx8IHkgPCAwIHx8IHggPj0gdGhpcy5fd2lkdGggfHwgeSA+PSB0aGlzLl9oZWlnaHQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdHJldHVybiAodGhpcy5fbWFwW3hdW3ldID09IDEpO1xufVxuXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9jYW5CZUR1Z0NhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHRpZiAoeCA8IDEgfHwgeSA8IDEgfHwgeCsxID49IHRoaXMuX3dpZHRoIHx8IHkrMSA+PSB0aGlzLl9oZWlnaHQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdHJldHVybiAodGhpcy5fbWFwW3hdW3ldID09IDEpO1xufVxuXG4vKipcbiAqIEBhdXRob3IgaHlha3VnZWlcbiAqIEBjbGFzcyBEdW5nZW9uIGdlbmVyYXRvciB3aGljaCB1c2VzIHRoZSBcIm9yZ2luYWxcIiBSb2d1ZSBkdW5nZW9uIGdlbmVyYXRpb24gYWxnb3JpdGhtLiBTZWUgaHR0cDovL2t1b2kuY29tL35rYW1pa2F6ZS9HYW1lRGVzaWduL2FydDA3X3JvZ3VlX2R1bmdlb24ucGhwXG4gKiBAYXVnbWVudHMgUk9ULk1hcFxuICogQHBhcmFtIHtpbnR9IFt3aWR0aD1ST1QuREVGQVVMVF9XSURUSF1cbiAqIEBwYXJhbSB7aW50fSBbaGVpZ2h0PVJPVC5ERUZBVUxUX0hFSUdIVF1cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uc1xuICogQHBhcmFtIHtpbnRbXX0gW29wdGlvbnMuY2VsbFdpZHRoPTNdIE51bWJlciBvZiBjZWxscyB0byBjcmVhdGUgb24gdGhlIGhvcml6b250YWwgKG51bWJlciBvZiByb29tcyBob3Jpem9udGFsbHkpXG4gKiBAcGFyYW0ge2ludFtdfSBbb3B0aW9ucy5jZWxsSGVpZ2h0PTNdIE51bWJlciBvZiBjZWxscyB0byBjcmVhdGUgb24gdGhlIHZlcnRpY2FsIChudW1iZXIgb2Ygcm9vbXMgdmVydGljYWxseSkgXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMucm9vbVdpZHRoXSBSb29tIG1pbiBhbmQgbWF4IHdpZHRoIC0gbm9ybWFsbHkgc2V0IGF1dG8tbWFnaWNhbGx5IHZpYSB0aGUgY29uc3RydWN0b3IuXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMucm9vbUhlaWdodF0gUm9vbSBtaW4gYW5kIG1heCBoZWlnaHQgLSBub3JtYWxseSBzZXQgYXV0by1tYWdpY2FsbHkgdmlhIHRoZSBjb25zdHJ1Y3Rvci4gXG4gKi9cblJPVC5NYXAuUm9ndWUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBvcHRpb25zKSB7XG5cdFJPVC5NYXAuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcblx0XG5cdHRoaXMuX29wdGlvbnMgPSB7XG5cdFx0Y2VsbFdpZHRoOiAzLCAgLy8gTk9URSB0byBzZWxmLCB0aGVzZSBjb3VsZCBwcm9iYWJseSB3b3JrIHRoZSBzYW1lIGFzIHRoZSByb29tV2lkdGgvcm9vbSBIZWlnaHQgdmFsdWVzXG5cdFx0Y2VsbEhlaWdodDogMyAgLy8gICAgIGllLiBhcyBhbiBhcnJheSB3aXRoIG1pbi1tYXggdmFsdWVzIGZvciBlYWNoIGRpcmVjdGlvbi4uLi5cblx0fVxuXHRcblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cdFxuXHQvKlxuXHRTZXQgdGhlIHJvb20gc2l6ZXMgYWNjb3JkaW5nIHRvIHRoZSBvdmVyLWFsbCB3aWR0aCBvZiB0aGUgbWFwLCBcblx0YW5kIHRoZSBjZWxsIHNpemVzLiBcblx0Ki9cblx0XG5cdGlmICghdGhpcy5fb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcInJvb21XaWR0aFwiKSkge1xuXHRcdHRoaXMuX29wdGlvbnNbXCJyb29tV2lkdGhcIl0gPSB0aGlzLl9jYWxjdWxhdGVSb29tU2l6ZSh0aGlzLl93aWR0aCwgdGhpcy5fb3B0aW9uc1tcImNlbGxXaWR0aFwiXSk7XG5cdH1cblx0aWYgKCF0aGlzLl9vcHRpb25zLmhhc093blByb3BlcnR5KFwicm9vbUhlaWdodFwiKSkge1xuXHRcdHRoaXMuX29wdGlvbnNbXCJyb29tSGVpZ2h0XCJdID0gdGhpcy5fY2FsY3VsYXRlUm9vbVNpemUodGhpcy5faGVpZ2h0LCB0aGlzLl9vcHRpb25zW1wiY2VsbEhlaWdodFwiXSk7XG5cdH1cblx0XG59XG5cblJPVC5NYXAuUm9ndWUuZXh0ZW5kKFJPVC5NYXApOyBcblxuLyoqXG4gKiBAc2VlIFJPVC5NYXAjY3JlYXRlXG4gKi9cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdHRoaXMubWFwID0gdGhpcy5fZmlsbE1hcCgxKTtcblx0dGhpcy5yb29tcyA9IFtdO1xuXHR0aGlzLmNvbm5lY3RlZENlbGxzID0gW107XG5cdFxuXHR0aGlzLl9pbml0Um9vbXMoKTtcblx0dGhpcy5fY29ubmVjdFJvb21zKCk7XG5cdHRoaXMuX2Nvbm5lY3RVbmNvbm5lY3RlZFJvb21zKCk7XG5cdHRoaXMuX2NyZWF0ZVJhbmRvbVJvb21Db25uZWN0aW9ucygpO1xuXHR0aGlzLl9jcmVhdGVSb29tcygpO1xuXHR0aGlzLl9jcmVhdGVDb3JyaWRvcnMoKTtcblx0XG5cdGlmIChjYWxsYmFjaykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fd2lkdGg7IGkrKykge1xuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLl9oZWlnaHQ7IGorKykge1xuXHRcdFx0XHRjYWxsYmFjayhpLCBqLCB0aGlzLm1hcFtpXVtqXSk7ICAgXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdFxuXHRyZXR1cm4gdGhpcztcbn1cblxuUk9ULk1hcC5Sb2d1ZS5wcm90b3R5cGUuX2NhbGN1bGF0ZVJvb21TaXplID0gZnVuY3Rpb24oc2l6ZSwgY2VsbCkge1xuXHR2YXIgbWF4ID0gTWF0aC5mbG9vcigoc2l6ZS9jZWxsKSAqIDAuOCk7XG5cdHZhciBtaW4gPSBNYXRoLmZsb29yKChzaXplL2NlbGwpICogMC4yNSk7XG5cdGlmIChtaW4gPCAyKSBtaW4gPSAyO1xuXHRpZiAobWF4IDwgMikgbWF4ID0gMjtcblx0cmV0dXJuIFttaW4sIG1heF07XG59XG5cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9pbml0Um9vbXMgPSBmdW5jdGlvbiAoKSB7IFxuXHQvLyBjcmVhdGUgcm9vbXMgYXJyYXkuIFRoaXMgaXMgdGhlIFwiZ3JpZFwiIGxpc3QgZnJvbSB0aGUgYWxnby4gIFxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX29wdGlvbnMuY2VsbFdpZHRoOyBpKyspIHsgIFxuXHRcdHRoaXMucm9vbXMucHVzaChbXSk7XG5cdFx0Zm9yKHZhciBqID0gMDsgaiA8IHRoaXMuX29wdGlvbnMuY2VsbEhlaWdodDsgaisrKSB7XG5cdFx0XHR0aGlzLnJvb21zW2ldLnB1c2goe1wieFwiOjAsIFwieVwiOjAsIFwid2lkdGhcIjowLCBcImhlaWdodFwiOjAsIFwiY29ubmVjdGlvbnNcIjpbXSwgXCJjZWxseFwiOmksIFwiY2VsbHlcIjpqfSk7XG5cdFx0fVxuXHR9XG59XG5cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9jb25uZWN0Um9vbXMgPSBmdW5jdGlvbigpIHtcblx0Ly9waWNrIHJhbmRvbSBzdGFydGluZyBncmlkXG5cdHZhciBjZ3ggPSBST1QuUk5HLmdldFVuaWZvcm1JbnQoMCwgdGhpcy5fb3B0aW9ucy5jZWxsV2lkdGgtMSk7XG5cdHZhciBjZ3kgPSBST1QuUk5HLmdldFVuaWZvcm1JbnQoMCwgdGhpcy5fb3B0aW9ucy5jZWxsSGVpZ2h0LTEpO1xuXHRcblx0dmFyIGlkeDtcblx0dmFyIG5jZ3g7XG5cdHZhciBuY2d5O1xuXHRcblx0dmFyIGZvdW5kID0gZmFsc2U7XG5cdHZhciByb29tO1xuXHR2YXIgb3RoZXJSb29tO1xuXHRcblx0Ly8gZmluZCAgdW5jb25uZWN0ZWQgbmVpZ2hib3VyIGNlbGxzXG5cdGRvIHtcblx0XG5cdFx0Ly92YXIgZGlyVG9DaGVjayA9IFswLDEsMiwzLDQsNSw2LDddO1xuXHRcdHZhciBkaXJUb0NoZWNrID0gWzAsMiw0LDZdO1xuXHRcdGRpclRvQ2hlY2sgPSBkaXJUb0NoZWNrLnJhbmRvbWl6ZSgpO1xuXHRcdFxuXHRcdGRvIHtcblx0XHRcdGZvdW5kID0gZmFsc2U7XG5cdFx0XHRpZHggPSBkaXJUb0NoZWNrLnBvcCgpO1xuXHRcdFx0XG5cdFx0XHRcblx0XHRcdG5jZ3ggPSBjZ3ggKyBST1QuRElSU1s4XVtpZHhdWzBdO1xuXHRcdFx0bmNneSA9IGNneSArIFJPVC5ESVJTWzhdW2lkeF1bMV07XG5cdFx0XHRcblx0XHRcdGlmKG5jZ3ggPCAwIHx8IG5jZ3ggPj0gdGhpcy5fb3B0aW9ucy5jZWxsV2lkdGgpIGNvbnRpbnVlO1xuXHRcdFx0aWYobmNneSA8IDAgfHwgbmNneSA+PSB0aGlzLl9vcHRpb25zLmNlbGxIZWlnaHQpIGNvbnRpbnVlO1xuXHRcdFx0XG5cdFx0XHRyb29tID0gdGhpcy5yb29tc1tjZ3hdW2NneV07XG5cdFx0XHRcblx0XHRcdGlmKHJvb21bXCJjb25uZWN0aW9uc1wiXS5sZW5ndGggPiAwKVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBhcyBsb25nIGFzIHRoaXMgcm9vbSBkb2Vzbid0IGFscmVhZHkgY29vbmVjdCB0byBtZSwgd2UgYXJlIG9rIHdpdGggaXQuIFxuXHRcdFx0XHRpZihyb29tW1wiY29ubmVjdGlvbnNcIl1bMF1bMF0gPT0gbmNneCAmJlxuXHRcdFx0XHRyb29tW1wiY29ubmVjdGlvbnNcIl1bMF1bMV0gPT0gbmNneSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdG90aGVyUm9vbSA9IHRoaXMucm9vbXNbbmNneF1bbmNneV07XG5cdFx0XHRcblx0XHRcdGlmIChvdGhlclJvb21bXCJjb25uZWN0aW9uc1wiXS5sZW5ndGggPT0gMCkgeyBcblx0XHRcdFx0b3RoZXJSb29tW1wiY29ubmVjdGlvbnNcIl0ucHVzaChbY2d4LGNneV0pO1xuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5jb25uZWN0ZWRDZWxscy5wdXNoKFtuY2d4LCBuY2d5XSk7XG5cdFx0XHRcdGNneCA9IG5jZ3g7XG5cdFx0XHRcdGNneSA9IG5jZ3k7XG5cdFx0XHRcdGZvdW5kID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHR9IHdoaWxlIChkaXJUb0NoZWNrLmxlbmd0aCA+IDAgJiYgZm91bmQgPT0gZmFsc2UpXG5cdFx0XG5cdH0gd2hpbGUgKGRpclRvQ2hlY2subGVuZ3RoID4gMClcblxufVxuXG5ST1QuTWFwLlJvZ3VlLnByb3RvdHlwZS5fY29ubmVjdFVuY29ubmVjdGVkUm9vbXMgPSBmdW5jdGlvbigpIHtcblx0Ly9XaGlsZSB0aGVyZSBhcmUgdW5jb25uZWN0ZWQgcm9vbXMsIHRyeSB0byBjb25uZWN0IHRoZW0gdG8gYSByYW5kb20gY29ubmVjdGVkIG5laWdoYm9yIFxuXHQvLyhpZiBhIHJvb20gaGFzIG5vIGNvbm5lY3RlZCBuZWlnaGJvcnMgeWV0LCBqdXN0IGtlZXAgY3ljbGluZywgeW91J2xsIGZpbGwgb3V0IHRvIGl0IGV2ZW50dWFsbHkpLlxuXHR2YXIgY3cgPSB0aGlzLl9vcHRpb25zLmNlbGxXaWR0aDtcblx0dmFyIGNoID0gdGhpcy5fb3B0aW9ucy5jZWxsSGVpZ2h0O1xuXHRcblx0dmFyIHJhbmRvbUNvbm5lY3RlZENlbGw7XG5cdHRoaXMuY29ubmVjdGVkQ2VsbHMgPSB0aGlzLmNvbm5lY3RlZENlbGxzLnJhbmRvbWl6ZSgpO1xuXHR2YXIgcm9vbTtcblx0dmFyIG90aGVyUm9vbTtcblx0dmFyIHZhbGlkUm9vbTtcblx0XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fb3B0aW9ucy5jZWxsV2lkdGg7IGkrKykge1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5fb3B0aW9ucy5jZWxsSGVpZ2h0OyBqKyspICB7XG5cdFx0XHRcdFxuXHRcdFx0cm9vbSA9IHRoaXMucm9vbXNbaV1bal07XG5cdFx0XHRcblx0XHRcdGlmIChyb29tW1wiY29ubmVjdGlvbnNcIl0ubGVuZ3RoID09IDApIHtcblx0XHRcdFx0dmFyIGRpcmVjdGlvbnMgPSBbMCwyLDQsNl07XG5cdFx0XHRcdGRpcmVjdGlvbnMgPSBkaXJlY3Rpb25zLnJhbmRvbWl6ZSgpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIHZhbGlkUm9vbSA9IGZhbHNlO1xuXHRcdFx0XHRcblx0XHRcdFx0ZG8ge1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciBkaXJJZHggPSBkaXJlY3Rpb25zLnBvcCgpO1xuXHRcdFx0XHRcdHZhciBuZXdJID0gaSArIFJPVC5ESVJTWzhdW2RpcklkeF1bMF07XG5cdFx0XHRcdFx0dmFyIG5ld0ogPSBqICsgUk9ULkRJUlNbOF1bZGlySWR4XVsxXTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiAobmV3SSA8IDAgfHwgbmV3SSA+PSBjdyB8fCBcblx0XHRcdFx0XHRuZXdKIDwgMCB8fCBuZXdKID49IGNoKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0b3RoZXJSb29tID0gdGhpcy5yb29tc1tuZXdJXVtuZXdKXTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YWxpZFJvb20gPSB0cnVlO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChvdGhlclJvb21bXCJjb25uZWN0aW9uc1wiXS5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGZvciAodmFyIGsgPSAwOyBrIDwgb3RoZXJSb29tW1wiY29ubmVjdGlvbnNcIl0ubGVuZ3RoOyBrKyspIHtcblx0XHRcdFx0XHRcdGlmKG90aGVyUm9vbVtcImNvbm5lY3Rpb25zXCJdW2tdWzBdID09IGkgJiYgXG5cdFx0XHRcdFx0XHRvdGhlclJvb21bXCJjb25uZWN0aW9uc1wiXVtrXVsxXSA9PSBqKSB7XG5cdFx0XHRcdFx0XHRcdHZhbGlkUm9vbSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKHZhbGlkUm9vbSkgYnJlYWs7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH0gd2hpbGUgKGRpcmVjdGlvbnMubGVuZ3RoKVxuXHRcdFx0XHRcblx0XHRcdFx0aWYodmFsaWRSb29tKSB7IFxuXHRcdFx0XHRcdHJvb21bXCJjb25uZWN0aW9uc1wiXS5wdXNoKCBbb3RoZXJSb29tW1wiY2VsbHhcIl0sIG90aGVyUm9vbVtcImNlbGx5XCJdXSApOyAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCItLSBVbmFibGUgdG8gY29ubmVjdCByb29tLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5ST1QuTWFwLlJvZ3VlLnByb3RvdHlwZS5fY3JlYXRlUmFuZG9tUm9vbUNvbm5lY3Rpb25zID0gZnVuY3Rpb24oY29ubmVjdGlvbnMpIHtcblx0Ly8gRW1wdHkgZm9yIG5vdy4gXG59XG5cblxuUk9ULk1hcC5Sb2d1ZS5wcm90b3R5cGUuX2NyZWF0ZVJvb21zID0gZnVuY3Rpb24oKSB7XG5cdC8vIENyZWF0ZSBSb29tcyBcblx0XG5cdHZhciB3ID0gdGhpcy5fd2lkdGg7XG5cdHZhciBoID0gdGhpcy5faGVpZ2h0O1xuXHRcblx0dmFyIGN3ID0gdGhpcy5fb3B0aW9ucy5jZWxsV2lkdGg7XG5cdHZhciBjaCA9IHRoaXMuX29wdGlvbnMuY2VsbEhlaWdodDtcblx0XG5cdHZhciBjd3AgPSBNYXRoLmZsb29yKHRoaXMuX3dpZHRoIC8gY3cpO1xuXHR2YXIgY2hwID0gTWF0aC5mbG9vcih0aGlzLl9oZWlnaHQgLyBjaCk7XG5cdFxuXHR2YXIgcm9vbXc7XG5cdHZhciByb29taDtcblx0dmFyIHJvb21XaWR0aCA9IHRoaXMuX29wdGlvbnNbXCJyb29tV2lkdGhcIl07XG5cdHZhciByb29tSGVpZ2h0ID0gdGhpcy5fb3B0aW9uc1tcInJvb21IZWlnaHRcIl07XG5cdHZhciBzeDtcblx0dmFyIHN5O1xuXHR2YXIgdHg7XG5cdHZhciB0eTtcblx0dmFyIG90aGVyUm9vbTtcblx0XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgY3c7IGkrKykge1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2g7IGorKykge1xuXHRcdFx0c3ggPSBjd3AgKiBpO1xuXHRcdFx0c3kgPSBjaHAgKiBqO1xuXHRcdFx0XG5cdFx0XHRpZiAoc3ggPT0gMCkgc3ggPSAxO1xuXHRcdFx0aWYgKHN5ID09IDApIHN5ID0gMTtcblx0XHRcdFxuXHRcdFx0cm9vbXcgPSBST1QuUk5HLmdldFVuaWZvcm1JbnQocm9vbVdpZHRoWzBdLCByb29tV2lkdGhbMV0pO1xuXHRcdFx0cm9vbWggPSBST1QuUk5HLmdldFVuaWZvcm1JbnQocm9vbUhlaWdodFswXSwgcm9vbUhlaWdodFsxXSk7XG5cdFx0XHRcblx0XHRcdGlmIChqID4gMCkge1xuXHRcdFx0XHRvdGhlclJvb20gPSB0aGlzLnJvb21zW2ldW2otMV07XG5cdFx0XHRcdHdoaWxlIChzeSAtIChvdGhlclJvb21bXCJ5XCJdICsgb3RoZXJSb29tW1wiaGVpZ2h0XCJdICkgPCAzKSB7XG5cdFx0XHRcdFx0c3krKztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAoaSA+IDApIHtcblx0XHRcdFx0b3RoZXJSb29tID0gdGhpcy5yb29tc1tpLTFdW2pdO1xuXHRcdFx0XHR3aGlsZShzeCAtIChvdGhlclJvb21bXCJ4XCJdICsgb3RoZXJSb29tW1wid2lkdGhcIl0pIDwgMykge1xuXHRcdFx0XHRcdHN4Kys7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0dmFyIHN4T2Zmc2V0ID0gTWF0aC5yb3VuZChST1QuUk5HLmdldFVuaWZvcm1JbnQoMCwgY3dwLXJvb213KS8yKTtcblx0XHRcdHZhciBzeU9mZnNldCA9IE1hdGgucm91bmQoUk9ULlJORy5nZXRVbmlmb3JtSW50KDAsIGNocC1yb29taCkvMik7XG5cdFx0XHRcblx0XHRcdHdoaWxlIChzeCArIHN4T2Zmc2V0ICsgcm9vbXcgPj0gdykge1xuXHRcdFx0XHRpZihzeE9mZnNldCkge1xuXHRcdFx0XHRcdHN4T2Zmc2V0LS07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cm9vbXctLTsgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0d2hpbGUgKHN5ICsgc3lPZmZzZXQgKyByb29taCA+PSBoKSB7IFxuXHRcdFx0XHRpZihzeU9mZnNldCkge1xuXHRcdFx0XHRcdHN5T2Zmc2V0LS07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cm9vbWgtLTsgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0c3ggPSBzeCArIHN4T2Zmc2V0O1xuXHRcdFx0c3kgPSBzeSArIHN5T2Zmc2V0O1xuXHRcdFx0XG5cdFx0XHR0aGlzLnJvb21zW2ldW2pdW1wieFwiXSA9IHN4O1xuXHRcdFx0dGhpcy5yb29tc1tpXVtqXVtcInlcIl0gPSBzeTtcblx0XHRcdHRoaXMucm9vbXNbaV1bal1bXCJ3aWR0aFwiXSA9IHJvb213O1xuXHRcdFx0dGhpcy5yb29tc1tpXVtqXVtcImhlaWdodFwiXSA9IHJvb21oOyAgXG5cdFx0XHRcblx0XHRcdGZvciAodmFyIGlpID0gc3g7IGlpIDwgc3ggKyByb29tdzsgaWkrKykge1xuXHRcdFx0XHRmb3IgKHZhciBqaiA9IHN5OyBqaiA8IHN5ICsgcm9vbWg7IGpqKyspIHtcblx0XHRcdFx0XHR0aGlzLm1hcFtpaV1bampdID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0fSAgXG5cdFx0fVxuXHR9XG59XG5cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9nZXRXYWxsUG9zaXRpb24gPSBmdW5jdGlvbihhUm9vbSwgYURpcmVjdGlvbikge1xuXHR2YXIgcng7XG5cdHZhciByeTtcblx0dmFyIGRvb3I7XG5cdFxuXHRpZiAoYURpcmVjdGlvbiA9PSAxIHx8IGFEaXJlY3Rpb24gPT0gMykge1xuXHRcdHJ4ID0gUk9ULlJORy5nZXRVbmlmb3JtSW50KGFSb29tW1wieFwiXSArIDEsIGFSb29tW1wieFwiXSArIGFSb29tW1wid2lkdGhcIl0gLSAyKTtcblx0XHRpZiAoYURpcmVjdGlvbiA9PSAxKSB7XG5cdFx0XHRyeSA9IGFSb29tW1wieVwiXSAtIDI7XG5cdFx0XHRkb29yID0gcnkgKyAxO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyeSA9IGFSb29tW1wieVwiXSArIGFSb29tW1wiaGVpZ2h0XCJdICsgMTtcblx0XHRcdGRvb3IgPSByeSAtMTtcblx0XHR9XG5cdFx0XG5cdFx0dGhpcy5tYXBbcnhdW2Rvb3JdID0gMDsgLy8gaSdtIG5vdCBzZXR0aW5nIGEgc3BlY2lmaWMgJ2Rvb3InIHRpbGUgdmFsdWUgcmlnaHQgbm93LCBqdXN0IGVtcHR5IHNwYWNlLiBcblx0XHRcblx0fSBlbHNlIGlmIChhRGlyZWN0aW9uID09IDIgfHwgYURpcmVjdGlvbiA9PSA0KSB7XG5cdFx0cnkgPSBST1QuUk5HLmdldFVuaWZvcm1JbnQoYVJvb21bXCJ5XCJdICsgMSwgYVJvb21bXCJ5XCJdICsgYVJvb21bXCJoZWlnaHRcIl0gLSAyKTtcblx0XHRpZihhRGlyZWN0aW9uID09IDIpIHtcblx0XHRcdHJ4ID0gYVJvb21bXCJ4XCJdICsgYVJvb21bXCJ3aWR0aFwiXSArIDE7XG5cdFx0XHRkb29yID0gcnggLSAxO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyeCA9IGFSb29tW1wieFwiXSAtIDI7XG5cdFx0XHRkb29yID0gcnggKyAxO1xuXHRcdH1cblx0XHRcblx0XHR0aGlzLm1hcFtkb29yXVtyeV0gPSAwOyAvLyBpJ20gbm90IHNldHRpbmcgYSBzcGVjaWZpYyAnZG9vcicgdGlsZSB2YWx1ZSByaWdodCBub3csIGp1c3QgZW1wdHkgc3BhY2UuIFxuXHRcdFxuXHR9XG5cdHJldHVybiBbcngsIHJ5XTtcbn1cblxuLyoqKlxuKiBAcGFyYW0gc3RhcnRQb3NpdGlvbiBhIDIgZWxlbWVudCBhcnJheVxuKiBAcGFyYW0gZW5kUG9zaXRpb24gYSAyIGVsZW1lbnQgYXJyYXlcbiovXG5ST1QuTWFwLlJvZ3VlLnByb3RvdHlwZS5fZHJhd0NvcnJpZG9yZSA9IGZ1bmN0aW9uIChzdGFydFBvc2l0aW9uLCBlbmRQb3NpdGlvbikge1xuXHR2YXIgeE9mZnNldCA9IGVuZFBvc2l0aW9uWzBdIC0gc3RhcnRQb3NpdGlvblswXTtcblx0dmFyIHlPZmZzZXQgPSBlbmRQb3NpdGlvblsxXSAtIHN0YXJ0UG9zaXRpb25bMV07XG5cdFxuXHR2YXIgeHBvcyA9IHN0YXJ0UG9zaXRpb25bMF07XG5cdHZhciB5cG9zID0gc3RhcnRQb3NpdGlvblsxXTtcblx0XG5cdHZhciB0ZW1wRGlzdDtcblx0dmFyIHhEaXI7XG5cdHZhciB5RGlyO1xuXHRcblx0dmFyIG1vdmU7IC8vIDIgZWxlbWVudCBhcnJheSwgZWxlbWVudCAwIGlzIHRoZSBkaXJlY3Rpb24sIGVsZW1lbnQgMSBpcyB0aGUgdG90YWwgdmFsdWUgdG8gbW92ZS4gXG5cdHZhciBtb3ZlcyA9IFtdOyAvLyBhIGxpc3Qgb2YgMiBlbGVtZW50IGFycmF5c1xuXHRcblx0dmFyIHhBYnMgPSBNYXRoLmFicyh4T2Zmc2V0KTtcblx0dmFyIHlBYnMgPSBNYXRoLmFicyh5T2Zmc2V0KTtcblx0XG5cdHZhciBwZXJjZW50ID0gUk9ULlJORy5nZXRVbmlmb3JtKCk7IC8vIHVzZWQgdG8gc3BsaXQgdGhlIG1vdmUgYXQgZGlmZmVyZW50IHBsYWNlcyBhbG9uZyB0aGUgbG9uZyBheGlzXG5cdHZhciBmaXJzdEhhbGYgPSBwZXJjZW50O1xuXHR2YXIgc2Vjb25kSGFsZiA9IDEgLSBwZXJjZW50O1xuXHRcblx0eERpciA9IHhPZmZzZXQgPiAwID8gMiA6IDY7XG5cdHlEaXIgPSB5T2Zmc2V0ID4gMCA/IDQgOiAwO1xuXHRcblx0aWYgKHhBYnMgPCB5QWJzKSB7XG5cdFx0Ly8gbW92ZSBmaXJzdEhhbGYgb2YgdGhlIHkgb2Zmc2V0XG5cdFx0dGVtcERpc3QgPSBNYXRoLmNlaWwoeUFicyAqIGZpcnN0SGFsZik7XG5cdFx0bW92ZXMucHVzaChbeURpciwgdGVtcERpc3RdKTtcblx0XHQvLyBtb3ZlIGFsbCB0aGUgeCBvZmZzZXRcblx0XHRtb3Zlcy5wdXNoKFt4RGlyLCB4QWJzXSk7XG5cdFx0Ly8gbW92ZSBzZW5kSGFsZiBvZiB0aGUgIHkgb2Zmc2V0XG5cdFx0dGVtcERpc3QgPSBNYXRoLmZsb29yKHlBYnMgKiBzZWNvbmRIYWxmKTtcblx0XHRtb3Zlcy5wdXNoKFt5RGlyLCB0ZW1wRGlzdF0pO1xuXHR9IGVsc2Uge1xuXHRcdC8vICBtb3ZlIGZpcnN0SGFsZiBvZiB0aGUgeCBvZmZzZXRcblx0XHR0ZW1wRGlzdCA9IE1hdGguY2VpbCh4QWJzICogZmlyc3RIYWxmKTtcblx0XHRtb3Zlcy5wdXNoKFt4RGlyLCB0ZW1wRGlzdF0pO1xuXHRcdC8vIG1vdmUgYWxsIHRoZSB5IG9mZnNldFxuXHRcdG1vdmVzLnB1c2goW3lEaXIsIHlBYnNdKTtcblx0XHQvLyBtb3ZlIHNlY29uZEhhbGYgb2YgdGhlIHggb2Zmc2V0LlxuXHRcdHRlbXBEaXN0ID0gTWF0aC5mbG9vcih4QWJzICogc2Vjb25kSGFsZik7XG5cdFx0bW92ZXMucHVzaChbeERpciwgdGVtcERpc3RdKTsgIFxuXHR9XG5cdFxuXHR0aGlzLm1hcFt4cG9zXVt5cG9zXSA9IDA7XG5cdFxuXHR3aGlsZSAobW92ZXMubGVuZ3RoID4gMCkge1xuXHRcdG1vdmUgPSBtb3Zlcy5wb3AoKTtcblx0XHR3aGlsZSAobW92ZVsxXSA+IDApIHtcblx0XHRcdHhwb3MgKz0gUk9ULkRJUlNbOF1bbW92ZVswXV1bMF07XG5cdFx0XHR5cG9zICs9IFJPVC5ESVJTWzhdW21vdmVbMF1dWzFdO1xuXHRcdFx0dGhpcy5tYXBbeHBvc11beXBvc10gPSAwO1xuXHRcdFx0bW92ZVsxXSA9IG1vdmVbMV0gLSAxO1xuXHRcdH1cblx0fVxufVxuXG5ST1QuTWFwLlJvZ3VlLnByb3RvdHlwZS5fY3JlYXRlQ29ycmlkb3JzID0gZnVuY3Rpb24gKCkge1xuXHQvLyBEcmF3IENvcnJpZG9ycyBiZXR3ZWVuIGNvbm5lY3RlZCByb29tc1xuXHRcblx0dmFyIGN3ID0gdGhpcy5fb3B0aW9ucy5jZWxsV2lkdGg7XG5cdHZhciBjaCA9IHRoaXMuX29wdGlvbnMuY2VsbEhlaWdodDtcblx0dmFyIHJvb207XG5cdHZhciBjb25uZWN0aW9uO1xuXHR2YXIgb3RoZXJSb29tO1xuXHR2YXIgd2FsbDtcblx0dmFyIG90aGVyV2FsbDtcblx0XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgY3c7IGkrKykge1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgY2g7IGorKykge1xuXHRcdFx0cm9vbSA9IHRoaXMucm9vbXNbaV1bal07XG5cdFx0XHRcblx0XHRcdGZvciAodmFyIGsgPSAwOyBrIDwgcm9vbVtcImNvbm5lY3Rpb25zXCJdLmxlbmd0aDsgaysrKSB7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdGNvbm5lY3Rpb24gPSByb29tW1wiY29ubmVjdGlvbnNcIl1ba107IFxuXHRcdFx0XHRcblx0XHRcdFx0b3RoZXJSb29tID0gdGhpcy5yb29tc1tjb25uZWN0aW9uWzBdXVtjb25uZWN0aW9uWzFdXTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIGZpZ3VyZSBvdXQgd2hhdCB3YWxsIG91ciBjb3JyaWRvciB3aWxsIHN0YXJ0IG9uZS5cblx0XHRcdFx0Ly8gZmlndXJlIG91dCB3aGF0IHdhbGwgb3VyIGNvcnJpZG9yIHdpbGwgZW5kIG9uLiBcblx0XHRcdFx0aWYgKG90aGVyUm9vbVtcImNlbGx4XCJdID4gcm9vbVtcImNlbGx4XCJdICkge1xuXHRcdFx0XHRcdHdhbGwgPSAyO1xuXHRcdFx0XHRcdG90aGVyV2FsbCA9IDQ7XG5cdFx0XHRcdH0gZWxzZSBpZiAob3RoZXJSb29tW1wiY2VsbHhcIl0gPCByb29tW1wiY2VsbHhcIl0gKSB7XG5cdFx0XHRcdFx0d2FsbCA9IDQ7XG5cdFx0XHRcdFx0b3RoZXJXYWxsID0gMjtcblx0XHRcdFx0fSBlbHNlIGlmKG90aGVyUm9vbVtcImNlbGx5XCJdID4gcm9vbVtcImNlbGx5XCJdKSB7XG5cdFx0XHRcdFx0d2FsbCA9IDM7XG5cdFx0XHRcdFx0b3RoZXJXYWxsID0gMTtcblx0XHRcdFx0fSBlbHNlIGlmKG90aGVyUm9vbVtcImNlbGx5XCJdIDwgcm9vbVtcImNlbGx5XCJdKSB7XG5cdFx0XHRcdFx0d2FsbCA9IDE7XG5cdFx0XHRcdFx0b3RoZXJXYWxsID0gMztcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0dGhpcy5fZHJhd0NvcnJpZG9yZSh0aGlzLl9nZXRXYWxsUG9zaXRpb24ocm9vbSwgd2FsbCksIHRoaXMuX2dldFdhbGxQb3NpdGlvbihvdGhlclJvb20sIG90aGVyV2FsbCkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuLyoqXG4gKiBAY2xhc3MgRHVuZ2VvbiBmZWF0dXJlOyBoYXMgb3duIC5jcmVhdGUoKSBtZXRob2RcbiAqL1xuUk9ULk1hcC5GZWF0dXJlID0gZnVuY3Rpb24oKSB7fVxuUk9ULk1hcC5GZWF0dXJlLnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24oY2FuQmVEdWdDYWxsYmFjaykge31cblJPVC5NYXAuRmVhdHVyZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oZGlnQ2FsbGJhY2spIHt9XG5ST1QuTWFwLkZlYXR1cmUucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24oKSB7fVxuUk9ULk1hcC5GZWF0dXJlLmNyZWF0ZVJhbmRvbUF0ID0gZnVuY3Rpb24oeCwgeSwgZHgsIGR5LCBvcHRpb25zKSB7fVxuXG4vKipcbiAqIEBjbGFzcyBSb29tXG4gKiBAYXVnbWVudHMgUk9ULk1hcC5GZWF0dXJlXG4gKiBAcGFyYW0ge2ludH0geDFcbiAqIEBwYXJhbSB7aW50fSB5MVxuICogQHBhcmFtIHtpbnR9IHgyXG4gKiBAcGFyYW0ge2ludH0geTJcbiAqIEBwYXJhbSB7aW50fSBbZG9vclhdXG4gKiBAcGFyYW0ge2ludH0gW2Rvb3JZXVxuICovXG5ST1QuTWFwLkZlYXR1cmUuUm9vbSA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCBkb29yWCwgZG9vclkpIHtcblx0dGhpcy5feDEgPSB4MTtcblx0dGhpcy5feTEgPSB5MTtcblx0dGhpcy5feDIgPSB4Mjtcblx0dGhpcy5feTIgPSB5Mjtcblx0dGhpcy5fZG9vcnMgPSB7fTtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiA0KSB7IHRoaXMuYWRkRG9vcihkb29yWCwgZG9vclkpOyB9XG59XG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5leHRlbmQoUk9ULk1hcC5GZWF0dXJlKTtcblxuLyoqXG4gKiBSb29tIG9mIHJhbmRvbSBzaXplLCB3aXRoIGEgZ2l2ZW4gZG9vcnMgYW5kIGRpcmVjdGlvblxuICovXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5jcmVhdGVSYW5kb21BdCA9IGZ1bmN0aW9uKHgsIHksIGR4LCBkeSwgb3B0aW9ucykge1xuXHR2YXIgbWluID0gb3B0aW9ucy5yb29tV2lkdGhbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLnJvb21XaWR0aFsxXTtcblx0dmFyIHdpZHRoID0gUk9ULlJORy5nZXRVbmlmb3JtSW50KG1pbiwgbWF4KTtcblx0XG5cdHZhciBtaW4gPSBvcHRpb25zLnJvb21IZWlnaHRbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLnJvb21IZWlnaHRbMV07XG5cdHZhciBoZWlnaHQgPSBST1QuUk5HLmdldFVuaWZvcm1JbnQobWluLCBtYXgpO1xuXHRcblx0aWYgKGR4ID09IDEpIHsgLyogdG8gdGhlIHJpZ2h0ICovXG5cdFx0dmFyIHkyID0geSAtIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkgKiBoZWlnaHQpO1xuXHRcdHJldHVybiBuZXcgdGhpcyh4KzEsIHkyLCB4K3dpZHRoLCB5MitoZWlnaHQtMSwgeCwgeSk7XG5cdH1cblx0XG5cdGlmIChkeCA9PSAtMSkgeyAvKiB0byB0aGUgbGVmdCAqL1xuXHRcdHZhciB5MiA9IHkgLSBNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpICogaGVpZ2h0KTtcblx0XHRyZXR1cm4gbmV3IHRoaXMoeC13aWR0aCwgeTIsIHgtMSwgeTIraGVpZ2h0LTEsIHgsIHkpO1xuXHR9XG5cblx0aWYgKGR5ID09IDEpIHsgLyogdG8gdGhlIGJvdHRvbSAqL1xuXHRcdHZhciB4MiA9IHggLSBNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpICogd2lkdGgpO1xuXHRcdHJldHVybiBuZXcgdGhpcyh4MiwgeSsxLCB4Mit3aWR0aC0xLCB5K2hlaWdodCwgeCwgeSk7XG5cdH1cblxuXHRpZiAoZHkgPT0gLTEpIHsgLyogdG8gdGhlIHRvcCAqL1xuXHRcdHZhciB4MiA9IHggLSBNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpICogd2lkdGgpO1xuXHRcdHJldHVybiBuZXcgdGhpcyh4MiwgeS1oZWlnaHQsIHgyK3dpZHRoLTEsIHktMSwgeCwgeSk7XG5cdH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkeCBvciBkeSBtdXN0IGJlIDEgb3IgLTFcIik7XG59XG5cbi8qKlxuICogUm9vbSBvZiByYW5kb20gc2l6ZSwgcG9zaXRpb25lZCBhcm91bmQgY2VudGVyIGNvb3Jkc1xuICovXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5jcmVhdGVSYW5kb21DZW50ZXIgPSBmdW5jdGlvbihjeCwgY3ksIG9wdGlvbnMpIHtcblx0dmFyIG1pbiA9IG9wdGlvbnMucm9vbVdpZHRoWzBdO1xuXHR2YXIgbWF4ID0gb3B0aW9ucy5yb29tV2lkdGhbMV07XG5cdHZhciB3aWR0aCA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChtaW4sIG1heCk7XG5cdFxuXHR2YXIgbWluID0gb3B0aW9ucy5yb29tSGVpZ2h0WzBdO1xuXHR2YXIgbWF4ID0gb3B0aW9ucy5yb29tSGVpZ2h0WzFdO1xuXHR2YXIgaGVpZ2h0ID0gUk9ULlJORy5nZXRVbmlmb3JtSW50KG1pbiwgbWF4KTtcblxuXHR2YXIgeDEgPSBjeCAtIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkqd2lkdGgpO1xuXHR2YXIgeTEgPSBjeSAtIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkqaGVpZ2h0KTtcblx0dmFyIHgyID0geDEgKyB3aWR0aCAtIDE7XG5cdHZhciB5MiA9IHkxICsgaGVpZ2h0IC0gMTtcblxuXHRyZXR1cm4gbmV3IHRoaXMoeDEsIHkxLCB4MiwgeTIpO1xufVxuXG4vKipcbiAqIFJvb20gb2YgcmFuZG9tIHNpemUgd2l0aGluIGEgZ2l2ZW4gZGltZW5zaW9uc1xuICovXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5jcmVhdGVSYW5kb20gPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCwgb3B0aW9ucykge1xuXHR2YXIgbWluID0gb3B0aW9ucy5yb29tV2lkdGhbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLnJvb21XaWR0aFsxXTtcblx0dmFyIHdpZHRoID0gUk9ULlJORy5nZXRVbmlmb3JtSW50KG1pbiwgbWF4KTtcblx0XG5cdHZhciBtaW4gPSBvcHRpb25zLnJvb21IZWlnaHRbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLnJvb21IZWlnaHRbMV07XG5cdHZhciBoZWlnaHQgPSBST1QuUk5HLmdldFVuaWZvcm1JbnQobWluLCBtYXgpO1xuXHRcblx0dmFyIGxlZnQgPSBhdmFpbFdpZHRoIC0gd2lkdGggLSAxO1xuXHR2YXIgdG9wID0gYXZhaWxIZWlnaHQgLSBoZWlnaHQgLSAxO1xuXG5cdHZhciB4MSA9IDEgKyBNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpKmxlZnQpO1xuXHR2YXIgeTEgPSAxICsgTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSp0b3ApO1xuXHR2YXIgeDIgPSB4MSArIHdpZHRoIC0gMTtcblx0dmFyIHkyID0geTEgKyBoZWlnaHQgLSAxO1xuXG5cdHJldHVybiBuZXcgdGhpcyh4MSwgeTEsIHgyLCB5Mik7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Sb29tLnByb3RvdHlwZS5hZGREb29yID0gZnVuY3Rpb24oeCwgeSkge1xuXHR0aGlzLl9kb29yc1t4K1wiLFwiK3ldID0gMTtcblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbn1cbiAqL1xuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmdldERvb3JzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0Zm9yICh2YXIga2V5IGluIHRoaXMuX2Rvb3JzKSB7XG5cdFx0dmFyIHBhcnRzID0ga2V5LnNwbGl0KFwiLFwiKTtcblx0XHRjYWxsYmFjayhwYXJzZUludChwYXJ0c1swXSksIHBhcnNlSW50KHBhcnRzWzFdKSk7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Sb29tLnByb3RvdHlwZS5jbGVhckRvb3JzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX2Rvb3JzID0ge307XG5cdHJldHVybiB0aGlzO1xufVxuXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuYWRkRG9vcnMgPSBmdW5jdGlvbihpc1dhbGxDYWxsYmFjaykge1xuXHR2YXIgbGVmdCA9IHRoaXMuX3gxLTE7XG5cdHZhciByaWdodCA9IHRoaXMuX3gyKzE7XG5cdHZhciB0b3AgPSB0aGlzLl95MS0xO1xuXHR2YXIgYm90dG9tID0gdGhpcy5feTIrMTtcblxuXHRmb3IgKHZhciB4PWxlZnQ7IHg8PXJpZ2h0OyB4KyspIHtcblx0XHRmb3IgKHZhciB5PXRvcDsgeTw9Ym90dG9tOyB5KyspIHtcblx0XHRcdGlmICh4ICE9IGxlZnQgJiYgeCAhPSByaWdodCAmJiB5ICE9IHRvcCAmJiB5ICE9IGJvdHRvbSkgeyBjb250aW51ZTsgfVxuXHRcdFx0aWYgKGlzV2FsbENhbGxiYWNrKHgsIHkpKSB7IGNvbnRpbnVlOyB9XG5cblx0XHRcdHRoaXMuYWRkRG9vcih4LCB5KTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmRlYnVnID0gZnVuY3Rpb24oKSB7XG5cdGNvbnNvbGUubG9nKFwicm9vbVwiLCB0aGlzLl94MSwgdGhpcy5feTEsIHRoaXMuX3gyLCB0aGlzLl95Mik7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Sb29tLnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24oaXNXYWxsQ2FsbGJhY2ssIGNhbkJlRHVnQ2FsbGJhY2spIHsgXG5cdHZhciBsZWZ0ID0gdGhpcy5feDEtMTtcblx0dmFyIHJpZ2h0ID0gdGhpcy5feDIrMTtcblx0dmFyIHRvcCA9IHRoaXMuX3kxLTE7XG5cdHZhciBib3R0b20gPSB0aGlzLl95MisxO1xuXHRcblx0Zm9yICh2YXIgeD1sZWZ0OyB4PD1yaWdodDsgeCsrKSB7XG5cdFx0Zm9yICh2YXIgeT10b3A7IHk8PWJvdHRvbTsgeSsrKSB7XG5cdFx0XHRpZiAoeCA9PSBsZWZ0IHx8IHggPT0gcmlnaHQgfHwgeSA9PSB0b3AgfHwgeSA9PSBib3R0b20pIHtcblx0XHRcdFx0aWYgKCFpc1dhbGxDYWxsYmFjayh4LCB5KSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghY2FuQmVEdWdDYWxsYmFjayh4LCB5KSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBkaWdDYWxsYmFjayBEaWcgY2FsbGJhY2sgd2l0aCBhIHNpZ25hdHVyZSAoeCwgeSwgdmFsdWUpLiBWYWx1ZXM6IDAgPSBlbXB0eSwgMSA9IHdhbGwsIDIgPSBkb29yLiBNdWx0aXBsZSBkb29ycyBhcmUgYWxsb3dlZC5cbiAqL1xuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGRpZ0NhbGxiYWNrKSB7IFxuXHR2YXIgbGVmdCA9IHRoaXMuX3gxLTE7XG5cdHZhciByaWdodCA9IHRoaXMuX3gyKzE7XG5cdHZhciB0b3AgPSB0aGlzLl95MS0xO1xuXHR2YXIgYm90dG9tID0gdGhpcy5feTIrMTtcblx0XG5cdHZhciB2YWx1ZSA9IDA7XG5cdGZvciAodmFyIHg9bGVmdDsgeDw9cmlnaHQ7IHgrKykge1xuXHRcdGZvciAodmFyIHk9dG9wOyB5PD1ib3R0b207IHkrKykge1xuXHRcdFx0aWYgKHgrXCIsXCIreSBpbiB0aGlzLl9kb29ycykge1xuXHRcdFx0XHR2YWx1ZSA9IDI7XG5cdFx0XHR9IGVsc2UgaWYgKHggPT0gbGVmdCB8fCB4ID09IHJpZ2h0IHx8IHkgPT0gdG9wIHx8IHkgPT0gYm90dG9tKSB7XG5cdFx0XHRcdHZhbHVlID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhbHVlID0gMDtcblx0XHRcdH1cblx0XHRcdGRpZ0NhbGxiYWNrKHgsIHksIHZhbHVlKTtcblx0XHR9XG5cdH1cbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmdldENlbnRlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gW01hdGgucm91bmQoKHRoaXMuX3gxICsgdGhpcy5feDIpLzIpLCBNYXRoLnJvdW5kKCh0aGlzLl95MSArIHRoaXMuX3kyKS8yKV07XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Sb29tLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl94MTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmdldFJpZ2h0ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl94Mjtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmdldFRvcCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5feTE7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Sb29tLnByb3RvdHlwZS5nZXRCb3R0b20gPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3kyO1xufVxuXG4vKipcbiAqIEBjbGFzcyBDb3JyaWRvclxuICogQGF1Z21lbnRzIFJPVC5NYXAuRmVhdHVyZVxuICogQHBhcmFtIHtpbnR9IHN0YXJ0WFxuICogQHBhcmFtIHtpbnR9IHN0YXJ0WVxuICogQHBhcmFtIHtpbnR9IGVuZFhcbiAqIEBwYXJhbSB7aW50fSBlbmRZXG4gKi9cblJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvciA9IGZ1bmN0aW9uKHN0YXJ0WCwgc3RhcnRZLCBlbmRYLCBlbmRZKSB7XG5cdHRoaXMuX3N0YXJ0WCA9IHN0YXJ0WDtcblx0dGhpcy5fc3RhcnRZID0gc3RhcnRZO1xuXHR0aGlzLl9lbmRYID0gZW5kWDsgXG5cdHRoaXMuX2VuZFkgPSBlbmRZO1xuXHR0aGlzLl9lbmRzV2l0aEFXYWxsID0gdHJ1ZTtcbn1cblJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvci5leHRlbmQoUk9ULk1hcC5GZWF0dXJlKTtcblxuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yLmNyZWF0ZVJhbmRvbUF0ID0gZnVuY3Rpb24oeCwgeSwgZHgsIGR5LCBvcHRpb25zKSB7XG5cdHZhciBtaW4gPSBvcHRpb25zLmNvcnJpZG9yTGVuZ3RoWzBdO1xuXHR2YXIgbWF4ID0gb3B0aW9ucy5jb3JyaWRvckxlbmd0aFsxXTtcblx0dmFyIGxlbmd0aCA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChtaW4sIG1heCk7XG5cdFxuXHRyZXR1cm4gbmV3IHRoaXMoeCwgeSwgeCArIGR4Kmxlbmd0aCwgeSArIGR5Kmxlbmd0aCk7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvci5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coXCJjb3JyaWRvclwiLCB0aGlzLl9zdGFydFgsIHRoaXMuX3N0YXJ0WSwgdGhpcy5fZW5kWCwgdGhpcy5fZW5kWSk7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvci5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uKGlzV2FsbENhbGxiYWNrLCBjYW5CZUR1Z0NhbGxiYWNrKXsgXG5cdHZhciBzeCA9IHRoaXMuX3N0YXJ0WDtcblx0dmFyIHN5ID0gdGhpcy5fc3RhcnRZO1xuXHR2YXIgZHggPSB0aGlzLl9lbmRYLXN4O1xuXHR2YXIgZHkgPSB0aGlzLl9lbmRZLXN5O1xuXHR2YXIgbGVuZ3RoID0gMSArIE1hdGgubWF4KE1hdGguYWJzKGR4KSwgTWF0aC5hYnMoZHkpKTtcblx0XG5cdGlmIChkeCkgeyBkeCA9IGR4L01hdGguYWJzKGR4KTsgfVxuXHRpZiAoZHkpIHsgZHkgPSBkeS9NYXRoLmFicyhkeSk7IH1cblx0dmFyIG54ID0gZHk7XG5cdHZhciBueSA9IC1keDtcblx0XG5cdHZhciBvayA9IHRydWU7XG5cdGZvciAodmFyIGk9MDsgaTxsZW5ndGg7IGkrKykge1xuXHRcdHZhciB4ID0gc3ggKyBpKmR4O1xuXHRcdHZhciB5ID0gc3kgKyBpKmR5O1xuXG5cdFx0aWYgKCFjYW5CZUR1Z0NhbGxiYWNrKCAgICAgeCwgICAgICB5KSkgeyBvayA9IGZhbHNlOyB9XG5cdFx0aWYgKCFpc1dhbGxDYWxsYmFjayAgKHggKyBueCwgeSArIG55KSkgeyBvayA9IGZhbHNlOyB9XG5cdFx0aWYgKCFpc1dhbGxDYWxsYmFjayAgKHggLSBueCwgeSAtIG55KSkgeyBvayA9IGZhbHNlOyB9XG5cdFx0XG5cdFx0aWYgKCFvaykge1xuXHRcdFx0bGVuZ3RoID0gaTtcblx0XHRcdHRoaXMuX2VuZFggPSB4LWR4O1xuXHRcdFx0dGhpcy5fZW5kWSA9IHktZHk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblx0XG5cdC8qKlxuXHQgKiBJZiB0aGUgbGVuZ3RoIGRlZ2VuZXJhdGVkLCB0aGlzIGNvcnJpZG9yIG1pZ2h0IGJlIGludmFsaWRcblx0ICovXG5cdCBcblx0Lyogbm90IHN1cHBvcnRlZCAqL1xuXHRpZiAobGVuZ3RoID09IDApIHsgcmV0dXJuIGZhbHNlOyB9IFxuXHRcblx0IC8qIGxlbmd0aCAxIGFsbG93ZWQgb25seSBpZiB0aGUgbmV4dCBzcGFjZSBpcyBlbXB0eSAqL1xuXHRpZiAobGVuZ3RoID09IDEgJiYgaXNXYWxsQ2FsbGJhY2sodGhpcy5fZW5kWCArIGR4LCB0aGlzLl9lbmRZICsgZHkpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcblx0LyoqXG5cdCAqIFdlIGRvIG5vdCB3YW50IHRoZSBjb3JyaWRvciB0byBjcmFzaCBpbnRvIGEgY29ybmVyIG9mIGEgcm9vbTtcblx0ICogaWYgYW55IG9mIHRoZSBlbmRpbmcgY29ybmVycyBpcyBlbXB0eSwgdGhlIE4rMXRoIGNlbGwgb2YgdGhpcyBjb3JyaWRvciBtdXN0IGJlIGVtcHR5IHRvby5cblx0ICogXG5cdCAqIFNpdHVhdGlvbjpcblx0ICogIyMjIyMjIzFcblx0ICogLi4uLi4uLj9cblx0ICogIyMjIyMjIzJcblx0ICogXG5cdCAqIFRoZSBjb3JyaWRvciB3YXMgZHVnIGZyb20gbGVmdCB0byByaWdodC5cblx0ICogMSwgMiAtIHByb2JsZW1hdGljIGNvcm5lcnMsID8gPSBOKzF0aCBjZWxsIChub3QgZHVnKVxuXHQgKi9cblx0dmFyIGZpcnN0Q29ybmVyQmFkID0gIWlzV2FsbENhbGxiYWNrKHRoaXMuX2VuZFggKyBkeCArIG54LCB0aGlzLl9lbmRZICsgZHkgKyBueSk7XG5cdHZhciBzZWNvbmRDb3JuZXJCYWQgPSAhaXNXYWxsQ2FsbGJhY2sodGhpcy5fZW5kWCArIGR4IC0gbngsIHRoaXMuX2VuZFkgKyBkeSAtIG55KTtcblx0dGhpcy5fZW5kc1dpdGhBV2FsbCA9IGlzV2FsbENhbGxiYWNrKHRoaXMuX2VuZFggKyBkeCwgdGhpcy5fZW5kWSArIGR5KTtcblx0aWYgKChmaXJzdENvcm5lckJhZCB8fCBzZWNvbmRDb3JuZXJCYWQpICYmIHRoaXMuX2VuZHNXaXRoQVdhbGwpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0cmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZGlnQ2FsbGJhY2sgRGlnIGNhbGxiYWNrIHdpdGggYSBzaWduYXR1cmUgKHgsIHksIHZhbHVlKS4gVmFsdWVzOiAwID0gZW1wdHkuXG4gKi9cblJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvci5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oZGlnQ2FsbGJhY2spIHsgXG5cdHZhciBzeCA9IHRoaXMuX3N0YXJ0WDtcblx0dmFyIHN5ID0gdGhpcy5fc3RhcnRZO1xuXHR2YXIgZHggPSB0aGlzLl9lbmRYLXN4O1xuXHR2YXIgZHkgPSB0aGlzLl9lbmRZLXN5O1xuXHR2YXIgbGVuZ3RoID0gMStNYXRoLm1heChNYXRoLmFicyhkeCksIE1hdGguYWJzKGR5KSk7XG5cdFxuXHRpZiAoZHgpIHsgZHggPSBkeC9NYXRoLmFicyhkeCk7IH1cblx0aWYgKGR5KSB7IGR5ID0gZHkvTWF0aC5hYnMoZHkpOyB9XG5cdHZhciBueCA9IGR5O1xuXHR2YXIgbnkgPSAtZHg7XG5cdFxuXHRmb3IgKHZhciBpPTA7IGk8bGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgeCA9IHN4ICsgaSpkeDtcblx0XHR2YXIgeSA9IHN5ICsgaSpkeTtcblx0XHRkaWdDYWxsYmFjayh4LCB5LCAwKTtcblx0fVxuXHRcblx0cmV0dXJuIHRydWU7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Db3JyaWRvci5wcm90b3R5cGUuY3JlYXRlUHJpb3JpdHlXYWxscyA9IGZ1bmN0aW9uKHByaW9yaXR5V2FsbENhbGxiYWNrKSB7XG5cdGlmICghdGhpcy5fZW5kc1dpdGhBV2FsbCkgeyByZXR1cm47IH1cblxuXHR2YXIgc3ggPSB0aGlzLl9zdGFydFg7XG5cdHZhciBzeSA9IHRoaXMuX3N0YXJ0WTtcblxuXHR2YXIgZHggPSB0aGlzLl9lbmRYLXN4O1xuXHR2YXIgZHkgPSB0aGlzLl9lbmRZLXN5O1xuXHRpZiAoZHgpIHsgZHggPSBkeC9NYXRoLmFicyhkeCk7IH1cblx0aWYgKGR5KSB7IGR5ID0gZHkvTWF0aC5hYnMoZHkpOyB9XG5cdHZhciBueCA9IGR5O1xuXHR2YXIgbnkgPSAtZHg7XG5cblx0cHJpb3JpdHlXYWxsQ2FsbGJhY2sodGhpcy5fZW5kWCArIGR4LCB0aGlzLl9lbmRZICsgZHkpO1xuXHRwcmlvcml0eVdhbGxDYWxsYmFjayh0aGlzLl9lbmRYICsgbngsIHRoaXMuX2VuZFkgKyBueSk7XG5cdHByaW9yaXR5V2FsbENhbGxiYWNrKHRoaXMuX2VuZFggLSBueCwgdGhpcy5fZW5kWSAtIG55KTtcbn1cbi8qKlxuICogQGNsYXNzIEJhc2Ugbm9pc2UgZ2VuZXJhdG9yXG4gKi9cblJPVC5Ob2lzZSA9IGZ1bmN0aW9uKCkge1xufTtcblxuUk9ULk5vaXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4LCB5KSB7fVxuLyoqXG4gKiBBIHNpbXBsZSAyZCBpbXBsZW1lbnRhdGlvbiBvZiBzaW1wbGV4IG5vaXNlIGJ5IE9uZHJlaiBaYXJhXG4gKlxuICogQmFzZWQgb24gYSBzcGVlZC1pbXByb3ZlZCBzaW1wbGV4IG5vaXNlIGFsZ29yaXRobSBmb3IgMkQsIDNEIGFuZCA0RCBpbiBKYXZhLlxuICogV2hpY2ggaXMgYmFzZWQgb24gZXhhbXBsZSBjb2RlIGJ5IFN0ZWZhbiBHdXN0YXZzb24gKHN0ZWd1QGl0bi5saXUuc2UpLlxuICogV2l0aCBPcHRpbWlzYXRpb25zIGJ5IFBldGVyIEVhc3RtYW4gKHBlYXN0bWFuQGRyaXp6bGUuc3RhbmZvcmQuZWR1KS5cbiAqIEJldHRlciByYW5rIG9yZGVyaW5nIG1ldGhvZCBieSBTdGVmYW4gR3VzdGF2c29uIGluIDIwMTIuXG4gKi9cblxuLyoqXG4gKiBAY2xhc3MgMkQgc2ltcGxleCBub2lzZSBnZW5lcmF0b3JcbiAqIEBwYXJhbSB7aW50fSBbZ3JhZGllbnRzPTI1Nl0gUmFuZG9tIGdyYWRpZW50c1xuICovXG5ST1QuTm9pc2UuU2ltcGxleCA9IGZ1bmN0aW9uKGdyYWRpZW50cykge1xuXHRST1QuTm9pc2UuY2FsbCh0aGlzKTtcblxuXHR0aGlzLl9GMiA9IDAuNSAqIChNYXRoLnNxcnQoMykgLSAxKTtcblx0dGhpcy5fRzIgPSAoMyAtIE1hdGguc3FydCgzKSkgLyA2O1xuXG5cdHRoaXMuX2dyYWRpZW50cyA9IFtcblx0XHRbIDAsIC0xXSxcblx0XHRbIDEsIC0xXSxcblx0XHRbIDEsICAwXSxcblx0XHRbIDEsICAxXSxcblx0XHRbIDAsICAxXSxcblx0XHRbLTEsICAxXSxcblx0XHRbLTEsICAwXSxcblx0XHRbLTEsIC0xXVxuXHRdO1xuXG5cdHZhciBwZXJtdXRhdGlvbnMgPSBbXTtcblx0dmFyIGNvdW50ID0gZ3JhZGllbnRzIHx8IDI1Njtcblx0Zm9yICh2YXIgaT0wO2k8Y291bnQ7aSsrKSB7IHBlcm11dGF0aW9ucy5wdXNoKGkpOyB9XG5cdHBlcm11dGF0aW9ucyA9IHBlcm11dGF0aW9ucy5yYW5kb21pemUoKTtcblxuXHR0aGlzLl9wZXJtcyA9IFtdO1xuXHR0aGlzLl9pbmRleGVzID0gW107XG5cblx0Zm9yICh2YXIgaT0wO2k8Mipjb3VudDtpKyspIHtcblx0XHR0aGlzLl9wZXJtcy5wdXNoKHBlcm11dGF0aW9uc1tpICUgY291bnRdKTtcblx0XHR0aGlzLl9pbmRleGVzLnB1c2godGhpcy5fcGVybXNbaV0gJSB0aGlzLl9ncmFkaWVudHMubGVuZ3RoKTtcblx0fVxuXG59O1xuUk9ULk5vaXNlLlNpbXBsZXguZXh0ZW5kKFJPVC5Ob2lzZSk7XG5cblJPVC5Ob2lzZS5TaW1wbGV4LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4aW4sIHlpbikge1xuXHR2YXIgcGVybXMgPSB0aGlzLl9wZXJtcztcblx0dmFyIGluZGV4ZXMgPSB0aGlzLl9pbmRleGVzO1xuXHR2YXIgY291bnQgPSBwZXJtcy5sZW5ndGgvMjtcblx0dmFyIEcyID0gdGhpcy5fRzI7XG5cblx0dmFyIG4wID0wLCBuMSA9IDAsIG4yID0gMCwgZ2k7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuXG5cdC8vIFNrZXcgdGhlIGlucHV0IHNwYWNlIHRvIGRldGVybWluZSB3aGljaCBzaW1wbGV4IGNlbGwgd2UncmUgaW5cblx0dmFyIHMgPSAoeGluICsgeWluKSAqIHRoaXMuX0YyOyAvLyBIYWlyeSBmYWN0b3IgZm9yIDJEXG5cdHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcblx0dmFyIGogPSBNYXRoLmZsb29yKHlpbiArIHMpO1xuXHR2YXIgdCA9IChpICsgaikgKiBHMjtcblx0dmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5KSBzcGFjZVxuXHR2YXIgWTAgPSBqIC0gdDtcblx0dmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG5cdHZhciB5MCA9IHlpbiAtIFkwO1xuXG5cdC8vIEZvciB0aGUgMkQgY2FzZSwgdGhlIHNpbXBsZXggc2hhcGUgaXMgYW4gZXF1aWxhdGVyYWwgdHJpYW5nbGUuXG5cdC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cblx0dmFyIGkxLCBqMTsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIChtaWRkbGUpIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGopIGNvb3Jkc1xuXHRpZiAoeDAgPiB5MCkge1xuXHRcdGkxID0gMTtcblx0XHRqMSA9IDA7XG5cdH0gZWxzZSB7IC8vIGxvd2VyIHRyaWFuZ2xlLCBYWSBvcmRlcjogKDAsMCktPigxLDApLT4oMSwxKVxuXHRcdGkxID0gMDtcblx0XHRqMSA9IDE7XG5cdH0gLy8gdXBwZXIgdHJpYW5nbGUsIFlYIG9yZGVyOiAoMCwwKS0+KDAsMSktPigxLDEpXG5cblx0Ly8gQSBzdGVwIG9mICgxLDApIGluIChpLGopIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jKSBpbiAoeCx5KSwgYW5kXG5cdC8vIGEgc3RlcCBvZiAoMCwxKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYykgaW4gKHgseSksIHdoZXJlXG5cdC8vIGMgPSAoMy1zcXJ0KDMpKS82XG5cdHZhciB4MSA9IHgwIC0gaTEgKyBHMjsgLy8gT2Zmc2V0cyBmb3IgbWlkZGxlIGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcblx0dmFyIHkxID0geTAgLSBqMSArIEcyO1xuXHR2YXIgeDIgPSB4MCAtIDEgKyAyKkcyOyAvLyBPZmZzZXRzIGZvciBsYXN0IGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcblx0dmFyIHkyID0geTAgLSAxICsgMipHMjtcblxuXHQvLyBXb3JrIG91dCB0aGUgaGFzaGVkIGdyYWRpZW50IGluZGljZXMgb2YgdGhlIHRocmVlIHNpbXBsZXggY29ybmVyc1xuXHR2YXIgaWkgPSBpLm1vZChjb3VudCk7XG5cdHZhciBqaiA9IGoubW9kKGNvdW50KTtcblxuXHQvLyBDYWxjdWxhdGUgdGhlIGNvbnRyaWJ1dGlvbiBmcm9tIHRoZSB0aHJlZSBjb3JuZXJzXG5cdHZhciB0MCA9IDAuNSAtIHgwKngwIC0geTAqeTA7XG5cdGlmICh0MCA+PSAwKSB7XG5cdFx0dDAgKj0gdDA7XG5cdFx0Z2kgPSBpbmRleGVzW2lpK3Blcm1zW2pqXV07XG5cdFx0dmFyIGdyYWQgPSB0aGlzLl9ncmFkaWVudHNbZ2ldO1xuXHRcdG4wID0gdDAgKiB0MCAqIChncmFkWzBdICogeDAgKyBncmFkWzFdICogeTApO1xuXHR9XG5cdFxuXHR2YXIgdDEgPSAwLjUgLSB4MSp4MSAtIHkxKnkxO1xuXHRpZiAodDEgPj0gMCkge1xuXHRcdHQxICo9IHQxO1xuXHRcdGdpID0gaW5kZXhlc1tpaStpMStwZXJtc1tqaitqMV1dO1xuXHRcdHZhciBncmFkID0gdGhpcy5fZ3JhZGllbnRzW2dpXTtcblx0XHRuMSA9IHQxICogdDEgKiAoZ3JhZFswXSAqIHgxICsgZ3JhZFsxXSAqIHkxKTtcblx0fVxuXHRcblx0dmFyIHQyID0gMC41IC0geDIqeDIgLSB5Mip5Mjtcblx0aWYgKHQyID49IDApIHtcblx0XHR0MiAqPSB0Mjtcblx0XHRnaSA9IGluZGV4ZXNbaWkrMStwZXJtc1tqaisxXV07XG5cdFx0dmFyIGdyYWQgPSB0aGlzLl9ncmFkaWVudHNbZ2ldO1xuXHRcdG4yID0gdDIgKiB0MiAqIChncmFkWzBdICogeDIgKyBncmFkWzFdICogeTIpO1xuXHR9XG5cblx0Ly8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuXHQvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byByZXR1cm4gdmFsdWVzIGluIHRoZSBpbnRlcnZhbCBbLTEsMV0uXG5cdHJldHVybiA3MCAqIChuMCArIG4xICsgbjIpO1xufVxuLyoqXG4gKiBAY2xhc3MgQWJzdHJhY3QgRk9WIGFsZ29yaXRobVxuICogQHBhcmFtIHtmdW5jdGlvbn0gbGlnaHRQYXNzZXNDYWxsYmFjayBEb2VzIHRoZSBsaWdodCBwYXNzIHRocm91Z2ggeCx5P1xuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLnRvcG9sb2d5PThdIDQvNi84XG4gKi9cblJPVC5GT1YgPSBmdW5jdGlvbihsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKSB7XG5cdHRoaXMuX2xpZ2h0UGFzc2VzID0gbGlnaHRQYXNzZXNDYWxsYmFjaztcblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHR0b3BvbG9neTogOFxuXHR9XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyB0aGlzLl9vcHRpb25zW3BdID0gb3B0aW9uc1twXTsgfVxufTtcblxuLyoqXG4gKiBDb21wdXRlIHZpc2liaWxpdHkgZm9yIGEgMzYwLWRlZ3JlZSBjaXJjbGVcbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtpbnR9IFIgTWF4aW11bSB2aXNpYmlsaXR5IHJhZGl1c1xuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuUk9ULkZPVi5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKHgsIHksIFIsIGNhbGxiYWNrKSB7fVxuXG4vKipcbiAqIFJldHVybiBhbGwgbmVpZ2hib3JzIGluIGEgY29uY2VudHJpYyByaW5nXG4gKiBAcGFyYW0ge2ludH0gY3ggY2VudGVyLXhcbiAqIEBwYXJhbSB7aW50fSBjeSBjZW50ZXIteVxuICogQHBhcmFtIHtpbnR9IHIgcmFuZ2VcbiAqL1xuUk9ULkZPVi5wcm90b3R5cGUuX2dldENpcmNsZSA9IGZ1bmN0aW9uKGN4LCBjeSwgcikge1xuXHR2YXIgcmVzdWx0ID0gW107XG5cdHZhciBkaXJzLCBjb3VudEZhY3Rvciwgc3RhcnRPZmZzZXQ7XG5cblx0c3dpdGNoICh0aGlzLl9vcHRpb25zLnRvcG9sb2d5KSB7XG5cdFx0Y2FzZSA0OlxuXHRcdFx0Y291bnRGYWN0b3IgPSAxO1xuXHRcdFx0c3RhcnRPZmZzZXQgPSBbMCwgMV07XG5cdFx0XHRkaXJzID0gW1xuXHRcdFx0XHRST1QuRElSU1s4XVs3XSxcblx0XHRcdFx0Uk9ULkRJUlNbOF1bMV0sXG5cdFx0XHRcdFJPVC5ESVJTWzhdWzNdLFxuXHRcdFx0XHRST1QuRElSU1s4XVs1XVxuXHRcdFx0XVxuXHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSA2OlxuXHRcdFx0ZGlycyA9IFJPVC5ESVJTWzZdO1xuXHRcdFx0Y291bnRGYWN0b3IgPSAxO1xuXHRcdFx0c3RhcnRPZmZzZXQgPSBbLTEsIDFdO1xuXHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSA4OlxuXHRcdFx0ZGlycyA9IFJPVC5ESVJTWzRdO1xuXHRcdFx0Y291bnRGYWN0b3IgPSAyO1xuXHRcdFx0c3RhcnRPZmZzZXQgPSBbLTEsIDFdO1xuXHRcdGJyZWFrO1xuXHR9XG5cblx0Lyogc3RhcnRpbmcgbmVpZ2hib3IgKi9cblx0dmFyIHggPSBjeCArIHN0YXJ0T2Zmc2V0WzBdKnI7XG5cdHZhciB5ID0gY3kgKyBzdGFydE9mZnNldFsxXSpyO1xuXG5cdC8qIGNpcmNsZSAqL1xuXHRmb3IgKHZhciBpPTA7aTxkaXJzLmxlbmd0aDtpKyspIHtcblx0XHRmb3IgKHZhciBqPTA7ajxyKmNvdW50RmFjdG9yO2orKykge1xuXHRcdFx0cmVzdWx0LnB1c2goW3gsIHldKTtcblx0XHRcdHggKz0gZGlyc1tpXVswXTtcblx0XHRcdHkgKz0gZGlyc1tpXVsxXTtcblxuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG4vKipcbiAqIEBjbGFzcyBEaXNjcmV0ZSBzaGFkb3djYXN0aW5nIGFsZ29yaXRobS4gT2Jzb2xldGVkIGJ5IFByZWNpc2Ugc2hhZG93Y2FzdGluZy5cbiAqIEBhdWdtZW50cyBST1QuRk9WXG4gKi9cblJPVC5GT1YuRGlzY3JldGVTaGFkb3djYXN0aW5nID0gZnVuY3Rpb24obGlnaHRQYXNzZXNDYWxsYmFjaywgb3B0aW9ucykge1xuXHRST1QuRk9WLmNhbGwodGhpcywgbGlnaHRQYXNzZXNDYWxsYmFjaywgb3B0aW9ucyk7XG59XG5ST1QuRk9WLkRpc2NyZXRlU2hhZG93Y2FzdGluZy5leHRlbmQoUk9ULkZPVik7XG5cbi8qKlxuICogQHNlZSBST1QuRk9WI2NvbXB1dGVcbiAqL1xuUk9ULkZPVi5EaXNjcmV0ZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbih4LCB5LCBSLCBjYWxsYmFjaykge1xuXHR2YXIgY2VudGVyID0gdGhpcy5fY29vcmRzO1xuXHR2YXIgbWFwID0gdGhpcy5fbWFwO1xuXG5cdC8qIHRoaXMgcGxhY2UgaXMgYWx3YXlzIHZpc2libGUgKi9cblx0Y2FsbGJhY2soeCwgeSwgMCwgMSk7XG5cblx0Lyogc3RhbmRpbmcgaW4gYSBkYXJrIHBsYWNlLiBGSVhNRSBpcyB0aGlzIGEgZ29vZCBpZGVhPyAgKi9cblx0aWYgKCF0aGlzLl9saWdodFBhc3Nlcyh4LCB5KSkgeyByZXR1cm47IH1cblx0XG5cdC8qIHN0YXJ0IGFuZCBlbmQgYW5nbGVzICovXG5cdHZhciBEQVRBID0gW107XG5cdFxuXHR2YXIgQSwgQiwgY3gsIGN5LCBibG9ja3M7XG5cblx0LyogYW5hbHl6ZSBzdXJyb3VuZGluZyBjZWxscyBpbiBjb25jZW50cmljIHJpbmdzLCBzdGFydGluZyBmcm9tIHRoZSBjZW50ZXIgKi9cblx0Zm9yICh2YXIgcj0xOyByPD1SOyByKyspIHtcblx0XHR2YXIgbmVpZ2hib3JzID0gdGhpcy5fZ2V0Q2lyY2xlKHgsIHksIHIpO1xuXHRcdHZhciBhbmdsZSA9IDM2MCAvIG5laWdoYm9ycy5sZW5ndGg7XG5cblx0XHRmb3IgKHZhciBpPTA7aTxuZWlnaGJvcnMubGVuZ3RoO2krKykge1xuXHRcdFx0Y3ggPSBuZWlnaGJvcnNbaV1bMF07XG5cdFx0XHRjeSA9IG5laWdoYm9yc1tpXVsxXTtcblx0XHRcdEEgPSBhbmdsZSAqIChpIC0gMC41KTtcblx0XHRcdEIgPSBBICsgYW5nbGU7XG5cdFx0XHRcblx0XHRcdGJsb2NrcyA9ICF0aGlzLl9saWdodFBhc3NlcyhjeCwgY3kpO1xuXHRcdFx0aWYgKHRoaXMuX3Zpc2libGVDb29yZHMoTWF0aC5mbG9vcihBKSwgTWF0aC5jZWlsKEIpLCBibG9ja3MsIERBVEEpKSB7IGNhbGxiYWNrKGN4LCBjeSwgciwgMSk7IH1cblx0XHRcdFxuXHRcdFx0aWYgKERBVEEubGVuZ3RoID09IDIgJiYgREFUQVswXSA9PSAwICYmIERBVEFbMV0gPT0gMzYwKSB7IHJldHVybjsgfSAvKiBjdXRvZmY/ICovXG5cblx0XHR9IC8qIGZvciBhbGwgY2VsbHMgaW4gdGhpcyByaW5nICovXG5cdH0gLyogZm9yIGFsbCByaW5ncyAqL1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW50fSBBIHN0YXJ0IGFuZ2xlXG4gKiBAcGFyYW0ge2ludH0gQiBlbmQgYW5nbGVcbiAqIEBwYXJhbSB7Ym9vbH0gYmxvY2tzIERvZXMgY3VycmVudCBjZWxsIGJsb2NrIHZpc2liaWxpdHk/XG4gKiBAcGFyYW0ge2ludFtdW119IERBVEEgc2hhZG93ZWQgYW5nbGUgcGFpcnNcbiAqL1xuUk9ULkZPVi5EaXNjcmV0ZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLl92aXNpYmxlQ29vcmRzID0gZnVuY3Rpb24oQSwgQiwgYmxvY2tzLCBEQVRBKSB7XG5cdGlmIChBIDwgMCkgeyBcblx0XHR2YXIgdjEgPSBhcmd1bWVudHMuY2FsbGVlKDAsIEIsIGJsb2NrcywgREFUQSk7XG5cdFx0dmFyIHYyID0gYXJndW1lbnRzLmNhbGxlZSgzNjArQSwgMzYwLCBibG9ja3MsIERBVEEpO1xuXHRcdHJldHVybiB2MSB8fCB2Mjtcblx0fVxuXHRcblx0dmFyIGluZGV4ID0gMDtcblx0d2hpbGUgKGluZGV4IDwgREFUQS5sZW5ndGggJiYgREFUQVtpbmRleF0gPCBBKSB7IGluZGV4Kys7IH1cblx0XG5cdGlmIChpbmRleCA9PSBEQVRBLmxlbmd0aCkgeyAvKiBjb21wbGV0ZWx5IG5ldyBzaGFkb3cgKi9cblx0XHRpZiAoYmxvY2tzKSB7IERBVEEucHVzaChBLCBCKTsgfSBcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXHRcblx0dmFyIGNvdW50ID0gMDtcblx0XG5cdGlmIChpbmRleCAlIDIpIHsgLyogdGhpcyBzaGFkb3cgc3RhcnRzIGluIGFuIGV4aXN0aW5nIHNoYWRvdywgb3Igd2l0aGluIGl0cyBlbmRpbmcgYm91bmRhcnkgKi9cblx0XHR3aGlsZSAoaW5kZXggPCBEQVRBLmxlbmd0aCAmJiBEQVRBW2luZGV4XSA8IEIpIHtcblx0XHRcdGluZGV4Kys7XG5cdFx0XHRjb3VudCsrO1xuXHRcdH1cblx0XHRcblx0XHRpZiAoY291bnQgPT0gMCkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcblx0XHRpZiAoYmxvY2tzKSB7IFxuXHRcdFx0aWYgKGNvdW50ICUgMikge1xuXHRcdFx0XHREQVRBLnNwbGljZShpbmRleC1jb3VudCwgY291bnQsIEIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0REFUQS5zcGxpY2UoaW5kZXgtY291bnQsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHRydWU7XG5cblx0fSBlbHNlIHsgLyogdGhpcyBzaGFkb3cgc3RhcnRzIG91dHNpZGUgYW4gZXhpc3Rpbmcgc2hhZG93LCBvciB3aXRoaW4gYSBzdGFydGluZyBib3VuZGFyeSAqL1xuXHRcdHdoaWxlIChpbmRleCA8IERBVEEubGVuZ3RoICYmIERBVEFbaW5kZXhdIDwgQikge1xuXHRcdFx0aW5kZXgrKztcblx0XHRcdGNvdW50Kys7XG5cdFx0fVxuXHRcdFxuXHRcdC8qIHZpc2libGUgd2hlbiBvdXRzaWRlIGFuIGV4aXN0aW5nIHNoYWRvdywgb3Igd2hlbiBvdmVybGFwcGluZyAqL1xuXHRcdGlmIChBID09IERBVEFbaW5kZXgtY291bnRdICYmIGNvdW50ID09IDEpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XG5cdFx0aWYgKGJsb2NrcykgeyBcblx0XHRcdGlmIChjb3VudCAlIDIpIHtcblx0XHRcdFx0REFUQS5zcGxpY2UoaW5kZXgtY291bnQsIGNvdW50LCBBKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdERBVEEuc3BsaWNlKGluZGV4LWNvdW50LCBjb3VudCwgQSwgQik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFx0XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn1cbi8qKlxuICogQGNsYXNzIFByZWNpc2Ugc2hhZG93Y2FzdGluZyBhbGdvcml0aG1cbiAqIEBhdWdtZW50cyBST1QuRk9WXG4gKi9cblJPVC5GT1YuUHJlY2lzZVNoYWRvd2Nhc3RpbmcgPSBmdW5jdGlvbihsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFJPVC5GT1YuY2FsbCh0aGlzLCBsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKTtcbn1cblJPVC5GT1YuUHJlY2lzZVNoYWRvd2Nhc3RpbmcuZXh0ZW5kKFJPVC5GT1YpO1xuXG4vKipcbiAqIEBzZWUgUk9ULkZPViNjb21wdXRlXG4gKi9cblJPVC5GT1YuUHJlY2lzZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbih4LCB5LCBSLCBjYWxsYmFjaykge1xuXHQvKiB0aGlzIHBsYWNlIGlzIGFsd2F5cyB2aXNpYmxlICovXG5cdGNhbGxiYWNrKHgsIHksIDAsIDEpO1xuXG5cdC8qIHN0YW5kaW5nIGluIGEgZGFyayBwbGFjZS4gRklYTUUgaXMgdGhpcyBhIGdvb2QgaWRlYT8gICovXG5cdGlmICghdGhpcy5fbGlnaHRQYXNzZXMoeCwgeSkpIHsgcmV0dXJuOyB9XG5cdFxuXHQvKiBsaXN0IG9mIGFsbCBzaGFkb3dzICovXG5cdHZhciBTSEFET1dTID0gW107XG5cdFxuXHR2YXIgY3gsIGN5LCBibG9ja3MsIEExLCBBMiwgdmlzaWJpbGl0eTtcblxuXHQvKiBhbmFseXplIHN1cnJvdW5kaW5nIGNlbGxzIGluIGNvbmNlbnRyaWMgcmluZ3MsIHN0YXJ0aW5nIGZyb20gdGhlIGNlbnRlciAqL1xuXHRmb3IgKHZhciByPTE7IHI8PVI7IHIrKykge1xuXHRcdHZhciBuZWlnaGJvcnMgPSB0aGlzLl9nZXRDaXJjbGUoeCwgeSwgcik7XG5cdFx0dmFyIG5laWdoYm9yQ291bnQgPSBuZWlnaGJvcnMubGVuZ3RoO1xuXG5cdFx0Zm9yICh2YXIgaT0wO2k8bmVpZ2hib3JDb3VudDtpKyspIHtcblx0XHRcdGN4ID0gbmVpZ2hib3JzW2ldWzBdO1xuXHRcdFx0Y3kgPSBuZWlnaGJvcnNbaV1bMV07XG5cdFx0XHQvKiBzaGlmdCBoYWxmLWFuLWFuZ2xlIGJhY2t3YXJkcyB0byBtYWludGFpbiBjb25zaXN0ZW5jeSBvZiAwLXRoIGNlbGxzICovXG5cdFx0XHRBMSA9IFtpID8gMippLTEgOiAyKm5laWdoYm9yQ291bnQtMSwgMipuZWlnaGJvckNvdW50XTtcblx0XHRcdEEyID0gWzIqaSsxLCAyKm5laWdoYm9yQ291bnRdOyBcblx0XHRcdFxuXHRcdFx0YmxvY2tzID0gIXRoaXMuX2xpZ2h0UGFzc2VzKGN4LCBjeSk7XG5cdFx0XHR2aXNpYmlsaXR5ID0gdGhpcy5fY2hlY2tWaXNpYmlsaXR5KEExLCBBMiwgYmxvY2tzLCBTSEFET1dTKTtcblx0XHRcdGlmICh2aXNpYmlsaXR5KSB7IGNhbGxiYWNrKGN4LCBjeSwgciwgdmlzaWJpbGl0eSk7IH1cblxuXHRcdFx0aWYgKFNIQURPV1MubGVuZ3RoID09IDIgJiYgU0hBRE9XU1swXVswXSA9PSAwICYmIFNIQURPV1NbMV1bMF0gPT0gU0hBRE9XU1sxXVsxXSkgeyByZXR1cm47IH0gLyogY3V0b2ZmPyAqL1xuXG5cdFx0fSAvKiBmb3IgYWxsIGNlbGxzIGluIHRoaXMgcmluZyAqL1xuXHR9IC8qIGZvciBhbGwgcmluZ3MgKi9cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ludFsyXX0gQTEgYXJjIHN0YXJ0XG4gKiBAcGFyYW0ge2ludFsyXX0gQTIgYXJjIGVuZFxuICogQHBhcmFtIHtib29sfSBibG9ja3MgRG9lcyBjdXJyZW50IGFyYyBibG9jayB2aXNpYmlsaXR5P1xuICogQHBhcmFtIHtpbnRbXVtdfSBTSEFET1dTIGxpc3Qgb2YgYWN0aXZlIHNoYWRvd3NcbiAqL1xuUk9ULkZPVi5QcmVjaXNlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuX2NoZWNrVmlzaWJpbGl0eSA9IGZ1bmN0aW9uKEExLCBBMiwgYmxvY2tzLCBTSEFET1dTKSB7XG5cdGlmIChBMVswXSA+IEEyWzBdKSB7IC8qIHNwbGl0IGludG8gdHdvIHN1Yi1hcmNzICovXG5cdFx0dmFyIHYxID0gdGhpcy5fY2hlY2tWaXNpYmlsaXR5KEExLCBbQTFbMV0sIEExWzFdXSwgYmxvY2tzLCBTSEFET1dTKTtcblx0XHR2YXIgdjIgPSB0aGlzLl9jaGVja1Zpc2liaWxpdHkoWzAsIDFdLCBBMiwgYmxvY2tzLCBTSEFET1dTKTtcblx0XHRyZXR1cm4gKHYxK3YyKS8yO1xuXHR9XG5cblx0LyogaW5kZXgxOiBmaXJzdCBzaGFkb3cgPj0gQTEgKi9cblx0dmFyIGluZGV4MSA9IDAsIGVkZ2UxID0gZmFsc2U7XG5cdHdoaWxlIChpbmRleDEgPCBTSEFET1dTLmxlbmd0aCkge1xuXHRcdHZhciBvbGQgPSBTSEFET1dTW2luZGV4MV07XG5cdFx0dmFyIGRpZmYgPSBvbGRbMF0qQTFbMV0gLSBBMVswXSpvbGRbMV07XG5cdFx0aWYgKGRpZmYgPj0gMCkgeyAvKiBvbGQgPj0gQTEgKi9cblx0XHRcdGlmIChkaWZmID09IDAgJiYgIShpbmRleDEgJSAyKSkgeyBlZGdlMSA9IHRydWU7IH1cblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRpbmRleDErKztcblx0fVxuXG5cdC8qIGluZGV4MjogbGFzdCBzaGFkb3cgPD0gQTIgKi9cblx0dmFyIGluZGV4MiA9IFNIQURPV1MubGVuZ3RoLCBlZGdlMiA9IGZhbHNlO1xuXHR3aGlsZSAoaW5kZXgyLS0pIHtcblx0XHR2YXIgb2xkID0gU0hBRE9XU1tpbmRleDJdO1xuXHRcdHZhciBkaWZmID0gQTJbMF0qb2xkWzFdIC0gb2xkWzBdKkEyWzFdO1xuXHRcdGlmIChkaWZmID49IDApIHsgLyogb2xkIDw9IEEyICovXG5cdFx0XHRpZiAoZGlmZiA9PSAwICYmIChpbmRleDIgJSAyKSkgeyBlZGdlMiA9IHRydWU7IH1cblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdHZhciB2aXNpYmxlID0gdHJ1ZTtcblx0aWYgKGluZGV4MSA9PSBpbmRleDIgJiYgKGVkZ2UxIHx8IGVkZ2UyKSkgeyAgLyogc3Vic2V0IG9mIGV4aXN0aW5nIHNoYWRvdywgb25lIG9mIHRoZSBlZGdlcyBtYXRjaCAqL1xuXHRcdHZpc2libGUgPSBmYWxzZTsgXG5cdH0gZWxzZSBpZiAoZWRnZTEgJiYgZWRnZTIgJiYgaW5kZXgxKzE9PWluZGV4MiAmJiAoaW5kZXgyICUgMikpIHsgLyogY29tcGxldGVseSBlcXVpdmFsZW50IHdpdGggZXhpc3Rpbmcgc2hhZG93ICovXG5cdFx0dmlzaWJsZSA9IGZhbHNlO1xuXHR9IGVsc2UgaWYgKGluZGV4MSA+IGluZGV4MiAmJiAoaW5kZXgxICUgMikpIHsgLyogc3Vic2V0IG9mIGV4aXN0aW5nIHNoYWRvdywgbm90IHRvdWNoaW5nICovXG5cdFx0dmlzaWJsZSA9IGZhbHNlO1xuXHR9XG5cdFxuXHRpZiAoIXZpc2libGUpIHsgcmV0dXJuIDA7IH0gLyogZmFzdCBjYXNlOiBub3QgdmlzaWJsZSAqL1xuXHRcblx0dmFyIHZpc2libGVMZW5ndGgsIFA7XG5cblx0LyogY29tcHV0ZSB0aGUgbGVuZ3RoIG9mIHZpc2libGUgYXJjLCBhZGp1c3QgbGlzdCBvZiBzaGFkb3dzIChpZiBibG9ja2luZykgKi9cblx0dmFyIHJlbW92ZSA9IGluZGV4Mi1pbmRleDErMTtcblx0aWYgKHJlbW92ZSAlIDIpIHtcblx0XHRpZiAoaW5kZXgxICUgMikgeyAvKiBmaXJzdCBlZGdlIHdpdGhpbiBleGlzdGluZyBzaGFkb3csIHNlY29uZCBvdXRzaWRlICovXG5cdFx0XHR2YXIgUCA9IFNIQURPV1NbaW5kZXgxXTtcblx0XHRcdHZpc2libGVMZW5ndGggPSAoQTJbMF0qUFsxXSAtIFBbMF0qQTJbMV0pIC8gKFBbMV0gKiBBMlsxXSk7XG5cdFx0XHRpZiAoYmxvY2tzKSB7IFNIQURPV1Muc3BsaWNlKGluZGV4MSwgcmVtb3ZlLCBBMik7IH1cblx0XHR9IGVsc2UgeyAvKiBzZWNvbmQgZWRnZSB3aXRoaW4gZXhpc3Rpbmcgc2hhZG93LCBmaXJzdCBvdXRzaWRlICovXG5cdFx0XHR2YXIgUCA9IFNIQURPV1NbaW5kZXgyXTtcblx0XHRcdHZpc2libGVMZW5ndGggPSAoUFswXSpBMVsxXSAtIEExWzBdKlBbMV0pIC8gKEExWzFdICogUFsxXSk7XG5cdFx0XHRpZiAoYmxvY2tzKSB7IFNIQURPV1Muc3BsaWNlKGluZGV4MSwgcmVtb3ZlLCBBMSk7IH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0aWYgKGluZGV4MSAlIDIpIHsgLyogYm90aCBlZGdlcyB3aXRoaW4gZXhpc3Rpbmcgc2hhZG93cyAqL1xuXHRcdFx0dmFyIFAxID0gU0hBRE9XU1tpbmRleDFdO1xuXHRcdFx0dmFyIFAyID0gU0hBRE9XU1tpbmRleDJdO1xuXHRcdFx0dmlzaWJsZUxlbmd0aCA9IChQMlswXSpQMVsxXSAtIFAxWzBdKlAyWzFdKSAvIChQMVsxXSAqIFAyWzFdKTtcblx0XHRcdGlmIChibG9ja3MpIHsgU0hBRE9XUy5zcGxpY2UoaW5kZXgxLCByZW1vdmUpOyB9XG5cdFx0fSBlbHNlIHsgLyogYm90aCBlZGdlcyBvdXRzaWRlIGV4aXN0aW5nIHNoYWRvd3MgKi9cblx0XHRcdGlmIChibG9ja3MpIHsgU0hBRE9XUy5zcGxpY2UoaW5kZXgxLCByZW1vdmUsIEExLCBBMik7IH1cblx0XHRcdHJldHVybiAxOyAvKiB3aG9sZSBhcmMgdmlzaWJsZSEgKi9cblx0XHR9XG5cdH1cblxuXHR2YXIgYXJjTGVuZ3RoID0gKEEyWzBdKkExWzFdIC0gQTFbMF0qQTJbMV0pIC8gKEExWzFdICogQTJbMV0pO1xuXG5cdHJldHVybiB2aXNpYmxlTGVuZ3RoL2FyY0xlbmd0aDtcbn1cbi8qKlxuICogQGNsYXNzIFJlY3Vyc2l2ZSBzaGFkb3djYXN0aW5nIGFsZ29yaXRobVxuICogQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgNC84IHRvcG9sb2dpZXMsIG5vdCBoZXhhZ29uYWwuXG4gKiBCYXNlZCBvbiBQZXRlciBIYXJraW5zJyBpbXBsZW1lbnRhdGlvbiBvZiBCasO2cm4gQmVyZ3N0csO2bSdzIGFsZ29yaXRobSBkZXNjcmliZWQgaGVyZTogaHR0cDovL3d3dy5yb2d1ZWJhc2luLmNvbS9pbmRleC5waHA/dGl0bGU9Rk9WX3VzaW5nX3JlY3Vyc2l2ZV9zaGFkb3djYXN0aW5nXG4gKiBAYXVnbWVudHMgUk9ULkZPVlxuICovXG5ST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcgPSBmdW5jdGlvbihsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFJPVC5GT1YuY2FsbCh0aGlzLCBsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKTtcbn1cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5leHRlbmQoUk9ULkZPVik7XG5cbi8qKiBPY3RhbnRzIHVzZWQgZm9yIHRyYW5zbGF0aW5nIHJlY3Vyc2l2ZSBzaGFkb3djYXN0aW5nIG9mZnNldHMgKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5PQ1RBTlRTID0gW1xuXHRbLTEsICAwLCAgMCwgIDFdLFxuXHRbIDAsIC0xLCAgMSwgIDBdLFxuXHRbIDAsIC0xLCAtMSwgIDBdLFxuXHRbLTEsICAwLCAgMCwgLTFdLFxuXHRbIDEsICAwLCAgMCwgLTFdLFxuXHRbIDAsICAxLCAtMSwgIDBdLFxuXHRbIDAsICAxLCAgMSwgIDBdLFxuXHRbIDEsICAwLCAgMCwgIDFdXG5dO1xuXG4vKipcbiAqIENvbXB1dGUgdmlzaWJpbGl0eSBmb3IgYSAzNjAtZGVncmVlIGNpcmNsZVxuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcGFyYW0ge2ludH0gUiBNYXhpbXVtIHZpc2liaWxpdHkgcmFkaXVzXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5ST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbih4LCB5LCBSLCBjYWxsYmFjaykge1xuXHQvL1lvdSBjYW4gYWx3YXlzIHNlZSB5b3VyIG93biB0aWxlXG5cdGNhbGxiYWNrKHgsIHksIDAsIDEpO1xuXHRmb3IodmFyIGkgPSAwOyBpIDwgUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLk9DVEFOVFMubGVuZ3RoOyBpKyspIHtcblx0XHR0aGlzLl9yZW5kZXJPY3RhbnQoeCwgeSwgUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLk9DVEFOVFNbaV0sIFIsIGNhbGxiYWNrKTtcblx0fVxufVxuXG4vKipcbiAqIENvbXB1dGUgdmlzaWJpbGl0eSBmb3IgYSAxODAtZGVncmVlIGFyY1xuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcGFyYW0ge2ludH0gUiBNYXhpbXVtIHZpc2liaWxpdHkgcmFkaXVzXG4gKiBAcGFyYW0ge2ludH0gZGlyIERpcmVjdGlvbiB0byBsb29rIGluIChleHByZXNzZWQgaW4gYSBST1QuRElSUyB2YWx1ZSk7XG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5ST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLmNvbXB1dGUxODAgPSBmdW5jdGlvbih4LCB5LCBSLCBkaXIsIGNhbGxiYWNrKSB7XG5cdC8vWW91IGNhbiBhbHdheXMgc2VlIHlvdXIgb3duIHRpbGVcblx0Y2FsbGJhY2soeCwgeSwgMCwgMSk7XG5cdHZhciBwcmV2aW91c09jdGFudCA9IChkaXIgLSAxICsgOCkgJSA4OyAvL05lZWQgdG8gcmV0cmlldmUgdGhlIHByZXZpb3VzIG9jdGFudCB0byByZW5kZXIgYSBmdWxsIDE4MCBkZWdyZWVzXG5cdHZhciBuZXh0UHJldmlvdXNPY3RhbnQgPSAoZGlyIC0gMiArIDgpICUgODsgLy9OZWVkIHRvIHJldHJpZXZlIHRoZSBwcmV2aW91cyB0d28gb2N0YW50cyB0byByZW5kZXIgYSBmdWxsIDE4MCBkZWdyZWVzXG5cdHZhciBuZXh0T2N0YW50ID0gKGRpcisgMSArIDgpICUgODsgLy9OZWVkIHRvIGdyYWIgdG8gbmV4dCBvY3RhbnQgdG8gcmVuZGVyIGEgZnVsbCAxODAgZGVncmVlc1xuXHR0aGlzLl9yZW5kZXJPY3RhbnQoeCwgeSwgUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLk9DVEFOVFNbbmV4dFByZXZpb3VzT2N0YW50XSwgUiwgY2FsbGJhY2spO1xuXHR0aGlzLl9yZW5kZXJPY3RhbnQoeCwgeSwgUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLk9DVEFOVFNbcHJldmlvdXNPY3RhbnRdLCBSLCBjYWxsYmFjayk7XG5cdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1tkaXJdLCBSLCBjYWxsYmFjayk7XG5cdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1tuZXh0T2N0YW50XSwgUiwgY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdmlzaWJpbGl0eSBmb3IgYSA5MC1kZWdyZWUgYXJjXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7aW50fSBSIE1heGltdW0gdmlzaWJpbGl0eSByYWRpdXNcbiAqIEBwYXJhbSB7aW50fSBkaXIgRGlyZWN0aW9uIHRvIGxvb2sgaW4gKGV4cHJlc3NlZCBpbiBhIFJPVC5ESVJTIHZhbHVlKTtcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuY29tcHV0ZTkwID0gZnVuY3Rpb24oeCwgeSwgUiwgZGlyLCBjYWxsYmFjaykge1xuXHQvL1lvdSBjYW4gYWx3YXlzIHNlZSB5b3VyIG93biB0aWxlXG5cdGNhbGxiYWNrKHgsIHksIDAsIDEpO1xuXHR2YXIgcHJldmlvdXNPY3RhbnQgPSAoZGlyIC0gMSArIDgpICUgODsgLy9OZWVkIHRvIHJldHJpZXZlIHRoZSBwcmV2aW91cyBvY3RhbnQgdG8gcmVuZGVyIGEgZnVsbCA5MCBkZWdyZWVzXG5cdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1tkaXJdLCBSLCBjYWxsYmFjayk7XG5cdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1twcmV2aW91c09jdGFudF0sIFIsIGNhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgb25lIG9jdGFudCAoNDUtZGVncmVlIGFyYykgb2YgdGhlIHZpZXdzaGVkXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7aW50fSBvY3RhbnQgT2N0YW50IHRvIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0ge2ludH0gUiBNYXhpbXVtIHZpc2liaWxpdHkgcmFkaXVzXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5ST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLl9yZW5kZXJPY3RhbnQgPSBmdW5jdGlvbih4LCB5LCBvY3RhbnQsIFIsIGNhbGxiYWNrKSB7XG5cdC8vUmFkaXVzIGluY3JlbWVudGVkIGJ5IDEgdG8gcHJvdmlkZSBzYW1lIGNvdmVyYWdlIGFyZWEgYXMgb3RoZXIgc2hhZG93Y2FzdGluZyByYWRpdXNlc1xuXHR0aGlzLl9jYXN0VmlzaWJpbGl0eSh4LCB5LCAxLCAxLjAsIDAuMCwgUiArIDEsIG9jdGFudFswXSwgb2N0YW50WzFdLCBvY3RhbnRbMl0sIG9jdGFudFszXSwgY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIEFjdHVhbGx5IGNhbGN1bGF0ZXMgdGhlIHZpc2liaWxpdHlcbiAqIEBwYXJhbSB7aW50fSBzdGFydFggVGhlIHN0YXJ0aW5nIFggY29vcmRpbmF0ZVxuICogQHBhcmFtIHtpbnR9IHN0YXJ0WSBUaGUgc3RhcnRpbmcgWSBjb29yZGluYXRlXG4gKiBAcGFyYW0ge2ludH0gcm93IFRoZSByb3cgdG8gcmVuZGVyXG4gKiBAcGFyYW0ge2Zsb2F0fSB2aXNTbG9wZVN0YXJ0IFRoZSBzbG9wZSB0byBzdGFydCBhdFxuICogQHBhcmFtIHtmbG9hdH0gdmlzU2xvcGVFbmQgVGhlIHNsb3BlIHRvIGVuZCBhdFxuICogQHBhcmFtIHtpbnR9IHJhZGl1cyBUaGUgcmFkaXVzIHRvIHJlYWNoIG91dCB0b1xuICogQHBhcmFtIHtpbnR9IHh4IFxuICogQHBhcmFtIHtpbnR9IHh5IFxuICogQHBhcmFtIHtpbnR9IHl4IFxuICogQHBhcmFtIHtpbnR9IHl5IFxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGNhbGxiYWNrIHRvIHVzZSB3aGVuIHdlIGhpdCBhIGJsb2NrIHRoYXQgaXMgdmlzaWJsZVxuICovXG5ST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcucHJvdG90eXBlLl9jYXN0VmlzaWJpbGl0eSA9IGZ1bmN0aW9uKHN0YXJ0WCwgc3RhcnRZLCByb3csIHZpc1Nsb3BlU3RhcnQsIHZpc1Nsb3BlRW5kLCByYWRpdXMsIHh4LCB4eSwgeXgsIHl5LCBjYWxsYmFjaykge1xuXHRpZih2aXNTbG9wZVN0YXJ0IDwgdmlzU2xvcGVFbmQpIHsgcmV0dXJuOyB9XG5cdGZvcih2YXIgaSA9IHJvdzsgaSA8PSByYWRpdXM7IGkrKykge1xuXHRcdHZhciBkeCA9IC1pIC0gMTtcblx0XHR2YXIgZHkgPSAtaTtcblx0XHR2YXIgYmxvY2tlZCA9IGZhbHNlO1xuXHRcdHZhciBuZXdTdGFydCA9IDA7XG5cblx0XHQvLydSb3cnIGNvdWxkIGJlIGNvbHVtbiwgbmFtZXMgaGVyZSBhc3N1bWUgb2N0YW50IDAgYW5kIHdvdWxkIGJlIGZsaXBwZWQgZm9yIGhhbGYgdGhlIG9jdGFudHNcblx0XHR3aGlsZShkeCA8PSAwKSB7XG5cdFx0XHRkeCArPSAxO1xuXG5cdFx0XHQvL1RyYW5zbGF0ZSBmcm9tIHJlbGF0aXZlIGNvb3JkaW5hdGVzIHRvIG1hcCBjb29yZGluYXRlc1xuXHRcdFx0dmFyIG1hcFggPSBzdGFydFggKyBkeCAqIHh4ICsgZHkgKiB4eTtcblx0XHRcdHZhciBtYXBZID0gc3RhcnRZICsgZHggKiB5eCArIGR5ICogeXk7XG5cblx0XHRcdC8vUmFuZ2Ugb2YgdGhlIHJvd1xuXHRcdFx0dmFyIHNsb3BlU3RhcnQgPSAoZHggLSAwLjUpIC8gKGR5ICsgMC41KTtcblx0XHRcdHZhciBzbG9wZUVuZCA9IChkeCArIDAuNSkgLyAoZHkgLSAwLjUpO1xuXHRcdFxuXHRcdFx0Ly9JZ25vcmUgaWYgbm90IHlldCBhdCBsZWZ0IGVkZ2Ugb2YgT2N0YW50XG5cdFx0XHRpZihzbG9wZUVuZCA+IHZpc1Nsb3BlU3RhcnQpIHsgY29udGludWU7IH1cblx0XHRcdFxuXHRcdFx0Ly9Eb25lIGlmIHBhc3QgcmlnaHQgZWRnZVxuXHRcdFx0aWYoc2xvcGVTdGFydCA8IHZpc1Nsb3BlRW5kKSB7IGJyZWFrOyB9XG5cdFx0XHRcdFxuXHRcdFx0Ly9JZiBpdCdzIGluIHJhbmdlLCBpdCdzIHZpc2libGVcblx0XHRcdGlmKChkeCAqIGR4ICsgZHkgKiBkeSkgPCAocmFkaXVzICogcmFkaXVzKSkge1xuXHRcdFx0XHRjYWxsYmFjayhtYXBYLCBtYXBZLCBpLCAxKTtcblx0XHRcdH1cblx0XG5cdFx0XHRpZighYmxvY2tlZCkge1xuXHRcdFx0XHQvL0lmIHRpbGUgaXMgYSBibG9ja2luZyB0aWxlLCBjYXN0IGFyb3VuZCBpdFxuXHRcdFx0XHRpZighdGhpcy5fbGlnaHRQYXNzZXMobWFwWCwgbWFwWSkgJiYgaSA8IHJhZGl1cykge1xuXHRcdFx0XHRcdGJsb2NrZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHRoaXMuX2Nhc3RWaXNpYmlsaXR5KHN0YXJ0WCwgc3RhcnRZLCBpICsgMSwgdmlzU2xvcGVTdGFydCwgc2xvcGVTdGFydCwgcmFkaXVzLCB4eCwgeHksIHl4LCB5eSwgY2FsbGJhY2spO1xuXHRcdFx0XHRcdG5ld1N0YXJ0ID0gc2xvcGVFbmQ7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vS2VlcCBuYXJyb3dpbmcgaWYgc2Nhbm5pbmcgYWNyb3NzIGEgYmxvY2tcblx0XHRcdFx0aWYoIXRoaXMuX2xpZ2h0UGFzc2VzKG1hcFgsIG1hcFkpKSB7XG5cdFx0XHRcdFx0bmV3U3RhcnQgPSBzbG9wZUVuZDtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcdC8vQmxvY2sgaGFzIGVuZGVkXG5cdFx0XHRcdGJsb2NrZWQgPSBmYWxzZTtcblx0XHRcdFx0dmlzU2xvcGVTdGFydCA9IG5ld1N0YXJ0O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZihibG9ja2VkKSB7IGJyZWFrOyB9XG5cdH1cbn1cbi8qKlxuICogQG5hbWVzcGFjZSBDb2xvciBvcGVyYXRpb25zXG4gKi9cblJPVC5Db2xvciA9IHtcblx0ZnJvbVN0cmluZzogZnVuY3Rpb24oc3RyKSB7XG5cdFx0dmFyIGNhY2hlZCwgcjtcblx0XHRpZiAoc3RyIGluIHRoaXMuX2NhY2hlKSB7XG5cdFx0XHRjYWNoZWQgPSB0aGlzLl9jYWNoZVtzdHJdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoc3RyLmNoYXJBdCgwKSA9PSBcIiNcIikgeyAvKiBoZXggcmdiICovXG5cblx0XHRcdFx0dmFyIHZhbHVlcyA9IHN0ci5tYXRjaCgvWzAtOWEtZl0vZ2kpLm1hcChmdW5jdGlvbih4KSB7IHJldHVybiBwYXJzZUludCh4LCAxNik7IH0pO1xuXHRcdFx0XHRpZiAodmFsdWVzLmxlbmd0aCA9PSAzKSB7XG5cdFx0XHRcdFx0Y2FjaGVkID0gdmFsdWVzLm1hcChmdW5jdGlvbih4KSB7IHJldHVybiB4KjE3OyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0XHRcdFx0dmFsdWVzW2krMV0gKz0gMTYqdmFsdWVzW2ldO1xuXHRcdFx0XHRcdFx0dmFsdWVzLnNwbGljZShpLCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y2FjaGVkID0gdmFsdWVzO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZiAoKHIgPSBzdHIubWF0Y2goL3JnYlxcKChbMC05LCBdKylcXCkvaSkpKSB7IC8qIGRlY2ltYWwgcmdiICovXG5cdFx0XHRcdGNhY2hlZCA9IHJbMV0uc3BsaXQoL1xccyosXFxzKi8pLm1hcChmdW5jdGlvbih4KSB7IHJldHVybiBwYXJzZUludCh4KTsgfSk7XG5cdFx0XHR9IGVsc2UgeyAvKiBodG1sIG5hbWUgKi9cblx0XHRcdFx0Y2FjaGVkID0gWzAsIDAsIDBdO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9jYWNoZVtzdHJdID0gY2FjaGVkO1xuXHRcdH1cblxuXHRcdHJldHVybiBjYWNoZWQuc2xpY2UoKTtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIHR3byBvciBtb3JlIGNvbG9yc1xuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjFcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cblx0ICovXG5cdGFkZDogZnVuY3Rpb24oY29sb3IxLCBjb2xvcjIpIHtcblx0XHR2YXIgcmVzdWx0ID0gY29sb3IxLnNsaWNlKCk7XG5cdFx0Zm9yICh2YXIgaT0wO2k8MztpKyspIHtcblx0XHRcdGZvciAodmFyIGo9MTtqPGFyZ3VtZW50cy5sZW5ndGg7aisrKSB7XG5cdFx0XHRcdHJlc3VsdFtpXSArPSBhcmd1bWVudHNbal1baV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEFkZCB0d28gb3IgbW9yZSBjb2xvcnMsIE1PRElGSUVTIEZJUlNUIEFSR1VNRU5UXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMVxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjJcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0YWRkXzogZnVuY3Rpb24oY29sb3IxLCBjb2xvcjIpIHtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0Zm9yICh2YXIgaj0xO2o8YXJndW1lbnRzLmxlbmd0aDtqKyspIHtcblx0XHRcdFx0Y29sb3IxW2ldICs9IGFyZ3VtZW50c1tqXVtpXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNvbG9yMTtcblx0fSxcblxuXHQvKipcblx0ICogTXVsdGlwbHkgKG1peCkgdHdvIG9yIG1vcmUgY29sb3JzXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMVxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjJcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0bXVsdGlwbHk6IGZ1bmN0aW9uKGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0dmFyIHJlc3VsdCA9IGNvbG9yMS5zbGljZSgpO1xuXHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7XG5cdFx0XHRmb3IgKHZhciBqPTE7ajxhcmd1bWVudHMubGVuZ3RoO2orKykge1xuXHRcdFx0XHRyZXN1bHRbaV0gKj0gYXJndW1lbnRzW2pdW2ldIC8gMjU1O1xuXHRcdFx0fVxuXHRcdFx0cmVzdWx0W2ldID0gTWF0aC5yb3VuZChyZXN1bHRbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNdWx0aXBseSAobWl4KSB0d28gb3IgbW9yZSBjb2xvcnMsIE1PRElGSUVTIEZJUlNUIEFSR1VNRU5UXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMVxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjJcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0bXVsdGlwbHlfOiBmdW5jdGlvbihjb2xvcjEsIGNvbG9yMikge1xuXHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7XG5cdFx0XHRmb3IgKHZhciBqPTE7ajxhcmd1bWVudHMubGVuZ3RoO2orKykge1xuXHRcdFx0XHRjb2xvcjFbaV0gKj0gYXJndW1lbnRzW2pdW2ldIC8gMjU1O1xuXHRcdFx0fVxuXHRcdFx0Y29sb3IxW2ldID0gTWF0aC5yb3VuZChjb2xvcjFbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gY29sb3IxO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBJbnRlcnBvbGF0ZSAoYmxlbmQpIHR3byBjb2xvcnMgd2l0aCBhIGdpdmVuIGZhY3RvclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjFcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IyXG5cdCAqIEBwYXJhbSB7ZmxvYXR9IFtmYWN0b3I9MC41XSAwLi4xXG5cdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cblx0ICovXG5cdGludGVycG9sYXRlOiBmdW5jdGlvbihjb2xvcjEsIGNvbG9yMiwgZmFjdG9yKSB7XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7IGZhY3RvciA9IDAuNTsgfVxuXHRcdHZhciByZXN1bHQgPSBjb2xvcjEuc2xpY2UoKTtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0cmVzdWx0W2ldID0gTWF0aC5yb3VuZChyZXN1bHRbaV0gKyBmYWN0b3IqKGNvbG9yMltpXS1jb2xvcjFbaV0pKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHQvKipcblx0ICogSW50ZXJwb2xhdGUgKGJsZW5kKSB0d28gY29sb3JzIHdpdGggYSBnaXZlbiBmYWN0b3IgaW4gSFNMIG1vZGVcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IxXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMlxuXHQgKiBAcGFyYW0ge2Zsb2F0fSBbZmFjdG9yPTAuNV0gMC4uMVxuXHQgKiBAcmV0dXJucyB7bnVtYmVyW119XG5cdCAqL1xuXHRpbnRlcnBvbGF0ZUhTTDogZnVuY3Rpb24oY29sb3IxLCBjb2xvcjIsIGZhY3Rvcikge1xuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykgeyBmYWN0b3IgPSAwLjU7IH1cblx0XHR2YXIgaHNsMSA9IHRoaXMucmdiMmhzbChjb2xvcjEpO1xuXHRcdHZhciBoc2wyID0gdGhpcy5yZ2IyaHNsKGNvbG9yMik7XG5cdFx0Zm9yICh2YXIgaT0wO2k8MztpKyspIHtcblx0XHRcdGhzbDFbaV0gKz0gZmFjdG9yKihoc2wyW2ldLWhzbDFbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5oc2wycmdiKGhzbDEpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDcmVhdGUgYSBuZXcgcmFuZG9tIGNvbG9yIGJhc2VkIG9uIHRoaXMgb25lXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGRpZmYgU2V0IG9mIHN0YW5kYXJkIGRldmlhdGlvbnNcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0cmFuZG9taXplOiBmdW5jdGlvbihjb2xvciwgZGlmZikge1xuXHRcdGlmICghKGRpZmYgaW5zdGFuY2VvZiBBcnJheSkpIHsgZGlmZiA9IE1hdGgucm91bmQoUk9ULlJORy5nZXROb3JtYWwoMCwgZGlmZikpOyB9XG5cdFx0dmFyIHJlc3VsdCA9IGNvbG9yLnNsaWNlKCk7XG5cdFx0Zm9yICh2YXIgaT0wO2k8MztpKyspIHtcblx0XHRcdHJlc3VsdFtpXSArPSAoZGlmZiBpbnN0YW5jZW9mIEFycmF5ID8gTWF0aC5yb3VuZChST1QuUk5HLmdldE5vcm1hbCgwLCBkaWZmW2ldKSkgOiBkaWZmKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHQvKipcblx0ICogQ29udmVydHMgYW4gUkdCIGNvbG9yIHZhbHVlIHRvIEhTTC4gRXhwZWN0cyAwLi4yNTUgaW5wdXRzLCBwcm9kdWNlcyAwLi4xIG91dHB1dHMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yXG5cdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cblx0ICovXG5cdHJnYjJoc2w6IGZ1bmN0aW9uKGNvbG9yKSB7XG5cdFx0dmFyIHIgPSBjb2xvclswXS8yNTU7XG5cdFx0dmFyIGcgPSBjb2xvclsxXS8yNTU7XG5cdFx0dmFyIGIgPSBjb2xvclsyXS8yNTU7XG5cblx0XHR2YXIgbWF4ID0gTWF0aC5tYXgociwgZywgYiksIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuXHRcdHZhciBoLCBzLCBsID0gKG1heCArIG1pbikgLyAyO1xuXG5cdFx0aWYgKG1heCA9PSBtaW4pIHtcblx0XHRcdGggPSBzID0gMDsgLy8gYWNocm9tYXRpY1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgZCA9IG1heCAtIG1pbjtcblx0XHRcdHMgPSAobCA+IDAuNSA/IGQgLyAoMiAtIG1heCAtIG1pbikgOiBkIC8gKG1heCArIG1pbikpO1xuXHRcdFx0c3dpdGNoKG1heCkge1xuXHRcdFx0XHRjYXNlIHI6IGggPSAoZyAtIGIpIC8gZCArIChnIDwgYiA/IDYgOiAwKTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgZzogaCA9IChiIC0gcikgLyBkICsgMjsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgYjogaCA9IChyIC0gZykgLyBkICsgNDsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRoIC89IDY7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFtoLCBzLCBsXTtcblx0fSxcblxuXHQvKipcblx0ICogQ29udmVydHMgYW4gSFNMIGNvbG9yIHZhbHVlIHRvIFJHQi4gRXhwZWN0cyAwLi4xIGlucHV0cywgcHJvZHVjZXMgMC4uMjU1IG91dHB1dHMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yXG5cdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cblx0ICovXG5cdGhzbDJyZ2I6IGZ1bmN0aW9uKGNvbG9yKSB7XG5cdFx0dmFyIGwgPSBjb2xvclsyXTtcblxuXHRcdGlmIChjb2xvclsxXSA9PSAwKSB7XG5cdFx0XHRsID0gTWF0aC5yb3VuZChsKjI1NSk7XG5cdFx0XHRyZXR1cm4gW2wsIGwsIGxdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgaHVlMnJnYiA9IGZ1bmN0aW9uKHAsIHEsIHQpIHtcblx0XHRcdFx0aWYgKHQgPCAwKSB0ICs9IDE7XG5cdFx0XHRcdGlmICh0ID4gMSkgdCAtPSAxO1xuXHRcdFx0XHRpZiAodCA8IDEvNikgcmV0dXJuIHAgKyAocSAtIHApICogNiAqIHQ7XG5cdFx0XHRcdGlmICh0IDwgMS8yKSByZXR1cm4gcTtcblx0XHRcdFx0aWYgKHQgPCAyLzMpIHJldHVybiBwICsgKHEgLSBwKSAqICgyLzMgLSB0KSAqIDY7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcyA9IGNvbG9yWzFdO1xuXHRcdFx0dmFyIHEgPSAobCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogcyk7XG5cdFx0XHR2YXIgcCA9IDIgKiBsIC0gcTtcblx0XHRcdHZhciByID0gaHVlMnJnYihwLCBxLCBjb2xvclswXSArIDEvMyk7XG5cdFx0XHR2YXIgZyA9IGh1ZTJyZ2IocCwgcSwgY29sb3JbMF0pO1xuXHRcdFx0dmFyIGIgPSBodWUycmdiKHAsIHEsIGNvbG9yWzBdIC0gMS8zKTtcblx0XHRcdHJldHVybiBbTWF0aC5yb3VuZChyKjI1NSksIE1hdGgucm91bmQoZyoyNTUpLCBNYXRoLnJvdW5kKGIqMjU1KV07XG5cdFx0fVxuXHR9LFxuXG5cdHRvUkdCOiBmdW5jdGlvbihjb2xvcikge1xuXHRcdHJldHVybiBcInJnYihcIiArIHRoaXMuX2NsYW1wKGNvbG9yWzBdKSArIFwiLFwiICsgdGhpcy5fY2xhbXAoY29sb3JbMV0pICsgXCIsXCIgKyB0aGlzLl9jbGFtcChjb2xvclsyXSkgKyBcIilcIjtcblx0fSxcblxuXHR0b0hleDogZnVuY3Rpb24oY29sb3IpIHtcblx0XHR2YXIgcGFydHMgPSBbXTtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0cGFydHMucHVzaCh0aGlzLl9jbGFtcChjb2xvcltpXSkudG9TdHJpbmcoMTYpLmxwYWQoXCIwXCIsIDIpKTtcblx0XHR9XG5cdFx0cmV0dXJuIFwiI1wiICsgcGFydHMuam9pbihcIlwiKTtcblx0fSxcblxuXHRfY2xhbXA6IGZ1bmN0aW9uKG51bSkge1xuXHRcdGlmIChudW0gPCAwKSB7XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9IGVsc2UgaWYgKG51bSA+IDI1NSkge1xuXHRcdFx0cmV0dXJuIDI1NTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bTtcblx0XHR9XG5cdH0sXG5cblx0X2NhY2hlOiB7XG5cdFx0XCJibGFja1wiOiBbMCwwLDBdLFxuXHRcdFwibmF2eVwiOiBbMCwwLDEyOF0sXG5cdFx0XCJkYXJrYmx1ZVwiOiBbMCwwLDEzOV0sXG5cdFx0XCJtZWRpdW1ibHVlXCI6IFswLDAsMjA1XSxcblx0XHRcImJsdWVcIjogWzAsMCwyNTVdLFxuXHRcdFwiZGFya2dyZWVuXCI6IFswLDEwMCwwXSxcblx0XHRcImdyZWVuXCI6IFswLDEyOCwwXSxcblx0XHRcInRlYWxcIjogWzAsMTI4LDEyOF0sXG5cdFx0XCJkYXJrY3lhblwiOiBbMCwxMzksMTM5XSxcblx0XHRcImRlZXBza3libHVlXCI6IFswLDE5MSwyNTVdLFxuXHRcdFwiZGFya3R1cnF1b2lzZVwiOiBbMCwyMDYsMjA5XSxcblx0XHRcIm1lZGl1bXNwcmluZ2dyZWVuXCI6IFswLDI1MCwxNTRdLFxuXHRcdFwibGltZVwiOiBbMCwyNTUsMF0sXG5cdFx0XCJzcHJpbmdncmVlblwiOiBbMCwyNTUsMTI3XSxcblx0XHRcImFxdWFcIjogWzAsMjU1LDI1NV0sXG5cdFx0XCJjeWFuXCI6IFswLDI1NSwyNTVdLFxuXHRcdFwibWlkbmlnaHRibHVlXCI6IFsyNSwyNSwxMTJdLFxuXHRcdFwiZG9kZ2VyYmx1ZVwiOiBbMzAsMTQ0LDI1NV0sXG5cdFx0XCJmb3Jlc3RncmVlblwiOiBbMzQsMTM5LDM0XSxcblx0XHRcInNlYWdyZWVuXCI6IFs0NiwxMzksODddLFxuXHRcdFwiZGFya3NsYXRlZ3JheVwiOiBbNDcsNzksNzldLFxuXHRcdFwiZGFya3NsYXRlZ3JleVwiOiBbNDcsNzksNzldLFxuXHRcdFwibGltZWdyZWVuXCI6IFs1MCwyMDUsNTBdLFxuXHRcdFwibWVkaXVtc2VhZ3JlZW5cIjogWzYwLDE3OSwxMTNdLFxuXHRcdFwidHVycXVvaXNlXCI6IFs2NCwyMjQsMjA4XSxcblx0XHRcInJveWFsYmx1ZVwiOiBbNjUsMTA1LDIyNV0sXG5cdFx0XCJzdGVlbGJsdWVcIjogWzcwLDEzMCwxODBdLFxuXHRcdFwiZGFya3NsYXRlYmx1ZVwiOiBbNzIsNjEsMTM5XSxcblx0XHRcIm1lZGl1bXR1cnF1b2lzZVwiOiBbNzIsMjA5LDIwNF0sXG5cdFx0XCJpbmRpZ29cIjogWzc1LDAsMTMwXSxcblx0XHRcImRhcmtvbGl2ZWdyZWVuXCI6IFs4NSwxMDcsNDddLFxuXHRcdFwiY2FkZXRibHVlXCI6IFs5NSwxNTgsMTYwXSxcblx0XHRcImNvcm5mbG93ZXJibHVlXCI6IFsxMDAsMTQ5LDIzN10sXG5cdFx0XCJtZWRpdW1hcXVhbWFyaW5lXCI6IFsxMDIsMjA1LDE3MF0sXG5cdFx0XCJkaW1ncmF5XCI6IFsxMDUsMTA1LDEwNV0sXG5cdFx0XCJkaW1ncmV5XCI6IFsxMDUsMTA1LDEwNV0sXG5cdFx0XCJzbGF0ZWJsdWVcIjogWzEwNiw5MCwyMDVdLFxuXHRcdFwib2xpdmVkcmFiXCI6IFsxMDcsMTQyLDM1XSxcblx0XHRcInNsYXRlZ3JheVwiOiBbMTEyLDEyOCwxNDRdLFxuXHRcdFwic2xhdGVncmV5XCI6IFsxMTIsMTI4LDE0NF0sXG5cdFx0XCJsaWdodHNsYXRlZ3JheVwiOiBbMTE5LDEzNiwxNTNdLFxuXHRcdFwibGlnaHRzbGF0ZWdyZXlcIjogWzExOSwxMzYsMTUzXSxcblx0XHRcIm1lZGl1bXNsYXRlYmx1ZVwiOiBbMTIzLDEwNCwyMzhdLFxuXHRcdFwibGF3bmdyZWVuXCI6IFsxMjQsMjUyLDBdLFxuXHRcdFwiY2hhcnRyZXVzZVwiOiBbMTI3LDI1NSwwXSxcblx0XHRcImFxdWFtYXJpbmVcIjogWzEyNywyNTUsMjEyXSxcblx0XHRcIm1hcm9vblwiOiBbMTI4LDAsMF0sXG5cdFx0XCJwdXJwbGVcIjogWzEyOCwwLDEyOF0sXG5cdFx0XCJvbGl2ZVwiOiBbMTI4LDEyOCwwXSxcblx0XHRcImdyYXlcIjogWzEyOCwxMjgsMTI4XSxcblx0XHRcImdyZXlcIjogWzEyOCwxMjgsMTI4XSxcblx0XHRcInNreWJsdWVcIjogWzEzNSwyMDYsMjM1XSxcblx0XHRcImxpZ2h0c2t5Ymx1ZVwiOiBbMTM1LDIwNiwyNTBdLFxuXHRcdFwiYmx1ZXZpb2xldFwiOiBbMTM4LDQzLDIyNl0sXG5cdFx0XCJkYXJrcmVkXCI6IFsxMzksMCwwXSxcblx0XHRcImRhcmttYWdlbnRhXCI6IFsxMzksMCwxMzldLFxuXHRcdFwic2FkZGxlYnJvd25cIjogWzEzOSw2OSwxOV0sXG5cdFx0XCJkYXJrc2VhZ3JlZW5cIjogWzE0MywxODgsMTQzXSxcblx0XHRcImxpZ2h0Z3JlZW5cIjogWzE0NCwyMzgsMTQ0XSxcblx0XHRcIm1lZGl1bXB1cnBsZVwiOiBbMTQ3LDExMiwyMTZdLFxuXHRcdFwiZGFya3Zpb2xldFwiOiBbMTQ4LDAsMjExXSxcblx0XHRcInBhbGVncmVlblwiOiBbMTUyLDI1MSwxNTJdLFxuXHRcdFwiZGFya29yY2hpZFwiOiBbMTUzLDUwLDIwNF0sXG5cdFx0XCJ5ZWxsb3dncmVlblwiOiBbMTU0LDIwNSw1MF0sXG5cdFx0XCJzaWVubmFcIjogWzE2MCw4Miw0NV0sXG5cdFx0XCJicm93blwiOiBbMTY1LDQyLDQyXSxcblx0XHRcImRhcmtncmF5XCI6IFsxNjksMTY5LDE2OV0sXG5cdFx0XCJkYXJrZ3JleVwiOiBbMTY5LDE2OSwxNjldLFxuXHRcdFwibGlnaHRibHVlXCI6IFsxNzMsMjE2LDIzMF0sXG5cdFx0XCJncmVlbnllbGxvd1wiOiBbMTczLDI1NSw0N10sXG5cdFx0XCJwYWxldHVycXVvaXNlXCI6IFsxNzUsMjM4LDIzOF0sXG5cdFx0XCJsaWdodHN0ZWVsYmx1ZVwiOiBbMTc2LDE5NiwyMjJdLFxuXHRcdFwicG93ZGVyYmx1ZVwiOiBbMTc2LDIyNCwyMzBdLFxuXHRcdFwiZmlyZWJyaWNrXCI6IFsxNzgsMzQsMzRdLFxuXHRcdFwiZGFya2dvbGRlbnJvZFwiOiBbMTg0LDEzNCwxMV0sXG5cdFx0XCJtZWRpdW1vcmNoaWRcIjogWzE4Niw4NSwyMTFdLFxuXHRcdFwicm9zeWJyb3duXCI6IFsxODgsMTQzLDE0M10sXG5cdFx0XCJkYXJra2hha2lcIjogWzE4OSwxODMsMTA3XSxcblx0XHRcInNpbHZlclwiOiBbMTkyLDE5MiwxOTJdLFxuXHRcdFwibWVkaXVtdmlvbGV0cmVkXCI6IFsxOTksMjEsMTMzXSxcblx0XHRcImluZGlhbnJlZFwiOiBbMjA1LDkyLDkyXSxcblx0XHRcInBlcnVcIjogWzIwNSwxMzMsNjNdLFxuXHRcdFwiY2hvY29sYXRlXCI6IFsyMTAsMTA1LDMwXSxcblx0XHRcInRhblwiOiBbMjEwLDE4MCwxNDBdLFxuXHRcdFwibGlnaHRncmF5XCI6IFsyMTEsMjExLDIxMV0sXG5cdFx0XCJsaWdodGdyZXlcIjogWzIxMSwyMTEsMjExXSxcblx0XHRcInBhbGV2aW9sZXRyZWRcIjogWzIxNiwxMTIsMTQ3XSxcblx0XHRcInRoaXN0bGVcIjogWzIxNiwxOTEsMjE2XSxcblx0XHRcIm9yY2hpZFwiOiBbMjE4LDExMiwyMTRdLFxuXHRcdFwiZ29sZGVucm9kXCI6IFsyMTgsMTY1LDMyXSxcblx0XHRcImNyaW1zb25cIjogWzIyMCwyMCw2MF0sXG5cdFx0XCJnYWluc2Jvcm9cIjogWzIyMCwyMjAsMjIwXSxcblx0XHRcInBsdW1cIjogWzIyMSwxNjAsMjIxXSxcblx0XHRcImJ1cmx5d29vZFwiOiBbMjIyLDE4NCwxMzVdLFxuXHRcdFwibGlnaHRjeWFuXCI6IFsyMjQsMjU1LDI1NV0sXG5cdFx0XCJsYXZlbmRlclwiOiBbMjMwLDIzMCwyNTBdLFxuXHRcdFwiZGFya3NhbG1vblwiOiBbMjMzLDE1MCwxMjJdLFxuXHRcdFwidmlvbGV0XCI6IFsyMzgsMTMwLDIzOF0sXG5cdFx0XCJwYWxlZ29sZGVucm9kXCI6IFsyMzgsMjMyLDE3MF0sXG5cdFx0XCJsaWdodGNvcmFsXCI6IFsyNDAsMTI4LDEyOF0sXG5cdFx0XCJraGFraVwiOiBbMjQwLDIzMCwxNDBdLFxuXHRcdFwiYWxpY2VibHVlXCI6IFsyNDAsMjQ4LDI1NV0sXG5cdFx0XCJob25leWRld1wiOiBbMjQwLDI1NSwyNDBdLFxuXHRcdFwiYXp1cmVcIjogWzI0MCwyNTUsMjU1XSxcblx0XHRcInNhbmR5YnJvd25cIjogWzI0NCwxNjQsOTZdLFxuXHRcdFwid2hlYXRcIjogWzI0NSwyMjIsMTc5XSxcblx0XHRcImJlaWdlXCI6IFsyNDUsMjQ1LDIyMF0sXG5cdFx0XCJ3aGl0ZXNtb2tlXCI6IFsyNDUsMjQ1LDI0NV0sXG5cdFx0XCJtaW50Y3JlYW1cIjogWzI0NSwyNTUsMjUwXSxcblx0XHRcImdob3N0d2hpdGVcIjogWzI0OCwyNDgsMjU1XSxcblx0XHRcInNhbG1vblwiOiBbMjUwLDEyOCwxMTRdLFxuXHRcdFwiYW50aXF1ZXdoaXRlXCI6IFsyNTAsMjM1LDIxNV0sXG5cdFx0XCJsaW5lblwiOiBbMjUwLDI0MCwyMzBdLFxuXHRcdFwibGlnaHRnb2xkZW5yb2R5ZWxsb3dcIjogWzI1MCwyNTAsMjEwXSxcblx0XHRcIm9sZGxhY2VcIjogWzI1MywyNDUsMjMwXSxcblx0XHRcInJlZFwiOiBbMjU1LDAsMF0sXG5cdFx0XCJmdWNoc2lhXCI6IFsyNTUsMCwyNTVdLFxuXHRcdFwibWFnZW50YVwiOiBbMjU1LDAsMjU1XSxcblx0XHRcImRlZXBwaW5rXCI6IFsyNTUsMjAsMTQ3XSxcblx0XHRcIm9yYW5nZXJlZFwiOiBbMjU1LDY5LDBdLFxuXHRcdFwidG9tYXRvXCI6IFsyNTUsOTksNzFdLFxuXHRcdFwiaG90cGlua1wiOiBbMjU1LDEwNSwxODBdLFxuXHRcdFwiY29yYWxcIjogWzI1NSwxMjcsODBdLFxuXHRcdFwiZGFya29yYW5nZVwiOiBbMjU1LDE0MCwwXSxcblx0XHRcImxpZ2h0c2FsbW9uXCI6IFsyNTUsMTYwLDEyMl0sXG5cdFx0XCJvcmFuZ2VcIjogWzI1NSwxNjUsMF0sXG5cdFx0XCJsaWdodHBpbmtcIjogWzI1NSwxODIsMTkzXSxcblx0XHRcInBpbmtcIjogWzI1NSwxOTIsMjAzXSxcblx0XHRcImdvbGRcIjogWzI1NSwyMTUsMF0sXG5cdFx0XCJwZWFjaHB1ZmZcIjogWzI1NSwyMTgsMTg1XSxcblx0XHRcIm5hdmFqb3doaXRlXCI6IFsyNTUsMjIyLDE3M10sXG5cdFx0XCJtb2NjYXNpblwiOiBbMjU1LDIyOCwxODFdLFxuXHRcdFwiYmlzcXVlXCI6IFsyNTUsMjI4LDE5Nl0sXG5cdFx0XCJtaXN0eXJvc2VcIjogWzI1NSwyMjgsMjI1XSxcblx0XHRcImJsYW5jaGVkYWxtb25kXCI6IFsyNTUsMjM1LDIwNV0sXG5cdFx0XCJwYXBheWF3aGlwXCI6IFsyNTUsMjM5LDIxM10sXG5cdFx0XCJsYXZlbmRlcmJsdXNoXCI6IFsyNTUsMjQwLDI0NV0sXG5cdFx0XCJzZWFzaGVsbFwiOiBbMjU1LDI0NSwyMzhdLFxuXHRcdFwiY29ybnNpbGtcIjogWzI1NSwyNDgsMjIwXSxcblx0XHRcImxlbW9uY2hpZmZvblwiOiBbMjU1LDI1MCwyMDVdLFxuXHRcdFwiZmxvcmFsd2hpdGVcIjogWzI1NSwyNTAsMjQwXSxcblx0XHRcInNub3dcIjogWzI1NSwyNTAsMjUwXSxcblx0XHRcInllbGxvd1wiOiBbMjU1LDI1NSwwXSxcblx0XHRcImxpZ2h0eWVsbG93XCI6IFsyNTUsMjU1LDIyNF0sXG5cdFx0XCJpdm9yeVwiOiBbMjU1LDI1NSwyNDBdLFxuXHRcdFwid2hpdGVcIjogWzI1NSwyNTUsMjU1XVxuXHR9XG59XG4vKipcbiAqIEBjbGFzcyBMaWdodGluZyBjb21wdXRhdGlvbiwgYmFzZWQgb24gYSB0cmFkaXRpb25hbCBGT1YgZm9yIG11bHRpcGxlIGxpZ2h0IHNvdXJjZXMgYW5kIG11bHRpcGxlIHBhc3Nlcy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlZmxlY3Rpdml0eUNhbGxiYWNrIENhbGxiYWNrIHRvIHJldHJpZXZlIGNlbGwgcmVmbGVjdGl2aXR5ICgwLi4xKVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLnBhc3Nlcz0xXSBOdW1iZXIgb2YgcGFzc2VzLiAxIGVxdWFscyB0byBzaW1wbGUgRk9WIG9mIGFsbCBsaWdodCBzb3VyY2VzLCA+MSBtZWFucyBhICpoaWdobHkgc2ltcGxpZmllZCogcmFkaW9zaXR5LWxpa2UgYWxnb3JpdGhtLlxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLmVtaXNzaW9uVGhyZXNob2xkPTEwMF0gQ2VsbHMgd2l0aCBlbWlzc2l2aXR5ID4gdGhyZXNob2xkIHdpbGwgYmUgdHJlYXRlZCBhcyBsaWdodCBzb3VyY2UgaW4gdGhlIG5leHQgcGFzcy5cbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy5yYW5nZT0xMF0gTWF4IGxpZ2h0IHJhbmdlXG4gKi9cblJPVC5MaWdodGluZyA9IGZ1bmN0aW9uKHJlZmxlY3Rpdml0eUNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdHRoaXMuX3JlZmxlY3Rpdml0eUNhbGxiYWNrID0gcmVmbGVjdGl2aXR5Q2FsbGJhY2s7XG5cdHRoaXMuX29wdGlvbnMgPSB7XG5cdFx0cGFzc2VzOiAxLFxuXHRcdGVtaXNzaW9uVGhyZXNob2xkOiAxMDAsXG5cdFx0cmFuZ2U6IDEwXG5cdH07XG5cdHRoaXMuX2ZvdiA9IG51bGw7XG5cblx0dGhpcy5fbGlnaHRzID0ge307XG5cdHRoaXMuX3JlZmxlY3Rpdml0eUNhY2hlID0ge307XG5cdHRoaXMuX2ZvdkNhY2hlID0ge307XG5cblx0dGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEFkanVzdCBvcHRpb25zIGF0IHJ1bnRpbWVcbiAqIEBzZWUgUk9ULkxpZ2h0aW5nXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cdGlmIChvcHRpb25zICYmIG9wdGlvbnMucmFuZ2UpIHsgdGhpcy5yZXNldCgpOyB9XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFNldCB0aGUgdXNlZCBGaWVsZC1PZi1WaWV3IGFsZ29cbiAqIEBwYXJhbSB7Uk9ULkZPVn0gZm92XG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuc2V0Rk9WID0gZnVuY3Rpb24oZm92KSB7XG5cdHRoaXMuX2ZvdiA9IGZvdjtcblx0dGhpcy5fZm92Q2FjaGUgPSB7fTtcblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogU2V0IChvciByZW1vdmUpIGEgbGlnaHQgc291cmNlXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7bnVsbCB8fCBzdHJpbmcgfHwgbnVtYmVyWzNdfSBjb2xvclxuICovXG5ST1QuTGlnaHRpbmcucHJvdG90eXBlLnNldExpZ2h0ID0gZnVuY3Rpb24oeCwgeSwgY29sb3IpIHtcblx0dmFyIGtleSA9IHgrXCIsXCIreTtcblxuXHRpZiAoY29sb3IpIHtcblx0XHR0aGlzLl9saWdodHNba2V5XSA9ICh0eXBlb2YoY29sb3IpID09IFwic3RyaW5nXCIgPyBST1QuQ29sb3IuZnJvbVN0cmluZyhjb2xvcikgOiBjb2xvcik7XG5cdH0gZWxzZSB7XG5cdFx0ZGVsZXRlIHRoaXMuX2xpZ2h0c1trZXldO1xuXHR9XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlnaHQgc291cmNlc1xuICovXG5ST1QuTGlnaHRpbmcucHJvdG90eXBlLmNsZWFyTGlnaHRzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fbGlnaHRzID0ge307XG59XG5cbi8qKlxuICogUmVzZXQgdGhlIHByZS1jb21wdXRlZCB0b3BvbG9neSB2YWx1ZXMuIENhbGwgd2hlbmV2ZXIgdGhlIHVuZGVybHlpbmcgbWFwIGNoYW5nZXMgaXRzIGxpZ2h0LXBhc3NhYmlsaXR5LlxuICovXG5ST1QuTGlnaHRpbmcucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX3JlZmxlY3Rpdml0eUNhY2hlID0ge307XG5cdHRoaXMuX2ZvdkNhY2hlID0ge307XG5cblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgbGlnaHRpbmdcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGxpZ2h0aW5nQ2FsbGJhY2sgV2lsbCBiZSBjYWxsZWQgd2l0aCAoeCwgeSwgY29sb3IpIGZvciBldmVyeSBsaXQgY2VsbFxuICovXG5ST1QuTGlnaHRpbmcucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihsaWdodGluZ0NhbGxiYWNrKSB7XG5cdHZhciBkb25lQ2VsbHMgPSB7fTtcblx0dmFyIGVtaXR0aW5nQ2VsbHMgPSB7fTtcblx0dmFyIGxpdENlbGxzID0ge307XG5cblx0Zm9yICh2YXIga2V5IGluIHRoaXMuX2xpZ2h0cykgeyAvKiBwcmVwYXJlIGVtaXR0ZXJzIGZvciBmaXJzdCBwYXNzICovXG5cdFx0dmFyIGxpZ2h0ID0gdGhpcy5fbGlnaHRzW2tleV07XG5cdFx0ZW1pdHRpbmdDZWxsc1trZXldID0gWzAsIDAsIDBdO1xuXHRcdFJPVC5Db2xvci5hZGRfKGVtaXR0aW5nQ2VsbHNba2V5XSwgbGlnaHQpO1xuXHR9XG5cblx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fb3B0aW9ucy5wYXNzZXM7aSsrKSB7IC8qIG1haW4gbG9vcCAqL1xuXHRcdHRoaXMuX2VtaXRMaWdodChlbWl0dGluZ0NlbGxzLCBsaXRDZWxscywgZG9uZUNlbGxzKTtcblx0XHRpZiAoaSsxID09IHRoaXMuX29wdGlvbnMucGFzc2VzKSB7IGNvbnRpbnVlOyB9IC8qIG5vdCBmb3IgdGhlIGxhc3QgcGFzcyAqL1xuXHRcdGVtaXR0aW5nQ2VsbHMgPSB0aGlzLl9jb21wdXRlRW1pdHRlcnMobGl0Q2VsbHMsIGRvbmVDZWxscyk7XG5cdH1cblxuXHRmb3IgKHZhciBsaXRLZXkgaW4gbGl0Q2VsbHMpIHsgLyogbGV0IHRoZSB1c2VyIGtub3cgd2hhdCBhbmQgaG93IGlzIGxpdCAqL1xuXHRcdHZhciBwYXJ0cyA9IGxpdEtleS5zcGxpdChcIixcIik7XG5cdFx0dmFyIHggPSBwYXJzZUludChwYXJ0c1swXSk7XG5cdFx0dmFyIHkgPSBwYXJzZUludChwYXJ0c1sxXSk7XG5cdFx0bGlnaHRpbmdDYWxsYmFjayh4LCB5LCBsaXRDZWxsc1tsaXRLZXldKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIENvbXB1dGUgb25lIGl0ZXJhdGlvbiBmcm9tIGFsbCBlbWl0dGluZyBjZWxsc1xuICogQHBhcmFtIHtvYmplY3R9IGVtaXR0aW5nQ2VsbHMgVGhlc2UgZW1pdCBsaWdodFxuICogQHBhcmFtIHtvYmplY3R9IGxpdENlbGxzIEFkZCBwcm9qZWN0ZWQgbGlnaHQgdG8gdGhlc2VcbiAqIEBwYXJhbSB7b2JqZWN0fSBkb25lQ2VsbHMgVGhlc2UgYWxyZWFkeSBlbWl0dGVkLCBmb3JiaWQgdGhlbSBmcm9tIGZ1cnRoZXIgY2FsY3VsYXRpb25zXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuX2VtaXRMaWdodCA9IGZ1bmN0aW9uKGVtaXR0aW5nQ2VsbHMsIGxpdENlbGxzLCBkb25lQ2VsbHMpIHtcblx0Zm9yICh2YXIga2V5IGluIGVtaXR0aW5nQ2VsbHMpIHtcblx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoXCIsXCIpO1xuXHRcdHZhciB4ID0gcGFyc2VJbnQocGFydHNbMF0pO1xuXHRcdHZhciB5ID0gcGFyc2VJbnQocGFydHNbMV0pO1xuXHRcdHRoaXMuX2VtaXRMaWdodEZyb21DZWxsKHgsIHksIGVtaXR0aW5nQ2VsbHNba2V5XSwgbGl0Q2VsbHMpO1xuXHRcdGRvbmVDZWxsc1trZXldID0gMTtcblx0fVxuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBQcmVwYXJlIGEgbGlzdCBvZiBlbWl0dGVycyBmb3IgbmV4dCBwYXNzXG4gKiBAcGFyYW0ge29iamVjdH0gbGl0Q2VsbHNcbiAqIEBwYXJhbSB7b2JqZWN0fSBkb25lQ2VsbHNcbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuX2NvbXB1dGVFbWl0dGVycyA9IGZ1bmN0aW9uKGxpdENlbGxzLCBkb25lQ2VsbHMpIHtcblx0dmFyIHJlc3VsdCA9IHt9O1xuXG5cdGZvciAodmFyIGtleSBpbiBsaXRDZWxscykge1xuXHRcdGlmIChrZXkgaW4gZG9uZUNlbGxzKSB7IGNvbnRpbnVlOyB9IC8qIGFscmVhZHkgZW1pdHRlZCAqL1xuXG5cdFx0dmFyIGNvbG9yID0gbGl0Q2VsbHNba2V5XTtcblxuXHRcdGlmIChrZXkgaW4gdGhpcy5fcmVmbGVjdGl2aXR5Q2FjaGUpIHtcblx0XHRcdHZhciByZWZsZWN0aXZpdHkgPSB0aGlzLl9yZWZsZWN0aXZpdHlDYWNoZVtrZXldO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoXCIsXCIpO1xuXHRcdFx0dmFyIHggPSBwYXJzZUludChwYXJ0c1swXSk7XG5cdFx0XHR2YXIgeSA9IHBhcnNlSW50KHBhcnRzWzFdKTtcblx0XHRcdHZhciByZWZsZWN0aXZpdHkgPSB0aGlzLl9yZWZsZWN0aXZpdHlDYWxsYmFjayh4LCB5KTtcblx0XHRcdHRoaXMuX3JlZmxlY3Rpdml0eUNhY2hlW2tleV0gPSByZWZsZWN0aXZpdHk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlZmxlY3Rpdml0eSA9PSAwKSB7IGNvbnRpbnVlOyB9IC8qIHdpbGwgbm90IHJlZmxlY3QgYXQgYWxsICovXG5cblx0XHQvKiBjb21wdXRlIGVtaXNzaW9uIGNvbG9yICovXG5cdFx0dmFyIGVtaXNzaW9uID0gW107XG5cdFx0dmFyIGludGVuc2l0eSA9IDA7XG5cdFx0Zm9yICh2YXIgaT0wO2k8MztpKyspIHtcblx0XHRcdHZhciBwYXJ0ID0gTWF0aC5yb3VuZChjb2xvcltpXSpyZWZsZWN0aXZpdHkpO1xuXHRcdFx0ZW1pc3Npb25baV0gPSBwYXJ0O1xuXHRcdFx0aW50ZW5zaXR5ICs9IHBhcnQ7XG5cdFx0fVxuXHRcdGlmIChpbnRlbnNpdHkgPiB0aGlzLl9vcHRpb25zLmVtaXNzaW9uVGhyZXNob2xkKSB7IHJlc3VsdFtrZXldID0gZW1pc3Npb247IH1cblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ29tcHV0ZSBvbmUgaXRlcmF0aW9uIGZyb20gb25lIGNlbGxcbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBsaXRDZWxscyBDZWxsIGRhdGEgdG8gYnkgdXBkYXRlZFxuICovXG5ST1QuTGlnaHRpbmcucHJvdG90eXBlLl9lbWl0TGlnaHRGcm9tQ2VsbCA9IGZ1bmN0aW9uKHgsIHksIGNvbG9yLCBsaXRDZWxscykge1xuXHR2YXIga2V5ID0geCtcIixcIit5O1xuXHRpZiAoa2V5IGluIHRoaXMuX2ZvdkNhY2hlKSB7XG5cdFx0dmFyIGZvdiA9IHRoaXMuX2ZvdkNhY2hlW2tleV07XG5cdH0gZWxzZSB7XG5cdFx0dmFyIGZvdiA9IHRoaXMuX3VwZGF0ZUZPVih4LCB5KTtcblx0fVxuXG5cdGZvciAodmFyIGZvdktleSBpbiBmb3YpIHtcblx0XHR2YXIgZm9ybUZhY3RvciA9IGZvdltmb3ZLZXldO1xuXG5cdFx0aWYgKGZvdktleSBpbiBsaXRDZWxscykgeyAvKiBhbHJlYWR5IGxpdCAqL1xuXHRcdFx0dmFyIHJlc3VsdCA9IGxpdENlbGxzW2ZvdktleV07XG5cdFx0fSBlbHNlIHsgLyogbmV3bHkgbGl0ICovXG5cdFx0XHR2YXIgcmVzdWx0ID0gWzAsIDAsIDBdO1xuXHRcdFx0bGl0Q2VsbHNbZm92S2V5XSA9IHJlc3VsdDtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykgeyByZXN1bHRbaV0gKz0gTWF0aC5yb3VuZChjb2xvcltpXSpmb3JtRmFjdG9yKTsgfSAvKiBhZGQgbGlnaHQgY29sb3IgKi9cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIENvbXB1dGUgRk9WIChcImZvcm0gZmFjdG9yXCIpIGZvciBhIHBvdGVudGlhbCBsaWdodCBzb3VyY2UgYXQgW3gseV1cbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHJldHVybnMge29iamVjdH1cbiAqL1xuUk9ULkxpZ2h0aW5nLnByb3RvdHlwZS5fdXBkYXRlRk9WID0gZnVuY3Rpb24oeCwgeSkge1xuXHR2YXIga2V5MSA9IHgrXCIsXCIreTtcblx0dmFyIGNhY2hlID0ge307XG5cdHRoaXMuX2ZvdkNhY2hlW2tleTFdID0gY2FjaGU7XG5cdHZhciByYW5nZSA9IHRoaXMuX29wdGlvbnMucmFuZ2U7XG5cdHZhciBjYiA9IGZ1bmN0aW9uKHgsIHksIHIsIHZpcykge1xuXHRcdHZhciBrZXkyID0geCtcIixcIit5O1xuXHRcdHZhciBmb3JtRmFjdG9yID0gdmlzICogKDEtci9yYW5nZSk7XG5cdFx0aWYgKGZvcm1GYWN0b3IgPT0gMCkgeyByZXR1cm47IH1cblx0XHRjYWNoZVtrZXkyXSA9IGZvcm1GYWN0b3I7XG5cdH1cblx0dGhpcy5fZm92LmNvbXB1dGUoeCwgeSwgcmFuZ2UsIGNiLmJpbmQodGhpcykpO1xuXG5cdHJldHVybiBjYWNoZTtcbn1cbi8qKlxuICogQGNsYXNzIEFic3RyYWN0IHBhdGhmaW5kZXJcbiAqIEBwYXJhbSB7aW50fSB0b1ggVGFyZ2V0IFggY29vcmRcbiAqIEBwYXJhbSB7aW50fSB0b1kgVGFyZ2V0IFkgY29vcmRcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHBhc3NhYmxlQ2FsbGJhY2sgQ2FsbGJhY2sgdG8gZGV0ZXJtaW5lIG1hcCBwYXNzYWJpbGl0eVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLnRvcG9sb2d5PThdXG4gKi9cblJPVC5QYXRoID0gZnVuY3Rpb24odG9YLCB0b1ksIHBhc3NhYmxlQ2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0dGhpcy5fdG9YID0gdG9YO1xuXHR0aGlzLl90b1kgPSB0b1k7XG5cdHRoaXMuX2Zyb21YID0gbnVsbDtcblx0dGhpcy5fZnJvbVkgPSBudWxsO1xuXHR0aGlzLl9wYXNzYWJsZUNhbGxiYWNrID0gcGFzc2FibGVDYWxsYmFjaztcblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHR0b3BvbG9neTogOFxuXHR9XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyB0aGlzLl9vcHRpb25zW3BdID0gb3B0aW9uc1twXTsgfVxuXG5cdHRoaXMuX2RpcnMgPSBST1QuRElSU1t0aGlzLl9vcHRpb25zLnRvcG9sb2d5XTtcblx0aWYgKHRoaXMuX29wdGlvbnMudG9wb2xvZ3kgPT0gOCkgeyAvKiByZW9yZGVyIGRpcnMgZm9yIG1vcmUgYWVzdGhldGljIHJlc3VsdCAodmVydGljYWwvaG9yaXpvbnRhbCBmaXJzdCkgKi9cblx0XHR0aGlzLl9kaXJzID0gW1xuXHRcdFx0dGhpcy5fZGlyc1swXSxcblx0XHRcdHRoaXMuX2RpcnNbMl0sXG5cdFx0XHR0aGlzLl9kaXJzWzRdLFxuXHRcdFx0dGhpcy5fZGlyc1s2XSxcblx0XHRcdHRoaXMuX2RpcnNbMV0sXG5cdFx0XHR0aGlzLl9kaXJzWzNdLFxuXHRcdFx0dGhpcy5fZGlyc1s1XSxcblx0XHRcdHRoaXMuX2RpcnNbN11cblx0XHRdXG5cdH1cbn1cblxuLyoqXG4gKiBDb21wdXRlIGEgcGF0aCBmcm9tIGEgZ2l2ZW4gcG9pbnRcbiAqIEBwYXJhbSB7aW50fSBmcm9tWFxuICogQHBhcmFtIHtpbnR9IGZyb21ZXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBXaWxsIGJlIGNhbGxlZCBmb3IgZXZlcnkgcGF0aCBpdGVtIHdpdGggYXJndW1lbnRzIFwieFwiIGFuZCBcInlcIlxuICovXG5ST1QuUGF0aC5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKGZyb21YLCBmcm9tWSwgY2FsbGJhY2spIHtcbn1cblxuUk9ULlBhdGgucHJvdG90eXBlLl9nZXROZWlnaGJvcnMgPSBmdW5jdGlvbihjeCwgY3kpIHtcblx0dmFyIHJlc3VsdCA9IFtdO1xuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl9kaXJzLmxlbmd0aDtpKyspIHtcblx0XHR2YXIgZGlyID0gdGhpcy5fZGlyc1tpXTtcblx0XHR2YXIgeCA9IGN4ICsgZGlyWzBdO1xuXHRcdHZhciB5ID0gY3kgKyBkaXJbMV07XG5cdFx0XG5cdFx0aWYgKCF0aGlzLl9wYXNzYWJsZUNhbGxiYWNrKHgsIHkpKSB7IGNvbnRpbnVlOyB9XG5cdFx0cmVzdWx0LnB1c2goW3gsIHldKTtcblx0fVxuXHRcblx0cmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuICogQGNsYXNzIFNpbXBsaWZpZWQgRGlqa3N0cmEncyBhbGdvcml0aG06IGFsbCBlZGdlcyBoYXZlIGEgdmFsdWUgb2YgMVxuICogQGF1Z21lbnRzIFJPVC5QYXRoXG4gKiBAc2VlIFJPVC5QYXRoXG4gKi9cblJPVC5QYXRoLkRpamtzdHJhID0gZnVuY3Rpb24odG9YLCB0b1ksIHBhc3NhYmxlQ2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0Uk9ULlBhdGguY2FsbCh0aGlzLCB0b1gsIHRvWSwgcGFzc2FibGVDYWxsYmFjaywgb3B0aW9ucyk7XG5cblx0dGhpcy5fY29tcHV0ZWQgPSB7fTtcblx0dGhpcy5fdG9kbyA9IFtdO1xuXHR0aGlzLl9hZGQodG9YLCB0b1ksIG51bGwpO1xufVxuUk9ULlBhdGguRGlqa3N0cmEuZXh0ZW5kKFJPVC5QYXRoKTtcblxuLyoqXG4gKiBDb21wdXRlIGEgcGF0aCBmcm9tIGEgZ2l2ZW4gcG9pbnRcbiAqIEBzZWUgUk9ULlBhdGgjY29tcHV0ZVxuICovXG5ST1QuUGF0aC5EaWprc3RyYS5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKGZyb21YLCBmcm9tWSwgY2FsbGJhY2spIHtcblx0dmFyIGtleSA9IGZyb21YK1wiLFwiK2Zyb21ZO1xuXHRpZiAoIShrZXkgaW4gdGhpcy5fY29tcHV0ZWQpKSB7IHRoaXMuX2NvbXB1dGUoZnJvbVgsIGZyb21ZKTsgfVxuXHRpZiAoIShrZXkgaW4gdGhpcy5fY29tcHV0ZWQpKSB7IHJldHVybjsgfVxuXHRcblx0dmFyIGl0ZW0gPSB0aGlzLl9jb21wdXRlZFtrZXldO1xuXHR3aGlsZSAoaXRlbSkge1xuXHRcdGNhbGxiYWNrKGl0ZW0ueCwgaXRlbS55KTtcblx0XHRpdGVtID0gaXRlbS5wcmV2O1xuXHR9XG59XG5cbi8qKlxuICogQ29tcHV0ZSBhIG5vbi1jYWNoZWQgdmFsdWVcbiAqL1xuUk9ULlBhdGguRGlqa3N0cmEucHJvdG90eXBlLl9jb21wdXRlID0gZnVuY3Rpb24oZnJvbVgsIGZyb21ZKSB7XG5cdHdoaWxlICh0aGlzLl90b2RvLmxlbmd0aCkge1xuXHRcdHZhciBpdGVtID0gdGhpcy5fdG9kby5zaGlmdCgpO1xuXHRcdGlmIChpdGVtLnggPT0gZnJvbVggJiYgaXRlbS55ID09IGZyb21ZKSB7IHJldHVybjsgfVxuXHRcdFxuXHRcdHZhciBuZWlnaGJvcnMgPSB0aGlzLl9nZXROZWlnaGJvcnMoaXRlbS54LCBpdGVtLnkpO1xuXHRcdFxuXHRcdGZvciAodmFyIGk9MDtpPG5laWdoYm9ycy5sZW5ndGg7aSsrKSB7XG5cdFx0XHR2YXIgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG5cdFx0XHR2YXIgeCA9IG5laWdoYm9yWzBdO1xuXHRcdFx0dmFyIHkgPSBuZWlnaGJvclsxXTtcblx0XHRcdHZhciBpZCA9IHgrXCIsXCIreTtcblx0XHRcdGlmIChpZCBpbiB0aGlzLl9jb21wdXRlZCkgeyBjb250aW51ZTsgfSAvKiBhbHJlYWR5IGRvbmUgKi9cdFxuXHRcdFx0dGhpcy5fYWRkKHgsIHksIGl0ZW0pOyBcblx0XHR9XG5cdH1cbn1cblxuUk9ULlBhdGguRGlqa3N0cmEucHJvdG90eXBlLl9hZGQgPSBmdW5jdGlvbih4LCB5LCBwcmV2KSB7XG5cdHZhciBvYmogPSB7XG5cdFx0eDogeCxcblx0XHR5OiB5LFxuXHRcdHByZXY6IHByZXZcblx0fVxuXHR0aGlzLl9jb21wdXRlZFt4K1wiLFwiK3ldID0gb2JqO1xuXHR0aGlzLl90b2RvLnB1c2gob2JqKTtcbn1cbi8qKlxuICogQGNsYXNzIFNpbXBsaWZpZWQgQSogYWxnb3JpdGhtOiBhbGwgZWRnZXMgaGF2ZSBhIHZhbHVlIG9mIDFcbiAqIEBhdWdtZW50cyBST1QuUGF0aFxuICogQHNlZSBST1QuUGF0aFxuICovXG5ST1QuUGF0aC5BU3RhciA9IGZ1bmN0aW9uKHRvWCwgdG9ZLCBwYXNzYWJsZUNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFJPVC5QYXRoLmNhbGwodGhpcywgdG9YLCB0b1ksIHBhc3NhYmxlQ2FsbGJhY2ssIG9wdGlvbnMpO1xuXG5cdHRoaXMuX3RvZG8gPSBbXTtcblx0dGhpcy5fZG9uZSA9IHt9O1xuXHR0aGlzLl9mcm9tWCA9IG51bGw7XG5cdHRoaXMuX2Zyb21ZID0gbnVsbDtcbn1cblJPVC5QYXRoLkFTdGFyLmV4dGVuZChST1QuUGF0aCk7XG5cbi8qKlxuICogQ29tcHV0ZSBhIHBhdGggZnJvbSBhIGdpdmVuIHBvaW50XG4gKiBAc2VlIFJPVC5QYXRoI2NvbXB1dGVcbiAqL1xuUk9ULlBhdGguQVN0YXIucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihmcm9tWCwgZnJvbVksIGNhbGxiYWNrKSB7XG5cdHRoaXMuX3RvZG8gPSBbXTtcblx0dGhpcy5fZG9uZSA9IHt9O1xuXHR0aGlzLl9mcm9tWCA9IGZyb21YO1xuXHR0aGlzLl9mcm9tWSA9IGZyb21ZO1xuXHR0aGlzLl9hZGQodGhpcy5fdG9YLCB0aGlzLl90b1ksIG51bGwpO1xuXG5cdHdoaWxlICh0aGlzLl90b2RvLmxlbmd0aCkge1xuXHRcdHZhciBpdGVtID0gdGhpcy5fdG9kby5zaGlmdCgpO1xuXHRcdGlmIChpdGVtLnggPT0gZnJvbVggJiYgaXRlbS55ID09IGZyb21ZKSB7IGJyZWFrOyB9XG5cdFx0dmFyIG5laWdoYm9ycyA9IHRoaXMuX2dldE5laWdoYm9ycyhpdGVtLngsIGl0ZW0ueSk7XG5cblx0XHRmb3IgKHZhciBpPTA7aTxuZWlnaGJvcnMubGVuZ3RoO2krKykge1xuXHRcdFx0dmFyIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuXHRcdFx0dmFyIHggPSBuZWlnaGJvclswXTtcblx0XHRcdHZhciB5ID0gbmVpZ2hib3JbMV07XG5cdFx0XHR2YXIgaWQgPSB4K1wiLFwiK3k7XG5cdFx0XHRpZiAoaWQgaW4gdGhpcy5fZG9uZSkgeyBjb250aW51ZTsgfVxuXHRcdFx0dGhpcy5fYWRkKHgsIHksIGl0ZW0pOyBcblx0XHR9XG5cdH1cblx0XG5cdHZhciBpdGVtID0gdGhpcy5fZG9uZVtmcm9tWCtcIixcIitmcm9tWV07XG5cdGlmICghaXRlbSkgeyByZXR1cm47IH1cblx0XG5cdHdoaWxlIChpdGVtKSB7XG5cdFx0Y2FsbGJhY2soaXRlbS54LCBpdGVtLnkpO1xuXHRcdGl0ZW0gPSBpdGVtLnByZXY7XG5cdH1cbn1cblxuUk9ULlBhdGguQVN0YXIucHJvdG90eXBlLl9hZGQgPSBmdW5jdGlvbih4LCB5LCBwcmV2KSB7XG5cdHZhciBvYmogPSB7XG5cdFx0eDogeCxcblx0XHR5OiB5LFxuXHRcdHByZXY6IHByZXYsXG5cdFx0ZzogKHByZXYgPyBwcmV2LmcrMSA6IDApLFxuXHRcdGg6IHRoaXMuX2Rpc3RhbmNlKHgsIHkpXG5cdH1cblx0dGhpcy5fZG9uZVt4K1wiLFwiK3ldID0gb2JqO1xuXHRcblx0LyogaW5zZXJ0IGludG8gcHJpb3JpdHkgcXVldWUgKi9cblx0XG5cdHZhciBmID0gb2JqLmcgKyBvYmouaDtcblx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fdG9kby5sZW5ndGg7aSsrKSB7XG5cdFx0dmFyIGl0ZW0gPSB0aGlzLl90b2RvW2ldO1xuXHRcdGlmIChmIDwgaXRlbS5nICsgaXRlbS5oKSB7XG5cdFx0XHR0aGlzLl90b2RvLnNwbGljZShpLCAwLCBvYmopO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXHRcblx0dGhpcy5fdG9kby5wdXNoKG9iaik7XG59XG5cblJPVC5QYXRoLkFTdGFyLnByb3RvdHlwZS5fZGlzdGFuY2UgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHN3aXRjaCAodGhpcy5fb3B0aW9ucy50b3BvbG9neSkge1xuXHRcdGNhc2UgNDpcblx0XHRcdHJldHVybiAoTWF0aC5hYnMoeC10aGlzLl9mcm9tWCkgKyBNYXRoLmFicyh5LXRoaXMuX2Zyb21ZKSk7XG5cdFx0YnJlYWs7XG5cblx0XHRjYXNlIDY6XG5cdFx0XHR2YXIgZHggPSBNYXRoLmFicyh4IC0gdGhpcy5fZnJvbVgpO1xuXHRcdFx0dmFyIGR5ID0gTWF0aC5hYnMoeSAtIHRoaXMuX2Zyb21ZKTtcblx0XHRcdHJldHVybiBkeSArIE1hdGgubWF4KDAsIChkeC1keSkvMik7XG5cdFx0YnJlYWs7XG5cblx0XHRjYXNlIDg6IFxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KE1hdGguYWJzKHgtdGhpcy5fZnJvbVgpLCBNYXRoLmFicyh5LXRoaXMuX2Zyb21ZKSk7XG5cdFx0YnJlYWs7XG5cdH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIHRvcG9sb2d5XCIpO1xufVxuLyoqXG4gKiBAY2xhc3MgVGVybWluYWwgYmFja2VuZFxuICogQHByaXZhdGVcbiAqL1xuUk9ULkRpc3BsYXkuVGVybSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcblx0Uk9ULkRpc3BsYXkuQmFja2VuZC5jYWxsKHRoaXMsIGNvbnRleHQpO1xuXHR0aGlzLl9jeCA9IC0xO1xuXHR0aGlzLl9jeSA9IC0xO1xuXHR0aGlzLl9sYXN0Q29sb3IgPSBcIlwiO1xuXHR0aGlzLl9vcHRpb25zID0ge307XG5cdHRoaXMuX294ID0gMDtcblx0dGhpcy5fb3kgPSAwO1xuXHR0aGlzLl90ZXJtY29sb3IgPSB7fTtcbn1cblJPVC5EaXNwbGF5LlRlcm0uZXh0ZW5kKFJPVC5EaXNwbGF5LkJhY2tlbmQpO1xuXG5ST1QuRGlzcGxheS5UZXJtLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHR0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcblx0dGhpcy5fb3ggPSBNYXRoLmZsb29yKChwcm9jZXNzLnN0ZG91dC5jb2x1bW5zIC0gb3B0aW9ucy53aWR0aCkgLyAyKTtcblx0dGhpcy5fb3kgPSBNYXRoLmZsb29yKChwcm9jZXNzLnN0ZG91dC5yb3dzIC0gb3B0aW9ucy5oZWlnaHQpIC8gMik7XG5cdHRoaXMuX3Rlcm1jb2xvciA9IG5ldyBST1QuRGlzcGxheS5UZXJtW29wdGlvbnMudGVybUNvbG9yLmNhcGl0YWxpemUoKV0odGhpcy5fY29udGV4dCk7XG5cdHRoaXMuX2NvbnRleHQuX3Rlcm1jb2xvciA9IHRoaXMuX3Rlcm1jb2xvcjtcbn1cblxuUk9ULkRpc3BsYXkuVGVybS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGRhdGEsIGNsZWFyQmVmb3JlKSB7XG5cdC8vIGRldGVybWluZSB3aGVyZSB0byBkcmF3IHdoYXQgd2l0aCB3aGF0IGNvbG9yc1xuXHR2YXIgeCA9IGRhdGFbMF07XG5cdHZhciB5ID0gZGF0YVsxXTtcblx0dmFyIGNoID0gZGF0YVsyXTtcblx0dmFyIGZnID0gZGF0YVszXTtcblx0dmFyIGJnID0gZGF0YVs0XTtcblxuXHQvLyBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0byBtb3ZlIHRoZSB0ZXJtaW5hbCBjdXJzb3Jcblx0dmFyIGR4ID0gdGhpcy5fb3ggKyB4O1xuXHR2YXIgZHkgPSB0aGlzLl9veSArIHk7XG5cdGlmIChkeCA8IDAgfHwgZHggPj0gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucykgeyByZXR1cm47IH1cblx0aWYgKGR5IDwgMCB8fCBkeSA+PSBwcm9jZXNzLnN0ZG91dC5yb3dzKSB7IHJldHVybjsgfVxuXHRpZiAoZHggIT09IHRoaXMuX2N4IHx8IGR5ICE9PSB0aGlzLl9jeSkge1xuXHRcdHByb2Nlc3Muc3Rkb3V0LndyaXRlKHRoaXMuX3Rlcm1jb2xvci5wb3NpdGlvblRvQW5zaShkeCxkeSkpO1xuXHRcdHRoaXMuX2N4ID0gZHg7XG5cdFx0dGhpcy5fY3kgPSBkeTtcblx0fVxuXG5cdC8vIHRlcm1pbmFscyBhdXRvbWF0aWNhbGx5IGNsZWFyLCBidXQgaWYgd2UncmUgY2xlYXJpbmcgd2hlbiB3ZSdyZVxuXHQvLyBub3Qgb3RoZXJ3aXNlIHByb3ZpZGVkIHdpdGggYSBjaGFyYWN0ZXIsIGp1c3QgdXNlIGEgc3BhY2UgaW5zdGVhZFxuXHRpZiAoY2xlYXJCZWZvcmUpIHtcblx0XHRpZiAoIWNoKSB7XG5cdFx0XHRjaCA9IFwiIFwiO1xuXHRcdH1cblx0fVxuXHRcdFxuXHQvLyBpZiB3ZSdyZSBub3QgY2xlYXJpbmcgYW5kIG5vdCBwcm92aWRlZCB3aXRoIGEgY2hhcmFjdGVyLCBkbyBub3RoaW5nXG5cdGlmICghY2gpIHsgcmV0dXJuOyB9XG5cblx0Ly8gZGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gY2hhbmdlIGNvbG9yc1xuXHR2YXIgbmV3Q29sb3IgPSB0aGlzLl90ZXJtY29sb3IuY29sb3JUb0Fuc2koZmcsYmcpO1xuXHRpZiAobmV3Q29sb3IgIT09IHRoaXMuX2xhc3RDb2xvcikge1xuXHRcdHByb2Nlc3Muc3Rkb3V0LndyaXRlKG5ld0NvbG9yKTtcblx0XHR0aGlzLl9sYXN0Q29sb3IgPSBuZXdDb2xvcjtcblx0fVxuXG5cdC8vIHdyaXRlIHRoZSBwcm92aWRlZCBzeW1ib2wgdG8gdGhlIGRpc3BsYXlcblx0dmFyIGNoYXJzID0gW10uY29uY2F0KGNoKTtcblx0cHJvY2Vzcy5zdGRvdXQud3JpdGUoY2hhcnNbMF0pO1xuXG5cdC8vIHVwZGF0ZSBvdXIgcG9zaXRpb24sIGdpdmVuIHRoYXQgd2Ugd3JvdGUgYSBjaGFyYWN0ZXJcblx0dGhpcy5fY3grKztcblx0aWYgKHRoaXMuX2N4ID49IHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnMpIHtcblx0XHR0aGlzLl9jeCA9IDA7XG5cdFx0dGhpcy5fY3krKztcblx0fVxufVxuXG5ST1QuRGlzcGxheS5UZXJtLnByb3RvdHlwZS5jb21wdXRlU2l6ZSA9IGZ1bmN0aW9uKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0KSB7XG5cdHJldHVybiBbcHJvY2Vzcy5zdGRvdXQuY29sdW1ucywgcHJvY2Vzcy5zdGRvdXQucm93c107XG59XG5cblJPVC5EaXNwbGF5LlRlcm0ucHJvdG90eXBlLmNvbXB1dGVGb250U2l6ZSA9IGZ1bmN0aW9uKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0KSB7XG5cdHJldHVybiAxMjtcbn1cblxuUk9ULkRpc3BsYXkuVGVybS5wcm90b3R5cGUuZXZlbnRUb1Bvc2l0aW9uID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gW3gseV1cbn1cbi8qKlxuICogQGNsYXNzIEFic3RyYWN0IHRlcm1pbmFsIGNvZGUgbW9kdWxlXG4gKiBAcHJpdmF0ZVxuICovXG5ST1QuRGlzcGxheS5UZXJtLkNvbG9yID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHR0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbn1cblxuUk9ULkRpc3BsYXkuVGVybS5Db2xvci5wcm90b3R5cGUuY2xlYXJUb0Fuc2kgPSBmdW5jdGlvbihiZykge1xufVxuXG5ST1QuRGlzcGxheS5UZXJtLkNvbG9yLnByb3RvdHlwZS5jb2xvclRvQW5zaSA9IGZ1bmN0aW9uKGZnLCBiZykge1xufVxuXG5ST1QuRGlzcGxheS5UZXJtLkNvbG9yLnByb3RvdHlwZS5wb3NpdGlvblRvQW5zaSA9IGZ1bmN0aW9uKHgsIHkpIHtcbn1cbi8qKlxuICogQGNsYXNzIHh0ZXJtIHRlcm1pbmFsIGNvZGUgbW9kdWxlXG4gKiBAcHJpdmF0ZVxuICovXG5ST1QuRGlzcGxheS5UZXJtLlh0ZXJtID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRST1QuRGlzcGxheS5UZXJtLkNvbG9yLmNhbGwodGhpcywgY29udGV4dCk7XG59XG5ST1QuRGlzcGxheS5UZXJtLlh0ZXJtLmV4dGVuZChST1QuRGlzcGxheS5UZXJtLkNvbG9yKTtcblxuUk9ULkRpc3BsYXkuVGVybS5YdGVybS5wcm90b3R5cGUuY2xlYXJUb0Fuc2kgPSBmdW5jdGlvbihiZykge1xuXHRyZXR1cm4gXCJcXHgxYlswOzQ4OzU7XCJcblx0XHQrIHRoaXMuX3Rlcm1jb2xvcihiZylcblx0XHQrIFwibVxceDFiWzJKXCI7XG59XG5cblJPVC5EaXNwbGF5LlRlcm0uWHRlcm0ucHJvdG90eXBlLmNvbG9yVG9BbnNpID0gZnVuY3Rpb24oZmcsIGJnKSB7XG5cdHJldHVybiBcIlxceDFiWzA7Mzg7NTtcIlxuXHRcdCsgdGhpcy5fdGVybWNvbG9yKGZnKVxuXHRcdCsgXCI7NDg7NTtcIlxuXHRcdCsgdGhpcy5fdGVybWNvbG9yKGJnKVxuXHRcdCsgXCJtXCI7XG59XG5cblJPVC5EaXNwbGF5LlRlcm0uWHRlcm0ucHJvdG90eXBlLnBvc2l0aW9uVG9BbnNpID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4gXCJcXHgxYltcIiArICh5KzEpICsgXCI7XCIgKyAoeCsxKSArIFwiSFwiO1xufVxuXG5ST1QuRGlzcGxheS5UZXJtLlh0ZXJtLnByb3RvdHlwZS5fdGVybWNvbG9yID0gZnVuY3Rpb24oY29sb3IpIHtcblx0dmFyIFNSQ19DT0xPUlMgPSAyNTYuMDtcblx0dmFyIERTVF9DT0xPUlMgPSA2LjA7XG5cdHZhciBDT0xPUl9SQVRJTyA9IERTVF9DT0xPUlMgLyBTUkNfQ09MT1JTO1xuXHR2YXIgcmdiID0gUk9ULkNvbG9yLmZyb21TdHJpbmcoY29sb3IpO1xuXHR2YXIgciA9IE1hdGguZmxvb3IocmdiWzBdICogQ09MT1JfUkFUSU8pO1xuXHR2YXIgZyA9IE1hdGguZmxvb3IocmdiWzFdICogQ09MT1JfUkFUSU8pO1xuXHR2YXIgYiA9IE1hdGguZmxvb3IocmdiWzJdICogQ09MT1JfUkFUSU8pO1xuXHRyZXR1cm4gciozNiArIGcqNiArIGIqMSArIDE2O1xufVxuLyoqXG4gKiBFeHBvcnQgdG8gTm9kZS5qcyBtb2R1bGVcbiAqL1xuZm9yICh2YXIgcCBpbiBST1QpIHtcblx0ZXhwb3J0c1twXSA9IFJPVFtwXTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoL2ZwJztcbmltcG9ydCBST1QgZnJvbSAncm90LWpzJztcblxubGV0IHdpZHRoLCBoZWlnaHQ7XG4vKipcbiAqIEB0eXBlIHtNYXB9XG4gKi9cbmxldCBtYXA7XG5sZXQgdGlsZVNldDtcbi8qKlxuICogQHR5cGUge1JPVC5EaXNwbGF5fVxuICovXG5sZXQgcmVuZGVyZXI7XG5sZXQgY3Vyc29yID0gWzAsIDBdO1xuXG5mdW5jdGlvbiBzZXRDdXJzb3IoeCwgeSkge1xuICByZXR1cm4gY3Vyc29yID0gW1xuICAgIF8uY2xhbXAoMCwgbWFwLmdldFdpZHRoKCkgLSAxLCB4KSxcbiAgICBfLmNsYW1wKDAsIG1hcC5nZXRIZWlnaHQoKSAtIDEsIHkpXG4gIF07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpc3BsYXkge1xuICBjb25zdHJ1Y3Rvcihfd2lkdGgsIF9oZWlnaHQsIF90aWxlU2V0KSB7XG4gICAgd2lkdGggPSBfd2lkdGg7XG4gICAgaGVpZ2h0ID0gX2hlaWdodDtcbiAgICB0aWxlU2V0ID0gX3RpbGVTZXQ7XG4gICAgcmVuZGVyZXIgPSBuZXcgUk9ULkRpc3BsYXkoXy5hc3NpZ24odGlsZVNldCwge2xheW91dDogJ3RpbGUnLCB3aWR0aCwgaGVpZ2h0fSkpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY3JlZW4nKS5hcHBlbmRDaGlsZChyZW5kZXJlci5nZXRDb250YWluZXIoKSk7XG4gIH1cblxuICBzZXRNYXAoX21hcCkge1xuICAgIG1hcCA9IF9tYXA7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwYW5VcCgpIHtcbiAgICBzZXRDdXJzb3IoY3Vyc29yWzBdLCBjdXJzb3JbMV0gLSAxKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHBhblJpZ2h0KCkge1xuICAgIHNldEN1cnNvcihjdXJzb3JbMF0gKyAxLCBjdXJzb3JbMV0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcGFuRG93bigpIHtcbiAgICBzZXRDdXJzb3IoY3Vyc29yWzBdLCBjdXJzb3JbMV0gKyAxKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHBhbkxlZnQoKSB7XG4gICAgc2V0Q3Vyc29yKGN1cnNvclswXSAtIDEsIGN1cnNvclsxXSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkcmF3KCkge1xuICAgIGNvbnN0IG9mZnNldCA9IFtcbiAgICAgIF8uY2xhbXAoMCwgbWFwLmdldFdpZHRoKCkgLSB3aWR0aCwgY3Vyc29yWzBdIC0gXy5mbG9vcih3aWR0aCAvIDIpKSxcbiAgICAgIF8uY2xhbXAoMCwgbWFwLmdldEhlaWdodCgpIC0gaGVpZ2h0LCBjdXJzb3JbMV0gLSBfLmZsb29yKGhlaWdodCAvIDIpKVxuICAgIF07XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICAgIHJlbmRlcmVyLmRyYXcoeCwgeSwgZ2V0R3JhcGhpYyhtYXAuZ2V0VGlsZSh4ICsgb2Zmc2V0WzBdLCB5ICsgb2Zmc2V0WzFdKS50eXBlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlbmRlcmVyLmRyYXcoY3Vyc29yWzBdIC0gb2Zmc2V0WzBdLCBjdXJzb3JbMV0gLSBvZmZzZXRbMV0sIGdldEdyYXBoaWMoMCkpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzaG93VGV4dCh0ZXh0ID0gbnVsbCkge1xuICAgIGNvbnN0IHRleHRCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGV4dCcpO1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICB0ZXh0Qm94LmlubmVyVGV4dCA9IHRleHQ7XG4gICAgfVxuICAgIHRleHRCb3guc2V0QXR0cmlidXRlKCdjbGFzcycsICcnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGhpZGVUZXh0KCkge1xuICAgIGRvY3VtZW50XG4gICAgICAuZ2V0RWxlbWVudEJ5SWQoJ3RleHQnKVxuICAgICAgLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaGlkZGVuJyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0R3JhcGhpYyhpZCkge1xuICBzd2l0Y2ggKGlkKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuICdjdXJzb3InO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAoWzEsIDIsIDMsIDRdLmluY2x1ZGVzKGlkKSkge1xuICAgICAgICByZXR1cm4gYGdyYXNzJHtpZH1gO1xuICAgICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBfIGZyb20gJ2xvZGFzaC9mcCc7XG5jb25zdCBkYXRhID0ge307XG5sZXQgd2lkdGgsIGhlaWdodDtcblxuY2xhc3MgVGlsZSB7XG4gIGNvbnN0cnVjdG9yKHR5cGUpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldFRpbGUoeCwgeSwgdGlsZSkge1xuICBkYXRhW2Ake3h9LCR7eX1gXSA9IHRpbGU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hcCB7XG4gIGNvbnN0cnVjdG9yKHNyYykge1xuICAgIHdpZHRoID0gc3JjLmxlbmd0aDtcbiAgICBoZWlnaHQgPSBzcmNbMF0ubGVuZ3RoO1xuICAgIHNyYy5mb3JFYWNoKChyb3csIHkpID0+IHtcbiAgICAgIHJvdy5mb3JFYWNoKCh0eXBlLCB4KSA9PiB7XG4gICAgICAgIHNldFRpbGUoeCwgeSwgbmV3IFRpbGUodHlwZSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRXaWR0aCgpIHtcbiAgICByZXR1cm4gd2lkdGg7XG4gIH1cblxuICBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIGhlaWdodDtcbiAgfVxuXG4gIGdldFRpbGUoeCwgeSkge1xuICAgIHJldHVybiBfLmdldChgJHt4fSwke3l9YCwgZGF0YSk7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoL2ZwJztcbmltcG9ydCB7a2V5c1RvVmFscywgZm9yT3duLCBvdmVycmlkZUV2ZW50LCBMb29wfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBEaXNwbGF5IGZyb20gJy4vRGlzcGxheSc7XG5pbXBvcnQgTWFwIGZyb20gJy4vTWFwJztcblxubGV0IHBhdXNlZCA9IGZhbHNlO1xuXG5jb25zdCBtYXAgPSBuZXcgTWFwKFtcbiAgWzEsIDIsIDIsIDEsIDQsIDQsIDQsIDEsIDEsIDFdLFxuICBbMSwgMSwgMiwgMiwgMiwgNCwgNCwgNCwgMywgM10sXG4gIFs0LCA0LCAzLCAyLCAyLCAyLCAyLCAxLCAzLCAzXSxcbiAgWzQsIDQsIDMsIDMsIDIsIDEsIDEsIDEsIDEsIDNdLFxuICBbMSwgMSwgMSwgMSwgMSwgMSwgMSwgMiwgMiwgMV0sXG4gIFsyLCAxLCA0LCA0LCA0LCAzLCAxLCAyLCAyLCAxXSxcbiAgWzIsIDIsIDQsIDQsIDQsIDMsIDMsIDEsIDIsIDFdLFxuICBbMiwgMiwgMSwgMSwgMSwgMywgMywgMSwgNCwgNF0sXG4gIFszLCAzLCAzLCAyLCA0LCA0LCAxLCAxLCA0LCA0XSxcbiAgWzEsIDEsIDMsIDMsIDQsIDQsIDEsIDEsIDEsIDFdXG5dKTtcbmNvbnN0IHRpbGVTaXplID0gWzE2LCAxNl07XG5jb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoNSwgNSwge1xuICB0aWxlU2V0OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGlsZXMnKSxcbiAgYmc6ICd0cmFuc3BhcmVudCcsXG4gIHRpbGVXaWR0aDogdGlsZVNpemVbMF0sXG4gIHRpbGVIZWlnaHQ6IHRpbGVTaXplWzFdLFxuICB0aWxlTWFwOiBmb3JPd24oKHBvcywga2V5LCB0aWxlTWFwKSA9PiB0aWxlTWFwW2tleV0gPSBwb3MubWFwKCh2YWwsIGkpID0+IHZhbCAqIHRpbGVTaXplW2ldKSwge1xuICAgIGdyYXNzMTogWzAsIDBdLFxuICAgIGdyYXNzMjogWzEsIDBdLFxuICAgIGdyYXNzMzogWzIsIDBdLFxuICAgIGdyYXNzNDogWzMsIDBdLFxuICAgIGN1cnNvcjogWzMsIDQyXVxuICB9KVxufSkuc2V0TWFwKG1hcCk7XG5jb25zdCByZW5kZXJMb29wID0gbmV3IExvb3AoNjAsIGRpc3BsYXkuZHJhdykuc3RhcnQoKTtcblxuY29uc3QgY29udHJvbHMgPSB7ZG93bjoge30sIHVwOiB7fX07XG5jb25zdCBrZXlQb3MgPSBrZXlzVG9WYWxzKGNvbnRyb2xzKTtcbmNvbnN0IGNvbW1hbmRzID0gZm9yT3duKChbcG9zLCBjYiwga2V5c10pID0+IGtleXMuZm9yRWFjaChrZXkgPT4gY29udHJvbHNbcG9zXVtrZXldID0gY2IpLCB7XG4gIFNjcm9sbFVwOiBba2V5UG9zLmRvd24sICgpID0+IHBhdXNlZCA/IG51bGwgOiBkaXNwbGF5LnBhblVwKCksIFsnQXJyb3dVcCcsICdLZXlXJ11dLFxuICBTY3JvbGxSaWdodDogW2tleVBvcy5kb3duLCAoKSA9PiBwYXVzZWQgPyBudWxsIDogZGlzcGxheS5wYW5SaWdodCgpLCBbJ0Fycm93UmlnaHQnLCAnS2V5RCddXSxcbiAgU2Nyb2xsRG93bjogW2tleVBvcy5kb3duLCAoKSA9PiBwYXVzZWQgPyBudWxsIDogZGlzcGxheS5wYW5Eb3duKCksIFsnQXJyb3dEb3duJywgJ0tleVMnXV0sXG4gIFNjcm9sbExlZnQ6IFtrZXlQb3MuZG93biwgKCkgPT4gcGF1c2VkID8gbnVsbCA6IGRpc3BsYXkucGFuTGVmdCgpLCBbJ0Fycm93TGVmdCcsICdLZXlBJ11dLFxuICBQYXVzZTogW2tleVBvcy5kb3duLCAoKSA9PiB7XG4gICAgcGF1c2VkID0gIXBhdXNlZDtcbiAgICAocmVuZGVyTG9vcC5pc1J1bm5pbmcoKSA/IHJlbmRlckxvb3Auc3RvcCA6IHJlbmRlckxvb3Auc3RhcnQpLmFwcGx5KHJlbmRlckxvb3ApO1xuICB9LCBbJ1NwYWNlJ11dLFxuICBTaG93SGVscDogW2tleVBvcy5kb3duLCAoKSA9PiB7XG4gICAgXy5mbG93KFtcbiAgICAgIF8udG9QYWlycy5iaW5kKF8pLFxuICAgICAgXy5tYXAuYmluZChfLCAoW3Byb3AsIFtwb3MsIGNiLCBiaW5kaW5nc11dKSA9PiBgJHtwcm9wfTogJHtiaW5kaW5ncy5qb2luKCcsICcpfWApLFxuICAgICAgXy5qb2luLmJpbmQoXywgJ1xcbicpLFxuICAgICAgZGlzcGxheS5zaG93VGV4dC5iaW5kKGRpc3BsYXkpLFxuICAgIF0pKGNvbW1hbmRzKTtcbiAgfSwgWydUYWInXV0sXG4gIEhpZGVIZWxwOiBba2V5UG9zLnVwLCAoKSA9PiBkaXNwbGF5LmhpZGVUZXh0KCksIFsnVGFiJ11dXG59KTtcblxuXy5rZXlzKGNvbnRyb2xzKS5mb3JFYWNoKHBvcyA9PiB3aW5kb3dbYG9ua2V5JHtwb3N9YF0gPSBvdmVycmlkZUV2ZW50KGUgPT4ge1xuICBjb25zdCBjb21tYW5kID0gXy5nZXQoZS5jb2RlLCBjb250cm9sc1twb3NdKTtcbiAgaWYgKF8uaXNGdW5jdGlvbihjb21tYW5kKSkge1xuICAgIGNvbW1hbmQoKTtcbiAgfVxufSkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBrZXlzVG9WYWxzKG9iaikge1xuICBjb25zdCByZXMgPSB7fTtcbiAgZm9yT3duKCh2YWwsIHByb3ApID0+IHJlc1twcm9wXSA9IHByb3AsIG9iaik7XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGZvck93bihjYiwgb2JqKSB7XG4gIGZvciAobGV0IHByb3AgaW4gb2JqKSB7XG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgY2Iob2JqW3Byb3BdLCBwcm9wLCBvYmopO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBvdmVycmlkZUV2ZW50KGNiID0gKCgpID0+IGZhbHNlKSkge1xuICByZXR1cm4gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNiKGUpO1xuICAgIHJldHVybiBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxvb3BJbnRlcnZhbChsb29wKSB7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgbG9vcC5jYigpO1xuICBpZiAobG9vcC5ydW5uaW5nKSB7XG4gICAgc2V0VGltZW91dChsb29wSW50ZXJ2YWwuYmluZCh0aGlzLCBsb29wKSwgbG9vcC50aW1pbmcgLSAoc3RhcnQgLSBuZXcgRGF0ZSgpLmdldE1pbGxpc2Vjb25kcygpKSk7XG4gIH1cbn1cblxuY2xhc3MgTG9vcCB7XG4gIGNvbnN0cnVjdG9yKHRpbWluZywgY2IpIHtcbiAgICB0aGlzLnRpbWluZyA9IHRpbWluZztcbiAgICB0aGlzLmNiID0gY2I7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgdGhpcy5pbnRlcnZhbCA9ICgpID0+IGZhbHNlO1xuICB9XG5cbiAgaXNSdW5uaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnJ1bm5pbmc7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBsb29wSW50ZXJ2YWwuYmluZChsb29wSW50ZXJ2YWwsIHRoaXMpO1xuICAgIHRoaXMuaW50ZXJ2YWwoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgdGhpcy5pbnRlcnZhbCA9ICgpID0+IGZhbHNlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCB7XG4gIGtleXNUb1ZhbHMsXG4gIGZvck93bixcbiAgb3ZlcnJpZGVFdmVudCxcbiAgTG9vcFxufTtcbiJdfQ==
