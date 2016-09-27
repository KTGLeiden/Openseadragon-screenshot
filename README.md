# Openseadragon-screenshot
This is a plugin for the openseadragon viewer that allows you to take a screenshot of whatever it is you are looking at in the browser. It is still under construction, but in essence works.

## Worthy to note
This plugin will work with a lot of versions of openseadragon, the only thing is that [This](https://github.com/openseadragon/openseadragon/pull/837/commits/f1cdf906535262783a9a94cb2dcdd5362e47b55c) commit is needed, since the viewer has to wait until the image has loaded fully, until we make the screenshot.

## Installation instructions
- Download openseadragon-screenshot.js
- Download [Filesaver.js](https://github.com/eligrey/FileSaver.js/), which I am using for creating the screenshot and downloading it.
    + Note: Filesaver.js has another dependency, which adds the .ToBlob() method for IE. If you want IE support, also download this! [Canvas-toBlob.js](https://github.com/eligrey/canvas-toBlob.js)



