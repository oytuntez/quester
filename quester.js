(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Quester = factory();
    }
})(this, function () {
    var self = this;

    this.operationsList = [];

    this.findParentNode = function(id, className, childObj) {
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

    this.defaults = {
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

    this.defaults.template = '<h4 class="'+this.defaults.classNames.title+'"></h4>'+
                        '<form class="'+this.defaults.classNames.formContainer+'">'+
                        '<div class="'+this.defaults.classNames.summaryContainer+'">'+
                            '<div>'+
                                '<span class="'+this.defaults.classNames.methodName+'"></span>'+
                            '</div>'+
                        '</div>'+
                        '<div class="'+this.defaults.classNames.parametersContainer+'">'+
                            '<div class="'+this.defaults.classNames.headerParametersContainer+'">'+
                            '</div>'+
                            '<div class="'+this.defaults.classNames.pathParametersContainer+'">'+
                            '</div>'+
                            '<div class="'+this.defaults.classNames.queryStringParametersContainer+'">'+
                            '</div>'+
                            '<div class="'+this.defaults.classNames.formParametersContainer+'">'+
                            '</div>'+
                        '</div>'+
                        '<div class="'+this.defaults.classNames.actionsContainer+'">'+
                            '<button type="submit" class="'+this.defaults.classNames.actionButton+'">Submit</button>'+
                        '</div>'+
                        '<div class="'+this.defaults.classNames.executionContainer+'">'+
                            '<label>Request data: <textarea class="request"></textarea></label>'+
                            '<label>Response headers: <textarea class="responseHeader"></textarea></label>'+
                            '<label>Response body: <textarea class="responseBody"></textarea></label>'+
                        '</div>'+
                        '</form>';


    this.findOperation = function(operationId) {
        return typeof self.operationsList[operationId] !== 'undefined' ? self.operationsList[operationId] : false;
    };

    this.prepareOperations = function() {
        // Create an easier list of Swagger APIs.
        var apis = this.defaults.swagger.apis, subApis;

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

                self.operationsList[operation] = subApis[operation];
            }
        }
    };

    this.applyQuest = function(el) {
        var operationId = el.getAttribute('data-operation'),
            operation = self.findOperation(operationId);

        if(!operation) {
            console.log('Operation not valid.');
            return false;
        }

        var placedElements = self.placeElements(el, operation);
        self.listenEvents(placedElements);
    };

    this.listenEvents = function(el) {
        var actionButton = el.querySelector('.'+this.defaults.classNames.actionButton);
        actionButton.addEventListener('click', self.executeRequest, false);
    };

    this.executeRequest = function(e) {
        e.preventDefault();

        var quester = self.findParentNode(null, 'quester', e.target),
            operation = quester.getAttribute('data-operation'),
            form, data;

        if(self.operationsList.hasOwnProperty(operation)) {
            operation = self.operationsList[operation];
            form = self.findParentNode(null, this.defaults.classNames.formContainer, e.target);
            data = self.compactData(form);

            if(operation.parameters[0].in === 'body') {
                data = {body: JSON.stringify(data)};
            }

            var responseProcessor = self.processResponse.bind({quester: quester, params: data});

            operation.execute(data, responseProcessor, responseProcessor);
        }
    };

    this.processResponse = function(response, params, quester) {
        console.log(response);

        quester = typeof(quester) === 'undefined' ? this.quester : quester;
        params = typeof(params) === 'undefined' ? this.params : params;

        var container = quester.querySelector('.'+this.defaults.classNames.executionContainer),
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
    };

    this.compactData = function(form, getEmptyValues) {
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
    };

    this.placeElements = function(el, operation) {
        el.innerHTML = this.defaults.template;

        var summary = el.querySelector('.'+this.defaults.classNames.summaryContainer),
            title = el.querySelector('.'+this.defaults.classNames.title),
            parameters = el.querySelector('.'+this.defaults.classNames.parametersContainer),
            methodName = summary.querySelector('.'+this.defaults.classNames.methodName);



        methodName.innerHTML = operation.method.toUpperCase() + ' ' + operation.path;
        title.innerHTML = operation.nickname;
        console.log(parameters);
        self.placeParameters(parameters, operation);

        return el;
    };

    this.placeParameters = function(el, operation) {
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
                    subEl = el.querySelector('.'+this.defaults.classNames.formParametersContainer);

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

                            subEl.appendChild(self.createNewSingleParameter(params.definition.properties[currentParam].type, currentParam));
                        }
                    } else {
                        subEl.appendChild(self.createNewSingleParameter('text', parameter.name));
                    }

                    break;
                case 'path':
                    subEl = el.querySelector('.'+this.defaults.classNames.pathParametersContainer);
                    subEl.appendChild(self.createNewSingleParameter('text', parameter.name));
                    break;
                case 'query':
                    subEl = el.querySelector('.'+this.defaults.classNames.queryStringParametersContainer);
                    subEl.appendChild(self.createNewSingleParameter('text', parameter.name));
                    break;
            }

            console.log(subEl);
            el.appendChild(subEl);
            subEl = null;
        }
    };

    this.createNewSingleParameter = function(type, name) {
        console.log('createNewSingleParameter: '+name);
        var newParam, newLabel, newParamInput;

        newParam = document.createElement('div');
        newParam.className = this.defaults.classNames.singleParameter;

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
    };

    this.initialize = function() {
        var args = Object.prototype.toString.call(arguments[0]) === '[object Array]' ? arguments[0] : Array.prototype.slice.call(arguments);

        if(typeof SwaggerClient === 'undefined' || !(args[0] instanceof SwaggerClient)) {
            throw new Error('Provide a SwaggerClient instance.');
        }

        self.defaults.swagger = (args[0] instanceof SwaggerClient) ? args[0] : SwaggerClient;

        console.log('Quester initialized.');

        self.prepareOperations();
        self.process();
    };

    this.process = function() {
        var els = document.getElementsByClassName(this.defaults.className);

        if(!els || els.length < 1) {
            throw new Error('No quester element found.');
        }

        var len = els.length;

        for (var i=0; i<len; ++i) {
            if (i in els) {
                self.applyQuest(els[i]);
                console.log('Questered element '+i);
            }
        }
    };

    function Quester() {

    }

    return this.initialize;
});