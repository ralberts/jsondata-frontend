/**
 * This file contains all necessary Angular model definitions for 'frontend.json.dataObject' module.
 *
 * Note that this file should only contain models and nothing else. Also note that these "models" are just basically
 * services that wraps all things together.
 */
(function() {
  'use strict';

  /**
   * Model for DataObject API, this is used to wrap all DataObject objects specified actions and data change actions.
   */
  angular.module('frontend.json.dataObject')
    .service('DataObjectModel', [
      'DataModel',
      function(DataModel) {
        return new DataModel('dataObject');
      }
    ])
  ;
}());
