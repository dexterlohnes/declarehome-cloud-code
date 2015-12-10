var Settings = require('cloud/Settings.js');/*
 *	getUserWithEmail
 *	@param email The email of the user we are finding.
 *	
 *	@return A Parse.Promise which will contains the User (or null) once it completes
 */
exports.getUserWithEmail = function getUserWithEmail(email){
	var query = new Parse.Query(Parse.User);
	query.equalTo("email", email); // find all the women
	return query.first();
};

/*
 *	getAdminsOfGroup
 *	@param group The group we are finding admins of
 *	
 *	@return A Parse.Promise which will contains the Users (or an empty array? or null?) once it completes
 */
exports.getAdminsOfGroup = function getAdminsOfGroup(group){
	var adminsRole = group.get("adminsRole");
	return adminsRole.query.find();
};