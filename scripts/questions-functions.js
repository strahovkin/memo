'use strict';

// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('new-post-message');
var titleInput = document.getElementById('new-post-title');
//var signInButton = document.getElementById('sign-in-button');
//var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
//var addPost = document.getElementById('add-post');
//var addButton = document.getElementById('add');
var recentPostsSection = document.getElementById('recent-posts-list');
var userPostsSection = document.getElementById('user-posts-list');
var topUserPostsSection = document.getElementById('top-user-posts-list');
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

  console.log('CREATE POST ELEMENT: ' + postId);

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

var card = 
            '<h1>Question Card</h1>' +
            '<div class="card" style="width: 18rem;">' +
                '<img class="card-img-top" src=".../100px180/?text=Image cap" alt="Card image cap">' +
                '<div class="card-body" id="author">' +
                    '<h5 class="card-title">Author</h5>' +
                    '<p class="card-text" id="authorValue">Some quick example text to build on the card title and make up the bulk of the cards content.</p>' +
                '</div>' +
                '<div class="card-body" id="title">' +
                    '<h5 class="card-title">Title</h5>' +
                    '<p class="card-text" id="titleValue">Some quick example text to build on the card title and make up the bulk of the cards content.</p>' +
                '</div>' +
                '<div class="card-body" id="content">' +
                    '<h5 class="card-title">Content</h5>' +
                    '<p class="card-text" id="contentValue">Some quick example text to build on the card title and make up the bulk of the cards content.</p>' +
                '</div>' +
                '<ul class="list-group list-group-flush" id="topics">' +
                    '<li class="list-group-item">Cras justo odio</li>' +
                    '<li class="list-group-item">Dapibus ac facilisis in</li>' +
                    '<li class="list-group-item">Vestibulum at eros</li>' +
                '</ul>' +
                '<div class="card-body">' +
                    '<a href="#" class="card-link">Card link</a>' +
                    '<a href="#" class="card-link">Another link</a>' +
                '</div>' +
            '</div>';


 // Create the DOM element from the HTML.
 var div = document.createElement('div');
 div.innerHTML = html;
 var postElement = div.firstChild;
 //if (componentHandler) {
 // componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
 //}

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
 * Creates a card element.
 */
