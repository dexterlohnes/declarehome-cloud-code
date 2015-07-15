var userstatusForGroupImport = require('cloud/UserStatusForGroup.js');
var GroupManagement = require('cloud/GroupManagementUtilityFunctions.js');


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
		GroupManagement.CreateRolesForNewGroup(group, request.user, request).then(
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

