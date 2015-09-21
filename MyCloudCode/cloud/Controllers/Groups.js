/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/


/*
 *	@return a Parse.Promise containing the Number 1-5 depending on what the user status
 */
exports.userStatusForGroup = function userStatusForGroup(request, response) {
	checkUserIsAdmin(request,response)
	.then(function(wasAdmin){
		console.log("Checked if the user was an admin");
		if(wasAdmin) console.log("They were"); else console.log("They weren't");
		if(wasAdmin === true) response.success(1); 
		else if(wasAdmin === false){
			console.log("Checking if user is member");
			checkUserIsMember(request, response).then(function(wasMember){
				console.log("Checked if the user was a member");
				if(wasMember) console.log("They were"); else console.log("They weren't");
				if(wasMember === true) response.success(2);
				//Implement this for 3 and 4
				else response.success(5);
			});
			// .then(response.success(5)));
		}
	});
};

/*
 * This function assumes the following params
 *
 ~ request.user
 ~ request.params.group // The id as a String of the group which we are checking the user for
 *
 * @return Parse.Promise containing a BOOL. true if the user is an admin, false elsewise
 */
 function checkUserIsAdmin(request, response, funcsArray) {

	console.log("In checkUserIsAdmin");
	console.log("Request is: " + JSON.stringify(request, null, 4));
	console.log("User is: " + JSON.stringify(request.user, null, 4));

	//Get a query limited to the groups in the user's "adminOf" relation
	var query = request.user.relation("adminOf").query();
	//Limit our query to the group passed in with our request
	query.equalTo("objectId", request.params.group);

	return query.count().then(function(theCount){
		if(theCount > 0){
			return Parse.Promise.as(true);
		}else{
			return Parse.Promise.as(false);
		}
	}, function(error){
		console.error("Error when finding if user was admin");
		console.error("Code: " + error.code + "Message:" + error.message);
		Parse.Promise.error(error);
	});

}

	
/*
 * This function assumes the following params
 *
 ~ request.user
 ~ request.params.group // The id as a String of the group which we are checking the user for
 *
 * @return Parse.Promise containing a BOOL. true if the user is a member (not an admin!), false elsewise (including if they're an admin!)
 */
 function checkUserIsMember(request, response, funcsArray) {

	console.log("In checkUserIsMember");

	//Get a query limited to the groups in the user's "adminOf" relation
	var query = request.user.relation("memberOf").query();
	//Limit our query to the group passed in with our request
	query.equalTo("objectId", request.params.group);

	return query.count().then(function(theCount){
		if(theCount > 0){
			return Parse.Promise.as(true);
		}else{
			return Parse.Promise.as(false);
		}
	}, function(error){
		console.error("Error when finding if user was member");
		console.error("Code: " + error.code + "Message:" + error.message);
		Parse.Promise.error(error);
	});

}
/*
 * 	CreateRoleForGroup
 *
 *	@param group The group we are creating 
 *  @param roleType The suffix to append to the 'name' field of the Role we will be creating
 *			This fits into the format of group.groupHashId + '{roleType}'
 *  @param superRole OPTIONAL_PARAM Passing a point to a Role here will add the superRole param under the new roles' "roles" property
 *  @param hashId OPTIONAL_PARAM Allows us to pass in a hashId for when adding
 *			users to roles for brand new groups that don't yet have their hashId set
 *
 *	@return A Parse.Promise once the task has been completed
 *  
 *	Adds the user to the Parse.Role which has admin or member (or other?) permissions for the group in question
 */
exports.CreateRoleForGroup = function CreateRoleForGroup(group, roleType, hashId, superRole) {
	// If the group is brand new, then the role doesn't exist yet. 
	// We don't need to query to find that out

	console.log("Adding user to group " + group.id + " for roleType " + roleType);
	console.log("Group Hash ID is: " + group.get("groupHashId"));

	if(typeof hashId === 'undefined'){
   		hashId = group.get("groupHashId");
 	}

 	var roleName = hashId + "_" + roleType;

 	console.log("Full roleName is: " + roleName);

	console.log("The role didn't exist yet. So we're creating it");
	var roleACL = new Parse.ACL();
	roleACL.setPublicReadAccess(true);
	var theRole = new Parse.Role(roleName, roleACL);

	if(superRole)
		theRole.getRoles().add(superRole);

	console.log("We are about to save our NEW GROUP role");
	return theRole.save().then(function(savedRole){
		console.log("We did it");
		console.log(JSON.stringify(savedRole, null, 4));
		return Parse.Promise.as(savedRole);
	});
};

/*
 * 	RemoveUserFromGroupRole
 *
 *	@param group The group we are to remove the user from
 *  @param user The Parse.User which we are to add to the group
 *  @param roleName The 'name' field of the Role we will be removing the user from. 
 *			This is in the format ALREADY of group.groupHashId + '[admin/member]'
 *
 *	@return A Parse.Promise once the task has been completed
 *  
 *	Adds the user to the Parse.Role which has admin or member (or other?) permissions for the group in question
 */
function RemoveUserFromGroupRole(group, user, roleName) {

	console.log("Removing user from group " + group.id + " for rolename " + roleName);

	var queryRole = new Parse.Query(Parse.Role);
	queryRole.equalTo("name", roleName);

	return queryRole.first({
		success: function(theRole) {
			//If we didn't get the role it's because it doesn't exist, so there's an error
			if (!theRole) {
				return Parse.Promise.error("Tried removing user from role but it doensn't exist");
			} else {
				console.log("Removing from role");
				theRole.getUsers().remove(user);
				return theRole.save();
			}
		},
		error: function(error) {
			return Parse.Promise.error("Error hit. Code: " + error.code + ". Message: " + error.message);
		}
	});
}


/*
 * 	AddUserToGroupRole
 *
 *	@param group The  group we are to add the user to
 *  @param user The Parse.User which we are to add to the group
 *  @param roleName The 'name' field of the Role we will be adding the user to. 
 *			This is in the format ALREADY of group.groupHashId + '[admin/member]'
 *  @param hashId OPTIONAL_PARAM Allows us to pass in a hashId for when adding
 *			users to roles for brand new groups that don't yet have their hashId set
 *
 *	@return A Parse.Promise once the task has been completed
 *  
 *	Adds the user to the Parse.Role which has admin or member (or other?) permissions for the group in question
 */
exports.AddUserToGroupRole = function AddUserToGroupRole(group, user, roleType, hashId) {
	// If the group is brand new, then the role doesn't exist yet. 
	// We don't need to query to find that out

	console.log("Adding user to group " + group.id + " for roleType " + roleType);
	console.log("Group Hash ID is: " + group.get("groupHashId"));

	if(typeof hashId === 'undefined'){
   		hashId = group.get("groupHashId");
 	}

 	var roleName = hashId + "_" + roleType;

 	console.log("Full roleName is: " + roleName);

	var queryRole = new Parse.Query(Parse.Role);
	queryRole.equalTo("name", roleName);

	return queryRole.first().then(function(theRole){
		if (!theRole) {
				console.log("The role didn't exist yet. So we're creating it");
				var roleACL = new Parse.ACL();
				roleACL.setPublicReadAccess(true);
				theRole = new Parse.Role(roleName, roleACL);
			}

			theRole.getUsers().add(user);
			
			return theRole.save().then(function(savedRole){
				return Parse.Promise.as(savedRole);
			});
	},function(error) {
			return Parse.Promise.error("Error hit. Code: " + error.code + ". Message: " + error.message);
	});
};

