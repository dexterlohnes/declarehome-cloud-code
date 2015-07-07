Parse.Cloud.define("hello", function(request, response) {
	response.success("Hello world!");
});

Parse.Cloud.afterSave("Group", function(request) {

	if (request.object.existed() === false) {
		//This object didn't exist before this save, which means it's BRAND SPANKIN NEW!
		//And so we...
		CreateRolesForNewGroup(request.object, request.user);
	}
});


function CreateRolesForNewGroup(newGroup, user) {
	// By specifying no write privileges for the ACL, we can ensure the role cannot be altered.
	var roleACL = new Parse.ACL();
	roleACL.setPublicReadAccess(true);

	var adminRoleName = newGroup.id + '_admin';
	var memberRoleName = newGroup.id + '_member';

	var groupAdminRole = new Parse.Role(adminRoleName, roleACL);
	var groupMemberRole = new Parse.Role(memberRoleName, roleACL);

	groupAdminRole.getUsers().add(user);
	groupMemberRole.getUsers().add(user);

	groupAdminRole.save().then(
		function() { // The save was successful.
			console.log("Created admin group: " + adminRoleName);

			//Saving the admin was successful, so now save the Members group
			groupMemberRole.getRoles().add(groupAdminRole);
			groupMemberRole.save().then(
				function() { // Saving the member role was successful, so now update the Group's ACL
					console.log("Created member group: " + memberRoleName);

					
					var groupACL = new Parse.ACL();
					groupACL.setPublicReadAccess(true);
					groupACL.setRoleReadAccess(adminRoleName, true);
					groupACL.setRoleReadAccess(memberRoleName, true);
					groupACL.setRoleWriteAccess(adminRoleName, true);
					newGroup.setACL(groupACL);
					newGroup.save();
				},
				function(error) { // The save failed.  Error is an instance of Parse.Error.
					console.log("FAILURE to create member group: " + memberRoleName);
					console.log("Code: " + error.code);
					console.log("Message: " + error.message);
				});
		},
		function(error) { // The save failed.  Error is an instance of Parse.Error.
			console.log("FAILURE to create admin group: " + adminRoleName);
			console.log("Code: " + error.code);
			console.log("Message: " + error.message);
		});
}