'use strict';

/**
 * Saves a new memo to the Firebase DB.
 */
// [START write_fan_out]
function writeNewMemo(uid, username, picture, title, body) {
    // A memo entry.
    var memoData = {
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

    // Get a key for a new Memo.
    var newMemoKey = firebase.database().ref().child('memos').push().key;

    // Write the new memo's data simultaneously in the memos list and the user's memo list.
    var updates = {};
    updates['/memos/' + newMemoKey] = memoData;
    updates['/user-memos/' + uid + '/' + newMemoKey] = memoData;

    return firebase.database().ref().update(updates);
};
// [END write_fan_out]

/**
 * Star/unstar memo.
 */
// [START memo_stars_transaction]
function toggleStar(memoRef, uid) {
    memoRef.transaction(function(memo) {
        if (memo) {
            if (memo.stars && memo.stars[uid]) {
                memo.starCount--;
                memo.stars[uid] = null;
            } else {
                memo.starCount++;
                if (!memo.stars) {
                    memo.stars = {};
                }
                memo.stars[uid] = true;
            }
        }
        return memo;
    });
};
// [END memo_stars_transaction]

/**
 * Creates a memo element.
 */
function createMemoElement(memoId, title, text, author, authorId, authorPic) {

    console.log('CREATE POST ELEMENT: ' + memoId);

    var uid = firebase.auth().currentUser.uid;

    var html =
        '<div class="memo memo-' + memoId + ' mdl-cell mdl-cell--12-col ' +
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
    var memoElement = div.firstChild;
    //if (componentHandler) {
    // componentHandler.upgradeElements(memoElement.getElementsByClassName('mdl-textfield')[0]);
    //}

    var addCommentForm = memoElement.getElementsByClassName('add-comment')[0];
    var commentInput = memoElement.getElementsByClassName('new-comment')[0];
    var star = memoElement.getElementsByClassName('starred')[0];
    var unStar = memoElement.getElementsByClassName('not-starred')[0];

    // Set values.
    memoElement.getElementsByClassName('text')[0].innerText = text;
    memoElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
    memoElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
    memoElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
        (authorPic || './silhouette.jpg') + '")';

    // Listen for comments.
    // [START child_event_listener_recycler]
    var commentsRef = firebase.database().ref('memo-comments/' + memoId);
    commentsRef.on('child_added', function(data) {
        addCommentElement(memoElement, data.key, data.val().text, data.val().author);
    });

    commentsRef.on('child_changed', function(data) {
        setCommentValues(memoElement, data.key, data.val().text, data.val().author);
    });

    commentsRef.on('child_removed', function(data) {
        deleteComment(memoElement, data.key);
    });
    // [END child_event_listener_recycler]

    // Listen for likes counts.
    // [START memo_value_event_listener]
    var starCountRef = firebase.database().ref('memos/' + memoId + '/starCount');
    starCountRef.on('value', function(snapshot) {
        updateStarCount(memoElement, snapshot.val());
    });
    // [END memo_value_event_listener]

    // Listen for the starred status.
    var starredStatusRef = firebase.database().ref('memos/' + memoId + '/stars/' + uid);
    starredStatusRef.on('value', function(snapshot) {
        updateStarredByCurrentUser(memoElement, snapshot.val());
    });

    // Keep track of all Firebase reference on which we are listening.
    listeningFirebaseRefs.push(commentsRef);
    listeningFirebaseRefs.push(starCountRef);
    listeningFirebaseRefs.push(starredStatusRef);

    // Create new comment.
    addCommentForm.onsubmit = function(e) {
        e.preventDefault();
        createNewComment(memoId, firebase.auth().currentUser.displayName, uid, commentInput.value);
        commentInput.value = '';
        commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
    };

    // Bind starring action.
    var onStarClicked = function() {
        var globalMemoRef = firebase.database().ref('/memos/' + memoId);
        var userMemoRef = firebase.database().ref('/user-memos/' + authorId + '/' + memoId);
        toggleStar(globalMemoRef, uid);
        toggleStar(userMemoRef, uid);
    };
    unStar.onclick = onStarClicked;
    star.onclick = onStarClicked;

    return memoElement;
};

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
        '<h5 class="card-title">Идентификатор</h5>' +
        '<p class="card-text">' + cardClass + '</p>' +
        '<h5 class="card-title">Вопрос</h5>' +
        '<p class="card-text ' + titleClass + '">Some quick example text to build on the card title and make up the bulk of the cards content.</p>' +
        '<h5 class="card-title">Ответ</h5>' +
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
    // componentHandler.upgradeElements(memoElement.getElementsByClassName('mdl-textfield')[0]);
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
     var commentsRef = firebase.database().ref('memo-comments/' + memoId);
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
     // [START memo_value_event_listener]
     var starCountRef = firebase.database().ref('memos/' + memoId + '/starCount');
     starCountRef.on('value', function(snapshot) {
      updateStarCount(cardElement, snapshot.val());
     });
     // [END memo_value_event_listener]

     // Listen for the starred status.
     var starredStatusRef = firebase.database().ref('memos/' + memoId + '/stars/' + uid);
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
      createNewComment(memoId, firebase.auth().currentUser.displayName, uid, commentInput.value);
      commentInput.value = '';
      commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
     };

     // Bind starring action.
     var onStarClicked = function() {
      var globalMemoRef = firebase.database().ref('/memos/' + memoId);
      var userMemoRef = firebase.database().ref('/user-memos/' + authorId + '/' + memoId);
      toggleStar(globalMemoRef, uid);
      toggleStar(userMemoRef, uid);
     };
     unStar.onclick = onStarClicked;
     star.onclick = onStarClicked;
    */
    return cardElement;
};


