'use strict';

function startTopicMemosFunctions() {
    initFirebase();
}

function fetchMemosFromTopic(topic) {
    //console.log('FETCH MEMOS FROM TOPIC');
    var memosRef = firebase.database().ref('memos');
    var topicMemosIdsRef = firebase.database().ref(topic);
    //console.log('TOPIC MEMOS REF TO STRING: ', topicMemosIdsRef.toString());
    var topicMemos = [];
    topicMemosIdsRef.limitToLast(100).once('value').then(function(snapshot) {
        var memosObject = snapshot.val();
        //console.log('MEMO OBJECT: ', memosObject);
        for (var key in memosObject) {
            if (memosObject.hasOwnProperty(key)) {
                topicMemos.push(key);
            }
            var memoRef = memosRef.child(key);
            //console.log('MEMO REF: ', memoRef.toString());
            memoRef.once('value').then(function(snapshot) {
                //console.log('MEMO OBJECT VALUE: ', memosObject);
                //var data = snapshot.val();
                //console.log('MEMO REF SNAPSHOT VAL: ', data);
                var sectionElement = document.getElementById('topic-memos-list');
                //console.log('SECTION: ', sectionElement);
                var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
                //console.log('CONTAINER: ', containerElement);
                //console.log('DATA: ', data);

                /*
                var card = createCardElement(snapshot);
                console.log('CARD: ', card);
                containerElement.insertBefore(card, containerElement.firstChild);
                */

                var cardHTML = createMemoHTML(snapshot);
                //console.log('CARD HTML: ', cardHTML);
                // Create the DOM element from the HTML.
                var div = document.createElement('div');
                div.innerHTML = cardHTML;
                //console.log(div.innerHTML);
                var cardElement = div.firstChild;
                containerElement.insertBefore(cardElement, containerElement.firstChild);
            });
        };
    });
}

function fetchMemo(memosRef, sectionElement) {
    console.log('FETCHED MEMO RESULT');
    memosRef.on('child_added', function(data) {
        //console.log('FETCHED POSTS CHILD ADDED');
        var author = data.val().author || 'Anonymous';
        var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
        //var memo = createMemoElement(data.key, data.val().title, data.val().body, author, data.val().uid, data.val().authorPic);
        var card = createCardElement(data);



        //   console.log('\nPOST: ');
        //console.log(card);
        containerElement.insertBefore(card, containerElement.firstChild);
        //console.log(containerElement);
    });
    memosRef.on('child_changed', function(data) {
        //console.log('FETCHED POSTS CHILD CHANGED');
        /*
                    var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
                    var memoElement = containerElement.getElementsByClassName('memo-' + data.key)[0];
                    memoElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
                    memoElement.getElementsByClassName('username')[0].innerText = data.val().author;
                    memoElement.getElementsByClassName('text')[0].innerText = data.val().body;
                    memoElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
                    */
    });
    memosRef.on('child_removed', function(data) {
        /*
                    //console.log('FETCHED POSTS CHILD REMOVED');
                    var containerElement = sectionElement.getElementsByClassName('memos-container')[0];
                    var memo = containerElement.getElementsByClassName('card' + data.key)[0];
                    memo.parentElement.removeChild(memo);
                    */
    });
}

var handler = function buttonHandler() {
    //console.log('TOPIC MEMOS FETCH BUTTON CLICKED');
    fetchMemosFromTopic('history');
};

// Bindings on load.
window.addEventListener('load', function() {
    firebase.auth().onAuthStateChanged(onAuthStateChanged);
    topicMemosFetchButton.addEventListener('click', handler)
}, false);