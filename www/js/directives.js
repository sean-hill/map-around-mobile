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
	        element.bind('click', function () {
	            window.open(attrs.openUrl, '_blank', 'location=yes');
	        });
	    };
	})
	
;