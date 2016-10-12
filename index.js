/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ImageToCanvas = {};
	var MegaPix = __webpack_require__(2);
	var EXIF = __webpack_require__(3);
	__webpack_require__(4); // for IE

	ImageToCanvas.isPortrait = function (img) {
	  return img.height > img.width;
	};

	ImageToCanvas.isiOS = function () {
	  var agents = ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'];
	  while (agents.length) {
	    if (navigator.platform === agents.pop()) return true;
	  }
	  return false;
	};

	ImageToCanvas.isAndroid = function () {
	  return (/Android/i.test(navigator.userAgent)
	  );
	};

	ImageToCanvas.isRotated = function (orientation) {
	  return !!~[5, 6, 7, 8].indexOf(orientation);
	};

	ImageToCanvas.getExifOrientation = function (image) {
	  return new Promise(function (resolve) {
	    EXIF.getData(image, function () {
	      var orientation = 1;
	      try {
	        orientation = EXIF.getTag(image, 'Orientation') || 1;
	      } catch (e) {
	        // do nothing on err
	      }
	      resolve(orientation);
	    });
	  });
	};

	ImageToCanvas.toBlob = function (dataURI, dataType) {
	  return new Promise(function (resolve) {
	    var type = dataType || dataURI.split(',')[0].split(':')[1].split(';')[0] || 'image/jpeg';
	    if (type !== 'image/jpeg') {
	      // convert to jpeg because Safari & Firefox has issues with pngs
	      var canvas = document.createElement("canvas");
	      var ctx = canvas.getContext("2d");
	      var img = new Image();
	      img.onload = function () {
	        ctx.drawImage(img, 0, 0);
	        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	        resolve(new Blob([new Uint8Array(imgData.data)], { type: 'image/jpeg' }));
	      };
	      img.src = dataURI;
	    } else {
	      var binary = atob(dataURI.split(',')[1]),
	          array = [];
	      for (var i = 0; i < binary.length; i++) {
	        array.push(binary.charCodeAt(i));
	      }resolve(new Blob([new Uint8Array(array)], { type: type }));
	    }
	  });
	};

	ImageToCanvas.flipContext = function (ctx, canvas, x, y) {
	  ctx.translate(x ? canvas.width : 0, y ? canvas.height : 0);
	  ctx.scale(x ? -1 : 1, y ? -1 : 1);
	};

	ImageToCanvas.rotateContext = function (ctx, attr) {
	  var x = attr.x || 0;
	  var y = attr.y || 0;

	  if (attr.degrees) {
	    attr.radians = attr.degrees * (Math.PI / 180);
	  }

	  ctx.translate(x, y);
	  ctx.rotate(attr.radians);
	  ctx.translate(-x, -y);
	};

	ImageToCanvas.calculateSize = function (image, maxSize) {
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

	ImageToCanvas.setDimensions = function (canvasSelector, size, orientation) {
	  if (ImageToCanvas.isRotated(orientation)) {
	    canvasSelector.style.width = size.heigth + "px";
	    canvasSelector.style.height = size.width + "px";
	  } else {
	    canvasSelector.style.width = size.width + "px";
	    canvasSelector.style.height = size.height + "px";
	  }
	};

	ImageToCanvas.drawCanvas = function (canvas, img, orientation, w, h, scale, offset, setDim) {
	  var mpImg;
	  var scale = scale || 1;
	  var offset = offset || { left: 1, top: 1 };
	  var setDim = 'undefined' !== typeof setDim ? setDim : true;

	  if (ImageToCanvas.isAndroid()) {
	    mpImg = new MegaPix(img);
	    mpImg.render(canvas, { quality: 1.0, orientation: orientation });
	  } else {
	    var ctx = canvas.getContext('2d');
	    ctx.imageSmoothingEnabled = true;
	    var ExifOrientations = [{ op: 'none', degrees: 0 }, { op: 'flip-x', degrees: 0 }, { op: 'none', degrees: 180 }, { op: 'flip-y', degrees: 0 }, { op: 'flip-x', degrees: 90 }, { op: 'none', degrees: 90 }, { op: 'flip-x', degrees: -90 }, { op: 'none', degrees: -90 }];
	    var exifOrientation = ExifOrientations[orientation - 1];
	    var size = ImageToCanvas.calculateSize(img, 300);
	    if (setDim) {
	      ImageToCanvas.setDimensions(document.querySelector("canvas"), size, orientation);
	    }

	    // Flip vertically or horizontally
	    if ('flip-x' == exifOrientation.op) flipContext(ctx, canvas, true, false);
	    if ('flip-y' == exifOrientation.op) flipContext(ctx, canvas, false, true);

	    // Rotate image
	    var canvasWidth = parseInt(document.querySelector("canvas").style.width.replace("px", ""));
	    var canvasHeight = parseInt(document.querySelector("canvas").style.height.replace("px", ""));

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
	    mpImg.render(canvas, { quality: 1.0, orientation: orientation, scale: scale, offset: offset });
	  }
	};
	module.exports = ImageToCanvas;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	/**
	 * Mega pixel image rendering library for iOS6 Safari
	 *
	 * Fixes iOS6 Safari's image file rendering issue for large size image (over mega-pixel),
	 * which causes unexpected subsampling when drawing it in canvas.
	 * By using this library, you can safely render the image with proper stretching.
	 *
	 * Copyright (c) 2012 Shinichi Tomita <shinichi.tomita@gmail.com>
	 * Released under the MIT license
	 */
	(function () {

	  /**
	   * Detect subsampling in loaded image.
	   * In iOS, larger images than 2M pixels may be subsampled in rendering.
	   */
	  function detectSubsampling(img) {
	    var iw = img.naturalWidth,
	        ih = img.naturalHeight;
	    if (iw * ih > 1024 * 1024) {
	      // subsampling may happen over megapixel image
	      var canvas = document.createElement('canvas');
	      canvas.width = canvas.height = 1;
	      var ctx = canvas.getContext('2d');
	      ctx.drawImage(img, -iw + 1, 0);
	      // subsampled image becomes half smaller in rendering size.
	      // check alpha channel value to confirm image is covering edge pixel or not.
	      // if alpha value is 0 image is not covering, hence subsampled.
	      return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
	    } else {
	      return false;
	    }
	  }

	  /**
	   * Detecting vertical squash in loaded image.
	   * Fixes a bug which squash image vertically while drawing into canvas for some images.
	   */
	  function detectVerticalSquash(img, iw, ih) {
	    var canvas = document.createElement('canvas');
	    canvas.width = 1;
	    canvas.height = ih;
	    var ctx = canvas.getContext('2d');
	    ctx.drawImage(img, 0, 0);
	    var data = ctx.getImageData(0, 0, 1, ih).data;
	    // search image edge pixel position in case it is squashed vertically.
	    var sy = 0;
	    var ey = ih;
	    var py = ih;
	    while (py > sy) {
	      var alpha = data[(py - 1) * 4 + 3];
	      if (alpha === 0) {
	        ey = py;
	      } else {
	        sy = py;
	      }
	      py = ey + sy >> 1;
	    }
	    var ratio = py / ih;
	    return ratio === 0 ? 1 : ratio;
	  }

	  /**
	   * Rendering image element (with resizing) and get its data URL
	   */
	  function renderImageToDataURL(img, options, doSquash, scale) {
	    var canvas = document.createElement('canvas');
	    renderImageToCanvas(img, canvas, options, doSquash, scale);
	    return canvas.toDataURL("image/jpeg", options.quality || 0.8);
	  }

	  /**
	   * Rendering image element (with resizing) into the canvas element
	   */
	  function renderImageToCanvas(img, canvas, options, doSquash) {
	    var scale = options.scale || 1;
	    var offset = options.offset || { left: 0, top: 0 };
	    var iw = img.naturalWidth,
	        ih = img.naturalHeight;
	    if (!(iw + ih)) return;
	    var width = options.width,
	        height = options.height;
	    var ctx = canvas.getContext('2d');
	    ctx.save();
	    transformCoordinate(canvas, ctx, width, height, options.orientation);
	    var subsampled = detectSubsampling(img);
	    if (subsampled) {
	      iw /= 2;
	      ih /= 2;
	    }
	    var d = 1024; // size of tiling canvas
	    var tmpCanvas = document.createElement('canvas');
	    tmpCanvas.width = tmpCanvas.height = d;
	    var tmpCtx = tmpCanvas.getContext('2d');
	    var vertSquashRatio = doSquash ? detectVerticalSquash(img, iw, ih) : 1;
	    var dw = Math.ceil(d * width / iw);
	    var dh = Math.ceil(d * height / ih / vertSquashRatio);
	    var sy = 0;
	    var dy = 0;
	    while (sy < ih) {
	      var sx = 0;
	      var dx = 0;
	      var left = offset.left;
	      var top = offset.top;
	      while (sx < iw) {
	        tmpCtx.clearRect(0, 0, d, d);
	        tmpCtx.drawImage(img, -sx, -sy);
	        ctx.drawImage(tmpCanvas, left, top, d - left, d - top, dx, dy, dw * scale, dh * scale);
	        sx += d;
	        dx += dw;
	      }
	      sy += d;
	      dy += dh;
	    }
	    ctx.restore();
	    tmpCanvas = tmpCtx = null;
	  }

	  /**
	   * Transform canvas coordination according to specified frame size and orientation
	   * Orientation value is from EXIF tag
	   */
	  function transformCoordinate(canvas, ctx, width, height, orientation) {
	    switch (orientation) {
	      case 5:
	      case 6:
	      case 7:
	      case 8:
	        canvas.width = height;
	        canvas.height = width;
	        break;
	      default:
	        canvas.width = width;
	        canvas.height = height;
	    }
	    switch (orientation) {
	      case 2:
	        // horizontal flip
	        ctx.translate(width, 0);
	        ctx.scale(-1, 1);
	        break;
	      case 3:
	        // 180 rotate left
	        ctx.translate(width, height);
	        ctx.rotate(Math.PI);
	        break;
	      case 4:
	        // vertical flip
	        ctx.translate(0, height);
	        ctx.scale(1, -1);
	        break;
	      case 5:
	        // vertical flip + 90 rotate right
	        ctx.rotate(0.5 * Math.PI);
	        ctx.scale(1, -1);
	        break;
	      case 6:
	        // 90 rotate right
	        ctx.rotate(0.5 * Math.PI);
	        ctx.translate(0, -height);
	        break;
	      case 7:
	        // horizontal flip + 90 rotate right
	        ctx.rotate(0.5 * Math.PI);
	        ctx.translate(width, -height);
	        ctx.scale(-1, 1);
	        break;
	      case 8:
	        // 90 rotate left
	        ctx.rotate(-0.5 * Math.PI);
	        ctx.translate(-width, 0);
	        break;
	      default:
	        break;
	    }
	  }

	  var URL = typeof window !== 'undefined' && window.URL && window.URL.createObjectURL ? window.URL : typeof window !== 'undefined' && window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL : null;

	  /**
	   * MegaPixImage class
	   */
	  function MegaPixImage(srcImage) {
	    if (typeof window !== 'undefined' && window.Blob && srcImage instanceof Blob) {
	      if (!URL) {
	        throw Error("No createObjectURL function found to create blob url");
	      }
	      var img = new Image();
	      img.src = URL.createObjectURL(srcImage);
	      this.blob = srcImage;
	      srcImage = img;
	    }
	    if (!srcImage.naturalWidth && !srcImage.naturalHeight) {
	      var _this = this;
	      srcImage.onload = srcImage.onerror = function () {
	        var listeners = _this.imageLoadListeners;
	        if (listeners) {
	          _this.imageLoadListeners = null;
	          for (var i = 0, len = listeners.length; i < len; i++) {
	            listeners[i]();
	          }
	        }
	      };
	      this.imageLoadListeners = [];
	    }
	    this.srcImage = srcImage;
	  }

	  /**
	   * Rendering megapix image into specified target element
	   */
	  MegaPixImage.prototype.render = function (target, options, callback) {
	    if (this.imageLoadListeners) {
	      var _this = this;
	      this.imageLoadListeners.push(function () {
	        _this.render(target, options, callback);
	      });
	      //return;
	    }
	    options = options || {};
	    var scale = options.scale || 1;
	    var offset = options.offset || { left: 0, top: 0 };

	    var srcImage = this.srcImage,
	        src = srcImage.src,
	        srcLength = src.length,
	        imgWidth = srcImage.naturalWidth,
	        imgHeight = srcImage.naturalHeight,
	        width = options.width,
	        height = options.height,
	        maxWidth = options.maxWidth,
	        maxHeight = options.maxHeight,
	        doSquash = this.blob && this.blob.type === 'image/jpeg' || src.indexOf('data:image/jpeg') === 0 || src.indexOf('.jpg') === srcLength - 4 || src.indexOf('.jpeg') === srcLength - 5;
	    if (width && !height) {
	      height = imgHeight * width / imgWidth << 0;
	    } else if (height && !width) {
	      width = imgWidth * height / imgHeight << 0;
	    } else {
	      width = imgWidth;
	      height = imgHeight;
	    }
	    if (maxWidth && width > maxWidth) {
	      width = maxWidth;
	      height = imgHeight * width / imgWidth << 0;
	    }
	    if (maxHeight && height > maxHeight) {
	      height = maxHeight;
	      width = imgWidth * height / imgHeight << 0;
	    }
	    var opt = { width: width, height: height };
	    for (var k in options) {
	      opt[k] = options[k];
	    }doSquash = true;
	    var tagName = target.tagName.toLowerCase();
	    if (tagName === 'img') {
	      target.src = renderImageToDataURL(this.srcImage, opt, doSquash, scale);
	    } else if (tagName === 'canvas') {
	      renderImageToCanvas(this.srcImage, target, opt, doSquash, scale);
	    }
	    if (typeof this.onrender === 'function') {
	      this.onrender(target);
	    }
	    if (callback) {
	      callback();
	    }
	    if (this.blob) {
	      this.blob = null;
	      URL.revokeObjectURL(this.srcImage.src);
	    }
	  };

	  /**
	   * Export class to global
	   */
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	      return MegaPixImage;
	    }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // for AMD loader
	  } else if (module && module.exports) {
	    module.exports = MegaPixImage;
	  } else {
	    this.MegaPixImage = MegaPixImage;
	  }
	})();

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function() {

	    var debug = false;

	    var root = this;

	    var EXIF = function(obj) {
	        if (obj instanceof EXIF) return obj;
	        if (!(this instanceof EXIF)) return new EXIF(obj);
	        this.EXIFwrapped = obj;
	    };

	    if (true) {
	        if (typeof module !== 'undefined' && module.exports) {
	            exports = module.exports = EXIF;
	        }
	        exports.EXIF = EXIF;
	    } else {
	        root.EXIF = EXIF;
	    }

	    var ExifTags = EXIF.Tags = {

	        // version tags
	        0x9000 : "ExifVersion",             // EXIF version
	        0xA000 : "FlashpixVersion",         // Flashpix format version

	        // colorspace tags
	        0xA001 : "ColorSpace",              // Color space information tag

	        // image configuration
	        0xA002 : "PixelXDimension",         // Valid width of meaningful image
	        0xA003 : "PixelYDimension",         // Valid height of meaningful image
	        0x9101 : "ComponentsConfiguration", // Information about channels
	        0x9102 : "CompressedBitsPerPixel",  // Compressed bits per pixel

	        // user information
	        0x927C : "MakerNote",               // Any desired information written by the manufacturer
	        0x9286 : "UserComment",             // Comments by user

	        // related file
	        0xA004 : "RelatedSoundFile",        // Name of related sound file

	        // date and time
	        0x9003 : "DateTimeOriginal",        // Date and time when the original image was generated
	        0x9004 : "DateTimeDigitized",       // Date and time when the image was stored digitally
	        0x9290 : "SubsecTime",              // Fractions of seconds for DateTime
	        0x9291 : "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
	        0x9292 : "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized

	        // picture-taking conditions
	        0x829A : "ExposureTime",            // Exposure time (in seconds)
	        0x829D : "FNumber",                 // F number
	        0x8822 : "ExposureProgram",         // Exposure program
	        0x8824 : "SpectralSensitivity",     // Spectral sensitivity
	        0x8827 : "ISOSpeedRatings",         // ISO speed rating
	        0x8828 : "OECF",                    // Optoelectric conversion factor
	        0x9201 : "ShutterSpeedValue",       // Shutter speed
	        0x9202 : "ApertureValue",           // Lens aperture
	        0x9203 : "BrightnessValue",         // Value of brightness
	        0x9204 : "ExposureBias",            // Exposure bias
	        0x9205 : "MaxApertureValue",        // Smallest F number of lens
	        0x9206 : "SubjectDistance",         // Distance to subject in meters
	        0x9207 : "MeteringMode",            // Metering mode
	        0x9208 : "LightSource",             // Kind of light source
	        0x9209 : "Flash",                   // Flash status
	        0x9214 : "SubjectArea",             // Location and area of main subject
	        0x920A : "FocalLength",             // Focal length of the lens in mm
	        0xA20B : "FlashEnergy",             // Strobe energy in BCPS
	        0xA20C : "SpatialFrequencyResponse",    //
	        0xA20E : "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
	        0xA20F : "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
	        0xA210 : "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
	        0xA214 : "SubjectLocation",         // Location of subject in image
	        0xA215 : "ExposureIndex",           // Exposure index selected on camera
	        0xA217 : "SensingMethod",           // Image sensor type
	        0xA300 : "FileSource",              // Image source (3 == DSC)
	        0xA301 : "SceneType",               // Scene type (1 == directly photographed)
	        0xA302 : "CFAPattern",              // Color filter array geometric pattern
	        0xA401 : "CustomRendered",          // Special processing
	        0xA402 : "ExposureMode",            // Exposure mode
	        0xA403 : "WhiteBalance",            // 1 = auto white balance, 2 = manual
	        0xA404 : "DigitalZoomRation",       // Digital zoom ratio
	        0xA405 : "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
	        0xA406 : "SceneCaptureType",        // Type of scene
	        0xA407 : "GainControl",             // Degree of overall image gain adjustment
	        0xA408 : "Contrast",                // Direction of contrast processing applied by camera
	        0xA409 : "Saturation",              // Direction of saturation processing applied by camera
	        0xA40A : "Sharpness",               // Direction of sharpness processing applied by camera
	        0xA40B : "DeviceSettingDescription",    //
	        0xA40C : "SubjectDistanceRange",    // Distance to subject

	        // other tags
	        0xA005 : "InteroperabilityIFDPointer",
	        0xA420 : "ImageUniqueID"            // Identifier assigned uniquely to each image
	    };

	    var TiffTags = EXIF.TiffTags = {
	        0x0100 : "ImageWidth",
	        0x0101 : "ImageHeight",
	        0x8769 : "ExifIFDPointer",
	        0x8825 : "GPSInfoIFDPointer",
	        0xA005 : "InteroperabilityIFDPointer",
	        0x0102 : "BitsPerSample",
	        0x0103 : "Compression",
	        0x0106 : "PhotometricInterpretation",
	        0x0112 : "Orientation",
	        0x0115 : "SamplesPerPixel",
	        0x011C : "PlanarConfiguration",
	        0x0212 : "YCbCrSubSampling",
	        0x0213 : "YCbCrPositioning",
	        0x011A : "XResolution",
	        0x011B : "YResolution",
	        0x0128 : "ResolutionUnit",
	        0x0111 : "StripOffsets",
	        0x0116 : "RowsPerStrip",
	        0x0117 : "StripByteCounts",
	        0x0201 : "JPEGInterchangeFormat",
	        0x0202 : "JPEGInterchangeFormatLength",
	        0x012D : "TransferFunction",
	        0x013E : "WhitePoint",
	        0x013F : "PrimaryChromaticities",
	        0x0211 : "YCbCrCoefficients",
	        0x0214 : "ReferenceBlackWhite",
	        0x0132 : "DateTime",
	        0x010E : "ImageDescription",
	        0x010F : "Make",
	        0x0110 : "Model",
	        0x0131 : "Software",
	        0x013B : "Artist",
	        0x8298 : "Copyright"
	    };

	    var GPSTags = EXIF.GPSTags = {
	        0x0000 : "GPSVersionID",
	        0x0001 : "GPSLatitudeRef",
	        0x0002 : "GPSLatitude",
	        0x0003 : "GPSLongitudeRef",
	        0x0004 : "GPSLongitude",
	        0x0005 : "GPSAltitudeRef",
	        0x0006 : "GPSAltitude",
	        0x0007 : "GPSTimeStamp",
	        0x0008 : "GPSSatellites",
	        0x0009 : "GPSStatus",
	        0x000A : "GPSMeasureMode",
	        0x000B : "GPSDOP",
	        0x000C : "GPSSpeedRef",
	        0x000D : "GPSSpeed",
	        0x000E : "GPSTrackRef",
	        0x000F : "GPSTrack",
	        0x0010 : "GPSImgDirectionRef",
	        0x0011 : "GPSImgDirection",
	        0x0012 : "GPSMapDatum",
	        0x0013 : "GPSDestLatitudeRef",
	        0x0014 : "GPSDestLatitude",
	        0x0015 : "GPSDestLongitudeRef",
	        0x0016 : "GPSDestLongitude",
	        0x0017 : "GPSDestBearingRef",
	        0x0018 : "GPSDestBearing",
	        0x0019 : "GPSDestDistanceRef",
	        0x001A : "GPSDestDistance",
	        0x001B : "GPSProcessingMethod",
	        0x001C : "GPSAreaInformation",
	        0x001D : "GPSDateStamp",
	        0x001E : "GPSDifferential"
	    };

	    var StringValues = EXIF.StringValues = {
	        ExposureProgram : {
	            0 : "Not defined",
	            1 : "Manual",
	            2 : "Normal program",
	            3 : "Aperture priority",
	            4 : "Shutter priority",
	            5 : "Creative program",
	            6 : "Action program",
	            7 : "Portrait mode",
	            8 : "Landscape mode"
	        },
	        MeteringMode : {
	            0 : "Unknown",
	            1 : "Average",
	            2 : "CenterWeightedAverage",
	            3 : "Spot",
	            4 : "MultiSpot",
	            5 : "Pattern",
	            6 : "Partial",
	            255 : "Other"
	        },
	        LightSource : {
	            0 : "Unknown",
	            1 : "Daylight",
	            2 : "Fluorescent",
	            3 : "Tungsten (incandescent light)",
	            4 : "Flash",
	            9 : "Fine weather",
	            10 : "Cloudy weather",
	            11 : "Shade",
	            12 : "Daylight fluorescent (D 5700 - 7100K)",
	            13 : "Day white fluorescent (N 4600 - 5400K)",
	            14 : "Cool white fluorescent (W 3900 - 4500K)",
	            15 : "White fluorescent (WW 3200 - 3700K)",
	            17 : "Standard light A",
	            18 : "Standard light B",
	            19 : "Standard light C",
	            20 : "D55",
	            21 : "D65",
	            22 : "D75",
	            23 : "D50",
	            24 : "ISO studio tungsten",
	            255 : "Other"
	        },
	        Flash : {
	            0x0000 : "Flash did not fire",
	            0x0001 : "Flash fired",
	            0x0005 : "Strobe return light not detected",
	            0x0007 : "Strobe return light detected",
	            0x0009 : "Flash fired, compulsory flash mode",
	            0x000D : "Flash fired, compulsory flash mode, return light not detected",
	            0x000F : "Flash fired, compulsory flash mode, return light detected",
	            0x0010 : "Flash did not fire, compulsory flash mode",
	            0x0018 : "Flash did not fire, auto mode",
	            0x0019 : "Flash fired, auto mode",
	            0x001D : "Flash fired, auto mode, return light not detected",
	            0x001F : "Flash fired, auto mode, return light detected",
	            0x0020 : "No flash function",
	            0x0041 : "Flash fired, red-eye reduction mode",
	            0x0045 : "Flash fired, red-eye reduction mode, return light not detected",
	            0x0047 : "Flash fired, red-eye reduction mode, return light detected",
	            0x0049 : "Flash fired, compulsory flash mode, red-eye reduction mode",
	            0x004D : "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
	            0x004F : "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
	            0x0059 : "Flash fired, auto mode, red-eye reduction mode",
	            0x005D : "Flash fired, auto mode, return light not detected, red-eye reduction mode",
	            0x005F : "Flash fired, auto mode, return light detected, red-eye reduction mode"
	        },
	        SensingMethod : {
	            1 : "Not defined",
	            2 : "One-chip color area sensor",
	            3 : "Two-chip color area sensor",
	            4 : "Three-chip color area sensor",
	            5 : "Color sequential area sensor",
	            7 : "Trilinear sensor",
	            8 : "Color sequential linear sensor"
	        },
	        SceneCaptureType : {
	            0 : "Standard",
	            1 : "Landscape",
	            2 : "Portrait",
	            3 : "Night scene"
	        },
	        SceneType : {
	            1 : "Directly photographed"
	        },
	        CustomRendered : {
	            0 : "Normal process",
	            1 : "Custom process"
	        },
	        WhiteBalance : {
	            0 : "Auto white balance",
	            1 : "Manual white balance"
	        },
	        GainControl : {
	            0 : "None",
	            1 : "Low gain up",
	            2 : "High gain up",
	            3 : "Low gain down",
	            4 : "High gain down"
	        },
	        Contrast : {
	            0 : "Normal",
	            1 : "Soft",
	            2 : "Hard"
	        },
	        Saturation : {
	            0 : "Normal",
	            1 : "Low saturation",
	            2 : "High saturation"
	        },
	        Sharpness : {
	            0 : "Normal",
	            1 : "Soft",
	            2 : "Hard"
	        },
	        SubjectDistanceRange : {
	            0 : "Unknown",
	            1 : "Macro",
	            2 : "Close view",
	            3 : "Distant view"
	        },
	        FileSource : {
	            3 : "DSC"
	        },

	        Components : {
	            0 : "",
	            1 : "Y",
	            2 : "Cb",
	            3 : "Cr",
	            4 : "R",
	            5 : "G",
	            6 : "B"
	        }
	    };

	    function addEvent(element, event, handler) {
	        if (element.addEventListener) {
	            element.addEventListener(event, handler, false);
	        } else if (element.attachEvent) {
	            element.attachEvent("on" + event, handler);
	        }
	    }

	    function imageHasData(img) {
	        return !!(img.exifdata);
	    }


	    function base64ToArrayBuffer(base64, contentType) {
	        contentType = contentType || base64.match(/^data\:([^\;]+)\;base64,/mi)[1] || ''; // e.g. 'data:image/jpeg;base64,...' => 'image/jpeg'
	        base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
	        var binary = atob(base64);
	        var len = binary.length;
	        var buffer = new ArrayBuffer(len);
	        var view = new Uint8Array(buffer);
	        for (var i = 0; i < len; i++) {
	            view[i] = binary.charCodeAt(i);
	        }
	        return buffer;
	    }

	    function objectURLToBlob(url, callback) {
	        var http = new XMLHttpRequest();
	        http.open("GET", url, true);
	        http.responseType = "blob";
	        http.onload = function(e) {
	            if (this.status == 200 || this.status === 0) {
	                callback(this.response);
	            }
	        };
	        http.send();
	    }

	    function getImageData(img, callback) {
	        function handleBinaryFile(binFile) {
	            var data = findEXIFinJPEG(binFile);
	            var iptcdata = findIPTCinJPEG(binFile);
	            img.exifdata = data || {};
	            img.iptcdata = iptcdata || {};
	            if (callback) {
	                callback.call(img);
	            }
	        }

	        if (img.src) {
	            if (/^data\:/i.test(img.src)) { // Data URI
	                var arrayBuffer = base64ToArrayBuffer(img.src);
	                handleBinaryFile(arrayBuffer);

	            } else if (/^blob\:/i.test(img.src)) { // Object URL
	                var fileReader = new FileReader();
	                fileReader.onload = function(e) {
	                    handleBinaryFile(e.target.result);
	                };
	                objectURLToBlob(img.src, function (blob) {
	                    fileReader.readAsArrayBuffer(blob);
	                });
	            } else {
	                var http = new XMLHttpRequest();
	                http.onload = function() {
	                    if (this.status == 200 || this.status === 0) {
	                        handleBinaryFile(http.response);
	                    } else {
	                        throw "Could not load image";
	                    }
	                    http = null;
	                };
	                http.open("GET", img.src, true);
	                http.responseType = "arraybuffer";
	                http.send(null);
	            }
	        } else if (window.FileReader && (img instanceof window.Blob || img instanceof window.File)) {
	            var fileReader = new FileReader();
	            fileReader.onload = function(e) {
	                if (debug) console.log("Got file of length " + e.target.result.byteLength);
	                handleBinaryFile(e.target.result);
	            };

	            fileReader.readAsArrayBuffer(img);
	        }
	    }

	    function findEXIFinJPEG(file) {
	        var dataView = new DataView(file);

	        if (debug) console.log("Got file of length " + file.byteLength);
	        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
	            if (debug) console.log("Not a valid JPEG");
	            return false; // not a valid jpeg
	        }

	        var offset = 2,
	            length = file.byteLength,
	            marker;

	        while (offset < length) {
	            if (dataView.getUint8(offset) != 0xFF) {
	                if (debug) console.log("Not a valid marker at offset " + offset + ", found: " + dataView.getUint8(offset));
	                return false; // not a valid marker, something is wrong
	            }

	            marker = dataView.getUint8(offset + 1);
	            if (debug) console.log(marker);

	            // we could implement handling for other markers here,
	            // but we're only looking for 0xFFE1 for EXIF data

	            if (marker == 225) {
	                if (debug) console.log("Found 0xFFE1 marker");

	                return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2);

	                // offset += 2 + file.getShortAt(offset+2, true);

	            } else {
	                offset += 2 + dataView.getUint16(offset+2);
	            }

	        }

	    }

	    function findIPTCinJPEG(file) {
	        var dataView = new DataView(file);

	        if (debug) console.log("Got file of length " + file.byteLength);
	        if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
	            if (debug) console.log("Not a valid JPEG");
	            return false; // not a valid jpeg
	        }

	        var offset = 2,
	            length = file.byteLength;


	        var isFieldSegmentStart = function(dataView, offset){
	            return (
	                dataView.getUint8(offset) === 0x38 &&
	                dataView.getUint8(offset+1) === 0x42 &&
	                dataView.getUint8(offset+2) === 0x49 &&
	                dataView.getUint8(offset+3) === 0x4D &&
	                dataView.getUint8(offset+4) === 0x04 &&
	                dataView.getUint8(offset+5) === 0x04
	            );
	        };

	        while (offset < length) {

	            if ( isFieldSegmentStart(dataView, offset )){

	                // Get the length of the name header (which is padded to an even number of bytes)
	                var nameHeaderLength = dataView.getUint8(offset+7);
	                if(nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
	                // Check for pre photoshop 6 format
	                if(nameHeaderLength === 0) {
	                    // Always 4
	                    nameHeaderLength = 4;
	                }

	                var startOffset = offset + 8 + nameHeaderLength;
	                var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

	                return readIPTCData(file, startOffset, sectionLength);

	                break;

	            }


	            // Not the marker, continue searching
	            offset++;

	        }

	    }
	    var IptcFieldMap = {
	        0x78 : 'caption',
	        0x6E : 'credit',
	        0x19 : 'keywords',
	        0x37 : 'dateCreated',
	        0x50 : 'byline',
	        0x55 : 'bylineTitle',
	        0x7A : 'captionWriter',
	        0x69 : 'headline',
	        0x74 : 'copyright',
	        0x0F : 'category'
	    };
	    function readIPTCData(file, startOffset, sectionLength){
	        var dataView = new DataView(file);
	        var data = {};
	        var fieldValue, fieldName, dataSize, segmentType, segmentSize;
	        var segmentStartPos = startOffset;
	        while(segmentStartPos < startOffset+sectionLength) {
	            if(dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos+1) === 0x02){
	                segmentType = dataView.getUint8(segmentStartPos+2);
	                if(segmentType in IptcFieldMap) {
	                    dataSize = dataView.getInt16(segmentStartPos+3);
	                    segmentSize = dataSize + 5;
	                    fieldName = IptcFieldMap[segmentType];
	                    fieldValue = getStringFromDB(dataView, segmentStartPos+5, dataSize);
	                    // Check if we already stored a value with this name
	                    if(data.hasOwnProperty(fieldName)) {
	                        // Value already stored with this name, create multivalue field
	                        if(data[fieldName] instanceof Array) {
	                            data[fieldName].push(fieldValue);
	                        }
	                        else {
	                            data[fieldName] = [data[fieldName], fieldValue];
	                        }
	                    }
	                    else {
	                        data[fieldName] = fieldValue;
	                    }
	                }

	            }
	            segmentStartPos++;
	        }
	        return data;
	    }



	    function readTags(file, tiffStart, dirStart, strings, bigEnd) {
	        var entries = file.getUint16(dirStart, !bigEnd),
	            tags = {},
	            entryOffset, tag,
	            i;

	        for (i=0;i<entries;i++) {
	            entryOffset = dirStart + i*12 + 2;
	            tag = strings[file.getUint16(entryOffset, !bigEnd)];
	            if (!tag && debug) console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd));
	            tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
	        }
	        return tags;
	    }


	    function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
	        var type = file.getUint16(entryOffset+2, !bigEnd),
	            numValues = file.getUint32(entryOffset+4, !bigEnd),
	            valueOffset = file.getUint32(entryOffset+8, !bigEnd) + tiffStart,
	            offset,
	            vals, val, n,
	            numerator, denominator;

	        switch (type) {
	            case 1: // byte, 8-bit unsigned int
	            case 7: // undefined, 8-bit byte, value depending on field
	                if (numValues == 1) {
	                    return file.getUint8(entryOffset + 8, !bigEnd);
	                } else {
	                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
	                    vals = [];
	                    for (n=0;n<numValues;n++) {
	                        vals[n] = file.getUint8(offset + n);
	                    }
	                    return vals;
	                }

	            case 2: // ascii, 8-bit byte
	                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
	                return getStringFromDB(file, offset, numValues-1);

	            case 3: // short, 16 bit int
	                if (numValues == 1) {
	                    return file.getUint16(entryOffset + 8, !bigEnd);
	                } else {
	                    offset = numValues > 2 ? valueOffset : (entryOffset + 8);
	                    vals = [];
	                    for (n=0;n<numValues;n++) {
	                        vals[n] = file.getUint16(offset + 2*n, !bigEnd);
	                    }
	                    return vals;
	                }

	            case 4: // long, 32 bit int
	                if (numValues == 1) {
	                    return file.getUint32(entryOffset + 8, !bigEnd);
	                } else {
	                    vals = [];
	                    for (n=0;n<numValues;n++) {
	                        vals[n] = file.getUint32(valueOffset + 4*n, !bigEnd);
	                    }
	                    return vals;
	                }

	            case 5:    // rational = two long values, first is numerator, second is denominator
	                if (numValues == 1) {
	                    numerator = file.getUint32(valueOffset, !bigEnd);
	                    denominator = file.getUint32(valueOffset+4, !bigEnd);
	                    val = new Number(numerator / denominator);
	                    val.numerator = numerator;
	                    val.denominator = denominator;
	                    return val;
	                } else {
	                    vals = [];
	                    for (n=0;n<numValues;n++) {
	                        numerator = file.getUint32(valueOffset + 8*n, !bigEnd);
	                        denominator = file.getUint32(valueOffset+4 + 8*n, !bigEnd);
	                        vals[n] = new Number(numerator / denominator);
	                        vals[n].numerator = numerator;
	                        vals[n].denominator = denominator;
	                    }
	                    return vals;
	                }

	            case 9: // slong, 32 bit signed int
	                if (numValues == 1) {
	                    return file.getInt32(entryOffset + 8, !bigEnd);
	                } else {
	                    vals = [];
	                    for (n=0;n<numValues;n++) {
	                        vals[n] = file.getInt32(valueOffset + 4*n, !bigEnd);
	                    }
	                    return vals;
	                }

	            case 10: // signed rational, two slongs, first is numerator, second is denominator
	                if (numValues == 1) {
	                    return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset+4, !bigEnd);
	                } else {
	                    vals = [];
	                    for (n=0;n<numValues;n++) {
	                        vals[n] = file.getInt32(valueOffset + 8*n, !bigEnd) / file.getInt32(valueOffset+4 + 8*n, !bigEnd);
	                    }
	                    return vals;
	                }
	        }
	    }

	    function getStringFromDB(buffer, start, length) {
	        var outstr = "";
	        for (n = start; n < start+length; n++) {
	            outstr += String.fromCharCode(buffer.getUint8(n));
	        }
	        return outstr;
	    }

	    function readEXIFData(file, start) {
	        if (getStringFromDB(file, start, 4) != "Exif") {
	            if (debug) console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4));
	            return false;
	        }

	        var bigEnd,
	            tags, tag,
	            exifData, gpsData,
	            tiffOffset = start + 6;

	        // test for TIFF validity and endianness
	        if (file.getUint16(tiffOffset) == 0x4949) {
	            bigEnd = false;
	        } else if (file.getUint16(tiffOffset) == 0x4D4D) {
	            bigEnd = true;
	        } else {
	            if (debug) console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)");
	            return false;
	        }

	        if (file.getUint16(tiffOffset+2, !bigEnd) != 0x002A) {
	            if (debug) console.log("Not valid TIFF data! (no 0x002A)");
	            return false;
	        }

	        var firstIFDOffset = file.getUint32(tiffOffset+4, !bigEnd);

	        if (firstIFDOffset < 0x00000008) {
	            if (debug) console.log("Not valid TIFF data! (First offset less than 8)", file.getUint32(tiffOffset+4, !bigEnd));
	            return false;
	        }

	        tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, TiffTags, bigEnd);

	        if (tags.ExifIFDPointer) {
	            exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
	            for (tag in exifData) {
	                switch (tag) {
	                    case "LightSource" :
	                    case "Flash" :
	                    case "MeteringMode" :
	                    case "ExposureProgram" :
	                    case "SensingMethod" :
	                    case "SceneCaptureType" :
	                    case "SceneType" :
	                    case "CustomRendered" :
	                    case "WhiteBalance" :
	                    case "GainControl" :
	                    case "Contrast" :
	                    case "Saturation" :
	                    case "Sharpness" :
	                    case "SubjectDistanceRange" :
	                    case "FileSource" :
	                        exifData[tag] = StringValues[tag][exifData[tag]];
	                        break;

	                    case "ExifVersion" :
	                    case "FlashpixVersion" :
	                        exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
	                        break;

	                    case "ComponentsConfiguration" :
	                        exifData[tag] =
	                            StringValues.Components[exifData[tag][0]] +
	                            StringValues.Components[exifData[tag][1]] +
	                            StringValues.Components[exifData[tag][2]] +
	                            StringValues.Components[exifData[tag][3]];
	                        break;
	                }
	                tags[tag] = exifData[tag];
	            }
	        }

	        if (tags.GPSInfoIFDPointer) {
	            gpsData = readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, GPSTags, bigEnd);
	            for (tag in gpsData) {
	                switch (tag) {
	                    case "GPSVersionID" :
	                        gpsData[tag] = gpsData[tag][0] +
	                            "." + gpsData[tag][1] +
	                            "." + gpsData[tag][2] +
	                            "." + gpsData[tag][3];
	                        break;
	                }
	                tags[tag] = gpsData[tag];
	            }
	        }

	        return tags;
	    }

	    EXIF.getData = function(img, callback) {
	        if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) return false;

	        if (!imageHasData(img)) {
	            getImageData(img, callback);
	        } else {
	            if (callback) {
	                callback.call(img);
	            }
	        }
	        return true;
	    }

	    EXIF.getTag = function(img, tag) {
	        if (!imageHasData(img)) return;
	        return img.exifdata[tag];
	    }

	    EXIF.getAllTags = function(img) {
	        if (!imageHasData(img)) return {};
	        var a,
	            data = img.exifdata,
	            tags = {};
	        for (a in data) {
	            if (data.hasOwnProperty(a)) {
	                tags[a] = data[a];
	            }
	        }
	        return tags;
	    }

	    EXIF.pretty = function(img) {
	        if (!imageHasData(img)) return "";
	        var a,
	            data = img.exifdata,
	            strPretty = "";
	        for (a in data) {
	            if (data.hasOwnProperty(a)) {
	                if (typeof data[a] == "object") {
	                    if (data[a] instanceof Number) {
	                        strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
	                    } else {
	                        strPretty += a + " : [" + data[a].length + " values]\r\n";
	                    }
	                } else {
	                    strPretty += a + " : " + data[a] + "\r\n";
	                }
	            }
	        }
	        return strPretty;
	    }

	    EXIF.readFromBinaryFile = function(file) {
	        return findEXIFinJPEG(file);
	    }

	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	            return EXIF;
	        }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    }
	}.call(this));



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// This file can be required in Browserify and Node.js for automatic polyfill
	// To use it:  require('es6-promise/auto');
	'use strict';
	module.exports = __webpack_require__(5).polyfill();


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var require;/* WEBPACK VAR INJECTION */(function(process, global) {/*!
	 * @overview es6-promise - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
	 * @version   4.0.5
	 */

	(function (global, factory) {
	     true ? module.exports = factory() :
	    typeof define === 'function' && define.amd ? define(factory) :
	    (global.ES6Promise = factory());
	}(this, (function () { 'use strict';

	function objectOrFunction(x) {
	  return typeof x === 'function' || typeof x === 'object' && x !== null;
	}

	function isFunction(x) {
	  return typeof x === 'function';
	}

	var _isArray = undefined;
	if (!Array.isArray) {
	  _isArray = function (x) {
	    return Object.prototype.toString.call(x) === '[object Array]';
	  };
	} else {
	  _isArray = Array.isArray;
	}

	var isArray = _isArray;

	var len = 0;
	var vertxNext = undefined;
	var customSchedulerFn = undefined;

	var asap = function asap(callback, arg) {
	  queue[len] = callback;
	  queue[len + 1] = arg;
	  len += 2;
	  if (len === 2) {
	    // If len is 2, that means that we need to schedule an async flush.
	    // If additional callbacks are queued before the queue is flushed, they
	    // will be processed by this flush that we are scheduling.
	    if (customSchedulerFn) {
	      customSchedulerFn(flush);
	    } else {
	      scheduleFlush();
	    }
	  }
	};

	function setScheduler(scheduleFn) {
	  customSchedulerFn = scheduleFn;
	}

	function setAsap(asapFn) {
	  asap = asapFn;
	}

	var browserWindow = typeof window !== 'undefined' ? window : undefined;
	var browserGlobal = browserWindow || {};
	var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
	var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

	// test for web worker but not in IE10
	var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

	// node
	function useNextTick() {
	  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
	  // see https://github.com/cujojs/when/issues/410 for details
	  return function () {
	    return process.nextTick(flush);
	  };
	}

	// vertx
	function useVertxTimer() {
	  if (typeof vertxNext !== 'undefined') {
	    return function () {
	      vertxNext(flush);
	    };
	  }

	  return useSetTimeout();
	}

	function useMutationObserver() {
	  var iterations = 0;
	  var observer = new BrowserMutationObserver(flush);
	  var node = document.createTextNode('');
	  observer.observe(node, { characterData: true });

	  return function () {
	    node.data = iterations = ++iterations % 2;
	  };
	}

	// web worker
	function useMessageChannel() {
	  var channel = new MessageChannel();
	  channel.port1.onmessage = flush;
	  return function () {
	    return channel.port2.postMessage(0);
	  };
	}

	function useSetTimeout() {
	  // Store setTimeout reference so es6-promise will be unaffected by
	  // other code modifying setTimeout (like sinon.useFakeTimers())
	  var globalSetTimeout = setTimeout;
	  return function () {
	    return globalSetTimeout(flush, 1);
	  };
	}

	var queue = new Array(1000);
	function flush() {
	  for (var i = 0; i < len; i += 2) {
	    var callback = queue[i];
	    var arg = queue[i + 1];

	    callback(arg);

	    queue[i] = undefined;
	    queue[i + 1] = undefined;
	  }

	  len = 0;
	}

	function attemptVertx() {
	  try {
	    var r = require;
	    var vertx = __webpack_require__(7);
	    vertxNext = vertx.runOnLoop || vertx.runOnContext;
	    return useVertxTimer();
	  } catch (e) {
	    return useSetTimeout();
	  }
	}

	var scheduleFlush = undefined;
	// Decide what async method to use to triggering processing of queued callbacks:
	if (isNode) {
	  scheduleFlush = useNextTick();
	} else if (BrowserMutationObserver) {
	  scheduleFlush = useMutationObserver();
	} else if (isWorker) {
	  scheduleFlush = useMessageChannel();
	} else if (browserWindow === undefined && "function" === 'function') {
	  scheduleFlush = attemptVertx();
	} else {
	  scheduleFlush = useSetTimeout();
	}

	function then(onFulfillment, onRejection) {
	  var _arguments = arguments;

	  var parent = this;

	  var child = new this.constructor(noop);

	  if (child[PROMISE_ID] === undefined) {
	    makePromise(child);
	  }

	  var _state = parent._state;

	  if (_state) {
	    (function () {
	      var callback = _arguments[_state - 1];
	      asap(function () {
	        return invokeCallback(_state, child, callback, parent._result);
	      });
	    })();
	  } else {
	    subscribe(parent, child, onFulfillment, onRejection);
	  }

	  return child;
	}

	/**
	  `Promise.resolve` returns a promise that will become resolved with the
	  passed `value`. It is shorthand for the following:

	  ```javascript
	  let promise = new Promise(function(resolve, reject){
	    resolve(1);
	  });

	  promise.then(function(value){
	    // value === 1
	  });
	  ```

	  Instead of writing the above, your code now simply becomes the following:

	  ```javascript
	  let promise = Promise.resolve(1);

	  promise.then(function(value){
	    // value === 1
	  });
	  ```

	  @method resolve
	  @static
	  @param {Any} value value that the returned promise will be resolved with
	  Useful for tooling.
	  @return {Promise} a promise that will become fulfilled with the given
	  `value`
	*/
	function resolve(object) {
	  /*jshint validthis:true */
	  var Constructor = this;

	  if (object && typeof object === 'object' && object.constructor === Constructor) {
	    return object;
	  }

	  var promise = new Constructor(noop);
	  _resolve(promise, object);
	  return promise;
	}

	var PROMISE_ID = Math.random().toString(36).substring(16);

	function noop() {}

	var PENDING = void 0;
	var FULFILLED = 1;
	var REJECTED = 2;

	var GET_THEN_ERROR = new ErrorObject();

	function selfFulfillment() {
	  return new TypeError("You cannot resolve a promise with itself");
	}

	function cannotReturnOwn() {
	  return new TypeError('A promises callback cannot return that same promise.');
	}

	function getThen(promise) {
	  try {
	    return promise.then;
	  } catch (error) {
	    GET_THEN_ERROR.error = error;
	    return GET_THEN_ERROR;
	  }
	}

	function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	  try {
	    then.call(value, fulfillmentHandler, rejectionHandler);
	  } catch (e) {
	    return e;
	  }
	}

	function handleForeignThenable(promise, thenable, then) {
	  asap(function (promise) {
	    var sealed = false;
	    var error = tryThen(then, thenable, function (value) {
	      if (sealed) {
	        return;
	      }
	      sealed = true;
	      if (thenable !== value) {
	        _resolve(promise, value);
	      } else {
	        fulfill(promise, value);
	      }
	    }, function (reason) {
	      if (sealed) {
	        return;
	      }
	      sealed = true;

	      _reject(promise, reason);
	    }, 'Settle: ' + (promise._label || ' unknown promise'));

	    if (!sealed && error) {
	      sealed = true;
	      _reject(promise, error);
	    }
	  }, promise);
	}

	function handleOwnThenable(promise, thenable) {
	  if (thenable._state === FULFILLED) {
	    fulfill(promise, thenable._result);
	  } else if (thenable._state === REJECTED) {
	    _reject(promise, thenable._result);
	  } else {
	    subscribe(thenable, undefined, function (value) {
	      return _resolve(promise, value);
	    }, function (reason) {
	      return _reject(promise, reason);
	    });
	  }
	}

	function handleMaybeThenable(promise, maybeThenable, then$$) {
	  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
	    handleOwnThenable(promise, maybeThenable);
	  } else {
	    if (then$$ === GET_THEN_ERROR) {
	      _reject(promise, GET_THEN_ERROR.error);
	    } else if (then$$ === undefined) {
	      fulfill(promise, maybeThenable);
	    } else if (isFunction(then$$)) {
	      handleForeignThenable(promise, maybeThenable, then$$);
	    } else {
	      fulfill(promise, maybeThenable);
	    }
	  }
	}

	function _resolve(promise, value) {
	  if (promise === value) {
	    _reject(promise, selfFulfillment());
	  } else if (objectOrFunction(value)) {
	    handleMaybeThenable(promise, value, getThen(value));
	  } else {
	    fulfill(promise, value);
	  }
	}

	function publishRejection(promise) {
	  if (promise._onerror) {
	    promise._onerror(promise._result);
	  }

	  publish(promise);
	}

	function fulfill(promise, value) {
	  if (promise._state !== PENDING) {
	    return;
	  }

	  promise._result = value;
	  promise._state = FULFILLED;

	  if (promise._subscribers.length !== 0) {
	    asap(publish, promise);
	  }
	}

	function _reject(promise, reason) {
	  if (promise._state !== PENDING) {
	    return;
	  }
	  promise._state = REJECTED;
	  promise._result = reason;

	  asap(publishRejection, promise);
	}

	function subscribe(parent, child, onFulfillment, onRejection) {
	  var _subscribers = parent._subscribers;
	  var length = _subscribers.length;

	  parent._onerror = null;

	  _subscribers[length] = child;
	  _subscribers[length + FULFILLED] = onFulfillment;
	  _subscribers[length + REJECTED] = onRejection;

	  if (length === 0 && parent._state) {
	    asap(publish, parent);
	  }
	}

	function publish(promise) {
	  var subscribers = promise._subscribers;
	  var settled = promise._state;

	  if (subscribers.length === 0) {
	    return;
	  }

	  var child = undefined,
	      callback = undefined,
	      detail = promise._result;

	  for (var i = 0; i < subscribers.length; i += 3) {
	    child = subscribers[i];
	    callback = subscribers[i + settled];

	    if (child) {
	      invokeCallback(settled, child, callback, detail);
	    } else {
	      callback(detail);
	    }
	  }

	  promise._subscribers.length = 0;
	}

	function ErrorObject() {
	  this.error = null;
	}

	var TRY_CATCH_ERROR = new ErrorObject();

	function tryCatch(callback, detail) {
	  try {
	    return callback(detail);
	  } catch (e) {
	    TRY_CATCH_ERROR.error = e;
	    return TRY_CATCH_ERROR;
	  }
	}

	function invokeCallback(settled, promise, callback, detail) {
	  var hasCallback = isFunction(callback),
	      value = undefined,
	      error = undefined,
	      succeeded = undefined,
	      failed = undefined;

	  if (hasCallback) {
	    value = tryCatch(callback, detail);

	    if (value === TRY_CATCH_ERROR) {
	      failed = true;
	      error = value.error;
	      value = null;
	    } else {
	      succeeded = true;
	    }

	    if (promise === value) {
	      _reject(promise, cannotReturnOwn());
	      return;
	    }
	  } else {
	    value = detail;
	    succeeded = true;
	  }

	  if (promise._state !== PENDING) {
	    // noop
	  } else if (hasCallback && succeeded) {
	      _resolve(promise, value);
	    } else if (failed) {
	      _reject(promise, error);
	    } else if (settled === FULFILLED) {
	      fulfill(promise, value);
	    } else if (settled === REJECTED) {
	      _reject(promise, value);
	    }
	}

	function initializePromise(promise, resolver) {
	  try {
	    resolver(function resolvePromise(value) {
	      _resolve(promise, value);
	    }, function rejectPromise(reason) {
	      _reject(promise, reason);
	    });
	  } catch (e) {
	    _reject(promise, e);
	  }
	}

	var id = 0;
	function nextId() {
	  return id++;
	}

	function makePromise(promise) {
	  promise[PROMISE_ID] = id++;
	  promise._state = undefined;
	  promise._result = undefined;
	  promise._subscribers = [];
	}

	function Enumerator(Constructor, input) {
	  this._instanceConstructor = Constructor;
	  this.promise = new Constructor(noop);

	  if (!this.promise[PROMISE_ID]) {
	    makePromise(this.promise);
	  }

	  if (isArray(input)) {
	    this._input = input;
	    this.length = input.length;
	    this._remaining = input.length;

	    this._result = new Array(this.length);

	    if (this.length === 0) {
	      fulfill(this.promise, this._result);
	    } else {
	      this.length = this.length || 0;
	      this._enumerate();
	      if (this._remaining === 0) {
	        fulfill(this.promise, this._result);
	      }
	    }
	  } else {
	    _reject(this.promise, validationError());
	  }
	}

	function validationError() {
	  return new Error('Array Methods must be provided an Array');
	};

	Enumerator.prototype._enumerate = function () {
	  var length = this.length;
	  var _input = this._input;

	  for (var i = 0; this._state === PENDING && i < length; i++) {
	    this._eachEntry(_input[i], i);
	  }
	};

	Enumerator.prototype._eachEntry = function (entry, i) {
	  var c = this._instanceConstructor;
	  var resolve$$ = c.resolve;

	  if (resolve$$ === resolve) {
	    var _then = getThen(entry);

	    if (_then === then && entry._state !== PENDING) {
	      this._settledAt(entry._state, i, entry._result);
	    } else if (typeof _then !== 'function') {
	      this._remaining--;
	      this._result[i] = entry;
	    } else if (c === Promise) {
	      var promise = new c(noop);
	      handleMaybeThenable(promise, entry, _then);
	      this._willSettleAt(promise, i);
	    } else {
	      this._willSettleAt(new c(function (resolve$$) {
	        return resolve$$(entry);
	      }), i);
	    }
	  } else {
	    this._willSettleAt(resolve$$(entry), i);
	  }
	};

	Enumerator.prototype._settledAt = function (state, i, value) {
	  var promise = this.promise;

	  if (promise._state === PENDING) {
	    this._remaining--;

	    if (state === REJECTED) {
	      _reject(promise, value);
	    } else {
	      this._result[i] = value;
	    }
	  }

	  if (this._remaining === 0) {
	    fulfill(promise, this._result);
	  }
	};

	Enumerator.prototype._willSettleAt = function (promise, i) {
	  var enumerator = this;

	  subscribe(promise, undefined, function (value) {
	    return enumerator._settledAt(FULFILLED, i, value);
	  }, function (reason) {
	    return enumerator._settledAt(REJECTED, i, reason);
	  });
	};

	/**
	  `Promise.all` accepts an array of promises, and returns a new promise which
	  is fulfilled with an array of fulfillment values for the passed promises, or
	  rejected with the reason of the first passed promise to be rejected. It casts all
	  elements of the passed iterable to promises as it runs this algorithm.

	  Example:

	  ```javascript
	  let promise1 = resolve(1);
	  let promise2 = resolve(2);
	  let promise3 = resolve(3);
	  let promises = [ promise1, promise2, promise3 ];

	  Promise.all(promises).then(function(array){
	    // The array here would be [ 1, 2, 3 ];
	  });
	  ```

	  If any of the `promises` given to `all` are rejected, the first promise
	  that is rejected will be given as an argument to the returned promises's
	  rejection handler. For example:

	  Example:

	  ```javascript
	  let promise1 = resolve(1);
	  let promise2 = reject(new Error("2"));
	  let promise3 = reject(new Error("3"));
	  let promises = [ promise1, promise2, promise3 ];

	  Promise.all(promises).then(function(array){
	    // Code here never runs because there are rejected promises!
	  }, function(error) {
	    // error.message === "2"
	  });
	  ```

	  @method all
	  @static
	  @param {Array} entries array of promises
	  @param {String} label optional string for labeling the promise.
	  Useful for tooling.
	  @return {Promise} promise that is fulfilled when all `promises` have been
	  fulfilled, or rejected if any of them become rejected.
	  @static
	*/
	function all(entries) {
	  return new Enumerator(this, entries).promise;
	}

	/**
	  `Promise.race` returns a new promise which is settled in the same way as the
	  first passed promise to settle.

	  Example:

	  ```javascript
	  let promise1 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      resolve('promise 1');
	    }, 200);
	  });

	  let promise2 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      resolve('promise 2');
	    }, 100);
	  });

	  Promise.race([promise1, promise2]).then(function(result){
	    // result === 'promise 2' because it was resolved before promise1
	    // was resolved.
	  });
	  ```

	  `Promise.race` is deterministic in that only the state of the first
	  settled promise matters. For example, even if other promises given to the
	  `promises` array argument are resolved, but the first settled promise has
	  become rejected before the other promises became fulfilled, the returned
	  promise will become rejected:

	  ```javascript
	  let promise1 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      resolve('promise 1');
	    }, 200);
	  });

	  let promise2 = new Promise(function(resolve, reject){
	    setTimeout(function(){
	      reject(new Error('promise 2'));
	    }, 100);
	  });

	  Promise.race([promise1, promise2]).then(function(result){
	    // Code here never runs
	  }, function(reason){
	    // reason.message === 'promise 2' because promise 2 became rejected before
	    // promise 1 became fulfilled
	  });
	  ```

	  An example real-world use case is implementing timeouts:

	  ```javascript
	  Promise.race([ajax('foo.json'), timeout(5000)])
	  ```

	  @method race
	  @static
	  @param {Array} promises array of promises to observe
	  Useful for tooling.
	  @return {Promise} a promise which settles in the same way as the first passed
	  promise to settle.
	*/
	function race(entries) {
	  /*jshint validthis:true */
	  var Constructor = this;

	  if (!isArray(entries)) {
	    return new Constructor(function (_, reject) {
	      return reject(new TypeError('You must pass an array to race.'));
	    });
	  } else {
	    return new Constructor(function (resolve, reject) {
	      var length = entries.length;
	      for (var i = 0; i < length; i++) {
	        Constructor.resolve(entries[i]).then(resolve, reject);
	      }
	    });
	  }
	}

	/**
	  `Promise.reject` returns a promise rejected with the passed `reason`.
	  It is shorthand for the following:

	  ```javascript
	  let promise = new Promise(function(resolve, reject){
	    reject(new Error('WHOOPS'));
	  });

	  promise.then(function(value){
	    // Code here doesn't run because the promise is rejected!
	  }, function(reason){
	    // reason.message === 'WHOOPS'
	  });
	  ```

	  Instead of writing the above, your code now simply becomes the following:

	  ```javascript
	  let promise = Promise.reject(new Error('WHOOPS'));

	  promise.then(function(value){
	    // Code here doesn't run because the promise is rejected!
	  }, function(reason){
	    // reason.message === 'WHOOPS'
	  });
	  ```

	  @method reject
	  @static
	  @param {Any} reason value that the returned promise will be rejected with.
	  Useful for tooling.
	  @return {Promise} a promise rejected with the given `reason`.
	*/
	function reject(reason) {
	  /*jshint validthis:true */
	  var Constructor = this;
	  var promise = new Constructor(noop);
	  _reject(promise, reason);
	  return promise;
	}

	function needsResolver() {
	  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	}

	function needsNew() {
	  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	}

	/**
	  Promise objects represent the eventual result of an asynchronous operation. The
	  primary way of interacting with a promise is through its `then` method, which
	  registers callbacks to receive either a promise's eventual value or the reason
	  why the promise cannot be fulfilled.

	  Terminology
	  -----------

	  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
	  - `thenable` is an object or function that defines a `then` method.
	  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
	  - `exception` is a value that is thrown using the throw statement.
	  - `reason` is a value that indicates why a promise was rejected.
	  - `settled` the final resting state of a promise, fulfilled or rejected.

	  A promise can be in one of three states: pending, fulfilled, or rejected.

	  Promises that are fulfilled have a fulfillment value and are in the fulfilled
	  state.  Promises that are rejected have a rejection reason and are in the
	  rejected state.  A fulfillment value is never a thenable.

	  Promises can also be said to *resolve* a value.  If this value is also a
	  promise, then the original promise's settled state will match the value's
	  settled state.  So a promise that *resolves* a promise that rejects will
	  itself reject, and a promise that *resolves* a promise that fulfills will
	  itself fulfill.


	  Basic Usage:
	  ------------

	  ```js
	  let promise = new Promise(function(resolve, reject) {
	    // on success
	    resolve(value);

	    // on failure
	    reject(reason);
	  });

	  promise.then(function(value) {
	    // on fulfillment
	  }, function(reason) {
	    // on rejection
	  });
	  ```

	  Advanced Usage:
	  ---------------

	  Promises shine when abstracting away asynchronous interactions such as
	  `XMLHttpRequest`s.

	  ```js
	  function getJSON(url) {
	    return new Promise(function(resolve, reject){
	      let xhr = new XMLHttpRequest();

	      xhr.open('GET', url);
	      xhr.onreadystatechange = handler;
	      xhr.responseType = 'json';
	      xhr.setRequestHeader('Accept', 'application/json');
	      xhr.send();

	      function handler() {
	        if (this.readyState === this.DONE) {
	          if (this.status === 200) {
	            resolve(this.response);
	          } else {
	            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
	          }
	        }
	      };
	    });
	  }

	  getJSON('/posts.json').then(function(json) {
	    // on fulfillment
	  }, function(reason) {
	    // on rejection
	  });
	  ```

	  Unlike callbacks, promises are great composable primitives.

	  ```js
	  Promise.all([
	    getJSON('/posts'),
	    getJSON('/comments')
	  ]).then(function(values){
	    values[0] // => postsJSON
	    values[1] // => commentsJSON

	    return values;
	  });
	  ```

	  @class Promise
	  @param {function} resolver
	  Useful for tooling.
	  @constructor
	*/
	function Promise(resolver) {
	  this[PROMISE_ID] = nextId();
	  this._result = this._state = undefined;
	  this._subscribers = [];

	  if (noop !== resolver) {
	    typeof resolver !== 'function' && needsResolver();
	    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
	  }
	}

	Promise.all = all;
	Promise.race = race;
	Promise.resolve = resolve;
	Promise.reject = reject;
	Promise._setScheduler = setScheduler;
	Promise._setAsap = setAsap;
	Promise._asap = asap;

	Promise.prototype = {
	  constructor: Promise,

	  /**
	    The primary way of interacting with a promise is through its `then` method,
	    which registers callbacks to receive either a promise's eventual value or the
	    reason why the promise cannot be fulfilled.
	  
	    ```js
	    findUser().then(function(user){
	      // user is available
	    }, function(reason){
	      // user is unavailable, and you are given the reason why
	    });
	    ```
	  
	    Chaining
	    --------
	  
	    The return value of `then` is itself a promise.  This second, 'downstream'
	    promise is resolved with the return value of the first promise's fulfillment
	    or rejection handler, or rejected if the handler throws an exception.
	  
	    ```js
	    findUser().then(function (user) {
	      return user.name;
	    }, function (reason) {
	      return 'default name';
	    }).then(function (userName) {
	      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	      // will be `'default name'`
	    });
	  
	    findUser().then(function (user) {
	      throw new Error('Found user, but still unhappy');
	    }, function (reason) {
	      throw new Error('`findUser` rejected and we're unhappy');
	    }).then(function (value) {
	      // never reached
	    }, function (reason) {
	      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	    });
	    ```
	    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
	  
	    ```js
	    findUser().then(function (user) {
	      throw new PedagogicalException('Upstream error');
	    }).then(function (value) {
	      // never reached
	    }).then(function (value) {
	      // never reached
	    }, function (reason) {
	      // The `PedgagocialException` is propagated all the way down to here
	    });
	    ```
	  
	    Assimilation
	    ------------
	  
	    Sometimes the value you want to propagate to a downstream promise can only be
	    retrieved asynchronously. This can be achieved by returning a promise in the
	    fulfillment or rejection handler. The downstream promise will then be pending
	    until the returned promise is settled. This is called *assimilation*.
	  
	    ```js
	    findUser().then(function (user) {
	      return findCommentsByAuthor(user);
	    }).then(function (comments) {
	      // The user's comments are now available
	    });
	    ```
	  
	    If the assimliated promise rejects, then the downstream promise will also reject.
	  
	    ```js
	    findUser().then(function (user) {
	      return findCommentsByAuthor(user);
	    }).then(function (comments) {
	      // If `findCommentsByAuthor` fulfills, we'll have the value here
	    }, function (reason) {
	      // If `findCommentsByAuthor` rejects, we'll have the reason here
	    });
	    ```
	  
	    Simple Example
	    --------------
	  
	    Synchronous Example
	  
	    ```javascript
	    let result;
	  
	    try {
	      result = findResult();
	      // success
	    } catch(reason) {
	      // failure
	    }
	    ```
	  
	    Errback Example
	  
	    ```js
	    findResult(function(result, err){
	      if (err) {
	        // failure
	      } else {
	        // success
	      }
	    });
	    ```
	  
	    Promise Example;
	  
	    ```javascript
	    findResult().then(function(result){
	      // success
	    }, function(reason){
	      // failure
	    });
	    ```
	  
	    Advanced Example
	    --------------
	  
	    Synchronous Example
	  
	    ```javascript
	    let author, books;
	  
	    try {
	      author = findAuthor();
	      books  = findBooksByAuthor(author);
	      // success
	    } catch(reason) {
	      // failure
	    }
	    ```
	  
	    Errback Example
	  
	    ```js
	  
	    function foundBooks(books) {
	  
	    }
	  
	    function failure(reason) {
	  
	    }
	  
	    findAuthor(function(author, err){
	      if (err) {
	        failure(err);
	        // failure
	      } else {
	        try {
	          findBoooksByAuthor(author, function(books, err) {
	            if (err) {
	              failure(err);
	            } else {
	              try {
	                foundBooks(books);
	              } catch(reason) {
	                failure(reason);
	              }
	            }
	          });
	        } catch(error) {
	          failure(err);
	        }
	        // success
	      }
	    });
	    ```
	  
	    Promise Example;
	  
	    ```javascript
	    findAuthor().
	      then(findBooksByAuthor).
	      then(function(books){
	        // found books
	    }).catch(function(reason){
	      // something went wrong
	    });
	    ```
	  
	    @method then
	    @param {Function} onFulfilled
	    @param {Function} onRejected
	    Useful for tooling.
	    @return {Promise}
	  */
	  then: then,

	  /**
	    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	    as the catch block of a try/catch statement.
	  
	    ```js
	    function findAuthor(){
	      throw new Error('couldn't find that author');
	    }
	  
	    // synchronous
	    try {
	      findAuthor();
	    } catch(reason) {
	      // something went wrong
	    }
	  
	    // async with promises
	    findAuthor().catch(function(reason){
	      // something went wrong
	    });
	    ```
	  
	    @method catch
	    @param {Function} onRejection
	    Useful for tooling.
	    @return {Promise}
	  */
	  'catch': function _catch(onRejection) {
	    return this.then(null, onRejection);
	  }
	};

	function polyfill() {
	    var local = undefined;

	    if (typeof global !== 'undefined') {
	        local = global;
	    } else if (typeof self !== 'undefined') {
	        local = self;
	    } else {
	        try {
	            local = Function('return this')();
	        } catch (e) {
	            throw new Error('polyfill failed because global object is unavailable in this environment');
	        }
	    }

	    var P = local.Promise;

	    if (P) {
	        var promiseToString = null;
	        try {
	            promiseToString = Object.prototype.toString.call(P.resolve());
	        } catch (e) {
	            // silently ignored
	        }

	        if (promiseToString === '[object Promise]' && !P.cast) {
	            return;
	        }
	    }

	    local.Promise = Promise;
	}

	// Strange compat..
	Promise.polyfill = polyfill;
	Promise.Promise = Promise;

	return Promise;

	})));
	//# sourceMappingURL=es6-promise.map
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), (function() { return this; }())))

/***/ },
/* 6 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 7 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ }
/******/ ]);