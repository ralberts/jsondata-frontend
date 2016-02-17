/**
 * Angular module for json component. This component is divided to following logical components:
 *
 * Each component has it own configuration for ui-router.
 */
(function() {
  'use strict';

  // Define frontend.json module
  angular.module('frontend.json', [
    'frontend.json.dataObject',
    'frontend.json.dataVersion'
  ]);

  // Module configuration
  angular.module('frontend.json')
    .config([
      '$stateProvider',
      function($stateProvider) {
        $stateProvider
          .state('json', {
            parent: 'frontend',
            data: {
              access: 1
            },
            views: {
              'content@': {
                controller: [
                  '$state',
                  function($state) {
                    $state.go('json.dataObjects');
                  }
                ]
              },
              'pageNavigation@': {
                templateUrl: '/frontend/core/layout/partials/navigation.html',
                controller: 'NavigationController',
                resolve: {
                  _items: [
                    'ContentNavigationItems',
                    function resolve(ContentNavigationItems) {
                      return ContentNavigationItems.getItems('json');
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
