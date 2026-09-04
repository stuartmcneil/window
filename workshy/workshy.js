/*
 * WorkShy — JavaScript port of stubar.exe (Macromedia Director 6.0 projector, Sept 1999)
 *
 * Revised behaviour (2026):
 *   - the progress bar fills one block at a time, 90s-copy-dialog style, then
 *     empties and starts again — forever;
 *   - sheets of paper fly from the left folder to the right one;
 *   - the status line still cycles through the original Lingo messages with the
 *     original one-in-eight odds per message, one roll per bar step;
 *   - mouse clicks do nothing. Ctrl+Q is the only way out: it shows the original
 *     "nice cup of tea" message for a few seconds, then closes the window (or, if
 *     the browser refuses to close a window it did not open, just clears the stage).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- settings
  var STEP_MS      = 2000;   // one new block every 2 s (~56 s to fill the trough)
  var BLOCK_W      = 8;      // block width in px
  var BLOCK_GAP    = 2;      // gap between blocks
  var TROUGH_W     = 282;    // inside of the trough, x 16..298 on the stage
  var PAPER_EVERY  = 900;    // ms between sheets of paper leaving the left folder
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
    statusRoll();
    stepTimer = setTimeout(step, STEP_MS);
  }

  // ----------------------------------------------------------- flying paper
  var paperTimer = null;
  function launchPaper() {
    var p = document.createElement('div');
    p.className = 'paper';
    papers.appendChild(p);
    p.addEventListener('animationend', function () { p.remove(); });
    paperTimer = setTimeout(launchPaper, PAPER_EVERY);
  }

  // ----------------------------------------------------------------- Ctrl+Q
  var quitting = false;
  function quit() {
    if (quitting) return;
    quitting = true;
    clearTimeout(stepTimer);
    clearTimeout(paperTimer);

    // Member 7 territory: show the tea message, then quit()
    bar.hidden = true;
    txt.hidden = true;
    papers.hidden = true;
    tea.hidden = false;

    setTimeout(function () {
      try { window.close(); } catch (e) { /* ignore */ }
      stage.hidden = true;
      document.title = '';
    }, TEA_MS);
  }

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
  paperTimer = setTimeout(launchPaper, 400);
})();
