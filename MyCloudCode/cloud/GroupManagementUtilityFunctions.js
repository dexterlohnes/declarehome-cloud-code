var StringHash = require('cloud/StringHash.js');
/*
 * addUserToGroupsMembersRelation
 * @param group The Group object we want to add our user to
 * @param user The Parse.User object we want to add to the group.members relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
function addUserToGroupsMembersRelation(group, user) {
	//1 Get a handle on the group's members relation
	var membersRel = group.relation("members");
	//2 Add our user to the group's members relation
	membersRel.add(user);
	group.save().then(function(theGroup){
		//3 then Add our group to the user's memberOf relation
		var memberOf = user.relation("memberOf");
		memberOf.add(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't add user as member");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
	
}

/*
 * addUserToGroupsAdminsRelation
 * @param group The Group object we want to add our user to as an admin
 * @param user The Parse.User object we want to add to the group.admins relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
function addUserToGroupsAdminsRelation(group, user) {
	//1 Get a handle on the group's admins relation
	var adminsRel = group.relation("admins");
	//2 Add our user to the group's admins relation
	adminsRel.add(user);
	group.save().then(function(theGroup){
		//3 then Add our group to the user's adminOf relation
		var adminOf = user.relation("adminOf");
		adminOf.add(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't add user as admin");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
	
}




/*
 * removeUserFromMembersRelation
 * @param group The Group object we want to remove our user from
 * @param user The Parse.User object we want to remove from the group.members relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
function removeUserFromMembersRelation(group, user) {
	//1 Get a handle on the group's members relation
	var membersRel = group.relation("members");
	//2 Remove our user from the group's members relation
	membersRel.remove(user);
	group.save().then(function(theGroup){
		//3 then Remove our group from the user's memberOf relation
		var memberOf = user.relation("memberOf");
		memberOf.remove(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't remove user as member");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
}

/*
 * removeUserFromAdminsRelation
 * @param group The Group object we want to remove our user from
 * @param user The Parse.User object we want to remove from the group.admins relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
function removeUserFromAdminsRelation(group, user) {
	//1 Get a handle on the group's admins relation
	var adminsRel = group.relation("admins");
	//2 Remove our user from the group's admins relation
	adminsRel.remove(user);
	group.save().then(function(theGroup){
		//3 then Remove our group from the user's adminOf relation
		var adminOf = user.relation("adminOf");
		adminOf.remove(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't remove user as member");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
}


/*
 * 	AddUserToGroupRole
 *
 *	@param group The object id of the group we are to add the user to
 *  @param user The Parse.User which we are to add to the group
 *  @param roleName The 'name' field of the Role we will be adding the user to. 
 *			This is in the format ALREADY of group.groupHashId + '[admin/member]'
 *
 *	@return A Parse.Promise once the task has been completed
 *  
 *	Adds the user to the Parse.Role which has admin or member (or other?) permissions for the group in question
 */
function AddUserToGroupRole(group, user, roleName) {
	// If the group is brand new, then the role doesn't exist yet. 
	// We don't need to query to find that out

	console.log("Adding user to group " + group.id + " for rolename " + roleName);

	var queryRole = new Parse.Query(Parse.Role);
	queryRole.equalTo("name", roleName);

	return queryRole.first({
		success: function(theRole) {
			//If we didn't get the role it's because it doesn't exist yet, so let's create it
			if (!theRole) {
				console.log("The role didn't exist yet. So we're creating it");
				var roleACL = new Parse.ACL();
				roleACL.setPublicReadAccess(true);
				theRole = new Parse.Role(roleName, roleACL);
			}
			console.log("Adding role");
			theRole.getUsers().add(user);
			return theRole.save();
			// return theRole.save().then({
			// 	success:function(theRole){
			// 		console.log("Returning a saved role: ObjectID: " + savedRole.id + "name: " + savedRole.name);
			// 		return Parse.Promise.as(theRole);
			// 	}
			// });
		},
		error: function(error) {
			return Parse.Promise.error("Error hit. Code: " + error.code + ". Message: " + error.message);
		}
	});
}

/*
 * 	RemoveUserFromGroupRole
 *
 *	@param group The object id of the group we are to remove the user from
 *  @param user The Parse.User which we are to add to the group
 *  @param roleName The 'name' field of the Role we will be removing the user from. 
 *			This is in the format ALREADY of group.groupHashId + '[admin/member]'
 *
 *	@return A Parse.Promise once the task has been completed
 *  
 *	Adds the user to the Parse.Role which has admin or member (or other?) permissions for the group in question
 */
function RemoveUserFromGroupRole(group, user, roleName) {

	console.log("Adding user to group " + group.id + " for rolename " + roleName);

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
 * 	CreateRolesForNewGroup
 *
 *	@param newGroup This is the newly created group. This function should only be called on new groups
 */
exports.CreateRolesForNewGroup = function CreateRolesForNewGroup(newGroup, user, request) {
	// By specifying no write privileges for the ACL, we can ensure the role cannot be altered.
	var roleACL = new Parse.ACL();
	roleACL.setPublicReadAccess(true);

	var hashString = JSON.stringify(request, null, 0) + JSON.stringify(newGroup, null, 0) + JSON.stringify(user, null, 0);
	console.log("Hashing string: " + hashString);
	var theHash = StringHash.hashCode(hashString);
	console.log("Hash is " + theHash);

	var adminRoleName = theHash + '_admin';
	var memberRoleName = theHash + '_member';

	console.log("Admin role name will be " + adminRoleName);

	return AddUserToGroupRole(newGroup, user, adminRoleName).then(
		function(adminRole) {
			console.log("Created admin group: " + adminRoleName);

			return AddUserToGroupRole(newGroup, user, memberRoleName).then(
				function(memberRole) {
					console.log("Created member group: " + memberRoleName);

					//TODO: See if this works with an additional save
					// memberRole.relation("roles").add(adminRole);

					var groupACL = new Parse.ACL();
					groupACL.setPublicReadAccess(true);
					groupACL.setRoleReadAccess(adminRoleName, true);
					groupACL.setRoleReadAccess(memberRoleName, true);
					groupACL.setRoleWriteAccess(adminRoleName, true);
					newGroup.setACL(groupACL);




					console.log("Created roles for the new group");

					return Parse.Promise.as(theHash);

					// return newGroup.save();
				});
		});
};



// function AddUserAsAdminToGroup(group, user, addToRole) {

// 	//addToRole defaults to true
// 	 addToRole = typeof addToRole !== 'undefined' ? addToRole : true;

// 	//Use a double negative here because by default we will want to 
// 	if(addToRole){

// 	}
// 	//var queryAdminRole

// }