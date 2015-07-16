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
	var membersRel = group.get("membersRole").getUsers();
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
	var adminsRel = group.get("adminsRole").getUsers();
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
	var membersRel = group.get("membersRole").getUsers();
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
	var adminsRel = group.get("adminsRole").getUsers();
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
function AddUserToGroupRole(group, user, roleType, hashId) {
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
 
}


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
function CreateRoleForGroup(group, roleType, hashId, superRole) {
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
}

/* 
 * 	CreateRolesForNewGroup
 *
 *	@param newGroup This is the newly created group. This function should only be called on new groups
 */
exports.CreateRolesForNewGroup = function CreateRolesForNewGroup(newGroup, user, request) {
	if(newGroup.isNew() === false){
		return Parse.Promise.error("Trying to create roles for a pre-existing group");
	}
	var that = this;
	// By specifying no write privileges for the ACL, we can ensure the role cannot be altered.
	var roleACL = new Parse.ACL();
	roleACL.setPublicReadAccess(true);

	var hashString = JSON.stringify(request, null, 0) + JSON.stringify(newGroup, null, 0) + JSON.stringify(user, null, 0);
	var theHash = StringHash.hashCode(hashString);

	
	var adminRoleType = "admin";
	var memberRoleType = "member";

	var adminRoleName = theHash + '_admin';
	var memberRoleName = theHash + '_member';

	 

	return AddUserToGroupRole(newGroup, user, adminRoleType, theHash).then(
		function(adminRole) {
			//We have added our user to the admin group, so move on
			that.adminRole = adminRole;

			// return AddUserToGroupRole(newGroup, user, memberRoleType, theHash).then(
				return CreateRoleForGroup(newGroup, memberRoleType, theHash, that.adminRole).then(
				function(memberRole) {

					//We have added our user to the member group, so move on
					console.log("C");
					console.log(JSON.stringify(memberRole, null, 4));
					console.log("Created member group: " + memberRoleName);


					var groupACL = new Parse.ACL();
					groupACL.setPublicReadAccess(true);
					groupACL.setRoleReadAccess(adminRoleName, true);
					groupACL.setRoleReadAccess(memberRoleName, true);
					groupACL.setRoleWriteAccess(adminRoleName, true);
					newGroup.setACL(groupACL);

					
					// console.log("Beginning fetch of roles");
					// return Parse.Object.fetchAll([that.adminRole, memberRole]).then(function(list){
					// 	console.log("Completed our fetch");
					// 	//Fetch our admins and member roles so we can add them to our newGroup
					// 	newGroup.set("adminsRole", list[0]);
					// 	newGroup.set("membersRole", list[1]);


					// 	console.log("Created roles for the new group");

					// 	return Parse.Promise.as(theHash);
					// });

					newGroup.set("adminsRole", that.adminRole);
					newGroup.set("membersRole", memberRole);
					console.log("Created roles for the new group");
					return Parse.Promise.as(theHash);

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