var userstatusForGroupImport = require('cloud/UserStatusForGroup.js');
var GroupsInterface = require('cloud/Interfaces/GroupsInterface.js');
var ContractsInterface = require('cloud/Interfaces/ContractsInterface.js');


Parse.Cloud.afterSave("Group", function(request) {
	var group = request.object;

	if(group.get("rolesInitialized") === false || group.get("rolesInitialized") === undefined){
		//TODO: Clean this up in next refactor

		var membersRole = group.get("membersRole");

		var adminsRole = group.get("adminsRole");

		var roles = [];

		console.log("In after save for group");

		membersRole.fetch().then(function(){
			console.log("Members Role: " + JSON.stringify(membersRole, null, 4));
			if(membersRole.get("group") === undefined){
			console.log("Group was undefined for membersRole so setting and saving");
			membersRole.set("group", group);
			roles.push(membersRole);
			membersRole.save(null, {useMasterKey: true});
			}
		});

		
		adminsRole.fetch().then(function(){
			console.log("Admins Role: " + JSON.stringify(adminsRole, null, 4));
			if(adminsRole.get("group") === undefined){
				console.log("Group was undefined for adminsRole so setting and saving");
				adminsRole.set("group", group);
				roles.push(adminsRole);
				adminsRole.save(null, {useMasterKey: true});
			}
		});

		group.set("rolesInitialized", true);
		group.save();

	}

});

Parse.Cloud.define("inviteToGroup", function(request, response) {
	//Might have to change this to .get("inviteeEmail");

	var Group = Parse.Object.extend("Group");
    var group = new Group();
    group.id = request.params.groupId;

    console.log("Fetching group with id: " + group.id);
	group.fetch().then(function(){
		console.log("Fetch finished. Now to invite to group");
		ContractsInterface.inviteToGroup(request.params.inviteeEmail, request.user, group)
		.then(function(succeeded){
			response.success("Whoopee it worked!");
		});
	}, function(error){
		console.error("Sending of invitation failed"); //TODO: Make this more informative. What group, who invited, who invitee?
		response.error(error);
	});
});

Parse.Cloud.beforeSave("Group", function(request, response) {
	console.log("Printing object");
	console.log(JSON.stringify(request.object, null, 4));
	var group = request.object;
	console.log("In before save for group with name: " + group.get("name"));
	if (group.isNew()) {
		console.log("Group is new so going to create roles for new group");
		GroupsInterface.CreateRolesForNewGroup(group, request.user, request).then(
			function(hashString){
			console.log("Retreived hashstring: " + hashString);
			if(group.get("groupHashId") === undefined){
				console.log("groupHashId is still null, setting now");
				group.set("groupHashId", hashString);	
			}
			console.log("We created them so responding with success");
			var adminOf = request.user.relation("adminOf");
			// adminOf.add(group);
			response.success(group);
		});
	}else{
		response.success(group);
	}
});

// Parse.Cloud.beforeSave("Role", function(request, response) {
// 	var hashId;
// 	var isMemberRole;
// 	var isAdminRole;

// 	var operation = request.operation.op(users);

// 	//get our array of added users
// 	var usersAdded = operation.added();

// 	//get our array of removed users
// 	operation.

// }


// TODO: Move this to beforeSave, save us an entire api call cycle
Parse.Cloud.afterSave(Parse.User, function(request) {
	if (request.object.existed() === false) {
		console.log("Going to try to accept all contract for new user");
		ContractsInterface.acceptAllOpenContractsForNewUser(request.user).then(function(){
			//Brand new User. Let's set their ACL!
			console.log("Now setting new user's ACL");
			var acl = new Parse.ACL();
			acl.setPublicReadAccess(true);
			acl.setWriteAccess(request.user.id, true);
			request.user.setACL(acl);
			request.user.save();
		});
		//We want to find all open contracts for this user and accept them 

		
	}
});

