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
            makingScreenshot : 		 false,

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
                },
            }
        }, options );

        $.extend( true, this.navImages, this.viewer.navImages );
        
        if (!this.element) {
            this.element = $.makeNeutralElement('div');
            this.element.style.background = 'rgba(0, 0, 0, 0.1)';
            this.element.className        = 'screenshot-box';
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


	    // this.innerTracker = new $.MouseTracker({
	        // element:            this.element,
	        // clickTimeThreshold: this.viewer.clickTimeThreshold,
	        // clickDistThreshold: this.viewer.clickDistThreshold,
	        // dragHandler:        $.delegate( this, onInsideDrag ),
	        // dragEndHandler:     $.delegate( this, onInsideDragEnd ),
	        // clickHandler:       $.delegate( this, onClick ),
	    // });

	    this.outerTracker = new $.MouseTracker({
	        element:            this.viewer.drawer.canvas,
	        clickTimeThreshold: this.viewer.clickTimeThreshold,
	        clickDistThreshold: this.viewer.clickDistThreshold,
	        clickHandler:       $.delegate( this, onOutsideClick ),
	        startDisabled:      !this.showingMenu,
	    });
	};



    function onKeyPress(e) {
        var key = e.keyCode ? e.keyCode : e.charCode;
        if (key === 13) {
            this.confirm();
        } else if (String.fromCharCode(key) === this.keyboardShortcut) {
            this.toggleScreenshotMenu();
        }
    }

    function onOutsideClick() {
    	this.closeMenu();
    }

    $.extend( $.Screenshot.prototype, $.ControlDock.prototype, /** @lends OpenSeadragon.Screenshot.prototype */{

        closeMenu: function(){
        	if(this.menuObj)
    			this.menuObj.parentElement.removeChild(this.menuObj);
    		this.showingMenu = false;
    		this.outerTracker.setTracking(false);
    		this.menuObj = null;
    		return true;
        },

        takeScreenshot: function() {
        	var makingScreenshot = true;

	    	// This is where the magic happens ;)
	    	//console.log('Taking a screenshot');
	    	var maxZoom = this.viewer.viewport.getMaxZoom();
	    	var currentZoom = this.viewer.viewport.getZoom();
	    	var output_x_size = this.screenshotWidth; // Pixels, obviously
	    	var output_y_size = this.screenshotHeight; // Pixels, obviously
	    	var screenshotDrawArrows = document.getElementById("screenshotDrawArrows").checked;

	    	var containerSize = this.viewer.viewport.containerSize;

	    	var originalCSx = containerSize.x;
	    	var originalCSy = containerSize.y;

	    	// Set element size (viewer)
	    	this.viewer.element.style.height = output_y_size + "px";
	    	this.viewer.element.style.width = output_x_size + "px";

	    	// Close menu
	    	this.closeMenu();
	    	// this.closeMenu.bind(this);

	    	var loadingdiv = document.createElement("div");
	    	var img = document.createElement("img");
	    	img.src = "/static/images/ajax_loader_gray_32.gif";
	    	loadingdiv.style.position = "absolute";
	    	loadingdiv.style.top = "0px";
	    	loadingdiv.style.left = "0px";
	    	loadingdiv.style.width = originalCSx + "px";
	    	loadingdiv.style.height = originalCSy + "px";
	    	loadingdiv.style.backgroundColor = "#fff";
	    	var imgDiv = document.createElement("div");
	    	imgDiv.appendChild(img);
	    	imgDiv.style.margin = "-16px 0 0 -16px";
	    	imgDiv.style.position = "absolute";
	    	imgDiv.style.top = Math.round(originalCSy / 2) + "px";
	    	imgDiv.style.left = Math.round(originalCSx / 2) + "px";
	    	imgDiv.innerHTML += 'Afbeelding laden... <br>Duurt het te lang?<br>';
	    	var closeLink = document.createElement('button');
			//var sURL = window.location.href;
	    	//closeLink.href=sURL;
	    	closeLink.onclick = function() {window.location.reload();}
	    	closeLink.innerHTML = "Probeer het nog eens";
	    	imgDiv.appendChild(closeLink);
	    	loadingdiv.appendChild(imgDiv)
	    	document.body.appendChild(loadingdiv);

	    	var viewer = this.viewer;
	    	// We need this function because we have to wait for the image to be fully loaded!
	    	var downloadFunction = function(){
        		viewer.world.getItemAt(0).removeAllHandlers('fully-loaded');
        		document.body.removeChild(loadingdiv);
        		loadingdiv = null;

	    		if(!makingScreenshot){
	    			return;
	    		}


				var Canvas = null;
				if(viewer.scalebarInstance){
		            var imgCanvas = viewer.drawer.canvas;
		            Canvas = document.createElement("canvas");
		            Canvas.width = imgCanvas.width;
		            Canvas.height = imgCanvas.height;
		            console.log(imgCanvas.width + "/" + imgCanvas.height);
		            var ctx = Canvas.getContext('2d');
            		ctx.drawImage(imgCanvas, 0, 0);
            		if(screenshotDrawArrows && viewer.annotationInstance)
            			viewer.annotationInstance.drawArrowsOnCanvas(Canvas);
		            var scalebarCanvas = viewer.scalebarInstance.getAsCanvas();
		            var location = viewer.scalebarInstance.getScalebarLocation();
					//Canvas = viewer.scalebarInstance.getImageWithScalebarAsCanvas();

	            	ctx.drawImage(scalebarCanvas, location.x, location.y);

					// Also add zoomscale
					if(viewer.zoomscaleInstance){
			            var zoomscaleCanvas = viewer.zoomscaleInstance.getAsCanvas();
			            var location = viewer.zoomscaleInstance.getZoomBarLocation();
			            var ctx = Canvas.getContext('2d');
		            	ctx.drawImage(zoomscaleCanvas, location.x, location.y + 30);
			        }
				}
				else{
					Canvas = viewer.drawer.canvas;
				}

				Canvas.toBlob(function(blob){
    				saveAs(blob, "screenshot.png");
			        viewer.element.style.height = originalCSy + "px";
			        viewer.element.style.width = originalCSx + "px";
				});

				/*
		      	requestAnimationFrame(function() {
		          // URL.revokeObjectURL(a.href);
		          a.removeAttribute('href');
		        });*/
				return;
	    	}


	    	requestAnimationFrame(function(){ // NEeded for HTML/JS to find out the viewport just resized
				viewer.forceRedraw();
		    	viewer.world.getItemAt(0).addHandler('fully-loaded', downloadFunction);
			});


        	return true;
        },

        toggleScreenshotMenu: function(){
            this.outerTracker.setTracking(!this.showingMenu);
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
	    	newDiv.style.fontFamily = "sans-serif,Arial";
	    	newDiv.style.fontSize = "25px";
	    	// Make close button
	    	var closeButton = document.createElement('button');
	    	closeButton.style.display = "block";
	    	closeButton.innerHTML = "Close";
	    	closeButton.onclick = this.closeMenu.bind(this);
	    	closeButton.ontouchstart = this.closeMenu.bind(this);
	    	// Make a message field to show the actual current size
	    	var screenshotMessage = document.createElement('p');
	    	screenshotMessage.id = "screenshotTextMessage";
	    	screenshotMessage.display = "block";
	    	// Make a Div container for all the radio buttons
	    	var checkDiv = document.createElement('div');

	    	// Display a radio for 600 DPI.
	    	var screenshotPaperCheck = document.createElement('input');
	    	screenshotPaperCheck.type="radio";
	    	screenshotPaperCheck.style.height = "25px";
	    	screenshotPaperCheck.name="screenshotCheckForm";
	    	screenshotPaperCheck.id = "screenshotPaperCheck";
	    	screenshotPaperCheck.setAttribute("checked","checked");
	    	checkDiv.appendChild(screenshotPaperCheck);
	    	checkDiv.innerHTML += "600DPI, 15cm breed<br>";

	    	// var zoomFactorDiv = document.createElement('div');
	    	var screenshotZFCheck = document.createElement('input');
	    	screenshotZFCheck.type="radio";
	    	screenshotZFCheck.name="screenshotCheckForm";
	    	screenshotZFCheck.style.height = "25px";
	    	screenshotZFCheck.id = "screenshotZFCheck";
	    	checkDiv.appendChild(screenshotZFCheck);
	    	checkDiv.innerHTML += "Andere DPI:";
	    	var screenshotZFInput = document.createElement('input');
	    	screenshotZFInput.type="range";
	    	screenshotZFInput.id = "screenshotZFInput";
	    	screenshotZFInput.max = "1500";
	    	screenshotZFInput.min = "150";
	    	screenshotZFInput.step = "150";
	    	screenshotZFInput.value = "600";

	    	checkDiv.appendChild(screenshotZFInput);
	    	var ZFDisplay = document.createElement('span');
	    	ZFDisplay.setAttribute("id", "screenshotZFDisplay");
	    	ZFDisplay.setAttribute("value", "600");
	    	checkDiv.appendChild(ZFDisplay);
	    	checkDiv.innerHTML += " DPI<br>";

	    	// var vpSizeDiv = document.createElement('div');
	    	var screenshotUseViewportSize = document.createElement('input');
	    	screenshotUseViewportSize.type="radio";
	    	screenshotUseViewportSize.style.height = "25px";
	    	screenshotUseViewportSize.id = "screenshotUseVpSize";
	    	screenshotUseViewportSize.name="screenshotCheckForm";
	    	checkDiv.appendChild(screenshotUseViewportSize);
	    	checkDiv.innerHTML += "Maak gewoon een screenshot<br>";

	    	var screenshotDrawArrows = document.createElement('input');
	    	screenshotDrawArrows.type="checkbox";
	    	screenshotDrawArrows.style.height = "25px";
	    	screenshotDrawArrows.id = "screenshotDrawArrows";
	    	screenshotDrawArrows.name="screenshotDrawArrows";
	    	checkDiv.appendChild(screenshotDrawArrows);
	    	checkDiv.innerHTML += "Teken ook de aanwijzers<br>";

	    	// Button to download image
	    	var newLink = document.createElement('button');
	    	newLink.innerHTML = "Download image";
	    	newLink.onclick = this.takeScreenshot.bind(this, newLink);
	    	newLink.ontouchstart = this.takeScreenshot.bind(this, newLink);
	    	newLink.style.height = "40px";
	    	newLink.style.lineHeight = "30px";
	    	newLink.style.fontSize = "24px";
	    	newLink.style.margin = "0 auto";
	    	newLink.style.display = "block";

	    	// Append elements
	    	newDiv.appendChild(checkDiv);
	    	newDiv.appendChild(screenshotMessage);
	    	newDiv.appendChild(newLink);
	    	newDiv.appendChild(closeButton);
	    	mainDiv.appendChild(newDiv);
	    	this.showingMenu = true;
	    	this.menuObj = newDiv;

	    	// Add Events to all elements by id, since they won't work after HTML text addition somehow
	    	document.getElementById('screenshotZFCheck').onchange = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotPaperCheck').onchange = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotZFInput').onchange = this.menuUpdate.bind(this);
	    	document.getElementById('screenshotUseVpSize').onchange = this.menuUpdate.bind(this);
	    	this.menuUpdate();

	    	return true;
        },

        menuUpdate: function(){
			var ar = this.viewer.viewport.containerSize.y / this.viewer.viewport.containerSize.x;
    		var paperChecked = document.getElementById('screenshotPaperCheck').checked;
    		var ZFchecked = document.getElementById('screenshotZFCheck').checked;
    		var thisVPChecked = document.getElementById('screenshotUseVpSize').checked;
    		if(thisVPChecked){
    			this.screenshotWidth = this.viewer.viewport.containerSize.x;
    			this.screenshotHeight = this.viewer.viewport.containerSize.y;
    		}
    		else{
				var DPIScale = paperChecked ? 600 : document.getElementById('screenshotZFInput').value;
				var width = DPIScale * 15 / 2.54; // 15 cm -> 2.54 cm/inch -> 15/2.54 inch. Multiply with DPIScale to get result.
				var height = width * ar; // Maintain aspect ratio

				var viewportWidth = this.viewer.viewport.containerSize.x;
				var viewportHeight = this.viewer.viewport.containerSize.y;
				var currentZoom = this.viewer.viewport.getZoom();
				var imageZoom = this.viewer.viewport.viewportToImageZoom(currentZoom);
				var zoomMultiplier = 1/imageZoom;
				var maxHeight = parseInt(viewportHeight * zoomMultiplier);
				var maxWidth = parseInt(viewportWidth * zoomMultiplier);

				this.screenshotWidth = (maxWidth < width) ? maxWidth : width;
				this.screenshotHeight = (maxHeight < height) ? maxHeight : height;

				if (!paperChecked)
					document.getElementById('screenshotZFDisplay').innerHTML = DPIScale;
    		}
			document.getElementById('screenshotTextMessage').innerHTML = "Grootte van download: " + Math.round(this.screenshotWidth) + "x" + Math.round(this.screenshotHeight);
        }
    });



})(OpenSeadragon);
