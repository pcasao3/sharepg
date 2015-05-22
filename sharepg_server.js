// personal files
var spg_f = require('./spg_functions');

// required modules
var http = require('http');
var mysql = require('mysql');
var url = require('url');

// mysql credentials
// Parse http request queries
function parse_query(str){
	var parsed = {};
	// Split the entire string by ampersand
	var pairs = str.split("&");
	for (i = 0; i < pairs.length; i++){
		// Split the key and value pairs
		var keyVal = pairs[i].split("=");
		//console.log("processing ", keyVal)

		// If the key is not null, add the pair to the hash
		if ( keyVal[0] ) {
			parsed[keyVal[0]] = keyVal[1];
		}
	}

	return parsed;
}

// Set up the function to handle requests
function onRequest(req, res){
	console.log("===")
	res.writeHead(200, {'Content-Type': 'text/plain'});
 	res.end('Hello World\n');

 	var parsed_url = url.parse(req.url);

 	var pth = parsed_url.pathname;
 	var qry = parsed_url.query;
 	var q_hsh = {}

 	// Convert the query into a hash
 	if ( qry )
	 	q_hsh = parse_query(qry);
	
	// Get the length of the hash
	var len = Object.keys(q_hsh).length

	// Callback for creating a user (user_name, email)
    if( pth == '/create_user' && len === 2){
        console.log("creating user");
        //Check for a user and email
        var u_val = q_hsh['user_name'];
        var e_val = q_hsh['email'];

        if ( u_val && e_val ){
        	spg_f.createUser(u_val, e_val);	
        } 
        else
        {
        	console.log("Error: missing param for create_user");
        }
    }

    // Callback for confirming a user (user_id)
    if ( pth == '/confirm_user' && len === 1){
    	var i_val = q_hsh['user_id'];
    	if ( i_val ) {
    		spg_f.confirmUser(i_val);
    	}
    	else {
    		console.log("Error: missing param for confirm_user");
    	}
    }

    // Callback for updating a user (user_id)
    if( pth == '/update_user' && len === 1){
        console.log("updating user");
        var i_val = q_hsh['user_id'];
        if ( i_val ) {
        	spg_f.updateUser(i_val);
        }
        else {
        	console.log("Error: missing param for update_user");
        }
    }

    // Callback for sending xp between users (xp_val, snd_id, rcv_id)
	if( pth == '/send_xp' && len === 3 ){
        console.log("send xp");
        var xp_val = q_hsh['xp_val'];
        var sid_val = q_hsh['snd_id'];
        var rid_val = q_hsh['rcv_id'];
        if ( xp_val && sid_val && rid_val ) {
        	console.log("Attempting to send [" + xp_val + "] from [" + sid_val + "] to [" + rid_val + "]" );
        	spg_f.sendXp(xp_val, sid_val, rid_val);
        }
        else {
        	console.log("Error: missing param for send_xp");
        }
    }

}

http.createServer(onRequest).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
