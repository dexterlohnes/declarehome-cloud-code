var Notifications = require('cloud/Controllers/Notifications.js');

exports.sendPushForUserPostedMessageToGroup = function (user, message, group) {
	var channel = Notifications.getNewMessageChannelForGroup(group);
	var alertMessage = user.get("displayName") + " posted a new message in group " + group.get("name");
	Notifications.pushNotifToChannel(alertMessage, channel);
};

exports.sendPushForUserCreatedNewEventForGroup = function (user, eventTitle, group) {
	var channel = Notifications.getNewEventChannelForGroup(group);
	var alertMessage = user.get("displayName") + " created a new event for the group " + group.get("name");
	Notifications.pushNotifToChannel(alertMessage, channel);
};

exports.sendPushForUserCreatedNewEventForGroup = function (user, eventTitle, group) {
	var channel = Notifications.getNewEventChannelForGroup(group);
	var alertMessage = user.get("displayName") + " created a new event for the group " + group.get("name");
	Notifications.pushNotifToChannel(alertMessage, channel);
};

exports.sendPushForAlertToGroup = function (user, alert, group) {
	var channel = Notifications.getAlertChannelForGroup(group);
	var alertMessage = user.get("displayName") + ": " + alert;
	Notifications.pushNotifToChannel(alertMessage, channel);
};

exports.sendPushForUsersInvitationAcceptedForGroup = function (user, group) {
	var channel = Notifications.getInvitationAcceptedChannelForUser(user);
	var alertMessage = "You have been accepted to the group \'" + group.get("name") + "\'";
	Notifications.pushNotifToChannel(alertMessage, channel);
};

exports.sendPushForUserHasRequestedMembershipForGroup = function (user, group) {
	var channel = Notifications.getNewMembershipRequestedChannelForGroup(group);
	var alertMessage = user.get("displayName") + " has requested membership to your group \' " + group.get("name") + "\'";
	Notifications.pushNotifToChannel(alertMessage, channel);
};
