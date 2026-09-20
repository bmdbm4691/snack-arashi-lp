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

const audio = document.getElementById('image-song-audio');
const lyricsPlayButton = document.querySelector('[data-lyrics-play]');
let stopPlaylistMode = () => {};

if (audio && lyricsPlayButton) {
  const lyricsPlayLabel = document.querySelector('[data-lyrics-play-label]');
  const playlistPlayButton = document.querySelector('[data-playlist-play]');
  const playlistPlayLabel = document.querySelector('[data-playlist-play-label]');
  const lyricsStatus = document.querySelector('[data-lyrics-status]');
  const lyricsProgress = document.querySelector('[data-lyrics-progress]');
  const songChoices = [...document.querySelectorAll('[data-select-song]')];
  const songPanels = document.querySelectorAll('[data-lyrics-song]');
  const songHeadings = document.querySelectorAll('[data-song-heading]');
  const audioSource = audio.querySelector('source');
  const lyricsBody = document.querySelector('.lyrics-dialog-body');
  const playlistSongCount = songChoices.length;
  let playlistActive = false;

  const setPlayerState = (isPlaying) => {
    const label = isPlaying ? 'この曲を一時停止' : audio.currentTime > 0 ? 'この曲の続きを再生' : 'この曲を再生';
    const ariaLabel = isPlaying ? '選択中の曲を一時停止' : audio.currentTime > 0 ? '選択中の曲の続きを再生' : '選択中の曲を再生';
    lyricsPlayButton.setAttribute('aria-pressed', String(isPlaying));
    lyricsPlayButton.setAttribute('aria-label', ariaLabel);
    if (lyricsPlayLabel) lyricsPlayLabel.textContent = label;
    if (lyricsStatus) lyricsStatus.textContent = isPlaying ? 'イメージソングを再生しています' : 'イメージソングを一時停止しました';
  };

  const setPlaylistState = (isActive) => {
    playlistActive = isActive;
    if (!playlistPlayButton) return;

    playlistPlayButton.setAttribute('aria-pressed', String(isActive));
    playlistPlayButton.setAttribute(
      'aria-label',
      isActive ? `${playlistSongCount}曲の連続リピート再生を停止` : `1曲目から${playlistSongCount}曲目まで連続リピート再生`,
    );
    if (playlistPlayLabel) playlistPlayLabel.textContent = isActive ? 'リピート停止' : `${playlistSongCount}曲リピート`;
  };

  stopPlaylistMode = () => setPlaylistState(false);

  const selectSong = (choice, { keepPlaylist = false } = {}) => {
    if (!choice) return;
    if (!keepPlaylist) setPlaylistState(false);

    audio.pause();
    audio.currentTime = 0;
    audioSource.src = choice.dataset.songSrc;
    audio.load();
    songHeadings.forEach((heading) => { heading.hidden = heading.dataset.songHeading !== choice.dataset.selectSong; });
    songChoices.forEach((button) => button.setAttribute('aria-pressed', String(button === choice)));
    const songPanelKey = choice.dataset.songPanel || choice.dataset.selectSong;
    songPanels.forEach((panel) => { panel.hidden = panel.dataset.lyricsSong !== songPanelKey; });
    if (lyricsBody) lyricsBody.scrollTop = 0;
    if (lyricsProgress) lyricsProgress.style.width = '0%';
    setPlayerState(false);
  };

  const toggleSong = async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }

    if (lyricsPlayLabel) lyricsPlayLabel.textContent = '読み込み中…';

    try {
      await audio.play();
    } catch (error) {
      if (lyricsPlayLabel) lyricsPlayLabel.textContent = '再生できません';
      if (lyricsStatus) lyricsStatus.textContent = '曲を再生できませんでした';
    }
  };

  lyricsPlayButton.addEventListener('click', toggleSong);

  songChoices.forEach((choice) => choice.addEventListener('click', () => {
    if (choice.getAttribute('aria-pressed') === 'true') {
      if (playlistActive) {
        setPlaylistState(false);
        audio.pause();
      }
      return;
    }

    selectSong(choice);
  }));

  playlistPlayButton?.addEventListener('click', async () => {
    if (playlistActive) {
      setPlaylistState(false);
      audio.pause();
      if (lyricsStatus) lyricsStatus.textContent = `${playlistSongCount}曲の連続リピート再生を停止しました`;
      return;
    }

    selectSong(songChoices[0], { keepPlaylist: true });
    setPlaylistState(true);
    if (playlistPlayLabel) playlistPlayLabel.textContent = '読み込み中…';

    try {
      await audio.play();
      setPlaylistState(true);
      if (lyricsStatus) lyricsStatus.textContent = `1曲目から${playlistSongCount}曲目まで連続リピート再生しています`;
    } catch (error) {
      setPlaylistState(false);
      if (playlistPlayLabel) playlistPlayLabel.textContent = '再生できません';
      if (lyricsStatus) lyricsStatus.textContent = '連続リピート再生を開始できませんでした';
    }
  });

  audio.addEventListener('play', () => setPlayerState(true));
  audio.addEventListener('pause', () => setPlayerState(false));
  audio.addEventListener('ended', async () => {
    if (playlistActive && songChoices.length > 0) {
      const currentIndex = songChoices.findIndex((choice) => choice.getAttribute('aria-pressed') === 'true');
      const nextChoice = songChoices[(currentIndex + 1) % songChoices.length];
      selectSong(nextChoice, { keepPlaylist: true });
      setPlaylistState(true);

      try {
        await audio.play();
      } catch (error) {
        setPlaylistState(false);
        if (lyricsStatus) lyricsStatus.textContent = '次の曲を再生できませんでした';
      }
      return;
    }

    audio.currentTime = 0;
    setPlayerState(false);
    if (lyricsProgress) lyricsProgress.style.width = '0%';
  });
  audio.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audio.duration) || audio.duration === 0) return;
    if (lyricsProgress) lyricsProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  });
}

const lyricsDialog = document.getElementById('lyrics-dialog');
const openLyricsButton = document.querySelector('[data-open-lyrics]');
const closeLyricsButtons = document.querySelectorAll('[data-close-lyrics]');

function closeLyrics() {
  if (!lyricsDialog) return;

  stopPlaylistMode();
  audio?.pause();

  if (typeof lyricsDialog.close === 'function') {
    lyricsDialog.close();
  } else {
    lyricsDialog.removeAttribute('open');
    document.body.classList.remove('dialog-open');
    audio?.pause();
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
  stopPlaylistMode();
  audio?.pause();
});
