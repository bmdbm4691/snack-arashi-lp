const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const navToggleLabel = navToggle?.querySelector('.sr-only');

function closeNav() {
  navToggle?.setAttribute('aria-expanded', 'false');
  if (navToggleLabel) navToggleLabel.textContent = 'メニューを開く';
  nav?.classList.remove('is-open');
  document.body.classList.remove('nav-open');
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  if (navToggleLabel) navToggleLabel.textContent = isOpen ? 'メニューを開く' : 'メニューを閉じる';
  nav?.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('nav-open', !isOpen);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

window.addEventListener(
  'scroll',
  () => header?.classList.toggle('scrolled', window.scrollY > 24),
  { passive: true },
);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        activeObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.13 },
  );

  reveals.forEach((element) => observer.observe(element));
}

document.getElementById('year').textContent = new Date().getFullYear();

const songPlayer = document.querySelector('[data-song-player]');

if (songPlayer) {
  const audio = songPlayer.querySelector('audio');
  const playButton = songPlayer.querySelector('.image-song-button');
  const songLabel = songPlayer.querySelector('[data-song-label]');
  const songStatus = songPlayer.querySelector('[data-song-status]');
  const songProgress = songPlayer.querySelector('[data-song-progress]');

  const setPlayerState = (isPlaying) => {
    songPlayer.classList.toggle('is-playing', isPlaying);
    playButton.setAttribute('aria-pressed', String(isPlaying));
    playButton.setAttribute(
      'aria-label',
      isPlaying
        ? "イメージソング『今夜もスナック嵐で』を一時停止"
        : "イメージソング『今夜もスナック嵐で』を再生",
    );
    songLabel.textContent = isPlaying ? '再生中・押すと一時停止' : audio.currentTime > 0 ? '続きを再生する' : '曲を再生する';
    songStatus.textContent = isPlaying ? 'イメージソングを再生しています' : 'イメージソングを一時停止しました';
  };

  playButton.addEventListener('click', async () => {
    songPlayer.classList.remove('has-error');

    if (!audio.paused) {
      audio.pause();
      return;
    }

    songLabel.textContent = '読み込み中…';

    try {
      await audio.play();
    } catch (error) {
      songPlayer.classList.add('has-error');
      songLabel.textContent = '再生できません';
      songStatus.textContent = '曲を再生できませんでした';
    }
  });

  audio.addEventListener('play', () => setPlayerState(true));
  audio.addEventListener('pause', () => setPlayerState(false));
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    setPlayerState(false);
    songProgress.style.width = '0%';
  });
  audio.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audio.duration) || audio.duration === 0) return;
    songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  });
}

const lyricsDialog = document.getElementById('lyrics-dialog');
const openLyricsButton = document.querySelector('[data-open-lyrics]');
const closeLyricsButtons = document.querySelectorAll('[data-close-lyrics]');

function closeLyrics() {
  if (!lyricsDialog) return;

  if (typeof lyricsDialog.close === 'function') {
    lyricsDialog.close();
  } else {
    lyricsDialog.removeAttribute('open');
    document.body.classList.remove('dialog-open');
  }
}

openLyricsButton?.addEventListener('click', () => {
  if (!lyricsDialog) return;

  if (typeof lyricsDialog.showModal === 'function') {
    lyricsDialog.showModal();
  } else {
    lyricsDialog.setAttribute('open', '');
  }

  lyricsDialog.querySelector('.lyrics-dialog-body').scrollTop = 0;
  document.body.classList.add('dialog-open');
});

closeLyricsButtons.forEach((button) => button.addEventListener('click', closeLyrics));

lyricsDialog?.addEventListener('click', (event) => {
  if (event.target === lyricsDialog) closeLyrics();
});

lyricsDialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
});
