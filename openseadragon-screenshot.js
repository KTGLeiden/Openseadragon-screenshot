(function($) {
    'use strict';
    if (!$.version || $.version.major < 2) {
        throw new Error('This version of OpenSeadragonScreenshot requires OpenSeadragon version 2.0.0+');
    }

    $.Viewer.prototype.screenshot = function(options) {
        if (!this.screenshotInstance || options) {
            options = options || {};
            options.viewer = this;
            this.screenshotInstance = new $.Screenshot(options);
        }
        return this.screenshotInstance;
    };


    /**
    * @class Screenshot
    * @classdesc Provides functionality for taking a screenshot
    * @memberof OpenSeadragon
    * @param {Object} options
    */
    $.Screenshot = function ( options ) {

        $.extend( true, this, {
            // internal state properties
            viewer:                  null,
            buttonActiveImg:         false,
            screenshotWidth: 	     1000,
            screenshotHeight: 		 1000,
            showingMenu: 			 false,
            menuObj:  				 null,

            // options
            element:                 null,
            toggleButton:            null,
            showScreenshotControl:    true,
            keyboardShortcut:        'c',
            navImages:               {
                screenshot: {
                    REST:   'selection_rest.png',
                    GROUP:  'selection_grouphover.png',
                    HOVER:  'selection_hover.png',
                    DOWN:   'selection_pressed.png'
                }
            }
        }, options );

        $.extend( true, this.navImages, this.viewer.navImages );

        if (this.keyboardShortcut) {
            $.addEvent(
                this.viewer.container,
                'keypress',
                $.delegate(this, onKeyPress),
                false
            );
        }



 // Add buttons
        var prefix = this.prefixUrl || this.viewer.prefixUrl || '';
        var useGroup = this.viewer.buttons && this.viewer.buttons.buttons;
        var anyButton = useGroup ? this.viewer.buttons.buttons[0] : null;
        var onFocusHandler = anyButton ? anyButton.onFocus : null;
        var onBlurHandler = anyButton ? anyButton.onBlur : null;
        if (this.showScreenshotControl) {
            this.toggleButton = new $.Button({
                element:    this.toggleButton ? $.getElement( this.toggleButton ) : null,
                clickTimeThreshold: this.viewer.clickTimeThreshold,
                clickDistThreshold: this.viewer.clickDistThreshold,
                tooltip:    $.getString('Tooltips.ScreenshotToggle') || 'Make Screenshot',
                srcRest:    prefix + this.navImages.screenshot.REST,
                srcGroup:   prefix + this.navImages.screenshot.GROUP,
                srcHover:   prefix + this.navImages.screenshot.HOVER,
                srcDown:    prefix + this.navImages.screenshot.DOWN,
                onRelease:  this.toggleScreenshotMenu.bind( this ),
                onFocus:    onFocusHandler,
                onBlur:     onBlurHandler
            });
            if (useGroup) {
                this.viewer.buttons.buttons.push(this.toggleButton);
                this.viewer.buttons.element.appendChild(this.toggleButton.element);
            }
            if (this.toggleButton.imgDown) {
                this.buttonActiveImg = this.toggleButton.imgDown.cloneNode(true);
                this.toggleButton.element.appendChild(this.buttonActiveImg);
            }
		}
	};


    function onKeyPress(e) {
        var key = e.keyCode ? e.keyCode : e.charCode;
        if (key === 13) {
            this.confirm();
        } else if (String.fromCharCode(key) === this.keyboardShortcut) {
            this.toggleScreenshotMenu();
        }
    }


    $.extend( $.Screenshot.prototype, $.ControlDock.prototype, /** @lends OpenSeadragon.Screenshot.prototype */{

        closeMenu: function(){
        	if(this.menuObj)
    			this.menuObj.parentElement.removeChild(this.menuObj);
    		this.showingMenu = false;
    		this.menuObj = null;
    		return true;
        },

        takeScreenshot: function() {
	    	// This is where the magic happens ;)
	    	//console.log('Taking a screenshot');
	    	var maxZoom = this.viewer.viewport.getMaxZoom();
	    	var currentZoom = this.viewer.viewport.getZoom();
	    	var output_x_size = this.screenshotWidth; // Pixels, obviously
	    	var output_y_size = this.screenshotHeight; // Pixels, obviously

	    	var containerSize = this.viewer.viewport.containerSize;

	    	var originalCSx = containerSize.x;
	    	var originalCSy = containerSize.y;
	    	// Zoom in (/out) and decrease/increase the containerSize 
	    	// such that it matches our output size but retains the viewport
	    	var pixel_resize_ratio_x = output_x_size / containerSize.x;
	    	var pixel_resize_ratio_y = output_y_size / containerSize.y;
	    	var zoomFactor = (pixel_resize_ratio_x < pixel_resize_ratio_y) ? pixel_resize_ratio_x : pixel_resize_ratio_y;

	    	if(zoomFactor * currentZoom > maxZoom){
	    		var new_zoomFactor = maxZoom / (zoomFactor * currentZoom);
	    		output_x_size *= new_zoomFactor;
	    		output_y_size *= new_zoomFactor;
	    	}

	    	// Set element size (viewer)
	    	this.viewer.element.style.height = output_y_size + "px";
	    	this.viewer.element.style.width = output_x_size + "px";

	    	var viewer = this.viewer;
	    	var downloadFunction = function(){
	    		console.log('Fired');
			    viewer.drawer.canvas.toBlob(function(blob) {
			    	var newLink = document.createElement('a');
			    	newLink.id = "downloadLink";
			    	newLink.download = "screenshot.png";
			    	newLink.innerHTML = "Download image";
			    	newLink.href = URL.createObjectURL(blob);
				    newLink.click(); // Actually perform the download.
			      	requestAnimationFrame(function() {
			          URL.revokeObjectURL(newLink.href);
			          viewer.world.getItemAt(0).removeAllHandlers('fully-loaded');
			          viewer.element.style.height = originalCSy + "px";
			          viewer.element.style.width = originalCSx + "px";
			        });
			        newLink.removeAttribute('href');
				});
	    	}
	    	requestAnimationFrame(function(){ // NEeded for HTML/JS to find out the viewport just resized
    			viewer.forceRedraw();
		    	viewer.world.getItemAt(0).addHandler('fully-loaded', downloadFunction);
			});

		    this.closeMenu.bind(this);

        	return true;
        },

        toggleScreenshotMenu: function(){
        	if(this.showingMenu){
        		this.closeMenu.bind(this);
        		return true;
        	}

	    	// Add download link to canvas	    	
	    	var mainDiv = this.viewer.container;
	    	var newDiv = document.createElement('div');
	    	newDiv.style.position = "absolute";
	    	newDiv.style.backgroundColor = "#fff";
	    	newDiv.style.width = "400px";
	    	newDiv.style.padding = "10px"
	    	newDiv.style.margin = "-100px 0 0 -200px";
	    	newDiv.style.top = "50%";
	    	newDiv.style.left = "50%";
	    	// Make close button
	    	var closeButton = document.createElement('button');
	    	closeButton.style.display = "block";
	    	closeButton.innerHTML = "Close";
	    	closeButton.onclick = this.closeMenu.bind(this);
	    	// Make input field for height
	    	var heightInput = document.createElement('input');
	    	heightInput.type = "number";
	    	heightInput.id = "screenshotHeightInput";
	    	heightInput.style.display = "block";
	    	heightInput.style.width = "100%";
	    	heightInput.placeholder = "Height";
	    	heightInput.value = this.screenshotHeight;
	    	heightInput.oninput = this.menuUpdate.bind(this);
	    	// Make input field for width
	    	var widthInput = document.createElement('input');
	    	widthInput.type="number";
	    	widthInput.id = "screenshotWidthInput";
	    	widthInput.style.display = "block";
	    	widthInput.style.width = "100%";
	    	widthInput.placeholder = "Width";
	    	widthInput.value = this.screenshotWidth;
	    	widthInput.oninput = this.menuUpdate.bind(this);
	    	// Make a message field to show the actual current size
	    	var screenshotMessage = document.createElement('p');
	    	screenshotMessage.id = "screenshotTextMessage";
	    	screenshotMessage.display = "block";
	    	// Make a Div container for all the radio buttons
	    	var checkDiv = document.createElement('div');
	    	var screenshotMaxZoomCheck = document.createElement('input');
	    	screenshotMaxZoomCheck.type="radio";
	    	screenshotMaxZoomCheck.name="screenshotCheckForm";
	    	screenshotMaxZoomCheck.id = "screenshotMaxZoomCheck";
	    	checkDiv.appendChild(screenshotMaxZoomCheck);
	    	checkDiv.innerHTML += "Maximum zoom<br>";

	    	// var zoomFactorDiv = document.createElement('div');
	    	var screenshotZFCheck = document.createElement('input');
	    	screenshotZFCheck.type="radio";
	    	screenshotZFCheck.name="screenshotCheckForm";
	    	screenshotZFCheck.id = "screenshotZFCheck";
	    	checkDiv.appendChild(screenshotZFCheck);
	    	checkDiv.innerHTML += "This viewport, zoomed by:";
	    	var screenshotZFInput = document.createElement('input');
	    	screenshotZFInput.type="number";
	    	screenshotZFInput.id = "screenshotZFInput";
	    	checkDiv.appendChild(screenshotZFInput);
	    	checkDiv.innerHTML += "<br>";

	    	// var arDiv = document.createElement('div');
	    	var screenshotAspectRatio = document.createElement('input');
	    	screenshotAspectRatio.type="radio";
	    	screenshotAspectRatio.id = "screenshotAspectRatio";
	    	screenshotAspectRatio.name="screenshotCheckForm";
	    	checkDiv.appendChild(screenshotAspectRatio);
	    	checkDiv.innerHTML += "Maintain aspect ratio of viewport<br>";

	    	// var vpSizeDiv = document.createElement('div');
	    	var screenshotUseViewportSize = document.createElement('input');
	    	screenshotUseViewportSize.type="radio";
	    	screenshotUseViewportSize.id = "screenshotUseVpSize";
	    	screenshotUseViewportSize.name="screenshotCheckForm";
	    	checkDiv.appendChild(screenshotUseViewportSize);
	    	checkDiv.innerHTML += "Use the size I'm looking at right now<br>";

	    	// Button to download image
	    	var newLink = document.createElement('button');
	    	newLink.innerHTML = "Download image";
	    	newLink.onclick = this.takeScreenshot.bind(this, newLink);
	    	newLink.style.height = "40px";
	    	newLink.style.lineHeight = "30px";
	    	newLink.style.fontSize = "24px";
	    	newLink.style.margin = "0 auto";
	    	newLink.style.display = "block";

	    	// Append elements
	    	newDiv.appendChild(widthInput);
	    	newDiv.appendChild(heightInput);
	    	newDiv.appendChild(checkDiv);
	    	newDiv.appendChild(screenshotMessage);
	    	newDiv.appendChild(newLink);
	    	newDiv.appendChild(closeButton);
	    	mainDiv.appendChild(newDiv);
	    	this.showingMenu = true;
	    	this.menuObj = newDiv;

	    	// Add Events to all elements by id, since they won't work after HTML text addition somehow
	    	document.getElementById('screenshotMaxZoomCheck').onchange = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotZFCheck').onchange = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotAspectRatio').oninput = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotUseVpSize').onchange = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotZFInput').oninput = this.menuUpdate.bind(this);

	    	return true;
        },

        menuUpdate: function(){
    		this.screenshotHeight = document.getElementById('screenshotHeightInput').value;
    		this.screenshotWidth = document.getElementById('screenshotWidthInput').value;
    		var maxZoomChecked = document.getElementById('screenshotMaxZoomCheck').checked;
    		var arChecked = document.getElementById('screenshotAspectRatio').checked;
    		var useVpSize = document.getElementById('screenshotUseVpSize').checked;
    		var useVpSizeAndMultiply = document.getElementById('screenshotZFCheck').checked;
    		if(useVpSize){
				this.screenshotHeight = this.viewer.viewport.containerSize.y;
				this.screenshotWidth = this.viewer.viewport.containerSize.x;
				document.getElementById('screenshotHeightInput').value = this.viewer.viewport.containerSize.y;
				document.getElementById('screenshotWidthInput').value = this.viewer.viewport.containerSize.x;
    		}
    		else if(useVpSizeAndMultiply){
    			console.log('update');
				var multiplier = document.getElementById('screenshotZFInput').value;
				if((multiplier > 0 ) !== true){
					multiplier = 1;
				}
				this.screenshotHeight = this.viewer.viewport.containerSize.x * multiplier;
				this.screenshotWidth = this.viewer.viewport.containerSize.y * multiplier;
				document.getElementById('screenshotHeightInput').value = parseInt(this.viewer.viewport.containerSize.y * multiplier);
				document.getElementById('screenshotWidthInput').value = parseInt(this.viewer.viewport.containerSize.x * multiplier);
    		}
    		else if(maxZoomChecked){	
    			// Calculate max zoom level based on current position
				var viewportWidth = this.viewer.viewport.containerSize.x;
				var viewportHeight = this.viewer.viewport.containerSize.y;
				var maxZoom = this.viewer.viewport.getMaxZoom();
				var currentZoom = this.viewer.viewport.getZoom();
				this.screenshotHeight = parseInt(viewportHeight * maxZoom / currentZoom);
				this.screenshotWidth = parseInt(viewportWidth * maxZoom / currentZoom);
				document.getElementById('screenshotHeightInput').value = this.screenshotHeight;
				document.getElementById('screenshotWidthInput').value = this.screenshotWidth;
    		}
    		else{
    			if(arChecked){
    				var ar = this.viewer.viewport.containerSize.y / this.viewer.viewport.containerSize.x;
    				document.getElementById('screenshotHeightInput').value = parseInt(this.screenshotWidth * ar);
    				this.screenshotHeight = parseInt(this.screenshotWidth * ar);
    			}
    		}
			document.getElementById('screenshotTextMessage').innerHTML = this.screenshotWidth + "x" + this.screenshotHeight;
        }
    });


}(OpenSeadragon));
