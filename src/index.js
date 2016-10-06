'use strict';
var ImageToCanvas = {};
var MegaPix = require('./megapix');
var EXIF = require('exif-js');

ImageToCanvas.isPortrait = function(img) {
  return (img.height > img.width);
};

ImageToCanvas.isiOS = function() {
  var agents = [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ];
  while (agents.length) {
    if (navigator.platform === agents.pop()) return true;
  }
  return false;
};

ImageToCanvas.isAndroid = function() {
  return /Android/i.test(navigator.userAgent);
}

ImageToCanvas.isRotated = function(orientation) {
  return !! ~[5,6,7,8].indexOf(orientation);
}

ImageToCanvas.getExifOrientation = function(image, callback) {
  EXIF.getData(image, function () {
    var orientation = EXIF.getTag(image, 'Orientation') || 1;
    callback(orientation);
  });
}

ImageToCanvas.toBlob = function(dataURI, dataType) {
  var type = dataType || dataURI.split(',')[0].split(':')[1].split(';')[0] || 'image/jpeg';
  var binary = atob(dataURI.split(',')[1]), array = [];
  for(var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
  return new Blob([new Uint8Array(array)], {type: type});
}

ImageToCanvas.flipContext = function(ctx, canvas, x, y) {
  ctx.translate(x ? canvas.width : 0, y ? canvas.height : 0);
  ctx.scale(x ? -1 : 1, y ? -1 : 1);
}

ImageToCanvas.rotateContext = function(ctx, attr) {
  var x = attr.x || 0;
  var y = attr.y || 0;

  if (attr.degrees) {
    attr.radians = attr.degrees * (Math.PI / 180);
  }

  ctx.translate(x, y);
  ctx.rotate(attr.radians);
  ctx.translate(-x, -y);
}

ImageToCanvas.calculateSize = function(image, maxSize) {
  var size = { width: image.width, height: image.height };
  if (image.width > maxSize || image.height > maxSize) {
    var ratio = image.width / image.height;
    if (image.width >= image.height) {
      size.width = maxSize;
      size.height = maxSize / ratio;
    } else {
      size.height = maxSize;
      size.width = maxSize * ratio;
    }
  }
  return size;
};

ImageToCanvas.setDimensions = function(canvasSelector, size, orientation){
  if (ImageToCanvas.isRotated(orientation)) {
    canvasSelector.style.width = size.heigth+"px";
    canvasSelector.style.height= size.width+"px";
  } else {
    canvasSelector.style.width = size.width+"px";
    canvasSelector.style.height= size.height+"px";
  }
}

ImageToCanvas.drawCanvas = function(canvas, img, orientation, w, h, scale, offset){
  var mpImg;
  var scale = scale || 1;
  var offset = offset || {left: 1, top: 1};

  if(ImageToCanvas.isAndroid()){
    mpImg = new MegaPix(img);
    mpImg.render(canvas, {  quality: 1.0, orientation: orientation});
  }
  else {
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;;
    var ExifOrientations = [
      { op: 'none', degrees: 0 },
      { op: 'flip-x', degrees: 0 },
      { op: 'none', degrees: 180 },
      { op: 'flip-y', degrees: 0 },
      { op: 'flip-x', degrees: 90 },
      { op: 'none', degrees: 90 },
      { op: 'flip-x', degrees: -90 },
      { op: 'none', degrees: -90 }
    ];
    var exifOrientation = ExifOrientations[orientation - 1];
    var size = ImageToCanvas.calculateSize(img, 300);
    ImageToCanvas.setDimensions(document.querySelector("canvas"), size, orientation);

    // Flip vertically or horizontally
    if ('flip-x' == exifOrientation.op) flipContext(ctx, canvas, true, false);
    if ('flip-y' == exifOrientation.op) flipContext(ctx, canvas, false, true);

    // Rotate image
    var canvasWidth = parseInt(document.querySelector("canvas").style.width.replace("px",""));
    var canvasHeight = parseInt(document.querySelector("canvas").style.height.replace("px",""));

    if (exifOrientation.degrees) {
      ImageToCanvas.rotateContext(ctx, {
        degrees: exifOrientation.degrees,
        x: canvasWidth / 2,
        y: canvasHeight / 2
      });

      if (ImageToCanvas.isRotated(orientation)) {
        var diff = canvasWidth - canvasHeight;
        ctx.translate(diff / 2, -diff / 2);
      }
    }
    mpImg = new MegaPix(img);
    mpImg.render(canvas, {  quality: 1.0, orientation: orientation, scale: scale, offset: offset});
  }
}
module.exports= ImageToCanvas;
