/**
 * This file contains all necessary Angular controller definitions for 'frontend.examples.dataObject' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
  'use strict';

  // Controller for new dataObject creation.
  angular.module('frontend.examples.dataObject')
    .controller('DataObjectAddController', [
      '$scope', '$state',
      'MessageService', 'DataObjectModel', 'DataVersionModel',
      function controller(
        $scope, $state,
        MessageService, DataObjectModel, DataVersionModel
      ) {
        // Initialize dataObject model
        $scope.dataObject = {
          name: '',
          description: ''
        };

        /**
         * Scope function to store new dataObject to database. After successfully save user will be redirected
         * to view that new created dataObject.
         */
        $scope.addDataObject = function addDataObject() {
          if(isJSONString($scope.dataObject.description)) {
            $scope.dataObject.description = JSON.parse($scope.dataObject.description);
          }

          DataObjectModel
            .create(angular.copy($scope.dataObject))
            .then(
              function onSuccess(result) {
                MessageService.success('New dataObject added successfully');

                var newDataVersion = { title: 'Version 1', description: result.data.description, releaseDate: new Date(), dataObject: result.data.id };

                // Make actual data update
                DataVersionModel
                  .create(newDataVersion)
                  .then(
                    function onSuccess() {
                      MessageService.success('DataVersion "' + $scope.dataObject.name + '" updated successfully');

                      $state.go('examples.dataObject', {id: result.data.id});
                    }
                  )
                ;
              }
            )
          ;
        };

        function isJSONString(str) {
          try {
            JSON.parse(str);
          } catch (e) {
            return false;
          }
          return true;
        }

      }
    ])
  ;

  // Controller to show single dataObject on GUI.
  angular.module('frontend.examples.dataObject')
    .controller('DataObjectController', [
      '$scope', '$state',
      'UserService', 'MessageService',
      'DataObjectModel', 'DataVersionModel',
      '_dataObject', '_dataVersions', '_dataVersionsCount',
      function controller(
        $scope, $state,
        UserService, MessageService,
        DataObjectModel, DataVersionModel,
        _dataObject, _dataVersions, _dataVersionsCount
      ) {
        // Set current scope reference to models
        DataObjectModel.setScope($scope, 'dataObject');
        DataVersionModel.setScope($scope, false, 'dataVersions', 'dataVersionsCount');

        // Expose necessary data
        $scope.user = UserService.user();
        $scope.dataObject = _dataObject;
        $scope.dataVersions = _dataVersions;
        $scope.dataVersionsCount = _dataVersionsCount.count;

        // DataObject delete dialog buttons configuration
        $scope.confirmButtonsDelete = {
          ok: {
            label: 'Delete',
            className: 'btn-danger',
            callback: function callback() {
              $scope.deleteDataObject();
            }
          },
          cancel: {
            label: 'Cancel',
            className: 'btn-default pull-left'
          }
        };

        // Scope function to save modified dataObject.
        $scope.saveDataObject = function saveDataObject() {
          var data = angular.copy($scope.dataObject);
          var newVersion = ++$scope.dataVersionsCount;
          var newDataVersion = { title: 'Version ' + newVersion, description: data.description, releaseDate: new Date(), dataObject: data.id };

          $scope.dataVersions.push(newDataVersion);

          // Make actual data update
          DataVersionModel
            .create(newDataVersion)
            .then(
              function onSuccess() {
                MessageService.success('DataVersion "' + $scope.dataObject.name + '" updated successfully');
              }
            )
          ;

          // Make actual data update
          DataObjectModel
            .update(data.id, data)
            .then(
              function onSuccess() {
                MessageService.success('DataObject "' + $scope.dataObject.name + '" updated successfully');
              }
            )
          ;
        };

        // Scope function to delete dataObject
        $scope.deleteDataObject = function deleteDataObject() {
          DataObjectModel
            .delete($scope.dataObject.id)
            .then(
              function onSuccess() {
                MessageService.success('DataObject "' + $scope.dataObject.name + '" deleted successfully');

                $state.go('examples.dataObjects');
              }
            )
          ;
        };
      }
    ])
  ;

  // Controller which contains all necessary logic for dataObject list GUI on boilerplate application.
  angular.module('frontend.examples.dataObject')
    .controller('DataObjectListController', [
      '$scope', '$q', '$timeout',
      '_',
      'ListConfig',
      'SocketHelperService', 'UserService', 'DataObjectModel',
      '_items', '_count',
      function controller(
        $scope, $q, $timeout,
        _,
        ListConfig,
        SocketHelperService, UserService, DataObjectModel,
        _items, _count
      ) {
        // Set current scope reference to model
        DataObjectModel.setScope($scope, false, 'items', 'itemCount');

        // Add default list configuration variable to current scope
        $scope = angular.extend($scope, angular.copy(ListConfig.getConfig()));

        // Set initial data
        $scope.items = _items;
        $scope.itemCount = _count.count;
        $scope.user = UserService.user();

        // Initialize used title items
        $scope.titleItems = ListConfig.getTitleItems(DataObjectModel.endpoint);

        // Initialize default sort data
        $scope.sort = {
          column: 'name',
          direction: true
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

        /**
         * Simple watcher for 'currentPage' scope variable. If this is changed we need to fetch dataObject data
         * from server.
         */
        $scope.$watch('currentPage', function watcher(valueNew, valueOld) {
          if (valueNew !== valueOld) {
            _fetchData();
          }
        });

        /**
         * Simple watcher for 'itemsPerPage' scope variable. If this is changed we need to fetch dataObject data
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
         * These are fetched via 'DataObjectModel' service with promises.
         *
         * @private
         */
        function _fetchData() {
          $scope.loading = true;

          // Common parameters for count and data query
          var commonParameters = {
            where: SocketHelperService.getWhere($scope.filters)
          };

          // Data query specified parameters
          var parameters = {
            populate: 'dataVersions',
            limit: $scope.itemsPerPage,
            skip: ($scope.currentPage - 1) * $scope.itemsPerPage,
            sort: $scope.sort.column + ' ' + ($scope.sort.direction ? 'ASC' : 'DESC')
          };

          // Fetch data count
          var count = DataObjectModel
            .count(commonParameters)
            .then(
              function onSuccess(response) {
                $scope.itemCount = response.count;
              }
            )
          ;

          // Fetch actual data
          var load = DataObjectModel
            .load(_.merge({}, commonParameters, parameters))
            .then(
              function onSuccess(response) {
                $scope.items = response;
              }
            )
          ;

          // And wrap those all to promise loading
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
