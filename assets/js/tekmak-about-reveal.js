/**
 * TEKMAK DO BRASIL — SOBRE NÓS CINEMATOGRÁFICO
 * - Fachada pausada até a rolagem avançar pela seção
 * - Transição de texto por scroll antes de iniciar o vídeo
 * - Suporte total a mobile (iOS/Android) e desktop
 */
(() => {
  'use strict';

  function initTekmakAbout() {
    const track = document.querySelector('.tek-about-track');
    const stage = document.querySelector('.tek-about-stage');
    const video = document.getElementById('tekAboutVideo');
    const screens = document.querySelectorAll('.tek-about-screen');
    const scrollCue = document.getElementById('tekAboutScrollCue');

    if (!track || !stage || !video) return;
    if (!window.gsap || !window.ScrollTrigger) {
      setTimeout(initTekmakAbout, 100);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Configurações do elemento de vídeo para máxima compatibilidade mobile
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.preload = 'auto';
    video.loop = false;

    const startThreshold = 0.08;
    let currentActiveIdx = 1;
    let playbackStarted = false;
    let playTimer;

    function playVideo() {
      if (video.ended) return;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .catch(() => {
            video.muted = true;
            video.play()
              .catch(() => {});
          });
      }
    }

    function pauseVideo() {
      video.pause();
    }

    function resetVideoToStart() {
      clearTimeout(playTimer);
      playbackStarted = false;
      video.pause();
      try {
        video.currentTime = 0;
      } catch (_) {}
    }

    // A troca do texto acontece antes da reprodução.
    function startAfterScroll() {
      setActiveScreen(2);
      if (playbackStarted) return;
      playbackStarted = true;
      playTimer = window.setTimeout(() => {
        if (st.isActive && st.progress >= startThreshold) playVideo();
      }, 250);
    }

    // Atualiza apenas o texto ativo.
    function setActiveScreen(idx) {
      if (currentActiveIdx === idx) return;
      currentActiveIdx = idx;

      screens.forEach((screen) => {
        const sIdx = Number(screen.dataset.screenIdx);
        screen.classList.toggle('is-active', sIdx === idx);
      });
    }

    window.setTekmakAboutScreen = setActiveScreen;

    // Inicialização do estado
    resetVideoToStart();
    setActiveScreen(1);

    // Quando o vídeo termina completamente, mantém no último frame (impressora no showroom)
    video.addEventListener('ended', () => {
      setActiveScreen(2);
    });

    // ScrollTrigger principal com pin da seção
    const st = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: false,
      invalidateOnRefresh: true,
      onEnter: () => {
        setActiveScreen(1);
      },
      onEnterBack: () => {
        if (st.progress >= startThreshold) startAfterScroll();
      },
      onLeave: () => {
        clearTimeout(playTimer);
        playbackStarted = false;
        pauseVideo();
      },
      onLeaveBack: () => {
        resetVideoToStart();
        setActiveScreen(1);
      },
      onUpdate: (self) => {
        if (self.progress < startThreshold) {
          if (playbackStarted) resetVideoToStart();
          setActiveScreen(1);
        } else {
          startAfterScroll();
        }
      }
    });

    // Interação com o botão "ROLE PARA EXPLORAR"
    if (scrollCue) {
      scrollCue.addEventListener('click', () => {
        if (currentActiveIdx === 1) {
          const targetY = track.offsetTop + (track.offsetHeight * 0.55);
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        } else {
          const nextSec = document.getElementById('produtos') || document.querySelector('.sc-modal') || track.nextElementSibling;
          if (nextSec) {
            const nextY = track.offsetTop + track.offsetHeight;
            window.scrollTo({ top: nextY, behavior: 'smooth' });
          }
        }
      });
    }

    // Recalcula dimensões ao redimensionar ou rotacionar dispositivo
    window.addEventListener('resize', () => {
      ScrollTrigger.refresh();
    }, { passive: true });

    // Refresh inicial após carregamento completo
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initTekmakAbout, 60);
    });
  } else {
    setTimeout(initTekmakAbout, 60);
  }
})();
