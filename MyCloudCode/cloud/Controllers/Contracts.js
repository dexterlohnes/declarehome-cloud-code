/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/

var GroupsInterface = require('cloud/Interfaces/GroupsInterface.js');


 var STATUS_EXISTING_USER_INVITED = "UserInvited";
 var STATUS_NON_USER_INVITED = "NonUserInvited";
 var STATUS_USER_REQUESTED_MEMBERSHIP = "UserRequested";
 var STATUS_CONTRACT_COMPLETED = "Signed";

 exports.STATUS_EXISTING_USER_INVITED = STATUS_EXISTING_USER_INVITED;
 exports.STATUS_NON_USER_INVITED = STATUS_NON_USER_INVITED;
 exports.STATUS_USER_REQUESTED_MEMBERSHIP = STATUS_USER_REQUESTED_MEMBERSHIP;
 exports.STATUS_CONTRACT_COMPLETED = STATUS_CONTRACT_COMPLETED;


 /*
 * acceptMembershipToGroup - Function called when a user wants to accept a membership into a group
 *							 that they have been invited to.
 *
 * @param invitee *_User The user who we are claiming the contract for
 * @param contract *GroupContract The contract which the user is signing
 * 
 * @return A Parse.Promise containing the signed (in the event of success) contract or an error in case it failed
 *
 */
exports.acceptMembershipToGroup = function acceptMembershipToGroup(invitee, contract){
	var emailsMatch = (invitee.get("email") === contract.get("inviteeEmail"));
	console.log("Invitee is: " + JSON.stringify(invitee, null, 4));
	console.log("Contract is: " + JSON.stringify(contract, null, 4));
	var usersMatch = contract.get("invitee") === undefined ? false : (invitee.id === contract.get("invitee").id);

	//Verify contract is for this user
	if((emailsMatch === true || usersMatch === true) === false){
		return Parse.Promise.error("This contract doesn't belong to this user");
	}

	//Verify the contract has "invitedBy" filled in
	if(contract.get("invitedBy") === undefined || contract.get("invitedBy") === null){
		return Parse.Promise.error("This contract isn't signed by an admin");
	}

	if(contract.get("status") === STATUS_USER_REQUESTED_MEMBERSHIP || contract.get("status") === STATUS_CONTRACT_COMPLETED){
		return Parse.Promise.error("This contract is not in a state for this invitee to accept membership. They either haven't been invited or they already have accepted it");
	}

	//Fill in the inviteeEmail and invitee fields
	contract.set("inviteeEmail", invitee.get("email"));
	contract.set("invitee", invitee);

	//Change status of contract
	contract.set("status", STATUS_CONTRACT_COMPLETED);

	return contract.save().then(function(cont){
		//Add user to the group
		return GroupsInterface.addUserToGroupAsMember(invitee, cont.get("group"));
	});
};

/*
 * approveMembershipForGroup - Function called when an admin wants to approve a user to join a group of which they are an admin
 *
 * @param admin *_User The user who is the admin who is signing this contract
 * @param invitee *_User The user who has requested an invitation to this group
 * @param contract *GroupContract The contract which the user is signing
 * 
 * @return A Parse.Promise containing the user who was added to the group
 *
 */
exports.approveMembershipForGroup = function approveMembershipForGroup(admin, invitee, contract){
	console.log("Admin is: " + JSON.stringify(admin, null, 4));
	console.log("Invitee is: " + JSON.stringify(invitee, null, 4));
	console.log("Contract is: " + JSON.stringify(contract, null, 4));
	var usersMatch = contract.get("invitee") === undefined ? false : (invitee.id === contract.get("invitee").id);

	//Verify contract is for this user
	if((usersMatch === true) === false){
		return Parse.Promise.error("This contract doesn't belong to this user");
	}

	//Verify the contract has "invitedBy" blank
	if((contract.get("invitedBy") === undefined || contract.get("invitedBy") === null) === false){
		return Parse.Promise.error("This contract is already signed by an admin");
	}

	if(contract.get("status") != STATUS_USER_REQUESTED_MEMBERSHIP){
		return Parse.Promise.error("This contract is not in a state for this invitee to accept membership. They either haven't been invited or they already have accepted it");
	}

	// TODO: Verify the admin is actually an admin

	//Fill in the inviteeEmail and invitee fields
	contract.set("invitedBy", admin);

	//Change status of contract
	contract.set("status", STATUS_CONTRACT_COMPLETED);

	return contract.save().then(function(cont){
		//Add user to the group
		return GroupsInterface.addUserToGroupAsMember(invitee, cont.get("group"));
	});
};

