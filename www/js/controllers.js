angular.module('maparound.controllers', [])

.controller('AppCtrl', function($scope, $timeout, $ionicPlatform, $ionicModal, $ionicScrollDelegate, $ionicLoading, $ionicPopup, Admob, geocoder, eventful) {

  $ionicPlatform.ready(function(){

    $scope.search_form = {location:{}};
    $scope.maxEventsToLoad = 400;

    mixpanel.track("Home Page Loaded");

    Admob.init();

    $scope.geocodeSearchLocation = function(callback) {

      geocoder.getGeo({address: $scope.search_form.location.address}, function(data){

        if (data) {

          $scope.search_form.location = data;
          $scope.$apply();
          if (callback) callback(true);

        } else {
          if (callback) callback(false);
        }

      })

    }

    $scope.setSearchFormLocation = function(location, callback) {

      geocoder.getGeo({'latLng': location}, function(data){
        if (data) {
          $scope.search_form.location = data;
          if (callback) callback(true);
        } else {
          if (callback) callback(false);
        }
      })

    }

    $scope.searchForEvents = function() {

      if (!$scope.search_form.location.address) {
        $ionicPopup.alert({
          title: "Oops! We need a location."
          , content: "Please enter a location for your search."
        }).then(function(res) {
          // Maybe something here?
          $scope.displaySearchBar();
        });
        return;
      }

      if (!$scope.search_form.distance) $scope.search_form.distance = 8;

      $scope.geocodeSearchLocation(function(finished){

        if (!finished) return;

        $scope.hideSearchBar();
        $scope.setLoaderStatus(true);
        $scope.setLoadingText("Finding Events");

        if(!$scope.$$phase) {
          $scope.$apply();
        }

        mixpanel.track("Searched Events", {
          address: $scope.search_form.location.address
          , keywords: $scope.search_form.keywords ? $scope.search_form.keywords : "None"
          , distance: $scope.search_form.distance ? $scope.search_form.distance : "None"
        });

        eventful.search($scope.search_form, 1, function(events, page_count){
          $scope.$broadcast('eventfulDataChange', {events: events, page_count: page_count});
        });

      });
    }

    $scope.resetZoom = function() {
      $scope.$broadcast('resetZoom');
    }

    $scope.setLoaderStatus = function(val) {
      if (!$scope.loader) return;
      if (val) {
        $scope.loader.show();
      } else {
        $scope.loader.hide();
      }  
    }

    $scope.setLoadingText = function(val) {
      if (!$scope.loader) return;
      $scope.loader.setContent("<i class='icon ion-loading-c'></i> &nbsp;" + val + "...");
    }

    $scope.setInfoPartyContent = function(val) {
      $scope.eventInfo = val;
      $scope.$apply();
    }

    $scope.setUserLocation = function(val) {
      $scope.userLocation = val;
    }

    $scope.centerOnUserLocation = function() {
      $scope.$broadcast("center-on-user");
    }

    $scope.showAppInfo = function() {

    }

    $scope.selectMe = function(elem) {
      elem.select();
    }

    $scope.displaySearchBar = function() {
      $scope.showSearchBar = true;
    };

    $scope.hideSearchBar = function() {
      $scope.showSearchBar = false;
    };

    // Load event info modal
    $ionicModal.fromTemplateUrl('infoModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.infoModal = modal;
    });

    $scope.openInfoModal = function() {
      mixpanel.track("Opened info modal");
      $scope.infoModal.show();
    };

    $scope.closeInfoModal = function() {
      mixpanel.track("Closed info modal");
      $scope.infoModal.hide();
      $ionicScrollDelegate.scrollTop();
    };

    // Search Settings Modal
    $ionicModal.fromTemplateUrl('searchSettingsModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.searchSettingsModal = modal;
    });

    $scope.openSearchSettingsModal = function() {
      mixpanel.track("Opened Search Settings Modal");
      $scope.searchSettingsModal.show();
    };

    $scope.closeSearchSettingsModal = function() {
      mixpanel.track("Closed Search Settings Modal");
      $scope.searchSettingsModal.hide();
    };

    // App Info Modal
    $ionicModal.fromTemplateUrl('appInfoModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.appInfoModal = modal;
    });

    $scope.openAppInfoModal = function() {
      mixpanel.track("Opened App Info Modal");
      $scope.appInfoModal.show();
    };

    $scope.closeAppInfoModal = function() {
      mixpanel.track("Closed App Info Modal");
      $scope.appInfoModal.hide();
    };

    $scope.loader = $ionicLoading.show({
      content: 'Finding Events',
    });

  });

})

