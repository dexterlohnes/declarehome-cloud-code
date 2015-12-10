var userstatusForGroupImport = require('cloud/UserStatusForGroup.js');
var GroupsInterface = require('cloud/Interfaces/GroupsInterface.js');
var ContractsInterface = require('cloud/Interfaces/ContractsInterface.js');
var NotificationsInterface = require('cloud/Interfaces/NotificationsInterface.js');
var Settings = require('cloud/Settings.js');


Parse.Cloud.afterSave("Group", function(request) {
	var group = request.object;

	if(group.get("rolesInitialized") === false || group.get("rolesInitialized") === undefined){
		//TODO: Clean this up in next refactor

		var membersRole = group.get("membersRole");

		var adminsRole = group.get("adminsRole");

		var roles = [];

		if(Settings.LogAll === true) console.log("In after save for group");

		membersRole.fetch().then(function(){
			if(Settings.LogAll === true) console.log("Members Role: " + JSON.stringify(membersRole, null, 4));
			if(membersRole.get("group") === undefined){
			if(Settings.LogAll === true) console.log("Group was undefined for membersRole so setting and saving");
			membersRole.set("group", group);
			roles.push(membersRole);
			//Now just save and the user will update their own 'memberOf' array :)
			membersRole.save(null, {useMasterKey: true});
			}
		});

		
		adminsRole.fetch().then(function(){
			if(Settings.LogAll === true) console.log("Admins Role: " + JSON.stringify(adminsRole, null, 4));
			if(adminsRole.get("group") === undefined){
				if(Settings.LogAll === true) console.log("Group was undefined for adminsRole so setting and saving");
				adminsRole.set("group", group);
				roles.push(adminsRole);
				//At this time the user also does not know that they are an admin of this, so make sure they know now
				adminsRole.getUsers().add(request.user);
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

    if(Settings.LogAll === true) console.log("Fetching group with id: " + group.id);
	group.fetch().then(function(){
		if(Settings.LogAll === true) console.log("Fetch finished. Now to invite to group");
		ContractsInterface.inviteToGroup(request.params.inviteeEmail, request.user, group)
		.then(function(succeeded){
			response.success("Whoopee it worked!");
		});
	}, function(error){
		//TODO: Make this more informative. What group, who invited, who invitee?
		console.error("Sending of invitation failed"); 
		response.error(error);
	});
});

Parse.Cloud.beforeSave("Group", function(request, response) {
	console.log("BEGIN BEFORE SAVE: GROUP");
	if(Settings.LogAll === true) console.log(JSON.stringify(request.object, null, 4));
	var group = request.object;
	if(Settings.LogAll === true) console.log("In before save for group with name: " + group.get("name"));
	if (group.isNew()) {
		console.log("1. Group is new so going to create roles for new group");
		GroupsInterface.CreateRolesForNewGroup(group, request.user, request).then(
			function(hashString){
			if(Settings.LogAll === true) console.log("Retreived hashstring: " + hashString);
			if(group.get("groupHashId") === undefined){
				if(Settings.LogAll === true) console.log("groupHashId is still null, setting now");
				group.set("groupHashId", hashString);	
			}
			if(Settings.LogAll === true) console.log("We created them so responding with success");
			var adminOf = request.user.relation("adminOf");
			// adminOf.add(group);
			console.log("END BEFORE SAVE: GROUP1");
			response.success(group);
		});
	}else{
		console.log("END BEFORE SAVE: GROUP2");
		response.success(group);
	}
});





Parse.Cloud.beforeSave(Parse.Role, function(request, response) {
	console.log("BEGIN BEFORE SAVE: ROLE");
	//'roleName' is in format of "{group.groupHashId}_{[member/admin]}""
	var roleName = request.object.get("name");
	var roleIsAdmin = roleName.split("_")[1] === "admin"; //If the second half after the '_' char isn't equal to 'admin' we assume it equals 'member'

	//This is our array of promises we have to execute at the end before we call a successful response
	var promises = [];

	//We want to ensure that when we add or remove a user from a Role, that propogates to the users' management of their "memberOf" and "adminOf" relations
	//Steps for the algorithm
	//1) Get the Op.Relation object representing the changes to the Role's 'users' property this save cycle
	//2) For each user added to the Role, add Role.group to the user's "memberOf" or "adminOf" property
	//3) For each user removed from the Role, remove Role.group from the user's "memberOf" or "adminOf" property
	if(Settings.LogAll === true) console.log("Printing role in beforesave");
	if(Settings.LogAll === true) console.log(JSON.stringify(request.object, null, 4));
	var usersOp = request.object.op("users");
	var rolesGroup;
	//If this is a new role, we need to grab the group in a backwards kind of way since it technically can't be accessed straight away
	if(request.object.isNew()){
		console.log("Role is new so getting group op");
		var groupOp = request.object.op("group");
		console.log("op: " + JSON.stringify(groupOp, null, 4));
	}

	if(usersOp){ //This only exists if we've added or removed a user
		var allUsersAdded = usersOp.added(); //An array of _User Pointers, all of which were added to this Role this save op
		console.log("Users op says we have added " + allUsersAdded.length + "users to role");
		var group = request.object.get("group");
		for(var i = 0; i < allUsersAdded.length; i++){
			//Add the current Role's 'group' object to the 'memberOf' relation of the user we have added to this role
			var addedUser = allUsersAdded[i];
			console.log("Updating user with id: " + addedUser.id);
			var roletype = roleIsAdmin ? "admin" : "member";
			console.log("Role is " + roletype);
			console.log("Role's group is " + JSON.stringify(group, null, 4));
			// We also want to update the user's members / admins arrays here which are more easily retreivable on the client than a relation
			if(roleIsAdmin === true){
				console.log("Role is marked admin");
				addedUser.relation("adminOf").add(request.object.get("group"));
				addedUser.addUnique("adminOfArray", request.object.get("group"));
				group.addUnique("adminsArray", addedUser);
			}else{
				console.log("Role is member");
				addedUser.relation("memberOf").add(request.object.get("group"));
				addedUser.addUnique("memberOfArray", request.object.get("group"));
				group.addUnique("membersArray", addedUser);
			}
			console.log("Now saving user with id " + addedUser.id);

			promises.push(addedUser.save(null, {useMasterKey: true}));
			
		}

		var allusersRemoved = usersOp.removed(); //An array of _User Pointers, all of which were removed from this Role this save op
		for(var j = 0; j < allusersRemoved.length; j++){
			//Remove the current Role's 'group' object to the 'memberOf' relation of the user we have added to this role
			// We also want to update the user's members / admins arrays here which are more easily retreivable on the client than a relation
			var removedUser = allusersRemoved[i];
			if(roleIsAdmin === true){
				removedUser.relation("adminOf").remove(request.object.get("group"));
				removedUser.remove("adminOfArray", request.object.get("group"));
				group.remove("adminsArray", removedUser);
			}else{
				removedUser.relation("memberOf").remove(request.object.get("group"));
				removedUser.remove("memberOfArray", request.object.get("group"));
				group.remove("membersArray", removedUser);

			}
			promises.push(removedUser.save(null, {useMasterKey: true}));
		}

		promises.push(group.save(null, {useMasterKey: true}));


	}

	var prom = Parse.Promise.when(promises);
	return prom.then(function() {
		response.success();
	});
	
});

callResponseSuccess = function (res) {
	var prom = new Parse.Promise();
	res.success();
	prom.resolve("Response should have been called success");
};



// TODO: Move this to beforeSave, save us an entire api call cycle
Parse.Cloud.afterSave(Parse.User, function(request) {
	console.log("BEGIN After save of User");
	if (request.object.existed() === false) {
		console.log("New user: Going to try to accept all contract for new user");
		ContractsInterface.acceptAllOpenContractsForNewUser(request.user).then(function(){
			//Brand new User. Let's set their ACL!
			if(Settings.LogAll === true) console.log("Now setting new user's ACL");
			var acl = new Parse.ACL();
			acl.setPublicReadAccess(true);
			acl.setWriteAccess(request.user.id, true);
			request.user.setACL(acl);
			request.user.save();
		});
	}
});

Parse.Cloud.afterSave("Message", function(request) {
	if(Settings.LogAll === true) console.log("Saved a message");
	if (request.object.existed() === false) {
		if(Settings.LogAll === true) console.log("Gonna post notif now");
		// Brand new Message, so let's alert users of the group
		var author = request.object.get("author");

		var groups = request.object.get("groups");

		var isAlert = request.object.get("isAlert");

		if(isAlert === false)
			NotificationsInterface.sendPushForUserPostedMessageToGroup(author, request.object, groups[0]);
		else
			NotificationsInterface.sendPushForUserPostedAlertToGroups(author, request.object, groups);
	}
});

