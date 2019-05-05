<?php
  header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
  header("Cache-Control: post-check=0, pre-check=0", false);
  header("Pragma: no-cache");
?>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <!-- Primary Meta Tags -->
        <title>osu!WebMania</title>
        <meta name="title" content="osu!WebMania">
        <meta name="description" content="osu!mania in your brower ya filthy fuckin' weebs.">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="http://aliremu.tk/webmania">
        <meta property="og:title" content="osu!WebMania">
        <meta property="og:description" content="osu!mania in your brower ya filthy fuckin' weebs.">
        <meta property="og:image" content="thumb.png">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="http://aliremu.tk/webmania">
        <meta property="twitter:title" content="osu!WebMania">
        <meta property="twitter:description" content="osu!mania in your brower ya filthy fuckin' weebs.">
        <meta property="twitter:image" content="thumb.png">

        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
        <meta http-equiv="Pragma" content="no-cache">
        <meta http-equiv="Expires" content="0">
        <link rel="stylesheet" href="./assets/style.css" />
    </head>

    <body>
        <div id="load">
          <img id="start" src="logo.svg" />
        </div>
        <div id="menu">
          <input type="file" id="beatmap">
          <select id="difficulty">
          </select>
          <input type="button" id="play">
          <br>
          Scroll Speed: <input type="number" id="scroll" value="16">
          <br>
          Playback Speed: <input type="number" id="speed" value="1">
          <div id="songs">
          </div>
        </div>
        <div id="game">
          <canvas id="game-surface" width="0" height="0">
              Your browser does not support HTML5
          </canvas>
          <div id="coords">
            <p id="time" style="visibility: hidden;"></p>
          </div>
          <span id="combo" style="visibility: hidden;"></span>
          <div id="info">
            <span id="score" style="visibility: hidden;">0000000</span>
            <span id="acc" style="visibility: hidden;">100.00</span>
          </div>
        </div>
        <!--<i>Demo is above this text</i>-->
        <script id="play-vertex-shader" type="shader">
            precision mediump float;

            vec4 localPosition;

            attribute vec2 vertPosition;
            attribute vec2 vertTexCoord;

            uniform vec2 offset;
            uniform vec2 size;
            uniform vec2 texCoordScale;

            varying vec2 texCoord;

            uniform mat4 projectionMatrix;

            void main() {
              texCoord = vertTexCoord;

              gl_Position = projectionMatrix * vec4(vertPosition * size + offset, 1.0, 1.0);
            }
        </script>

        <script id="play-fragment-shader" type="shader">
            precision mediump float;
            varying vec2 texCoord;

            uniform sampler2D sampler;

            void main() {
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * texture2D(sampler, texCoord);
            }
        </script>

        <script id="background-vertex-shader" type="shader">
            precision mediump float;

            vec4 localPosition;

            attribute vec2 vertPosition;
            attribute vec2 vertTexCoord;

            uniform vec2 screen;
            uniform vec2 texCoordScale;

            varying vec2 texCoord;

            uniform mat4 projectionMatrix;

            void main() {
              texCoord = vertTexCoord;

              gl_Position = projectionMatrix * vec4(vertPosition * screen, 1.0, 1.0);
            }
        </script>

        <script id="background-fragment-shader" type="shader">
            precision mediump float;
            varying vec2 texCoord;

            uniform sampler2D sampler;

            void main() {
              gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0) * texture2D(sampler, texCoord);
            }
        </script>

        <script id="score-vertex-shader" type="shader">
            precision mediump float;

            vec4 localPosition;

            attribute vec2 vertPosition;
            attribute vec2 vertTexCoord;

            uniform vec2 offset;
            uniform vec2 texCoordScale;
            uniform mat4 transformMatrix;

            varying vec2 texCoord;

            uniform mat4 projectionMatrix;

            void main() {
              texCoord =  vertTexCoord;

              gl_Position = projectionMatrix * vec4(vertPosition + offset, 1.0, 1.0) * transformMatrix;
            }
        </script>

        <script id="score-fragment-shader" type="shader">
            precision mediump float;
            varying vec2 texCoord;

            uniform sampler2D sampler;

            void main() {
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0) * texture2D(sampler, texCoord);
            }
        </script>
        <script>
          <?php
            function getDirContents($dir, &$results = array()){
              $files = scandir($dir);

              foreach($files as $key => $value){
                  $path = $value;
                  if(!is_dir($path)) {
                      $results[] = $path;
                  } else if($value != "." && $value != "..") {
                      getDirContents($path, $results);
                      $results[] = $path;
                  }
              }

              return $results;
            }

            //echo "var maps = " . json_encode(getDirContents('songs'));
          ?>
          var maps = [];
        </script>
        <script src="./assets/lib/zip.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js"></script>
        <script type="module" src="./assets/app.js?cache-buster=<?php echo mt_rand(); ?>"></script>
    </body>
</html>
