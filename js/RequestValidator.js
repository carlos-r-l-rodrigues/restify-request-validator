"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ParamValidation_1 = require("./ParamValidation");
var supportedNumericTypes = ['number', 'numeric', 'integer'];
var supportedTypes = ['string', 'boolean', 'date', 'array', 'object'].concat(supportedNumericTypes);
var RequestValidator = (function () {
    function RequestValidator(errorHandler) {
        if (errorHandler === void 0) { errorHandler = Error; }
        this.failOnFirstError = true;
        this.errorHandler = errorHandler;
    }
    RequestValidator.prototype.disableFailOnFirstError = function () {
        this.failOnFirstError = false;
    };
    RequestValidator.prototype.getErrorMessage = function (field, errorType, defaultMessage) {
        if (this.customErrorMessages.hasOwnProperty(field) && this.customErrorMessages[field].hasOwnProperty(errorType)) {
            return {
                message: this.customErrorMessages[field][errorType],
                constraint: errorType,
                isCustom: true
            };
        }
        return {
            message: defaultMessage,
            constraint: errorType,
            isCustom: false
        };
    };
    RequestValidator.prototype.validate = function (req, res, next) {
        if (req.hasOwnProperty('route') && req.route.hasOwnProperty('validation')) {
            if (req.route.hasOwnProperty('validationMessages')) {
                this.customErrorMessages = req.route.validationMessages;
            }
            else {
                this.customErrorMessages = {};
            }
            var errorMessages = [];
            if (req.route.validation.hasOwnProperty('url')) {
                errorMessages = errorMessages.concat(this.validateFields(req.params, req.route.validation.url, true).map(function (msg) {
                    return msg.isCustom ? msg.message : "Url: " + msg.message;
                }));
            }
            if (req.route.validation.hasOwnProperty('query')) {
                errorMessages = errorMessages.concat(this.validateFields(req.query, req.route.validation.query, true).map(function (msg) {
                    return msg.isCustom ? msg.message : "Query: " + msg.message;
                }));
            }
            if (req.route.validation.hasOwnProperty('body')) {
                errorMessages = errorMessages.concat(this.validateFields(req.body, req.route.validation.body, false).map(function (msg) {
                    return msg.isCustom ? msg.message : "Body: " + msg.message;
                }));
            }
            if (errorMessages.length) {
                if (this.failOnFirstError) {
                    next(new this.errorHandler(errorMessages[0]));
                }
                else {
                    next(new this.errorHandler(errorMessages.join('\n')));
                }
                return;
            }
        }
        next();
    };
    RequestValidator.buildValidationParam = function (validation) {
        if (!validation.hasOwnProperty('type') || supportedTypes.indexOf(validation.type) < 0) {
            return null;
        }
        var paramValidation = new ParamValidation_1.ParamValidation();
        paramValidation.type = validation.type;
        if (validation.hasOwnProperty('required') && typeof validation.required === 'boolean') {
            paramValidation.required = validation.required;
        }
        if (validation.hasOwnProperty('min') && typeof validation.min === 'number') {
            paramValidation.min = validation.min;
        }
        else if (paramValidation.type === 'boolean') {
            paramValidation.min = 0;
        }
        if (validation.hasOwnProperty('max') && typeof validation.max === 'number') {
            paramValidation.max = validation.max;
        }
        if (validation.hasOwnProperty('length') && typeof validation.length === 'number') {
            paramValidation.length = validation.length;
        }
        if (validation.hasOwnProperty('arrayType')) {
            paramValidation.arrayType = validation.arrayType;
        }
        if (validation.hasOwnProperty('values') && validation.values instanceof Array) {
            paramValidation.values = validation.values;
        }
        if (validation.hasOwnProperty('regex') && validation.regex instanceof RegExp) {
            paramValidation.regex = validation.regex;
        }
        if (validation.hasOwnProperty('format') && typeof validation.format === 'function') {
            paramValidation.format = validation.format;
        }
        if (validation.hasOwnProperty('terminal') && (typeof validation.terminal === 'boolean' || validation.terminal instanceof Array)) {
            paramValidation.terminal = validation.terminal;
        }
        return paramValidation;
    };
    RequestValidator.prototype.validateFields = function (input, validation, inUrl) {
        if (validation) {
            var errorMessages = [];
            if (validation.hasOwnProperty('disallowExtraFields')) {
                if (validation.disallowExtraFields === true && input) {
                    var difference = Object.keys(input).filter(function (x) { return Object.keys(validation).indexOf(x) === -1; });
                    if (difference.length > 0) {
                        errorMessages = errorMessages.concat(this.getErrorMessage('disallowExtraFields', 'default', "Should not contain extra fields (" + difference.join(', ') + ")"));
                    }
                }
                delete validation.disallowExtraFields;
            }
            var _loop_1 = function (key) {
                var paramValidation = RequestValidator.buildValidationParam(validation[key]);
                if (paramValidation) {
                    var type = input ? typeof input[key] : undefined;
                    if (type === 'string' && inUrl && paramValidation.type === 'array') {
                        input[key] = input[key].split(',').filter(function (element) { return element.length > 0; });
                        if (input[key].length === 0) {
                            input[key] = null;
                        }
                    }
                    errorMessages = errorMessages.concat(this_1.validateField(input, key, type, paramValidation));
                    if (errorMessages.length) {
                        if (this_1.failOnFirstError || paramValidation.terminal === true) {
                            return "break";
                        }
                        if (paramValidation.terminal instanceof Array) {
                            if (errorMessages.every(function (error) { return paramValidation.terminal.indexOf(error.constraint) > -1; })) {
                                return "break";
                            }
                        }
                    }
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = this.getPrioritizedValidationKeys(validation); _i < _a.length; _i++) {
                var key = _a[_i];
                var state_1 = _loop_1(key);
                if (state_1 === "break")
                    break;
            }
            return errorMessages;
        }
        return [];
    };
    RequestValidator.prototype.validateField = function (input, key, type, paramValidation) {
        var errorMessages = [];
        if (paramValidation.required === true && (!input || type === 'undefined' || input[key] === null)) {
            errorMessages.push(this.getErrorMessage(key, 'required', "Param " + key + " is required"));
        }
        if (input) {
            var typeValidation = {
                value: input[key],
                type: paramValidation.type
            };
            if (RequestValidator.checkType(typeValidation) !== true) {
                errorMessages.push(this.getErrorMessage(key, 'type', "Param " + key + " has invalid type (" + paramValidation.type + ")"));
            }
            if (typeValidation.value !== undefined) {
                input[key] = typeValidation.value;
            }
            if (input[key] instanceof Array && RequestValidator.checkArrayType(input[key], paramValidation.arrayType) !== true) {
                errorMessages.push(this.getErrorMessage(key, 'arrayType', "Param " + key + " has invalid content type (" + paramValidation.arrayType + "[])"));
            }
            if (RequestValidator.checkLength(input[key], paramValidation.length) !== true) {
                errorMessages.push(this.getErrorMessage(key, 'length', "Param " + key + " must have a length of " + paramValidation.length));
            }
            if (paramValidation.min !== 0 && input[key] !== null) {
                if (RequestValidator.checkMin(input[key], paramValidation.min) !== true) {
                    errorMessages.push(this.getErrorMessage(key, 'min', "Param " + key + " must have a minimum length of " + paramValidation.min));
                }
            }
            if (RequestValidator.checkMax(input[key], paramValidation.max) !== true) {
                errorMessages.push(this.getErrorMessage(key, 'max', "Param " + key + " must have a maximum length of " + paramValidation.max));
            }
            if (RequestValidator.checkValues(input[key], paramValidation.values) !== true) {
                errorMessages.push(this.getErrorMessage(key, 'values', "Param " + key + " must belong to [" + paramValidation.values.toString() + "]"));
            }
            if (input[key] !== undefined && paramValidation.regex && !paramValidation.regex.test(input[key])) {
                errorMessages.push(this.getErrorMessage(key, 'regex', "Param " + key + " must match regex " + paramValidation.regex));
            }
            if (paramValidation.format && input[key] !== undefined) {
                input[key] = paramValidation.format(input[key]);
            }
        }
        if (paramValidation.terminal instanceof Array && errorMessages.length > 0) {
            var terminalErrors_1 = [];
            errorMessages.forEach(function (error, index) {
                if (paramValidation.terminal.indexOf(error.constraint) !== -1) {
                    terminalErrors_1.push(errorMessages[index]);
                }
            });
            if (terminalErrors_1.length) {
                errorMessages = terminalErrors_1;
            }
        }
        return errorMessages;
    };
    RequestValidator.prototype.getPrioritizedValidationKeys = function (validation) {
        return Object.keys(validation).sort(function (a, b) {
            return +!!validation[b].terminal - +!!validation[a].terminal;
        });
    };
    RequestValidator.checkType = function (typeValidation) {
        var inputType = typeof typeValidation.value;
        if (inputType === 'undefined' || typeValidation.value === null) {
            return true;
        }
        else if (supportedNumericTypes.indexOf(typeValidation.type) > -1) {
            var isNumeric = (typeValidation.value + '').length > 0 && !isNaN(+typeValidation.value);
            if (isNumeric === true) {
                if (typeValidation.type === 'integer') {
                    typeValidation.value = parseInt(typeValidation.value, 10);
                }
                else {
                    typeValidation.value = parseFloat(typeValidation.value);
                }
            }
            return isNumeric;
        }
        else if (typeValidation.type === 'boolean') {
            var isBoolean = ['0', '1', 'false', 'true', false, true, 0, 1].indexOf(typeValidation.value) > -1;
            if (isBoolean === true) {
                typeValidation.value = !!isBoolean;
            }
            return isBoolean;
        }
        else if (typeValidation.type === 'date') {
            if (typeof typeValidation.value === 'object' && typeof typeValidation.value.getTime === 'function') {
                return true;
            }
            var milliseconds = Date.parse(typeValidation.value);
            if (isNaN(milliseconds)) {
                return false;
            }
            typeValidation.value = new Date(milliseconds);
            return true;
        }
        else if (typeValidation.type === 'array') {
            return typeValidation.value instanceof Array;
        }
        return inputType === typeValidation.type;
    };
    RequestValidator.checkArrayType = function (input, type) {
        if (input.length === 0 || type === null) {
            return true;
        }
        for (var i = 0; i < input.length; i += 1) {
            var typeVal = { value: input[i], type: type };
            if (typeVal.value instanceof Array) {
                this.checkArrayType(typeVal.value, type);
            }
            else if (RequestValidator.checkType(typeVal) !== true) {
                return false;
            }
            input[i] = typeVal.value;
        }
        return true;
    };
    RequestValidator.checkLength = function (input, length) {
        if (length === null) {
            return true;
        }
        if (input instanceof Array || typeof input === 'string') {
            return input.length === length;
        }
        return true;
    };
    RequestValidator.checkMin = function (input, min) {
        if (input instanceof Array || typeof input === 'string') {
            return input.length >= min;
        }
        else if (typeof input === 'number') {
            return input >= min;
        }
        return true;
    };
    RequestValidator.checkMax = function (input, max) {
        if (max === null) {
            return true;
        }
        if (input instanceof Array || typeof input === 'string') {
            return input.length <= max;
        }
        else if (typeof input === 'number') {
            return input <= max;
        }
        return true;
    };
    RequestValidator.checkValues = function (input, values) {
        if (input === undefined || !values || values.length === 0) {
            return true;
        }
        if (input instanceof Array) {
            for (var _i = 0, input_1 = input; _i < input_1.length; _i++) {
                var inp = input_1[_i];
                if (values.indexOf(inp) < 0) {
                    return false;
                }
            }
            return true;
        }
        return values.indexOf(input) >= 0;
    };
    return RequestValidator;
}());
exports.RequestValidator = RequestValidator;
//# sourceMappingURL=RequestValidator.js.map