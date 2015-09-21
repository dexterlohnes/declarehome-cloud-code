/*
 *	sendInvitationEmailToUserFromUserForGroup
 *	@param invitee A pointer to the _User who has been invited and is now being emailed
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	
 *	@return A Parse.Promise once the save completes
 */
exports.sendInvitationEmailToUserFromUserForGroup = function sendInvitationEmailToUserFromUserForGroup(invitee, invitedBy, group){
	console.log("EMAIL INVITATION TO USER WILL HAPPEN HERE");
};

/*
 *	sendInvitationEmailToNonUserFromUserForGroup
 *	@param inviteeEmail A string representing the email of the (non-user) we are inviting
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	
 *	@return A Parse.Promise once the save completes
 */
exports.sendInvitationEmailToNonUserFromUserForGroup = function sendInvitationEmailToNonUserFromUserForGroup(inviteeEmail, invitedBy, group){
	console.log("EMAIL INVITATION TO NON USERWILL HAPPEN HERE");
};

/*
 *	sendMembershipRequestEmailToAdminsOfGroup
 *	@param requester A pointer to the _User who has requested membership
 *	@param group A pointer to the Group they are being invited to. Used to populate the email
 *	
 *	@return A Parse.Promise once the save completes
 */
exports.sendMembershipRequestEmailToAdminsOfGroup = function sendMembershipRequestEmailToAdminsOfGroup(requester, group, returnPayload){
	console.log("MEMBERSHIP REQUEST EMAIL WILL HAPPEN HERE");
	console.log("Return Payload is:\n" + JSON.stringify(returnPayload, null, 4));
	return Parse.Promise.as(returnPayload);
};