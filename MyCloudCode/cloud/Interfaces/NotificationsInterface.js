var Notifications = require('cloud/Controllers/Notifications.js');
var Settings = require('cloud/Settings.js');

/*
 *	sendPushForUserPostedMessageToGroup
 *	@param user A pointer to the _User who posted a new message
 *	@param message A pointer to the Message which has been posted
 *	@param group A pointer to a Group which we are sending a notification to
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
exports.sendPushForUserPostedMessageToGroup = function (user, message, group) {
	// TODO: Make sure we don't have to fetch user and fetch groups here
	return user.fetch().then(function (theUser) {
		user = theUser;
		return group.fetch().then(function (theGroup) {	
			var channel = Notifications.getNewMessageChannelForGroup(theGroup);

			var pushQuery = new Parse.Query(Parse.Installation);
			pushQuery.equalTo('channels', channel); // Set our channel

			// Find all users who are NOT the author
			var userQuery = new Parse.Query(Parse.User);
			userQuery.notEqualTo("objectId", user.id);
			
			// Set our push query to only find Installations where the 'user' is not equal to our author User
			pushQuery.matchesQuery('user', userQuery);

			var alertMessage = message.get("body");
			var title = user.get("displayName") + " - " + theGroup.get("name");
			return Notifications.pushNotifToQuery(alertMessage, pushQuery, title);
		});
	});
};

/*
 *	sendPushForUserPostedAlertToGroups
 *	@param user A pointer to the _User who posted a new message
 *	@param message A pointer to the Message which has been posted
 *	@param groups An array of Groups which we are sending notifications to
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
exports.sendPushForUserPostedAlertToGroups = function (user, message, groups) {
	// TODO: Make sure we don't have to fetch user and fetch groups here
	// return user.fetch().then(function (theUser) {

	var promises = [];

	for (var i = 0; i < groups.length; i++) {
		var group = groups[i];
		promises.push(sendPushForUserPostedAlertToGroup(user, message, group));
    }

    return Parse.Promise.when(promises);

	// });
};


function sendPushForUserPostedAlertToGroup (user, message, group) {
	// Broadcast to the alert channel
	var channel = Notifications.getAlertChannelForGroup(group);
	var pushQuery = new Parse.Query(Parse.Installation);
	pushQuery.equalTo('channels', channel); // Set our channel

	// Find all users who are NOT the author
	var userQuery = new Parse.Query(Parse.User);
	userQuery.notEqualTo("objectId", user.id);
	
	// Set our push query to only find Installations where the 'user' is not equal to our author User
	pushQuery.matchesQuery('user', userQuery);

	var alertMessage = message.get("body");
	// var title = user.get("displayName") + " - " + theGroup.get("name");
	var title = "ALERT!";
	return Notifications.pushNotifToQuery(alertMessage, pushQuery, title);
}

/* 	UNTESTED UNIMPLEMENTED * 	UNTESTED UNIMPLEMENTED * 	UNTESTED UNIMPLEMENTED * 	UNTESTED UNIMPLEMENTED
 *	sendPushForUserCreatedNewEventForGroup
 *	@param user A pointer to the _User who posted a new event
 *	@param eventTitle The title of the event which we are sending a notif about
 *	@param group A pointer to a Group which we are sending a notification to
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
exports.sendPushForUserCreatedNewEventForGroup = function (user, eventTitle, group) {
	var channel = Notifications.getNewEventChannelForGroup(group);
	var alertMessage = user.get("displayName") + " created a new event for the group " + group.get("name");
	Notifications.pushNotifToChannel(alertMessage, channel);
};

/* 	UNTESTED UNIMPLEMENTED * 	UNTESTED UNIMPLEMENTED * 	UNTESTED UNIMPLEMENTED * 	UNTESTED UNIMPLEMENTED
 *	sendPushForAlertToGroup
 *	@param user A pointer to the _User who posted a new event
 *	@param alert A pointer to the alert object (Message?) which has been posted
 *	@param group A pointer to a Group which we are sending a notification to
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
// exports.sendPushForAlertToGroup = function (user, alert, group) {
// 	var channel = Notifications.getAlertChannelForGroup(group);
// 	var alertMessage = user.get("displayName") + ": " + alert;
// 	Notifications.pushNotifToChannel(alertMessage, channel);
// };

/*
 *	sendPushForUsersInvitationAcceptedForGroup
 *
 *	@param user A pointer to the _User who accepted an invitation
 *	@param group A pointer to a Group which this user has accepted an invitation for
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
exports.sendPushForUsersInvitationAcceptedForGroup = function (user, group) {
	return user.fetch().then(function (theUser) {
		user = theUser;
		return group.fetch().then(function (theGroup) {
			var channel = Notifications.getInvitationAcceptedChannelForUser(user);
			var title = "Membership Accepted";
			var alertMessage = "You have been accepted to the group \'" + theGroup.get("name") + "\'";
			return Notifications.pushNotifToChannel(alertMessage, channel, title);
		});
	});
};

/*
 *	sendPushForUserHasRequestedMembershipForGroup
 *
 *	@param user A pointer to the _User who accepted an invitation
 *	@param group A pointer to a Group which this user has accepted an invitation for
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
exports.sendPushForUserHasRequestedMembershipForGroup = function (user, group) {
	return user.fetch().then(function (theUser) {
		user = theUser;
		return group.fetch().then(function (theGroup) {
			var channel = Notifications.getNewMembershipRequestedChannelForGroup(theGroup);
			var alertMessage = user.get("displayName") + " has requested membership to your group \' " + theGroup.get("name") + "\'";
			return Notifications.pushNotifToChannel(alertMessage, channel);
		});
	});
};

/*
 *	sendPushForUserHasBeenInvitedToGroup
 *
 *	@param user A pointer to the _User who has been invited to 'group'
 *	@param invitedBy A pointer to the _User who invited 'user'
 *	@param group A pointer to a Group which 'user' has been invited to
 *	
 *	@return A Parse.Promise which is bound by the Push completing
 */
exports.sendPushForUserHasBeenInvitedToGroup = function (user, invitedBy, group) {
	return user.fetch().then(function (theUser) {
		user = theUser;
		return group.fetch().then(function (theGroup) {
			group = theGroup;
			return invitedBy.fetch().then(function (inviter) {
				var title = "Invited to group";
				var channel = Notifications.getInvitedToGroupChannelForUser(user);
				var alertMessage = inviter.get("displayName") + " has invited you to join the group \' " + group.get("name") + "\'";
				return Notifications.pushNotifToChannel(alertMessage, channel, title);
			});
		});
	});
};
