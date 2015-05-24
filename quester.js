(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Quester = factory();
    }
})(this, function () {
    var dr, request, parse, isValid, defaults, slice, toString, operationsList = [];
    /*
     ---
     provides  : BuildSugar
     source    : http://gist.github.com/278016
     copyright : 2010 Thomas Aylott
     license   : MIT
     ...
     */
    dr=function(c){function f(a,b){c.push([]);return d(a,b)}function d(a,b){b=""+(b||"");a&&e("<",a,">");b&&e(b);a&&e("</",a.split(" ")[0],">");return d}d.toString=function(){return c.pop().join("")};function e(){c[c.length-1].push(c.join.call(arguments,""))}return f}([]);
    parse = {
        json: function (req) {
            var result;
            try {
                result = JSON.parse(req.responseText);
            } catch (e) {
                result = req.responseText;
            }
            return [result, req];
        }
    };
    request = {};
    request.base = function (type, url, data) {
        var methods = {
            success: function () {},
            error: function () {}
        };
        var XHR = window.XMLHttpRequest || ActiveXObject;
        var request = new XHR('MSXML2.XMLHTTP.3.0');
        request.open(type, url, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status >= 200 && request.status < 300) {
                    methods.success.apply(methods, parse.json(request));
                } else {
                    methods.error.apply(methods, parse.json(request));
                }
            }
        };
        request.send(data);
        var callbacks = {
            success: function (callback) {
                methods.success = callback;
                return callbacks;
            },
            error: function (callback) {
                methods.error = callback;
                return callbacks;
            }
        };

        return callbacks;
    };
    request.get = function(url, data) {
        return request.base('GET', url, data);
    };
    request.post = function(url, data) {
        return request.base('POST', url, data);
    };
    request.patch = function(url, data) {
        return request.base('PATCH', url, data);
    };
    request.delete = function(url, data) {
        return request.base('DELETE', url, data);
    };
    request.put = function(url, data) {
        return request.base('PUT', url, data);
    };

    toString = Object.prototype.toString;
    slice = Array.prototype.slice;
    isValid = function(obj) {
        return !(!obj || typeof obj === 'undefined');
    };

    defaults = {
        swagger: null,
        className: 'quester',
        classNames: {
            title: 'title',
            methodName: 'methodName',
            urlBox: 'url',
            actionButton: 'action',
            summaryContainer: 'summary',
            settingsContainer: 'settings',
            responseContainer: 'response'
        }
    };

    defaults.template = '<h4 class="'+defaults.classNames.title+'"></h4>'+
                        '<div class="'+defaults.classNames.settingsContainer+'">'+
                            '<textarea></textarea>'+
                        '</div>'+
                        '<div class="'+defaults.classNames.summaryContainer+'">'+
                            '<div>'+
                                '<span class="'+defaults.classNames.methodName+'"></span>'+
                                '<input type="text" class="'+defaults.classNames.urlBox+'"/>'+
                                '<button type="submit" class="'+defaults.classNames.actionButton+'"/>'+
                            '</div>'+
                        '</div>'+
                        '<div class="'+defaults.classNames.responseContainer+'">'+
                            '<textarea></textarea>'+
                        '</div>';


    function findOperation(operationId) {
        return typeof operationsList[operationId] !== 'undefined' ? operationsList[operationId] : false;
    }

    function prepareOperations() {
        // Create an easier list of Swagger APIs.
        var apis = defaults.swagger.apis, subApis;

        console.log(apis);

        for(var endpoint in apis) {
            if(!apis.hasOwnProperty(endpoint) || !apis[endpoint].hasOwnProperty('apis')) {
                continue;
            }

            // Endpoints.
            endpoint = apis[endpoint];
            subApis = endpoint.apis;

            console.log(endpoint);
            console.log(subApis);

            for(var operation in subApis) {
                if(!subApis.hasOwnProperty(operation) || !operation) {
                    continue;
                }

                operationsList[operation] = subApis[operation];
            }
        }

        console.log(operationsList);
    }

    function applyQuest(el) {
        var operationId = el.getAttribute('data-operation'),
            operation = findOperation(operationId);

        console.log(operation);

        if(!operation) {
            console.log('Operation not valid.');
            return false;
        }

        placeElements(el, operation);
    }

    function placeElements(el, operation) {
        el.innerHTML = defaults.template;

        var summary = el.querySelector('.'+defaults.classNames.summaryContainer),
            methodName = summary.querySelector('.'+defaults.classNames.methodName);

        methodName.innerHTML = operation.method.toUpperCase() + ' ' + operation.path;
    }

    function initialize() {
        prepareOperations();
        process();
    }

    function process() {
        var els = document.getElementsByClassName(defaults.className);

        if(!els || els.length < 1) {
            throw new Error('No quester element found.');
        }

        var len = els.length;

        for (var i=0; i<len; ++i) {
            if (i in els) {
                applyQuest(els[i]);
                console.log('Questered element '+i);
            }
        }
    }

    function Quester() {
        var args = toString.call(arguments[0]) === '[object Array]' ? arguments[0] : slice.call(arguments);

        if(typeof SwaggerClient === 'undefined' || !(args[0] instanceof SwaggerClient)) {
            throw new Error('Provide a SwaggerClient instance.');
        }

        defaults.swagger = (args[0] instanceof SwaggerClient) ? args[0] : SwaggerClient;

        console.log('Quester initialized.');

        initialize();
    }

    return Quester;

});