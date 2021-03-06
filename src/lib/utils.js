/* eslint camelcase:0 */

module.exports = (function () {

    var utils = {};

    // e.g.
    // var symbol = { code: { meta: { type: "MethodDefinition" } } };
    // notate(symbol, "code.meta.type") => "MethodDefinition"
    // See https://github.com/onury/notation for an advanced library.
    function notate(obj, notation) {
        if (typeof obj !== 'object') return;
        // console.log('n', notation);
        var o,
            props = !Array.isArray(notation)
                ? notation.split('.')
                : notation,
            prop = props[0];
        if (!prop) return;
        o = obj[prop];
        if (props.length > 1) {
            props.shift();
            return notate(o, props);
        }
        return o;
    }

    function getStr(value) {
        return value && value.trim() !== '' ? value : null;
    }

    // ---------------------------

    /**
     *  Gets the full code-name of the given symbol.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.getFullName = function (symbol) {
        var codeName = notate(symbol, 'meta.code.name') || '',
            re = /[^#\.~]/g;
        return codeName.replace(re, '').length >= symbol.longname.replace(re, '').length
            ? codeName
            : symbol.longname;
    };

    /**
     *  Gets the (short) code-name of the given symbol.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.getName = function (symbol) {
        // if @alias is set, the original (long) name is only found at meta.code.name
        var name = notate(symbol, 'meta.code.name');
        if (name) {
            return name.replace(/.*?[#\.~](\w+)$/i, '$1');
        }
        return symbol.name;
    };

    /**
     *  Gets the first matching symbol by the given name.
     *
     *  @param {Array} docs - Documentation symbols array.
     *  @param {String} name - Symbol name to be checked.
     *  @returns {Object} - Symbol object if found. Otherwise, returns `null`.
     */
    utils.getSymbolByName = function (docs, name) {
        var i, symbol;
        for (i = 0; i < docs.length; i++) {
            symbol = docs[i];
            if (symbol.name === name
                    || symbol.longname === name
                    || utils.getFullName(symbol) === name) {
                return symbol;
            }
            if (symbol.$members) {
                var sym = utils.getSymbolByName(symbol.$members, name);
                if (sym) return sym;
            }
        }
        return null;
    };

    /**
     *  Checks whether the given symbol has global scope.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isGlobal = function (symbol) {
        return symbol.scope === 'global';
    };

    /**
     *  Checks whether the given symbol is a namespace.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isNamespace = function (symbol) {
        return symbol.kind === 'namespace';
    };

    /**
     *  Checks whether the given symbol is a class.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isClass = function (symbol) {
        return symbol.kind === 'class'
            && notate(symbol, 'meta.code.type') === 'ClassDeclaration';
    };

    /**
     *  Checks whether the given symbol is a constructor.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isConstructor = function (symbol) {
        return symbol.kind === 'class'
            && notate(symbol, 'meta.code.type') === 'MethodDefinition';
    };

    /**
     *  Checks whether the given symbol is a static member.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isStaticMember = function (symbol) {
        return symbol.scope === 'static';
    };

    /**
     *  Checks whether the given symbol is an instance member.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInstanceMember = function (symbol) {
        return symbol.scope === 'instance';
    };

    /**
     *  Checks whether the given symbol is a method.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isMethod = function (symbol) {
        var codeType = utils.notate(symbol, 'meta.code.type');
        return symbol.kind === 'function'
            && (codeType === 'MethodDefinition' || codeType === 'FunctionExpression');
    };

    /**
     *  Checks whether the given symbol is an instance method.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInstanceMethod = function (symbol) {
        return utils.isInstanceMember(symbol) && utils.isMethod(symbol);
    };

    /**
     *  Checks whether the given symbol is a static method.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isStaticMethod = function (symbol) {
        return utils.isStaticMember(symbol) && utils.isMethod(symbol);
    };

    /**
     *  Checks whether the given symbol is a property.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isProperty = function (symbol) {
        return symbol.kind === 'member';
            // && notate(symbol, 'meta.code.type') === 'MethodDefinition';
    };

    /**
     *  Checks whether the given symbol is an instance property.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isInstanceProperty = function (symbol) {
        return utils.isInstanceMember(symbol) && utils.isProperty(symbol);
    };

    /**
     *  Checks whether the given symbol is a static property.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isStaticProperty = function (symbol) {
        return utils.isStaticMember(symbol) && utils.isProperty(symbol);
    };

    /**
     *  Checks whether the given symbol is an enumeration.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isEnum = function (symbol) {
        return symbol.isEnum;
    };

    /**
     *  Checks whether the given symbol is read-only.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isReadOnly = function (symbol) {
        return symbol.readonly;
    };

    /**
     *  Checks whether the given symbol is undocumented.
     *  This checks if the symbol has any comments.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.isUndocumented = function (symbol) {
        // we could use the `undocumented` property but it still seems buggy.
        // https://github.com/jsdoc3/jsdoc/issues/241
        // `undocumented` is omitted (`undefined`) for documented symbols.
        // return symbol.undocumented !== true;
        return !symbol.comments;
    };

    /**
     *  Checks whether the given symbol has description.
     *
     *  @param {Object} symbol - Documented symbol object.
     *  @returns {Boolean}
     */
    utils.hasDescription = function (symbol) {
        return Boolean(getStr(symbol.classdesc) || getStr(symbol.description));
    };

    // ---------------------------

    return utils;

})();
