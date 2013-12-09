angular.module('maparound.directives', [])

	// .directive('currentlocation', function() {
 //        return function (scope, element, attrs) {

	// 		var geocoder = new google.maps.Geocoder();
 //        	var form = attrs.form;

	// 		if (!navigator.geolocation) {
	// 			element.hide();
	// 		}
	// 		else {
	// 			element.click(function(){
	// 				scope[form].location.address = undefined;
	// 				scope.locationPlaceholder = "Loading location...";
	// 				scope.$apply();

	// 				navigator.geolocation.getCurrentPosition(function(position){

	// 					var lat = position.coords.latitude;
	// 					var lng = position.coords.longitude;

	// 					var latlng = new google.maps.LatLng(lat,lng);

	// 					geocoder.geocode({'latLng': latlng}, function(results, status) {
	// 						if (status == google.maps.GeocoderStatus.OK) {
	// 							if (results[0]) {
	// 								scope[form].location.address = results[0].formatted_address;
	// 								scope[form].location.latlng = [
	// 									results[0].geometry.location.lng(),
	// 									results[0].geometry.location.lat()
	// 								];
									
	// 							} else {
	// 								alert('No results found for your current location');
	// 							}
	// 						} else {
	// 							alert('Geocoder failed due to: ' + status);
	// 						}
							
	// 						// Update the view placeholder and apply the changes
	// 						scope.locationPlaceholder = "Location";
	// 						scope.$apply();
	// 					});
	// 				});
	// 			});
	// 		}
 //        };
 //    })

 //    .directive('onblurgeocode', function() {
 //        return function(scope, element, attrs) {

	// 		var geocoder = new google.maps.Geocoder();
	// 		var form = attrs.form;

 //        	element.blur(function(){

 //        		if (scope[form].location.address) {

	// 				geocoder.geocode( { 'address': scope[form].location.address}, function(results, status) {
	// 					if (status == google.maps.GeocoderStatus.OK) {
	// 						scope[form].location.address = results[0].formatted_address;
	// 						scope[form].location.latlng = [
	// 							results[0].geometry.location.lng(),
	// 							results[0].geometry.location.lat() 
	// 						];
	// 						scope.$apply();
	// 					} else {
	// 						alert('Geocode was not successful for the following reason: ' + status);
	// 					}
	// 				});

 //        		}

 //        	});
 //        };
 //    })

 //    .directive('onlynumbers', function() {
 //        return function(scope, element, attrs) {

 //        	element.keypress(function(evt){
	// 		    var charCode = (evt.which) ? evt.which : event.keyCode;
	// 	    	return !(charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57));
	// 		});
 	
 //        };
 //    })
;