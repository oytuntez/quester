(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Quester = factory();
    }
})(this, function () {
    var dr, request, parse, isValid, findParentNode, serializeForm, defaults, slice, toString, operationsList = [];
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

    serializeForm = function serialize(form)
    {
        if (!form || form.nodeName !== "form") {
            return;
        }
        var i, j,
            obj = {};
        for (i = form.elements.length - 1; i >= 0; i = i - 1) {
            if (form.elements[i].name === "") {
                continue;
            }
            switch (form.elements[i].nodeName) {
                case 'input':
                    switch (form.elements[i].type) {
                        case 'text':
                        case 'hidden':
                        case 'password':
                        case 'button':
                        case 'reset':
                        case 'submit':
                            obj[form.elements[i].name] = encodeURIComponent(form.elements[i].value);
                            break;
                        case 'checkbox':
                        case 'radio':
                            if (form.elements[i].checked) {
                                obj[form.elements[i].name] = encodeURIComponent(form.elements[i].value);
                            }
                            break;
                        case 'file':
                            break;
                    }
                    break;
                case 'textarea':
                    obj[form.elements[i].name] = encodeURIComponent(form.elements[i].value);
                    break;
                case 'select':
                    switch (form.elements[i].type) {
                        case 'select-one':
                            obj[form.elements[i].name] = encodeURIComponent(form.elements[i].value);
                            break;
                        case 'select-multiple':
                            for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
                                if (form.elements[i].options[j].selected) {
                                    obj[form.elements[i].name] = encodeURIComponent(form.elements[i].options[j].value);
                                }
                            }
                            break;
                    }
                    break;
                case 'button':
                    switch (form.elements[i].type) {
                        case 'reset':
                        case 'submit':
                        case 'button':
                            obj[form.elements[i].name] = encodeURIComponent(form.elements[i].value);
                            break;
                    }
                    break;
            }
        }
        return obj;
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
            parametersContainer: 'parameters',
            headerParametersContainer: 'headers',
            queryStringParametersContainer: 'queryStrings',
            formParametersContainer: 'formData',
            pathParametersContainer: 'pathParams',
            singleParameter: 'parameter',
            responseContainer: 'response',
            actionsContainer: 'actions'
        }
    };

    defaults.template = '<h4 class="'+defaults.classNames.title+'"></h4>'+
                        '<form>'+
                        '<div class="'+defaults.classNames.summaryContainer+'">'+
                            '<div>'+
                                '<span class="'+defaults.classNames.methodName+'"></span>'+
                                '<input type="text" class="'+defaults.classNames.urlBox+'"/>'+
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
                            '<button type="submit" class="'+defaults.classNames.actionButton+'"/>'+
                        '</div>'+
                        '<div class="'+defaults.classNames.responseContainer+'">'+
                            '<textarea></textarea>'+
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
            form, data;

        if(operationsList.hasOwnProperty(operation)) {
            form = e.target.querySelector('form');
            data = serializeForm(form);

            console.log(data);

            operationsList[operation].execute(data);
        }
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