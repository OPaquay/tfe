//Get the user saved in localstorage
var user_save = localStorage.getItem("user");
var user = JSON.parse(user_save);
var userProfilePictSrc = '';

//Initialize map var
var userMarker = '';
var messageMarker = [];
var messagesMarker = [];
var mapIsLoaded = false;
var map;

$(document).ready(function(){

    var app = {
        // Application Constructor
        initialize: function() {
            this.bindEvents();
        },
        // Bind Event Listeners
        //
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        bindEvents: function() {
            document.addEventListener('deviceready', this.onDeviceReady, false);
        },
        // deviceready Event Handler
        //
        // The scope of 'this' is the event. In order to call the 'receivedEvent'
        // function, we must explicitly call 'app.receivedEvent(...);'
        onDeviceReady: function() {
            app.receivedEvent('deviceready');
            FastClick.attach(document.body);
            pictureSource = navigator.camera.PictureSourceType;
            destinationType = navigator.camera.DestinationType;
            
            //Map config
            map = plugin.google.maps.Map.getMap(document.getElementById('map'), {
                'camera': {
                    'latLng': {lat: -34.397, lng: 150.644},
                    'zoom': 15,
                    'tilt': 70
                },
                'controls': {
                    'compass': false
                }, 
                'gestures': {
                    'scroll': false,
                    'tilt': false,
                    'rotate': false,
                    'zoom': true
                }
            });
            
            map.addEventListener(plugin.google.maps.event.MAP_READY, onMapReady);
        },
        
        // Update DOM on a Received Event
        receivedEvent: function(id) {
            var parentElement = document.getElementById(id);
            //var listeningElement = parentElement.querySelector('.listening');
            //var receivedElement = parentElement.querySelector('.received');

            //listeningElement.setAttribute('style', 'display:none;');
            //receivedElement.setAttribute('style', 'display:block;');

            console.log('Received Event: ' + id);
        }    
    
    };
    
    //Add marker on Map ready
    function onMapReady() {
        if(userMarker != ''){
            userMarker.remove();
        }
        mapIsLoaded = true;
        map.addMarker({
            'position': {lat: -34.397, lng: 150.644},
        }, function(marker) {
            marker.setIcon({
                'url': 'www/img/point.png'
            });
            userMarker = marker;
        });
    }
    
    app.initialize();
    
    //Initialize location var
    var latlng;
    var currentPosition = {
        lat : '', 
        lng : '',
        heading : ''
    };
    var lockedPosition = '';
    
    //Convert Radians
    function convertRadians(e){
        return (e* (Math.PI/180));
    }
    
    //Round Number
    function round(number,X) {
	   X = (!X ? 3 : X);
	   return Math.round(number*Math.pow(10,X))/Math.pow(10,X);
    }
    
    //Compute distance between user and messages
    function calculDistance(userPosition, messagePosition) {
        var pointA = {
            lat : userPosition.lat,
            lng : userPosition.lng
        }
        var pointB = {
            lat: messagePosition.lat,
            lng: messagePosition.lng
        }
        pointA.lat = convertRadians(pointA.lat);
        pointA.lng = convertRadians(pointA.lng);
        pointB.lat = convertRadians(pointB.lat);
        pointB.lng = convertRadians(pointB.lng);
        
        var distance = Math.acos(Math.cos(pointA.lat)*Math.cos(pointB.lat)*Math.cos(pointA.lng)*Math.cos(pointB.lng)+Math.cos(pointA.lat)*Math.sin(pointA.lng)*Math.cos(pointB.lat)*Math.sin(pointB.lng)+Math.sin(pointA.lat)*Math.sin(pointB.lat));
        
        distance = round(6378*distance);
        return distance;
    }
    
    //Add marker for detected messages
    function addMarker() {
        if(messageMarker != ''){
            for(var j=0; i<messageMarker.length; i++) {
                messageMarker[0].remove();
            }
        }
        for(var i = 0; i < messagesMarker.length; i++){
            data = messagesMarker[i];
            messageLatLng = new plugin.google.maps.LatLng( data.lat, data.lng);
            map.addMarker({
                'position': messageLatLng,
                'markerId': data.id,
                'icon': {
                    'url': 'www/img/yellow_point.png'
                }
            }, function(marker) {
                marker.addEventListener(plugin.google.maps.event.MARKER_CLICK, function() {
                    markerId = marker.get("markerId");
                    $('.message--detected#' + markerId).click();
                });
                messageMarker.push(marker);
            });
        }
    }
    
    //Display that a message has been detected
    function messageDetected(message) {
        message.detected = true;
        var messageDetectedPosition = {
            id : message.id,
            lat : message.message_lat,
            lng : message.message_lng
        };
        messagesMarker.push(messageDetectedPosition);
        $('.activities--list').prepend('<li class="message--detected" id="' + message.id + '">Un message a été détecté dans ta zone !</li>');
        $('.activities--list #' + message.id).append('<p class="activity-date">À l\'instant</p>');
        if(user.activities.length != 0) {
            $('.activities--list').css('border-left', '2px solid #47ACFF');
        }
        
    }
    
    //Check if a message is in the area
    function checkWaitingMessages(userPosition) {
        
        if (user.waitingMessages.length != 0) {
            for (var i = 0; i < user.waitingMessages.length; i++) {
                var messagePosition;
                var distanceFromMessage;
                
                messagePosition = {
                    lat: user.waitingMessages[i].message_lat,
                    lng : user.waitingMessages[i].message_lng
                };
                
                distanceFromMessage = calculDistance(userPosition, messagePosition);
                messageIsDetected = user.waitingMessages[i].detected;
                
                if (distanceFromMessage <= 0.5 && messageIsDetected != true) {
                    user.waitingMessages[i].distance = distanceFromMessage;
                    messageDetected(user.waitingMessages[i]);
                    
                } else if (distanceFromMessage > 0.5 && messageIsDetected == true) {
                    user.waitingMessages[i].detected = false;
                    $('#' + user.waitingMessages[i].id).remove();
                }
            }
        }
        if(mapIsLoaded == true) {
            addMarker();
        }
    }
    
    //Execute after getting user position
    function getPosition(position) {
        if(mapIsLoaded == true) {
            latlng = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            userMarker.setPosition(latlng);
      
            map.setCenter(latlng);
        }
        currentPosition.lat = position.coords.latitude; 
        currentPosition.lng = position.coords.longitude;
        currentPosition.heading = position.coords.heading;
        
        checkWaitingMessages(currentPosition);
    }
    
    function erreurPosition(error) {
        var info = "Erreur lors de la géolocalisation : ";
        switch(error.code) {
            case error.TIMEOUT:
                info += "Timeout !";
                break;
            case error.PERMISSION_DENIED:
                info += "vous n'avez pas donné la permission";
                break;
            case error.POSITION_UNAVAILABLE:
                info += "La position n'a pu être déterminée";
                break;
            case error.UNKNOWN_ERROR:
                info += "Erreur inconnue";
                break;
        }
    }
    
    //Watch user position
    var watchPosition = function(){
        if(navigator.geolocation) {
            survId = navigator.geolocation.watchPosition(getPosition, erreurPosition, {enableHighAccuracy: true});
        } else {
            alert("Ce navigateur ne supporte pas la géolocalisation");
        }
    };
    
    //Display errors
    var showErrors = function(errors, screen){
        $('p.error').hide();
        for (var error in errors){
            if (typeof errors[error] !== 'function') {
                $('#' + screen + '-screen .error#' + error + '-error').show().text(errors[error]);
            }
        }
        console.log(errors);
    };
    
    //Load user activities
    var loadActivities = function(userId) {
        $.ajax({
            type: 'POST',
            data: 'userId=' + userId,
            url: 'http://oliviapaquay.be/dropit/loadactivities.php',
            success: function(data) {
                var activitiesList = JSON.parse(data);
                user.activities = [];
                for(var i = 0; i < activitiesList.length; i++) {
                    user.activities.push(activitiesList[i]);
                };
            },
            error: function(){
                alert('There was an error');
            }
        });
    };
    
    //Load activities participants
    var loadActivitiesParticipants = function() {
        for (var i = 0; i < user.activities.length; i++) {
            if (user.activities[i].type === "friendrequest" || user.activities[i].type === "friendrequestaccepted" || user.activities[i].type === "messageFounded" || user.activities[i].type === "messageFoundedBy" || user.activities[i].type === "friendrequestacceptedby" || user.activities[i].type === "messagedropped") {
                $.ajax({
                    type: 'POST',
                    async: false,
                    data: 'activityId=' + user.activities[i].id,
                    url: 'http://oliviapaquay.be/dropit/loadactivityparticipants.php',
                    success: function(data) {
                        var participantsList = JSON.parse(data);
                        user.activities[i].participants = [];
                        for(var j = 0; j < participantsList.length; j++) {
                            user.activities[i].participants.push(participantsList[j]);
                        };
                    },
                    errors: function() {
                        alert('There was an error');
                    }
                });
            }
        }
        
    };
    
    //Load user's friendlist
    var loadFriends = function(userId) {
        $.ajax({
            type: 'POST',
            data: 'userId=' + userId,
            url: 'http://oliviapaquay.be/dropit/loadfriends.php',
            success: function(data) {
                var friendList = JSON.parse(data);
                user.friendList = [];
                for(var i = 0; i < friendList.length; i++) {
                    if(friendList[i].id !== userId) {
                        user.friendList.push(friendList[i]);
                    }
                };
            },
            error: function(){
                alert('There was an error');
            }
        });
    };
    
    //Load messages sended by user
    var loadSendedMessages = function(){
        $.ajax({
            type: 'POST',
            data: 'userId=' + user.userId,
            url: 'http://oliviapaquay.be/dropit/loadsendedmessages.php',
            success: function(data) {
                var sendedMessages = JSON.parse(data);
                user.sendedMessages = [];
                for(var i = 0; i < sendedMessages.length; i++) {
                    user.sendedMessages.push(sendedMessages[i]);
                };
            },
            error: function(){
                alert('There was an error');
            }
        });
    };
    
    //Compute the time passed from initial time until now
    function calculTimePassed(initialTime, now){
            var timePassed = now - initialTime;
            var secondPassed = Math.floor((timePassed / 1000));
            var minutePassed = Math.floor((secondPassed / 60));
            var hourPassed = Math.floor((minutePassed / 60));
            var daysPassed = Math.floor((hourPassed / 24));
            var weekPassed = Math.floor((daysPassed / 7));
            var monthsPassed = Math.floor((daysPassed / 30.41));
            var yearPassed = Math.floor((daysPassed / 365));
            var textActivityTime;
            
            if(secondPassed < 60) {
                textActivityTime = 'À l\'instant';
            } else if(minutePassed < 60) {
                if(minutePassed == 1) {
                    textActivityTime = 'Il y\' à 1 minute';
                } else {
                    textActivityTime = 'Il y\' à ' + minutePassed + ' minutes';
                }
            } else if(hourPassed < 24) {
                if(hourPassed == 1) {
                    textActivityTime = 'Il y\' à 1 heure';
                } else {
                    textActivityTime = 'Il y\' à ' + hourPassed + ' heures';
                }
            } else if(daysPassed < 7) {
                if(daysPassed == 1) {
                    textActivityTime = 'Il y\' à 1 jour';
                } else {
                    textActivityTime = 'Il y\' à ' + daysPassed + ' jours';
                }
            } else if(monthsPassed < 1) {
                if(weekPassed == 1) {
                    textActivityTime = 'Il y\'à 1 semaine';
                } else {
                    textActivityTime = 'Il y\' à ' + weekPassed + ' semaines';
                }
            } else if(daysPassed < 365) {
                if(monthsPassed == 1) {
                    textActivityTime = 'Il y\'à 1 mois';
                } else {
                    textActivityTime = 'Il y\'à ' + monthsPassed + ' mois';
                }
            } else {
                if(yearPassed == 1) {
                    textActivityTime = 'Il y\'à 1 an';
                } else {
                    textActivityTime = 'Il y\'à '+ yearPassed + ' ans';
                }
            }
        
            return textActivityTime;
    }
    
    //Display activity list
    var displayActivities = function() {
        if (user.activities.length > 1){
            $('.activities--list').css('border-left', '2px solid #47ACFF');
        } else {
            $('.activities--list').css('border-left', 'none');
            if(user.friendList.length == 0){
                $('.suggest-friend').show();
            }
        }
        $('.activities--list li').remove();
        for(var i = 0; i < user.activities.length; i++) {
            var activity = user.activities[i];
            var activityText;
            var activityId = activity.id;
            var activityClass;
            
            var sqlActivityTime = activity.date.split(/[- :]/);
            var activityTime = new Date(sqlActivityTime[0], sqlActivityTime[1]-1, sqlActivityTime[2], sqlActivityTime[3], sqlActivityTime[4], sqlActivityTime[5]);
            var currentTime = new Date;
            
            activityTime = activityTime.getTime();
            currentTime = currentTime.getTime();
            var textActivityTime = calculTimePassed(activityTime, currentTime);
            
            switch (activity.type) {
                
                case 'inscription':
                    activityText = "Tu as commencé à utilisé Drop It";
                    activityClass = "inscription-activity";
                    break;
                case 'friendrequest':
                    var activityParticipantUsername = activity.participants[0].participant_username;
                    activityText = activityParticipantUsername + ' t\a envoyé une demande d\'ami';
                    activityClass = "friendrequest-activity";
                    break;
                case 'friendrequestaccepted':
                    var activityParticipantUsername = activity.participants[0].participant_username;
                    activityText = 'Tu es désormais ami avec ' + activityParticipantUsername;
                    activityClass = "requestaccepted-activity";
                    break;
                case 'friendrequestacceptedby':
                    var activityParticipantUsername = activity.participants[0].participant_username;
                    activityText = activityParticipantUsername + ' a accepté ta demande d\'amis';
                    activityClass = "requestacceptedby-activity";
                    break;
                case 'messageFounded':
                    activityText = 'Tu as trouvé un message de ' + activity.participants[0].participant_username;
                    activityClass = "messagefounded-activity";
                    break;
                case 'messageFoundedBy':
                    if (activity.participants.length == 1) {
                        activityText = activity.participants[0].participant_username + ' a trouvé ton message';
                    } else if (activity.participants.length > 1) {
                        var activityParticipants = activity.participants[0].participant_username;
                        for (var j = 1; j < activity.participants.length; j++) {
                            if(j != (activity.participants.length - 1)) {
                                activityParticipants += (', ' + activity.participants[j].participant_username);
                            } else {
                                activityParticipants += (' et ' + activity.participants[j].participant_username);
                            }
                        }
                        activityText = activityParticipants + ' ont trouvés ton message !';
                        activityClass = "messagefoundedby-activity";
                    }
                    break;
                case 'messagedropped':
                    if (activity.participants.length == 1) {
                        activityText = 'Message déposé pour ' + activity.participants[0].participant_username;
                    } else if (activity.participants.length > 1) {
                        var activityParticipants = activity.participants[0].participant_username;
                        for (var j = 1; j < activity.participants.length; j++) {
                            if(j != (activity.participants.length - 1)) {
                                activityParticipants += (', ' + activity.participants[j].participant_username);
                            } else {
                                activityParticipants += (' et ' + activity.participants[j].participant_username);
                            }
                        }
                        activityText = 'Message déposé pour ' + activityParticipants;
                        activityClass = "messagedropped-activity";
                    } else if(activity.participants.length == 0){
                        activityText = 'Message public déposé';
                    }
                    break;
            }
            
            $('.activities--list').append('<li class="' + activityClass + '" id="' + activityId + '">' + activityText + '</li>');
            $('.activities--list #' + activityId).append('<p class="activity-date">' + textActivityTime + '</p>');
            $('.activities--list #' + activityId).append('<button class="delete-activity" data-role="none">Supprimer</button>');
        }
    };
    
    //Delete activity
    $('.app').on('click', '.delete-activity', function(){
        var activityId = $(this).parent().attr('id');
        $.ajax({
            type: 'POST',
            data: 'activityId=' + activityId,
            url : 'http://oliviapaquay.be/dropit/deleteactivity.php',
            success: function(data) {
                for(var i=0; i<user.activities.length; i++) {
                    if(user.activities[i].id == activityId) {
                        user.activities.splice(i, 1);
                    }
                }
            },
            error: function() {
                alert('There was an error');
            }
        });
        $('.activities--list li#' + activityId).remove();
        if (user.activities.length < 1){
            $('.activities--list').css('border-left', 'none');
        }
    });
    
    //Start ajax request when others are complete
    $(document).ajaxComplete(function(event,request, settings) {
        if(settings.url == "http://oliviapaquay.be/dropit/loadfriends.php") {
            loadActivities(user.userId);
        } else if(settings.url == "http://oliviapaquay.be/dropit/loadactivities.php") {
            loadActivitiesParticipants();
        }
    });
    
    //Save and process user data on ajax stop
    $(document).ajaxStop(function(){
        user_save = JSON.stringify(user);
        localStorage.setItem("user", user_save);
        displayActivities();
        watchPosition();
        console.log(user);
    });
    
    var windowHeight = $(window).height();
    $('.views').css('height', windowHeight + 'px');
    var previousView = 'home-screen';
    var watchHeadingId;
    var repeat;
    
    var selectView = function(viewId){
        $('p.error').hide();
        previousView = $('.views:visible').attr('id');
        if(previousView == 'message-screen') {
            navigator.compass.clearWatch(watchHeadingID);
            clearTimeout(repeat);
        }
        $('header').show();
        $('header .back--button').addClass('open--menu').removeClass('back--button');
        if(viewId == 'inscription') {
            $('#inscription-screen').show();
            $('#connexion-screen').hide('slide', {direction: 'up'});
        } else {
            $('.views').hide()
            $('#' + viewId + '-screen').show();
        }
        if(viewId == 'home') {
            $('header').show();
            $('button.add--message').show();
            $('.open--profile').css('background-image', 'url("http://oliviapaquay.be/dropit/upload/' + user.profilePictSrc + '")');
            loadFriends(user.userId);
            loadWaitingMessages(user.userId);
            $('#home-screen').css('height', (windowHeight - 54) + 'px');
        } else if(viewId == 'message') {
            $('#message-screen').css('height', (windowHeight) + 'px');
            $('header').hide();
        } else if(viewId == 'inscription') {
            $('#inscription-screen').css('height', (windowHeight) + 'px');
            $('header').hide();
        } else if(viewId == 'connexion') {
            $('#connexion-screen').css('height', (windowHeight) + 'px');
            $('header').hide();
        } else if(viewId == 'intro') {
            $('header').hide();
        }
    }
    
    //Load waiting messages
    var loadWaitingMessages = function(userId) {
        $.ajax({
            type: 'POST',
            data: 'userId=' + userId,
            url : 'http://oliviapaquay.be/dropit/loadwaitingmessages.php',
            success: function(data) {
                var waitingMessages = JSON.parse(data);
                user.waitingMessages = [];
                for(var i = 0; i < waitingMessages.length; i++) {
                    user.waitingMessages.push(waitingMessages[i]);
                    user.waitingMessages[i].detected = false;
                };
            },
            error: function() {
                alert('There was an error');
            }
        });
    }
    
    //Connect the user if a user is saved and connected
    if(user != null && user.connected == "connected") {
        window.location.hash = 'home-screen';
        $.mobile.initializePage();
        $('.open--profile').css('background-image', 'url("http://oliviapaquay.be/dropit/upload/' + user.profilePictSrc + '")');
        loadFriends(user.userId);
        loadWaitingMessages(user.userId);
        loadSendedMessages();
    } else {
        window.location.hash = 'connexion-screen';
        $.mobile.initializePage();
    }
    
    var imageURI = '';
    
    function clearCache() {
        navigator.camera.cleanup();
    }
    
    var retries = 0;
    //Save profile pict on server
    function transferPhoto(URI){
        var win = function (r) {
            clearCache();
            retries = 0;
            user.profilePictSrc = user.userId + '-profilePict.jpg'
        }

        var fail = function (error) {
            if (retries == 0) {
                retries ++
                setTimeout(function() {
                    transferPhoto(imageURI)
                }, 1000)
            } else {
                retries = 0;
                clearCache();
                alert('Ups. Something wrong happens!');
            }
        }

        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = URI.substr(URI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        
        options.params = {};
        options.params.userId = user.userId;
        
        options.chunkedMode = false;
        
        var ft = new FileTransfer();
        ft.upload(URI, encodeURI("http://oliviapaquay.be/dropit/upload.php"), win, fail, options);
    }
    
    //Process inscription
    $('#inscription').submit(function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var inscriptionData = $(this).serialize();
        
        $.ajax({
            type: 'POST',
            data: inscriptionData + '&imageURI=' + imageURI,
            url: 'http://oliviapaquay.be/dropit/inscription.php',
            success: function(data) {
                var connexionAnswer = JSON.parse(data);
                if(connexionAnswer.type == "errors" || imageURI == ''){
                    var errors = connexionAnswer;
                    if (imageURI == '') {
                        errors.profilepict = 'Veuillez sélectionnez une photo de profil';
                    }
                    showErrors(errors, "inscription");
                } else if(connexionAnswer.type == "connected") {
                    var userData = connexionAnswer;
                    user = {
                        userId : userData.id,
                        username : userData.username,
                        connected : "connected",
                        friendList: [],
                        activities : [],
                        sendedMessages : [],
                        waitingMessages : [],
                        foundedMessages : []
                    };
                    user_save = JSON.stringify(user);
                    localStorage.setItem("user", user_save);
                    transferPhoto(imageURI);
                    loadFriends(user.userId);
                    loadWaitingMessages(user.userId);
                    loadSendedMessages();
                    $.mobile.changePage( "#intro-screen", { transition: "slide", changeHash: false });
                }
                
            },
            error: function(){
                alert('There was an error');
            }
        });
    
        return false;
    })
    
    //Process connection
    $('#connexion').submit(function(e){
        e.preventDefault();
        e.stopPropagation();
        
        var connexionData = $(this).serialize();
        
        $.ajax({
            type: 'POST',
            data: connexionData,
            url: 'http://oliviapaquay.be/dropit/connexion.php',
            success: function(data) {
                var connexionAnswer = JSON.parse(data);
                if(connexionAnswer.type == "errors"){
                    var errors = connexionAnswer;
                    showErrors(errors, "connexion");
                } else if(connexionAnswer.type == "connected") {
                    var userData = connexionAnswer;
                    user = {
                        userId : userData.id,
                        username : userData.username,
                        profilePictSrc : userData.pict_src,
                        connected : "connected",
                        friendList : [],
                        activities : [],
                        sendedMessages : [],
                        waitingMessages : [],
                        foundedMessages : []
                    };
                    user_save = JSON.stringify(user);
                    localStorage.setItem("user", user_save);
                    loadFriends(user.userId);
                    loadWaitingMessages(user.userId);
                    loadSendedMessages();
                    //selectView('home');
                    $('.open--profile').css('background-image', 'url("http://oliviapaquay.be/dropit/upload/' + user.profilePictSrc + '")');
                    $.mobile.changePage( "#home-screen", { transition: "fade", changeHash: false });
                }
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    //Log out
    $('.app').on('click', '.log-out', function() {
        user.connected = "not connected";
        var user_save = JSON.stringify(user);
        localStorage.setItem("user", user_save);
    });
    
    var displayNextStep = function(nextStep) {
        $('p.errors').remove();
        $('#intro-screen .step').removeClass('hide').addClass('hide');
        $('#intro-screen #step' + nextStep).removeClass('hide');
        currentStep += 1;
    }
    
    var currentStep = 1;
    $('#intro-screen .next-step').click(function() {
        if(currentStep != 1 || (currentStep == 1 && $('input[name=tutoyer]:checked').length > 0)) {
            var nextStep = currentStep + 1;
            displayNextStep(nextStep);
        } else if (currentStep == 1 && $('input[name=tutoyer]:checked').length == 0) {
            var errors = {};
            errors.tutoyer = 'Veuillez sélectionner une réponse';
            showErrors(errors, 'intro');
        }
        
    });
    
    //Add profile data
    $('#profile').submit(function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var profileData = $(this).serialize();
        $.ajax({
            type: 'POST',
            data: profileData + '&user_id=' + user.userId,
            url: 'http://oliviapaquay.be/dropit/profile.php',
            success: function(data) {
                var profileAnswer = JSON.parse(data);
                if(profileAnswer.type == "errors"){
                    var errors = profileAnswer;
                    showErrors(errors, "intro");
                } else if(profileAnswer.type == "profile-complete") {
                    var userData = profileAnswer;
                    user.tutoyer = userData.tutoyer;
                    user_save = JSON.stringify(user);
                    localStorage.setItem("user", user_save);
                    $.mobile.changePage( "#home-screen", { transition: "fade", changeHash: false });
                }
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    //Get phone contact and check if they are in database
    function checkContacts() {
        $('.contact-result li').remove();
        var userContacts = [];
        var contactSignedin = [];
        
        function onSuccess(contacts) {
            console.log(contacts);
            
            for(var i=0; i<contacts.length; i++) {
                var contact = {
                    name: contacts[i].displayName,
                    phoneNumber: contacts[i].phoneNumbers
                };
                userContacts.push(contact);
            }
            userContacts = JSON.stringify(userContacts);
            $.ajax({
                type: 'POST',
                data: 'user_contacts=' + encodeURIComponent(userContacts),
                url: 'http://oliviapaquay.be/dropit/searchcontact.php',
                success: function(data) {
                    contactSignedin = JSON.parse(data);
                    for(var j=0; j<contactSignedin.length; j++) {
                        if(contactSignedin[j].id != user.userId) {
                            $('ul.contact-result').append('<li id="' + contactSignedin[j].id + '">' + contactSignedin[j].contactName + '<span>' + contactSignedin[j].username + '</span><button class="add-friend"><span>...</span></button></li>');
                            for(var k = 0; k < user.friendList.length; k++){
                                if(contactSignedin[j].id == user.friendList[k].id) {
                                    $('.contact-result #' + contactSignedin[j].id + ' .add-friend').addClass('already-friend');
                                }
                            }
                        }
                    }
                    if(contactSignedin.length == 0){
                        $('ul.contact-result').append('<li>Malheureusement, aucun de tes contacts n\'a été trouvé dans notre base de donnée.</li>');
                    }
                },
                error: function(){
                    alert('There was an error');
                }
            });
        }
        
        function onError(contactError) {
            alert('Error');
        }
        
        var options = new ContactFindOptions();
        options.filter = "";
        options.multiple = true;
        options.hasPhoneNumber = true;
        filter = ["displayName", "name"];
        navigator.contacts.find(filter, onSuccess, onError, options);
    }
    
    $('#friends-screen .choose-method button').click(function() {
        var method = $(this).attr('class');
        $('#friends-screen > div').removeClass('hide').addClass('hide');
        $('.' + method + '-screen').removeClass('hide');
        if (method == 'by-contact') {
            checkContacts();
        }
    });
    
    $('.app').on('click', '#friends-screen .back--button', function(event){
        if($(event.target).attr('href') == '#friends-screen') {
            $('#friends-screen > div').removeClass('hide').addClass('hide');
            $('.choose-method').removeClass('hide');
        }
    })
    
    $('input#friend-username').on('input', function() {
        $('.search-result li').remove();
        var friendToSearch = $(this).val();
        if(friendToSearch.length >= 3){
            $.ajax({
                type: 'POST',
                data: 'friendToSearch=' + friendToSearch,
                url: 'http://oliviapaquay.be/dropit/searchfriends.php',
                success: function(data) {
                    var searchResult = JSON.parse(data);
                    for(var i = 0; i < searchResult.length; i++){
                        if(searchResult[i].id != user.userId) {
                            $('.search-result').append('<li id="' + searchResult[i].id + '">' + searchResult[i].username + '<button class="add-friend"><span>...</span></button></li>');
                            for(var j = 0; j < user.friendList.length; j++){
                                if(searchResult[i].id == user.friendList[j].id) {
                                    $('.search-result #' + searchResult[i].id + ' .add-friend').addClass('already-friend');
                                }
                            }
                        }
                    };
                },
                error: function(){
                    alert('There was an error');
                }
            });
        }
    });
    
    
    $('.app').on('click', 'button.add-friend', function(){
        var friendToAdd = $(this).parent().attr('id');
        if(!$(this).hasClass('sended') && !$(this).hasClass('already-friend')) {
            $('.search-result li#' + friendToAdd + ' .add-friend').addClass('sended');
            $.ajax({
                type: 'POST',
                data: 'friendToAdd=' + friendToAdd + '&userId=' + user.userId + '&username=' + user.username,
                url: 'http://oliviapaquay.be/dropit/addfriend.php',
                success: function(data) {

                },
                error: function(){
                    alert('There was an error');
                }
            });
        } else if($(this).hasClass('sended')) {
            $('.search-result li#' + friendToAdd + ' .add-friend').removeClass('sended');
        }
    });
    
    function messageFounded(message) {
        $('.search-message').hide();
        user.foundedMessages.push(message);
        user.waitingMessages = user.waitingMessages.filter(function (el) {
            return el.id !== message.id;
        });
        console.log(user);
        var messageContent = message.message_content;
        var messageFrom = message.from_user_id;
        var messageFromUsername;
        var messageFoundedActivityId = parseInt(message.foundedActivityId, 10);
        var tag = message.tag;
        var date = message.message_date;
        var sqlMessageTime = date.split(/[- :]/);
        var messageTime = new Date(sqlMessageTime[0], sqlMessageTime[1]-1, sqlMessageTime[2], sqlMessageTime[3], sqlMessageTime[4], sqlMessageTime[5]);
        var currentTime = new Date;
            
        messageTime = messageTime.getTime();
        currentTime = currentTime.getTime();
        var textMessageTime = calculTimePassed(messageTime, currentTime);
        
        for (var i = 0; i < user.friendList.length; i++){
            if (user.friendList[i].id == messageFrom) {
                messageFromUsername = user.friendList[i].username;
            }
        }
        $('#message-screen').append('<div class="foundedmessage"><p class="tag">' + tag + '</p><p class="message-content">' + messageContent + '</p><p class="message-info">Déposé par ' + messageFromUsername + ' ' +  textMessageTime.toLowerCase() + '</p></div>');
        
        $.ajax({
            type: 'POST',
            data: 'messageId=' + message.id + '&userId=' + user.userId + '&userUsername=' + user.username + '&fromUserId=' + messageFrom + '&fromUsername=' + messageFromUsername + '&foundedActivityId=' + messageFoundedActivityId,
            url: 'http://oliviapaquay.be/dropit/messagefounded.php',
            success: function(data) {
                console.log(data);
            },
            error: function(){
                alert('There was an error');
            }
        });
    }
    
    var lastHeading = 0;
    
    function calculHeading(origin, destination) {
        var pi = 3.1415;
        var originLat = convertRadians(origin.lat);
        var originLng = convertRadians(origin.lng);
        var destinationLat = convertRadians(destination.lat);
        var destinationLng = convertRadians(destination.lng);
        
        var dLng = destinationLng - originLng;
        
        var dPhi = Math.log(Math.tan(destinationLat/2.0 + Math.PI/4.0)/Math.tan(originLat/2.0 + Math.PI/4.0));
        if(Math.abs(dLng) > Math.PI) {
            if(dLng > 0.0) {
                dLng = -(2.0 * Math.PI - dLng);
            } else {
                dLng = (2.0 * Math.PI + dLng);
            }
        }
        
        var brng = (((Math.atan2(dLng, dPhi)) * (180/Math.PI)) + 360.0) % 360.0;
        
        return brng;
    }
    
    $('.app').on('click', '.message--detected', function() {
        $.mobile.changePage( "#message-screen", { transition: "fade", changeHash: false });
        $('#message-screen .foundedmessage').remove();
        $('.search-message').show();
        var messageId = $(this).attr('id');
        var searchedMessage;
        var messageLatLng;
        var userLatLng = latlng;
        var userHeading;
        var userToMessageHeading;
        var bearing;
        
        for (var i = 0; i < user.waitingMessages.length; i++) {
            if(user.waitingMessages[i].id == messageId) {
                searchedMessage = user.waitingMessages[i];
                messageLatLng = new plugin.google.maps.LatLng(searchedMessage.message_lat, searchedMessage.message_lng);
            }
        }
        
        function onSuccess(heading) {
            userHeading = heading.magneticHeading;
            userToMessageHeading = calculHeading(userLatLng, messageLatLng);
            bearing = userToMessageHeading - userHeading;
            
            $({deg: lastHeading}).animate({deg: bearing}, {
                duration: 500,
                step: function(now){
                    $('div.direction').css({
                         transform: "rotate(" + now + "deg)"
                    });
                }
            });
            lastHeading = bearing;
        };

        function onError(compassError) {
            alert('Compass error: ' + compassError.code);
        };

        var options = {
            frequency: 1500
        };

        watchHeadingID = navigator.compass.watchHeading(onSuccess, onError, options);
        
        function displayDistance() {
            if(searchedMessage.distance < 0.05) {
                messageFounded(searchedMessage);
                clearTimeout(repeat);
            } else {
                $('.distance').text((searchedMessage.distance * 1000).toFixed(0) + ' m');
                repeat = setTimeout(displayDistance, 1000);
            }
        }
        
        displayDistance();
    });
    
    $('.return-friends-screen').click(function() {
        $('#friends-screen > div').removeClass('hide').addClass('hide');
        $('#friends-screen .choose-method').removeClass('hide');
    });
    
    $('.add--message').click(function() {
        $('#map').css('height', '100px');
        $('.lock-location').show();
        $('.open--menu').hide();
        $('.cancel--message').show();
        $('button.add--message').hide();
        $('.friends-list li').remove();
        $('.activities--container').addClass('hide');
        $('.activities--list li').remove();
        $('.add-message-view').removeClass('hide');
        $('.message-step2').hide();
        $('.message-step1').show();
        for (var i = 0; i < user.friendList.length; i++) {
            var friendsListElement = '<li><input type="checkbox" name="message-recipient[]" id="' + user.friendList[i].id + '" value="' + user.friendList[i].id + '"><label for="' + user.friendList[i].id + '">' + user.friendList[i].username + '</label></li>';
            $('.friends-list').append(friendsListElement);
        }
    });
    
    $('.app').on('click', '.next-message-step', function() {
        if($('#message-content').val() != '') {
            $('p.error').hide();
            $('.message-step1').hide();
            $('.message-step2').show();
        } else {
            var errors = {};
            errors.messagecontent = 'Veuillez entrer un message';
            showErrors(errors, 'home');
        }
    });
    
    $('#new-message').submit(function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if(lockedPosition == '') {
            var messageLocation = currentPosition;
        } else {
            var messageLocation = lockedPosition;
        }
        var messageForm = $(this);
        var messageData = $(this).serialize();
        $.ajax({
            type: 'POST',
            data: messageData + '&user-id=' + user.userId + '&message-lat=' + messageLocation.lat + '&message-lng=' + messageLocation.lng,
            url: 'http://oliviapaquay.be/dropit/newmessage.php',
            success: function(data) {
                var messageAnswer = JSON.parse(data);
                if(messageAnswer.type == 'sendedMessage') {
                    $('p.error').removeClass('hide');
                    user.sendedMessages.push(messageAnswer);
                    $('.add-message-view').addClass('hide');
                    $('.activities--container').removeClass('hide');
                    $('.cancel--message').hide();
                    $('.open--menu').show();
                    
                    displayActivities();
                    $('.activities--list').prepend('<li>Message public déposé</li>');
                    for(var i = 0; i < user.waitingMessages.length; i++) {
                        if(user.waitingMessages[i].detected) {
                            $('.activities--list').prepend('<li class="message--detected" id="' + user.waitingMessages[i].id + '">Un message a été détecté dans ta zone !</li>');
                            $('.activities--list #' + user.waitingMessages[i].id).append('<p class="activity-date">À l\'instant</p>');
                            if(user.activities.length != 0) {
                                $('.activities--list').css('border-left', '2px solid #47ACFF');
                            }
                        }
                    }
                    $('#map').css('height', '250px');
                    $('.lock-location').hide();
                    $('button.add--message').show();
                } else {
                    var errors = messageAnswer;
                    showErrors(errors, 'home');
                }
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    var friendrequestActivityId;
    var requesterUsername;
    var requesterId;
    
    $('.app').on('click', 'li.friendrequest-activity', function() {
        friendrequestActivityId = parseInt($(this).attr('id'), 10);
        $.mobile.changePage( "#acceptfriends-screen", { transition: "fade", changeHash: false });
        for(var i=0; i < user.activities.length; i++) {
            if(user.activities[i].id == friendrequestActivityId) {
                requesterId = user.activities[i].participants[0].participant_id;
                requesterUsername = user.activities[i].participants[0].participant_username;
            }
        }
        $('.requester-username').text(requesterUsername);
    });
    
    $('button.friendrequest-answer').click(function() {
        var friendrequestAccepted;
        
        if($(this).hasClass('accept')) {
            friendrequestAccepted = 'accepted';
        } else if ($(this).hasClass('refuse')) {
            friendrequestAccepted = "refused";
        }
        
        $.ajax({
            type: 'POST',
            data: 'friendrequestAccepted=' + friendrequestAccepted + '&requesterId=' + requesterId + '&userId=' + user.userId + '&activityId=' + friendrequestActivityId + '&userUsername=' + user.username,
            url: 'http://oliviapaquay.be/dropit/answerfriendrequest.php',
            success: function(data) {
                console.log(data);
                selectView('home');
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    function onCapturePhoto(fileURI) {
        imageURI = fileURI;
        $('p#profilepict-error').hide();
        $('.add-profile-pict').css('background-image', 'url("' + fileURI + '")');
    }
    
    $('.add-profile-pict').click(function() {
        navigator.camera.getPicture(onCapturePhoto, onFail, { quality: 20,
            destinationType: destinationType.FILE_URI, allowEdit: true,
        correctOrientation: true
        });

        function onFail(message) {
            alert('Failed because: ' + message);
        }
    });
    
    $('.app').on('click', '.cancel--message', function(){
        $('.cancel--message').hide();
        $('.open--menu').show();
        $('.add-message-view').addClass('hide');
        $('button.add--message').show();
        $('.lock-location').hide();
        $('.activities--container').removeClass('hide');
        
        displayActivities();
        
        for(var i = 0; i < user.waitingMessages.length; i++) {
            if(user.waitingMessages[i].detected) {
                $('.activities--list').prepend('<li class="message--detected" id="' + user.waitingMessages[i].id + '">Un message a été détecté dans ta zone !</li>');
                $('.activities--list #' + user.waitingMessages[i].id).append('<p class="activity-date">À l\'instant</p>');
                if(user.activities.length != 0) {
                    $('.activities--list').css('border-left', '2px solid #47ACFF');
                }
            }
        }
        $('#map').css('height', '250px');
    });
    
    $('.app').on('click', '.skip-step', function(){
        selectView('home');
    });
    
    $('.app').on('click', '.my-friends', function(){
        $('.myfriends-list li').remove();
        for (var i = 0; i < user.friendList.length; i++) {
            var friendsListElement = '<li id="' + user.friendList[i].id + '">' + user.friendList[i].username + '</li>';
            $('.myfriends-list').append(friendsListElement);
        }
    });
    
    function displayPublicMessages(publicMessages) {
        $('.public-messages li').remove();
        var messagePosition;
        for(var i = 0; i < publicMessages.length; i++) {
            messagePosition = {
                lat: publicMessages[i].message_lat,
                lng : publicMessages[i].message_lng
            };
            publicMessages[i].distance = calculDistance(currentPosition, messagePosition);
            
            var sqlActivityTime = publicMessages[i].message_date.split(/[- :]/);
            var publicmessageTime = new Date(sqlActivityTime[0], sqlActivityTime[1]-1, sqlActivityTime[2], sqlActivityTime[3], sqlActivityTime[4], sqlActivityTime[5]);
            var currentTime = new Date;
            
            publicmessageTime = publicmessageTime.getTime();
            currentTime = currentTime.getTime();
            var textMessageTime = calculTimePassed(publicmessageTime, currentTime);
            publicMessages[i].timePassed = textMessageTime;
        }
        publicMessages.sort(function (a, b) {
            if (a.distance > b.distance)
              return 1;
            if (a.distance < b.distance)
              return -1;
            // a doit être égale à b
            return 0;
        });
        
        for(var i = 0; i < publicMessages.length; i++) {
            if(publicMessages[i].distance < 0.5 && publicMessages[i].from_user_id != user.userId) {
                var publicMessageDistance = Math.round(publicMessages[i].distance * 100);
                if (publicMessages[i].distance * 100 < 1) {
                    publicMessageDistance = '< 1';
                }
                var publicMessageData = '<p class="publicmessage-tag">' + publicMessages[i].tag + '</p><p class="publicmessage-time">' + publicMessages[i].timePassed + '</p><p class="publicmessage-content">' + publicMessages[i].message_content + '</p><p class="publicmessage-sender">Par ' + publicMessages[i].from_user_username.username + '</p><button class="like-publicmessage">J\'aime</button><p class="publicmessage-distance">' + publicMessageDistance + ' m</p>';
                $('.public-messages').append('<li id="' + publicMessages[i].id + '">' + publicMessageData + '</li>');
            }
        }

    }
    
    $('.app').on('click', '.open--public', function(){
        var publicMessages = [];
        
        $.ajax({
            type: 'POST',
            data: '',
            url: 'http://oliviapaquay.be/dropit/loadpublicmessages.php',
            success: function(data) {
                publicMessages = JSON.parse(data);
                displayPublicMessages(publicMessages);
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    $('.app').on('click', '.lock-location', function(){
        $('.lock-location').toggleClass('locked');
        if($('.lock-location').hasClass('locked')) {
            lockedPosition = currentPosition;
        } else if (!($('.lock-location').hasClass('locked'))){
            lockedPosition = '';
        }
    });
    
    var activitySwiped;
    $('.app').on('swipeleft', '.activities--list li', function(){
        if(activitySwiped != $(this).attr('id')) {
            activitySwiped = $(this).attr('id');
            $('button.delete-activity').css('right', '-120px');
            $('#' + activitySwiped + ' button.delete-activity').animate({right: '-20px'}, 500, function() {
                    
            });
        }
    });
    
    $('.app').on('swiperight', '.activities--list li', function(){
        activitySwiped = $(this).attr('id');
        $('#' + activitySwiped + ' button.delete-activity').animate({right: '-120px'}, 500, function() {
            activitySwiped = '';
        });
    });
    
    var keyboardVisible = false;
    $('.app').on('click', '#connexion-screen input[type=text], #connexion-screen input[type=password]', function() {
        if(keyboardVisible == false) {
            $('#connexion-screen .logo').animate({
                height: '50px'
            }, 500, function() {
            
            });
        }
        keyboardVisible = true;
    });
    
    $('.app').on('click', '#connexion-screen', function(event){
        if(!($(event.target).is('input'))){
            if(keyboardVisible == true){
                $('#connexion-screen .logo').animate({
                    height: '134px'
                }, 500, function() {
                    keyboardVisible = false;
                });
            }
        }
    });
    
    $(document).on("pageshow", '#home-screen', function(){
        $('.views').not('#home-screen').hide();
        displayActivities();
        for(var i = 0; i < user.waitingMessages.length; i++) {
            if(user.waitingMessages[i].detected) {
                $('.activities--list').prepend('<li class="message--detected" id="' + user.waitingMessages[i].id + '">Un message a été détecté dans ta zone !</li>');
                $('.activities--list #' + user.waitingMessages[i].id).append('<p class="activity-date">À l\'instant</p>');
                if(user.activities.length != 0) {
                    $('.activities--list').css('border-left', '2px solid #47ACFF');
                }
            }
        }
    });
    
    $(document).on("pagebeforeshow", function(event){
        $(event.target).show();
    });
    
    $(document).on("pagehide", function(event){
        $(event.target).hide();
    });
    
    
});






/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

