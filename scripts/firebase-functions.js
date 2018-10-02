'use strict';

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

function initFirebase() {
    console.log("INIT FIREBASE")

    if (firebase.apps.length === 0) {

        console.log("FIREBASE APPS LENGTH === 0")

        var config = {
            apiKey: "AIzaSyDsROo9FA4DCDfGGDaeQaYgLtOJPza6ook",
            authDomain: "playmemorer.firebaseapp.com",
            databaseURL: "https://playmemorer.firebaseio.com",
            projectId: "playmemorer",
            storageBucket: "playmemorer.appspot.com",
            messagingSenderId: "603526460252"
        };
        firebase.initializeApp(config);

        console.log("FIREBASE INITIALIZED")
    } else {
        console.log("FIREBASE EXISTS");
    }
}

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
    // Remove all previously displayed memos.
    //topUserMemosSection.getElementsByClassName('memos-container')[0].innerHTML = '';
    //recentMemosSection.getElementsByClassName('memos-container')[0].innerHTML = '';
    //userMemosSection.getElementsByClassName('memos-container')[0].innerHTML = '';

    // Stop all currently listening Firebase listeners.
    listeningFirebaseRefs.forEach(function(ref) {
        ref.off();
    });
    listeningFirebaseRefs = [];
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

