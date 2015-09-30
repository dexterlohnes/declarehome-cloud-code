var Users = require('cloud/Controllers/Users.js');
var Contracts = require('cloud/Controllers/Contracts.js');
var Mail = require('cloud/Interfaces/MailInterface.js');
var Notifications = require('cloud/Interfaces/NotificationsInterface.js');

var STATUS_EXISTING_USER_INVITED = "UserInvited";
var STATUS_NON_USER_INVITED = "NonUserInvited";
var STATUS_USER_REQUESTED_MEMBERSHIP = "UserRequested";
var STATUS_CONTRACT_COMPLETED = "Signed";


/*
 * request.user The user who is requesting membership
 * request.params.groupId The id of the group user is requesting membership for
 */
Parse.Cloud.define("requestMembershipToGroup", function(request, response) {

	console.log("CloudCode: User requested membership to group");
	console.log("User id: " + request.user.id);
	console.log("Group id: " + request.params.groupId);

	var Group = Parse.Object.extend("Group");
    var group = new Group();
    group.id = request.params.groupId;

	exports.requestMembershipToGroup(request.user, group).then( function(success) {
		console.log("Created a contract for the user");
		//Send 4 since that is the new status of the user (see android/iphone source for this)
		response.success(4);	
	}, function(error) {
		console.error("Failed to create a contract for the user");
		response.error(9999);
	});
	
});


/*
 * request.user The user we are accepting membership for
 * request.params.groupId The id of the group we are searching for contracts for
 */
Parse.Cloud.define("acceptMembershipToGroup", function(request, response) {
	
	// Get a query for GroupContract objects
	var givenInvitationQuery = new Parse.Query("GroupContract");
	// Limit the query to having a pointer to the current user
	givenInvitationQuery.equalTo("invitee", request.user);

	// Limited the group pointer to the group contained in our params
	var Group = Parse.Object.extend("Group");
    var groupPlaceholder = new Group();
    groupPlaceholder.id = request.params.groupId;
    givenInvitationQuery.equalTo("group", groupPlaceholder);

    // Limit the status to "UserInvited" 
    givenInvitationQuery.equalTo("status", STATUS_EXISTING_USER_INVITED);

    givenInvitationQuery.first().then(function (theContract) {
    	if(theContract !== null && theContract !== undefined) {
		    Contracts.acceptMembershipToGroup(request.user, theContract).then(function(success) {
		    	//Send 2 since the user is now a member
				response.success(2);
			}, function(error) {
				console.error(error);
				response.error();
			});
		} else {
			response.error("No invited contract found");
		}
    }, function(error) {
    	console.error(error);
    	response.error(error);
    });
	
});

/*
 * request.user The admin who is approving membership
 * request.params.groupId The id of the group we are searching for contracts for
 * request.params.inviteeId The id of the user we are approving
 */
Parse.Cloud.define("approveMembershipForGroup", function(request, response) {

	var Group = Parse.Object.extend("Group");
    var groupPlaceholder = new Group();
    groupPlaceholder.id = request.params.groupId;

    var inviteePlaceholder = new Parse.User();
    inviteePlaceholder.id = request.params.inviteeId;


    var requestedMembershipQuery = new Parse.Query("GroupContract");
	// Limit the query to having a pointer to invitee
	requestedMembershipQuery.equalTo("invitee", inviteePlaceholder);

	// Limited the group pointer to the group contained in our params
    requestedMembershipQuery.equalTo("group", groupPlaceholder);

    // Limit the status to "UserRequested" 
    requestedMembershipQuery.equalTo("status", STATUS_USER_REQUESTED_MEMBERSHIP);

    requestedMembershipQuery.first().then(function (theContract) {
    	if(theContract !== null && theContract !== undefined) {
		    Contracts.approveMembershipForGroup(request.user, inviteePlaceholder, theContract).then(function(success) {
		    	Notifications.sendPushForUsersInvitationAcceptedForGroup(inviteePlaceholder, groupPlaceholder).then(function (success) {
		    		response.success();
		    	}, function(failure) {
		    		response.success();
		    	});
				
			}, function(error) {
				console.error(error);
				response.error();
			});
		} else {
			response.error("No request contract found");
		}
    }, function(error) {
    	console.error(error);
    	response.error(error);
    });

});


/*
 *	acceptAllOpenContractsForNewUser
 *	@param newUser A pointer to a _User who has just been created.
 *	@param contracts The array of contracts we want to accept for this user. May be null in which case we query for it then call again
 *	
 *	@return A Parse.Promise once the save completes
 */
exports.acceptAllOpenContractsForNewUser = function acceptAllOpenContractsForNewUser(newUser, contracts){
	console.log("In acceptAllOpenContractsForNewUser");
	console.log("Contracts: " + JSON.stringify(contracts, null, 4));
	if(contracts === undefined){
		return Contracts.getAllContractsForNewUser(newUser).then(function(allContracts){
			console.log("Found all the contracts: " + JSON.stringify(allContracts, null, 4));
			return acceptAllOpenContractsForNewUser(newUser, allContracts);		
		});
	}

	var nextContract = contracts.pop();
	console.log("Next contract for signing: " + JSON.stringify(nextContract, null, 4));
	if(nextContract === undefined){
		return Parse.Promise.as("Joined all of our open contracts (if there were any)");
	}else{
		Contracts.acceptMembershipToGroup(newUser, nextContract).then(function(){
			console.log("Should have joined another contract");
			acceptAllOpenContractsForNewUser(newUser, contracts);
		});
	}
	
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
			console.log("User exists so inviting a pre-existing user");
			return Contracts.inviteUserToGroup(theUser, invitedBy, group);
		} else { //If the user does not yet exist, they are not a user of Declare Home yet
			console.log("No use found so inviting non user");
			return Contracts.inviteNonUserToGroup(inviteeEmail, invitedBy, group);
		}
	}, function(error) {
		console.error("Error 40");
		return Parse.Promise.error(error);
	});
};

/*
 *	requestMembershipToGroup - This is a root level call
 *
 *	@param requester A pointer to the _User who is requesting membership
 *	@param group A pointer to a Group which the request is requesting membership in
 *	
 *	@return A Parse.Promise
 */
exports.requestMembershipToGroup = function (requester, group){
	console.log("Going to create a contract for the user");
	return Contracts.createContractWithRequsterForGroup(requester, group).then(function(theContract) {
		return Mail.sendMembershipRequestEmailToAdminsOfGroup(requester, group).then(function (success) {
			return Notifications.sendPushForUserHasRequestedMembershipForGroup(requester, group);
		});
	});
};



