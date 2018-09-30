'use strict';

// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('new-post-message');
var titleInput = document.getElementById('new-post-title');
//var signInButton = document.getElementById('sign-in-button');
//var signOutButton = document.getElementById('sign-out-button');
//var splashPage = document.getElementById('page-splash');
//var addPost = document.getElementById('add-post');
//var addButton = document.getElementById('add');
//var recentPostsSection = document.getElementById('recent-posts-list');
//var userPostsSection = document.getElementById('user-posts-list');
//var topUserPostsSection = document.getElementById('top-user-posts-list');
//var recentMenuButton = document.getElementById('menu-recent');
//var myPostsMenuButton = document.getElementById('menu-my-posts');
//var myTopPostsMenuButton = document.getElementById('menu-my-top-posts');

var questionIsActiveInput = document.getElementById('questionIsActive');
var isActive = false;

var questionDifficultyInput = document.getElementById('questionDifficultySelect');
var difficulty = 0;

var questionTopicsInput = document.getElementById('questionTopicsSelect');
var questionTopicsHelp = document.getElementById('questionTopicsHelp');
var topicsSelected = [];

var questionRangeInput = document.getElementById('questionRange');
var questionRangeHelp = document.getElementById('rangeHelp');
var range = 0;

var fileURL = "";
var fileInput = document.getElementById('file');
var linkbox = document.getElementById('linkbox');
var listeningFirebaseRefs = [];

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function writeNewPost(uid, username, picture, title, body) {
 // A post entry.
 var postData = {
  author: username,
  uid: uid,
  body: body,
  title: title,
  starCount: 0,
  authorPic: picture,
  isActive: isActive,
  difficulty: difficulty,
  topics: topicsSelected,
  range: range,
  fileURL: fileURL
 };

 // Get a key for a new Post.
 var newPostKey = firebase.database().ref().child('posts').push().key;

 // Write the new post's data simultaneously in the posts list and the user's post list.
 var updates = {};
 updates['/posts/' + newPostKey] = postData;
 updates['/user-posts/' + uid + '/' + newPostKey] = postData;

 return firebase.database().ref().update(updates);
}
// [END write_fan_out]

/**
 * Star/unstar post.
 */
// [START post_stars_transaction]
function toggleStar(postRef, uid) {
 postRef.transaction(function(post) {
  if (post) {
   if (post.stars && post.stars[uid]) {
    post.starCount--;
    post.stars[uid] = null;
   } else {
    post.starCount++;
    if (!post.stars) {
     post.stars = {};
    }
    post.stars[uid] = true;
   }
  }
  return post;
 });
}
// [END post_stars_transaction]

/**
 * Creates a post element.
 */
function createPostElement(postId, title, text, author, authorId, authorPic) {
 var uid = firebase.auth().currentUser.uid;

 var html =
  '<div class="post post-' + postId + ' mdl-cell mdl-cell--12-col ' +
  'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
  '<div class="mdl-card mdl-shadow--2dp">' +
  '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
  '<h4 class="mdl-card__title-text"></h4>' +
  '</div>' +
  '<div class="header">' +
  '<div>' +
  '<div class="avatar"></div>' +
  '<div class="username mdl-color-text--black"></div>' +
  '</div>' +
  '</div>' +
  '<span class="star">' +
  '<div class="not-starred material-icons">star_border</div>' +
  '<div class="starred material-icons">star</div>' +
  '<div class="star-count">0</div>' +
  '</span>' +
  '<div class="text"></div>' +
  '<div class="comments-container"></div>' +
  '<form class="add-comment" action="#">' +
  '<div class="mdl-textfield mdl-js-textfield">' +
  '<input class="mdl-textfield__input new-comment" type="text">' +
  '<label class="mdl-textfield__label">Comment...</label>' +
  '</div>' +
  '</form>' +
  '</div>' +
  '</div>';

 // Create the DOM element from the HTML.
 var div = document.createElement('div');
 div.innerHTML = html;
 var postElement = div.firstChild;
 if (componentHandler) {
  componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
 }

 var addCommentForm = postElement.getElementsByClassName('add-comment')[0];
 var commentInput = postElement.getElementsByClassName('new-comment')[0];
 var star = postElement.getElementsByClassName('starred')[0];
 var unStar = postElement.getElementsByClassName('not-starred')[0];

 // Set values.
 postElement.getElementsByClassName('text')[0].innerText = text;
 postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
 postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
 postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
  (authorPic || './silhouette.jpg') + '")';

 // Listen for comments.
 // [START child_event_listener_recycler]
 var commentsRef = firebase.database().ref('post-comments/' + postId);
 commentsRef.on('child_added', function(data) {
  addCommentElement(postElement, data.key, data.val().text, data.val().author);
 });

 commentsRef.on('child_changed', function(data) {
  setCommentValues(postElement, data.key, data.val().text, data.val().author);
 });

 commentsRef.on('child_removed', function(data) {
  deleteComment(postElement, data.key);
 });
 // [END child_event_listener_recycler]

 // Listen for likes counts.
 // [START post_value_event_listener]
 var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
 starCountRef.on('value', function(snapshot) {
  updateStarCount(postElement, snapshot.val());
 });
 // [END post_value_event_listener]

 // Listen for the starred status.
 var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid);
 starredStatusRef.on('value', function(snapshot) {
  updateStarredByCurrentUser(postElement, snapshot.val());
 });

 // Keep track of all Firebase reference on which we are listening.
 listeningFirebaseRefs.push(commentsRef);
 listeningFirebaseRefs.push(starCountRef);
 listeningFirebaseRefs.push(starredStatusRef);

 // Create new comment.
 addCommentForm.onsubmit = function(e) {
  e.preventDefault();
  createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
  commentInput.value = '';
  commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
 };

 // Bind starring action.
 var onStarClicked = function() {
  var globalPostRef = firebase.database().ref('/posts/' + postId);
  var userPostRef = firebase.database().ref('/user-posts/' + authorId + '/' + postId);
  toggleStar(globalPostRef, uid);
  toggleStar(userPostRef, uid);
 };
 unStar.onclick = onStarClicked;
 star.onclick = onStarClicked;

 return postElement;
}

