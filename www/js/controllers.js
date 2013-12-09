angular.module('maparound.controllers', [])

.controller('AppCtrl', function($scope, $timeout, Modal, geocoder, eventful) {

  $scope.search_form = {location:{}};


  $scope.geocodeLocation = function() {

    if ($scope.search_form.location.address) {
      geocoder.getGeo({address: $scope.search_form.location.address}, function(data){
        if (data) {
          $scope.search_form.location = data;
          $scope.$apply();
        }
      })
    }

  }

  $scope.setSearchFormLocation = function(location, callback) {

    geocoder.getGeo({'latLng': location}, function(data){
      if (data) {
        $scope.search_form.location = data;
        $scope.$apply();
        if (callback) callback();
      }
    })

  }

  $scope.searchForEvents = function() {

    // TODO: WAIT FOR GEOCODE TO BE DONE
    // TODO: Only load a certain number of events, to many locks the phone

    // Just in case the geocoder is still geocoding there address
    $timeout(function(){

      if (!$scope.search_form.location.address) {
        return;
      }

      if (!$scope.search_form.distance) $scope.search_form.distance = 5;

      $scope.closeModal();

      $scope.showLoader = true;
      $scope.loadingText = "Finding Events";

      eventful.search($scope.search_form, 1, function(events, page_count){
        $scope.$broadcast('eventfulDataChange', {events: events, page_count: page_count});
      });

    })

  }

  $scope.resetZoom = function() {
    $scope.$broadcast('resetZoom');
  }

  $scope.setLoaderStatus = function(val) {
    $scope.showLoader = val;
  }

  $scope.setLoadingText = function(val) {
    $scope.loadingText = val;
  }



  // Load the modal from the given template URL for searching events
  Modal.fromTemplateUrl('modal.html', function(modal) {
    $scope.modal = modal;
  }, {
    // Use our scope for the scope of the modal to keep it simple
    scope: $scope,
    // The animation we want to use for the modal entrance
    animation: 'slide-in-up'
  });

  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };

})

// A simple controller that fetches a list of data
.controller('MapCtrl', function($scope, $timeout, clientlocation, eventful) {

  var markerCluster;
  var markerSpider;
  var infoWindow;




  $timeout(function(){

    $scope.partyMap = new google.maps.Map(document.getElementById('map-canvas'), {
      center: new google.maps.LatLng(37.09024, -95.7128910),
      zoom: 4,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_CENTER
      }
    });

    $scope.partyMap.addListener("zoom_changed", function(){
      if (infoWindow) infoWindow.close();
    });

    $scope.partyMarkers = [];

    $scope.setLoaderStatus(true);
    $scope.setLoadingText("Getting Location");

    clientlocation.get(function(location){
      if (location) {
        $scope.partyMap.setCenter(location);
        $scope.partyMap.setZoom(11);
        $scope.userLocation = location;
        $scope.setSearchFormLocation(location, function(){
          $scope.initiateMapElements();
          $scope.searchForEvents();  
        });
      }
    })

  });


  $scope.$on("resetZoom", function(e, data){
    if ($scope.partyMap) $scope.partyMap.setZoom(11);
  });


  $scope.$on("eventfulDataChange", function(e, data){
    
    var events = data.events;

    if (!events.length) {
      alert("No events found, try different criteria");
      $scope.openModal();
      return;
    }

    $scope.clearMarkers();
    markerCluster.clearMarkers();
    markerSpider.clearMarkers();
    $scope.placeUserLocationMarker();

    var bounds = $scope.addMarkersToMap(events);

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
        $scope.addMarkersToMap(events);
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
      markerSpider.addListener('spiderfy', function(markers) {
        infoWindow.close();
      })
    }
  }

  $scope.clearMarkers = function() {
    for (var i = 0; i < $scope.partyMarkers.length; i++) {
      $scope.partyMarkers[i].setMap(null);
    }
    $scope.partyMarkers = [];
  }

  $scope.getPartyWindowContent = function(party) {

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

    var contentString = 
      '<div class="party-info-window">'+
        '<h1 class="party-header">' + party.name + '</h1>'+
        '<p class="party-meta">' + party.location.address + '<br>' + timeString + '</p>' +
        '<hr>' +
        '<div class="party-content">'+
          '<p>' +
            (party.description ? party.description : 'No description provided') +
          '</p>' +
          (party.url ? '<p class="party-link">Link: <a href="' + party.url + '" target="_blank">' + party.url + '</a></p>' : '') 
        '</div>'+
    '</div>';

    return contentString;
  }

  $scope.addMarkersToMap = function(parties) {

    var bounds = new google.maps.LatLngBounds();

    //just in case
    $scope.initiateMapElements();

    angular.forEach(parties, function(party){
      var ll = new google.maps.LatLng(party.location.latlng[1], party.location.latlng[0]);

      var marker = new google.maps.Marker({
        position: ll
        , icon: new google.maps.MarkerImage('img/marker.svg', null, null, null, new google.maps.Size(40,40))
        , title: party.name
      });

      google.maps.event.addListener(marker, 'click', function() {
        infoWindow.close();
        infoWindow.setContent($scope.getPartyWindowContent(party));
        infoWindow.open($scope.partyMap, marker);
      });

      $scope.partyMarkers.push(marker);

      bounds.extend(ll);
            
    });

    markerCluster.addMarkers($scope.partyMarkers);

    for (var i = 0; i < $scope.partyMarkers.length; i++) {
      markerSpider.addMarker($scope.partyMarkers[i]);
    };

    return bounds;
  }
  
})
