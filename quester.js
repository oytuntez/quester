(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Quester = factory();
    }
})(this, function () {
    var dr, request, parse, isValid, findParentNode, defaults, slice, toString, operationsList = [];
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
    findParentNode = function(id, className, childObj) {
        var testObj = childObj.parentNode;
        var count = 1;
        console.log(testObj);
        while(!testObj || testObj.getAttribute('id') != id || testObj.className != className) {
            testObj = testObj.parentNode;
            count++;
        }
        // now you have the object you are looking for - do something with it
        return testObj;
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
            formContainer: 'form',
            summaryContainer: 'summary',
            parametersContainer: 'parameters',
            headerParametersContainer: 'headers',
            queryStringParametersContainer: 'queryStrings',
            formParametersContainer: 'formData',
            pathParametersContainer: 'pathParams',
            singleParameter: 'parameter',
            executionContainer: 'response',
            actionsContainer: 'actions'
        }
    };

    defaults.template = '<h4 class="'+defaults.classNames.title+'"></h4>'+
                        '<form class="'+defaults.classNames.formContainer+'">'+
                        '<div class="'+defaults.classNames.summaryContainer+'">'+
                            '<div>'+
                                '<span class="'+defaults.classNames.methodName+'"></span>'+
                            '</div>'+
                        '</div>'+
                        '<div class="'+defaults.classNames.parametersContainer+'">'+
                            '<div class="'+defaults.classNames.headerParametersContainer+'">'+
                            '</div>'+
                            '<div class="'+defaults.classNames.pathParametersContainer+'">'+
                            '</div>'+
                            '<div class="'+defaults.classNames.queryStringParametersContainer+'">'+
                            '</div>'+
                            '<div class="'+defaults.classNames.formParametersContainer+'">'+
                            '</div>'+
                        '</div>'+
                        '<div class="'+defaults.classNames.actionsContainer+'">'+
                            '<button type="submit" class="'+defaults.classNames.actionButton+'">Submit</button>'+
                        '</div>'+
                        '<div class="'+defaults.classNames.executionContainer+'">'+
                            '<label>Request data: <textarea class="request"></textarea></label>'+
                            '<label>Response headers: <textarea class="responseHeader"></textarea></label>'+
                            '<label>Response body: <textarea class="responseBody"></textarea></label>'+
                        '</div>'+
                        '</form>';


    function findOperation(operationId) {
        return typeof operationsList[operationId] !== 'undefined' ? operationsList[operationId] : false;
    }

    function prepareOperations() {
        // Create an easier list of Swagger APIs.
        var apis = defaults.swagger.apis, subApis;

        for(var endpoint in apis) {
            if(!apis.hasOwnProperty(endpoint) || !apis[endpoint].hasOwnProperty('apis')) {
                continue;
            }

            // Endpoints.
            endpoint = apis[endpoint];
            subApis = endpoint.apis;

            for(var operation in subApis) {
                if(!subApis.hasOwnProperty(operation) || !operation) {
                    continue;
                }

                operationsList[operation] = subApis[operation];
            }
        }
    }

    function applyQuest(el) {
        var operationId = el.getAttribute('data-operation'),
            operation = findOperation(operationId);

        if(!operation) {
            console.log('Operation not valid.');
            return false;
        }

        var placedElements = placeElements(el, operation);
        listenEvents(placedElements);
    }

    function listenEvents(el) {
        var actionButton = el.querySelector('.'+defaults.classNames.actionButton);
        actionButton.addEventListener('click', executeRequest, false);
    }

    function executeRequest(e) {
        e.preventDefault();

        var quester = findParentNode(null, 'quester', e.target),
            operation = quester.getAttribute('data-operation'),
            form, data, response;

        if(operationsList.hasOwnProperty(operation)) {
            operation = operationsList[operation];
            form = findParentNode(null, defaults.classNames.formContainer, e.target);
            data = compactData(form);

            if(operation.parameters[0].in === 'body') {
                data = {body: JSON.stringify(data)};
            }

            var responseProcessor = processResponse.bind({quester: quester, params: data});

            operation.execute(data, responseProcessor, responseProcessor);
        }
    }

    function processResponse(response, params, quester) {
        console.log(response);

        quester = typeof(quester) === 'undefined' ? this.quester : quester;
        params = typeof(params) === 'undefined' ? this.params : params;

        var container = quester.querySelector('.'+defaults.classNames.executionContainer),
            responseBodyArea = container.querySelector('.responseBody'),
            responseHeaderArea = container.querySelector('.responseHeader'),
            requestArea = container.querySelector('.request');


        // Request data.
        requestArea.value = JSON.stringify(params);

        // Response headers.
        responseHeaderArea.value = 'Status: ' + response.obj.code + ' - ' + response.obj.message;

        if(!!response.headers) {
            responseHeaderArea.value += "\n";

            for(var header in response.headers) {
                if(!response.headers.hasOwnProperty(header)) {
                    continue;
                }

                responseHeaderArea.value += header + ': ' + response.headers[header] + "\n";
            }
        }

        // Response body.
        responseBodyArea.value = response.data;
    }

    function compactData(form, getEmptyValues) {
        var data = {},
            inputs = form.querySelectorAll('input, textarea');

        getEmptyValues = typeof(getEmptyValues) === 'undefined' ? false : !!getEmptyValues;

        if(inputs.length > 0) {
            for(var i = 0; i < inputs.length; i++) {
                var input = inputs[i], inputName = null;

                if(!!input.getAttribute('name')) {
                    inputName = input.getAttribute('name');
                } else if(!!input.getAttribute('id')) {
                    inputName = input.getAttribute('id');
                } else {
                    continue;
                }

                if(getEmptyValues === true || input.value.length > 0) {
                    data[input.getAttribute('name')] = input.value;
                }
            }
        }

        return data;
    }

    function placeElements(el, operation) {
        el.innerHTML = defaults.template;

        var summary = el.querySelector('.'+defaults.classNames.summaryContainer),
            title = el.querySelector('.'+defaults.classNames.title),
            parameters = el.querySelector('.'+defaults.classNames.parametersContainer),
            methodName = summary.querySelector('.'+defaults.classNames.methodName);



        methodName.innerHTML = operation.method.toUpperCase() + ' ' + operation.path;
        title.innerHTML = operation.nickname;
        console.log(parameters);
        placeParameters(parameters, operation);

        return el;
    }

    function placeParameters(el, operation) {
        var parameters = operation.parameters,
            len = parameters.length,
            parameter,
            params,
            subEl,
            splitModelName;

        for (var i=0; i<len; ++i) {
            if(!parameters[i]) {
                continue;
            }

            parameter = parameters[i];

            switch(parameter.in) {
                case 'body':case 'formData':
                    subEl = el.querySelector('.'+defaults.classNames.formParametersContainer);

                    if(parameter.hasOwnProperty('schema') && !!parameter.schema && !!parameter.schema.$ref) {
                        splitModelName = parameter.schema.$ref.split('/');
                        splitModelName = splitModelName[splitModelName.length - 1];

                        if(!operation.models.hasOwnProperty(splitModelName)) {
                            continue;
                        }

                        params = operation.models[splitModelName];

                        if(!params.hasOwnProperty('definition')
                           || !params.definition.hasOwnProperty('properties')) {
                            continue;
                        }

                        for(var currentParam in params.definition.properties) {
                            if(!params.definition.properties.hasOwnProperty(currentParam) || !params.definition.properties[currentParam].hasOwnProperty('type')) {
                                continue;
                            }

                            subEl.appendChild(createNewSingleParameter(params.definition.properties[currentParam].type, currentParam));
                        }
                    } else {
                        subEl.appendChild(createNewSingleParameter('text', parameter.name));
                    }

                    break;
                case 'path':
                    subEl = el.querySelector('.'+defaults.classNames.pathParametersContainer);
                    subEl.appendChild(createNewSingleParameter('text', parameter.name));
                    break;
                case 'query':
                    subEl = el.querySelector('.'+defaults.classNames.queryStringParametersContainer);
                    subEl.appendChild(createNewSingleParameter('text', parameter.name));
                    break;
            }

            console.log(subEl);
            el.appendChild(subEl);
            subEl = null;
        }
    }

    function createNewSingleParameter(type, name) {
        console.log('createNewSingleParameter: '+name);
        var newParam, newLabel, newParamInput;

        newParam = document.createElement('div');
        newParam.className = defaults.classNames.singleParameter;

        newLabel = document.createElement('label');
        newLabel.textContent = name;

        switch(type) {
            default:
                newParamInput = document.createElement('input');
                newParamInput.setAttribute('id', name);
                newParamInput.setAttribute('name', name);
                newParamInput.setAttribute('placeholder', name);

                newLabel.appendChild(newParamInput);

                break;
        }

        newParam.appendChild(newLabel);

        return newParam;
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