var userstatusForGroupImport = require('cloud/UserStatusForGroup.js');

Parse.Cloud.define("hello", function(request, response) {
	response.success("Hello world!");
});

Parse.Cloud.beforeSave("Group", function(request, response) {
	console.log("Printing object");
	console.log(JSON.stringify(request.object, null, 4));
	var group = request.object;
	console.log("In before save for group with name: " + group.get("name"));
	if (group.isNew()) {
		console.log("Group is new so going to create roles for new group");
		CreateRolesForNewGroup(group, request.user, request).then(
			function(hashString){
			console.log("Retreived hashstring: " + hashString);
			group.set("groupHashId", hashString);
			console.log("We created them so responding with success");
			response.success(group);
		});
	}else{
		response.success(group);
	}
});


Parse.Cloud.afterSave(Parse.User, function(request) {
	if (request.object.existed() === false) {
		//Brand new User. Let's set their ACL!
		var acl = new Parse.ACL();
		acl.setPublicReadAccess(true);
		acl.setWriteAccess(request.user.id, true);
		request.user.setACL(acl);
		request.user.save();
	}
});


function AddUserAsMemberAndAdminToGroup(group, user) {

}

function AddUserAsMemberToGroup(group, user) {

}

function AddUserAsAdminToGroup(group, user, addToRole) {

	//addToRole defaults to true
	 addToRole = typeof addToRole !== 'undefined' ? addToRole : true;

	//Use a double negative here because by default we will want to 
	if(addToRole){

	}
	//var queryAdminRole

	
}


/*
 * 	AddUserToGroupRole
 *
 *	@param group The object id of the group we are to add the user to
 *  @param user The Parse.User which we are to add to the group
 *
 *	@return A Parse.Promise once the task has been completed
 *  
 *	Adds the user to the Parse.Role which has admin or member (or other?) permissions for the group in question
 */
function AddUserToGroupRole(group, user, roleName){
	// If the group is brand new, then the role doesn't exist yet. 
	// We don't need to query to find that out

	console.log("Adding user to group " + group.id + " for rolename " + roleName);

	var queryRole = new Parse.Query(Parse.Role);
	queryRole.equalTo("name", roleName);

	return queryRole.first({
		success:function(theRole){
			//If we didn't get the role it's because it doesn't exist yet, so let's create it
			if(!theRole){
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
 * 	CreateRolesForNewGroup
 *
 *	@param newGroup This is the newly created group. This function should only be called on new groups
 */
function CreateRolesForNewGroup(newGroup, user, request) {
	// By specifying no write privileges for the ACL, we can ensure the role cannot be altered.
	var roleACL = new Parse.ACL();
	roleACL.setPublicReadAccess(true);

	var hashString = JSON.stringify(request, null, 0) + JSON.stringify(newGroup, null, 0) + JSON.stringify(user, null, 0);
	console.log("Hashing string: " + hashString);
	var theHash = hashCode(hashString);
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
}

hashCode = function(s){
  return s.split("").reduce(function(a,b){
  	a=((a<<5)-a)+b.charCodeAt(0);
  	return a&a;
  },0);              
};