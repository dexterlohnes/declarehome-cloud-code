var Messages = require('cloud/Controllers/Messages.js');
var Group = Parse.Object.extend("Group");

Parse.Cloud.define("postNewMessage", function(request, response) {
	
	//Query for our group
	var query = new Parse.Query(Group);
	//Limit our query to the group passed in with our request
	query.equalTo("objectId", request.params.group);
	
	query.first().then(function(theGroup) {
		return Messages.createNewMessage(request.user, request.params.group);
	}, function(error) {
		return Parse.Promise.error("There was an error when retreiving our group with ID: " + request.params.group);
	});
}

