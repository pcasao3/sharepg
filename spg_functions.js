// access keys
var keys = require('./keys');

// required modules
var http = require('http');
var mysql = require('mysql');
var url = require('url');
var util = require('util');

// mysql credentials
var c = mysql.createConnection({
  host     : keys.cred['host'],
  user     : keys.cred['user'],
  password : keys.cred['password'],
  database : keys.cred['database']
});

// Halt on error
function HaltCondition(reason) {
    Error.call(this);
    this.message = reason;
}
util.inherits(HaltCondition, Error);

// Validate user
// Given a user id, make sure that it's on the database
function validateId(user_id, callback){
	var sel_q = "SELECT id, user_name, xp_sent, xp_received, send_count, receive_count, last_activity FROM spg_users WHERE id = " + user_id;
	c.query(sel_q, function(err, rows, fields) {
		r_val = {is_valid:false,user_obj:{}};
		if (!err) {
			if (rows.length == 1) {
				console.log(">>> User(" + user_id + ") exists on DB");
				r_val.is_valid = true;
				r_val.user_obj = rows[0];
			}
			else {
				console.log(">>> User(" + user_id + ") does not exist on DB");
			}
		}
		else {
			console.log("Error selecting [" + user_id + "]");
			console.log("Err: " + err );
		}

		callback(r_val);
	});
}

// Create user
this.createUser = function(user_name, email){
	console.log("I am createUser");
	// Confirm that the parameters are valid
	// Confirm that the user_name is new
	var sel_q = 'SELECT id, user_name FROM spg_users WHERE user_name = "' + user_name + '"';
	var ins_q = 'INSERT INTO spg_users (user_name, email) VALUES("' + user_name + '", "' + email + '")';

	c.query(sel_q, function(err, rows, fields) {
		if (!err) {
			if ( rows.length == 0 ) {
				console.log('Creating new user: ', [user_name, email]);
				c.query(ins_q, function(err, rows, fields){
					if (err) {
						console.log("Error inserting: ", err);
						return false;
					}
					else{					
						console.log("Successfully created [" + user_name + "]");
						// Send a confirmation e-mail to the user
						return true;
					}
				});
			}
			else {
				console.log('Error, user_name already exists');
				return false;
			}
		}
		else {
			console.log('Error selecting: ', err);
			return false;
		}
	});
}

// Confirm user
this.confirmUser = function(user_id){
	// Update database
	var upd_q = 'UPDATE spg_users SET confirmed = 1 WHERE id = ' + user_id;
	c.query(upd_q, function(err, rows, fields){
		if (err) {
			console.log("Error updating: ", err);
			return false;
		}
		else{
			console.log("Successfully updated [" + user_id + "]");
			return true;
		}
	});
}

// Update users callback
function updateUsers(snd_id, rcv_id, xp_val, callback){
	console.log(">> I am updateUsers");
	validateId(snd_id, function(snd_r_val){
		if ( snd_r_val.is_valid ){
			validateId( rcv_id, function(rcv_r_val){
				if ( rcv_r_val.is_valid ){
					// Both IDs are valid, now process and update both
					console.log(">> Both users valid! Processing...");

					// Get the returned user objects
					var sender = snd_r_val.user_obj;
					var receiver = rcv_r_val.user_obj;
					var xp_int = parseInt(xp_val, 10);

					// Update sender
					var u_sid = sender.id;
					var u_sent_amt = parseInt(sender.xp_sent, 10) + xp_int;
					var u_send_cnt = parseInt(sender.send_count, 10) + 1;
					snd_q = "UPDATE spg_users SET xp_sent = " + u_sent_amt + ", send_count = " + u_send_cnt + ", last_activity = CURRENT_TIME WHERE id = " + u_sid;					

					c.query(snd_q, function(err, rows, fields){
						(err)? console.log("Error updating: ", err) : console.log("Successfully updated (" + u_sid + ")!");
					});

					// Update receiver
					var u_rid = receiver.id;
					var u_received_amt = parseInt(receiver.xp_received, 10) + xp_int;
					var u_receive_cnt = parseInt(receiver.receive_count, 10) + 1;
					rcv_q = "UPDATE spg_users SET xp_received = " + u_received_amt + ", receive_count = " + u_receive_cnt + ", last_activity = CURRENT_TIME WHERE id = " + u_rid;
				
					c.query(rcv_q, function(err, rows, fields){
						(err)? console.log("Error updating: ", err) : console.log("Successfully updated (" + u_rid + ")!");
					});

					// Record transaction
					callback(true);
				}
				else {
					console.log(">> Receiving user(" + rcv_id + ") invalid.");
					callback(false);
				}
			});
		}
		else {
			console.log(">> Sending user(" + snd_id + ") invalid.");
			callback(false);
		}
	})
}

// Send xp
this.sendXp = function(xp_val, snd_id, rcv_id){
	console.log("> I am sendXp");

	// Update both users
	// IMPLEMENT CALLBACK TO RECORD THE TRANSACTION IN spg_transactions
	// Deliver payload to user
	if ( snd_id != rcv_id ) {
		updateUsers(snd_id, rcv_id, xp_val, function(update_res){
			if (update_res){
				console.log("UPDATE SUCCESSFUL");

				upd_q = "INSERT INTO spg_transactions (xp_val, sender_id, receiver_id) VALUES (" + xp_val + ", " + snd_id + ", " + rcv_id + ")";
				c.query(upd_q, function(err, rows, fields){
						(err)? console.log("Error updating: ", err) : console.log("Transaction created!");
				});
			}
			else {
				console.log("SOMETHING WENT WRONG");
			}
		});
	}
	else {
		console.log("> Error: can't send xp to self");
	}
}

// Pass xp (hot potato)
// Take a sender id and receiver id
// Increment the multiplier
// Check for special case
this.hotPotato = function(){

}