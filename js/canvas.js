/*
 * 大学生のための雷
 *
 * Created by Ryo Murakami
 * Updated by Yusuke Miyazaki
 */

var ikazuchi = ikazuchi || {};

ikazuchi.namespace = function(ns) {
  var parts = ns.split('.');
  var par = ikazuchi;
  var i;

  if (parts[0] === "ikazuchi") {
    parts = parts.slice(1);
  }

  for (i = 0; i < parts.length; i++) {
    if (typeof par[parts[i]] === 'undefined') {
      par[parts[i]] = {};
    }
    par = par[parts[i]];
  }

  return par;
}

// フォーム関係の処理
ikazuchi.namespace('ikazuchi.form');
ikazuchi.form = (function() {
  var bg_image = null;

  var bgColorChanged = function() {
    if ($('#form_bg_color').val() === '#') {
      $('.form_bg_color_custom').show();
    } else {
      $('.form_bg_color_custom').hide();
    }
  };

  var sizeChanged = function() {
    if ($('#form_size').val() === '0,0') {
      $('.form_size_custom').show();
    } else {
      $('.form_size_custom').hide();
    }
  };
  
  var bgColor = function() {
    if ($('#form_bg_color').val() === '#') {
      return $('#form_bg_color_custom').val();
    } else {
      return $('#form_bg_color').val();
    }
  };

  var bgImage = function() {
    return bg_image;
  };

  var fontFont = function() {
    return $('#form_font_font').val();
  };

  var fontColor = function() {
    return $('#form_font_color').val();
  };

  var fontSize = function() {
    return parseInt($('#form_font_size').val());
  };

  var fontPosition = function() {
    var value = $('#form_font_position').val().split(',');
    var x = parseInt(value[0]);
    var y = parseInt(value[1]);
    if (x == NaN) x = 0;
    if (y == NaN) y = 0;

    return [x, y];
  };

  var imageSize = function() {
    var value = $('#form_size').val().split(',');
    var width = parseInt(value[0]);
    var height = parseInt(value[1]);
    if ((width == 0) && (height == 0)) {
      return [parseInt($('#form_size_w').val()), parseInt($('#form_size_h').val())];
    } else {
      return [value[0], value[1]];
    }
  };

  var text = function() {
    return $('#form_text').val();
  };

  /*
   * 画像の読み込みを行う
   */
  var loadFile = function(event) {
    var files = event.target.files; // FileList object
    var f = files[0];
    
    // 画像ファイル以外は処理しない
    if (!f.type.match('image.*')) {
      return;
    }

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(file) {
      return function(e) {
        $('#thumbnail_list').empty();
        $('<img>', {
          'class': 'thumb',
          src: e.target.result,
          title: escape(file.name)
        }).appendTo('#thumbnail_list');
        bg_image = e.target.result;
      };
    }(f));

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }

  var generate = function(event) {
    event.preventDefault();
    var canvas = ikazuchi.generator.generate(text(), bgColor(), imageSize(),
                                             fontFont(), fontColor(), fontSize(), fontPosition(),
                                             bgImage());
    $('#wallpapers').empty();
    $('#wallpapers').append(canvas);
    var u = canvas[0].toDataURL("image/png").replace("image/png", "image/octet-stream");
    $('<a>', {
      html: 'Download',
      download: 'a.png'
    }).click(function() {
      window.location.href = u;
    }).appendTo($('#wallpapers'));
  }

  var generate_all = function(event) {
    event.preventDefault();
    var colors = [
      "#477568",
      "#345488",
      "#d7cfef",
      "#cadaeb",
      "#657185",
      "#c69599"
    ];
    $('#wallpapers').empty();
    for (var i = 0; i < colors.length; i++) {
      var canvas = ikazuchi.generator.generate(text(), colors[i], imageSize(), fontFont(),
                                               fontColor(), fontSize(), fontPosition(), bgImage());
      $('#wallpapers').append(canvas);
    }
  }

  var ready = function() {
    $('#form_bg_img').change(loadFile);
    $('#form_size').change(sizeChanged);
    $('#form_bg_color').change(bgColorChanged);
    sizeChanged();
    bgColorChanged();
    $('#form_generate').click(generate);
    $('#form_generate_all').click(generate_all);
  };

  return {
    ready: ready
  }
}());

ikazuchi.namespace('ikazuchi.generator');
ikazuchi.generator = (function() {
  var generate = function(text, bgcolor, size, fontFont, fontcolor, fontsize, fontPosition, image) {
    var width = size[0];
    var height = size[1];
     
    // canvas要素のノードオブジェクト
    var canvas = $('<canvas>', {
      style: 'max-width: 100%'
    });

    if (!canvas || !canvas[0].getContext) {
      return false;
    }
    
    // 2Dコンテキスト
    var context = canvas[0].getContext('2d');

    // Canvas をリサイズ
    context.canvas.width = width;
    context.canvas.height = height;

    // 塗りつぶし
    context.fillStyle = bgcolor;
    context.fillRect(0, 0, width, height);

    if (image != null) {
      var img = new Image();
      img.src = image;
       
      //TODO
      //画像のリサイズをしたい
      //そのままやるとギザギザになるらしいので外部ライブラリを使ったほうがいいかも

      img.onload = function() {
        context.drawImage(img, 0, height - img.height);   //左下

        //グレースケール変換
        var imageData = context.getImageData(0, height - img.height, img.width, img.height);
        var pixel = imageData.data;
        grayscale(pixel, bgcolor);
        context.putImageData(imageData, 0, height-imageData.height, 0, 0, imageData.width, imageData.height);
      }
    }

    //文字の描画
    drawString(context, text, fontPosition[0], fontPosition[1], fontFont, fontsize, fontcolor);
    return canvas;
  };

  var drawString = function(context, text, posx, posy, fontFont, fontSize, fontColor) {
    //文字の描画
    context.fillStyle = fontColor;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.font = fontSize + "px '" + fontFont + "'";
    var lines = text.split('\n');
    for(var i = 0; i < lines.length; i++){
      context.fillText(lines[i], posx, posy);
      posy += parseInt(fontSize);
    }
  };

  /*
   * @param pixel ピクセルデータ (rgbaの並び）
   * @param color カラーコード (#XXXXXXの形）
   */
  var grayscale = function(pixel, color) {
    if (typeof color === 'undefined') color = '#ffffff';

    var r_bg = parseInt('0x'+color.substr(1,2));
    var g_bg = parseInt('0x'+color.substr(3,2));
    var b_bg = parseInt('0x'+color.substr(5,2));

    for (var i = 0; i < pixel.length; i += 4) {
      if (i % 4 != 3) {
        // Get the RGB values.
        var red = pixel[i];
        var green = pixel[i + 1];
        var blue = pixel[i + 2];

        //グレースケールに変換 (e.g. you could try a simple average (red+green+blue)/3)
        var grayScale = (red * 0.3) + (green * 0.59) + (blue * .11);
        pixel[i] = grayScale/0xff * r_bg;
        pixel[i + 1] = grayScale/0xff * g_bg;
        pixel[i + 2] = grayScale/0xff * b_bg;
      }
    }
  }

  return {
    generate: generate
  }
}());


$(document).ready(function() {
  ikazuchi.form.ready();
});