// A simple controller that fetches a list of data
.controller('MapCtrl', function($scope, $timeout, $ionicPlatform, $ionicPopup, clientlocation, eventful) {

  var markerCluster;
  var markerSpider;
  var infoWindow;

  $ionicPlatform.ready(function(){

    $scope.partyMap = new google.maps.Map(document.getElementById('map-canvas'), {
      center: new google.maps.LatLng(37.09024, -95.7128910),
      zoom: 11,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_CENTER,
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE]
      }
    });

    $scope.partyMarkers = [];

    $scope.setLoaderStatus(true);
    $scope.setLoadingText("Getting Location");

    clientlocation.get(function(location){

      $scope.initiateMapElements();

      if (location) {

        $scope.partyMap.setCenter(location);
        $scope.setUserLocation(location);

        $scope.setSearchFormLocation(location, function(finished){
          if (finished) {
            $scope.searchForEvents();  
          } else {
            $scope.setLoaderStatus(false);
            $scope.displaySearchBar();
          }
        });

      } else {
        mixpanel.track("No client location");
        $scope.setLoaderStatus(false);
        $scope.displaySearchBar();
      }

    });

    $scope.$on("resetZoom", function(){
      if ($scope.partyMap) {
        mixpanel.track("Reset Zoom");
        $scope.partyMap.setZoom(11);
      }
    });

    $scope.$on("center-on-user", function(){

      if ($scope.partyMap) {

        $scope.setLoadingText("Getting Location");
        $scope.setLoaderStatus(true);

        clientlocation.get(function(location){

          $scope.userLocation = location;
          $scope.setLoaderStatus(false);
          $scope.partyMap.panTo($scope.userLocation);
          if (!$scope.$$phase) $scope.$apply();

        });

      }

    });

    $scope.$on("eventfulDataChange", function(e, data){
      
      var events = data.events;
      var numEventsLoaded = events.length;

      if (!events.length) {

        $ionicPopup.alert({
          title: "No events found."
          , content: "There's nothing going on there! Please try somewhere else."
        }).then(function(res) {
          $scope.setLoaderStatus(false);
          $scope.displaySearchBar();
        });
        
        return;
      }

      $scope.clearMarkers();
      $scope.clearListeners();
      $scope.placeUserLocationMarker();

      var bounds = $scope.addMarkersToMap(events);

      markerSpider.addListener('click', function(marker, event) {
        $scope.setInfoPartyContent($scope.setPartyInfo(marker.party));
        $scope.openInfoModal();
      });

      var latlng = $scope.search_form.location.latlng;
      $scope.partyMap.panTo(new google.maps.LatLng(latlng[1], latlng[0]));

      if ($scope.partyMarkers.length) {
        // Getting a $digest already in progress error, so I'm just wrapping it in a timeout
        // so it's the last thing on the event queue
        $timeout(function(){
          $scope.partyMap.fitBounds(bounds);
        });
      }

      $scope.setLoaderStatus(false);

      // Get the rest of the events
      for(var i = 2; i <= data.page_count; i++) {

        eventful.search($scope.search_form, i, function(events, page_c) {

          numEventsLoaded += events.length;

          if (numEventsLoaded <= $scope.maxEventsToLoad){
            $scope.addMarkersToMap(events);
          }
          
        });
      }

    });

    $scope.placeUserLocationMarker = function() {
      if ($scope.userLocation) {
        new google.maps.Marker({
          position: $scope.userLocation
          , icon: new google.maps.MarkerImage('img/client-location.svg', null, null, null, new google.maps.Size(25,25))
          , title: "Your location"
          , map: $scope.partyMap
        });
      } 
    }

    $scope.initiateMapElements = function() {
      if (!markerCluster) {
        var mcOptions = {
          gridSize: 50
          , maxZoom: 15
          , styles: [{
            height: 50
            , width: 50
            , textSize: 14
            , textColor: "#333"
            , url: "img/cluster-icon.png"
          }]
        };
        markerCluster = new MarkerClusterer($scope.partyMap, [], mcOptions);
      }

      if (!infoWindow) {
        infoWindow = new google.maps.InfoWindow();
      }

      if (!markerSpider) {
        var msOptions = {
          keepSpiderfied: true
        }
        markerSpider = new OverlappingMarkerSpiderfier($scope.partyMap, msOptions);
      }
    }

    $scope.clearMarkers = function() {
      for (var i = 0; i < $scope.partyMarkers.length; i++) {
        $scope.partyMarkers[i].setMap(null);
      }
      $scope.partyMarkers = [];
      markerCluster.clearMarkers();
      markerSpider.clearMarkers();
    }

    $scope.clearListeners = function() {
      markerSpider.clearListeners("click");
    }

    $scope.setPartyInfo = function(party) {

      var sD = party.date_time.start_date ? new Date(party.date_time.start_date) : undefined;
      var eD = party.date_time.end_date ? new Date(party.date_time.end_date) : undefined;

      var timeString;
      if (party.date_time.all_day) {
        timeString = 'All day';
      } else if(!sD && !eD) {
        timeString = 'No time specified';
      } else if(!eD) {
        timeString = 'Starts at ' + sD.toFormat("H:MI P") + '<br>' + sD.toFormat("MMM D, YYYY");
      } else {
        timeString = sD.toFormat("H:MI P") + ' to ' + eD.toFormat("H:MI P") + '<br>' + sD.toFormat("MMM D, YYYY");
      }

      party.timeString = timeString;
      party.description = (party.description ? party.description : "No description provided");

      return party;
    }

    $scope.addMarkersToMap = function(parties) {

      var bounds = new google.maps.LatLngBounds();

      angular.forEach(parties, function(party){
        var ll = new google.maps.LatLng(party.location.latlng[1], party.location.latlng[0]);

        var marker = new google.maps.Marker({
          position: ll
          , icon: new google.maps.MarkerImage('img/marker.svg', null, null, null, new google.maps.Size(40,40))
          , title: party.name
        });

        marker.party = party;
        markerSpider.addMarker(marker);
        $scope.partyMarkers.push(marker);

        bounds.extend(ll);
              
      });

      markerCluster.addMarkers($scope.partyMarkers);

      return bounds;
    }

  });
  
})
