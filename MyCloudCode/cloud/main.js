var userstatusForGroupImport = require('cloud/UserStatusForGroup.js');
var GroupsInterface = require('cloud/Interfaces/GroupsInterface.js');
var ContractsMod = require('cloud/Interfaces/ContractsInterface.js');


// function inviteToGroup(inviteeEmail, invitedBy, group) {

Parse.Cloud.define("inviteToGroup", function(request, response) {
	//Might have to change this to .get("inviteeEmail");

	var Group = Parse.Object.extend("Group");
    var group = new Group();
    group.id = request.params.groupId;

    console.log("Fetching group with id: " + group.id);
	group.fetch().then(function(){
		console.log("Fetch finished. Now to invite to group");
		ContractsMod.inviteToGroup(request.params.inviteeEmail, request.user, group)
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
			if(group.get("groupHashId") === null){
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
		//Brand new User. Let's set their ACL!
		var acl = new Parse.ACL();
		acl.setPublicReadAccess(true);
		acl.setWriteAccess(request.user.id, true);
		request.user.setACL(acl);
		request.user.save();
	}
});

