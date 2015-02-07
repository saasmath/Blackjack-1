var aes = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var crypto = require("crypto-js");
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blackjack');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error: '));

var Table, User;

var Schema = mongoose.Schema;

var tableSchema = new Schema({
	name: { type: String, required: true },
	url: { type: String, required: true },
	players: { type: String, required: true }
});

var userSchema = new Schema({
	UID: { type: String, required: true, unique: true },
	name: { type: String, required: true },
	bank: { type: Number, required: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	passphrase: { type: String, required: true },
	friends: { type: [String] },
	avatar: { type: String }
});

tableSchema.virtual('url_route').get(function(){
	return "/games/" + this._id + "/" + this.url;
});

tableSchema.methods.endGame = function(){

}

userSchema.methods.findFriends = function(){

}

userSchema.methods.encryptPassword = function(password, passphrase, formatter){
	this.password = aes.encrypt(password, passphrase, formatter);
}

userSchema.methods.createID = function(username){
	this.UID = SHA256(username);
}


userSchema.methods.validatePassword = function(password){
	var decrypted = aes.decrypt(this.password, this.passphrase, { format: JsonFormatter });
	if (decrypted.toString(crypto.enc.Utf8) == password){
		return true;
	}
	else{
		return false;
	}
}

var JsonFormatter = {
	stringify: function (cipherParams) {
	    // create json object with ciphertext
	    var jsonObj = {
	        ct: cipherParams.ciphertext.toString(crypto.enc.Base64)
	    };

	    // optionally add iv and salt
	    if (cipherParams.iv) {
	        jsonObj.iv = cipherParams.iv.toString();
	    }
	    if (cipherParams.salt) {
	        jsonObj.s = cipherParams.salt.toString();
	    }

	    // stringify json object
	    return JSON.stringify(jsonObj);
	},

	parse: function (jsonStr) {
	    // parse json string
	    var jsonObj = JSON.parse(jsonStr);

	    // extract ciphertext from json object, and create cipher params object
	    var cipherParams = crypto.lib.CipherParams.create({
	        ciphertext: crypto.enc.Base64.parse(jsonObj.ct)
	    });

	    // optionally extract iv and salt
	    if (jsonObj.iv) {
	        cipherParams.iv = crypto.enc.Hex.parse(jsonObj.iv)
	    }
	    if (jsonObj.s) {
	        cipherParams.salt = crypto.enc.Hex.parse(jsonObj.s)
	    }

	    return cipherParams;
	}
}


userSchema.pre('save', function(next){
	this.encryptPassword(this.password, this.passphrase, { format: JsonFormatter });
	this.createID(this.username);
	next();
});

tableSchema.pre('save', function(next){
	console.log("__SAVED__");
	next();
});


Table = mongoose.model('Table', tableSchema);
User = mongoose.model('User', userSchema);

module.exports = { Table: Table, User: User }