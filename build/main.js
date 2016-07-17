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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var x = void 0,
    y = void 0;
/**
 * @type {Tile}
 */
var selected = void 0;

/**
 * @type {Map}
 */
var map = void 0;

var Cursor = function () {
  function Cursor(_map, _x, _y, _selected) {
    _classCallCheck(this, Cursor);

    map = _map;
    x = _x;
    y = _y;
    selected = _selected;
  }

  _createClass(Cursor, [{
    key: 'getPos',
    value: function getPos() {
      return [x, y];
    }

    /**
     * @returns {Tile}
     */

  }, {
    key: 'getSelected',
    value: function getSelected() {
      return selected;
    }

    /**
     * @param {Tile} _selected
     * @returns {Cursor}
     */

  }, {
    key: 'setSelected',
    value: function setSelected(_selected) {
      selected = _selected;
      return this;
    }
  }, {
    key: 'panUp',
    value: function panUp() {
      y = _fp2.default.clamp(0, map.getHeight() - 1, y - 1);
      return this;
    }
  }, {
    key: 'panRight',
    value: function panRight() {
      x = _fp2.default.clamp(0, map.getWidth() - 1, x + 1);
      return this;
    }
  }, {
    key: 'panDown',
    value: function panDown() {
      y = _fp2.default.clamp(0, map.getHeight() - 1, y + 1);
      return this;
    }
  }, {
    key: 'panLeft',
    value: function panLeft() {
      x = _fp2.default.clamp(0, map.getWidth() - 1, x - 1);
      return this;
    }
  }]);

  return Cursor;
}();

exports.default = Cursor;

},{"lodash/fp":1}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _rotJs = require('rot-js');

var _rotJs2 = _interopRequireDefault(_rotJs);

var _utils = require('./utils');

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
/**
 * @type {Cursor}
 */
var cursor = void 0;
/**
 * @type {Loop}
 */
var renderLoop = void 0;

var Display = function () {
  function Display(_width, _height, _tileSet, _map, _cursor) {
    _classCallCheck(this, Display);

    width = _width;
    height = _height;
    tileSet = _tileSet;
    map = _map;
    cursor = _cursor;
    renderer = new _rotJs2.default.Display(_fp2.default.assign(tileSet, { layout: 'tile', width: width, height: height }));
    document.getElementById('screen').appendChild(renderer.getContainer());
    renderLoop = new _utils.Loop(60, this.draw);
  }

  _createClass(Display, [{
    key: 'draw',
    value: function draw() {
      var cursorPos = cursor.getPos();
      var offset = [_fp2.default.clamp(0, map.getWidth() - width, cursorPos[0] - _fp2.default.floor(width / 2)), _fp2.default.clamp(0, map.getHeight() - height, cursorPos[1] - _fp2.default.floor(height / 2))];
      for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
          var tileContent = map.getTile(x + offset[0], y + offset[1]).getContents();
          renderer.draw(x, y, tileContent.concat(cursor.getSelected() === _fp2.default.head(tileContent) ? [{ gId: 298 }] : []).map(function (tile) {
            return tile ? tile.gId : null;
          }).filter(Boolean));
        }
      }
      renderer.draw(cursorPos[0] - offset[0], cursorPos[1] - offset[1], 298);

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
  }, {
    key: 'isPaused',
    value: function isPaused() {
      return renderLoop.isRunning();
    }
  }, {
    key: 'pause',
    value: function pause() {
      renderLoop.stop();
      return this;
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      renderLoop.start();
      return this;
    }
  }]);

  return Display;
}();

exports.default = Display;

},{"./utils":15,"lodash/fp":1,"rot-js":7}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var paused = false;

var Game = function () {
  function Game() {
    _classCallCheck(this, Game);
  }

  _createClass(Game, [{
    key: 'isPaused',
    value: function isPaused() {
      return paused;
    }
  }, {
    key: 'pause',
    value: function pause() {
      paused = true;
      return this;
    }
  }, {
    key: 'unpause',
    value: function unpause() {
      paused = false;
      return this;
    }
  }]);

  return Game;
}();

exports.default = Game;

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tiles = {};
var width = void 0,
    height = void 0;

var Tile = function () {
  function Tile(gId) {
    _classCallCheck(this, Tile);

    this.gId = gId;
    this.units = [];
  }

  _createClass(Tile, [{
    key: 'getContents',
    value: function getContents() {
      return [this].concat(this.units).concat(this.selected ? [{ gId: 298 }] : []);
    }
  }, {
    key: 'addUnit',
    value: function addUnit(unit) {
      if (!this.units.includes(unit)) {
        this.units.push(unit);
      }
      return this;
    }
  }]);

  return Tile;
}();

function setTile(collection, x, y, tile) {
  collection[x + ',' + y] = tile;
}

var Map = function () {
  function Map() {
    var _this = this;

    var tilesSrc = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
    var unitsSrc = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, Map);

    width = tilesSrc.length;
    height = tilesSrc[0].length;
    tilesSrc.forEach(function (row, y) {
      row.forEach(function (gId, x) {
        setTile(tiles, x, y, new Tile(gId));
        var unitGId = _fp2.default.get(y + '.' + x, unitsSrc);
        if (unitGId) {
          _this.getTile(x, y).addUnit(new Tile(unitGId));
        }
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
      return _fp2.default.get(x + ',' + y, tiles);
    }
  }]);

  return Map;
}();

exports.default = Map;

},{"lodash/fp":1}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tileSheet = void 0,
    sheetWidth = void 0,
    sheetHeight = void 0,
    tileSize = void 0;

var TileMap = function () {
  function TileMap(_tileSheet, _sheetWidth, _sheetHeight, _tileSize) {
    _classCallCheck(this, TileMap);

    tileSheet = _tileSheet;
    sheetWidth = _sheetWidth;
    sheetHeight = _sheetHeight;
    tileSize = _tileSize;
  }

  _createClass(TileMap, [{
    key: 'buildOptions',
    value: function buildOptions() {
      var tileMap = {};

      for (var y = 0; y < 44; y++) {
        for (var x = 0; x < 7; x++) {
          tileMap[y * 7 + x + 1] = [x, y].map(function (val, i) {
            return val * tileSize[i];
          });
        }
      }

      return {
        tileSet: tileSheet,
        bg: 'transparent',
        tileWidth: tileSize[0],
        tileHeight: tileSize[1],
        tileMap: tileMap
      };
    }
  }]);

  return TileMap;
}();

exports.default = TileMap;

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _utils = require('./utils');

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @type {Game}
 */
var game = void 0;
/**
 * @type {Display}
 */
var display = void 0;
/**
 * @type {Map}
 */
var map = void 0;
/**
 * @type {Cursor}
 */
var cursor = void 0;

var controls = { down: {}, up: {} };
var keyPos = (0, _utils.keysToVals)(controls);

var commands = (0, _utils.forOwn)(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 3);

  var pos = _ref2[0];
  var keys = _ref2[1];
  var cb = _ref2[2];
  return keys.forEach(function (key) {
    return controls[pos][key] = cb;
  });
}, {
  ScrollUp: [keyPos.down, ['ArrowUp', 'KeyW'], function () {
    return game.isPaused() ? null : cursor.panUp();
  }],
  ScrollRight: [keyPos.down, ['ArrowRight', 'KeyD'], function () {
    return game.isPaused() ? null : cursor.panRight();
  }],
  ScrollDown: [keyPos.down, ['ArrowDown', 'KeyS'], function () {
    return game.isPaused() ? null : cursor.panDown();
  }],
  ScrollLeft: [keyPos.down, ['ArrowLeft', 'KeyA'], function () {
    return game.isPaused() ? null : cursor.panLeft();
  }],
  Select: [keyPos.down, ['KeyJ'], function () {
    return cursor.setSelected(map.getTile.apply(map, cursor.getPos()));
  }],
  Pause: [keyPos.down, ['Space'], function () {
    (game.isPaused() ? game.unpause : game.pause).apply(game);
    (display.isPaused() ? display.pause : display.unpause).apply(display);
  }],
  ShowHelp: [keyPos.down, ['Tab'], function () {
    _fp2.default.flow([_fp2.default.toPairs.bind(_fp2.default), _fp2.default.map.bind(_fp2.default, function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2);

      var prop = _ref4[0];

      var _ref4$ = _slicedToArray(_ref4[1], 3);

      var pos = _ref4$[0];
      var keys = _ref4$[1];
      var cb = _ref4$[2];
      return prop + ': ' + keys.join(', ');
    }), _fp2.default.join.bind(_fp2.default, '\n'), display.showText.bind(display)])(commands);
  }],
  HideHelp: [keyPos.up, ['Tab'], function () {
    return display.hideText();
  }]
});

var UI = function () {
  function UI(_game, _display, _map, _cursor) {
    _classCallCheck(this, UI);

    game = _game;
    display = _display;
    map = _map;
    cursor = _cursor;
  }

  _createClass(UI, [{
    key: 'applyKeyBindings',
    value: function applyKeyBindings() {
      _fp2.default.keys(controls).forEach(function (pos) {
        return window['onkey' + pos] = (0, _utils.overrideEvent)(function (e) {
          var command = _fp2.default.get(e.code, controls[pos]);
          if (_fp2.default.isFunction(command)) {
            command();
          }
        });
      });
      return this;
    }
  }]);

  return UI;
}();

exports.default = UI;

},{"./utils":15,"lodash/fp":1}],14:[function(require,module,exports){
'use strict';

var _Display = require('./Display');

var _Display2 = _interopRequireDefault(_Display);

var _Map = require('./Map');

var _Map2 = _interopRequireDefault(_Map);

var _UI = require('./UI');

var _UI2 = _interopRequireDefault(_UI);

var _Game = require('./Game');

var _Game2 = _interopRequireDefault(_Game);

var _cursor = require('./cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _TileMap = require('./TileMap');

var _TileMap2 = _interopRequireDefault(_TileMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var game = new _Game2.default();
var map = new _Map2.default([[1, 2, 2, 1, 4, 4, 4, 1, 1, 1], [1, 1, 2, 2, 2, 4, 4, 4, 3, 3], [4, 4, 3, 2, 2, 2, 2, 1, 3, 3], [4, 4, 3, 3, 2, 1, 1, 1, 1, 3], [1, 1, 1, 1, 1, 1, 1, 2, 2, 1], [2, 1, 4, 4, 4, 3, 1, 2, 2, 1], [2, 2, 4, 4, 4, 3, 3, 1, 2, 1], [2, 2, 1, 1, 1, 3, 3, 1, 4, 4], [3, 3, 3, 2, 4, 4, 1, 1, 4, 4], [1, 1, 3, 3, 4, 4, 1, 1, 1, 1]], [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 91, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]);

var cursor = new _cursor2.default(map, 0, 0);
var tileMap = new _TileMap2.default(document.getElementById('tiles'), 7, 44, [16, 16]);
var display = new _Display2.default(10, 10, tileMap.buildOptions(), map, cursor).unpause();
var ui = new _UI2.default(game, display, map, cursor).applyKeyBindings();

},{"./Display":9,"./Game":10,"./Map":11,"./TileMap":12,"./UI":13,"./cursor":8}],15:[function(require,module,exports){
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
    return false;
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

},{}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ZwLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9mcC9fYmFzZUNvbnZlcnQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ZwL19tYXBwaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9mcC9wbGFjZWhvbGRlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbG9kYXNoLm1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcm90LWpzL2xpYi9yb3QuanMiLCJzcmMvY3Vyc29yLmpzIiwic3JjL0Rpc3BsYXkuanMiLCJzcmMvR2FtZS5qcyIsInNyYy9NYXAuanMiLCJzcmMvVGlsZU1hcC5qcyIsInNyYy9VSS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDLzRLQTs7Ozs7Ozs7QUFFQTs7Ozs7Ozs7QUFFQSxJQUFJLFVBQUo7QUFBQSxJQUFPLFVBQVA7QUFDQTs7O0FBR0EsSUFBSSxpQkFBSjs7QUFFQTs7O0FBR0EsSUFBSSxZQUFKOztJQUVxQixNO0FBQ25CLGtCQUFZLElBQVosRUFBa0IsRUFBbEIsRUFBc0IsRUFBdEIsRUFBMEIsU0FBMUIsRUFBcUM7QUFBQTs7QUFDbkMsVUFBTSxJQUFOO0FBQ0EsUUFBSSxFQUFKO0FBQ0EsUUFBSSxFQUFKO0FBQ0EsZUFBVyxTQUFYO0FBQ0Q7Ozs7NkJBRVE7QUFDUCxhQUFPLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUDtBQUNEOztBQUVEOzs7Ozs7a0NBR2M7QUFDWixhQUFPLFFBQVA7QUFDRDs7QUFFRDs7Ozs7OztnQ0FJWSxTLEVBQVc7QUFDckIsaUJBQVcsU0FBWDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7NEJBRU87QUFDTixVQUFJLGFBQUUsS0FBRixDQUFRLENBQVIsRUFBVyxJQUFJLFNBQUosS0FBa0IsQ0FBN0IsRUFBZ0MsSUFBSSxDQUFwQyxDQUFKO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OzsrQkFFVTtBQUNULFVBQUksYUFBRSxLQUFGLENBQVEsQ0FBUixFQUFXLElBQUksUUFBSixLQUFpQixDQUE1QixFQUErQixJQUFJLENBQW5DLENBQUo7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzhCQUVTO0FBQ1IsVUFBSSxhQUFFLEtBQUYsQ0FBUSxDQUFSLEVBQVcsSUFBSSxTQUFKLEtBQWtCLENBQTdCLEVBQWdDLElBQUksQ0FBcEMsQ0FBSjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7OEJBRVM7QUFDUixVQUFJLGFBQUUsS0FBRixDQUFRLENBQVIsRUFBVyxJQUFJLFFBQUosS0FBaUIsQ0FBNUIsRUFBK0IsSUFBSSxDQUFuQyxDQUFKO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkE5Q2tCLE07OztBQ2ZyQjs7Ozs7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQUksY0FBSjtBQUFBLElBQVcsZUFBWDtBQUNBOzs7QUFHQSxJQUFJLFlBQUo7QUFDQSxJQUFJLGdCQUFKO0FBQ0E7OztBQUdBLElBQUksaUJBQUo7QUFDQTs7O0FBR0EsSUFBSSxlQUFKO0FBQ0E7OztBQUdBLElBQUksbUJBQUo7O0lBRXFCLE87QUFDbkIsbUJBQVksTUFBWixFQUFvQixPQUFwQixFQUE2QixRQUE3QixFQUF1QyxJQUF2QyxFQUE2QyxPQUE3QyxFQUFzRDtBQUFBOztBQUNwRCxZQUFRLE1BQVI7QUFDQSxhQUFTLE9BQVQ7QUFDQSxjQUFVLFFBQVY7QUFDQSxVQUFNLElBQU47QUFDQSxhQUFTLE9BQVQ7QUFDQSxlQUFXLElBQUksZ0JBQUksT0FBUixDQUFnQixhQUFFLE1BQUYsQ0FBUyxPQUFULEVBQWtCLEVBQUMsUUFBUSxNQUFULEVBQWlCLFlBQWpCLEVBQXdCLGNBQXhCLEVBQWxCLENBQWhCLENBQVg7QUFDQSxhQUFTLGNBQVQsQ0FBd0IsUUFBeEIsRUFBa0MsV0FBbEMsQ0FBOEMsU0FBUyxZQUFULEVBQTlDO0FBQ0EsaUJBQWEsZ0JBQVMsRUFBVCxFQUFhLEtBQUssSUFBbEIsQ0FBYjtBQUNEOzs7OzJCQUVNO0FBQ0wsVUFBTSxZQUFZLE9BQU8sTUFBUCxFQUFsQjtBQUNBLFVBQU0sU0FBUyxDQUNiLGFBQUUsS0FBRixDQUFRLENBQVIsRUFBVyxJQUFJLFFBQUosS0FBaUIsS0FBNUIsRUFBbUMsVUFBVSxDQUFWLElBQWUsYUFBRSxLQUFGLENBQVEsUUFBUSxDQUFoQixDQUFsRCxDQURhLEVBRWIsYUFBRSxLQUFGLENBQVEsQ0FBUixFQUFXLElBQUksU0FBSixLQUFrQixNQUE3QixFQUFxQyxVQUFVLENBQVYsSUFBZSxhQUFFLEtBQUYsQ0FBUSxTQUFTLENBQWpCLENBQXBELENBRmEsQ0FBZjtBQUlBLFdBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFwQixFQUEyQixHQUEzQixFQUFnQztBQUM5QixhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBcEIsRUFBNEIsR0FBNUIsRUFBaUM7QUFDL0IsY0FBTSxjQUFjLElBQ2pCLE9BRGlCLENBQ1QsSUFBSSxPQUFPLENBQVAsQ0FESyxFQUNNLElBQUksT0FBTyxDQUFQLENBRFYsRUFFakIsV0FGaUIsRUFBcEI7QUFHQSxtQkFBUyxJQUFULENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixZQUFZLE1BQVosQ0FBbUIsT0FBTyxXQUFQLE9BQXlCLGFBQUUsSUFBRixDQUFPLFdBQVAsQ0FBekIsR0FBK0MsQ0FBQyxFQUFDLEtBQUssR0FBTixFQUFELENBQS9DLEdBQThELEVBQWpGLEVBQ2pCLEdBRGlCLENBQ2I7QUFBQSxtQkFBUSxPQUFPLEtBQUssR0FBWixHQUFrQixJQUExQjtBQUFBLFdBRGEsRUFFakIsTUFGaUIsQ0FFVixPQUZVLENBQXBCO0FBR0Q7QUFDRjtBQUNELGVBQVMsSUFBVCxDQUFjLFVBQVUsQ0FBVixJQUFlLE9BQU8sQ0FBUCxDQUE3QixFQUF3QyxVQUFVLENBQVYsSUFBZSxPQUFPLENBQVAsQ0FBdkQsRUFBa0UsR0FBbEU7O0FBRUEsYUFBTyxJQUFQO0FBQ0Q7OzsrQkFFcUI7QUFBQSxVQUFiLElBQWEseURBQU4sSUFBTTs7QUFDcEIsVUFBTSxVQUFVLFNBQVMsY0FBVCxDQUF3QixNQUF4QixDQUFoQjtBQUNBLFVBQUksSUFBSixFQUFVO0FBQ1IsZ0JBQVEsU0FBUixHQUFvQixJQUFwQjtBQUNEO0FBQ0QsY0FBUSxZQUFSLENBQXFCLE9BQXJCLEVBQThCLEVBQTlCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OzsrQkFFVTtBQUNULGVBQ0csY0FESCxDQUNrQixNQURsQixFQUVHLFlBRkgsQ0FFZ0IsT0FGaEIsRUFFeUIsUUFGekI7QUFHQSxhQUFPLElBQVA7QUFDRDs7OytCQUVVO0FBQ1QsYUFBTyxXQUFXLFNBQVgsRUFBUDtBQUNEOzs7NEJBRU87QUFDTixpQkFBVyxJQUFYO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs4QkFFUztBQUNSLGlCQUFXLEtBQVg7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQTdEa0IsTzs7O0FDekJyQjs7Ozs7Ozs7OztBQUVBLElBQUksU0FBUyxLQUFiOztJQUVxQixJOzs7Ozs7OytCQUNSO0FBQ1QsYUFBTyxNQUFQO0FBQ0Q7Ozs0QkFFTztBQUNOLGVBQVMsSUFBVDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7OEJBRVM7QUFDUixlQUFTLEtBQVQ7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQWJrQixJOzs7QUNKckI7Ozs7Ozs7O0FBRUE7Ozs7Ozs7O0FBQ0EsSUFBTSxRQUFRLEVBQWQ7QUFDQSxJQUFJLGNBQUo7QUFBQSxJQUFXLGVBQVg7O0lBRU0sSTtBQUNKLGdCQUFZLEdBQVosRUFBaUI7QUFBQTs7QUFDZixTQUFLLEdBQUwsR0FBVyxHQUFYO0FBQ0EsU0FBSyxLQUFMLEdBQWEsRUFBYjtBQUNEOzs7O2tDQUVhO0FBQ1osYUFBTyxDQUFDLElBQUQsRUFDSixNQURJLENBQ0csS0FBSyxLQURSLEVBRUosTUFGSSxDQUVHLEtBQUssUUFBTCxHQUFnQixDQUFDLEVBQUMsS0FBSyxHQUFOLEVBQUQsQ0FBaEIsR0FBK0IsRUFGbEMsQ0FBUDtBQUdEOzs7NEJBRU8sSSxFQUFNO0FBQ1osVUFBSSxDQUFDLEtBQUssS0FBTCxDQUFXLFFBQVgsQ0FBb0IsSUFBcEIsQ0FBTCxFQUFnQztBQUM5QixhQUFLLEtBQUwsQ0FBVyxJQUFYLENBQWdCLElBQWhCO0FBQ0Q7QUFDRCxhQUFPLElBQVA7QUFDRDs7Ozs7O0FBR0gsU0FBUyxPQUFULENBQWlCLFVBQWpCLEVBQTZCLENBQTdCLEVBQWdDLENBQWhDLEVBQW1DLElBQW5DLEVBQXlDO0FBQ3ZDLGFBQWMsQ0FBZCxTQUFtQixDQUFuQixJQUEwQixJQUExQjtBQUNEOztJQUVvQixHO0FBQ25CLGlCQUEwQztBQUFBOztBQUFBLFFBQTlCLFFBQThCLHlEQUFuQixFQUFtQjtBQUFBLFFBQWYsUUFBZSx5REFBSixFQUFJOztBQUFBOztBQUN4QyxZQUFRLFNBQVMsTUFBakI7QUFDQSxhQUFTLFNBQVMsQ0FBVCxFQUFZLE1BQXJCO0FBQ0EsYUFBUyxPQUFULENBQWlCLFVBQUMsR0FBRCxFQUFNLENBQU4sRUFBWTtBQUMzQixVQUFJLE9BQUosQ0FBWSxVQUFDLEdBQUQsRUFBTSxDQUFOLEVBQVk7QUFDdEIsZ0JBQVEsS0FBUixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUIsSUFBSSxJQUFKLENBQVMsR0FBVCxDQUFyQjtBQUNBLFlBQU0sVUFBVSxhQUFFLEdBQUYsQ0FBUyxDQUFULFNBQWMsQ0FBZCxFQUFtQixRQUFuQixDQUFoQjtBQUNBLFlBQUksT0FBSixFQUFhO0FBQ1gsZ0JBQ0csT0FESCxDQUNXLENBRFgsRUFDYyxDQURkLEVBRUcsT0FGSCxDQUVXLElBQUksSUFBSixDQUFTLE9BQVQsQ0FGWDtBQUdEO0FBQ0YsT0FSRDtBQVNELEtBVkQ7QUFXRDs7OzsrQkFFVTtBQUNULGFBQU8sS0FBUDtBQUNEOzs7Z0NBRVc7QUFDVixhQUFPLE1BQVA7QUFDRDs7OzRCQUVPLEMsRUFBRyxDLEVBQUc7QUFDWixhQUFPLGFBQUUsR0FBRixDQUFTLENBQVQsU0FBYyxDQUFkLEVBQW1CLEtBQW5CLENBQVA7QUFDRDs7Ozs7O2tCQTNCa0IsRzs7O0FDOUJyQjs7Ozs7Ozs7OztBQUdBLElBQUksa0JBQUo7QUFBQSxJQUFlLG1CQUFmO0FBQUEsSUFBMkIsb0JBQTNCO0FBQUEsSUFBd0MsaUJBQXhDOztJQUVxQixPO0FBQ25CLG1CQUFZLFVBQVosRUFBd0IsV0FBeEIsRUFBcUMsWUFBckMsRUFBbUQsU0FBbkQsRUFBOEQ7QUFBQTs7QUFDNUQsZ0JBQVksVUFBWjtBQUNBLGlCQUFhLFdBQWI7QUFDQSxrQkFBYyxZQUFkO0FBQ0EsZUFBVyxTQUFYO0FBQ0Q7Ozs7bUNBRWM7QUFDYixVQUFNLFVBQVUsRUFBaEI7O0FBRUEsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEVBQXBCLEVBQXdCLEdBQXhCLEVBQTZCO0FBQzNCLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxDQUFwQixFQUF1QixHQUF2QixFQUE0QjtBQUMxQixrQkFBUSxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksQ0FBcEIsSUFBeUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLEdBQVAsQ0FBVyxVQUFDLEdBQUQsRUFBTSxDQUFOO0FBQUEsbUJBQVksTUFBTSxTQUFTLENBQVQsQ0FBbEI7QUFBQSxXQUFYLENBQXpCO0FBQ0Q7QUFDRjs7QUFFRCxhQUFPO0FBQ0wsaUJBQVMsU0FESjtBQUVMLFlBQUksYUFGQztBQUdMLG1CQUFXLFNBQVMsQ0FBVCxDQUhOO0FBSUwsb0JBQVksU0FBUyxDQUFULENBSlA7QUFLTDtBQUxLLE9BQVA7QUFPRDs7Ozs7O2tCQXhCa0IsTzs7O0FDTHJCOzs7Ozs7Ozs7O0FBRUE7O0FBQ0E7Ozs7Ozs7O0FBRUE7OztBQUdBLElBQUksYUFBSjtBQUNBOzs7QUFHQSxJQUFJLGdCQUFKO0FBQ0E7OztBQUdBLElBQUksWUFBSjtBQUNBOzs7QUFHQSxJQUFJLGVBQUo7O0FBRUEsSUFBTSxXQUFXLEVBQUMsTUFBTSxFQUFQLEVBQVcsSUFBSSxFQUFmLEVBQWpCO0FBQ0EsSUFBTSxTQUFTLHVCQUFXLFFBQVgsQ0FBZjs7QUFFQSxJQUFNLFdBQVcsbUJBQU87QUFBQTs7QUFBQSxNQUFFLEdBQUY7QUFBQSxNQUFPLElBQVA7QUFBQSxNQUFhLEVBQWI7QUFBQSxTQUFxQixLQUFLLE9BQUwsQ0FBYTtBQUFBLFdBQU8sU0FBUyxHQUFULEVBQWMsR0FBZCxJQUFxQixFQUE1QjtBQUFBLEdBQWIsQ0FBckI7QUFBQSxDQUFQLEVBQTBFO0FBQ3pGLFlBQVUsQ0FBQyxPQUFPLElBQVIsRUFBYyxDQUFDLFNBQUQsRUFBWSxNQUFaLENBQWQsRUFBbUM7QUFBQSxXQUFNLEtBQUssUUFBTCxLQUFrQixJQUFsQixHQUF5QixPQUFPLEtBQVAsRUFBL0I7QUFBQSxHQUFuQyxDQUQrRTtBQUV6RixlQUFhLENBQUMsT0FBTyxJQUFSLEVBQWMsQ0FBQyxZQUFELEVBQWUsTUFBZixDQUFkLEVBQXNDO0FBQUEsV0FBTSxLQUFLLFFBQUwsS0FBa0IsSUFBbEIsR0FBeUIsT0FBTyxRQUFQLEVBQS9CO0FBQUEsR0FBdEMsQ0FGNEU7QUFHekYsY0FBWSxDQUFDLE9BQU8sSUFBUixFQUFjLENBQUMsV0FBRCxFQUFjLE1BQWQsQ0FBZCxFQUFxQztBQUFBLFdBQU0sS0FBSyxRQUFMLEtBQWtCLElBQWxCLEdBQXlCLE9BQU8sT0FBUCxFQUEvQjtBQUFBLEdBQXJDLENBSDZFO0FBSXpGLGNBQVksQ0FBQyxPQUFPLElBQVIsRUFBYyxDQUFDLFdBQUQsRUFBYyxNQUFkLENBQWQsRUFBcUM7QUFBQSxXQUFNLEtBQUssUUFBTCxLQUFrQixJQUFsQixHQUF5QixPQUFPLE9BQVAsRUFBL0I7QUFBQSxHQUFyQyxDQUo2RTtBQUt6RixVQUFRLENBQUMsT0FBTyxJQUFSLEVBQWMsQ0FBQyxNQUFELENBQWQsRUFBd0I7QUFBQSxXQUFNLE9BQU8sV0FBUCxDQUFtQixJQUFJLE9BQUosQ0FBWSxLQUFaLENBQWtCLEdBQWxCLEVBQXVCLE9BQU8sTUFBUCxFQUF2QixDQUFuQixDQUFOO0FBQUEsR0FBeEIsQ0FMaUY7QUFNekYsU0FBTyxDQUFDLE9BQU8sSUFBUixFQUFjLENBQUMsT0FBRCxDQUFkLEVBQXlCLFlBQU07QUFDcEMsS0FBQyxLQUFLLFFBQUwsS0FBa0IsS0FBSyxPQUF2QixHQUFpQyxLQUFLLEtBQXZDLEVBQThDLEtBQTlDLENBQW9ELElBQXBEO0FBQ0EsS0FBQyxRQUFRLFFBQVIsS0FBcUIsUUFBUSxLQUE3QixHQUFxQyxRQUFRLE9BQTlDLEVBQXVELEtBQXZELENBQTZELE9BQTdEO0FBQ0QsR0FITSxDQU5rRjtBQVV6RixZQUFVLENBQUMsT0FBTyxJQUFSLEVBQWMsQ0FBQyxLQUFELENBQWQsRUFBdUIsWUFBTTtBQUNyQyxpQkFBRSxJQUFGLENBQU8sQ0FDTCxhQUFFLE9BQUYsQ0FBVSxJQUFWLGNBREssRUFFTCxhQUFFLEdBQUYsQ0FBTSxJQUFOLGVBQWM7QUFBQTs7QUFBQSxVQUFFLElBQUY7O0FBQUE7O0FBQUEsVUFBUyxHQUFUO0FBQUEsVUFBYyxJQUFkO0FBQUEsVUFBb0IsRUFBcEI7QUFBQSxhQUFnQyxJQUFoQyxVQUF5QyxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQXpDO0FBQUEsS0FBZCxDQUZLLEVBR0wsYUFBRSxJQUFGLENBQU8sSUFBUCxlQUFlLElBQWYsQ0FISyxFQUlMLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixPQUF0QixDQUpLLENBQVAsRUFLRyxRQUxIO0FBTUQsR0FQUyxDQVYrRTtBQWtCekYsWUFBVSxDQUFDLE9BQU8sRUFBUixFQUFZLENBQUMsS0FBRCxDQUFaLEVBQXFCO0FBQUEsV0FBTSxRQUFRLFFBQVIsRUFBTjtBQUFBLEdBQXJCO0FBbEIrRSxDQUExRSxDQUFqQjs7SUFxQnFCLEU7QUFDbkIsY0FBWSxLQUFaLEVBQW1CLFFBQW5CLEVBQTZCLElBQTdCLEVBQW1DLE9BQW5DLEVBQTRDO0FBQUE7O0FBQzFDLFdBQU8sS0FBUDtBQUNBLGNBQVUsUUFBVjtBQUNBLFVBQU0sSUFBTjtBQUNBLGFBQVMsT0FBVDtBQUNEOzs7O3VDQUVrQjtBQUNqQixtQkFBRSxJQUFGLENBQU8sUUFBUCxFQUFpQixPQUFqQixDQUF5QjtBQUFBLGVBQU8saUJBQWUsR0FBZixJQUF3QiwwQkFBYyxhQUFLO0FBQ3pFLGNBQU0sVUFBVSxhQUFFLEdBQUYsQ0FBTSxFQUFFLElBQVIsRUFBYyxTQUFTLEdBQVQsQ0FBZCxDQUFoQjtBQUNBLGNBQUksYUFBRSxVQUFGLENBQWEsT0FBYixDQUFKLEVBQTJCO0FBQ3pCO0FBQ0Q7QUFDRixTQUx1RCxDQUEvQjtBQUFBLE9BQXpCO0FBTUEsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkFoQmtCLEU7OztBQzlDckI7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxJQUFNLE9BQU8sb0JBQWI7QUFDQSxJQUFNLE1BQU0sa0JBQVEsQ0FDbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQURrQixFQUVsQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBRmtCLEVBR2xCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FIa0IsRUFJbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUprQixFQUtsQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBTGtCLEVBTWxCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FOa0IsRUFPbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVBrQixFQVFsQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBUmtCLEVBU2xCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FUa0IsRUFVbEIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQVZrQixDQUFSLEVBV1QsQ0FDRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBREMsRUFFRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBRkMsRUFHRCxDQUFDLENBQUQsRUFBSSxFQUFKLEVBQVEsQ0FBUixFQUFXLENBQVgsRUFBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLENBQXZCLEVBQTBCLENBQTFCLEVBQTZCLENBQTdCLENBSEMsRUFJRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBSkMsRUFLRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBTEMsRUFNRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBTkMsRUFPRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBUEMsRUFRRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBUkMsRUFTRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBVEMsRUFVRCxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBVkMsQ0FYUyxDQUFaOztBQXlCQSxJQUFNLFNBQVMscUJBQVcsR0FBWCxFQUFnQixDQUFoQixFQUFtQixDQUFuQixDQUFmO0FBQ0EsSUFBTSxVQUFVLHNCQUFZLFNBQVMsY0FBVCxDQUF3QixPQUF4QixDQUFaLEVBQThDLENBQTlDLEVBQWlELEVBQWpELEVBQXFELENBQUMsRUFBRCxFQUFLLEVBQUwsQ0FBckQsQ0FBaEI7QUFDQSxJQUFNLFVBQVUsc0JBQVksRUFBWixFQUFnQixFQUFoQixFQUFvQixRQUFRLFlBQVIsRUFBcEIsRUFBNEMsR0FBNUMsRUFBaUQsTUFBakQsRUFDYixPQURhLEVBQWhCO0FBRUEsSUFBTSxLQUFLLGlCQUFPLElBQVAsRUFBYSxPQUFiLEVBQXNCLEdBQXRCLEVBQTJCLE1BQTNCLEVBQW1DLGdCQUFuQyxFQUFYOzs7QUN2Q0E7Ozs7Ozs7Ozs7QUFFQSxTQUFTLFVBQVQsQ0FBb0IsR0FBcEIsRUFBeUI7QUFDdkIsTUFBTSxNQUFNLEVBQVo7QUFDQSxTQUFPLFVBQUMsR0FBRCxFQUFNLElBQU47QUFBQSxXQUFlLElBQUksSUFBSixJQUFZLElBQTNCO0FBQUEsR0FBUCxFQUF3QyxHQUF4QztBQUNBLFNBQU8sR0FBUDtBQUNEOztBQUVELFNBQVMsTUFBVCxDQUFnQixFQUFoQixFQUFvQixHQUFwQixFQUF5QjtBQUN2QixPQUFLLElBQUksSUFBVCxJQUFpQixHQUFqQixFQUFzQjtBQUNwQixRQUFJLElBQUksY0FBSixDQUFtQixJQUFuQixDQUFKLEVBQThCO0FBQzVCLFNBQUcsSUFBSSxJQUFKLENBQUgsRUFBYyxJQUFkLEVBQW9CLEdBQXBCO0FBQ0Q7QUFDRjtBQUNELFNBQU8sR0FBUDtBQUNEOztBQUVELFNBQVMsYUFBVCxHQUEyQztBQUFBLE1BQXBCLEVBQW9CLHlEQUFkO0FBQUEsV0FBTSxLQUFOO0FBQUEsR0FBYzs7QUFDekMsU0FBTyxhQUFLO0FBQ1YsTUFBRSxjQUFGO0FBQ0EsT0FBRyxDQUFIO0FBQ0EsV0FBTyxLQUFQO0FBQ0QsR0FKRDtBQUtEOztBQUVELFNBQVMsWUFBVCxDQUFzQixJQUF0QixFQUE0QjtBQUMxQixNQUFNLFFBQVEsSUFBSSxJQUFKLEdBQVcsZUFBWCxFQUFkO0FBQ0EsT0FBSyxFQUFMO0FBQ0EsTUFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDaEIsZUFBVyxhQUFhLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0IsSUFBeEIsQ0FBWCxFQUEwQyxLQUFLLE1BQUwsSUFBZSxRQUFRLElBQUksSUFBSixHQUFXLGVBQVgsRUFBdkIsQ0FBMUM7QUFDRDtBQUNGOztJQUVLLEk7QUFDSixnQkFBWSxNQUFaLEVBQW9CLEVBQXBCLEVBQXdCO0FBQUE7O0FBQ3RCLFNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxTQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsU0FBSyxPQUFMLEdBQWUsS0FBZjtBQUNBLFNBQUssUUFBTCxHQUFnQjtBQUFBLGFBQU0sS0FBTjtBQUFBLEtBQWhCO0FBQ0Q7Ozs7Z0NBRVc7QUFDVixhQUFPLEtBQUssT0FBWjtBQUNEOzs7NEJBRU87QUFDTixXQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsV0FBSyxRQUFMLEdBQWdCLGFBQWEsSUFBYixDQUFrQixZQUFsQixFQUFnQyxJQUFoQyxDQUFoQjtBQUNBLFdBQUssUUFBTDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7MkJBRU07QUFDTCxXQUFLLE9BQUwsR0FBZSxLQUFmO0FBQ0EsV0FBSyxRQUFMLEdBQWdCO0FBQUEsZUFBTSxLQUFOO0FBQUEsT0FBaEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O1FBSUQsVSxHQUFBLFU7UUFDQSxNLEdBQUEsTTtRQUNBLGEsR0FBQSxhO1FBQ0EsSSxHQUFBLEkiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaC5taW4nKS5ydW5JbkNvbnRleHQoKTtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9mcC9fYmFzZUNvbnZlcnQnKShfLCBfKTtcbiIsInZhciBtYXBwaW5nID0gcmVxdWlyZSgnLi9fbWFwcGluZycpLFxuICAgIG11dGF0ZU1hcCA9IG1hcHBpbmcubXV0YXRlLFxuICAgIGZhbGxiYWNrSG9sZGVyID0gcmVxdWlyZSgnLi9wbGFjZWhvbGRlcicpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiwgd2l0aCBhbiBhcml0eSBvZiBgbmAsIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCB0aGVcbiAqIGFyZ3VtZW50cyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBuIFRoZSBhcml0eSBvZiB0aGUgbmV3IGZ1bmN0aW9uLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VBcml0eShmdW5jLCBuKSB7XG4gIHJldHVybiBuID09IDJcbiAgICA/IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpOyB9XG4gICAgOiBmdW5jdGlvbihhKSB7IHJldHVybiBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTsgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCwgd2l0aCB1cCB0byBgbmAgYXJndW1lbnRzLCBpZ25vcmluZ1xuICogYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYXAgYXJndW1lbnRzIGZvci5cbiAqIEBwYXJhbSB7bnVtYmVyfSBuIFRoZSBhcml0eSBjYXAuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZUFyeShmdW5jLCBuKSB7XG4gIHJldHVybiBuID09IDJcbiAgICA/IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGZ1bmMoYSwgYik7IH1cbiAgICA6IGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGZ1bmMoYSk7IH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGNsb25lIG9mIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBjbG9uZS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY2xvbmVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBjbG9uZUFycmF5KGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG4gICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIHJlc3VsdFtsZW5ndGhdID0gYXJyYXlbbGVuZ3RoXTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGNsb25lcyBhIGdpdmVuIG9iamVjdCB1c2luZyB0aGUgYXNzaWdubWVudCBgZnVuY2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGFzc2lnbm1lbnQgZnVuY3Rpb24uXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBjbG9uZXIgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNsb25lcihmdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gZnVuYyh7fSwgb2JqZWN0KTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3cmFwcyBgZnVuY2AgYW5kIHVzZXMgYGNsb25lcmAgdG8gY2xvbmUgdGhlIGZpcnN0XG4gKiBhcmd1bWVudCBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gd3JhcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNsb25lciBUaGUgZnVuY3Rpb24gdG8gY2xvbmUgYXJndW1lbnRzLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgaW1tdXRhYmxlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBpbW11dFdyYXAoZnVuYywgY2xvbmVyKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAoIWxlbmd0aCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgdmFyIGFyZ3MgPSBBcnJheShsZW5ndGgpO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgYXJnc1tsZW5ndGhdID0gYXJndW1lbnRzW2xlbmd0aF07XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBhcmdzWzBdID0gY2xvbmVyLmFwcGx5KHVuZGVmaW5lZCwgYXJncyk7XG4gICAgZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGNvbnZlcnRgIHdoaWNoIGFjY2VwdHMgYSBgdXRpbGAgb2JqZWN0IG9mIG1ldGhvZHNcbiAqIHJlcXVpcmVkIHRvIHBlcmZvcm0gY29udmVyc2lvbnMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHV0aWwgVGhlIHV0aWwgb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGZ1bmN0aW9uIHRvIGNvbnZlcnQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmNhcD10cnVlXSBTcGVjaWZ5IGNhcHBpbmcgaXRlcmF0ZWUgYXJndW1lbnRzLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jdXJyeT10cnVlXSBTcGVjaWZ5IGN1cnJ5aW5nLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5maXhlZD10cnVlXSBTcGVjaWZ5IGZpeGVkIGFyaXR5LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5pbW11dGFibGU9dHJ1ZV0gU3BlY2lmeSBpbW11dGFibGUgb3BlcmF0aW9ucy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMucmVhcmc9dHJ1ZV0gU3BlY2lmeSByZWFycmFuZ2luZyBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb258T2JqZWN0fSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgZnVuY3Rpb24gb3Igb2JqZWN0LlxuICovXG5mdW5jdGlvbiBiYXNlQ29udmVydCh1dGlsLCBuYW1lLCBmdW5jLCBvcHRpb25zKSB7XG4gIHZhciBzZXRQbGFjZWhvbGRlcixcbiAgICAgIGlzTGliID0gdHlwZW9mIG5hbWUgPT0gJ2Z1bmN0aW9uJyxcbiAgICAgIGlzT2JqID0gbmFtZSA9PT0gT2JqZWN0KG5hbWUpO1xuXG4gIGlmIChpc09iaikge1xuICAgIG9wdGlvbnMgPSBmdW5jO1xuICAgIGZ1bmMgPSBuYW1lO1xuICAgIG5hbWUgPSB1bmRlZmluZWQ7XG4gIH1cbiAgaWYgKGZ1bmMgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gIH1cbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICB2YXIgY29uZmlnID0ge1xuICAgICdjYXAnOiAnY2FwJyBpbiBvcHRpb25zID8gb3B0aW9ucy5jYXAgOiB0cnVlLFxuICAgICdjdXJyeSc6ICdjdXJyeScgaW4gb3B0aW9ucyA/IG9wdGlvbnMuY3VycnkgOiB0cnVlLFxuICAgICdmaXhlZCc6ICdmaXhlZCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuZml4ZWQgOiB0cnVlLFxuICAgICdpbW11dGFibGUnOiAnaW1tdXRhYmxlJyBpbiBvcHRpb25zID8gb3B0aW9ucy5pbW11dGFibGUgOiB0cnVlLFxuICAgICdyZWFyZyc6ICdyZWFyZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMucmVhcmcgOiB0cnVlXG4gIH07XG5cbiAgdmFyIGZvcmNlQ3VycnkgPSAoJ2N1cnJ5JyBpbiBvcHRpb25zKSAmJiBvcHRpb25zLmN1cnJ5LFxuICAgICAgZm9yY2VGaXhlZCA9ICgnZml4ZWQnIGluIG9wdGlvbnMpICYmIG9wdGlvbnMuZml4ZWQsXG4gICAgICBmb3JjZVJlYXJnID0gKCdyZWFyZycgaW4gb3B0aW9ucykgJiYgb3B0aW9ucy5yZWFyZyxcbiAgICAgIHBsYWNlaG9sZGVyID0gaXNMaWIgPyBmdW5jIDogZmFsbGJhY2tIb2xkZXIsXG4gICAgICBwcmlzdGluZSA9IGlzTGliID8gZnVuYy5ydW5JbkNvbnRleHQoKSA6IHVuZGVmaW5lZDtcblxuICB2YXIgaGVscGVycyA9IGlzTGliID8gZnVuYyA6IHtcbiAgICAnYXJ5JzogdXRpbC5hcnksXG4gICAgJ2Fzc2lnbic6IHV0aWwuYXNzaWduLFxuICAgICdjbG9uZSc6IHV0aWwuY2xvbmUsXG4gICAgJ2N1cnJ5JzogdXRpbC5jdXJyeSxcbiAgICAnZm9yRWFjaCc6IHV0aWwuZm9yRWFjaCxcbiAgICAnaXNBcnJheSc6IHV0aWwuaXNBcnJheSxcbiAgICAnaXNGdW5jdGlvbic6IHV0aWwuaXNGdW5jdGlvbixcbiAgICAnaXRlcmF0ZWUnOiB1dGlsLml0ZXJhdGVlLFxuICAgICdrZXlzJzogdXRpbC5rZXlzLFxuICAgICdyZWFyZyc6IHV0aWwucmVhcmcsXG4gICAgJ3NwcmVhZCc6IHV0aWwuc3ByZWFkLFxuICAgICd0b1BhdGgnOiB1dGlsLnRvUGF0aFxuICB9O1xuXG4gIHZhciBhcnkgPSBoZWxwZXJzLmFyeSxcbiAgICAgIGFzc2lnbiA9IGhlbHBlcnMuYXNzaWduLFxuICAgICAgY2xvbmUgPSBoZWxwZXJzLmNsb25lLFxuICAgICAgY3VycnkgPSBoZWxwZXJzLmN1cnJ5LFxuICAgICAgZWFjaCA9IGhlbHBlcnMuZm9yRWFjaCxcbiAgICAgIGlzQXJyYXkgPSBoZWxwZXJzLmlzQXJyYXksXG4gICAgICBpc0Z1bmN0aW9uID0gaGVscGVycy5pc0Z1bmN0aW9uLFxuICAgICAga2V5cyA9IGhlbHBlcnMua2V5cyxcbiAgICAgIHJlYXJnID0gaGVscGVycy5yZWFyZyxcbiAgICAgIHNwcmVhZCA9IGhlbHBlcnMuc3ByZWFkLFxuICAgICAgdG9QYXRoID0gaGVscGVycy50b1BhdGg7XG5cbiAgdmFyIGFyeU1ldGhvZEtleXMgPSBrZXlzKG1hcHBpbmcuYXJ5TWV0aG9kKTtcblxuICB2YXIgd3JhcHBlcnMgPSB7XG4gICAgJ2Nhc3RBcnJheSc6IGZ1bmN0aW9uKGNhc3RBcnJheSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHJldHVybiBpc0FycmF5KHZhbHVlKVxuICAgICAgICAgID8gY2FzdEFycmF5KGNsb25lQXJyYXkodmFsdWUpKVxuICAgICAgICAgIDogY2FzdEFycmF5LmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfSxcbiAgICAnaXRlcmF0ZWUnOiBmdW5jdGlvbihpdGVyYXRlZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZnVuYyA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIGFyaXR5ID0gYXJndW1lbnRzWzFdLFxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlcmF0ZWUoZnVuYywgYXJpdHkpLFxuICAgICAgICAgICAgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcblxuICAgICAgICBpZiAoY29uZmlnLmNhcCAmJiB0eXBlb2YgYXJpdHkgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBhcml0eSA9IGFyaXR5ID4gMiA/IChhcml0eSAtIDIpIDogMTtcbiAgICAgICAgICByZXR1cm4gKGxlbmd0aCAmJiBsZW5ndGggPD0gYXJpdHkpID8gcmVzdWx0IDogYmFzZUFyeShyZXN1bHQsIGFyaXR5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9LFxuICAgICdtaXhpbic6IGZ1bmN0aW9uKG1peGluKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgIHZhciBmdW5jID0gdGhpcztcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgICAgcmV0dXJuIG1peGluKGZ1bmMsIE9iamVjdChzb3VyY2UpKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFpcnMgPSBbXTtcbiAgICAgICAgZWFjaChrZXlzKHNvdXJjZSksIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHNvdXJjZVtrZXldKSkge1xuICAgICAgICAgICAgcGFpcnMucHVzaChba2V5LCBmdW5jLnByb3RvdHlwZVtrZXldXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtaXhpbihmdW5jLCBPYmplY3Qoc291cmNlKSk7XG5cbiAgICAgICAgZWFjaChwYWlycywgZnVuY3Rpb24ocGFpcikge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHBhaXJbMV07XG4gICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgICAgICBmdW5jLnByb3RvdHlwZVtwYWlyWzBdXSA9IHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgZnVuYy5wcm90b3R5cGVbcGFpclswXV07XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZ1bmM7XG4gICAgICB9O1xuICAgIH0sXG4gICAgJ3J1bkluQ29udGV4dCc6IGZ1bmN0aW9uKHJ1bkluQ29udGV4dCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIGJhc2VDb252ZXJ0KHV0aWwsIHJ1bkluQ29udGV4dChjb250ZXh0KSwgb3B0aW9ucyk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNsb25lIG9mIGBvYmplY3RgIGJ5IGBwYXRoYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNsb25lLlxuICAgKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCB0byBjbG9uZSBieS5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgY2xvbmVkIG9iamVjdC5cbiAgICovXG4gIGZ1bmN0aW9uIGNsb25lQnlQYXRoKG9iamVjdCwgcGF0aCkge1xuICAgIHBhdGggPSB0b1BhdGgocGF0aCk7XG5cbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gcGF0aC5sZW5ndGgsXG4gICAgICAgIGxhc3RJbmRleCA9IGxlbmd0aCAtIDEsXG4gICAgICAgIHJlc3VsdCA9IGNsb25lKE9iamVjdChvYmplY3QpKSxcbiAgICAgICAgbmVzdGVkID0gcmVzdWx0O1xuXG4gICAgd2hpbGUgKG5lc3RlZCAhPSBudWxsICYmICsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHZhciBrZXkgPSBwYXRoW2luZGV4XSxcbiAgICAgICAgICB2YWx1ZSA9IG5lc3RlZFtrZXldO1xuXG4gICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICBuZXN0ZWRbcGF0aFtpbmRleF1dID0gY2xvbmUoaW5kZXggPT0gbGFzdEluZGV4ID8gdmFsdWUgOiBPYmplY3QodmFsdWUpKTtcbiAgICAgIH1cbiAgICAgIG5lc3RlZCA9IG5lc3RlZFtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGBsb2Rhc2hgIHRvIGFuIGltbXV0YWJsZSBhdXRvLWN1cnJpZWQgaXRlcmF0ZWUtZmlyc3QgZGF0YS1sYXN0XG4gICAqIHZlcnNpb24gd2l0aCBjb252ZXJzaW9uIGBvcHRpb25zYCBhcHBsaWVkLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFRoZSBvcHRpb25zIG9iamVjdC4gU2VlIGBiYXNlQ29udmVydGAgZm9yIG1vcmUgZGV0YWlscy5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgYGxvZGFzaGAuXG4gICAqL1xuICBmdW5jdGlvbiBjb252ZXJ0TGliKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gXy5ydW5JbkNvbnRleHQuY29udmVydChvcHRpb25zKSh1bmRlZmluZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIGNvbnZlcnRlciBmdW5jdGlvbiBmb3IgYGZ1bmNgIG9mIGBuYW1lYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGZ1bmN0aW9uIHRvIGNvbnZlcnQuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNvbnZlcnQuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGNvbnZlcnRlciBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUNvbnZlcnRlcihuYW1lLCBmdW5jKSB7XG4gICAgdmFyIG9sZE9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHJldHVybiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgbmV3VXRpbCA9IGlzTGliID8gcHJpc3RpbmUgOiBoZWxwZXJzLFxuICAgICAgICAgIG5ld0Z1bmMgPSBpc0xpYiA/IHByaXN0aW5lW25hbWVdIDogZnVuYyxcbiAgICAgICAgICBuZXdPcHRpb25zID0gYXNzaWduKGFzc2lnbih7fSwgb2xkT3B0aW9ucyksIG9wdGlvbnMpO1xuXG4gICAgICByZXR1cm4gYmFzZUNvbnZlcnQobmV3VXRpbCwgbmFtZSwgbmV3RnVuYywgbmV3T3B0aW9ucyk7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3cmFwcyBgZnVuY2AgdG8gaW52b2tlIGl0cyBpdGVyYXRlZSwgd2l0aCB1cCB0byBgbmBcbiAgICogYXJndW1lbnRzLCBpZ25vcmluZyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBpdGVyYXRlZSBhcmd1bWVudHMgZm9yLlxuICAgKiBAcGFyYW0ge251bWJlcn0gbiBUaGUgYXJpdHkgY2FwLlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGl0ZXJhdGVlQXJ5KGZ1bmMsIG4pIHtcbiAgICByZXR1cm4gb3ZlckFyZyhmdW5jLCBmdW5jdGlvbihmdW5jKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJyA/IGJhc2VBcnkoZnVuYywgbikgOiBmdW5jO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHdyYXBzIGBmdW5jYCB0byBpbnZva2UgaXRzIGl0ZXJhdGVlIHdpdGggYXJndW1lbnRzXG4gICAqIGFycmFuZ2VkIGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkIGBpbmRleGVzYCB3aGVyZSB0aGUgYXJndW1lbnQgdmFsdWUgYXRcbiAgICogdGhlIGZpcnN0IGluZGV4IGlzIHByb3ZpZGVkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCwgdGhlIGFyZ3VtZW50IHZhbHVlIGF0XG4gICAqIHRoZSBzZWNvbmQgaW5kZXggaXMgcHJvdmlkZWQgYXMgdGhlIHNlY29uZCBhcmd1bWVudCwgYW5kIHNvIG9uLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byByZWFycmFuZ2UgaXRlcmF0ZWUgYXJndW1lbnRzIGZvci5cbiAgICogQHBhcmFtIHtudW1iZXJbXX0gaW5kZXhlcyBUaGUgYXJyYW5nZWQgYXJndW1lbnQgaW5kZXhlcy5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBpdGVyYXRlZVJlYXJnKGZ1bmMsIGluZGV4ZXMpIHtcbiAgICByZXR1cm4gb3ZlckFyZyhmdW5jLCBmdW5jdGlvbihmdW5jKSB7XG4gICAgICB2YXIgbiA9IGluZGV4ZXMubGVuZ3RoO1xuICAgICAgcmV0dXJuIGJhc2VBcml0eShyZWFyZyhiYXNlQXJ5KGZ1bmMsIG4pLCBpbmRleGVzKSwgbik7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCBpdHMgZmlyc3QgYXJndW1lbnQgcGFzc2VkXG4gICAqIHRocnUgYHRyYW5zZm9ybWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IHRyYW5zZm9ybSBUaGUgZnVuY3Rpb25zIHRvIHRyYW5zZm9ybSB0aGUgZmlyc3QgYXJndW1lbnQuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gb3ZlckFyZyhmdW5jLCB0cmFuc2Zvcm0pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmdW5jKCk7XG4gICAgICB9XG4gICAgICB2YXIgYXJncyA9IEFycmF5KGxlbmd0aCk7XG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgYXJnc1tsZW5ndGhdID0gYXJndW1lbnRzW2xlbmd0aF07XG4gICAgICB9XG4gICAgICB2YXIgaW5kZXggPSBjb25maWcucmVhcmcgPyAwIDogKGxlbmd0aCAtIDEpO1xuICAgICAgYXJnc1tpbmRleF0gPSB0cmFuc2Zvcm0oYXJnc1tpbmRleF0pO1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHdyYXBzIGBmdW5jYCBhbmQgYXBwbHlzIHRoZSBjb252ZXJzaW9uc1xuICAgKiBydWxlcyBieSBgbmFtZWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIGNvbnZlcnRlZCBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIHdyYXAobmFtZSwgZnVuYykge1xuICAgIG5hbWUgPSBtYXBwaW5nLmFsaWFzVG9SZWFsW25hbWVdIHx8IG5hbWU7XG5cbiAgICB2YXIgcmVzdWx0LFxuICAgICAgICB3cmFwcGVkID0gZnVuYyxcbiAgICAgICAgd3JhcHBlciA9IHdyYXBwZXJzW25hbWVdO1xuXG4gICAgaWYgKHdyYXBwZXIpIHtcbiAgICAgIHdyYXBwZWQgPSB3cmFwcGVyKGZ1bmMpO1xuICAgIH1cbiAgICBlbHNlIGlmIChjb25maWcuaW1tdXRhYmxlKSB7XG4gICAgICBpZiAobXV0YXRlTWFwLmFycmF5W25hbWVdKSB7XG4gICAgICAgIHdyYXBwZWQgPSBpbW11dFdyYXAoZnVuYywgY2xvbmVBcnJheSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChtdXRhdGVNYXAub2JqZWN0W25hbWVdKSB7XG4gICAgICAgIHdyYXBwZWQgPSBpbW11dFdyYXAoZnVuYywgY3JlYXRlQ2xvbmVyKGZ1bmMpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG11dGF0ZU1hcC5zZXRbbmFtZV0pIHtcbiAgICAgICAgd3JhcHBlZCA9IGltbXV0V3JhcChmdW5jLCBjbG9uZUJ5UGF0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVhY2goYXJ5TWV0aG9kS2V5cywgZnVuY3Rpb24oYXJ5S2V5KSB7XG4gICAgICBlYWNoKG1hcHBpbmcuYXJ5TWV0aG9kW2FyeUtleV0sIGZ1bmN0aW9uKG90aGVyTmFtZSkge1xuICAgICAgICBpZiAobmFtZSA9PSBvdGhlck5hbWUpIHtcbiAgICAgICAgICB2YXIgYXJ5TiA9ICFpc0xpYiAmJiBtYXBwaW5nLml0ZXJhdGVlQXJ5W25hbWVdLFxuICAgICAgICAgICAgICByZWFyZ0luZGV4ZXMgPSBtYXBwaW5nLml0ZXJhdGVlUmVhcmdbbmFtZV0sXG4gICAgICAgICAgICAgIHNwcmVhZFN0YXJ0ID0gbWFwcGluZy5tZXRob2RTcHJlYWRbbmFtZV07XG5cbiAgICAgICAgICByZXN1bHQgPSB3cmFwcGVkO1xuICAgICAgICAgIGlmIChjb25maWcuZml4ZWQgJiYgKGZvcmNlRml4ZWQgfHwgIW1hcHBpbmcuc2tpcEZpeGVkW25hbWVdKSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gc3ByZWFkU3RhcnQgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICA/IGFyeShyZXN1bHQsIGFyeUtleSlcbiAgICAgICAgICAgICAgOiBzcHJlYWQocmVzdWx0LCBzcHJlYWRTdGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjb25maWcucmVhcmcgJiYgYXJ5S2V5ID4gMSAmJiAoZm9yY2VSZWFyZyB8fCAhbWFwcGluZy5za2lwUmVhcmdbbmFtZV0pKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWFyZyhyZXN1bHQsIG1hcHBpbmcubWV0aG9kUmVhcmdbbmFtZV0gfHwgbWFwcGluZy5hcnlSZWFyZ1thcnlLZXldKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNvbmZpZy5jYXApIHtcbiAgICAgICAgICAgIGlmIChyZWFyZ0luZGV4ZXMpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gaXRlcmF0ZWVSZWFyZyhyZXN1bHQsIHJlYXJnSW5kZXhlcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFyeU4pIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gaXRlcmF0ZWVBcnkocmVzdWx0LCBhcnlOKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGZvcmNlQ3VycnkgfHwgKGNvbmZpZy5jdXJyeSAmJiBhcnlLZXkgPiAxKSkge1xuICAgICAgICAgICAgZm9yY2VDdXJyeSAgJiYgY29uc29sZS5sb2coZm9yY2VDdXJyeSwgbmFtZSk7XG4gICAgICAgICAgICByZXN1bHQgPSBjdXJyeShyZXN1bHQsIGFyeUtleSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gIXJlc3VsdDtcbiAgICB9KTtcblxuICAgIHJlc3VsdCB8fCAocmVzdWx0ID0gd3JhcHBlZCk7XG4gICAgaWYgKHJlc3VsdCA9PSBmdW5jKSB7XG4gICAgICByZXN1bHQgPSBmb3JjZUN1cnJ5ID8gY3VycnkocmVzdWx0LCAxKSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmVzdWx0LmNvbnZlcnQgPSBjcmVhdGVDb252ZXJ0ZXIobmFtZSwgZnVuYyk7XG4gICAgaWYgKG1hcHBpbmcucGxhY2Vob2xkZXJbbmFtZV0pIHtcbiAgICAgIHNldFBsYWNlaG9sZGVyID0gdHJ1ZTtcbiAgICAgIHJlc3VsdC5wbGFjZWhvbGRlciA9IGZ1bmMucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIGlmICghaXNPYmopIHtcbiAgICByZXR1cm4gd3JhcChuYW1lLCBmdW5jKTtcbiAgfVxuICB2YXIgXyA9IGZ1bmM7XG5cbiAgLy8gQ29udmVydCBtZXRob2RzIGJ5IGFyeSBjYXAuXG4gIHZhciBwYWlycyA9IFtdO1xuICBlYWNoKGFyeU1ldGhvZEtleXMsIGZ1bmN0aW9uKGFyeUtleSkge1xuICAgIGVhY2gobWFwcGluZy5hcnlNZXRob2RbYXJ5S2V5XSwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgZnVuYyA9IF9bbWFwcGluZy5yZW1hcFtrZXldIHx8IGtleV07XG4gICAgICBpZiAoZnVuYykge1xuICAgICAgICBwYWlycy5wdXNoKFtrZXksIHdyYXAoa2V5LCBmdW5jKV0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICAvLyBDb252ZXJ0IHJlbWFpbmluZyBtZXRob2RzLlxuICBlYWNoKGtleXMoXyksIGZ1bmN0aW9uKGtleSkge1xuICAgIHZhciBmdW5jID0gX1trZXldO1xuICAgIGlmICh0eXBlb2YgZnVuYyA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgbGVuZ3RoID0gcGFpcnMubGVuZ3RoO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIGlmIChwYWlyc1tsZW5ndGhdWzBdID09IGtleSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuYy5jb252ZXJ0ID0gY3JlYXRlQ29udmVydGVyKGtleSwgZnVuYyk7XG4gICAgICBwYWlycy5wdXNoKFtrZXksIGZ1bmNdKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIEFzc2lnbiB0byBgX2AgbGVhdmluZyBgXy5wcm90b3R5cGVgIHVuY2hhbmdlZCB0byBhbGxvdyBjaGFpbmluZy5cbiAgZWFjaChwYWlycywgZnVuY3Rpb24ocGFpcikge1xuICAgIF9bcGFpclswXV0gPSBwYWlyWzFdO1xuICB9KTtcblxuICBfLmNvbnZlcnQgPSBjb252ZXJ0TGliO1xuICBpZiAoc2V0UGxhY2Vob2xkZXIpIHtcbiAgICBfLnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XG4gIH1cbiAgLy8gQXNzaWduIGFsaWFzZXMuXG4gIGVhY2goa2V5cyhfKSwgZnVuY3Rpb24oa2V5KSB7XG4gICAgZWFjaChtYXBwaW5nLnJlYWxUb0FsaWFzW2tleV0gfHwgW10sIGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICBfW2FsaWFzXSA9IF9ba2V5XTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIF87XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNvbnZlcnQ7XG4iLCIvKiogVXNlZCB0byBtYXAgYWxpYXNlcyB0byB0aGVpciByZWFsIG5hbWVzLiAqL1xuZXhwb3J0cy5hbGlhc1RvUmVhbCA9IHtcblxuICAvLyBMb2Rhc2ggYWxpYXNlcy5cbiAgJ2VhY2gnOiAnZm9yRWFjaCcsXG4gICdlYWNoUmlnaHQnOiAnZm9yRWFjaFJpZ2h0JyxcbiAgJ2VudHJpZXMnOiAndG9QYWlycycsXG4gICdlbnRyaWVzSW4nOiAndG9QYWlyc0luJyxcbiAgJ2V4dGVuZCc6ICdhc3NpZ25JbicsXG4gICdleHRlbmRXaXRoJzogJ2Fzc2lnbkluV2l0aCcsXG4gICdmaXJzdCc6ICdoZWFkJyxcblxuICAvLyBSYW1kYSBhbGlhc2VzLlxuICAnX18nOiAncGxhY2Vob2xkZXInLFxuICAnYWxsJzogJ2V2ZXJ5JyxcbiAgJ2FsbFBhc3MnOiAnb3ZlckV2ZXJ5JyxcbiAgJ2Fsd2F5cyc6ICdjb25zdGFudCcsXG4gICdhbnknOiAnc29tZScsXG4gICdhbnlQYXNzJzogJ292ZXJTb21lJyxcbiAgJ2FwcGx5JzogJ3NwcmVhZCcsXG4gICdhc3NvYyc6ICdzZXQnLFxuICAnYXNzb2NQYXRoJzogJ3NldCcsXG4gICdjb21wbGVtZW50JzogJ25lZ2F0ZScsXG4gICdjb21wb3NlJzogJ2Zsb3dSaWdodCcsXG4gICdjb250YWlucyc6ICdpbmNsdWRlcycsXG4gICdkaXNzb2MnOiAndW5zZXQnLFxuICAnZGlzc29jUGF0aCc6ICd1bnNldCcsXG4gICdlcXVhbHMnOiAnaXNFcXVhbCcsXG4gICdpZGVudGljYWwnOiAnZXEnLFxuICAnaW5pdCc6ICdpbml0aWFsJyxcbiAgJ2ludmVydE9iaic6ICdpbnZlcnQnLFxuICAnanV4dCc6ICdvdmVyJyxcbiAgJ29taXRBbGwnOiAnb21pdCcsXG4gICduQXJ5JzogJ2FyeScsXG4gICdwYXRoJzogJ2dldCcsXG4gICdwYXRoRXEnOiAnbWF0Y2hlc1Byb3BlcnR5JyxcbiAgJ3BhdGhPcic6ICdnZXRPcicsXG4gICdwYXRocyc6ICdhdCcsXG4gICdwaWNrQWxsJzogJ3BpY2snLFxuICAncGlwZSc6ICdmbG93JyxcbiAgJ3BsdWNrJzogJ21hcCcsXG4gICdwcm9wJzogJ2dldCcsXG4gICdwcm9wRXEnOiAnbWF0Y2hlc1Byb3BlcnR5JyxcbiAgJ3Byb3BPcic6ICdnZXRPcicsXG4gICdwcm9wcyc6ICdhdCcsXG4gICd1bmFwcGx5JzogJ3Jlc3QnLFxuICAndW5uZXN0JzogJ2ZsYXR0ZW4nLFxuICAndXNlV2l0aCc6ICdvdmVyQXJncycsXG4gICd3aGVyZUVxJzogJ2ZpbHRlcicsXG4gICd6aXBPYmonOiAnemlwT2JqZWN0J1xufTtcblxuLyoqIFVzZWQgdG8gbWFwIGFyeSB0byBtZXRob2QgbmFtZXMuICovXG5leHBvcnRzLmFyeU1ldGhvZCA9IHtcbiAgJzEnOiBbXG4gICAgJ2F0dGVtcHQnLCAnY2FzdEFycmF5JywgJ2NlaWwnLCAnY3JlYXRlJywgJ2N1cnJ5JywgJ2N1cnJ5UmlnaHQnLCAnZmxvb3InLFxuICAgICdmbG93JywgJ2Zsb3dSaWdodCcsICdmcm9tUGFpcnMnLCAnaW52ZXJ0JywgJ2l0ZXJhdGVlJywgJ21lbW9pemUnLCAnbWV0aG9kJyxcbiAgICAnbWV0aG9kT2YnLCAnbWl4aW4nLCAnb3ZlcicsICdvdmVyRXZlcnknLCAnb3ZlclNvbWUnLCAncmVzdCcsICdyZXZlcnNlJyxcbiAgICAncm91bmQnLCAncnVuSW5Db250ZXh0JywgJ3NwcmVhZCcsICd0ZW1wbGF0ZScsICd0cmltJywgJ3RyaW1FbmQnLCAndHJpbVN0YXJ0JyxcbiAgICAndW5pcXVlSWQnLCAnd29yZHMnXG4gIF0sXG4gICcyJzogW1xuICAgICdhZGQnLCAnYWZ0ZXInLCAnYXJ5JywgJ2Fzc2lnbicsICdhc3NpZ25JbicsICdhdCcsICdiZWZvcmUnLCAnYmluZCcsICdiaW5kQWxsJyxcbiAgICAnYmluZEtleScsICdjaHVuaycsICdjbG9uZURlZXBXaXRoJywgJ2Nsb25lV2l0aCcsICdjb25jYXQnLCAnY291bnRCeScsICdjdXJyeU4nLFxuICAgICdjdXJyeVJpZ2h0TicsICdkZWJvdW5jZScsICdkZWZhdWx0cycsICdkZWZhdWx0c0RlZXAnLCAnZGVsYXknLCAnZGlmZmVyZW5jZScsXG4gICAgJ2RpdmlkZScsICdkcm9wJywgJ2Ryb3BSaWdodCcsICdkcm9wUmlnaHRXaGlsZScsICdkcm9wV2hpbGUnLCAnZW5kc1dpdGgnLFxuICAgICdlcScsICdldmVyeScsICdmaWx0ZXInLCAnZmluZCcsICdmaW5kSW5kZXgnLCAnZmluZEtleScsICdmaW5kTGFzdCcsXG4gICAgJ2ZpbmRMYXN0SW5kZXgnLCAnZmluZExhc3RLZXknLCAnZmxhdE1hcCcsICdmbGF0TWFwRGVlcCcsICdmbGF0dGVuRGVwdGgnLFxuICAgICdmb3JFYWNoJywgJ2ZvckVhY2hSaWdodCcsICdmb3JJbicsICdmb3JJblJpZ2h0JywgJ2Zvck93bicsICdmb3JPd25SaWdodCcsXG4gICAgJ2dldCcsICdncm91cEJ5JywgJ2d0JywgJ2d0ZScsICdoYXMnLCAnaGFzSW4nLCAnaW5jbHVkZXMnLCAnaW5kZXhPZicsXG4gICAgJ2ludGVyc2VjdGlvbicsICdpbnZlcnRCeScsICdpbnZva2UnLCAnaW52b2tlTWFwJywgJ2lzRXF1YWwnLCAnaXNNYXRjaCcsXG4gICAgJ2pvaW4nLCAna2V5QnknLCAnbGFzdEluZGV4T2YnLCAnbHQnLCAnbHRlJywgJ21hcCcsICdtYXBLZXlzJywgJ21hcFZhbHVlcycsXG4gICAgJ21hdGNoZXNQcm9wZXJ0eScsICdtYXhCeScsICdtZWFuQnknLCAnbWVyZ2UnLCAnbWluQnknLCAnbXVsdGlwbHknLCAnbnRoJyxcbiAgICAnb21pdCcsICdvbWl0QnknLCAnb3ZlckFyZ3MnLCAncGFkJywgJ3BhZEVuZCcsICdwYWRTdGFydCcsICdwYXJzZUludCcsXG4gICAgJ3BhcnRpYWwnLCAncGFydGlhbFJpZ2h0JywgJ3BhcnRpdGlvbicsICdwaWNrJywgJ3BpY2tCeScsICdwdWxsJywgJ3B1bGxBbGwnLFxuICAgICdwdWxsQXQnLCAncmFuZG9tJywgJ3JhbmdlJywgJ3JhbmdlUmlnaHQnLCAncmVhcmcnLCAncmVqZWN0JywgJ3JlbW92ZScsXG4gICAgJ3JlcGVhdCcsICdyZXN0RnJvbScsICdyZXN1bHQnLCAnc2FtcGxlU2l6ZScsICdzb21lJywgJ3NvcnRCeScsICdzb3J0ZWRJbmRleCcsXG4gICAgJ3NvcnRlZEluZGV4T2YnLCAnc29ydGVkTGFzdEluZGV4JywgJ3NvcnRlZExhc3RJbmRleE9mJywgJ3NvcnRlZFVuaXFCeScsXG4gICAgJ3NwbGl0JywgJ3NwcmVhZEZyb20nLCAnc3RhcnRzV2l0aCcsICdzdWJ0cmFjdCcsICdzdW1CeScsICd0YWtlJywgJ3Rha2VSaWdodCcsXG4gICAgJ3Rha2VSaWdodFdoaWxlJywgJ3Rha2VXaGlsZScsICd0YXAnLCAndGhyb3R0bGUnLCAndGhydScsICd0aW1lcycsICd0cmltQ2hhcnMnLFxuICAgICd0cmltQ2hhcnNFbmQnLCAndHJpbUNoYXJzU3RhcnQnLCAndHJ1bmNhdGUnLCAndW5pb24nLCAndW5pcUJ5JywgJ3VuaXFXaXRoJyxcbiAgICAndW5zZXQnLCAndW56aXBXaXRoJywgJ3dpdGhvdXQnLCAnd3JhcCcsICd4b3InLCAnemlwJywgJ3ppcE9iamVjdCcsXG4gICAgJ3ppcE9iamVjdERlZXAnXG4gIF0sXG4gICczJzogW1xuICAgICdhc3NpZ25JbldpdGgnLCAnYXNzaWduV2l0aCcsICdjbGFtcCcsICdkaWZmZXJlbmNlQnknLCAnZGlmZmVyZW5jZVdpdGgnLFxuICAgICdmaW5kRnJvbScsICdmaW5kSW5kZXhGcm9tJywgJ2ZpbmRMYXN0RnJvbScsICdmaW5kTGFzdEluZGV4RnJvbScsICdnZXRPcicsXG4gICAgJ2luY2x1ZGVzRnJvbScsICdpbmRleE9mRnJvbScsICdpblJhbmdlJywgJ2ludGVyc2VjdGlvbkJ5JywgJ2ludGVyc2VjdGlvbldpdGgnLFxuICAgICdpbnZva2VBcmdzJywgJ2ludm9rZUFyZ3NNYXAnLCAnaXNFcXVhbFdpdGgnLCAnaXNNYXRjaFdpdGgnLCAnZmxhdE1hcERlcHRoJyxcbiAgICAnbGFzdEluZGV4T2ZGcm9tJywgJ21lcmdlV2l0aCcsICdvcmRlckJ5JywgJ3BhZENoYXJzJywgJ3BhZENoYXJzRW5kJyxcbiAgICAncGFkQ2hhcnNTdGFydCcsICdwdWxsQWxsQnknLCAncHVsbEFsbFdpdGgnLCAncmVkdWNlJywgJ3JlZHVjZVJpZ2h0JywgJ3JlcGxhY2UnLFxuICAgICdzZXQnLCAnc2xpY2UnLCAnc29ydGVkSW5kZXhCeScsICdzb3J0ZWRMYXN0SW5kZXhCeScsICd0cmFuc2Zvcm0nLCAndW5pb25CeScsXG4gICAgJ3VuaW9uV2l0aCcsICd1cGRhdGUnLCAneG9yQnknLCAneG9yV2l0aCcsICd6aXBXaXRoJ1xuICBdLFxuICAnNCc6IFtcbiAgICAnZmlsbCcsICdzZXRXaXRoJywgJ3VwZGF0ZVdpdGgnXG4gIF1cbn07XG5cbi8qKiBVc2VkIHRvIG1hcCBhcnkgdG8gcmVhcmcgY29uZmlncy4gKi9cbmV4cG9ydHMuYXJ5UmVhcmcgPSB7XG4gICcyJzogWzEsIDBdLFxuICAnMyc6IFsyLCAwLCAxXSxcbiAgJzQnOiBbMywgMiwgMCwgMV1cbn07XG5cbi8qKiBVc2VkIHRvIG1hcCBtZXRob2QgbmFtZXMgdG8gdGhlaXIgaXRlcmF0ZWUgYXJ5LiAqL1xuZXhwb3J0cy5pdGVyYXRlZUFyeSA9IHtcbiAgJ2Ryb3BSaWdodFdoaWxlJzogMSxcbiAgJ2Ryb3BXaGlsZSc6IDEsXG4gICdldmVyeSc6IDEsXG4gICdmaWx0ZXInOiAxLFxuICAnZmluZCc6IDEsXG4gICdmaW5kRnJvbSc6IDEsXG4gICdmaW5kSW5kZXgnOiAxLFxuICAnZmluZEluZGV4RnJvbSc6IDEsXG4gICdmaW5kS2V5JzogMSxcbiAgJ2ZpbmRMYXN0JzogMSxcbiAgJ2ZpbmRMYXN0RnJvbSc6IDEsXG4gICdmaW5kTGFzdEluZGV4JzogMSxcbiAgJ2ZpbmRMYXN0SW5kZXhGcm9tJzogMSxcbiAgJ2ZpbmRMYXN0S2V5JzogMSxcbiAgJ2ZsYXRNYXAnOiAxLFxuICAnZmxhdE1hcERlZXAnOiAxLFxuICAnZmxhdE1hcERlcHRoJzogMSxcbiAgJ2ZvckVhY2gnOiAxLFxuICAnZm9yRWFjaFJpZ2h0JzogMSxcbiAgJ2ZvckluJzogMSxcbiAgJ2ZvckluUmlnaHQnOiAxLFxuICAnZm9yT3duJzogMSxcbiAgJ2Zvck93blJpZ2h0JzogMSxcbiAgJ21hcCc6IDEsXG4gICdtYXBLZXlzJzogMSxcbiAgJ21hcFZhbHVlcyc6IDEsXG4gICdwYXJ0aXRpb24nOiAxLFxuICAncmVkdWNlJzogMixcbiAgJ3JlZHVjZVJpZ2h0JzogMixcbiAgJ3JlamVjdCc6IDEsXG4gICdyZW1vdmUnOiAxLFxuICAnc29tZSc6IDEsXG4gICd0YWtlUmlnaHRXaGlsZSc6IDEsXG4gICd0YWtlV2hpbGUnOiAxLFxuICAndGltZXMnOiAxLFxuICAndHJhbnNmb3JtJzogMlxufTtcblxuLyoqIFVzZWQgdG8gbWFwIG1ldGhvZCBuYW1lcyB0byBpdGVyYXRlZSByZWFyZyBjb25maWdzLiAqL1xuZXhwb3J0cy5pdGVyYXRlZVJlYXJnID0ge1xuICAnbWFwS2V5cyc6IFsxXVxufTtcblxuLyoqIFVzZWQgdG8gbWFwIG1ldGhvZCBuYW1lcyB0byByZWFyZyBjb25maWdzLiAqL1xuZXhwb3J0cy5tZXRob2RSZWFyZyA9IHtcbiAgJ2Fzc2lnbkluV2l0aCc6IFsxLCAyLCAwXSxcbiAgJ2Fzc2lnbldpdGgnOiBbMSwgMiwgMF0sXG4gICdkaWZmZXJlbmNlQnknOiBbMSwgMiwgMF0sXG4gICdkaWZmZXJlbmNlV2l0aCc6IFsxLCAyLCAwXSxcbiAgJ2dldE9yJzogWzIsIDEsIDBdLFxuICAnaW50ZXJzZWN0aW9uQnknOiBbMSwgMiwgMF0sXG4gICdpbnRlcnNlY3Rpb25XaXRoJzogWzEsIDIsIDBdLFxuICAnaXNFcXVhbFdpdGgnOiBbMSwgMiwgMF0sXG4gICdpc01hdGNoV2l0aCc6IFsyLCAxLCAwXSxcbiAgJ21lcmdlV2l0aCc6IFsxLCAyLCAwXSxcbiAgJ3BhZENoYXJzJzogWzIsIDEsIDBdLFxuICAncGFkQ2hhcnNFbmQnOiBbMiwgMSwgMF0sXG4gICdwYWRDaGFyc1N0YXJ0JzogWzIsIDEsIDBdLFxuICAncHVsbEFsbEJ5JzogWzIsIDEsIDBdLFxuICAncHVsbEFsbFdpdGgnOiBbMiwgMSwgMF0sXG4gICdzZXRXaXRoJzogWzMsIDEsIDIsIDBdLFxuICAnc29ydGVkSW5kZXhCeSc6IFsyLCAxLCAwXSxcbiAgJ3NvcnRlZExhc3RJbmRleEJ5JzogWzIsIDEsIDBdLFxuICAndW5pb25CeSc6IFsxLCAyLCAwXSxcbiAgJ3VuaW9uV2l0aCc6IFsxLCAyLCAwXSxcbiAgJ3VwZGF0ZVdpdGgnOiBbMywgMSwgMiwgMF0sXG4gICd4b3JCeSc6IFsxLCAyLCAwXSxcbiAgJ3hvcldpdGgnOiBbMSwgMiwgMF0sXG4gICd6aXBXaXRoJzogWzEsIDIsIDBdXG59O1xuXG4vKiogVXNlZCB0byBtYXAgbWV0aG9kIG5hbWVzIHRvIHNwcmVhZCBjb25maWdzLiAqL1xuZXhwb3J0cy5tZXRob2RTcHJlYWQgPSB7XG4gICdpbnZva2VBcmdzJzogMixcbiAgJ2ludm9rZUFyZ3NNYXAnOiAyLFxuICAncGFydGlhbCc6IDEsXG4gICdwYXJ0aWFsUmlnaHQnOiAxLFxuICAnd2l0aG91dCc6IDFcbn07XG5cbi8qKiBVc2VkIHRvIGlkZW50aWZ5IG1ldGhvZHMgd2hpY2ggbXV0YXRlIGFycmF5cyBvciBvYmplY3RzLiAqL1xuZXhwb3J0cy5tdXRhdGUgPSB7XG4gICdhcnJheSc6IHtcbiAgICAnZmlsbCc6IHRydWUsXG4gICAgJ3B1bGwnOiB0cnVlLFxuICAgICdwdWxsQWxsJzogdHJ1ZSxcbiAgICAncHVsbEFsbEJ5JzogdHJ1ZSxcbiAgICAncHVsbEFsbFdpdGgnOiB0cnVlLFxuICAgICdwdWxsQXQnOiB0cnVlLFxuICAgICdyZW1vdmUnOiB0cnVlLFxuICAgICdyZXZlcnNlJzogdHJ1ZVxuICB9LFxuICAnb2JqZWN0Jzoge1xuICAgICdhc3NpZ24nOiB0cnVlLFxuICAgICdhc3NpZ25Jbic6IHRydWUsXG4gICAgJ2Fzc2lnbkluV2l0aCc6IHRydWUsXG4gICAgJ2Fzc2lnbldpdGgnOiB0cnVlLFxuICAgICdkZWZhdWx0cyc6IHRydWUsXG4gICAgJ2RlZmF1bHRzRGVlcCc6IHRydWUsXG4gICAgJ21lcmdlJzogdHJ1ZSxcbiAgICAnbWVyZ2VXaXRoJzogdHJ1ZVxuICB9LFxuICAnc2V0Jzoge1xuICAgICdzZXQnOiB0cnVlLFxuICAgICdzZXRXaXRoJzogdHJ1ZSxcbiAgICAndW5zZXQnOiB0cnVlLFxuICAgICd1cGRhdGUnOiB0cnVlLFxuICAgICd1cGRhdGVXaXRoJzogdHJ1ZVxuICB9XG59O1xuXG4vKiogVXNlZCB0byB0cmFjayBtZXRob2RzIHdpdGggcGxhY2Vob2xkZXIgc3VwcG9ydCAqL1xuZXhwb3J0cy5wbGFjZWhvbGRlciA9IHtcbiAgJ2JpbmQnOiB0cnVlLFxuICAnYmluZEtleSc6IHRydWUsXG4gICdjdXJyeSc6IHRydWUsXG4gICdjdXJyeVJpZ2h0JzogdHJ1ZSxcbiAgJ3BhcnRpYWwnOiB0cnVlLFxuICAncGFydGlhbFJpZ2h0JzogdHJ1ZVxufTtcblxuLyoqIFVzZWQgdG8gbWFwIHJlYWwgbmFtZXMgdG8gdGhlaXIgYWxpYXNlcy4gKi9cbmV4cG9ydHMucmVhbFRvQWxpYXMgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICBvYmplY3QgPSBleHBvcnRzLmFsaWFzVG9SZWFsLFxuICAgICAgcmVzdWx0ID0ge307XG5cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtrZXldO1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3VsdCwgdmFsdWUpKSB7XG4gICAgICByZXN1bHRbdmFsdWVdLnB1c2goa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0W3ZhbHVlXSA9IFtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufSgpKTtcblxuLyoqIFVzZWQgdG8gbWFwIG1ldGhvZCBuYW1lcyB0byBvdGhlciBuYW1lcy4gKi9cbmV4cG9ydHMucmVtYXAgPSB7XG4gICdjdXJyeU4nOiAnY3VycnknLFxuICAnY3VycnlSaWdodE4nOiAnY3VycnlSaWdodCcsXG4gICdmaW5kRnJvbSc6ICdmaW5kJyxcbiAgJ2ZpbmRJbmRleEZyb20nOiAnZmluZEluZGV4JyxcbiAgJ2ZpbmRMYXN0RnJvbSc6ICdmaW5kTGFzdCcsXG4gICdmaW5kTGFzdEluZGV4RnJvbSc6ICdmaW5kTGFzdEluZGV4JyxcbiAgJ2dldE9yJzogJ2dldCcsXG4gICdpbmNsdWRlc0Zyb20nOiAnaW5jbHVkZXMnLFxuICAnaW5kZXhPZkZyb20nOiAnaW5kZXhPZicsXG4gICdpbnZva2VBcmdzJzogJ2ludm9rZScsXG4gICdpbnZva2VBcmdzTWFwJzogJ2ludm9rZU1hcCcsXG4gICdsYXN0SW5kZXhPZkZyb20nOiAnbGFzdEluZGV4T2YnLFxuICAncGFkQ2hhcnMnOiAncGFkJyxcbiAgJ3BhZENoYXJzRW5kJzogJ3BhZEVuZCcsXG4gICdwYWRDaGFyc1N0YXJ0JzogJ3BhZFN0YXJ0JyxcbiAgJ3Jlc3RGcm9tJzogJ3Jlc3QnLFxuICAnc3ByZWFkRnJvbSc6ICdzcHJlYWQnLFxuICAndHJpbUNoYXJzJzogJ3RyaW0nLFxuICAndHJpbUNoYXJzRW5kJzogJ3RyaW1FbmQnLFxuICAndHJpbUNoYXJzU3RhcnQnOiAndHJpbVN0YXJ0J1xufTtcblxuLyoqIFVzZWQgdG8gdHJhY2sgbWV0aG9kcyB0aGF0IHNraXAgZml4aW5nIHRoZWlyIGFyaXR5LiAqL1xuZXhwb3J0cy5za2lwRml4ZWQgPSB7XG4gICdjYXN0QXJyYXknOiB0cnVlLFxuICAnZmxvdyc6IHRydWUsXG4gICdmbG93UmlnaHQnOiB0cnVlLFxuICAnaXRlcmF0ZWUnOiB0cnVlLFxuICAnbWl4aW4nOiB0cnVlLFxuICAncnVuSW5Db250ZXh0JzogdHJ1ZVxufTtcblxuLyoqIFVzZWQgdG8gdHJhY2sgbWV0aG9kcyB0aGF0IHNraXAgcmVhcnJhbmdpbmcgYXJndW1lbnRzLiAqL1xuZXhwb3J0cy5za2lwUmVhcmcgPSB7XG4gICdhZGQnOiB0cnVlLFxuICAnYXNzaWduJzogdHJ1ZSxcbiAgJ2Fzc2lnbkluJzogdHJ1ZSxcbiAgJ2JpbmQnOiB0cnVlLFxuICAnYmluZEtleSc6IHRydWUsXG4gICdjb25jYXQnOiB0cnVlLFxuICAnZGlmZmVyZW5jZSc6IHRydWUsXG4gICdkaXZpZGUnOiB0cnVlLFxuICAnZXEnOiB0cnVlLFxuICAnZ3QnOiB0cnVlLFxuICAnZ3RlJzogdHJ1ZSxcbiAgJ2lzRXF1YWwnOiB0cnVlLFxuICAnbHQnOiB0cnVlLFxuICAnbHRlJzogdHJ1ZSxcbiAgJ21hdGNoZXNQcm9wZXJ0eSc6IHRydWUsXG4gICdtZXJnZSc6IHRydWUsXG4gICdtdWx0aXBseSc6IHRydWUsXG4gICdvdmVyQXJncyc6IHRydWUsXG4gICdwYXJ0aWFsJzogdHJ1ZSxcbiAgJ3BhcnRpYWxSaWdodCc6IHRydWUsXG4gICdyYW5kb20nOiB0cnVlLFxuICAncmFuZ2UnOiB0cnVlLFxuICAncmFuZ2VSaWdodCc6IHRydWUsXG4gICdzdWJ0cmFjdCc6IHRydWUsXG4gICd6aXAnOiB0cnVlLFxuICAnemlwT2JqZWN0JzogdHJ1ZVxufTtcbiIsIi8qKlxuICogVGhlIGRlZmF1bHQgYXJndW1lbnQgcGxhY2Vob2xkZXIgdmFsdWUgZm9yIG1ldGhvZHMuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7fTtcbiIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIGxvZGFzaCBsb2Rhc2guY29tL2xpY2Vuc2UgfCBVbmRlcnNjb3JlLmpzIDEuOC4zIHVuZGVyc2NvcmVqcy5vcmcvTElDRU5TRVxuICovXG47KGZ1bmN0aW9uKCl7ZnVuY3Rpb24gdCh0LG4pe3JldHVybiB0LnNldChuWzBdLG5bMV0pLHR9ZnVuY3Rpb24gbih0LG4pe3JldHVybiB0LmFkZChuKSx0fWZ1bmN0aW9uIHIodCxuLHIpe3N3aXRjaChyLmxlbmd0aCl7Y2FzZSAwOnJldHVybiB0LmNhbGwobik7Y2FzZSAxOnJldHVybiB0LmNhbGwobixyWzBdKTtjYXNlIDI6cmV0dXJuIHQuY2FsbChuLHJbMF0sclsxXSk7Y2FzZSAzOnJldHVybiB0LmNhbGwobixyWzBdLHJbMV0sclsyXSl9cmV0dXJuIHQuYXBwbHkobixyKX1mdW5jdGlvbiBlKHQsbixyLGUpe2Zvcih2YXIgdT0tMSxvPXQ/dC5sZW5ndGg6MDsrK3U8bzspe3ZhciBpPXRbdV07bihlLGkscihpKSx0KX1yZXR1cm4gZX1mdW5jdGlvbiB1KHQsbil7Zm9yKHZhciByPS0xLGU9dD90Lmxlbmd0aDowOysrcjxlJiZmYWxzZSE9PW4odFtyXSxyLHQpOyk7cmV0dXJuIHR9ZnVuY3Rpb24gbyh0LG4pe2Zvcih2YXIgcj10P3QubGVuZ3RoOjA7ci0tJiZmYWxzZSE9PW4odFtyXSxyLHQpOyk7XG5yZXR1cm4gdH1mdW5jdGlvbiBpKHQsbil7Zm9yKHZhciByPS0xLGU9dD90Lmxlbmd0aDowOysrcjxlOylpZighbih0W3JdLHIsdCkpcmV0dXJuIGZhbHNlO3JldHVybiB0cnVlfWZ1bmN0aW9uIGYodCxuKXtmb3IodmFyIHI9LTEsZT10P3QubGVuZ3RoOjAsdT0wLG89W107KytyPGU7KXt2YXIgaT10W3JdO24oaSxyLHQpJiYob1t1KytdPWkpfXJldHVybiBvfWZ1bmN0aW9uIGModCxuKXtyZXR1cm4hKCF0fHwhdC5sZW5ndGgpJiYtMTxkKHQsbiwwKX1mdW5jdGlvbiBhKHQsbixyKXtmb3IodmFyIGU9LTEsdT10P3QubGVuZ3RoOjA7KytlPHU7KWlmKHIobix0W2VdKSlyZXR1cm4gdHJ1ZTtyZXR1cm4gZmFsc2V9ZnVuY3Rpb24gbCh0LG4pe2Zvcih2YXIgcj0tMSxlPXQ/dC5sZW5ndGg6MCx1PUFycmF5KGUpOysrcjxlOyl1W3JdPW4odFtyXSxyLHQpO3JldHVybiB1fWZ1bmN0aW9uIHModCxuKXtmb3IodmFyIHI9LTEsZT1uLmxlbmd0aCx1PXQubGVuZ3RoOysrcjxlOyl0W3Urcl09bltyXTtyZXR1cm4gdH1mdW5jdGlvbiBoKHQsbixyLGUpe1xudmFyIHU9LTEsbz10P3QubGVuZ3RoOjA7Zm9yKGUmJm8mJihyPXRbKyt1XSk7Kyt1PG87KXI9bihyLHRbdV0sdSx0KTtyZXR1cm4gcn1mdW5jdGlvbiBwKHQsbixyLGUpe3ZhciB1PXQ/dC5sZW5ndGg6MDtmb3IoZSYmdSYmKHI9dFstLXVdKTt1LS07KXI9bihyLHRbdV0sdSx0KTtyZXR1cm4gcn1mdW5jdGlvbiBfKHQsbil7Zm9yKHZhciByPS0xLGU9dD90Lmxlbmd0aDowOysrcjxlOylpZihuKHRbcl0scix0KSlyZXR1cm4gdHJ1ZTtyZXR1cm4gZmFsc2V9ZnVuY3Rpb24gdih0LG4scil7dmFyIGU7cmV0dXJuIHIodCxmdW5jdGlvbih0LHIsdSl7cmV0dXJuIG4odCxyLHUpPyhlPXIsZmFsc2UpOnZvaWQgMH0pLGV9ZnVuY3Rpb24gZyh0LG4scixlKXt2YXIgdT10Lmxlbmd0aDtmb3Iocis9ZT8xOi0xO2U/ci0tOisrcjx1OylpZihuKHRbcl0scix0KSlyZXR1cm4gcjtyZXR1cm4tMX1mdW5jdGlvbiBkKHQsbixyKXtpZihuIT09bilyZXR1cm4gTSh0LHIpOy0tcjtmb3IodmFyIGU9dC5sZW5ndGg7KytyPGU7KWlmKHRbcl09PT1uKXJldHVybiByO1xucmV0dXJuLTF9ZnVuY3Rpb24geSh0LG4scixlKXstLXI7Zm9yKHZhciB1PXQubGVuZ3RoOysrcjx1OylpZihlKHRbcl0sbikpcmV0dXJuIHI7cmV0dXJuLTF9ZnVuY3Rpb24gYih0LG4pe3ZhciByPXQ/dC5sZW5ndGg6MDtyZXR1cm4gcj93KHQsbikvcjpWfWZ1bmN0aW9uIHgodCxuLHIsZSx1KXtyZXR1cm4gdSh0LGZ1bmN0aW9uKHQsdSxvKXtyPWU/KGU9ZmFsc2UsdCk6bihyLHQsdSxvKX0pLHJ9ZnVuY3Rpb24gaih0LG4pe3ZhciByPXQubGVuZ3RoO2Zvcih0LnNvcnQobik7ci0tOyl0W3JdPXRbcl0uYztyZXR1cm4gdH1mdW5jdGlvbiB3KHQsbil7Zm9yKHZhciByLGU9LTEsdT10Lmxlbmd0aDsrK2U8dTspe3ZhciBvPW4odFtlXSk7byE9PVQmJihyPXI9PT1UP286citvKX1yZXR1cm4gcn1mdW5jdGlvbiBtKHQsbil7Zm9yKHZhciByPS0xLGU9QXJyYXkodCk7KytyPHQ7KWVbcl09bihyKTtyZXR1cm4gZX1mdW5jdGlvbiBBKHQsbil7cmV0dXJuIGwobixmdW5jdGlvbihuKXtyZXR1cm5bbix0W25dXTtcbn0pfWZ1bmN0aW9uIE8odCl7cmV0dXJuIGZ1bmN0aW9uKG4pe3JldHVybiB0KG4pfX1mdW5jdGlvbiBrKHQsbil7cmV0dXJuIGwobixmdW5jdGlvbihuKXtyZXR1cm4gdFtuXX0pfWZ1bmN0aW9uIEUodCxuKXtyZXR1cm4gdC5oYXMobil9ZnVuY3Rpb24gUyh0LG4pe2Zvcih2YXIgcj0tMSxlPXQubGVuZ3RoOysrcjxlJiYtMTxkKG4sdFtyXSwwKTspO3JldHVybiByfWZ1bmN0aW9uIEkodCxuKXtmb3IodmFyIHI9dC5sZW5ndGg7ci0tJiYtMTxkKG4sdFtyXSwwKTspO3JldHVybiByfWZ1bmN0aW9uIFIodCl7cmV0dXJuIHQmJnQuT2JqZWN0PT09T2JqZWN0P3Q6bnVsbH1mdW5jdGlvbiBXKHQpe3JldHVybiB6dFt0XX1mdW5jdGlvbiBCKHQpe3JldHVybiBVdFt0XX1mdW5jdGlvbiBMKHQpe3JldHVyblwiXFxcXFwiK0R0W3RdfWZ1bmN0aW9uIE0odCxuLHIpe3ZhciBlPXQubGVuZ3RoO2ZvcihuKz1yPzE6LTE7cj9uLS06KytuPGU7KXt2YXIgdT10W25dO2lmKHUhPT11KXJldHVybiBufXJldHVybi0xO1xufWZ1bmN0aW9uIEModCl7dmFyIG49ZmFsc2U7aWYobnVsbCE9dCYmdHlwZW9mIHQudG9TdHJpbmchPVwiZnVuY3Rpb25cIil0cnl7bj0hISh0K1wiXCIpfWNhdGNoKHIpe31yZXR1cm4gbn1mdW5jdGlvbiB6KHQpe2Zvcih2YXIgbixyPVtdOyEobj10Lm5leHQoKSkuZG9uZTspci5wdXNoKG4udmFsdWUpO3JldHVybiByfWZ1bmN0aW9uIFUodCl7dmFyIG49LTEscj1BcnJheSh0LnNpemUpO3JldHVybiB0LmZvckVhY2goZnVuY3Rpb24odCxlKXtyWysrbl09W2UsdF19KSxyfWZ1bmN0aW9uICQodCxuKXtmb3IodmFyIHI9LTEsZT10Lmxlbmd0aCx1PTAsbz1bXTsrK3I8ZTspe3ZhciBpPXRbcl07aSE9PW4mJlwiX19sb2Rhc2hfcGxhY2Vob2xkZXJfX1wiIT09aXx8KHRbcl09XCJfX2xvZGFzaF9wbGFjZWhvbGRlcl9fXCIsb1t1KytdPXIpfXJldHVybiBvfWZ1bmN0aW9uIEQodCl7dmFyIG49LTEscj1BcnJheSh0LnNpemUpO3JldHVybiB0LmZvckVhY2goZnVuY3Rpb24odCl7clsrK25dPXR9KSxyfWZ1bmN0aW9uIEYodCl7XG52YXIgbj0tMSxyPUFycmF5KHQuc2l6ZSk7cmV0dXJuIHQuZm9yRWFjaChmdW5jdGlvbih0KXtyWysrbl09W3QsdF19KSxyfWZ1bmN0aW9uIE4odCl7aWYoIXR8fCFXdC50ZXN0KHQpKXJldHVybiB0Lmxlbmd0aDtmb3IodmFyIG49SXQubGFzdEluZGV4PTA7SXQudGVzdCh0KTspbisrO3JldHVybiBufWZ1bmN0aW9uIFAodCl7cmV0dXJuICR0W3RdfWZ1bmN0aW9uIFooUil7ZnVuY3Rpb24gQXQodCxuKXtyZXR1cm4gUi5zZXRUaW1lb3V0LmNhbGwoS3QsdCxuKX1mdW5jdGlvbiBPdCh0KXtpZihUZSh0KSYmIXlpKHQpJiYhKHQgaW5zdGFuY2VvZiBVdCkpe2lmKHQgaW5zdGFuY2VvZiB6dClyZXR1cm4gdDtpZihXdS5jYWxsKHQsXCJfX3dyYXBwZWRfX1wiKSlyZXR1cm4gYWUodCl9cmV0dXJuIG5ldyB6dCh0KX1mdW5jdGlvbiBrdCgpe31mdW5jdGlvbiB6dCh0LG4pe3RoaXMuX193cmFwcGVkX189dCx0aGlzLl9fYWN0aW9uc19fPVtdLHRoaXMuX19jaGFpbl9fPSEhbix0aGlzLl9faW5kZXhfXz0wLFxudGhpcy5fX3ZhbHVlc19fPVR9ZnVuY3Rpb24gVXQodCl7dGhpcy5fX3dyYXBwZWRfXz10LHRoaXMuX19hY3Rpb25zX189W10sdGhpcy5fX2Rpcl9fPTEsdGhpcy5fX2ZpbHRlcmVkX189ZmFsc2UsdGhpcy5fX2l0ZXJhdGVlc19fPVtdLHRoaXMuX190YWtlQ291bnRfXz00Mjk0OTY3Mjk1LHRoaXMuX192aWV3c19fPVtdfWZ1bmN0aW9uICR0KHQpe3ZhciBuPS0xLHI9dD90Lmxlbmd0aDowO2Zvcih0aGlzLmNsZWFyKCk7KytuPHI7KXt2YXIgZT10W25dO3RoaXMuc2V0KGVbMF0sZVsxXSl9fWZ1bmN0aW9uIER0KHQpe3ZhciBuPS0xLHI9dD90Lmxlbmd0aDowO2Zvcih0aGlzLmNsZWFyKCk7KytuPHI7KXt2YXIgZT10W25dO3RoaXMuc2V0KGVbMF0sZVsxXSl9fWZ1bmN0aW9uIFB0KHQpe3ZhciBuPS0xLHI9dD90Lmxlbmd0aDowO2Zvcih0aGlzLmNsZWFyKCk7KytuPHI7KXt2YXIgZT10W25dO3RoaXMuc2V0KGVbMF0sZVsxXSl9fWZ1bmN0aW9uIFp0KHQpe3ZhciBuPS0xLHI9dD90Lmxlbmd0aDowO1xuZm9yKHRoaXMuX19kYXRhX189bmV3IFB0OysrbjxyOyl0aGlzLmFkZCh0W25dKX1mdW5jdGlvbiBxdCh0KXt0aGlzLl9fZGF0YV9fPW5ldyBEdCh0KX1mdW5jdGlvbiBWdCh0LG4scixlKXtyZXR1cm4gdD09PVR8fENlKHQsa3Vbcl0pJiYhV3UuY2FsbChlLHIpP246dH1mdW5jdGlvbiBKdCh0LG4scil7KHI9PT1UfHxDZSh0W25dLHIpKSYmKHR5cGVvZiBuIT1cIm51bWJlclwifHxyIT09VHx8biBpbiB0KXx8KHRbbl09cil9ZnVuY3Rpb24gWXQodCxuLHIpe3ZhciBlPXRbbl07V3UuY2FsbCh0LG4pJiZDZShlLHIpJiYociE9PVR8fG4gaW4gdCl8fCh0W25dPXIpfWZ1bmN0aW9uIEh0KHQsbil7Zm9yKHZhciByPXQubGVuZ3RoO3ItLTspaWYoQ2UodFtyXVswXSxuKSlyZXR1cm4gcjtyZXR1cm4tMX1mdW5jdGlvbiBRdCh0LG4scixlKXtyZXR1cm4gQW8odCxmdW5jdGlvbih0LHUsbyl7bihlLHQscih0KSxvKX0pLGV9ZnVuY3Rpb24gWHQodCxuKXtyZXR1cm4gdCYmc3IobixpdShuKSx0KX1cbmZ1bmN0aW9uIHRuKHQsbil7Zm9yKHZhciByPS0xLGU9bnVsbD09dCx1PW4ubGVuZ3RoLG89QXJyYXkodSk7KytyPHU7KW9bcl09ZT9UOnV1KHQsbltyXSk7cmV0dXJuIG99ZnVuY3Rpb24gbm4odCxuLHIpe3JldHVybiB0PT09dCYmKHIhPT1UJiYodD1yPj10P3Q6ciksbiE9PVQmJih0PXQ+PW4/dDpuKSksdH1mdW5jdGlvbiBybih0LG4scixlLG8saSxmKXt2YXIgYztpZihlJiYoYz1pP2UodCxvLGksZik6ZSh0KSksYyE9PVQpcmV0dXJuIGM7aWYoIVplKHQpKXJldHVybiB0O2lmKG89eWkodCkpe2lmKGM9S3IodCksIW4pcmV0dXJuIGxyKHQsYyl9ZWxzZXt2YXIgYT1xcih0KSxsPVwiW29iamVjdCBGdW5jdGlvbl1cIj09YXx8XCJbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXVwiPT1hO2lmKGJpKHQpKXJldHVybiBvcih0LG4pO2lmKFwiW29iamVjdCBPYmplY3RdXCI9PWF8fFwiW29iamVjdCBBcmd1bWVudHNdXCI9PWF8fGwmJiFpKXtpZihDKHQpKXJldHVybiBpP3Q6e307aWYoYz1HcihsP3t9OnQpLFxuIW4pcmV0dXJuIGhyKHQsWHQoYyx0KSl9ZWxzZXtpZighQ3RbYV0pcmV0dXJuIGk/dDp7fTtjPUpyKHQsYSxybixuKX19aWYoZnx8KGY9bmV3IHF0KSxpPWYuZ2V0KHQpKXJldHVybiBpO2lmKGYuc2V0KHQsYyksIW8pdmFyIHM9cj9nbih0LGl1LFRyKTppdSh0KTtyZXR1cm4gdShzfHx0LGZ1bmN0aW9uKHUsbyl7cyYmKG89dSx1PXRbb10pLFl0KGMsbyxybih1LG4scixlLG8sdCxmKSl9KSxjfWZ1bmN0aW9uIGVuKHQpe3ZhciBuPWl1KHQpLHI9bi5sZW5ndGg7cmV0dXJuIGZ1bmN0aW9uKGUpe2lmKG51bGw9PWUpcmV0dXJuIXI7Zm9yKHZhciB1PXI7dS0tOyl7dmFyIG89blt1XSxpPXRbb10sZj1lW29dO2lmKGY9PT1UJiYhKG8gaW4gT2JqZWN0KGUpKXx8IWkoZikpcmV0dXJuIGZhbHNlfXJldHVybiB0cnVlfX1mdW5jdGlvbiB1bih0KXtyZXR1cm4gWmUodCk/VHUodCk6e319ZnVuY3Rpb24gb24odCxuLHIpe2lmKHR5cGVvZiB0IT1cImZ1bmN0aW9uXCIpdGhyb3cgbmV3IEF1KFwiRXhwZWN0ZWQgYSBmdW5jdGlvblwiKTtcbnJldHVybiBBdChmdW5jdGlvbigpe3QuYXBwbHkoVCxyKX0sbil9ZnVuY3Rpb24gZm4odCxuLHIsZSl7dmFyIHU9LTEsbz1jLGk9dHJ1ZSxmPXQubGVuZ3RoLHM9W10saD1uLmxlbmd0aDtpZighZilyZXR1cm4gcztyJiYobj1sKG4sTyhyKSkpLGU/KG89YSxpPWZhbHNlKTpuLmxlbmd0aD49MjAwJiYobz1FLGk9ZmFsc2Usbj1uZXcgWnQobikpO3Q6Zm9yKDsrK3U8Zjspe3ZhciBwPXRbdV0sXz1yP3IocCk6cCxwPWV8fDAhPT1wP3A6MDtpZihpJiZfPT09Xyl7Zm9yKHZhciB2PWg7di0tOylpZihuW3ZdPT09Xyljb250aW51ZSB0O3MucHVzaChwKX1lbHNlIG8obixfLGUpfHxzLnB1c2gocCl9cmV0dXJuIHN9ZnVuY3Rpb24gY24odCxuKXt2YXIgcj10cnVlO3JldHVybiBBbyh0LGZ1bmN0aW9uKHQsZSx1KXtyZXR1cm4gcj0hIW4odCxlLHUpfSkscn1mdW5jdGlvbiBhbih0LG4scil7Zm9yKHZhciBlPS0xLHU9dC5sZW5ndGg7KytlPHU7KXt2YXIgbz10W2VdLGk9bihvKTtpZihudWxsIT1pJiYoZj09PVQ/aT09PWkmJiFKZShpKTpyKGksZikpKXZhciBmPWksYz1vO1xufXJldHVybiBjfWZ1bmN0aW9uIGxuKHQsbil7dmFyIHI9W107cmV0dXJuIEFvKHQsZnVuY3Rpb24odCxlLHUpe24odCxlLHUpJiZyLnB1c2godCl9KSxyfWZ1bmN0aW9uIHNuKHQsbixyLGUsdSl7dmFyIG89LTEsaT10Lmxlbmd0aDtmb3Iocnx8KHI9SHIpLHV8fCh1PVtdKTsrK288aTspe3ZhciBmPXRbb107bj4wJiZyKGYpP24+MT9zbihmLG4tMSxyLGUsdSk6cyh1LGYpOmV8fCh1W3UubGVuZ3RoXT1mKX1yZXR1cm4gdX1mdW5jdGlvbiBobih0LG4pe3JldHVybiB0JiZrbyh0LG4saXUpfWZ1bmN0aW9uIHBuKHQsbil7cmV0dXJuIHQmJkVvKHQsbixpdSl9ZnVuY3Rpb24gX24odCxuKXtyZXR1cm4gZihuLGZ1bmN0aW9uKG4pe3JldHVybiBGZSh0W25dKX0pfWZ1bmN0aW9uIHZuKHQsbil7bj1uZShuLHQpP1tuXTplcihuKTtmb3IodmFyIHI9MCxlPW4ubGVuZ3RoO251bGwhPXQmJmU+cjspdD10W2ZlKG5bcisrXSldO3JldHVybiByJiZyPT1lP3Q6VH1mdW5jdGlvbiBnbih0LG4scil7XG5yZXR1cm4gbj1uKHQpLHlpKHQpP246cyhuLHIodCkpfWZ1bmN0aW9uIGRuKHQsbil7cmV0dXJuIHQ+bn1mdW5jdGlvbiB5bih0LG4pe3JldHVybiBudWxsIT10JiYoV3UuY2FsbCh0LG4pfHx0eXBlb2YgdD09XCJvYmplY3RcIiYmbiBpbiB0JiZudWxsPT09SnUoT2JqZWN0KHQpKSl9ZnVuY3Rpb24gYm4odCxuKXtyZXR1cm4gbnVsbCE9dCYmbiBpbiBPYmplY3QodCl9ZnVuY3Rpb24geG4odCxuLHIpe2Zvcih2YXIgZT1yP2E6Yyx1PXRbMF0ubGVuZ3RoLG89dC5sZW5ndGgsaT1vLGY9QXJyYXkobykscz0xLzAsaD1bXTtpLS07KXt2YXIgcD10W2ldO2kmJm4mJihwPWwocCxPKG4pKSkscz10byhwLmxlbmd0aCxzKSxmW2ldPSFyJiYobnx8dT49MTIwJiZwLmxlbmd0aD49MTIwKT9uZXcgWnQoaSYmcCk6VH12YXIgcD10WzBdLF89LTEsdj1mWzBdO3Q6Zm9yKDsrK188dSYmcz5oLmxlbmd0aDspe3ZhciBnPXBbX10sZD1uP24oZyk6ZyxnPXJ8fDAhPT1nP2c6MDtpZih2PyFFKHYsZCk6IWUoaCxkLHIpKXtcbmZvcihpPW87LS1pOyl7dmFyIHk9ZltpXTtpZih5PyFFKHksZCk6IWUodFtpXSxkLHIpKWNvbnRpbnVlIHR9diYmdi5wdXNoKGQpLGgucHVzaChnKX19cmV0dXJuIGh9ZnVuY3Rpb24gam4odCxuLHIpe3ZhciBlPXt9O3JldHVybiBobih0LGZ1bmN0aW9uKHQsdSxvKXtuKGUscih0KSx1LG8pfSksZX1mdW5jdGlvbiB3bih0LG4sZSl7cmV0dXJuIG5lKG4sdCl8fChuPWVyKG4pLHQ9aWUodCxuKSxuPXZlKG4pKSxuPW51bGw9PXQ/dDp0W2ZlKG4pXSxudWxsPT1uP1Q6cihuLHQsZSl9ZnVuY3Rpb24gbW4odCxuLHIsZSx1KXtpZih0PT09biluPXRydWU7ZWxzZSBpZihudWxsPT10fHxudWxsPT1ufHwhWmUodCkmJiFUZShuKSluPXQhPT10JiZuIT09bjtlbHNlIHQ6e3ZhciBvPXlpKHQpLGk9eWkobiksZj1cIltvYmplY3QgQXJyYXldXCIsYz1cIltvYmplY3QgQXJyYXldXCI7b3x8KGY9cXIodCksZj1cIltvYmplY3QgQXJndW1lbnRzXVwiPT1mP1wiW29iamVjdCBPYmplY3RdXCI6ZiksaXx8KGM9cXIobiksXG5jPVwiW29iamVjdCBBcmd1bWVudHNdXCI9PWM/XCJbb2JqZWN0IE9iamVjdF1cIjpjKTt2YXIgYT1cIltvYmplY3QgT2JqZWN0XVwiPT1mJiYhQyh0KSxpPVwiW29iamVjdCBPYmplY3RdXCI9PWMmJiFDKG4pO2lmKChjPWY9PWMpJiYhYSl1fHwodT1uZXcgcXQpLG49b3x8WWUodCk/enIodCxuLG1uLHIsZSx1KTpVcih0LG4sZixtbixyLGUsdSk7ZWxzZXtpZighKDImZSkmJihvPWEmJld1LmNhbGwodCxcIl9fd3JhcHBlZF9fXCIpLGY9aSYmV3UuY2FsbChuLFwiX193cmFwcGVkX19cIiksb3x8Zikpe3Q9bz90LnZhbHVlKCk6dCxuPWY/bi52YWx1ZSgpOm4sdXx8KHU9bmV3IHF0KSxuPW1uKHQsbixyLGUsdSk7YnJlYWsgdH1pZihjKW46aWYodXx8KHU9bmV3IHF0KSxvPTImZSxmPWl1KHQpLGk9Zi5sZW5ndGgsYz1pdShuKS5sZW5ndGgsaT09Y3x8byl7Zm9yKGE9aTthLS07KXt2YXIgbD1mW2FdO2lmKCEobz9sIGluIG46eW4obixsKSkpe249ZmFsc2U7YnJlYWsgbn19aWYoYz11LmdldCh0KSluPWM9PW47ZWxzZXtcbmM9dHJ1ZSx1LnNldCh0LG4pO2Zvcih2YXIgcz1vOysrYTxpOyl7dmFyIGw9ZlthXSxoPXRbbF0scD1uW2xdO2lmKHIpdmFyIF89bz9yKHAsaCxsLG4sdCx1KTpyKGgscCxsLHQsbix1KTtpZihfPT09VD9oIT09cCYmIW1uKGgscCxyLGUsdSk6IV8pe2M9ZmFsc2U7YnJlYWt9c3x8KHM9XCJjb25zdHJ1Y3RvclwiPT1sKX1jJiYhcyYmKHI9dC5jb25zdHJ1Y3RvcixlPW4uY29uc3RydWN0b3IsciE9ZSYmXCJjb25zdHJ1Y3RvclwiaW4gdCYmXCJjb25zdHJ1Y3RvclwiaW4gbiYmISh0eXBlb2Ygcj09XCJmdW5jdGlvblwiJiZyIGluc3RhbmNlb2YgciYmdHlwZW9mIGU9PVwiZnVuY3Rpb25cIiYmZSBpbnN0YW5jZW9mIGUpJiYoYz1mYWxzZSkpLHVbXCJkZWxldGVcIl0odCksbj1jfX1lbHNlIG49ZmFsc2U7ZWxzZSBuPWZhbHNlfX1yZXR1cm4gbn1mdW5jdGlvbiBBbih0LG4scixlKXt2YXIgdT1yLmxlbmd0aCxvPXUsaT0hZTtpZihudWxsPT10KXJldHVybiFvO2Zvcih0PU9iamVjdCh0KTt1LS07KXt2YXIgZj1yW3VdO2lmKGkmJmZbMl0/ZlsxXSE9PXRbZlswXV06IShmWzBdaW4gdCkpcmV0dXJuIGZhbHNlO1xufWZvcig7Kyt1PG87KXt2YXIgZj1yW3VdLGM9ZlswXSxhPXRbY10sbD1mWzFdO2lmKGkmJmZbMl0pe2lmKGE9PT1UJiYhKGMgaW4gdCkpcmV0dXJuIGZhbHNlfWVsc2V7aWYoZj1uZXcgcXQsZSl2YXIgcz1lKGEsbCxjLHQsbixmKTtpZihzPT09VD8hbW4obCxhLGUsMyxmKTohcylyZXR1cm4gZmFsc2V9fXJldHVybiB0cnVlfWZ1bmN0aW9uIE9uKHQpe3JldHVybiFaZSh0KXx8SXUmJkl1IGluIHQ/ZmFsc2U6KEZlKHQpfHxDKHQpP3p1Onl0KS50ZXN0KGNlKHQpKX1mdW5jdGlvbiBrbih0KXtyZXR1cm4gdHlwZW9mIHQ9PVwiZnVuY3Rpb25cIj90Om51bGw9PXQ/cHU6dHlwZW9mIHQ9PVwib2JqZWN0XCI/eWkodCk/V24odFswXSx0WzFdKTpSbih0KTpkdSh0KX1mdW5jdGlvbiBFbih0KXt0PW51bGw9PXQ/dDpPYmplY3QodCk7dmFyIG4scj1bXTtmb3IobiBpbiB0KXIucHVzaChuKTtyZXR1cm4gcn1mdW5jdGlvbiBTbih0LG4pe3JldHVybiBuPnR9ZnVuY3Rpb24gSW4odCxuKXt2YXIgcj0tMSxlPVVlKHQpP0FycmF5KHQubGVuZ3RoKTpbXTtcbnJldHVybiBBbyh0LGZ1bmN0aW9uKHQsdSxvKXtlWysrcl09bih0LHUsbyl9KSxlfWZ1bmN0aW9uIFJuKHQpe3ZhciBuPVByKHQpO3JldHVybiAxPT1uLmxlbmd0aCYmblswXVsyXT91ZShuWzBdWzBdLG5bMF1bMV0pOmZ1bmN0aW9uKHIpe3JldHVybiByPT09dHx8QW4ocix0LG4pfX1mdW5jdGlvbiBXbih0LG4pe3JldHVybiBuZSh0KSYmbj09PW4mJiFaZShuKT91ZShmZSh0KSxuKTpmdW5jdGlvbihyKXt2YXIgZT11dShyLHQpO3JldHVybiBlPT09VCYmZT09PW4/b3Uocix0KTptbihuLGUsVCwzKX19ZnVuY3Rpb24gQm4odCxuLHIsZSxvKXtpZih0IT09bil7aWYoIXlpKG4pJiYhWWUobikpdmFyIGk9ZnUobik7dShpfHxuLGZ1bmN0aW9uKHUsZil7aWYoaSYmKGY9dSx1PW5bZl0pLFplKHUpKXtvfHwobz1uZXcgcXQpO3ZhciBjPWYsYT1vLGw9dFtjXSxzPW5bY10saD1hLmdldChzKTtpZihoKUp0KHQsYyxoKTtlbHNle3ZhciBoPWU/ZShsLHMsYytcIlwiLHQsbixhKTpULHA9aD09PVQ7cCYmKGg9cyxcbnlpKHMpfHxZZShzKT95aShsKT9oPWw6JGUobCk/aD1scihsKToocD1mYWxzZSxoPXJuKHMsdHJ1ZSkpOlZlKHMpfHx6ZShzKT96ZShsKT9oPXJ1KGwpOiFaZShsKXx8ciYmRmUobCk/KHA9ZmFsc2UsaD1ybihzLHRydWUpKTpoPWw6cD1mYWxzZSksYS5zZXQocyxoKSxwJiZCbihoLHMscixlLGEpLGFbXCJkZWxldGVcIl0ocyksSnQodCxjLGgpfX1lbHNlIGM9ZT9lKHRbZl0sdSxmK1wiXCIsdCxuLG8pOlQsYz09PVQmJihjPXUpLEp0KHQsZixjKX0pfX1mdW5jdGlvbiBMbih0LG4pe3ZhciByPXQubGVuZ3RoO3JldHVybiByPyhuKz0wPm4/cjowLFhyKG4scik/dFtuXTpUKTp2b2lkIDB9ZnVuY3Rpb24gTW4odCxuLHIpe3ZhciBlPS0xO3JldHVybiBuPWwobi5sZW5ndGg/bjpbcHVdLE8oRnIoKSkpLHQ9SW4odCxmdW5jdGlvbih0KXtyZXR1cm57YTpsKG4sZnVuY3Rpb24obil7cmV0dXJuIG4odCl9KSxiOisrZSxjOnR9fSksaih0LGZ1bmN0aW9uKHQsbil7dmFyIGU7dDp7ZT0tMTtmb3IodmFyIHU9dC5hLG89bi5hLGk9dS5sZW5ndGgsZj1yLmxlbmd0aDsrK2U8aTspe1xudmFyIGM9ZnIodVtlXSxvW2VdKTtpZihjKXtlPWU+PWY/YzpjKihcImRlc2NcIj09cltlXT8tMToxKTticmVhayB0fX1lPXQuYi1uLmJ9cmV0dXJuIGV9KX1mdW5jdGlvbiBDbih0LG4pe3JldHVybiB0PU9iamVjdCh0KSxoKG4sZnVuY3Rpb24obixyKXtyZXR1cm4gciBpbiB0JiYobltyXT10W3JdKSxufSx7fSl9ZnVuY3Rpb24gem4odCxuKXtmb3IodmFyIHI9LTEsZT1nbih0LGZ1LEJvKSx1PWUubGVuZ3RoLG89e307KytyPHU7KXt2YXIgaT1lW3JdLGY9dFtpXTtuKGYsaSkmJihvW2ldPWYpfXJldHVybiBvfWZ1bmN0aW9uIFVuKHQpe3JldHVybiBmdW5jdGlvbihuKXtyZXR1cm4gbnVsbD09bj9UOm5bdF19fWZ1bmN0aW9uICRuKHQpe3JldHVybiBmdW5jdGlvbihuKXtyZXR1cm4gdm4obix0KX19ZnVuY3Rpb24gRG4odCxuLHIsZSl7dmFyIHU9ZT95OmQsbz0tMSxpPW4ubGVuZ3RoLGY9dDtmb3IodD09PW4mJihuPWxyKG4pKSxyJiYoZj1sKHQsTyhyKSkpOysrbzxpOylmb3IodmFyIGM9MCxhPW5bb10sYT1yP3IoYSk6YTstMTwoYz11KGYsYSxjLGUpKTspZiE9PXQmJlZ1LmNhbGwoZixjLDEpLFxuVnUuY2FsbCh0LGMsMSk7cmV0dXJuIHR9ZnVuY3Rpb24gRm4odCxuKXtmb3IodmFyIHI9dD9uLmxlbmd0aDowLGU9ci0xO3ItLTspe3ZhciB1PW5bcl07aWYocj09ZXx8dSE9PW8pe3ZhciBvPXU7aWYoWHIodSkpVnUuY2FsbCh0LHUsMSk7ZWxzZSBpZihuZSh1LHQpKWRlbGV0ZSB0W2ZlKHUpXTtlbHNle3ZhciB1PWVyKHUpLGk9aWUodCx1KTtudWxsIT1pJiZkZWxldGUgaVtmZSh2ZSh1KSldfX19fWZ1bmN0aW9uIE5uKHQsbil7cmV0dXJuIHQrR3Uocm8oKSoobi10KzEpKX1mdW5jdGlvbiBQbih0LG4pe3ZhciByPVwiXCI7aWYoIXR8fDE+bnx8bj45MDA3MTk5MjU0NzQwOTkxKXJldHVybiByO2RvIG4lMiYmKHIrPXQpLChuPUd1KG4vMikpJiYodCs9dCk7d2hpbGUobik7cmV0dXJuIHJ9ZnVuY3Rpb24gWm4odCxuLHIsZSl7bj1uZShuLHQpP1tuXTplcihuKTtmb3IodmFyIHU9LTEsbz1uLmxlbmd0aCxpPW8tMSxmPXQ7bnVsbCE9ZiYmKyt1PG87KXt2YXIgYz1mZShuW3VdKTtpZihaZShmKSl7XG52YXIgYT1yO2lmKHUhPWkpe3ZhciBsPWZbY10sYT1lP2UobCxjLGYpOlQ7YT09PVQmJihhPW51bGw9PWw/WHIoblt1KzFdKT9bXTp7fTpsKX1ZdChmLGMsYSl9Zj1mW2NdfXJldHVybiB0fWZ1bmN0aW9uIFRuKHQsbixyKXt2YXIgZT0tMSx1PXQubGVuZ3RoO2ZvcigwPm4mJihuPS1uPnU/MDp1K24pLHI9cj51P3U6ciwwPnImJihyKz11KSx1PW4+cj8wOnItbj4+PjAsbj4+Pj0wLHI9QXJyYXkodSk7KytlPHU7KXJbZV09dFtlK25dO3JldHVybiByfWZ1bmN0aW9uIHFuKHQsbil7dmFyIHI7cmV0dXJuIEFvKHQsZnVuY3Rpb24odCxlLHUpe3JldHVybiByPW4odCxlLHUpLCFyfSksISFyfWZ1bmN0aW9uIFZuKHQsbixyKXt2YXIgZT0wLHU9dD90Lmxlbmd0aDplO2lmKHR5cGVvZiBuPT1cIm51bWJlclwiJiZuPT09biYmMjE0NzQ4MzY0Nz49dSl7Zm9yKDt1PmU7KXt2YXIgbz1lK3U+Pj4xLGk9dFtvXTtudWxsIT09aSYmIUplKGkpJiYocj9uPj1pOm4+aSk/ZT1vKzE6dT1vfXJldHVybiB1fVxucmV0dXJuIEtuKHQsbixwdSxyKX1mdW5jdGlvbiBLbih0LG4scixlKXtuPXIobik7Zm9yKHZhciB1PTAsbz10P3QubGVuZ3RoOjAsaT1uIT09bixmPW51bGw9PT1uLGM9SmUobiksYT1uPT09VDtvPnU7KXt2YXIgbD1HdSgodStvKS8yKSxzPXIodFtsXSksaD1zIT09VCxwPW51bGw9PT1zLF89cz09PXMsdj1KZShzKTsoaT9lfHxfOmE/XyYmKGV8fGgpOmY/XyYmaCYmKGV8fCFwKTpjP18mJmgmJiFwJiYoZXx8IXYpOnB8fHY/MDplP24+PXM6bj5zKT91PWwrMTpvPWx9cmV0dXJuIHRvKG8sNDI5NDk2NzI5NCl9ZnVuY3Rpb24gR24odCxuKXtmb3IodmFyIHI9LTEsZT10Lmxlbmd0aCx1PTAsbz1bXTsrK3I8ZTspe3ZhciBpPXRbcl0sZj1uP24oaSk6aTtpZighcnx8IUNlKGYsYykpe3ZhciBjPWY7b1t1KytdPTA9PT1pPzA6aX19cmV0dXJuIG99ZnVuY3Rpb24gSm4odCl7cmV0dXJuIHR5cGVvZiB0PT1cIm51bWJlclwiP3Q6SmUodCk/VjordH1mdW5jdGlvbiBZbih0KXtpZih0eXBlb2YgdD09XCJzdHJpbmdcIilyZXR1cm4gdDtcbmlmKEplKHQpKXJldHVybiBtbz9tby5jYWxsKHQpOlwiXCI7dmFyIG49dCtcIlwiO3JldHVyblwiMFwiPT1uJiYxL3Q9PS1xP1wiLTBcIjpufWZ1bmN0aW9uIEhuKHQsbixyKXt2YXIgZT0tMSx1PWMsbz10Lmxlbmd0aCxpPXRydWUsZj1bXSxsPWY7aWYocilpPWZhbHNlLHU9YTtlbHNlIGlmKG8+PTIwMCl7aWYodT1uP251bGw6SW8odCkpcmV0dXJuIEQodSk7aT1mYWxzZSx1PUUsbD1uZXcgWnR9ZWxzZSBsPW4/W106Zjt0OmZvcig7KytlPG87KXt2YXIgcz10W2VdLGg9bj9uKHMpOnMscz1yfHwwIT09cz9zOjA7aWYoaSYmaD09PWgpe2Zvcih2YXIgcD1sLmxlbmd0aDtwLS07KWlmKGxbcF09PT1oKWNvbnRpbnVlIHQ7biYmbC5wdXNoKGgpLGYucHVzaChzKX1lbHNlIHUobCxoLHIpfHwobCE9PWYmJmwucHVzaChoKSxmLnB1c2gocykpfXJldHVybiBmfWZ1bmN0aW9uIFFuKHQsbixyLGUpe2Zvcih2YXIgdT10Lmxlbmd0aCxvPWU/dTotMTsoZT9vLS06KytvPHUpJiZuKHRbb10sbyx0KTspO3JldHVybiByP1RuKHQsZT8wOm8sZT9vKzE6dSk6VG4odCxlP28rMTowLGU/dTpvKTtcbn1mdW5jdGlvbiBYbih0LG4pe3ZhciByPXQ7cmV0dXJuIHIgaW5zdGFuY2VvZiBVdCYmKHI9ci52YWx1ZSgpKSxoKG4sZnVuY3Rpb24odCxuKXtyZXR1cm4gbi5mdW5jLmFwcGx5KG4udGhpc0FyZyxzKFt0XSxuLmFyZ3MpKX0scil9ZnVuY3Rpb24gdHIodCxuLHIpe2Zvcih2YXIgZT0tMSx1PXQubGVuZ3RoOysrZTx1Oyl2YXIgbz1vP3MoZm4obyx0W2VdLG4sciksZm4odFtlXSxvLG4scikpOnRbZV07cmV0dXJuIG8mJm8ubGVuZ3RoP0huKG8sbixyKTpbXX1mdW5jdGlvbiBucih0LG4scil7Zm9yKHZhciBlPS0xLHU9dC5sZW5ndGgsbz1uLmxlbmd0aCxpPXt9OysrZTx1OylyKGksdFtlXSxvPmU/bltlXTpUKTtyZXR1cm4gaX1mdW5jdGlvbiBycih0KXtyZXR1cm4gJGUodCk/dDpbXX1mdW5jdGlvbiBlcih0KXtyZXR1cm4geWkodCk/dDpDbyh0KX1mdW5jdGlvbiB1cih0LG4scil7dmFyIGU9dC5sZW5ndGg7cmV0dXJuIHI9cj09PVQ/ZTpyLCFuJiZyPj1lP3Q6VG4odCxuLHIpfWZ1bmN0aW9uIG9yKHQsbil7XG5pZihuKXJldHVybiB0LnNsaWNlKCk7dmFyIHI9bmV3IHQuY29uc3RydWN0b3IodC5sZW5ndGgpO3JldHVybiB0LmNvcHkocikscn1mdW5jdGlvbiBpcih0KXt2YXIgbj1uZXcgdC5jb25zdHJ1Y3Rvcih0LmJ5dGVMZW5ndGgpO3JldHVybiBuZXcgRnUobikuc2V0KG5ldyBGdSh0KSksbn1mdW5jdGlvbiBmcih0LG4pe2lmKHQhPT1uKXt2YXIgcj10IT09VCxlPW51bGw9PT10LHU9dD09PXQsbz1KZSh0KSxpPW4hPT1ULGY9bnVsbD09PW4sYz1uPT09bixhPUplKG4pO2lmKCFmJiYhYSYmIW8mJnQ+bnx8byYmaSYmYyYmIWYmJiFhfHxlJiZpJiZjfHwhciYmY3x8IXUpcmV0dXJuIDE7aWYoIWUmJiFvJiYhYSYmbj50fHxhJiZyJiZ1JiYhZSYmIW98fGYmJnImJnV8fCFpJiZ1fHwhYylyZXR1cm4tMX1yZXR1cm4gMH1mdW5jdGlvbiBjcih0LG4scixlKXt2YXIgdT0tMSxvPXQubGVuZ3RoLGk9ci5sZW5ndGgsZj0tMSxjPW4ubGVuZ3RoLGE9WHUoby1pLDApLGw9QXJyYXkoYythKTtmb3IoZT0hZTsrK2Y8YzspbFtmXT1uW2ZdO1xuZm9yKDsrK3U8aTspKGV8fG8+dSkmJihsW3JbdV1dPXRbdV0pO2Zvcig7YS0tOylsW2YrK109dFt1KytdO3JldHVybiBsfWZ1bmN0aW9uIGFyKHQsbixyLGUpe3ZhciB1PS0xLG89dC5sZW5ndGgsaT0tMSxmPXIubGVuZ3RoLGM9LTEsYT1uLmxlbmd0aCxsPVh1KG8tZiwwKSxzPUFycmF5KGwrYSk7Zm9yKGU9IWU7Kyt1PGw7KXNbdV09dFt1XTtmb3IobD11OysrYzxhOylzW2wrY109bltjXTtmb3IoOysraTxmOykoZXx8bz51KSYmKHNbbCtyW2ldXT10W3UrK10pO3JldHVybiBzfWZ1bmN0aW9uIGxyKHQsbil7dmFyIHI9LTEsZT10Lmxlbmd0aDtmb3Iobnx8KG49QXJyYXkoZSkpOysrcjxlOyluW3JdPXRbcl07cmV0dXJuIG59ZnVuY3Rpb24gc3IodCxuLHIsZSl7cnx8KHI9e30pO2Zvcih2YXIgdT0tMSxvPW4ubGVuZ3RoOysrdTxvOyl7dmFyIGk9blt1XSxmPWU/ZShyW2ldLHRbaV0saSxyLHQpOnRbaV07WXQocixpLGYpfXJldHVybiByfWZ1bmN0aW9uIGhyKHQsbil7cmV0dXJuIHNyKHQsVHIodCksbik7XG59ZnVuY3Rpb24gcHIodCxuKXtyZXR1cm4gZnVuY3Rpb24ocix1KXt2YXIgbz15aShyKT9lOlF0LGk9bj9uKCk6e307cmV0dXJuIG8ocix0LEZyKHUpLGkpfX1mdW5jdGlvbiBfcih0KXtyZXR1cm4gTWUoZnVuY3Rpb24obixyKXt2YXIgZT0tMSx1PXIubGVuZ3RoLG89dT4xP3JbdS0xXTpULGk9dT4yP3JbMl06VCxvPXQubGVuZ3RoPjMmJnR5cGVvZiBvPT1cImZ1bmN0aW9uXCI/KHUtLSxvKTpUO2ZvcihpJiZ0ZShyWzBdLHJbMV0saSkmJihvPTM+dT9UOm8sdT0xKSxuPU9iamVjdChuKTsrK2U8dTspKGk9cltlXSkmJnQobixpLGUsbyk7cmV0dXJuIG59KX1mdW5jdGlvbiB2cih0LG4pe3JldHVybiBmdW5jdGlvbihyLGUpe2lmKG51bGw9PXIpcmV0dXJuIHI7aWYoIVVlKHIpKXJldHVybiB0KHIsZSk7Zm9yKHZhciB1PXIubGVuZ3RoLG89bj91Oi0xLGk9T2JqZWN0KHIpOyhuP28tLTorK288dSkmJmZhbHNlIT09ZShpW29dLG8saSk7KTtyZXR1cm4gcn19ZnVuY3Rpb24gZ3IodCl7cmV0dXJuIGZ1bmN0aW9uKG4scixlKXtcbnZhciB1PS0xLG89T2JqZWN0KG4pO2U9ZShuKTtmb3IodmFyIGk9ZS5sZW5ndGg7aS0tOyl7dmFyIGY9ZVt0P2k6Kyt1XTtpZihmYWxzZT09PXIob1tmXSxmLG8pKWJyZWFrfXJldHVybiBufX1mdW5jdGlvbiBkcih0LG4scil7ZnVuY3Rpb24gZSgpe3JldHVybih0aGlzJiZ0aGlzIT09S3QmJnRoaXMgaW5zdGFuY2VvZiBlP286dCkuYXBwbHkodT9yOnRoaXMsYXJndW1lbnRzKX12YXIgdT0xJm4sbz14cih0KTtyZXR1cm4gZX1mdW5jdGlvbiB5cih0KXtyZXR1cm4gZnVuY3Rpb24obil7bj1ldShuKTt2YXIgcj1XdC50ZXN0KG4pP24ubWF0Y2goSXQpOlQsZT1yP3JbMF06bi5jaGFyQXQoMCk7cmV0dXJuIG49cj91cihyLDEpLmpvaW4oXCJcIik6bi5zbGljZSgxKSxlW3RdKCkrbn19ZnVuY3Rpb24gYnIodCl7cmV0dXJuIGZ1bmN0aW9uKG4pe3JldHVybiBoKHN1KGx1KG4pLnJlcGxhY2UoRXQsXCJcIikpLHQsXCJcIil9fWZ1bmN0aW9uIHhyKHQpe3JldHVybiBmdW5jdGlvbigpe3ZhciBuPWFyZ3VtZW50cztcbnN3aXRjaChuLmxlbmd0aCl7Y2FzZSAwOnJldHVybiBuZXcgdDtjYXNlIDE6cmV0dXJuIG5ldyB0KG5bMF0pO2Nhc2UgMjpyZXR1cm4gbmV3IHQoblswXSxuWzFdKTtjYXNlIDM6cmV0dXJuIG5ldyB0KG5bMF0sblsxXSxuWzJdKTtjYXNlIDQ6cmV0dXJuIG5ldyB0KG5bMF0sblsxXSxuWzJdLG5bM10pO2Nhc2UgNTpyZXR1cm4gbmV3IHQoblswXSxuWzFdLG5bMl0sblszXSxuWzRdKTtjYXNlIDY6cmV0dXJuIG5ldyB0KG5bMF0sblsxXSxuWzJdLG5bM10sbls0XSxuWzVdKTtjYXNlIDc6cmV0dXJuIG5ldyB0KG5bMF0sblsxXSxuWzJdLG5bM10sbls0XSxuWzVdLG5bNl0pfXZhciByPXVuKHQucHJvdG90eXBlKSxuPXQuYXBwbHkocixuKTtyZXR1cm4gWmUobik/bjpyfX1mdW5jdGlvbiBqcih0LG4sZSl7ZnVuY3Rpb24gdSgpe2Zvcih2YXIgaT1hcmd1bWVudHMubGVuZ3RoLGY9QXJyYXkoaSksYz1pLGE9RHIodSk7Yy0tOylmW2NdPWFyZ3VtZW50c1tjXTtyZXR1cm4gYz0zPmkmJmZbMF0hPT1hJiZmW2ktMV0hPT1hP1tdOiQoZixhKSxcbmktPWMubGVuZ3RoLGU+aT9Ccih0LG4sQXIsdS5wbGFjZWhvbGRlcixULGYsYyxULFQsZS1pKTpyKHRoaXMmJnRoaXMhPT1LdCYmdGhpcyBpbnN0YW5jZW9mIHU/bzp0LHRoaXMsZil9dmFyIG89eHIodCk7cmV0dXJuIHV9ZnVuY3Rpb24gd3IodCl7cmV0dXJuIGZ1bmN0aW9uKG4scixlKXt2YXIgdT1PYmplY3Qobik7aWYocj1GcihyLDMpLCFVZShuKSl2YXIgbz1pdShuKTtyZXR1cm4gZT10KG98fG4sZnVuY3Rpb24odCxuKXtyZXR1cm4gbyYmKG49dCx0PXVbbl0pLHIodCxuLHUpfSxlKSxlPi0xP25bbz9vW2VdOmVdOlR9fWZ1bmN0aW9uIG1yKHQpe3JldHVybiBNZShmdW5jdGlvbihuKXtuPXNuKG4sMSk7dmFyIHI9bi5sZW5ndGgsZT1yLHU9enQucHJvdG90eXBlLnRocnU7Zm9yKHQmJm4ucmV2ZXJzZSgpO2UtLTspe3ZhciBvPW5bZV07aWYodHlwZW9mIG8hPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO2lmKHUmJiFpJiZcIndyYXBwZXJcIj09JHIobykpdmFyIGk9bmV3IHp0KFtdLHRydWUpO1xufWZvcihlPWk/ZTpyOysrZTxyOyl2YXIgbz1uW2VdLHU9JHIobyksZj1cIndyYXBwZXJcIj09dT9SbyhvKTpULGk9ZiYmcmUoZlswXSkmJjQyND09ZlsxXSYmIWZbNF0ubGVuZ3RoJiYxPT1mWzldP2lbJHIoZlswXSldLmFwcGx5KGksZlszXSk6MT09by5sZW5ndGgmJnJlKG8pP2lbdV0oKTppLnRocnUobyk7cmV0dXJuIGZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzLGU9dFswXTtpZihpJiYxPT10Lmxlbmd0aCYmeWkoZSkmJmUubGVuZ3RoPj0yMDApcmV0dXJuIGkucGxhbnQoZSkudmFsdWUoKTtmb3IodmFyIHU9MCx0PXI/blt1XS5hcHBseSh0aGlzLHQpOmU7Kyt1PHI7KXQ9blt1XS5jYWxsKHRoaXMsdCk7cmV0dXJuIHR9fSl9ZnVuY3Rpb24gQXIodCxuLHIsZSx1LG8saSxmLGMsYSl7ZnVuY3Rpb24gbCgpe2Zvcih2YXIgZD1hcmd1bWVudHMubGVuZ3RoLHk9QXJyYXkoZCksYj1kO2ItLTspeVtiXT1hcmd1bWVudHNbYl07aWYoXyl7dmFyIHgsaj1EcihsKSxiPXkubGVuZ3RoO2Zvcih4PTA7Yi0tOyl5W2JdPT09aiYmeCsrO1xufWlmKGUmJih5PWNyKHksZSx1LF8pKSxvJiYoeT1hcih5LG8saSxfKSksZC09eCxfJiZhPmQpcmV0dXJuIGo9JCh5LGopLEJyKHQsbixBcixsLnBsYWNlaG9sZGVyLHIseSxqLGYsYyxhLWQpO2lmKGo9aD9yOnRoaXMsYj1wP2pbdF06dCxkPXkubGVuZ3RoLGYpe3g9eS5sZW5ndGg7Zm9yKHZhciB3PXRvKGYubGVuZ3RoLHgpLG09bHIoeSk7dy0tOyl7dmFyIEE9Zlt3XTt5W3ddPVhyKEEseCk/bVtBXTpUfX1lbHNlIHYmJmQ+MSYmeS5yZXZlcnNlKCk7cmV0dXJuIHMmJmQ+YyYmKHkubGVuZ3RoPWMpLHRoaXMmJnRoaXMhPT1LdCYmdGhpcyBpbnN0YW5jZW9mIGwmJihiPWd8fHhyKGIpKSxiLmFwcGx5KGoseSl9dmFyIHM9MTI4Jm4saD0xJm4scD0yJm4sXz0yNCZuLHY9NTEyJm4sZz1wP1Q6eHIodCk7cmV0dXJuIGx9ZnVuY3Rpb24gT3IodCxuKXtyZXR1cm4gZnVuY3Rpb24ocixlKXtyZXR1cm4gam4ocix0LG4oZSkpfX1mdW5jdGlvbiBrcih0KXtyZXR1cm4gZnVuY3Rpb24obixyKXt2YXIgZTtcbmlmKG49PT1UJiZyPT09VClyZXR1cm4gMDtpZihuIT09VCYmKGU9biksciE9PVQpe2lmKGU9PT1UKXJldHVybiByO3R5cGVvZiBuPT1cInN0cmluZ1wifHx0eXBlb2Ygcj09XCJzdHJpbmdcIj8obj1ZbihuKSxyPVluKHIpKToobj1KbihuKSxyPUpuKHIpKSxlPXQobixyKX1yZXR1cm4gZX19ZnVuY3Rpb24gRXIodCl7cmV0dXJuIE1lKGZ1bmN0aW9uKG4pe3JldHVybiBuPTE9PW4ubGVuZ3RoJiZ5aShuWzBdKT9sKG5bMF0sTyhGcigpKSk6bChzbihuLDEsUXIpLE8oRnIoKSkpLE1lKGZ1bmN0aW9uKGUpe3ZhciB1PXRoaXM7cmV0dXJuIHQobixmdW5jdGlvbih0KXtyZXR1cm4gcih0LHUsZSl9KX0pfSl9ZnVuY3Rpb24gU3IodCxuKXtuPW49PT1UP1wiIFwiOlluKG4pO3ZhciByPW4ubGVuZ3RoO3JldHVybiAyPnI/cj9QbihuLHQpOm46KHI9UG4obixLdSh0L04obikpKSxXdC50ZXN0KG4pP3VyKHIubWF0Y2goSXQpLDAsdCkuam9pbihcIlwiKTpyLnNsaWNlKDAsdCkpfWZ1bmN0aW9uIElyKHQsbixlLHUpe1xuZnVuY3Rpb24gbygpe2Zvcih2YXIgbj0tMSxjPWFyZ3VtZW50cy5sZW5ndGgsYT0tMSxsPXUubGVuZ3RoLHM9QXJyYXkobCtjKSxoPXRoaXMmJnRoaXMhPT1LdCYmdGhpcyBpbnN0YW5jZW9mIG8/Zjp0OysrYTxsOylzW2FdPXVbYV07Zm9yKDtjLS07KXNbYSsrXT1hcmd1bWVudHNbKytuXTtyZXR1cm4gcihoLGk/ZTp0aGlzLHMpfXZhciBpPTEmbixmPXhyKHQpO3JldHVybiBvfWZ1bmN0aW9uIFJyKHQpe3JldHVybiBmdW5jdGlvbihuLHIsZSl7ZSYmdHlwZW9mIGUhPVwibnVtYmVyXCImJnRlKG4scixlKSYmKHI9ZT1UKSxuPW51KG4pLG49bj09PW4/bjowLHI9PT1UPyhyPW4sbj0wKTpyPW51KHIpfHwwLGU9ZT09PVQ/cj5uPzE6LTE6bnUoZSl8fDA7dmFyIHU9LTE7cj1YdShLdSgoci1uKS8oZXx8MSkpLDApO2Zvcih2YXIgbz1BcnJheShyKTtyLS07KW9bdD9yOisrdV09bixuKz1lO3JldHVybiBvfX1mdW5jdGlvbiBXcih0KXtyZXR1cm4gZnVuY3Rpb24obixyKXtyZXR1cm4gdHlwZW9mIG49PVwic3RyaW5nXCImJnR5cGVvZiByPT1cInN0cmluZ1wifHwobj1udShuKSxcbnI9bnUocikpLHQobixyKX19ZnVuY3Rpb24gQnIodCxuLHIsZSx1LG8saSxmLGMsYSl7dmFyIGw9OCZuLHM9bD9pOlQ7aT1sP1Q6aTt2YXIgaD1sP286VDtyZXR1cm4gbz1sP1Q6byxuPShufChsPzMyOjY0KSkmfihsPzY0OjMyKSw0Jm58fChuJj0tNCksbj1bdCxuLHUsaCxzLG8saSxmLGMsYV0scj1yLmFwcGx5KFQsbikscmUodCkmJk1vKHIsbiksci5wbGFjZWhvbGRlcj1lLHJ9ZnVuY3Rpb24gTHIodCl7dmFyIG49d3VbdF07cmV0dXJuIGZ1bmN0aW9uKHQscil7aWYodD1udSh0KSxyPXRvKFhlKHIpLDI5Mikpe3ZhciBlPShldSh0KStcImVcIikuc3BsaXQoXCJlXCIpLGU9bihlWzBdK1wiZVwiKygrZVsxXStyKSksZT0oZXUoZSkrXCJlXCIpLnNwbGl0KFwiZVwiKTtyZXR1cm4rKGVbMF0rXCJlXCIrKCtlWzFdLXIpKX1yZXR1cm4gbih0KX19ZnVuY3Rpb24gTXIodCl7cmV0dXJuIGZ1bmN0aW9uKG4pe3ZhciByPXFyKG4pO3JldHVyblwiW29iamVjdCBNYXBdXCI9PXI/VShuKTpcIltvYmplY3QgU2V0XVwiPT1yP0Yobik6QShuLHQobikpO1xufX1mdW5jdGlvbiBDcih0LG4scixlLHUsbyxpLGYpe3ZhciBjPTImbjtpZighYyYmdHlwZW9mIHQhPVwiZnVuY3Rpb25cIil0aHJvdyBuZXcgQXUoXCJFeHBlY3RlZCBhIGZ1bmN0aW9uXCIpO3ZhciBhPWU/ZS5sZW5ndGg6MDtpZihhfHwobiY9LTk3LGU9dT1UKSxpPWk9PT1UP2k6WHUoWGUoaSksMCksZj1mPT09VD9mOlhlKGYpLGEtPXU/dS5sZW5ndGg6MCw2NCZuKXt2YXIgbD1lLHM9dTtlPXU9VH12YXIgaD1jP1Q6Um8odCk7cmV0dXJuIG89W3QsbixyLGUsdSxsLHMsbyxpLGZdLGgmJihyPW9bMV0sdD1oWzFdLG49cnx0LGU9MTI4PT10JiY4PT1yfHwxMjg9PXQmJjI1Nj09ciYmaFs4XT49b1s3XS5sZW5ndGh8fDM4ND09dCYmaFs4XT49aFs3XS5sZW5ndGgmJjg9PXIsMTMxPm58fGUpJiYoMSZ0JiYob1syXT1oWzJdLG58PTEmcj8wOjQpLChyPWhbM10pJiYoZT1vWzNdLG9bM109ZT9jcihlLHIsaFs0XSk6cixvWzRdPWU/JChvWzNdLFwiX19sb2Rhc2hfcGxhY2Vob2xkZXJfX1wiKTpoWzRdKSxcbihyPWhbNV0pJiYoZT1vWzVdLG9bNV09ZT9hcihlLHIsaFs2XSk6cixvWzZdPWU/JChvWzVdLFwiX19sb2Rhc2hfcGxhY2Vob2xkZXJfX1wiKTpoWzZdKSwocj1oWzddKSYmKG9bN109ciksMTI4JnQmJihvWzhdPW51bGw9PW9bOF0/aFs4XTp0byhvWzhdLGhbOF0pKSxudWxsPT1vWzldJiYob1s5XT1oWzldKSxvWzBdPWhbMF0sb1sxXT1uKSx0PW9bMF0sbj1vWzFdLHI9b1syXSxlPW9bM10sdT1vWzRdLGY9b1s5XT1udWxsPT1vWzldP2M/MDp0Lmxlbmd0aDpYdShvWzldLWEsMCksIWYmJjI0Jm4mJihuJj0tMjUpLChoP1NvOk1vKShuJiYxIT1uPzg9PW58fDE2PT1uP2pyKHQsbixmKTozMiE9biYmMzMhPW58fHUubGVuZ3RoP0FyLmFwcGx5KFQsbyk6SXIodCxuLHIsZSk6ZHIodCxuLHIpLG8pfWZ1bmN0aW9uIHpyKHQsbixyLGUsdSxvKXt2YXIgaT0yJnUsZj10Lmxlbmd0aCxjPW4ubGVuZ3RoO2lmKGYhPWMmJiEoaSYmYz5mKSlyZXR1cm4gZmFsc2U7aWYoYz1vLmdldCh0KSlyZXR1cm4gYz09bjtcbnZhciBjPS0xLGE9dHJ1ZSxsPTEmdT9uZXcgWnQ6VDtmb3Ioby5zZXQodCxuKTsrK2M8Zjspe3ZhciBzPXRbY10saD1uW2NdO2lmKGUpdmFyIHA9aT9lKGgscyxjLG4sdCxvKTplKHMsaCxjLHQsbixvKTtpZihwIT09VCl7aWYocCljb250aW51ZTthPWZhbHNlO2JyZWFrfWlmKGwpe2lmKCFfKG4sZnVuY3Rpb24odCxuKXtyZXR1cm4gbC5oYXMobil8fHMhPT10JiYhcihzLHQsZSx1LG8pP3ZvaWQgMDpsLmFkZChuKX0pKXthPWZhbHNlO2JyZWFrfX1lbHNlIGlmKHMhPT1oJiYhcihzLGgsZSx1LG8pKXthPWZhbHNlO2JyZWFrfX1yZXR1cm4gb1tcImRlbGV0ZVwiXSh0KSxhfWZ1bmN0aW9uIFVyKHQsbixyLGUsdSxvLGkpe3N3aXRjaChyKXtjYXNlXCJbb2JqZWN0IERhdGFWaWV3XVwiOmlmKHQuYnl0ZUxlbmd0aCE9bi5ieXRlTGVuZ3RofHx0LmJ5dGVPZmZzZXQhPW4uYnl0ZU9mZnNldClicmVhazt0PXQuYnVmZmVyLG49bi5idWZmZXI7Y2FzZVwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIjppZih0LmJ5dGVMZW5ndGghPW4uYnl0ZUxlbmd0aHx8IWUobmV3IEZ1KHQpLG5ldyBGdShuKSkpYnJlYWs7XG5yZXR1cm4gdHJ1ZTtjYXNlXCJbb2JqZWN0IEJvb2xlYW5dXCI6Y2FzZVwiW29iamVjdCBEYXRlXVwiOnJldHVybit0PT0rbjtjYXNlXCJbb2JqZWN0IEVycm9yXVwiOnJldHVybiB0Lm5hbWU9PW4ubmFtZSYmdC5tZXNzYWdlPT1uLm1lc3NhZ2U7Y2FzZVwiW29iamVjdCBOdW1iZXJdXCI6cmV0dXJuIHQhPSt0P24hPStuOnQ9PStuO2Nhc2VcIltvYmplY3QgUmVnRXhwXVwiOmNhc2VcIltvYmplY3QgU3RyaW5nXVwiOnJldHVybiB0PT1uK1wiXCI7Y2FzZVwiW29iamVjdCBNYXBdXCI6dmFyIGY9VTtjYXNlXCJbb2JqZWN0IFNldF1cIjppZihmfHwoZj1EKSx0LnNpemUhPW4uc2l6ZSYmISgyJm8pKWJyZWFrO3JldHVybihyPWkuZ2V0KHQpKT9yPT1uOihvfD0xLGkuc2V0KHQsbiksenIoZih0KSxmKG4pLGUsdSxvLGkpKTtjYXNlXCJbb2JqZWN0IFN5bWJvbF1cIjppZih3bylyZXR1cm4gd28uY2FsbCh0KT09d28uY2FsbChuKX1yZXR1cm4gZmFsc2V9ZnVuY3Rpb24gJHIodCl7Zm9yKHZhciBuPXQubmFtZStcIlwiLHI9X29bbl0sZT1XdS5jYWxsKF9vLG4pP3IubGVuZ3RoOjA7ZS0tOyl7XG52YXIgdT1yW2VdLG89dS5mdW5jO2lmKG51bGw9PW98fG89PXQpcmV0dXJuIHUubmFtZX1yZXR1cm4gbn1mdW5jdGlvbiBEcih0KXtyZXR1cm4oV3UuY2FsbChPdCxcInBsYWNlaG9sZGVyXCIpP090OnQpLnBsYWNlaG9sZGVyfWZ1bmN0aW9uIEZyKCl7dmFyIHQ9T3QuaXRlcmF0ZWV8fF91LHQ9dD09PV91P2tuOnQ7cmV0dXJuIGFyZ3VtZW50cy5sZW5ndGg/dChhcmd1bWVudHNbMF0sYXJndW1lbnRzWzFdKTp0fWZ1bmN0aW9uIE5yKHQsbil7dmFyIHI9dC5fX2RhdGFfXyxlPXR5cGVvZiBuO3JldHVybihcInN0cmluZ1wiPT1lfHxcIm51bWJlclwiPT1lfHxcInN5bWJvbFwiPT1lfHxcImJvb2xlYW5cIj09ZT9cIl9fcHJvdG9fX1wiIT09bjpudWxsPT09bik/clt0eXBlb2Ygbj09XCJzdHJpbmdcIj9cInN0cmluZ1wiOlwiaGFzaFwiXTpyLm1hcH1mdW5jdGlvbiBQcih0KXtmb3IodmFyIG49aXUodCkscj1uLmxlbmd0aDtyLS07KXt2YXIgZT1uW3JdLHU9dFtlXTtuW3JdPVtlLHUsdT09PXUmJiFaZSh1KV19cmV0dXJuIG47XG59ZnVuY3Rpb24gWnIodCxuKXt2YXIgcj1udWxsPT10P1Q6dFtuXTtyZXR1cm4gT24ocik/cjpUfWZ1bmN0aW9uIFRyKHQpe3JldHVybiBQdShPYmplY3QodCkpfWZ1bmN0aW9uIHFyKHQpe3JldHVybiBNdS5jYWxsKHQpfWZ1bmN0aW9uIFZyKHQsbixyKXtuPW5lKG4sdCk/W25dOmVyKG4pO2Zvcih2YXIgZSx1PS0xLG89bi5sZW5ndGg7Kyt1PG87KXt2YXIgaT1mZShuW3VdKTtpZighKGU9bnVsbCE9dCYmcih0LGkpKSlicmVhazt0PXRbaV19cmV0dXJuIGU/ZToobz10P3QubGVuZ3RoOjAsISFvJiZQZShvKSYmWHIoaSxvKSYmKHlpKHQpfHxHZSh0KXx8emUodCkpKX1mdW5jdGlvbiBLcih0KXt2YXIgbj10Lmxlbmd0aCxyPXQuY29uc3RydWN0b3Iobik7cmV0dXJuIG4mJlwic3RyaW5nXCI9PXR5cGVvZiB0WzBdJiZXdS5jYWxsKHQsXCJpbmRleFwiKSYmKHIuaW5kZXg9dC5pbmRleCxyLmlucHV0PXQuaW5wdXQpLHJ9ZnVuY3Rpb24gR3IodCl7cmV0dXJuIHR5cGVvZiB0LmNvbnN0cnVjdG9yIT1cImZ1bmN0aW9uXCJ8fGVlKHQpP3t9OnVuKEp1KE9iamVjdCh0KSkpO1xufWZ1bmN0aW9uIEpyKHIsZSx1LG8pe3ZhciBpPXIuY29uc3RydWN0b3I7c3dpdGNoKGUpe2Nhc2VcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI6cmV0dXJuIGlyKHIpO2Nhc2VcIltvYmplY3QgQm9vbGVhbl1cIjpjYXNlXCJbb2JqZWN0IERhdGVdXCI6cmV0dXJuIG5ldyBpKCtyKTtjYXNlXCJbb2JqZWN0IERhdGFWaWV3XVwiOnJldHVybiBlPW8/aXIoci5idWZmZXIpOnIuYnVmZmVyLG5ldyByLmNvbnN0cnVjdG9yKGUsci5ieXRlT2Zmc2V0LHIuYnl0ZUxlbmd0aCk7Y2FzZVwiW29iamVjdCBGbG9hdDMyQXJyYXldXCI6Y2FzZVwiW29iamVjdCBGbG9hdDY0QXJyYXldXCI6Y2FzZVwiW29iamVjdCBJbnQ4QXJyYXldXCI6Y2FzZVwiW29iamVjdCBJbnQxNkFycmF5XVwiOmNhc2VcIltvYmplY3QgSW50MzJBcnJheV1cIjpjYXNlXCJbb2JqZWN0IFVpbnQ4QXJyYXldXCI6Y2FzZVwiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIjpjYXNlXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiOmNhc2VcIltvYmplY3QgVWludDMyQXJyYXldXCI6XG5yZXR1cm4gZT1vP2lyKHIuYnVmZmVyKTpyLmJ1ZmZlcixuZXcgci5jb25zdHJ1Y3RvcihlLHIuYnl0ZU9mZnNldCxyLmxlbmd0aCk7Y2FzZVwiW29iamVjdCBNYXBdXCI6cmV0dXJuIGU9bz91KFUociksdHJ1ZSk6VShyKSxoKGUsdCxuZXcgci5jb25zdHJ1Y3Rvcik7Y2FzZVwiW29iamVjdCBOdW1iZXJdXCI6Y2FzZVwiW29iamVjdCBTdHJpbmddXCI6cmV0dXJuIG5ldyBpKHIpO2Nhc2VcIltvYmplY3QgUmVnRXhwXVwiOnJldHVybiBlPW5ldyByLmNvbnN0cnVjdG9yKHIuc291cmNlLF90LmV4ZWMocikpLGUubGFzdEluZGV4PXIubGFzdEluZGV4LGU7Y2FzZVwiW29iamVjdCBTZXRdXCI6cmV0dXJuIGU9bz91KEQociksdHJ1ZSk6RChyKSxoKGUsbixuZXcgci5jb25zdHJ1Y3Rvcik7Y2FzZVwiW29iamVjdCBTeW1ib2xdXCI6cmV0dXJuIHdvP09iamVjdCh3by5jYWxsKHIpKTp7fX19ZnVuY3Rpb24gWXIodCl7dmFyIG49dD90Lmxlbmd0aDpUO3JldHVybiBQZShuKSYmKHlpKHQpfHxHZSh0KXx8emUodCkpP20obixTdHJpbmcpOm51bGw7XG59ZnVuY3Rpb24gSHIodCl7cmV0dXJuIHlpKHQpfHx6ZSh0KX1mdW5jdGlvbiBRcih0KXtyZXR1cm4geWkodCkmJiEoMj09dC5sZW5ndGgmJiFGZSh0WzBdKSl9ZnVuY3Rpb24gWHIodCxuKXtyZXR1cm4gbj1udWxsPT1uPzkwMDcxOTkyNTQ3NDA5OTE6biwhIW4mJih0eXBlb2YgdD09XCJudW1iZXJcInx8eHQudGVzdCh0KSkmJnQ+LTEmJjA9PXQlMSYmbj50fWZ1bmN0aW9uIHRlKHQsbixyKXtpZighWmUocikpcmV0dXJuIGZhbHNlO3ZhciBlPXR5cGVvZiBuO3JldHVybihcIm51bWJlclwiPT1lP1VlKHIpJiZYcihuLHIubGVuZ3RoKTpcInN0cmluZ1wiPT1lJiZuIGluIHIpP0NlKHJbbl0sdCk6ZmFsc2V9ZnVuY3Rpb24gbmUodCxuKXtpZih5aSh0KSlyZXR1cm4gZmFsc2U7dmFyIHI9dHlwZW9mIHQ7cmV0dXJuXCJudW1iZXJcIj09cnx8XCJzeW1ib2xcIj09cnx8XCJib29sZWFuXCI9PXJ8fG51bGw9PXR8fEplKHQpP3RydWU6dXQudGVzdCh0KXx8IWV0LnRlc3QodCl8fG51bGwhPW4mJnQgaW4gT2JqZWN0KG4pfWZ1bmN0aW9uIHJlKHQpe1xudmFyIG49JHIodCkscj1PdFtuXTtyZXR1cm4gdHlwZW9mIHI9PVwiZnVuY3Rpb25cIiYmbiBpbiBVdC5wcm90b3R5cGU/dD09PXI/dHJ1ZToobj1SbyhyKSwhIW4mJnQ9PT1uWzBdKTpmYWxzZX1mdW5jdGlvbiBlZSh0KXt2YXIgbj10JiZ0LmNvbnN0cnVjdG9yO3JldHVybiB0PT09KHR5cGVvZiBuPT1cImZ1bmN0aW9uXCImJm4ucHJvdG90eXBlfHxrdSl9ZnVuY3Rpb24gdWUodCxuKXtyZXR1cm4gZnVuY3Rpb24ocil7cmV0dXJuIG51bGw9PXI/ZmFsc2U6clt0XT09PW4mJihuIT09VHx8dCBpbiBPYmplY3QocikpfX1mdW5jdGlvbiBvZSh0LG4scixlLHUsbyl7cmV0dXJuIFplKHQpJiZaZShuKSYmQm4odCxuLFQsb2Usby5zZXQobix0KSksdH1mdW5jdGlvbiBpZSh0LG4pe3JldHVybiAxPT1uLmxlbmd0aD90OnZuKHQsVG4obiwwLC0xKSl9ZnVuY3Rpb24gZmUodCl7aWYodHlwZW9mIHQ9PVwic3RyaW5nXCJ8fEplKHQpKXJldHVybiB0O3ZhciBuPXQrXCJcIjtyZXR1cm5cIjBcIj09biYmMS90PT0tcT9cIi0wXCI6bn1mdW5jdGlvbiBjZSh0KXtcbmlmKG51bGwhPXQpe3RyeXtyZXR1cm4gUnUuY2FsbCh0KX1jYXRjaChuKXt9cmV0dXJuIHQrXCJcIn1yZXR1cm5cIlwifWZ1bmN0aW9uIGFlKHQpe2lmKHQgaW5zdGFuY2VvZiBVdClyZXR1cm4gdC5jbG9uZSgpO3ZhciBuPW5ldyB6dCh0Ll9fd3JhcHBlZF9fLHQuX19jaGFpbl9fKTtyZXR1cm4gbi5fX2FjdGlvbnNfXz1scih0Ll9fYWN0aW9uc19fKSxuLl9faW5kZXhfXz10Ll9faW5kZXhfXyxuLl9fdmFsdWVzX189dC5fX3ZhbHVlc19fLG59ZnVuY3Rpb24gbGUodCxuLHIpe3ZhciBlPXQ/dC5sZW5ndGg6MDtyZXR1cm4gZT8obj1yfHxuPT09VD8xOlhlKG4pLFRuKHQsMD5uPzA6bixlKSk6W119ZnVuY3Rpb24gc2UodCxuLHIpe3ZhciBlPXQ/dC5sZW5ndGg6MDtyZXR1cm4gZT8obj1yfHxuPT09VD8xOlhlKG4pLG49ZS1uLFRuKHQsMCwwPm4/MDpuKSk6W119ZnVuY3Rpb24gaGUodCxuLHIpe3ZhciBlPXQ/dC5sZW5ndGg6MDtyZXR1cm4gZT8ocj1udWxsPT1yPzA6WGUociksMD5yJiYocj1YdShlK3IsMCkpLFxuZyh0LEZyKG4sMykscikpOi0xfWZ1bmN0aW9uIHBlKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7aWYoIWUpcmV0dXJuLTE7dmFyIHU9ZS0xO3JldHVybiByIT09VCYmKHU9WGUociksdT0wPnI/WHUoZSt1LDApOnRvKHUsZS0xKSksZyh0LEZyKG4sMyksdSx0cnVlKX1mdW5jdGlvbiBfZSh0KXtyZXR1cm4gdCYmdC5sZW5ndGg/dFswXTpUfWZ1bmN0aW9uIHZlKHQpe3ZhciBuPXQ/dC5sZW5ndGg6MDtyZXR1cm4gbj90W24tMV06VH1mdW5jdGlvbiBnZSh0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aCYmbiYmbi5sZW5ndGg/RG4odCxuKTp0fWZ1bmN0aW9uIGRlKHQpe3JldHVybiB0P3VvLmNhbGwodCk6dH1mdW5jdGlvbiB5ZSh0KXtpZighdHx8IXQubGVuZ3RoKXJldHVybltdO3ZhciBuPTA7cmV0dXJuIHQ9Zih0LGZ1bmN0aW9uKHQpe3JldHVybiAkZSh0KT8obj1YdSh0Lmxlbmd0aCxuKSx0cnVlKTp2b2lkIDB9KSxtKG4sZnVuY3Rpb24obil7cmV0dXJuIGwodCxVbihuKSl9KX1mdW5jdGlvbiBiZSh0LG4pe1xuaWYoIXR8fCF0Lmxlbmd0aClyZXR1cm5bXTt2YXIgZT15ZSh0KTtyZXR1cm4gbnVsbD09bj9lOmwoZSxmdW5jdGlvbih0KXtyZXR1cm4gcihuLFQsdCl9KX1mdW5jdGlvbiB4ZSh0KXtyZXR1cm4gdD1PdCh0KSx0Ll9fY2hhaW5fXz10cnVlLHR9ZnVuY3Rpb24gamUodCxuKXtyZXR1cm4gbih0KX1mdW5jdGlvbiB3ZSgpe3JldHVybiB0aGlzfWZ1bmN0aW9uIG1lKHQsbil7cmV0dXJuKHlpKHQpP3U6QW8pKHQsRnIobiwzKSl9ZnVuY3Rpb24gQWUodCxuKXtyZXR1cm4oeWkodCk/bzpPbykodCxGcihuLDMpKX1mdW5jdGlvbiBPZSh0LG4pe3JldHVybih5aSh0KT9sOkluKSh0LEZyKG4sMykpfWZ1bmN0aW9uIGtlKHQsbixyKXt2YXIgZT0tMSx1PUhlKHQpLG89dS5sZW5ndGgsaT1vLTE7Zm9yKG49KHI/dGUodCxuLHIpOm49PT1UKT8xOm5uKFhlKG4pLDAsbyk7KytlPG47KXQ9Tm4oZSxpKSxyPXVbdF0sdVt0XT11W2VdLHVbZV09cjtyZXR1cm4gdS5sZW5ndGg9bix1fWZ1bmN0aW9uIEVlKCl7XG5yZXR1cm4geHUubm93KCl9ZnVuY3Rpb24gU2UodCxuLHIpe3JldHVybiBuPXI/VDpuLG49dCYmbnVsbD09bj90Lmxlbmd0aDpuLENyKHQsMTI4LFQsVCxULFQsbil9ZnVuY3Rpb24gSWUodCxuKXt2YXIgcjtpZih0eXBlb2YgbiE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIHQ9WGUodCksZnVuY3Rpb24oKXtyZXR1cm4gMDwtLXQmJihyPW4uYXBwbHkodGhpcyxhcmd1bWVudHMpKSwxPj10JiYobj1UKSxyfX1mdW5jdGlvbiBSZSh0LG4scil7cmV0dXJuIG49cj9UOm4sdD1Dcih0LDgsVCxULFQsVCxULG4pLHQucGxhY2Vob2xkZXI9UmUucGxhY2Vob2xkZXIsdH1mdW5jdGlvbiBXZSh0LG4scil7cmV0dXJuIG49cj9UOm4sdD1Dcih0LDE2LFQsVCxULFQsVCxuKSx0LnBsYWNlaG9sZGVyPVdlLnBsYWNlaG9sZGVyLHR9ZnVuY3Rpb24gQmUodCxuLHIpe2Z1bmN0aW9uIGUobil7dmFyIHI9YyxlPWE7cmV0dXJuIGM9YT1ULF89bixzPXQuYXBwbHkoZSxyKTtcbn1mdW5jdGlvbiB1KHQpe3ZhciByPXQtcDtyZXR1cm4gdC09XyxwPT09VHx8cj49bnx8MD5yfHxnJiZ0Pj1sfWZ1bmN0aW9uIG8oKXt2YXIgdD1FZSgpO2lmKHUodCkpcmV0dXJuIGkodCk7dmFyIHI7cj10LV8sdD1uLSh0LXApLHI9Zz90byh0LGwtcik6dCxoPUF0KG8scil9ZnVuY3Rpb24gaSh0KXtyZXR1cm4gaD1ULGQmJmM/ZSh0KTooYz1hPVQscyl9ZnVuY3Rpb24gZigpe3ZhciB0PUVlKCkscj11KHQpO2lmKGM9YXJndW1lbnRzLGE9dGhpcyxwPXQscil7aWYoaD09PVQpcmV0dXJuIF89dD1wLGg9QXQobyxuKSx2P2UodCk6cztpZihnKXJldHVybiBoPUF0KG8sbiksZShwKX1yZXR1cm4gaD09PVQmJihoPUF0KG8sbikpLHN9dmFyIGMsYSxsLHMsaCxwLF89MCx2PWZhbHNlLGc9ZmFsc2UsZD10cnVlO2lmKHR5cGVvZiB0IT1cImZ1bmN0aW9uXCIpdGhyb3cgbmV3IEF1KFwiRXhwZWN0ZWQgYSBmdW5jdGlvblwiKTtyZXR1cm4gbj1udShuKXx8MCxaZShyKSYmKHY9ISFyLmxlYWRpbmcsbD0oZz1cIm1heFdhaXRcImluIHIpP1h1KG51KHIubWF4V2FpdCl8fDAsbik6bCxcbmQ9XCJ0cmFpbGluZ1wiaW4gcj8hIXIudHJhaWxpbmc6ZCksZi5jYW5jZWw9ZnVuY3Rpb24oKXtfPTAsYz1wPWE9aD1UfSxmLmZsdXNoPWZ1bmN0aW9uKCl7cmV0dXJuIGg9PT1UP3M6aShFZSgpKX0sZn1mdW5jdGlvbiBMZSh0LG4pe2Z1bmN0aW9uIHIoKXt2YXIgZT1hcmd1bWVudHMsdT1uP24uYXBwbHkodGhpcyxlKTplWzBdLG89ci5jYWNoZTtyZXR1cm4gby5oYXModSk/by5nZXQodSk6KGU9dC5hcHBseSh0aGlzLGUpLHIuY2FjaGU9by5zZXQodSxlKSxlKX1pZih0eXBlb2YgdCE9XCJmdW5jdGlvblwifHxuJiZ0eXBlb2YgbiE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIHIuY2FjaGU9bmV3KExlLkNhY2hlfHxQdCkscn1mdW5jdGlvbiBNZSh0LG4pe2lmKHR5cGVvZiB0IT1cImZ1bmN0aW9uXCIpdGhyb3cgbmV3IEF1KFwiRXhwZWN0ZWQgYSBmdW5jdGlvblwiKTtyZXR1cm4gbj1YdShuPT09VD90Lmxlbmd0aC0xOlhlKG4pLDApLGZ1bmN0aW9uKCl7XG5mb3IodmFyIGU9YXJndW1lbnRzLHU9LTEsbz1YdShlLmxlbmd0aC1uLDApLGk9QXJyYXkobyk7Kyt1PG87KWlbdV09ZVtuK3VdO3N3aXRjaChuKXtjYXNlIDA6cmV0dXJuIHQuY2FsbCh0aGlzLGkpO2Nhc2UgMTpyZXR1cm4gdC5jYWxsKHRoaXMsZVswXSxpKTtjYXNlIDI6cmV0dXJuIHQuY2FsbCh0aGlzLGVbMF0sZVsxXSxpKX1mb3Iobz1BcnJheShuKzEpLHU9LTE7Kyt1PG47KW9bdV09ZVt1XTtyZXR1cm4gb1tuXT1pLHIodCx0aGlzLG8pfX1mdW5jdGlvbiBDZSh0LG4pe3JldHVybiB0PT09bnx8dCE9PXQmJm4hPT1ufWZ1bmN0aW9uIHplKHQpe3JldHVybiAkZSh0KSYmV3UuY2FsbCh0LFwiY2FsbGVlXCIpJiYoIXF1LmNhbGwodCxcImNhbGxlZVwiKXx8XCJbb2JqZWN0IEFyZ3VtZW50c11cIj09TXUuY2FsbCh0KSl9ZnVuY3Rpb24gVWUodCl7cmV0dXJuIG51bGwhPXQmJlBlKFdvKHQpKSYmIUZlKHQpfWZ1bmN0aW9uICRlKHQpe3JldHVybiBUZSh0KSYmVWUodCl9ZnVuY3Rpb24gRGUodCl7XG5yZXR1cm4gVGUodCk/XCJbb2JqZWN0IEVycm9yXVwiPT1NdS5jYWxsKHQpfHx0eXBlb2YgdC5tZXNzYWdlPT1cInN0cmluZ1wiJiZ0eXBlb2YgdC5uYW1lPT1cInN0cmluZ1wiOmZhbHNlfWZ1bmN0aW9uIEZlKHQpe3JldHVybiB0PVplKHQpP011LmNhbGwodCk6XCJcIixcIltvYmplY3QgRnVuY3Rpb25dXCI9PXR8fFwiW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl1cIj09dH1mdW5jdGlvbiBOZSh0KXtyZXR1cm4gdHlwZW9mIHQ9PVwibnVtYmVyXCImJnQ9PVhlKHQpfWZ1bmN0aW9uIFBlKHQpe3JldHVybiB0eXBlb2YgdD09XCJudW1iZXJcIiYmdD4tMSYmMD09dCUxJiY5MDA3MTk5MjU0NzQwOTkxPj10fWZ1bmN0aW9uIFplKHQpe3ZhciBuPXR5cGVvZiB0O3JldHVybiEhdCYmKFwib2JqZWN0XCI9PW58fFwiZnVuY3Rpb25cIj09bil9ZnVuY3Rpb24gVGUodCl7cmV0dXJuISF0JiZ0eXBlb2YgdD09XCJvYmplY3RcIn1mdW5jdGlvbiBxZSh0KXtyZXR1cm4gdHlwZW9mIHQ9PVwibnVtYmVyXCJ8fFRlKHQpJiZcIltvYmplY3QgTnVtYmVyXVwiPT1NdS5jYWxsKHQpO1xufWZ1bmN0aW9uIFZlKHQpe3JldHVybiFUZSh0KXx8XCJbb2JqZWN0IE9iamVjdF1cIiE9TXUuY2FsbCh0KXx8Qyh0KT9mYWxzZToodD1KdShPYmplY3QodCkpLG51bGw9PT10P3RydWU6KHQ9V3UuY2FsbCh0LFwiY29uc3RydWN0b3JcIikmJnQuY29uc3RydWN0b3IsdHlwZW9mIHQ9PVwiZnVuY3Rpb25cIiYmdCBpbnN0YW5jZW9mIHQmJlJ1LmNhbGwodCk9PUx1KSl9ZnVuY3Rpb24gS2UodCl7cmV0dXJuIFplKHQpJiZcIltvYmplY3QgUmVnRXhwXVwiPT1NdS5jYWxsKHQpfWZ1bmN0aW9uIEdlKHQpe3JldHVybiB0eXBlb2YgdD09XCJzdHJpbmdcInx8IXlpKHQpJiZUZSh0KSYmXCJbb2JqZWN0IFN0cmluZ11cIj09TXUuY2FsbCh0KX1mdW5jdGlvbiBKZSh0KXtyZXR1cm4gdHlwZW9mIHQ9PVwic3ltYm9sXCJ8fFRlKHQpJiZcIltvYmplY3QgU3ltYm9sXVwiPT1NdS5jYWxsKHQpfWZ1bmN0aW9uIFllKHQpe3JldHVybiBUZSh0KSYmUGUodC5sZW5ndGgpJiYhIU10W011LmNhbGwodCldfWZ1bmN0aW9uIEhlKHQpe2lmKCF0KXJldHVybltdO1xuaWYoVWUodCkpcmV0dXJuIEdlKHQpP3QubWF0Y2goSXQpOmxyKHQpO2lmKFp1JiZ0W1p1XSlyZXR1cm4geih0W1p1XSgpKTt2YXIgbj1xcih0KTtyZXR1cm4oXCJbb2JqZWN0IE1hcF1cIj09bj9VOlwiW29iamVjdCBTZXRdXCI9PW4/RDpjdSkodCl9ZnVuY3Rpb24gUWUodCl7cmV0dXJuIHQ/KHQ9bnUodCksdD09PXF8fHQ9PT0tcT8xLjc5NzY5MzEzNDg2MjMxNTdlMzA4KigwPnQ/LTE6MSk6dD09PXQ/dDowKTowPT09dD90OjB9ZnVuY3Rpb24gWGUodCl7dD1RZSh0KTt2YXIgbj10JTE7cmV0dXJuIHQ9PT10P24/dC1uOnQ6MH1mdW5jdGlvbiB0dSh0KXtyZXR1cm4gdD9ubihYZSh0KSwwLDQyOTQ5NjcyOTUpOjB9ZnVuY3Rpb24gbnUodCl7aWYodHlwZW9mIHQ9PVwibnVtYmVyXCIpcmV0dXJuIHQ7aWYoSmUodCkpcmV0dXJuIFY7aWYoWmUodCkmJih0PUZlKHQudmFsdWVPZik/dC52YWx1ZU9mKCk6dCx0PVplKHQpP3QrXCJcIjp0KSx0eXBlb2YgdCE9XCJzdHJpbmdcIilyZXR1cm4gMD09PXQ/dDordDtcbnQ9dC5yZXBsYWNlKGN0LFwiXCIpO3ZhciBuPWR0LnRlc3QodCk7cmV0dXJuIG58fGJ0LnRlc3QodCk/TnQodC5zbGljZSgyKSxuPzI6OCk6Z3QudGVzdCh0KT9WOit0fWZ1bmN0aW9uIHJ1KHQpe3JldHVybiBzcih0LGZ1KHQpKX1mdW5jdGlvbiBldSh0KXtyZXR1cm4gbnVsbD09dD9cIlwiOlluKHQpfWZ1bmN0aW9uIHV1KHQsbixyKXtyZXR1cm4gdD1udWxsPT10P1Q6dm4odCxuKSx0PT09VD9yOnR9ZnVuY3Rpb24gb3UodCxuKXtyZXR1cm4gbnVsbCE9dCYmVnIodCxuLGJuKX1mdW5jdGlvbiBpdSh0KXt2YXIgbj1lZSh0KTtpZighbiYmIVVlKHQpKXJldHVybiBRdShPYmplY3QodCkpO3ZhciByLGU9WXIodCksdT0hIWUsZT1lfHxbXSxvPWUubGVuZ3RoO2ZvcihyIGluIHQpIXluKHQscil8fHUmJihcImxlbmd0aFwiPT1yfHxYcihyLG8pKXx8biYmXCJjb25zdHJ1Y3RvclwiPT1yfHxlLnB1c2gocik7cmV0dXJuIGV9ZnVuY3Rpb24gZnUodCl7Zm9yKHZhciBuPS0xLHI9ZWUodCksZT1Fbih0KSx1PWUubGVuZ3RoLG89WXIodCksaT0hIW8sbz1vfHxbXSxmPW8ubGVuZ3RoOysrbjx1Oyl7XG52YXIgYz1lW25dO2kmJihcImxlbmd0aFwiPT1jfHxYcihjLGYpKXx8XCJjb25zdHJ1Y3RvclwiPT1jJiYocnx8IVd1LmNhbGwodCxjKSl8fG8ucHVzaChjKX1yZXR1cm4gb31mdW5jdGlvbiBjdSh0KXtyZXR1cm4gdD9rKHQsaXUodCkpOltdfWZ1bmN0aW9uIGF1KHQpe3JldHVybiBxaShldSh0KS50b0xvd2VyQ2FzZSgpKX1mdW5jdGlvbiBsdSh0KXtyZXR1cm4odD1ldSh0KSkmJnQucmVwbGFjZShqdCxXKS5yZXBsYWNlKFN0LFwiXCIpfWZ1bmN0aW9uIHN1KHQsbixyKXtyZXR1cm4gdD1ldSh0KSxuPXI/VDpuLG49PT1UJiYobj1CdC50ZXN0KHQpP1J0OnN0KSx0Lm1hdGNoKG4pfHxbXX1mdW5jdGlvbiBodSh0KXtyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gdH19ZnVuY3Rpb24gcHUodCl7cmV0dXJuIHR9ZnVuY3Rpb24gX3UodCl7cmV0dXJuIGtuKHR5cGVvZiB0PT1cImZ1bmN0aW9uXCI/dDpybih0LHRydWUpKX1mdW5jdGlvbiB2dSh0LG4scil7dmFyIGU9aXUobiksbz1fbihuLGUpO251bGwhPXJ8fFplKG4pJiYoby5sZW5ndGh8fCFlLmxlbmd0aCl8fChyPW4sXG5uPXQsdD10aGlzLG89X24obixpdShuKSkpO3ZhciBpPSEoWmUocikmJlwiY2hhaW5cImluIHImJiFyLmNoYWluKSxmPUZlKHQpO3JldHVybiB1KG8sZnVuY3Rpb24ocil7dmFyIGU9bltyXTt0W3JdPWUsZiYmKHQucHJvdG90eXBlW3JdPWZ1bmN0aW9uKCl7dmFyIG49dGhpcy5fX2NoYWluX187aWYoaXx8bil7dmFyIHI9dCh0aGlzLl9fd3JhcHBlZF9fKTtyZXR1cm4oci5fX2FjdGlvbnNfXz1scih0aGlzLl9fYWN0aW9uc19fKSkucHVzaCh7ZnVuYzplLGFyZ3M6YXJndW1lbnRzLHRoaXNBcmc6dH0pLHIuX19jaGFpbl9fPW4scn1yZXR1cm4gZS5hcHBseSh0LHMoW3RoaXMudmFsdWUoKV0sYXJndW1lbnRzKSl9KX0pLHR9ZnVuY3Rpb24gZ3UoKXt9ZnVuY3Rpb24gZHUodCl7cmV0dXJuIG5lKHQpP1VuKGZlKHQpKTokbih0KX1mdW5jdGlvbiB5dSgpe3JldHVybltdfWZ1bmN0aW9uIGJ1KCl7cmV0dXJuIGZhbHNlfVI9Uj9HdC5kZWZhdWx0cyh7fSxSLEd0LnBpY2soS3QsTHQpKTpLdDt2YXIgeHU9Ui5EYXRlLGp1PVIuRXJyb3Isd3U9Ui5NYXRoLG11PVIuUmVnRXhwLEF1PVIuVHlwZUVycm9yLE91PVIuQXJyYXkucHJvdG90eXBlLGt1PVIuT2JqZWN0LnByb3RvdHlwZSxFdT1SLlN0cmluZy5wcm90b3R5cGUsU3U9UltcIl9fY29yZS1qc19zaGFyZWRfX1wiXSxJdT1mdW5jdGlvbigpe1xudmFyIHQ9L1teLl0rJC8uZXhlYyhTdSYmU3Uua2V5cyYmU3Uua2V5cy5JRV9QUk9UT3x8XCJcIik7cmV0dXJuIHQ/XCJTeW1ib2woc3JjKV8xLlwiK3Q6XCJcIn0oKSxSdT1SLkZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZyxXdT1rdS5oYXNPd25Qcm9wZXJ0eSxCdT0wLEx1PVJ1LmNhbGwoT2JqZWN0KSxNdT1rdS50b1N0cmluZyxDdT1LdC5fLHp1PW11KFwiXlwiK1J1LmNhbGwoV3UpLnJlcGxhY2UoaXQsXCJcXFxcJCZcIikucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZyxcIiQxLio/XCIpK1wiJFwiKSxVdT1UdD9SLkJ1ZmZlcjpULCR1PVIuUmVmbGVjdCxEdT1SLlN5bWJvbCxGdT1SLlVpbnQ4QXJyYXksTnU9JHU/JHUuZjpULFB1PU9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMsWnU9dHlwZW9mKFp1PUR1JiZEdS5pdGVyYXRvcik9PVwic3ltYm9sXCI/WnU6VCxUdT1PYmplY3QuY3JlYXRlLHF1PWt1LnByb3BlcnR5SXNFbnVtZXJhYmxlLFZ1PU91LnNwbGljZSxLdT13dS5jZWlsLEd1PXd1LmZsb29yLEp1PU9iamVjdC5nZXRQcm90b3R5cGVPZixZdT1SLmlzRmluaXRlLEh1PU91LmpvaW4sUXU9T2JqZWN0LmtleXMsWHU9d3UubWF4LHRvPXd1Lm1pbixubz1SLnBhcnNlSW50LHJvPXd1LnJhbmRvbSxlbz1FdS5yZXBsYWNlLHVvPU91LnJldmVyc2Usb289RXUuc3BsaXQsaW89WnIoUixcIkRhdGFWaWV3XCIpLGZvPVpyKFIsXCJNYXBcIiksY289WnIoUixcIlByb21pc2VcIiksYW89WnIoUixcIlNldFwiKSxsbz1acihSLFwiV2Vha01hcFwiKSxzbz1acihPYmplY3QsXCJjcmVhdGVcIiksaG89bG8mJm5ldyBsbyxwbz0hcXUuY2FsbCh7XG52YWx1ZU9mOjF9LFwidmFsdWVPZlwiKSxfbz17fSx2bz1jZShpbyksZ289Y2UoZm8pLHlvPWNlKGNvKSxibz1jZShhbykseG89Y2UobG8pLGpvPUR1P0R1LnByb3RvdHlwZTpULHdvPWpvP2pvLnZhbHVlT2Y6VCxtbz1qbz9qby50b1N0cmluZzpUO090LnRlbXBsYXRlU2V0dGluZ3M9e2VzY2FwZTp0dCxldmFsdWF0ZTpudCxpbnRlcnBvbGF0ZTpydCx2YXJpYWJsZTpcIlwiLGltcG9ydHM6e186T3R9fSxPdC5wcm90b3R5cGU9a3QucHJvdG90eXBlLE90LnByb3RvdHlwZS5jb25zdHJ1Y3Rvcj1PdCx6dC5wcm90b3R5cGU9dW4oa3QucHJvdG90eXBlKSx6dC5wcm90b3R5cGUuY29uc3RydWN0b3I9enQsVXQucHJvdG90eXBlPXVuKGt0LnByb3RvdHlwZSksVXQucHJvdG90eXBlLmNvbnN0cnVjdG9yPVV0LCR0LnByb3RvdHlwZS5jbGVhcj1mdW5jdGlvbigpe3RoaXMuX19kYXRhX189c28/c28obnVsbCk6e319LCR0LnByb3RvdHlwZVtcImRlbGV0ZVwiXT1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5oYXModCkmJmRlbGV0ZSB0aGlzLl9fZGF0YV9fW3RdO1xufSwkdC5wcm90b3R5cGUuZ2V0PWZ1bmN0aW9uKHQpe3ZhciBuPXRoaXMuX19kYXRhX187cmV0dXJuIHNvPyh0PW5bdF0sXCJfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fXCI9PT10P1Q6dCk6V3UuY2FsbChuLHQpP25bdF06VH0sJHQucHJvdG90eXBlLmhhcz1mdW5jdGlvbih0KXt2YXIgbj10aGlzLl9fZGF0YV9fO3JldHVybiBzbz9uW3RdIT09VDpXdS5jYWxsKG4sdCl9LCR0LnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdGhpcy5fX2RhdGFfX1t0XT1zbyYmbj09PVQ/XCJfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fXCI6bix0aGlzfSxEdC5wcm90b3R5cGUuY2xlYXI9ZnVuY3Rpb24oKXt0aGlzLl9fZGF0YV9fPVtdfSxEdC5wcm90b3R5cGVbXCJkZWxldGVcIl09ZnVuY3Rpb24odCl7dmFyIG49dGhpcy5fX2RhdGFfXztyZXR1cm4gdD1IdChuLHQpLDA+dD9mYWxzZToodD09bi5sZW5ndGgtMT9uLnBvcCgpOlZ1LmNhbGwobix0LDEpLHRydWUpfSxEdC5wcm90b3R5cGUuZ2V0PWZ1bmN0aW9uKHQpe1xudmFyIG49dGhpcy5fX2RhdGFfXztyZXR1cm4gdD1IdChuLHQpLDA+dD9UOm5bdF1bMV19LER0LnByb3RvdHlwZS5oYXM9ZnVuY3Rpb24odCl7cmV0dXJuLTE8SHQodGhpcy5fX2RhdGFfXyx0KX0sRHQucHJvdG90eXBlLnNldD1mdW5jdGlvbih0LG4pe3ZhciByPXRoaXMuX19kYXRhX18sZT1IdChyLHQpO3JldHVybiAwPmU/ci5wdXNoKFt0LG5dKTpyW2VdWzFdPW4sdGhpc30sUHQucHJvdG90eXBlLmNsZWFyPWZ1bmN0aW9uKCl7dGhpcy5fX2RhdGFfXz17aGFzaDpuZXcgJHQsbWFwOm5ldyhmb3x8RHQpLHN0cmluZzpuZXcgJHR9fSxQdC5wcm90b3R5cGVbXCJkZWxldGVcIl09ZnVuY3Rpb24odCl7cmV0dXJuIE5yKHRoaXMsdClbXCJkZWxldGVcIl0odCl9LFB0LnByb3RvdHlwZS5nZXQ9ZnVuY3Rpb24odCl7cmV0dXJuIE5yKHRoaXMsdCkuZ2V0KHQpfSxQdC5wcm90b3R5cGUuaGFzPWZ1bmN0aW9uKHQpe3JldHVybiBOcih0aGlzLHQpLmhhcyh0KX0sUHQucHJvdG90eXBlLnNldD1mdW5jdGlvbih0LG4pe1xucmV0dXJuIE5yKHRoaXMsdCkuc2V0KHQsbiksdGhpc30sWnQucHJvdG90eXBlLmFkZD1adC5wcm90b3R5cGUucHVzaD1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5fX2RhdGFfXy5zZXQodCxcIl9fbG9kYXNoX2hhc2hfdW5kZWZpbmVkX19cIiksdGhpc30sWnQucHJvdG90eXBlLmhhcz1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5fX2RhdGFfXy5oYXModCl9LHF0LnByb3RvdHlwZS5jbGVhcj1mdW5jdGlvbigpe3RoaXMuX19kYXRhX189bmV3IER0fSxxdC5wcm90b3R5cGVbXCJkZWxldGVcIl09ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuX19kYXRhX19bXCJkZWxldGVcIl0odCl9LHF0LnByb3RvdHlwZS5nZXQ9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuX19kYXRhX18uZ2V0KHQpfSxxdC5wcm90b3R5cGUuaGFzPWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLl9fZGF0YV9fLmhhcyh0KX0scXQucHJvdG90eXBlLnNldD1mdW5jdGlvbih0LG4pe3ZhciByPXRoaXMuX19kYXRhX187cmV0dXJuIHIgaW5zdGFuY2VvZiBEdCYmMjAwPT1yLl9fZGF0YV9fLmxlbmd0aCYmKHI9dGhpcy5fX2RhdGFfXz1uZXcgUHQoci5fX2RhdGFfXykpLFxuci5zZXQodCxuKSx0aGlzfTt2YXIgQW89dnIoaG4pLE9vPXZyKHBuLHRydWUpLGtvPWdyKCksRW89Z3IodHJ1ZSk7TnUmJiFxdS5jYWxsKHt2YWx1ZU9mOjF9LFwidmFsdWVPZlwiKSYmKEVuPWZ1bmN0aW9uKHQpe3JldHVybiB6KE51KHQpKX0pO3ZhciBTbz1obz9mdW5jdGlvbih0LG4pe3JldHVybiBoby5zZXQodCxuKSx0fTpwdSxJbz1hbyYmMS9EKG5ldyBhbyhbLC0wXSkpWzFdPT1xP2Z1bmN0aW9uKHQpe3JldHVybiBuZXcgYW8odCl9Omd1LFJvPWhvP2Z1bmN0aW9uKHQpe3JldHVybiBoby5nZXQodCl9Omd1LFdvPVVuKFwibGVuZ3RoXCIpO1B1fHwoVHI9eXUpO3ZhciBCbz1QdT9mdW5jdGlvbih0KXtmb3IodmFyIG49W107dDspcyhuLFRyKHQpKSx0PUp1KE9iamVjdCh0KSk7cmV0dXJuIG59OlRyOyhpbyYmXCJbb2JqZWN0IERhdGFWaWV3XVwiIT1xcihuZXcgaW8obmV3IEFycmF5QnVmZmVyKDEpKSl8fGZvJiZcIltvYmplY3QgTWFwXVwiIT1xcihuZXcgZm8pfHxjbyYmXCJbb2JqZWN0IFByb21pc2VdXCIhPXFyKGNvLnJlc29sdmUoKSl8fGFvJiZcIltvYmplY3QgU2V0XVwiIT1xcihuZXcgYW8pfHxsbyYmXCJbb2JqZWN0IFdlYWtNYXBdXCIhPXFyKG5ldyBsbykpJiYocXI9ZnVuY3Rpb24odCl7XG52YXIgbj1NdS5jYWxsKHQpO2lmKHQ9KHQ9XCJbb2JqZWN0IE9iamVjdF1cIj09bj90LmNvbnN0cnVjdG9yOlQpP2NlKHQpOlQpc3dpdGNoKHQpe2Nhc2Ugdm86cmV0dXJuXCJbb2JqZWN0IERhdGFWaWV3XVwiO2Nhc2UgZ286cmV0dXJuXCJbb2JqZWN0IE1hcF1cIjtjYXNlIHlvOnJldHVyblwiW29iamVjdCBQcm9taXNlXVwiO2Nhc2UgYm86cmV0dXJuXCJbb2JqZWN0IFNldF1cIjtjYXNlIHhvOnJldHVyblwiW29iamVjdCBXZWFrTWFwXVwifXJldHVybiBufSk7dmFyIExvPVN1P0ZlOmJ1LE1vPWZ1bmN0aW9uKCl7dmFyIHQ9MCxuPTA7cmV0dXJuIGZ1bmN0aW9uKHIsZSl7dmFyIHU9RWUoKSxvPTE2LSh1LW4pO2lmKG49dSxvPjApe2lmKDE1MDw9Kyt0KXJldHVybiByfWVsc2UgdD0wO3JldHVybiBTbyhyLGUpfX0oKSxDbz1MZShmdW5jdGlvbih0KXt2YXIgbj1bXTtyZXR1cm4gZXUodCkucmVwbGFjZShvdCxmdW5jdGlvbih0LHIsZSx1KXtuLnB1c2goZT91LnJlcGxhY2UoaHQsXCIkMVwiKTpyfHx0KX0pLFxubn0pLHpvPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuICRlKHQpP2ZuKHQsc24obiwxLCRlLHRydWUpKTpbXX0pLFVvPU1lKGZ1bmN0aW9uKHQsbil7dmFyIHI9dmUobik7cmV0dXJuICRlKHIpJiYocj1UKSwkZSh0KT9mbih0LHNuKG4sMSwkZSx0cnVlKSxGcihyKSk6W119KSwkbz1NZShmdW5jdGlvbih0LG4pe3ZhciByPXZlKG4pO3JldHVybiAkZShyKSYmKHI9VCksJGUodCk/Zm4odCxzbihuLDEsJGUsdHJ1ZSksVCxyKTpbXX0pLERvPU1lKGZ1bmN0aW9uKHQpe3ZhciBuPWwodCxycik7cmV0dXJuIG4ubGVuZ3RoJiZuWzBdPT09dFswXT94bihuKTpbXX0pLEZvPU1lKGZ1bmN0aW9uKHQpe3ZhciBuPXZlKHQpLHI9bCh0LHJyKTtyZXR1cm4gbj09PXZlKHIpP249VDpyLnBvcCgpLHIubGVuZ3RoJiZyWzBdPT09dFswXT94bihyLEZyKG4pKTpbXX0pLE5vPU1lKGZ1bmN0aW9uKHQpe3ZhciBuPXZlKHQpLHI9bCh0LHJyKTtyZXR1cm4gbj09PXZlKHIpP249VDpyLnBvcCgpLHIubGVuZ3RoJiZyWzBdPT09dFswXT94bihyLFQsbik6W107XG59KSxQbz1NZShnZSksWm89TWUoZnVuY3Rpb24odCxuKXtuPXNuKG4sMSk7dmFyIHI9dD90Lmxlbmd0aDowLGU9dG4odCxuKTtyZXR1cm4gRm4odCxsKG4sZnVuY3Rpb24odCl7cmV0dXJuIFhyKHQscik/K3Q6dH0pLnNvcnQoZnIpKSxlfSksVG89TWUoZnVuY3Rpb24odCl7cmV0dXJuIEhuKHNuKHQsMSwkZSx0cnVlKSl9KSxxbz1NZShmdW5jdGlvbih0KXt2YXIgbj12ZSh0KTtyZXR1cm4gJGUobikmJihuPVQpLEhuKHNuKHQsMSwkZSx0cnVlKSxGcihuKSl9KSxWbz1NZShmdW5jdGlvbih0KXt2YXIgbj12ZSh0KTtyZXR1cm4gJGUobikmJihuPVQpLEhuKHNuKHQsMSwkZSx0cnVlKSxULG4pfSksS289TWUoZnVuY3Rpb24odCxuKXtyZXR1cm4gJGUodCk/Zm4odCxuKTpbXX0pLEdvPU1lKGZ1bmN0aW9uKHQpe3JldHVybiB0cihmKHQsJGUpKX0pLEpvPU1lKGZ1bmN0aW9uKHQpe3ZhciBuPXZlKHQpO3JldHVybiAkZShuKSYmKG49VCksdHIoZih0LCRlKSxGcihuKSl9KSxZbz1NZShmdW5jdGlvbih0KXtcbnZhciBuPXZlKHQpO3JldHVybiAkZShuKSYmKG49VCksdHIoZih0LCRlKSxULG4pfSksSG89TWUoeWUpLFFvPU1lKGZ1bmN0aW9uKHQpe3ZhciBuPXQubGVuZ3RoLG49bj4xP3Rbbi0xXTpULG49dHlwZW9mIG49PVwiZnVuY3Rpb25cIj8odC5wb3AoKSxuKTpUO3JldHVybiBiZSh0LG4pfSksWG89TWUoZnVuY3Rpb24odCl7ZnVuY3Rpb24gbihuKXtyZXR1cm4gdG4obix0KX10PXNuKHQsMSk7dmFyIHI9dC5sZW5ndGgsZT1yP3RbMF06MCx1PXRoaXMuX193cmFwcGVkX187cmV0dXJuIShyPjF8fHRoaXMuX19hY3Rpb25zX18ubGVuZ3RoKSYmdSBpbnN0YW5jZW9mIFV0JiZYcihlKT8odT11LnNsaWNlKGUsK2UrKHI/MTowKSksdS5fX2FjdGlvbnNfXy5wdXNoKHtmdW5jOmplLGFyZ3M6W25dLHRoaXNBcmc6VH0pLG5ldyB6dCh1LHRoaXMuX19jaGFpbl9fKS50aHJ1KGZ1bmN0aW9uKHQpe3JldHVybiByJiYhdC5sZW5ndGgmJnQucHVzaChUKSx0fSkpOnRoaXMudGhydShuKX0pLHRpPXByKGZ1bmN0aW9uKHQsbixyKXtcbld1LmNhbGwodCxyKT8rK3Rbcl06dFtyXT0xfSksbmk9d3IoaGUpLHJpPXdyKHBlKSxlaT1wcihmdW5jdGlvbih0LG4scil7V3UuY2FsbCh0LHIpP3Rbcl0ucHVzaChuKTp0W3JdPVtuXX0pLHVpPU1lKGZ1bmN0aW9uKHQsbixlKXt2YXIgdT0tMSxvPXR5cGVvZiBuPT1cImZ1bmN0aW9uXCIsaT1uZShuKSxmPVVlKHQpP0FycmF5KHQubGVuZ3RoKTpbXTtyZXR1cm4gQW8odCxmdW5jdGlvbih0KXt2YXIgYz1vP246aSYmbnVsbCE9dD90W25dOlQ7ZlsrK3VdPWM/cihjLHQsZSk6d24odCxuLGUpfSksZn0pLG9pPXByKGZ1bmN0aW9uKHQsbixyKXt0W3JdPW59KSxpaT1wcihmdW5jdGlvbih0LG4scil7dFtyPzA6MV0ucHVzaChuKX0sZnVuY3Rpb24oKXtyZXR1cm5bW10sW11dfSksZmk9TWUoZnVuY3Rpb24odCxuKXtpZihudWxsPT10KXJldHVybltdO3ZhciByPW4ubGVuZ3RoO3JldHVybiByPjEmJnRlKHQsblswXSxuWzFdKT9uPVtdOnI+MiYmdGUoblswXSxuWzFdLG5bMl0pJiYobj1bblswXV0pLFxubj0xPT1uLmxlbmd0aCYmeWkoblswXSk/blswXTpzbihuLDEsUXIpLE1uKHQsbixbXSl9KSxjaT1NZShmdW5jdGlvbih0LG4scil7dmFyIGU9MTtpZihyLmxlbmd0aCl2YXIgdT0kKHIsRHIoY2kpKSxlPTMyfGU7cmV0dXJuIENyKHQsZSxuLHIsdSl9KSxhaT1NZShmdW5jdGlvbih0LG4scil7dmFyIGU9MztpZihyLmxlbmd0aCl2YXIgdT0kKHIsRHIoYWkpKSxlPTMyfGU7cmV0dXJuIENyKG4sZSx0LHIsdSl9KSxsaT1NZShmdW5jdGlvbih0LG4pe3JldHVybiBvbih0LDEsbil9KSxzaT1NZShmdW5jdGlvbih0LG4scil7cmV0dXJuIG9uKHQsbnUobil8fDAscil9KTtMZS5DYWNoZT1QdDt2YXIgaGk9TWUoZnVuY3Rpb24odCxuKXtuPTE9PW4ubGVuZ3RoJiZ5aShuWzBdKT9sKG5bMF0sTyhGcigpKSk6bChzbihuLDEsUXIpLE8oRnIoKSkpO3ZhciBlPW4ubGVuZ3RoO3JldHVybiBNZShmdW5jdGlvbih1KXtmb3IodmFyIG89LTEsaT10byh1Lmxlbmd0aCxlKTsrK288aTspdVtvXT1uW29dLmNhbGwodGhpcyx1W29dKTtcbnJldHVybiByKHQsdGhpcyx1KX0pfSkscGk9TWUoZnVuY3Rpb24odCxuKXt2YXIgcj0kKG4sRHIocGkpKTtyZXR1cm4gQ3IodCwzMixULG4scil9KSxfaT1NZShmdW5jdGlvbih0LG4pe3ZhciByPSQobixEcihfaSkpO3JldHVybiBDcih0LDY0LFQsbixyKX0pLHZpPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuIENyKHQsMjU2LFQsVCxULHNuKG4sMSkpfSksZ2k9V3IoZG4pLGRpPVdyKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHQ+PW59KSx5aT1BcnJheS5pc0FycmF5LGJpPVV1P2Z1bmN0aW9uKHQpe3JldHVybiB0IGluc3RhbmNlb2YgVXV9OmJ1LHhpPVdyKFNuKSxqaT1XcihmdW5jdGlvbih0LG4pe3JldHVybiBuPj10fSksd2k9X3IoZnVuY3Rpb24odCxuKXtpZihwb3x8ZWUobil8fFVlKG4pKXNyKG4saXUobiksdCk7ZWxzZSBmb3IodmFyIHIgaW4gbilXdS5jYWxsKG4scikmJll0KHQscixuW3JdKX0pLG1pPV9yKGZ1bmN0aW9uKHQsbil7aWYocG98fGVlKG4pfHxVZShuKSlzcihuLGZ1KG4pLHQpO2Vsc2UgZm9yKHZhciByIGluIG4pWXQodCxyLG5bcl0pO1xufSksQWk9X3IoZnVuY3Rpb24odCxuLHIsZSl7c3IobixmdShuKSx0LGUpfSksT2k9X3IoZnVuY3Rpb24odCxuLHIsZSl7c3IobixpdShuKSx0LGUpfSksa2k9TWUoZnVuY3Rpb24odCxuKXtyZXR1cm4gdG4odCxzbihuLDEpKX0pLEVpPU1lKGZ1bmN0aW9uKHQpe3JldHVybiB0LnB1c2goVCxWdCkscihBaSxULHQpfSksU2k9TWUoZnVuY3Rpb24odCl7cmV0dXJuIHQucHVzaChULG9lKSxyKExpLFQsdCl9KSxJaT1PcihmdW5jdGlvbih0LG4scil7dFtuXT1yfSxodShwdSkpLFJpPU9yKGZ1bmN0aW9uKHQsbixyKXtXdS5jYWxsKHQsbik/dFtuXS5wdXNoKHIpOnRbbl09W3JdfSxGciksV2k9TWUod24pLEJpPV9yKGZ1bmN0aW9uKHQsbixyKXtCbih0LG4scil9KSxMaT1fcihmdW5jdGlvbih0LG4scixlKXtCbih0LG4scixlKX0pLE1pPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuIG51bGw9PXQ/e306KG49bChzbihuLDEpLGZlKSxDbih0LGZuKGduKHQsZnUsQm8pLG4pKSl9KSxDaT1NZShmdW5jdGlvbih0LG4pe1xucmV0dXJuIG51bGw9PXQ/e306Q24odCxsKHNuKG4sMSksZmUpKX0pLHppPU1yKGl1KSxVaT1NcihmdSksJGk9YnIoZnVuY3Rpb24odCxuLHIpe3JldHVybiBuPW4udG9Mb3dlckNhc2UoKSx0KyhyP2F1KG4pOm4pfSksRGk9YnIoZnVuY3Rpb24odCxuLHIpe3JldHVybiB0KyhyP1wiLVwiOlwiXCIpK24udG9Mb3dlckNhc2UoKX0pLEZpPWJyKGZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gdCsocj9cIiBcIjpcIlwiKStuLnRvTG93ZXJDYXNlKCl9KSxOaT15cihcInRvTG93ZXJDYXNlXCIpLFBpPWJyKGZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gdCsocj9cIl9cIjpcIlwiKStuLnRvTG93ZXJDYXNlKCl9KSxaaT1icihmdW5jdGlvbih0LG4scil7cmV0dXJuIHQrKHI/XCIgXCI6XCJcIikrcWkobil9KSxUaT1icihmdW5jdGlvbih0LG4scil7cmV0dXJuIHQrKHI/XCIgXCI6XCJcIikrbi50b1VwcGVyQ2FzZSgpfSkscWk9eXIoXCJ0b1VwcGVyQ2FzZVwiKSxWaT1NZShmdW5jdGlvbih0LG4pe3RyeXtyZXR1cm4gcih0LFQsbil9Y2F0Y2goZSl7XG5yZXR1cm4gRGUoZSk/ZTpuZXcganUoZSl9fSksS2k9TWUoZnVuY3Rpb24odCxuKXtyZXR1cm4gdShzbihuLDEpLGZ1bmN0aW9uKG4pe249ZmUobiksdFtuXT1jaSh0W25dLHQpfSksdH0pLEdpPW1yKCksSmk9bXIodHJ1ZSksWWk9TWUoZnVuY3Rpb24odCxuKXtyZXR1cm4gZnVuY3Rpb24ocil7cmV0dXJuIHduKHIsdCxuKX19KSxIaT1NZShmdW5jdGlvbih0LG4pe3JldHVybiBmdW5jdGlvbihyKXtyZXR1cm4gd24odCxyLG4pfX0pLFFpPUVyKGwpLFhpPUVyKGkpLHRmPUVyKF8pLG5mPVJyKCkscmY9UnIodHJ1ZSksZWY9a3IoZnVuY3Rpb24odCxuKXtyZXR1cm4gdCtufSksdWY9THIoXCJjZWlsXCIpLG9mPWtyKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHQvbn0pLGZmPUxyKFwiZmxvb3JcIiksY2Y9a3IoZnVuY3Rpb24odCxuKXtyZXR1cm4gdCpufSksYWY9THIoXCJyb3VuZFwiKSxsZj1rcihmdW5jdGlvbih0LG4pe3JldHVybiB0LW59KTtyZXR1cm4gT3QuYWZ0ZXI9ZnVuY3Rpb24odCxuKXtpZih0eXBlb2YgbiE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7XG5yZXR1cm4gdD1YZSh0KSxmdW5jdGlvbigpe3JldHVybiAxPi0tdD9uLmFwcGx5KHRoaXMsYXJndW1lbnRzKTp2b2lkIDB9fSxPdC5hcnk9U2UsT3QuYXNzaWduPXdpLE90LmFzc2lnbkluPW1pLE90LmFzc2lnbkluV2l0aD1BaSxPdC5hc3NpZ25XaXRoPU9pLE90LmF0PWtpLE90LmJlZm9yZT1JZSxPdC5iaW5kPWNpLE90LmJpbmRBbGw9S2ksT3QuYmluZEtleT1haSxPdC5jYXN0QXJyYXk9ZnVuY3Rpb24oKXtpZighYXJndW1lbnRzLmxlbmd0aClyZXR1cm5bXTt2YXIgdD1hcmd1bWVudHNbMF07cmV0dXJuIHlpKHQpP3Q6W3RdfSxPdC5jaGFpbj14ZSxPdC5jaHVuaz1mdW5jdGlvbih0LG4scil7aWYobj0ocj90ZSh0LG4scik6bj09PVQpPzE6WHUoWGUobiksMCkscj10P3QubGVuZ3RoOjAsIXJ8fDE+bilyZXR1cm5bXTtmb3IodmFyIGU9MCx1PTAsbz1BcnJheShLdShyL24pKTtyPmU7KW9bdSsrXT1Ubih0LGUsZSs9bik7cmV0dXJuIG99LE90LmNvbXBhY3Q9ZnVuY3Rpb24odCl7Zm9yKHZhciBuPS0xLHI9dD90Lmxlbmd0aDowLGU9MCx1PVtdOysrbjxyOyl7XG52YXIgbz10W25dO28mJih1W2UrK109byl9cmV0dXJuIHV9LE90LmNvbmNhdD1mdW5jdGlvbigpe2Zvcih2YXIgdD1hcmd1bWVudHMubGVuZ3RoLG49QXJyYXkodD90LTE6MCkscj1hcmd1bWVudHNbMF0sZT10O2UtLTspbltlLTFdPWFyZ3VtZW50c1tlXTtyZXR1cm4gdD9zKHlpKHIpP2xyKHIpOltyXSxzbihuLDEpKTpbXX0sT3QuY29uZD1mdW5jdGlvbih0KXt2YXIgbj10P3QubGVuZ3RoOjAsZT1GcigpO3JldHVybiB0PW4/bCh0LGZ1bmN0aW9uKHQpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIHRbMV0pdGhyb3cgbmV3IEF1KFwiRXhwZWN0ZWQgYSBmdW5jdGlvblwiKTtyZXR1cm5bZSh0WzBdKSx0WzFdXX0pOltdLE1lKGZ1bmN0aW9uKGUpe2Zvcih2YXIgdT0tMTsrK3U8bjspe3ZhciBvPXRbdV07aWYocihvWzBdLHRoaXMsZSkpcmV0dXJuIHIob1sxXSx0aGlzLGUpfX0pfSxPdC5jb25mb3Jtcz1mdW5jdGlvbih0KXtyZXR1cm4gZW4ocm4odCx0cnVlKSl9LE90LmNvbnN0YW50PWh1LE90LmNvdW50Qnk9dGksXG5PdC5jcmVhdGU9ZnVuY3Rpb24odCxuKXt2YXIgcj11bih0KTtyZXR1cm4gbj9YdChyLG4pOnJ9LE90LmN1cnJ5PVJlLE90LmN1cnJ5UmlnaHQ9V2UsT3QuZGVib3VuY2U9QmUsT3QuZGVmYXVsdHM9RWksT3QuZGVmYXVsdHNEZWVwPVNpLE90LmRlZmVyPWxpLE90LmRlbGF5PXNpLE90LmRpZmZlcmVuY2U9em8sT3QuZGlmZmVyZW5jZUJ5PVVvLE90LmRpZmZlcmVuY2VXaXRoPSRvLE90LmRyb3A9bGUsT3QuZHJvcFJpZ2h0PXNlLE90LmRyb3BSaWdodFdoaWxlPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQmJnQubGVuZ3RoP1FuKHQsRnIobiwzKSx0cnVlLHRydWUpOltdfSxPdC5kcm9wV2hpbGU9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdCYmdC5sZW5ndGg/UW4odCxGcihuLDMpLHRydWUpOltdfSxPdC5maWxsPWZ1bmN0aW9uKHQsbixyLGUpe3ZhciB1PXQ/dC5sZW5ndGg6MDtpZighdSlyZXR1cm5bXTtmb3IociYmdHlwZW9mIHIhPVwibnVtYmVyXCImJnRlKHQsbixyKSYmKHI9MCxlPXUpLHU9dC5sZW5ndGgsXG5yPVhlKHIpLDA+ciYmKHI9LXI+dT8wOnUrciksZT1lPT09VHx8ZT51P3U6WGUoZSksMD5lJiYoZSs9dSksZT1yPmU/MDp0dShlKTtlPnI7KXRbcisrXT1uO3JldHVybiB0fSxPdC5maWx0ZXI9ZnVuY3Rpb24odCxuKXtyZXR1cm4oeWkodCk/ZjpsbikodCxGcihuLDMpKX0sT3QuZmxhdE1hcD1mdW5jdGlvbih0LG4pe3JldHVybiBzbihPZSh0LG4pLDEpfSxPdC5mbGF0TWFwRGVlcD1mdW5jdGlvbih0LG4pe3JldHVybiBzbihPZSh0LG4pLHEpfSxPdC5mbGF0TWFwRGVwdGg9ZnVuY3Rpb24odCxuLHIpe3JldHVybiByPXI9PT1UPzE6WGUociksc24oT2UodCxuKSxyKX0sT3QuZmxhdHRlbj1mdW5jdGlvbih0KXtyZXR1cm4gdCYmdC5sZW5ndGg/c24odCwxKTpbXX0sT3QuZmxhdHRlbkRlZXA9ZnVuY3Rpb24odCl7cmV0dXJuIHQmJnQubGVuZ3RoP3NuKHQscSk6W119LE90LmZsYXR0ZW5EZXB0aD1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD8obj1uPT09VD8xOlhlKG4pLHNuKHQsbikpOltdO1xufSxPdC5mbGlwPWZ1bmN0aW9uKHQpe3JldHVybiBDcih0LDUxMil9LE90LmZsb3c9R2ksT3QuZmxvd1JpZ2h0PUppLE90LmZyb21QYWlycz1mdW5jdGlvbih0KXtmb3IodmFyIG49LTEscj10P3QubGVuZ3RoOjAsZT17fTsrK248cjspe3ZhciB1PXRbbl07ZVt1WzBdXT11WzFdfXJldHVybiBlfSxPdC5mdW5jdGlvbnM9ZnVuY3Rpb24odCl7cmV0dXJuIG51bGw9PXQ/W106X24odCxpdSh0KSl9LE90LmZ1bmN0aW9uc0luPWZ1bmN0aW9uKHQpe3JldHVybiBudWxsPT10P1tdOl9uKHQsZnUodCkpfSxPdC5ncm91cEJ5PWVpLE90LmluaXRpYWw9ZnVuY3Rpb24odCl7cmV0dXJuIHNlKHQsMSl9LE90LmludGVyc2VjdGlvbj1EbyxPdC5pbnRlcnNlY3Rpb25CeT1GbyxPdC5pbnRlcnNlY3Rpb25XaXRoPU5vLE90LmludmVydD1JaSxPdC5pbnZlcnRCeT1SaSxPdC5pbnZva2VNYXA9dWksT3QuaXRlcmF0ZWU9X3UsT3Qua2V5Qnk9b2ksT3Qua2V5cz1pdSxPdC5rZXlzSW49ZnUsT3QubWFwPU9lLFxuT3QubWFwS2V5cz1mdW5jdGlvbih0LG4pe3ZhciByPXt9O3JldHVybiBuPUZyKG4sMyksaG4odCxmdW5jdGlvbih0LGUsdSl7cltuKHQsZSx1KV09dH0pLHJ9LE90Lm1hcFZhbHVlcz1mdW5jdGlvbih0LG4pe3ZhciByPXt9O3JldHVybiBuPUZyKG4sMyksaG4odCxmdW5jdGlvbih0LGUsdSl7cltlXT1uKHQsZSx1KX0pLHJ9LE90Lm1hdGNoZXM9ZnVuY3Rpb24odCl7cmV0dXJuIFJuKHJuKHQsdHJ1ZSkpfSxPdC5tYXRjaGVzUHJvcGVydHk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gV24odCxybihuLHRydWUpKX0sT3QubWVtb2l6ZT1MZSxPdC5tZXJnZT1CaSxPdC5tZXJnZVdpdGg9TGksT3QubWV0aG9kPVlpLE90Lm1ldGhvZE9mPUhpLE90Lm1peGluPXZ1LE90Lm5lZ2F0ZT1mdW5jdGlvbih0KXtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIXQuYXBwbHkodGhpcyxhcmd1bWVudHMpfX0sT3QubnRoQXJnPWZ1bmN0aW9uKHQpe1xucmV0dXJuIHQ9WGUodCksTWUoZnVuY3Rpb24obil7cmV0dXJuIExuKG4sdCl9KX0sT3Qub21pdD1NaSxPdC5vbWl0Qnk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gbj1GcihuKSx6bih0LGZ1bmN0aW9uKHQscil7cmV0dXJuIW4odCxyKX0pfSxPdC5vbmNlPWZ1bmN0aW9uKHQpe3JldHVybiBJZSgyLHQpfSxPdC5vcmRlckJ5PWZ1bmN0aW9uKHQsbixyLGUpe3JldHVybiBudWxsPT10P1tdOih5aShuKXx8KG49bnVsbD09bj9bXTpbbl0pLHI9ZT9UOnIseWkocil8fChyPW51bGw9PXI/W106W3JdKSxNbih0LG4scikpfSxPdC5vdmVyPVFpLE90Lm92ZXJBcmdzPWhpLE90Lm92ZXJFdmVyeT1YaSxPdC5vdmVyU29tZT10ZixPdC5wYXJ0aWFsPXBpLE90LnBhcnRpYWxSaWdodD1faSxPdC5wYXJ0aXRpb249aWksT3QucGljaz1DaSxPdC5waWNrQnk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gbnVsbD09dD97fTp6bih0LEZyKG4pKX0sT3QucHJvcGVydHk9ZHUsT3QucHJvcGVydHlPZj1mdW5jdGlvbih0KXtcbnJldHVybiBmdW5jdGlvbihuKXtyZXR1cm4gbnVsbD09dD9UOnZuKHQsbil9fSxPdC5wdWxsPVBvLE90LnB1bGxBbGw9Z2UsT3QucHVsbEFsbEJ5PWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gdCYmdC5sZW5ndGgmJm4mJm4ubGVuZ3RoP0RuKHQsbixGcihyKSk6dH0sT3QucHVsbEFsbFdpdGg9ZnVuY3Rpb24odCxuLHIpe3JldHVybiB0JiZ0Lmxlbmd0aCYmbiYmbi5sZW5ndGg/RG4odCxuLFQscik6dH0sT3QucHVsbEF0PVpvLE90LnJhbmdlPW5mLE90LnJhbmdlUmlnaHQ9cmYsT3QucmVhcmc9dmksT3QucmVqZWN0PWZ1bmN0aW9uKHQsbil7dmFyIHI9eWkodCk/ZjpsbjtyZXR1cm4gbj1GcihuLDMpLHIodCxmdW5jdGlvbih0LHIsZSl7cmV0dXJuIW4odCxyLGUpfSl9LE90LnJlbW92ZT1mdW5jdGlvbih0LG4pe3ZhciByPVtdO2lmKCF0fHwhdC5sZW5ndGgpcmV0dXJuIHI7dmFyIGU9LTEsdT1bXSxvPXQubGVuZ3RoO2ZvcihuPUZyKG4sMyk7KytlPG87KXt2YXIgaT10W2VdO24oaSxlLHQpJiYoci5wdXNoKGkpLFxudS5wdXNoKGUpKX1yZXR1cm4gRm4odCx1KSxyfSxPdC5yZXN0PU1lLE90LnJldmVyc2U9ZGUsT3Quc2FtcGxlU2l6ZT1rZSxPdC5zZXQ9ZnVuY3Rpb24odCxuLHIpe3JldHVybiBudWxsPT10P3Q6Wm4odCxuLHIpfSxPdC5zZXRXaXRoPWZ1bmN0aW9uKHQsbixyLGUpe3JldHVybiBlPXR5cGVvZiBlPT1cImZ1bmN0aW9uXCI/ZTpULG51bGw9PXQ/dDpabih0LG4scixlKX0sT3Quc2h1ZmZsZT1mdW5jdGlvbih0KXtyZXR1cm4ga2UodCw0Mjk0OTY3Mjk1KX0sT3Quc2xpY2U9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXQ/dC5sZW5ndGg6MDtyZXR1cm4gZT8ociYmdHlwZW9mIHIhPVwibnVtYmVyXCImJnRlKHQsbixyKT8obj0wLHI9ZSk6KG49bnVsbD09bj8wOlhlKG4pLHI9cj09PVQ/ZTpYZShyKSksVG4odCxuLHIpKTpbXX0sT3Quc29ydEJ5PWZpLE90LnNvcnRlZFVuaXE9ZnVuY3Rpb24odCl7cmV0dXJuIHQmJnQubGVuZ3RoP0duKHQpOltdfSxPdC5zb3J0ZWRVbmlxQnk9ZnVuY3Rpb24odCxuKXtcbnJldHVybiB0JiZ0Lmxlbmd0aD9Hbih0LEZyKG4pKTpbXX0sT3Quc3BsaXQ9ZnVuY3Rpb24odCxuLHIpe3JldHVybiByJiZ0eXBlb2YgciE9XCJudW1iZXJcIiYmdGUodCxuLHIpJiYobj1yPVQpLHI9cj09PVQ/NDI5NDk2NzI5NTpyPj4+MCxyPyh0PWV1KHQpKSYmKHR5cGVvZiBuPT1cInN0cmluZ1wifHxudWxsIT1uJiYhS2UobikpJiYobj1ZbihuKSxcIlwiPT1uJiZXdC50ZXN0KHQpKT91cih0Lm1hdGNoKEl0KSwwLHIpOm9vLmNhbGwodCxuLHIpOltdfSxPdC5zcHJlYWQ9ZnVuY3Rpb24odCxuKXtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIG49bj09PVQ/MDpYdShYZShuKSwwKSxNZShmdW5jdGlvbihlKXt2YXIgdT1lW25dO3JldHVybiBlPXVyKGUsMCxuKSx1JiZzKGUsdSkscih0LHRoaXMsZSl9KX0sT3QudGFpbD1mdW5jdGlvbih0KXtyZXR1cm4gbGUodCwxKX0sT3QudGFrZT1mdW5jdGlvbih0LG4scil7cmV0dXJuIHQmJnQubGVuZ3RoPyhuPXJ8fG49PT1UPzE6WGUobiksXG5Ubih0LDAsMD5uPzA6bikpOltdfSxPdC50YWtlUmlnaHQ9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXQ/dC5sZW5ndGg6MDtyZXR1cm4gZT8obj1yfHxuPT09VD8xOlhlKG4pLG49ZS1uLFRuKHQsMD5uPzA6bixlKSk6W119LE90LnRha2VSaWdodFdoaWxlPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQmJnQubGVuZ3RoP1FuKHQsRnIobiwzKSxmYWxzZSx0cnVlKTpbXX0sT3QudGFrZVdoaWxlPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQmJnQubGVuZ3RoP1FuKHQsRnIobiwzKSk6W119LE90LnRhcD1mdW5jdGlvbih0LG4pe3JldHVybiBuKHQpLHR9LE90LnRocm90dGxlPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT10cnVlLHU9dHJ1ZTtpZih0eXBlb2YgdCE9XCJmdW5jdGlvblwiKXRocm93IG5ldyBBdShcIkV4cGVjdGVkIGEgZnVuY3Rpb25cIik7cmV0dXJuIFplKHIpJiYoZT1cImxlYWRpbmdcImluIHI/ISFyLmxlYWRpbmc6ZSx1PVwidHJhaWxpbmdcImluIHI/ISFyLnRyYWlsaW5nOnUpLEJlKHQsbix7bGVhZGluZzplLG1heFdhaXQ6bixcbnRyYWlsaW5nOnV9KX0sT3QudGhydT1qZSxPdC50b0FycmF5PUhlLE90LnRvUGFpcnM9emksT3QudG9QYWlyc0luPVVpLE90LnRvUGF0aD1mdW5jdGlvbih0KXtyZXR1cm4geWkodCk/bCh0LGZlKTpKZSh0KT9bdF06bHIoQ28odCkpfSxPdC50b1BsYWluT2JqZWN0PXJ1LE90LnRyYW5zZm9ybT1mdW5jdGlvbih0LG4scil7dmFyIGU9eWkodCl8fFllKHQpO2lmKG49RnIobiw0KSxudWxsPT1yKWlmKGV8fFplKHQpKXt2YXIgbz10LmNvbnN0cnVjdG9yO3I9ZT95aSh0KT9uZXcgbzpbXTpGZShvKT91bihKdShPYmplY3QodCkpKTp7fX1lbHNlIHI9e307cmV0dXJuKGU/dTpobikodCxmdW5jdGlvbih0LGUsdSl7cmV0dXJuIG4ocix0LGUsdSl9KSxyfSxPdC51bmFyeT1mdW5jdGlvbih0KXtyZXR1cm4gU2UodCwxKX0sT3QudW5pb249VG8sT3QudW5pb25CeT1xbyxPdC51bmlvbldpdGg9Vm8sT3QudW5pcT1mdW5jdGlvbih0KXtyZXR1cm4gdCYmdC5sZW5ndGg/SG4odCk6W119LE90LnVuaXFCeT1mdW5jdGlvbih0LG4pe1xucmV0dXJuIHQmJnQubGVuZ3RoP0huKHQsRnIobikpOltdfSxPdC51bmlxV2l0aD1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9Ibih0LFQsbik6W119LE90LnVuc2V0PWZ1bmN0aW9uKHQsbil7dmFyIHI7aWYobnVsbD09dClyPXRydWU7ZWxzZXtyPXQ7dmFyIGU9bixlPW5lKGUscik/W2VdOmVyKGUpO3I9aWUocixlKSxlPWZlKHZlKGUpKSxyPSEobnVsbCE9ciYmeW4ocixlKSl8fGRlbGV0ZSByW2VdfXJldHVybiByfSxPdC51bnppcD15ZSxPdC51bnppcFdpdGg9YmUsT3QudXBkYXRlPWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gbnVsbD09dD90OlpuKHQsbiwodHlwZW9mIHI9PVwiZnVuY3Rpb25cIj9yOnB1KSh2bih0LG4pKSx2b2lkIDApfSxPdC51cGRhdGVXaXRoPWZ1bmN0aW9uKHQsbixyLGUpe3JldHVybiBlPXR5cGVvZiBlPT1cImZ1bmN0aW9uXCI/ZTpULG51bGwhPXQmJih0PVpuKHQsbiwodHlwZW9mIHI9PVwiZnVuY3Rpb25cIj9yOnB1KSh2bih0LG4pKSxlKSksdH0sT3QudmFsdWVzPWN1LFxuT3QudmFsdWVzSW49ZnVuY3Rpb24odCl7cmV0dXJuIG51bGw9PXQ/W106ayh0LGZ1KHQpKX0sT3Qud2l0aG91dD1LbyxPdC53b3Jkcz1zdSxPdC53cmFwPWZ1bmN0aW9uKHQsbil7cmV0dXJuIG49bnVsbD09bj9wdTpuLHBpKG4sdCl9LE90Lnhvcj1HbyxPdC54b3JCeT1KbyxPdC54b3JXaXRoPVlvLE90LnppcD1IbyxPdC56aXBPYmplY3Q9ZnVuY3Rpb24odCxuKXtyZXR1cm4gbnIodHx8W10sbnx8W10sWXQpfSxPdC56aXBPYmplY3REZWVwPWZ1bmN0aW9uKHQsbil7cmV0dXJuIG5yKHR8fFtdLG58fFtdLFpuKX0sT3QuemlwV2l0aD1RbyxPdC5lbnRyaWVzPXppLE90LmVudHJpZXNJbj1VaSxPdC5leHRlbmQ9bWksT3QuZXh0ZW5kV2l0aD1BaSx2dShPdCxPdCksT3QuYWRkPWVmLE90LmF0dGVtcHQ9VmksT3QuY2FtZWxDYXNlPSRpLE90LmNhcGl0YWxpemU9YXUsT3QuY2VpbD11ZixPdC5jbGFtcD1mdW5jdGlvbih0LG4scil7cmV0dXJuIHI9PT1UJiYocj1uLG49VCksciE9PVQmJihyPW51KHIpLFxucj1yPT09cj9yOjApLG4hPT1UJiYobj1udShuKSxuPW49PT1uP246MCksbm4obnUodCksbixyKX0sT3QuY2xvbmU9ZnVuY3Rpb24odCl7cmV0dXJuIHJuKHQsZmFsc2UsdHJ1ZSl9LE90LmNsb25lRGVlcD1mdW5jdGlvbih0KXtyZXR1cm4gcm4odCx0cnVlLHRydWUpfSxPdC5jbG9uZURlZXBXaXRoPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHJuKHQsdHJ1ZSx0cnVlLG4pfSxPdC5jbG9uZVdpdGg9ZnVuY3Rpb24odCxuKXtyZXR1cm4gcm4odCxmYWxzZSx0cnVlLG4pfSxPdC5kZWJ1cnI9bHUsT3QuZGl2aWRlPW9mLE90LmVuZHNXaXRoPWZ1bmN0aW9uKHQsbixyKXt0PWV1KHQpLG49WW4obik7dmFyIGU9dC5sZW5ndGg7cmV0dXJuIHI9cj09PVQ/ZTpubihYZShyKSwwLGUpLHItPW4ubGVuZ3RoLHI+PTAmJnQuaW5kZXhPZihuLHIpPT1yfSxPdC5lcT1DZSxPdC5lc2NhcGU9ZnVuY3Rpb24odCl7cmV0dXJuKHQ9ZXUodCkpJiZYLnRlc3QodCk/dC5yZXBsYWNlKEgsQik6dH0sT3QuZXNjYXBlUmVnRXhwPWZ1bmN0aW9uKHQpe1xucmV0dXJuKHQ9ZXUodCkpJiZmdC50ZXN0KHQpP3QucmVwbGFjZShpdCxcIlxcXFwkJlwiKTp0fSxPdC5ldmVyeT1mdW5jdGlvbih0LG4scil7dmFyIGU9eWkodCk/aTpjbjtyZXR1cm4gciYmdGUodCxuLHIpJiYobj1UKSxlKHQsRnIobiwzKSl9LE90LmZpbmQ9bmksT3QuZmluZEluZGV4PWhlLE90LmZpbmRLZXk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdih0LEZyKG4sMyksaG4pfSxPdC5maW5kTGFzdD1yaSxPdC5maW5kTGFzdEluZGV4PXBlLE90LmZpbmRMYXN0S2V5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIHYodCxGcihuLDMpLHBuKX0sT3QuZmxvb3I9ZmYsT3QuZm9yRWFjaD1tZSxPdC5mb3JFYWNoUmlnaHQ9QWUsT3QuZm9ySW49ZnVuY3Rpb24odCxuKXtyZXR1cm4gbnVsbD09dD90OmtvKHQsRnIobiwzKSxmdSl9LE90LmZvckluUmlnaHQ9ZnVuY3Rpb24odCxuKXtyZXR1cm4gbnVsbD09dD90OkVvKHQsRnIobiwzKSxmdSl9LE90LmZvck93bj1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZobih0LEZyKG4sMykpO1xufSxPdC5mb3JPd25SaWdodD1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZwbih0LEZyKG4sMykpfSxPdC5nZXQ9dXUsT3QuZ3Q9Z2ksT3QuZ3RlPWRpLE90Lmhhcz1mdW5jdGlvbih0LG4pe3JldHVybiBudWxsIT10JiZWcih0LG4seW4pfSxPdC5oYXNJbj1vdSxPdC5oZWFkPV9lLE90LmlkZW50aXR5PXB1LE90LmluY2x1ZGVzPWZ1bmN0aW9uKHQsbixyLGUpe3JldHVybiB0PVVlKHQpP3Q6Y3UodCkscj1yJiYhZT9YZShyKTowLGU9dC5sZW5ndGgsMD5yJiYocj1YdShlK3IsMCkpLEdlKHQpP2U+PXImJi0xPHQuaW5kZXhPZihuLHIpOiEhZSYmLTE8ZCh0LG4scil9LE90LmluZGV4T2Y9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXQ/dC5sZW5ndGg6MDtyZXR1cm4gZT8ocj1udWxsPT1yPzA6WGUociksMD5yJiYocj1YdShlK3IsMCkpLGQodCxuLHIpKTotMX0sT3QuaW5SYW5nZT1mdW5jdGlvbih0LG4scil7cmV0dXJuIG49bnUobil8fDAscj09PVQ/KHI9bixuPTApOnI9bnUocil8fDAsdD1udSh0KSxcbnQ+PXRvKG4scikmJnQ8WHUobixyKX0sT3QuaW52b2tlPVdpLE90LmlzQXJndW1lbnRzPXplLE90LmlzQXJyYXk9eWksT3QuaXNBcnJheUJ1ZmZlcj1mdW5jdGlvbih0KXtyZXR1cm4gVGUodCkmJlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09TXUuY2FsbCh0KX0sT3QuaXNBcnJheUxpa2U9VWUsT3QuaXNBcnJheUxpa2VPYmplY3Q9JGUsT3QuaXNCb29sZWFuPWZ1bmN0aW9uKHQpe3JldHVybiB0cnVlPT09dHx8ZmFsc2U9PT10fHxUZSh0KSYmXCJbb2JqZWN0IEJvb2xlYW5dXCI9PU11LmNhbGwodCl9LE90LmlzQnVmZmVyPWJpLE90LmlzRGF0ZT1mdW5jdGlvbih0KXtyZXR1cm4gVGUodCkmJlwiW29iamVjdCBEYXRlXVwiPT1NdS5jYWxsKHQpfSxPdC5pc0VsZW1lbnQ9ZnVuY3Rpb24odCl7cmV0dXJuISF0JiYxPT09dC5ub2RlVHlwZSYmVGUodCkmJiFWZSh0KX0sT3QuaXNFbXB0eT1mdW5jdGlvbih0KXtpZihVZSh0KSYmKHlpKHQpfHxHZSh0KXx8RmUodC5zcGxpY2UpfHx6ZSh0KXx8YmkodCkpKXJldHVybiF0Lmxlbmd0aDtcbmlmKFRlKHQpKXt2YXIgbj1xcih0KTtpZihcIltvYmplY3QgTWFwXVwiPT1ufHxcIltvYmplY3QgU2V0XVwiPT1uKXJldHVybiF0LnNpemV9Zm9yKHZhciByIGluIHQpaWYoV3UuY2FsbCh0LHIpKXJldHVybiBmYWxzZTtyZXR1cm4hKHBvJiZpdSh0KS5sZW5ndGgpfSxPdC5pc0VxdWFsPWZ1bmN0aW9uKHQsbil7cmV0dXJuIG1uKHQsbil9LE90LmlzRXF1YWxXaXRoPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT0ocj10eXBlb2Ygcj09XCJmdW5jdGlvblwiP3I6VCk/cih0LG4pOlQ7cmV0dXJuIGU9PT1UP21uKHQsbixyKTohIWV9LE90LmlzRXJyb3I9RGUsT3QuaXNGaW5pdGU9ZnVuY3Rpb24odCl7cmV0dXJuIHR5cGVvZiB0PT1cIm51bWJlclwiJiZZdSh0KX0sT3QuaXNGdW5jdGlvbj1GZSxPdC5pc0ludGVnZXI9TmUsT3QuaXNMZW5ndGg9UGUsT3QuaXNNYXA9ZnVuY3Rpb24odCl7cmV0dXJuIFRlKHQpJiZcIltvYmplY3QgTWFwXVwiPT1xcih0KX0sT3QuaXNNYXRjaD1mdW5jdGlvbih0LG4pe3JldHVybiB0PT09bnx8QW4odCxuLFByKG4pKTtcbn0sT3QuaXNNYXRjaFdpdGg9ZnVuY3Rpb24odCxuLHIpe3JldHVybiByPXR5cGVvZiByPT1cImZ1bmN0aW9uXCI/cjpULEFuKHQsbixQcihuKSxyKX0sT3QuaXNOYU49ZnVuY3Rpb24odCl7cmV0dXJuIHFlKHQpJiZ0IT0rdH0sT3QuaXNOYXRpdmU9ZnVuY3Rpb24odCl7aWYoTG8odCkpdGhyb3cgbmV3IGp1KFwiVGhpcyBtZXRob2QgaXMgbm90IHN1cHBvcnRlZCB3aXRoIGBjb3JlLWpzYC4gVHJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9lcy1zaGltcy5cIik7cmV0dXJuIE9uKHQpfSxPdC5pc05pbD1mdW5jdGlvbih0KXtyZXR1cm4gbnVsbD09dH0sT3QuaXNOdWxsPWZ1bmN0aW9uKHQpe3JldHVybiBudWxsPT09dH0sT3QuaXNOdW1iZXI9cWUsT3QuaXNPYmplY3Q9WmUsT3QuaXNPYmplY3RMaWtlPVRlLE90LmlzUGxhaW5PYmplY3Q9VmUsT3QuaXNSZWdFeHA9S2UsT3QuaXNTYWZlSW50ZWdlcj1mdW5jdGlvbih0KXtyZXR1cm4gTmUodCkmJnQ+PS05MDA3MTk5MjU0NzQwOTkxJiY5MDA3MTk5MjU0NzQwOTkxPj10O1xufSxPdC5pc1NldD1mdW5jdGlvbih0KXtyZXR1cm4gVGUodCkmJlwiW29iamVjdCBTZXRdXCI9PXFyKHQpfSxPdC5pc1N0cmluZz1HZSxPdC5pc1N5bWJvbD1KZSxPdC5pc1R5cGVkQXJyYXk9WWUsT3QuaXNVbmRlZmluZWQ9ZnVuY3Rpb24odCl7cmV0dXJuIHQ9PT1UfSxPdC5pc1dlYWtNYXA9ZnVuY3Rpb24odCl7cmV0dXJuIFRlKHQpJiZcIltvYmplY3QgV2Vha01hcF1cIj09cXIodCl9LE90LmlzV2Vha1NldD1mdW5jdGlvbih0KXtyZXR1cm4gVGUodCkmJlwiW29iamVjdCBXZWFrU2V0XVwiPT1NdS5jYWxsKHQpfSxPdC5qb2luPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQ/SHUuY2FsbCh0LG4pOlwiXCJ9LE90LmtlYmFiQ2FzZT1EaSxPdC5sYXN0PXZlLE90Lmxhc3RJbmRleE9mPWZ1bmN0aW9uKHQsbixyKXt2YXIgZT10P3QubGVuZ3RoOjA7aWYoIWUpcmV0dXJuLTE7dmFyIHU9ZTtpZihyIT09VCYmKHU9WGUociksdT0oMD51P1h1KGUrdSwwKTp0byh1LGUtMSkpKzEpLG4hPT1uKXJldHVybiBNKHQsdS0xLHRydWUpO1xuZm9yKDt1LS07KWlmKHRbdV09PT1uKXJldHVybiB1O3JldHVybi0xfSxPdC5sb3dlckNhc2U9RmksT3QubG93ZXJGaXJzdD1OaSxPdC5sdD14aSxPdC5sdGU9amksT3QubWF4PWZ1bmN0aW9uKHQpe3JldHVybiB0JiZ0Lmxlbmd0aD9hbih0LHB1LGRuKTpUfSxPdC5tYXhCeT1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9hbih0LEZyKG4pLGRuKTpUfSxPdC5tZWFuPWZ1bmN0aW9uKHQpe3JldHVybiBiKHQscHUpfSxPdC5tZWFuQnk9ZnVuY3Rpb24odCxuKXtyZXR1cm4gYih0LEZyKG4pKX0sT3QubWluPWZ1bmN0aW9uKHQpe3JldHVybiB0JiZ0Lmxlbmd0aD9hbih0LHB1LFNuKTpUfSxPdC5taW5CeT1mdW5jdGlvbih0LG4pe3JldHVybiB0JiZ0Lmxlbmd0aD9hbih0LEZyKG4pLFNuKTpUfSxPdC5zdHViQXJyYXk9eXUsT3Quc3R1YkZhbHNlPWJ1LE90LnN0dWJPYmplY3Q9ZnVuY3Rpb24oKXtyZXR1cm57fX0sT3Quc3R1YlN0cmluZz1mdW5jdGlvbigpe3JldHVyblwiXCJ9LE90LnN0dWJUcnVlPWZ1bmN0aW9uKCl7XG5yZXR1cm4gdHJ1ZX0sT3QubXVsdGlwbHk9Y2YsT3QubnRoPWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQmJnQubGVuZ3RoP0xuKHQsWGUobikpOlR9LE90Lm5vQ29uZmxpY3Q9ZnVuY3Rpb24oKXtyZXR1cm4gS3QuXz09PXRoaXMmJihLdC5fPUN1KSx0aGlzfSxPdC5ub29wPWd1LE90Lm5vdz1FZSxPdC5wYWQ9ZnVuY3Rpb24odCxuLHIpe3Q9ZXUodCk7dmFyIGU9KG49WGUobikpP04odCk6MDtyZXR1cm4hbnx8ZT49bj90OihuPShuLWUpLzIsU3IoR3UobikscikrdCtTcihLdShuKSxyKSl9LE90LnBhZEVuZD1mdW5jdGlvbih0LG4scil7dD1ldSh0KTt2YXIgZT0obj1YZShuKSk/Tih0KTowO3JldHVybiBuJiZuPmU/dCtTcihuLWUscik6dH0sT3QucGFkU3RhcnQ9ZnVuY3Rpb24odCxuLHIpe3Q9ZXUodCk7dmFyIGU9KG49WGUobikpP04odCk6MDtyZXR1cm4gbiYmbj5lP1NyKG4tZSxyKSt0OnR9LE90LnBhcnNlSW50PWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gcnx8bnVsbD09bj9uPTA6biYmKG49K24pLFxudD1ldSh0KS5yZXBsYWNlKGN0LFwiXCIpLG5vKHQsbnx8KHZ0LnRlc3QodCk/MTY6MTApKX0sT3QucmFuZG9tPWZ1bmN0aW9uKHQsbixyKXtpZihyJiZ0eXBlb2YgciE9XCJib29sZWFuXCImJnRlKHQsbixyKSYmKG49cj1UKSxyPT09VCYmKHR5cGVvZiBuPT1cImJvb2xlYW5cIj8ocj1uLG49VCk6dHlwZW9mIHQ9PVwiYm9vbGVhblwiJiYocj10LHQ9VCkpLHQ9PT1UJiZuPT09VD8odD0wLG49MSk6KHQ9bnUodCl8fDAsbj09PVQ/KG49dCx0PTApOm49bnUobil8fDApLHQ+bil7dmFyIGU9dDt0PW4sbj1lfXJldHVybiByfHx0JTF8fG4lMT8ocj1ybygpLHRvKHQrcioobi10K0Z0KFwiMWUtXCIrKChyK1wiXCIpLmxlbmd0aC0xKSkpLG4pKTpObih0LG4pfSxPdC5yZWR1Y2U9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXlpKHQpP2g6eCx1PTM+YXJndW1lbnRzLmxlbmd0aDtyZXR1cm4gZSh0LEZyKG4sNCkscix1LEFvKX0sT3QucmVkdWNlUmlnaHQ9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXlpKHQpP3A6eCx1PTM+YXJndW1lbnRzLmxlbmd0aDtcbnJldHVybiBlKHQsRnIobiw0KSxyLHUsT28pfSxPdC5yZXBlYXQ9ZnVuY3Rpb24odCxuLHIpe3JldHVybiBuPShyP3RlKHQsbixyKTpuPT09VCk/MTpYZShuKSxQbihldSh0KSxuKX0sT3QucmVwbGFjZT1mdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cyxuPWV1KHRbMF0pO3JldHVybiAzPnQubGVuZ3RoP246ZW8uY2FsbChuLHRbMV0sdFsyXSl9LE90LnJlc3VsdD1mdW5jdGlvbih0LG4scil7bj1uZShuLHQpP1tuXTplcihuKTt2YXIgZT0tMSx1PW4ubGVuZ3RoO2Zvcih1fHwodD1ULHU9MSk7KytlPHU7KXt2YXIgbz1udWxsPT10P1Q6dFtmZShuW2VdKV07bz09PVQmJihlPXUsbz1yKSx0PUZlKG8pP28uY2FsbCh0KTpvfXJldHVybiB0fSxPdC5yb3VuZD1hZixPdC5ydW5JbkNvbnRleHQ9WixPdC5zYW1wbGU9ZnVuY3Rpb24odCl7dD1VZSh0KT90OmN1KHQpO3ZhciBuPXQubGVuZ3RoO3JldHVybiBuPjA/dFtObigwLG4tMSldOlR9LE90LnNpemU9ZnVuY3Rpb24odCl7aWYobnVsbD09dClyZXR1cm4gMDtcbmlmKFVlKHQpKXt2YXIgbj10Lmxlbmd0aDtyZXR1cm4gbiYmR2UodCk/Tih0KTpufXJldHVybiBUZSh0KSYmKG49cXIodCksXCJbb2JqZWN0IE1hcF1cIj09bnx8XCJbb2JqZWN0IFNldF1cIj09bik/dC5zaXplOml1KHQpLmxlbmd0aH0sT3Quc25ha2VDYXNlPVBpLE90LnNvbWU9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPXlpKHQpP186cW47cmV0dXJuIHImJnRlKHQsbixyKSYmKG49VCksZSh0LEZyKG4sMykpfSxPdC5zb3J0ZWRJbmRleD1mdW5jdGlvbih0LG4pe3JldHVybiBWbih0LG4pfSxPdC5zb3J0ZWRJbmRleEJ5PWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gS24odCxuLEZyKHIpKX0sT3Quc29ydGVkSW5kZXhPZj1mdW5jdGlvbih0LG4pe3ZhciByPXQ/dC5sZW5ndGg6MDtpZihyKXt2YXIgZT1Wbih0LG4pO2lmKHI+ZSYmQ2UodFtlXSxuKSlyZXR1cm4gZX1yZXR1cm4tMX0sT3Quc29ydGVkTGFzdEluZGV4PWZ1bmN0aW9uKHQsbil7cmV0dXJuIFZuKHQsbix0cnVlKX0sT3Quc29ydGVkTGFzdEluZGV4Qnk9ZnVuY3Rpb24odCxuLHIpe1xucmV0dXJuIEtuKHQsbixGcihyKSx0cnVlKX0sT3Quc29ydGVkTGFzdEluZGV4T2Y9ZnVuY3Rpb24odCxuKXtpZih0JiZ0Lmxlbmd0aCl7dmFyIHI9Vm4odCxuLHRydWUpLTE7aWYoQ2UodFtyXSxuKSlyZXR1cm4gcn1yZXR1cm4tMX0sT3Quc3RhcnRDYXNlPVppLE90LnN0YXJ0c1dpdGg9ZnVuY3Rpb24odCxuLHIpe3JldHVybiB0PWV1KHQpLHI9bm4oWGUociksMCx0Lmxlbmd0aCksdC5sYXN0SW5kZXhPZihZbihuKSxyKT09cn0sT3Quc3VidHJhY3Q9bGYsT3Quc3VtPWZ1bmN0aW9uKHQpe3JldHVybiB0JiZ0Lmxlbmd0aD93KHQscHUpOjB9LE90LnN1bUJ5PWZ1bmN0aW9uKHQsbil7cmV0dXJuIHQmJnQubGVuZ3RoP3codCxGcihuKSk6MH0sT3QudGVtcGxhdGU9ZnVuY3Rpb24odCxuLHIpe3ZhciBlPU90LnRlbXBsYXRlU2V0dGluZ3M7ciYmdGUodCxuLHIpJiYobj1UKSx0PWV1KHQpLG49QWkoe30sbixlLFZ0KSxyPUFpKHt9LG4uaW1wb3J0cyxlLmltcG9ydHMsVnQpO3ZhciB1LG8saT1pdShyKSxmPWsocixpKSxjPTA7XG5yPW4uaW50ZXJwb2xhdGV8fHd0O3ZhciBhPVwiX19wKz0nXCI7cj1tdSgobi5lc2NhcGV8fHd0KS5zb3VyY2UrXCJ8XCIrci5zb3VyY2UrXCJ8XCIrKHI9PT1ydD9wdDp3dCkuc291cmNlK1wifFwiKyhuLmV2YWx1YXRlfHx3dCkuc291cmNlK1wifCRcIixcImdcIik7dmFyIGw9XCJzb3VyY2VVUkxcImluIG4/XCIvLyMgc291cmNlVVJMPVwiK24uc291cmNlVVJMK1wiXFxuXCI6XCJcIjtpZih0LnJlcGxhY2UocixmdW5jdGlvbihuLHIsZSxpLGYsbCl7cmV0dXJuIGV8fChlPWkpLGErPXQuc2xpY2UoYyxsKS5yZXBsYWNlKG10LEwpLHImJih1PXRydWUsYSs9XCInK19fZShcIityK1wiKSsnXCIpLGYmJihvPXRydWUsYSs9XCInO1wiK2YrXCI7XFxuX19wKz0nXCIpLGUmJihhKz1cIicrKChfX3Q9KFwiK2UrXCIpKT09bnVsbD8nJzpfX3QpKydcIiksYz1sK24ubGVuZ3RoLG59KSxhKz1cIic7XCIsKG49bi52YXJpYWJsZSl8fChhPVwid2l0aChvYmope1wiK2ErXCJ9XCIpLGE9KG8/YS5yZXBsYWNlKEssXCJcIik6YSkucmVwbGFjZShHLFwiJDFcIikucmVwbGFjZShKLFwiJDE7XCIpLFxuYT1cImZ1bmN0aW9uKFwiKyhufHxcIm9ialwiKStcIil7XCIrKG4/XCJcIjpcIm9ianx8KG9iaj17fSk7XCIpK1widmFyIF9fdCxfX3A9JydcIisodT9cIixfX2U9Xy5lc2NhcGVcIjpcIlwiKSsobz9cIixfX2o9QXJyYXkucHJvdG90eXBlLmpvaW47ZnVuY3Rpb24gcHJpbnQoKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyl9XCI6XCI7XCIpK2ErXCJyZXR1cm4gX19wfVwiLG49VmkoZnVuY3Rpb24oKXtyZXR1cm4gRnVuY3Rpb24oaSxsK1wicmV0dXJuIFwiK2EpLmFwcGx5KFQsZil9KSxuLnNvdXJjZT1hLERlKG4pKXRocm93IG47cmV0dXJuIG59LE90LnRpbWVzPWZ1bmN0aW9uKHQsbil7aWYodD1YZSh0KSwxPnR8fHQ+OTAwNzE5OTI1NDc0MDk5MSlyZXR1cm5bXTt2YXIgcj00Mjk0OTY3Mjk1LGU9dG8odCw0Mjk0OTY3Mjk1KTtmb3Iobj1GcihuKSx0LT00Mjk0OTY3Mjk1LGU9bShlLG4pOysrcjx0OyluKHIpO3JldHVybiBlfSxPdC50b0Zpbml0ZT1RZSxPdC50b0ludGVnZXI9WGUsT3QudG9MZW5ndGg9dHUsT3QudG9Mb3dlcj1mdW5jdGlvbih0KXtcbnJldHVybiBldSh0KS50b0xvd2VyQ2FzZSgpfSxPdC50b051bWJlcj1udSxPdC50b1NhZmVJbnRlZ2VyPWZ1bmN0aW9uKHQpe3JldHVybiBubihYZSh0KSwtOTAwNzE5OTI1NDc0MDk5MSw5MDA3MTk5MjU0NzQwOTkxKX0sT3QudG9TdHJpbmc9ZXUsT3QudG9VcHBlcj1mdW5jdGlvbih0KXtyZXR1cm4gZXUodCkudG9VcHBlckNhc2UoKX0sT3QudHJpbT1mdW5jdGlvbih0LG4scil7cmV0dXJuKHQ9ZXUodCkpJiYocnx8bj09PVQpP3QucmVwbGFjZShjdCxcIlwiKTp0JiYobj1ZbihuKSk/KHQ9dC5tYXRjaChJdCksbj1uLm1hdGNoKEl0KSx1cih0LFModCxuKSxJKHQsbikrMSkuam9pbihcIlwiKSk6dH0sT3QudHJpbUVuZD1mdW5jdGlvbih0LG4scil7cmV0dXJuKHQ9ZXUodCkpJiYocnx8bj09PVQpP3QucmVwbGFjZShsdCxcIlwiKTp0JiYobj1ZbihuKSk/KHQ9dC5tYXRjaChJdCksbj1JKHQsbi5tYXRjaChJdCkpKzEsdXIodCwwLG4pLmpvaW4oXCJcIikpOnR9LE90LnRyaW1TdGFydD1mdW5jdGlvbih0LG4scil7XG5yZXR1cm4odD1ldSh0KSkmJihyfHxuPT09VCk/dC5yZXBsYWNlKGF0LFwiXCIpOnQmJihuPVluKG4pKT8odD10Lm1hdGNoKEl0KSxuPVModCxuLm1hdGNoKEl0KSksdXIodCxuKS5qb2luKFwiXCIpKTp0fSxPdC50cnVuY2F0ZT1mdW5jdGlvbih0LG4pe3ZhciByPTMwLGU9XCIuLi5cIjtpZihaZShuKSl2YXIgdT1cInNlcGFyYXRvclwiaW4gbj9uLnNlcGFyYXRvcjp1LHI9XCJsZW5ndGhcImluIG4/WGUobi5sZW5ndGgpOnIsZT1cIm9taXNzaW9uXCJpbiBuP1luKG4ub21pc3Npb24pOmU7dD1ldSh0KTt2YXIgbz10Lmxlbmd0aDtpZihXdC50ZXN0KHQpKXZhciBpPXQubWF0Y2goSXQpLG89aS5sZW5ndGg7aWYocj49bylyZXR1cm4gdDtpZihvPXItTihlKSwxPm8pcmV0dXJuIGU7aWYocj1pP3VyKGksMCxvKS5qb2luKFwiXCIpOnQuc2xpY2UoMCxvKSx1PT09VClyZXR1cm4gcitlO2lmKGkmJihvKz1yLmxlbmd0aC1vKSxLZSh1KSl7aWYodC5zbGljZShvKS5zZWFyY2godSkpe3ZhciBmPXI7Zm9yKHUuZ2xvYmFsfHwodT1tdSh1LnNvdXJjZSxldShfdC5leGVjKHUpKStcImdcIikpLFxudS5sYXN0SW5kZXg9MDtpPXUuZXhlYyhmKTspdmFyIGM9aS5pbmRleDtyPXIuc2xpY2UoMCxjPT09VD9vOmMpfX1lbHNlIHQuaW5kZXhPZihZbih1KSxvKSE9byYmKHU9ci5sYXN0SW5kZXhPZih1KSx1Pi0xJiYocj1yLnNsaWNlKDAsdSkpKTtyZXR1cm4gcitlfSxPdC51bmVzY2FwZT1mdW5jdGlvbih0KXtyZXR1cm4odD1ldSh0KSkmJlEudGVzdCh0KT90LnJlcGxhY2UoWSxQKTp0fSxPdC51bmlxdWVJZD1mdW5jdGlvbih0KXt2YXIgbj0rK0J1O3JldHVybiBldSh0KStufSxPdC51cHBlckNhc2U9VGksT3QudXBwZXJGaXJzdD1xaSxPdC5lYWNoPW1lLE90LmVhY2hSaWdodD1BZSxPdC5maXJzdD1fZSx2dShPdCxmdW5jdGlvbigpe3ZhciB0PXt9O3JldHVybiBobihPdCxmdW5jdGlvbihuLHIpe1d1LmNhbGwoT3QucHJvdG90eXBlLHIpfHwodFtyXT1uKX0pLHR9KCkse2NoYWluOmZhbHNlfSksT3QuVkVSU0lPTj1cIjQuMTMuMVwiLHUoXCJiaW5kIGJpbmRLZXkgY3VycnkgY3VycnlSaWdodCBwYXJ0aWFsIHBhcnRpYWxSaWdodFwiLnNwbGl0KFwiIFwiKSxmdW5jdGlvbih0KXtcbk90W3RdLnBsYWNlaG9sZGVyPU90fSksdShbXCJkcm9wXCIsXCJ0YWtlXCJdLGZ1bmN0aW9uKHQsbil7VXQucHJvdG90eXBlW3RdPWZ1bmN0aW9uKHIpe3ZhciBlPXRoaXMuX19maWx0ZXJlZF9fO2lmKGUmJiFuKXJldHVybiBuZXcgVXQodGhpcyk7cj1yPT09VD8xOlh1KFhlKHIpLDApO3ZhciB1PXRoaXMuY2xvbmUoKTtyZXR1cm4gZT91Ll9fdGFrZUNvdW50X189dG8ocix1Ll9fdGFrZUNvdW50X18pOnUuX192aWV3c19fLnB1c2goe3NpemU6dG8ociw0Mjk0OTY3Mjk1KSx0eXBlOnQrKDA+dS5fX2Rpcl9fP1wiUmlnaHRcIjpcIlwiKX0pLHV9LFV0LnByb3RvdHlwZVt0K1wiUmlnaHRcIl09ZnVuY3Rpb24obil7cmV0dXJuIHRoaXMucmV2ZXJzZSgpW3RdKG4pLnJldmVyc2UoKX19KSx1KFtcImZpbHRlclwiLFwibWFwXCIsXCJ0YWtlV2hpbGVcIl0sZnVuY3Rpb24odCxuKXt2YXIgcj1uKzEsZT0xPT1yfHwzPT1yO1V0LnByb3RvdHlwZVt0XT1mdW5jdGlvbih0KXt2YXIgbj10aGlzLmNsb25lKCk7cmV0dXJuIG4uX19pdGVyYXRlZXNfXy5wdXNoKHtcbml0ZXJhdGVlOkZyKHQsMyksdHlwZTpyfSksbi5fX2ZpbHRlcmVkX189bi5fX2ZpbHRlcmVkX198fGUsbn19KSx1KFtcImhlYWRcIixcImxhc3RcIl0sZnVuY3Rpb24odCxuKXt2YXIgcj1cInRha2VcIisobj9cIlJpZ2h0XCI6XCJcIik7VXQucHJvdG90eXBlW3RdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXNbcl0oMSkudmFsdWUoKVswXX19KSx1KFtcImluaXRpYWxcIixcInRhaWxcIl0sZnVuY3Rpb24odCxuKXt2YXIgcj1cImRyb3BcIisobj9cIlwiOlwiUmlnaHRcIik7VXQucHJvdG90eXBlW3RdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX19maWx0ZXJlZF9fP25ldyBVdCh0aGlzKTp0aGlzW3JdKDEpfX0pLFV0LnByb3RvdHlwZS5jb21wYWN0PWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZmlsdGVyKHB1KX0sVXQucHJvdG90eXBlLmZpbmQ9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuZmlsdGVyKHQpLmhlYWQoKX0sVXQucHJvdG90eXBlLmZpbmRMYXN0PWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLnJldmVyc2UoKS5maW5kKHQpO1xufSxVdC5wcm90b3R5cGUuaW52b2tlTWFwPU1lKGZ1bmN0aW9uKHQsbil7cmV0dXJuIHR5cGVvZiB0PT1cImZ1bmN0aW9uXCI/bmV3IFV0KHRoaXMpOnRoaXMubWFwKGZ1bmN0aW9uKHIpe3JldHVybiB3bihyLHQsbil9KX0pLFV0LnByb3RvdHlwZS5yZWplY3Q9ZnVuY3Rpb24odCl7cmV0dXJuIHQ9RnIodCwzKSx0aGlzLmZpbHRlcihmdW5jdGlvbihuKXtyZXR1cm4hdChuKX0pfSxVdC5wcm90b3R5cGUuc2xpY2U9ZnVuY3Rpb24odCxuKXt0PVhlKHQpO3ZhciByPXRoaXM7cmV0dXJuIHIuX19maWx0ZXJlZF9fJiYodD4wfHwwPm4pP25ldyBVdChyKTooMD50P3I9ci50YWtlUmlnaHQoLXQpOnQmJihyPXIuZHJvcCh0KSksbiE9PVQmJihuPVhlKG4pLHI9MD5uP3IuZHJvcFJpZ2h0KC1uKTpyLnRha2Uobi10KSkscil9LFV0LnByb3RvdHlwZS50YWtlUmlnaHRXaGlsZT1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5yZXZlcnNlKCkudGFrZVdoaWxlKHQpLnJldmVyc2UoKX0sVXQucHJvdG90eXBlLnRvQXJyYXk9ZnVuY3Rpb24oKXtcbnJldHVybiB0aGlzLnRha2UoNDI5NDk2NzI5NSl9LGhuKFV0LnByb3RvdHlwZSxmdW5jdGlvbih0LG4pe3ZhciByPS9eKD86ZmlsdGVyfGZpbmR8bWFwfHJlamVjdCl8V2hpbGUkLy50ZXN0KG4pLGU9L14oPzpoZWFkfGxhc3QpJC8udGVzdChuKSx1PU90W2U/XCJ0YWtlXCIrKFwibGFzdFwiPT1uP1wiUmlnaHRcIjpcIlwiKTpuXSxvPWV8fC9eZmluZC8udGVzdChuKTt1JiYoT3QucHJvdG90eXBlW25dPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gbih0KXtyZXR1cm4gdD11LmFwcGx5KE90LHMoW3RdLGYpKSxlJiZoP3RbMF06dH12YXIgaT10aGlzLl9fd3JhcHBlZF9fLGY9ZT9bMV06YXJndW1lbnRzLGM9aSBpbnN0YW5jZW9mIFV0LGE9ZlswXSxsPWN8fHlpKGkpO2wmJnImJnR5cGVvZiBhPT1cImZ1bmN0aW9uXCImJjEhPWEubGVuZ3RoJiYoYz1sPWZhbHNlKTt2YXIgaD10aGlzLl9fY2hhaW5fXyxwPSEhdGhpcy5fX2FjdGlvbnNfXy5sZW5ndGgsYT1vJiYhaCxjPWMmJiFwO3JldHVybiFvJiZsPyhpPWM/aTpuZXcgVXQodGhpcyksXG5pPXQuYXBwbHkoaSxmKSxpLl9fYWN0aW9uc19fLnB1c2goe2Z1bmM6amUsYXJnczpbbl0sdGhpc0FyZzpUfSksbmV3IHp0KGksaCkpOmEmJmM/dC5hcHBseSh0aGlzLGYpOihpPXRoaXMudGhydShuKSxhP2U/aS52YWx1ZSgpWzBdOmkudmFsdWUoKTppKX0pfSksdShcInBvcCBwdXNoIHNoaWZ0IHNvcnQgc3BsaWNlIHVuc2hpZnRcIi5zcGxpdChcIiBcIiksZnVuY3Rpb24odCl7dmFyIG49T3VbdF0scj0vXig/OnB1c2h8c29ydHx1bnNoaWZ0KSQvLnRlc3QodCk/XCJ0YXBcIjpcInRocnVcIixlPS9eKD86cG9wfHNoaWZ0KSQvLnRlc3QodCk7T3QucHJvdG90eXBlW3RdPWZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzO2lmKGUmJiF0aGlzLl9fY2hhaW5fXyl7dmFyIHU9dGhpcy52YWx1ZSgpO3JldHVybiBuLmFwcGx5KHlpKHUpP3U6W10sdCl9cmV0dXJuIHRoaXNbcl0oZnVuY3Rpb24ocil7cmV0dXJuIG4uYXBwbHkoeWkocik/cjpbXSx0KX0pfX0pLGhuKFV0LnByb3RvdHlwZSxmdW5jdGlvbih0LG4pe1xudmFyIHI9T3Rbbl07aWYocil7dmFyIGU9ci5uYW1lK1wiXCI7KF9vW2VdfHwoX29bZV09W10pKS5wdXNoKHtuYW1lOm4sZnVuYzpyfSl9fSksX29bQXIoVCwyKS5uYW1lXT1be25hbWU6XCJ3cmFwcGVyXCIsZnVuYzpUfV0sVXQucHJvdG90eXBlLmNsb25lPWZ1bmN0aW9uKCl7dmFyIHQ9bmV3IFV0KHRoaXMuX193cmFwcGVkX18pO3JldHVybiB0Ll9fYWN0aW9uc19fPWxyKHRoaXMuX19hY3Rpb25zX18pLHQuX19kaXJfXz10aGlzLl9fZGlyX18sdC5fX2ZpbHRlcmVkX189dGhpcy5fX2ZpbHRlcmVkX18sdC5fX2l0ZXJhdGVlc19fPWxyKHRoaXMuX19pdGVyYXRlZXNfXyksdC5fX3Rha2VDb3VudF9fPXRoaXMuX190YWtlQ291bnRfXyx0Ll9fdmlld3NfXz1scih0aGlzLl9fdmlld3NfXyksdH0sVXQucHJvdG90eXBlLnJldmVyc2U9ZnVuY3Rpb24oKXtpZih0aGlzLl9fZmlsdGVyZWRfXyl7dmFyIHQ9bmV3IFV0KHRoaXMpO3QuX19kaXJfXz0tMSx0Ll9fZmlsdGVyZWRfXz10cnVlfWVsc2UgdD10aGlzLmNsb25lKCksXG50Ll9fZGlyX18qPS0xO3JldHVybiB0fSxVdC5wcm90b3R5cGUudmFsdWU9ZnVuY3Rpb24oKXt2YXIgdCxuPXRoaXMuX193cmFwcGVkX18udmFsdWUoKSxyPXRoaXMuX19kaXJfXyxlPXlpKG4pLHU9MD5yLG89ZT9uLmxlbmd0aDowO3Q9bztmb3IodmFyIGk9dGhpcy5fX3ZpZXdzX18sZj0wLGM9LTEsYT1pLmxlbmd0aDsrK2M8YTspe3ZhciBsPWlbY10scz1sLnNpemU7c3dpdGNoKGwudHlwZSl7Y2FzZVwiZHJvcFwiOmYrPXM7YnJlYWs7Y2FzZVwiZHJvcFJpZ2h0XCI6dC09czticmVhaztjYXNlXCJ0YWtlXCI6dD10byh0LGYrcyk7YnJlYWs7Y2FzZVwidGFrZVJpZ2h0XCI6Zj1YdShmLHQtcyl9fWlmKHQ9e3N0YXJ0OmYsZW5kOnR9LGk9dC5zdGFydCxmPXQuZW5kLHQ9Zi1pLHU9dT9mOmktMSxpPXRoaXMuX19pdGVyYXRlZXNfXyxmPWkubGVuZ3RoLGM9MCxhPXRvKHQsdGhpcy5fX3Rha2VDb3VudF9fKSwhZXx8MjAwPm98fG89PXQmJmE9PXQpcmV0dXJuIFhuKG4sdGhpcy5fX2FjdGlvbnNfXyk7ZT1bXTtcbnQ6Zm9yKDt0LS0mJmE+Yzspe2Zvcih1Kz1yLG89LTEsbD1uW3VdOysrbzxmOyl7dmFyIGg9aVtvXSxzPWgudHlwZSxoPSgwLGguaXRlcmF0ZWUpKGwpO2lmKDI9PXMpbD1oO2Vsc2UgaWYoIWgpe2lmKDE9PXMpY29udGludWUgdDticmVhayB0fX1lW2MrK109bH1yZXR1cm4gZX0sT3QucHJvdG90eXBlLmF0PVhvLE90LnByb3RvdHlwZS5jaGFpbj1mdW5jdGlvbigpe3JldHVybiB4ZSh0aGlzKX0sT3QucHJvdG90eXBlLmNvbW1pdD1mdW5jdGlvbigpe3JldHVybiBuZXcgenQodGhpcy52YWx1ZSgpLHRoaXMuX19jaGFpbl9fKX0sT3QucHJvdG90eXBlLm5leHQ9ZnVuY3Rpb24oKXt0aGlzLl9fdmFsdWVzX189PT1UJiYodGhpcy5fX3ZhbHVlc19fPUhlKHRoaXMudmFsdWUoKSkpO3ZhciB0PXRoaXMuX19pbmRleF9fPj10aGlzLl9fdmFsdWVzX18ubGVuZ3RoLG49dD9UOnRoaXMuX192YWx1ZXNfX1t0aGlzLl9faW5kZXhfXysrXTtyZXR1cm57ZG9uZTp0LHZhbHVlOm59fSxPdC5wcm90b3R5cGUucGxhbnQ9ZnVuY3Rpb24odCl7XG5mb3IodmFyIG4scj10aGlzO3IgaW5zdGFuY2VvZiBrdDspe3ZhciBlPWFlKHIpO2UuX19pbmRleF9fPTAsZS5fX3ZhbHVlc19fPVQsbj91Ll9fd3JhcHBlZF9fPWU6bj1lO3ZhciB1PWUscj1yLl9fd3JhcHBlZF9ffXJldHVybiB1Ll9fd3JhcHBlZF9fPXQsbn0sT3QucHJvdG90eXBlLnJldmVyc2U9ZnVuY3Rpb24oKXt2YXIgdD10aGlzLl9fd3JhcHBlZF9fO3JldHVybiB0IGluc3RhbmNlb2YgVXQ/KHRoaXMuX19hY3Rpb25zX18ubGVuZ3RoJiYodD1uZXcgVXQodGhpcykpLHQ9dC5yZXZlcnNlKCksdC5fX2FjdGlvbnNfXy5wdXNoKHtmdW5jOmplLGFyZ3M6W2RlXSx0aGlzQXJnOlR9KSxuZXcgenQodCx0aGlzLl9fY2hhaW5fXykpOnRoaXMudGhydShkZSl9LE90LnByb3RvdHlwZS50b0pTT049T3QucHJvdG90eXBlLnZhbHVlT2Y9T3QucHJvdG90eXBlLnZhbHVlPWZ1bmN0aW9uKCl7cmV0dXJuIFhuKHRoaXMuX193cmFwcGVkX18sdGhpcy5fX2FjdGlvbnNfXyl9LFp1JiYoT3QucHJvdG90eXBlW1p1XT13ZSksXG5PdH12YXIgVCxxPTEvMCxWPU5hTixLPS9cXGJfX3BcXCs9Jyc7L2csRz0vXFxiKF9fcFxcKz0pJydcXCsvZyxKPS8oX19lXFwoLio/XFwpfFxcYl9fdFxcKSlcXCsnJzsvZyxZPS8mKD86YW1wfGx0fGd0fHF1b3R8IzM5fCM5Nik7L2csSD0vWyY8PlwiJ2BdL2csUT1SZWdFeHAoWS5zb3VyY2UpLFg9UmVnRXhwKEguc291cmNlKSx0dD0vPCUtKFtcXHNcXFNdKz8pJT4vZyxudD0vPCUoW1xcc1xcU10rPyklPi9nLHJ0PS88JT0oW1xcc1xcU10rPyklPi9nLGV0PS9cXC58XFxbKD86W15bXFxdXSp8KFtcIiddKSg/Oig/IVxcMSlbXlxcXFxdfFxcXFwuKSo/XFwxKVxcXS8sdXQ9L15cXHcqJC8sb3Q9L1teLltcXF1dK3xcXFsoPzooLT9cXGQrKD86XFwuXFxkKyk/KXwoW1wiJ10pKCg/Oig/IVxcMilbXlxcXFxdfFxcXFwuKSo/KVxcMilcXF18KD89KFxcLnxcXFtcXF0pKD86XFw0fCQpKS9nLGl0PS9bXFxcXF4kLiorPygpW1xcXXt9fF0vZyxmdD1SZWdFeHAoaXQuc291cmNlKSxjdD0vXlxccyt8XFxzKyQvZyxhdD0vXlxccysvLGx0PS9cXHMrJC8sc3Q9L1thLXpBLVowLTldKy9nLGh0PS9cXFxcKFxcXFwpPy9nLHB0PS9cXCRcXHsoW15cXFxcfV0qKD86XFxcXC5bXlxcXFx9XSopKilcXH0vZyxfdD0vXFx3KiQvLHZ0PS9eMHgvaSxndD0vXlstK10weFswLTlhLWZdKyQvaSxkdD0vXjBiWzAxXSskL2kseXQ9L15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLyxidD0vXjBvWzAtN10rJC9pLHh0PS9eKD86MHxbMS05XVxcZCopJC8sanQ9L1tcXHhjMC1cXHhkNlxceGQ4LVxceGRlXFx4ZGYtXFx4ZjZcXHhmOC1cXHhmZl0vZyx3dD0vKCReKS8sbXQ9L1snXFxuXFxyXFx1MjAyOFxcdTIwMjlcXFxcXS9nLEF0PVwiW1xcXFx1ZmUwZVxcXFx1ZmUwZl0/KD86W1xcXFx1MDMwMC1cXFxcdTAzNmZcXFxcdWZlMjAtXFxcXHVmZTIzXFxcXHUyMGQwLVxcXFx1MjBmMF18XFxcXHVkODNjW1xcXFx1ZGZmYi1cXFxcdWRmZmZdKT8oPzpcXFxcdTIwMGQoPzpbXlxcXFx1ZDgwMC1cXFxcdWRmZmZdfCg/OlxcXFx1ZDgzY1tcXFxcdWRkZTYtXFxcXHVkZGZmXSl7Mn18W1xcXFx1ZDgwMC1cXFxcdWRiZmZdW1xcXFx1ZGMwMC1cXFxcdWRmZmZdKVtcXFxcdWZlMGVcXFxcdWZlMGZdPyg/OltcXFxcdTAzMDAtXFxcXHUwMzZmXFxcXHVmZTIwLVxcXFx1ZmUyM1xcXFx1MjBkMC1cXFxcdTIwZjBdfFxcXFx1ZDgzY1tcXFxcdWRmZmItXFxcXHVkZmZmXSk/KSpcIixPdD1cIig/OltcXFxcdTI3MDAtXFxcXHUyN2JmXXwoPzpcXFxcdWQ4M2NbXFxcXHVkZGU2LVxcXFx1ZGRmZl0pezJ9fFtcXFxcdWQ4MDAtXFxcXHVkYmZmXVtcXFxcdWRjMDAtXFxcXHVkZmZmXSlcIitBdCxrdD1cIig/OlteXFxcXHVkODAwLVxcXFx1ZGZmZl1bXFxcXHUwMzAwLVxcXFx1MDM2ZlxcXFx1ZmUyMC1cXFxcdWZlMjNcXFxcdTIwZDAtXFxcXHUyMGYwXT98W1xcXFx1MDMwMC1cXFxcdTAzNmZcXFxcdWZlMjAtXFxcXHVmZTIzXFxcXHUyMGQwLVxcXFx1MjBmMF18KD86XFxcXHVkODNjW1xcXFx1ZGRlNi1cXFxcdWRkZmZdKXsyfXxbXFxcXHVkODAwLVxcXFx1ZGJmZl1bXFxcXHVkYzAwLVxcXFx1ZGZmZl18W1xcXFx1ZDgwMC1cXFxcdWRmZmZdKVwiLEV0PVJlZ0V4cChcIlsnXFx1MjAxOV1cIixcImdcIiksU3Q9UmVnRXhwKFwiW1xcXFx1MDMwMC1cXFxcdTAzNmZcXFxcdWZlMjAtXFxcXHVmZTIzXFxcXHUyMGQwLVxcXFx1MjBmMF1cIixcImdcIiksSXQ9UmVnRXhwKFwiXFxcXHVkODNjW1xcXFx1ZGZmYi1cXFxcdWRmZmZdKD89XFxcXHVkODNjW1xcXFx1ZGZmYi1cXFxcdWRmZmZdKXxcIitrdCtBdCxcImdcIiksUnQ9UmVnRXhwKFtcIltBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdP1thLXpcXFxceGRmLVxcXFx4ZjZcXFxceGY4LVxcXFx4ZmZdKyg/OlsnXFx1MjAxOV0oPzpkfGxsfG18cmV8c3x0fHZlKSk/KD89W1xcXFx4YWNcXFxceGIxXFxcXHhkN1xcXFx4ZjdcXFxceDAwLVxcXFx4MmZcXFxceDNhLVxcXFx4NDBcXFxceDViLVxcXFx4NjBcXFxceDdiLVxcXFx4YmZcXFxcdTIwMDAtXFxcXHUyMDZmIFxcXFx0XFxcXHgwYlxcXFxmXFxcXHhhMFxcXFx1ZmVmZlxcXFxuXFxcXHJcXFxcdTIwMjhcXFxcdTIwMjlcXFxcdTE2ODBcXFxcdTE4MGVcXFxcdTIwMDBcXFxcdTIwMDFcXFxcdTIwMDJcXFxcdTIwMDNcXFxcdTIwMDRcXFxcdTIwMDVcXFxcdTIwMDZcXFxcdTIwMDdcXFxcdTIwMDhcXFxcdTIwMDlcXFxcdTIwMGFcXFxcdTIwMmZcXFxcdTIwNWZcXFxcdTMwMDBdfFtBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdfCQpfCg/OltBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdfFteXFxcXHVkODAwLVxcXFx1ZGZmZlxcXFx4YWNcXFxceGIxXFxcXHhkN1xcXFx4ZjdcXFxceDAwLVxcXFx4MmZcXFxceDNhLVxcXFx4NDBcXFxceDViLVxcXFx4NjBcXFxceDdiLVxcXFx4YmZcXFxcdTIwMDAtXFxcXHUyMDZmIFxcXFx0XFxcXHgwYlxcXFxmXFxcXHhhMFxcXFx1ZmVmZlxcXFxuXFxcXHJcXFxcdTIwMjhcXFxcdTIwMjlcXFxcdTE2ODBcXFxcdTE4MGVcXFxcdTIwMDBcXFxcdTIwMDFcXFxcdTIwMDJcXFxcdTIwMDNcXFxcdTIwMDRcXFxcdTIwMDVcXFxcdTIwMDZcXFxcdTIwMDdcXFxcdTIwMDhcXFxcdTIwMDlcXFxcdTIwMGFcXFxcdTIwMmZcXFxcdTIwNWZcXFxcdTMwMDBcXFxcZCtcXFxcdTI3MDAtXFxcXHUyN2JmYS16XFxcXHhkZi1cXFxceGY2XFxcXHhmOC1cXFxceGZmQS1aXFxcXHhjMC1cXFxceGQ2XFxcXHhkOC1cXFxceGRlXSkrKD86WydcXHUyMDE5XSg/OkR8TEx8TXxSRXxTfFR8VkUpKT8oPz1bXFxcXHhhY1xcXFx4YjFcXFxceGQ3XFxcXHhmN1xcXFx4MDAtXFxcXHgyZlxcXFx4M2EtXFxcXHg0MFxcXFx4NWItXFxcXHg2MFxcXFx4N2ItXFxcXHhiZlxcXFx1MjAwMC1cXFxcdTIwNmYgXFxcXHRcXFxceDBiXFxcXGZcXFxceGEwXFxcXHVmZWZmXFxcXG5cXFxcclxcXFx1MjAyOFxcXFx1MjAyOVxcXFx1MTY4MFxcXFx1MTgwZVxcXFx1MjAwMFxcXFx1MjAwMVxcXFx1MjAwMlxcXFx1MjAwM1xcXFx1MjAwNFxcXFx1MjAwNVxcXFx1MjAwNlxcXFx1MjAwN1xcXFx1MjAwOFxcXFx1MjAwOVxcXFx1MjAwYVxcXFx1MjAyZlxcXFx1MjA1ZlxcXFx1MzAwMF18W0EtWlxcXFx4YzAtXFxcXHhkNlxcXFx4ZDgtXFxcXHhkZV0oPzpbYS16XFxcXHhkZi1cXFxceGY2XFxcXHhmOC1cXFxceGZmXXxbXlxcXFx1ZDgwMC1cXFxcdWRmZmZcXFxceGFjXFxcXHhiMVxcXFx4ZDdcXFxceGY3XFxcXHgwMC1cXFxceDJmXFxcXHgzYS1cXFxceDQwXFxcXHg1Yi1cXFxceDYwXFxcXHg3Yi1cXFxceGJmXFxcXHUyMDAwLVxcXFx1MjA2ZiBcXFxcdFxcXFx4MGJcXFxcZlxcXFx4YTBcXFxcdWZlZmZcXFxcblxcXFxyXFxcXHUyMDI4XFxcXHUyMDI5XFxcXHUxNjgwXFxcXHUxODBlXFxcXHUyMDAwXFxcXHUyMDAxXFxcXHUyMDAyXFxcXHUyMDAzXFxcXHUyMDA0XFxcXHUyMDA1XFxcXHUyMDA2XFxcXHUyMDA3XFxcXHUyMDA4XFxcXHUyMDA5XFxcXHUyMDBhXFxcXHUyMDJmXFxcXHUyMDVmXFxcXHUzMDAwXFxcXGQrXFxcXHUyNzAwLVxcXFx1MjdiZmEtelxcXFx4ZGYtXFxcXHhmNlxcXFx4ZjgtXFxcXHhmZkEtWlxcXFx4YzAtXFxcXHhkNlxcXFx4ZDgtXFxcXHhkZV0pfCQpfFtBLVpcXFxceGMwLVxcXFx4ZDZcXFxceGQ4LVxcXFx4ZGVdPyg/OlthLXpcXFxceGRmLVxcXFx4ZjZcXFxceGY4LVxcXFx4ZmZdfFteXFxcXHVkODAwLVxcXFx1ZGZmZlxcXFx4YWNcXFxceGIxXFxcXHhkN1xcXFx4ZjdcXFxceDAwLVxcXFx4MmZcXFxceDNhLVxcXFx4NDBcXFxceDViLVxcXFx4NjBcXFxceDdiLVxcXFx4YmZcXFxcdTIwMDAtXFxcXHUyMDZmIFxcXFx0XFxcXHgwYlxcXFxmXFxcXHhhMFxcXFx1ZmVmZlxcXFxuXFxcXHJcXFxcdTIwMjhcXFxcdTIwMjlcXFxcdTE2ODBcXFxcdTE4MGVcXFxcdTIwMDBcXFxcdTIwMDFcXFxcdTIwMDJcXFxcdTIwMDNcXFxcdTIwMDRcXFxcdTIwMDVcXFxcdTIwMDZcXFxcdTIwMDdcXFxcdTIwMDhcXFxcdTIwMDlcXFxcdTIwMGFcXFxcdTIwMmZcXFxcdTIwNWZcXFxcdTMwMDBcXFxcZCtcXFxcdTI3MDAtXFxcXHUyN2JmYS16XFxcXHhkZi1cXFxceGY2XFxcXHhmOC1cXFxceGZmQS1aXFxcXHhjMC1cXFxceGQ2XFxcXHhkOC1cXFxceGRlXSkrKD86WydcXHUyMDE5XSg/OmR8bGx8bXxyZXxzfHR8dmUpKT98W0EtWlxcXFx4YzAtXFxcXHhkNlxcXFx4ZDgtXFxcXHhkZV0rKD86WydcXHUyMDE5XSg/OkR8TEx8TXxSRXxTfFR8VkUpKT98XFxcXGQrXCIsT3RdLmpvaW4oXCJ8XCIpLFwiZ1wiKSxXdD1SZWdFeHAoXCJbXFxcXHUyMDBkXFxcXHVkODAwLVxcXFx1ZGZmZlxcXFx1MDMwMC1cXFxcdTAzNmZcXFxcdWZlMjAtXFxcXHVmZTIzXFxcXHUyMGQwLVxcXFx1MjBmMFxcXFx1ZmUwZVxcXFx1ZmUwZl1cIiksQnQ9L1thLXpdW0EtWl18W0EtWl17Mix9W2Etel18WzAtOV1bYS16QS1aXXxbYS16QS1aXVswLTldfFteYS16QS1aMC05IF0vLEx0PVwiQXJyYXkgQnVmZmVyIERhdGFWaWV3IERhdGUgRXJyb3IgRmxvYXQzMkFycmF5IEZsb2F0NjRBcnJheSBGdW5jdGlvbiBJbnQ4QXJyYXkgSW50MTZBcnJheSBJbnQzMkFycmF5IE1hcCBNYXRoIE9iamVjdCBQcm9taXNlIFJlZmxlY3QgUmVnRXhwIFNldCBTdHJpbmcgU3ltYm9sIFR5cGVFcnJvciBVaW50OEFycmF5IFVpbnQ4Q2xhbXBlZEFycmF5IFVpbnQxNkFycmF5IFVpbnQzMkFycmF5IFdlYWtNYXAgXyBpc0Zpbml0ZSBwYXJzZUludCBzZXRUaW1lb3V0XCIuc3BsaXQoXCIgXCIpLE10PXt9O1xuTXRbXCJbb2JqZWN0IEZsb2F0MzJBcnJheV1cIl09TXRbXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIl09TXRbXCJbb2JqZWN0IEludDhBcnJheV1cIl09TXRbXCJbb2JqZWN0IEludDE2QXJyYXldXCJdPU10W1wiW29iamVjdCBJbnQzMkFycmF5XVwiXT1NdFtcIltvYmplY3QgVWludDhBcnJheV1cIl09TXRbXCJbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XVwiXT1NdFtcIltvYmplY3QgVWludDE2QXJyYXldXCJdPU10W1wiW29iamVjdCBVaW50MzJBcnJheV1cIl09dHJ1ZSxNdFtcIltvYmplY3QgQXJndW1lbnRzXVwiXT1NdFtcIltvYmplY3QgQXJyYXldXCJdPU10W1wiW29iamVjdCBBcnJheUJ1ZmZlcl1cIl09TXRbXCJbb2JqZWN0IEJvb2xlYW5dXCJdPU10W1wiW29iamVjdCBEYXRhVmlld11cIl09TXRbXCJbb2JqZWN0IERhdGVdXCJdPU10W1wiW29iamVjdCBFcnJvcl1cIl09TXRbXCJbb2JqZWN0IEZ1bmN0aW9uXVwiXT1NdFtcIltvYmplY3QgTWFwXVwiXT1NdFtcIltvYmplY3QgTnVtYmVyXVwiXT1NdFtcIltvYmplY3QgT2JqZWN0XVwiXT1NdFtcIltvYmplY3QgUmVnRXhwXVwiXT1NdFtcIltvYmplY3QgU2V0XVwiXT1NdFtcIltvYmplY3QgU3RyaW5nXVwiXT1NdFtcIltvYmplY3QgV2Vha01hcF1cIl09ZmFsc2U7XG52YXIgQ3Q9e307Q3RbXCJbb2JqZWN0IEFyZ3VtZW50c11cIl09Q3RbXCJbb2JqZWN0IEFycmF5XVwiXT1DdFtcIltvYmplY3QgQXJyYXlCdWZmZXJdXCJdPUN0W1wiW29iamVjdCBEYXRhVmlld11cIl09Q3RbXCJbb2JqZWN0IEJvb2xlYW5dXCJdPUN0W1wiW29iamVjdCBEYXRlXVwiXT1DdFtcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiXT1DdFtcIltvYmplY3QgRmxvYXQ2NEFycmF5XVwiXT1DdFtcIltvYmplY3QgSW50OEFycmF5XVwiXT1DdFtcIltvYmplY3QgSW50MTZBcnJheV1cIl09Q3RbXCJbb2JqZWN0IEludDMyQXJyYXldXCJdPUN0W1wiW29iamVjdCBNYXBdXCJdPUN0W1wiW29iamVjdCBOdW1iZXJdXCJdPUN0W1wiW29iamVjdCBPYmplY3RdXCJdPUN0W1wiW29iamVjdCBSZWdFeHBdXCJdPUN0W1wiW29iamVjdCBTZXRdXCJdPUN0W1wiW29iamVjdCBTdHJpbmddXCJdPUN0W1wiW29iamVjdCBTeW1ib2xdXCJdPUN0W1wiW29iamVjdCBVaW50OEFycmF5XVwiXT1DdFtcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCJdPUN0W1wiW29iamVjdCBVaW50MTZBcnJheV1cIl09Q3RbXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiXT10cnVlLFxuQ3RbXCJbb2JqZWN0IEVycm9yXVwiXT1DdFtcIltvYmplY3QgRnVuY3Rpb25dXCJdPUN0W1wiW29iamVjdCBXZWFrTWFwXVwiXT1mYWxzZTt2YXIgenQ9e1wiXFx4YzBcIjpcIkFcIixcIlxceGMxXCI6XCJBXCIsXCJcXHhjMlwiOlwiQVwiLFwiXFx4YzNcIjpcIkFcIixcIlxceGM0XCI6XCJBXCIsXCJcXHhjNVwiOlwiQVwiLFwiXFx4ZTBcIjpcImFcIixcIlxceGUxXCI6XCJhXCIsXCJcXHhlMlwiOlwiYVwiLFwiXFx4ZTNcIjpcImFcIixcIlxceGU0XCI6XCJhXCIsXCJcXHhlNVwiOlwiYVwiLFwiXFx4YzdcIjpcIkNcIixcIlxceGU3XCI6XCJjXCIsXCJcXHhkMFwiOlwiRFwiLFwiXFx4ZjBcIjpcImRcIixcIlxceGM4XCI6XCJFXCIsXCJcXHhjOVwiOlwiRVwiLFwiXFx4Y2FcIjpcIkVcIixcIlxceGNiXCI6XCJFXCIsXCJcXHhlOFwiOlwiZVwiLFwiXFx4ZTlcIjpcImVcIixcIlxceGVhXCI6XCJlXCIsXCJcXHhlYlwiOlwiZVwiLFwiXFx4Y2NcIjpcIklcIixcIlxceGNkXCI6XCJJXCIsXCJcXHhjZVwiOlwiSVwiLFwiXFx4Y2ZcIjpcIklcIixcIlxceGVjXCI6XCJpXCIsXCJcXHhlZFwiOlwiaVwiLFwiXFx4ZWVcIjpcImlcIixcIlxceGVmXCI6XCJpXCIsXCJcXHhkMVwiOlwiTlwiLFwiXFx4ZjFcIjpcIm5cIixcIlxceGQyXCI6XCJPXCIsXCJcXHhkM1wiOlwiT1wiLFwiXFx4ZDRcIjpcIk9cIixcIlxceGQ1XCI6XCJPXCIsXCJcXHhkNlwiOlwiT1wiLFxuXCJcXHhkOFwiOlwiT1wiLFwiXFx4ZjJcIjpcIm9cIixcIlxceGYzXCI6XCJvXCIsXCJcXHhmNFwiOlwib1wiLFwiXFx4ZjVcIjpcIm9cIixcIlxceGY2XCI6XCJvXCIsXCJcXHhmOFwiOlwib1wiLFwiXFx4ZDlcIjpcIlVcIixcIlxceGRhXCI6XCJVXCIsXCJcXHhkYlwiOlwiVVwiLFwiXFx4ZGNcIjpcIlVcIixcIlxceGY5XCI6XCJ1XCIsXCJcXHhmYVwiOlwidVwiLFwiXFx4ZmJcIjpcInVcIixcIlxceGZjXCI6XCJ1XCIsXCJcXHhkZFwiOlwiWVwiLFwiXFx4ZmRcIjpcInlcIixcIlxceGZmXCI6XCJ5XCIsXCJcXHhjNlwiOlwiQWVcIixcIlxceGU2XCI6XCJhZVwiLFwiXFx4ZGVcIjpcIlRoXCIsXCJcXHhmZVwiOlwidGhcIixcIlxceGRmXCI6XCJzc1wifSxVdD17XCImXCI6XCImYW1wO1wiLFwiPFwiOlwiJmx0O1wiLFwiPlwiOlwiJmd0O1wiLCdcIic6XCImcXVvdDtcIixcIidcIjpcIiYjMzk7XCIsXCJgXCI6XCImIzk2O1wifSwkdD17XCImYW1wO1wiOlwiJlwiLFwiJmx0O1wiOlwiPFwiLFwiJmd0O1wiOlwiPlwiLFwiJnF1b3Q7XCI6J1wiJyxcIiYjMzk7XCI6XCInXCIsXCImIzk2O1wiOlwiYFwifSxEdD17XCJcXFxcXCI6XCJcXFxcXCIsXCInXCI6XCInXCIsXCJcXG5cIjpcIm5cIixcIlxcclwiOlwiclwiLFwiXFx1MjAyOFwiOlwidTIwMjhcIixcIlxcdTIwMjlcIjpcInUyMDI5XCJ9LEZ0PXBhcnNlRmxvYXQsTnQ9cGFyc2VJbnQsUHQ9dHlwZW9mIGV4cG9ydHM9PVwib2JqZWN0XCImJmV4cG9ydHMsWnQ9UHQmJnR5cGVvZiBtb2R1bGU9PVwib2JqZWN0XCImJm1vZHVsZSxUdD1adCYmWnQuZXhwb3J0cz09PVB0LHF0PVIodHlwZW9mIHNlbGY9PVwib2JqZWN0XCImJnNlbGYpLFZ0PVIodHlwZW9mIHRoaXM9PVwib2JqZWN0XCImJnRoaXMpLEt0PVIodHlwZW9mIGdsb2JhbD09XCJvYmplY3RcIiYmZ2xvYmFsKXx8cXR8fFZ0fHxGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCksR3Q9WigpO1xuKHF0fHx7fSkuXz1HdCx0eXBlb2YgZGVmaW5lPT1cImZ1bmN0aW9uXCImJnR5cGVvZiBkZWZpbmUuYW1kPT1cIm9iamVjdFwiJiZkZWZpbmUuYW1kPyBkZWZpbmUoZnVuY3Rpb24oKXtyZXR1cm4gR3R9KTpadD8oKFp0LmV4cG9ydHM9R3QpLl89R3QsUHQuXz1HdCk6S3QuXz1HdH0pLmNhbGwodGhpcyk7IiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuKGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNhY2hlZFNldFRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaXMgbm90IGRlZmluZWQnKTtcbiAgICB9XG4gIH1cbiAgdHJ5IHtcbiAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBpcyBub3QgZGVmaW5lZCcpO1xuICAgIH1cbiAgfVxufSAoKSlcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IGNhY2hlZFNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNhY2hlZENsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKlxuXHRUaGlzIGlzIHJvdC5qcywgdGhlIFJPZ3VlbGlrZSBUb29sa2l0IGluIEphdmFTY3JpcHQuXG5cdFZlcnNpb24gMC42fmRldiwgZ2VuZXJhdGVkIG9uIE1vbiBOb3YgMzAgMTA6MzQ6NDIgQ0VUIDIwMTUuXG4qL1xuLyoqXG4gKiBBZGQgb2JqZWN0cyBmb3IgTm9kZS5qcyBlbnZpcm9ubWVudFxuICovXG5nbG9iYWwucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2IpIHtcblx0cmV0dXJuIHNldFRpbWVvdXQoY2IsIDEwMDAvNjApO1xufTtcblxuZ2xvYmFsLmRvY3VtZW50ID0ge1xuXHRib2R5OiB7XG5cdFx0YXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkKSB7fSxcblx0XHRzY3JvbGxMZWZ0OiAwLFxuXHRcdHNjcm9sbFRvcDogMFxuXHR9LFxuXHRjcmVhdGVFbGVtZW50OiBmdW5jdGlvbih0eXBlKSB7XG5cdFx0dmFyIGNhbnZhcztcblx0XHRyZXR1cm4gY2FudmFzID0ge1xuXHRcdFx0Z2V0Qm91bmRpbmdDbGllbnRSZWN0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIHJlY3Q7XG5cdFx0XHRcdHJldHVybiByZWN0ID0ge1xuXHRcdFx0XHRcdGxlZnQ6IDAsXG5cdFx0XHRcdFx0dG9wOiAwXG5cdFx0XHRcdH07XG5cdFx0XHR9LFxuXHRcdFx0Z2V0Q29udGV4dDogZnVuY3Rpb24odHlwZSkge1xuXHRcdFx0XHR2YXIgY29udGV4dDtcblx0XHRcdFx0cmV0dXJuIGNvbnRleHQgPSB7XG5cdFx0XHRcdFx0X3Rlcm1jb2xvcjogbnVsbCxcblx0XHRcdFx0XHRiZWdpblBhdGg6IGZ1bmN0aW9uKCkge30sXG5cdFx0XHRcdFx0Y2FudmFzOiBjYW52YXMsXG5cdFx0XHRcdFx0Y2xlYXJSZWN0OiBmdW5jdGlvbih4LCB5LCB3LCBoKSB7XG5cdFx0XHRcdFx0XHRpZih0aGlzLl90ZXJtY29sb3IgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGNsZWFyQ21kID0gdGhpcy5fdGVybWNvbG9yLmNsZWFyVG9BbnNpKHRoaXMuZmlsbFN0eWxlKTtcblx0XHRcdFx0XHRcdFx0cHJvY2Vzcy5zdGRvdXQud3JpdGUoY2xlYXJDbWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZHJhd0ltYWdlOiBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmLCBnLCBoLCBpKSB7fSxcblx0XHRcdFx0XHRmaWxsOiBmdW5jdGlvbigpIHt9LFxuXHRcdFx0XHRcdGZpbGxSZWN0OiBmdW5jdGlvbih4LCB5LCB3LCBoKSB7XG5cdFx0XHRcdFx0XHRpZih0aGlzLl90ZXJtY29sb3IgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGNsZWFyQ21kID0gdGhpcy5fdGVybWNvbG9yLmNsZWFyVG9BbnNpKHRoaXMuZmlsbFN0eWxlKTtcblx0XHRcdFx0XHRcdFx0cHJvY2Vzcy5zdGRvdXQud3JpdGUoY2xlYXJDbWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZmlsbFN0eWxlOiBcIiMwMDBcIixcblx0XHRcdFx0XHRmaWxsVGV4dDogZnVuY3Rpb24oY2hzLCB4LCB5KSB7fSxcblx0XHRcdFx0XHRmb250OiBcIm1vbm9zcGFjZVwiLFxuXHRcdFx0XHRcdGxpbmVUbzogZnVuY3Rpb24oeCwgeSkge30sXG5cdFx0XHRcdFx0bWVhc3VyZVRleHQ6IGZ1bmN0aW9uKGNoKSB7XG5cdFx0XHRcdFx0XHR2YXIgcmVzdWx0O1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCA9IHtcblx0XHRcdFx0XHRcdFx0d2lkdGg6IDEyXG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bW92ZVRvOiBmdW5jdGlvbih4LCB5KSB7fSxcblx0XHRcdFx0XHR0ZXh0QWxpZ246IFwiY2VudGVyXCIsXG5cdFx0XHRcdFx0dGV4dEJhc2VsaW5lOiBcIm1pZGRsZVwiXG5cdFx0XHRcdH07XG5cdFx0XHR9LFxuXHRcdFx0aGVpZ2h0OiAwLFxuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0bGVmdDogXCIxMDBweFwiLFxuXHRcdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHR0b3A6IFwiMTAwcHhcIixcblx0XHRcdFx0dmlzaWJpbGl0eTogXCJoaWRkZW5cIlxuXHRcdFx0fSxcblx0XHRcdHdpZHRoOiAwXG5cdFx0fTtcblx0fSxcblx0ZG9jdW1lbnRFbGVtZW50OiB7XG5cdFx0c2Nyb2xsTGVmdDogMCxcblx0XHRzY3JvbGxUb3A6IDBcblx0fVxufTtcbi8qKlxuICogQG5hbWVzcGFjZSBUb3AtbGV2ZWwgUk9UIG5hbWVzcGFjZVxuICovXG52YXIgUk9UID0ge1xuXHQvKipcblx0ICogQHJldHVybnMge2Jvb2x9IElzIHJvdC5qcyBzdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyP1xuXHQgKi9cblx0aXNTdXBwb3J0ZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAhIShkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLmdldENvbnRleHQgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpO1xuXHR9LFxuXG5cdC8qKiBEZWZhdWx0IHdpdGggZm9yIGRpc3BsYXkgYW5kIG1hcCBnZW5lcmF0b3JzICovXG5cdERFRkFVTFRfV0lEVEg6IDgwLFxuXHQvKiogRGVmYXVsdCBoZWlnaHQgZm9yIGRpc3BsYXkgYW5kIG1hcCBnZW5lcmF0b3JzICovXG5cdERFRkFVTFRfSEVJR0hUOiAyNSxcblxuXHQvKiogRGlyZWN0aW9uYWwgY29uc3RhbnRzLiBPcmRlcmluZyBpcyBpbXBvcnRhbnQhICovXG5cdERJUlM6IHtcblx0XHRcIjRcIjogW1xuXHRcdFx0WyAwLCAtMV0sXG5cdFx0XHRbIDEsICAwXSxcblx0XHRcdFsgMCwgIDFdLFxuXHRcdFx0Wy0xLCAgMF1cblx0XHRdLFxuXHRcdFwiOFwiOiBbXG5cdFx0XHRbIDAsIC0xXSxcblx0XHRcdFsgMSwgLTFdLFxuXHRcdFx0WyAxLCAgMF0sXG5cdFx0XHRbIDEsICAxXSxcblx0XHRcdFsgMCwgIDFdLFxuXHRcdFx0Wy0xLCAgMV0sXG5cdFx0XHRbLTEsICAwXSxcblx0XHRcdFstMSwgLTFdXG5cdFx0XSxcblx0XHRcIjZcIjogW1xuXHRcdFx0Wy0xLCAtMV0sXG5cdFx0XHRbIDEsIC0xXSxcblx0XHRcdFsgMiwgIDBdLFxuXHRcdFx0WyAxLCAgMV0sXG5cdFx0XHRbLTEsICAxXSxcblx0XHRcdFstMiwgIDBdXG5cdFx0XVxuXHR9LFxuXG5cdC8qKiBDYW5jZWwga2V5LiAqL1xuXHRWS19DQU5DRUw6IDMsIFxuXHQvKiogSGVscCBrZXkuICovXG5cdFZLX0hFTFA6IDYsIFxuXHQvKiogQmFja3NwYWNlIGtleS4gKi9cblx0VktfQkFDS19TUEFDRTogOCwgXG5cdC8qKiBUYWIga2V5LiAqL1xuXHRWS19UQUI6IDksIFxuXHQvKiogNSBrZXkgb24gTnVtcGFkIHdoZW4gTnVtTG9jayBpcyB1bmxvY2tlZC4gT3Igb24gTWFjLCBjbGVhciBrZXkgd2hpY2ggaXMgcG9zaXRpb25lZCBhdCBOdW1Mb2NrIGtleS4gKi9cblx0VktfQ0xFQVI6IDEyLCBcblx0LyoqIFJldHVybi9lbnRlciBrZXkgb24gdGhlIG1haW4ga2V5Ym9hcmQuICovXG5cdFZLX1JFVFVSTjogMTMsIFxuXHQvKiogUmVzZXJ2ZWQsIGJ1dCBub3QgdXNlZC4gKi9cblx0VktfRU5URVI6IDE0LCBcblx0LyoqIFNoaWZ0IGtleS4gKi9cblx0VktfU0hJRlQ6IDE2LCBcblx0LyoqIENvbnRyb2wga2V5LiAqL1xuXHRWS19DT05UUk9MOiAxNywgXG5cdC8qKiBBbHQgKE9wdGlvbiBvbiBNYWMpIGtleS4gKi9cblx0VktfQUxUOiAxOCwgXG5cdC8qKiBQYXVzZSBrZXkuICovXG5cdFZLX1BBVVNFOiAxOSwgXG5cdC8qKiBDYXBzIGxvY2suICovXG5cdFZLX0NBUFNfTE9DSzogMjAsIFxuXHQvKiogRXNjYXBlIGtleS4gKi9cblx0VktfRVNDQVBFOiAyNywgXG5cdC8qKiBTcGFjZSBiYXIuICovXG5cdFZLX1NQQUNFOiAzMiwgXG5cdC8qKiBQYWdlIFVwIGtleS4gKi9cblx0VktfUEFHRV9VUDogMzMsIFxuXHQvKiogUGFnZSBEb3duIGtleS4gKi9cblx0VktfUEFHRV9ET1dOOiAzNCwgXG5cdC8qKiBFbmQga2V5LiAqL1xuXHRWS19FTkQ6IDM1LCBcblx0LyoqIEhvbWUga2V5LiAqL1xuXHRWS19IT01FOiAzNiwgXG5cdC8qKiBMZWZ0IGFycm93LiAqL1xuXHRWS19MRUZUOiAzNywgXG5cdC8qKiBVcCBhcnJvdy4gKi9cblx0VktfVVA6IDM4LCBcblx0LyoqIFJpZ2h0IGFycm93LiAqL1xuXHRWS19SSUdIVDogMzksIFxuXHQvKiogRG93biBhcnJvdy4gKi9cblx0VktfRE9XTjogNDAsIFxuXHQvKiogUHJpbnQgU2NyZWVuIGtleS4gKi9cblx0VktfUFJJTlRTQ1JFRU46IDQ0LCBcblx0LyoqIElucyhlcnQpIGtleS4gKi9cblx0VktfSU5TRVJUOiA0NSwgXG5cdC8qKiBEZWwoZXRlKSBrZXkuICovXG5cdFZLX0RFTEVURTogNDYsIFxuXHQvKioqL1xuXHRWS18wOiA0OCxcblx0LyoqKi9cblx0VktfMTogNDksXG5cdC8qKiovXG5cdFZLXzI6IDUwLFxuXHQvKioqL1xuXHRWS18zOiA1MSxcblx0LyoqKi9cblx0VktfNDogNTIsXG5cdC8qKiovXG5cdFZLXzU6IDUzLFxuXHQvKioqL1xuXHRWS182OiA1NCxcblx0LyoqKi9cblx0VktfNzogNTUsXG5cdC8qKiovXG5cdFZLXzg6IDU2LFxuXHQvKioqL1xuXHRWS185OiA1Nyxcblx0LyoqIENvbG9uICg6KSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQ09MT046IDU4LCBcblx0LyoqIFNlbWljb2xvbiAoOykga2V5LiAqL1xuXHRWS19TRU1JQ09MT046IDU5LCBcblx0LyoqIExlc3MtdGhhbiAoPCkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0xFU1NfVEhBTjogNjAsIFxuXHQvKiogRXF1YWxzICg9KSBrZXkuICovXG5cdFZLX0VRVUFMUzogNjEsIFxuXHQvKiogR3JlYXRlci10aGFuICg+KSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfR1JFQVRFUl9USEFOOiA2MiwgXG5cdC8qKiBRdWVzdGlvbiBtYXJrICg/KSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfUVVFU1RJT05fTUFSSzogNjMsIFxuXHQvKiogQXRtYXJrIChAKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQVQ6IDY0LCBcblx0LyoqKi9cblx0VktfQTogNjUsXG5cdC8qKiovXG5cdFZLX0I6IDY2LFxuXHQvKioqL1xuXHRWS19DOiA2Nyxcblx0LyoqKi9cblx0VktfRDogNjgsXG5cdC8qKiovXG5cdFZLX0U6IDY5LFxuXHQvKioqL1xuXHRWS19GOiA3MCxcblx0LyoqKi9cblx0VktfRzogNzEsXG5cdC8qKiovXG5cdFZLX0g6IDcyLFxuXHQvKioqL1xuXHRWS19JOiA3Myxcblx0LyoqKi9cblx0VktfSjogNzQsXG5cdC8qKiovXG5cdFZLX0s6IDc1LFxuXHQvKioqL1xuXHRWS19MOiA3Nixcblx0LyoqKi9cblx0VktfTTogNzcsXG5cdC8qKiovXG5cdFZLX046IDc4LFxuXHQvKioqL1xuXHRWS19POiA3OSxcblx0LyoqKi9cblx0VktfUDogODAsXG5cdC8qKiovXG5cdFZLX1E6IDgxLFxuXHQvKioqL1xuXHRWS19SOiA4Mixcblx0LyoqKi9cblx0VktfUzogODMsXG5cdC8qKiovXG5cdFZLX1Q6IDg0LFxuXHQvKioqL1xuXHRWS19VOiA4NSxcblx0LyoqKi9cblx0VktfVjogODYsXG5cdC8qKiovXG5cdFZLX1c6IDg3LFxuXHQvKioqL1xuXHRWS19YOiA4OCxcblx0LyoqKi9cblx0VktfWTogODksXG5cdC8qKiovXG5cdFZLX1o6IDkwLFxuXHQvKioqL1xuXHRWS19DT05URVhUX01FTlU6IDkzLFxuXHQvKiogMCBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDA6IDk2LCBcblx0LyoqIDEgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQxOiA5NywgXG5cdC8qKiAyIG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTlVNUEFEMjogOTgsIFxuXHQvKiogMyBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDM6IDk5LCBcblx0LyoqIDQgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQ0OiAxMDAsIFxuXHQvKiogNSBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDU6IDEwMSwgXG5cdC8qKiA2IG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTlVNUEFENjogMTAyLCBcblx0LyoqIDcgb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19OVU1QQUQ3OiAxMDMsIFxuXHQvKiogOCBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX05VTVBBRDg6IDEwNCwgXG5cdC8qKiA5IG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfTlVNUEFEOTogMTA1LCBcblx0LyoqICogb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19NVUxUSVBMWTogMTA2LFxuXHQvKiogKyBvbiB0aGUgbnVtZXJpYyBrZXlwYWQuICovXG5cdFZLX0FERDogMTA3LCBcblx0LyoqKi9cblx0VktfU0VQQVJBVE9SOiAxMDgsXG5cdC8qKiAtIG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfU1VCVFJBQ1Q6IDEwOSwgXG5cdC8qKiBEZWNpbWFsIHBvaW50IG9uIHRoZSBudW1lcmljIGtleXBhZC4gKi9cblx0VktfREVDSU1BTDogMTEwLCBcblx0LyoqIC8gb24gdGhlIG51bWVyaWMga2V5cGFkLiAqL1xuXHRWS19ESVZJREU6IDExMSwgXG5cdC8qKiBGMSBrZXkuICovXG5cdFZLX0YxOiAxMTIsIFxuXHQvKiogRjIga2V5LiAqL1xuXHRWS19GMjogMTEzLCBcblx0LyoqIEYzIGtleS4gKi9cblx0VktfRjM6IDExNCwgXG5cdC8qKiBGNCBrZXkuICovXG5cdFZLX0Y0OiAxMTUsIFxuXHQvKiogRjUga2V5LiAqL1xuXHRWS19GNTogMTE2LCBcblx0LyoqIEY2IGtleS4gKi9cblx0VktfRjY6IDExNywgXG5cdC8qKiBGNyBrZXkuICovXG5cdFZLX0Y3OiAxMTgsIFxuXHQvKiogRjgga2V5LiAqL1xuXHRWS19GODogMTE5LCBcblx0LyoqIEY5IGtleS4gKi9cblx0VktfRjk6IDEyMCwgXG5cdC8qKiBGMTAga2V5LiAqL1xuXHRWS19GMTA6IDEyMSwgXG5cdC8qKiBGMTEga2V5LiAqL1xuXHRWS19GMTE6IDEyMiwgXG5cdC8qKiBGMTIga2V5LiAqL1xuXHRWS19GMTI6IDEyMywgXG5cdC8qKiBGMTMga2V5LiAqL1xuXHRWS19GMTM6IDEyNCwgXG5cdC8qKiBGMTQga2V5LiAqL1xuXHRWS19GMTQ6IDEyNSwgXG5cdC8qKiBGMTUga2V5LiAqL1xuXHRWS19GMTU6IDEyNiwgXG5cdC8qKiBGMTYga2V5LiAqL1xuXHRWS19GMTY6IDEyNywgXG5cdC8qKiBGMTcga2V5LiAqL1xuXHRWS19GMTc6IDEyOCwgXG5cdC8qKiBGMTgga2V5LiAqL1xuXHRWS19GMTg6IDEyOSwgXG5cdC8qKiBGMTkga2V5LiAqL1xuXHRWS19GMTk6IDEzMCwgXG5cdC8qKiBGMjAga2V5LiAqL1xuXHRWS19GMjA6IDEzMSwgXG5cdC8qKiBGMjEga2V5LiAqL1xuXHRWS19GMjE6IDEzMiwgXG5cdC8qKiBGMjIga2V5LiAqL1xuXHRWS19GMjI6IDEzMywgXG5cdC8qKiBGMjMga2V5LiAqL1xuXHRWS19GMjM6IDEzNCwgXG5cdC8qKiBGMjQga2V5LiAqL1xuXHRWS19GMjQ6IDEzNSwgXG5cdC8qKiBOdW0gTG9jayBrZXkuICovXG5cdFZLX05VTV9MT0NLOiAxNDQsIFxuXHQvKiogU2Nyb2xsIExvY2sga2V5LiAqL1xuXHRWS19TQ1JPTExfTE9DSzogMTQ1LCBcblx0LyoqIENpcmN1bWZsZXggKF4pIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19DSVJDVU1GTEVYOiAxNjAsIFxuXHQvKiogRXhjbGFtYXRpb24gKCEpIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19FWENMQU1BVElPTjogMTYxLCBcblx0LyoqIERvdWJsZSBxdW90ZSAoKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfRE9VQkxFX1FVT1RFOiAxNjIsIFxuXHQvKiogSGFzaCAoIykga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0hBU0g6IDE2MywgXG5cdC8qKiBEb2xsYXIgc2lnbiAoJCkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0RPTExBUjogMTY0LCBcblx0LyoqIFBlcmNlbnQgKCUpIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19QRVJDRU5UOiAxNjUsIFxuXHQvKiogQW1wZXJzYW5kICgmKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQU1QRVJTQU5EOiAxNjYsIFxuXHQvKiogVW5kZXJzY29yZSAoXykga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX1VOREVSU0NPUkU6IDE2NywgXG5cdC8qKiBPcGVuIHBhcmVudGhlc2lzICgoKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfT1BFTl9QQVJFTjogMTY4LCBcblx0LyoqIENsb3NlIHBhcmVudGhlc2lzICgpKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQ0xPU0VfUEFSRU46IDE2OSwgXG5cdC8qIEFzdGVyaXNrICgqKSBrZXkuIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQVNURVJJU0s6IDE3MCxcblx0LyoqIFBsdXMgKCspIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19QTFVTOiAxNzEsIFxuXHQvKiogUGlwZSAofCkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX1BJUEU6IDE3MiwgXG5cdC8qKiBIeXBoZW4tVVMvZG9jcy9NaW51cyAoLSkga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX0hZUEhFTl9NSU5VUzogMTczLCBcblx0LyoqIE9wZW4gY3VybHkgYnJhY2tldCAoeykga2V5LiBSZXF1aXJlcyBHZWNrbyAxNS4wICovXG5cdFZLX09QRU5fQ1VSTFlfQlJBQ0tFVDogMTc0LCBcblx0LyoqIENsb3NlIGN1cmx5IGJyYWNrZXQgKH0pIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19DTE9TRV9DVVJMWV9CUkFDS0VUOiAxNzUsIFxuXHQvKiogVGlsZGUgKH4pIGtleS4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19USUxERTogMTc2LCBcblx0LyoqIENvbW1hICgsKSBrZXkuICovXG5cdFZLX0NPTU1BOiAxODgsIFxuXHQvKiogUGVyaW9kICguKSBrZXkuICovXG5cdFZLX1BFUklPRDogMTkwLCBcblx0LyoqIFNsYXNoICgvKSBrZXkuICovXG5cdFZLX1NMQVNIOiAxOTEsIFxuXHQvKiogQmFjayB0aWNrIChgKSBrZXkuICovXG5cdFZLX0JBQ0tfUVVPVEU6IDE5MiwgXG5cdC8qKiBPcGVuIHNxdWFyZSBicmFja2V0IChbKSBrZXkuICovXG5cdFZLX09QRU5fQlJBQ0tFVDogMjE5LCBcblx0LyoqIEJhY2sgc2xhc2ggKFxcKSBrZXkuICovXG5cdFZLX0JBQ0tfU0xBU0g6IDIyMCwgXG5cdC8qKiBDbG9zZSBzcXVhcmUgYnJhY2tldCAoXSkga2V5LiAqL1xuXHRWS19DTE9TRV9CUkFDS0VUOiAyMjEsIFxuXHQvKiogUXVvdGUgKCcnJykga2V5LiAqL1xuXHRWS19RVU9URTogMjIyLCBcblx0LyoqIE1ldGEga2V5IG9uIExpbnV4LCBDb21tYW5kIGtleSBvbiBNYWMuICovXG5cdFZLX01FVEE6IDIyNCwgXG5cdC8qKiBBbHRHciBrZXkgb24gTGludXguIFJlcXVpcmVzIEdlY2tvIDE1LjAgKi9cblx0VktfQUxUR1I6IDIyNSwgXG5cdC8qKiBXaW5kb3dzIGxvZ28ga2V5IG9uIFdpbmRvd3MuIE9yIFN1cGVyIG9yIEh5cGVyIGtleSBvbiBMaW51eC4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19XSU46IDkxLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19LQU5BOiAyMSwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfSEFOR1VMOiAyMSwgXG5cdC8qKiDoi7HmlbAga2V5IG9uIEphcGFuZXNlIE1hYyBrZXlib2FyZC4gUmVxdWlyZXMgR2Vja28gMTUuMCAqL1xuXHRWS19FSVNVOiAyMiwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfSlVOSkE6IDIzLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19GSU5BTDogMjQsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX0hBTkpBOiAyNSwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfS0FOSkk6IDI1LCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19DT05WRVJUOiAyOCwgXG5cdC8qKiBMaW51eCBzdXBwb3J0IGZvciB0aGlzIGtleWNvZGUgd2FzIGFkZGVkIGluIEdlY2tvIDQuMC4gKi9cblx0VktfTk9OQ09OVkVSVDogMjksIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX0FDQ0VQVDogMzAsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX01PREVDSEFOR0U6IDMxLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19TRUxFQ1Q6IDQxLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLiAqL1xuXHRWS19QUklOVDogNDIsIFxuXHQvKiogTGludXggc3VwcG9ydCBmb3IgdGhpcyBrZXljb2RlIHdhcyBhZGRlZCBpbiBHZWNrbyA0LjAuICovXG5cdFZLX0VYRUNVVEU6IDQzLCBcblx0LyoqIExpbnV4IHN1cHBvcnQgZm9yIHRoaXMga2V5Y29kZSB3YXMgYWRkZWQgaW4gR2Vja28gNC4wLlx0ICovXG5cdFZLX1NMRUVQOiA5NSBcbn07XG4vKipcbiAqIEBuYW1lc3BhY2VcbiAqIENvbnRhaW5zIHRleHQgdG9rZW5pemF0aW9uIGFuZCBicmVha2luZyByb3V0aW5lc1xuICovXG5ST1QuVGV4dCA9IHtcblx0UkVfQ09MT1JTOiAvJShbYmNdKXsoW159XSopfS9nLFxuXG5cdC8qIHRva2VuIHR5cGVzICovXG5cdFRZUEVfVEVYVDpcdFx0MCxcblx0VFlQRV9ORVdMSU5FOlx0MSxcblx0VFlQRV9GRzpcdFx0Mixcblx0VFlQRV9CRzpcdFx0MyxcblxuXHQvKipcblx0ICogTWVhc3VyZSBzaXplIG9mIGEgcmVzdWx0aW5nIHRleHQgYmxvY2tcblx0ICovXG5cdG1lYXN1cmU6IGZ1bmN0aW9uKHN0ciwgbWF4V2lkdGgpIHtcblx0XHR2YXIgcmVzdWx0ID0ge3dpZHRoOjAsIGhlaWdodDoxfTtcblx0XHR2YXIgdG9rZW5zID0gdGhpcy50b2tlbml6ZShzdHIsIG1heFdpZHRoKTtcblx0XHR2YXIgbGluZVdpZHRoID0gMDtcblxuXHRcdGZvciAodmFyIGk9MDtpPHRva2Vucy5sZW5ndGg7aSsrKSB7XG5cdFx0XHR2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdFx0XHRzd2l0Y2ggKHRva2VuLnR5cGUpIHtcblx0XHRcdFx0Y2FzZSB0aGlzLlRZUEVfVEVYVDpcblx0XHRcdFx0XHRsaW5lV2lkdGggKz0gdG9rZW4udmFsdWUubGVuZ3RoO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlIHRoaXMuVFlQRV9ORVdMSU5FOlxuXHRcdFx0XHRcdHJlc3VsdC5oZWlnaHQrKztcblx0XHRcdFx0XHRyZXN1bHQud2lkdGggPSBNYXRoLm1heChyZXN1bHQud2lkdGgsIGxpbmVXaWR0aCk7XG5cdFx0XHRcdFx0bGluZVdpZHRoID0gMDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJlc3VsdC53aWR0aCA9IE1hdGgubWF4KHJlc3VsdC53aWR0aCwgbGluZVdpZHRoKTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENvbnZlcnQgc3RyaW5nIHRvIGEgc2VyaWVzIG9mIGEgZm9ybWF0dGluZyBjb21tYW5kc1xuXHQgKi9cblx0dG9rZW5pemU6IGZ1bmN0aW9uKHN0ciwgbWF4V2lkdGgpIHtcblx0XHR2YXIgcmVzdWx0ID0gW107XG5cblx0XHQvKiBmaXJzdCB0b2tlbml6YXRpb24gcGFzcyAtIHNwbGl0IHRleHRzIGFuZCBjb2xvciBmb3JtYXR0aW5nIGNvbW1hbmRzICovXG5cdFx0dmFyIG9mZnNldCA9IDA7XG5cdFx0c3RyLnJlcGxhY2UodGhpcy5SRV9DT0xPUlMsIGZ1bmN0aW9uKG1hdGNoLCB0eXBlLCBuYW1lLCBpbmRleCkge1xuXHRcdFx0Lyogc3RyaW5nIGJlZm9yZSAqL1xuXHRcdFx0dmFyIHBhcnQgPSBzdHIuc3Vic3RyaW5nKG9mZnNldCwgaW5kZXgpO1xuXHRcdFx0aWYgKHBhcnQubGVuZ3RoKSB7XG5cdFx0XHRcdHJlc3VsdC5wdXNoKHtcblx0XHRcdFx0XHR0eXBlOiBST1QuVGV4dC5UWVBFX1RFWFQsXG5cdFx0XHRcdFx0dmFsdWU6IHBhcnRcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8qIGNvbG9yIGNvbW1hbmQgKi9cblx0XHRcdHJlc3VsdC5wdXNoKHtcblx0XHRcdFx0dHlwZTogKHR5cGUgPT0gXCJjXCIgPyBST1QuVGV4dC5UWVBFX0ZHIDogUk9ULlRleHQuVFlQRV9CRyksXG5cdFx0XHRcdHZhbHVlOiBuYW1lLnRyaW0oKVxuXHRcdFx0fSk7XG5cblx0XHRcdG9mZnNldCA9IGluZGV4ICsgbWF0Y2gubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0fSk7XG5cblx0XHQvKiBsYXN0IHJlbWFpbmluZyBwYXJ0ICovXG5cdFx0dmFyIHBhcnQgPSBzdHIuc3Vic3RyaW5nKG9mZnNldCk7XG5cdFx0aWYgKHBhcnQubGVuZ3RoKSB7XG5cdFx0XHRyZXN1bHQucHVzaCh7XG5cdFx0XHRcdHR5cGU6IFJPVC5UZXh0LlRZUEVfVEVYVCxcblx0XHRcdFx0dmFsdWU6IHBhcnRcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9icmVha0xpbmVzKHJlc3VsdCwgbWF4V2lkdGgpO1xuXHR9LFxuXG5cdC8qIGluc2VydCBsaW5lIGJyZWFrcyBpbnRvIGZpcnN0LXBhc3MgdG9rZW5pemVkIGRhdGEgKi9cblx0X2JyZWFrTGluZXM6IGZ1bmN0aW9uKHRva2VucywgbWF4V2lkdGgpIHtcblx0XHRpZiAoIW1heFdpZHRoKSB7IG1heFdpZHRoID0gSW5maW5pdHk7IH07XG5cblx0XHR2YXIgaSA9IDA7XG5cdFx0dmFyIGxpbmVMZW5ndGggPSAwO1xuXHRcdHZhciBsYXN0VG9rZW5XaXRoU3BhY2UgPSAtMTtcblxuXHRcdHdoaWxlIChpIDwgdG9rZW5zLmxlbmd0aCkgeyAvKiB0YWtlIGFsbCB0ZXh0IHRva2VucywgcmVtb3ZlIHNwYWNlLCBhcHBseSBsaW5lYnJlYWtzICovXG5cdFx0XHR2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdFx0XHRpZiAodG9rZW4udHlwZSA9PSBST1QuVGV4dC5UWVBFX05FV0xJTkUpIHsgLyogcmVzZXQgKi9cblx0XHRcdFx0bGluZUxlbmd0aCA9IDA7IFxuXHRcdFx0XHRsYXN0VG9rZW5XaXRoU3BhY2UgPSAtMTtcblx0XHRcdH1cblx0XHRcdGlmICh0b2tlbi50eXBlICE9IFJPVC5UZXh0LlRZUEVfVEVYVCkgeyAvKiBza2lwIG5vbi10ZXh0IHRva2VucyAqL1xuXHRcdFx0XHRpKys7XG5cdFx0XHRcdGNvbnRpbnVlOyBcblx0XHRcdH1cblxuXHRcdFx0LyogcmVtb3ZlIHNwYWNlcyBhdCB0aGUgYmVnaW5uaW5nIG9mIGxpbmUgKi9cblx0XHRcdHdoaWxlIChsaW5lTGVuZ3RoID09IDAgJiYgdG9rZW4udmFsdWUuY2hhckF0KDApID09IFwiIFwiKSB7IHRva2VuLnZhbHVlID0gdG9rZW4udmFsdWUuc3Vic3RyaW5nKDEpOyB9XG5cblx0XHRcdC8qIGZvcmNlZCBuZXdsaW5lPyBpbnNlcnQgdHdvIG5ldyB0b2tlbnMgYWZ0ZXIgdGhpcyBvbmUgKi9cblx0XHRcdHZhciBpbmRleCA9IHRva2VuLnZhbHVlLmluZGV4T2YoXCJcXG5cIik7XG5cdFx0XHRpZiAoaW5kZXggIT0gLTEpIHsgXG5cdFx0XHRcdHRva2VuLnZhbHVlID0gdGhpcy5fYnJlYWtJbnNpZGVUb2tlbih0b2tlbnMsIGksIGluZGV4LCB0cnVlKTsgXG5cblx0XHRcdFx0LyogaWYgdGhlcmUgYXJlIHNwYWNlcyBhdCB0aGUgZW5kLCB3ZSBtdXN0IHJlbW92ZSB0aGVtICh3ZSBkbyBub3Qgd2FudCB0aGUgbGluZSB0b28gbG9uZykgKi9cblx0XHRcdFx0dmFyIGFyciA9IHRva2VuLnZhbHVlLnNwbGl0KFwiXCIpO1xuXHRcdFx0XHR3aGlsZSAoYXJyLmxlbmd0aCAmJiBhcnJbYXJyLmxlbmd0aC0xXSA9PSBcIiBcIikgeyBhcnIucG9wKCk7IH1cblx0XHRcdFx0dG9rZW4udmFsdWUgPSBhcnIuam9pbihcIlwiKTtcblx0XHRcdH1cblxuXHRcdFx0LyogdG9rZW4gZGVnZW5lcmF0ZWQ/ICovXG5cdFx0XHRpZiAoIXRva2VuLnZhbHVlLmxlbmd0aCkge1xuXHRcdFx0XHR0b2tlbnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGxpbmVMZW5ndGggKyB0b2tlbi52YWx1ZS5sZW5ndGggPiBtYXhXaWR0aCkgeyAvKiBsaW5lIHRvbyBsb25nLCBmaW5kIGEgc3VpdGFibGUgYnJlYWtpbmcgc3BvdCAqL1xuXG5cdFx0XHRcdC8qIGlzIGl0IHBvc3NpYmxlIHRvIGJyZWFrIHdpdGhpbiB0aGlzIHRva2VuPyAqL1xuXHRcdFx0XHR2YXIgaW5kZXggPSAtMTtcblx0XHRcdFx0d2hpbGUgKDEpIHtcblx0XHRcdFx0XHR2YXIgbmV4dEluZGV4ID0gdG9rZW4udmFsdWUuaW5kZXhPZihcIiBcIiwgaW5kZXgrMSk7XG5cdFx0XHRcdFx0aWYgKG5leHRJbmRleCA9PSAtMSkgeyBicmVhazsgfVxuXHRcdFx0XHRcdGlmIChsaW5lTGVuZ3RoICsgbmV4dEluZGV4ID4gbWF4V2lkdGgpIHsgYnJlYWs7IH1cblx0XHRcdFx0XHRpbmRleCA9IG5leHRJbmRleDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChpbmRleCAhPSAtMSkgeyAvKiBicmVhayBhdCBzcGFjZSB3aXRoaW4gdGhpcyBvbmUgKi9cblx0XHRcdFx0XHR0b2tlbi52YWx1ZSA9IHRoaXMuX2JyZWFrSW5zaWRlVG9rZW4odG9rZW5zLCBpLCBpbmRleCwgdHJ1ZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAobGFzdFRva2VuV2l0aFNwYWNlICE9IC0xKSB7IC8qIGlzIHRoZXJlIGEgcHJldmlvdXMgdG9rZW4gd2hlcmUgYSBicmVhayBjYW4gb2NjdXI/ICovXG5cdFx0XHRcdFx0dmFyIHRva2VuID0gdG9rZW5zW2xhc3RUb2tlbldpdGhTcGFjZV07XG5cdFx0XHRcdFx0dmFyIGJyZWFrSW5kZXggPSB0b2tlbi52YWx1ZS5sYXN0SW5kZXhPZihcIiBcIik7XG5cdFx0XHRcdFx0dG9rZW4udmFsdWUgPSB0aGlzLl9icmVha0luc2lkZVRva2VuKHRva2VucywgbGFzdFRva2VuV2l0aFNwYWNlLCBicmVha0luZGV4LCB0cnVlKTtcblx0XHRcdFx0XHRpID0gbGFzdFRva2VuV2l0aFNwYWNlO1xuXHRcdFx0XHR9IGVsc2UgeyAvKiBmb3JjZSBicmVhayBpbiB0aGlzIHRva2VuICovXG5cdFx0XHRcdFx0dG9rZW4udmFsdWUgPSB0aGlzLl9icmVha0luc2lkZVRva2VuKHRva2VucywgaSwgbWF4V2lkdGgtbGluZUxlbmd0aCwgZmFsc2UpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7IC8qIGxpbmUgbm90IGxvbmcsIGNvbnRpbnVlICovXG5cdFx0XHRcdGxpbmVMZW5ndGggKz0gdG9rZW4udmFsdWUubGVuZ3RoO1xuXHRcdFx0XHRpZiAodG9rZW4udmFsdWUuaW5kZXhPZihcIiBcIikgIT0gLTEpIHsgbGFzdFRva2VuV2l0aFNwYWNlID0gaTsgfVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpKys7IC8qIGFkdmFuY2UgdG8gbmV4dCB0b2tlbiAqL1xuXHRcdH1cblxuXG5cdFx0dG9rZW5zLnB1c2goe3R5cGU6IFJPVC5UZXh0LlRZUEVfTkVXTElORX0pOyAvKiBpbnNlcnQgZmFrZSBuZXdsaW5lIHRvIGZpeCB0aGUgbGFzdCB0ZXh0IGxpbmUgKi9cblxuXHRcdC8qIHJlbW92ZSB0cmFpbGluZyBzcGFjZSBmcm9tIHRleHQgdG9rZW5zIGJlZm9yZSBuZXdsaW5lcyAqL1xuXHRcdHZhciBsYXN0VGV4dFRva2VuID0gbnVsbDtcblx0XHRmb3IgKHZhciBpPTA7aTx0b2tlbnMubGVuZ3RoO2krKykge1xuXHRcdFx0dmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHRcdFx0c3dpdGNoICh0b2tlbi50eXBlKSB7XG5cdFx0XHRcdGNhc2UgUk9ULlRleHQuVFlQRV9URVhUOiBsYXN0VGV4dFRva2VuID0gdG9rZW47IGJyZWFrO1xuXHRcdFx0XHRjYXNlIFJPVC5UZXh0LlRZUEVfTkVXTElORTogXG5cdFx0XHRcdFx0aWYgKGxhc3RUZXh0VG9rZW4pIHsgLyogcmVtb3ZlIHRyYWlsaW5nIHNwYWNlICovXG5cdFx0XHRcdFx0XHR2YXIgYXJyID0gbGFzdFRleHRUb2tlbi52YWx1ZS5zcGxpdChcIlwiKTtcblx0XHRcdFx0XHRcdHdoaWxlIChhcnIubGVuZ3RoICYmIGFyclthcnIubGVuZ3RoLTFdID09IFwiIFwiKSB7IGFyci5wb3AoKTsgfVxuXHRcdFx0XHRcdFx0bGFzdFRleHRUb2tlbi52YWx1ZSA9IGFyci5qb2luKFwiXCIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRsYXN0VGV4dFRva2VuID0gbnVsbDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dG9rZW5zLnBvcCgpOyAvKiByZW1vdmUgZmFrZSB0b2tlbiAqL1xuXG5cdFx0cmV0dXJuIHRva2Vucztcblx0fSxcblxuXHQvKipcblx0ICogQ3JlYXRlIG5ldyB0b2tlbnMgYW5kIGluc2VydCB0aGVtIGludG8gdGhlIHN0cmVhbVxuXHQgKiBAcGFyYW0ge29iamVjdFtdfSB0b2tlbnNcblx0ICogQHBhcmFtIHtpbnR9IHRva2VuSW5kZXggVG9rZW4gYmVpbmcgcHJvY2Vzc2VkXG5cdCAqIEBwYXJhbSB7aW50fSBicmVha0luZGV4IEluZGV4IHdpdGhpbiBjdXJyZW50IHRva2VuJ3MgdmFsdWVcblx0ICogQHBhcmFtIHtib29sfSByZW1vdmVCcmVha0NoYXIgRG8gd2Ugd2FudCB0byByZW1vdmUgdGhlIGJyZWFraW5nIGNoYXJhY3Rlcj9cblx0ICogQHJldHVybnMge3N0cmluZ30gcmVtYWluaW5nIHVuYnJva2VuIHRva2VuIHZhbHVlXG5cdCAqL1xuXHRfYnJlYWtJbnNpZGVUb2tlbjogZnVuY3Rpb24odG9rZW5zLCB0b2tlbkluZGV4LCBicmVha0luZGV4LCByZW1vdmVCcmVha0NoYXIpIHtcblx0XHR2YXIgbmV3QnJlYWtUb2tlbiA9IHtcblx0XHRcdHR5cGU6IFJPVC5UZXh0LlRZUEVfTkVXTElORVxuXHRcdH1cblx0XHR2YXIgbmV3VGV4dFRva2VuID0ge1xuXHRcdFx0dHlwZTogUk9ULlRleHQuVFlQRV9URVhULFxuXHRcdFx0dmFsdWU6IHRva2Vuc1t0b2tlbkluZGV4XS52YWx1ZS5zdWJzdHJpbmcoYnJlYWtJbmRleCArIChyZW1vdmVCcmVha0NoYXIgPyAxIDogMCkpXG5cdFx0fVxuXHRcdHRva2Vucy5zcGxpY2UodG9rZW5JbmRleCsxLCAwLCBuZXdCcmVha1Rva2VuLCBuZXdUZXh0VG9rZW4pO1xuXHRcdHJldHVybiB0b2tlbnNbdG9rZW5JbmRleF0udmFsdWUuc3Vic3RyaW5nKDAsIGJyZWFrSW5kZXgpO1xuXHR9XG59XG4vKipcbiAqIEByZXR1cm5zIHthbnl9IFJhbmRvbWx5IHBpY2tlZCBpdGVtLCBudWxsIHdoZW4gbGVuZ3RoPTBcbiAqL1xuQXJyYXkucHJvdG90eXBlLnJhbmRvbSA9IEFycmF5LnByb3RvdHlwZS5yYW5kb20gfHwgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIG51bGw7IH1cblx0cmV0dXJuIHRoaXNbTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSAqIHRoaXMubGVuZ3RoKV07XG59XG5cbi8qKlxuICogQHJldHVybnMge2FycmF5fSBOZXcgYXJyYXkgd2l0aCByYW5kb21pemVkIGl0ZW1zXG4gKiBGSVhNRSBkZXN0cm95cyB0aGlzIVxuICovXG5BcnJheS5wcm90b3R5cGUucmFuZG9taXplID0gQXJyYXkucHJvdG90eXBlLnJhbmRvbWl6ZSB8fCBmdW5jdGlvbigpIHtcblx0dmFyIHJlc3VsdCA9IFtdO1xuXHR3aGlsZSAodGhpcy5sZW5ndGgpIHtcblx0XHR2YXIgaW5kZXggPSB0aGlzLmluZGV4T2YodGhpcy5yYW5kb20oKSk7XG5cdFx0cmVzdWx0LnB1c2godGhpcy5zcGxpY2UoaW5kZXgsIDEpWzBdKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufVxuLyoqXG4gKiBBbHdheXMgcG9zaXRpdmUgbW9kdWx1c1xuICogQHBhcmFtIHtpbnR9IG4gTW9kdWx1c1xuICogQHJldHVybnMge2ludH0gdGhpcyBtb2R1bG8gblxuICovXG5OdW1iZXIucHJvdG90eXBlLm1vZCA9IE51bWJlci5wcm90b3R5cGUubW9kIHx8IGZ1bmN0aW9uKG4pIHtcblx0cmV0dXJuICgodGhpcyVuKStuKSVuO1xufVxuLyoqXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBGaXJzdCBsZXR0ZXIgY2FwaXRhbGl6ZWRcbiAqL1xuU3RyaW5nLnByb3RvdHlwZS5jYXBpdGFsaXplID0gU3RyaW5nLnByb3RvdHlwZS5jYXBpdGFsaXplIHx8IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRoaXMuc3Vic3RyaW5nKDEpO1xufVxuXG4vKiogXG4gKiBMZWZ0IHBhZFxuICogQHBhcmFtIHtzdHJpbmd9IFtjaGFyYWN0ZXI9XCIwXCJdXG4gKiBAcGFyYW0ge2ludH0gW2NvdW50PTJdXG4gKi9cblN0cmluZy5wcm90b3R5cGUubHBhZCA9IFN0cmluZy5wcm90b3R5cGUubHBhZCB8fCBmdW5jdGlvbihjaGFyYWN0ZXIsIGNvdW50KSB7XG5cdHZhciBjaCA9IGNoYXJhY3RlciB8fCBcIjBcIjtcblx0dmFyIGNudCA9IGNvdW50IHx8IDI7XG5cblx0dmFyIHMgPSBcIlwiO1xuXHR3aGlsZSAocy5sZW5ndGggPCAoY250IC0gdGhpcy5sZW5ndGgpKSB7IHMgKz0gY2g7IH1cblx0cyA9IHMuc3Vic3RyaW5nKDAsIGNudC10aGlzLmxlbmd0aCk7XG5cdHJldHVybiBzK3RoaXM7XG59XG5cbi8qKiBcbiAqIFJpZ2h0IHBhZFxuICogQHBhcmFtIHtzdHJpbmd9IFtjaGFyYWN0ZXI9XCIwXCJdXG4gKiBAcGFyYW0ge2ludH0gW2NvdW50PTJdXG4gKi9cblN0cmluZy5wcm90b3R5cGUucnBhZCA9IFN0cmluZy5wcm90b3R5cGUucnBhZCB8fCBmdW5jdGlvbihjaGFyYWN0ZXIsIGNvdW50KSB7XG5cdHZhciBjaCA9IGNoYXJhY3RlciB8fCBcIjBcIjtcblx0dmFyIGNudCA9IGNvdW50IHx8IDI7XG5cblx0dmFyIHMgPSBcIlwiO1xuXHR3aGlsZSAocy5sZW5ndGggPCAoY250IC0gdGhpcy5sZW5ndGgpKSB7IHMgKz0gY2g7IH1cblx0cyA9IHMuc3Vic3RyaW5nKDAsIGNudC10aGlzLmxlbmd0aCk7XG5cdHJldHVybiB0aGlzK3M7XG59XG5cbi8qKlxuICogRm9ybWF0IGEgc3RyaW5nIGluIGEgZmxleGlibGUgd2F5LiBTY2FucyBmb3IgJXMgc3RyaW5ncyBhbmQgcmVwbGFjZXMgdGhlbSB3aXRoIGFyZ3VtZW50cy4gTGlzdCBvZiBwYXR0ZXJucyBpcyBtb2RpZmlhYmxlIHZpYSBTdHJpbmcuZm9ybWF0Lm1hcC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVxuICogQHBhcmFtIHthbnl9IFthcmd2XVxuICovXG5TdHJpbmcuZm9ybWF0ID0gU3RyaW5nLmZvcm1hdCB8fCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuXHR2YXIgbWFwID0gU3RyaW5nLmZvcm1hdC5tYXA7XG5cdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuXHR2YXIgcmVwbGFjZXIgPSBmdW5jdGlvbihtYXRjaCwgZ3JvdXAxLCBncm91cDIsIGluZGV4KSB7XG5cdFx0aWYgKHRlbXBsYXRlLmNoYXJBdChpbmRleC0xKSA9PSBcIiVcIikgeyByZXR1cm4gbWF0Y2guc3Vic3RyaW5nKDEpOyB9XG5cdFx0aWYgKCFhcmdzLmxlbmd0aCkgeyByZXR1cm4gbWF0Y2g7IH1cblx0XHR2YXIgb2JqID0gYXJnc1swXTtcblxuXHRcdHZhciBncm91cCA9IGdyb3VwMSB8fCBncm91cDI7XG5cdFx0dmFyIHBhcnRzID0gZ3JvdXAuc3BsaXQoXCIsXCIpO1xuXHRcdHZhciBuYW1lID0gcGFydHMuc2hpZnQoKTtcblx0XHR2YXIgbWV0aG9kID0gbWFwW25hbWUudG9Mb3dlckNhc2UoKV07XG5cdFx0aWYgKCFtZXRob2QpIHsgcmV0dXJuIG1hdGNoOyB9XG5cblx0XHR2YXIgb2JqID0gYXJncy5zaGlmdCgpO1xuXHRcdHZhciByZXBsYWNlZCA9IG9ialttZXRob2RdLmFwcGx5KG9iaiwgcGFydHMpO1xuXG5cdFx0dmFyIGZpcnN0ID0gbmFtZS5jaGFyQXQoMCk7XG5cdFx0aWYgKGZpcnN0ICE9IGZpcnN0LnRvTG93ZXJDYXNlKCkpIHsgcmVwbGFjZWQgPSByZXBsYWNlZC5jYXBpdGFsaXplKCk7IH1cblxuXHRcdHJldHVybiByZXBsYWNlZDtcblx0fVxuXHRyZXR1cm4gdGVtcGxhdGUucmVwbGFjZSgvJSg/OihbYS16XSspfCg/OnsoW159XSspfSkpL2dpLCByZXBsYWNlcik7XG59XG5cblN0cmluZy5mb3JtYXQubWFwID0gU3RyaW5nLmZvcm1hdC5tYXAgfHwge1xuXHRcInNcIjogXCJ0b1N0cmluZ1wiXG59XG5cbi8qKlxuICogQ29udmVuaWVuY2Ugc2hvcnRjdXQgdG8gU3RyaW5nLmZvcm1hdCh0aGlzKVxuICovXG5TdHJpbmcucHJvdG90eXBlLmZvcm1hdCA9IFN0cmluZy5wcm90b3R5cGUuZm9ybWF0IHx8IGZ1bmN0aW9uKCkge1xuXHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cdGFyZ3MudW5zaGlmdCh0aGlzKTtcblx0cmV0dXJuIFN0cmluZy5mb3JtYXQuYXBwbHkoU3RyaW5nLCBhcmdzKTtcbn1cblxuaWYgKCFPYmplY3QuY3JlYXRlKSB7ICBcblx0LyoqXG5cdCAqIEVTNSBPYmplY3QuY3JlYXRlXG5cdCAqL1xuXHRPYmplY3QuY3JlYXRlID0gZnVuY3Rpb24obykgeyAgXG5cdFx0dmFyIHRtcCA9IGZ1bmN0aW9uKCkge307XG5cdFx0dG1wLnByb3RvdHlwZSA9IG87XG5cdFx0cmV0dXJuIG5ldyB0bXAoKTtcblx0fTsgIFxufSAgXG4vKipcbiAqIFNldHMgcHJvdG90eXBlIG9mIHRoaXMgZnVuY3Rpb24gdG8gYW4gaW5zdGFuY2Ugb2YgcGFyZW50IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBwYXJlbnRcbiAqL1xuRnVuY3Rpb24ucHJvdG90eXBlLmV4dGVuZCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5leHRlbmQgfHwgZnVuY3Rpb24ocGFyZW50KSB7XG5cdHRoaXMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQucHJvdG90eXBlKTtcblx0dGhpcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSB0aGlzO1xuXHRyZXR1cm4gdGhpcztcbn1cbmlmICh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIpIHtcblx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9XG5cdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxuXHRcdHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcblx0XHR8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVcblx0XHR8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcblx0XHR8fCBmdW5jdGlvbihjYikgeyByZXR1cm4gc2V0VGltZW91dChjYiwgMTAwMC82MCk7IH07XG5cblx0d2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID1cblx0XHR3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWVcblx0XHR8fCB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWVcblx0XHR8fCB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWVcblx0XHR8fCB3aW5kb3cub0NhbmNlbEFuaW1hdGlvbkZyYW1lXG5cdFx0fHwgd2luZG93Lm1zQ2FuY2VsQW5pbWF0aW9uRnJhbWVcblx0XHR8fCBmdW5jdGlvbihpZCkgeyByZXR1cm4gY2xlYXJUaW1lb3V0KGlkKTsgfTtcbn1cbi8qKlxuICogQGNsYXNzIFZpc3VhbCBtYXAgZGlzcGxheVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLndpZHRoPVJPVC5ERUZBVUxUX1dJRFRIXVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLmhlaWdodD1ST1QuREVGQVVMVF9IRUlHSFRdXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMuZm9udFNpemU9MTVdXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZm9udEZhbWlseT1cIm1vbm9zcGFjZVwiXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmZvbnRTdHlsZT1cIlwiXSBib2xkL2l0YWxpYy9ub25lL2JvdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5mZz1cIiNjY2NcIl1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5iZz1cIiMwMDBcIl1cbiAqIEBwYXJhbSB7ZmxvYXR9IFtvcHRpb25zLnNwYWNpbmc9MV1cbiAqIEBwYXJhbSB7ZmxvYXR9IFtvcHRpb25zLmJvcmRlcj0wXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmxheW91dD1cInJlY3RcIl1cbiAqIEBwYXJhbSB7Ym9vbH0gW29wdGlvbnMuZm9yY2VTcXVhcmVSYXRpbz1mYWxzZV1cbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy50aWxlV2lkdGg9MzJdXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMudGlsZUhlaWdodD0zMl1cbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9ucy50aWxlTWFwPXt9XVxuICogQHBhcmFtIHtpbWFnZX0gW29wdGlvbnMudGlsZVNldD1udWxsXVxuICogQHBhcmFtIHtpbWFnZX0gW29wdGlvbnMudGlsZUNvbG9yaXplPWZhbHNlXVxuICovXG5ST1QuRGlzcGxheSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG5cdHRoaXMuX2NvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXHR0aGlzLl9kYXRhID0ge307XG5cdHRoaXMuX2RpcnR5ID0gZmFsc2U7IC8qIGZhbHNlID0gbm90aGluZywgdHJ1ZSA9IGFsbCwgb2JqZWN0ID0gZGlydHkgY2VsbHMgKi9cblx0dGhpcy5fb3B0aW9ucyA9IHt9O1xuXHR0aGlzLl9iYWNrZW5kID0gbnVsbDtcblx0XG5cdHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcblx0XHR3aWR0aDogUk9ULkRFRkFVTFRfV0lEVEgsXG5cdFx0aGVpZ2h0OiBST1QuREVGQVVMVF9IRUlHSFQsXG5cdFx0dHJhbnNwb3NlOiBmYWxzZSxcblx0XHRsYXlvdXQ6IFwicmVjdFwiLFxuXHRcdGZvbnRTaXplOiAxNSxcblx0XHRzcGFjaW5nOiAxLFxuXHRcdGJvcmRlcjogMCxcblx0XHRmb3JjZVNxdWFyZVJhdGlvOiBmYWxzZSxcblx0XHRmb250RmFtaWx5OiBcIm1vbm9zcGFjZVwiLFxuXHRcdGZvbnRTdHlsZTogXCJcIixcblx0XHRmZzogXCIjY2NjXCIsXG5cdFx0Ymc6IFwiIzAwMFwiLFxuXHRcdHRpbGVXaWR0aDogMzIsXG5cdFx0dGlsZUhlaWdodDogMzIsXG5cdFx0dGlsZU1hcDoge30sXG5cdFx0dGlsZVNldDogbnVsbCxcblx0XHR0aWxlQ29sb3JpemU6IGZhbHNlLFxuXHRcdHRlcm1Db2xvcjogXCJ4dGVybVwiXG5cdH07XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyBkZWZhdWx0T3B0aW9uc1twXSA9IG9wdGlvbnNbcF07IH1cblx0dGhpcy5zZXRPcHRpb25zKGRlZmF1bHRPcHRpb25zKTtcblx0dGhpcy5ERUJVRyA9IHRoaXMuREVCVUcuYmluZCh0aGlzKTtcblxuXHR0aGlzLl90aWNrID0gdGhpcy5fdGljay5iaW5kKHRoaXMpO1xuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fdGljayk7XG59XG5cbi8qKlxuICogRGVidWcgaGVscGVyLCBpZGVhbCBhcyBhIG1hcCBnZW5lcmF0b3IgY2FsbGJhY2suIEFsd2F5cyBib3VuZCB0byB0aGlzLlxuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcGFyYW0ge2ludH0gd2hhdFxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuREVCVUcgPSBmdW5jdGlvbih4LCB5LCB3aGF0KSB7XG5cdHZhciBjb2xvcnMgPSBbdGhpcy5fb3B0aW9ucy5iZywgdGhpcy5fb3B0aW9ucy5mZ107XG5cdHRoaXMuZHJhdyh4LCB5LCBudWxsLCBudWxsLCBjb2xvcnNbd2hhdCAlIGNvbG9ycy5sZW5ndGhdKTtcbn1cblxuLyoqXG4gKiBDbGVhciB0aGUgd2hvbGUgZGlzcGxheSAoY292ZXIgaXQgd2l0aCBiYWNrZ3JvdW5kIGNvbG9yKVxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fZGF0YSA9IHt9O1xuXHR0aGlzLl9kaXJ0eSA9IHRydWU7XG59XG5cbi8qKlxuICogQHNlZSBST1QuRGlzcGxheVxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cdGlmIChvcHRpb25zLndpZHRoIHx8IG9wdGlvbnMuaGVpZ2h0IHx8IG9wdGlvbnMuZm9udFNpemUgfHwgb3B0aW9ucy5mb250RmFtaWx5IHx8IG9wdGlvbnMuc3BhY2luZyB8fCBvcHRpb25zLmxheW91dCkge1xuXHRcdGlmIChvcHRpb25zLmxheW91dCkgeyBcblx0XHRcdHRoaXMuX2JhY2tlbmQgPSBuZXcgUk9ULkRpc3BsYXlbb3B0aW9ucy5sYXlvdXQuY2FwaXRhbGl6ZSgpXSh0aGlzLl9jb250ZXh0KTtcblx0XHR9XG5cblx0XHR2YXIgZm9udCA9ICh0aGlzLl9vcHRpb25zLmZvbnRTdHlsZSA/IHRoaXMuX29wdGlvbnMuZm9udFN0eWxlICsgXCIgXCIgOiBcIlwiKSArIHRoaXMuX29wdGlvbnMuZm9udFNpemUgKyBcInB4IFwiICsgdGhpcy5fb3B0aW9ucy5mb250RmFtaWx5O1xuXHRcdHRoaXMuX2NvbnRleHQuZm9udCA9IGZvbnQ7XG5cdFx0dGhpcy5fYmFja2VuZC5jb21wdXRlKHRoaXMuX29wdGlvbnMpO1xuXHRcdHRoaXMuX2NvbnRleHQuZm9udCA9IGZvbnQ7XG5cdFx0dGhpcy5fY29udGV4dC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xuXHRcdHRoaXMuX2NvbnRleHQudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcblx0XHR0aGlzLl9kaXJ0eSA9IHRydWU7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogUmV0dXJucyBjdXJyZW50bHkgc2V0IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtvYmplY3R9IEN1cnJlbnQgb3B0aW9ucyBvYmplY3QgXG4gKi9cblJPVC5EaXNwbGF5LnByb3RvdHlwZS5nZXRPcHRpb25zID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl9vcHRpb25zO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIERPTSBub2RlIG9mIHRoaXMgZGlzcGxheVxuICogQHJldHVybnMge25vZGV9IERPTSBub2RlXG4gKi9cblJPVC5EaXNwbGF5LnByb3RvdHlwZS5nZXRDb250YWluZXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX2NvbnRleHQuY2FudmFzO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIG1heGltdW0gd2lkdGgvaGVpZ2h0IHRvIGZpdCBpbnRvIGEgc2V0IG9mIGdpdmVuIGNvbnN0cmFpbnRzXG4gKiBAcGFyYW0ge2ludH0gYXZhaWxXaWR0aCBNYXhpbXVtIGFsbG93ZWQgcGl4ZWwgd2lkdGhcbiAqIEBwYXJhbSB7aW50fSBhdmFpbEhlaWdodCBNYXhpbXVtIGFsbG93ZWQgcGl4ZWwgaGVpZ2h0XG4gKiBAcmV0dXJucyB7aW50WzJdfSBjZWxsV2lkdGgsY2VsbEhlaWdodFxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuY29tcHV0ZVNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHRyZXR1cm4gdGhpcy5fYmFja2VuZC5jb21wdXRlU2l6ZShhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCwgdGhpcy5fb3B0aW9ucyk7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgbWF4aW11bSBmb250IHNpemUgdG8gZml0IGludG8gYSBzZXQgb2YgZ2l2ZW4gY29uc3RyYWludHNcbiAqIEBwYXJhbSB7aW50fSBhdmFpbFdpZHRoIE1heGltdW0gYWxsb3dlZCBwaXhlbCB3aWR0aFxuICogQHBhcmFtIHtpbnR9IGF2YWlsSGVpZ2h0IE1heGltdW0gYWxsb3dlZCBwaXhlbCBoZWlnaHRcbiAqIEByZXR1cm5zIHtpbnR9IGZvbnRTaXplXG4gKi9cblJPVC5EaXNwbGF5LnByb3RvdHlwZS5jb21wdXRlRm9udFNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHRyZXR1cm4gdGhpcy5fYmFja2VuZC5jb21wdXRlRm9udFNpemUoYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQsIHRoaXMuX29wdGlvbnMpO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBET00gZXZlbnQgKG1vdXNlIG9yIHRvdWNoKSB0byBtYXAgY29vcmRpbmF0ZXMuIFVzZXMgZmlyc3QgdG91Y2ggZm9yIG11bHRpLXRvdWNoLlxuICogQHBhcmFtIHtFdmVudH0gZSBldmVudFxuICogQHJldHVybnMge2ludFsyXX0gLTEgZm9yIHZhbHVlcyBvdXRzaWRlIG9mIHRoZSBjYW52YXNcbiAqL1xuUk9ULkRpc3BsYXkucHJvdG90eXBlLmV2ZW50VG9Qb3NpdGlvbiA9IGZ1bmN0aW9uKGUpIHtcblx0aWYgKGUudG91Y2hlcykge1xuXHRcdHZhciB4ID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0dmFyIHkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcblx0fSBlbHNlIHtcblx0XHR2YXIgeCA9IGUuY2xpZW50WDtcblx0XHR2YXIgeSA9IGUuY2xpZW50WTtcblx0fVxuXG5cdHZhciByZWN0ID0gdGhpcy5fY29udGV4dC5jYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdHggLT0gcmVjdC5sZWZ0O1xuXHR5IC09IHJlY3QudG9wO1xuXHRcblx0aWYgKHggPCAwIHx8IHkgPCAwIHx8IHggPj0gdGhpcy5fY29udGV4dC5jYW52YXMud2lkdGggfHwgeSA+PSB0aGlzLl9jb250ZXh0LmNhbnZhcy5oZWlnaHQpIHsgcmV0dXJuIFstMSwgLTFdOyB9XG5cblx0cmV0dXJuIHRoaXMuX2JhY2tlbmQuZXZlbnRUb1Bvc2l0aW9uKHgsIHkpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtzdHJpbmcgfHwgc3RyaW5nW119IGNoIE9uZSBvciBtb3JlIGNoYXJzICh3aWxsIGJlIG92ZXJsYXBwaW5nIHRoZW1zZWx2ZXMpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2ZnXSBmb3JlZ3JvdW5kIGNvbG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gW2JnXSBiYWNrZ3JvdW5kIGNvbG9yXG4gKi9cblJPVC5EaXNwbGF5LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oeCwgeSwgY2gsIGZnLCBiZykge1xuXHRpZiAoIWZnKSB7IGZnID0gdGhpcy5fb3B0aW9ucy5mZzsgfVxuXHRpZiAoIWJnKSB7IGJnID0gdGhpcy5fb3B0aW9ucy5iZzsgfVxuXHR0aGlzLl9kYXRhW3grXCIsXCIreV0gPSBbeCwgeSwgY2gsIGZnLCBiZ107XG5cdFxuXHRpZiAodGhpcy5fZGlydHkgPT09IHRydWUpIHsgcmV0dXJuOyB9IC8qIHdpbGwgYWxyZWFkeSByZWRyYXcgZXZlcnl0aGluZyAqL1xuXHRpZiAoIXRoaXMuX2RpcnR5KSB7IHRoaXMuX2RpcnR5ID0ge307IH0gLyogZmlyc3QhICovXG5cdHRoaXMuX2RpcnR5W3grXCIsXCIreV0gPSB0cnVlO1xufVxuXG4vKipcbiAqIERyYXdzIGEgdGV4dCBhdCBnaXZlbiBwb3NpdGlvbi4gT3B0aW9uYWxseSB3cmFwcyBhdCBhIG1heGltdW0gbGVuZ3RoLiBDdXJyZW50bHkgZG9lcyBub3Qgd29yayB3aXRoIGhleCBsYXlvdXQuXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IE1heSBjb250YWluIGNvbG9yL2JhY2tncm91bmQgZm9ybWF0IHNwZWNpZmllcnMsICVje25hbWV9LyVie25hbWV9LCBib3RoIG9wdGlvbmFsLiAlY3t9LyVie30gcmVzZXRzIHRvIGRlZmF1bHQuXG4gKiBAcGFyYW0ge2ludH0gW21heFdpZHRoXSB3cmFwIGF0IHdoYXQgd2lkdGg/XG4gKiBAcmV0dXJucyB7aW50fSBsaW5lcyBkcmF3blxuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuZHJhd1RleHQgPSBmdW5jdGlvbih4LCB5LCB0ZXh0LCBtYXhXaWR0aCkge1xuXHR2YXIgZmcgPSBudWxsO1xuXHR2YXIgYmcgPSBudWxsO1xuXHR2YXIgY3ggPSB4O1xuXHR2YXIgY3kgPSB5O1xuXHR2YXIgbGluZXMgPSAxO1xuXHRpZiAoIW1heFdpZHRoKSB7IG1heFdpZHRoID0gdGhpcy5fb3B0aW9ucy53aWR0aC14OyB9XG5cblx0dmFyIHRva2VucyA9IFJPVC5UZXh0LnRva2VuaXplKHRleHQsIG1heFdpZHRoKTtcblxuXHR3aGlsZSAodG9rZW5zLmxlbmd0aCkgeyAvKiBpbnRlcnByZXQgdG9rZW5pemVkIG9wY29kZSBzdHJlYW0gKi9cblx0XHR2YXIgdG9rZW4gPSB0b2tlbnMuc2hpZnQoKTtcblx0XHRzd2l0Y2ggKHRva2VuLnR5cGUpIHtcblx0XHRcdGNhc2UgUk9ULlRleHQuVFlQRV9URVhUOlxuXHRcdFx0XHR2YXIgaXNTcGFjZSA9IGZhbHNlLCBpc1ByZXZTcGFjZSA9IGZhbHNlLCBpc0Z1bGxXaWR0aCA9IGZhbHNlLCBpc1ByZXZGdWxsV2lkdGggPSBmYWxzZTtcblx0XHRcdFx0Zm9yICh2YXIgaT0wO2k8dG9rZW4udmFsdWUubGVuZ3RoO2krKykge1xuXHRcdFx0XHRcdHZhciBjYyA9IHRva2VuLnZhbHVlLmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRcdFx0dmFyIGMgPSB0b2tlbi52YWx1ZS5jaGFyQXQoaSk7XG5cdFx0XHRcdFx0Ly8gQXNzaWduIHRvIGB0cnVlYCB3aGVuIHRoZSBjdXJyZW50IGNoYXIgaXMgZnVsbC13aWR0aC5cblx0XHRcdFx0XHRpc0Z1bGxXaWR0aCA9IChjYyA+IDB4ZmYgJiYgY2MgPCAweGZmNjEpIHx8IChjYyA+IDB4ZmZkYyAmJiBjYyA8IDB4ZmZlOCkgJiYgY2MgPiAweGZmZWU7XG5cdFx0XHRcdFx0Ly8gQ3VycmVudCBjaGFyIGlzIHNwYWNlLCB3aGF0ZXZlciBmdWxsLXdpZHRoIG9yIGhhbGYtd2lkdGggYm90aCBhcmUgT0suXG5cdFx0XHRcdFx0aXNTcGFjZSA9IChjLmNoYXJDb2RlQXQoMCkgPT0gMHgyMCB8fCBjLmNoYXJDb2RlQXQoMCkgPT0gMHgzMDAwKTtcblx0XHRcdFx0XHQvLyBUaGUgcHJldmlvdXMgY2hhciBpcyBmdWxsLXdpZHRoIGFuZFxuXHRcdFx0XHRcdC8vIGN1cnJlbnQgY2hhciBpcyBuZXRoZXIgaGFsZi13aWR0aCBub3IgYSBzcGFjZS5cblx0XHRcdFx0XHRpZiAoaXNQcmV2RnVsbFdpZHRoICYmICFpc0Z1bGxXaWR0aCAmJiAhaXNTcGFjZSkgeyBjeCsrOyB9IC8vIGFkZCBhbiBleHRyYSBwb3NpdGlvblxuXHRcdFx0XHRcdC8vIFRoZSBjdXJyZW50IGNoYXIgaXMgZnVsbC13aWR0aCBhbmRcblx0XHRcdFx0XHQvLyB0aGUgcHJldmlvdXMgY2hhciBpcyBub3QgYSBzcGFjZS5cblx0XHRcdFx0XHRpZihpc0Z1bGxXaWR0aCAmJiAhaXNQcmV2U3BhY2UpIHsgY3grKzsgfSAvLyBhZGQgYW4gZXh0cmEgcG9zaXRpb25cblx0XHRcdFx0XHR0aGlzLmRyYXcoY3grKywgY3ksIGMsIGZnLCBiZyk7XG5cdFx0XHRcdFx0aXNQcmV2U3BhY2UgPSBpc1NwYWNlO1xuXHRcdFx0XHRcdGlzUHJldkZ1bGxXaWR0aCA9IGlzRnVsbFdpZHRoO1xuXHRcdFx0XHR9XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBST1QuVGV4dC5UWVBFX0ZHOlxuXHRcdFx0XHRmZyA9IHRva2VuLnZhbHVlIHx8IG51bGw7XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBST1QuVGV4dC5UWVBFX0JHOlxuXHRcdFx0XHRiZyA9IHRva2VuLnZhbHVlIHx8IG51bGw7XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBST1QuVGV4dC5UWVBFX05FV0xJTkU6XG5cdFx0XHRcdGN4ID0geDtcblx0XHRcdFx0Y3krKztcblx0XHRcdFx0bGluZXMrK1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGxpbmVzO1xufVxuXG4vKipcbiAqIFRpbWVyIHRpY2s6IHVwZGF0ZSBkaXJ0eSBwYXJ0c1xuICovXG5ST1QuRGlzcGxheS5wcm90b3R5cGUuX3RpY2sgPSBmdW5jdGlvbigpIHtcblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3RpY2spO1xuXG5cdGlmICghdGhpcy5fZGlydHkpIHsgcmV0dXJuOyB9XG5cblx0aWYgKHRoaXMuX2RpcnR5ID09PSB0cnVlKSB7IC8qIGRyYXcgYWxsICovXG5cdFx0dGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLl9vcHRpb25zLmJnO1xuXHRcdHRoaXMuX2NvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy5fY29udGV4dC5jYW52YXMud2lkdGgsIHRoaXMuX2NvbnRleHQuY2FudmFzLmhlaWdodCk7XG5cblx0XHRmb3IgKHZhciBpZCBpbiB0aGlzLl9kYXRhKSB7IC8qIHJlZHJhdyBjYWNoZWQgZGF0YSAqL1xuXHRcdFx0dGhpcy5fZHJhdyhpZCwgZmFsc2UpO1xuXHRcdH1cblxuXHR9IGVsc2UgeyAvKiBkcmF3IG9ubHkgZGlydHkgKi9cblx0XHRmb3IgKHZhciBrZXkgaW4gdGhpcy5fZGlydHkpIHtcblx0XHRcdHRoaXMuX2RyYXcoa2V5LCB0cnVlKTtcblx0XHR9XG5cdH1cblxuXHR0aGlzLl9kaXJ0eSA9IGZhbHNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgV2hhdCB0byBkcmF3XG4gKiBAcGFyYW0ge2Jvb2x9IGNsZWFyQmVmb3JlIElzIGl0IG5lY2Vzc2FyeSB0byBjbGVhbiBiZWZvcmU/XG4gKi9cblJPVC5EaXNwbGF5LnByb3RvdHlwZS5fZHJhdyA9IGZ1bmN0aW9uKGtleSwgY2xlYXJCZWZvcmUpIHtcblx0dmFyIGRhdGEgPSB0aGlzLl9kYXRhW2tleV07XG5cdGlmIChkYXRhWzRdICE9IHRoaXMuX29wdGlvbnMuYmcpIHsgY2xlYXJCZWZvcmUgPSB0cnVlOyB9XG5cblx0dGhpcy5fYmFja2VuZC5kcmF3KGRhdGEsIGNsZWFyQmVmb3JlKTtcbn1cbi8qKlxuICogQGNsYXNzIEFic3RyYWN0IGRpc3BsYXkgYmFja2VuZCBtb2R1bGVcbiAqIEBwcml2YXRlXG4gKi9cblJPVC5EaXNwbGF5LkJhY2tlbmQgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xufVxuXG5ST1QuRGlzcGxheS5CYWNrZW5kLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24ob3B0aW9ucykge1xufVxuXG5ST1QuRGlzcGxheS5CYWNrZW5kLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oZGF0YSwgY2xlYXJCZWZvcmUpIHtcbn1cblxuUk9ULkRpc3BsYXkuQmFja2VuZC5wcm90b3R5cGUuY29tcHV0ZVNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xufVxuXG5ST1QuRGlzcGxheS5CYWNrZW5kLnByb3RvdHlwZS5jb21wdXRlRm9udFNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xufVxuXG5ST1QuRGlzcGxheS5CYWNrZW5kLnByb3RvdHlwZS5ldmVudFRvUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG59XG4vKipcbiAqIEBjbGFzcyBSZWN0YW5ndWxhciBiYWNrZW5kXG4gKiBAcHJpdmF0ZVxuICovXG5ST1QuRGlzcGxheS5SZWN0ID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRST1QuRGlzcGxheS5CYWNrZW5kLmNhbGwodGhpcywgY29udGV4dCk7XG5cdFxuXHR0aGlzLl9zcGFjaW5nWCA9IDA7XG5cdHRoaXMuX3NwYWNpbmdZID0gMDtcblx0dGhpcy5fY2FudmFzQ2FjaGUgPSB7fTtcblx0dGhpcy5fb3B0aW9ucyA9IHt9O1xufVxuUk9ULkRpc3BsYXkuUmVjdC5leHRlbmQoUk9ULkRpc3BsYXkuQmFja2VuZCk7XG5cblJPVC5EaXNwbGF5LlJlY3QuY2FjaGUgPSBmYWxzZTtcblxuUk9ULkRpc3BsYXkuUmVjdC5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dGhpcy5fY2FudmFzQ2FjaGUgPSB7fTtcblx0dGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG5cblx0dmFyIGNoYXJXaWR0aCA9IE1hdGguY2VpbCh0aGlzLl9jb250ZXh0Lm1lYXN1cmVUZXh0KFwiV1wiKS53aWR0aCk7XG5cdHRoaXMuX3NwYWNpbmdYID0gTWF0aC5jZWlsKG9wdGlvbnMuc3BhY2luZyAqIGNoYXJXaWR0aCk7XG5cdHRoaXMuX3NwYWNpbmdZID0gTWF0aC5jZWlsKG9wdGlvbnMuc3BhY2luZyAqIG9wdGlvbnMuZm9udFNpemUpO1xuXG5cdGlmICh0aGlzLl9vcHRpb25zLmZvcmNlU3F1YXJlUmF0aW8pIHtcblx0XHR0aGlzLl9zcGFjaW5nWCA9IHRoaXMuX3NwYWNpbmdZID0gTWF0aC5tYXgodGhpcy5fc3BhY2luZ1gsIHRoaXMuX3NwYWNpbmdZKTtcblx0fVxuXG5cdHRoaXMuX2NvbnRleHQuY2FudmFzLndpZHRoID0gb3B0aW9ucy53aWR0aCAqIHRoaXMuX3NwYWNpbmdYO1xuXHR0aGlzLl9jb250ZXh0LmNhbnZhcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCAqIHRoaXMuX3NwYWNpbmdZO1xufVxuXG5ST1QuRGlzcGxheS5SZWN0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oZGF0YSwgY2xlYXJCZWZvcmUpIHtcblx0aWYgKHRoaXMuY29uc3RydWN0b3IuY2FjaGUpIHtcblx0XHR0aGlzLl9kcmF3V2l0aENhY2hlKGRhdGEsIGNsZWFyQmVmb3JlKTtcblx0fSBlbHNlIHtcblx0XHR0aGlzLl9kcmF3Tm9DYWNoZShkYXRhLCBjbGVhckJlZm9yZSk7XG5cdH1cbn1cblxuUk9ULkRpc3BsYXkuUmVjdC5wcm90b3R5cGUuX2RyYXdXaXRoQ2FjaGUgPSBmdW5jdGlvbihkYXRhLCBjbGVhckJlZm9yZSkge1xuXHR2YXIgeCA9IGRhdGFbMF07XG5cdHZhciB5ID0gZGF0YVsxXTtcblx0dmFyIGNoID0gZGF0YVsyXTtcblx0dmFyIGZnID0gZGF0YVszXTtcblx0dmFyIGJnID0gZGF0YVs0XTtcblxuXHR2YXIgaGFzaCA9IFwiXCIrY2grZmcrYmc7XG5cdGlmIChoYXNoIGluIHRoaXMuX2NhbnZhc0NhY2hlKSB7XG5cdFx0dmFyIGNhbnZhcyA9IHRoaXMuX2NhbnZhc0NhY2hlW2hhc2hdO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBiID0gdGhpcy5fb3B0aW9ucy5ib3JkZXI7XG5cdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG5cdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cdFx0Y2FudmFzLndpZHRoID0gdGhpcy5fc3BhY2luZ1g7XG5cdFx0Y2FudmFzLmhlaWdodCA9IHRoaXMuX3NwYWNpbmdZO1xuXHRcdGN0eC5maWxsU3R5bGUgPSBiZztcblx0XHRjdHguZmlsbFJlY3QoYiwgYiwgY2FudmFzLndpZHRoLWIsIGNhbnZhcy5oZWlnaHQtYik7XG5cdFx0XG5cdFx0aWYgKGNoKSB7XG5cdFx0XHRjdHguZmlsbFN0eWxlID0gZmc7XG5cdFx0XHRjdHguZm9udCA9IHRoaXMuX2NvbnRleHQuZm9udDtcblx0XHRcdGN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xuXHRcdFx0Y3R4LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XG5cblx0XHRcdHZhciBjaGFycyA9IFtdLmNvbmNhdChjaCk7XG5cdFx0XHRmb3IgKHZhciBpPTA7aTxjaGFycy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRcdGN0eC5maWxsVGV4dChjaGFyc1tpXSwgdGhpcy5fc3BhY2luZ1gvMiwgTWF0aC5jZWlsKHRoaXMuX3NwYWNpbmdZLzIpKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5fY2FudmFzQ2FjaGVbaGFzaF0gPSBjYW52YXM7XG5cdH1cblx0XG5cdHRoaXMuX2NvbnRleHQuZHJhd0ltYWdlKGNhbnZhcywgeCp0aGlzLl9zcGFjaW5nWCwgeSp0aGlzLl9zcGFjaW5nWSk7XG59XG5cblJPVC5EaXNwbGF5LlJlY3QucHJvdG90eXBlLl9kcmF3Tm9DYWNoZSA9IGZ1bmN0aW9uKGRhdGEsIGNsZWFyQmVmb3JlKSB7XG5cdHZhciB4ID0gZGF0YVswXTtcblx0dmFyIHkgPSBkYXRhWzFdO1xuXHR2YXIgY2ggPSBkYXRhWzJdO1xuXHR2YXIgZmcgPSBkYXRhWzNdO1xuXHR2YXIgYmcgPSBkYXRhWzRdO1xuXG5cdGlmIChjbGVhckJlZm9yZSkgeyBcblx0XHR2YXIgYiA9IHRoaXMuX29wdGlvbnMuYm9yZGVyO1xuXHRcdHRoaXMuX2NvbnRleHQuZmlsbFN0eWxlID0gYmc7XG5cdFx0dGhpcy5fY29udGV4dC5maWxsUmVjdCh4KnRoaXMuX3NwYWNpbmdYICsgYiwgeSp0aGlzLl9zcGFjaW5nWSArIGIsIHRoaXMuX3NwYWNpbmdYIC0gYiwgdGhpcy5fc3BhY2luZ1kgLSBiKTtcblx0fVxuXHRcblx0aWYgKCFjaCkgeyByZXR1cm47IH1cblxuXHR0aGlzLl9jb250ZXh0LmZpbGxTdHlsZSA9IGZnO1xuXG5cdHZhciBjaGFycyA9IFtdLmNvbmNhdChjaCk7XG5cdGZvciAodmFyIGk9MDtpPGNoYXJzLmxlbmd0aDtpKyspIHtcblx0XHR0aGlzLl9jb250ZXh0LmZpbGxUZXh0KGNoYXJzW2ldLCAoeCswLjUpICogdGhpcy5fc3BhY2luZ1gsIE1hdGguY2VpbCgoeSswLjUpICogdGhpcy5fc3BhY2luZ1kpKTtcblx0fVxufVxuXG5ST1QuRGlzcGxheS5SZWN0LnByb3RvdHlwZS5jb21wdXRlU2l6ZSA9IGZ1bmN0aW9uKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0KSB7XG5cdHZhciB3aWR0aCA9IE1hdGguZmxvb3IoYXZhaWxXaWR0aCAvIHRoaXMuX3NwYWNpbmdYKTtcblx0dmFyIGhlaWdodCA9IE1hdGguZmxvb3IoYXZhaWxIZWlnaHQgLyB0aGlzLl9zcGFjaW5nWSk7XG5cdHJldHVybiBbd2lkdGgsIGhlaWdodF07XG59XG5cblJPVC5EaXNwbGF5LlJlY3QucHJvdG90eXBlLmNvbXB1dGVGb250U2l6ZSA9IGZ1bmN0aW9uKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0KSB7XG5cdHZhciBib3hXaWR0aCA9IE1hdGguZmxvb3IoYXZhaWxXaWR0aCAvIHRoaXMuX29wdGlvbnMud2lkdGgpO1xuXHR2YXIgYm94SGVpZ2h0ID0gTWF0aC5mbG9vcihhdmFpbEhlaWdodCAvIHRoaXMuX29wdGlvbnMuaGVpZ2h0KTtcblxuXHQvKiBjb21wdXRlIGNoYXIgcmF0aW8gKi9cblx0dmFyIG9sZEZvbnQgPSB0aGlzLl9jb250ZXh0LmZvbnQ7XG5cdHRoaXMuX2NvbnRleHQuZm9udCA9IFwiMTAwcHggXCIgKyB0aGlzLl9vcHRpb25zLmZvbnRGYW1pbHk7XG5cdHZhciB3aWR0aCA9IE1hdGguY2VpbCh0aGlzLl9jb250ZXh0Lm1lYXN1cmVUZXh0KFwiV1wiKS53aWR0aCk7XG5cdHRoaXMuX2NvbnRleHQuZm9udCA9IG9sZEZvbnQ7XG5cdHZhciByYXRpbyA9IHdpZHRoIC8gMTAwO1xuXHRcdFxuXHR2YXIgd2lkdGhGcmFjdGlvbiA9IHJhdGlvICogYm94SGVpZ2h0IC8gYm94V2lkdGg7XG5cdGlmICh3aWR0aEZyYWN0aW9uID4gMSkgeyAvKiB0b28gd2lkZSB3aXRoIGN1cnJlbnQgYXNwZWN0IHJhdGlvICovXG5cdFx0Ym94SGVpZ2h0ID0gTWF0aC5mbG9vcihib3hIZWlnaHQgLyB3aWR0aEZyYWN0aW9uKTtcblx0fVxuXHRyZXR1cm4gTWF0aC5mbG9vcihib3hIZWlnaHQgLyB0aGlzLl9vcHRpb25zLnNwYWNpbmcpO1xufVxuXG5ST1QuRGlzcGxheS5SZWN0LnByb3RvdHlwZS5ldmVudFRvUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBbTWF0aC5mbG9vcih4L3RoaXMuX3NwYWNpbmdYKSwgTWF0aC5mbG9vcih5L3RoaXMuX3NwYWNpbmdZKV07XG59XG4vKipcbiAqIEBjbGFzcyBIZXhhZ29uYWwgYmFja2VuZFxuICogQHByaXZhdGVcbiAqL1xuUk9ULkRpc3BsYXkuSGV4ID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRST1QuRGlzcGxheS5CYWNrZW5kLmNhbGwodGhpcywgY29udGV4dCk7XG5cblx0dGhpcy5fc3BhY2luZ1ggPSAwO1xuXHR0aGlzLl9zcGFjaW5nWSA9IDA7XG5cdHRoaXMuX2hleFNpemUgPSAwO1xuXHR0aGlzLl9vcHRpb25zID0ge307XG59XG5ST1QuRGlzcGxheS5IZXguZXh0ZW5kKFJPVC5EaXNwbGF5LkJhY2tlbmQpO1xuXG5ST1QuRGlzcGxheS5IZXgucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuXG5cdC8qIEZJWE1FIGNoYXIgc2l6ZSBjb21wdXRhdGlvbiBkb2VzIG5vdCByZXNwZWN0IHRyYW5zcG9zZWQgaGV4ZXMgKi9cblx0dmFyIGNoYXJXaWR0aCA9IE1hdGguY2VpbCh0aGlzLl9jb250ZXh0Lm1lYXN1cmVUZXh0KFwiV1wiKS53aWR0aCk7XG5cdHRoaXMuX2hleFNpemUgPSBNYXRoLmZsb29yKG9wdGlvbnMuc3BhY2luZyAqIChvcHRpb25zLmZvbnRTaXplICsgY2hhcldpZHRoL01hdGguc3FydCgzKSkgLyAyKTtcblx0dGhpcy5fc3BhY2luZ1ggPSB0aGlzLl9oZXhTaXplICogTWF0aC5zcXJ0KDMpIC8gMjtcblx0dGhpcy5fc3BhY2luZ1kgPSB0aGlzLl9oZXhTaXplICogMS41O1xuXG5cdGlmIChvcHRpb25zLnRyYW5zcG9zZSkge1xuXHRcdHZhciB4cHJvcCA9IFwiaGVpZ2h0XCI7XG5cdFx0dmFyIHlwcm9wID0gXCJ3aWR0aFwiO1xuXHR9IGVsc2Uge1xuXHRcdHZhciB4cHJvcCA9IFwid2lkdGhcIjtcblx0XHR2YXIgeXByb3AgPSBcImhlaWdodFwiO1xuXHR9XG5cdHRoaXMuX2NvbnRleHQuY2FudmFzW3hwcm9wXSA9IE1hdGguY2VpbCggKG9wdGlvbnMud2lkdGggKyAxKSAqIHRoaXMuX3NwYWNpbmdYICk7XG5cdHRoaXMuX2NvbnRleHQuY2FudmFzW3lwcm9wXSA9IE1hdGguY2VpbCggKG9wdGlvbnMuaGVpZ2h0IC0gMSkgKiB0aGlzLl9zcGFjaW5nWSArIDIqdGhpcy5faGV4U2l6ZSApO1xufVxuXG5ST1QuRGlzcGxheS5IZXgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihkYXRhLCBjbGVhckJlZm9yZSkge1xuXHR2YXIgeCA9IGRhdGFbMF07XG5cdHZhciB5ID0gZGF0YVsxXTtcblx0dmFyIGNoID0gZGF0YVsyXTtcblx0dmFyIGZnID0gZGF0YVszXTtcblx0dmFyIGJnID0gZGF0YVs0XTtcblxuXHR2YXIgcHggPSBbXG5cdFx0KHgrMSkgKiB0aGlzLl9zcGFjaW5nWCxcblx0XHR5ICogdGhpcy5fc3BhY2luZ1kgKyB0aGlzLl9oZXhTaXplXG5cdF07XG5cdGlmICh0aGlzLl9vcHRpb25zLnRyYW5zcG9zZSkgeyBweC5yZXZlcnNlKCk7IH1cblxuXHRpZiAoY2xlYXJCZWZvcmUpIHsgXG5cdFx0dGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBiZztcblx0XHR0aGlzLl9maWxsKHB4WzBdLCBweFsxXSk7XG5cdH1cblx0XG5cdGlmICghY2gpIHsgcmV0dXJuOyB9XG5cblx0dGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBmZztcblxuXHR2YXIgY2hhcnMgPSBbXS5jb25jYXQoY2gpO1xuXHRmb3IgKHZhciBpPTA7aTxjaGFycy5sZW5ndGg7aSsrKSB7XG5cdFx0dGhpcy5fY29udGV4dC5maWxsVGV4dChjaGFyc1tpXSwgcHhbMF0sIE1hdGguY2VpbChweFsxXSkpO1xuXHR9XG59XG5cblJPVC5EaXNwbGF5LkhleC5wcm90b3R5cGUuY29tcHV0ZVNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHRpZiAodGhpcy5fb3B0aW9ucy50cmFuc3Bvc2UpIHtcblx0XHRhdmFpbFdpZHRoICs9IGF2YWlsSGVpZ2h0O1xuXHRcdGF2YWlsSGVpZ2h0ID0gYXZhaWxXaWR0aCAtIGF2YWlsSGVpZ2h0O1xuXHRcdGF2YWlsV2lkdGggLT0gYXZhaWxIZWlnaHQ7XG5cdH1cblxuXHR2YXIgd2lkdGggPSBNYXRoLmZsb29yKGF2YWlsV2lkdGggLyB0aGlzLl9zcGFjaW5nWCkgLSAxO1xuXHR2YXIgaGVpZ2h0ID0gTWF0aC5mbG9vcigoYXZhaWxIZWlnaHQgLSAyKnRoaXMuX2hleFNpemUpIC8gdGhpcy5fc3BhY2luZ1kgKyAxKTtcblx0cmV0dXJuIFt3aWR0aCwgaGVpZ2h0XTtcbn1cblxuUk9ULkRpc3BsYXkuSGV4LnByb3RvdHlwZS5jb21wdXRlRm9udFNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHRpZiAodGhpcy5fb3B0aW9ucy50cmFuc3Bvc2UpIHtcblx0XHRhdmFpbFdpZHRoICs9IGF2YWlsSGVpZ2h0O1xuXHRcdGF2YWlsSGVpZ2h0ID0gYXZhaWxXaWR0aCAtIGF2YWlsSGVpZ2h0O1xuXHRcdGF2YWlsV2lkdGggLT0gYXZhaWxIZWlnaHQ7XG5cdH1cblxuXHR2YXIgaGV4U2l6ZVdpZHRoID0gMiphdmFpbFdpZHRoIC8gKCh0aGlzLl9vcHRpb25zLndpZHRoKzEpICogTWF0aC5zcXJ0KDMpKSAtIDE7XG5cdHZhciBoZXhTaXplSGVpZ2h0ID0gYXZhaWxIZWlnaHQgLyAoMiArIDEuNSoodGhpcy5fb3B0aW9ucy5oZWlnaHQtMSkpO1xuXHR2YXIgaGV4U2l6ZSA9IE1hdGgubWluKGhleFNpemVXaWR0aCwgaGV4U2l6ZUhlaWdodCk7XG5cblx0LyogY29tcHV0ZSBjaGFyIHJhdGlvICovXG5cdHZhciBvbGRGb250ID0gdGhpcy5fY29udGV4dC5mb250O1xuXHR0aGlzLl9jb250ZXh0LmZvbnQgPSBcIjEwMHB4IFwiICsgdGhpcy5fb3B0aW9ucy5mb250RmFtaWx5O1xuXHR2YXIgd2lkdGggPSBNYXRoLmNlaWwodGhpcy5fY29udGV4dC5tZWFzdXJlVGV4dChcIldcIikud2lkdGgpO1xuXHR0aGlzLl9jb250ZXh0LmZvbnQgPSBvbGRGb250O1xuXHR2YXIgcmF0aW8gPSB3aWR0aCAvIDEwMDtcblxuXHRoZXhTaXplID0gTWF0aC5mbG9vcihoZXhTaXplKSsxOyAvKiBjbG9zZXN0IGxhcmdlciBoZXhTaXplICovXG5cblx0LyogRklYTUUgY2hhciBzaXplIGNvbXB1dGF0aW9uIGRvZXMgbm90IHJlc3BlY3QgdHJhbnNwb3NlZCBoZXhlcyAqL1xuXHR2YXIgZm9udFNpemUgPSAyKmhleFNpemUgLyAodGhpcy5fb3B0aW9ucy5zcGFjaW5nICogKDEgKyByYXRpbyAvIE1hdGguc3FydCgzKSkpO1xuXG5cdC8qIGNsb3Nlc3Qgc21hbGxlciBmb250U2l6ZSAqL1xuXHRyZXR1cm4gTWF0aC5jZWlsKGZvbnRTaXplKS0xO1xufVxuXG5ST1QuRGlzcGxheS5IZXgucHJvdG90eXBlLmV2ZW50VG9Qb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0aWYgKHRoaXMuX29wdGlvbnMudHJhbnNwb3NlKSB7XG5cdFx0eCArPSB5O1xuXHRcdHkgPSB4LXk7XG5cdFx0eCAtPSB5O1xuXHRcdHZhciBwcm9wID0gXCJ3aWR0aFwiO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBwcm9wID0gXCJoZWlnaHRcIjtcblx0fVxuXHR2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHQuY2FudmFzW3Byb3BdIC8gdGhpcy5fb3B0aW9uc1twcm9wXTtcblx0eSA9IE1hdGguZmxvb3IoeS9zaXplKTtcblxuXHRpZiAoeS5tb2QoMikpIHsgLyogb2RkIHJvdyAqL1xuXHRcdHggLT0gdGhpcy5fc3BhY2luZ1g7XG5cdFx0eCA9IDEgKyAyKk1hdGguZmxvb3IoeC8oMip0aGlzLl9zcGFjaW5nWCkpO1xuXHR9IGVsc2Uge1xuXHRcdHggPSAyKk1hdGguZmxvb3IoeC8oMip0aGlzLl9zcGFjaW5nWCkpO1xuXHR9XG5cdFxuXHRyZXR1cm4gW3gsIHldO1xufVxuXG4vKipcbiAqIEFyZ3VtZW50cyBhcmUgcGl4ZWwgdmFsdWVzLiBJZiBcInRyYW5zcG9zZWRcIiBtb2RlIGlzIGVuYWJsZWQsIHRoZW4gdGhlc2UgdHdvIGFyZSBhbHJlYWR5IHN3YXBwZWQuXG4gKi9cblJPVC5EaXNwbGF5LkhleC5wcm90b3R5cGUuX2ZpbGwgPSBmdW5jdGlvbihjeCwgY3kpIHtcblx0dmFyIGEgPSB0aGlzLl9oZXhTaXplO1xuXHR2YXIgYiA9IHRoaXMuX29wdGlvbnMuYm9yZGVyO1xuXHRcblx0dGhpcy5fY29udGV4dC5iZWdpblBhdGgoKTtcblxuXHRpZiAodGhpcy5fb3B0aW9ucy50cmFuc3Bvc2UpIHtcblx0XHR0aGlzLl9jb250ZXh0Lm1vdmVUbyhjeC1hK2IsXHRjeSk7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3gtYS8yK2IsXHRjeSt0aGlzLl9zcGFjaW5nWC1iKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeCthLzItYixcdGN5K3RoaXMuX3NwYWNpbmdYLWIpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4K2EtYixcdGN5KTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeCthLzItYixcdGN5LXRoaXMuX3NwYWNpbmdYK2IpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4LWEvMitiLFx0Y3ktdGhpcy5fc3BhY2luZ1grYik7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3gtYStiLFx0Y3kpO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuX2NvbnRleHQubW92ZVRvKGN4LFx0XHRcdFx0XHRjeS1hK2IpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4K3RoaXMuX3NwYWNpbmdYLWIsXHRjeS1hLzIrYik7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3grdGhpcy5fc3BhY2luZ1gtYixcdGN5K2EvMi1iKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeCxcdFx0XHRcdFx0Y3krYS1iKTtcblx0XHR0aGlzLl9jb250ZXh0LmxpbmVUbyhjeC10aGlzLl9zcGFjaW5nWCtiLFx0Y3krYS8yLWIpO1xuXHRcdHRoaXMuX2NvbnRleHQubGluZVRvKGN4LXRoaXMuX3NwYWNpbmdYK2IsXHRjeS1hLzIrYik7XG5cdFx0dGhpcy5fY29udGV4dC5saW5lVG8oY3gsXHRcdFx0XHRcdGN5LWErYik7XG5cdH1cblx0dGhpcy5fY29udGV4dC5maWxsKCk7XG59XG4vKipcbiAqIEBjbGFzcyBUaWxlIGJhY2tlbmRcbiAqIEBwcml2YXRlXG4gKi9cblJPVC5EaXNwbGF5LlRpbGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdFJPVC5EaXNwbGF5LlJlY3QuY2FsbCh0aGlzLCBjb250ZXh0KTtcblx0XG5cdHRoaXMuX29wdGlvbnMgPSB7fTtcblx0dGhpcy5fY29sb3JDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xufVxuUk9ULkRpc3BsYXkuVGlsZS5leHRlbmQoUk9ULkRpc3BsYXkuUmVjdCk7XG5cblJPVC5EaXNwbGF5LlRpbGUucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuXHR0aGlzLl9jb250ZXh0LmNhbnZhcy53aWR0aCA9IG9wdGlvbnMud2lkdGggKiBvcHRpb25zLnRpbGVXaWR0aDtcblx0dGhpcy5fY29udGV4dC5jYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgKiBvcHRpb25zLnRpbGVIZWlnaHQ7XG5cdHRoaXMuX2NvbG9yQ2FudmFzLndpZHRoID0gb3B0aW9ucy50aWxlV2lkdGg7XG5cdHRoaXMuX2NvbG9yQ2FudmFzLmhlaWdodCA9IG9wdGlvbnMudGlsZUhlaWdodDtcbn1cblxuUk9ULkRpc3BsYXkuVGlsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGRhdGEsIGNsZWFyQmVmb3JlKSB7XG5cdHZhciB4ID0gZGF0YVswXTtcblx0dmFyIHkgPSBkYXRhWzFdO1xuXHR2YXIgY2ggPSBkYXRhWzJdO1xuXHR2YXIgZmcgPSBkYXRhWzNdO1xuXHR2YXIgYmcgPSBkYXRhWzRdO1xuXG5cdHZhciB0aWxlV2lkdGggPSB0aGlzLl9vcHRpb25zLnRpbGVXaWR0aDtcblx0dmFyIHRpbGVIZWlnaHQgPSB0aGlzLl9vcHRpb25zLnRpbGVIZWlnaHQ7XG5cblx0aWYgKGNsZWFyQmVmb3JlKSB7XG5cdFx0aWYgKHRoaXMuX29wdGlvbnMudGlsZUNvbG9yaXplKSB7XG5cdFx0XHR0aGlzLl9jb250ZXh0LmNsZWFyUmVjdCh4KnRpbGVXaWR0aCwgeSp0aWxlSGVpZ2h0LCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9jb250ZXh0LmZpbGxTdHlsZSA9IGJnO1xuXHRcdFx0dGhpcy5fY29udGV4dC5maWxsUmVjdCh4KnRpbGVXaWR0aCwgeSp0aWxlSGVpZ2h0LCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuXHRcdH1cblx0fVxuXG5cdGlmICghY2gpIHsgcmV0dXJuOyB9XG5cblx0dmFyIGNoYXJzID0gW10uY29uY2F0KGNoKTtcblx0Zm9yICh2YXIgaT0wO2k8Y2hhcnMubGVuZ3RoO2krKykge1xuXHRcdHZhciB0aWxlID0gdGhpcy5fb3B0aW9ucy50aWxlTWFwW2NoYXJzW2ldXTtcblx0XHRpZiAoIXRpbGUpIHsgdGhyb3cgbmV3IEVycm9yKFwiQ2hhciAnXCIgKyBjaGFyc1tpXSArIFwiJyBub3QgZm91bmQgaW4gdGlsZU1hcFwiKTsgfVxuXHRcdFxuXHRcdGlmICh0aGlzLl9vcHRpb25zLnRpbGVDb2xvcml6ZSkgeyAvKiBhcHBseSBjb2xvcml6YXRpb24gKi9cblx0XHRcdHZhciBjYW52YXMgPSB0aGlzLl9jb2xvckNhbnZhcztcblx0XHRcdHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblx0XHRcdGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRpbGVXaWR0aCwgdGlsZUhlaWdodCk7XG5cblx0XHRcdGNvbnRleHQuZHJhd0ltYWdlKFxuXHRcdFx0XHR0aGlzLl9vcHRpb25zLnRpbGVTZXQsXG5cdFx0XHRcdHRpbGVbMF0sIHRpbGVbMV0sIHRpbGVXaWR0aCwgdGlsZUhlaWdodCxcblx0XHRcdFx0MCwgMCwgdGlsZVdpZHRoLCB0aWxlSGVpZ2h0XG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoZmcgIT0gXCJ0cmFuc3BhcmVudFwiKSB7XG5cdFx0XHRcdGNvbnRleHQuZmlsbFN0eWxlID0gZmc7XG5cdFx0XHRcdGNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2UtYXRvcFwiO1xuXHRcdFx0XHRjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRpbGVXaWR0aCwgdGlsZUhlaWdodCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChiZyAhPSBcInRyYW5zcGFyZW50XCIpIHtcblx0XHRcdFx0Y29udGV4dC5maWxsU3R5bGUgPSBiZztcblx0XHRcdFx0Y29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW92ZXJcIjtcblx0XHRcdFx0Y29udGV4dC5maWxsUmVjdCgwLCAwLCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9jb250ZXh0LmRyYXdJbWFnZShjYW52YXMsIHgqdGlsZVdpZHRoLCB5KnRpbGVIZWlnaHQsIHRpbGVXaWR0aCwgdGlsZUhlaWdodCk7XG5cblx0XHR9IGVsc2UgeyAvKiBubyBjb2xvcml6aW5nLCBlYXN5ICovXG5cdFx0XHR0aGlzLl9jb250ZXh0LmRyYXdJbWFnZShcblx0XHRcdFx0dGhpcy5fb3B0aW9ucy50aWxlU2V0LFxuXHRcdFx0XHR0aWxlWzBdLCB0aWxlWzFdLCB0aWxlV2lkdGgsIHRpbGVIZWlnaHQsXG5cdFx0XHRcdHgqdGlsZVdpZHRoLCB5KnRpbGVIZWlnaHQsIHRpbGVXaWR0aCwgdGlsZUhlaWdodFxuXHRcdFx0KTtcblx0XHR9XG5cdH1cbn1cblxuUk9ULkRpc3BsYXkuVGlsZS5wcm90b3R5cGUuY29tcHV0ZVNpemUgPSBmdW5jdGlvbihhdmFpbFdpZHRoLCBhdmFpbEhlaWdodCkge1xuXHR2YXIgd2lkdGggPSBNYXRoLmZsb29yKGF2YWlsV2lkdGggLyB0aGlzLl9vcHRpb25zLnRpbGVXaWR0aCk7XG5cdHZhciBoZWlnaHQgPSBNYXRoLmZsb29yKGF2YWlsSGVpZ2h0IC8gdGhpcy5fb3B0aW9ucy50aWxlSGVpZ2h0KTtcblx0cmV0dXJuIFt3aWR0aCwgaGVpZ2h0XTtcbn1cblxuUk9ULkRpc3BsYXkuVGlsZS5wcm90b3R5cGUuY29tcHV0ZUZvbnRTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0dmFyIHdpZHRoID0gTWF0aC5mbG9vcihhdmFpbFdpZHRoIC8gdGhpcy5fb3B0aW9ucy53aWR0aCk7XG5cdHZhciBoZWlnaHQgPSBNYXRoLmZsb29yKGF2YWlsSGVpZ2h0IC8gdGhpcy5fb3B0aW9ucy5oZWlnaHQpO1xuXHRyZXR1cm4gW3dpZHRoLCBoZWlnaHRdO1xufVxuXG5ST1QuRGlzcGxheS5UaWxlLnByb3RvdHlwZS5ldmVudFRvUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBbTWF0aC5mbG9vcih4L3RoaXMuX29wdGlvbnMudGlsZVdpZHRoKSwgTWF0aC5mbG9vcih5L3RoaXMuX29wdGlvbnMudGlsZUhlaWdodCldO1xufVxuLyoqXG4gKiBAbmFtZXNwYWNlXG4gKiBUaGlzIGNvZGUgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgQWxlYSBhbGdvcml0aG07IChDKSAyMDEwIEpvaGFubmVzIEJhYWfDuGUuXG4gKiBBbGVhIGlzIGxpY2Vuc2VkIGFjY29yZGluZyB0byB0aGUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZS5cbiAqL1xuUk9ULlJORyA9IHtcblx0LyoqXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IFxuXHQgKi9cblx0Z2V0U2VlZDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3NlZWQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzZWVkIFNlZWQgdGhlIG51bWJlciBnZW5lcmF0b3Jcblx0ICovXG5cdHNldFNlZWQ6IGZ1bmN0aW9uKHNlZWQpIHtcblx0XHRzZWVkID0gKHNlZWQgPCAxID8gMS9zZWVkIDogc2VlZCk7XG5cblx0XHR0aGlzLl9zZWVkID0gc2VlZDtcblx0XHR0aGlzLl9zMCA9IChzZWVkID4+PiAwKSAqIHRoaXMuX2ZyYWM7XG5cblx0XHRzZWVkID0gKHNlZWQqNjkwNjkgKyAxKSA+Pj4gMDtcblx0XHR0aGlzLl9zMSA9IHNlZWQgKiB0aGlzLl9mcmFjO1xuXG5cdFx0c2VlZCA9IChzZWVkKjY5MDY5ICsgMSkgPj4+IDA7XG5cdFx0dGhpcy5fczIgPSBzZWVkICogdGhpcy5fZnJhYztcblxuXHRcdHRoaXMuX2MgPSAxO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyB7ZmxvYXR9IFBzZXVkb3JhbmRvbSB2YWx1ZSBbMCwxKSwgdW5pZm9ybWx5IGRpc3RyaWJ1dGVkXG5cdCAqL1xuXHRnZXRVbmlmb3JtOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdCA9IDIwOTE2MzkgKiB0aGlzLl9zMCArIHRoaXMuX2MgKiB0aGlzLl9mcmFjO1xuXHRcdHRoaXMuX3MwID0gdGhpcy5fczE7XG5cdFx0dGhpcy5fczEgPSB0aGlzLl9zMjtcblx0XHR0aGlzLl9jID0gdCB8IDA7XG5cdFx0dGhpcy5fczIgPSB0IC0gdGhpcy5fYztcblx0XHRyZXR1cm4gdGhpcy5fczI7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7aW50fSBsb3dlckJvdW5kIFRoZSBsb3dlciBlbmQgb2YgdGhlIHJhbmdlIHRvIHJldHVybiBhIHZhbHVlIGZyb20sIGluY2x1c2l2ZVxuXHQgKiBAcGFyYW0ge2ludH0gdXBwZXJCb3VuZCBUaGUgdXBwZXIgZW5kIG9mIHRoZSByYW5nZSB0byByZXR1cm4gYSB2YWx1ZSBmcm9tLCBpbmNsdXNpdmVcblx0ICogQHJldHVybnMge2ludH0gUHNldWRvcmFuZG9tIHZhbHVlIFtsb3dlckJvdW5kLCB1cHBlckJvdW5kXSwgdXNpbmcgUk9ULlJORy5nZXRVbmlmb3JtKCkgdG8gZGlzdHJpYnV0ZSB0aGUgdmFsdWVcblx0ICovXG5cdGdldFVuaWZvcm1JbnQ6IGZ1bmN0aW9uKGxvd2VyQm91bmQsIHVwcGVyQm91bmQpIHtcblx0XHR2YXIgbWF4ID0gTWF0aC5tYXgobG93ZXJCb3VuZCwgdXBwZXJCb3VuZCk7XG5cdFx0dmFyIG1pbiA9IE1hdGgubWluKGxvd2VyQm91bmQsIHVwcGVyQm91bmQpO1xuXHRcdHJldHVybiBNYXRoLmZsb29yKHRoaXMuZ2V0VW5pZm9ybSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcblx0fSxcblxuXHQvKipcblx0ICogQHBhcmFtIHtmbG9hdH0gW21lYW49MF0gTWVhbiB2YWx1ZVxuXHQgKiBAcGFyYW0ge2Zsb2F0fSBbc3RkZGV2PTFdIFN0YW5kYXJkIGRldmlhdGlvbi4gfjk1JSBvZiB0aGUgYWJzb2x1dGUgdmFsdWVzIHdpbGwgYmUgbG93ZXIgdGhhbiAyKnN0ZGRldi5cblx0ICogQHJldHVybnMge2Zsb2F0fSBBIG5vcm1hbGx5IGRpc3RyaWJ1dGVkIHBzZXVkb3JhbmRvbSB2YWx1ZVxuXHQgKi9cblx0Z2V0Tm9ybWFsOiBmdW5jdGlvbihtZWFuLCBzdGRkZXYpIHtcblx0XHRkbyB7XG5cdFx0XHR2YXIgdSA9IDIqdGhpcy5nZXRVbmlmb3JtKCktMTtcblx0XHRcdHZhciB2ID0gMip0aGlzLmdldFVuaWZvcm0oKS0xO1xuXHRcdFx0dmFyIHIgPSB1KnUgKyB2KnY7XG5cdFx0fSB3aGlsZSAociA+IDEgfHwgciA9PSAwKTtcblxuXHRcdHZhciBnYXVzcyA9IHUgKiBNYXRoLnNxcnQoLTIqTWF0aC5sb2cocikvcik7XG5cdFx0cmV0dXJuIChtZWFuIHx8IDApICsgZ2F1c3MqKHN0ZGRldiB8fCAxKTtcblx0fSxcblxuXHQvKipcblx0ICogQHJldHVybnMge2ludH0gUHNldWRvcmFuZG9tIHZhbHVlIFsxLDEwMF0gaW5jbHVzaXZlLCB1bmlmb3JtbHkgZGlzdHJpYnV0ZWRcblx0ICovXG5cdGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAxICsgTWF0aC5mbG9vcih0aGlzLmdldFVuaWZvcm0oKSoxMDApO1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGtleT13aGF0ZXZlciwgdmFsdWU9d2VpZ2h0IChyZWxhdGl2ZSBwcm9iYWJpbGl0eSlcblx0ICogQHJldHVybnMge3N0cmluZ30gd2hhdGV2ZXJcblx0ICovXG5cdGdldFdlaWdodGVkVmFsdWU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgdG90YWwgPSAwO1xuXHRcdFxuXHRcdGZvciAodmFyIGlkIGluIGRhdGEpIHtcblx0XHRcdHRvdGFsICs9IGRhdGFbaWRdO1xuXHRcdH1cblx0XHR2YXIgcmFuZG9tID0gdGhpcy5nZXRVbmlmb3JtKCkqdG90YWw7XG5cdFx0XG5cdFx0dmFyIHBhcnQgPSAwO1xuXHRcdGZvciAodmFyIGlkIGluIGRhdGEpIHtcblx0XHRcdHBhcnQgKz0gZGF0YVtpZF07XG5cdFx0XHRpZiAocmFuZG9tIDwgcGFydCkgeyByZXR1cm4gaWQ7IH1cblx0XHR9XG5cblx0XHQvLyBJZiBieSBzb21lIGZsb2F0aW5nLXBvaW50IGFubm95YW5jZSB3ZSBoYXZlXG5cdFx0Ly8gcmFuZG9tID49IHRvdGFsLCBqdXN0IHJldHVybiB0aGUgbGFzdCBpZC5cblx0XHRyZXR1cm4gaWQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCBSTkcgc3RhdGUuIFVzZWZ1bCBmb3Igc3RvcmluZyB0aGUgc3RhdGUgYW5kIHJlLXNldHRpbmcgaXQgdmlhIHNldFN0YXRlLlxuXHQgKiBAcmV0dXJucyB7P30gSW50ZXJuYWwgc3RhdGVcblx0ICovXG5cdGdldFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gW3RoaXMuX3MwLCB0aGlzLl9zMSwgdGhpcy5fczIsIHRoaXMuX2NdO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTZXQgYSBwcmV2aW91c2x5IHJldHJpZXZlZCBzdGF0ZS5cblx0ICogQHBhcmFtIHs/fSBzdGF0ZVxuXHQgKi9cblx0c2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlKSB7XG5cdFx0dGhpcy5fczAgPSBzdGF0ZVswXTtcblx0XHR0aGlzLl9zMSA9IHN0YXRlWzFdO1xuXHRcdHRoaXMuX3MyID0gc3RhdGVbMl07XG5cdFx0dGhpcy5fYyAgPSBzdGF0ZVszXTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJucyBhIGNsb25lZCBSTkdcblx0ICovXG5cdGNsb25lOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xvbmUgPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xuXHRcdGNsb25lLnNldFN0YXRlKHRoaXMuZ2V0U3RhdGUoKSk7XG5cdFx0cmV0dXJuIGNsb25lO1xuXHR9LFxuXG5cdF9zMDogMCxcblx0X3MxOiAwLFxuXHRfczI6IDAsXG5cdF9jOiAwLFxuXHRfZnJhYzogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMCAvKiAyXi0zMiAqL1xufVxuXG5ST1QuUk5HLnNldFNlZWQoRGF0ZS5ub3coKSk7XG4vKipcbiAqIEBjbGFzcyAoTWFya292IHByb2Nlc3MpLWJhc2VkIHN0cmluZyBnZW5lcmF0b3IuIFxuICogQ29waWVkIGZyb20gYSA8YSBocmVmPVwiaHR0cDovL3d3dy5yb2d1ZWJhc2luLnJvZ3VlbGlrZWRldmVsb3BtZW50Lm9yZy9pbmRleC5waHA/dGl0bGU9TmFtZXNfZnJvbV9hX2hpZ2hfb3JkZXJfTWFya292X1Byb2Nlc3NfYW5kX2Ffc2ltcGxpZmllZF9LYXR6X2JhY2stb2ZmX3NjaGVtZVwiPlJvZ3VlQmFzaW4gYXJ0aWNsZTwvYT4uIFxuICogT2ZmZXJzIGNvbmZpZ3VyYWJsZSBvcmRlciBhbmQgcHJpb3IuXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge2Jvb2x9IFtvcHRpb25zLndvcmRzPWZhbHNlXSBVc2Ugd29yZCBtb2RlP1xuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLm9yZGVyPTNdXG4gKiBAcGFyYW0ge2Zsb2F0fSBbb3B0aW9ucy5wcmlvcj0wLjAwMV1cbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHR3b3JkczogZmFsc2UsXG5cdFx0b3JkZXI6IDMsXG5cdFx0cHJpb3I6IDAuMDAxXG5cdH1cblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cblx0dGhpcy5fYm91bmRhcnkgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDApO1xuXHR0aGlzLl9zdWZmaXggPSB0aGlzLl9ib3VuZGFyeTtcblx0dGhpcy5fcHJlZml4ID0gW107XG5cdGZvciAodmFyIGk9MDtpPHRoaXMuX29wdGlvbnMub3JkZXI7aSsrKSB7IHRoaXMuX3ByZWZpeC5wdXNoKHRoaXMuX2JvdW5kYXJ5KTsgfVxuXG5cdHRoaXMuX3ByaW9yVmFsdWVzID0ge307XG5cdHRoaXMuX3ByaW9yVmFsdWVzW3RoaXMuX2JvdW5kYXJ5XSA9IHRoaXMuX29wdGlvbnMucHJpb3I7XG5cblx0dGhpcy5fZGF0YSA9IHt9O1xufVxuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGVhcm5pbmcgZGF0YVxuICovXG5ST1QuU3RyaW5nR2VuZXJhdG9yLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9kYXRhID0ge307XG5cdHRoaXMuX3ByaW9yVmFsdWVzID0ge307XG59XG5cbi8qKlxuICogQHJldHVybnMge3N0cmluZ30gR2VuZXJhdGVkIHN0cmluZ1xuICovXG5ST1QuU3RyaW5nR2VuZXJhdG9yLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgcmVzdWx0ID0gW3RoaXMuX3NhbXBsZSh0aGlzLl9wcmVmaXgpXTtcblx0d2hpbGUgKHJlc3VsdFtyZXN1bHQubGVuZ3RoLTFdICE9IHRoaXMuX2JvdW5kYXJ5KSB7XG5cdFx0cmVzdWx0LnB1c2godGhpcy5fc2FtcGxlKHJlc3VsdCkpO1xuXHR9XG5cdHJldHVybiB0aGlzLl9qb2luKHJlc3VsdC5zbGljZSgwLCAtMSkpO1xufVxuXG4vKipcbiAqIE9ic2VydmUgKGxlYXJuKSBhIHN0cmluZyBmcm9tIGEgdHJhaW5pbmcgc2V0XG4gKi9cblJPVC5TdHJpbmdHZW5lcmF0b3IucHJvdG90eXBlLm9ic2VydmUgPSBmdW5jdGlvbihzdHJpbmcpIHtcblx0dmFyIHRva2VucyA9IHRoaXMuX3NwbGl0KHN0cmluZyk7XG5cblx0Zm9yICh2YXIgaT0wOyBpPHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXMuX3ByaW9yVmFsdWVzW3Rva2Vuc1tpXV0gPSB0aGlzLl9vcHRpb25zLnByaW9yO1xuXHR9XG5cblx0dG9rZW5zID0gdGhpcy5fcHJlZml4LmNvbmNhdCh0b2tlbnMpLmNvbmNhdCh0aGlzLl9zdWZmaXgpOyAvKiBhZGQgYm91bmRhcnkgc3ltYm9scyAqL1xuXG5cdGZvciAodmFyIGk9dGhpcy5fb3B0aW9ucy5vcmRlcjsgaTx0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgY29udGV4dCA9IHRva2Vucy5zbGljZShpLXRoaXMuX29wdGlvbnMub3JkZXIsIGkpO1xuXHRcdHZhciBldmVudCA9IHRva2Vuc1tpXTtcblx0XHRmb3IgKHZhciBqPTA7IGo8Y29udGV4dC5sZW5ndGg7IGorKykge1xuXHRcdFx0dmFyIHN1YmNvbnRleHQgPSBjb250ZXh0LnNsaWNlKGopO1xuXHRcdFx0dGhpcy5fb2JzZXJ2ZUV2ZW50KHN1YmNvbnRleHQsIGV2ZW50KTtcblx0XHR9XG5cdH1cbn1cblxuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuZ2V0U3RhdHMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHBhcnRzID0gW107XG5cblx0dmFyIHByaW9yQ291bnQgPSAwO1xuXHRmb3IgKHZhciBwIGluIHRoaXMuX3ByaW9yVmFsdWVzKSB7IHByaW9yQ291bnQrKzsgfVxuXHRwcmlvckNvdW50LS07IC8qIGJvdW5kYXJ5ICovXG5cdHBhcnRzLnB1c2goXCJkaXN0aW5jdCBzYW1wbGVzOiBcIiArIHByaW9yQ291bnQpO1xuXG5cdHZhciBkYXRhQ291bnQgPSAwO1xuXHR2YXIgZXZlbnRDb3VudCA9IDA7XG5cdGZvciAodmFyIHAgaW4gdGhpcy5fZGF0YSkgeyBcblx0XHRkYXRhQ291bnQrKzsgXG5cdFx0Zm9yICh2YXIga2V5IGluIHRoaXMuX2RhdGFbcF0pIHtcblx0XHRcdGV2ZW50Q291bnQrKztcblx0XHR9XG5cdH1cblx0cGFydHMucHVzaChcImRpY3Rpb25hcnkgc2l6ZSAoY29udGV4dHMpOiBcIiArIGRhdGFDb3VudCk7XG5cdHBhcnRzLnB1c2goXCJkaWN0aW9uYXJ5IHNpemUgKGV2ZW50cyk6IFwiICsgZXZlbnRDb3VudCk7XG5cblx0cmV0dXJuIHBhcnRzLmpvaW4oXCIsIFwiKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ31cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuX3NwbGl0ID0gZnVuY3Rpb24oc3RyKSB7XG5cdHJldHVybiBzdHIuc3BsaXQodGhpcy5fb3B0aW9ucy53b3JkcyA/IC9cXHMrLyA6IFwiXCIpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBcbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuX2pvaW4gPSBmdW5jdGlvbihhcnIpIHtcblx0cmV0dXJuIGFyci5qb2luKHRoaXMuX29wdGlvbnMud29yZHMgPyBcIiBcIiA6IFwiXCIpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119IGNvbnRleHRcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFxuICovXG5ST1QuU3RyaW5nR2VuZXJhdG9yLnByb3RvdHlwZS5fb2JzZXJ2ZUV2ZW50ID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHtcblx0dmFyIGtleSA9IHRoaXMuX2pvaW4oY29udGV4dCk7XG5cdGlmICghKGtleSBpbiB0aGlzLl9kYXRhKSkgeyB0aGlzLl9kYXRhW2tleV0gPSB7fTsgfVxuXHR2YXIgZGF0YSA9IHRoaXMuX2RhdGFba2V5XTtcblxuXHRpZiAoIShldmVudCBpbiBkYXRhKSkgeyBkYXRhW2V2ZW50XSA9IDA7IH1cblx0ZGF0YVtldmVudF0rKztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuX3NhbXBsZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcblx0Y29udGV4dCA9IHRoaXMuX2JhY2tvZmYoY29udGV4dCk7XG5cdHZhciBrZXkgPSB0aGlzLl9qb2luKGNvbnRleHQpO1xuXHR2YXIgZGF0YSA9IHRoaXMuX2RhdGFba2V5XTtcblxuXHR2YXIgYXZhaWxhYmxlID0ge307XG5cblx0aWYgKHRoaXMuX29wdGlvbnMucHJpb3IpIHtcblx0XHRmb3IgKHZhciBldmVudCBpbiB0aGlzLl9wcmlvclZhbHVlcykgeyBhdmFpbGFibGVbZXZlbnRdID0gdGhpcy5fcHJpb3JWYWx1ZXNbZXZlbnRdOyB9XG5cdFx0Zm9yICh2YXIgZXZlbnQgaW4gZGF0YSkgeyBhdmFpbGFibGVbZXZlbnRdICs9IGRhdGFbZXZlbnRdOyB9XG5cdH0gZWxzZSB7IFxuXHRcdGF2YWlsYWJsZSA9IGRhdGE7XG5cdH1cblxuXHRyZXR1cm4gUk9ULlJORy5nZXRXZWlnaHRlZFZhbHVlKGF2YWlsYWJsZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmdbXX1cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuUk9ULlN0cmluZ0dlbmVyYXRvci5wcm90b3R5cGUuX2JhY2tvZmYgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdGlmIChjb250ZXh0Lmxlbmd0aCA+IHRoaXMuX29wdGlvbnMub3JkZXIpIHtcblx0XHRjb250ZXh0ID0gY29udGV4dC5zbGljZSgtdGhpcy5fb3B0aW9ucy5vcmRlcik7XG5cdH0gZWxzZSBpZiAoY29udGV4dC5sZW5ndGggPCB0aGlzLl9vcHRpb25zLm9yZGVyKSB7XG5cdFx0Y29udGV4dCA9IHRoaXMuX3ByZWZpeC5zbGljZSgwLCB0aGlzLl9vcHRpb25zLm9yZGVyIC0gY29udGV4dC5sZW5ndGgpLmNvbmNhdChjb250ZXh0KTtcblx0fVxuXG5cdHdoaWxlICghKHRoaXMuX2pvaW4oY29udGV4dCkgaW4gdGhpcy5fZGF0YSkgJiYgY29udGV4dC5sZW5ndGggPiAwKSB7IGNvbnRleHQgPSBjb250ZXh0LnNsaWNlKDEpOyB9XG5cblx0cmV0dXJuIGNvbnRleHQ7XG59XG4vKipcbiAqIEBjbGFzcyBHZW5lcmljIGV2ZW50IHF1ZXVlOiBzdG9yZXMgZXZlbnRzIGFuZCByZXRyaWV2ZXMgdGhlbSBiYXNlZCBvbiB0aGVpciB0aW1lXG4gKi9cblJPVC5FdmVudFF1ZXVlID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX3RpbWUgPSAwO1xuXHR0aGlzLl9ldmVudHMgPSBbXTtcblx0dGhpcy5fZXZlbnRUaW1lcyA9IFtdO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHtudW1iZXJ9IEVsYXBzZWQgdGltZVxuICovXG5ST1QuRXZlbnRRdWV1ZS5wcm90b3R5cGUuZ2V0VGltZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fdGltZTtcbn1cblxuLyoqXG4gKiBDbGVhciBhbGwgc2NoZWR1bGVkIGV2ZW50c1xuICovXG5ST1QuRXZlbnRRdWV1ZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fZXZlbnRzID0gW107XG5cdHRoaXMuX2V2ZW50VGltZXMgPSBbXTtcblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogQHBhcmFtIHs/fSBldmVudFxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVcbiAqL1xuUk9ULkV2ZW50UXVldWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGV2ZW50LCB0aW1lKSB7XG5cdHZhciBpbmRleCA9IHRoaXMuX2V2ZW50cy5sZW5ndGg7XG5cdGZvciAodmFyIGk9MDtpPHRoaXMuX2V2ZW50VGltZXMubGVuZ3RoO2krKykge1xuXHRcdGlmICh0aGlzLl9ldmVudFRpbWVzW2ldID4gdGltZSkge1xuXHRcdFx0aW5kZXggPSBpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0dGhpcy5fZXZlbnRzLnNwbGljZShpbmRleCwgMCwgZXZlbnQpO1xuXHR0aGlzLl9ldmVudFRpbWVzLnNwbGljZShpbmRleCwgMCwgdGltZSk7XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgbmVhcmVzdCBldmVudCwgYWR2YW5jZXMgdGltZSBpZiBuZWNlc3NhcnkuIFJldHVybnMgdGhhdCBldmVudCBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBxdWV1ZS5cbiAqIEByZXR1cm5zIHs/IHx8IG51bGx9IFRoZSBldmVudCBwcmV2aW91c2x5IGFkZGVkIGJ5IGFkZEV2ZW50LCBudWxsIGlmIG5vIGV2ZW50IGF2YWlsYWJsZVxuICovXG5ST1QuRXZlbnRRdWV1ZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy5fZXZlbnRzLmxlbmd0aCkgeyByZXR1cm4gbnVsbDsgfVxuXG5cdHZhciB0aW1lID0gdGhpcy5fZXZlbnRUaW1lcy5zcGxpY2UoMCwgMSlbMF07XG5cdGlmICh0aW1lID4gMCkgeyAvKiBhZHZhbmNlICovXG5cdFx0dGhpcy5fdGltZSArPSB0aW1lO1xuXHRcdGZvciAodmFyIGk9MDtpPHRoaXMuX2V2ZW50VGltZXMubGVuZ3RoO2krKykgeyB0aGlzLl9ldmVudFRpbWVzW2ldIC09IHRpbWU7IH1cblx0fVxuXG5cdHJldHVybiB0aGlzLl9ldmVudHMuc3BsaWNlKDAsIDEpWzBdO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBmcm9tIHRoZSBxdWV1ZVxuICogQHBhcmFtIHs/fSBldmVudFxuICogQHJldHVybnMge2Jvb2x9IHN1Y2Nlc3M/XG4gKi9cblJPVC5FdmVudFF1ZXVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuXHR2YXIgaW5kZXggPSB0aGlzLl9ldmVudHMuaW5kZXhPZihldmVudCk7XG5cdGlmIChpbmRleCA9PSAtMSkgeyByZXR1cm4gZmFsc2UgfVxuXHR0aGlzLl9yZW1vdmUoaW5kZXgpO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgZnJvbSB0aGUgcXVldWVcbiAqIEBwYXJhbSB7aW50fSBpbmRleFxuICovXG5ST1QuRXZlbnRRdWV1ZS5wcm90b3R5cGUuX3JlbW92ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG5cdHRoaXMuX2V2ZW50cy5zcGxpY2UoaW5kZXgsIDEpO1xuXHR0aGlzLl9ldmVudFRpbWVzLnNwbGljZShpbmRleCwgMSk7XG59XG4vKipcbiAqIEBjbGFzcyBBYnN0cmFjdCBzY2hlZHVsZXJcbiAqL1xuUk9ULlNjaGVkdWxlciA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9xdWV1ZSA9IG5ldyBST1QuRXZlbnRRdWV1ZSgpO1xuXHR0aGlzLl9yZXBlYXQgPSBbXTtcblx0dGhpcy5fY3VycmVudCA9IG51bGw7XG59XG5cbi8qKlxuICogQHNlZSBST1QuRXZlbnRRdWV1ZSNnZXRUaW1lXG4gKi9cblJPVC5TY2hlZHVsZXIucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3F1ZXVlLmdldFRpbWUoKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gez99IGl0ZW1cbiAqIEBwYXJhbSB7Ym9vbH0gcmVwZWF0XG4gKi9cblJPVC5TY2hlZHVsZXIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGl0ZW0sIHJlcGVhdCkge1xuXHRpZiAocmVwZWF0KSB7IHRoaXMuX3JlcGVhdC5wdXNoKGl0ZW0pOyB9XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIENsZWFyIGFsbCBpdGVtc1xuICovXG5ST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9xdWV1ZS5jbGVhcigpO1xuXHR0aGlzLl9yZXBlYXQgPSBbXTtcblx0dGhpcy5fY3VycmVudCA9IG51bGw7XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhIHByZXZpb3VzbHkgYWRkZWQgaXRlbVxuICogQHBhcmFtIHs/fSBpdGVtXG4gKiBAcmV0dXJucyB7Ym9vbH0gc3VjY2Vzc2Z1bD9cbiAqL1xuUk9ULlNjaGVkdWxlci5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oaXRlbSkge1xuXHR2YXIgcmVzdWx0ID0gdGhpcy5fcXVldWUucmVtb3ZlKGl0ZW0pO1xuXG5cdHZhciBpbmRleCA9IHRoaXMuX3JlcGVhdC5pbmRleE9mKGl0ZW0pO1xuXHRpZiAoaW5kZXggIT0gLTEpIHsgdGhpcy5fcmVwZWF0LnNwbGljZShpbmRleCwgMSk7IH1cblxuXHRpZiAodGhpcy5fY3VycmVudCA9PSBpdGVtKSB7IHRoaXMuX2N1cnJlbnQgPSBudWxsOyB9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZSBuZXh0IGl0ZW1cbiAqIEByZXR1cm5zIHs/fVxuICovXG5ST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX2N1cnJlbnQgPSB0aGlzLl9xdWV1ZS5nZXQoKTtcblx0cmV0dXJuIHRoaXMuX2N1cnJlbnQ7XG59XG4vKipcbiAqIEBjbGFzcyBTaW1wbGUgZmFpciBzY2hlZHVsZXIgKHJvdW5kLXJvYmluIHN0eWxlKVxuICogQGF1Z21lbnRzIFJPVC5TY2hlZHVsZXJcbiAqL1xuUk9ULlNjaGVkdWxlci5TaW1wbGUgPSBmdW5jdGlvbigpIHtcblx0Uk9ULlNjaGVkdWxlci5jYWxsKHRoaXMpO1xufVxuUk9ULlNjaGVkdWxlci5TaW1wbGUuZXh0ZW5kKFJPVC5TY2hlZHVsZXIpO1xuXG4vKipcbiAqIEBzZWUgUk9ULlNjaGVkdWxlciNhZGRcbiAqL1xuUk9ULlNjaGVkdWxlci5TaW1wbGUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGl0ZW0sIHJlcGVhdCkge1xuXHR0aGlzLl9xdWV1ZS5hZGQoaXRlbSwgMCk7XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5hZGQuY2FsbCh0aGlzLCBpdGVtLCByZXBlYXQpO1xufVxuXG4vKipcbiAqIEBzZWUgUk9ULlNjaGVkdWxlciNuZXh0XG4gKi9cblJPVC5TY2hlZHVsZXIuU2ltcGxlLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG5cdGlmICh0aGlzLl9jdXJyZW50ICYmIHRoaXMuX3JlcGVhdC5pbmRleE9mKHRoaXMuX2N1cnJlbnQpICE9IC0xKSB7XG5cdFx0dGhpcy5fcXVldWUuYWRkKHRoaXMuX2N1cnJlbnQsIDApO1xuXHR9XG5cdHJldHVybiBST1QuU2NoZWR1bGVyLnByb3RvdHlwZS5uZXh0LmNhbGwodGhpcyk7XG59XG4vKipcbiAqIEBjbGFzcyBTcGVlZC1iYXNlZCBzY2hlZHVsZXJcbiAqIEBhdWdtZW50cyBST1QuU2NoZWR1bGVyXG4gKi9cblJPVC5TY2hlZHVsZXIuU3BlZWQgPSBmdW5jdGlvbigpIHtcblx0Uk9ULlNjaGVkdWxlci5jYWxsKHRoaXMpO1xufVxuUk9ULlNjaGVkdWxlci5TcGVlZC5leHRlbmQoUk9ULlNjaGVkdWxlcik7XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IGl0ZW0gYW55dGhpbmcgd2l0aCBcImdldFNwZWVkXCIgbWV0aG9kXG4gKiBAcGFyYW0ge2Jvb2x9IHJlcGVhdFxuICogQHNlZSBST1QuU2NoZWR1bGVyI2FkZFxuICovXG5ST1QuU2NoZWR1bGVyLlNwZWVkLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtLCByZXBlYXQpIHtcblx0dGhpcy5fcXVldWUuYWRkKGl0ZW0sIDEvaXRlbS5nZXRTcGVlZCgpKTtcblx0cmV0dXJuIFJPVC5TY2hlZHVsZXIucHJvdG90eXBlLmFkZC5jYWxsKHRoaXMsIGl0ZW0sIHJlcGVhdCk7XG59XG5cbi8qKlxuICogQHNlZSBST1QuU2NoZWR1bGVyI25leHRcbiAqL1xuUk9ULlNjaGVkdWxlci5TcGVlZC5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuXHRpZiAodGhpcy5fY3VycmVudCAmJiB0aGlzLl9yZXBlYXQuaW5kZXhPZih0aGlzLl9jdXJyZW50KSAhPSAtMSkge1xuXHRcdHRoaXMuX3F1ZXVlLmFkZCh0aGlzLl9jdXJyZW50LCAxL3RoaXMuX2N1cnJlbnQuZ2V0U3BlZWQoKSk7XG5cdH1cblx0cmV0dXJuIFJPVC5TY2hlZHVsZXIucHJvdG90eXBlLm5leHQuY2FsbCh0aGlzKTtcbn1cbi8qKlxuICogQGNsYXNzIEFjdGlvbi1iYXNlZCBzY2hlZHVsZXJcbiAqIEBhdWdtZW50cyBST1QuU2NoZWR1bGVyXG4gKi9cblJPVC5TY2hlZHVsZXIuQWN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFJPVC5TY2hlZHVsZXIuY2FsbCh0aGlzKTtcblx0dGhpcy5fZGVmYXVsdER1cmF0aW9uID0gMTsgLyogZm9yIG5ld2x5IGFkZGVkICovXG5cdHRoaXMuX2R1cmF0aW9uID0gdGhpcy5fZGVmYXVsdER1cmF0aW9uOyAvKiBmb3IgdGhpcy5fY3VycmVudCAqL1xufVxuUk9ULlNjaGVkdWxlci5BY3Rpb24uZXh0ZW5kKFJPVC5TY2hlZHVsZXIpO1xuXG4vKipcbiAqIEBwYXJhbSB7b2JqZWN0fSBpdGVtXG4gKiBAcGFyYW0ge2Jvb2x9IHJlcGVhdFxuICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lPTFdXG4gKiBAc2VlIFJPVC5TY2hlZHVsZXIjYWRkXG4gKi9cblJPVC5TY2hlZHVsZXIuQWN0aW9uLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihpdGVtLCByZXBlYXQsIHRpbWUpIHtcblx0dGhpcy5fcXVldWUuYWRkKGl0ZW0sIHRpbWUgfHwgdGhpcy5fZGVmYXVsdER1cmF0aW9uKTtcblx0cmV0dXJuIFJPVC5TY2hlZHVsZXIucHJvdG90eXBlLmFkZC5jYWxsKHRoaXMsIGl0ZW0sIHJlcGVhdCk7XG59XG5cblJPVC5TY2hlZHVsZXIuQWN0aW9uLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9kdXJhdGlvbiA9IHRoaXMuX2RlZmF1bHREdXJhdGlvbjtcblx0cmV0dXJuIFJPVC5TY2hlZHVsZXIucHJvdG90eXBlLmNsZWFyLmNhbGwodGhpcyk7XG59XG5cblJPVC5TY2hlZHVsZXIuQWN0aW9uLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihpdGVtKSB7XG5cdGlmIChpdGVtID09IHRoaXMuX2N1cnJlbnQpIHsgdGhpcy5fZHVyYXRpb24gPSB0aGlzLl9kZWZhdWx0RHVyYXRpb247IH1cblx0cmV0dXJuIFJPVC5TY2hlZHVsZXIucHJvdG90eXBlLnJlbW92ZS5jYWxsKHRoaXMsIGl0ZW0pO1xufVxuXG4vKipcbiAqIEBzZWUgUk9ULlNjaGVkdWxlciNuZXh0XG4gKi9cblJPVC5TY2hlZHVsZXIuQWN0aW9uLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24oKSB7XG5cdGlmICh0aGlzLl9jdXJyZW50ICYmIHRoaXMuX3JlcGVhdC5pbmRleE9mKHRoaXMuX2N1cnJlbnQpICE9IC0xKSB7XG5cdFx0dGhpcy5fcXVldWUuYWRkKHRoaXMuX2N1cnJlbnQsIHRoaXMuX2R1cmF0aW9uIHx8IHRoaXMuX2RlZmF1bHREdXJhdGlvbik7XG5cdFx0dGhpcy5fZHVyYXRpb24gPSB0aGlzLl9kZWZhdWx0RHVyYXRpb247XG5cdH1cblx0cmV0dXJuIFJPVC5TY2hlZHVsZXIucHJvdG90eXBlLm5leHQuY2FsbCh0aGlzKTtcbn1cblxuLyoqXG4gKiBTZXQgZHVyYXRpb24gZm9yIHRoZSBhY3RpdmUgaXRlbVxuICovXG5ST1QuU2NoZWR1bGVyLkFjdGlvbi5wcm90b3R5cGUuc2V0RHVyYXRpb24gPSBmdW5jdGlvbih0aW1lKSB7XG5cdGlmICh0aGlzLl9jdXJyZW50KSB7IHRoaXMuX2R1cmF0aW9uID0gdGltZTsgfVxuXHRyZXR1cm4gdGhpcztcbn1cbi8qKlxuICogQGNsYXNzIEFzeW5jaHJvbm91cyBtYWluIGxvb3BcbiAqIEBwYXJhbSB7Uk9ULlNjaGVkdWxlcn0gc2NoZWR1bGVyXG4gKi9cblJPVC5FbmdpbmUgPSBmdW5jdGlvbihzY2hlZHVsZXIpIHtcblx0dGhpcy5fc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuXHR0aGlzLl9sb2NrID0gMTtcbn1cblxuLyoqXG4gKiBTdGFydCB0aGUgbWFpbiBsb29wLiBXaGVuIHRoaXMgY2FsbCByZXR1cm5zLCB0aGUgbG9vcCBpcyBsb2NrZWQuXG4gKi9cblJPVC5FbmdpbmUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLnVubG9jaygpO1xufVxuXG4vKipcbiAqIEludGVycnVwdCB0aGUgZW5naW5lIGJ5IGFuIGFzeW5jaHJvbm91cyBhY3Rpb25cbiAqL1xuUk9ULkVuZ2luZS5wcm90b3R5cGUubG9jayA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9sb2NrKys7XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlc3VtZSBleGVjdXRpb24gKHBhdXNlZCBieSBhIHByZXZpb3VzIGxvY2spXG4gKi9cblJPVC5FbmdpbmUucHJvdG90eXBlLnVubG9jayA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMuX2xvY2spIHsgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHVubG9jayB1bmxvY2tlZCBlbmdpbmVcIik7IH1cblx0dGhpcy5fbG9jay0tO1xuXG5cdHdoaWxlICghdGhpcy5fbG9jaykge1xuXHRcdHZhciBhY3RvciA9IHRoaXMuX3NjaGVkdWxlci5uZXh0KCk7XG5cdFx0aWYgKCFhY3RvcikgeyByZXR1cm4gdGhpcy5sb2NrKCk7IH0gLyogbm8gYWN0b3JzICovXG5cdFx0dmFyIHJlc3VsdCA9IGFjdG9yLmFjdCgpO1xuXHRcdGlmIChyZXN1bHQgJiYgcmVzdWx0LnRoZW4pIHsgLyogYWN0b3IgcmV0dXJuZWQgYSBcInRoZW5hYmxlXCIsIGxvb2tzIGxpa2UgYSBQcm9taXNlICovXG5cdFx0XHR0aGlzLmxvY2soKTtcblx0XHRcdHJlc3VsdC50aGVuKHRoaXMudW5sb2NrLmJpbmQodGhpcykpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuLyoqXG4gKiBAY2xhc3MgQmFzZSBtYXAgZ2VuZXJhdG9yXG4gKiBAcGFyYW0ge2ludH0gW3dpZHRoPVJPVC5ERUZBVUxUX1dJRFRIXVxuICogQHBhcmFtIHtpbnR9IFtoZWlnaHQ9Uk9ULkRFRkFVTFRfSEVJR0hUXVxuICovXG5ST1QuTWFwID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuXHR0aGlzLl93aWR0aCA9IHdpZHRoIHx8IFJPVC5ERUZBVUxUX1dJRFRIO1xuXHR0aGlzLl9oZWlnaHQgPSBoZWlnaHQgfHwgUk9ULkRFRkFVTFRfSEVJR0hUO1xufTtcblxuUk9ULk1hcC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHt9XG5cblJPVC5NYXAucHJvdG90eXBlLl9maWxsTWFwID0gZnVuY3Rpb24odmFsdWUpIHtcblx0dmFyIG1hcCA9IFtdO1xuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl93aWR0aDtpKyspIHtcblx0XHRtYXAucHVzaChbXSk7XG5cdFx0Zm9yICh2YXIgaj0wO2o8dGhpcy5faGVpZ2h0O2orKykgeyBtYXBbaV0ucHVzaCh2YWx1ZSk7IH1cblx0fVxuXHRyZXR1cm4gbWFwO1xufVxuLyoqXG4gKiBAY2xhc3MgU2ltcGxlIGVtcHR5IHJlY3Rhbmd1bGFyIHJvb21cbiAqIEBhdWdtZW50cyBST1QuTWFwXG4gKi9cblJPVC5NYXAuQXJlbmEgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG5cdFJPVC5NYXAuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcbn1cblJPVC5NYXAuQXJlbmEuZXh0ZW5kKFJPVC5NYXApO1xuXG5ST1QuTWFwLkFyZW5hLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHR2YXIgdyA9IHRoaXMuX3dpZHRoLTE7XG5cdHZhciBoID0gdGhpcy5faGVpZ2h0LTE7XG5cdGZvciAodmFyIGk9MDtpPD13O2krKykge1xuXHRcdGZvciAodmFyIGo9MDtqPD1oO2orKykge1xuXHRcdFx0dmFyIGVtcHR5ID0gKGkgJiYgaiAmJiBpPHcgJiYgajxoKTtcblx0XHRcdGNhbGxiYWNrKGksIGosIGVtcHR5ID8gMCA6IDEpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gdGhpcztcbn1cbi8qKlxuICogQGNsYXNzIFJlY3Vyc2l2ZWx5IGRpdmlkZWQgbWF6ZSwgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NYXplX2dlbmVyYXRpb25fYWxnb3JpdGhtI1JlY3Vyc2l2ZV9kaXZpc2lvbl9tZXRob2RcbiAqIEBhdWdtZW50cyBST1QuTWFwXG4gKi9cblJPVC5NYXAuRGl2aWRlZE1hemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG5cdFJPVC5NYXAuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcblx0dGhpcy5fc3RhY2sgPSBbXTtcbn1cblJPVC5NYXAuRGl2aWRlZE1hemUuZXh0ZW5kKFJPVC5NYXApO1xuXG5ST1QuTWFwLkRpdmlkZWRNYXplLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHR2YXIgdyA9IHRoaXMuX3dpZHRoO1xuXHR2YXIgaCA9IHRoaXMuX2hlaWdodDtcblx0XG5cdHRoaXMuX21hcCA9IFtdO1xuXHRcblx0Zm9yICh2YXIgaT0wO2k8dztpKyspIHtcblx0XHR0aGlzLl9tYXAucHVzaChbXSk7XG5cdFx0Zm9yICh2YXIgaj0wO2o8aDtqKyspIHtcblx0XHRcdHZhciBib3JkZXIgPSAoaSA9PSAwIHx8IGogPT0gMCB8fCBpKzEgPT0gdyB8fCBqKzEgPT0gaCk7XG5cdFx0XHR0aGlzLl9tYXBbaV0ucHVzaChib3JkZXIgPyAxIDogMCk7XG5cdFx0fVxuXHR9XG5cdFxuXHR0aGlzLl9zdGFjayA9IFtcblx0XHRbMSwgMSwgdy0yLCBoLTJdXG5cdF07XG5cdHRoaXMuX3Byb2Nlc3MoKTtcblx0XG5cdGZvciAodmFyIGk9MDtpPHc7aSsrKSB7XG5cdFx0Zm9yICh2YXIgaj0wO2o8aDtqKyspIHtcblx0XHRcdGNhbGxiYWNrKGksIGosIHRoaXMuX21hcFtpXVtqXSk7XG5cdFx0fVxuXHR9XG5cdHRoaXMuX21hcCA9IG51bGw7XG5cdHJldHVybiB0aGlzO1xufVxuXG5ST1QuTWFwLkRpdmlkZWRNYXplLnByb3RvdHlwZS5fcHJvY2VzcyA9IGZ1bmN0aW9uKCkge1xuXHR3aGlsZSAodGhpcy5fc3RhY2subGVuZ3RoKSB7XG5cdFx0dmFyIHJvb20gPSB0aGlzLl9zdGFjay5zaGlmdCgpOyAvKiBbbGVmdCwgdG9wLCByaWdodCwgYm90dG9tXSAqL1xuXHRcdHRoaXMuX3BhcnRpdGlvblJvb20ocm9vbSk7XG5cdH1cbn1cblxuUk9ULk1hcC5EaXZpZGVkTWF6ZS5wcm90b3R5cGUuX3BhcnRpdGlvblJvb20gPSBmdW5jdGlvbihyb29tKSB7XG5cdHZhciBhdmFpbFggPSBbXTtcblx0dmFyIGF2YWlsWSA9IFtdO1xuXHRcblx0Zm9yICh2YXIgaT1yb29tWzBdKzE7aTxyb29tWzJdO2krKykge1xuXHRcdHZhciB0b3AgPSB0aGlzLl9tYXBbaV1bcm9vbVsxXS0xXTtcblx0XHR2YXIgYm90dG9tID0gdGhpcy5fbWFwW2ldW3Jvb21bM10rMV07XG5cdFx0aWYgKHRvcCAmJiBib3R0b20gJiYgIShpICUgMikpIHsgYXZhaWxYLnB1c2goaSk7IH1cblx0fVxuXHRcblx0Zm9yICh2YXIgaj1yb29tWzFdKzE7ajxyb29tWzNdO2orKykge1xuXHRcdHZhciBsZWZ0ID0gdGhpcy5fbWFwW3Jvb21bMF0tMV1bal07XG5cdFx0dmFyIHJpZ2h0ID0gdGhpcy5fbWFwW3Jvb21bMl0rMV1bal07XG5cdFx0aWYgKGxlZnQgJiYgcmlnaHQgJiYgIShqICUgMikpIHsgYXZhaWxZLnB1c2goaik7IH1cblx0fVxuXG5cdGlmICghYXZhaWxYLmxlbmd0aCB8fCAhYXZhaWxZLmxlbmd0aCkgeyByZXR1cm47IH1cblxuXHR2YXIgeCA9IGF2YWlsWC5yYW5kb20oKTtcblx0dmFyIHkgPSBhdmFpbFkucmFuZG9tKCk7XG5cdFxuXHR0aGlzLl9tYXBbeF1beV0gPSAxO1xuXHRcblx0dmFyIHdhbGxzID0gW107XG5cdFxuXHR2YXIgdyA9IFtdOyB3YWxscy5wdXNoKHcpOyAvKiBsZWZ0IHBhcnQgKi9cblx0Zm9yICh2YXIgaT1yb29tWzBdOyBpPHg7IGkrKykgeyBcblx0XHR0aGlzLl9tYXBbaV1beV0gPSAxO1xuXHRcdHcucHVzaChbaSwgeV0pOyBcblx0fVxuXHRcblx0dmFyIHcgPSBbXTsgd2FsbHMucHVzaCh3KTsgLyogcmlnaHQgcGFydCAqL1xuXHRmb3IgKHZhciBpPXgrMTsgaTw9cm9vbVsyXTsgaSsrKSB7IFxuXHRcdHRoaXMuX21hcFtpXVt5XSA9IDE7XG5cdFx0dy5wdXNoKFtpLCB5XSk7IFxuXHR9XG5cblx0dmFyIHcgPSBbXTsgd2FsbHMucHVzaCh3KTsgLyogdG9wIHBhcnQgKi9cblx0Zm9yICh2YXIgaj1yb29tWzFdOyBqPHk7IGorKykgeyBcblx0XHR0aGlzLl9tYXBbeF1bal0gPSAxO1xuXHRcdHcucHVzaChbeCwgal0pOyBcblx0fVxuXHRcblx0dmFyIHcgPSBbXTsgd2FsbHMucHVzaCh3KTsgLyogYm90dG9tIHBhcnQgKi9cblx0Zm9yICh2YXIgaj15KzE7IGo8PXJvb21bM107IGorKykgeyBcblx0XHR0aGlzLl9tYXBbeF1bal0gPSAxO1xuXHRcdHcucHVzaChbeCwgal0pOyBcblx0fVxuXHRcdFxuXHR2YXIgc29saWQgPSB3YWxscy5yYW5kb20oKTtcblx0Zm9yICh2YXIgaT0wO2k8d2FsbHMubGVuZ3RoO2krKykge1xuXHRcdHZhciB3ID0gd2FsbHNbaV07XG5cdFx0aWYgKHcgPT0gc29saWQpIHsgY29udGludWU7IH1cblx0XHRcblx0XHR2YXIgaG9sZSA9IHcucmFuZG9tKCk7XG5cdFx0dGhpcy5fbWFwW2hvbGVbMF1dW2hvbGVbMV1dID0gMDtcblx0fVxuXG5cdHRoaXMuX3N0YWNrLnB1c2goW3Jvb21bMF0sIHJvb21bMV0sIHgtMSwgeS0xXSk7IC8qIGxlZnQgdG9wICovXG5cdHRoaXMuX3N0YWNrLnB1c2goW3grMSwgcm9vbVsxXSwgcm9vbVsyXSwgeS0xXSk7IC8qIHJpZ2h0IHRvcCAqL1xuXHR0aGlzLl9zdGFjay5wdXNoKFtyb29tWzBdLCB5KzEsIHgtMSwgcm9vbVszXV0pOyAvKiBsZWZ0IGJvdHRvbSAqL1xuXHR0aGlzLl9zdGFjay5wdXNoKFt4KzEsIHkrMSwgcm9vbVsyXSwgcm9vbVszXV0pOyAvKiByaWdodCBib3R0b20gKi9cbn1cbi8qKlxuICogQGNsYXNzIEljZXkncyBNYXplIGdlbmVyYXRvclxuICogU2VlIGh0dHA6Ly93d3cucm9ndWViYXNpbi5yb2d1ZWxpa2VkZXZlbG9wbWVudC5vcmcvaW5kZXgucGhwP3RpdGxlPVNpbXBsZV9tYXplIGZvciBleHBsYW5hdGlvblxuICogQGF1Z21lbnRzIFJPVC5NYXBcbiAqL1xuUk9ULk1hcC5JY2V5TWF6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIHJlZ3VsYXJpdHkpIHtcblx0Uk9ULk1hcC5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xuXHR0aGlzLl9yZWd1bGFyaXR5ID0gcmVndWxhcml0eSB8fCAwO1xufVxuUk9ULk1hcC5JY2V5TWF6ZS5leHRlbmQoUk9ULk1hcCk7XG5cblJPVC5NYXAuSWNleU1hemUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdHZhciB3aWR0aCA9IHRoaXMuX3dpZHRoO1xuXHR2YXIgaGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xuXHRcblx0dmFyIG1hcCA9IHRoaXMuX2ZpbGxNYXAoMSk7XG5cdFxuXHR3aWR0aCAtPSAod2lkdGggJSAyID8gMSA6IDIpO1xuXHRoZWlnaHQgLT0gKGhlaWdodCAlIDIgPyAxIDogMik7XG5cblx0dmFyIGN4ID0gMDtcblx0dmFyIGN5ID0gMDtcblx0dmFyIG54ID0gMDtcblx0dmFyIG55ID0gMDtcblxuXHR2YXIgZG9uZSA9IDA7XG5cdHZhciBibG9ja2VkID0gZmFsc2U7XG5cdHZhciBkaXJzID0gW1xuXHRcdFswLCAwXSxcblx0XHRbMCwgMF0sXG5cdFx0WzAsIDBdLFxuXHRcdFswLCAwXVxuXHRdO1xuXHRkbyB7XG5cdFx0Y3ggPSAxICsgMipNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpKih3aWR0aC0xKSAvIDIpO1xuXHRcdGN5ID0gMSArIDIqTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSooaGVpZ2h0LTEpIC8gMik7XG5cblx0XHRpZiAoIWRvbmUpIHsgbWFwW2N4XVtjeV0gPSAwOyB9XG5cdFx0XG5cdFx0aWYgKCFtYXBbY3hdW2N5XSkge1xuXHRcdFx0dGhpcy5fcmFuZG9taXplKGRpcnMpO1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAoTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSoodGhpcy5fcmVndWxhcml0eSsxKSkgPT0gMCkgeyB0aGlzLl9yYW5kb21pemUoZGlycyk7IH1cblx0XHRcdFx0YmxvY2tlZCA9IHRydWU7XG5cdFx0XHRcdGZvciAodmFyIGk9MDtpPDQ7aSsrKSB7XG5cdFx0XHRcdFx0bnggPSBjeCArIGRpcnNbaV1bMF0qMjtcblx0XHRcdFx0XHRueSA9IGN5ICsgZGlyc1tpXVsxXSoyO1xuXHRcdFx0XHRcdGlmICh0aGlzLl9pc0ZyZWUobWFwLCBueCwgbnksIHdpZHRoLCBoZWlnaHQpKSB7XG5cdFx0XHRcdFx0XHRtYXBbbnhdW255XSA9IDA7XG5cdFx0XHRcdFx0XHRtYXBbY3ggKyBkaXJzW2ldWzBdXVtjeSArIGRpcnNbaV1bMV1dID0gMDtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Y3ggPSBueDtcblx0XHRcdFx0XHRcdGN5ID0gbnk7XG5cdFx0XHRcdFx0XHRibG9ja2VkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRkb25lKys7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKCFibG9ja2VkKTtcblx0XHR9XG5cdH0gd2hpbGUgKGRvbmUrMSA8IHdpZHRoKmhlaWdodC80KTtcblx0XG5cdGZvciAodmFyIGk9MDtpPHRoaXMuX3dpZHRoO2krKykge1xuXHRcdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHtcblx0XHRcdGNhbGxiYWNrKGksIGosIG1hcFtpXVtqXSk7XG5cdFx0fVxuXHR9XG5cdHRoaXMuX21hcCA9IG51bGw7XG5cdHJldHVybiB0aGlzO1xufVxuXG5ST1QuTWFwLkljZXlNYXplLnByb3RvdHlwZS5fcmFuZG9taXplID0gZnVuY3Rpb24oZGlycykge1xuXHRmb3IgKHZhciBpPTA7aTw0O2krKykge1xuXHRcdGRpcnNbaV1bMF0gPSAwO1xuXHRcdGRpcnNbaV1bMV0gPSAwO1xuXHR9XG5cdFxuXHRzd2l0Y2ggKE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkqNCkpIHtcblx0XHRjYXNlIDA6XG5cdFx0XHRkaXJzWzBdWzBdID0gLTE7IGRpcnNbMV1bMF0gPSAxO1xuXHRcdFx0ZGlyc1syXVsxXSA9IC0xOyBkaXJzWzNdWzFdID0gMTtcblx0XHRicmVhaztcblx0XHRjYXNlIDE6XG5cdFx0XHRkaXJzWzNdWzBdID0gLTE7IGRpcnNbMl1bMF0gPSAxO1xuXHRcdFx0ZGlyc1sxXVsxXSA9IC0xOyBkaXJzWzBdWzFdID0gMTtcblx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRkaXJzWzJdWzBdID0gLTE7IGRpcnNbM11bMF0gPSAxO1xuXHRcdFx0ZGlyc1swXVsxXSA9IC0xOyBkaXJzWzFdWzFdID0gMTtcblx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRkaXJzWzFdWzBdID0gLTE7IGRpcnNbMF1bMF0gPSAxO1xuXHRcdFx0ZGlyc1szXVsxXSA9IC0xOyBkaXJzWzJdWzFdID0gMTtcblx0XHRicmVhaztcblx0fVxufVxuXG5ST1QuTWFwLkljZXlNYXplLnByb3RvdHlwZS5faXNGcmVlID0gZnVuY3Rpb24obWFwLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdGlmICh4IDwgMSB8fCB5IDwgMSB8fCB4ID49IHdpZHRoIHx8IHkgPj0gaGVpZ2h0KSB7IHJldHVybiBmYWxzZTsgfVxuXHRyZXR1cm4gbWFwW3hdW3ldO1xufVxuLyoqXG4gKiBAY2xhc3MgTWF6ZSBnZW5lcmF0b3IgLSBFbGxlcidzIGFsZ29yaXRobVxuICogU2VlIGh0dHA6Ly9ob21lcGFnZXMuY3dpLm5sL350cm9tcC9tYXplLmh0bWwgZm9yIGV4cGxhbmF0aW9uXG4gKiBAYXVnbWVudHMgUk9ULk1hcFxuICovXG5ST1QuTWFwLkVsbGVyTWF6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcblx0Uk9ULk1hcC5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xufVxuUk9ULk1hcC5FbGxlck1hemUuZXh0ZW5kKFJPVC5NYXApO1xuXG5ST1QuTWFwLkVsbGVyTWF6ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dmFyIG1hcCA9IHRoaXMuX2ZpbGxNYXAoMSk7XG5cdHZhciB3ID0gTWF0aC5jZWlsKCh0aGlzLl93aWR0aC0yKS8yKTtcblx0XG5cdHZhciByYW5kID0gOS8yNDtcblx0XG5cdHZhciBMID0gW107XG5cdHZhciBSID0gW107XG5cdFxuXHRmb3IgKHZhciBpPTA7aTx3O2krKykge1xuXHRcdEwucHVzaChpKTtcblx0XHRSLnB1c2goaSk7XG5cdH1cblx0TC5wdXNoKHctMSk7IC8qIGZha2Ugc3RvcC1ibG9jayBhdCB0aGUgcmlnaHQgc2lkZSAqL1xuXG5cdGZvciAodmFyIGo9MTtqKzM8dGhpcy5faGVpZ2h0O2orPTIpIHtcblx0XHQvKiBvbmUgcm93ICovXG5cdFx0Zm9yICh2YXIgaT0wO2k8dztpKyspIHtcblx0XHRcdC8qIGNlbGwgY29vcmRzICh3aWxsIGJlIGFsd2F5cyBlbXB0eSkgKi9cblx0XHRcdHZhciB4ID0gMippKzE7XG5cdFx0XHR2YXIgeSA9IGo7XG5cdFx0XHRtYXBbeF1beV0gPSAwO1xuXHRcdFx0XG5cdFx0XHQvKiByaWdodCBjb25uZWN0aW9uICovXG5cdFx0XHRpZiAoaSAhPSBMW2krMV0gJiYgUk9ULlJORy5nZXRVbmlmb3JtKCkgPiByYW5kKSB7XG5cdFx0XHRcdHRoaXMuX2FkZFRvTGlzdChpLCBMLCBSKTtcblx0XHRcdFx0bWFwW3grMV1beV0gPSAwO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvKiBib3R0b20gY29ubmVjdGlvbiAqL1xuXHRcdFx0aWYgKGkgIT0gTFtpXSAmJiBST1QuUk5HLmdldFVuaWZvcm0oKSA+IHJhbmQpIHtcblx0XHRcdFx0LyogcmVtb3ZlIGNvbm5lY3Rpb24gKi9cblx0XHRcdFx0dGhpcy5fcmVtb3ZlRnJvbUxpc3QoaSwgTCwgUik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvKiBjcmVhdGUgY29ubmVjdGlvbiAqL1xuXHRcdFx0XHRtYXBbeF1beSsxXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyogbGFzdCByb3cgKi9cblx0Zm9yICh2YXIgaT0wO2k8dztpKyspIHtcblx0XHQvKiBjZWxsIGNvb3JkcyAod2lsbCBiZSBhbHdheXMgZW1wdHkpICovXG5cdFx0dmFyIHggPSAyKmkrMTtcblx0XHR2YXIgeSA9IGo7XG5cdFx0bWFwW3hdW3ldID0gMDtcblx0XHRcblx0XHQvKiByaWdodCBjb25uZWN0aW9uICovXG5cdFx0aWYgKGkgIT0gTFtpKzFdICYmIChpID09IExbaV0gfHwgUk9ULlJORy5nZXRVbmlmb3JtKCkgPiByYW5kKSkge1xuXHRcdFx0LyogZGlnIHJpZ2h0IGFsc28gaWYgdGhlIGNlbGwgaXMgc2VwYXJhdGVkLCBzbyBpdCBnZXRzIGNvbm5lY3RlZCB0byB0aGUgcmVzdCBvZiBtYXplICovXG5cdFx0XHR0aGlzLl9hZGRUb0xpc3QoaSwgTCwgUik7XG5cdFx0XHRtYXBbeCsxXVt5XSA9IDA7XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuX3JlbW92ZUZyb21MaXN0KGksIEwsIFIpO1xuXHR9XG5cdFxuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl93aWR0aDtpKyspIHtcblx0XHRmb3IgKHZhciBqPTA7ajx0aGlzLl9oZWlnaHQ7aisrKSB7XG5cdFx0XHRjYWxsYmFjayhpLCBqLCBtYXBbaV1bal0pO1xuXHRcdH1cblx0fVxuXHRcblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogUmVtb3ZlIFwiaVwiIGZyb20gaXRzIGxpc3RcbiAqL1xuUk9ULk1hcC5FbGxlck1hemUucHJvdG90eXBlLl9yZW1vdmVGcm9tTGlzdCA9IGZ1bmN0aW9uKGksIEwsIFIpIHtcblx0UltMW2ldXSA9IFJbaV07XG5cdExbUltpXV0gPSBMW2ldO1xuXHRSW2ldID0gaTtcblx0TFtpXSA9IGk7XG59XG5cbi8qKlxuICogSm9pbiBsaXN0cyB3aXRoIFwiaVwiIGFuZCBcImkrMVwiXG4gKi9cblJPVC5NYXAuRWxsZXJNYXplLnByb3RvdHlwZS5fYWRkVG9MaXN0ID0gZnVuY3Rpb24oaSwgTCwgUikge1xuXHRSW0xbaSsxXV0gPSBSW2ldO1xuXHRMW1JbaV1dID0gTFtpKzFdO1xuXHRSW2ldID0gaSsxO1xuXHRMW2krMV0gPSBpO1xufVxuLyoqXG4gKiBAY2xhc3MgQ2VsbHVsYXIgYXV0b21hdG9uIG1hcCBnZW5lcmF0b3JcbiAqIEBhdWdtZW50cyBST1QuTWFwXG4gKiBAcGFyYW0ge2ludH0gW3dpZHRoPVJPVC5ERUZBVUxUX1dJRFRIXVxuICogQHBhcmFtIHtpbnR9IFtoZWlnaHQ9Uk9ULkRFRkFVTFRfSEVJR0hUXVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBPcHRpb25zXG4gKiBAcGFyYW0ge2ludFtdfSBbb3B0aW9ucy5ib3JuXSBMaXN0IG9mIG5laWdoYm9yIGNvdW50cyBmb3IgYSBuZXcgY2VsbCB0byBiZSBib3JuIGluIGVtcHR5IHNwYWNlXG4gKiBAcGFyYW0ge2ludFtdfSBbb3B0aW9ucy5zdXJ2aXZlXSBMaXN0IG9mIG5laWdoYm9yIGNvdW50cyBmb3IgYW4gZXhpc3RpbmcgIGNlbGwgdG8gc3Vydml2ZVxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLnRvcG9sb2d5XSBUb3BvbG9neSA0IG9yIDYgb3IgOFxuICovXG5ST1QuTWFwLkNlbGx1bGFyID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgb3B0aW9ucykge1xuXHRST1QuTWFwLmNhbGwodGhpcywgd2lkdGgsIGhlaWdodCk7XG5cdHRoaXMuX29wdGlvbnMgPSB7XG5cdFx0Ym9ybjogWzUsIDYsIDcsIDhdLFxuXHRcdHN1cnZpdmU6IFs0LCA1LCA2LCA3LCA4XSxcblx0XHR0b3BvbG9neTogOCxcblx0XHRjb25uZWN0ZWQ6IGZhbHNlXG5cdH07XG5cdHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcblx0XG5cdHRoaXMuX2RpcnMgPSBST1QuRElSU1t0aGlzLl9vcHRpb25zLnRvcG9sb2d5XTtcblx0dGhpcy5fbWFwID0gdGhpcy5fZmlsbE1hcCgwKTtcbn1cblJPVC5NYXAuQ2VsbHVsYXIuZXh0ZW5kKFJPVC5NYXApO1xuXG4vKipcbiAqIEZpbGwgdGhlIG1hcCB3aXRoIHJhbmRvbSB2YWx1ZXNcbiAqIEBwYXJhbSB7ZmxvYXR9IHByb2JhYmlsaXR5IFByb2JhYmlsaXR5IGZvciBhIGNlbGwgdG8gYmVjb21lIGFsaXZlOyAwID0gYWxsIGVtcHR5LCAxID0gYWxsIGZ1bGxcbiAqL1xuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUucmFuZG9taXplID0gZnVuY3Rpb24ocHJvYmFiaWxpdHkpIHtcblx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fd2lkdGg7aSsrKSB7XG5cdFx0Zm9yICh2YXIgaj0wO2o8dGhpcy5faGVpZ2h0O2orKykge1xuXHRcdFx0dGhpcy5fbWFwW2ldW2pdID0gKFJPVC5STkcuZ2V0VW5pZm9ybSgpIDwgcHJvYmFiaWxpdHkgPyAxIDogMCk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIENoYW5nZSBvcHRpb25zLlxuICogQHNlZSBST1QuTWFwLkNlbGx1bGFyXG4gKi9cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyB0aGlzLl9vcHRpb25zW3BdID0gb3B0aW9uc1twXTsgfVxufVxuXG5ST1QuTWFwLkNlbGx1bGFyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbih4LCB5LCB2YWx1ZSkge1xuXHR0aGlzLl9tYXBbeF1beV0gPSB2YWx1ZTtcbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dmFyIG5ld01hcCA9IHRoaXMuX2ZpbGxNYXAoMCk7XG5cdHZhciBib3JuID0gdGhpcy5fb3B0aW9ucy5ib3JuO1xuXHR2YXIgc3Vydml2ZSA9IHRoaXMuX29wdGlvbnMuc3Vydml2ZTtcblxuXG5cdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHtcblx0XHR2YXIgd2lkdGhTdGVwID0gMTtcblx0XHR2YXIgd2lkdGhTdGFydCA9IDA7XG5cdFx0aWYgKHRoaXMuX29wdGlvbnMudG9wb2xvZ3kgPT0gNikgeyBcblx0XHRcdHdpZHRoU3RlcCA9IDI7XG5cdFx0XHR3aWR0aFN0YXJ0ID0gaiUyO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGk9d2lkdGhTdGFydDsgaTx0aGlzLl93aWR0aDsgaSs9d2lkdGhTdGVwKSB7XG5cblx0XHRcdHZhciBjdXIgPSB0aGlzLl9tYXBbaV1bal07XG5cdFx0XHR2YXIgbmNvdW50ID0gdGhpcy5fZ2V0TmVpZ2hib3JzKGksIGopO1xuXHRcdFx0XG5cdFx0XHRpZiAoY3VyICYmIHN1cnZpdmUuaW5kZXhPZihuY291bnQpICE9IC0xKSB7IC8qIHN1cnZpdmUgKi9cblx0XHRcdFx0bmV3TWFwW2ldW2pdID0gMTtcblx0XHRcdH0gZWxzZSBpZiAoIWN1ciAmJiBib3JuLmluZGV4T2YobmNvdW50KSAhPSAtMSkgeyAvKiBib3JuICovXG5cdFx0XHRcdG5ld01hcFtpXVtqXSA9IDE7XG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHR9XG5cdFxuXHR0aGlzLl9tYXAgPSBuZXdNYXA7XG5cblx0aWYgKHRoaXMuX29wdGlvbnMuY29ubmVjdGVkKSB7IHRoaXMuX2NvbXBsZXRlTWF6ZSgpOyB9IC8vIG9wdGlvbmFsbHkgY29ubmVjdCBldmVyeSBzcGFjZVxuXG5cdGlmICghY2FsbGJhY2spIHsgcmV0dXJuOyB9XG5cblx0Zm9yICh2YXIgaj0wO2o8dGhpcy5faGVpZ2h0O2orKykge1xuXHRcdHZhciB3aWR0aFN0ZXAgPSAxO1xuXHRcdHZhciB3aWR0aFN0YXJ0ID0gMDtcblx0XHRpZiAodGhpcy5fb3B0aW9ucy50b3BvbG9neSA9PSA2KSB7IFxuXHRcdFx0d2lkdGhTdGVwID0gMjtcblx0XHRcdHdpZHRoU3RhcnQgPSBqJTI7XG5cdFx0fVxuXHRcdGZvciAodmFyIGk9d2lkdGhTdGFydDsgaTx0aGlzLl93aWR0aDsgaSs9d2lkdGhTdGVwKSB7XG5cdFx0XHRjYWxsYmFjayhpLCBqLCBuZXdNYXBbaV1bal0pO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEdldCBuZWlnaGJvciBjb3VudCBhdCBbaSxqXSBpbiB0aGlzLl9tYXBcbiAqL1xuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX2dldE5laWdoYm9ycyA9IGZ1bmN0aW9uKGN4LCBjeSkge1xuXHR2YXIgcmVzdWx0ID0gMDtcblx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fZGlycy5sZW5ndGg7aSsrKSB7XG5cdFx0dmFyIGRpciA9IHRoaXMuX2RpcnNbaV07XG5cdFx0dmFyIHggPSBjeCArIGRpclswXTtcblx0XHR2YXIgeSA9IGN5ICsgZGlyWzFdO1xuXHRcdFxuXHRcdGlmICh4IDwgMCB8fCB4ID49IHRoaXMuX3dpZHRoIHx8IHggPCAwIHx8IHkgPj0gdGhpcy5fd2lkdGgpIHsgY29udGludWU7IH1cblx0XHRyZXN1bHQgKz0gKHRoaXMuX21hcFt4XVt5XSA9PSAxID8gMSA6IDApO1xuXHR9XG5cdFxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIE1ha2Ugc3VyZSBldmVyeSBub24td2FsbCBzcGFjZSBpcyBhY2Nlc3NpYmxlLlxuICovXG5ST1QuTWFwLkNlbGx1bGFyLnByb3RvdHlwZS5fY29tcGxldGVNYXplID0gZnVuY3Rpb24oKSB7XG5cdHZhciBhbGxGcmVlU3BhY2UgPSBbXTtcblx0dmFyIG5vdENvbm5lY3RlZCA9IHt9O1xuXHQvLyBmaW5kIGFsbCBmcmVlIHNwYWNlXG5cdGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5fd2lkdGg7IHgrKykge1xuXHRcdGZvciAodmFyIHkgPSAwOyB5IDwgdGhpcy5faGVpZ2h0OyB5KyspIHtcblx0XHRcdGlmICh0aGlzLl9mcmVlU3BhY2UoeCwgeSkpIHtcblx0XHRcdFx0dmFyIHAgPSBbeCwgeV07XG5cdFx0XHRcdG5vdENvbm5lY3RlZFt0aGlzLl9wb2ludEtleShwKV0gPSBwO1xuXHRcdFx0XHRhbGxGcmVlU3BhY2UucHVzaChbeCwgeV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHR2YXIgc3RhcnQgPSBhbGxGcmVlU3BhY2VbUk9ULlJORy5nZXRVbmlmb3JtSW50KDAsIGFsbEZyZWVTcGFjZS5sZW5ndGggLSAxKV07XG5cblx0dmFyIGtleSA9IHRoaXMuX3BvaW50S2V5KHN0YXJ0KTtcblx0dmFyIGNvbm5lY3RlZCA9IHt9O1xuXHRjb25uZWN0ZWRba2V5XSA9IHN0YXJ0O1xuXHRkZWxldGUgbm90Q29ubmVjdGVkW2tleV1cblxuXHQvLyBmaW5kIHdoYXQncyBjb25uZWN0ZWQgdG8gdGhlIHN0YXJ0aW5nIHBvaW50XG5cdHRoaXMuX2ZpbmRDb25uZWN0ZWQoY29ubmVjdGVkLCBub3RDb25uZWN0ZWQsIFtzdGFydF0pO1xuXG5cdHdoaWxlIChPYmplY3Qua2V5cyhub3RDb25uZWN0ZWQpLmxlbmd0aCA+IDApIHtcblxuXHRcdC8vIGZpbmQgdHdvIHBvaW50cyBmcm9tIG5vdENvbm5lY3RlZCB0byBjb25uZWN0ZWRcblx0XHR2YXIgcCA9IHRoaXMuX2dldEZyb21Ubyhjb25uZWN0ZWQsIG5vdENvbm5lY3RlZCk7XG5cdFx0dmFyIGZyb20gPSBwWzBdOyAvLyBub3RDb25uZWN0ZWRcblx0XHR2YXIgdG8gPSBwWzFdOyAvLyBjb25uZWN0ZWRcblxuXHRcdC8vIGZpbmQgZXZlcnl0aGluZyBjb25uZWN0ZWQgdG8gdGhlIHN0YXJ0aW5nIHBvaW50XG5cdFx0dmFyIGxvY2FsID0ge307XG5cdFx0bG9jYWxbdGhpcy5fcG9pbnRLZXkoZnJvbSldID0gZnJvbTtcblx0XHR0aGlzLl9maW5kQ29ubmVjdGVkKGxvY2FsLCBub3RDb25uZWN0ZWQsIFtmcm9tXSwgdHJ1ZSk7XG5cblx0XHQvLyBjb25uZWN0IHRvIGEgY29ubmVjdGVkIHNxdWFyZVxuXHRcdHRoaXMuX3R1bm5lbFRvQ29ubmVjdGVkKHRvLCBmcm9tLCBjb25uZWN0ZWQsIG5vdENvbm5lY3RlZCk7XG5cblx0XHQvLyBub3cgYWxsIG9mIGxvY2FsIGlzIGNvbm5lY3RlZFxuXHRcdGZvciAodmFyIGsgaW4gbG9jYWwpIHtcblx0XHRcdHZhciBwcCA9IGxvY2FsW2tdO1xuXHRcdFx0dGhpcy5fbWFwW3BwWzBdXVtwcFsxXV0gPSAwO1xuXHRcdFx0Y29ubmVjdGVkW2tdID0gcHA7XG5cdFx0XHRkZWxldGUgbm90Q29ubmVjdGVkW2tdO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEZpbmQgcmFuZG9tIHBvaW50cyB0byBjb25uZWN0LiBTZWFyY2ggZm9yIHRoZSBjbG9zZXN0IHBvaW50IGluIHRoZSBsYXJnZXIgc3BhY2UuIFxuICogVGhpcyBpcyB0byBtaW5pbWl6ZSB0aGUgbGVuZ3RoIG9mIHRoZSBwYXNzYWdlIHdoaWxlIG1haW50YWluaW5nIGdvb2QgcGVyZm9ybWFuY2UuXG4gKi9cblJPVC5NYXAuQ2VsbHVsYXIucHJvdG90eXBlLl9nZXRGcm9tVG8gPSBmdW5jdGlvbihjb25uZWN0ZWQsIG5vdENvbm5lY3RlZCkge1xuXHR2YXIgZnJvbSwgdG8sIGQ7XG5cdHZhciBjb25uZWN0ZWRLZXlzID0gT2JqZWN0LmtleXMoY29ubmVjdGVkKTtcblx0dmFyIG5vdENvbm5lY3RlZEtleXMgPSBPYmplY3Qua2V5cyhub3RDb25uZWN0ZWQpO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDU7IGkrKykge1xuXHRcdGlmIChjb25uZWN0ZWRLZXlzLmxlbmd0aCA8IG5vdENvbm5lY3RlZEtleXMubGVuZ3RoKSB7XG5cdFx0XHR2YXIga2V5cyA9IGNvbm5lY3RlZEtleXM7XG5cdFx0XHR0byA9IGNvbm5lY3RlZFtrZXlzW1JPVC5STkcuZ2V0VW5pZm9ybUludCgwLCBrZXlzLmxlbmd0aCAtIDEpXV1cblx0XHRcdGZyb20gPSB0aGlzLl9nZXRDbG9zZXN0KHRvLCBub3RDb25uZWN0ZWQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIga2V5cyA9IG5vdENvbm5lY3RlZEtleXM7XG5cdFx0XHRmcm9tID0gbm90Q29ubmVjdGVkW2tleXNbUk9ULlJORy5nZXRVbmlmb3JtSW50KDAsIGtleXMubGVuZ3RoIC0gMSldXVxuXHRcdFx0dG8gPSB0aGlzLl9nZXRDbG9zZXN0KGZyb20sIGNvbm5lY3RlZCk7XG5cdFx0fVxuXHRcdGQgPSAoZnJvbVswXSAtIHRvWzBdKSAqIChmcm9tWzBdIC0gdG9bMF0pICsgKGZyb21bMV0gLSB0b1sxXSkgKiAoZnJvbVsxXSAtIHRvWzFdKTtcblx0XHRpZiAoZCA8IDY0KSB7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblx0Ly8gY29uc29sZS5sb2coXCI+Pj4gY29ubmVjdGVkPVwiICsgdG8gKyBcIiBub3RDb25uZWN0ZWQ9XCIgKyBmcm9tICsgXCIgZGlzdD1cIiArIGQpO1xuXHRyZXR1cm4gW2Zyb20sIHRvXTtcbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX2dldENsb3Nlc3QgPSBmdW5jdGlvbihwb2ludCwgc3BhY2UpIHtcblx0dmFyIG1pblBvaW50ID0gbnVsbDtcblx0dmFyIG1pbkRpc3QgPSBudWxsO1xuXHRmb3IgKGsgaW4gc3BhY2UpIHtcblx0XHR2YXIgcCA9IHNwYWNlW2tdO1xuXHRcdHZhciBkID0gKHBbMF0gLSBwb2ludFswXSkgKiAocFswXSAtIHBvaW50WzBdKSArIChwWzFdIC0gcG9pbnRbMV0pICogKHBbMV0gLSBwb2ludFsxXSk7XG5cdFx0aWYgKG1pbkRpc3QgPT0gbnVsbCB8fCBkIDwgbWluRGlzdCkge1xuXHRcdFx0bWluRGlzdCA9IGQ7XG5cdFx0XHRtaW5Qb2ludCA9IHA7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBtaW5Qb2ludDtcbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX2ZpbmRDb25uZWN0ZWQgPSBmdW5jdGlvbihjb25uZWN0ZWQsIG5vdENvbm5lY3RlZCwgc3RhY2ssIGtlZXBOb3RDb25uZWN0ZWQpIHtcblx0d2hpbGUoc3RhY2subGVuZ3RoID4gMCkge1xuXHRcdHZhciBwID0gc3RhY2suc3BsaWNlKDAsIDEpWzBdO1xuXHRcdHZhciB0ZXN0cyA9IFtcblx0XHRcdFtwWzBdICsgMSwgcFsxXV0sXG5cdFx0XHRbcFswXSAtIDEsIHBbMV1dLFxuXHRcdFx0W3BbMF0sICAgICBwWzFdICsgMV0sXG5cdFx0XHRbcFswXSwgICAgIHBbMV0gLSAxXVxuXHRcdF07XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0ZXN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGtleSA9IHRoaXMuX3BvaW50S2V5KHRlc3RzW2ldKTtcblx0XHRcdGlmIChjb25uZWN0ZWRba2V5XSA9PSBudWxsICYmIHRoaXMuX2ZyZWVTcGFjZSh0ZXN0c1tpXVswXSwgdGVzdHNbaV1bMV0pKSB7XG5cdFx0XHRcdGNvbm5lY3RlZFtrZXldID0gdGVzdHNbaV07XG5cdFx0XHRcdGlmICgha2VlcE5vdENvbm5lY3RlZCkge1xuXHRcdFx0XHRcdGRlbGV0ZSBub3RDb25uZWN0ZWRba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzdGFjay5wdXNoKHRlc3RzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX3R1bm5lbFRvQ29ubmVjdGVkID0gZnVuY3Rpb24odG8sIGZyb20sIGNvbm5lY3RlZCwgbm90Q29ubmVjdGVkKSB7XG5cdHZhciBrZXkgPSB0aGlzLl9wb2ludEtleShmcm9tKTtcblx0dmFyIGEsIGI7XG5cdGlmIChmcm9tWzBdIDwgdG9bMF0pIHtcblx0XHRhID0gZnJvbTtcblx0XHRiID0gdG87XG5cdH0gZWxzZSB7XG5cdFx0YSA9IHRvO1xuXHRcdGIgPSBmcm9tO1xuXHR9XG5cdGZvciAodmFyIHh4ID0gYVswXTsgeHggPD0gYlswXTsgeHgrKykge1xuXHRcdHRoaXMuX21hcFt4eF1bYVsxXV0gPSAwO1xuXHRcdHZhciBwID0gW3h4LCBhWzFdXTtcblx0XHR2YXIgcGtleSA9IHRoaXMuX3BvaW50S2V5KHApO1xuXHRcdGNvbm5lY3RlZFtwa2V5XSA9IHA7XG5cdFx0ZGVsZXRlIG5vdENvbm5lY3RlZFtwa2V5XTtcblx0fVxuXG5cdC8vIHggaXMgbm93IGZpeGVkXG5cdHZhciB4ID0gYlswXTtcblxuXHRpZiAoZnJvbVsxXSA8IHRvWzFdKSB7XG5cdFx0YSA9IGZyb207XG5cdFx0YiA9IHRvO1xuXHR9IGVsc2Uge1xuXHRcdGEgPSB0bztcblx0XHRiID0gZnJvbTtcblx0fVxuXHRmb3IgKHZhciB5eSA9IGFbMV07IHl5IDwgYlsxXTsgeXkrKykge1xuXHRcdHRoaXMuX21hcFt4XVt5eV0gPSAwO1xuXHRcdHZhciBwID0gW3gsIHl5XTtcblx0XHR2YXIgcGtleSA9IHRoaXMuX3BvaW50S2V5KHApO1xuXHRcdGNvbm5lY3RlZFtwa2V5XSA9IHA7XG5cdFx0ZGVsZXRlIG5vdENvbm5lY3RlZFtwa2V5XTtcblx0fVxufVxuXG5ST1QuTWFwLkNlbGx1bGFyLnByb3RvdHlwZS5fZnJlZVNwYWNlID0gZnVuY3Rpb24oeCwgeSkge1xuXHRyZXR1cm4geCA+PSAwICYmIHggPCB0aGlzLl93aWR0aCAmJiB5ID49IDAgJiYgeSA8IHRoaXMuX2hlaWdodCAmJiB0aGlzLl9tYXBbeF1beV0gIT0gMTtcbn1cblxuUk9ULk1hcC5DZWxsdWxhci5wcm90b3R5cGUuX3BvaW50S2V5ID0gZnVuY3Rpb24ocCkge1xuXHRyZXR1cm4gcFswXSArIFwiLlwiICsgcFsxXTtcbn1cblxuLyoqXG4gKiBAY2xhc3MgRHVuZ2VvbiBtYXA6IGhhcyByb29tcyBhbmQgY29ycmlkb3JzXG4gKiBAYXVnbWVudHMgUk9ULk1hcFxuICovXG5ST1QuTWFwLkR1bmdlb24gPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG5cdFJPVC5NYXAuY2FsbCh0aGlzLCB3aWR0aCwgaGVpZ2h0KTtcblx0dGhpcy5fcm9vbXMgPSBbXTsgLyogbGlzdCBvZiBhbGwgcm9vbXMgKi9cblx0dGhpcy5fY29ycmlkb3JzID0gW107XG59XG5ST1QuTWFwLkR1bmdlb24uZXh0ZW5kKFJPVC5NYXApO1xuXG4vKipcbiAqIEdldCBhbGwgZ2VuZXJhdGVkIHJvb21zXG4gKiBAcmV0dXJucyB7Uk9ULk1hcC5GZWF0dXJlLlJvb21bXX1cbiAqL1xuUk9ULk1hcC5EdW5nZW9uLnByb3RvdHlwZS5nZXRSb29tcyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fcm9vbXM7XG59XG5cbi8qKlxuICogR2V0IGFsbCBnZW5lcmF0ZWQgY29ycmlkb3JzXG4gKiBAcmV0dXJucyB7Uk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yW119XG4gKi9cblJPVC5NYXAuRHVuZ2Vvbi5wcm90b3R5cGUuZ2V0Q29ycmlkb3JzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl9jb3JyaWRvcnM7XG59XG4vKipcbiAqIEBjbGFzcyBSYW5kb20gZHVuZ2VvbiBnZW5lcmF0b3IgdXNpbmcgaHVtYW4tbGlrZSBkaWdnaW5nIHBhdHRlcm5zLlxuICogSGVhdmlseSBiYXNlZCBvbiBNaWtlIEFuZGVyc29uJ3MgaWRlYXMgZnJvbSB0aGUgXCJUeXJhbnRcIiBhbGdvLCBtZW50aW9uZWQgYXQgXG4gKiBodHRwOi8vd3d3LnJvZ3VlYmFzaW4ucm9ndWVsaWtlZGV2ZWxvcG1lbnQub3JnL2luZGV4LnBocD90aXRsZT1EdW5nZW9uLUJ1aWxkaW5nX0FsZ29yaXRobS5cbiAqIEBhdWdtZW50cyBST1QuTWFwLkR1bmdlb25cbiAqL1xuUk9ULk1hcC5EaWdnZXIgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBvcHRpb25zKSB7XG5cdFJPVC5NYXAuRHVuZ2Vvbi5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xuXHRcblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHRyb29tV2lkdGg6IFszLCA5XSwgLyogcm9vbSBtaW5pbXVtIGFuZCBtYXhpbXVtIHdpZHRoICovXG5cdFx0cm9vbUhlaWdodDogWzMsIDVdLCAvKiByb29tIG1pbmltdW0gYW5kIG1heGltdW0gaGVpZ2h0ICovXG5cdFx0Y29ycmlkb3JMZW5ndGg6IFszLCAxMF0sIC8qIGNvcnJpZG9yIG1pbmltdW0gYW5kIG1heGltdW0gbGVuZ3RoICovXG5cdFx0ZHVnUGVyY2VudGFnZTogMC4yLCAvKiB3ZSBzdG9wIGFmdGVyIHRoaXMgcGVyY2VudGFnZSBvZiBsZXZlbCBhcmVhIGhhcyBiZWVuIGR1ZyBvdXQgKi9cblx0XHR0aW1lTGltaXQ6IDEwMDAgLyogd2Ugc3RvcCBhZnRlciB0aGlzIG11Y2ggdGltZSBoYXMgcGFzc2VkIChtc2VjKSAqL1xuXHR9XG5cdGZvciAodmFyIHAgaW4gb3B0aW9ucykgeyB0aGlzLl9vcHRpb25zW3BdID0gb3B0aW9uc1twXTsgfVxuXHRcblx0dGhpcy5fZmVhdHVyZXMgPSB7XG5cdFx0XCJSb29tXCI6IDQsXG5cdFx0XCJDb3JyaWRvclwiOiA0XG5cdH1cblx0dGhpcy5fZmVhdHVyZUF0dGVtcHRzID0gMjA7IC8qIGhvdyBtYW55IHRpbWVzIGRvIHdlIHRyeSB0byBjcmVhdGUgYSBmZWF0dXJlIG9uIGEgc3VpdGFibGUgd2FsbCAqL1xuXHR0aGlzLl93YWxscyA9IHt9OyAvKiB0aGVzZSBhcmUgYXZhaWxhYmxlIGZvciBkaWdnaW5nICovXG5cdFxuXHR0aGlzLl9kaWdDYWxsYmFjayA9IHRoaXMuX2RpZ0NhbGxiYWNrLmJpbmQodGhpcyk7XG5cdHRoaXMuX2NhbkJlRHVnQ2FsbGJhY2sgPSB0aGlzLl9jYW5CZUR1Z0NhbGxiYWNrLmJpbmQodGhpcyk7XG5cdHRoaXMuX2lzV2FsbENhbGxiYWNrID0gdGhpcy5faXNXYWxsQ2FsbGJhY2suYmluZCh0aGlzKTtcblx0dGhpcy5fcHJpb3JpdHlXYWxsQ2FsbGJhY2sgPSB0aGlzLl9wcmlvcml0eVdhbGxDYWxsYmFjay5iaW5kKHRoaXMpO1xufVxuUk9ULk1hcC5EaWdnZXIuZXh0ZW5kKFJPVC5NYXAuRHVuZ2Vvbik7XG5cbi8qKlxuICogQ3JlYXRlIGEgbWFwXG4gKiBAc2VlIFJPVC5NYXAjY3JlYXRlXG4gKi9cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHR0aGlzLl9yb29tcyA9IFtdO1xuXHR0aGlzLl9jb3JyaWRvcnMgPSBbXTtcblx0dGhpcy5fbWFwID0gdGhpcy5fZmlsbE1hcCgxKTtcblx0dGhpcy5fd2FsbHMgPSB7fTtcblx0dGhpcy5fZHVnID0gMDtcblx0dmFyIGFyZWEgPSAodGhpcy5fd2lkdGgtMikgKiAodGhpcy5faGVpZ2h0LTIpO1xuXG5cdHRoaXMuX2ZpcnN0Um9vbSgpO1xuXHRcblx0dmFyIHQxID0gRGF0ZS5ub3coKTtcblxuXHRkbyB7XG5cdFx0dmFyIHQyID0gRGF0ZS5ub3coKTtcblx0XHRpZiAodDIgLSB0MSA+IHRoaXMuX29wdGlvbnMudGltZUxpbWl0KSB7IGJyZWFrOyB9XG5cblx0XHQvKiBmaW5kIGEgZ29vZCB3YWxsICovXG5cdFx0dmFyIHdhbGwgPSB0aGlzLl9maW5kV2FsbCgpO1xuXHRcdGlmICghd2FsbCkgeyBicmVhazsgfSAvKiBubyBtb3JlIHdhbGxzICovXG5cdFx0XG5cdFx0dmFyIHBhcnRzID0gd2FsbC5zcGxpdChcIixcIik7XG5cdFx0dmFyIHggPSBwYXJzZUludChwYXJ0c1swXSk7XG5cdFx0dmFyIHkgPSBwYXJzZUludChwYXJ0c1sxXSk7XG5cdFx0dmFyIGRpciA9IHRoaXMuX2dldERpZ2dpbmdEaXJlY3Rpb24oeCwgeSk7XG5cdFx0aWYgKCFkaXIpIHsgY29udGludWU7IH0gLyogdGhpcyB3YWxsIGlzIG5vdCBzdWl0YWJsZSAqL1xuXHRcdFxuLy9cdFx0Y29uc29sZS5sb2coXCJ3YWxsXCIsIHgsIHkpO1xuXG5cdFx0LyogdHJ5IGFkZGluZyBhIGZlYXR1cmUgKi9cblx0XHR2YXIgZmVhdHVyZUF0dGVtcHRzID0gMDtcblx0XHRkbyB7XG5cdFx0XHRmZWF0dXJlQXR0ZW1wdHMrKztcblx0XHRcdGlmICh0aGlzLl90cnlGZWF0dXJlKHgsIHksIGRpclswXSwgZGlyWzFdKSkgeyAvKiBmZWF0dXJlIGFkZGVkICovXG5cdFx0XHRcdC8vaWYgKHRoaXMuX3Jvb21zLmxlbmd0aCArIHRoaXMuX2NvcnJpZG9ycy5sZW5ndGggPT0gMikgeyB0aGlzLl9yb29tc1swXS5hZGREb29yKHgsIHkpOyB9IC8qIGZpcnN0IHJvb20gb2ZpY2lhbGx5IGhhcyBkb29ycyAqL1xuXHRcdFx0XHR0aGlzLl9yZW1vdmVTdXJyb3VuZGluZ1dhbGxzKHgsIHkpO1xuXHRcdFx0XHR0aGlzLl9yZW1vdmVTdXJyb3VuZGluZ1dhbGxzKHgtZGlyWzBdLCB5LWRpclsxXSk7XG5cdFx0XHRcdGJyZWFrOyBcblx0XHRcdH1cblx0XHR9IHdoaWxlIChmZWF0dXJlQXR0ZW1wdHMgPCB0aGlzLl9mZWF0dXJlQXR0ZW1wdHMpO1xuXHRcdFxuXHRcdHZhciBwcmlvcml0eVdhbGxzID0gMDtcblx0XHRmb3IgKHZhciBpZCBpbiB0aGlzLl93YWxscykgeyBcblx0XHRcdGlmICh0aGlzLl93YWxsc1tpZF0gPiAxKSB7IHByaW9yaXR5V2FsbHMrKzsgfVxuXHRcdH1cblxuXHR9IHdoaWxlICh0aGlzLl9kdWcvYXJlYSA8IHRoaXMuX29wdGlvbnMuZHVnUGVyY2VudGFnZSB8fCBwcmlvcml0eVdhbGxzKTsgLyogZml4bWUgbnVtYmVyIG9mIHByaW9yaXR5IHdhbGxzICovXG5cblx0dGhpcy5fYWRkRG9vcnMoKTtcblxuXHRpZiAoY2FsbGJhY2spIHtcblx0XHRmb3IgKHZhciBpPTA7aTx0aGlzLl93aWR0aDtpKyspIHtcblx0XHRcdGZvciAodmFyIGo9MDtqPHRoaXMuX2hlaWdodDtqKyspIHtcblx0XHRcdFx0Y2FsbGJhY2soaSwgaiwgdGhpcy5fbWFwW2ldW2pdKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0XG5cdHRoaXMuX3dhbGxzID0ge307XG5cdHRoaXMuX21hcCA9IG51bGw7XG5cblx0cmV0dXJuIHRoaXM7XG59XG5cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5fZGlnQ2FsbGJhY2sgPSBmdW5jdGlvbih4LCB5LCB2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT0gMCB8fCB2YWx1ZSA9PSAyKSB7IC8qIGVtcHR5ICovXG5cdFx0dGhpcy5fbWFwW3hdW3ldID0gMDtcblx0XHR0aGlzLl9kdWcrKztcblx0fSBlbHNlIHsgLyogd2FsbCAqL1xuXHRcdHRoaXMuX3dhbGxzW3grXCIsXCIreV0gPSAxO1xuXHR9XG59XG5cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5faXNXYWxsQ2FsbGJhY2sgPSBmdW5jdGlvbih4LCB5KSB7XG5cdGlmICh4IDwgMCB8fCB5IDwgMCB8fCB4ID49IHRoaXMuX3dpZHRoIHx8IHkgPj0gdGhpcy5faGVpZ2h0KSB7IHJldHVybiBmYWxzZTsgfVxuXHRyZXR1cm4gKHRoaXMuX21hcFt4XVt5XSA9PSAxKTtcbn1cblxuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl9jYW5CZUR1Z0NhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHRpZiAoeCA8IDEgfHwgeSA8IDEgfHwgeCsxID49IHRoaXMuX3dpZHRoIHx8IHkrMSA+PSB0aGlzLl9oZWlnaHQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdHJldHVybiAodGhpcy5fbWFwW3hdW3ldID09IDEpO1xufVxuXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX3ByaW9yaXR5V2FsbENhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHR0aGlzLl93YWxsc1t4K1wiLFwiK3ldID0gMjtcbn1cblxuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl9maXJzdFJvb20gPSBmdW5jdGlvbigpIHtcblx0dmFyIGN4ID0gTWF0aC5mbG9vcih0aGlzLl93aWR0aC8yKTtcblx0dmFyIGN5ID0gTWF0aC5mbG9vcih0aGlzLl9oZWlnaHQvMik7XG5cdHZhciByb29tID0gUk9ULk1hcC5GZWF0dXJlLlJvb20uY3JlYXRlUmFuZG9tQ2VudGVyKGN4LCBjeSwgdGhpcy5fb3B0aW9ucyk7XG5cdHRoaXMuX3Jvb21zLnB1c2gocm9vbSk7XG5cdHJvb20uY3JlYXRlKHRoaXMuX2RpZ0NhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBHZXQgYSBzdWl0YWJsZSB3YWxsXG4gKi9cblJPVC5NYXAuRGlnZ2VyLnByb3RvdHlwZS5fZmluZFdhbGwgPSBmdW5jdGlvbigpIHtcblx0dmFyIHByaW8xID0gW107XG5cdHZhciBwcmlvMiA9IFtdO1xuXHRmb3IgKHZhciBpZCBpbiB0aGlzLl93YWxscykge1xuXHRcdHZhciBwcmlvID0gdGhpcy5fd2FsbHNbaWRdO1xuXHRcdGlmIChwcmlvID09IDIpIHsgXG5cdFx0XHRwcmlvMi5wdXNoKGlkKTsgXG5cdFx0fSBlbHNlIHtcblx0XHRcdHByaW8xLnB1c2goaWQpO1xuXHRcdH1cblx0fVxuXHRcblx0dmFyIGFyciA9IChwcmlvMi5sZW5ndGggPyBwcmlvMiA6IHByaW8xKTtcblx0aWYgKCFhcnIubGVuZ3RoKSB7IHJldHVybiBudWxsOyB9IC8qIG5vIHdhbGxzIDovICovXG5cdFxuXHR2YXIgaWQgPSBhcnIucmFuZG9tKCk7XG5cdGRlbGV0ZSB0aGlzLl93YWxsc1tpZF07XG5cblx0cmV0dXJuIGlkO1xufVxuXG4vKipcbiAqIFRyaWVzIGFkZGluZyBhIGZlYXR1cmVcbiAqIEByZXR1cm5zIHtib29sfSB3YXMgdGhpcyBhIHN1Y2Nlc3NmdWwgdHJ5P1xuICovXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX3RyeUZlYXR1cmUgPSBmdW5jdGlvbih4LCB5LCBkeCwgZHkpIHtcblx0dmFyIGZlYXR1cmUgPSBST1QuUk5HLmdldFdlaWdodGVkVmFsdWUodGhpcy5fZmVhdHVyZXMpO1xuXHRmZWF0dXJlID0gUk9ULk1hcC5GZWF0dXJlW2ZlYXR1cmVdLmNyZWF0ZVJhbmRvbUF0KHgsIHksIGR4LCBkeSwgdGhpcy5fb3B0aW9ucyk7XG5cdFxuXHRpZiAoIWZlYXR1cmUuaXNWYWxpZCh0aGlzLl9pc1dhbGxDYWxsYmFjaywgdGhpcy5fY2FuQmVEdWdDYWxsYmFjaykpIHtcbi8vXHRcdGNvbnNvbGUubG9nKFwibm90IHZhbGlkXCIpO1xuLy9cdFx0ZmVhdHVyZS5kZWJ1ZygpO1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRcblx0ZmVhdHVyZS5jcmVhdGUodGhpcy5fZGlnQ2FsbGJhY2spO1xuLy9cdGZlYXR1cmUuZGVidWcoKTtcblxuXHRpZiAoZmVhdHVyZSBpbnN0YW5jZW9mIFJPVC5NYXAuRmVhdHVyZS5Sb29tKSB7IHRoaXMuX3Jvb21zLnB1c2goZmVhdHVyZSk7IH1cblx0aWYgKGZlYXR1cmUgaW5zdGFuY2VvZiBST1QuTWFwLkZlYXR1cmUuQ29ycmlkb3IpIHsgXG5cdFx0ZmVhdHVyZS5jcmVhdGVQcmlvcml0eVdhbGxzKHRoaXMuX3ByaW9yaXR5V2FsbENhbGxiYWNrKTtcblx0XHR0aGlzLl9jb3JyaWRvcnMucHVzaChmZWF0dXJlKTsgXG5cdH1cblx0XG5cdHJldHVybiB0cnVlO1xufVxuXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX3JlbW92ZVN1cnJvdW5kaW5nV2FsbHMgPSBmdW5jdGlvbihjeCwgY3kpIHtcblx0dmFyIGRlbHRhcyA9IFJPVC5ESVJTWzRdO1xuXG5cdGZvciAodmFyIGk9MDtpPGRlbHRhcy5sZW5ndGg7aSsrKSB7XG5cdFx0dmFyIGRlbHRhID0gZGVsdGFzW2ldO1xuXHRcdHZhciB4ID0gY3ggKyBkZWx0YVswXTtcblx0XHR2YXIgeSA9IGN5ICsgZGVsdGFbMV07XG5cdFx0ZGVsZXRlIHRoaXMuX3dhbGxzW3grXCIsXCIreV07XG5cdFx0dmFyIHggPSBjeCArIDIqZGVsdGFbMF07XG5cdFx0dmFyIHkgPSBjeSArIDIqZGVsdGFbMV07XG5cdFx0ZGVsZXRlIHRoaXMuX3dhbGxzW3grXCIsXCIreV07XG5cdH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHZlY3RvciBpbiBcImRpZ2dpbmdcIiBkaXJlY3Rpb24sIG9yIGZhbHNlLCBpZiB0aGlzIGRvZXMgbm90IGV4aXN0IChvciBpcyBub3QgdW5pcXVlKVxuICovXG5ST1QuTWFwLkRpZ2dlci5wcm90b3R5cGUuX2dldERpZ2dpbmdEaXJlY3Rpb24gPSBmdW5jdGlvbihjeCwgY3kpIHtcblx0aWYgKGN4IDw9IDAgfHwgY3kgPD0gMCB8fCBjeCA+PSB0aGlzLl93aWR0aCAtIDEgfHwgY3kgPj0gdGhpcy5faGVpZ2h0IC0gMSkgeyByZXR1cm4gbnVsbDsgfVxuXG5cdHZhciByZXN1bHQgPSBudWxsO1xuXHR2YXIgZGVsdGFzID0gUk9ULkRJUlNbNF07XG5cdFxuXHRmb3IgKHZhciBpPTA7aTxkZWx0YXMubGVuZ3RoO2krKykge1xuXHRcdHZhciBkZWx0YSA9IGRlbHRhc1tpXTtcblx0XHR2YXIgeCA9IGN4ICsgZGVsdGFbMF07XG5cdFx0dmFyIHkgPSBjeSArIGRlbHRhWzFdO1xuXHRcdFxuXHRcdGlmICghdGhpcy5fbWFwW3hdW3ldKSB7IC8qIHRoZXJlIGFscmVhZHkgaXMgYW5vdGhlciBlbXB0eSBuZWlnaGJvciEgKi9cblx0XHRcdGlmIChyZXN1bHQpIHsgcmV0dXJuIG51bGw7IH1cblx0XHRcdHJlc3VsdCA9IGRlbHRhO1xuXHRcdH1cblx0fVxuXHRcblx0Lyogbm8gZW1wdHkgbmVpZ2hib3IgKi9cblx0aWYgKCFyZXN1bHQpIHsgcmV0dXJuIG51bGw7IH1cblx0XG5cdHJldHVybiBbLXJlc3VsdFswXSwgLXJlc3VsdFsxXV07XG59XG5cbi8qKlxuICogRmluZCBlbXB0eSBzcGFjZXMgc3Vycm91bmRpbmcgcm9vbXMsIGFuZCBhcHBseSBkb29ycy5cbiAqL1xuUk9ULk1hcC5EaWdnZXIucHJvdG90eXBlLl9hZGREb29ycyA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgZGF0YSA9IHRoaXMuX21hcDtcblx0dmFyIGlzV2FsbENhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdHJldHVybiAoZGF0YVt4XVt5XSA9PSAxKTtcblx0fVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3Jvb21zLmxlbmd0aDsgaSsrICkge1xuXHRcdHZhciByb29tID0gdGhpcy5fcm9vbXNbaV07XG5cdFx0cm9vbS5jbGVhckRvb3JzKCk7XG5cdFx0cm9vbS5hZGREb29ycyhpc1dhbGxDYWxsYmFjayk7XG5cdH1cbn1cbi8qKlxuICogQGNsYXNzIER1bmdlb24gZ2VuZXJhdG9yIHdoaWNoIHRyaWVzIHRvIGZpbGwgdGhlIHNwYWNlIGV2ZW5seS4gR2VuZXJhdGVzIGluZGVwZW5kZW50IHJvb21zIGFuZCB0cmllcyB0byBjb25uZWN0IHRoZW0uXG4gKiBAYXVnbWVudHMgUk9ULk1hcC5EdW5nZW9uXG4gKi9cblJPVC5NYXAuVW5pZm9ybSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMpIHtcblx0Uk9ULk1hcC5EdW5nZW9uLmNhbGwodGhpcywgd2lkdGgsIGhlaWdodCk7XG5cblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHRyb29tV2lkdGg6IFszLCA5XSwgLyogcm9vbSBtaW5pbXVtIGFuZCBtYXhpbXVtIHdpZHRoICovXG5cdFx0cm9vbUhlaWdodDogWzMsIDVdLCAvKiByb29tIG1pbmltdW0gYW5kIG1heGltdW0gaGVpZ2h0ICovXG5cdFx0cm9vbUR1Z1BlcmNlbnRhZ2U6IDAuMSwgLyogd2Ugc3RvcCBhZnRlciB0aGlzIHBlcmNlbnRhZ2Ugb2YgbGV2ZWwgYXJlYSBoYXMgYmVlbiBkdWcgb3V0IGJ5IHJvb21zICovXG5cdFx0dGltZUxpbWl0OiAxMDAwIC8qIHdlIHN0b3AgYWZ0ZXIgdGhpcyBtdWNoIHRpbWUgaGFzIHBhc3NlZCAobXNlYykgKi9cblx0fVxuXHRmb3IgKHZhciBwIGluIG9wdGlvbnMpIHsgdGhpcy5fb3B0aW9uc1twXSA9IG9wdGlvbnNbcF07IH1cblxuXHR0aGlzLl9yb29tQXR0ZW1wdHMgPSAyMDsgLyogbmV3IHJvb20gaXMgY3JlYXRlZCBOLXRpbWVzIHVudGlsIGlzIGNvbnNpZGVyZWQgYXMgaW1wb3NzaWJsZSB0byBnZW5lcmF0ZSAqL1xuXHR0aGlzLl9jb3JyaWRvckF0dGVtcHRzID0gMjA7IC8qIGNvcnJpZG9ycyBhcmUgdHJpZWQgTi10aW1lcyB1bnRpbCB0aGUgbGV2ZWwgaXMgY29uc2lkZXJlZCBhcyBpbXBvc3NpYmxlIHRvIGNvbm5lY3QgKi9cblxuXHR0aGlzLl9jb25uZWN0ZWQgPSBbXTsgLyogbGlzdCBvZiBhbHJlYWR5IGNvbm5lY3RlZCByb29tcyAqL1xuXHR0aGlzLl91bmNvbm5lY3RlZCA9IFtdOyAvKiBsaXN0IG9mIHJlbWFpbmluZyB1bmNvbm5lY3RlZCByb29tcyAqL1xuXHRcblx0dGhpcy5fZGlnQ2FsbGJhY2sgPSB0aGlzLl9kaWdDYWxsYmFjay5iaW5kKHRoaXMpO1xuXHR0aGlzLl9jYW5CZUR1Z0NhbGxiYWNrID0gdGhpcy5fY2FuQmVEdWdDYWxsYmFjay5iaW5kKHRoaXMpO1xuXHR0aGlzLl9pc1dhbGxDYWxsYmFjayA9IHRoaXMuX2lzV2FsbENhbGxiYWNrLmJpbmQodGhpcyk7XG59XG5ST1QuTWFwLlVuaWZvcm0uZXh0ZW5kKFJPVC5NYXAuRHVuZ2Vvbik7XG5cbi8qKlxuICogQ3JlYXRlIGEgbWFwLiBJZiB0aGUgdGltZSBsaW1pdCBoYXMgYmVlbiBoaXQsIHJldHVybnMgbnVsbC5cbiAqIEBzZWUgUk9ULk1hcCNjcmVhdGVcbiAqL1xuUk9ULk1hcC5Vbmlmb3JtLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHR2YXIgdDEgPSBEYXRlLm5vdygpO1xuXHR3aGlsZSAoMSkge1xuXHRcdHZhciB0MiA9IERhdGUubm93KCk7XG5cdFx0aWYgKHQyIC0gdDEgPiB0aGlzLl9vcHRpb25zLnRpbWVMaW1pdCkgeyByZXR1cm4gbnVsbDsgfSAvKiB0aW1lIGxpbWl0ISAqL1xuXHRcblx0XHR0aGlzLl9tYXAgPSB0aGlzLl9maWxsTWFwKDEpO1xuXHRcdHRoaXMuX2R1ZyA9IDA7XG5cdFx0dGhpcy5fcm9vbXMgPSBbXTtcblx0XHR0aGlzLl91bmNvbm5lY3RlZCA9IFtdO1xuXHRcdHRoaXMuX2dlbmVyYXRlUm9vbXMoKTtcblx0XHRpZiAodGhpcy5fcm9vbXMubGVuZ3RoIDwgMikgeyBjb250aW51ZTsgfVxuXHRcdGlmICh0aGlzLl9nZW5lcmF0ZUNvcnJpZG9ycygpKSB7IGJyZWFrOyB9XG5cdH1cblx0XG5cdGlmIChjYWxsYmFjaykge1xuXHRcdGZvciAodmFyIGk9MDtpPHRoaXMuX3dpZHRoO2krKykge1xuXHRcdFx0Zm9yICh2YXIgaj0wO2o8dGhpcy5faGVpZ2h0O2orKykge1xuXHRcdFx0XHRjYWxsYmFjayhpLCBqLCB0aGlzLl9tYXBbaV1bal0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRcblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgc3VpdGFibGUgYW1vdW50IG9mIHJvb21zXG4gKi9cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2dlbmVyYXRlUm9vbXMgPSBmdW5jdGlvbigpIHtcblx0dmFyIHcgPSB0aGlzLl93aWR0aC0yO1xuXHR2YXIgaCA9IHRoaXMuX2hlaWdodC0yO1xuXG5cdGRvIHtcblx0XHR2YXIgcm9vbSA9IHRoaXMuX2dlbmVyYXRlUm9vbSgpO1xuXHRcdGlmICh0aGlzLl9kdWcvKHcqaCkgPiB0aGlzLl9vcHRpb25zLnJvb21EdWdQZXJjZW50YWdlKSB7IGJyZWFrOyB9IC8qIGFjaGlldmVkIHJlcXVlc3RlZCBhbW91bnQgb2YgZnJlZSBzcGFjZSAqL1xuXHR9IHdoaWxlIChyb29tKTtcblxuXHQvKiBlaXRoZXIgZW5vdWdoIHJvb21zLCBvciBub3QgYWJsZSB0byBnZW5lcmF0ZSBtb3JlIG9mIHRoZW0gOikgKi9cbn1cblxuLyoqXG4gKiBUcnkgdG8gZ2VuZXJhdGUgb25lIHJvb21cbiAqL1xuUk9ULk1hcC5Vbmlmb3JtLnByb3RvdHlwZS5fZ2VuZXJhdGVSb29tID0gZnVuY3Rpb24oKSB7XG5cdHZhciBjb3VudCA9IDA7XG5cdHdoaWxlIChjb3VudCA8IHRoaXMuX3Jvb21BdHRlbXB0cykge1xuXHRcdGNvdW50Kys7XG5cdFx0XG5cdFx0dmFyIHJvb20gPSBST1QuTWFwLkZlYXR1cmUuUm9vbS5jcmVhdGVSYW5kb20odGhpcy5fd2lkdGgsIHRoaXMuX2hlaWdodCwgdGhpcy5fb3B0aW9ucyk7XG5cdFx0aWYgKCFyb29tLmlzVmFsaWQodGhpcy5faXNXYWxsQ2FsbGJhY2ssIHRoaXMuX2NhbkJlRHVnQ2FsbGJhY2spKSB7IGNvbnRpbnVlOyB9XG5cdFx0XG5cdFx0cm9vbS5jcmVhdGUodGhpcy5fZGlnQ2FsbGJhY2spO1xuXHRcdHRoaXMuX3Jvb21zLnB1c2gocm9vbSk7XG5cdFx0cmV0dXJuIHJvb207XG5cdH0gXG5cblx0Lyogbm8gcm9vbSB3YXMgZ2VuZXJhdGVkIGluIGEgZ2l2ZW4gbnVtYmVyIG9mIGF0dGVtcHRzICovXG5cdHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBjb25uZWN0b3JzIGJld2VlbiByb29tc1xuICogQHJldHVybnMge2Jvb2x9IHN1Y2Nlc3MgV2FzIHRoaXMgYXR0ZW1wdCBzdWNjZXNzZnVsbD9cbiAqL1xuUk9ULk1hcC5Vbmlmb3JtLnByb3RvdHlwZS5fZ2VuZXJhdGVDb3JyaWRvcnMgPSBmdW5jdGlvbigpIHtcblx0dmFyIGNudCA9IDA7XG5cdHdoaWxlIChjbnQgPCB0aGlzLl9jb3JyaWRvckF0dGVtcHRzKSB7XG5cdFx0Y250Kys7XG5cdFx0dGhpcy5fY29ycmlkb3JzID0gW107XG5cblx0XHQvKiBkaWcgcm9vbXMgaW50byBhIGNsZWFyIG1hcCAqL1xuXHRcdHRoaXMuX21hcCA9IHRoaXMuX2ZpbGxNYXAoMSk7XG5cdFx0Zm9yICh2YXIgaT0wO2k8dGhpcy5fcm9vbXMubGVuZ3RoO2krKykgeyBcblx0XHRcdHZhciByb29tID0gdGhpcy5fcm9vbXNbaV07XG5cdFx0XHRyb29tLmNsZWFyRG9vcnMoKTtcblx0XHRcdHJvb20uY3JlYXRlKHRoaXMuX2RpZ0NhbGxiYWNrKTsgXG5cdFx0fVxuXG5cdFx0dGhpcy5fdW5jb25uZWN0ZWQgPSB0aGlzLl9yb29tcy5zbGljZSgpLnJhbmRvbWl6ZSgpO1xuXHRcdHRoaXMuX2Nvbm5lY3RlZCA9IFtdO1xuXHRcdGlmICh0aGlzLl91bmNvbm5lY3RlZC5sZW5ndGgpIHsgdGhpcy5fY29ubmVjdGVkLnB1c2godGhpcy5fdW5jb25uZWN0ZWQucG9wKCkpOyB9IC8qIGZpcnN0IG9uZSBpcyBhbHdheXMgY29ubmVjdGVkICovXG5cdFx0XG5cdFx0d2hpbGUgKDEpIHtcblx0XHRcdC8qIDEuIHBpY2sgcmFuZG9tIGNvbm5lY3RlZCByb29tICovXG5cdFx0XHR2YXIgY29ubmVjdGVkID0gdGhpcy5fY29ubmVjdGVkLnJhbmRvbSgpO1xuXHRcdFx0XG5cdFx0XHQvKiAyLiBmaW5kIGNsb3Nlc3QgdW5jb25uZWN0ZWQgKi9cblx0XHRcdHZhciByb29tMSA9IHRoaXMuX2Nsb3Nlc3RSb29tKHRoaXMuX3VuY29ubmVjdGVkLCBjb25uZWN0ZWQpO1xuXHRcdFx0XG5cdFx0XHQvKiAzLiBjb25uZWN0IGl0IHRvIGNsb3Nlc3QgY29ubmVjdGVkICovXG5cdFx0XHR2YXIgcm9vbTIgPSB0aGlzLl9jbG9zZXN0Um9vbSh0aGlzLl9jb25uZWN0ZWQsIHJvb20xKTtcblx0XHRcdFxuXHRcdFx0dmFyIG9rID0gdGhpcy5fY29ubmVjdFJvb21zKHJvb20xLCByb29tMik7XG5cdFx0XHRpZiAoIW9rKSB7IGJyZWFrOyB9IC8qIHN0b3AgY29ubmVjdGluZywgcmUtc2h1ZmZsZSAqL1xuXHRcdFx0XG5cdFx0XHRpZiAoIXRoaXMuX3VuY29ubmVjdGVkLmxlbmd0aCkgeyByZXR1cm4gdHJ1ZTsgfSAvKiBkb25lOyBubyByb29tcyByZW1haW4gKi9cblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIEZvciBhIGdpdmVuIHJvb20sIGZpbmQgdGhlIGNsb3Nlc3Qgb25lIGZyb20gdGhlIGxpc3RcbiAqL1xuUk9ULk1hcC5Vbmlmb3JtLnByb3RvdHlwZS5fY2xvc2VzdFJvb20gPSBmdW5jdGlvbihyb29tcywgcm9vbSkge1xuXHR2YXIgZGlzdCA9IEluZmluaXR5O1xuXHR2YXIgY2VudGVyID0gcm9vbS5nZXRDZW50ZXIoKTtcblx0dmFyIHJlc3VsdCA9IG51bGw7XG5cdFxuXHRmb3IgKHZhciBpPTA7aTxyb29tcy5sZW5ndGg7aSsrKSB7XG5cdFx0dmFyIHIgPSByb29tc1tpXTtcblx0XHR2YXIgYyA9IHIuZ2V0Q2VudGVyKCk7XG5cdFx0dmFyIGR4ID0gY1swXS1jZW50ZXJbMF07XG5cdFx0dmFyIGR5ID0gY1sxXS1jZW50ZXJbMV07XG5cdFx0dmFyIGQgPSBkeCpkeCtkeSpkeTtcblx0XHRcblx0XHRpZiAoZCA8IGRpc3QpIHtcblx0XHRcdGRpc3QgPSBkO1xuXHRcdFx0cmVzdWx0ID0gcjtcblx0XHR9XG5cdH1cblx0XG5cdHJldHVybiByZXN1bHQ7XG59XG5cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2Nvbm5lY3RSb29tcyA9IGZ1bmN0aW9uKHJvb20xLCByb29tMikge1xuXHQvKlxuXHRcdHJvb20xLmRlYnVnKCk7XG5cdFx0cm9vbTIuZGVidWcoKTtcblx0Ki9cblxuXHR2YXIgY2VudGVyMSA9IHJvb20xLmdldENlbnRlcigpO1xuXHR2YXIgY2VudGVyMiA9IHJvb20yLmdldENlbnRlcigpO1xuXG5cdHZhciBkaWZmWCA9IGNlbnRlcjJbMF0gLSBjZW50ZXIxWzBdO1xuXHR2YXIgZGlmZlkgPSBjZW50ZXIyWzFdIC0gY2VudGVyMVsxXTtcblxuXHRpZiAoTWF0aC5hYnMoZGlmZlgpIDwgTWF0aC5hYnMoZGlmZlkpKSB7IC8qIGZpcnN0IHRyeSBjb25uZWN0aW5nIG5vcnRoLXNvdXRoIHdhbGxzICovXG5cdFx0dmFyIGRpckluZGV4MSA9IChkaWZmWSA+IDAgPyAyIDogMCk7XG5cdFx0dmFyIGRpckluZGV4MiA9IChkaXJJbmRleDEgKyAyKSAlIDQ7XG5cdFx0dmFyIG1pbiA9IHJvb20yLmdldExlZnQoKTtcblx0XHR2YXIgbWF4ID0gcm9vbTIuZ2V0UmlnaHQoKTtcblx0XHR2YXIgaW5kZXggPSAwO1xuXHR9IGVsc2UgeyAvKiBmaXJzdCB0cnkgY29ubmVjdGluZyBlYXN0LXdlc3Qgd2FsbHMgKi9cblx0XHR2YXIgZGlySW5kZXgxID0gKGRpZmZYID4gMCA/IDEgOiAzKTtcblx0XHR2YXIgZGlySW5kZXgyID0gKGRpckluZGV4MSArIDIpICUgNDtcblx0XHR2YXIgbWluID0gcm9vbTIuZ2V0VG9wKCk7XG5cdFx0dmFyIG1heCA9IHJvb20yLmdldEJvdHRvbSgpO1xuXHRcdHZhciBpbmRleCA9IDE7XG5cdH1cblxuXHR2YXIgc3RhcnQgPSB0aGlzLl9wbGFjZUluV2FsbChyb29tMSwgZGlySW5kZXgxKTsgLyogY29ycmlkb3Igd2lsbCBzdGFydCBoZXJlICovXG5cdGlmICghc3RhcnQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0aWYgKHN0YXJ0W2luZGV4XSA+PSBtaW4gJiYgc3RhcnRbaW5kZXhdIDw9IG1heCkgeyAvKiBwb3NzaWJsZSB0byBjb25uZWN0IHdpdGggc3RyYWlnaHQgbGluZSAoSS1saWtlKSAqL1xuXHRcdHZhciBlbmQgPSBzdGFydC5zbGljZSgpO1xuXHRcdHZhciB2YWx1ZSA9IG51bGw7XG5cdFx0c3dpdGNoIChkaXJJbmRleDIpIHtcblx0XHRcdGNhc2UgMDogdmFsdWUgPSByb29tMi5nZXRUb3AoKS0xOyBicmVhaztcblx0XHRcdGNhc2UgMTogdmFsdWUgPSByb29tMi5nZXRSaWdodCgpKzE7IGJyZWFrO1xuXHRcdFx0Y2FzZSAyOiB2YWx1ZSA9IHJvb20yLmdldEJvdHRvbSgpKzE7IGJyZWFrO1xuXHRcdFx0Y2FzZSAzOiB2YWx1ZSA9IHJvb20yLmdldExlZnQoKS0xOyBicmVhaztcblx0XHR9XG5cdFx0ZW5kWyhpbmRleCsxKSUyXSA9IHZhbHVlO1xuXHRcdHRoaXMuX2RpZ0xpbmUoW3N0YXJ0LCBlbmRdKTtcblx0XHRcblx0fSBlbHNlIGlmIChzdGFydFtpbmRleF0gPCBtaW4tMSB8fCBzdGFydFtpbmRleF0gPiBtYXgrMSkgeyAvKiBuZWVkIHRvIHN3aXRjaCB0YXJnZXQgd2FsbCAoTC1saWtlKSAqL1xuXG5cdFx0dmFyIGRpZmYgPSBzdGFydFtpbmRleF0gLSBjZW50ZXIyW2luZGV4XTtcblx0XHRzd2l0Y2ggKGRpckluZGV4Mikge1xuXHRcdFx0Y2FzZSAwOlxuXHRcdFx0Y2FzZSAxOlx0dmFyIHJvdGF0aW9uID0gKGRpZmYgPCAwID8gMyA6IDEpOyBicmVhaztcblx0XHRcdGNhc2UgMjpcblx0XHRcdGNhc2UgMzpcdHZhciByb3RhdGlvbiA9IChkaWZmIDwgMCA/IDEgOiAzKTsgYnJlYWs7XG5cdFx0fVxuXHRcdGRpckluZGV4MiA9IChkaXJJbmRleDIgKyByb3RhdGlvbikgJSA0O1xuXHRcdFxuXHRcdHZhciBlbmQgPSB0aGlzLl9wbGFjZUluV2FsbChyb29tMiwgZGlySW5kZXgyKTtcblx0XHRpZiAoIWVuZCkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRcdHZhciBtaWQgPSBbMCwgMF07XG5cdFx0bWlkW2luZGV4XSA9IHN0YXJ0W2luZGV4XTtcblx0XHR2YXIgaW5kZXgyID0gKGluZGV4KzEpJTI7XG5cdFx0bWlkW2luZGV4Ml0gPSBlbmRbaW5kZXgyXTtcblx0XHR0aGlzLl9kaWdMaW5lKFtzdGFydCwgbWlkLCBlbmRdKTtcblx0XHRcblx0fSBlbHNlIHsgLyogdXNlIGN1cnJlbnQgd2FsbCBwYWlyLCBidXQgYWRqdXN0IHRoZSBsaW5lIGluIHRoZSBtaWRkbGUgKFMtbGlrZSkgKi9cblx0XG5cdFx0dmFyIGluZGV4MiA9IChpbmRleCsxKSUyO1xuXHRcdHZhciBlbmQgPSB0aGlzLl9wbGFjZUluV2FsbChyb29tMiwgZGlySW5kZXgyKTtcblx0XHRpZiAoIWVuZCkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHR2YXIgbWlkID0gTWF0aC5yb3VuZCgoZW5kW2luZGV4Ml0gKyBzdGFydFtpbmRleDJdKS8yKTtcblxuXHRcdHZhciBtaWQxID0gWzAsIDBdO1xuXHRcdHZhciBtaWQyID0gWzAsIDBdO1xuXHRcdG1pZDFbaW5kZXhdID0gc3RhcnRbaW5kZXhdO1xuXHRcdG1pZDFbaW5kZXgyXSA9IG1pZDtcblx0XHRtaWQyW2luZGV4XSA9IGVuZFtpbmRleF07XG5cdFx0bWlkMltpbmRleDJdID0gbWlkO1xuXHRcdHRoaXMuX2RpZ0xpbmUoW3N0YXJ0LCBtaWQxLCBtaWQyLCBlbmRdKTtcblx0fVxuXG5cdHJvb20xLmFkZERvb3Ioc3RhcnRbMF0sIHN0YXJ0WzFdKTtcblx0cm9vbTIuYWRkRG9vcihlbmRbMF0sIGVuZFsxXSk7XG5cdFxuXHR2YXIgaW5kZXggPSB0aGlzLl91bmNvbm5lY3RlZC5pbmRleE9mKHJvb20xKTtcblx0aWYgKGluZGV4ICE9IC0xKSB7XG5cdFx0dGhpcy5fdW5jb25uZWN0ZWQuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR0aGlzLl9jb25uZWN0ZWQucHVzaChyb29tMSk7XG5cdH1cblxuXHR2YXIgaW5kZXggPSB0aGlzLl91bmNvbm5lY3RlZC5pbmRleE9mKHJvb20yKTtcblx0aWYgKGluZGV4ICE9IC0xKSB7XG5cdFx0dGhpcy5fdW5jb25uZWN0ZWQuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR0aGlzLl9jb25uZWN0ZWQucHVzaChyb29tMik7XG5cdH1cblx0XG5cdHJldHVybiB0cnVlO1xufVxuXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9wbGFjZUluV2FsbCA9IGZ1bmN0aW9uKHJvb20sIGRpckluZGV4KSB7XG5cdHZhciBzdGFydCA9IFswLCAwXTtcblx0dmFyIGRpciA9IFswLCAwXTtcblx0dmFyIGxlbmd0aCA9IDA7XG5cdFxuXHRzd2l0Y2ggKGRpckluZGV4KSB7XG5cdFx0Y2FzZSAwOlxuXHRcdFx0ZGlyID0gWzEsIDBdO1xuXHRcdFx0c3RhcnQgPSBbcm9vbS5nZXRMZWZ0KCksIHJvb20uZ2V0VG9wKCktMV07XG5cdFx0XHRsZW5ndGggPSByb29tLmdldFJpZ2h0KCktcm9vbS5nZXRMZWZ0KCkrMTtcblx0XHRicmVhaztcblx0XHRjYXNlIDE6XG5cdFx0XHRkaXIgPSBbMCwgMV07XG5cdFx0XHRzdGFydCA9IFtyb29tLmdldFJpZ2h0KCkrMSwgcm9vbS5nZXRUb3AoKV07XG5cdFx0XHRsZW5ndGggPSByb29tLmdldEJvdHRvbSgpLXJvb20uZ2V0VG9wKCkrMTtcblx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRkaXIgPSBbMSwgMF07XG5cdFx0XHRzdGFydCA9IFtyb29tLmdldExlZnQoKSwgcm9vbS5nZXRCb3R0b20oKSsxXTtcblx0XHRcdGxlbmd0aCA9IHJvb20uZ2V0UmlnaHQoKS1yb29tLmdldExlZnQoKSsxO1xuXHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdGRpciA9IFswLCAxXTtcblx0XHRcdHN0YXJ0ID0gW3Jvb20uZ2V0TGVmdCgpLTEsIHJvb20uZ2V0VG9wKCldO1xuXHRcdFx0bGVuZ3RoID0gcm9vbS5nZXRCb3R0b20oKS1yb29tLmdldFRvcCgpKzE7XG5cdFx0YnJlYWs7XG5cdH1cblx0XG5cdHZhciBhdmFpbCA9IFtdO1xuXHR2YXIgbGFzdEJhZEluZGV4ID0gLTI7XG5cblx0Zm9yICh2YXIgaT0wO2k8bGVuZ3RoO2krKykge1xuXHRcdHZhciB4ID0gc3RhcnRbMF0gKyBpKmRpclswXTtcblx0XHR2YXIgeSA9IHN0YXJ0WzFdICsgaSpkaXJbMV07XG5cdFx0YXZhaWwucHVzaChudWxsKTtcblx0XHRcblx0XHR2YXIgaXNXYWxsID0gKHRoaXMuX21hcFt4XVt5XSA9PSAxKTtcblx0XHRpZiAoaXNXYWxsKSB7XG5cdFx0XHRpZiAobGFzdEJhZEluZGV4ICE9IGktMSkgeyBhdmFpbFtpXSA9IFt4LCB5XTsgfVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRsYXN0QmFkSW5kZXggPSBpO1xuXHRcdFx0aWYgKGkpIHsgYXZhaWxbaS0xXSA9IG51bGw7IH1cblx0XHR9XG5cdH1cblx0XG5cdGZvciAodmFyIGk9YXZhaWwubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuXHRcdGlmICghYXZhaWxbaV0pIHsgYXZhaWwuc3BsaWNlKGksIDEpOyB9XG5cdH1cblx0cmV0dXJuIChhdmFpbC5sZW5ndGggPyBhdmFpbC5yYW5kb20oKSA6IG51bGwpO1xufVxuXG4vKipcbiAqIERpZyBhIHBvbHlsaW5lLlxuICovXG5ST1QuTWFwLlVuaWZvcm0ucHJvdG90eXBlLl9kaWdMaW5lID0gZnVuY3Rpb24ocG9pbnRzKSB7XG5cdGZvciAodmFyIGk9MTtpPHBvaW50cy5sZW5ndGg7aSsrKSB7XG5cdFx0dmFyIHN0YXJ0ID0gcG9pbnRzW2ktMV07XG5cdFx0dmFyIGVuZCA9IHBvaW50c1tpXTtcblx0XHR2YXIgY29ycmlkb3IgPSBuZXcgUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yKHN0YXJ0WzBdLCBzdGFydFsxXSwgZW5kWzBdLCBlbmRbMV0pO1xuXHRcdGNvcnJpZG9yLmNyZWF0ZSh0aGlzLl9kaWdDYWxsYmFjayk7XG5cdFx0dGhpcy5fY29ycmlkb3JzLnB1c2goY29ycmlkb3IpO1xuXHR9XG59XG5cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2RpZ0NhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcblx0dGhpcy5fbWFwW3hdW3ldID0gdmFsdWU7XG5cdGlmICh2YWx1ZSA9PSAwKSB7IHRoaXMuX2R1ZysrOyB9XG59XG5cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2lzV2FsbENhbGxiYWNrID0gZnVuY3Rpb24oeCwgeSkge1xuXHRpZiAoeCA8IDAgfHwgeSA8IDAgfHwgeCA+PSB0aGlzLl93aWR0aCB8fCB5ID49IHRoaXMuX2hlaWdodCkgeyByZXR1cm4gZmFsc2U7IH1cblx0cmV0dXJuICh0aGlzLl9tYXBbeF1beV0gPT0gMSk7XG59XG5cblJPVC5NYXAuVW5pZm9ybS5wcm90b3R5cGUuX2NhbkJlRHVnQ2FsbGJhY2sgPSBmdW5jdGlvbih4LCB5KSB7XG5cdGlmICh4IDwgMSB8fCB5IDwgMSB8fCB4KzEgPj0gdGhpcy5fd2lkdGggfHwgeSsxID49IHRoaXMuX2hlaWdodCkgeyByZXR1cm4gZmFsc2U7IH1cblx0cmV0dXJuICh0aGlzLl9tYXBbeF1beV0gPT0gMSk7XG59XG5cbi8qKlxuICogQGF1dGhvciBoeWFrdWdlaVxuICogQGNsYXNzIER1bmdlb24gZ2VuZXJhdG9yIHdoaWNoIHVzZXMgdGhlIFwib3JnaW5hbFwiIFJvZ3VlIGR1bmdlb24gZ2VuZXJhdGlvbiBhbGdvcml0aG0uIFNlZSBodHRwOi8va3VvaS5jb20vfmthbWlrYXplL0dhbWVEZXNpZ24vYXJ0MDdfcm9ndWVfZHVuZ2Vvbi5waHBcbiAqIEBhdWdtZW50cyBST1QuTWFwXG4gKiBAcGFyYW0ge2ludH0gW3dpZHRoPVJPVC5ERUZBVUxUX1dJRFRIXVxuICogQHBhcmFtIHtpbnR9IFtoZWlnaHQ9Uk9ULkRFRkFVTFRfSEVJR0hUXVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBPcHRpb25zXG4gKiBAcGFyYW0ge2ludFtdfSBbb3B0aW9ucy5jZWxsV2lkdGg9M10gTnVtYmVyIG9mIGNlbGxzIHRvIGNyZWF0ZSBvbiB0aGUgaG9yaXpvbnRhbCAobnVtYmVyIG9mIHJvb21zIGhvcml6b250YWxseSlcbiAqIEBwYXJhbSB7aW50W119IFtvcHRpb25zLmNlbGxIZWlnaHQ9M10gTnVtYmVyIG9mIGNlbGxzIHRvIGNyZWF0ZSBvbiB0aGUgdmVydGljYWwgKG51bWJlciBvZiByb29tcyB2ZXJ0aWNhbGx5KSBcbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy5yb29tV2lkdGhdIFJvb20gbWluIGFuZCBtYXggd2lkdGggLSBub3JtYWxseSBzZXQgYXV0by1tYWdpY2FsbHkgdmlhIHRoZSBjb25zdHJ1Y3Rvci5cbiAqIEBwYXJhbSB7aW50fSBbb3B0aW9ucy5yb29tSGVpZ2h0XSBSb29tIG1pbiBhbmQgbWF4IGhlaWdodCAtIG5vcm1hbGx5IHNldCBhdXRvLW1hZ2ljYWxseSB2aWEgdGhlIGNvbnN0cnVjdG9yLiBcbiAqL1xuUk9ULk1hcC5Sb2d1ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMpIHtcblx0Uk9ULk1hcC5jYWxsKHRoaXMsIHdpZHRoLCBoZWlnaHQpO1xuXHRcblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHRjZWxsV2lkdGg6IDMsICAvLyBOT1RFIHRvIHNlbGYsIHRoZXNlIGNvdWxkIHByb2JhYmx5IHdvcmsgdGhlIHNhbWUgYXMgdGhlIHJvb21XaWR0aC9yb29tIEhlaWdodCB2YWx1ZXNcblx0XHRjZWxsSGVpZ2h0OiAzICAvLyAgICAgaWUuIGFzIGFuIGFycmF5IHdpdGggbWluLW1heCB2YWx1ZXMgZm9yIGVhY2ggZGlyZWN0aW9uLi4uLlxuXHR9XG5cdFxuXHRmb3IgKHZhciBwIGluIG9wdGlvbnMpIHsgdGhpcy5fb3B0aW9uc1twXSA9IG9wdGlvbnNbcF07IH1cblx0XG5cdC8qXG5cdFNldCB0aGUgcm9vbSBzaXplcyBhY2NvcmRpbmcgdG8gdGhlIG92ZXItYWxsIHdpZHRoIG9mIHRoZSBtYXAsIFxuXHRhbmQgdGhlIGNlbGwgc2l6ZXMuIFxuXHQqL1xuXHRcblx0aWYgKCF0aGlzLl9vcHRpb25zLmhhc093blByb3BlcnR5KFwicm9vbVdpZHRoXCIpKSB7XG5cdFx0dGhpcy5fb3B0aW9uc1tcInJvb21XaWR0aFwiXSA9IHRoaXMuX2NhbGN1bGF0ZVJvb21TaXplKHRoaXMuX3dpZHRoLCB0aGlzLl9vcHRpb25zW1wiY2VsbFdpZHRoXCJdKTtcblx0fVxuXHRpZiAoIXRoaXMuX29wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJyb29tSGVpZ2h0XCIpKSB7XG5cdFx0dGhpcy5fb3B0aW9uc1tcInJvb21IZWlnaHRcIl0gPSB0aGlzLl9jYWxjdWxhdGVSb29tU2l6ZSh0aGlzLl9oZWlnaHQsIHRoaXMuX29wdGlvbnNbXCJjZWxsSGVpZ2h0XCJdKTtcblx0fVxuXHRcbn1cblxuUk9ULk1hcC5Sb2d1ZS5leHRlbmQoUk9ULk1hcCk7IFxuXG4vKipcbiAqIEBzZWUgUk9ULk1hcCNjcmVhdGVcbiAqL1xuUk9ULk1hcC5Sb2d1ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dGhpcy5tYXAgPSB0aGlzLl9maWxsTWFwKDEpO1xuXHR0aGlzLnJvb21zID0gW107XG5cdHRoaXMuY29ubmVjdGVkQ2VsbHMgPSBbXTtcblx0XG5cdHRoaXMuX2luaXRSb29tcygpO1xuXHR0aGlzLl9jb25uZWN0Um9vbXMoKTtcblx0dGhpcy5fY29ubmVjdFVuY29ubmVjdGVkUm9vbXMoKTtcblx0dGhpcy5fY3JlYXRlUmFuZG9tUm9vbUNvbm5lY3Rpb25zKCk7XG5cdHRoaXMuX2NyZWF0ZVJvb21zKCk7XG5cdHRoaXMuX2NyZWF0ZUNvcnJpZG9ycygpO1xuXHRcblx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl93aWR0aDsgaSsrKSB7XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX2hlaWdodDsgaisrKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGksIGosIHRoaXMubWFwW2ldW2pdKTsgICBcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0XG5cdHJldHVybiB0aGlzO1xufVxuXG5ST1QuTWFwLlJvZ3VlLnByb3RvdHlwZS5fY2FsY3VsYXRlUm9vbVNpemUgPSBmdW5jdGlvbihzaXplLCBjZWxsKSB7XG5cdHZhciBtYXggPSBNYXRoLmZsb29yKChzaXplL2NlbGwpICogMC44KTtcblx0dmFyIG1pbiA9IE1hdGguZmxvb3IoKHNpemUvY2VsbCkgKiAwLjI1KTtcblx0aWYgKG1pbiA8IDIpIG1pbiA9IDI7XG5cdGlmIChtYXggPCAyKSBtYXggPSAyO1xuXHRyZXR1cm4gW21pbiwgbWF4XTtcbn1cblxuUk9ULk1hcC5Sb2d1ZS5wcm90b3R5cGUuX2luaXRSb29tcyA9IGZ1bmN0aW9uICgpIHsgXG5cdC8vIGNyZWF0ZSByb29tcyBhcnJheS4gVGhpcyBpcyB0aGUgXCJncmlkXCIgbGlzdCBmcm9tIHRoZSBhbGdvLiAgXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fb3B0aW9ucy5jZWxsV2lkdGg7IGkrKykgeyAgXG5cdFx0dGhpcy5yb29tcy5wdXNoKFtdKTtcblx0XHRmb3IodmFyIGogPSAwOyBqIDwgdGhpcy5fb3B0aW9ucy5jZWxsSGVpZ2h0OyBqKyspIHtcblx0XHRcdHRoaXMucm9vbXNbaV0ucHVzaCh7XCJ4XCI6MCwgXCJ5XCI6MCwgXCJ3aWR0aFwiOjAsIFwiaGVpZ2h0XCI6MCwgXCJjb25uZWN0aW9uc1wiOltdLCBcImNlbGx4XCI6aSwgXCJjZWxseVwiOmp9KTtcblx0XHR9XG5cdH1cbn1cblxuUk9ULk1hcC5Sb2d1ZS5wcm90b3R5cGUuX2Nvbm5lY3RSb29tcyA9IGZ1bmN0aW9uKCkge1xuXHQvL3BpY2sgcmFuZG9tIHN0YXJ0aW5nIGdyaWRcblx0dmFyIGNneCA9IFJPVC5STkcuZ2V0VW5pZm9ybUludCgwLCB0aGlzLl9vcHRpb25zLmNlbGxXaWR0aC0xKTtcblx0dmFyIGNneSA9IFJPVC5STkcuZ2V0VW5pZm9ybUludCgwLCB0aGlzLl9vcHRpb25zLmNlbGxIZWlnaHQtMSk7XG5cdFxuXHR2YXIgaWR4O1xuXHR2YXIgbmNneDtcblx0dmFyIG5jZ3k7XG5cdFxuXHR2YXIgZm91bmQgPSBmYWxzZTtcblx0dmFyIHJvb207XG5cdHZhciBvdGhlclJvb207XG5cdFxuXHQvLyBmaW5kICB1bmNvbm5lY3RlZCBuZWlnaGJvdXIgY2VsbHNcblx0ZG8ge1xuXHRcblx0XHQvL3ZhciBkaXJUb0NoZWNrID0gWzAsMSwyLDMsNCw1LDYsN107XG5cdFx0dmFyIGRpclRvQ2hlY2sgPSBbMCwyLDQsNl07XG5cdFx0ZGlyVG9DaGVjayA9IGRpclRvQ2hlY2sucmFuZG9taXplKCk7XG5cdFx0XG5cdFx0ZG8ge1xuXHRcdFx0Zm91bmQgPSBmYWxzZTtcblx0XHRcdGlkeCA9IGRpclRvQ2hlY2sucG9wKCk7XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0bmNneCA9IGNneCArIFJPVC5ESVJTWzhdW2lkeF1bMF07XG5cdFx0XHRuY2d5ID0gY2d5ICsgUk9ULkRJUlNbOF1baWR4XVsxXTtcblx0XHRcdFxuXHRcdFx0aWYobmNneCA8IDAgfHwgbmNneCA+PSB0aGlzLl9vcHRpb25zLmNlbGxXaWR0aCkgY29udGludWU7XG5cdFx0XHRpZihuY2d5IDwgMCB8fCBuY2d5ID49IHRoaXMuX29wdGlvbnMuY2VsbEhlaWdodCkgY29udGludWU7XG5cdFx0XHRcblx0XHRcdHJvb20gPSB0aGlzLnJvb21zW2NneF1bY2d5XTtcblx0XHRcdFxuXHRcdFx0aWYocm9vbVtcImNvbm5lY3Rpb25zXCJdLmxlbmd0aCA+IDApXG5cdFx0XHR7XG5cdFx0XHRcdC8vIGFzIGxvbmcgYXMgdGhpcyByb29tIGRvZXNuJ3QgYWxyZWFkeSBjb29uZWN0IHRvIG1lLCB3ZSBhcmUgb2sgd2l0aCBpdC4gXG5cdFx0XHRcdGlmKHJvb21bXCJjb25uZWN0aW9uc1wiXVswXVswXSA9PSBuY2d4ICYmXG5cdFx0XHRcdHJvb21bXCJjb25uZWN0aW9uc1wiXVswXVsxXSA9PSBuY2d5KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0b3RoZXJSb29tID0gdGhpcy5yb29tc1tuY2d4XVtuY2d5XTtcblx0XHRcdFxuXHRcdFx0aWYgKG90aGVyUm9vbVtcImNvbm5lY3Rpb25zXCJdLmxlbmd0aCA9PSAwKSB7IFxuXHRcdFx0XHRvdGhlclJvb21bXCJjb25uZWN0aW9uc1wiXS5wdXNoKFtjZ3gsY2d5XSk7XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmNvbm5lY3RlZENlbGxzLnB1c2goW25jZ3gsIG5jZ3ldKTtcblx0XHRcdFx0Y2d4ID0gbmNneDtcblx0XHRcdFx0Y2d5ID0gbmNneTtcblx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdH0gd2hpbGUgKGRpclRvQ2hlY2subGVuZ3RoID4gMCAmJiBmb3VuZCA9PSBmYWxzZSlcblx0XHRcblx0fSB3aGlsZSAoZGlyVG9DaGVjay5sZW5ndGggPiAwKVxuXG59XG5cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9jb25uZWN0VW5jb25uZWN0ZWRSb29tcyA9IGZ1bmN0aW9uKCkge1xuXHQvL1doaWxlIHRoZXJlIGFyZSB1bmNvbm5lY3RlZCByb29tcywgdHJ5IHRvIGNvbm5lY3QgdGhlbSB0byBhIHJhbmRvbSBjb25uZWN0ZWQgbmVpZ2hib3IgXG5cdC8vKGlmIGEgcm9vbSBoYXMgbm8gY29ubmVjdGVkIG5laWdoYm9ycyB5ZXQsIGp1c3Qga2VlcCBjeWNsaW5nLCB5b3UnbGwgZmlsbCBvdXQgdG8gaXQgZXZlbnR1YWxseSkuXG5cdHZhciBjdyA9IHRoaXMuX29wdGlvbnMuY2VsbFdpZHRoO1xuXHR2YXIgY2ggPSB0aGlzLl9vcHRpb25zLmNlbGxIZWlnaHQ7XG5cdFxuXHR2YXIgcmFuZG9tQ29ubmVjdGVkQ2VsbDtcblx0dGhpcy5jb25uZWN0ZWRDZWxscyA9IHRoaXMuY29ubmVjdGVkQ2VsbHMucmFuZG9taXplKCk7XG5cdHZhciByb29tO1xuXHR2YXIgb3RoZXJSb29tO1xuXHR2YXIgdmFsaWRSb29tO1xuXHRcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9vcHRpb25zLmNlbGxXaWR0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLl9vcHRpb25zLmNlbGxIZWlnaHQ7IGorKykgIHtcblx0XHRcdFx0XG5cdFx0XHRyb29tID0gdGhpcy5yb29tc1tpXVtqXTtcblx0XHRcdFxuXHRcdFx0aWYgKHJvb21bXCJjb25uZWN0aW9uc1wiXS5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHR2YXIgZGlyZWN0aW9ucyA9IFswLDIsNCw2XTtcblx0XHRcdFx0ZGlyZWN0aW9ucyA9IGRpcmVjdGlvbnMucmFuZG9taXplKCk7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgdmFsaWRSb29tID0gZmFsc2U7XG5cdFx0XHRcdFxuXHRcdFx0XHRkbyB7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0dmFyIGRpcklkeCA9IGRpcmVjdGlvbnMucG9wKCk7XG5cdFx0XHRcdFx0dmFyIG5ld0kgPSBpICsgUk9ULkRJUlNbOF1bZGlySWR4XVswXTtcblx0XHRcdFx0XHR2YXIgbmV3SiA9IGogKyBST1QuRElSU1s4XVtkaXJJZHhdWzFdO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChuZXdJIDwgMCB8fCBuZXdJID49IGN3IHx8IFxuXHRcdFx0XHRcdG5ld0ogPCAwIHx8IG5ld0ogPj0gY2gpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRvdGhlclJvb20gPSB0aGlzLnJvb21zW25ld0ldW25ld0pdO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhbGlkUm9vbSA9IHRydWU7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKG90aGVyUm9vbVtcImNvbm5lY3Rpb25zXCJdLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Zm9yICh2YXIgayA9IDA7IGsgPCBvdGhlclJvb21bXCJjb25uZWN0aW9uc1wiXS5sZW5ndGg7IGsrKykge1xuXHRcdFx0XHRcdFx0aWYob3RoZXJSb29tW1wiY29ubmVjdGlvbnNcIl1ba11bMF0gPT0gaSAmJiBcblx0XHRcdFx0XHRcdG90aGVyUm9vbVtcImNvbm5lY3Rpb25zXCJdW2tdWzFdID09IGopIHtcblx0XHRcdFx0XHRcdFx0dmFsaWRSb29tID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiAodmFsaWRSb29tKSBicmVhaztcblx0XHRcdFx0XHRcblx0XHRcdFx0fSB3aGlsZSAoZGlyZWN0aW9ucy5sZW5ndGgpXG5cdFx0XHRcdFxuXHRcdFx0XHRpZih2YWxpZFJvb20pIHsgXG5cdFx0XHRcdFx0cm9vbVtcImNvbm5lY3Rpb25zXCJdLnB1c2goIFtvdGhlclJvb21bXCJjZWxseFwiXSwgb3RoZXJSb29tW1wiY2VsbHlcIl1dICk7ICBcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIi0tIFVuYWJsZSB0byBjb25uZWN0IHJvb20uXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9jcmVhdGVSYW5kb21Sb29tQ29ubmVjdGlvbnMgPSBmdW5jdGlvbihjb25uZWN0aW9ucykge1xuXHQvLyBFbXB0eSBmb3Igbm93LiBcbn1cblxuXG5ST1QuTWFwLlJvZ3VlLnByb3RvdHlwZS5fY3JlYXRlUm9vbXMgPSBmdW5jdGlvbigpIHtcblx0Ly8gQ3JlYXRlIFJvb21zIFxuXHRcblx0dmFyIHcgPSB0aGlzLl93aWR0aDtcblx0dmFyIGggPSB0aGlzLl9oZWlnaHQ7XG5cdFxuXHR2YXIgY3cgPSB0aGlzLl9vcHRpb25zLmNlbGxXaWR0aDtcblx0dmFyIGNoID0gdGhpcy5fb3B0aW9ucy5jZWxsSGVpZ2h0O1xuXHRcblx0dmFyIGN3cCA9IE1hdGguZmxvb3IodGhpcy5fd2lkdGggLyBjdyk7XG5cdHZhciBjaHAgPSBNYXRoLmZsb29yKHRoaXMuX2hlaWdodCAvIGNoKTtcblx0XG5cdHZhciByb29tdztcblx0dmFyIHJvb21oO1xuXHR2YXIgcm9vbVdpZHRoID0gdGhpcy5fb3B0aW9uc1tcInJvb21XaWR0aFwiXTtcblx0dmFyIHJvb21IZWlnaHQgPSB0aGlzLl9vcHRpb25zW1wicm9vbUhlaWdodFwiXTtcblx0dmFyIHN4O1xuXHR2YXIgc3k7XG5cdHZhciB0eDtcblx0dmFyIHR5O1xuXHR2YXIgb3RoZXJSb29tO1xuXHRcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjdzsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaDsgaisrKSB7XG5cdFx0XHRzeCA9IGN3cCAqIGk7XG5cdFx0XHRzeSA9IGNocCAqIGo7XG5cdFx0XHRcblx0XHRcdGlmIChzeCA9PSAwKSBzeCA9IDE7XG5cdFx0XHRpZiAoc3kgPT0gMCkgc3kgPSAxO1xuXHRcdFx0XG5cdFx0XHRyb29tdyA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChyb29tV2lkdGhbMF0sIHJvb21XaWR0aFsxXSk7XG5cdFx0XHRyb29taCA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChyb29tSGVpZ2h0WzBdLCByb29tSGVpZ2h0WzFdKTtcblx0XHRcdFxuXHRcdFx0aWYgKGogPiAwKSB7XG5cdFx0XHRcdG90aGVyUm9vbSA9IHRoaXMucm9vbXNbaV1bai0xXTtcblx0XHRcdFx0d2hpbGUgKHN5IC0gKG90aGVyUm9vbVtcInlcIl0gKyBvdGhlclJvb21bXCJoZWlnaHRcIl0gKSA8IDMpIHtcblx0XHRcdFx0XHRzeSsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmIChpID4gMCkge1xuXHRcdFx0XHRvdGhlclJvb20gPSB0aGlzLnJvb21zW2ktMV1bal07XG5cdFx0XHRcdHdoaWxlKHN4IC0gKG90aGVyUm9vbVtcInhcIl0gKyBvdGhlclJvb21bXCJ3aWR0aFwiXSkgPCAzKSB7XG5cdFx0XHRcdFx0c3grKztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgc3hPZmZzZXQgPSBNYXRoLnJvdW5kKFJPVC5STkcuZ2V0VW5pZm9ybUludCgwLCBjd3Atcm9vbXcpLzIpO1xuXHRcdFx0dmFyIHN5T2Zmc2V0ID0gTWF0aC5yb3VuZChST1QuUk5HLmdldFVuaWZvcm1JbnQoMCwgY2hwLXJvb21oKS8yKTtcblx0XHRcdFxuXHRcdFx0d2hpbGUgKHN4ICsgc3hPZmZzZXQgKyByb29tdyA+PSB3KSB7XG5cdFx0XHRcdGlmKHN4T2Zmc2V0KSB7XG5cdFx0XHRcdFx0c3hPZmZzZXQtLTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyb29tdy0tOyBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR3aGlsZSAoc3kgKyBzeU9mZnNldCArIHJvb21oID49IGgpIHsgXG5cdFx0XHRcdGlmKHN5T2Zmc2V0KSB7XG5cdFx0XHRcdFx0c3lPZmZzZXQtLTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyb29taC0tOyBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRzeCA9IHN4ICsgc3hPZmZzZXQ7XG5cdFx0XHRzeSA9IHN5ICsgc3lPZmZzZXQ7XG5cdFx0XHRcblx0XHRcdHRoaXMucm9vbXNbaV1bal1bXCJ4XCJdID0gc3g7XG5cdFx0XHR0aGlzLnJvb21zW2ldW2pdW1wieVwiXSA9IHN5O1xuXHRcdFx0dGhpcy5yb29tc1tpXVtqXVtcIndpZHRoXCJdID0gcm9vbXc7XG5cdFx0XHR0aGlzLnJvb21zW2ldW2pdW1wiaGVpZ2h0XCJdID0gcm9vbWg7ICBcblx0XHRcdFxuXHRcdFx0Zm9yICh2YXIgaWkgPSBzeDsgaWkgPCBzeCArIHJvb213OyBpaSsrKSB7XG5cdFx0XHRcdGZvciAodmFyIGpqID0gc3k7IGpqIDwgc3kgKyByb29taDsgamorKykge1xuXHRcdFx0XHRcdHRoaXMubWFwW2lpXVtqal0gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHR9ICBcblx0XHR9XG5cdH1cbn1cblxuUk9ULk1hcC5Sb2d1ZS5wcm90b3R5cGUuX2dldFdhbGxQb3NpdGlvbiA9IGZ1bmN0aW9uKGFSb29tLCBhRGlyZWN0aW9uKSB7XG5cdHZhciByeDtcblx0dmFyIHJ5O1xuXHR2YXIgZG9vcjtcblx0XG5cdGlmIChhRGlyZWN0aW9uID09IDEgfHwgYURpcmVjdGlvbiA9PSAzKSB7XG5cdFx0cnggPSBST1QuUk5HLmdldFVuaWZvcm1JbnQoYVJvb21bXCJ4XCJdICsgMSwgYVJvb21bXCJ4XCJdICsgYVJvb21bXCJ3aWR0aFwiXSAtIDIpO1xuXHRcdGlmIChhRGlyZWN0aW9uID09IDEpIHtcblx0XHRcdHJ5ID0gYVJvb21bXCJ5XCJdIC0gMjtcblx0XHRcdGRvb3IgPSByeSArIDE7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJ5ID0gYVJvb21bXCJ5XCJdICsgYVJvb21bXCJoZWlnaHRcIl0gKyAxO1xuXHRcdFx0ZG9vciA9IHJ5IC0xO1xuXHRcdH1cblx0XHRcblx0XHR0aGlzLm1hcFtyeF1bZG9vcl0gPSAwOyAvLyBpJ20gbm90IHNldHRpbmcgYSBzcGVjaWZpYyAnZG9vcicgdGlsZSB2YWx1ZSByaWdodCBub3csIGp1c3QgZW1wdHkgc3BhY2UuIFxuXHRcdFxuXHR9IGVsc2UgaWYgKGFEaXJlY3Rpb24gPT0gMiB8fCBhRGlyZWN0aW9uID09IDQpIHtcblx0XHRyeSA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChhUm9vbVtcInlcIl0gKyAxLCBhUm9vbVtcInlcIl0gKyBhUm9vbVtcImhlaWdodFwiXSAtIDIpO1xuXHRcdGlmKGFEaXJlY3Rpb24gPT0gMikge1xuXHRcdFx0cnggPSBhUm9vbVtcInhcIl0gKyBhUm9vbVtcIndpZHRoXCJdICsgMTtcblx0XHRcdGRvb3IgPSByeCAtIDE7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJ4ID0gYVJvb21bXCJ4XCJdIC0gMjtcblx0XHRcdGRvb3IgPSByeCArIDE7XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMubWFwW2Rvb3JdW3J5XSA9IDA7IC8vIGknbSBub3Qgc2V0dGluZyBhIHNwZWNpZmljICdkb29yJyB0aWxlIHZhbHVlIHJpZ2h0IG5vdywganVzdCBlbXB0eSBzcGFjZS4gXG5cdFx0XG5cdH1cblx0cmV0dXJuIFtyeCwgcnldO1xufVxuXG4vKioqXG4qIEBwYXJhbSBzdGFydFBvc2l0aW9uIGEgMiBlbGVtZW50IGFycmF5XG4qIEBwYXJhbSBlbmRQb3NpdGlvbiBhIDIgZWxlbWVudCBhcnJheVxuKi9cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9kcmF3Q29ycmlkb3JlID0gZnVuY3Rpb24gKHN0YXJ0UG9zaXRpb24sIGVuZFBvc2l0aW9uKSB7XG5cdHZhciB4T2Zmc2V0ID0gZW5kUG9zaXRpb25bMF0gLSBzdGFydFBvc2l0aW9uWzBdO1xuXHR2YXIgeU9mZnNldCA9IGVuZFBvc2l0aW9uWzFdIC0gc3RhcnRQb3NpdGlvblsxXTtcblx0XG5cdHZhciB4cG9zID0gc3RhcnRQb3NpdGlvblswXTtcblx0dmFyIHlwb3MgPSBzdGFydFBvc2l0aW9uWzFdO1xuXHRcblx0dmFyIHRlbXBEaXN0O1xuXHR2YXIgeERpcjtcblx0dmFyIHlEaXI7XG5cdFxuXHR2YXIgbW92ZTsgLy8gMiBlbGVtZW50IGFycmF5LCBlbGVtZW50IDAgaXMgdGhlIGRpcmVjdGlvbiwgZWxlbWVudCAxIGlzIHRoZSB0b3RhbCB2YWx1ZSB0byBtb3ZlLiBcblx0dmFyIG1vdmVzID0gW107IC8vIGEgbGlzdCBvZiAyIGVsZW1lbnQgYXJyYXlzXG5cdFxuXHR2YXIgeEFicyA9IE1hdGguYWJzKHhPZmZzZXQpO1xuXHR2YXIgeUFicyA9IE1hdGguYWJzKHlPZmZzZXQpO1xuXHRcblx0dmFyIHBlcmNlbnQgPSBST1QuUk5HLmdldFVuaWZvcm0oKTsgLy8gdXNlZCB0byBzcGxpdCB0aGUgbW92ZSBhdCBkaWZmZXJlbnQgcGxhY2VzIGFsb25nIHRoZSBsb25nIGF4aXNcblx0dmFyIGZpcnN0SGFsZiA9IHBlcmNlbnQ7XG5cdHZhciBzZWNvbmRIYWxmID0gMSAtIHBlcmNlbnQ7XG5cdFxuXHR4RGlyID0geE9mZnNldCA+IDAgPyAyIDogNjtcblx0eURpciA9IHlPZmZzZXQgPiAwID8gNCA6IDA7XG5cdFxuXHRpZiAoeEFicyA8IHlBYnMpIHtcblx0XHQvLyBtb3ZlIGZpcnN0SGFsZiBvZiB0aGUgeSBvZmZzZXRcblx0XHR0ZW1wRGlzdCA9IE1hdGguY2VpbCh5QWJzICogZmlyc3RIYWxmKTtcblx0XHRtb3Zlcy5wdXNoKFt5RGlyLCB0ZW1wRGlzdF0pO1xuXHRcdC8vIG1vdmUgYWxsIHRoZSB4IG9mZnNldFxuXHRcdG1vdmVzLnB1c2goW3hEaXIsIHhBYnNdKTtcblx0XHQvLyBtb3ZlIHNlbmRIYWxmIG9mIHRoZSAgeSBvZmZzZXRcblx0XHR0ZW1wRGlzdCA9IE1hdGguZmxvb3IoeUFicyAqIHNlY29uZEhhbGYpO1xuXHRcdG1vdmVzLnB1c2goW3lEaXIsIHRlbXBEaXN0XSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gIG1vdmUgZmlyc3RIYWxmIG9mIHRoZSB4IG9mZnNldFxuXHRcdHRlbXBEaXN0ID0gTWF0aC5jZWlsKHhBYnMgKiBmaXJzdEhhbGYpO1xuXHRcdG1vdmVzLnB1c2goW3hEaXIsIHRlbXBEaXN0XSk7XG5cdFx0Ly8gbW92ZSBhbGwgdGhlIHkgb2Zmc2V0XG5cdFx0bW92ZXMucHVzaChbeURpciwgeUFic10pO1xuXHRcdC8vIG1vdmUgc2Vjb25kSGFsZiBvZiB0aGUgeCBvZmZzZXQuXG5cdFx0dGVtcERpc3QgPSBNYXRoLmZsb29yKHhBYnMgKiBzZWNvbmRIYWxmKTtcblx0XHRtb3Zlcy5wdXNoKFt4RGlyLCB0ZW1wRGlzdF0pOyAgXG5cdH1cblx0XG5cdHRoaXMubWFwW3hwb3NdW3lwb3NdID0gMDtcblx0XG5cdHdoaWxlIChtb3Zlcy5sZW5ndGggPiAwKSB7XG5cdFx0bW92ZSA9IG1vdmVzLnBvcCgpO1xuXHRcdHdoaWxlIChtb3ZlWzFdID4gMCkge1xuXHRcdFx0eHBvcyArPSBST1QuRElSU1s4XVttb3ZlWzBdXVswXTtcblx0XHRcdHlwb3MgKz0gUk9ULkRJUlNbOF1bbW92ZVswXV1bMV07XG5cdFx0XHR0aGlzLm1hcFt4cG9zXVt5cG9zXSA9IDA7XG5cdFx0XHRtb3ZlWzFdID0gbW92ZVsxXSAtIDE7XG5cdFx0fVxuXHR9XG59XG5cblJPVC5NYXAuUm9ndWUucHJvdG90eXBlLl9jcmVhdGVDb3JyaWRvcnMgPSBmdW5jdGlvbiAoKSB7XG5cdC8vIERyYXcgQ29ycmlkb3JzIGJldHdlZW4gY29ubmVjdGVkIHJvb21zXG5cdFxuXHR2YXIgY3cgPSB0aGlzLl9vcHRpb25zLmNlbGxXaWR0aDtcblx0dmFyIGNoID0gdGhpcy5fb3B0aW9ucy5jZWxsSGVpZ2h0O1xuXHR2YXIgcm9vbTtcblx0dmFyIGNvbm5lY3Rpb247XG5cdHZhciBvdGhlclJvb207XG5cdHZhciB3YWxsO1xuXHR2YXIgb3RoZXJXYWxsO1xuXHRcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjdzsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaDsgaisrKSB7XG5cdFx0XHRyb29tID0gdGhpcy5yb29tc1tpXVtqXTtcblx0XHRcdFxuXHRcdFx0Zm9yICh2YXIgayA9IDA7IGsgPCByb29tW1wiY29ubmVjdGlvbnNcIl0ubGVuZ3RoOyBrKyspIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0Y29ubmVjdGlvbiA9IHJvb21bXCJjb25uZWN0aW9uc1wiXVtrXTsgXG5cdFx0XHRcdFxuXHRcdFx0XHRvdGhlclJvb20gPSB0aGlzLnJvb21zW2Nvbm5lY3Rpb25bMF1dW2Nvbm5lY3Rpb25bMV1dO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gZmlndXJlIG91dCB3aGF0IHdhbGwgb3VyIGNvcnJpZG9yIHdpbGwgc3RhcnQgb25lLlxuXHRcdFx0XHQvLyBmaWd1cmUgb3V0IHdoYXQgd2FsbCBvdXIgY29ycmlkb3Igd2lsbCBlbmQgb24uIFxuXHRcdFx0XHRpZiAob3RoZXJSb29tW1wiY2VsbHhcIl0gPiByb29tW1wiY2VsbHhcIl0gKSB7XG5cdFx0XHRcdFx0d2FsbCA9IDI7XG5cdFx0XHRcdFx0b3RoZXJXYWxsID0gNDtcblx0XHRcdFx0fSBlbHNlIGlmIChvdGhlclJvb21bXCJjZWxseFwiXSA8IHJvb21bXCJjZWxseFwiXSApIHtcblx0XHRcdFx0XHR3YWxsID0gNDtcblx0XHRcdFx0XHRvdGhlcldhbGwgPSAyO1xuXHRcdFx0XHR9IGVsc2UgaWYob3RoZXJSb29tW1wiY2VsbHlcIl0gPiByb29tW1wiY2VsbHlcIl0pIHtcblx0XHRcdFx0XHR3YWxsID0gMztcblx0XHRcdFx0XHRvdGhlcldhbGwgPSAxO1xuXHRcdFx0XHR9IGVsc2UgaWYob3RoZXJSb29tW1wiY2VsbHlcIl0gPCByb29tW1wiY2VsbHlcIl0pIHtcblx0XHRcdFx0XHR3YWxsID0gMTtcblx0XHRcdFx0XHRvdGhlcldhbGwgPSAzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLl9kcmF3Q29ycmlkb3JlKHRoaXMuX2dldFdhbGxQb3NpdGlvbihyb29tLCB3YWxsKSwgdGhpcy5fZ2V0V2FsbFBvc2l0aW9uKG90aGVyUm9vbSwgb3RoZXJXYWxsKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG4vKipcbiAqIEBjbGFzcyBEdW5nZW9uIGZlYXR1cmU7IGhhcyBvd24gLmNyZWF0ZSgpIG1ldGhvZFxuICovXG5ST1QuTWFwLkZlYXR1cmUgPSBmdW5jdGlvbigpIHt9XG5ST1QuTWFwLkZlYXR1cmUucHJvdG90eXBlLmlzVmFsaWQgPSBmdW5jdGlvbihjYW5CZUR1Z0NhbGxiYWNrKSB7fVxuUk9ULk1hcC5GZWF0dXJlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihkaWdDYWxsYmFjaykge31cblJPVC5NYXAuRmVhdHVyZS5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbigpIHt9XG5ST1QuTWFwLkZlYXR1cmUuY3JlYXRlUmFuZG9tQXQgPSBmdW5jdGlvbih4LCB5LCBkeCwgZHksIG9wdGlvbnMpIHt9XG5cbi8qKlxuICogQGNsYXNzIFJvb21cbiAqIEBhdWdtZW50cyBST1QuTWFwLkZlYXR1cmVcbiAqIEBwYXJhbSB7aW50fSB4MVxuICogQHBhcmFtIHtpbnR9IHkxXG4gKiBAcGFyYW0ge2ludH0geDJcbiAqIEBwYXJhbSB7aW50fSB5MlxuICogQHBhcmFtIHtpbnR9IFtkb29yWF1cbiAqIEBwYXJhbSB7aW50fSBbZG9vclldXG4gKi9cblJPVC5NYXAuRmVhdHVyZS5Sb29tID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIGRvb3JYLCBkb29yWSkge1xuXHR0aGlzLl94MSA9IHgxO1xuXHR0aGlzLl95MSA9IHkxO1xuXHR0aGlzLl94MiA9IHgyO1xuXHR0aGlzLl95MiA9IHkyO1xuXHR0aGlzLl9kb29ycyA9IHt9O1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDQpIHsgdGhpcy5hZGREb29yKGRvb3JYLCBkb29yWSk7IH1cbn1cblJPVC5NYXAuRmVhdHVyZS5Sb29tLmV4dGVuZChST1QuTWFwLkZlYXR1cmUpO1xuXG4vKipcbiAqIFJvb20gb2YgcmFuZG9tIHNpemUsIHdpdGggYSBnaXZlbiBkb29ycyBhbmQgZGlyZWN0aW9uXG4gKi9cblJPVC5NYXAuRmVhdHVyZS5Sb29tLmNyZWF0ZVJhbmRvbUF0ID0gZnVuY3Rpb24oeCwgeSwgZHgsIGR5LCBvcHRpb25zKSB7XG5cdHZhciBtaW4gPSBvcHRpb25zLnJvb21XaWR0aFswXTtcblx0dmFyIG1heCA9IG9wdGlvbnMucm9vbVdpZHRoWzFdO1xuXHR2YXIgd2lkdGggPSBST1QuUk5HLmdldFVuaWZvcm1JbnQobWluLCBtYXgpO1xuXHRcblx0dmFyIG1pbiA9IG9wdGlvbnMucm9vbUhlaWdodFswXTtcblx0dmFyIG1heCA9IG9wdGlvbnMucm9vbUhlaWdodFsxXTtcblx0dmFyIGhlaWdodCA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChtaW4sIG1heCk7XG5cdFxuXHRpZiAoZHggPT0gMSkgeyAvKiB0byB0aGUgcmlnaHQgKi9cblx0XHR2YXIgeTIgPSB5IC0gTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSAqIGhlaWdodCk7XG5cdFx0cmV0dXJuIG5ldyB0aGlzKHgrMSwgeTIsIHgrd2lkdGgsIHkyK2hlaWdodC0xLCB4LCB5KTtcblx0fVxuXHRcblx0aWYgKGR4ID09IC0xKSB7IC8qIHRvIHRoZSBsZWZ0ICovXG5cdFx0dmFyIHkyID0geSAtIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkgKiBoZWlnaHQpO1xuXHRcdHJldHVybiBuZXcgdGhpcyh4LXdpZHRoLCB5MiwgeC0xLCB5MitoZWlnaHQtMSwgeCwgeSk7XG5cdH1cblxuXHRpZiAoZHkgPT0gMSkgeyAvKiB0byB0aGUgYm90dG9tICovXG5cdFx0dmFyIHgyID0geCAtIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkgKiB3aWR0aCk7XG5cdFx0cmV0dXJuIG5ldyB0aGlzKHgyLCB5KzEsIHgyK3dpZHRoLTEsIHkraGVpZ2h0LCB4LCB5KTtcblx0fVxuXG5cdGlmIChkeSA9PSAtMSkgeyAvKiB0byB0aGUgdG9wICovXG5cdFx0dmFyIHgyID0geCAtIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkgKiB3aWR0aCk7XG5cdFx0cmV0dXJuIG5ldyB0aGlzKHgyLCB5LWhlaWdodCwgeDIrd2lkdGgtMSwgeS0xLCB4LCB5KTtcblx0fVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImR4IG9yIGR5IG11c3QgYmUgMSBvciAtMVwiKTtcbn1cblxuLyoqXG4gKiBSb29tIG9mIHJhbmRvbSBzaXplLCBwb3NpdGlvbmVkIGFyb3VuZCBjZW50ZXIgY29vcmRzXG4gKi9cblJPVC5NYXAuRmVhdHVyZS5Sb29tLmNyZWF0ZVJhbmRvbUNlbnRlciA9IGZ1bmN0aW9uKGN4LCBjeSwgb3B0aW9ucykge1xuXHR2YXIgbWluID0gb3B0aW9ucy5yb29tV2lkdGhbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLnJvb21XaWR0aFsxXTtcblx0dmFyIHdpZHRoID0gUk9ULlJORy5nZXRVbmlmb3JtSW50KG1pbiwgbWF4KTtcblx0XG5cdHZhciBtaW4gPSBvcHRpb25zLnJvb21IZWlnaHRbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLnJvb21IZWlnaHRbMV07XG5cdHZhciBoZWlnaHQgPSBST1QuUk5HLmdldFVuaWZvcm1JbnQobWluLCBtYXgpO1xuXG5cdHZhciB4MSA9IGN4IC0gTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSp3aWR0aCk7XG5cdHZhciB5MSA9IGN5IC0gTWF0aC5mbG9vcihST1QuUk5HLmdldFVuaWZvcm0oKSpoZWlnaHQpO1xuXHR2YXIgeDIgPSB4MSArIHdpZHRoIC0gMTtcblx0dmFyIHkyID0geTEgKyBoZWlnaHQgLSAxO1xuXG5cdHJldHVybiBuZXcgdGhpcyh4MSwgeTEsIHgyLCB5Mik7XG59XG5cbi8qKlxuICogUm9vbSBvZiByYW5kb20gc2l6ZSB3aXRoaW4gYSBnaXZlbiBkaW1lbnNpb25zXG4gKi9cblJPVC5NYXAuRmVhdHVyZS5Sb29tLmNyZWF0ZVJhbmRvbSA9IGZ1bmN0aW9uKGF2YWlsV2lkdGgsIGF2YWlsSGVpZ2h0LCBvcHRpb25zKSB7XG5cdHZhciBtaW4gPSBvcHRpb25zLnJvb21XaWR0aFswXTtcblx0dmFyIG1heCA9IG9wdGlvbnMucm9vbVdpZHRoWzFdO1xuXHR2YXIgd2lkdGggPSBST1QuUk5HLmdldFVuaWZvcm1JbnQobWluLCBtYXgpO1xuXHRcblx0dmFyIG1pbiA9IG9wdGlvbnMucm9vbUhlaWdodFswXTtcblx0dmFyIG1heCA9IG9wdGlvbnMucm9vbUhlaWdodFsxXTtcblx0dmFyIGhlaWdodCA9IFJPVC5STkcuZ2V0VW5pZm9ybUludChtaW4sIG1heCk7XG5cdFxuXHR2YXIgbGVmdCA9IGF2YWlsV2lkdGggLSB3aWR0aCAtIDE7XG5cdHZhciB0b3AgPSBhdmFpbEhlaWdodCAtIGhlaWdodCAtIDE7XG5cblx0dmFyIHgxID0gMSArIE1hdGguZmxvb3IoUk9ULlJORy5nZXRVbmlmb3JtKCkqbGVmdCk7XG5cdHZhciB5MSA9IDEgKyBNYXRoLmZsb29yKFJPVC5STkcuZ2V0VW5pZm9ybSgpKnRvcCk7XG5cdHZhciB4MiA9IHgxICsgd2lkdGggLSAxO1xuXHR2YXIgeTIgPSB5MSArIGhlaWdodCAtIDE7XG5cblx0cmV0dXJuIG5ldyB0aGlzKHgxLCB5MSwgeDIsIHkyKTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmFkZERvb3IgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHRoaXMuX2Rvb3JzW3grXCIsXCIreV0gPSAxO1xuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufVxuICovXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuZ2V0RG9vcnMgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRmb3IgKHZhciBrZXkgaW4gdGhpcy5fZG9vcnMpIHtcblx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoXCIsXCIpO1xuXHRcdGNhbGxiYWNrKHBhcnNlSW50KHBhcnRzWzBdKSwgcGFyc2VJbnQocGFydHNbMV0pKTtcblx0fVxuXHRyZXR1cm4gdGhpcztcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmNsZWFyRG9vcnMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fZG9vcnMgPSB7fTtcblx0cmV0dXJuIHRoaXM7XG59XG5cblJPVC5NYXAuRmVhdHVyZS5Sb29tLnByb3RvdHlwZS5hZGREb29ycyA9IGZ1bmN0aW9uKGlzV2FsbENhbGxiYWNrKSB7XG5cdHZhciBsZWZ0ID0gdGhpcy5feDEtMTtcblx0dmFyIHJpZ2h0ID0gdGhpcy5feDIrMTtcblx0dmFyIHRvcCA9IHRoaXMuX3kxLTE7XG5cdHZhciBib3R0b20gPSB0aGlzLl95MisxO1xuXG5cdGZvciAodmFyIHg9bGVmdDsgeDw9cmlnaHQ7IHgrKykge1xuXHRcdGZvciAodmFyIHk9dG9wOyB5PD1ib3R0b207IHkrKykge1xuXHRcdFx0aWYgKHggIT0gbGVmdCAmJiB4ICE9IHJpZ2h0ICYmIHkgIT0gdG9wICYmIHkgIT0gYm90dG9tKSB7IGNvbnRpbnVlOyB9XG5cdFx0XHRpZiAoaXNXYWxsQ2FsbGJhY2soeCwgeSkpIHsgY29udGludWU7IH1cblxuXHRcdFx0dGhpcy5hZGREb29yKHgsIHkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuZGVidWcgPSBmdW5jdGlvbigpIHtcblx0Y29uc29sZS5sb2coXCJyb29tXCIsIHRoaXMuX3gxLCB0aGlzLl95MSwgdGhpcy5feDIsIHRoaXMuX3kyKTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmlzVmFsaWQgPSBmdW5jdGlvbihpc1dhbGxDYWxsYmFjaywgY2FuQmVEdWdDYWxsYmFjaykgeyBcblx0dmFyIGxlZnQgPSB0aGlzLl94MS0xO1xuXHR2YXIgcmlnaHQgPSB0aGlzLl94MisxO1xuXHR2YXIgdG9wID0gdGhpcy5feTEtMTtcblx0dmFyIGJvdHRvbSA9IHRoaXMuX3kyKzE7XG5cdFxuXHRmb3IgKHZhciB4PWxlZnQ7IHg8PXJpZ2h0OyB4KyspIHtcblx0XHRmb3IgKHZhciB5PXRvcDsgeTw9Ym90dG9tOyB5KyspIHtcblx0XHRcdGlmICh4ID09IGxlZnQgfHwgeCA9PSByaWdodCB8fCB5ID09IHRvcCB8fCB5ID09IGJvdHRvbSkge1xuXHRcdFx0XHRpZiAoIWlzV2FsbENhbGxiYWNrKHgsIHkpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKCFjYW5CZUR1Z0NhbGxiYWNrKHgsIHkpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGRpZ0NhbGxiYWNrIERpZyBjYWxsYmFjayB3aXRoIGEgc2lnbmF0dXJlICh4LCB5LCB2YWx1ZSkuIFZhbHVlczogMCA9IGVtcHR5LCAxID0gd2FsbCwgMiA9IGRvb3IuIE11bHRpcGxlIGRvb3JzIGFyZSBhbGxvd2VkLlxuICovXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oZGlnQ2FsbGJhY2spIHsgXG5cdHZhciBsZWZ0ID0gdGhpcy5feDEtMTtcblx0dmFyIHJpZ2h0ID0gdGhpcy5feDIrMTtcblx0dmFyIHRvcCA9IHRoaXMuX3kxLTE7XG5cdHZhciBib3R0b20gPSB0aGlzLl95MisxO1xuXHRcblx0dmFyIHZhbHVlID0gMDtcblx0Zm9yICh2YXIgeD1sZWZ0OyB4PD1yaWdodDsgeCsrKSB7XG5cdFx0Zm9yICh2YXIgeT10b3A7IHk8PWJvdHRvbTsgeSsrKSB7XG5cdFx0XHRpZiAoeCtcIixcIit5IGluIHRoaXMuX2Rvb3JzKSB7XG5cdFx0XHRcdHZhbHVlID0gMjtcblx0XHRcdH0gZWxzZSBpZiAoeCA9PSBsZWZ0IHx8IHggPT0gcmlnaHQgfHwgeSA9PSB0b3AgfHwgeSA9PSBib3R0b20pIHtcblx0XHRcdFx0dmFsdWUgPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFsdWUgPSAwO1xuXHRcdFx0fVxuXHRcdFx0ZGlnQ2FsbGJhY2soeCwgeSwgdmFsdWUpO1xuXHRcdH1cblx0fVxufVxuXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuZ2V0Q2VudGVyID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBbTWF0aC5yb3VuZCgodGhpcy5feDEgKyB0aGlzLl94MikvMiksIE1hdGgucm91bmQoKHRoaXMuX3kxICsgdGhpcy5feTIpLzIpXTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmdldExlZnQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3gxO1xufVxuXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuZ2V0UmlnaHQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3gyO1xufVxuXG5ST1QuTWFwLkZlYXR1cmUuUm9vbS5wcm90b3R5cGUuZ2V0VG9wID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0aGlzLl95MTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLlJvb20ucHJvdG90eXBlLmdldEJvdHRvbSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5feTI7XG59XG5cbi8qKlxuICogQGNsYXNzIENvcnJpZG9yXG4gKiBAYXVnbWVudHMgUk9ULk1hcC5GZWF0dXJlXG4gKiBAcGFyYW0ge2ludH0gc3RhcnRYXG4gKiBAcGFyYW0ge2ludH0gc3RhcnRZXG4gKiBAcGFyYW0ge2ludH0gZW5kWFxuICogQHBhcmFtIHtpbnR9IGVuZFlcbiAqL1xuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yID0gZnVuY3Rpb24oc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFkpIHtcblx0dGhpcy5fc3RhcnRYID0gc3RhcnRYO1xuXHR0aGlzLl9zdGFydFkgPSBzdGFydFk7XG5cdHRoaXMuX2VuZFggPSBlbmRYOyBcblx0dGhpcy5fZW5kWSA9IGVuZFk7XG5cdHRoaXMuX2VuZHNXaXRoQVdhbGwgPSB0cnVlO1xufVxuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yLmV4dGVuZChST1QuTWFwLkZlYXR1cmUpO1xuXG5ST1QuTWFwLkZlYXR1cmUuQ29ycmlkb3IuY3JlYXRlUmFuZG9tQXQgPSBmdW5jdGlvbih4LCB5LCBkeCwgZHksIG9wdGlvbnMpIHtcblx0dmFyIG1pbiA9IG9wdGlvbnMuY29ycmlkb3JMZW5ndGhbMF07XG5cdHZhciBtYXggPSBvcHRpb25zLmNvcnJpZG9yTGVuZ3RoWzFdO1xuXHR2YXIgbGVuZ3RoID0gUk9ULlJORy5nZXRVbmlmb3JtSW50KG1pbiwgbWF4KTtcblx0XG5cdHJldHVybiBuZXcgdGhpcyh4LCB5LCB4ICsgZHgqbGVuZ3RoLCB5ICsgZHkqbGVuZ3RoKTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yLnByb3RvdHlwZS5kZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuXHRjb25zb2xlLmxvZyhcImNvcnJpZG9yXCIsIHRoaXMuX3N0YXJ0WCwgdGhpcy5fc3RhcnRZLCB0aGlzLl9lbmRYLCB0aGlzLl9lbmRZKTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yLnByb3RvdHlwZS5pc1ZhbGlkID0gZnVuY3Rpb24oaXNXYWxsQ2FsbGJhY2ssIGNhbkJlRHVnQ2FsbGJhY2speyBcblx0dmFyIHN4ID0gdGhpcy5fc3RhcnRYO1xuXHR2YXIgc3kgPSB0aGlzLl9zdGFydFk7XG5cdHZhciBkeCA9IHRoaXMuX2VuZFgtc3g7XG5cdHZhciBkeSA9IHRoaXMuX2VuZFktc3k7XG5cdHZhciBsZW5ndGggPSAxICsgTWF0aC5tYXgoTWF0aC5hYnMoZHgpLCBNYXRoLmFicyhkeSkpO1xuXHRcblx0aWYgKGR4KSB7IGR4ID0gZHgvTWF0aC5hYnMoZHgpOyB9XG5cdGlmIChkeSkgeyBkeSA9IGR5L01hdGguYWJzKGR5KTsgfVxuXHR2YXIgbnggPSBkeTtcblx0dmFyIG55ID0gLWR4O1xuXHRcblx0dmFyIG9rID0gdHJ1ZTtcblx0Zm9yICh2YXIgaT0wOyBpPGxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIHggPSBzeCArIGkqZHg7XG5cdFx0dmFyIHkgPSBzeSArIGkqZHk7XG5cblx0XHRpZiAoIWNhbkJlRHVnQ2FsbGJhY2soICAgICB4LCAgICAgIHkpKSB7IG9rID0gZmFsc2U7IH1cblx0XHRpZiAoIWlzV2FsbENhbGxiYWNrICAoeCArIG54LCB5ICsgbnkpKSB7IG9rID0gZmFsc2U7IH1cblx0XHRpZiAoIWlzV2FsbENhbGxiYWNrICAoeCAtIG54LCB5IC0gbnkpKSB7IG9rID0gZmFsc2U7IH1cblx0XHRcblx0XHRpZiAoIW9rKSB7XG5cdFx0XHRsZW5ndGggPSBpO1xuXHRcdFx0dGhpcy5fZW5kWCA9IHgtZHg7XG5cdFx0XHR0aGlzLl9lbmRZID0geS1keTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXHRcblx0LyoqXG5cdCAqIElmIHRoZSBsZW5ndGggZGVnZW5lcmF0ZWQsIHRoaXMgY29ycmlkb3IgbWlnaHQgYmUgaW52YWxpZFxuXHQgKi9cblx0IFxuXHQvKiBub3Qgc3VwcG9ydGVkICovXG5cdGlmIChsZW5ndGggPT0gMCkgeyByZXR1cm4gZmFsc2U7IH0gXG5cdFxuXHQgLyogbGVuZ3RoIDEgYWxsb3dlZCBvbmx5IGlmIHRoZSBuZXh0IHNwYWNlIGlzIGVtcHR5ICovXG5cdGlmIChsZW5ndGggPT0gMSAmJiBpc1dhbGxDYWxsYmFjayh0aGlzLl9lbmRYICsgZHgsIHRoaXMuX2VuZFkgKyBkeSkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFxuXHQvKipcblx0ICogV2UgZG8gbm90IHdhbnQgdGhlIGNvcnJpZG9yIHRvIGNyYXNoIGludG8gYSBjb3JuZXIgb2YgYSByb29tO1xuXHQgKiBpZiBhbnkgb2YgdGhlIGVuZGluZyBjb3JuZXJzIGlzIGVtcHR5LCB0aGUgTisxdGggY2VsbCBvZiB0aGlzIGNvcnJpZG9yIG11c3QgYmUgZW1wdHkgdG9vLlxuXHQgKiBcblx0ICogU2l0dWF0aW9uOlxuXHQgKiAjIyMjIyMjMVxuXHQgKiAuLi4uLi4uP1xuXHQgKiAjIyMjIyMjMlxuXHQgKiBcblx0ICogVGhlIGNvcnJpZG9yIHdhcyBkdWcgZnJvbSBsZWZ0IHRvIHJpZ2h0LlxuXHQgKiAxLCAyIC0gcHJvYmxlbWF0aWMgY29ybmVycywgPyA9IE4rMXRoIGNlbGwgKG5vdCBkdWcpXG5cdCAqL1xuXHR2YXIgZmlyc3RDb3JuZXJCYWQgPSAhaXNXYWxsQ2FsbGJhY2sodGhpcy5fZW5kWCArIGR4ICsgbngsIHRoaXMuX2VuZFkgKyBkeSArIG55KTtcblx0dmFyIHNlY29uZENvcm5lckJhZCA9ICFpc1dhbGxDYWxsYmFjayh0aGlzLl9lbmRYICsgZHggLSBueCwgdGhpcy5fZW5kWSArIGR5IC0gbnkpO1xuXHR0aGlzLl9lbmRzV2l0aEFXYWxsID0gaXNXYWxsQ2FsbGJhY2sodGhpcy5fZW5kWCArIGR4LCB0aGlzLl9lbmRZICsgZHkpO1xuXHRpZiAoKGZpcnN0Q29ybmVyQmFkIHx8IHNlY29uZENvcm5lckJhZCkgJiYgdGhpcy5fZW5kc1dpdGhBV2FsbCkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBkaWdDYWxsYmFjayBEaWcgY2FsbGJhY2sgd2l0aCBhIHNpZ25hdHVyZSAoeCwgeSwgdmFsdWUpLiBWYWx1ZXM6IDAgPSBlbXB0eS5cbiAqL1xuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihkaWdDYWxsYmFjaykgeyBcblx0dmFyIHN4ID0gdGhpcy5fc3RhcnRYO1xuXHR2YXIgc3kgPSB0aGlzLl9zdGFydFk7XG5cdHZhciBkeCA9IHRoaXMuX2VuZFgtc3g7XG5cdHZhciBkeSA9IHRoaXMuX2VuZFktc3k7XG5cdHZhciBsZW5ndGggPSAxK01hdGgubWF4KE1hdGguYWJzKGR4KSwgTWF0aC5hYnMoZHkpKTtcblx0XG5cdGlmIChkeCkgeyBkeCA9IGR4L01hdGguYWJzKGR4KTsgfVxuXHRpZiAoZHkpIHsgZHkgPSBkeS9NYXRoLmFicyhkeSk7IH1cblx0dmFyIG54ID0gZHk7XG5cdHZhciBueSA9IC1keDtcblx0XG5cdGZvciAodmFyIGk9MDsgaTxsZW5ndGg7IGkrKykge1xuXHRcdHZhciB4ID0gc3ggKyBpKmR4O1xuXHRcdHZhciB5ID0gc3kgKyBpKmR5O1xuXHRcdGRpZ0NhbGxiYWNrKHgsIHksIDApO1xuXHR9XG5cdFxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuUk9ULk1hcC5GZWF0dXJlLkNvcnJpZG9yLnByb3RvdHlwZS5jcmVhdGVQcmlvcml0eVdhbGxzID0gZnVuY3Rpb24ocHJpb3JpdHlXYWxsQ2FsbGJhY2spIHtcblx0aWYgKCF0aGlzLl9lbmRzV2l0aEFXYWxsKSB7IHJldHVybjsgfVxuXG5cdHZhciBzeCA9IHRoaXMuX3N0YXJ0WDtcblx0dmFyIHN5ID0gdGhpcy5fc3RhcnRZO1xuXG5cdHZhciBkeCA9IHRoaXMuX2VuZFgtc3g7XG5cdHZhciBkeSA9IHRoaXMuX2VuZFktc3k7XG5cdGlmIChkeCkgeyBkeCA9IGR4L01hdGguYWJzKGR4KTsgfVxuXHRpZiAoZHkpIHsgZHkgPSBkeS9NYXRoLmFicyhkeSk7IH1cblx0dmFyIG54ID0gZHk7XG5cdHZhciBueSA9IC1keDtcblxuXHRwcmlvcml0eVdhbGxDYWxsYmFjayh0aGlzLl9lbmRYICsgZHgsIHRoaXMuX2VuZFkgKyBkeSk7XG5cdHByaW9yaXR5V2FsbENhbGxiYWNrKHRoaXMuX2VuZFggKyBueCwgdGhpcy5fZW5kWSArIG55KTtcblx0cHJpb3JpdHlXYWxsQ2FsbGJhY2sodGhpcy5fZW5kWCAtIG54LCB0aGlzLl9lbmRZIC0gbnkpO1xufVxuLyoqXG4gKiBAY2xhc3MgQmFzZSBub2lzZSBnZW5lcmF0b3JcbiAqL1xuUk9ULk5vaXNlID0gZnVuY3Rpb24oKSB7XG59O1xuXG5ST1QuTm9pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHgsIHkpIHt9XG4vKipcbiAqIEEgc2ltcGxlIDJkIGltcGxlbWVudGF0aW9uIG9mIHNpbXBsZXggbm9pc2UgYnkgT25kcmVqIFphcmFcbiAqXG4gKiBCYXNlZCBvbiBhIHNwZWVkLWltcHJvdmVkIHNpbXBsZXggbm9pc2UgYWxnb3JpdGhtIGZvciAyRCwgM0QgYW5kIDREIGluIEphdmEuXG4gKiBXaGljaCBpcyBiYXNlZCBvbiBleGFtcGxlIGNvZGUgYnkgU3RlZmFuIEd1c3RhdnNvbiAoc3RlZ3VAaXRuLmxpdS5zZSkuXG4gKiBXaXRoIE9wdGltaXNhdGlvbnMgYnkgUGV0ZXIgRWFzdG1hbiAocGVhc3RtYW5AZHJpenpsZS5zdGFuZm9yZC5lZHUpLlxuICogQmV0dGVyIHJhbmsgb3JkZXJpbmcgbWV0aG9kIGJ5IFN0ZWZhbiBHdXN0YXZzb24gaW4gMjAxMi5cbiAqL1xuXG4vKipcbiAqIEBjbGFzcyAyRCBzaW1wbGV4IG5vaXNlIGdlbmVyYXRvclxuICogQHBhcmFtIHtpbnR9IFtncmFkaWVudHM9MjU2XSBSYW5kb20gZ3JhZGllbnRzXG4gKi9cblJPVC5Ob2lzZS5TaW1wbGV4ID0gZnVuY3Rpb24oZ3JhZGllbnRzKSB7XG5cdFJPVC5Ob2lzZS5jYWxsKHRoaXMpO1xuXG5cdHRoaXMuX0YyID0gMC41ICogKE1hdGguc3FydCgzKSAtIDEpO1xuXHR0aGlzLl9HMiA9ICgzIC0gTWF0aC5zcXJ0KDMpKSAvIDY7XG5cblx0dGhpcy5fZ3JhZGllbnRzID0gW1xuXHRcdFsgMCwgLTFdLFxuXHRcdFsgMSwgLTFdLFxuXHRcdFsgMSwgIDBdLFxuXHRcdFsgMSwgIDFdLFxuXHRcdFsgMCwgIDFdLFxuXHRcdFstMSwgIDFdLFxuXHRcdFstMSwgIDBdLFxuXHRcdFstMSwgLTFdXG5cdF07XG5cblx0dmFyIHBlcm11dGF0aW9ucyA9IFtdO1xuXHR2YXIgY291bnQgPSBncmFkaWVudHMgfHwgMjU2O1xuXHRmb3IgKHZhciBpPTA7aTxjb3VudDtpKyspIHsgcGVybXV0YXRpb25zLnB1c2goaSk7IH1cblx0cGVybXV0YXRpb25zID0gcGVybXV0YXRpb25zLnJhbmRvbWl6ZSgpO1xuXG5cdHRoaXMuX3Blcm1zID0gW107XG5cdHRoaXMuX2luZGV4ZXMgPSBbXTtcblxuXHRmb3IgKHZhciBpPTA7aTwyKmNvdW50O2krKykge1xuXHRcdHRoaXMuX3Blcm1zLnB1c2gocGVybXV0YXRpb25zW2kgJSBjb3VudF0pO1xuXHRcdHRoaXMuX2luZGV4ZXMucHVzaCh0aGlzLl9wZXJtc1tpXSAlIHRoaXMuX2dyYWRpZW50cy5sZW5ndGgpO1xuXHR9XG5cbn07XG5ST1QuTm9pc2UuU2ltcGxleC5leHRlbmQoUk9ULk5vaXNlKTtcblxuUk9ULk5vaXNlLlNpbXBsZXgucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHhpbiwgeWluKSB7XG5cdHZhciBwZXJtcyA9IHRoaXMuX3Blcm1zO1xuXHR2YXIgaW5kZXhlcyA9IHRoaXMuX2luZGV4ZXM7XG5cdHZhciBjb3VudCA9IHBlcm1zLmxlbmd0aC8yO1xuXHR2YXIgRzIgPSB0aGlzLl9HMjtcblxuXHR2YXIgbjAgPTAsIG4xID0gMCwgbjIgPSAwLCBnaTsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSB0aHJlZSBjb3JuZXJzXG5cblx0Ly8gU2tldyB0aGUgaW5wdXQgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggY2VsbCB3ZSdyZSBpblxuXHR2YXIgcyA9ICh4aW4gKyB5aW4pICogdGhpcy5fRjI7IC8vIEhhaXJ5IGZhY3RvciBmb3IgMkRcblx0dmFyIGkgPSBNYXRoLmZsb29yKHhpbiArIHMpO1xuXHR2YXIgaiA9IE1hdGguZmxvb3IoeWluICsgcyk7XG5cdHZhciB0ID0gKGkgKyBqKSAqIEcyO1xuXHR2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkpIHNwYWNlXG5cdHZhciBZMCA9IGogLSB0O1xuXHR2YXIgeDAgPSB4aW4gLSBYMDsgLy8gVGhlIHgseSBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cblx0dmFyIHkwID0geWluIC0gWTA7XG5cblx0Ly8gRm9yIHRoZSAyRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhbiBlcXVpbGF0ZXJhbCB0cmlhbmdsZS5cblx0Ly8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuXHR2YXIgaTEsIGoxOyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgKG1pZGRsZSkgY29ybmVyIG9mIHNpbXBsZXggaW4gKGksaikgY29vcmRzXG5cdGlmICh4MCA+IHkwKSB7XG5cdFx0aTEgPSAxO1xuXHRcdGoxID0gMDtcblx0fSBlbHNlIHsgLy8gbG93ZXIgdHJpYW5nbGUsIFhZIG9yZGVyOiAoMCwwKS0+KDEsMCktPigxLDEpXG5cdFx0aTEgPSAwO1xuXHRcdGoxID0gMTtcblx0fSAvLyB1cHBlciB0cmlhbmdsZSwgWVggb3JkZXI6ICgwLDApLT4oMCwxKS0+KDEsMSlcblxuXHQvLyBBIHN0ZXAgb2YgKDEsMCkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMpIGluICh4LHkpLCBhbmRcblx0Ly8gYSBzdGVwIG9mICgwLDEpIGluIChpLGopIG1lYW5zIGEgc3RlcCBvZiAoLWMsMS1jKSBpbiAoeCx5KSwgd2hlcmVcblx0Ly8gYyA9ICgzLXNxcnQoMykpLzZcblx0dmFyIHgxID0geDAgLSBpMSArIEcyOyAvLyBPZmZzZXRzIGZvciBtaWRkbGUgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuXHR2YXIgeTEgPSB5MCAtIGoxICsgRzI7XG5cdHZhciB4MiA9IHgwIC0gMSArIDIqRzI7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuXHR2YXIgeTIgPSB5MCAtIDEgKyAyKkcyO1xuXG5cdC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgdGhyZWUgc2ltcGxleCBjb3JuZXJzXG5cdHZhciBpaSA9IGkubW9kKGNvdW50KTtcblx0dmFyIGpqID0gai5tb2QoY291bnQpO1xuXG5cdC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIHRocmVlIGNvcm5lcnNcblx0dmFyIHQwID0gMC41IC0geDAqeDAgLSB5MCp5MDtcblx0aWYgKHQwID49IDApIHtcblx0XHR0MCAqPSB0MDtcblx0XHRnaSA9IGluZGV4ZXNbaWkrcGVybXNbampdXTtcblx0XHR2YXIgZ3JhZCA9IHRoaXMuX2dyYWRpZW50c1tnaV07XG5cdFx0bjAgPSB0MCAqIHQwICogKGdyYWRbMF0gKiB4MCArIGdyYWRbMV0gKiB5MCk7XG5cdH1cblx0XG5cdHZhciB0MSA9IDAuNSAtIHgxKngxIC0geTEqeTE7XG5cdGlmICh0MSA+PSAwKSB7XG5cdFx0dDEgKj0gdDE7XG5cdFx0Z2kgPSBpbmRleGVzW2lpK2kxK3Blcm1zW2pqK2oxXV07XG5cdFx0dmFyIGdyYWQgPSB0aGlzLl9ncmFkaWVudHNbZ2ldO1xuXHRcdG4xID0gdDEgKiB0MSAqIChncmFkWzBdICogeDEgKyBncmFkWzFdICogeTEpO1xuXHR9XG5cdFxuXHR2YXIgdDIgPSAwLjUgLSB4Mip4MiAtIHkyKnkyO1xuXHRpZiAodDIgPj0gMCkge1xuXHRcdHQyICo9IHQyO1xuXHRcdGdpID0gaW5kZXhlc1tpaSsxK3Blcm1zW2pqKzFdXTtcblx0XHR2YXIgZ3JhZCA9IHRoaXMuX2dyYWRpZW50c1tnaV07XG5cdFx0bjIgPSB0MiAqIHQyICogKGdyYWRbMF0gKiB4MiArIGdyYWRbMV0gKiB5Mik7XG5cdH1cblxuXHQvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG5cdC8vIFRoZSByZXN1bHQgaXMgc2NhbGVkIHRvIHJldHVybiB2YWx1ZXMgaW4gdGhlIGludGVydmFsIFstMSwxXS5cblx0cmV0dXJuIDcwICogKG4wICsgbjEgKyBuMik7XG59XG4vKipcbiAqIEBjbGFzcyBBYnN0cmFjdCBGT1YgYWxnb3JpdGhtXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBsaWdodFBhc3Nlc0NhbGxiYWNrIERvZXMgdGhlIGxpZ2h0IHBhc3MgdGhyb3VnaCB4LHk/XG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMudG9wb2xvZ3k9OF0gNC82LzhcbiAqL1xuUk9ULkZPViA9IGZ1bmN0aW9uKGxpZ2h0UGFzc2VzQ2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0dGhpcy5fbGlnaHRQYXNzZXMgPSBsaWdodFBhc3Nlc0NhbGxiYWNrO1xuXHR0aGlzLl9vcHRpb25zID0ge1xuXHRcdHRvcG9sb2d5OiA4XG5cdH1cblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG59O1xuXG4vKipcbiAqIENvbXB1dGUgdmlzaWJpbGl0eSBmb3IgYSAzNjAtZGVncmVlIGNpcmNsZVxuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcGFyYW0ge2ludH0gUiBNYXhpbXVtIHZpc2liaWxpdHkgcmFkaXVzXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5ST1QuRk9WLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24oeCwgeSwgUiwgY2FsbGJhY2spIHt9XG5cbi8qKlxuICogUmV0dXJuIGFsbCBuZWlnaGJvcnMgaW4gYSBjb25jZW50cmljIHJpbmdcbiAqIEBwYXJhbSB7aW50fSBjeCBjZW50ZXIteFxuICogQHBhcmFtIHtpbnR9IGN5IGNlbnRlci15XG4gKiBAcGFyYW0ge2ludH0gciByYW5nZVxuICovXG5ST1QuRk9WLnByb3RvdHlwZS5fZ2V0Q2lyY2xlID0gZnVuY3Rpb24oY3gsIGN5LCByKSB7XG5cdHZhciByZXN1bHQgPSBbXTtcblx0dmFyIGRpcnMsIGNvdW50RmFjdG9yLCBzdGFydE9mZnNldDtcblxuXHRzd2l0Y2ggKHRoaXMuX29wdGlvbnMudG9wb2xvZ3kpIHtcblx0XHRjYXNlIDQ6XG5cdFx0XHRjb3VudEZhY3RvciA9IDE7XG5cdFx0XHRzdGFydE9mZnNldCA9IFswLCAxXTtcblx0XHRcdGRpcnMgPSBbXG5cdFx0XHRcdFJPVC5ESVJTWzhdWzddLFxuXHRcdFx0XHRST1QuRElSU1s4XVsxXSxcblx0XHRcdFx0Uk9ULkRJUlNbOF1bM10sXG5cdFx0XHRcdFJPVC5ESVJTWzhdWzVdXG5cdFx0XHRdXG5cdFx0YnJlYWs7XG5cblx0XHRjYXNlIDY6XG5cdFx0XHRkaXJzID0gUk9ULkRJUlNbNl07XG5cdFx0XHRjb3VudEZhY3RvciA9IDE7XG5cdFx0XHRzdGFydE9mZnNldCA9IFstMSwgMV07XG5cdFx0YnJlYWs7XG5cblx0XHRjYXNlIDg6XG5cdFx0XHRkaXJzID0gUk9ULkRJUlNbNF07XG5cdFx0XHRjb3VudEZhY3RvciA9IDI7XG5cdFx0XHRzdGFydE9mZnNldCA9IFstMSwgMV07XG5cdFx0YnJlYWs7XG5cdH1cblxuXHQvKiBzdGFydGluZyBuZWlnaGJvciAqL1xuXHR2YXIgeCA9IGN4ICsgc3RhcnRPZmZzZXRbMF0qcjtcblx0dmFyIHkgPSBjeSArIHN0YXJ0T2Zmc2V0WzFdKnI7XG5cblx0LyogY2lyY2xlICovXG5cdGZvciAodmFyIGk9MDtpPGRpcnMubGVuZ3RoO2krKykge1xuXHRcdGZvciAodmFyIGo9MDtqPHIqY291bnRGYWN0b3I7aisrKSB7XG5cdFx0XHRyZXN1bHQucHVzaChbeCwgeV0pO1xuXHRcdFx0eCArPSBkaXJzW2ldWzBdO1xuXHRcdFx0eSArPSBkaXJzW2ldWzFdO1xuXG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cbi8qKlxuICogQGNsYXNzIERpc2NyZXRlIHNoYWRvd2Nhc3RpbmcgYWxnb3JpdGhtLiBPYnNvbGV0ZWQgYnkgUHJlY2lzZSBzaGFkb3djYXN0aW5nLlxuICogQGF1Z21lbnRzIFJPVC5GT1ZcbiAqL1xuUk9ULkZPVi5EaXNjcmV0ZVNoYWRvd2Nhc3RpbmcgPSBmdW5jdGlvbihsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKSB7XG5cdFJPVC5GT1YuY2FsbCh0aGlzLCBsaWdodFBhc3Nlc0NhbGxiYWNrLCBvcHRpb25zKTtcbn1cblJPVC5GT1YuRGlzY3JldGVTaGFkb3djYXN0aW5nLmV4dGVuZChST1QuRk9WKTtcblxuLyoqXG4gKiBAc2VlIFJPVC5GT1YjY29tcHV0ZVxuICovXG5ST1QuRk9WLkRpc2NyZXRlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKHgsIHksIFIsIGNhbGxiYWNrKSB7XG5cdHZhciBjZW50ZXIgPSB0aGlzLl9jb29yZHM7XG5cdHZhciBtYXAgPSB0aGlzLl9tYXA7XG5cblx0LyogdGhpcyBwbGFjZSBpcyBhbHdheXMgdmlzaWJsZSAqL1xuXHRjYWxsYmFjayh4LCB5LCAwLCAxKTtcblxuXHQvKiBzdGFuZGluZyBpbiBhIGRhcmsgcGxhY2UuIEZJWE1FIGlzIHRoaXMgYSBnb29kIGlkZWE/ICAqL1xuXHRpZiAoIXRoaXMuX2xpZ2h0UGFzc2VzKHgsIHkpKSB7IHJldHVybjsgfVxuXHRcblx0Lyogc3RhcnQgYW5kIGVuZCBhbmdsZXMgKi9cblx0dmFyIERBVEEgPSBbXTtcblx0XG5cdHZhciBBLCBCLCBjeCwgY3ksIGJsb2NrcztcblxuXHQvKiBhbmFseXplIHN1cnJvdW5kaW5nIGNlbGxzIGluIGNvbmNlbnRyaWMgcmluZ3MsIHN0YXJ0aW5nIGZyb20gdGhlIGNlbnRlciAqL1xuXHRmb3IgKHZhciByPTE7IHI8PVI7IHIrKykge1xuXHRcdHZhciBuZWlnaGJvcnMgPSB0aGlzLl9nZXRDaXJjbGUoeCwgeSwgcik7XG5cdFx0dmFyIGFuZ2xlID0gMzYwIC8gbmVpZ2hib3JzLmxlbmd0aDtcblxuXHRcdGZvciAodmFyIGk9MDtpPG5laWdoYm9ycy5sZW5ndGg7aSsrKSB7XG5cdFx0XHRjeCA9IG5laWdoYm9yc1tpXVswXTtcblx0XHRcdGN5ID0gbmVpZ2hib3JzW2ldWzFdO1xuXHRcdFx0QSA9IGFuZ2xlICogKGkgLSAwLjUpO1xuXHRcdFx0QiA9IEEgKyBhbmdsZTtcblx0XHRcdFxuXHRcdFx0YmxvY2tzID0gIXRoaXMuX2xpZ2h0UGFzc2VzKGN4LCBjeSk7XG5cdFx0XHRpZiAodGhpcy5fdmlzaWJsZUNvb3JkcyhNYXRoLmZsb29yKEEpLCBNYXRoLmNlaWwoQiksIGJsb2NrcywgREFUQSkpIHsgY2FsbGJhY2soY3gsIGN5LCByLCAxKTsgfVxuXHRcdFx0XG5cdFx0XHRpZiAoREFUQS5sZW5ndGggPT0gMiAmJiBEQVRBWzBdID09IDAgJiYgREFUQVsxXSA9PSAzNjApIHsgcmV0dXJuOyB9IC8qIGN1dG9mZj8gKi9cblxuXHRcdH0gLyogZm9yIGFsbCBjZWxscyBpbiB0aGlzIHJpbmcgKi9cblx0fSAvKiBmb3IgYWxsIHJpbmdzICovXG59XG5cbi8qKlxuICogQHBhcmFtIHtpbnR9IEEgc3RhcnQgYW5nbGVcbiAqIEBwYXJhbSB7aW50fSBCIGVuZCBhbmdsZVxuICogQHBhcmFtIHtib29sfSBibG9ja3MgRG9lcyBjdXJyZW50IGNlbGwgYmxvY2sgdmlzaWJpbGl0eT9cbiAqIEBwYXJhbSB7aW50W11bXX0gREFUQSBzaGFkb3dlZCBhbmdsZSBwYWlyc1xuICovXG5ST1QuRk9WLkRpc2NyZXRlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuX3Zpc2libGVDb29yZHMgPSBmdW5jdGlvbihBLCBCLCBibG9ja3MsIERBVEEpIHtcblx0aWYgKEEgPCAwKSB7IFxuXHRcdHZhciB2MSA9IGFyZ3VtZW50cy5jYWxsZWUoMCwgQiwgYmxvY2tzLCBEQVRBKTtcblx0XHR2YXIgdjIgPSBhcmd1bWVudHMuY2FsbGVlKDM2MCtBLCAzNjAsIGJsb2NrcywgREFUQSk7XG5cdFx0cmV0dXJuIHYxIHx8IHYyO1xuXHR9XG5cdFxuXHR2YXIgaW5kZXggPSAwO1xuXHR3aGlsZSAoaW5kZXggPCBEQVRBLmxlbmd0aCAmJiBEQVRBW2luZGV4XSA8IEEpIHsgaW5kZXgrKzsgfVxuXHRcblx0aWYgKGluZGV4ID09IERBVEEubGVuZ3RoKSB7IC8qIGNvbXBsZXRlbHkgbmV3IHNoYWRvdyAqL1xuXHRcdGlmIChibG9ja3MpIHsgREFUQS5wdXNoKEEsIEIpOyB9IFxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdFxuXHR2YXIgY291bnQgPSAwO1xuXHRcblx0aWYgKGluZGV4ICUgMikgeyAvKiB0aGlzIHNoYWRvdyBzdGFydHMgaW4gYW4gZXhpc3Rpbmcgc2hhZG93LCBvciB3aXRoaW4gaXRzIGVuZGluZyBib3VuZGFyeSAqL1xuXHRcdHdoaWxlIChpbmRleCA8IERBVEEubGVuZ3RoICYmIERBVEFbaW5kZXhdIDwgQikge1xuXHRcdFx0aW5kZXgrKztcblx0XHRcdGNvdW50Kys7XG5cdFx0fVxuXHRcdFxuXHRcdGlmIChjb3VudCA9PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFxuXHRcdGlmIChibG9ja3MpIHsgXG5cdFx0XHRpZiAoY291bnQgJSAyKSB7XG5cdFx0XHRcdERBVEEuc3BsaWNlKGluZGV4LWNvdW50LCBjb3VudCwgQik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHREQVRBLnNwbGljZShpbmRleC1jb3VudCwgY291bnQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gdHJ1ZTtcblxuXHR9IGVsc2UgeyAvKiB0aGlzIHNoYWRvdyBzdGFydHMgb3V0c2lkZSBhbiBleGlzdGluZyBzaGFkb3csIG9yIHdpdGhpbiBhIHN0YXJ0aW5nIGJvdW5kYXJ5ICovXG5cdFx0d2hpbGUgKGluZGV4IDwgREFUQS5sZW5ndGggJiYgREFUQVtpbmRleF0gPCBCKSB7XG5cdFx0XHRpbmRleCsrO1xuXHRcdFx0Y291bnQrKztcblx0XHR9XG5cdFx0XG5cdFx0LyogdmlzaWJsZSB3aGVuIG91dHNpZGUgYW4gZXhpc3Rpbmcgc2hhZG93LCBvciB3aGVuIG92ZXJsYXBwaW5nICovXG5cdFx0aWYgKEEgPT0gREFUQVtpbmRleC1jb3VudF0gJiYgY291bnQgPT0gMSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcblx0XHRpZiAoYmxvY2tzKSB7IFxuXHRcdFx0aWYgKGNvdW50ICUgMikge1xuXHRcdFx0XHREQVRBLnNwbGljZShpbmRleC1jb3VudCwgY291bnQsIEEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0REFUQS5zcGxpY2UoaW5kZXgtY291bnQsIGNvdW50LCBBLCBCKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0XHRcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuLyoqXG4gKiBAY2xhc3MgUHJlY2lzZSBzaGFkb3djYXN0aW5nIGFsZ29yaXRobVxuICogQGF1Z21lbnRzIFJPVC5GT1ZcbiAqL1xuUk9ULkZPVi5QcmVjaXNlU2hhZG93Y2FzdGluZyA9IGZ1bmN0aW9uKGxpZ2h0UGFzc2VzQ2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0Uk9ULkZPVi5jYWxsKHRoaXMsIGxpZ2h0UGFzc2VzQ2FsbGJhY2ssIG9wdGlvbnMpO1xufVxuUk9ULkZPVi5QcmVjaXNlU2hhZG93Y2FzdGluZy5leHRlbmQoUk9ULkZPVik7XG5cbi8qKlxuICogQHNlZSBST1QuRk9WI2NvbXB1dGVcbiAqL1xuUk9ULkZPVi5QcmVjaXNlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKHgsIHksIFIsIGNhbGxiYWNrKSB7XG5cdC8qIHRoaXMgcGxhY2UgaXMgYWx3YXlzIHZpc2libGUgKi9cblx0Y2FsbGJhY2soeCwgeSwgMCwgMSk7XG5cblx0Lyogc3RhbmRpbmcgaW4gYSBkYXJrIHBsYWNlLiBGSVhNRSBpcyB0aGlzIGEgZ29vZCBpZGVhPyAgKi9cblx0aWYgKCF0aGlzLl9saWdodFBhc3Nlcyh4LCB5KSkgeyByZXR1cm47IH1cblx0XG5cdC8qIGxpc3Qgb2YgYWxsIHNoYWRvd3MgKi9cblx0dmFyIFNIQURPV1MgPSBbXTtcblx0XG5cdHZhciBjeCwgY3ksIGJsb2NrcywgQTEsIEEyLCB2aXNpYmlsaXR5O1xuXG5cdC8qIGFuYWx5emUgc3Vycm91bmRpbmcgY2VsbHMgaW4gY29uY2VudHJpYyByaW5ncywgc3RhcnRpbmcgZnJvbSB0aGUgY2VudGVyICovXG5cdGZvciAodmFyIHI9MTsgcjw9UjsgcisrKSB7XG5cdFx0dmFyIG5laWdoYm9ycyA9IHRoaXMuX2dldENpcmNsZSh4LCB5LCByKTtcblx0XHR2YXIgbmVpZ2hib3JDb3VudCA9IG5laWdoYm9ycy5sZW5ndGg7XG5cblx0XHRmb3IgKHZhciBpPTA7aTxuZWlnaGJvckNvdW50O2krKykge1xuXHRcdFx0Y3ggPSBuZWlnaGJvcnNbaV1bMF07XG5cdFx0XHRjeSA9IG5laWdoYm9yc1tpXVsxXTtcblx0XHRcdC8qIHNoaWZ0IGhhbGYtYW4tYW5nbGUgYmFja3dhcmRzIHRvIG1haW50YWluIGNvbnNpc3RlbmN5IG9mIDAtdGggY2VsbHMgKi9cblx0XHRcdEExID0gW2kgPyAyKmktMSA6IDIqbmVpZ2hib3JDb3VudC0xLCAyKm5laWdoYm9yQ291bnRdO1xuXHRcdFx0QTIgPSBbMippKzEsIDIqbmVpZ2hib3JDb3VudF07IFxuXHRcdFx0XG5cdFx0XHRibG9ja3MgPSAhdGhpcy5fbGlnaHRQYXNzZXMoY3gsIGN5KTtcblx0XHRcdHZpc2liaWxpdHkgPSB0aGlzLl9jaGVja1Zpc2liaWxpdHkoQTEsIEEyLCBibG9ja3MsIFNIQURPV1MpO1xuXHRcdFx0aWYgKHZpc2liaWxpdHkpIHsgY2FsbGJhY2soY3gsIGN5LCByLCB2aXNpYmlsaXR5KTsgfVxuXG5cdFx0XHRpZiAoU0hBRE9XUy5sZW5ndGggPT0gMiAmJiBTSEFET1dTWzBdWzBdID09IDAgJiYgU0hBRE9XU1sxXVswXSA9PSBTSEFET1dTWzFdWzFdKSB7IHJldHVybjsgfSAvKiBjdXRvZmY/ICovXG5cblx0XHR9IC8qIGZvciBhbGwgY2VsbHMgaW4gdGhpcyByaW5nICovXG5cdH0gLyogZm9yIGFsbCByaW5ncyAqL1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW50WzJdfSBBMSBhcmMgc3RhcnRcbiAqIEBwYXJhbSB7aW50WzJdfSBBMiBhcmMgZW5kXG4gKiBAcGFyYW0ge2Jvb2x9IGJsb2NrcyBEb2VzIGN1cnJlbnQgYXJjIGJsb2NrIHZpc2liaWxpdHk/XG4gKiBAcGFyYW0ge2ludFtdW119IFNIQURPV1MgbGlzdCBvZiBhY3RpdmUgc2hhZG93c1xuICovXG5ST1QuRk9WLlByZWNpc2VTaGFkb3djYXN0aW5nLnByb3RvdHlwZS5fY2hlY2tWaXNpYmlsaXR5ID0gZnVuY3Rpb24oQTEsIEEyLCBibG9ja3MsIFNIQURPV1MpIHtcblx0aWYgKEExWzBdID4gQTJbMF0pIHsgLyogc3BsaXQgaW50byB0d28gc3ViLWFyY3MgKi9cblx0XHR2YXIgdjEgPSB0aGlzLl9jaGVja1Zpc2liaWxpdHkoQTEsIFtBMVsxXSwgQTFbMV1dLCBibG9ja3MsIFNIQURPV1MpO1xuXHRcdHZhciB2MiA9IHRoaXMuX2NoZWNrVmlzaWJpbGl0eShbMCwgMV0sIEEyLCBibG9ja3MsIFNIQURPV1MpO1xuXHRcdHJldHVybiAodjErdjIpLzI7XG5cdH1cblxuXHQvKiBpbmRleDE6IGZpcnN0IHNoYWRvdyA+PSBBMSAqL1xuXHR2YXIgaW5kZXgxID0gMCwgZWRnZTEgPSBmYWxzZTtcblx0d2hpbGUgKGluZGV4MSA8IFNIQURPV1MubGVuZ3RoKSB7XG5cdFx0dmFyIG9sZCA9IFNIQURPV1NbaW5kZXgxXTtcblx0XHR2YXIgZGlmZiA9IG9sZFswXSpBMVsxXSAtIEExWzBdKm9sZFsxXTtcblx0XHRpZiAoZGlmZiA+PSAwKSB7IC8qIG9sZCA+PSBBMSAqL1xuXHRcdFx0aWYgKGRpZmYgPT0gMCAmJiAhKGluZGV4MSAlIDIpKSB7IGVkZ2UxID0gdHJ1ZTsgfVxuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdGluZGV4MSsrO1xuXHR9XG5cblx0LyogaW5kZXgyOiBsYXN0IHNoYWRvdyA8PSBBMiAqL1xuXHR2YXIgaW5kZXgyID0gU0hBRE9XUy5sZW5ndGgsIGVkZ2UyID0gZmFsc2U7XG5cdHdoaWxlIChpbmRleDItLSkge1xuXHRcdHZhciBvbGQgPSBTSEFET1dTW2luZGV4Ml07XG5cdFx0dmFyIGRpZmYgPSBBMlswXSpvbGRbMV0gLSBvbGRbMF0qQTJbMV07XG5cdFx0aWYgKGRpZmYgPj0gMCkgeyAvKiBvbGQgPD0gQTIgKi9cblx0XHRcdGlmIChkaWZmID09IDAgJiYgKGluZGV4MiAlIDIpKSB7IGVkZ2UyID0gdHJ1ZTsgfVxuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0dmFyIHZpc2libGUgPSB0cnVlO1xuXHRpZiAoaW5kZXgxID09IGluZGV4MiAmJiAoZWRnZTEgfHwgZWRnZTIpKSB7ICAvKiBzdWJzZXQgb2YgZXhpc3Rpbmcgc2hhZG93LCBvbmUgb2YgdGhlIGVkZ2VzIG1hdGNoICovXG5cdFx0dmlzaWJsZSA9IGZhbHNlOyBcblx0fSBlbHNlIGlmIChlZGdlMSAmJiBlZGdlMiAmJiBpbmRleDErMT09aW5kZXgyICYmIChpbmRleDIgJSAyKSkgeyAvKiBjb21wbGV0ZWx5IGVxdWl2YWxlbnQgd2l0aCBleGlzdGluZyBzaGFkb3cgKi9cblx0XHR2aXNpYmxlID0gZmFsc2U7XG5cdH0gZWxzZSBpZiAoaW5kZXgxID4gaW5kZXgyICYmIChpbmRleDEgJSAyKSkgeyAvKiBzdWJzZXQgb2YgZXhpc3Rpbmcgc2hhZG93LCBub3QgdG91Y2hpbmcgKi9cblx0XHR2aXNpYmxlID0gZmFsc2U7XG5cdH1cblx0XG5cdGlmICghdmlzaWJsZSkgeyByZXR1cm4gMDsgfSAvKiBmYXN0IGNhc2U6IG5vdCB2aXNpYmxlICovXG5cdFxuXHR2YXIgdmlzaWJsZUxlbmd0aCwgUDtcblxuXHQvKiBjb21wdXRlIHRoZSBsZW5ndGggb2YgdmlzaWJsZSBhcmMsIGFkanVzdCBsaXN0IG9mIHNoYWRvd3MgKGlmIGJsb2NraW5nKSAqL1xuXHR2YXIgcmVtb3ZlID0gaW5kZXgyLWluZGV4MSsxO1xuXHRpZiAocmVtb3ZlICUgMikge1xuXHRcdGlmIChpbmRleDEgJSAyKSB7IC8qIGZpcnN0IGVkZ2Ugd2l0aGluIGV4aXN0aW5nIHNoYWRvdywgc2Vjb25kIG91dHNpZGUgKi9cblx0XHRcdHZhciBQID0gU0hBRE9XU1tpbmRleDFdO1xuXHRcdFx0dmlzaWJsZUxlbmd0aCA9IChBMlswXSpQWzFdIC0gUFswXSpBMlsxXSkgLyAoUFsxXSAqIEEyWzFdKTtcblx0XHRcdGlmIChibG9ja3MpIHsgU0hBRE9XUy5zcGxpY2UoaW5kZXgxLCByZW1vdmUsIEEyKTsgfVxuXHRcdH0gZWxzZSB7IC8qIHNlY29uZCBlZGdlIHdpdGhpbiBleGlzdGluZyBzaGFkb3csIGZpcnN0IG91dHNpZGUgKi9cblx0XHRcdHZhciBQID0gU0hBRE9XU1tpbmRleDJdO1xuXHRcdFx0dmlzaWJsZUxlbmd0aCA9IChQWzBdKkExWzFdIC0gQTFbMF0qUFsxXSkgLyAoQTFbMV0gKiBQWzFdKTtcblx0XHRcdGlmIChibG9ja3MpIHsgU0hBRE9XUy5zcGxpY2UoaW5kZXgxLCByZW1vdmUsIEExKTsgfVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoaW5kZXgxICUgMikgeyAvKiBib3RoIGVkZ2VzIHdpdGhpbiBleGlzdGluZyBzaGFkb3dzICovXG5cdFx0XHR2YXIgUDEgPSBTSEFET1dTW2luZGV4MV07XG5cdFx0XHR2YXIgUDIgPSBTSEFET1dTW2luZGV4Ml07XG5cdFx0XHR2aXNpYmxlTGVuZ3RoID0gKFAyWzBdKlAxWzFdIC0gUDFbMF0qUDJbMV0pIC8gKFAxWzFdICogUDJbMV0pO1xuXHRcdFx0aWYgKGJsb2NrcykgeyBTSEFET1dTLnNwbGljZShpbmRleDEsIHJlbW92ZSk7IH1cblx0XHR9IGVsc2UgeyAvKiBib3RoIGVkZ2VzIG91dHNpZGUgZXhpc3Rpbmcgc2hhZG93cyAqL1xuXHRcdFx0aWYgKGJsb2NrcykgeyBTSEFET1dTLnNwbGljZShpbmRleDEsIHJlbW92ZSwgQTEsIEEyKTsgfVxuXHRcdFx0cmV0dXJuIDE7IC8qIHdob2xlIGFyYyB2aXNpYmxlISAqL1xuXHRcdH1cblx0fVxuXG5cdHZhciBhcmNMZW5ndGggPSAoQTJbMF0qQTFbMV0gLSBBMVswXSpBMlsxXSkgLyAoQTFbMV0gKiBBMlsxXSk7XG5cblx0cmV0dXJuIHZpc2libGVMZW5ndGgvYXJjTGVuZ3RoO1xufVxuLyoqXG4gKiBAY2xhc3MgUmVjdXJzaXZlIHNoYWRvd2Nhc3RpbmcgYWxnb3JpdGhtXG4gKiBDdXJyZW50bHkgb25seSBzdXBwb3J0cyA0LzggdG9wb2xvZ2llcywgbm90IGhleGFnb25hbC5cbiAqIEJhc2VkIG9uIFBldGVyIEhhcmtpbnMnIGltcGxlbWVudGF0aW9uIG9mIEJqw7ZybiBCZXJnc3Ryw7ZtJ3MgYWxnb3JpdGhtIGRlc2NyaWJlZCBoZXJlOiBodHRwOi8vd3d3LnJvZ3VlYmFzaW4uY29tL2luZGV4LnBocD90aXRsZT1GT1ZfdXNpbmdfcmVjdXJzaXZlX3NoYWRvd2Nhc3RpbmdcbiAqIEBhdWdtZW50cyBST1QuRk9WXG4gKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZyA9IGZ1bmN0aW9uKGxpZ2h0UGFzc2VzQ2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0Uk9ULkZPVi5jYWxsKHRoaXMsIGxpZ2h0UGFzc2VzQ2FsbGJhY2ssIG9wdGlvbnMpO1xufVxuUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLmV4dGVuZChST1QuRk9WKTtcblxuLyoqIE9jdGFudHMgdXNlZCBmb3IgdHJhbnNsYXRpbmcgcmVjdXJzaXZlIHNoYWRvd2Nhc3Rpbmcgb2Zmc2V0cyAqL1xuUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLk9DVEFOVFMgPSBbXG5cdFstMSwgIDAsICAwLCAgMV0sXG5cdFsgMCwgLTEsICAxLCAgMF0sXG5cdFsgMCwgLTEsIC0xLCAgMF0sXG5cdFstMSwgIDAsICAwLCAtMV0sXG5cdFsgMSwgIDAsICAwLCAtMV0sXG5cdFsgMCwgIDEsIC0xLCAgMF0sXG5cdFsgMCwgIDEsICAxLCAgMF0sXG5cdFsgMSwgIDAsICAwLCAgMV1cbl07XG5cbi8qKlxuICogQ29tcHV0ZSB2aXNpYmlsaXR5IGZvciBhIDM2MC1kZWdyZWUgY2lyY2xlXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7aW50fSBSIE1heGltdW0gdmlzaWJpbGl0eSByYWRpdXNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKHgsIHksIFIsIGNhbGxiYWNrKSB7XG5cdC8vWW91IGNhbiBhbHdheXMgc2VlIHlvdXIgb3duIHRpbGVcblx0Y2FsbGJhY2soeCwgeSwgMCwgMSk7XG5cdGZvcih2YXIgaSA9IDA7IGkgPCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UUy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1tpXSwgUiwgY2FsbGJhY2spO1xuXHR9XG59XG5cbi8qKlxuICogQ29tcHV0ZSB2aXNpYmlsaXR5IGZvciBhIDE4MC1kZWdyZWUgYXJjXG4gKiBAcGFyYW0ge2ludH0geFxuICogQHBhcmFtIHtpbnR9IHlcbiAqIEBwYXJhbSB7aW50fSBSIE1heGltdW0gdmlzaWJpbGl0eSByYWRpdXNcbiAqIEBwYXJhbSB7aW50fSBkaXIgRGlyZWN0aW9uIHRvIGxvb2sgaW4gKGV4cHJlc3NlZCBpbiBhIFJPVC5ESVJTIHZhbHVlKTtcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuY29tcHV0ZTE4MCA9IGZ1bmN0aW9uKHgsIHksIFIsIGRpciwgY2FsbGJhY2spIHtcblx0Ly9Zb3UgY2FuIGFsd2F5cyBzZWUgeW91ciBvd24gdGlsZVxuXHRjYWxsYmFjayh4LCB5LCAwLCAxKTtcblx0dmFyIHByZXZpb3VzT2N0YW50ID0gKGRpciAtIDEgKyA4KSAlIDg7IC8vTmVlZCB0byByZXRyaWV2ZSB0aGUgcHJldmlvdXMgb2N0YW50IHRvIHJlbmRlciBhIGZ1bGwgMTgwIGRlZ3JlZXNcblx0dmFyIG5leHRQcmV2aW91c09jdGFudCA9IChkaXIgLSAyICsgOCkgJSA4OyAvL05lZWQgdG8gcmV0cmlldmUgdGhlIHByZXZpb3VzIHR3byBvY3RhbnRzIHRvIHJlbmRlciBhIGZ1bGwgMTgwIGRlZ3JlZXNcblx0dmFyIG5leHRPY3RhbnQgPSAoZGlyKyAxICsgOCkgJSA4OyAvL05lZWQgdG8gZ3JhYiB0byBuZXh0IG9jdGFudCB0byByZW5kZXIgYSBmdWxsIDE4MCBkZWdyZWVzXG5cdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1tuZXh0UHJldmlvdXNPY3RhbnRdLCBSLCBjYWxsYmFjayk7XG5cdHRoaXMuX3JlbmRlck9jdGFudCh4LCB5LCBST1QuRk9WLlJlY3Vyc2l2ZVNoYWRvd2Nhc3RpbmcuT0NUQU5UU1twcmV2aW91c09jdGFudF0sIFIsIGNhbGxiYWNrKTtcblx0dGhpcy5fcmVuZGVyT2N0YW50KHgsIHksIFJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5PQ1RBTlRTW2Rpcl0sIFIsIGNhbGxiYWNrKTtcblx0dGhpcy5fcmVuZGVyT2N0YW50KHgsIHksIFJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5PQ1RBTlRTW25leHRPY3RhbnRdLCBSLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB2aXNpYmlsaXR5IGZvciBhIDkwLWRlZ3JlZSBhcmNcbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtpbnR9IFIgTWF4aW11bSB2aXNpYmlsaXR5IHJhZGl1c1xuICogQHBhcmFtIHtpbnR9IGRpciBEaXJlY3Rpb24gdG8gbG9vayBpbiAoZXhwcmVzc2VkIGluIGEgUk9ULkRJUlMgdmFsdWUpO1xuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuUk9ULkZPVi5SZWN1cnNpdmVTaGFkb3djYXN0aW5nLnByb3RvdHlwZS5jb21wdXRlOTAgPSBmdW5jdGlvbih4LCB5LCBSLCBkaXIsIGNhbGxiYWNrKSB7XG5cdC8vWW91IGNhbiBhbHdheXMgc2VlIHlvdXIgb3duIHRpbGVcblx0Y2FsbGJhY2soeCwgeSwgMCwgMSk7XG5cdHZhciBwcmV2aW91c09jdGFudCA9IChkaXIgLSAxICsgOCkgJSA4OyAvL05lZWQgdG8gcmV0cmlldmUgdGhlIHByZXZpb3VzIG9jdGFudCB0byByZW5kZXIgYSBmdWxsIDkwIGRlZ3JlZXNcblx0dGhpcy5fcmVuZGVyT2N0YW50KHgsIHksIFJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5PQ1RBTlRTW2Rpcl0sIFIsIGNhbGxiYWNrKTtcblx0dGhpcy5fcmVuZGVyT2N0YW50KHgsIHksIFJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5PQ1RBTlRTW3ByZXZpb3VzT2N0YW50XSwgUiwgY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFJlbmRlciBvbmUgb2N0YW50ICg0NS1kZWdyZWUgYXJjKSBvZiB0aGUgdmlld3NoZWRcbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtpbnR9IG9jdGFudCBPY3RhbnQgdG8gYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSB7aW50fSBSIE1heGltdW0gdmlzaWJpbGl0eSByYWRpdXNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuX3JlbmRlck9jdGFudCA9IGZ1bmN0aW9uKHgsIHksIG9jdGFudCwgUiwgY2FsbGJhY2spIHtcblx0Ly9SYWRpdXMgaW5jcmVtZW50ZWQgYnkgMSB0byBwcm92aWRlIHNhbWUgY292ZXJhZ2UgYXJlYSBhcyBvdGhlciBzaGFkb3djYXN0aW5nIHJhZGl1c2VzXG5cdHRoaXMuX2Nhc3RWaXNpYmlsaXR5KHgsIHksIDEsIDEuMCwgMC4wLCBSICsgMSwgb2N0YW50WzBdLCBvY3RhbnRbMV0sIG9jdGFudFsyXSwgb2N0YW50WzNdLCBjYWxsYmFjayk7XG59XG5cbi8qKlxuICogQWN0dWFsbHkgY2FsY3VsYXRlcyB0aGUgdmlzaWJpbGl0eVxuICogQHBhcmFtIHtpbnR9IHN0YXJ0WCBUaGUgc3RhcnRpbmcgWCBjb29yZGluYXRlXG4gKiBAcGFyYW0ge2ludH0gc3RhcnRZIFRoZSBzdGFydGluZyBZIGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7aW50fSByb3cgVGhlIHJvdyB0byByZW5kZXJcbiAqIEBwYXJhbSB7ZmxvYXR9IHZpc1Nsb3BlU3RhcnQgVGhlIHNsb3BlIHRvIHN0YXJ0IGF0XG4gKiBAcGFyYW0ge2Zsb2F0fSB2aXNTbG9wZUVuZCBUaGUgc2xvcGUgdG8gZW5kIGF0XG4gKiBAcGFyYW0ge2ludH0gcmFkaXVzIFRoZSByYWRpdXMgdG8gcmVhY2ggb3V0IHRvXG4gKiBAcGFyYW0ge2ludH0geHggXG4gKiBAcGFyYW0ge2ludH0geHkgXG4gKiBAcGFyYW0ge2ludH0geXggXG4gKiBAcGFyYW0ge2ludH0geXkgXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgY2FsbGJhY2sgdG8gdXNlIHdoZW4gd2UgaGl0IGEgYmxvY2sgdGhhdCBpcyB2aXNpYmxlXG4gKi9cblJPVC5GT1YuUmVjdXJzaXZlU2hhZG93Y2FzdGluZy5wcm90b3R5cGUuX2Nhc3RWaXNpYmlsaXR5ID0gZnVuY3Rpb24oc3RhcnRYLCBzdGFydFksIHJvdywgdmlzU2xvcGVTdGFydCwgdmlzU2xvcGVFbmQsIHJhZGl1cywgeHgsIHh5LCB5eCwgeXksIGNhbGxiYWNrKSB7XG5cdGlmKHZpc1Nsb3BlU3RhcnQgPCB2aXNTbG9wZUVuZCkgeyByZXR1cm47IH1cblx0Zm9yKHZhciBpID0gcm93OyBpIDw9IHJhZGl1czsgaSsrKSB7XG5cdFx0dmFyIGR4ID0gLWkgLSAxO1xuXHRcdHZhciBkeSA9IC1pO1xuXHRcdHZhciBibG9ja2VkID0gZmFsc2U7XG5cdFx0dmFyIG5ld1N0YXJ0ID0gMDtcblxuXHRcdC8vJ1JvdycgY291bGQgYmUgY29sdW1uLCBuYW1lcyBoZXJlIGFzc3VtZSBvY3RhbnQgMCBhbmQgd291bGQgYmUgZmxpcHBlZCBmb3IgaGFsZiB0aGUgb2N0YW50c1xuXHRcdHdoaWxlKGR4IDw9IDApIHtcblx0XHRcdGR4ICs9IDE7XG5cblx0XHRcdC8vVHJhbnNsYXRlIGZyb20gcmVsYXRpdmUgY29vcmRpbmF0ZXMgdG8gbWFwIGNvb3JkaW5hdGVzXG5cdFx0XHR2YXIgbWFwWCA9IHN0YXJ0WCArIGR4ICogeHggKyBkeSAqIHh5O1xuXHRcdFx0dmFyIG1hcFkgPSBzdGFydFkgKyBkeCAqIHl4ICsgZHkgKiB5eTtcblxuXHRcdFx0Ly9SYW5nZSBvZiB0aGUgcm93XG5cdFx0XHR2YXIgc2xvcGVTdGFydCA9IChkeCAtIDAuNSkgLyAoZHkgKyAwLjUpO1xuXHRcdFx0dmFyIHNsb3BlRW5kID0gKGR4ICsgMC41KSAvIChkeSAtIDAuNSk7XG5cdFx0XG5cdFx0XHQvL0lnbm9yZSBpZiBub3QgeWV0IGF0IGxlZnQgZWRnZSBvZiBPY3RhbnRcblx0XHRcdGlmKHNsb3BlRW5kID4gdmlzU2xvcGVTdGFydCkgeyBjb250aW51ZTsgfVxuXHRcdFx0XG5cdFx0XHQvL0RvbmUgaWYgcGFzdCByaWdodCBlZGdlXG5cdFx0XHRpZihzbG9wZVN0YXJ0IDwgdmlzU2xvcGVFbmQpIHsgYnJlYWs7IH1cblx0XHRcdFx0XG5cdFx0XHQvL0lmIGl0J3MgaW4gcmFuZ2UsIGl0J3MgdmlzaWJsZVxuXHRcdFx0aWYoKGR4ICogZHggKyBkeSAqIGR5KSA8IChyYWRpdXMgKiByYWRpdXMpKSB7XG5cdFx0XHRcdGNhbGxiYWNrKG1hcFgsIG1hcFksIGksIDEpO1xuXHRcdFx0fVxuXHRcblx0XHRcdGlmKCFibG9ja2VkKSB7XG5cdFx0XHRcdC8vSWYgdGlsZSBpcyBhIGJsb2NraW5nIHRpbGUsIGNhc3QgYXJvdW5kIGl0XG5cdFx0XHRcdGlmKCF0aGlzLl9saWdodFBhc3NlcyhtYXBYLCBtYXBZKSAmJiBpIDwgcmFkaXVzKSB7XG5cdFx0XHRcdFx0YmxvY2tlZCA9IHRydWU7XG5cdFx0XHRcdFx0dGhpcy5fY2FzdFZpc2liaWxpdHkoc3RhcnRYLCBzdGFydFksIGkgKyAxLCB2aXNTbG9wZVN0YXJ0LCBzbG9wZVN0YXJ0LCByYWRpdXMsIHh4LCB4eSwgeXgsIHl5LCBjYWxsYmFjayk7XG5cdFx0XHRcdFx0bmV3U3RhcnQgPSBzbG9wZUVuZDtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly9LZWVwIG5hcnJvd2luZyBpZiBzY2FubmluZyBhY3Jvc3MgYSBibG9ja1xuXHRcdFx0XHRpZighdGhpcy5fbGlnaHRQYXNzZXMobWFwWCwgbWFwWSkpIHtcblx0XHRcdFx0XHRuZXdTdGFydCA9IHNsb3BlRW5kO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcblx0XHRcdFx0Ly9CbG9jayBoYXMgZW5kZWRcblx0XHRcdFx0YmxvY2tlZCA9IGZhbHNlO1xuXHRcdFx0XHR2aXNTbG9wZVN0YXJ0ID0gbmV3U3RhcnQ7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKGJsb2NrZWQpIHsgYnJlYWs7IH1cblx0fVxufVxuLyoqXG4gKiBAbmFtZXNwYWNlIENvbG9yIG9wZXJhdGlvbnNcbiAqL1xuUk9ULkNvbG9yID0ge1xuXHRmcm9tU3RyaW5nOiBmdW5jdGlvbihzdHIpIHtcblx0XHR2YXIgY2FjaGVkLCByO1xuXHRcdGlmIChzdHIgaW4gdGhpcy5fY2FjaGUpIHtcblx0XHRcdGNhY2hlZCA9IHRoaXMuX2NhY2hlW3N0cl07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChzdHIuY2hhckF0KDApID09IFwiI1wiKSB7IC8qIGhleCByZ2IgKi9cblxuXHRcdFx0XHR2YXIgdmFsdWVzID0gc3RyLm1hdGNoKC9bMC05YS1mXS9naSkubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHBhcnNlSW50KHgsIDE2KTsgfSk7XG5cdFx0XHRcdGlmICh2YWx1ZXMubGVuZ3RoID09IDMpIHtcblx0XHRcdFx0XHRjYWNoZWQgPSB2YWx1ZXMubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHgqMTc7IH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7XG5cdFx0XHRcdFx0XHR2YWx1ZXNbaSsxXSArPSAxNip2YWx1ZXNbaV07XG5cdFx0XHRcdFx0XHR2YWx1ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYWNoZWQgPSB2YWx1ZXM7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmICgociA9IHN0ci5tYXRjaCgvcmdiXFwoKFswLTksIF0rKVxcKS9pKSkpIHsgLyogZGVjaW1hbCByZ2IgKi9cblx0XHRcdFx0Y2FjaGVkID0gclsxXS5zcGxpdCgvXFxzKixcXHMqLykubWFwKGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHBhcnNlSW50KHgpOyB9KTtcblx0XHRcdH0gZWxzZSB7IC8qIGh0bWwgbmFtZSAqL1xuXHRcdFx0XHRjYWNoZWQgPSBbMCwgMCwgMF07XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX2NhY2hlW3N0cl0gPSBjYWNoZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNhY2hlZC5zbGljZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGQgdHdvIG9yIG1vcmUgY29sb3JzXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMVxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjJcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0YWRkOiBmdW5jdGlvbihjb2xvcjEsIGNvbG9yMikge1xuXHRcdHZhciByZXN1bHQgPSBjb2xvcjEuc2xpY2UoKTtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0Zm9yICh2YXIgaj0xO2o8YXJndW1lbnRzLmxlbmd0aDtqKyspIHtcblx0XHRcdFx0cmVzdWx0W2ldICs9IGFyZ3VtZW50c1tqXVtpXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHQvKipcblx0ICogQWRkIHR3byBvciBtb3JlIGNvbG9ycywgTU9ESUZJRVMgRklSU1QgQVJHVU1FTlRcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IxXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMlxuXHQgKiBAcmV0dXJucyB7bnVtYmVyW119XG5cdCAqL1xuXHRhZGRfOiBmdW5jdGlvbihjb2xvcjEsIGNvbG9yMikge1xuXHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7XG5cdFx0XHRmb3IgKHZhciBqPTE7ajxhcmd1bWVudHMubGVuZ3RoO2orKykge1xuXHRcdFx0XHRjb2xvcjFbaV0gKz0gYXJndW1lbnRzW2pdW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gY29sb3IxO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBNdWx0aXBseSAobWl4KSB0d28gb3IgbW9yZSBjb2xvcnNcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IxXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMlxuXHQgKiBAcmV0dXJucyB7bnVtYmVyW119XG5cdCAqL1xuXHRtdWx0aXBseTogZnVuY3Rpb24oY29sb3IxLCBjb2xvcjIpIHtcblx0XHR2YXIgcmVzdWx0ID0gY29sb3IxLnNsaWNlKCk7XG5cdFx0Zm9yICh2YXIgaT0wO2k8MztpKyspIHtcblx0XHRcdGZvciAodmFyIGo9MTtqPGFyZ3VtZW50cy5sZW5ndGg7aisrKSB7XG5cdFx0XHRcdHJlc3VsdFtpXSAqPSBhcmd1bWVudHNbal1baV0gLyAyNTU7XG5cdFx0XHR9XG5cdFx0XHRyZXN1bHRbaV0gPSBNYXRoLnJvdW5kKHJlc3VsdFtpXSk7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cblx0LyoqXG5cdCAqIE11bHRpcGx5IChtaXgpIHR3byBvciBtb3JlIGNvbG9ycywgTU9ESUZJRVMgRklSU1QgQVJHVU1FTlRcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IxXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMlxuXHQgKiBAcmV0dXJucyB7bnVtYmVyW119XG5cdCAqL1xuXHRtdWx0aXBseV86IGZ1bmN0aW9uKGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0Zm9yICh2YXIgaT0wO2k8MztpKyspIHtcblx0XHRcdGZvciAodmFyIGo9MTtqPGFyZ3VtZW50cy5sZW5ndGg7aisrKSB7XG5cdFx0XHRcdGNvbG9yMVtpXSAqPSBhcmd1bWVudHNbal1baV0gLyAyNTU7XG5cdFx0XHR9XG5cdFx0XHRjb2xvcjFbaV0gPSBNYXRoLnJvdW5kKGNvbG9yMVtpXSk7XG5cdFx0fVxuXHRcdHJldHVybiBjb2xvcjE7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEludGVycG9sYXRlIChibGVuZCkgdHdvIGNvbG9ycyB3aXRoIGEgZ2l2ZW4gZmFjdG9yXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGNvbG9yMVxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjJcblx0ICogQHBhcmFtIHtmbG9hdH0gW2ZhY3Rvcj0wLjVdIDAuLjFcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0aW50ZXJwb2xhdGU6IGZ1bmN0aW9uKGNvbG9yMSwgY29sb3IyLCBmYWN0b3IpIHtcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHsgZmFjdG9yID0gMC41OyB9XG5cdFx0dmFyIHJlc3VsdCA9IGNvbG9yMS5zbGljZSgpO1xuXHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7XG5cdFx0XHRyZXN1bHRbaV0gPSBNYXRoLnJvdW5kKHJlc3VsdFtpXSArIGZhY3RvciooY29sb3IyW2ldLWNvbG9yMVtpXSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBJbnRlcnBvbGF0ZSAoYmxlbmQpIHR3byBjb2xvcnMgd2l0aCBhIGdpdmVuIGZhY3RvciBpbiBIU0wgbW9kZVxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBjb2xvcjFcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3IyXG5cdCAqIEBwYXJhbSB7ZmxvYXR9IFtmYWN0b3I9MC41XSAwLi4xXG5cdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cblx0ICovXG5cdGludGVycG9sYXRlSFNMOiBmdW5jdGlvbihjb2xvcjEsIGNvbG9yMiwgZmFjdG9yKSB7XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7IGZhY3RvciA9IDAuNTsgfVxuXHRcdHZhciBoc2wxID0gdGhpcy5yZ2IyaHNsKGNvbG9yMSk7XG5cdFx0dmFyIGhzbDIgPSB0aGlzLnJnYjJoc2woY29sb3IyKTtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0aHNsMVtpXSArPSBmYWN0b3IqKGhzbDJbaV0taHNsMVtpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmhzbDJyZ2IoaHNsMSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIG5ldyByYW5kb20gY29sb3IgYmFzZWQgb24gdGhpcyBvbmVcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3Jcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gZGlmZiBTZXQgb2Ygc3RhbmRhcmQgZGV2aWF0aW9uc1xuXHQgKiBAcmV0dXJucyB7bnVtYmVyW119XG5cdCAqL1xuXHRyYW5kb21pemU6IGZ1bmN0aW9uKGNvbG9yLCBkaWZmKSB7XG5cdFx0aWYgKCEoZGlmZiBpbnN0YW5jZW9mIEFycmF5KSkgeyBkaWZmID0gTWF0aC5yb3VuZChST1QuUk5HLmdldE5vcm1hbCgwLCBkaWZmKSk7IH1cblx0XHR2YXIgcmVzdWx0ID0gY29sb3Iuc2xpY2UoKTtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0cmVzdWx0W2ldICs9IChkaWZmIGluc3RhbmNlb2YgQXJyYXkgPyBNYXRoLnJvdW5kKFJPVC5STkcuZ2V0Tm9ybWFsKDAsIGRpZmZbaV0pKSA6IGRpZmYpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhbiBSR0IgY29sb3IgdmFsdWUgdG8gSFNMLiBFeHBlY3RzIDAuLjI1NSBpbnB1dHMsIHByb2R1Y2VzIDAuLjEgb3V0cHV0cy5cblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3Jcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0cmdiMmhzbDogZnVuY3Rpb24oY29sb3IpIHtcblx0XHR2YXIgciA9IGNvbG9yWzBdLzI1NTtcblx0XHR2YXIgZyA9IGNvbG9yWzFdLzI1NTtcblx0XHR2YXIgYiA9IGNvbG9yWzJdLzI1NTtcblxuXHRcdHZhciBtYXggPSBNYXRoLm1heChyLCBnLCBiKSwgbWluID0gTWF0aC5taW4ociwgZywgYik7XG5cdFx0dmFyIGgsIHMsIGwgPSAobWF4ICsgbWluKSAvIDI7XG5cblx0XHRpZiAobWF4ID09IG1pbikge1xuXHRcdFx0aCA9IHMgPSAwOyAvLyBhY2hyb21hdGljXG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBkID0gbWF4IC0gbWluO1xuXHRcdFx0cyA9IChsID4gMC41ID8gZCAvICgyIC0gbWF4IC0gbWluKSA6IGQgLyAobWF4ICsgbWluKSk7XG5cdFx0XHRzd2l0Y2gobWF4KSB7XG5cdFx0XHRcdGNhc2UgcjogaCA9IChnIC0gYikgLyBkICsgKGcgPCBiID8gNiA6IDApOyBicmVhaztcblx0XHRcdFx0Y2FzZSBnOiBoID0gKGIgLSByKSAvIGQgKyAyOyBicmVhaztcblx0XHRcdFx0Y2FzZSBiOiBoID0gKHIgLSBnKSAvIGQgKyA0OyBicmVhaztcblx0XHRcdH1cblx0XHRcdGggLz0gNjtcblx0XHR9XG5cblx0XHRyZXR1cm4gW2gsIHMsIGxdO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhbiBIU0wgY29sb3IgdmFsdWUgdG8gUkdCLiBFeHBlY3RzIDAuLjEgaW5wdXRzLCBwcm9kdWNlcyAwLi4yNTUgb3V0cHV0cy5cblx0ICogQHBhcmFtIHtudW1iZXJbXX0gY29sb3Jcblx0ICogQHJldHVybnMge251bWJlcltdfVxuXHQgKi9cblx0aHNsMnJnYjogZnVuY3Rpb24oY29sb3IpIHtcblx0XHR2YXIgbCA9IGNvbG9yWzJdO1xuXG5cdFx0aWYgKGNvbG9yWzFdID09IDApIHtcblx0XHRcdGwgPSBNYXRoLnJvdW5kKGwqMjU1KTtcblx0XHRcdHJldHVybiBbbCwgbCwgbF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBodWUycmdiID0gZnVuY3Rpb24ocCwgcSwgdCkge1xuXHRcdFx0XHRpZiAodCA8IDApIHQgKz0gMTtcblx0XHRcdFx0aWYgKHQgPiAxKSB0IC09IDE7XG5cdFx0XHRcdGlmICh0IDwgMS82KSByZXR1cm4gcCArIChxIC0gcCkgKiA2ICogdDtcblx0XHRcdFx0aWYgKHQgPCAxLzIpIHJldHVybiBxO1xuXHRcdFx0XHRpZiAodCA8IDIvMykgcmV0dXJuIHAgKyAocSAtIHApICogKDIvMyAtIHQpICogNjtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBzID0gY29sb3JbMV07XG5cdFx0XHR2YXIgcSA9IChsIDwgMC41ID8gbCAqICgxICsgcykgOiBsICsgcyAtIGwgKiBzKTtcblx0XHRcdHZhciBwID0gMiAqIGwgLSBxO1xuXHRcdFx0dmFyIHIgPSBodWUycmdiKHAsIHEsIGNvbG9yWzBdICsgMS8zKTtcblx0XHRcdHZhciBnID0gaHVlMnJnYihwLCBxLCBjb2xvclswXSk7XG5cdFx0XHR2YXIgYiA9IGh1ZTJyZ2IocCwgcSwgY29sb3JbMF0gLSAxLzMpO1xuXHRcdFx0cmV0dXJuIFtNYXRoLnJvdW5kKHIqMjU1KSwgTWF0aC5yb3VuZChnKjI1NSksIE1hdGgucm91bmQoYioyNTUpXTtcblx0XHR9XG5cdH0sXG5cblx0dG9SR0I6IGZ1bmN0aW9uKGNvbG9yKSB7XG5cdFx0cmV0dXJuIFwicmdiKFwiICsgdGhpcy5fY2xhbXAoY29sb3JbMF0pICsgXCIsXCIgKyB0aGlzLl9jbGFtcChjb2xvclsxXSkgKyBcIixcIiArIHRoaXMuX2NsYW1wKGNvbG9yWzJdKSArIFwiKVwiO1xuXHR9LFxuXG5cdHRvSGV4OiBmdW5jdGlvbihjb2xvcikge1xuXHRcdHZhciBwYXJ0cyA9IFtdO1xuXHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7XG5cdFx0XHRwYXJ0cy5wdXNoKHRoaXMuX2NsYW1wKGNvbG9yW2ldKS50b1N0cmluZygxNikubHBhZChcIjBcIiwgMikpO1xuXHRcdH1cblx0XHRyZXR1cm4gXCIjXCIgKyBwYXJ0cy5qb2luKFwiXCIpO1xuXHR9LFxuXG5cdF9jbGFtcDogZnVuY3Rpb24obnVtKSB7XG5cdFx0aWYgKG51bSA8IDApIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH0gZWxzZSBpZiAobnVtID4gMjU1KSB7XG5cdFx0XHRyZXR1cm4gMjU1O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVtO1xuXHRcdH1cblx0fSxcblxuXHRfY2FjaGU6IHtcblx0XHRcImJsYWNrXCI6IFswLDAsMF0sXG5cdFx0XCJuYXZ5XCI6IFswLDAsMTI4XSxcblx0XHRcImRhcmtibHVlXCI6IFswLDAsMTM5XSxcblx0XHRcIm1lZGl1bWJsdWVcIjogWzAsMCwyMDVdLFxuXHRcdFwiYmx1ZVwiOiBbMCwwLDI1NV0sXG5cdFx0XCJkYXJrZ3JlZW5cIjogWzAsMTAwLDBdLFxuXHRcdFwiZ3JlZW5cIjogWzAsMTI4LDBdLFxuXHRcdFwidGVhbFwiOiBbMCwxMjgsMTI4XSxcblx0XHRcImRhcmtjeWFuXCI6IFswLDEzOSwxMzldLFxuXHRcdFwiZGVlcHNreWJsdWVcIjogWzAsMTkxLDI1NV0sXG5cdFx0XCJkYXJrdHVycXVvaXNlXCI6IFswLDIwNiwyMDldLFxuXHRcdFwibWVkaXVtc3ByaW5nZ3JlZW5cIjogWzAsMjUwLDE1NF0sXG5cdFx0XCJsaW1lXCI6IFswLDI1NSwwXSxcblx0XHRcInNwcmluZ2dyZWVuXCI6IFswLDI1NSwxMjddLFxuXHRcdFwiYXF1YVwiOiBbMCwyNTUsMjU1XSxcblx0XHRcImN5YW5cIjogWzAsMjU1LDI1NV0sXG5cdFx0XCJtaWRuaWdodGJsdWVcIjogWzI1LDI1LDExMl0sXG5cdFx0XCJkb2RnZXJibHVlXCI6IFszMCwxNDQsMjU1XSxcblx0XHRcImZvcmVzdGdyZWVuXCI6IFszNCwxMzksMzRdLFxuXHRcdFwic2VhZ3JlZW5cIjogWzQ2LDEzOSw4N10sXG5cdFx0XCJkYXJrc2xhdGVncmF5XCI6IFs0Nyw3OSw3OV0sXG5cdFx0XCJkYXJrc2xhdGVncmV5XCI6IFs0Nyw3OSw3OV0sXG5cdFx0XCJsaW1lZ3JlZW5cIjogWzUwLDIwNSw1MF0sXG5cdFx0XCJtZWRpdW1zZWFncmVlblwiOiBbNjAsMTc5LDExM10sXG5cdFx0XCJ0dXJxdW9pc2VcIjogWzY0LDIyNCwyMDhdLFxuXHRcdFwicm95YWxibHVlXCI6IFs2NSwxMDUsMjI1XSxcblx0XHRcInN0ZWVsYmx1ZVwiOiBbNzAsMTMwLDE4MF0sXG5cdFx0XCJkYXJrc2xhdGVibHVlXCI6IFs3Miw2MSwxMzldLFxuXHRcdFwibWVkaXVtdHVycXVvaXNlXCI6IFs3MiwyMDksMjA0XSxcblx0XHRcImluZGlnb1wiOiBbNzUsMCwxMzBdLFxuXHRcdFwiZGFya29saXZlZ3JlZW5cIjogWzg1LDEwNyw0N10sXG5cdFx0XCJjYWRldGJsdWVcIjogWzk1LDE1OCwxNjBdLFxuXHRcdFwiY29ybmZsb3dlcmJsdWVcIjogWzEwMCwxNDksMjM3XSxcblx0XHRcIm1lZGl1bWFxdWFtYXJpbmVcIjogWzEwMiwyMDUsMTcwXSxcblx0XHRcImRpbWdyYXlcIjogWzEwNSwxMDUsMTA1XSxcblx0XHRcImRpbWdyZXlcIjogWzEwNSwxMDUsMTA1XSxcblx0XHRcInNsYXRlYmx1ZVwiOiBbMTA2LDkwLDIwNV0sXG5cdFx0XCJvbGl2ZWRyYWJcIjogWzEwNywxNDIsMzVdLFxuXHRcdFwic2xhdGVncmF5XCI6IFsxMTIsMTI4LDE0NF0sXG5cdFx0XCJzbGF0ZWdyZXlcIjogWzExMiwxMjgsMTQ0XSxcblx0XHRcImxpZ2h0c2xhdGVncmF5XCI6IFsxMTksMTM2LDE1M10sXG5cdFx0XCJsaWdodHNsYXRlZ3JleVwiOiBbMTE5LDEzNiwxNTNdLFxuXHRcdFwibWVkaXVtc2xhdGVibHVlXCI6IFsxMjMsMTA0LDIzOF0sXG5cdFx0XCJsYXduZ3JlZW5cIjogWzEyNCwyNTIsMF0sXG5cdFx0XCJjaGFydHJldXNlXCI6IFsxMjcsMjU1LDBdLFxuXHRcdFwiYXF1YW1hcmluZVwiOiBbMTI3LDI1NSwyMTJdLFxuXHRcdFwibWFyb29uXCI6IFsxMjgsMCwwXSxcblx0XHRcInB1cnBsZVwiOiBbMTI4LDAsMTI4XSxcblx0XHRcIm9saXZlXCI6IFsxMjgsMTI4LDBdLFxuXHRcdFwiZ3JheVwiOiBbMTI4LDEyOCwxMjhdLFxuXHRcdFwiZ3JleVwiOiBbMTI4LDEyOCwxMjhdLFxuXHRcdFwic2t5Ymx1ZVwiOiBbMTM1LDIwNiwyMzVdLFxuXHRcdFwibGlnaHRza3libHVlXCI6IFsxMzUsMjA2LDI1MF0sXG5cdFx0XCJibHVldmlvbGV0XCI6IFsxMzgsNDMsMjI2XSxcblx0XHRcImRhcmtyZWRcIjogWzEzOSwwLDBdLFxuXHRcdFwiZGFya21hZ2VudGFcIjogWzEzOSwwLDEzOV0sXG5cdFx0XCJzYWRkbGVicm93blwiOiBbMTM5LDY5LDE5XSxcblx0XHRcImRhcmtzZWFncmVlblwiOiBbMTQzLDE4OCwxNDNdLFxuXHRcdFwibGlnaHRncmVlblwiOiBbMTQ0LDIzOCwxNDRdLFxuXHRcdFwibWVkaXVtcHVycGxlXCI6IFsxNDcsMTEyLDIxNl0sXG5cdFx0XCJkYXJrdmlvbGV0XCI6IFsxNDgsMCwyMTFdLFxuXHRcdFwicGFsZWdyZWVuXCI6IFsxNTIsMjUxLDE1Ml0sXG5cdFx0XCJkYXJrb3JjaGlkXCI6IFsxNTMsNTAsMjA0XSxcblx0XHRcInllbGxvd2dyZWVuXCI6IFsxNTQsMjA1LDUwXSxcblx0XHRcInNpZW5uYVwiOiBbMTYwLDgyLDQ1XSxcblx0XHRcImJyb3duXCI6IFsxNjUsNDIsNDJdLFxuXHRcdFwiZGFya2dyYXlcIjogWzE2OSwxNjksMTY5XSxcblx0XHRcImRhcmtncmV5XCI6IFsxNjksMTY5LDE2OV0sXG5cdFx0XCJsaWdodGJsdWVcIjogWzE3MywyMTYsMjMwXSxcblx0XHRcImdyZWVueWVsbG93XCI6IFsxNzMsMjU1LDQ3XSxcblx0XHRcInBhbGV0dXJxdW9pc2VcIjogWzE3NSwyMzgsMjM4XSxcblx0XHRcImxpZ2h0c3RlZWxibHVlXCI6IFsxNzYsMTk2LDIyMl0sXG5cdFx0XCJwb3dkZXJibHVlXCI6IFsxNzYsMjI0LDIzMF0sXG5cdFx0XCJmaXJlYnJpY2tcIjogWzE3OCwzNCwzNF0sXG5cdFx0XCJkYXJrZ29sZGVucm9kXCI6IFsxODQsMTM0LDExXSxcblx0XHRcIm1lZGl1bW9yY2hpZFwiOiBbMTg2LDg1LDIxMV0sXG5cdFx0XCJyb3N5YnJvd25cIjogWzE4OCwxNDMsMTQzXSxcblx0XHRcImRhcmtraGFraVwiOiBbMTg5LDE4MywxMDddLFxuXHRcdFwic2lsdmVyXCI6IFsxOTIsMTkyLDE5Ml0sXG5cdFx0XCJtZWRpdW12aW9sZXRyZWRcIjogWzE5OSwyMSwxMzNdLFxuXHRcdFwiaW5kaWFucmVkXCI6IFsyMDUsOTIsOTJdLFxuXHRcdFwicGVydVwiOiBbMjA1LDEzMyw2M10sXG5cdFx0XCJjaG9jb2xhdGVcIjogWzIxMCwxMDUsMzBdLFxuXHRcdFwidGFuXCI6IFsyMTAsMTgwLDE0MF0sXG5cdFx0XCJsaWdodGdyYXlcIjogWzIxMSwyMTEsMjExXSxcblx0XHRcImxpZ2h0Z3JleVwiOiBbMjExLDIxMSwyMTFdLFxuXHRcdFwicGFsZXZpb2xldHJlZFwiOiBbMjE2LDExMiwxNDddLFxuXHRcdFwidGhpc3RsZVwiOiBbMjE2LDE5MSwyMTZdLFxuXHRcdFwib3JjaGlkXCI6IFsyMTgsMTEyLDIxNF0sXG5cdFx0XCJnb2xkZW5yb2RcIjogWzIxOCwxNjUsMzJdLFxuXHRcdFwiY3JpbXNvblwiOiBbMjIwLDIwLDYwXSxcblx0XHRcImdhaW5zYm9yb1wiOiBbMjIwLDIyMCwyMjBdLFxuXHRcdFwicGx1bVwiOiBbMjIxLDE2MCwyMjFdLFxuXHRcdFwiYnVybHl3b29kXCI6IFsyMjIsMTg0LDEzNV0sXG5cdFx0XCJsaWdodGN5YW5cIjogWzIyNCwyNTUsMjU1XSxcblx0XHRcImxhdmVuZGVyXCI6IFsyMzAsMjMwLDI1MF0sXG5cdFx0XCJkYXJrc2FsbW9uXCI6IFsyMzMsMTUwLDEyMl0sXG5cdFx0XCJ2aW9sZXRcIjogWzIzOCwxMzAsMjM4XSxcblx0XHRcInBhbGVnb2xkZW5yb2RcIjogWzIzOCwyMzIsMTcwXSxcblx0XHRcImxpZ2h0Y29yYWxcIjogWzI0MCwxMjgsMTI4XSxcblx0XHRcImtoYWtpXCI6IFsyNDAsMjMwLDE0MF0sXG5cdFx0XCJhbGljZWJsdWVcIjogWzI0MCwyNDgsMjU1XSxcblx0XHRcImhvbmV5ZGV3XCI6IFsyNDAsMjU1LDI0MF0sXG5cdFx0XCJhenVyZVwiOiBbMjQwLDI1NSwyNTVdLFxuXHRcdFwic2FuZHlicm93blwiOiBbMjQ0LDE2NCw5Nl0sXG5cdFx0XCJ3aGVhdFwiOiBbMjQ1LDIyMiwxNzldLFxuXHRcdFwiYmVpZ2VcIjogWzI0NSwyNDUsMjIwXSxcblx0XHRcIndoaXRlc21va2VcIjogWzI0NSwyNDUsMjQ1XSxcblx0XHRcIm1pbnRjcmVhbVwiOiBbMjQ1LDI1NSwyNTBdLFxuXHRcdFwiZ2hvc3R3aGl0ZVwiOiBbMjQ4LDI0OCwyNTVdLFxuXHRcdFwic2FsbW9uXCI6IFsyNTAsMTI4LDExNF0sXG5cdFx0XCJhbnRpcXVld2hpdGVcIjogWzI1MCwyMzUsMjE1XSxcblx0XHRcImxpbmVuXCI6IFsyNTAsMjQwLDIzMF0sXG5cdFx0XCJsaWdodGdvbGRlbnJvZHllbGxvd1wiOiBbMjUwLDI1MCwyMTBdLFxuXHRcdFwib2xkbGFjZVwiOiBbMjUzLDI0NSwyMzBdLFxuXHRcdFwicmVkXCI6IFsyNTUsMCwwXSxcblx0XHRcImZ1Y2hzaWFcIjogWzI1NSwwLDI1NV0sXG5cdFx0XCJtYWdlbnRhXCI6IFsyNTUsMCwyNTVdLFxuXHRcdFwiZGVlcHBpbmtcIjogWzI1NSwyMCwxNDddLFxuXHRcdFwib3JhbmdlcmVkXCI6IFsyNTUsNjksMF0sXG5cdFx0XCJ0b21hdG9cIjogWzI1NSw5OSw3MV0sXG5cdFx0XCJob3RwaW5rXCI6IFsyNTUsMTA1LDE4MF0sXG5cdFx0XCJjb3JhbFwiOiBbMjU1LDEyNyw4MF0sXG5cdFx0XCJkYXJrb3JhbmdlXCI6IFsyNTUsMTQwLDBdLFxuXHRcdFwibGlnaHRzYWxtb25cIjogWzI1NSwxNjAsMTIyXSxcblx0XHRcIm9yYW5nZVwiOiBbMjU1LDE2NSwwXSxcblx0XHRcImxpZ2h0cGlua1wiOiBbMjU1LDE4MiwxOTNdLFxuXHRcdFwicGlua1wiOiBbMjU1LDE5MiwyMDNdLFxuXHRcdFwiZ29sZFwiOiBbMjU1LDIxNSwwXSxcblx0XHRcInBlYWNocHVmZlwiOiBbMjU1LDIxOCwxODVdLFxuXHRcdFwibmF2YWpvd2hpdGVcIjogWzI1NSwyMjIsMTczXSxcblx0XHRcIm1vY2Nhc2luXCI6IFsyNTUsMjI4LDE4MV0sXG5cdFx0XCJiaXNxdWVcIjogWzI1NSwyMjgsMTk2XSxcblx0XHRcIm1pc3R5cm9zZVwiOiBbMjU1LDIyOCwyMjVdLFxuXHRcdFwiYmxhbmNoZWRhbG1vbmRcIjogWzI1NSwyMzUsMjA1XSxcblx0XHRcInBhcGF5YXdoaXBcIjogWzI1NSwyMzksMjEzXSxcblx0XHRcImxhdmVuZGVyYmx1c2hcIjogWzI1NSwyNDAsMjQ1XSxcblx0XHRcInNlYXNoZWxsXCI6IFsyNTUsMjQ1LDIzOF0sXG5cdFx0XCJjb3Juc2lsa1wiOiBbMjU1LDI0OCwyMjBdLFxuXHRcdFwibGVtb25jaGlmZm9uXCI6IFsyNTUsMjUwLDIwNV0sXG5cdFx0XCJmbG9yYWx3aGl0ZVwiOiBbMjU1LDI1MCwyNDBdLFxuXHRcdFwic25vd1wiOiBbMjU1LDI1MCwyNTBdLFxuXHRcdFwieWVsbG93XCI6IFsyNTUsMjU1LDBdLFxuXHRcdFwibGlnaHR5ZWxsb3dcIjogWzI1NSwyNTUsMjI0XSxcblx0XHRcIml2b3J5XCI6IFsyNTUsMjU1LDI0MF0sXG5cdFx0XCJ3aGl0ZVwiOiBbMjU1LDI1NSwyNTVdXG5cdH1cbn1cbi8qKlxuICogQGNsYXNzIExpZ2h0aW5nIGNvbXB1dGF0aW9uLCBiYXNlZCBvbiBhIHRyYWRpdGlvbmFsIEZPViBmb3IgbXVsdGlwbGUgbGlnaHQgc291cmNlcyBhbmQgbXVsdGlwbGUgcGFzc2VzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gcmVmbGVjdGl2aXR5Q2FsbGJhY2sgQ2FsbGJhY2sgdG8gcmV0cmlldmUgY2VsbCByZWZsZWN0aXZpdHkgKDAuLjEpXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMucGFzc2VzPTFdIE51bWJlciBvZiBwYXNzZXMuIDEgZXF1YWxzIHRvIHNpbXBsZSBGT1Ygb2YgYWxsIGxpZ2h0IHNvdXJjZXMsID4xIG1lYW5zIGEgKmhpZ2hseSBzaW1wbGlmaWVkKiByYWRpb3NpdHktbGlrZSBhbGdvcml0aG0uXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMuZW1pc3Npb25UaHJlc2hvbGQ9MTAwXSBDZWxscyB3aXRoIGVtaXNzaXZpdHkgPiB0aHJlc2hvbGQgd2lsbCBiZSB0cmVhdGVkIGFzIGxpZ2h0IHNvdXJjZSBpbiB0aGUgbmV4dCBwYXNzLlxuICogQHBhcmFtIHtpbnR9IFtvcHRpb25zLnJhbmdlPTEwXSBNYXggbGlnaHQgcmFuZ2VcbiAqL1xuUk9ULkxpZ2h0aW5nID0gZnVuY3Rpb24ocmVmbGVjdGl2aXR5Q2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0dGhpcy5fcmVmbGVjdGl2aXR5Q2FsbGJhY2sgPSByZWZsZWN0aXZpdHlDYWxsYmFjaztcblx0dGhpcy5fb3B0aW9ucyA9IHtcblx0XHRwYXNzZXM6IDEsXG5cdFx0ZW1pc3Npb25UaHJlc2hvbGQ6IDEwMCxcblx0XHRyYW5nZTogMTBcblx0fTtcblx0dGhpcy5fZm92ID0gbnVsbDtcblxuXHR0aGlzLl9saWdodHMgPSB7fTtcblx0dGhpcy5fcmVmbGVjdGl2aXR5Q2FjaGUgPSB7fTtcblx0dGhpcy5fZm92Q2FjaGUgPSB7fTtcblxuXHR0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG59XG5cbi8qKlxuICogQWRqdXN0IG9wdGlvbnMgYXQgcnVudGltZVxuICogQHNlZSBST1QuTGlnaHRpbmdcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqL1xuUk9ULkxpZ2h0aW5nLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9ucykge1xuXHRmb3IgKHZhciBwIGluIG9wdGlvbnMpIHsgdGhpcy5fb3B0aW9uc1twXSA9IG9wdGlvbnNbcF07IH1cblx0aWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yYW5nZSkgeyB0aGlzLnJlc2V0KCk7IH1cblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogU2V0IHRoZSB1c2VkIEZpZWxkLU9mLVZpZXcgYWxnb1xuICogQHBhcmFtIHtST1QuRk9WfSBmb3ZcbiAqL1xuUk9ULkxpZ2h0aW5nLnByb3RvdHlwZS5zZXRGT1YgPSBmdW5jdGlvbihmb3YpIHtcblx0dGhpcy5fZm92ID0gZm92O1xuXHR0aGlzLl9mb3ZDYWNoZSA9IHt9O1xuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBTZXQgKG9yIHJlbW92ZSkgYSBsaWdodCBzb3VyY2VcbiAqIEBwYXJhbSB7aW50fSB4XG4gKiBAcGFyYW0ge2ludH0geVxuICogQHBhcmFtIHtudWxsIHx8IHN0cmluZyB8fCBudW1iZXJbM119IGNvbG9yXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuc2V0TGlnaHQgPSBmdW5jdGlvbih4LCB5LCBjb2xvcikge1xuXHR2YXIga2V5ID0geCtcIixcIit5O1xuXG5cdGlmIChjb2xvcikge1xuXHRcdHRoaXMuX2xpZ2h0c1trZXldID0gKHR5cGVvZihjb2xvcikgPT0gXCJzdHJpbmdcIiA/IFJPVC5Db2xvci5mcm9tU3RyaW5nKGNvbG9yKSA6IGNvbG9yKTtcblx0fSBlbHNlIHtcblx0XHRkZWxldGUgdGhpcy5fbGlnaHRzW2tleV07XG5cdH1cblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaWdodCBzb3VyY2VzXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuY2xlYXJMaWdodHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9saWdodHMgPSB7fTtcbn1cblxuLyoqXG4gKiBSZXNldCB0aGUgcHJlLWNvbXB1dGVkIHRvcG9sb2d5IHZhbHVlcy4gQ2FsbCB3aGVuZXZlciB0aGUgdW5kZXJseWluZyBtYXAgY2hhbmdlcyBpdHMgbGlnaHQtcGFzc2FiaWxpdHkuXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fcmVmbGVjdGl2aXR5Q2FjaGUgPSB7fTtcblx0dGhpcy5fZm92Q2FjaGUgPSB7fTtcblxuXHRyZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBsaWdodGluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gbGlnaHRpbmdDYWxsYmFjayBXaWxsIGJlIGNhbGxlZCB3aXRoICh4LCB5LCBjb2xvcikgZm9yIGV2ZXJ5IGxpdCBjZWxsXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKGxpZ2h0aW5nQ2FsbGJhY2spIHtcblx0dmFyIGRvbmVDZWxscyA9IHt9O1xuXHR2YXIgZW1pdHRpbmdDZWxscyA9IHt9O1xuXHR2YXIgbGl0Q2VsbHMgPSB7fTtcblxuXHRmb3IgKHZhciBrZXkgaW4gdGhpcy5fbGlnaHRzKSB7IC8qIHByZXBhcmUgZW1pdHRlcnMgZm9yIGZpcnN0IHBhc3MgKi9cblx0XHR2YXIgbGlnaHQgPSB0aGlzLl9saWdodHNba2V5XTtcblx0XHRlbWl0dGluZ0NlbGxzW2tleV0gPSBbMCwgMCwgMF07XG5cdFx0Uk9ULkNvbG9yLmFkZF8oZW1pdHRpbmdDZWxsc1trZXldLCBsaWdodCk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl9vcHRpb25zLnBhc3NlcztpKyspIHsgLyogbWFpbiBsb29wICovXG5cdFx0dGhpcy5fZW1pdExpZ2h0KGVtaXR0aW5nQ2VsbHMsIGxpdENlbGxzLCBkb25lQ2VsbHMpO1xuXHRcdGlmIChpKzEgPT0gdGhpcy5fb3B0aW9ucy5wYXNzZXMpIHsgY29udGludWU7IH0gLyogbm90IGZvciB0aGUgbGFzdCBwYXNzICovXG5cdFx0ZW1pdHRpbmdDZWxscyA9IHRoaXMuX2NvbXB1dGVFbWl0dGVycyhsaXRDZWxscywgZG9uZUNlbGxzKTtcblx0fVxuXG5cdGZvciAodmFyIGxpdEtleSBpbiBsaXRDZWxscykgeyAvKiBsZXQgdGhlIHVzZXIga25vdyB3aGF0IGFuZCBob3cgaXMgbGl0ICovXG5cdFx0dmFyIHBhcnRzID0gbGl0S2V5LnNwbGl0KFwiLFwiKTtcblx0XHR2YXIgeCA9IHBhcnNlSW50KHBhcnRzWzBdKTtcblx0XHR2YXIgeSA9IHBhcnNlSW50KHBhcnRzWzFdKTtcblx0XHRsaWdodGluZ0NhbGxiYWNrKHgsIHksIGxpdENlbGxzW2xpdEtleV0pO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogQ29tcHV0ZSBvbmUgaXRlcmF0aW9uIGZyb20gYWxsIGVtaXR0aW5nIGNlbGxzXG4gKiBAcGFyYW0ge29iamVjdH0gZW1pdHRpbmdDZWxscyBUaGVzZSBlbWl0IGxpZ2h0XG4gKiBAcGFyYW0ge29iamVjdH0gbGl0Q2VsbHMgQWRkIHByb2plY3RlZCBsaWdodCB0byB0aGVzZVxuICogQHBhcmFtIHtvYmplY3R9IGRvbmVDZWxscyBUaGVzZSBhbHJlYWR5IGVtaXR0ZWQsIGZvcmJpZCB0aGVtIGZyb20gZnVydGhlciBjYWxjdWxhdGlvbnNcbiAqL1xuUk9ULkxpZ2h0aW5nLnByb3RvdHlwZS5fZW1pdExpZ2h0ID0gZnVuY3Rpb24oZW1pdHRpbmdDZWxscywgbGl0Q2VsbHMsIGRvbmVDZWxscykge1xuXHRmb3IgKHZhciBrZXkgaW4gZW1pdHRpbmdDZWxscykge1xuXHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIixcIik7XG5cdFx0dmFyIHggPSBwYXJzZUludChwYXJ0c1swXSk7XG5cdFx0dmFyIHkgPSBwYXJzZUludChwYXJ0c1sxXSk7XG5cdFx0dGhpcy5fZW1pdExpZ2h0RnJvbUNlbGwoeCwgeSwgZW1pdHRpbmdDZWxsc1trZXldLCBsaXRDZWxscyk7XG5cdFx0ZG9uZUNlbGxzW2tleV0gPSAxO1xuXHR9XG5cdHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFByZXBhcmUgYSBsaXN0IG9mIGVtaXR0ZXJzIGZvciBuZXh0IHBhc3NcbiAqIEBwYXJhbSB7b2JqZWN0fSBsaXRDZWxsc1xuICogQHBhcmFtIHtvYmplY3R9IGRvbmVDZWxsc1xuICogQHJldHVybnMge29iamVjdH1cbiAqL1xuUk9ULkxpZ2h0aW5nLnByb3RvdHlwZS5fY29tcHV0ZUVtaXR0ZXJzID0gZnVuY3Rpb24obGl0Q2VsbHMsIGRvbmVDZWxscykge1xuXHR2YXIgcmVzdWx0ID0ge307XG5cblx0Zm9yICh2YXIga2V5IGluIGxpdENlbGxzKSB7XG5cdFx0aWYgKGtleSBpbiBkb25lQ2VsbHMpIHsgY29udGludWU7IH0gLyogYWxyZWFkeSBlbWl0dGVkICovXG5cblx0XHR2YXIgY29sb3IgPSBsaXRDZWxsc1trZXldO1xuXG5cdFx0aWYgKGtleSBpbiB0aGlzLl9yZWZsZWN0aXZpdHlDYWNoZSkge1xuXHRcdFx0dmFyIHJlZmxlY3Rpdml0eSA9IHRoaXMuX3JlZmxlY3Rpdml0eUNhY2hlW2tleV07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIixcIik7XG5cdFx0XHR2YXIgeCA9IHBhcnNlSW50KHBhcnRzWzBdKTtcblx0XHRcdHZhciB5ID0gcGFyc2VJbnQocGFydHNbMV0pO1xuXHRcdFx0dmFyIHJlZmxlY3Rpdml0eSA9IHRoaXMuX3JlZmxlY3Rpdml0eUNhbGxiYWNrKHgsIHkpO1xuXHRcdFx0dGhpcy5fcmVmbGVjdGl2aXR5Q2FjaGVba2V5XSA9IHJlZmxlY3Rpdml0eTtcblx0XHR9XG5cblx0XHRpZiAocmVmbGVjdGl2aXR5ID09IDApIHsgY29udGludWU7IH0gLyogd2lsbCBub3QgcmVmbGVjdCBhdCBhbGwgKi9cblxuXHRcdC8qIGNvbXB1dGUgZW1pc3Npb24gY29sb3IgKi9cblx0XHR2YXIgZW1pc3Npb24gPSBbXTtcblx0XHR2YXIgaW50ZW5zaXR5ID0gMDtcblx0XHRmb3IgKHZhciBpPTA7aTwzO2krKykge1xuXHRcdFx0dmFyIHBhcnQgPSBNYXRoLnJvdW5kKGNvbG9yW2ldKnJlZmxlY3Rpdml0eSk7XG5cdFx0XHRlbWlzc2lvbltpXSA9IHBhcnQ7XG5cdFx0XHRpbnRlbnNpdHkgKz0gcGFydDtcblx0XHR9XG5cdFx0aWYgKGludGVuc2l0eSA+IHRoaXMuX29wdGlvbnMuZW1pc3Npb25UaHJlc2hvbGQpIHsgcmVzdWx0W2tleV0gPSBlbWlzc2lvbjsgfVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIG9uZSBpdGVyYXRpb24gZnJvbSBvbmUgY2VsbFxuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcGFyYW0ge251bWJlcltdfSBjb2xvclxuICogQHBhcmFtIHtvYmplY3R9IGxpdENlbGxzIENlbGwgZGF0YSB0byBieSB1cGRhdGVkXG4gKi9cblJPVC5MaWdodGluZy5wcm90b3R5cGUuX2VtaXRMaWdodEZyb21DZWxsID0gZnVuY3Rpb24oeCwgeSwgY29sb3IsIGxpdENlbGxzKSB7XG5cdHZhciBrZXkgPSB4K1wiLFwiK3k7XG5cdGlmIChrZXkgaW4gdGhpcy5fZm92Q2FjaGUpIHtcblx0XHR2YXIgZm92ID0gdGhpcy5fZm92Q2FjaGVba2V5XTtcblx0fSBlbHNlIHtcblx0XHR2YXIgZm92ID0gdGhpcy5fdXBkYXRlRk9WKHgsIHkpO1xuXHR9XG5cblx0Zm9yICh2YXIgZm92S2V5IGluIGZvdikge1xuXHRcdHZhciBmb3JtRmFjdG9yID0gZm92W2ZvdktleV07XG5cblx0XHRpZiAoZm92S2V5IGluIGxpdENlbGxzKSB7IC8qIGFscmVhZHkgbGl0ICovXG5cdFx0XHR2YXIgcmVzdWx0ID0gbGl0Q2VsbHNbZm92S2V5XTtcblx0XHR9IGVsc2UgeyAvKiBuZXdseSBsaXQgKi9cblx0XHRcdHZhciByZXN1bHQgPSBbMCwgMCwgMF07XG5cdFx0XHRsaXRDZWxsc1tmb3ZLZXldID0gcmVzdWx0O1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGk9MDtpPDM7aSsrKSB7IHJlc3VsdFtpXSArPSBNYXRoLnJvdW5kKGNvbG9yW2ldKmZvcm1GYWN0b3IpOyB9IC8qIGFkZCBsaWdodCBjb2xvciAqL1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogQ29tcHV0ZSBGT1YgKFwiZm9ybSBmYWN0b3JcIikgZm9yIGEgcG90ZW50aWFsIGxpZ2h0IHNvdXJjZSBhdCBbeCx5XVxuICogQHBhcmFtIHtpbnR9IHhcbiAqIEBwYXJhbSB7aW50fSB5XG4gKiBAcmV0dXJucyB7b2JqZWN0fVxuICovXG5ST1QuTGlnaHRpbmcucHJvdG90eXBlLl91cGRhdGVGT1YgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHZhciBrZXkxID0geCtcIixcIit5O1xuXHR2YXIgY2FjaGUgPSB7fTtcblx0dGhpcy5fZm92Q2FjaGVba2V5MV0gPSBjYWNoZTtcblx0dmFyIHJhbmdlID0gdGhpcy5fb3B0aW9ucy5yYW5nZTtcblx0dmFyIGNiID0gZnVuY3Rpb24oeCwgeSwgciwgdmlzKSB7XG5cdFx0dmFyIGtleTIgPSB4K1wiLFwiK3k7XG5cdFx0dmFyIGZvcm1GYWN0b3IgPSB2aXMgKiAoMS1yL3JhbmdlKTtcblx0XHRpZiAoZm9ybUZhY3RvciA9PSAwKSB7IHJldHVybjsgfVxuXHRcdGNhY2hlW2tleTJdID0gZm9ybUZhY3Rvcjtcblx0fVxuXHR0aGlzLl9mb3YuY29tcHV0ZSh4LCB5LCByYW5nZSwgY2IuYmluZCh0aGlzKSk7XG5cblx0cmV0dXJuIGNhY2hlO1xufVxuLyoqXG4gKiBAY2xhc3MgQWJzdHJhY3QgcGF0aGZpbmRlclxuICogQHBhcmFtIHtpbnR9IHRvWCBUYXJnZXQgWCBjb29yZFxuICogQHBhcmFtIHtpbnR9IHRvWSBUYXJnZXQgWSBjb29yZFxuICogQHBhcmFtIHtmdW5jdGlvbn0gcGFzc2FibGVDYWxsYmFjayBDYWxsYmFjayB0byBkZXRlcm1pbmUgbWFwIHBhc3NhYmlsaXR5XG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge2ludH0gW29wdGlvbnMudG9wb2xvZ3k9OF1cbiAqL1xuUk9ULlBhdGggPSBmdW5jdGlvbih0b1gsIHRvWSwgcGFzc2FibGVDYWxsYmFjaywgb3B0aW9ucykge1xuXHR0aGlzLl90b1ggPSB0b1g7XG5cdHRoaXMuX3RvWSA9IHRvWTtcblx0dGhpcy5fZnJvbVggPSBudWxsO1xuXHR0aGlzLl9mcm9tWSA9IG51bGw7XG5cdHRoaXMuX3Bhc3NhYmxlQ2FsbGJhY2sgPSBwYXNzYWJsZUNhbGxiYWNrO1xuXHR0aGlzLl9vcHRpb25zID0ge1xuXHRcdHRvcG9sb2d5OiA4XG5cdH1cblx0Zm9yICh2YXIgcCBpbiBvcHRpb25zKSB7IHRoaXMuX29wdGlvbnNbcF0gPSBvcHRpb25zW3BdOyB9XG5cblx0dGhpcy5fZGlycyA9IFJPVC5ESVJTW3RoaXMuX29wdGlvbnMudG9wb2xvZ3ldO1xuXHRpZiAodGhpcy5fb3B0aW9ucy50b3BvbG9neSA9PSA4KSB7IC8qIHJlb3JkZXIgZGlycyBmb3IgbW9yZSBhZXN0aGV0aWMgcmVzdWx0ICh2ZXJ0aWNhbC9ob3Jpem9udGFsIGZpcnN0KSAqL1xuXHRcdHRoaXMuX2RpcnMgPSBbXG5cdFx0XHR0aGlzLl9kaXJzWzBdLFxuXHRcdFx0dGhpcy5fZGlyc1syXSxcblx0XHRcdHRoaXMuX2RpcnNbNF0sXG5cdFx0XHR0aGlzLl9kaXJzWzZdLFxuXHRcdFx0dGhpcy5fZGlyc1sxXSxcblx0XHRcdHRoaXMuX2RpcnNbM10sXG5cdFx0XHR0aGlzLl9kaXJzWzVdLFxuXHRcdFx0dGhpcy5fZGlyc1s3XVxuXHRcdF1cblx0fVxufVxuXG4vKipcbiAqIENvbXB1dGUgYSBwYXRoIGZyb20gYSBnaXZlbiBwb2ludFxuICogQHBhcmFtIHtpbnR9IGZyb21YXG4gKiBAcGFyYW0ge2ludH0gZnJvbVlcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFdpbGwgYmUgY2FsbGVkIGZvciBldmVyeSBwYXRoIGl0ZW0gd2l0aCBhcmd1bWVudHMgXCJ4XCIgYW5kIFwieVwiXG4gKi9cblJPVC5QYXRoLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24oZnJvbVgsIGZyb21ZLCBjYWxsYmFjaykge1xufVxuXG5ST1QuUGF0aC5wcm90b3R5cGUuX2dldE5laWdoYm9ycyA9IGZ1bmN0aW9uKGN4LCBjeSkge1xuXHR2YXIgcmVzdWx0ID0gW107XG5cdGZvciAodmFyIGk9MDtpPHRoaXMuX2RpcnMubGVuZ3RoO2krKykge1xuXHRcdHZhciBkaXIgPSB0aGlzLl9kaXJzW2ldO1xuXHRcdHZhciB4ID0gY3ggKyBkaXJbMF07XG5cdFx0dmFyIHkgPSBjeSArIGRpclsxXTtcblx0XHRcblx0XHRpZiAoIXRoaXMuX3Bhc3NhYmxlQ2FsbGJhY2soeCwgeSkpIHsgY29udGludWU7IH1cblx0XHRyZXN1bHQucHVzaChbeCwgeV0pO1xuXHR9XG5cdFxuXHRyZXR1cm4gcmVzdWx0O1xufVxuLyoqXG4gKiBAY2xhc3MgU2ltcGxpZmllZCBEaWprc3RyYSdzIGFsZ29yaXRobTogYWxsIGVkZ2VzIGhhdmUgYSB2YWx1ZSBvZiAxXG4gKiBAYXVnbWVudHMgUk9ULlBhdGhcbiAqIEBzZWUgUk9ULlBhdGhcbiAqL1xuUk9ULlBhdGguRGlqa3N0cmEgPSBmdW5jdGlvbih0b1gsIHRvWSwgcGFzc2FibGVDYWxsYmFjaywgb3B0aW9ucykge1xuXHRST1QuUGF0aC5jYWxsKHRoaXMsIHRvWCwgdG9ZLCBwYXNzYWJsZUNhbGxiYWNrLCBvcHRpb25zKTtcblxuXHR0aGlzLl9jb21wdXRlZCA9IHt9O1xuXHR0aGlzLl90b2RvID0gW107XG5cdHRoaXMuX2FkZCh0b1gsIHRvWSwgbnVsbCk7XG59XG5ST1QuUGF0aC5EaWprc3RyYS5leHRlbmQoUk9ULlBhdGgpO1xuXG4vKipcbiAqIENvbXB1dGUgYSBwYXRoIGZyb20gYSBnaXZlbiBwb2ludFxuICogQHNlZSBST1QuUGF0aCNjb21wdXRlXG4gKi9cblJPVC5QYXRoLkRpamtzdHJhLnByb3RvdHlwZS5jb21wdXRlID0gZnVuY3Rpb24oZnJvbVgsIGZyb21ZLCBjYWxsYmFjaykge1xuXHR2YXIga2V5ID0gZnJvbVgrXCIsXCIrZnJvbVk7XG5cdGlmICghKGtleSBpbiB0aGlzLl9jb21wdXRlZCkpIHsgdGhpcy5fY29tcHV0ZShmcm9tWCwgZnJvbVkpOyB9XG5cdGlmICghKGtleSBpbiB0aGlzLl9jb21wdXRlZCkpIHsgcmV0dXJuOyB9XG5cdFxuXHR2YXIgaXRlbSA9IHRoaXMuX2NvbXB1dGVkW2tleV07XG5cdHdoaWxlIChpdGVtKSB7XG5cdFx0Y2FsbGJhY2soaXRlbS54LCBpdGVtLnkpO1xuXHRcdGl0ZW0gPSBpdGVtLnByZXY7XG5cdH1cbn1cblxuLyoqXG4gKiBDb21wdXRlIGEgbm9uLWNhY2hlZCB2YWx1ZVxuICovXG5ST1QuUGF0aC5EaWprc3RyYS5wcm90b3R5cGUuX2NvbXB1dGUgPSBmdW5jdGlvbihmcm9tWCwgZnJvbVkpIHtcblx0d2hpbGUgKHRoaXMuX3RvZG8ubGVuZ3RoKSB7XG5cdFx0dmFyIGl0ZW0gPSB0aGlzLl90b2RvLnNoaWZ0KCk7XG5cdFx0aWYgKGl0ZW0ueCA9PSBmcm9tWCAmJiBpdGVtLnkgPT0gZnJvbVkpIHsgcmV0dXJuOyB9XG5cdFx0XG5cdFx0dmFyIG5laWdoYm9ycyA9IHRoaXMuX2dldE5laWdoYm9ycyhpdGVtLngsIGl0ZW0ueSk7XG5cdFx0XG5cdFx0Zm9yICh2YXIgaT0wO2k8bmVpZ2hib3JzLmxlbmd0aDtpKyspIHtcblx0XHRcdHZhciBuZWlnaGJvciA9IG5laWdoYm9yc1tpXTtcblx0XHRcdHZhciB4ID0gbmVpZ2hib3JbMF07XG5cdFx0XHR2YXIgeSA9IG5laWdoYm9yWzFdO1xuXHRcdFx0dmFyIGlkID0geCtcIixcIit5O1xuXHRcdFx0aWYgKGlkIGluIHRoaXMuX2NvbXB1dGVkKSB7IGNvbnRpbnVlOyB9IC8qIGFscmVhZHkgZG9uZSAqL1x0XG5cdFx0XHR0aGlzLl9hZGQoeCwgeSwgaXRlbSk7IFxuXHRcdH1cblx0fVxufVxuXG5ST1QuUGF0aC5EaWprc3RyYS5wcm90b3R5cGUuX2FkZCA9IGZ1bmN0aW9uKHgsIHksIHByZXYpIHtcblx0dmFyIG9iaiA9IHtcblx0XHR4OiB4LFxuXHRcdHk6IHksXG5cdFx0cHJldjogcHJldlxuXHR9XG5cdHRoaXMuX2NvbXB1dGVkW3grXCIsXCIreV0gPSBvYmo7XG5cdHRoaXMuX3RvZG8ucHVzaChvYmopO1xufVxuLyoqXG4gKiBAY2xhc3MgU2ltcGxpZmllZCBBKiBhbGdvcml0aG06IGFsbCBlZGdlcyBoYXZlIGEgdmFsdWUgb2YgMVxuICogQGF1Z21lbnRzIFJPVC5QYXRoXG4gKiBAc2VlIFJPVC5QYXRoXG4gKi9cblJPVC5QYXRoLkFTdGFyID0gZnVuY3Rpb24odG9YLCB0b1ksIHBhc3NhYmxlQ2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0Uk9ULlBhdGguY2FsbCh0aGlzLCB0b1gsIHRvWSwgcGFzc2FibGVDYWxsYmFjaywgb3B0aW9ucyk7XG5cblx0dGhpcy5fdG9kbyA9IFtdO1xuXHR0aGlzLl9kb25lID0ge307XG5cdHRoaXMuX2Zyb21YID0gbnVsbDtcblx0dGhpcy5fZnJvbVkgPSBudWxsO1xufVxuUk9ULlBhdGguQVN0YXIuZXh0ZW5kKFJPVC5QYXRoKTtcblxuLyoqXG4gKiBDb21wdXRlIGEgcGF0aCBmcm9tIGEgZ2l2ZW4gcG9pbnRcbiAqIEBzZWUgUk9ULlBhdGgjY29tcHV0ZVxuICovXG5ST1QuUGF0aC5BU3Rhci5wcm90b3R5cGUuY29tcHV0ZSA9IGZ1bmN0aW9uKGZyb21YLCBmcm9tWSwgY2FsbGJhY2spIHtcblx0dGhpcy5fdG9kbyA9IFtdO1xuXHR0aGlzLl9kb25lID0ge307XG5cdHRoaXMuX2Zyb21YID0gZnJvbVg7XG5cdHRoaXMuX2Zyb21ZID0gZnJvbVk7XG5cdHRoaXMuX2FkZCh0aGlzLl90b1gsIHRoaXMuX3RvWSwgbnVsbCk7XG5cblx0d2hpbGUgKHRoaXMuX3RvZG8ubGVuZ3RoKSB7XG5cdFx0dmFyIGl0ZW0gPSB0aGlzLl90b2RvLnNoaWZ0KCk7XG5cdFx0aWYgKGl0ZW0ueCA9PSBmcm9tWCAmJiBpdGVtLnkgPT0gZnJvbVkpIHsgYnJlYWs7IH1cblx0XHR2YXIgbmVpZ2hib3JzID0gdGhpcy5fZ2V0TmVpZ2hib3JzKGl0ZW0ueCwgaXRlbS55KTtcblxuXHRcdGZvciAodmFyIGk9MDtpPG5laWdoYm9ycy5sZW5ndGg7aSsrKSB7XG5cdFx0XHR2YXIgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG5cdFx0XHR2YXIgeCA9IG5laWdoYm9yWzBdO1xuXHRcdFx0dmFyIHkgPSBuZWlnaGJvclsxXTtcblx0XHRcdHZhciBpZCA9IHgrXCIsXCIreTtcblx0XHRcdGlmIChpZCBpbiB0aGlzLl9kb25lKSB7IGNvbnRpbnVlOyB9XG5cdFx0XHR0aGlzLl9hZGQoeCwgeSwgaXRlbSk7IFxuXHRcdH1cblx0fVxuXHRcblx0dmFyIGl0ZW0gPSB0aGlzLl9kb25lW2Zyb21YK1wiLFwiK2Zyb21ZXTtcblx0aWYgKCFpdGVtKSB7IHJldHVybjsgfVxuXHRcblx0d2hpbGUgKGl0ZW0pIHtcblx0XHRjYWxsYmFjayhpdGVtLngsIGl0ZW0ueSk7XG5cdFx0aXRlbSA9IGl0ZW0ucHJldjtcblx0fVxufVxuXG5ST1QuUGF0aC5BU3Rhci5wcm90b3R5cGUuX2FkZCA9IGZ1bmN0aW9uKHgsIHksIHByZXYpIHtcblx0dmFyIG9iaiA9IHtcblx0XHR4OiB4LFxuXHRcdHk6IHksXG5cdFx0cHJldjogcHJldixcblx0XHRnOiAocHJldiA/IHByZXYuZysxIDogMCksXG5cdFx0aDogdGhpcy5fZGlzdGFuY2UoeCwgeSlcblx0fVxuXHR0aGlzLl9kb25lW3grXCIsXCIreV0gPSBvYmo7XG5cdFxuXHQvKiBpbnNlcnQgaW50byBwcmlvcml0eSBxdWV1ZSAqL1xuXHRcblx0dmFyIGYgPSBvYmouZyArIG9iai5oO1xuXHRmb3IgKHZhciBpPTA7aTx0aGlzLl90b2RvLmxlbmd0aDtpKyspIHtcblx0XHR2YXIgaXRlbSA9IHRoaXMuX3RvZG9baV07XG5cdFx0aWYgKGYgPCBpdGVtLmcgKyBpdGVtLmgpIHtcblx0XHRcdHRoaXMuX3RvZG8uc3BsaWNlKGksIDAsIG9iaik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cdFxuXHR0aGlzLl90b2RvLnB1c2gob2JqKTtcbn1cblxuUk9ULlBhdGguQVN0YXIucHJvdG90eXBlLl9kaXN0YW5jZSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0c3dpdGNoICh0aGlzLl9vcHRpb25zLnRvcG9sb2d5KSB7XG5cdFx0Y2FzZSA0OlxuXHRcdFx0cmV0dXJuIChNYXRoLmFicyh4LXRoaXMuX2Zyb21YKSArIE1hdGguYWJzKHktdGhpcy5fZnJvbVkpKTtcblx0XHRicmVhaztcblxuXHRcdGNhc2UgNjpcblx0XHRcdHZhciBkeCA9IE1hdGguYWJzKHggLSB0aGlzLl9mcm9tWCk7XG5cdFx0XHR2YXIgZHkgPSBNYXRoLmFicyh5IC0gdGhpcy5fZnJvbVkpO1xuXHRcdFx0cmV0dXJuIGR5ICsgTWF0aC5tYXgoMCwgKGR4LWR5KS8yKTtcblx0XHRicmVhaztcblxuXHRcdGNhc2UgODogXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgoTWF0aC5hYnMoeC10aGlzLl9mcm9tWCksIE1hdGguYWJzKHktdGhpcy5fZnJvbVkpKTtcblx0XHRicmVhaztcblx0fVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgdG9wb2xvZ3lcIik7XG59XG4vKipcbiAqIEBjbGFzcyBUZXJtaW5hbCBiYWNrZW5kXG4gKiBAcHJpdmF0ZVxuICovXG5ST1QuRGlzcGxheS5UZXJtID0gZnVuY3Rpb24oY29udGV4dCkge1xuXHRST1QuRGlzcGxheS5CYWNrZW5kLmNhbGwodGhpcywgY29udGV4dCk7XG5cdHRoaXMuX2N4ID0gLTE7XG5cdHRoaXMuX2N5ID0gLTE7XG5cdHRoaXMuX2xhc3RDb2xvciA9IFwiXCI7XG5cdHRoaXMuX29wdGlvbnMgPSB7fTtcblx0dGhpcy5fb3ggPSAwO1xuXHR0aGlzLl9veSA9IDA7XG5cdHRoaXMuX3Rlcm1jb2xvciA9IHt9O1xufVxuUk9ULkRpc3BsYXkuVGVybS5leHRlbmQoUk9ULkRpc3BsYXkuQmFja2VuZCk7XG5cblJPVC5EaXNwbGF5LlRlcm0ucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuXHR0aGlzLl9veCA9IE1hdGguZmxvb3IoKHByb2Nlc3Muc3Rkb3V0LmNvbHVtbnMgLSBvcHRpb25zLndpZHRoKSAvIDIpO1xuXHR0aGlzLl9veSA9IE1hdGguZmxvb3IoKHByb2Nlc3Muc3Rkb3V0LnJvd3MgLSBvcHRpb25zLmhlaWdodCkgLyAyKTtcblx0dGhpcy5fdGVybWNvbG9yID0gbmV3IFJPVC5EaXNwbGF5LlRlcm1bb3B0aW9ucy50ZXJtQ29sb3IuY2FwaXRhbGl6ZSgpXSh0aGlzLl9jb250ZXh0KTtcblx0dGhpcy5fY29udGV4dC5fdGVybWNvbG9yID0gdGhpcy5fdGVybWNvbG9yO1xufVxuXG5ST1QuRGlzcGxheS5UZXJtLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oZGF0YSwgY2xlYXJCZWZvcmUpIHtcblx0Ly8gZGV0ZXJtaW5lIHdoZXJlIHRvIGRyYXcgd2hhdCB3aXRoIHdoYXQgY29sb3JzXG5cdHZhciB4ID0gZGF0YVswXTtcblx0dmFyIHkgPSBkYXRhWzFdO1xuXHR2YXIgY2ggPSBkYXRhWzJdO1xuXHR2YXIgZmcgPSBkYXRhWzNdO1xuXHR2YXIgYmcgPSBkYXRhWzRdO1xuXG5cdC8vIGRldGVybWluZSBpZiB3ZSBuZWVkIHRvIG1vdmUgdGhlIHRlcm1pbmFsIGN1cnNvclxuXHR2YXIgZHggPSB0aGlzLl9veCArIHg7XG5cdHZhciBkeSA9IHRoaXMuX295ICsgeTtcblx0aWYgKGR4IDwgMCB8fCBkeCA+PSBwcm9jZXNzLnN0ZG91dC5jb2x1bW5zKSB7IHJldHVybjsgfVxuXHRpZiAoZHkgPCAwIHx8IGR5ID49IHByb2Nlc3Muc3Rkb3V0LnJvd3MpIHsgcmV0dXJuOyB9XG5cdGlmIChkeCAhPT0gdGhpcy5fY3ggfHwgZHkgIT09IHRoaXMuX2N5KSB7XG5cdFx0cHJvY2Vzcy5zdGRvdXQud3JpdGUodGhpcy5fdGVybWNvbG9yLnBvc2l0aW9uVG9BbnNpKGR4LGR5KSk7XG5cdFx0dGhpcy5fY3ggPSBkeDtcblx0XHR0aGlzLl9jeSA9IGR5O1xuXHR9XG5cblx0Ly8gdGVybWluYWxzIGF1dG9tYXRpY2FsbHkgY2xlYXIsIGJ1dCBpZiB3ZSdyZSBjbGVhcmluZyB3aGVuIHdlJ3JlXG5cdC8vIG5vdCBvdGhlcndpc2UgcHJvdmlkZWQgd2l0aCBhIGNoYXJhY3RlciwganVzdCB1c2UgYSBzcGFjZSBpbnN0ZWFkXG5cdGlmIChjbGVhckJlZm9yZSkge1xuXHRcdGlmICghY2gpIHtcblx0XHRcdGNoID0gXCIgXCI7XG5cdFx0fVxuXHR9XG5cdFx0XG5cdC8vIGlmIHdlJ3JlIG5vdCBjbGVhcmluZyBhbmQgbm90IHByb3ZpZGVkIHdpdGggYSBjaGFyYWN0ZXIsIGRvIG5vdGhpbmdcblx0aWYgKCFjaCkgeyByZXR1cm47IH1cblxuXHQvLyBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0byBjaGFuZ2UgY29sb3JzXG5cdHZhciBuZXdDb2xvciA9IHRoaXMuX3Rlcm1jb2xvci5jb2xvclRvQW5zaShmZyxiZyk7XG5cdGlmIChuZXdDb2xvciAhPT0gdGhpcy5fbGFzdENvbG9yKSB7XG5cdFx0cHJvY2Vzcy5zdGRvdXQud3JpdGUobmV3Q29sb3IpO1xuXHRcdHRoaXMuX2xhc3RDb2xvciA9IG5ld0NvbG9yO1xuXHR9XG5cblx0Ly8gd3JpdGUgdGhlIHByb3ZpZGVkIHN5bWJvbCB0byB0aGUgZGlzcGxheVxuXHR2YXIgY2hhcnMgPSBbXS5jb25jYXQoY2gpO1xuXHRwcm9jZXNzLnN0ZG91dC53cml0ZShjaGFyc1swXSk7XG5cblx0Ly8gdXBkYXRlIG91ciBwb3NpdGlvbiwgZ2l2ZW4gdGhhdCB3ZSB3cm90ZSBhIGNoYXJhY3RlclxuXHR0aGlzLl9jeCsrO1xuXHRpZiAodGhpcy5fY3ggPj0gcHJvY2Vzcy5zdGRvdXQuY29sdW1ucykge1xuXHRcdHRoaXMuX2N4ID0gMDtcblx0XHR0aGlzLl9jeSsrO1xuXHR9XG59XG5cblJPVC5EaXNwbGF5LlRlcm0ucHJvdG90eXBlLmNvbXB1dGVTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0cmV0dXJuIFtwcm9jZXNzLnN0ZG91dC5jb2x1bW5zLCBwcm9jZXNzLnN0ZG91dC5yb3dzXTtcbn1cblxuUk9ULkRpc3BsYXkuVGVybS5wcm90b3R5cGUuY29tcHV0ZUZvbnRTaXplID0gZnVuY3Rpb24oYXZhaWxXaWR0aCwgYXZhaWxIZWlnaHQpIHtcblx0cmV0dXJuIDEyO1xufVxuXG5ST1QuRGlzcGxheS5UZXJtLnByb3RvdHlwZS5ldmVudFRvUG9zaXRpb24gPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBbeCx5XVxufVxuLyoqXG4gKiBAY2xhc3MgQWJzdHJhY3QgdGVybWluYWwgY29kZSBtb2R1bGVcbiAqIEBwcml2YXRlXG4gKi9cblJPVC5EaXNwbGF5LlRlcm0uQ29sb3IgPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xufVxuXG5ST1QuRGlzcGxheS5UZXJtLkNvbG9yLnByb3RvdHlwZS5jbGVhclRvQW5zaSA9IGZ1bmN0aW9uKGJnKSB7XG59XG5cblJPVC5EaXNwbGF5LlRlcm0uQ29sb3IucHJvdG90eXBlLmNvbG9yVG9BbnNpID0gZnVuY3Rpb24oZmcsIGJnKSB7XG59XG5cblJPVC5EaXNwbGF5LlRlcm0uQ29sb3IucHJvdG90eXBlLnBvc2l0aW9uVG9BbnNpID0gZnVuY3Rpb24oeCwgeSkge1xufVxuLyoqXG4gKiBAY2xhc3MgeHRlcm0gdGVybWluYWwgY29kZSBtb2R1bGVcbiAqIEBwcml2YXRlXG4gKi9cblJPVC5EaXNwbGF5LlRlcm0uWHRlcm0gPSBmdW5jdGlvbihjb250ZXh0KSB7XG5cdFJPVC5EaXNwbGF5LlRlcm0uQ29sb3IuY2FsbCh0aGlzLCBjb250ZXh0KTtcbn1cblJPVC5EaXNwbGF5LlRlcm0uWHRlcm0uZXh0ZW5kKFJPVC5EaXNwbGF5LlRlcm0uQ29sb3IpO1xuXG5ST1QuRGlzcGxheS5UZXJtLlh0ZXJtLnByb3RvdHlwZS5jbGVhclRvQW5zaSA9IGZ1bmN0aW9uKGJnKSB7XG5cdHJldHVybiBcIlxceDFiWzA7NDg7NTtcIlxuXHRcdCsgdGhpcy5fdGVybWNvbG9yKGJnKVxuXHRcdCsgXCJtXFx4MWJbMkpcIjtcbn1cblxuUk9ULkRpc3BsYXkuVGVybS5YdGVybS5wcm90b3R5cGUuY29sb3JUb0Fuc2kgPSBmdW5jdGlvbihmZywgYmcpIHtcblx0cmV0dXJuIFwiXFx4MWJbMDszODs1O1wiXG5cdFx0KyB0aGlzLl90ZXJtY29sb3IoZmcpXG5cdFx0KyBcIjs0ODs1O1wiXG5cdFx0KyB0aGlzLl90ZXJtY29sb3IoYmcpXG5cdFx0KyBcIm1cIjtcbn1cblxuUk9ULkRpc3BsYXkuVGVybS5YdGVybS5wcm90b3R5cGUucG9zaXRpb25Ub0Fuc2kgPSBmdW5jdGlvbih4LCB5KSB7XG5cdHJldHVybiBcIlxceDFiW1wiICsgKHkrMSkgKyBcIjtcIiArICh4KzEpICsgXCJIXCI7XG59XG5cblJPVC5EaXNwbGF5LlRlcm0uWHRlcm0ucHJvdG90eXBlLl90ZXJtY29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xuXHR2YXIgU1JDX0NPTE9SUyA9IDI1Ni4wO1xuXHR2YXIgRFNUX0NPTE9SUyA9IDYuMDtcblx0dmFyIENPTE9SX1JBVElPID0gRFNUX0NPTE9SUyAvIFNSQ19DT0xPUlM7XG5cdHZhciByZ2IgPSBST1QuQ29sb3IuZnJvbVN0cmluZyhjb2xvcik7XG5cdHZhciByID0gTWF0aC5mbG9vcihyZ2JbMF0gKiBDT0xPUl9SQVRJTyk7XG5cdHZhciBnID0gTWF0aC5mbG9vcihyZ2JbMV0gKiBDT0xPUl9SQVRJTyk7XG5cdHZhciBiID0gTWF0aC5mbG9vcihyZ2JbMl0gKiBDT0xPUl9SQVRJTyk7XG5cdHJldHVybiByKjM2ICsgZyo2ICsgYioxICsgMTY7XG59XG4vKipcbiAqIEV4cG9ydCB0byBOb2RlLmpzIG1vZHVsZVxuICovXG5mb3IgKHZhciBwIGluIFJPVCkge1xuXHRleHBvcnRzW3BdID0gUk9UW3BdO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gvZnAnO1xuXG5sZXQgeCwgeTtcbi8qKlxuICogQHR5cGUge1RpbGV9XG4gKi9cbmxldCBzZWxlY3RlZDtcblxuLyoqXG4gKiBAdHlwZSB7TWFwfVxuICovXG5sZXQgbWFwO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDdXJzb3Ige1xuICBjb25zdHJ1Y3RvcihfbWFwLCBfeCwgX3ksIF9zZWxlY3RlZCkge1xuICAgIG1hcCA9IF9tYXA7XG4gICAgeCA9IF94O1xuICAgIHkgPSBfeTtcbiAgICBzZWxlY3RlZCA9IF9zZWxlY3RlZDtcbiAgfVxuXG4gIGdldFBvcygpIHtcbiAgICByZXR1cm4gW3gsIHldO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtUaWxlfVxuICAgKi9cbiAgZ2V0U2VsZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VGlsZX0gX3NlbGVjdGVkXG4gICAqIEByZXR1cm5zIHtDdXJzb3J9XG4gICAqL1xuICBzZXRTZWxlY3RlZChfc2VsZWN0ZWQpIHtcbiAgICBzZWxlY3RlZCA9IF9zZWxlY3RlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHBhblVwKCkge1xuICAgIHkgPSBfLmNsYW1wKDAsIG1hcC5nZXRIZWlnaHQoKSAtIDEsIHkgLSAxKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHBhblJpZ2h0KCkge1xuICAgIHggPSBfLmNsYW1wKDAsIG1hcC5nZXRXaWR0aCgpIC0gMSwgeCArIDEpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcGFuRG93bigpIHtcbiAgICB5ID0gXy5jbGFtcCgwLCBtYXAuZ2V0SGVpZ2h0KCkgLSAxLCB5ICsgMSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwYW5MZWZ0KCkge1xuICAgIHggPSBfLmNsYW1wKDAsIG1hcC5nZXRXaWR0aCgpIC0gMSwgeCAtIDEpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBfIGZyb20gJ2xvZGFzaC9mcCc7XG5pbXBvcnQgUk9UIGZyb20gJ3JvdC1qcyc7XG5pbXBvcnQge0xvb3B9IGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgd2lkdGgsIGhlaWdodDtcbi8qKlxuICogQHR5cGUge01hcH1cbiAqL1xubGV0IG1hcDtcbmxldCB0aWxlU2V0O1xuLyoqXG4gKiBAdHlwZSB7Uk9ULkRpc3BsYXl9XG4gKi9cbmxldCByZW5kZXJlcjtcbi8qKlxuICogQHR5cGUge0N1cnNvcn1cbiAqL1xubGV0IGN1cnNvcjtcbi8qKlxuICogQHR5cGUge0xvb3B9XG4gKi9cbmxldCByZW5kZXJMb29wO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEaXNwbGF5IHtcbiAgY29uc3RydWN0b3IoX3dpZHRoLCBfaGVpZ2h0LCBfdGlsZVNldCwgX21hcCwgX2N1cnNvcikge1xuICAgIHdpZHRoID0gX3dpZHRoO1xuICAgIGhlaWdodCA9IF9oZWlnaHQ7XG4gICAgdGlsZVNldCA9IF90aWxlU2V0O1xuICAgIG1hcCA9IF9tYXA7XG4gICAgY3Vyc29yID0gX2N1cnNvcjtcbiAgICByZW5kZXJlciA9IG5ldyBST1QuRGlzcGxheShfLmFzc2lnbih0aWxlU2V0LCB7bGF5b3V0OiAndGlsZScsIHdpZHRoLCBoZWlnaHR9KSk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjcmVlbicpLmFwcGVuZENoaWxkKHJlbmRlcmVyLmdldENvbnRhaW5lcigpKTtcbiAgICByZW5kZXJMb29wID0gbmV3IExvb3AoNjAsIHRoaXMuZHJhdyk7XG4gIH1cblxuICBkcmF3KCkge1xuICAgIGNvbnN0IGN1cnNvclBvcyA9IGN1cnNvci5nZXRQb3MoKTtcbiAgICBjb25zdCBvZmZzZXQgPSBbXG4gICAgICBfLmNsYW1wKDAsIG1hcC5nZXRXaWR0aCgpIC0gd2lkdGgsIGN1cnNvclBvc1swXSAtIF8uZmxvb3Iod2lkdGggLyAyKSksXG4gICAgICBfLmNsYW1wKDAsIG1hcC5nZXRIZWlnaHQoKSAtIGhlaWdodCwgY3Vyc29yUG9zWzFdIC0gXy5mbG9vcihoZWlnaHQgLyAyKSlcbiAgICBdO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICBjb25zdCB0aWxlQ29udGVudCA9IG1hcFxuICAgICAgICAgIC5nZXRUaWxlKHggKyBvZmZzZXRbMF0sIHkgKyBvZmZzZXRbMV0pXG4gICAgICAgICAgLmdldENvbnRlbnRzKCk7XG4gICAgICAgIHJlbmRlcmVyLmRyYXcoeCwgeSwgdGlsZUNvbnRlbnQuY29uY2F0KGN1cnNvci5nZXRTZWxlY3RlZCgpID09PSBfLmhlYWQodGlsZUNvbnRlbnQpID8gW3tnSWQ6IDI5OH1dIDogW10pXG4gICAgICAgICAgLm1hcCh0aWxlID0+IHRpbGUgPyB0aWxlLmdJZCA6IG51bGwpXG4gICAgICAgICAgLmZpbHRlcihCb29sZWFuKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlbmRlcmVyLmRyYXcoY3Vyc29yUG9zWzBdIC0gb2Zmc2V0WzBdLCBjdXJzb3JQb3NbMV0gLSBvZmZzZXRbMV0sIDI5OCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNob3dUZXh0KHRleHQgPSBudWxsKSB7XG4gICAgY29uc3QgdGV4dEJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZXh0Jyk7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgIHRleHRCb3guaW5uZXJUZXh0ID0gdGV4dDtcbiAgICB9XG4gICAgdGV4dEJveC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJycpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaGlkZVRleHQoKSB7XG4gICAgZG9jdW1lbnRcbiAgICAgIC5nZXRFbGVtZW50QnlJZCgndGV4dCcpXG4gICAgICAuc2V0QXR0cmlidXRlKCdjbGFzcycsICdoaWRkZW4nKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlzUGF1c2VkKCkge1xuICAgIHJldHVybiByZW5kZXJMb29wLmlzUnVubmluZygpO1xuICB9XG5cbiAgcGF1c2UoKSB7XG4gICAgcmVuZGVyTG9vcC5zdG9wKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnBhdXNlKCkge1xuICAgIHJlbmRlckxvb3Auc3RhcnQoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5sZXQgcGF1c2VkID0gZmFsc2U7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdhbWUge1xuICBpc1BhdXNlZCgpIHtcbiAgICByZXR1cm4gcGF1c2VkO1xuICB9XG5cbiAgcGF1c2UoKSB7XG4gICAgcGF1c2VkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVucGF1c2UoKSB7XG4gICAgcGF1c2VkID0gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoL2ZwJztcbmNvbnN0IHRpbGVzID0ge307XG5sZXQgd2lkdGgsIGhlaWdodDtcblxuY2xhc3MgVGlsZSB7XG4gIGNvbnN0cnVjdG9yKGdJZCkge1xuICAgIHRoaXMuZ0lkID0gZ0lkO1xuICAgIHRoaXMudW5pdHMgPSBbXTtcbiAgfVxuXG4gIGdldENvbnRlbnRzKCkge1xuICAgIHJldHVybiBbdGhpc11cbiAgICAgIC5jb25jYXQodGhpcy51bml0cylcbiAgICAgIC5jb25jYXQodGhpcy5zZWxlY3RlZCA/IFt7Z0lkOiAyOTh9XSA6IFtdKTtcbiAgfVxuXG4gIGFkZFVuaXQodW5pdCkge1xuICAgIGlmICghdGhpcy51bml0cy5pbmNsdWRlcyh1bml0KSkge1xuICAgICAgdGhpcy51bml0cy5wdXNoKHVuaXQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRUaWxlKGNvbGxlY3Rpb24sIHgsIHksIHRpbGUpIHtcbiAgY29sbGVjdGlvbltgJHt4fSwke3l9YF0gPSB0aWxlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXAge1xuICBjb25zdHJ1Y3Rvcih0aWxlc1NyYyA9IFtdLCB1bml0c1NyYyA9IFtdKSB7XG4gICAgd2lkdGggPSB0aWxlc1NyYy5sZW5ndGg7XG4gICAgaGVpZ2h0ID0gdGlsZXNTcmNbMF0ubGVuZ3RoO1xuICAgIHRpbGVzU3JjLmZvckVhY2goKHJvdywgeSkgPT4ge1xuICAgICAgcm93LmZvckVhY2goKGdJZCwgeCkgPT4ge1xuICAgICAgICBzZXRUaWxlKHRpbGVzLCB4LCB5LCBuZXcgVGlsZShnSWQpKTtcbiAgICAgICAgY29uc3QgdW5pdEdJZCA9IF8uZ2V0KGAke3l9LiR7eH1gLCB1bml0c1NyYyk7XG4gICAgICAgIGlmICh1bml0R0lkKSB7XG4gICAgICAgICAgdGhpc1xuICAgICAgICAgICAgLmdldFRpbGUoeCwgeSlcbiAgICAgICAgICAgIC5hZGRVbml0KG5ldyBUaWxlKHVuaXRHSWQpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRXaWR0aCgpIHtcbiAgICByZXR1cm4gd2lkdGg7XG4gIH1cblxuICBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIGhlaWdodDtcbiAgfVxuXG4gIGdldFRpbGUoeCwgeSkge1xuICAgIHJldHVybiBfLmdldChgJHt4fSwke3l9YCwgdGlsZXMpO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cblxubGV0IHRpbGVTaGVldCwgc2hlZXRXaWR0aCwgc2hlZXRIZWlnaHQsIHRpbGVTaXplO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaWxlTWFwIHtcbiAgY29uc3RydWN0b3IoX3RpbGVTaGVldCwgX3NoZWV0V2lkdGgsIF9zaGVldEhlaWdodCwgX3RpbGVTaXplKSB7XG4gICAgdGlsZVNoZWV0ID0gX3RpbGVTaGVldDtcbiAgICBzaGVldFdpZHRoID0gX3NoZWV0V2lkdGg7XG4gICAgc2hlZXRIZWlnaHQgPSBfc2hlZXRIZWlnaHQ7XG4gICAgdGlsZVNpemUgPSBfdGlsZVNpemU7XG4gIH1cblxuICBidWlsZE9wdGlvbnMoKSB7XG4gICAgY29uc3QgdGlsZU1hcCA9IHt9O1xuXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCA0NDsgeSsrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IDc7IHgrKykge1xuICAgICAgICB0aWxlTWFwW3kgKiA3ICsgeCArIDFdID0gW3gsIHldLm1hcCgodmFsLCBpKSA9PiB2YWwgKiB0aWxlU2l6ZVtpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRpbGVTZXQ6IHRpbGVTaGVldCxcbiAgICAgIGJnOiAndHJhbnNwYXJlbnQnLFxuICAgICAgdGlsZVdpZHRoOiB0aWxlU2l6ZVswXSxcbiAgICAgIHRpbGVIZWlnaHQ6IHRpbGVTaXplWzFdLFxuICAgICAgdGlsZU1hcFxuICAgIH07XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtrZXlzVG9WYWxzLCBmb3JPd24sIG92ZXJyaWRlRXZlbnR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoL2ZwJztcblxuLyoqXG4gKiBAdHlwZSB7R2FtZX1cbiAqL1xubGV0IGdhbWU7XG4vKipcbiAqIEB0eXBlIHtEaXNwbGF5fVxuICovXG5sZXQgZGlzcGxheTtcbi8qKlxuICogQHR5cGUge01hcH1cbiAqL1xubGV0IG1hcDtcbi8qKlxuICogQHR5cGUge0N1cnNvcn1cbiAqL1xubGV0IGN1cnNvcjtcblxuY29uc3QgY29udHJvbHMgPSB7ZG93bjoge30sIHVwOiB7fX07XG5jb25zdCBrZXlQb3MgPSBrZXlzVG9WYWxzKGNvbnRyb2xzKTtcblxuY29uc3QgY29tbWFuZHMgPSBmb3JPd24oKFtwb3MsIGtleXMsIGNiXSkgPT4ga2V5cy5mb3JFYWNoKGtleSA9PiBjb250cm9sc1twb3NdW2tleV0gPSBjYiksIHtcbiAgU2Nyb2xsVXA6IFtrZXlQb3MuZG93biwgWydBcnJvd1VwJywgJ0tleVcnXSwgKCkgPT4gZ2FtZS5pc1BhdXNlZCgpID8gbnVsbCA6IGN1cnNvci5wYW5VcCgpXSxcbiAgU2Nyb2xsUmlnaHQ6IFtrZXlQb3MuZG93biwgWydBcnJvd1JpZ2h0JywgJ0tleUQnXSwgKCkgPT4gZ2FtZS5pc1BhdXNlZCgpID8gbnVsbCA6IGN1cnNvci5wYW5SaWdodCgpXSxcbiAgU2Nyb2xsRG93bjogW2tleVBvcy5kb3duLCBbJ0Fycm93RG93bicsICdLZXlTJ10sICgpID0+IGdhbWUuaXNQYXVzZWQoKSA/IG51bGwgOiBjdXJzb3IucGFuRG93bigpXSxcbiAgU2Nyb2xsTGVmdDogW2tleVBvcy5kb3duLCBbJ0Fycm93TGVmdCcsICdLZXlBJ10sICgpID0+IGdhbWUuaXNQYXVzZWQoKSA/IG51bGwgOiBjdXJzb3IucGFuTGVmdCgpXSxcbiAgU2VsZWN0OiBba2V5UG9zLmRvd24sIFsnS2V5SiddLCAoKSA9PiBjdXJzb3Iuc2V0U2VsZWN0ZWQobWFwLmdldFRpbGUuYXBwbHkobWFwLCBjdXJzb3IuZ2V0UG9zKCkpKV0sXG4gIFBhdXNlOiBba2V5UG9zLmRvd24sIFsnU3BhY2UnXSwgKCkgPT4ge1xuICAgIChnYW1lLmlzUGF1c2VkKCkgPyBnYW1lLnVucGF1c2UgOiBnYW1lLnBhdXNlKS5hcHBseShnYW1lKTtcbiAgICAoZGlzcGxheS5pc1BhdXNlZCgpID8gZGlzcGxheS5wYXVzZSA6IGRpc3BsYXkudW5wYXVzZSkuYXBwbHkoZGlzcGxheSk7XG4gIH1dLFxuICBTaG93SGVscDogW2tleVBvcy5kb3duLCBbJ1RhYiddLCAoKSA9PiB7XG4gICAgXy5mbG93KFtcbiAgICAgIF8udG9QYWlycy5iaW5kKF8pLFxuICAgICAgXy5tYXAuYmluZChfLCAoW3Byb3AsIFtwb3MsIGtleXMsIGNiXV0pID0+IGAke3Byb3B9OiAke2tleXMuam9pbignLCAnKX1gKSxcbiAgICAgIF8uam9pbi5iaW5kKF8sICdcXG4nKSxcbiAgICAgIGRpc3BsYXkuc2hvd1RleHQuYmluZChkaXNwbGF5KSxcbiAgICBdKShjb21tYW5kcyk7XG4gIH1dLFxuICBIaWRlSGVscDogW2tleVBvcy51cCwgWydUYWInXSwgKCkgPT4gZGlzcGxheS5oaWRlVGV4dCgpXVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVJIHtcbiAgY29uc3RydWN0b3IoX2dhbWUsIF9kaXNwbGF5LCBfbWFwLCBfY3Vyc29yKSB7XG4gICAgZ2FtZSA9IF9nYW1lO1xuICAgIGRpc3BsYXkgPSBfZGlzcGxheTtcbiAgICBtYXAgPSBfbWFwO1xuICAgIGN1cnNvciA9IF9jdXJzb3I7XG4gIH1cblxuICBhcHBseUtleUJpbmRpbmdzKCkge1xuICAgIF8ua2V5cyhjb250cm9scykuZm9yRWFjaChwb3MgPT4gd2luZG93W2BvbmtleSR7cG9zfWBdID0gb3ZlcnJpZGVFdmVudChlID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBfLmdldChlLmNvZGUsIGNvbnRyb2xzW3Bvc10pO1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihjb21tYW5kKSkge1xuICAgICAgICBjb21tYW5kKCk7XG4gICAgICB9XG4gICAgfSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBEaXNwbGF5IGZyb20gJy4vRGlzcGxheSc7XG5pbXBvcnQgTWFwIGZyb20gJy4vTWFwJztcbmltcG9ydCBVSSBmcm9tICcuL1VJJztcbmltcG9ydCBHYW1lIGZyb20gJy4vR2FtZSc7XG5pbXBvcnQgQ3Vyc29yIGZyb20gJy4vY3Vyc29yJztcbmltcG9ydCBUaWxlTWFwIGZyb20gJy4vVGlsZU1hcCc7XG5cbmNvbnN0IGdhbWUgPSBuZXcgR2FtZSgpO1xuY29uc3QgbWFwID0gbmV3IE1hcChbXG4gIFsxLCAyLCAyLCAxLCA0LCA0LCA0LCAxLCAxLCAxXSxcbiAgWzEsIDEsIDIsIDIsIDIsIDQsIDQsIDQsIDMsIDNdLFxuICBbNCwgNCwgMywgMiwgMiwgMiwgMiwgMSwgMywgM10sXG4gIFs0LCA0LCAzLCAzLCAyLCAxLCAxLCAxLCAxLCAzXSxcbiAgWzEsIDEsIDEsIDEsIDEsIDEsIDEsIDIsIDIsIDFdLFxuICBbMiwgMSwgNCwgNCwgNCwgMywgMSwgMiwgMiwgMV0sXG4gIFsyLCAyLCA0LCA0LCA0LCAzLCAzLCAxLCAyLCAxXSxcbiAgWzIsIDIsIDEsIDEsIDEsIDMsIDMsIDEsIDQsIDRdLFxuICBbMywgMywgMywgMiwgNCwgNCwgMSwgMSwgNCwgNF0sXG4gIFsxLCAxLCAzLCAzLCA0LCA0LCAxLCAxLCAxLCAxXVxuXSwgW1xuICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgWzAsIDkxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdXG5dKTtcblxuXG5jb25zdCBjdXJzb3IgPSBuZXcgQ3Vyc29yKG1hcCwgMCwgMCk7XG5jb25zdCB0aWxlTWFwID0gbmV3IFRpbGVNYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbGVzJyksIDcsIDQ0LCBbMTYsIDE2XSk7XG5jb25zdCBkaXNwbGF5ID0gbmV3IERpc3BsYXkoMTAsIDEwLCB0aWxlTWFwLmJ1aWxkT3B0aW9ucygpLCBtYXAsIGN1cnNvcilcbiAgLnVucGF1c2UoKTtcbmNvbnN0IHVpID0gbmV3IFVJKGdhbWUsIGRpc3BsYXksIG1hcCwgY3Vyc29yKS5hcHBseUtleUJpbmRpbmdzKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGtleXNUb1ZhbHMob2JqKSB7XG4gIGNvbnN0IHJlcyA9IHt9O1xuICBmb3JPd24oKHZhbCwgcHJvcCkgPT4gcmVzW3Byb3BdID0gcHJvcCwgb2JqKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gZm9yT3duKGNiLCBvYmopIHtcbiAgZm9yIChsZXQgcHJvcCBpbiBvYmopIHtcbiAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICBjYihvYmpbcHJvcF0sIHByb3AsIG9iaik7XG4gICAgfVxuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlRXZlbnQoY2IgPSAoKCkgPT4gZmFsc2UpKSB7XG4gIHJldHVybiBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY2IoZSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGxvb3BJbnRlcnZhbChsb29wKSB7XG4gIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgbG9vcC5jYigpO1xuICBpZiAobG9vcC5ydW5uaW5nKSB7XG4gICAgc2V0VGltZW91dChsb29wSW50ZXJ2YWwuYmluZCh0aGlzLCBsb29wKSwgbG9vcC50aW1pbmcgLSAoc3RhcnQgLSBuZXcgRGF0ZSgpLmdldE1pbGxpc2Vjb25kcygpKSk7XG4gIH1cbn1cblxuY2xhc3MgTG9vcCB7XG4gIGNvbnN0cnVjdG9yKHRpbWluZywgY2IpIHtcbiAgICB0aGlzLnRpbWluZyA9IHRpbWluZztcbiAgICB0aGlzLmNiID0gY2I7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgdGhpcy5pbnRlcnZhbCA9ICgpID0+IGZhbHNlO1xuICB9XG5cbiAgaXNSdW5uaW5nKCkge1xuICAgIHJldHVybiB0aGlzLnJ1bm5pbmc7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBsb29wSW50ZXJ2YWwuYmluZChsb29wSW50ZXJ2YWwsIHRoaXMpO1xuICAgIHRoaXMuaW50ZXJ2YWwoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgdGhpcy5pbnRlcnZhbCA9ICgpID0+IGZhbHNlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCB7XG4gIGtleXNUb1ZhbHMsXG4gIGZvck93bixcbiAgb3ZlcnJpZGVFdmVudCxcbiAgTG9vcFxufTtcbiJdfQ==
