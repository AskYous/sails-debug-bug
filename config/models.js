/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

module.exports.models = {

  // validation options that will be available for all models to use.
  types: {
    /** Sails will think this is a validation rule, but I'm just using it to make 'formOptions' available for models to use.
     * Form options should be used in the attributes of a model as helpers.
     */
    'formOptions': function () { return true; },
    'readOnly': function () { return true; } // to make an attribute read-only
  },

  /***************************************************************************
  *                                                                          *
  * Your app's default connection. i.e. the name of one of your app's        *
  * connections (see `config/connections.js`)                                *
  *                                                                          *
  ***************************************************************************/
  // connection: 'localhost',
  connection: 'localDiskDb',

  /***************************************************************************
  *                                                                          *
  * How and whether Sails will attempt to automatically rebuild the          *
  * tables/collections/etc. in your schema.                                  *
  *                                                                          *
  * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html *
  *                                                                          *
  ***************************************************************************/
  migrate: 'drop', // Options are 'safe', 'alter', or 'drop'
  schema: true

};
