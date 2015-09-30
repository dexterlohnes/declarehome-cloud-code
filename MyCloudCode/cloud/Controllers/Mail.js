/***********************************************************************************************
 ***********************************************************************************************
 * NOTE: THIS IS NOT INTENDED TO BE CALLED BY OTHER CONTROLLERS
 * CONTROLLERS IN THIS PATTERN SHOULD ONLY BE GETTING CALLED BY INTERFACES, NOT OTHER CONTROLLERS 
 ***********************************************************************************************
 ***********************************************************************************************/

// THESE ARE FOR THE WISE CITY REGISTERED ACCOUNT. I WANTED TO KEEP ITS SENDS PURE SO THE DOMAIN AND API KEY OTHER THAN THESE
// ARE MY OWN TEST ACCOUNT JUST FOR MAKING SURE THE MECHANISMS ARE ALL WORKING CORRECTLY

// PRODUCTION ACCOUNT - appstoreinfo@thewisecity.org
// var _DOMAIN = "sandboxe1732b5060d6446d87cee8dfc7aa60ee.mailgun.org";
// var _API_KEY = "key-e1433519a812930ac85d92ebb05af7a9";

// TEST ACCOUNT - dexterlohnes@gmail.com
var _DOMAIN = "sandbox94a62884849249b094ecb20bb793947f.mailgun.org";
var _API_KEY = "key-1ad0add89f7e1239ee598ac2c95d3e80";

var Mailgun = require('mailgun');
Mailgun.initialize(_DOMAIN, _API_KEY);

exports.Mailgun = Mailgun;

/**
 * sendEmailToUser
 * 
 * @param userEmails The email addresses, comma separated, as a string of the users which you are sending email to
 * @param subject The subject line of the email to send
 * @param text The body text of the email you with to send
 *
 * Sends an email to a user
 */
exports.sendEmailToUser = function (userEmails, subject, text) {
	console.log("Sending mail to " + userEmails);
	console.log("Subject: \n" + subject);
	console.log("Text: \n" + text);

	var promise = new Parse.Promise();

	Mailgun.sendEmail({
	  	to: userEmails,
	  	from: "hello@cookedapp.com",
	  	subject: subject,
	  	text: text
	}, {
	  success: function(httpResponse) {
	    console.log(httpResponse);
	    // httpResponse.success("Email sent!");
	    promise.resolve();
	  },
	  error: function(httpResponse) {
	    console.error(httpResponse);
	    // httpResponse.error("Uh oh, something went wrong");
	    promise.reject();
	  }
	});

	return promise;
}
