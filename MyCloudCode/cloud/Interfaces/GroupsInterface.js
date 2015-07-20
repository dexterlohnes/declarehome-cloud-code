var StringHash = require('cloud/Utilities/StringHash.js');
var Groups = require('cloud/Controllers/Groups.js');


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

	 

	return Groups.AddUserToGroupRole(newGroup, user, adminRoleType, theHash).then(
		function(adminRole) {
			//We have added our user to the admin group, so move on
			that.adminRole = adminRole;

				return Groups.CreateRoleForGroup(newGroup, memberRoleType, theHash, that.adminRole).then(
				function(memberRole) {

					//We have added our user to the member group, so move on
					console.log(JSON.stringify(memberRole, null, 4));
					console.log("Created member group: " + memberRoleName);


					var groupACL = new Parse.ACL();
					groupACL.setPublicReadAccess(true);
					groupACL.setRoleReadAccess(adminRoleName, true);
					groupACL.setRoleReadAccess(memberRoleName, true);
					groupACL.setRoleWriteAccess(adminRoleName, true);
					newGroup.setACL(groupACL);

					
					newGroup.set("adminsRole", that.adminRole);
					newGroup.set("membersRole", memberRole);
					console.log("Created roles for the new group");
					return Parse.Promise.as(theHash);

				});
		});
};


/*
 * addUserToGroupAsMember
 * @param group The Group object we want to add our user to
 * @param user The Parse.User object we want to add to the group.members relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
exports.addUserToGroupAsMember = function addUserToGroupAsMember(user, group) {
	// Parse.Cloud.useMasterKey();
	console.log("In addUserToGroupAsMember");
	return group.fetch().then(function(theGroup) {
		console.log("Fetched the group");
		//1 Get a handle on the group's members role
		var membersRole = theGroup.get("membersRole");
		return membersRole.fetch().then(function(theRole) {
			console.log("Fetched the members role");
			console.log("The members role: " + JSON.stringify(theRole, null, 4));
			var membersRel = theRole.getUsers();
			//2 Add our user to the group's members relation
			membersRel.add(user);
			console.log("Members relation: " + JSON.stringify(membersRel, null, 4));
			return theRole.save(null, {useMasterKey:true}).then(function(theRoleAgain) {
				console.log("Saved our members role");
				//3 then Add our group to the user's memberOf relation
				var memberOf = user.relation("memberOf");
				console.log("The group: " + JSON.stringify(theGroup, null, 4));
				memberOf.add(theGroup);
				console.log("The relation after adding group, before save: " + JSON.stringify(memberOf, null, 4));

				//4 then return a promise 
				return memberOf.save(null, {useMasterKey : true	});
			});

		}, function(error) {
			console.error("Couldn't add user as member");
			console.error("Error! Code: " + error.code + ". Message: " + error.message);
			return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
		});
	});

};
/*
 * addUserToGroupsAdminsRelation
 * @param group The Group object we want to add our user to as an admin
 * @param user The Parse.User object we want to add to the group.admins relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
exports.addUserToGroupAsAdmin = function addUserToGroupAsAdmin(user, group) {
	//1 Get a handle on the group's admins relation
	var adminsRel = group.get("adminsRole").getUsers();
	//2 Add our user to the group's admins relation
	adminsRel.add(user);
	return group.save().then(function(theGroup){
		//3 then Add our group to the user's adminOf relation
		var adminOf = user.relation("adminOf");
		adminOf.add(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't add user as admin");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
};




/*
 * removeMemberFromGroup
 * @param group The Group object we want to remove our user from
 * @param user The Parse.User object we want to remove from the group.members relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
exports.removeMemberFromGroup = function removeMemberFromGroup(user, group) {
	//1 Get a handle on the group's members relation
	var membersRel = group.get("membersRole").getUsers();
	//2 Remove our user from the group's members relation
	membersRel.remove(user);
	return group.save().then(function(theGroup){
		//3 then Remove our group from the user's memberOf relation
		var memberOf = user.relation("memberOf");
		memberOf.remove(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't remove user as member");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
};

/*
 * removeAdminFromGroup
 * @param group The Group object we want to remove our user from
 * @param user The Parse.User object we want to remove from the group.admins relation
 *
 * @return A Parse.Promise object once the function is done
 */ 
exports.removeAdminFromGroup = function removeAdminFromGroup(user, group) {
	//1 Get a handle on the group's admins relation
	var adminsRel = group.get("adminsRole").getUsers();
	//2 Remove our user from the group's admins relation
	adminsRel.remove(user);
	return group.save().then(function(theGroup){
		//3 then Remove our group from the user's adminOf relation
		var adminOf = user.relation("adminOf");
		adminOf.remove(group);
		//4 then return a promise 
		return user.save();
	}, function(error){
		console.error("Couldn't remove user as member");
		return Parse.Promise.error("Error! Code: " + error.code + ". Message: " + error.message);
	});
};