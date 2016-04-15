(function(root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.Quester = factory();
  }
})(this, function() {

  var _this = this;

  _this.operationsList = [];

  _this.findParentNode = function(id, className, childObj) {
    var testObj = childObj.parentNode;
    var count = 1;

    while (!testObj || testObj.getAttribute('id') != id) {
      testObj = testObj.parentNode;
      count++;
    }

    while (testObj.className != className) {
      testObj = testObj.parentNode;
      count++;
    }

    // now you have the object you are looking for - do something with it
    return testObj;
  };

  _this.defaults = {
    url: null,
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
      parameterGroup: 'parameterGroup',
      executionContainer: 'response',
      actionsContainer: 'actions',
    },
  };

  _this.defaults.template = '<h4 class="' + _this.defaults.classNames.title + '"></h4>' +
      '<form class="' + _this.defaults.classNames.formContainer + '">' +
      '<div class="' + _this.defaults.classNames.summaryContainer + '">' +
      '<div>' +
      '<span class="' + _this.defaults.classNames.methodName + '"></span>' +
      '</div>' +
      '</div>' +
      '<div class="' + _this.defaults.classNames.parametersContainer + '">' +
      '<div class="' + _this.defaults.classNames.headerParametersContainer + '">' +
      '</div>' +
      '<div class="' + _this.defaults.classNames.pathParametersContainer + '">' +
      '</div>' +
      '<div class="' + _this.defaults.classNames.queryStringParametersContainer + '">' +
      '</div>' +
      '<div class="' + _this.defaults.classNames.formParametersContainer + '">' +
      '</div>' +
      '</div>' +
      '<div class="' + _this.defaults.classNames.actionsContainer + '">' +
      '<button type="submit" class="' + _this.defaults.classNames.actionButton + '">Submit</button>' +
      '</div>' +
      '<div class="' + _this.defaults.classNames.executionContainer + '">' +
          '<div class="errorMessage"></div>' +
      '<label>Request data: <textarea class="request"></textarea></label>' +
      '<label>Response headers: <textarea class="responseHeader"></textarea></label>' +
      '<label>Response body: <textarea class="responseBody"></textarea></label>' +
      '</div>' +
      '</form>';

  /**
   * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
   * @param obj1
   * @param obj2
   * @returns object a new object based on obj1 and obj2
   */
  function mergeOptions(obj1, obj2) {
    var obj3 = {},
        attrName;

    for (attrName in obj1) {
      if (obj1.hasOwnProperty(attrName)) {
        obj3[attrName] = obj1[attrName];
      }
    }

    for (attrName in obj2) {
      if (obj2.hasOwnProperty(attrName)) {
        obj3[attrName] = obj2[attrName];
      }
    }

    return obj3;
  }

  _this.findOperation = function(operationId) {
    return typeof _this.operationsList[operationId] !== 'undefined' ? _this.operationsList[operationId] : false;
  };

  _this.prepareOperations = function() {
    // Create an easier list of Swagger APIs.
    var apis = _this.defaults.swagger.apis, subApis;

    for (var endpoint in apis) {
      if (!apis.hasOwnProperty(endpoint) || !apis[endpoint].hasOwnProperty('apis')) {
        continue;
      }

      // Endpoints.
      endpoint = apis[endpoint];
      subApis = endpoint.apis;

      for (var operation in subApis) {
        if (!subApis.hasOwnProperty(operation) || !operation) {
          continue;
        }

        _this.operationsList[operation] = subApis[operation];
      }
    }

    console.log(_this.operationsList);

    return _this.operationsList;
  };

  _this.applyQuest = function(el) {
    var operationId = el.getAttribute('data-operation'),
        operation = _this.findOperation(operationId);

    if (!operation) {
      console.error('Operation not valid.');
      return false;
    }

    var placedElements = _this.placeElements(el, operation);
    _this.listenEvents(placedElements);
  };

  _this.listenEvents = function(el) {
    var actionButton = el.querySelector('.' + _this.defaults.classNames.actionButton);
    actionButton.addEventListener('click', _this.executeRequest, false);
  };

  _this.executeRequest = function(e) {
    e.preventDefault();

    var quester = _this.findParentNode(null, 'quester', e.target),
        operation = quester.getAttribute('data-operation'),
        form, data;

    if (_this.operationsList.hasOwnProperty(operation)) {
      operation = _this.operationsList[operation];
      form = _this.findParentNode(null, _this.defaults.classNames.formContainer, e.target);
      data = _this.compactData(form);
      console.log(data);

      if (operation.parameters[0].in === 'body') {
        data = {body: JSON.stringify(data)};
      }

      var container = quester.querySelector('.' + _this.defaults.classNames.executionContainer),
          errorMessageArea = container.querySelector('.errorMessage');

      // Clear the previous error message
      if(errorMessageArea) {
        errorMessageArea.innerHTML = null;
      }

      operation.execute(data).then(function(response) {
        _this.processResponse(response, data, operation, quester);
      }).catch(function(errorMessage) {
        _this.processResponse(new Error(errorMessage), data, operation, quester);
      });
    }
  };

  _this.processResponse = function(response, params, operation, quester) {
    // Set parameters from the arguments or scope.
    if(response instanceof Error) {
      return _this.processErrorResponse(response, params, operation, quester);
    }

    params = typeof (params) === 'undefined' ? this.params : params;
    operation = typeof (operation) === 'undefined' ? this.operation : operation;

    if(typeof(quester) === 'undefined' || !quester) {
      throw new Error('Quester DOM element not passed');
    }

    var container = quester.querySelector('.' + _this.defaults.classNames.executionContainer),
        responseBodyArea = container.querySelector('.responseBody'),
        responseHeaderArea = container.querySelector('.responseHeader'),
        requestArea = container.querySelector('.request');

    // Request data.
    requestArea.value = JSON.stringify(params);

    // Response headers.
    responseHeaderArea.value = 'Status: ' + response.status;

    if (!!response.headers) {
      responseHeaderArea.value += '\n';

      for (var header in response.headers) {
        if (!response.headers.hasOwnProperty(header)) {
          continue;
        }

        responseHeaderArea.value += header + ': ' + response.headers[header] + '\n';
      }
    }

    // Response body.
    responseBodyArea.value = response.data;
  };

  _this.processErrorResponse = function(error, params, operation, quester) {
    if(typeof(quester) === 'undefined' || !quester) {
      throw new Error('Quester DOM element not passed');
    }

    params = typeof (params) === 'undefined' ? this.params : params;
    operation = typeof (operation) === 'undefined' ? this.operation : operation;

    var container = quester.querySelector('.' + _this.defaults.classNames.executionContainer),
        errorMessageArea = container.querySelector('.errorMessage');

    if(errorMessageArea) {
      errorMessageArea.innerHTML = error.message;
    }

    console.error(error);
  };

  _this.compactData = function(form, getEmptyValues) {
    var data = {},
        inputs = form.querySelectorAll('input, textarea');

    getEmptyValues = typeof (getEmptyValues) === 'undefined' ? false : !!getEmptyValues;

    if (inputs.length > 0) {
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i], inputName = null;

        if (!!input.getAttribute('name')) {
          inputName = input.getAttribute('name');
        } else if (!!input.getAttribute('id')) {
          inputName = input.getAttribute('id');
        } else {
          continue;
        }

        if (getEmptyValues === true || input.value.length > 0) {
          data[input.getAttribute('name')] = input.value;
        }
      }
    }

    return data;
  };

  _this.placeElements = function(el, operation) {
    el.innerHTML = _this.defaults.template;

    var summary = el.querySelector('.' + _this.defaults.classNames.summaryContainer),
        title = el.querySelector('.' + _this.defaults.classNames.title),
        parameters = el.querySelector('.' + _this.defaults.classNames.parametersContainer),
        methodName = summary.querySelector('.' + _this.defaults.classNames.methodName);

    methodName.innerHTML = operation.method.toUpperCase() + ' ' + operation.path;
    title.innerHTML = operation.nickname;

    _this.placeParameters(parameters, operation);

    return el;
  };

  _this.placeParameters = function(el, operation) {
    var parameters = operation.parameters,
        len = parameters.length,
        parameter,
        params,
        subEl,
        splitModelName;

    for (var i = 0; i < len; ++i) {
      if (!parameters[i]) {
        continue;
      }

      parameter = parameters[i];

      switch (parameter.in) {
        case 'body':
        case 'formData':
          subEl = el.querySelector('.' + _this.defaults.classNames.formParametersContainer);

          if (parameter.hasOwnProperty('schema') && !!parameter.schema && !!parameter.schema.$ref) {
            _this.placeModelParameter(operation, parameter.schema.$ref, subEl);

            /*splitModelName = parameter.schema.$ref.split('/');
            splitModelName = splitModelName[splitModelName.length - 1];

            if (!operation.models.hasOwnProperty(splitModelName)) {
              continue;
            }

            params = operation.models[splitModelName];

            if (!params.hasOwnProperty('definition')
                || !params.definition.hasOwnProperty('properties')) {
              continue;
            }

            for (var currentParam in params.definition.properties) {
              if (!params.definition.properties.hasOwnProperty(currentParam) || !params.definition.properties[currentParam].hasOwnProperty('type')) {
                continue;
              }

              var property = params.definition.properties[currentParam],
                  type,
                  multiple = false,
                  values = [];

              if(property.type === 'array' && property.hasOwnProperty('items') && property.items.hasOwnProperty('type')) {
                type = property.items.type;
                multiple = true;
              } else if(property.hasOwnProperty('enum')) {
                type = 'select';
                values = property.enum;
              } else {
                type = property.type;
              }

              if(type === 'string') {
                type = 'text';
                // @todo not sure about this. should we make all textual inputs input or textarea?
              } else if(type === 'integer') {
                type = 'number';
              }

              subEl.appendChild(_this.createNewSingleParameter(currentParam, type, multiple, values));

              // name, string
              // tags, $item => string ====> text, multiple
              // status, $enum => string ====> select

            }*/
          } else {
            subEl.appendChild(_this.createNewSingleParameter(parameter.name, 'textarea'));
          }

          break;
        case 'path':
          subEl = el.querySelector('.' + _this.defaults.classNames.pathParametersContainer);
          subEl.appendChild(_this.createNewSingleParameter(parameter.name, 'text'));
          break;
        case 'query':
          subEl = el.querySelector('.' + _this.defaults.classNames.queryStringParametersContainer);
          subEl.appendChild(_this.createNewSingleParameter(parameter.name, 'text'));
          break;
        case 'header':
          subEl = el.querySelector('.' + _this.defaults.classNames.headerParametersContainer);
          subEl.appendChild(_this.createNewSingleParameter(parameter.name, 'textarea'));
          break;
      }

      el.appendChild(subEl);
      subEl = null;
    }
  };

  _this.placeModelParameter = function(operation, $ref, subEl, parentParameterName, multipleContainer) {
    var splitModelName, params;

    splitModelName = $ref.split('/');
    splitModelName = splitModelName[splitModelName.length - 1];

    if (!operation.models.hasOwnProperty(splitModelName)) {
      return false;
    }

    params = operation.models[splitModelName];

    if (!params.hasOwnProperty('definition')
        || !params.definition.hasOwnProperty('properties')) {
      return false;
    }

    var i = 0;

    for (var currentParam in params.definition.properties) {
      if (!params.definition.properties.hasOwnProperty(currentParam) || !params.definition.properties[currentParam].hasOwnProperty('type')) {
        continue;
      }

      var property = params.definition.properties[currentParam],
          type,
          multiple = false,
          values = [];

      i++;

      if(property.type === 'array' && property.hasOwnProperty('items')) {
        if(property.items.hasOwnProperty('$ref')) {
          var multipleWrapper = document.createElement('div');
          multipleWrapper.className = _this.defaults.classNames.parameterGroup;

          subEl.appendChild(multipleWrapper);

          return _this.placeModelParameter(operation, property.items.$ref, multipleWrapper, currentParam, true);
        } else if(property.items.hasOwnProperty('type')) {
          type = property.items.type;
          multiple = true;
        }
      } else if(property.hasOwnProperty('enum')) {
        type = 'select';
        values = property.enum;
      } else {
        type = property.type;
      }

      if(type === 'string') {
        type = 'text';
        // @todo not sure about this. should we make all textual inputs input or textarea?
      } else if(type === 'integer') {
        type = 'number';
      }

      if(parentParameterName) {
        currentParam = parentParameterName+'['+currentParam+']';

        if(multipleContainer) {
          currentParam = currentParam+'[]';
        }
      }

      subEl.appendChild(_this.createNewSingleParameter(currentParam, type, multiple, values));
    }
  };

  _this.createNewSingleParameter = function(name, type, multiple, values) {
    var newParam, newLabel, newParamInput, multipleButton;

    if(typeof(multiple) === 'undefined') {
      multiple = false;
    }

    if(typeof(values) === 'undefined') {
      values = [];
    }

    // Create parameter container
    newParam = document.createElement('div');
    newParam.className = _this.defaults.classNames.singleParameter;

    // Create parameter label (container of actual input element(s))
    newLabel = document.createElement('label');
    newLabel.textContent = name;

    // Create input
    newParamInput = _this.createNewSingleInput(name, type, values);

    if(multiple) {
      // Create new input create for multiple parameters
      var newInputForMultiple = function() {
        var newMultipleParamInput = _this.createNewSingleInput(name, type, values);
        newLabel.appendChild(newMultipleParamInput);
      };

      multipleButton = document.createElement('button');
      multipleButton.setAttribute('type', 'button');
      multipleButton.setAttribute('value', '+');
      multipleButton.addEventListener('click', newInputForMultiple);
      newLabel.appendChild(multipleButton);
    }

    newLabel.appendChild(newParamInput);

    newParam.appendChild(newLabel);

    return newParam;
  };

  _this.createNewSingleInput = function(name, type, values) {
    var newParamInput;

    if(typeof(values) === 'undefined') {
      values = [];
    }

    switch (type) {
      case 'number':
        newParamInput = document.createElement('input');
        newParamInput.setAttribute('type', 'number');
        newParamInput.setAttribute('name', name);
        newParamInput.setAttribute('placeholder', name);

        break;
      case 'select':
        var newOption;

        newParamInput = document.createElement('select');
        newParamInput.setAttribute('name', name);

          for(var i = 0; i < values.length; i++) {
            newOption = document.createElement('option');
            newOption.setAttribute('value', values[i]);
            newOption.innerHTML = values[i];

            newParamInput.appendChild(newOption);
          }

        break;

      case 'textarea':
        newParamInput = document.createElement('textarea');
        newParamInput.setAttribute('name', name);
        newParamInput.setAttribute('placeholder', name);

        break;

      case 'text': default:
      newParamInput = document.createElement('input');
      newParamInput.setAttribute('name', name);
      newParamInput.setAttribute('placeholder', name);

      break;
    }

    return newParamInput;
  };

  _this.initialize = function() {
    var args = Object.prototype.toString.call(arguments[0]) === '[object Array]' ? arguments[0] : Array.prototype.slice.call(arguments);

    _this.defaults = mergeOptions(_this.defaults, args[0]);

    if (!(_this.defaults.swagger instanceof SwaggerClient)) {
      if (typeof SwaggerClient !== 'undefined') {
        if (!_this.defaults.url) {
          throw new Error('Provide a SwaggerClient instance or a correct Swagger definition URL.');
        } else {
          var instance = new SwaggerClient({
            url: _this.defaults.url,
            usePromise: true
          }).then(function(client) {
                _this.initialize({swagger: client});
              });

          return false;
        }
      } else {
        throw new Error('Provide a SwaggerClient instance.');
      }
    }

    _this.prepareOperations();

    _this.process();
  };

  _this.process = function() {
    var els = document.getElementsByClassName(_this.defaults.className);

    if (!els || els.length < 1) {
      throw new Error('No quester element found.');
    }

    var len = els.length;

    for (var i = 0; i < len; ++i) {
      if (i in els) {
        _this.applyQuest(els[i]);
      }
    }
  };

  return _this.initialize;
});
/**
 @todo Process security definitions, mostly in header. They are not part of a regular parameter definitions.
 @todo Mark "required" parameters, defined under the model.
 **/