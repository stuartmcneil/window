/*
 * WorkShy — JavaScript port of stubar.exe (Macromedia Director 6.0 projector, Sept 1999)
 *
 * Revised behaviour (2026):
 *   - the progress bar fills one block at a time, six blocks a second, then
 *     empties and starts again — forever;
 *   - a sheet of paper hops from the left folder to the right one, one at a time,
 *     turning over as it goes, in stepped frames at 6 a second;
 *   - the dialog can be dragged around by its blue title strip;
 *   - the status line still cycles through the original Lingo messages with the
 *     original one-in-eight odds per message, one roll every two seconds;
 *   - mouse clicks do nothing. Ctrl+Q is the only way out: it shows the original
 *     "nice cup of tea" message for a few seconds, then closes the window — or, when
 *     embedded as an overlay on stuartmcneil.github.io/window/, tells that page to
 *     remove the overlay.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- settings
  var STEP_MS      = 1000 / 6;   // six new blocks a second (trough fills in under 5 s, then loops)
  var STATUS_MS    = 2000;       // status line re-rolls every 2 s so it stays readable
  var BLOCK_W      = 8;      // block width in px
  var BLOCK_GAP    = 2;      // gap between blocks
  var TROUGH_W     = 282;    // inside of the trough, x 16..298 on the stage
  var TEA_MS       = 3000;   // how long the tea message stays before closing

  // ------------------------------------------------------------ Lingo helpers
  // Lingo's random(n) returns an integer from 1 to n inclusive.
  function random(n) { return Math.floor(Math.random() * n) + 1; }

  var field = { txt: 'mapping temp dir' };          // field "txt" as saved in the cast
  function putIntoField(text, name) { field[name] = text; renderField(); }

  // Member 5's exitFrame handler, verbatim: eight independent draws, so several
  // can fire on one step and the last one wins.
  function statusRoll() {
    if (random(8) === 3) putIntoField('writing file master copy', 'txt');
    if (random(8) === 2) putIntoField('reading transfer doc/', 'txt');
    if (random(8) === 1) putIntoField("help me....i'm going crazy", 'txt');
    if (random(8) === 4) putIntoField('mapping temp dir', 'txt');
    if (random(8) === 5) putIntoField('trace and spike22 sent', 'txt');
    if (random(8) === 6) putIntoField('xk20 fitted', 'txt');
    if (random(8) === 7) putIntoField('detination time : T- 00:25', 'txt');
    if (random(8) === 8) putIntoField('all channels cut', 'txt');
  }

  // ---------------------------------------------------------------- elements
  var stage  = document.getElementById('stage');
  var bar    = document.getElementById('bar');
  var txt    = document.getElementById('txt');
  var papers = document.getElementById('papers');
  var tea    = document.getElementById('tea');

  function renderField() { txt.textContent = field.txt; }

  // ------------------------------------------------------------ progress bar
  var blocks = [];
  var nBlocks = Math.floor((TROUGH_W + BLOCK_GAP) / (BLOCK_W + BLOCK_GAP));
  for (var i = 0; i < nBlocks; i++) {
    var b = document.createElement('i');
    b.style.left = (i * (BLOCK_W + BLOCK_GAP)) + 'px';
    bar.appendChild(b);
    blocks.push(b);
  }

  var lit = 0;
  function setBlocks(n) {
    lit = n;
    for (var i = 0; i < blocks.length; i++) blocks[i].className = i < n ? 'on' : '';
  }

  var stepTimer = null;
  function step() {
    if (lit >= nBlocks) setBlocks(0);       // full: empty the trough and go again
    else setBlocks(lit + 1);
    stepTimer = setTimeout(step, STEP_MS);
  }

  var statusTimer = null;
  function statusTick() {
    statusRoll();
    statusTimer = setTimeout(statusTick, STATUS_MS);
  }

  // ----------------------------------------------------------- flying paper
  // One sheet in flight at a time, stepped through these frames at PAPER_FPS.
  // Each frame is [x, y, flip]: x/y are the sheet's top-left on the stage and
  // flip is the horizontal scale, so 1 is face-on, 0 is edge-on and -1 is the
  // back of the sheet. The sheet turns over once on the way across.
  // Folders sit at roughly x 20-52 (left) and x 244-276 (right).
  var PAPER_FPS = 6;
  var PATH = [
    [36, 52,  1.0],
    [52, 40,  0.8],
    [72, 30,  0.4],
    [96, 22,  0.0],
    [122, 16, -0.5],
    [150, 14, -1.0],
    [178, 14, -0.9],
    [206, 17, -0.4],
    [230, 24,  0.1],
    [250, 33,  0.6],
    [264, 44,  0.9],
    [272, 54,  1.0]
  ];
  var sheet = document.createElement('div');
  sheet.className = 'paper';
  papers.appendChild(sheet);
  var paperFrame = 0;
  var paperTimer = null;

  function paperTick() {
    var f = PATH[paperFrame];
    var flip = f[2];
    // never let the sheet vanish completely when edge-on
    var sx = Math.abs(flip) < 0.12 ? (flip < 0 ? -0.12 : 0.12) : flip;
    sheet.style.transform = 'translate(' + f[0] + 'px,' + f[1] + 'px) scaleX(' + sx + ')';
    sheet.className = 'paper' + (flip < 0 ? ' back' : '');
    // hidden on the two end frames so the sheet looks like it is inside a folder
    sheet.style.visibility = (paperFrame === 0 || paperFrame === PATH.length - 1) ? 'hidden' : 'visible';
    paperFrame = (paperFrame + 1) % PATH.length;   // lands, and the next sheet sets off
    paperTimer = setTimeout(paperTick, 1000 / PAPER_FPS);
  }

  // ------------------------------------------------------------ title-bar drag
  // The blue strip across the top of the artwork (not the close box) drags the
  // dialog. Standalone, the stage moves itself with a transform, applied once per
  // animation frame. Embedded on the window page, the movement is forwarded to
  // the page (at most once per frame) and the page moves the overlay.
  var EMBEDDED = window.parent !== window;
  var TITLE = { x0: 0, x1: 362, y0: 0, y1: 18 };
  var drag = null;
  var pos = { x: 0, y: 0 };       // standalone: accumulated offset from the pinned spot
  var raf = null;

  function inTitleBar(e) {
    var r = stage.getBoundingClientRect();
    var lx = e.clientX - r.left, ly = e.clientY - r.top;
    return lx >= TITLE.x0 && lx < TITLE.x1 && ly >= TITLE.y0 && ly < TITLE.y1;
  }

  function paintPos() {
    raf = null;
    stage.style.transform = 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)';
  }

  var pending = null;
  function post(msg) { try { window.parent.postMessage(msg, '*'); } catch (err) { /* ignore */ } }
  function flush() { raf = null; if (pending) { post(pending); pending = null; } }

  stage.addEventListener('pointerdown', function (e) {
    if (!inTitleBar(e) || e.button !== 0 || quitting) return;
    var r = stage.getBoundingClientRect();
    e.preventDefault();
    stage.classList.add('dragging');
    if (EMBEDDED) {
      // screenX/Y so the maths still works while the frame moves under the pointer
      drag = { embedded: true, sx: e.screenX, sy: e.screenY };
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      post({ type: 'workshy:dragstart' });
      return;
    }
    if (stage.style.position !== 'absolute') {
      // leave the flex centring and pin the stage where it is now
      stage.style.position = 'absolute';
      stage.style.left = (r.left + window.scrollX) + 'px';
      stage.style.top  = (r.top + window.scrollY) + 'px';
      stage.style.willChange = 'transform';
    }
    drag = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  stage.addEventListener('pointermove', function (e) {
    if (!drag) {
      // hovering the blue strip shows the finger so you know it can be dragged
      stage.classList.toggle('grab', inTitleBar(e));
      return;
    }
    if (drag.embedded) {
      // forward the total movement since the grab, at most once per frame
      pending = { type: 'workshy:drag', dx: e.screenX - drag.sx, dy: e.screenY - drag.sy };
      if (!raf) raf = requestAnimationFrame(flush);
      return;
    }
    pos.x = drag.px + (e.clientX - drag.x);
    pos.y = drag.py + (e.clientY - drag.y);
    if (!raf) raf = requestAnimationFrame(paintPos);
  });

  function endDrag(e) {
    if (!drag) return;
    if (drag.embedded) { flush(); post({ type: 'workshy:dragend' }); }
    drag = null;
    stage.classList.remove('dragging');
    if (e && e.pointerId !== undefined) {
      try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', function () { if (!drag) stage.classList.remove('grab'); });

  // ----------------------------------------------------------------- Ctrl+Q
  var quitting = false;
  function quit() {
    if (quitting) return;
    quitting = true;
    clearTimeout(stepTimer);
    clearTimeout(statusTimer);
    clearTimeout(paperTimer);

    // Member 7 territory: show the tea message, then quit()
    bar.hidden = true;
    txt.hidden = true;
    papers.hidden = true;
    tea.hidden = false;

    setTimeout(function () {
      stage.hidden = true;
      document.title = '';
      if (window.parent !== window) {
        // embedded on the window page: let the parent take the overlay down
        try { window.parent.postMessage('workshy:quit', '*'); } catch (e) { /* ignore */ }
      } else {
        try { window.close(); } catch (e) { /* ignore */ }
      }
    }, TEA_MS);
  }

  // The embedding page can also ask us to quit (it relays Ctrl+Q when it has focus)
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    if (e.data === 'workshy:quit') quit();
    if (e.data === 'workshy:dragend') { endDrag(null); stage.classList.remove('grab'); }
  });

  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'q' || e.key === 'Q')) {
      e.preventDefault();
      quit();
    }
  }
  window.addEventListener('keydown', onKey);

  // Keyboard events only reach us if we have focus, so grab it on load and
  // whenever the dialog is clicked (clicks do nothing else — you can't cancel).
  stage.addEventListener('mousedown', function (e) { e.preventDefault(); stage.focus(); });
  stage.focus();

  // ------------------------------------------------------------------- start
  renderField();
  setBlocks(0);
  stepTimer  = setTimeout(step, STEP_MS);
  statusTimer = setTimeout(statusTick, STATUS_MS);
  paperTick();
})();
