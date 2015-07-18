var Users = require('cloud/Controllers/Users.js');
var Contracts = require('cloud/Controllers/Contracts.js');
var Mail = require('cloud/Interfaces/MailInterface.js');

/*
 *	requestMembershipToGroup - This is a root level call
 *
 *	@param requester A pointer to the _User who is requesting membership
 *	@param group A pointer to a Group which the request is requesting membership in
 *	
 *	@return A Parse.Promise
 */
exports.requestMembershipToGroup = function requestMembershipToGroup(requester, group){
	return Contracts.createContractWithRequsterForGroup(requester, group)
	.then(function(theContract){	
		Mail.sendMembershipRequestEmailToAdminsOfGroup(requester, group);
	});
};

/*
 *	inviteToGroup
 *	@param inviteeEmail A string representing the email of the person being invited
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	@param group A pointer to the group which the invitee is being invited to by the invitedBy user.
 *	
 *	@return A Parse.Promise once the save completes
 */
exports.inviteToGroup = function inviteToGroup(inviteeEmail, invitedBy, group) {
	console.log("In inviteToGroup");
	return Users.getUserWithEmail(inviteeEmail).then(function(theUser) 

	{
		if (theUser) { //If the user exists, we are inviting a pre-existing user
			console.log("User exists (THEY SHOULDN'T YET THIS IS AN ERROR");
			return inviteUserToGroup(theUser, invitedBy, group);
		} else { //If the user does not yet exist, they are not a user of Declare Home yet
			console.log("No use found so inviting non user");
			return inviteNonUserToGroup(inviteeEmail, invitedBy, group);
		}
	}, function(error) {
		console.error("Error 40");
		return Parse.Promise.error(error);
	});
};

function inviteUserToGroup(invitee, invitedBy, group){
	return Contracts.createContractWithInviteeFromUserForGroup(invitee, invitedBy, group).then(function(theContract) {
		//If something isn't working, it might be because we need to wrap this line in a parse return
		Mail.sendInvitationEmailToUserFromUserForGroup(invitee, invitedBy, group);
	});
}

function inviteNonUserToGroup(inviteeEmail, invitedBy, group){
	console.log("Inviting non user to group");
	return Contracts.createContractWithNonUserInviteeEmailFromUserForGroup(inviteeEmail, invitedBy, group).then(function(theContract){
		//If something isn't working, it might be because we need to wrap this line in a parse return
		Mail.sendInvitationEmailToNonUserFromUserForGroup(inviteeEmail, invitedBy, group);
	});
}



