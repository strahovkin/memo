'use strict';

// Shortcuts to DOM Elements.
var memoForm = document.getElementById('memoForm');
var titleInput = document.getElementById('new-memo-title');
var contentInput = document.getElementById('new-memo-content');

var messageInput = document.getElementById('new-memo-content');

var memoIsActiveInput = document.getElementById('memoIsActive');

var memoDifficultyInput = document.getElementById('memoDifficultySelect');

var memoTopicsInput = document.getElementById('memoTopicsSelect');
var memoTopicsHelp = document.getElementById('memoTopicsHelp');

var memoRangeInput = document.getElementById('memoRange');
var memoRangeHelp = document.getElementById('rangeHelp');

var fileInput = document.getElementById('file');
var linkbox = document.getElementById('linkbox');
var listeningFirebaseRefs = [];

var splashPage = document.getElementById('page-splash');

var topicMemosFetchButton = document.getElementById('topicMemosFetchButton');

var recentMemosSection = document.getElementById('recent-memos-list');
var userMemosSection = document.getElementById('user-memos-list');
var topUserMemosSection = document.getElementById('top-user-memos-list');
