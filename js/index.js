var user_save = localStorage.getItem("user");
var user = JSON.parse(user_save);
var userProfilePictSrc = '';

var marker;
var messageMarker;
var messagesMarker = [];
var map;
    function initMap() {
         map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 15,
            streetViewControl: false,
            zoomControl: false,
            mapTypeControl: false
        });

        marker = new google.maps.Marker({
            position: {lat: -34.397, lng: 150.644},
            icon: {url: 'img/point.png', anchor: new google.maps.Point(11, 11)},
            map: map,
            zIndex : 999
        });

        map.addListener('center_changed', function() {
            map.panTo(marker.getPosition());
        });

    }

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
            pictureSource = navigator.camera.PictureSourceType;
            destinationType = navigator.camera.DestinationType;
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
    
    app.initialize();
    
    var latlng;
    var currentPosition = {
        lat : '', 
        lng : '',
        heading : ''
    };
    
    function convertRadians(e){
        return (e*Math.PI/180);
    }
    
    function round(number,X) {
	   X = (!X ? 3 : X);
	   return Math.round(number*Math.pow(10,X))/Math.pow(10,X);
    }
    
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
    
    function addMarker() {
        for(var i = 0; i < messagesMarker.length; i++){
            data = messagesMarker[i];
            messageLatLng = new google.maps.LatLng( data.lat, data.lng);
            messageMarker = new google.maps.Marker({
                position: messageLatLng,
                icon: {url: 'img/yellow_point.png', anchor: new google.maps.Point(11, 11)},
                map: map
            });
        }
    }
    
    function messageDetected(message) {
        message.detected = true;
        messageDetectedPosition = {
            lat : message.message_lat,
            lng : message.message_lng
        };
        messagesMarker.push(messageDetectedPosition);
        addMarker();
        $('.activities--list').prepend('<li class="message--detected" id="' + message.id + '">Un message a été détecté dans ta zone !</li>');
        $('#' + message.id).append('<p class="activity-date">À l\'instant</p>');
        
    }
    
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
                
                if (distanceFromMessage <= 1.10 && messageIsDetected != true) {
                    user.waitingMessages[i].distance = distanceFromMessage;
                    messageDetected(user.waitingMessages[i]);
                    
                } else if (distanceFromMessage > 1.10 && messageIsDetected == true) {
                    user.waitingMessages[i].detected = false;
                    $('#' + user.waitingMessages[i].id).remove();
                }
            }
        }
    }
    
    function getPosition(position) {
        latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        currentPosition.lat = position.coords.latitude; 
        currentPosition.lng = position.coords.longitude;
        currentPosition.heading = position.coords.heading;
        
        marker.setPosition(latlng);
        
        //Centrer la map sur latlng
        map.panTo(latlng);
        
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
        $('.maperror').append(info);
    }
    
    var watchPosition = function(){
        if(navigator.geolocation) {
            survId = navigator.geolocation.watchPosition(getPosition, erreurPosition, {enableHighAccuracy: true});
        } else {
            alert("Ce navigateur ne supporte pas la géolocalisation");
        }
    }
    
    var showErrors = function(errors, screen){
        $('p.error').hide();
        for (var error in errors){
            if (typeof errors[error] !== 'function') {
                $('#' + screen + '-screen .error#' + error + '-error').show().text(errors[error]);
            }
        }
        console.log(errors);
    }
    
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
    
    var loadActivitiesParticipants = function() {
        for (var i = 0; i < user.activities.length; i++) {
            if (user.activities[i].type == "friendrequest" || user.activities[i].type == "friendrequestaccepted" || user.activities[i].type == "messageFounded" || user.activities[i].type == "messageFoundedBy" || user.activities[i].type == "friendrequestacceptedby") {
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
    
    var loadFriends = function(userId) {
        $.ajax({
            type: 'POST',
            data: 'userId=' + userId,
            url: 'http://oliviapaquay.be/dropit/loadfriends.php',
            success: function(data) {
                var friendList = JSON.parse(data);
                user.friendList = [];
                for(var i = 0; i < friendList.length; i++) {
                    if(friendList[i].id != userId) {
                        user.friendList.push(friendList[i]);
                    }
                };
            },
            error: function(){
                alert('There was an error');
            }
        });
    };
    
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
    }
    
    var displayActivities = function() {
        if (user.activities.length > 1){
            $('.activities--list').css('border-left', '2px solid #47ACFF');
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
            var timePassed = currentTime - activityTime;
            var secondPassed = (timePassed / 1000).toFixed(0);
            var minutePassed = (secondPassed / 60).toFixed(0);
            var hourPassed = (minutePassed / 60).toFixed(0);
            var daysPassed = (hourPassed / 24).toFixed(0);
            var weekPassed = (daysPassed / 7).toFixed(0);
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
            } 
            
            
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
                    break;
                case 'friendrequestacceptedby':
                    var activityParticipantUsername = activity.participants[0].participant_username;
                    activityText = activityParticipantUsername + ' a accepté ta demande d\'amis';
                    break;
                case 'messageFounded':
                    activityText = 'Tu as trouvé un message de ' + activity.participants[0].participant_username;
                    activityClass = "messagefounded-activity";
                    break;
                case 'messageFoundedBy':
                    if (activity.participants.length == 1) {
                        activityText = activity.participants[0].username + ' a trouvé ton message';
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
            }
            
            $('.activities--list').append('<li class="' + activityClass + '" id="' + activityId + '">' + activityText + '</li>');
            $('#' + activityId).append('<p class="activity-date">' + textActivityTime + '</p>');
        }
    };
    
    $(document).ajaxComplete(function(event,request, settings) {
        if(settings.url == "http://oliviapaquay.be/dropit/loadfriends.php") {
            loadActivities(user.userId);
        } else if(settings.url == "http://oliviapaquay.be/dropit/loadactivities.php") {
            loadActivitiesParticipants();
        }
    });
    
    $(document).ajaxStop(function(){
        user_save = JSON.stringify(user);
        localStorage.setItem("user", user_save);
        displayActivities();
        console.log(user);
    });
    
    var windowHeight = $(window).height();
    var selectView = function(viewId){
        $('header').show();
        $('.views').removeClass('hide');
        $('.views').addClass('hide');
        $('#' + viewId + '-screen').removeClass('hide');
        if(viewId == 'home') {
            $('header').show();
            $('button.add--message').show();
            if(!(typeof google === 'object' && typeof google.maps === 'object')) {
                $.getScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyBsca-E6pREkZVSqmb8eHLzCMom3r0lKhA&libraries=geometry&callback=initMap');
            }
            loadFriends(user.userId);
            loadWaitingMessages(user.userId);
            watchPosition();
            $('#home-screen').css('height', (windowHeight - 54) + 'px');
        } else if(viewId == 'message') {
            $('#message-screen').css('height', (windowHeight) + 'px');
            $('header').hide();
        } else if(viewId == 'inscription') {
            $('#inscription-screen').css('height', (windowHeight) + 'px');
            $('header').hide();
        } else if(viewId == 'connexion') {
            $('header').hide();
        }
    }
    
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
    
    if(user != null && user.connected == "connected") {
        selectView('home');
        loadFriends(user.userId);
        loadWaitingMessages(user.userId);
        loadSendedMessages();
    }
    
    $('.inscription--button').click(function(){
        selectView('inscription');
        $('header').hide();
    })
    
    $('#inscription').submit(function() {
        
        var inscriptionData = $(this).serialize();
        
        $.ajax({
            type: 'POST',
            data: inscriptionData + '&profilePictSrc=' + userProfilePictSrc,
            url: 'http://oliviapaquay.be/dropit/inscription.php',
            success: function(data) {
                var connexionAnswer = JSON.parse(data);
                if(connexionAnswer.type == "errors"){
                    var errors = connexionAnswer;
                    showErrors(errors, "inscription");
                } else if(connexionAnswer.type == "connected") {
                    var userData = connexionAnswer;
                    user = {
                        userId : userData.id,
                        username : userData.username,
                        profilePictSrc : userData.pict_src,
                        connected : "connected",
                        friendList: [],
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
                    selectView('intro');
                }
            },
            error: function(){
                alert('There was an error');
            }
        });
    
        return false;
    })
    
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
                    selectView('home');
                }
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    $('.log-out').click(function() {
        user.connected = "not connected";
        var user_save = JSON.stringify(user);
        localStorage.setItem("user", user_save);
        window.location.reload();
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
    
    $('.find-friends').click(function(){
        selectView('friends');
    });
    
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
                    displayNextStep(currentStep + 1);
                }
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    $('#friends-screen .choose-method button').click(function() {
        var method = $(this).attr('class');
        $('#friends-screen > div').removeClass('hide').addClass('hide');
        $('.' + method + '-screen').removeClass('hide');
    });
    
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
                            $('.search-result').append('<li id="' + searchResult[i].id + '">' + searchResult[i].username + '</li>');
                        }
                    };
                    $('.search-result li').append('<button class="add-friend">+</button>');
                },
                error: function(){
                    alert('There was an error');
                }
            });
        }
    });
    
    
    $('.app').on('click', 'button.add-friend', function(){
        var friendToAdd = $(this).parent().attr('id');
        $.ajax({
            type: 'POST',
            data: 'friendToAdd=' + friendToAdd + '&userId=' + user.userId + '&username=' + user.username,
            url: 'http://oliviapaquay.be/dropit/addfriend.php',
            success: function(data) {
                console.log(data);
            },
            error: function(){
                alert('There was an error');
            }
        });
    });
    
    function messageFounded(message) {
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
        for (var i = 0; i < user.friendList.length; i++){
            if (user.friendList[i].id == messageFrom) {
                messageFromUsername = user.friendList[i].username;
            }
        }
        $('#message-screen').append('<p>' + tag + ' Message de ' + messageFromUsername + ' envoyé le ' + date + ' : ' + messageContent + '</p>');
        
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
    
    $('.app').on('click', '.message--detected', function() {
        selectView('message');
        var messageId = $(this).attr('id');
        var searchedMessage;
        var messageLatLng;
        var userLatLng = latlng;
        var userHeading;
        var userToMessageHeading;
        var heading;
        
        for (var i = 0; i < user.waitingMessages.length; i++) {
            if(user.waitingMessages[i].id == messageId) {
                searchedMessage = user.waitingMessages[i];
                messageLatLng = new google.maps.LatLng(searchedMessage.message_lat, searchedMessage.message_lng);
            }
        }
        
        function onSuccess(heading) {
            userHeading = heading.magneticHeading;
            userToMessageHeading = google.maps.geometry.spherical.computeHeading(userLatLng, messageLatLng);
            heading = userToMessageHeading - userHeading;
            
            $({deg: lastHeading}).animate({deg: heading}, {
                duration: 500,
                step: function(now){
                    $('div.direction').css({
                         transform: "rotate(" + now + "deg)"
                    });
                }
            });
            lastHeading = heading;
        };

        function onError(compassError) {
            alert('Compass error: ' + compassError.code);
        };

        var options = {
            frequency: 1500
        };

        var watchID = navigator.compass.watchHeading(onSuccess, onError, options);
        
        function displayDistance() {
            if(searchedMessage.distance < 0.05) {
                messageFounded(searchedMessage);
                clearTimeout(repeat);
            } else {
                $('.distance').text((searchedMessage.distance * 1000).toFixed(0) + ' m');
                var repeat = setTimeout(displayDistance, 1000);
            }
        }
        
        displayDistance();
    });
    
    $('.return-friends-screen').click(function() {
        $('#friends-screen > div').removeClass('hide').addClass('hide');
        $('#friends-screen .choose-method').removeClass('hide');
    });
    
    $('.finish-intro').click(function() {
        selectView('home');
    });
    
    $('.add--message').click(function() {
        $('#map').css('height', '100px');
        google.maps.event.trigger(map, 'resize');
        $('.open--menu').addClass('cancel--message').removeClass('open--menu');
        $('button.add--message').hide();
        $('.friends-list li').remove();
        $('.activities--container').addClass('hide');
        $('.add-message-view').removeClass('hide');
        $('.message-step2').hide();
        $('.message-step1').show();
        for (var i = 0; i < user.friendList.length; i++) {
            var friendsListElement = '<li><input type="checkbox" name="message-recipient[]" id="' + user.friendList[i].id + '" value="' + user.friendList[i].id + '"><label for="' + user.friendList[i].id + '">' + user.friendList[i].username + '</label></li>';
            $('.friends-list').append(friendsListElement);
        }
    });
    
    $('.add-message-view .back-home').click(function() {
        $('.cancel--message').addClass('open--menu').removeClass('cancel--message');
        $('.add-message-view').addClass('hide');
        $('button.add--message').show();
        $('.activities--container').removeClass('hide');
        $('#map').css('height', '300px');
        google.maps.event.trigger(map, 'resize');
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
        
        var messageLocation = currentPosition;
        var messageData = $(this).serialize();
        $.ajax({
            type: 'POST',
            data: messageData + '&user-id=' + user.userId + '&message-lat=' + messageLocation.lat + '&message-lng=' + messageLocation.lng,
            url: 'http://oliviapaquay.be/dropit/newmessage.php',
            success: function(data) {
                var messageAnswer = JSON.parse(data);
                if(messageAnswer.type == 'sendedMessage') {
                    user.sendedMessages.push(messageAnswer);
                    alert('Message envoyé !');
                    $('.back-home').click();
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
        selectView('acceptfriends');
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
    
    function clearCache() {
        navigator.camera.cleanup();
    }
    
    var retries = 0;
    
    function onCapturePhoto(fileURI) {
        var win = function (r) {
            clearCache();
            retries = 0;
            alert('Done!');
        }

        var fail = function (error) {
            if (retries == 0) {
                retries ++
                setTimeout(function() {
                    onCapturePhoto(fileURI)
                }, 1000)
            } else {
                retries = 0;
                clearCache();
                alert('Ups. Something wrong happens!');
            }
        }

        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.params = {}; 
        
        var ft = new FileTransfer();
        ft.upload(fileURI, encodeURI("http://oliviapaquay.be/dropit/upload"), win, fail, options);
    }
    
    $('.add-profile-pict').click(function() {
        navigator.camera.getPicture(onCapturePhoto, onFail, { quality: 10,
            destinationType: destinationType.FILE_URI
        });

        function onFail(message) {
            alert('Failed because: ' + message);
        }
    });
    
    $('.app').on('click', '.back--home', function(){
        selectView('home');
    });
    
    $('.app').on('click', '#inscription-screen .back--home', function(){
        selectView('connexion');
    });
    
    $('.app').on('click', '.cancel--message', function(){
        $('.cancel--message').addClass('open--menu').removeClass('cancel--message');
        $('.add-message-view').addClass('hide');
        $('button.add--message').show();
        $('.activities--container').removeClass('hide');
        $('#map').css('height', '300px');
        google.maps.event.trigger(map, 'resize');
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

