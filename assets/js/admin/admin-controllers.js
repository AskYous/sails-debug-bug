var leftNavItems = [
  {
    'name': 'Categories',
    'icon': 'extension',
    'children': ['CategoryInstances', 'Subjects']
  },{
    'name': 'CategoryInstances',
    'icon': 'extension',
    'groupBy': 'category'
  }, {
    'name': 'Subjects',
    'icon': 'book',
    'groupBy': 'category',
    'children': ['SubjectInstances', 'Courses']
  }, {
    'name': 'SubjectInstances',
    'icon': 'book',
    'groupBy': 'subject'
  }, {
    'name': 'Courses',
    'icon': 'computer',
    'groupBy': 'subject',
    'children': ['CourseInstances', 'Lessons']
  }, {
    'name': 'CourseInstances',
    'icon': 'computer',
    'groupBy': 'course',
  }, {
    'name': 'Lessons',
    'icon': 'video_library',
    'groupBy': 'course',
    'children': ['LessonInstances']
  }, {
    'name': 'LessonInstances',
    'icon': 'video_library',
    'groupBy': 'lesson'
  }, {
    'name': 'LessonInstanceReferences',
    'icon': 'list',
    'groupBy': 'lessonInstance'
  }, {
    'name': 'ReferenceTypes',
    'icon': 'list',
  }, {
    'name': 'StandardLessonElements',
    'icon': 'search',
    'groupBy': 'lessonInstance'
  }, {
    'name': 'Tags',
    'icon': 'label',
  }, {
    'name': 'Languages',
    'icon': 'language'
  }, {
    'name': 'Translations',
    'icon': 'language'
  }, {
    'name': 'Organizations',
    'icon': 'work'
  }, {
    'name': 'VisibilityLevels',
    'icon': 'visibility_off'
  }, {
    'name': 'Users',
    'icon': 'account_circle'
  }, {
    'name': 'Roles',
    'icon': 'security'
  }, {
    'name': 'VideoAnalytics',
    'icon': 'show_chart'
  }, {
    'name': 'UserLessonAnalytics',
    'icon': 'show_chart'
  },
];
var adminCtrls = angular.module('Controllers', []);
var singulars = {
  'Categories': 'Category',
  'SubjectInstances': 'Subject Instance',
  'CourseInstances': 'Course Language',
  'LessonInstances': 'Lesson Instance',
  'VisibilityLevels': 'Visibility Level'
};

// Gets the singular version of a model name
function getSingular(s) {
  return singulars[s] || s.slice(0, s.length - 1);
}
function getFriendlyAttributeName(attribute, properties) {
  if (properties.formOptions) {
    if (properties.formOptions.label) {
      return properties.formOptions.label;
    }
  }
  return attribute.charAt(0).toUpperCase() + attribute.slice(1);
}

