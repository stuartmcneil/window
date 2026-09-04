/*
 * WorkShy — JavaScript port of stubar.exe (Macromedia Director 6.0 projector, Sept 1999)
 *
 * The original is a 37-frame Director movie. This file is a tiny "score player"
 * that reproduces the movie frame-for-frame, plus straight translations of the
 * three Lingo behaviour scripts that were attached to the frame-script channel.
 *
 *   Frames  1–29 : frame script = member 5   (exitFrame: random status text; mouseDown: go "quit")
 *   Frame     30 : frame script = member 3   (exitFrame: go 1)
 *   Frames 31–36 : nothing on stage (white), runs at the movie's 2 fps
 *   Frame     37 : label "quit", frame script = member 7 (exitFrame: go the frame; mouseDown: quit)
 *
 *   Tempo channel: frames 2–30 carry "wait 10 seconds"; everything else runs at
 *   the movie frame rate of 2 fps.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- score data
  // Sprite channel 2 and 3 for each frame: [x, w] where x is the sprite's
  // registration point (the bitmap's centre) and w the stretched width.
  // Taken directly from the VWSC (score) chunk of the original movie.
  var BARS = {
    1:  [[16, 1],    null],
    2:  [[27, 11],   [23, 12]],
    3:  [[38, 20],   [28, 23]],
    4:  [[49, 30],   [38, 42]],
    5:  [[59, 40],   [36, 39]],
    6:  [[68, 49],   [40, 46]],
    7:  [[77, 59],   [36, 39]],
    8:  [[84, 69],   [43, 53]],
    9:  [[91, 79],   [48, 63]],
    10: [[98, 88],   [51, 69]],
    11: [[104, 98],  [40, 47]],
    12: [[109, 108], [48, 63]],
    13: [[114, 117], [41, 48]],
    14: [[119, 127], [48, 63]],
    15: [[123, 137], [42, 50]],
    16: [[127, 146], [48, 63]],
    17: [[130, 156], [48, 63]],
    18: [[133, 166], [48, 63]],
    19: [[136, 175], [48, 63]],
    20: [[139, 185], [48, 63]],
    21: [[142, 195], [48, 63]],
    22: [[144, 204], [48, 63]],
    23: [[146, 214], [48, 63]],
    24: [[148, 224], [48, 63]],
    25: [[150, 234], [48, 63]],
    26: [[152, 243], [48, 63]],
    27: [[153, 253], [48, 63]],
    28: [[155, 263], [48, 63]],
    29: [[156, 272], [48, 63]],
    30: [[157, 282], null]
  };

  var LABELS = { quit: 37 };
  var LAST_FRAME = 37;
  var MOVIE_FPS = 2;                 // "the frameRate" stored in the movie config
  var WAIT_SECONDS = 10;             // tempo channel value (-10) on frames 2–30

  // Frame script assignments (which behaviour member is in the script channel)
  function frameScript(f) {
    if (f >= 1 && f <= 29) return script5;
    if (f === 30) return script3;
    if (f === 37) return script7;
    return null;
  }

  // ------------------------------------------------------------ Lingo helpers
  // Lingo's random(n) returns an integer from 1 to n inclusive.
  function random(n) { return Math.floor(Math.random() * n) + 1; }

  var field = { txt: '' };
  function putIntoField(text, name) { field[name] = text; renderField(); }

  // ------------------------------------------------------- behaviour scripts
  // Member 3
  var script3 = {
    exitFrame: function () { go(1); }
  };

  // Member 5 — eight independent draws, exactly as written in the original,
  // so several can fire in one frame and the last one wins.
  var script5 = {
    exitFrame: function () {
      if (random(8) === 3) putIntoField('writing file master copy', 'txt');
      if (random(8) === 2) putIntoField('reading transfer doc/', 'txt');
      if (random(8) === 1) putIntoField("help me....i'm going crazy", 'txt');
      if (random(8) === 4) putIntoField('mapping temp dir', 'txt');
      if (random(8) === 5) putIntoField('trace and spike22 sent', 'txt');
      if (random(8) === 6) putIntoField('xk20 fitted', 'txt');
      if (random(8) === 7) putIntoField('detination time : T- 00:25', 'txt');
      if (random(8) === 8) putIntoField('all channels cut', 'txt');
    },
    mouseDown: function () { go('quit'); }
  };

  // Member 7
  var script7 = {
    exitFrame: function () { go(theFrame()); },
    mouseDown: function () { quit(); }
  };

  // ------------------------------------------------------------- the player
  var stage = document.getElementById('stage');
  var bar2  = document.getElementById('bar2');
  var bar3  = document.getElementById('bar3');
  var txt   = document.getElementById('txt');
  var bk    = document.getElementById('bk');
  var tea   = document.getElementById('tea');

  var current = 0;        // the frame
  var pending = null;     // set by go() during a handler
  var timer = null;
  var quitting = false;

  function theFrame() { return current; }

  function go(target) {
    if (typeof target === 'string') {
      if (!(target in LABELS)) return;          // Lingo ignores unknown labels
      target = LABELS[target];
    }
    pending = target;
  }

  function quit() {
    quitting = true;
    clearTimeout(timer);
    // A page can only close a window it opened itself; if the browser refuses
    // we simply take the dialog off the screen, which is as close as we get.
    try { window.close(); } catch (e) { /* ignore */ }
    stage.hidden = true;
    document.title = '';
  }

  function placeBar(el, spec) {
    if (!spec) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left  = (spec[0] - spec[1] / 2) + 'px';   // reg point is the bitmap centre
    el.style.width = spec[1] + 'px';
  }

  function renderField() { txt.textContent = field.txt; }

  function render(f) {
    var onStage = (f >= 1 && f <= 30) || f === 37;
    bk.hidden = !onStage;
    if (f >= 1 && f <= 30) {
      placeBar(bar2, BARS[f][0]);
      placeBar(bar3, BARS[f][1]);
      txt.hidden = false;
      tea.hidden = true;
    } else if (f === 37) {
      bar2.hidden = bar3.hidden = true;
      txt.hidden = true;
      tea.hidden = false;
    } else {
      bar2.hidden = bar3.hidden = txt.hidden = tea.hidden = true;
    }
  }

  // How long the playhead stays on this frame before exitFrame fires.
  function frameDelay(f) {
    if (f >= 2 && f <= 30) return WAIT_SECONDS * 1000;
    return 1000 / MOVIE_FPS;
  }

  function enterFrame(f) {
    current = f;
    render(f);
    clearTimeout(timer);
    timer = setTimeout(exitFrame, frameDelay(f));
  }

  function exitFrame() {
    if (quitting) return;
    pending = null;
    var s = frameScript(current);
    if (s && s.exitFrame) s.exitFrame();
    var next = pending !== null ? pending : current + 1;
    if (next > LAST_FRAME) next = LAST_FRAME;   // Director stops at the end; here that is frame 37 anyway
    enterFrame(next);
  }

  function mouseDown() {
    if (quitting) return;
    pending = null;
    var s = frameScript(current);
    if (s && s.mouseDown) s.mouseDown();
    if (!quitting && pending !== null) enterFrame(pending);
  }

  stage.addEventListener('mousedown', mouseDown);
  stage.addEventListener('touchstart', function (e) { e.preventDefault(); mouseDown(); }, { passive: false });

  // Field "txt" starts with the text saved in the cast member.
  field.txt = 'mapping temp dir';
  renderField();
  enterFrame(1);
})();
