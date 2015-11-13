window.onload = function() {
    var imageBoard = document.getElementById("imageBoard"),
        helpTip = document.getElementById("helpTip"),
        userCount = document.getElementById("userCount"),
        imageFileReader = new FileReader(),
        socket = io.connect(),
        expandedImage = null,
        showingHelpTip = true,
        pageX = 0,
        pageY = 0,
        THUMBNAIL_SIZE = 300,
        THUMBNAIL_BORDER_WIDTH = 5,
        POSTIMAGE_ANIMATION_DURATION = "500ms",
        POSTIMAGE_ANIMATION_TIMING_FUNCTION = "ease-in-out",
        EXPAND_ANIMATION_DURATION = "500ms",
        EXPAND_ANIMATION_TIMING_FUNCTION = "ease-in",
        EXPAND_BORER_SIZE_MULTIPLIER = 0.5,
        EXPAND_SIZE_MULTIPLIER = 0.95,
        HELPTIP_FADE_ANIMATION_DURATION = "3s",
        HELPTIP_FADE_ANIMATION_TIMING_FUNCTION = "ease";

    var onDragOver = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "copy";
    };

    var onDrop = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files;
        var file = files[0];
        pageX = evt.pageX - this.offsetLeft;
        pageY = evt.pageY - this.offsetTop;
        var src = (window.URL || window.webkitURL).createObjectURL(file);
        postImage(pageX, pageY, src);
        imageFileReader.readAsDataURL(file);
        if (showingHelpTip) {
            showingHelpTip = false;
            helpTip.style.opacity = 0;
        }
    };

    var onDragAndDropOutOfBounds = function(evt) {
        evt.preventDefault();
    };

    var getScaledDimensions = function(naturalWidth, naturalHeight, targetWidth, targetHeight) {
        var aspectRatio = naturalWidth/naturalHeight;
        var desiredWidth = targetWidth;
        var desiredHeight = targetWidth/aspectRatio;
        if (desiredWidth > targetWidth || desiredHeight > targetHeight) {
            desiredWidth = targetHeight * aspectRatio;
            desiredHeight = targetHeight;
        }
        if (desiredWidth > naturalWidth && desiredHeight > naturalHeight) {
            desiredWidth = naturalWidth;
            desiredHeight = naturalHeight;
        }
        return {"width": desiredWidth, "height": desiredHeight};
    }

    var expandImage = function(image) {
        if (expandedImage != null && expandedImage != image) {
            expandedImage.onclick();
        }
        expandedImage = image;
        var documentElement = document.documentElement;
        var pageWidth = documentElement.clientWidth;
        var pageHeight = documentElement.clientHeight;
        var imageStyle = image.style;
        var naturalWidth = parseInt(image.naturalWidth);
        var naturalHeight = parseInt(image.naturalHeight);
        var initialWidth = parseInt(imageStyle.width);
        var initialHeight = parseInt(imageStyle.height);
        var initialBorderWidth = parseInt(imageStyle.borderWidth);
        var initialLeft = parseInt(imageStyle.left);
        var initialTop = parseInt(imageStyle.top);
        var targetDimensions = getScaledDimensions(naturalWidth, naturalHeight, pageWidth * EXPAND_SIZE_MULTIPLIER, pageHeight * EXPAND_SIZE_MULTIPLIER);
        var targetWidth = targetDimensions.width - (initialBorderWidth * 2);
        var targetHeight = targetDimensions.height - (initialBorderWidth * 2);
        var targetBorderWidth = initialBorderWidth;
        var targetLeft = pageWidth/2 - imageBoard.offsetLeft - (targetWidth/2 + targetBorderWidth);
        var targetTop = pageHeight/2 - imageBoard.offsetTop - (targetHeight/2 + targetBorderWidth);
        image.onclick = null;
        var shrinkEnd = function() {
            image.removeEventListener("transitionend", shrinkEnd);
            image.removeEventListener("webkitTransitionEnd", shrinkEnd);
            imageStyle.zIndex = 0;
        };
        var expandEnd = function() {
            image.removeEventListener("transitionend", expandEnd);
            image.removeEventListener("webkitTransitionEnd", expandEnd);
            imageStyle.zIndex = 1;
        };
        image.addEventListener("transitionend", expandEnd);
        image.addEventListener("webkitTransitionEnd", expandEnd);
        imageStyle.zIndex = 2;
        imageStyle.width = targetWidth;
        imageStyle.height = targetHeight;
        imageStyle.left = targetLeft;
        imageStyle.top = targetTop;
        image.onclick = function() {
            image.removeEventListener("transitionend", expandEnd);
            image.removeEventListener("webkitTransitionEnd", expandEnd);
            expandedImage = null;
            image.onclick = null;
            image.addEventListener("transitionend", shrinkEnd);
            image.addEventListener("webkitTransitionEnd", shrinkEnd);
            imageStyle.width = initialWidth;
            imageStyle.height = initialHeight;
            imageStyle.left = initialLeft;
            imageStyle.top = initialTop;
            image.onclick = function() {
                image.removeEventListener("transitionend", shrinkEnd);
                image.removeEventListener("webkitTransitionEnd", shrinkEnd);
                expandImage(image);
            };
        };
    };

    var postImage = function(x, y, src) {
        if (expandedImage != null) {
            expandedImage.onclick();
        }
        var image = new Image();
        image.src = src;
        image.className = "img";
        var initialWidth = 0;
        var initialHeight = 0;
        var initialBorderWidth = 0;
        var initialLeft = x;
        var initialTop = y;
        var imageStyle = image.style;
        imageStyle.width = initialWidth + "px";
        imageStyle.height = initialHeight + "px";
        imageStyle.left = initialLeft + "px";
        imageStyle.top = initialTop + "px";
        imageBoard.appendChild(image);
        image.onload = function() {
            var naturalWidth = image.naturalWidth;
            var naturalHeight = image.naturalHeight;
            var targetDimensions = getScaledDimensions(naturalWidth, naturalHeight, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
            var targetWidth = targetDimensions.width;
            var targetHeight = targetDimensions.height;
            var targetBorderWidth = THUMBNAIL_BORDER_WIDTH;
            var targetLeft = x - (targetWidth/2 + targetBorderWidth);
            var targetTop = y - (targetHeight/2 + targetBorderWidth);
            imageStyle.borderWidth = initialBorderWidth + "px";
            imageStyle.width = targetWidth + "px";
            imageStyle.height = targetHeight + "px";
            imageStyle.left = targetLeft + "px";
            imageStyle.top = targetTop + "px";
            imageStyle.borderWidth = targetBorderWidth;
            image.onclick = function() {
                expandImage(image);
            };
        };
    };

    imageFileReader.onload = function(evt) {
        socket.emit("postImage", {"x": pageX, "y": pageY, "src": evt.target.result});
    };

    document.addEventListener("dragover", onDragAndDropOutOfBounds, false);
    document.addEventListener("drop", onDragAndDropOutOfBounds, false);
    imageBoard.addEventListener("dragover", onDragOver, false);
    imageBoard.addEventListener("drop", onDrop, false);

    socket.on("userCountUpdate", function(count) {
        userCount.innerText = count;
    });
 
    socket.on("postImage", function(data) {
        var x = data.x;
        var y = data.y;
        var src = data.src;
        postImage(x, y, src);
    });

};