/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/
var Settings = require('cloud/Settings.js');
var PREFIX_NEW_MESSAGE = "NewMessage";
var PREFIX_NEW_EVENT = "NewEvent";
var PREFIX_ALERT = "Alert";
var PREFIX_INVITATION_ACCEPTED = "InvitationAccepted";
var PREFIX_MEMBERSHIP_REQUEST = "MembershipRequest";
var PREFIX_INVITED_TO_GROUP = "InvitedToGroup";


/**
 * pushNotifToChannel
 *
 * Pushes a notification to a specific channel
 * 
 * @param notifMessage The body of the notification we want to send out
 * @param channel The channel (as string) which we want to publish to
 * @param androidTitle A string representing the title (top-most text) which we should display on Android notifs (doesn't apply to iOS)
 *
 * @return A Parse.Promise object containing nothing
 */
exports.pushNotifToChannel = function (notifMessage, channel, androidTitle) {
	
	var promise = new Parse.Promise();

	if(Settings.LogAll === true) console.log("Going to send push to \nchannel: " + channel + "\nWith message: " + notifMessage);

	Parse.Push.send({
		channels: [channel],
		data: {
			alert: notifMessage,
			title: androidTitle
		}
	}, {
		success: function() {
			// Push was successful
			if(Settings.LogAll === true) console.log("Push successfully sent");
			if(Settings.LogAll === true) console.log("Payload:\n" + notifMessage + "Channel:\n" + channel);
			promise.resolve();
		},
		error: function(error) {
			// Handle error
			if(Settings.LogAll === true) console.log("Push failed");
			if(Settings.LogAll === true) console.log("Payload:\n" + notifMessage + "Channel:\n" + channel);
			promise.reject();
		}
	});
};


/**
 * pushNotifToQuery
 *
 * Pushes a notification to all users within a Parse.Query
 * 
 * @param notifMessage The body of the notification we want to send out
 * @param query The Parse.Query for Parse.Users which we want to send this notif to
 * @param androidTitle A string representing the title (top-most text) which we should display on Android notifs (doesn't apply to iOS)
 *
 * @return A Parse.Promise object containing nothing
 */
exports.pushNotifToQuery = function (notifMessage, query, androidTitle) {
	
	var promise = new Parse.Promise();

	if(Settings.LogAll === true) console.log("Going to send push to \nquery: " + JSON.stringify(query, null, 4) + "\nWith message: " + notifMessage + "and title: " + androidTitle);

	Parse.Push.send({
		where: query,
		data: {
			alert: notifMessage,
			title: androidTitle
		}
	}, {
		success: function() {
			// Push was successful
			if(Settings.LogAll === true) console.log("Push successfully sent");
			if(Settings.LogAll === true) console.log("Payload:\n" + notifMessage + "Query:\n" + JSON.stringify(query, null, 4));
			promise.resolve();
		},
		error: function(error) {
			// Handle error
			if(Settings.LogAll === true) console.log("Push failed");
			if(Settings.LogAll === true) console.log("Payload:\n" + notifMessage + "Query:\n" + JSON.stringify(query, null, 4));
			promise.reject();
		}
	});
};

exports.getNewMessageChannelForGroup = function (group) {
	return PREFIX_NEW_MESSAGE + "_" + group.id;
};

exports.getNewEventChannelForGroup = function (group) {
	return PREFIX_NEW_EVENT + "_" + group.id;
};

exports.getAlertChannelForGroup = function (group) {
	return PREFIX_ALERT + "_" + group.id;
};

exports.getInvitationAcceptedChannelForUser = function (user) {
	return PREFIX_INVITATION_ACCEPTED + "_" + user.id;
};

exports.getNewMembershipRequestedChannelForGroup = function (group) {
	return PREFIX_MEMBERSHIP_REQUEST + "_" + group.id;
};

exports.getInvitedToGroupChannelForUser = function (user) {
	return PREFIX_INVITED_TO_GROUP + "_" + user.id;
};
