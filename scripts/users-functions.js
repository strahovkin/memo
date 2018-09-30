function initUsers() {
    // Listening for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function(user) {
        // [START_EXCLUDE silent]
        // [END_EXCLUDE]
        if (user) {
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            var providerData = user.providerData;
            // [START_EXCLUDE]
            document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
            if (!emailVerified) {}
            // [END_EXCLUDE]
        } else {
            // User is signed out.
            // [START_EXCLUDE]
            document.getElementById('quickstart-account-details').textContent = 'null';
            // [END_EXCLUDE]
        }
        // [START_EXCLUDE silent]
        // [END_EXCLUDE]
    });
    // [END authstatelistener]
    console.log("USERS");
    document.getElementById('user1Button').addEventListener('click', toggleUserButton(this), false);
    document.getElementById('user2Button').addEventListener('click', toggleUserButton(this), false);
    document.getElementById('user3Button').addEventListener('click', toggleUserButton(this), false);
    document.getElementById('user4Button').addEventListener('click', toggleUserButton(this), false);
}

function toggleUserButton(button) {

    var button1 = $('#user1Button')[0].nextSibling;
    var button2 = $('#user2Button')[0].nextSibling;
    var button3 = $('#user3Button')[0].nextSibling;
    var button4 = $('#user4Button')[0].nextSibling;

    if (button.id == "user1Button") {
        toggleSignIn("aaa@aaa.aaa", "aaaaaa");

        button1.textContent = 'User 1 Active';
        button2.textContent = '2';
        button3.textContent = '3';
        button4.textContent = '4';

    } else if (button.id == "user2Button") {
        toggleSignIn("bbb@bbb.bbb", "bbbbbb");

        button1.textContent = '1';
        button2.textContent = 'User 2 Active';
        button3.textContent = '3';
        button4.textContent = '4';

    } else if (button.id == "user3Button") {
        toggleSignIn("ccc@ccc.ccc", "cccccc");

        button1.textContent = '1';
        button2.textContent = '2';
        button3.textContent = 'User 3 Active';
        button4.textContent = '4';

    } else if (button.id == "user4Button") {
        toggleSignIn("ddd@ddd.ddd", "dddddd");

        //$('#user1Button').removeClass('btn-primary').addClass('btn-secondary');
        //$('#user2Button').removeClass('btn-primary').addClass('btn-secondary');
        //$('#user3Button').removeClass('btn-primary').addClass('btn-secondary');
        //$(button).removeClass('btn-secondary').addClass('btn-primary');

        button1.textContent = '1';
        button2.textContent = '2';
        button3.textContent = '3';
        button4.textContent = 'User 4 Active';
        //$(button).addClass('active');

    } else {
        console.log("###"); // points to the clicked input button
    }
    console.log("THIS BUTTON: " + button);
    console.log(button1);
    console.log(button2);
    console.log(button3);
    console.log(button4);

}

function toggleSignIn(email, password) {
    if (firebase.auth().currentUser) {
        if (firebase.auth().currentUser.email == email) {
            // [START signout]
            //firebase.auth().signOut();
            // [END signout]
            alert('Current User! ' + email);
        } else {
            if (email.length < 4) {
                alert('Please enter an email address.');
                return;
            }
            if (password.length < 4) {
                alert('Please enter a password.');
                return;
            }
            // Sign in with email and pass.
            // [START authwithemail]
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // [START_EXCLUDE]
                if (errorCode === 'auth/wrong-password') {
                    alert('Wrong password.');
                } else {
                    alert(errorMessage);
                }
                console.log(error);
                initUsers();
                //document.getElementById('quickstart-sign-in').disabled = false;
                // [END_EXCLUDE]
            });
            // [END authwithemail]
        }
    }
    //document.getElementById('quickstart-sign-in').disabled = true;
}
