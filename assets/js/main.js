/**
 * SPORT MATCHING 共通スクリプト
 * 外部ライブラリなし。ファイルをそのままブラウザで開いても動きます。
 */
(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ==========================================================
     0. 保存まわり（お気に入りなど）
     ブラウザの設定によっては使えないので、必ず try で囲む
     ========================================================== */
  var FAV_KEY = 'sm_favorites';

  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch (e) { return []; }
  }
  function saveFavorites(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) { /* 保存できなくても続行 */ }
  }

  /* ==========================================================
     1. ドロワーメニューの開閉
     ========================================================== */
  var menuBtn = $('#menuBtn'), drawer = $('#drawer'),
      drawerClose = $('#drawerClose'), overlay = $('#drawerOverlay');

  if (menuBtn && drawer && overlay) {
    var openDrawer = function () {
      drawer.hidden = false;
      overlay.hidden = false;
      requestAnimationFrame(function () {
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');
      });
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      drawerClose.focus();
    };
    var closeDrawer = function () {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
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
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  /* ==========================================================
     2. ヘッダーの検索バー
     入力してEnter（または検索ボタン）でコーチ一覧へ移動する
     ========================================================== */
  $$('.searchbar').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('.searchbar__input', form);
      var word  = (input.value || '').trim();
      var to    = form.getAttribute('data-target') || 'coaches.html';
      // 検索語はURLの # に載せる。ファイルを直接開いた場合でも動くため
      window.location.href = to + (word ? '#q=' + encodeURIComponent(word) : '');
      // 同じページ内での移動だと再読み込みされないので、明示的に反映する
      if (typeof window.smApplyFromHash === 'function') { window.smApplyFromHash(); }
    });
  });

  /* ==========================================================
     3. コーチ一覧：キーワード検索・しぼり込み・並び替え
     ========================================================== */
  var grid = $('#coachGrid');

  if (grid) {
    var items    = $$('.coach-item', grid);
    var countEl  = $('#coachCount');
    var emptyEl  = $('#coachEmpty');
    var keyword  = $('#kwInput');
    var sortSel  = $('#sortSelect');
    var clearBtn = $('#clearBtn');

    var state = { q: '', sport: 'all', area: 'all', price: 'all', online: false, fav: false, sort: 'recommend' };

    function readHash() {
      var h = window.location.hash.replace(/^#/, '');
      if (!h) return;
      h.split('&').forEach(function (pair) {
        var i = pair.indexOf('=');
        if (i < 0) return;
        var k = pair.slice(0, i), v = decodeURIComponent(pair.slice(i + 1));
        if (k === 'q')      state.q = v;
        if (k === 'sport')  state.sport = v;
        if (k === 'area')   state.area = v;
        if (k === 'price')  state.price = v;
        if (k === 'online') state.online = v === '1';
        if (k === 'fav')    state.fav = v === '1';
        if (k === 'sort')   state.sort = v;
      });
    }

    function writeHash() {
      var parts = [];
      if (state.q)                    parts.push('q=' + encodeURIComponent(state.q));
      if (state.sport !== 'all')      parts.push('sport=' + encodeURIComponent(state.sport));
      if (state.area  !== 'all')      parts.push('area=' + encodeURIComponent(state.area));
      if (state.price !== 'all')      parts.push('price=' + state.price);
      if (state.online)               parts.push('online=1');
      if (state.fav)                  parts.push('fav=1');
      if (state.sort !== 'recommend') parts.push('sort=' + state.sort);
      var next = parts.length ? '#' + parts.join('&') : '#';
      if (window.history && history.replaceState) {
        history.replaceState(null, '', window.location.pathname + next);
      }
    }

    function matches(el) {
      var favs = loadFavorites();
      if (state.fav && favs.indexOf(el.getAttribute('data-id')) === -1) return false;
      if (state.online && el.getAttribute('data-online') !== '1') return false;
      if (state.sport !== 'all') {
        var list = (el.getAttribute('data-sports') || '').split(',');
        if (list.indexOf(state.sport) === -1) return false;
      }
      if (state.area !== 'all' && el.getAttribute('data-area') !== state.area) return false;
      if (state.price !== 'all') {
        var price = Number(el.getAttribute('data-price'));
        if (state.price === 'lt6000'  && !(price <  6000)) return false;
        if (state.price === 'mid'     && !(price >= 6000 && price < 7500)) return false;
        if (state.price === 'gte7500' && !(price >= 7500)) return false;
      }
      if (state.q) {
        var hay = (el.getAttribute('data-search') || '').toLowerCase();
        var ok = state.q.toLowerCase().split(/[\s　]+/).every(function (w) {
          return !w || hay.indexOf(w) !== -1;
        });
        if (!ok) return false;
      }
      return true;
    }

    function sortItems() {
      var key = state.sort;
      var sorted = items.slice().sort(function (a, b) {
        var num = function (el, name) { return Number(el.getAttribute(name)); };
        if (key === 'price-asc')  return num(a, 'data-price') - num(b, 'data-price');
        if (key === 'price-desc') return num(b, 'data-price') - num(a, 'data-price');
        if (key === 'rate')       return num(b, 'data-rate')  - num(a, 'data-rate');
        if (key === 'reviews')    return num(b, 'data-cnt')   - num(a, 'data-cnt');
        return num(a, 'data-order') - num(b, 'data-order');   // おすすめ順
      });
      sorted.forEach(function (el) { grid.appendChild(el); });
    }

    function apply() {
      var shown = 0;
      items.forEach(function (el) {
        var ok = matches(el);
        el.hidden = !ok;
        if (ok) shown++;
      });
      sortItems();
      if (countEl) countEl.textContent = String(shown);
      if (emptyEl) emptyEl.hidden = shown > 0;
      writeHash();
    }

    // 見出しのチップ（競技・地域・料金）
    $$('[data-facet]').forEach(function (group) {
      var facet = group.getAttribute('data-facet');
      $$('.chip', group).forEach(function (chip) {
        chip.addEventListener('click', function () {
          var value = chip.getAttribute('data-value');
          if (facet === 'online') {
            state.online = !state.online;
            chip.classList.toggle('is-active', state.online);
            chip.setAttribute('aria-pressed', String(state.online));
          } else {
            state[facet] = value;
            $$('.chip', group).forEach(function (c) {
              c.classList.toggle('is-active', c === chip);
            });
          }
          apply();
        });
      });
    });

    if (keyword) {
      keyword.addEventListener('input', function () {
        state.q = keyword.value.trim();
        apply();
      });
    }
    if (sortSel) {
      sortSel.addEventListener('change', function () {
        state.sort = sortSel.value;
        apply();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state = { q: '', sport: 'all', area: 'all', price: 'all', online: false, fav: false, sort: 'recommend' };
        if (keyword) keyword.value = '';
        if (sortSel) sortSel.value = 'recommend';
        $$('[data-facet]').forEach(function (group) {
          var facet = group.getAttribute('data-facet');
          $$('.chip', group).forEach(function (c) {
            var on = facet === 'online' ? false : c.getAttribute('data-value') === 'all';
            c.classList.toggle('is-active', on);
            if (facet === 'online') c.setAttribute('aria-pressed', 'false');
          });
        });
        apply();
      });
    }

    // URLの # から状態を復元する（検索バーからの遷移・再読み込み・戻るに対応）
    window.smApplyFromHash = function () {
      readHash();
      if (keyword) keyword.value = state.q;
      if (sortSel) sortSel.value = state.sort;
      $$('[data-facet]').forEach(function (group) {
        var facet = group.getAttribute('data-facet');
        $$('.chip', group).forEach(function (c) {
          var on = facet === 'online' ? state.online : c.getAttribute('data-value') === state[facet];
          c.classList.toggle('is-active', on);
          if (facet === 'online') c.setAttribute('aria-pressed', String(state.online));
        });
      });
      apply();
    };
    window.addEventListener('hashchange', window.smApplyFromHash);
    window.smApplyFromHash();
  }

  /* ==========================================================
     4. お気に入り（ハートボタン）
     ========================================================== */
  function paintFavorites() {
    var favs = loadFavorites();
    $$('.fav').forEach(function (btn) {
      var on = favs.indexOf(btn.getAttribute('data-id')) !== -1;
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'お気に入りから外す' : 'お気に入りに追加');
    });
    var badge = $('#favCount');
    if (badge) badge.textContent = favs.length ? '（' + favs.length + '）' : '';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.fav');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-id');
    var favs = loadFavorites();
    var i = favs.indexOf(id);
    if (i === -1) { favs.push(id); } else { favs.splice(i, 1); }
    saveFavorites(favs);
    paintFavorites();
    if (grid && typeof window.smApplyFromHash === 'function' && window.location.hash.indexOf('fav=1') !== -1) {
      window.smApplyFromHash();
    }
    toast(i === -1 ? 'お気に入りに追加しました' : 'お気に入りから外しました');
  });
  paintFavorites();

  /* ==========================================================
     5. コーチ詳細：空き枠を選ぶ → 下の予約バーに反映
     ========================================================== */
  var bookbar = $('#bookbar');
  if (bookbar) {
    var barText = $('#bookbarText');
    var barBtn  = $('#bookbarBtn');
    var base    = barBtn ? barBtn.getAttribute('href') : 'booking.html';

    $$('.slot:not(.slot--none)').forEach(function (slot) {
      slot.addEventListener('click', function () {
        $$('.slot').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
        slot.setAttribute('aria-pressed', 'true');
        var when = slot.getAttribute('data-when');
        barText.innerHTML = '<b>' + when + '</b>この日時で予約に進めます';
        barBtn.setAttribute('href', base.split('&when=')[0] + '&when=' + encodeURIComponent(when));
        barBtn.removeAttribute('aria-disabled');
      });
    });
  }

  /* ==========================================================
     6. 予約フロー（3ステップ）
     ========================================================== */
  var booking = $('#booking');
  if (booking) {
    var params = {};
    window.location.hash.replace(/^#/, '').split('&').forEach(function (pair) {
      var i = pair.indexOf('=');
      if (i > 0) params[pair.slice(0, i)] = decodeURIComponent(pair.slice(i + 1));
    });

    var coach = (window.SM_COACHES || {})[params.coach];
    if (coach) {
      $$('[data-fill="coach"]').forEach(function (el) { el.textContent = coach.name + ' コーチ'; });
      $$('[data-fill="role"]').forEach(function (el) { el.textContent = coach.role; });
      $$('[data-fill="price"]').forEach(function (el) {
        el.textContent = coach.price.toLocaleString('ja-JP') + '円';
      });
      $$('[data-fill="total"]').forEach(function (el) {
        el.textContent = coach.price.toLocaleString('ja-JP') + '円';
      });
    }
    $$('[data-fill="when"]').forEach(function (el) {
      el.textContent = params.when || '日時が選択されていません';
    });

    var panels = $$('.step-panel', booking);
    var steps  = $$('.stepper li', booking);

    function goStep(n) {
      panels.forEach(function (p, i) { p.hidden = i !== n; });
      steps.forEach(function (s, i) {
        s.classList.toggle('is-done', i < n);
        if (i === n) { s.setAttribute('aria-current', 'step'); }
        else { s.removeAttribute('aria-current'); }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    $$('[data-goto]', booking).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        goStep(Number(btn.getAttribute('data-goto')));
      });
    });
    goStep(0);
  }

  /* ==========================================================
     7. レッスン一覧：開催月でしぼり込み
     ========================================================== */
  var tabs = $$('.tab'), list = $('#lessonList'), lessonEmpty = $('#tabsEmpty');
  if (tabs.length && list) {
    var lessons = $$('.lesson', list);
    var filterLessons = function (v) {
      var shown = 0;
      lessons.forEach(function (item) {
        var m = item.getAttribute('data-month');
        var ok = v === 'all' ? true : v === '11' ? Number(m) >= 11 : m === v;
        item.hidden = !ok;
        if (ok) shown++;
      });
      if (lessonEmpty) lessonEmpty.hidden = shown > 0;
    };
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (o) {
          o.classList.toggle('is-active', o === tab);
          o.setAttribute('aria-selected', String(o === tab));
        });
        filterLessons(tab.getAttribute('data-filter'));
      });
    });
  }

  /* ==========================================================
     8. 上へ戻るボタン（スクロールすると出てくる）
     ========================================================== */
  var topBtn = $('#topBtn');
  if (topBtn) {
    var toggleTopBtn = function () {
      topBtn.classList.toggle('is-hidden', window.scrollY < 600);
    };
    toggleTopBtn();
    window.addEventListener('scroll', toggleTopBtn, { passive: true });
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ==========================================================
     9. チャットボタンと吹き出し
     吹き出しは一度閉じたら、次からは出ない
     ========================================================== */
  var tip = $('#chatTip'), tipClose = $('#chatTipClose');
  if (tip) {
    var seen = false;
    try { seen = localStorage.getItem('sm_chat_tip') === 'closed'; } catch (e) { /* 無視 */ }
    if (seen) {
      tip.hidden = true;
    } else {
      window.setTimeout(function () { tip.hidden = false; }, 1200);
      window.setTimeout(function () { tip.hidden = true; }, 9000);
    }
    if (tipClose) {
      tipClose.addEventListener('click', function () {
        tip.hidden = true;
        try { localStorage.setItem('sm_chat_tip', 'closed'); } catch (e) { /* 無視 */ }
      });
    }
  }

  $$('[data-open-chat]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (tip) tip.hidden = true;
      toast('これはデモです。チャット機能は接続していません。（受付 9:00〜）');
    });
  });

  /**
   * 画面下に短いお知らせを出す
   * @param {string} message 表示する文章
   */
  function toast(message) {
    var old = $('#toast');
    if (old) old.remove();
    var el = document.createElement('p');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:calc(var(--tabbar-h) + 84px)',
      'transform:translateX(-50%)', 'z-index:200', 'max-width:min(92vw,420px)',
      'margin:0', 'padding:12px 18px', 'background:rgba(24,30,34,.93)',
      'border-radius:10px', 'color:#fff', 'font-size:14px', 'line-height:1.6',
      'text-align:center'
    ].join(';');
    document.body.appendChild(el);
    window.setTimeout(function () { el.remove(); }, 3000);
  }

  /* ==========================================================
     10. フッターの著作権表記の年を自動更新
     ========================================================== */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