function createCardElement(data) {


 var uid = firebase.auth().currentUser.uid;

 var key = data.key;

 var author = data.val().author;

 var cardClass = 'card' + key; 

 var content = data.val().body;
 var contentClass = 'content' + key; 

 var difficulty = data.val().difficulty;
 var fileURL = data.val().fileURL;
 var isActive = data.val().isActive;
 var range = data.val().range;

 var title = data.val().title;
  var titleClass = 'title' + key; 

 var topics = data.val().topics;
 var userID = data.val().uid;

  console.log('\nCREATE POST ELEMENT: ' + key);

var list = '<ul class="list-group list-group-flush">'

topics.forEach(element => {
  var li = '<li class="list-group-item">' + element + '</li>';
  list = list + li;
});

list = list + '</ul>';

var html = 
            '<div class="card ' + cardClass + ' text-center">' +
                '<img class="card-img-top" src="' + fileURL + '" alt="Card image cap">' +
                '<div class="card-body">' +
                    '<h5 class="card-title">Author</h5>' +
                    '<p class="card-text">' + cardClass + '</p>' +
                    '<h5 class="card-title">Title</h5>' +
                    '<p class="card-text ' + titleClass + '">Some quick example text to build on the card title and make up the bulk of the cards content.</p>' +
                    '<h5 class="card-title">Content</h5>' +
                    '<p class="card-text ' + contentClass + '">Some quick example text to build on the card title and make up the bulk of the cards content.</p>' +
                    list + '</br>' +
                    '<a href="#" class="btn btn-primary">Выбрать</a>' + '</br>' +
                    '<a href="#" class="card-link">Подробно...</a>' +
                '</div>' +
            '</div>';

 // Create the DOM element from the HTML.
 var div = document.createElement('div');
 div.innerHTML = html;
 //console.log(div.innerHTML);


 var cardElement = div.firstChild;

 //console.log(cardElement);


 //if (componentHandler) {
 // componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
 //}
/*
 var addCommentForm = cardElement.getElementsByClassName('add-comment')[0];
 var commentInput = cardElement.getElementsByClassName('new-comment')[0];
 var star = cardElement.getElementsByClassName('starred')[0];
 var unStar = cardElement.getElementsByClassName('not-starred')[0];
*/

  var cardTitle = cardElement.getElementsByClassName(titleClass)[0];
  console.log(cardTitle);
  cardTitle.innerText = title;

  var cardContent = cardElement.getElementsByClassName(contentClass)[0];
  console.log(cardContent);
  cardContent.innerText = content;


/*
 // Set values.
 cardElement.getElementsByClassName('body')[0].innerText = body;
  cardElement.getElementsByClassName('title')[0].innerText = title;

 cardElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
 cardElement.getElementsByClassName('author')[0].innerText = author || 'Anonymous';
 cardElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
  (authorPic || './silhouette.jpg') + '")';

 // Listen for comments.
 // [START child_event_listener_recycler]
 var commentsRef = firebase.database().ref('post-comments/' + postId);
 commentsRef.on('child_added', function(data) {
  addCommentElement(cardElement, data.key, data.val().text, data.val().author);
 });

 commentsRef.on('child_changed', function(data) {
  setCommentValues(cardElement, data.key, data.val().text, data.val().author);
 });

 commentsRef.on('child_removed', function(data) {
  deleteComment(cardElement, data.key);
 });
 // [END child_event_listener_recycler]

 // Listen for likes counts.
 // [START post_value_event_listener]
 var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
 starCountRef.on('value', function(snapshot) {
  updateStarCount(cardElement, snapshot.val());
 });
 // [END post_value_event_listener]

 // Listen for the starred status.
 var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid);
 starredStatusRef.on('value', function(snapshot) {
  updateStarredByCurrentUser(cardElement, snapshot.val());
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
*/
 return cardElement;
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

       console.log('[START my_top_posts_query]');

 var myUserId = firebase.auth().currentUser.uid;
 var topUserPostsRef = firebase.database().ref('user-posts/' + myUserId).orderByChild('starCount');
 // [END my_top_posts_query]
 // [START recent_posts_query]
 var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
 // [END recent_posts_query]
 var userPostsRef = firebase.database().ref('user-posts/' + myUserId);

 var fetchPosts = function(postsRef, sectionElement) {

  console.log('FETCHED POSTS RESULT');

  postsRef.on('child_added', function(data) {

  console.log('FETCHED POSTS CHILD ADDED');

   var author = data.val().author || 'Anonymous';
   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
   //var post = createPostElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic);

   var card = createCardElement(data);

   //   console.log('\nPOST: ');

  console.log(card);

   containerElement.insertBefore(card, containerElement.firstChild);

     console.log(containerElement);

  });
  postsRef.on('child_changed', function(data) {

  console.log('FETCHED POSTS CHILD CHANGED');

   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
   var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
   postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
   postElement.getElementsByClassName('username')[0].innerText = data.val().author;
   postElement.getElementsByClassName('text')[0].innerText = data.val().body;
   postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
  });
  postsRef.on('child_removed', function(data) {

  console.log('FETCHED POSTS CHILD REMOVED');

   var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
   var post = containerElement.getElementsByClassName('card' + data.key)[0];
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
  //splashPage.style.display = 'none';
  writeUserData(user.uid, user.displayName, user.email, user.photoURL);
  startDatabaseQueries();
 } else {
  // Set currentUID to null.
  currentUID = null;
  // Display the splash page where you can sign-in.
  //splashPage.style.display = '';
 }
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


function fetchQuestions() {

 initFirebase();

 var auth = firebase.auth();
 var storageRef = firebase.storage().ref();

 window.onload = function() {
  auth.onAuthStateChanged(function(user) {
   if (user) {
    console.log('Anonymous user signed-in.', user);
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

// Bindings on load.
window.addEventListener('load', function() {

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

}, false);
