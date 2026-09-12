/**
 * ドリームコーチング（再現版）共通スクリプト
 * 外部ライブラリなし。ファイルをそのままブラウザで開いても動きます。
 */
(function () {
  'use strict';

  /* ==========================================================
     1. ドロワーメニューの開閉
     ========================================================== */
  var menuBtn     = document.getElementById('menuBtn');
  var drawer      = document.getElementById('drawer');
  var drawerClose = document.getElementById('drawerClose');
  var overlay     = document.getElementById('drawerOverlay');

  if (menuBtn && drawer && overlay) {
    var openDrawer = function () {
      drawer.hidden = false;
      overlay.hidden = false;
      // 表示してから1フレーム置くことで、スライドのアニメーションが効く
      requestAnimationFrame(function () {
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
      });
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';   // 背面のスクロールを止める
      drawerClose.focus();
    };

    var closeDrawer = function () {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      // アニメーションが終わってから非表示にする
      window.setTimeout(function () {
        if (!drawer.classList.contains('is-open')) {
          drawer.hidden = true;
          overlay.hidden = true;
        }
      }, 250);
      menuBtn.focus();
    };

    menuBtn.addEventListener('click', openDrawer);
    drawerClose.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // メニュー内のリンクを押したら閉じる
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) { closeDrawer(); }
    });

    // Escキーで閉じる
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  /* ==========================================================
     2. 開催予定レッスンの月しぼり込み
     ========================================================== */
  var tabs  = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var list  = document.getElementById('lessonList');
  var empty = document.getElementById('tabsEmpty');

  if (tabs.length && list) {
    var lessons = Array.prototype.slice.call(list.querySelectorAll('.lesson'));

    var applyFilter = function (value) {
      var shown = 0;
      lessons.forEach(function (item) {
        var month = item.getAttribute('data-month');
        var match =
          value === 'all' ? true :
          value === '11'  ? Number(month) >= 11 :   // 「11月以降」
                            month === value;
        item.hidden = !match;
        if (match) { shown++; }
      });
      if (empty) { empty.hidden = shown > 0; }
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (other) {
          var isMe = other === tab;
          other.classList.toggle('is-active', isMe);
          other.setAttribute('aria-selected', String(isMe));
        });
        applyFilter(tab.getAttribute('data-filter'));
      });
    });
  }

  /* ==========================================================
     3. コーチ一覧の競技しぼり込み
     ========================================================== */
  var chips = Array.prototype.slice.call(document.querySelectorAll('#sportChips .chip'));
  var grid  = document.getElementById('coachGrid');

  if (chips.length && grid) {
    var tiles      = Array.prototype.slice.call(grid.querySelectorAll('.coach-tile'));
    var countLabel = document.getElementById('coachCount');
    var noResult   = document.getElementById('coachEmpty');

    var filterCoaches = function (sport) {
      var shown = 0;
      tiles.forEach(function (tile) {
        var list  = (tile.getAttribute('data-sports') || '').split(',');
        var match = sport === 'all' || list.indexOf(sport) !== -1;
        // カードは <li> の中にあるので、li ごと出し入れする
        tile.parentNode.hidden = !match;
        if (match) { shown++; }
      });
      if (countLabel) { countLabel.textContent = String(shown); }
      if (noResult)   { noResult.hidden = shown > 0; }
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (other) {
          other.classList.toggle('is-active', other === chip);
        });
        filterCoaches(chip.getAttribute('data-sport'));
      });
    });
  }

  /* ==========================================================
     4. チャットウィジェット
     ========================================================== */
  var chat      = document.getElementById('chat');
  var chatClose = document.getElementById('chatClose');

  if (chat && chatClose) {
    chatClose.addEventListener('click', function () { chat.hidden = true; });
  }

  // 「チャットで相談する」などのボタン
  // ※このサイトは見た目の再現版のため、実際のチャットには接続していません
  Array.prototype.forEach.call(
    document.querySelectorAll('[data-open-chat]'),
    function (btn) {
      btn.addEventListener('click', function () {
        showToast('このサイトは見た目の再現版です。チャット機能は接続していません。');
      });
    }
  );

  /**
   * 画面下に短いお知らせを表示する
   * @param {string} message 表示する文章
   */
  function showToast(message) {
    var existing = document.getElementById('toast');
    if (existing) { existing.remove(); }

    var el = document.createElement('p');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:calc(var(--hours-h) + 96px)',
      'transform:translateX(-50%)',
      'z-index:200',
      'max-width:min(92vw,420px)',
      'margin:0',
      'padding:12px 18px',
      'background:rgba(24,30,34,.92)',
      'border-radius:10px',
      'color:#fff',
      'font-size:14px',
      'line-height:1.6',
      'text-align:center'
    ].join(';');
    document.body.appendChild(el);

    window.setTimeout(function () { el.remove(); }, 3200);
  }

  /* ==========================================================
     5. フッターの著作権表記の年を自動更新
     ========================================================== */
  var year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }
})();
