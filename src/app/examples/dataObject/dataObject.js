/**
 * DataObject component to wrap all dataObject specified stuff together. This component is divided to following logical
 * components:
 *
 *  Controllers
 *  Models
 *
 * All of these are wrapped to 'frontend.examples.dataObject' angular module.
 */
(function() {
  'use strict';

  // Define frontend.examples.dataObject angular module
  angular.module('frontend.examples.dataObject', ['jsonFormatter']);

  // Module configuration
  angular.module('frontend.examples.dataObject')
    .config([
      '$stateProvider',
      function config($stateProvider) {
        $stateProvider
          // DataObjects list
          .state('examples.dataObjects', {
            url: '/examples/dataObjects',
            views: {
              'content@': {
                templateUrl: '/frontend/examples/dataObject/list.html',
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
          .state('examples.dataObject', {
            url: '/examples/dataObject/:id',
            views: {
              'content@': {
                templateUrl: '/frontend/examples/dataObject/dataObject.html',
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
          .state('examples.dataObject.add', {
            url: '/examples/dataObject/add',
            data: {
              access: 2
            },
            views: {
              'content@': {
                templateUrl: '/frontend/examples/dataObject/add.html',
                controller: 'DataObjectAddController'
              }
            }
          })
        ;
      }
    ])
  ;
}());