exports.getAllContractsForNewUser = function getAllContractsForNewUser(invitee){

	var GroupContract = Parse.Object.extend("GroupContract");
	var query = new Parse.Query(GroupContract);
	query.equalTo("inviteeEmail", invitee.get("email"));
	query.equalTo("status", STATUS_NON_USER_INVITED);
	//Make sure we receive each Groupcontract's 'group' property when we fetch them
	query.include("group");
	query.include("invitee");
	// query.include("group.membersRole");
	// query.include("group.membersRole.users");
	return query.find();

};

/*
 *	createContractWithInviteeEmailFromUserForGroup
 *	@param invitee A pointer to the _User who is being invited.
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	@param group A pointer to the group which the invitee is being invited to by the invitedBy user.
 *	
 *	@return A Parse.Promise once the Contract object is created and saved.
 */
exports.createContractWithInviteeFromUserForGroup = function createContractWithInviteeFromUserForGroup(invitee, invitedBy, group){
	
	//Create the contract object
	var Contract = Parse.Object.extend("GroupContract");
	var contract = new Contract();

	//Populate
	contract.set("invitee", invitee);
	contract.set("invitedBy", invitedBy);
	contract.set("group", group);
	contract.set("status", STATUS_EXISTING_USER_INVITED);

	//Save it

	return contract.save();
};

/*
 *	createContractWithNonUserInviteeEmailFromUserForGroup
 *	@param inviteeEmail A string representing the email of the (non-user) being invited
 *	@param invitedBy A pointer to a _User. The member who is inviting this person
 *	@param group A pointer to the group which the invitee is being invited to by the invitedBy user.
 *	
 *	@return A Parse.Promise once the save completes
 */
exports.createContractWithNonUserInviteeEmailFromUserForGroup = function createContractWithNonUserInviteeEmailFromUserForGroup(inviteeEmail, invitedBy, group){
	console.log("Creating new contract object");
	//Create the contract object
	var Contract = Parse.Object.extend("GroupContract");
	var contract = new Contract();

	//Populate
	contract.set("inviteeEmail", inviteeEmail);
	contract.set("invitedBy", invitedBy);
	contract.set("group", group);
	contract.set("status", STATUS_NON_USER_INVITED);

	//Save it

	return contract.save();
};


/*
 *	requestMembershipToGroup
 *	@param requester A pointer to the _User who is requesting membership
 *	@param group A pointer to a Group which the request is requesting membership in
 *	
 *	@return A Parse.Promise once the Contract is created and save completes
 */
exports.createContractWithRequsterForGroup = function createContractWithRequsterForGroup(requester, group){

	console.log("Creating the contract");

	//Create the contract
	var Contract = Parse.Object.extend("GroupContract");
	var contract = new Contract();

	//Populate
	contract.set("inviteeEmail", requester.get("email"));
	contract.set("invitee", requester);
	contract.set("group", group);
	contract.set("status", STATUS_USER_REQUESTED_MEMBERSHIP);

	console.log("Saving the contract now");
	//Save it
	return contract.save();
};

/*
 *	inviteUserToGroup
 *	@param invitee A pointer to the _User who is being invited to join 'group'
 *	@param invitedBy A pointer to the _User who invited 'invitee'
 *	@param group A pointer to a Group which the user has been invited to
 *	
 *	@return A Parse.Promise dependent on the contract being created, the mail being sent and the notification being sent
 */
exports.inviteUserToGroup = function inviteUserToGroup(invitee, invitedBy, group){
	return Contracts.createContractWithInviteeFromUserForGroup(invitee, invitedBy, group).then(function(theContract) {
		//If something isn't working, it might be because we need to wrap this line in a parse return
		return Mail.sendInvitationEmailToUserFromUserForGroup(invitee, invitedBy, group).then(function (success) {
			return Notifications.sendPushForUserHasBeenInvitedToGroup(invitee, invitedBy, group);
		})
	});
}

/*
 *	inviteNonUserToGroup
 *	@param inviteeEmail A string of the email address of the non-user invitee we are creating a contract for
 *	@param invitedBy A pointer to the _User who invited the invitee
 *	@param group A pointer to a Group which the user has been invited to
 *	
 *	@return A Parse.Promise dependent on the contract being created, the mail being sent and the notification being sent
 */
exports.inviteNonUserToGroup = function inviteNonUserToGroup(inviteeEmail, invitedBy, group){
	console.log("Inviting non user to group");
	return Contracts.createContractWithNonUserInviteeEmailFromUserForGroup(inviteeEmail, invitedBy, group).then(function(theContract){
		//If something isn't working, it might be because we need to wrap this line in a parse return
		return Mail.sendInvitationEmailToNonUserFromUserForGroup(inviteeEmail, invitedBy, group);
	});
}
