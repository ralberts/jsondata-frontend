/**
 * DataObject component to wrap all dataObject specified stuff together. This component is divided to following logical
 * components:
 *
 *  Controllers
 *  Models
 *
 * All of these are wrapped to 'frontend.json.dataObject' angular module.
 */
(function() {
  'use strict';

  // Define frontend.json.dataObject angular module
  angular.module('frontend.json.dataObject', ['jsonFormatter']);

  // Module configuration
  angular.module('frontend.json.dataObject')
    .config([
      '$stateProvider',
      function config($stateProvider) {
        $stateProvider
          // DataObjects list
          .state('json.dataObjects', {
            url: '/json/dataObjects',
            views: {
              'content@': {
                templateUrl: '/frontend/json/dataObject/list.html',
                controller: 'DataObjectListController',
                resolve: {
                  _items: [
                    'ListConfig',
                    'DataObjectModel',
                    function resolve(
                      ListConfig,
                      DataObjectModel
                    ) {
                      var config = ListConfig.getConfig();

                      var parameters = {
                        populate: 'dataVersions',
                        limit: config.itemsPerPage,
                        sort: 'name ASC'
                      };

                      return DataObjectModel.load(parameters);
                    }
                  ],
                  _count: [
                    'DataObjectModel',
                    function resolve(DataObjectModel) {
                      return DataObjectModel.count();
                    }
                  ]
                }
              }
            }
          })

          // Single dataObject
          .state('json.dataObject', {
            url: '/json/dataObject/:id',
            views: {
              'content@': {
                templateUrl: '/frontend/json/dataObject/dataObject.html',
                controller: 'DataObjectController',
                resolve: {
                  _dataObject: [
                    '$stateParams',
                    'DataObjectModel',
                    function resolve(
                      $stateParams,
                      DataObjectModel
                    ) {
                      return DataObjectModel.fetch($stateParams.id);
                    }
                  ],
                  _dataVersions: [
                    '$stateParams',
                    'DataVersionModel',
                    function resolve(
                      $stateParams,
                      DataVersionModel
                    ) {
                      return DataVersionModel.load({dataObject: $stateParams.id});
                    }
                  ],
                  _dataVersionsCount: [
                    '$stateParams',
                    'DataVersionModel',
                    function resolve(
                      $stateParams,
                      DataVersionModel
                    ) {
                      return DataVersionModel.count({dataObject: $stateParams.id});
                    }
                  ]
                }
              }
            }
          })

          // Add new dataObject
          .state('json.dataObject.add', {
            url: '/json/dataObject/add',
            data: {
              access: 2
            },
            views: {
              'content@': {
                templateUrl: '/frontend/json/dataObject/add.html',
                controller: 'DataObjectAddController'
              }
            }
          })
        ;
      }
    ])
  ;
}());