/**
 * Writes a new comment for the given post.
 */
function createNewComment(postId, username, uid, text) {
 firebase.database().ref('post-comments/' + postId).push({
  text: text,
  author: username,
  uid: uid
 });
}

/**
 * Updates the starred status of the post.
 */
function updateStarredByCurrentUser(postElement, starred) {
 if (starred) {
  postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
  postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
 } else {
  postElement.getElementsByClassName('starred')[0].style.display = 'none';
  postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
 }
}

/**
 * Updates the number of stars displayed for a post.
 */
function updateStarCount(postElement, nbStart) {
 postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
}

/**
 * Creates a comment element and adds it to the given postElement.
 */
function addCommentElement(postElement, id, text, author) {
 var comment = document.createElement('div');
 comment.classList.add('comment-' + id);
 comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
 comment.getElementsByClassName('comment')[0].innerText = text;
 comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';

 var commentsContainer = postElement.getElementsByClassName('comments-container')[0];
 commentsContainer.appendChild(comment);
}

/**
 * Sets the comment's values in the given postElement.
 */
function setCommentValues(postElement, id, text, author) {
 var comment = postElement.getElementsByClassName('comment-' + id)[0];
 comment.getElementsByClassName('comment')[0].innerText = text;
 comment.getElementsByClassName('fp-username')[0].innerText = author;
}

/**
 * Deletes the comment of the given ID in the given postElement.
 */
function deleteComment(postElement, id) {
 var comment = postElement.getElementsByClassName('comment-' + id)[0];
 comment.parentElement.removeChild(comment);
}

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
 // [START my_top_posts_query]
 var myUserId = firebase.auth().currentUser.uid;
 var topUserPostsRef = firebase.database().ref('user-posts/' + myUserId).orderByChild('starCount');
 // [END my_top_posts_query]
 // [START recent_posts_query]
 var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
 // [END recent_posts_query]
 var userPostsRef = firebase.database().ref('user-posts/' + myUserId);

 var fetchPosts = function(postsRef, sectionElement) {
  postsRef.on('child_added', function(data) {
   var author = data.val().author || 'Anonymous';
   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
   containerElement.insertBefore(
    createPostElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic),
    containerElement.firstChild);
  });
  postsRef.on('child_changed', function(data) {
   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
   var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
   postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
   postElement.getElementsByClassName('username')[0].innerText = data.val().author;
   postElement.getElementsByClassName('text')[0].innerText = data.val().body;
   postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
  });
  postsRef.on('child_removed', function(data) {
   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
   var post = containerElement.getElementsByClassName('post-' + data.key)[0];
   post.parentElement.removeChild(post);
  });
 };

 // Fetching and displaying all posts of each sections.
 fetchPosts(topUserPostsRef, topUserPostsSection);
 fetchPosts(recentPostsRef, recentPostsSection);
 fetchPosts(userPostsRef, userPostsSection);

 // Keep track of all Firebase refs we are listening to.
 listeningFirebaseRefs.push(topUserPostsRef);
 listeningFirebaseRefs.push(recentPostsRef);
 listeningFirebaseRefs.push(userPostsRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
 firebase.database().ref('users/' + userId).set({
  username: name,
  email: email,
  profile_picture: imageUrl
 });
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
 // Remove all previously displayed posts.
 topUserPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
 recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
 userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

 // Stop all currently listening Firebase listeners.
 listeningFirebaseRefs.forEach(function(ref) {
  ref.off();
 });
 listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
 // We ignore token refresh events.
 if (user && currentUID === user.uid) {
  return;
 }

 cleanupUi();
 if (user) {
  currentUID = user.uid;
  splashPage.style.display = 'none';
  writeUserData(user.uid, user.displayName, user.email, user.photoURL);
  startDatabaseQueries();
 } else {
  // Set currentUID to null.
  currentUID = null;
  // Display the splash page where you can sign-in.
  splashPage.style.display = '';
 }
}

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser(title, text) {
 // [START single_value_read]
 var userId = firebase.auth().currentUser.uid;
 return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
  var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
  // [START_EXCLUDE]
  return writeNewPost(firebase.auth().currentUser.uid, username,
   firebase.auth().currentUser.photoURL,
   title, text);
  // [END_EXCLUDE]
 });
 // [END single_value_read]
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
 recentPostsSection.style.display = 'none';
 userPostsSection.style.display = 'none';
 topUserPostsSection.style.display = 'none';
 addPost.style.display = 'none';
 recentMenuButton.classList.remove('is-active');
 myPostsMenuButton.classList.remove('is-active');
 myTopPostsMenuButton.classList.remove('is-active');

 if (sectionElement) {
  sectionElement.style.display = 'block';
 }
 if (buttonElement) {
  buttonElement.classList.add('is-active');
 }
}


