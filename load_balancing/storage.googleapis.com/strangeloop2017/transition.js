"use strict";

document.addEventListener('keydown', function(event) {
    if (event.key == "ArrowRight" && slideNumber < maxSlideNumber) {
        window.location.href = "slide" + (slideNumber + 1) + ".html";
    } else if (event.key == "ArrowLeft" && slideNumber > 0) {
        window.location.href = "slide" + (slideNumber - 1) + ".html";
    }
}, false);
