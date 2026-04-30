// ============================================
// QRScanPro - QR & Barcode Scanner Engine
// Uses ZXing-js for real scanning
// ============================================

/* global ZXing */

var QRScanner = (function () {

  var stream = null;
  var scanning = false;
  var codeReader = null;

  // ---- Initialize ZXing reader ----
  function getReader(formats) {
    if (typeof ZXing === 'undefined') { return null; }
    try {
      var hints = new Map();
      if (formats && formats.length) {
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
      }
      return new ZXing.BrowserMultiFormatReader(hints);
    } catch (e) { return null; }
  }

  // ---- Scan from image file ----
  function scanImageFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      scanImageUrl(e.target.result, callback);
    };
    reader.onerror = function () { callback(null, 'Failed to read file'); };
    reader.readAsDataURL(file);
  }

  function scanImageUrl(dataUrl, callback) {
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      decodeImageData(imageData, canvas.width, canvas.height, callback);
    };
    img.onerror = function () { callback(null, 'Invalid image'); };
    img.src = dataUrl;
  }

  function decodeImageData(imageData, width, height, callback) {
    if (typeof ZXing === 'undefined') {
      // Fallback: try jsQR if available
      if (typeof jsQR !== 'undefined') {
        var result = jsQR(imageData.data, width, height);
        if (result) { callback(result.data, null); }
        else { callback(null, 'No QR code detected in image. Please ensure the image contains a clear, unobstructed QR code.'); }
      } else {
        callback(null, 'Scanner library not loaded. Please check your internet connection and try again.');
      }
      return;
    }
    try {
      var luminanceSource = new ZXing.RGBLuminanceSource(imageData.data, width, height);
      var binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
      var reader = new ZXing.MultiFormatReader();
      try {
        var result = reader.decode(binaryBitmap);
        callback(result.getText(), null, result.getBarcodeFormat ? result.getBarcodeFormat().toString() : null);
      } catch (notFound) {
        // Try with pure binarizer
        try {
          var bb2 = new ZXing.BinaryBitmap(new ZXing.GlobalHistogramBinarizer(luminanceSource));
          var r2 = reader.decode(bb2);
          callback(r2.getText(), null, r2.getBarcodeFormat ? r2.getBarcodeFormat().toString() : null);
        } catch (e2) {
          callback(null, 'No QR code or barcode detected. Try a clearer image with better lighting.');
        }
      }
    } catch (e) {
      callback(null, 'Scanner error: ' + e.message);
    }
  }

  // ---- Webcam scanning ----
  function startWebcam(videoEl, callback, onStart, onError) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError('Camera not supported in this browser. Please use Chrome, Firefox, or Safari.');
      return;
    }
    scanning = true;
    if (typeof ZXing !== 'undefined') {
      codeReader = new ZXing.BrowserMultiFormatReader();
      codeReader.listVideoInputDevices().then(function (devices) {
        var deviceId = devices.length > 1 ? devices[1].deviceId : (devices[0] ? devices[0].deviceId : undefined);
        codeReader.decodeFromVideoDevice(deviceId, videoEl, function (result, err) {
          if (!scanning) return;
          if (result) { callback(result.getText(), null, result.getBarcodeFormat ? result.getBarcodeFormat().toString() : null); }
        });
        if (onStart) onStart();
      }).catch(function (err) {
        startNativeCamera(videoEl, callback, onStart, onError);
      });
    } else {
      startNativeCamera(videoEl, callback, onStart, onError);
    }
  }

  function startNativeCamera(videoEl, callback, onStart, onError) {
    var constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };
    navigator.mediaDevices.getUserMedia(constraints).then(function (s) {
      stream = s;
      videoEl.srcObject = s;
      videoEl.setAttribute('playsinline', true);
      videoEl.play();
      if (onStart) onStart();
      // Polling scan with jsQR
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var interval = setInterval(function () {
        if (!scanning) { clearInterval(interval); return; }
        if (videoEl.readyState < 2) return;
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (typeof jsQR !== 'undefined') {
          var result = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
          if (result) { callback(result.data, null, 'QR_CODE'); }
        }
      }, 300);
    }).catch(function (err) {
      if (err.name === 'NotAllowedError') onError('Camera permission denied. Please allow camera access in your browser settings.');
      else if (err.name === 'NotFoundError') onError('No camera found on this device.');
      else onError('Camera error: ' + err.message);
    });
  }

  function stopWebcam() {
    scanning = false;
    if (codeReader) { try { codeReader.reset(); } catch (e) {} codeReader = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  }

  // ---- Parse WiFi QR ----
  function parseWifiQR(text) {
    var data = { ssid: '', password: '', security: '', hidden: false };
    if (!text || !text.startsWith('WIFI:')) return null;
    var body = text.slice(5);
    var parts = body.replace(/;;$/, '').split(';');
    parts.forEach(function (part) {
      if (part.startsWith('S:')) data.ssid = part.slice(2);
      else if (part.startsWith('P:')) data.password = part.slice(2);
      else if (part.startsWith('T:')) data.security = part.slice(2);
      else if (part.startsWith('H:')) data.hidden = part.slice(2).toLowerCase() === 'true';
    });
    return data;
  }

  return {
    scanImageFile: scanImageFile,
    scanImageUrl: scanImageUrl,
    startWebcam: startWebcam,
    stopWebcam: stopWebcam,
    parseWifiQR: parseWifiQR,
    detectQRType: function (text) {
      return typeof detectQRType !== 'undefined' ? detectQRType(text) : { type: 'Unknown', icon: '❓' };
    }
  };
})();