/**
 * Writes a new comment for the given memo.
 */
function createNewComment(memoId, username, uid, text) {
    firebase.database().ref('memo-comments/' + memoId).push({
        text: text,
        author: username,
        uid: uid
    });
};

/**
 * Updates the starred status of the memo.
 */
function updateStarredByCurrentUser(memoElement, starred) {
    if (starred) {
        memoElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
        memoElement.getElementsByClassName('not-starred')[0].style.display = 'none';
    } else {
        memoElement.getElementsByClassName('starred')[0].style.display = 'none';
        memoElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
    }
};

/**
 * Updates the number of stars displayed for a memo.
 */
function updateStarCount(memoElement, nbStart) {
    memoElement.getElementsByClassName('star-count')[0].innerText = nbStart;
};

/**
 * Creates a comment element and adds it to the given memoElement.
 */
function addCommentElement(memoElement, id, text, author) {
    var comment = document.createElement('div');
    comment.classList.add('comment-' + id);
    comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
    comment.getElementsByClassName('comment')[0].innerText = text;
    comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';

    var commentsContainer = memoElement.getElementsByClassName('comments-container')[0];
    commentsContainer.appendChild(comment);
};

/**
 * Sets the comment's values in the given memoElement.
 */
function setCommentValues(memoElement, id, text, author) {
    var comment = memoElement.getElementsByClassName('comment-' + id)[0];
    comment.getElementsByClassName('comment')[0].innerText = text;
    comment.getElementsByClassName('fp-username')[0].innerText = author;
};

/**
 * Deletes the comment of the given ID in the given memoElement.
 */
function deleteComment(memoElement, id) {
    var comment = memoElement.getElementsByClassName('comment-' + id)[0];
    comment.parentElement.removeChild(comment);
};

/**
 * Starts listening for new memos and populates memos lists.
 */
function startDatabaseQueries() {
    // [START my_top_memos_query]

    console.log('[START my_top_memos_query]');

    var myUserId = firebase.auth().currentUser.uid;
    var topUserMemosRef = firebase.database().ref('user-memos/' + myUserId).orderByChild('starCount');
    // [END my_top_memos_query]
    // [START recent_memos_query]
    var recentMemosRef = firebase.database().ref('memos').limitToLast(100);
    // [END recent_memos_query]
    var userMemosRef = firebase.database().ref('user-memos/' + myUserId);

    var fetchMemos = function(memosRef, sectionElement) {

        console.log('FETCHED POSTS RESULT');

        memosRef.on('child_added', function(data) {

            console.log('FETCHED POSTS CHILD ADDED');

            var author = data.val().author || 'Anonymous';
            var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
            //var memo = createMemoElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic);

            var card = createCardElement(data);

            //   console.log('\nPOST: ');

            console.log(card);

            containerElement.insertBefore(card, containerElement.firstChild);

            console.log(containerElement);

        });
        memosRef.on('child_changed', function(data) {

            console.log('FETCHED POSTS CHILD CHANGED');

            var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
            var memoElement = containerElement.getElementsByClassName('memo-' + data.key)[0];
            memoElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
            memoElement.getElementsByClassName('username')[0].innerText = data.val().author;
            memoElement.getElementsByClassName('text')[0].innerText = data.val().body;
            memoElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
        });
        memosRef.on('child_removed', function(data) {

            console.log('FETCHED POSTS CHILD REMOVED');

            var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
            var memo = containerElement.getElementsByClassName('card' + data.key)[0];
            memo.parentElement.removeChild(memo);
        });
    };

    // Fetching and displaying all memos of each sections.
    fetchMemos(topUserMemosRef, topUserMemosSection);
    fetchMemos(recentMemosRef, recentMemosSection);
    fetchMemos(userMemosRef, userMemosSection);

    // Keep track of all Firebase refs we are listening to.
    listeningFirebaseRefs.push(topUserMemosRef);
    listeningFirebaseRefs.push(recentMemosRef);
    listeningFirebaseRefs.push(userMemosRef);
};

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
};
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
    // Remove all previously displayed memos.
    topUserMemosSection.getElementsByClassName('memos-container')[0].innerHTML = '';
    recentMemosSection.getElementsByClassName('memos-container')[0].innerHTML = '';
    userMemosSection.getElementsByClassName('memos-container')[0].innerHTML = '';

    // Stop all currently listening Firebase listeners.
    listeningFirebaseRefs.forEach(function(ref) {
        ref.off();
    });
    listeningFirebaseRefs = [];
};

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
};

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
    recentMemosSection.style.display = 'none';
    userMemosSection.style.display = 'none';
    topUserMemosSection.style.display = 'none';
    addMemo.style.display = 'none';
    recentMenuButton.classList.remove('is-active');
    myMemosMenuButton.classList.remove('is-active');
    myTopMemosMenuButton.classList.remove('is-active');

    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
    if (buttonElement) {
        buttonElement.classList.add('is-active');
    }
};


function fetchMemos() {

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
};

// Bindings on load.
window.addEventListener('load', function() {

    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(onAuthStateChanged);

}, false);