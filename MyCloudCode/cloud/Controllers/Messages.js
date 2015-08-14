/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/

var MessagesInterface = require('cloud/Interfaces/MessagesInterface.js');
var Message = Parse.Object.extend("GroupContract");

// createNewMessage (author, group, text);
// deleteMessage (author, messageId);


/* 
 * Creates a new message written by the author::_User and accessible only to the group::Group
 * Contains the body text::String
 *
 * @return Parse.Promise once the message has been posted 
 */

function createNewMessage (author, group, text) {
	// Create the new message with 'text'
	var message = new Message();
	//Populate
	message.set("body", text);
	message.set("author", author);
	message.set("group", group);

	// ACL PERMISSIONS
	var ACL = new Parse.ACL(user);
	// Not publically viewable
	ACL.setPublicReadAccess(false);
	// ONLY the author can edit
	ACL.setWriteAccess(author.id, true);
	// ONLY the group can read
	ACL.setReadAccess(group.get("membersRole"));

	message.setACL(ACL);
	// return
	return message.save();
}

/*
 * Attemps to delete a message
 * The message is identified by its ID
 * The requester is identified as a full _User object
 *
 * @return Parse.Promise
 */
function deleteMessage (requester, messageId) {

}