function uploadFile() {

 initFirebase();

 var auth = firebase.auth();
 var storageRef = firebase.storage().ref();

 function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  var file = evt.target.files[0];
  var metadata = {
   'contentType': file.type
  };
  // Push to child path.
  // [START oncomplete]
  storageRef.child('images/' + file.name).put(file, metadata).then(function(snapshot) {
   console.log('Uploaded', snapshot.totalBytes, 'bytes.');
   console.log('File metadata:', snapshot.metadata);
   // Let's get a download URL for the file.
   snapshot.ref.getDownloadURL().then(function(url) {
    console.log('File available at', url);
    // [START_EXCLUDE]
    document.getElementById('linkbox').innerHTML = '<a href="' + url + '">Click For File</a>';
    fileURL = url;
    // [END_EXCLUDE]
   });
  }).catch(function(error) {
   // [START onfailure]
   console.error('Upload failed:', error);
   // [END onfailure]
  });
  // [END oncomplete]
 }
 window.onload = function() {
  document.getElementById('file').addEventListener('change', handleFileSelect, false);
  document.getElementById('file').disabled = true;
  auth.onAuthStateChanged(function(user) {
   if (user) {
    console.log('Anonymous user signed-in.', user);
    document.getElementById('file').disabled = false;
   } else {
    console.log('There was no anonymous session. Creating a new anonymous user.');
    // Sign the user in anonymously since accessing Storage requires the user to be authorized.
    //auth.signInAnonymously().catch(function(error) {
    //if (error.code === 'auth/operation-not-allowed') {
    //window.alert('Anonymous Sign-in failed. Please make sure that you have enabled anonymous ' +
    //'sign-in on your Firebase project.');
    //}
    //});
   }
  });
 }
}


function fetchQuestions() {

  initFirebase();
}

// Bindings on load.
window.addEventListener('load', function() {

 //initFirebase();

 // Listen for auth state change
 //firebase.auth().onAuthStateChanged(onAuthStateChanged);

 // Saves message on form submit.
 messageForm.onsubmit = function(e) {
  e.preventDefault();
  var text = messageInput.value;
  var title = titleInput.value;
  if (text && title) {
   newPostForCurrentUser(title, text).then(function() {
    myPostsMenuButton.click();
   });
   messageInput.value = '';
   titleInput.value = '';
   questionIsActiveInput.value = false;
   questionDifficultyInput.value = '';
   questionTopicsInput.value = [];
   questionRangeInput.value = 50;
   fileInput.value = '';
   linkbox.value = '';
   linkbox.innerHTML = '';

  }
 };

 /*
 addButton.onclick = function() {
   showSection(addPost);
   messageInput.value = '';
   titleInput.value = '';
 };
 */
 //recentMenuButton.onclick();
 //uploadFile();
 questionIsActiveInput.addEventListener('change', function() {
    isActive = $(this).is(":checked");
    console.log(isActive);
 });

 questionDifficultyInput.addEventListener('change', function() {
    difficulty = this.value;
    console.log(difficulty);
 });

  questionTopicsInput.addEventListener('change', function() {
    topicsSelected = [];
    var selected = $(this).find("option:selected");
    //var arrSelected = [];
    selected.each(function(){
       topicsSelected.push($(this).val());
    });
    questionTopicsHelp.innerHTML = topicsSelected;
    console.log(selected);
    console.log(topicsSelected);

 });

  questionRangeInput.addEventListener('change', function() {
    range = this.value;
    rangeHelp.innerHTML = range;
    console.log(range);
 });

}, false);