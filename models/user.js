var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Post = require('./post'),
    passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new Schema({
	username: String,
	email: String,
	password: String,
	posts: [{type: Schema.Types.ObjectId, ref: 'Post'}]
});

UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', UserSchema);
module.exports = User;