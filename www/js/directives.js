angular.module('maparound.directives', [])

	.directive('selectOnClick', function () {
	    // Linker function
	    return function (scope, element, attrs) {
	        element.bind('click', function () {
	            this.select();
	        });
	    };
	})

	.directive('openUrl', function () {
	    // Linker function
	    return function (scope, element, attrs) {

	    	var target = attrs.target || "_blank";

	        element.bind('click', function () {
	            window.open(attrs.openUrl, target, 'location=yes');
	        });
	    };
	})
	
;