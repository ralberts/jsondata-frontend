/**
 * DataVersion component to wrap all dataVersion specified stuff together. This component is divided to following logical components:
 *
 *  Controllers
 *  Models
 *
 * All of these are wrapped to 'frontend.examples.dataVersion' angular module.
 */
(function() {
  'use strict';

  // Define frontend.examples.dataVersion angular module
  angular.module('frontend.examples.dataVersion', []);

  // Module configuration
  angular.module('frontend.examples.dataVersion')
    .config([
      '$stateProvider',
      function config($stateProvider) {
        $stateProvider
          // DataVersion list
          .state('examples.dataVersions', {
            url: '/examples/dataVersions',
            params: { dataObject: null },
            views: {
              'content@': {
                templateUrl: '/frontend/examples/dataVersion/list.html',
                controller: 'DataVersionListController',
                resolve: {
                  _items: [
                    'ListConfig',
                    'DataVersionModel',
                    '$stateParams',
                    function resolve(
                      ListConfig,
                      DataVersionModel,
                      $stateParams
                    ) {
                      var config = ListConfig.getConfig();

                      var parameters = {
                        limit: config.itemsPerPage,
                        sort: 'releaseDate DESC'
                      };

                      if($stateParams.dataObject) {
                        parameters.where = { dataObject: $stateParams.dataObject };
                      }

                      return DataVersionModel.load(parameters);
                    }
                  ],
                  _count: [
                    'DataVersionModel',
                    function resolve(DataVersionModel) {
                      return DataVersionModel.count();
                    }
                  ],
                  _dataObjects: [
                    'DataObjectModel',
                    function resolve(DataObjectModel) {
                      return DataObjectModel.load();
                    }
                  ]
                }
              }
            }
          })

          // Single dataVersion
          .state('examples.dataVersion', {
            url: '/examples/dataVersion/:id',
            views: {
              'content@': {
                templateUrl: '/frontend/examples/dataVersion/dataVersion.html',
                controller: 'DataVersionController',
                resolve: {
                  _dataVersion: [
                    '$stateParams',
                    'DataVersionModel',
                    function resolve(
                      $stateParams,
                      DataVersionModel
                    ) {
                      return DataVersionModel.fetch($stateParams.id, {populate: 'dataObject'});
                    }
                  ]
                }
              }
            }
          })

          // Add new dataVersion
          .state('examples.dataVersion.add', {
            url: '/examples/dataVersion/add',
            data: {
              access: 2
            },
            views: {
              'content@': {
                templateUrl: '/frontend/examples/dataVersion/add.html',
                controller: 'DataVersionAddController',
                resolve: {
                  _dataObjects: [
                    'DataObjectModel',
                    function resolve(DataObjectModel) {
                      return DataObjectModel.load();
                    }
                  ]
                }
              }
            }
          })
        ;
      }
    ])
  ;
}());
