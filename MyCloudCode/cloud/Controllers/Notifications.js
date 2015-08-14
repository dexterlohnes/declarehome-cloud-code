var PREFIX_NEW_MESSAGE = "NewMessage";
var PREFIX_NEW_EVENT = "NewEvent";
var PREFIX_ALERT = "Alert";
var PREFIX_INVITATION_ACCEPTED = "InvitationAccepted";
var PREFIX_MEMBERSHIP_REQUEST = "MembershipRequest";

exports.subscribeUserToNotifChannel = function subscribeUserToNotifChannel(user, notifChannel, dontSave) {
	
};

exports.pushNotifToChannel = function (notifMessage, channel) {

	Parse.Push.send({
		channels: [channel],
		data: {
			alert: notifMessage
		}
	}, {
		success: function() {
			// Push was successful
			console.log("Push successfully sent");
			console.log("Payload:\n" + notifMessage + "Channel:\n" + channel);
		},
		error: function(error) {
			// Handle error
			console.log("Push failed");
			console.log("Payload:\n" + notifMessage + "Channel:\n" + channel);
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

exports.getNewMembershipRequestedChannelForGroup = function (user, group) {
	return PREFIX_MEMBERSHIP_REQUEST + "_" + group.id;
};