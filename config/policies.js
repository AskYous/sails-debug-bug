/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  'Administrators': {
    '*': true,
  },
  'AuthenticationAgencies': {
    '*': 'isAdmin',
  },
  'Categories': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'Courses': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true,
    'getLanguages': true,
    'getDuration': true,
  },
  'CourseInstances': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true,
  },
  'Languages': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'Lessons': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'LessonInstances': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'LessonInstanceReferences': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'StandardLessonElements': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true,
  },
  'Organizations': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'Subjects': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'SubjectsLanguages': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'Translations': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'Users': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },
  'VideoAnalytics': {
    '*': true
  },
  'UserLessonAnalytics': {
    '*': true
  },
  'VisibilityLevels': {
    '*': 'isAdmin',
    'find': true,
    'findOne': true
  },

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
	// RabbitController: {

		// Apply the `false` policy as the default for all of RabbitController's actions
		// (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
		// '*': false,

		// For the action `nurture`, apply the 'isRabbitMother' policy
		// (this overrides `false` above)
		// nurture	: 'isRabbitMother',

		// Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
		// before letting any users feed our rabbits
		// feed : ['isNiceToAnimals', 'hasRabbitFood']
	// }
};
