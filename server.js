// SERVER.js

// APP REQUIREMENTS
var express = require('express');
    bodyParser = require('body-parser'),
    hbs = require('hbs'),
    app = express(),
    mongoose = require('mongoose'),
    User = require('./models/user'),
    Post = require('./models/post'),
    Comment = require('./models/comment'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

mongoose.connect('mongodb://localhost/express-microblog');
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ROUTES
// Redirect to login page if user not signed-in
function isAuthenticated(req, res, next) {
    if (req.user){
    	return next();
    }
    res.redirect('/login');
}
// Get Signup View
app.get('/signup', function (req, res) {
  res.render('signup');
});
// Sign up new user, then log them in.
// It hashes and salts password, and saves new user to db
app.post('/signup', function (req, res) {
  User.register(new User({ username: req.body.username }), req.body.password,
    function (err, newUser) {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/profile');
      });
    }
  );
});
// Get Login View
app.get('/login', function (req, res) {
  res.render('login');
});
// Log-in User
app.post('/login', passport.authenticate('local'), function (req, res) {
  res.redirect('/profile');
});
// Log-out User
app.get('/logout', function (req, res) {
	console.log("logout in server");
  req.logout();
  res.redirect('/login');
});
// Get - All Users
app.get('/users', isAuthenticated, function(req,res){
	res.render('users');
});
// Get Single User Profile
app.get('/profile', isAuthenticated, function (req, res) {
  //res.render('profile', { user: req.user });
  var userId = req.user.id;
	User.findOne({_id: userId})
		.populate('posts')
			.exec(function(err, singleUser){
				res.render('profile', {user: singleUser});
			});
});
// Get - All Posts
app.get('/posts', isAuthenticated, function(req,res){
	res.render('posts');
});
// Get - Single Post
app.get('/posts/:id', function(req, res){
	var postId = req.params.id;
	Post.findOne({_id: postId})
		.populate('comments')
			.exec(function(err, singlePost){
				res.render('post', {post: singlePost});
			});
});
// Get - API - Single Post
app.get('/api/posts/:id', function(req, res){
	var postId = req.params.id;
	Post.findOne({_id: postId})
		.populate('comments')
				.exec(function(err, foundPost){
					res.json(foundPost);
				});
});
// Get - API - All Posts
app.get('/api/posts', function(req, res){
	Post.find()
		.populate('comments')
			.exec(function(err, allPosts){
				res.json(allPosts);
			});
});
// Post - API - Single Post
app.post('/api/posts', function(req, res){
	var newPost = new Post(req.body);
	newPost.save(function(err, savedPost){
		if(err) {return console.error(err);}
 		else console.log(savedPost);
 		User.findOne({_id: req.user.id}, function(err, foundUser){
			foundUser.posts.push(newPost);
			foundUser.save();
		});
		res.json(newPost);
	});
});
// Update - API - Single Post
app.put('/api/posts/:id', function(req, res){
	var body = req.body;
	var postId = req.params.id;
	Post.findOne({_id: postId}, function(err, singlePost){
		singlePost.title = body.title;
		singlePost.body = body.body;
		singlePost.url = body.url;
		singlePost.favorite = body.favorite;
		singlePost.save(function(err, singlePost){
			// User.findOne({_id: req.user.id}, function(err, foundUser){
			// 	foundUser.comments.push(singlePost);
			// 	foundUser.save();
			// });
			res.json(singlePost);
		});
	});
});
// Delete - API - Single Post
app.delete('/api/posts/:id', function(req, res){
	var postId = req.params.id;
	Post.findOneAndRemove({_id: postId}, function(err, singlePost){
		res.json(singlePost);
		// Do I need to remove the post from User.posts?
	});
});
// Post - API - Single Comment
app.post('/api/posts/:id', function(req, res){
	var newComment = new Comment(req.body);
	var postId = req.params.id;
	newComment.save(function(err, savedComment){
		if(err) {return console.error(err);}
 		else console.log(savedComment);
	});
	Post.findOne({_id: postId}, function(err, singlePost){
		singlePost.comments.push(newComment);
		singlePost.save();
	});
	res.json(newComment);
});
// Get - API - All Comments for Single Post
app.get('/api/posts/:id/comments', function(req, res){
	var postId = req.params.id;
	Post.find({_id: postId})
		.populate('comments')
				.exec(function(err, foundPost){
					res.json(foundPost);
				});
});


// SERVER PORT
var server = app.listen(3000, function(){
	console.log("Server is running");
});