/**
 * DataVersion component to wrap all dataVersion specified stuff together. This component is divided to following logical components:
 *
 *  Controllers
 *  Models
 *
 * All of these are wrapped to 'frontend.json.dataVersion' angular module.
 */
(function() {
  'use strict';

  // Define frontend.json.dataVersion angular module
  angular.module('frontend.json.dataVersion', []);

  // Module configuration
  angular.module('frontend.json.dataVersion')
    .config([
      '$stateProvider',
      function config($stateProvider) {
        $stateProvider
          // DataVersion list
          .state('json.dataVersions', {
            url: '/json/dataVersions',
            params: { dataObject: null },
            views: {
              'content@': {
                templateUrl: '/frontend/json/dataVersion/list.html',
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
          .state('json.dataVersion', {
            url: '/json/dataVersion/:id',
            views: {
              'content@': {
                templateUrl: '/frontend/json/dataVersion/dataVersion.html',
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
          .state('json.dataVersion.add', {
            url: '/json/dataVersion/add',
            data: {
              access: 2
            },
            views: {
              'content@': {
                templateUrl: '/frontend/json/dataVersion/add.html',
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
