var Mail = require('cloud/Controllers/Mail.js');
var Groups = require('cloud/Interfaces/GroupsInterface.js');
var Settings = require('cloud/Settings.js');

/*
 *	sendInvitationEmailToUserFromUserForGroup
 *	@param invitee A pointer to the _User who has been invited and is now being emailed
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	
 *	@return A Parse.Promise once the send completes
 */
exports.sendInvitationEmailToUserFromUserForGroup = function sendInvitationEmailToUserFromUserForGroup(invitee, invitedBy, group){
	if(Settings.LogAll === true) console.log("EMAIL INVITATION TO USER WILL HAPPEN HERE");

	var invitedByDisplayName = invitedBy.get("displayName");
	var groupName = group.get("name");
	var inviteeDisplayName = invitee.get("displayName");
	var inviteeEmail = invitee.get("email");

	//Generate text
	var subjectText = 'Cooked: Invitation to join group "' + groupName + '"';
	var bodyText = 'Hi ' + inviteeDisplayName + ',\n\nYou\'ve been invited by ' + invitedByDisplayName + ' to join the group ' + groupName + '. Check the details of the group to accept your invitation.';

	return Mail.sendEmailToUser (inviteeEmail, subjectText, bodyText);

};

/*
 *	sendInvitationEmailToNonUserFromUserForGroup
 *	@param inviteeEmail A string representing the email of the (non-user) we are inviting
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	
 *	@return A Parse.Promise once the send completes
 */
exports.sendInvitationEmailToNonUserFromUserForGroup = function sendInvitationEmailToNonUserFromUserForGroup(inviteeEmail, invitedBy, group){
	if(Settings.LogAll === true) console.log("EMAIL INVITATION TO NON USERWILL HAPPEN HERE");

	var invitedByDisplayName = invitedBy.get("displayName");
	var groupName = group.get("name");
	
	//Generate text
	var subjectText = 'You\'ve been invited to a group on Cooked!';

	//Generate text
	var bodyText = 'Hello from the Cooked team, ' + ',\n\nYou\'ve been invited by ' + invitedByDisplayName + ' to join the group ' + groupName + ' on Cooked App\n\n Cooked is the #1 app for back-channel organization for social activists. Download the app and you will automatically be added to your group when you make an account with this email address.\n\n {Link to download}';

	return Mail.sendEmailToUser (inviteeEmail, subjectText, bodyText);

};

/*
 *	sendMembershipRequestEmailToAdminOfGroup
 *	
 *	This function exists so that we can have a Promise-backed method of sending to single admins
 *	@param requester A pointer to the _User who has requested membership
 *	@param admin A pointer to the _User who is the admin we are sending an email to
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	
 *	@return A Parse.Promise once ALL sends are complete
 */
sendMembershipRequestEmailToAdminOfGroup = function (requester, admin, group) {
	if(Settings.LogAll === true) console.log("MEMBERSHIP REQUEST EMAIL IS HAPPENING HERE");
	var requesterDisplayName = requester.get("displayName");
	var groupName = group.get("name");
	var adminDisplayName = admin.get("displayName");
	var adminEmail = admin.get("email");

	//Generate text
	var subjectText = requesterDisplayName + ' has requested to join "' + groupName + '"';

	//Generate text
	var bodyText = 'Hi ' + adminDisplayName + ',\n\n' + requesterDisplayName + ' has requested to join the group ' + groupName + ' on Cooked App\n\nGo to the group details for this group to Approve their request.\n\nAll the best,\nThe Cooked Team';

	return Mail.sendEmailToUser (adminEmail, subjectText, bodyText);
};

/*
 *	sendMembershipRequestEmailToAdminsOfGroup
 *	@param requester A pointer to the _User who has requested membership
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	
 *	@return A Parse.Promise once ALL sends are complete
 */
exports.sendMembershipRequestEmailToAdminsOfGroup = function sendMembershipRequestEmailToAdminsOfGroup(requester, group){
	if(Settings.LogAll === true) console.log("MEMBERSHIP REQUEST EMAIL WILL HAPPEN HERE");

	if(Settings.LogAll === true) console.log("Group: \n" + JSON.stringify(group, null, 4));

	return Groups.getAllAdminsQuery(group).then(function (query) {
		return query.find();
	}).then (function (allAdmins) {
		if(Settings.LogAll === true) console.log("Found " + allAdmins.length + " admins to send email to");

		var promises = [];

		for (var i = 0; i < allAdmins.length; i++) {
			var admin = allAdmins[i];
			promises.push(sendMembershipRequestEmailToAdminOfGroup(requester, admin, group));
	    }

	    return Parse.Promise.when(promises);
	});
};
