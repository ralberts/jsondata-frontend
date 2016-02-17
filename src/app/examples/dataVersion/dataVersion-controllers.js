/**
 * This file contains all necessary Angular controller definitions for 'frontend.examples.dataVersion' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
  'use strict';

  // Controller for new dataVersion creation.
  angular.module('frontend.examples.dataVersion')
    .controller('DataVersionAddController', [
      '$scope', '$state',
      'MessageService',
      'DataVersionModel',
      '_dataObjects',
      function controller(
        $scope, $state,
        MessageService,
        DataVersionModel,
        _dataObjects
      ) {
        // Store dataObjects
        $scope.dataObjects = _dataObjects;

        // Initialize dataVersion model
        $scope.dataVersion = {
          title: '',
          description: '',
          dataObject: '',
          releaseDate: new Date()
        };

        /**
         * Scope function to store new dataVersion to database. After successfully save user will be redirected
         * to view that new created dataVersion.
         */
        $scope.addDataVersion = function addDataVersion() {
          DataVersionModel
            .create(angular.copy($scope.dataVersion))
            .then(
              function onSuccess(result) {
                MessageService.success('New dataVersion added successfully');

                $state.go('examples.dataVersion', {id: result.data.id});
              }
            )
          ;
        };
      }
    ])
  ;

  // Controller to show single dataVersion on GUI.
  angular.module('frontend.examples.dataVersion')
    .controller('DataVersionController', [
      '$scope', '$state',
      'UserService', 'MessageService',
      'DataVersionModel', 'DataObjectModel',
      '_dataVersion',
      function controller(
        $scope, $state,
        UserService, MessageService,
        DataVersionModel, DataObjectModel,
        _dataVersion
      ) {
        // Set current scope reference to model
        DataVersionModel.setScope($scope, 'dataVersion');

        // Initialize scope data
        $scope.user = UserService.user();
        $scope.dataVersion = _dataVersion;
        $scope.dataObjects = [];
        $scope.selectDataObject = _dataVersion.dataObject ? _dataVersion.dataObject.id : null;

        // DataVersion delete dialog buttons configuration
        $scope.confirmButtonsDelete = {
          ok: {
            label: 'Delete',
            className: 'btn-danger',
            callback: function callback() {
              $scope.deleteDataVersion();
            }
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default pull-left'
          }
        };

        /**
         * Scope function to save the modified dataVersion. This will send a
         * socket request to the backend server with the modified object.
         */
        $scope.saveDataVersion = function saveDataVersion() {
          var data = angular.copy($scope.dataVersion);

          // Set dataObject id to update data
          data.dataObject = $scope.selectDataObject;

          // Make actual data update
          DataVersionModel
            .update(data.id, data)
            .then(
              function onSuccess() {
                MessageService.success('DataVersion "' + $scope.dataVersion.title + '" updated successfully');
              }
            )
          ;
        };

        /**
         * Scope function to delete current dataVersion. This will send DELETE query to backend via web socket
         * query and after successfully delete redirect user back to dataVersion list.
         */
        $scope.deleteDataVersion = function deleteDataVersion() {
          DataVersionModel
            .delete($scope.dataVersion.id)
            .then(
              function onSuccess() {
                MessageService.success('DataVersion "' + $scope.dataVersion.title + '" deleted successfully');

                $state.go('examples.dataVersions');
              }
            )
          ;
        };

        /**
         * Scope function to fetch dataObject data when needed, this is triggered whenever user starts to edit
         * current dataVersion.
         *
         * @returns {null|promise}
         */
        $scope.loadDataObjects = function loadDataObjects() {
          if ($scope.dataObjects.length) {
            return null;
          } else {
            return DataObjectModel
              .load()
              .then(
                function onSuccess(data) {
                  $scope.dataObjects = data;
                }
              )
            ;
          }
        };
      }
    ])
  ;

  // Controller which contains all necessary logic for dataVersion list GUI on boilerplate application.
  angular.module('frontend.examples.dataVersion')
    .controller('DataVersionListController', [
      '$scope', '$q', '$timeout',
      '_',
      'ListConfig', 'SocketHelperService',
      'UserService', 'DataVersionModel', 'DataObjectModel',
      '_items', '_count', '_dataObjects',
      '$stateParams',
      function controller(
        $scope, $q, $timeout,
        _,
        ListConfig, SocketHelperService,
        UserService, DataVersionModel, DataObjectModel,
        _items, _count, _dataObjects,
        $stateParams
      ) {
        // Set current scope reference to models
        DataVersionModel.setScope($scope, false, 'items', 'itemCount');
        DataObjectModel.setScope($scope, false, 'dataObjects');

        // Add default list configuration variable to current scope
        $scope = angular.extend($scope, angular.copy(ListConfig.getConfig()));

        // Set initial data
        $scope.items = _items;
        $scope.itemCount = _count.count;
        $scope.dataObjects = _dataObjects;
        $scope.user = UserService.user();
        $scope.filterByDataObject = $stateParams.dataObject;

        // Initialize used title items
        $scope.titleItems = ListConfig.getTitleItems(DataVersionModel.endpoint);

        // Initialize default sort data
        $scope.sort = {
          column: 'releaseDate',
          direction: false
        };

        // Initialize filters
        $scope.filters = {
          searchWord: '',
          columns: $scope.titleItems
        };

        // Function to change sort column / direction on list
        $scope.changeSort = function changeSort(item) {
          var sort = $scope.sort;

          if (sort.column === item.column) {
            sort.direction = !sort.direction;
          } else {
            sort.column = item.column;
            sort.direction = true;
          }

          _triggerFetchData();
        };

        $scope.selected = [];

        $scope.setSelected = function setSelected(data) {
          if(_.find($scope.selected, data)) {
            _.remove($scope.selected, data);
            return true;
          }
          $scope.selected.push(data);
          var old = $scope.selected.length > 2 ? $scope.selected.shift() : {};
          old.checked = false;
        };

        /**
         * Helper function to fetch specified dataObject property.
         *
         * @param   {Number}    dataObjectId        DataObject id to search
         * @param   {String}    [property]      Property to return, if not given returns whole dataObject object
         * @param   {String}    [defaultValue]  Default value if dataObject or property is not founded
         *
         * @returns {*}
         */
        $scope.getDataObject = function getDataObject(dataObjectId, property, defaultValue) {
          defaultValue = defaultValue || 'Unknown';
          property = property || true;

          // Find dataObject
          var dataObject = _.find($scope.dataObjects, function iterator(dataObject) {
            return parseInt(dataObject.id, 10) === parseInt(dataObjectId.toString(), 10);
          });

          return dataObject ? (property === true ? dataObject : dataObject[property]) : defaultValue;
        };

        /**
         * Simple watcher for 'currentPage' scope variable. If this is changed we need to fetch dataVersion data
         * from server.
         */
        $scope.$watch('currentPage', function watcher(valueNew, valueOld) {
          if (valueNew !== valueOld) {
            _fetchData();
          }
        });

        /**
         * Simple watcher for 'itemsPerPage' scope variable. If this is changed we need to fetch dataVersion data
         * from server.
         */
        $scope.$watch('itemsPerPage', function watcher(valueNew, valueOld) {
          if (valueNew !== valueOld) {
            _triggerFetchData();
          }
        });

        var searchWordTimer;

        /**
         * Watcher for 'filter' scope variable, which contains multiple values that we're interested
         * within actual GUI. This will trigger new data fetch query to server if following conditions
         * have been met:
         *
         *  1) Actual filter variable is different than old one
         *  2) Search word have not been changed in 400ms
         *
         * If those are ok, then watcher will call 'fetchData' function.
         */
        $scope.$watch('filters', function watcher(valueNew, valueOld) {
          if (valueNew !== valueOld) {
            if (searchWordTimer) {
              $timeout.cancel(searchWordTimer);
            }

            searchWordTimer = $timeout(_triggerFetchData, 400);
          }
        }, true);

        /**
         * Helper function to trigger actual data fetch from backend. This will just check current page
         * scope variable and if it is 1 call 'fetchData' function right away. Any other case just set
         * 'currentPage' scope variable to 1, which will trigger watcher to fetch data.
         *
         * @private
         */
        function _triggerFetchData() {
          if ($scope.currentPage === 1) {
            _fetchData();
          } else {
            $scope.currentPage = 1;
          }
        }

        /**
         * Helper function to fetch actual data for GUI from backend server with current parameters:
         *  1) Current page
         *  2) Search word
         *  3) Sort order
         *  4) Items per page
         *
         * Actually this function is doing two request to backend:
         *  1) Data count by given filter parameters
         *  2) Actual data fetch for current page with filter parameters
         *
         * These are fetched via 'DataVersionModel' service with promises.
         *
         * @private
         */
        function _fetchData() {
          $scope.loading = true;

          // Common parameters for count and data query
          var commonParameters = {
            where: SocketHelperService.getWhere($scope.filters)
          };

          if(!commonParameters.where.or && $scope.filterByDataObject) {
            commonParameters.where.dataObject = $scope.filterByDataObject;
          }

          // Data query specified parameters
          var parameters = {
            limit: $scope.itemsPerPage,
            skip: ($scope.currentPage - 1) * $scope.itemsPerPage,
            sort: $scope.sort.column + ' ' + ($scope.sort.direction ? 'ASC' : 'DESC')
          };

          // Fetch data count
          var count = DataVersionModel
            .count(commonParameters)
            .then(
              function onSuccess(response) {
                $scope.itemCount = response.count;
              }
            )
          ;

          // Fetch actual data
          var load = DataVersionModel
            .load(_.merge({}, commonParameters, parameters))
            .then(
              function onSuccess(response) {
                $scope.items = response;
              }
            )
          ;

          // Load all needed data
          $q
            .all([count, load])
            .finally(
              function onFinally() {
                $scope.loaded = true;
                $scope.loading = false;
              }
            )
          ;
        }
      }
    ])
  ;
}());
