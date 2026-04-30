// ============================================
// QRScanPro - QR Code Generator Engine
// Uses qrcode.js library
// ============================================

var QRGenerator = (function () {

  var currentQR = null;
  var currentCanvas = null;

  // ---- Build QR Data String from type + fields ----
  function buildQRData(type, fields) {
    switch (type) {
      case 'url':
        var url = fields.url || '';
        if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
        return url;
      case 'text':
        return fields.text || '';
      case 'wifi':
        var ssid = (fields.ssid || '').replace(/([\\;,":])/, '\\$1');
        var pass = (fields.password || '').replace(/([\\;,":])/, '\\$1');
        var sec = fields.security || 'WPA';
        var hidden = fields.hidden ? 'true' : 'false';
        return 'WIFI:T:' + sec + ';S:' + ssid + ';P:' + pass + ';H:' + hidden + ';;';
      case 'vcard':
        return 'BEGIN:VCARD\nVERSION:3.0\nFN:' + (fields.name || '') +
          '\nORG:' + (fields.org || '') +
          '\nTEL:' + (fields.phone || '') +
          '\nEMAIL:' + (fields.email || '') +
          '\nURL:' + (fields.website || '') +
          '\nEND:VCARD';
      case 'email':
        return 'mailto:' + (fields.email || '') + '?subject=' + encodeURIComponent(fields.subject || '') + '&body=' + encodeURIComponent(fields.body || '');
      case 'sms':
        return 'smsto:' + (fields.phone || '') + ':' + (fields.message || '');
      case 'phone':
        return 'tel:' + (fields.phone || '');
      case 'location':
        return 'geo:' + (fields.lat || '0') + ',' + (fields.lng || '0');
      case 'event':
        return 'BEGIN:VEVENT\nSUMMARY:' + (fields.title || '') +
          '\nLOCATION:' + (fields.location || '') +
          '\nDTSTART:' + (fields.start || '') +
          '\nDTEND:' + (fields.end || '') +
          '\nEND:VEVENT';
      default:
        return fields.text || '';
    }
  }

  // ---- Generate QR to Canvas ----
  function generate(opts, callback) {
    var data = opts.data;
    var size = opts.size || 280;
    var darkColor = opts.darkColor || '#000000';
    var lightColor = opts.lightColor || '#ffffff';
    var errorLevel = opts.errorLevel || 'M';
    var logoUrl = opts.logoUrl || null;

    if (!data) { if (callback) callback(null, 'No data to encode'); return; }

    var container = opts.container;
    if (!container) { if (callback) callback(null, 'No container'); return; }

    container.innerHTML = '';
    var canvas = document.createElement('canvas');
    canvas.id = 'qr-canvas';
    container.appendChild(canvas);
    currentCanvas = canvas;

    if (typeof QRCode === 'undefined') {
      if (callback) callback(null, 'QR library not loaded');
      return;
    }

    try {
      QRCode.toCanvas(canvas, data, {
        width: size,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: errorLevel
      }, function (err) {
        if (err) { if (callback) callback(null, err.message); return; }
        currentQR = { data: data, canvas: canvas };
        if (logoUrl) {
          addLogo(canvas, logoUrl, size, function () {
            if (callback) callback(canvas, null);
          });
        } else {
          if (callback) callback(canvas, null);
        }
      });
    } catch (e) {
      if (callback) callback(null, e.message);
    }
  }

  // ---- Add Logo overlay to QR canvas ----
  function addLogo(canvas, logoUrl, size, callback) {
    var ctx = canvas.getContext('2d');
    var logoSize = Math.floor(size * 0.22);
    var x = Math.floor((size - logoSize) / 2);
    var y = Math.floor((size - logoSize) / 2);

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      // White background circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, logoSize / 2 + 6, 0, Math.PI * 2);
      ctx.fill();
      // Draw logo
      ctx.drawImage(img, x, y, logoSize, logoSize);
      callback();
    };
    img.onerror = function () { callback(); };
    img.src = logoUrl;
  }

  // ---- Download QR ----
  function download(format, filename) {
    if (!currentCanvas) { showToast('Generate a QR code first', 'error'); return; }
    filename = filename || 'qrcode';

    if (format === 'png') {
      var link = document.createElement('a');
      link.download = filename + '.png';
      link.href = currentCanvas.toDataURL('image/png');
      link.click();
    } else if (format === 'svg') {
      var data = currentCanvas._qrData || '';
      if (!data && currentQR) data = currentQR.data;
      downloadSVG(data, filename);
    } else if (format === 'jpg') {
      var link2 = document.createElement('a');
      link2.download = filename + '.jpg';
      // White background
      var c2 = document.createElement('canvas');
      c2.width = currentCanvas.width;
      c2.height = currentCanvas.height;
      var ctx2 = c2.getContext('2d');
      ctx2.fillStyle = '#ffffff';
      ctx2.fillRect(0, 0, c2.width, c2.height);
      ctx2.drawImage(currentCanvas, 0, 0);
      link2.href = c2.toDataURL('image/jpeg', 0.95);
      link2.click();
    }
  }

  function downloadSVG(data, filename) {
    if (typeof QRCode === 'undefined') return;
    QRCode.toString(data, { type: 'svg', width: 280, margin: 2 }, function (err, svg) {
      if (err) return;
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.download = (filename || 'qrcode') + '.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // ---- Get canvas as Data URL ----
  function getDataURL() {
    if (!currentCanvas) return null;
    return currentCanvas.toDataURL('image/png');
  }

  return {
    buildQRData: buildQRData,
    generate: generate,
    download: download,
    getDataURL: getDataURL
  };

})();
