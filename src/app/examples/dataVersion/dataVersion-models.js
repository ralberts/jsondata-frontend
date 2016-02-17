/**
 * This file contains all necessary Angular model definitions for 'frontend.examples.dataVersion' module.
 *
 * Note that this file should only contain models and nothing else. Also note that these "models" are just basically
 * services that wraps all things together.
 */
(function () {
  'use strict';

  /**
   * Model for DataVersion API, this is used to wrap all DataVersion objects specified actions and data change actions.
   */
  angular.module('frontend.examples.dataVersion')
    .factory('DataVersionModel', [
      'DataModel',
      function factory(DataModel) {
        return new DataModel('dataVersion');
      }
    ])
  ;
}());
