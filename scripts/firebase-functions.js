function initFirebase() {
	console.log("INIT FIREBASE")

	if (firebase.apps.length === 0) {

		console.log("FIREBASE APPS LENGTH === 0")

		var config = {
    		apiKey: "AIzaSyDsROo9FA4DCDfGGDaeQaYgLtOJPza6ook",
    		authDomain: "####.firebaseapp.com",
    		databaseURL: "https://####.firebaseio.com",
    		projectId: "####",
    		storageBucket: "####.appspot.com",
    		messagingSenderId: "603526460252"
  		};
 		firebase.initializeApp(config);

 		console.log("FIREBASE INITIALIZED")
	} else {
		console.log("FIREBASE EXISTS");
	}
}
