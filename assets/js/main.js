/**
 * サイト共通のスクリプト
 * 依存ライブラリなし（そのままブラウザで動きます）
 */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. スマホ用メニューの開閉
     ---------------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var nav    = document.getElementById('globalNav');

  if (toggle && nav) {
    var setOpen = function (isOpen) {
      nav.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
    };

    toggle.addEventListener('click', function () {
      setOpen(nav.classList.contains('is-open') === false);
    });

    // メニュー内のリンクを押したら閉じる
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setOpen(false);
      }
    });

    // Escキーで閉じる
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // PC幅に戻したときは、開いた状態を必ず解除する
    var mq = window.matchMedia('(min-width: 769px)');
    var onChange = function (event) {
      if (event.matches) { setOpen(false); }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
    } else {
      mq.addListener(onChange); // 古いブラウザ向け
    }
  }

  /* ----------------------------------------------------------
     2. フッターの著作権表記の年を自動更新
     ---------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