adminCtrls.controller('homeCtrl', function () { });
adminCtrls.controller('sideNavCtrl', function ($location) {
  this.listItems = leftNavItems;
  this.getHref = function (listItem) {
    var href = "#/" + listItem.name;
    return href;
  };
  this.isActiveMenuItem = function (menuItem) {
    if ($location.path() === ''){
      return false;
    }
    var isActive = menuItem.name.toLowerCase() == $location.path().split('/')[1].toLowerCase();
    return isActive;
  };
});
adminCtrls.controller('modelListCtrl', function ($scope, $routeParams, $http, $anchorScroll) {
  var ctrl = this;

  // get the current leftnavitem to know the current' model's name and groupby
  var leftNavItem = leftNavItems.filter(function (i) { return i.name.toLowerCase() == $routeParams.model.toLowerCase(); })[0];
  ctrl.model = {
    'name': leftNavItem.name,
    'groupBy': leftNavItem.groupBy,
    'children': leftNavItem.children
  };

  // Get the attributes of the current model.
  $http.get("/api/" + ctrl.model.name + "/attributes").then(function (results) {
    // make 'id' and 'name' first.
    var attributes = ['id', 'name'];
    for (var attribute in results.data) {
      if (attributes.indexOf(attribute) == -1) {
        attributes.push(attribute);
      }
    }
    ctrl.model.attributes = {}; // initialize
    attributes.forEach(function (attr, i) { // assign each attribute
      ctrl.model.attributes[attr] = results.data[attr]; // save the attr object (or properties)
    });

    console.log('Attributes', ctrl.model.attributes);

    // show all attributes by default.
    for (var key in ctrl.model.attributes) {
      ctrl.model.attributes[key].show = true;
    }

  }, function (error) { return console.error(error); });

  ctrl.getFriendlyAttributeName = getFriendlyAttributeName;
  ctrl.showAllAttributes = true;
  ctrl.toggleAllAttributes = function (showAll) {
    for (var key in ctrl.model.attributes) {
      ctrl.model.attributes[key].show = showAll;
    }
  };

  // determines the object type (for table view)
  ctrl.objectType = function (object) {
    return typeof object;
  };

  var uri = "/api/" + ctrl.model.name;
  if (ctrl.model.groupBy) {
    uri = uri + ("/?sort=" + ctrl.model.groupBy + " DESC");
    ctrl.groupByOptions = [];
  }
  else {
    uri = uri + "/?sort=createdAt DESC";
  }

  // a custom filter for the items.
  ctrl.groupByFilter = function (item) {
    if (!ctrl.model.groupBy)
    return true;
    if (ctrl.groupByOption == 'all')
    return true;
    return item[ctrl.model.groupBy].id == ctrl.groupByOption;
  };
  $http.get(uri).then(function (results) {
    results = results.data; // get results

    // console log results
    if (console.table)
    console.table(results);
    else
    console.log(results);

    ctrl.model.items = results; // save results
    if (ctrl.model.children !== undefined) {
      var parentIds_1 = ctrl.model.items.map(function (item) { return item.id; });
      ctrl.model.items.forEach(function (parent) { parent.children = {}; }); // initialize .children
      ctrl.model.children.forEach(function (child) { // for each child
        ctrl.model.items.forEach(function (parent) { parent.children[child] = []; });
        var singularParentModelName = getSingular(ctrl.model.name).toLowerCase().replace(' ', '');
        $http.get("/api/" + child + "?where={\"" + singularParentModelName + "\":[" + parentIds_1 + "]}").then(function (response) {
          var children = response.data;
          parentIds_1.forEach(function (parentId) {
            var parent = ctrl.model.items.filter(function (item) { return item.id == parentId; })[0];
            parent.children[child] = children.filter(function (child) {
              return child[singularParentModelName].id == parentId;
            });
          });
        }, function (error) { return console.error(error); });
      });
    }
    if (ctrl.model.groupBy) { // if group by is supported
      ctrl.model.items.forEach(function (item) {  // for each item
        var itemsGroupBy = item[ctrl.model.groupBy];// item's group by, (or item's parent). But is this just an id number, or the whole model
        // if no parent, make one.
        if (!itemsGroupBy) {
          item[ctrl.model.groupBy] = { 'name': "(No " + ctrl.model.groupBy + ")" };
          itemsGroupBy = item[ctrl.model.groupBy];
        }
        var alreadyStored = ctrl.groupByOptions.filter(function (item) { return item.id == itemsGroupBy.id; }).length !== 0;  // check if already stored
        // if the group by isn't stored yet
        if (!alreadyStored) {
          ctrl.groupByOptions.push(itemsGroupBy); // add the group by item
        }
      });
      // if parent is defined in url
      if ($routeParams.parent) {
        ctrl.groupByOption = ctrl.groupByOptions.filter(function (parent) { return String(parent.id) == $routeParams.parent; })[0].id.toString();
      }
    }
    if ($routeParams.highlight) {
      ctrl.highlight = $routeParams.highlight;

      // Scroll to highlighted item when ready
      $scope.$watch(function () { return document.getElementById('highlighted'); }, function (element) {
        $anchorScroll();
      });
    }
  }, function (err) {
    console.error(err);
  });
});
adminCtrls.controller('modelAddCreateCtrl', function ($scope, $http, $routeParams, $location) {
  /**
  * Current angular controller
  * @type {object}
  */
  var ctrl = this;
  ctrl.autoCompleted = false;

  // function to get friendly attribute name
  ctrl.getFriendlyAttributeName = getFriendlyAttributeName;

  // Set some the current model
  ctrl.model = {
    'modelName': $routeParams.model,
    'id': $routeParams.id
  };

  // Determine if some fields can be auto filled
  ctrl.determineIfFieldsCanBeAutoFilled = function () {
    if (ctrl.getView() != 'create')
    return;
    if (!ctrl.attributes.language)
    return;
    if (ctrl.model.modelName.indexOf('Instances') <= 0)
    return;
    var parentModel = "" + ctrl.model.modelName.split('Instances')[0].toLowerCase();
    if (!ctrl.attributes[parentModel])
    return;
    $scope.$watch(function () { return ctrl.model.details; }, function (newValue, oldValue) {
      if (newValue == oldValue)
      return;
      if (newValue.language == oldValue.language && newValue[parentModel] == oldValue[parentModel])
      return;
      var parentId = newValue[parentModel].id;
      var language = newValue.language;
      var fieldsToTryAutoFilling = ['name', 'descriptionShort', 'descriptionLong', 'visibilityLevel'];
      if (parentId && language && !ctrl.autoCompleted) {
        if (confirm("Would you like the following attributes to be auto filled? You can change them at any time:\n            " + fieldsToTryAutoFilling)) {
          ctrl.autoCompleted = true;
          $http.get("/api/" + parentModel + "s/" + parentId).then(function (results) {
            var parent = results.data;
            fieldsToTryAutoFilling.forEach(function (fieldName) { ctrl.model.details[fieldName] = parent[fieldName]; });
          });
        }
      }
    }, true);
  };

  // Set the CRUD object
  var crud = new CRUD(ctrl.model.modelName);

  // Sends user back to list screen.
  ctrl.cancel = function () {
    $location.url("" + ctrl.model.modelName);
  };

  // Returns the view name
  ctrl.getView = function () {
    return $routeParams.id === undefined ? 'create' : 'edit';
  };

  // Get attributes and details of current model
  crud.attributes(function (attributes) {
    console.log('Attributes:', attributes);
    ctrl.model.details = {};
    Object.keys(attributes).forEach(function(key){
      if(attributes[key].type == 'json'){
        /*
         * This is a fix for, what seems to be, a bug in angular material. It
         * didn't like seeing that this value was empty (since the model the
         * user editing wasn't loaded yet). So I made it [] by default. This
         * gets replaced anyways since the model is eventually loaded. If the
         * user is in create mode however, it's still find since it starts as an
         * empty array for them.
         */
        ctrl.model.details[key] = [];
      }
    });
    ctrl.attributes = attributes;
    if (attributes.duration) {
      ctrl.duration = {
        'hours': null,
        'minutes': null,
        'seconds': null
      };
    }
    $scope.$apply();
    if (ctrl.getView() == 'edit') {
      crud.read(ctrl.model.id, function (results) {
        ctrl.model.details = results;
        if (results.duration) {
          var dateObject = new Date(0, 0, 0, 0, 0, results.duration);
          ctrl.duration.hours = dateObject.getHours();
          ctrl.duration.minutes = dateObject.getMinutes();
          ctrl.duration.seconds = dateObject.getSeconds();
        }
        ctrl.setForeignTables();

        // Convert empty json (array) values to "[]"
        Object.keys(attributes).forEach(function(key){
          if(attributes[key].type == 'json'){
            if(ctrl.model.details[key] === null){
              ctrl.model.details[key] = []; // initialize it to an empty array. We never plan to actually use the 'json' type.
            }
          }
        });

        console.log('Editing model', results);

        $scope.$apply();
      }, function (err) { return console.error(err); });
    }
    else {
      ctrl.setForeignTables();
      $scope.$apply();
      ctrl.determineIfFieldsCanBeAutoFilled();
    }
  });

  // Allows access to other tables for user to select from a select input
  ctrl.setForeignTables = function () {
    for (var key in ctrl.attributes) {
      if (ctrl.attributes[key].model) {
        ctrl.setForeignTable(ctrl.attributes[key].model);
      }
      if (ctrl.attributes[key].collection) {
        if (ctrl.getView() == 'create') {
          ctrl.model.details[key] = [];
        }
      }
    }
  };

  // for the auto-complete inputs. As the user types, this search function runs... kinda.
  ctrl.queryCollectionItems = function (query, collectionName) {
    var callback = null;
    if(query == '*') {
      callback = $http.get("/api/" + collectionName);
    }
    else {
      var attributesToQuery = ['id', 'name'];
      var whereClause = {
        'or': [ ]
      };
      attributesToQuery.forEach(function(attr) {
        var or = { };
        or[attr] = { 'contains': query };
        whereClause.or.push(or);
      });
      callback = $http.get("/api/" + collectionName + "?where=" + JSON.stringify(whereClause));
    }
    callback = callback.then(function (results) { return results.data; });
    return callback;
  };

  // Gets the singular version of a model name. This is implemented above.
  ctrl.getSingular = getSingular;

  // Save function
  ctrl.save = function () {
    var view = ctrl.getView();
    ctrl.convertEmptyStringsToNulls();
    if (view == 'create') {
      ctrl.convertForeignReferencesToIds();
      crud.create(ctrl.model.details, function (id) {
        location.href = "#/" + ctrl.model.modelName + "?highlight=" + id + "#highlighted";
      }, function (error) {
        ctrl.formError = error;
        $scope.$apply();
      });
    }
    else {
      ctrl.convertForeignReferencesToIds();
      crud.update(ctrl.model.details, function (r) {
        location.href = "#/" + ctrl.model.modelName + "?highlight=" + ctrl.model.details.id + "#highlighted";
      }, function (error) {
        ctrl.formError = error;
        $scope.$apply();
      });
    }
  };

  // Function to convert foreign objects to ids
  ctrl.convertForeignReferencesToIds = function () {
    for (var key in ctrl.model.details) {
      var value = ctrl.model.details[key];
      if (value === undefined || value === null) continue;
      if (typeof value == 'number') continue; // It's already an ID.
      if (value.id) {
        ctrl.model.details[key] = value.id;
      }
      else if (Array.isArray(value) && ctrl.attributes[key].type != 'json') {
        if (value.filter(function (x) { return x.id !== undefined; }).length <= value.length) {
          ctrl.model.details[key] = value.map(function (model) { return model.id; });
        }
      }
    }
  };

  // Function to convert empty string to nulls (so it's null in db too.)
  ctrl.convertEmptyStringsToNulls = function () {
    for (var key in ctrl.model.details) {
      var value = ctrl.model.details[key];
      if (value === '' ||
      value == ' ' ||
      value == 'NaN' ||
      value == 'null') {
        ctrl.model.details[key] = null;
      }
    }
  };

  // Used when the user updates the duration fields
  ctrl.updateDuration = function () {
    var hours = ctrl.duration.hours;
    var minutes = ctrl.duration.minutes;
    var seconds = ctrl.duration.seconds;
    var calculatedDuration = (hours * (60 * 60)) + (minutes * 60) + seconds;
    ctrl.model.details.duration = calculatedDuration;
  };

  /**
  * Desides if the current model should display the duration
  * fieldset (which asks for hours, minutes, and seconds).
  * @param {string} attrName           The attribute name.
  * @param {Object} attrProperties     The attribute properties.
  */
  ctrl.useDurationFieldset = function(){
    // Means the sttributes has not been loaded yet.
    if(!ctrl.attributes) return false;
    var durationAttr = ctrl.attributes.duration;
    if(!durationAttr) return false;
    if(durationAttr.type != 'integer') return false;
    return true;
  };

  /**
  * Decides if the attribute given needs to use the duration fieldset.
  * @param {string} attrName           The attribute name.
  * @param {Object} attrProperties     The attribute properties.
  */
  ctrl.attrNeedsDurationFieldset = function(attrName, attrProperties){
    if(attrName.toLowerCase() != 'duration') return false;
    if(attrProperties.type != 'integer') return false;
    return true;
  };

  // Delete function
  ctrl.delete = function () {
    if (!confirm("Are you sure you want to delete '" + ctrl.model.details.name + "'?"))
    return;
    crud.delete(ctrl.model.details.id, function (r) {
      location.href = "#/" + ctrl.model.modelName;
      $scope.$apply();
    }, function (e) {
      console.error(e);
      alert("Something happened. Here's the error message. You can send it to Yousef if you want:\n\n " + e.data.raw.detail);
    });
  };

  // Function to set a foreign table to be available in the controller
  // Also modifies the currently editing model
  ctrl.setForeignTable = function (tableName) {
    var foreignTableCRUD = new CRUD(tableName);
    foreignTableCRUD.read(null, function (r) {
      ctrl[tableName] = r;
      var tableKey = null;
      for (var key in ctrl.attributes) {
        if (ctrl.attributes[key].model) {
          if (ctrl.attributes[key].model.toLowerCase() == tableName.toLowerCase())
          tableKey = key;
        }
        else if (ctrl.attributes[key].collection) {
          if (ctrl.attributes[key].collection.toLowerCase() == tableName.toLowerCase())
          tableKey = key;
        }
      }
      if (ctrl.model.details[tableKey] !== undefined) {
        if (!Array.isArray(ctrl.model.details[tableKey])) {
        }
        else {
          ctrl.model.details[tableKey].forEach(function (model, i) { ctrl.model.details[tableKey][i] = model.id; });
        }
        $scope.$apply();
      }
    });
  };

  // Used to determine if md-input-container should be used
  ctrl.useMdInputContainer = function (key, val) {
    if (val.model) return false;
    return true;
  };

  // Determines if attribute is allowed to be displayed for editing
  ctrl.displayAttribute = function (key, val) {
    if (val.readOnly) return false;
    if (val.primaryKey) return false;
    // if (val.type == 'array') return false;
    return true;
  };

  // Determines if an attribute is read only
  ctrl.readOnlyAttribute = function (key, val) {
    if (key == 'createdAt') return true;
    if (key == 'updatedAt') return true;
    return false;
  };

  // Determines if an attribute is required
  ctrl.isRequiredAttribute = function (attribute) {
    return ctrl.attributes[attribute].required === true;
  };

  // Determines if an attribute needs a label
  ctrl.doesntNeedLabel = function (name) {
    var noLabelNeededAttributes = [
      'boolean',
    ];
    var doesntNeedLabel = noLabelNeededAttributes.indexOf(name) > -1;
    return doesntNeedLabel;
  };

  // Determines if an attribute is not yet supported.
  ctrl.attributeNotYetSupported = function (key, val) {
    if (val.type == 'array') return true;
    if (val.type == 'json') return true;
    return false;
  };
});
