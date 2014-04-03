angular.module('maparound.services', [])

  .service('geocoder', function() {

    this.getGeo = function(params, callback) {

      var geocoder = new google.maps.Geocoder();

      geocoder.geocode(params, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK && results[0]) {

            return callback({
              address: results[0].formatted_address
              , latlng: [results[0].geometry.location.lat(), results[0].geometry.location.lng()]
            });

        } else {
          callback(false);
        }
      });

    };
  })

  .service('clientlocation', function() {

    this.get = function(callback) {
      
      if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(function (position) {

          clientlocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          callback(clientlocation);

        }, function(err) {
          callback(false);
        });

      } else {
        callback(false);
      }

    };
  })

  .service('eventful', function() {

    var parseEventfulDate = function(dateStr) {
    
      var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      var dateTime = dateStr.split(" ");
      var date = dateTime[0];
      var time = dateTime[1];

      var splitDate = date.split("-");

      return months[splitDate[1] - 1] + " " + splitDate[2] + ", " + splitDate[0] + " " + time;
    }

    var formatEventfulEvent = function(event) {
      if (!event.latitude || !event.longitude) {
        return false;
      }

      event.start_time = event.start_time ? parseEventfulDate(event.start_time) : undefined;
      event.stop_time = event.stop_time ? parseEventfulDate(event.stop_time) : undefined;

      return {
        name: event.title
          , date_time:  {
            start_date: event.start_time
            , end_date: event.stop_time
            , all_day: (event.all_day == "1" || event.all_day == "2") ? true : false
          }
          , location:   {latlng: [event.longitude, event.latitude], address: event.venue_address}
          , description:  event.description ? event.description.trim() : undefined
          , url:      event.url
      };
    };

    this.search = function(search_form, page_number, callback) {

      var eventfulOptions = {
        app_key: "NdNx6C2Fp4pgxRgG"
        , location: search_form.location.latlng[0] + ", " + search_form.location.latlng[1]
        , within: search_form.distance
        , page_size: 50
        , page_number: page_number
        , date: "This Week"
        , mature: "safe"
      };

      if (search_form.keywords) {
        eventfulOptions.keywords = search_form.keywords;
      }

      EVDB.API.call("/events/search", eventfulOptions, function(data) {

        var eventFulEvents = [];

        if (data.events) {
          for (var i = 0; i < data.events.event.length; i++) {

            var event = data.events.event[i];

            event = formatEventfulEvent(event);

            if (event) eventFulEvents.push(event);
          };
        }

        callback(eventFulEvents, data.page_count);

      });      

    };
    
  })

  .service('Admob', function($ionicPlatform) {

    this.init = function() {

      if (window.plugins && window.plugins.AdMob) {

          var adId = "ca-app-pub-6187866297038401/6133439772";
          var am = window.plugins.AdMob;

          am.createBannerView( 
            {
              'publisherId': adId,
              'adSize': am.AD_SIZE.BANNER,
              'bannerAtTop': false
            }, 
            function() {
              am.requestAd(
                { 'isTesting': true }, 
                // { 'isTesting': false }, 
                function(){
                  am.showAd( true );
                }, 
                function(){ alert('Failed to load ad.'); }
              );
            }, 
            function(){ alert('Failed to create banner ad.'); }
          );

      } else {
        // alert('AdMob plugin not available/ready.');
      }

    };
  })

  .service('Email', function() {

    this.isAvailable = function() {

      if (window.plugins && window.plugin.email && window.plugin.email.isServiceAvailable) {
        return true;
      } else {
        return false;
      }

    };

    this.composeSupport = function(supportType) {

      window.plugin.email.open({
        to:      ['sean.pingplot.test@gmail.com'],
        subject: 'Map Around: ' + supportType
      });

    };

  })

  .service('Social', function() {

    this.isAvailable = function() {

      if (window.socialmessage) {
        return true;
      } else {
        return false;
      }

    };

    this.share = function() {

      var message = {
        text: "Find events going on around you with the ease of your smartphone.",
        url: "http://www.maparoundapp.com"
      };

      window.socialmessage.send(message);

    };

  })
;
