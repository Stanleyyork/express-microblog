$(function() {

	console.log("script.js working.");
	var source = $('#posts-template').html(); // loads the html from .hbs
 	var template = Handlebars.compile(source);

 	getAllPosts();
 	showFaves($('#updateFavorite').val());

 	// Add Single Post
 	$('.new-post-form').on('submit', function(e){
 		var title = $('#new-title').val();
		var body = $('#new-body').val();
		var url = $('#new-url').val();
		addPost(title, body, url);
 	});

	// Update Single Post
	$('.edit-form').on('submit', function(e){
		e.preventDefault();
		var id = $('#updateId').val();
		var title = $('#updateTitle').val();
		var body = $('#updateBody').val();
		var url = $('#updateURL').val();
		var favorite = '';
		if ($('#updateFavorite').prop("checked") === true){
			favorite = true;
		} else {
			favorite = false;
		}
		updatePost(id, title, body, url, favorite);
		$('#update-' + id).slideUp('slow');
	});

	// Delete Single Post
	$('#delete-post-form').on('click', function(e){
		e.preventDefault();
		var id = $('#delete-post-form').attr('data-id');
		var answer = prompt("Are you sure you want to delete this? (Yes/No)");
		if(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y" ){
			deletePost(id);
		}
	});

	// Get Tag Suggestions
	$('#single-post-tag').on('click', function(e){
		var tagsArray = [];
		var title = $('#updateTitle').val();
		var body = $('#updateBody').val();
		var text = (title+body).replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/'/g, '').replace(/ /g,"%20");
		console.log(text);
		$.get('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20contentanalysis.analyze%20where%20text%3D%27'+text+'%27%3B&format=json&diagnostics=true', function(data){
			console.log(data);
			var entities = data.query.results.entities.entity;
			if(entities === undefined){
				console.log("No suggestions available");
			} else if((Object.keys(entities).length >=1) && (entities[0] === undefined)){
				$('#tag-section').append('<span class="label label-success" id="tag-labels">'+entities.text.content+'</span>'+' ');
			} else {
				for(var i = 0; i < Object.keys(entities).length; i++){
					$('#tag-section').append('<span class="label label-success" id="tag-labels">'+entities[i].text.content+'</span>'+' ');
				}
			}
		});
	});

	// Open Comment Form
	$('#add-comment').on('click', function(data){
		// Add Single Comment
		$('.comment-add-form').on('submit', function(e){
			e.preventDefault();
			var postId = $('#addCommentPostId').val();
			var body = $('#commentBody').val();
			$('#add-comment-' + postId).slideUp('slow');
			addComment(postId, body);
			getAllComments(postId);
		});
	});

	// Get Single Post
	function getSinglePost(id){
		$.get('/api/posts/'+id, function(data){
			var postsHtml = template({ post: data.post });
			$('#post').prepend(postsHtml);
		});
	}

	// Get All Posts
 	function getAllPosts(){
		$.get('/api/posts', function(data){
			var allPosts = data;
			var totalposts = allPosts.length;
			$('#total-count-badge').text(totalposts);
			var postsHtml = template({ posts: allPosts });
			$('#posts-list').append(postsHtml);
			for(var i = 0; i<allPosts.length; i++){
				if(allPosts[i].favorite === true){
					$('#post-favorite-'+allPosts[i]._id).show();
				} else {
					$('#post-favorite-'+allPosts[i]._id).hide();
				}
				if(allPosts[i].comments.length > 0){
					$('#post-comment-'+allPosts[i]._id).show();
				} else {
					$('#post-comment-'+allPosts[i]._id).hide();
				}
			}
		});
	}

	// addPost function - calls API
	function addPost(title, body, url){
		$.ajax({
	      type: "POST",
	      url: 'http://localhost:3000/api/posts/',
	      data: {title: title, body: body, url: url},
	      success: function (data) {
	        console.log("Added new post!");
	        $('#posts-list').empty();
	        getAllPosts();
	      },
	      error: function (error) {
	        console.error(error);
	      }
	    });
	}

	// updatePost function - calls API
	function updatePost(id, title, body, url, favorite){
		$.ajax({
			type: "PUT",
			url: 'http://localhost:3000/api/posts/' + id,
			data: {title: title, body: body, url: url, favorite:favorite},
			success: function (data) {
				console.log("Updated post!");
				$('#post-server').empty();
				getSinglePost(id);
				//window.location.href = "http://localhost:3000/posts/"+id;
			},
			error: function (error) {
				console.error(error);
	    	}
	    });
	}

	// deletePost function - calls API
	function deletePost(id){
		$.ajax({
			type: "DELETE",
			url: 'http://localhost:3000/api/posts/' + id,
			success: function (data) {
	        	console.log("Deleted post!");
	        	window.location.href = "http://localhost:3000/posts";
	      	},
	      	error: function (error) {
	        	console.error(error);
	      	}
		});
	}

	function showFaves(favorite){
		if(favorite === "true"){
			$('#post-favorite').show();
		} else {
			$('#post-favorite').hide();
		}
	}

	// Yahoo Content Analysis
	function getTagSuggestions(title, body){
		var text = (title + body).replace(/ /g,"%20");
		var base_url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20contentanalysis.analyze%20where%20text%3D%27" + text + "%27%3B&format=json&diagnostics=true";
		$.get('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20contentanalysis.analyze%20where%20text%3D%27Financial%20EmpowermentSquare%20stands%20for%20economic%20empowerment.%20We%20stand%20for%20financial%20systems%20that%20serve%20instead%20of%20rule.%20We%20stand%20for%20leveling%20the%20playing%20field%27%3B&format=json&diagnostics=true', function(data){
			console.log(data);
		});
	}

	// addComment function - calls API
	function addComment(id, body){
		$.ajax({
	      type: "POST",
	      url: 'http://localhost:3000/api/posts/' + id,
	      data: {body: body},
	      success: function (data) {
	        console.log("Added new comment!");
	      },
	      error: function (error) {
	        console.error(error);
	      }
	    });
	}

	// Get All Comments
 	function getAllComments(id){
 		console.log("inside gac");
		$.get('/api/posts/'+id+'/comments', function(data){
			//refreshCommentsSection(data);
		});
	}

	function refreshCommentsSection(postObject){
		console.log(postObject[0].comments);
		var allComments = postObject[0].comments;
		var commentsHtml = template({ comments: allComments });
		$('#comments-server').empty();
		$('#comments-api').append(commentsHtml);
	}


});