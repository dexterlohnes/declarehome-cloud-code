/*
 * This will eventually call response.success(x) with x === one of 5 responses depending on the user's status within the group
 * 
 * response.success(1) - If User is a Admin
 * response.success(2) - If User is an Member
 * response.success(3) - If User has already been invited (and not yet accepted invitation)
 * response.success(4) - If User has already requested to join
 * response.success(5) - If User has no outstanding association (no request to join yet made, no invitation)
 */
Parse.Cloud.define("getUserStatusForGroup", function(request, response) {
	//Goal is to eventually call response.success(x) where x = our status code
	//We do this by setting up a series of functions, each checking for status separately

	// 1 - Construct our array of functions which each check for user status separately

	//ORDER MATTERS! First function in gets called first. We are popping from front / shifting
	console.log("In getUserStatusForGroup");
	var funcsArray = [checkUserIsAdmin, checkUserIsMember];

	// 2 - Pass this function's request, response and funcArray variables to the first function
	userStatusForGroup(request, response, funcsArray);
});

function userStatusForGroup(request, response, funcsArray) {
	console.log("Called with our funcs array");
	/* 1 - shift our funcsArray to get the next function we should call */
	var nextFunc = funcsArray.shift();

	if (nextFunc) {
		/* 2 - Since we are not yet done with our funcs, call the function 
		 * passing in our req, res and remaining functions */
		nextFunc(request, response, funcsArray);

	} else {
		/* 3 - If it is undefined, we're done! Return 5 because there is no association */
		response.success(5);
		return;
	}

}

/*
 * This should only ever be getting called by the function userStatusForGroup call stack
 * This function assumes the following params
 *
 ~ request.params.user
 ~ request.params.group // The id as a String of the group which we are checking the user for
 */
function checkUserIsAdmin(request, response, funcsArray) {

	console.log("In checkUserIsAdmin");
	checkUserIsInRole(request, response, funcsArray, "admin");
}

function checkUserIsMember(request, response, funcsArray) {
	console.log("In checkUserIsMember");
	checkUserIsInRole(request, response, funcsArray, "member");
}

function checkUserIsInRole(request, response, funcsArray, roleType, roles, roleRef, users) {

	/* Check if we have already retreived our roles to check against
	 * If we haven't, that's the first order of business */
	if (!roles) { //Empty arrays are 'truthy' so !roles will evaluate to false for an empty array
		/* Must retreive the roles asynchronously and then recall our self after
		 * placing the roles into our request */
		console.log("Roles not found so searching now");
		retreiveRolesThenCheckUserInRole(request, response, funcsArray, roleType);
	} else if (!roleRef) {
		console.log("Found our roles. Looping through roles now");
		/* Loop through our roles array until we find the admin role for this group*/
		var foundRoleInQuestion = false;
		roles.forEach(function(role) {
			//This will tell us if the current 'role' we are inspecting contains 'roleType' as a substring in its name
			// Role names are in the format '{groupId}_{roleType}'
			if (role.get("name").indexOf(roleType) > -1) {
				//We have found the roleType in questions
				//Now we recall this function including this in our roleRef
				console.log("Found our role. Going to loop through useres now");
				foundRoleInQuestion = true;
				roleRef = role;
				checkUserIsInRole(request, response, funcsArray, roleType, roles, roleRef);
			}
		});
		if(foundRoleInQuestion === false){
			//Didn't find the right role for this group, which is an oddity, but we're moving on
			console.error("Didn't find role of type " + roleType + " for user " + user.objectId);
			//Go to next func
			userStatusForGroup(request, response, funcsArray);
		}
	} else if (!users) {
		console.log("Don't have our users, so we are going to query for them now");
		//Now we need to query for all of the users belonging to our role in question.
		//Once the query is complete, we recall another version of this func 
		//from this step

		var usersRelation = roleRef.getUsers();
		var usersQuery = usersRelation.query();

		//We only want to return results where the user is contained in it
		console.log("User is " + request.user);
		console.log("User's id property is: " + request.user.id);
		usersQuery.equalTo('objectId', request.user.id);

		//Conduct our query asynchronously
		usersQuery.first({
            success: function(result) {    // User Object which if found at all is our current user
            	if(!result){
            		console.log("Our result is completely empty. Boo hoo!");
            		//Our user is not a member of this role, so move on to next function!
            		userStatusForGroup(request, response, funcsArray);
            	}else{
            		console.log("We found our user!");
            		//We found our user!
            		//Check if we are searching for an 'admin' or 'member' to decide what to send back to client
            		//Admin = 1
            		//Member = 2
            		if(roleType === 'admin'){
            			response.success(1);
            		}else if(roleType === 'member'){
            			response.success(2);
            		}else{
            			response.success(9999); //Unsupported role type, but we found it! :)
						console.error("WARNING! You searched for an unsupported role type and it was FOUND! Update UserStatusForGroup.js in CloudCode to support this type properly");
            		}
            	}
            }
        });

	}
}


/* This utility function is used for our user-status checking functions that rely
 * on our roles Relation already having been retreived
 * In the case that the roles have not yet been retreived, this is used
 * to retreive the roles and then call the same function which originally called this function */

function retreiveRolesThenCheckUserInRole(request, response, funcsArray, roleType) {
	console.log(JSON.stringify(request.params , null, 4));
	var groupHashCode = request.params.groupHashId;
	var roleQuery = new Parse.Query(Parse.Role);
	roleQuery.contains("name", groupHashCode);

	console.log("Searching for roles with name including group's hashCode: " + groupHashCode);

	roleQuery.find({
		success: function(rolesArray) {
			//We have now retreived our roles, so include them in our next function call
			checkUserIsInRole(request, response, funcsArray, roleType, rolesArray);
		},
		error: function(error) {
			console.error("Error while retreiving roles with name including: " + groupHashCode);
			console.error("ERROR: code: " + error.code + " Message: " + error.message);
			response.error(error);
		}
	});
}



// * response.success(3) - If User has already been invited (and not yet accepted invitation)
//  * response.success(4) - If User has already requested to join
//  * response.success(5) - If User has no outstanding association (no request to join yet made, no invitation)

