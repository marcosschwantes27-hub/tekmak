/**
 * ==============================================================================
 * TEKMAK DO BRASIL — Hero Carousel (Autoplay 8s · Zero GSAP · Ultra Leve)
 * assets/js/tekmak-hero-carousel.js
 *
 * Características:
 * - Passagem automática a cada 8 segundos (8000ms)
 * - 100% puro Vanilla JavaScript e aceleração nativa por CSS (Zero dependências / Zero GSAP)
 * - Transição fluida de imagens (Crossfade em 60/120 FPS cravados via GPU)
 * - Sincronização em tempo real de:
 *     * Contador ("01" / "04" .. "04" / "04")
 *     * Nome do produto na barra de controle ("#heroPillName")
 *     * Traços indicadores com barra de progresso de 8s (".hero-dash-fill")
 *     * Tipografia editorial da esquerda (Título + Subtítulo + Botão de Ação)
 * - Navegação interativa:
 *     * Botões circulares Anterior / Próximo
 *     * Clique direto em qualquer traço indicador
 *     * Gestos de swipe touch no mobile / tablet
 *     * Setas do teclado (← e →)
 * - Economia de recursos: pausa quando a aba estiver em segundo plano ou o carrossel fora de vista
 * ==============================================================================
 */

(function () {
  'use strict';

  const DURATION_MS = 8000; // tempo de leitura da hero por slide

  function initHeroCarousel() {
    const heroEl = document.querySelector('#top');
    const carouselEl = document.getElementById('heroCarousel');
    if (!heroEl || !carouselEl) return;

    const slides = Array.from(carouselEl.querySelectorAll('.hero-slide'));
    if (!slides.length) return;

    // Elementos da interface
    const headlineEl = document.getElementById('heroHeadline');
    const descEl = document.getElementById('heroDescription');
    const btnTextEl = document.getElementById('heroBtnText');
    const btnEl = document.getElementById('heroBtn');
    const contentLeft = document.getElementById('heroContentLeft');
    const counterCurrent = document.getElementById('heroCounterCurrent');
    const pillName = document.getElementById('heroPillName');
    const dotsContainer = document.getElementById('heroDots');
    const dashes = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.hero-dash')) : [];

    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');

    // Decodifica somente o próximo slide quando o navegador estiver livre.
    function prepareNextImage(index) {
      const img = slides[(index + 1) % slides.length].querySelector('img');
      if (!img || typeof img.decode !== 'function') return;
      const decode = () => {
        if (!document.body.classList.contains('sc-modal-open')) img.decode().catch(() => {});
      };
      if ('requestIdleCallback' in window) requestIdleCallback(decode, { timeout: 3000 });
      else setTimeout(decode, 1000);
    }

    let currentIndex = 0;
    let timer = null;
    let isVisible = true;

    // Atualiza a interface gráfica para o slide correspondente
    function updateUI(index, isInitial) {
      if (index < 0 || index >= slides.length) return;
      const slide = slides[index];
      if (!slide) return;

      // 1. Alterna classes ativas dos slides (transição feita via CSS nativo)
      slides.forEach((s, idx) => {
        const isActive = idx === index;
        s.classList.toggle('is-active', isActive);
        s.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      // 2. Contador numérico ("01" .. "04")
      if (counterCurrent) {
        counterCurrent.textContent = String(index + 1).padStart(2, '0');
      }

      // 3. Nome do produto na pílula inferior
      if (pillName && slide.dataset.name) {
        pillName.textContent = slide.dataset.name;
      }

    // 4. Traços indicadores e preenchimento de progresso
      dashes.forEach((dash, idx) => {
        const isActive = idx === index;
        dash.classList.toggle('is-active', isActive);
        dash.setAttribute('aria-selected', isActive ? 'true' : 'false');
        const fill = dash.querySelector('.hero-dash-fill');
        if (fill) {
          if (isActive) {
            fill.style.transition = 'none';
            fill.style.transform = 'scaleX(0)';
            void fill.offsetWidth;
            fill.style.transition = `transform ${DURATION_MS}ms linear`;
            fill.style.transform = 'scaleX(1)';
          } else {
            fill.style.transition = 'transform 0.2s ease-out';
            fill.style.transform = 'scaleX(0)';
          }
        }
      });

      // 5. Textos da coluna esquerda (crossfade sutil de 180ms)
      const light = slide.dataset.titleLight || 'Máquinas';
      const b1 = slide.dataset.titleBold1 || 'industriais';
      const b2 = slide.dataset.titleBold2 || 'premium';
      const desc = slide.dataset.desc || '';
      const btnText = slide.dataset.btnText || 'Ver equipamentos 3D';
      const btnHref = slide.dataset.btnHref || '#showroomModal';
      const openShowroom = slide.dataset.btnShowroom || 'tk1908';

      const applyContent = () => {
        if (headlineEl) headlineEl.innerHTML = `${light}<br><b>${b1}</b><b>${b2}</b>`;
        if (descEl) descEl.textContent = desc;
        if (btnTextEl) btnTextEl.textContent = btnText;
        if (btnEl) {
          btnEl.setAttribute('href', btnHref);
          btnEl.setAttribute('data-open-showroom', openShowroom);
        }
      };

      if (isInitial) {
        applyContent();
        if (contentLeft) {
          contentLeft.style.opacity = '1';
          contentLeft.style.transform = 'translateY(0)';
        }
      } else {
        // Fade out sutil (~180ms) sincronizado
        if (contentLeft) {
          contentLeft.style.opacity = '0.3';
          contentLeft.style.transform = 'translateY(4px)';
        }

        setTimeout(() => {
          applyContent();
          if (contentLeft) {
            contentLeft.style.opacity = '1';
            contentLeft.style.transform = 'translateY(0)';
          }
        }, 180);
      }
    }

    // Muda para um slide específico
    function goToSlide(targetIndex) {
      let nextIdx = targetIndex;
      if (nextIdx >= slides.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = slides.length - 1;

      currentIndex = nextIdx;
      updateUI(currentIndex, false);
      prepareNextImage(currentIndex);
      resetAutoplay();
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    // Gerenciador de Autoplay (8 segundos)
    function startAutoplay() {
      stopAutoplay();
      if (!isVisible || document.hidden || document.body.classList.contains('sc-modal-open')) return;
      timer = setInterval(() => {
        nextSlide();
      }, DURATION_MS);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Interações do usuário
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextSlide();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevSlide();
      });
    }
    dashes.forEach((dash) => {
      dash.addEventListener('click', (e) => {
        e.preventDefault();
        const slideIdx = parseInt(dash.getAttribute('data-slide'), 10);
        if (!isNaN(slideIdx) && slideIdx !== currentIndex) {
          goToSlide(slideIdx);
        }
      });
    });

    // Gestos de Swipe no Mobile / Touch
    let touchStartX = 0;
    let touchStartY = 0;
    heroEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    heroEl.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
        if (diffX < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }, { passive: true });

    // Navegação por teclado quando o carrossel estiver visível
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const rect = heroEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (e.key === 'ArrowRight') {
          nextSlide();
        } else if (e.key === 'ArrowLeft') {
          prevSlide();
        }
      }
    });

    // Economia de recursos: pausar quando fora da tela
    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.1 });
      heroObserver.observe(heroEl);
    }

    // Pausa a hero enquanto o showroom 3D cobre a página.
    let showroomCovered = false;
    new MutationObserver(() => {
      const covered = document.body.classList.contains('sc-modal-open');
      if (covered === showroomCovered) return;
      showroomCovered = covered;
      if (covered) {
        stopAutoplay();
        const fill = dashes[currentIndex]?.querySelector('.hero-dash-fill');
        if (fill) fill.style.transition = 'none';
      } else {
        updateUI(currentIndex, true);
        startAutoplay();
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Pausar autoplay quando a aba for minimizada ou estiver em segundo plano
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    // Abrir com a composição de prensas da hero
    updateUI(currentIndex, true);
    prepareNextImage(currentIndex);
    startAutoplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroCarousel);
  } else {
    initHeroCarousel();
  }
})();
