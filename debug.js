/* =============================================================================
   debug.js — DEV-ONLY screen switcher for the Fish Sorting game.

   Loaded by <script src="debug.js"></script> at the END of index.html (after
   the main script), so it shares that script's globals — applyScene(),
   startMainGame(), showFinalPondScreen(), TUTORIAL_SCENES, LEVELS, etc.

   USAGE
   • A floating panel (bottom-left) lists every screen — click one to jump there.
   • Press the  `  (backtick) key to hide/show the panel; click the title bar to
     collapse it; ✕ closes it.
   • Console API:
       dbg.scene('confused')   jump to a tutorial scene (see dbg.list())
       dbg.game(0)             start gameplay at a level (0-based)
       dbg.win()               the "You Did It!" final screen
       dbg.over()              the game-over overlay
       dbg.start()             back to the title screen (reload)
       dbg.list()              { scenes:[...], levels:N }

   TO SHIP WITHOUT IT: delete this file and its <script> tag in index.html.
   ========================================================================== */
(function () {
  // Bail clearly if loaded before/without the main script.
  if (typeof TUTORIAL_SCENES === 'undefined' || typeof applyScene !== 'function') {
    console.warn('[dbg] game globals not found — load debug.js AFTER the main script.');
    return;
  }

  /* ---------- shared reset so jumps work from any current screen ---------- */
  function resetCommon() {
    [startOverlay, gameOverOverlay, finalPondScreen].forEach(function (el) {
      if (el) el.classList.add('hidden');
    });
    if (typeof fullSceneImage !== 'undefined' && fullSceneImage) {
      fullSceneImage.classList.remove('show');
      fullSceneImage.classList.add('hidden');
    }
    document.querySelectorAll('.fish').forEach(function (f) { f.remove(); });
    if (typeof hud !== 'undefined' && hud) hud.classList.remove('show');
    if (typeof levelBanner !== 'undefined' && levelBanner) levelBanner.classList.remove('show');
    try { gameOn = false; } catch (e) {}
    try { inputLocked = false; } catch (e) {}
  }

  /* ---------- screen actions ---------------------------------------------- */
  var actions = {
    start: function () { location.reload(); },           // cleanest full reset

    scene: function (name) {
      if (!TUTORIAL_SCENES[name]) { console.warn('[dbg] unknown scene:', name); return; }
      resetCommon();
      game.classList.remove('final-screen-active');
      game.classList.add('tutorial');
      applyScene(name);
    },

    game: function (level) {
      resetCommon();
      game.classList.remove('tutorial', 'final-screen-active');
      // Jumping straight to a level skips the "Let's Go" tap that normally
      // unlocks audio, so resumeGameplayMusic() would bail (musicStarted=false)
      // and you'd hear no music. This click IS a user gesture, so unlock + start
      // the gameplay loop here.
      if (typeof startBackgroundMusic === 'function') startBackgroundMusic();
      startMainGame(level || 0);
    },

    win:  function () { resetCommon(); showFinalPondScreen(); },
    over: function () { if (typeof showGameOverOverlay === 'function') showGameOverOverlay(); },
    list: function () { return { scenes: Object.keys(TUTORIAL_SCENES), levels: LEVELS.length }; }
  };
  window.dbg = actions;

  /* ---------- floating panel ---------------------------------------------- */
  function build() {
    var panel = document.createElement('div');
    panel.id = 'dbgPanel';
    panel.style.cssText =
      'position:fixed;left:10px;bottom:10px;z-index:2147483647;width:176px;' +
      'font:12px/1.3 ui-monospace,Menlo,Consolas,monospace;background:rgba(18,18,26,.93);' +
      'color:#e9e9f1;border:1px solid #44485a;border-radius:10px;padding:8px;' +
      'max-height:82vh;overflow:auto;box-shadow:0 10px 30px rgba(0,0,0,.55);user-select:none;';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;' +
      'cursor:pointer;font-weight:700;color:#ffd23b;';
    bar.appendChild(document.createTextNode('🛠 Debug · screens'));
    var x = document.createElement('span');
    x.textContent = '✕'; x.style.cssText = 'cursor:pointer;opacity:.6;padding:0 2px;';
    bar.appendChild(x);
    panel.appendChild(bar);

    var body = document.createElement('div');
    panel.appendChild(body);

    function head(t) {
      var h = document.createElement('div');
      h.textContent = t;
      h.style.cssText = 'margin:9px 0 3px;color:#8fc6ff;font-weight:700;letter-spacing:.06em;font-size:10px;';
      body.appendChild(h);
    }
    function btn(label, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'display:block;width:100%;text-align:left;margin:2px 0;padding:5px 8px;' +
        'background:#2a2a39;color:#e9e9f1;border:1px solid #3a3d50;border-radius:6px;' +
        'cursor:pointer;font:inherit;';
      b.onmouseenter = function () { b.style.background = '#3a3d57'; };
      b.onmouseleave = function () { b.style.background = '#2a2a39'; };
      b.onclick = function () { try { fn(); } catch (e) { console.error('[dbg]', e); } };
      body.appendChild(b);
    }

    head('FLOW');
    btn('⟳ Start (reload)', actions.start);

    head('TUTORIAL');
    Object.keys(TUTORIAL_SCENES).forEach(function (name) {
      btn('• ' + name, function () { actions.scene(name); });
    });

    head('GAME');
    for (var i = 0; i < LEVELS.length; i++) {
      (function (idx) { btn('▶ Level ' + (idx + 1), function () { actions.game(idx); }); })(i);
    }

    head('END');
    btn('🏆 Win screen', actions.win);
    btn('💀 Game Over', actions.over);

    // Click the bar to collapse the list; ✕ to hide entirely.
    var collapsed = false;
    bar.onclick = function (e) {
      if (e.target === x) { panel.style.display = 'none'; return; }
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : 'block';
    };

    // Backtick toggles the whole panel.
    document.addEventListener('keydown', function (e) {
      if (e.key === '`') panel.style.display = (panel.style.display === 'none' ? 'block' : 'none');
    });

    document.body.appendChild(panel);
    console.log('[dbg] ready — click a screen, press ` to toggle, or use dbg.scene()/dbg.game()/dbg.win().');
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
