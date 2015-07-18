/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/

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
	contract.set("invitee", requester);
	contract.set("group", group);

	//Save it
	return contract.save();
};