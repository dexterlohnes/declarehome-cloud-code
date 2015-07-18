/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/

 var STATUS_EXISTING_USER_INVITED = "UserInvited";
 var STATUS_NON_USER_INVITED = "NonUserInvited";
 var STATUS_USER_REQUESTED_MEMBERSHIP = "UserRequested";
 var STATUS_CONTRACT_COMPLETED = "Signed";


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
function acceptMembershipToGroup(invitee, contract){
	//Verify contract is for this user
	//Verify the contract has "invitedBy" filled in
	//Fill in the inviteeEmail and invitee fields
	//Change status of contract
	//Add user to the group
	
}

function getAllContractsForNewUser(invitee){
	
}

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
	//Create the contract
	var Contract = Parse.Object.extend("GroupContract");
	var contract = new Contract();

	//Populate
	contract.set("inviteeEmail", requester.get("email"));
	contract.set("invitee", requester);
	contract.set("group", group);
	contract.set("status", STATUS_USER_REQUESTED_MEMBERSHIP);

	//Save it
	return contract.save();
};