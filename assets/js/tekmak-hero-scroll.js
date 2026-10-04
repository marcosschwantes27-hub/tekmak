/**
 * ==============================================================================
 * TEKMAK DO BRASIL — Hero Scroll Controller (Scroll-Locked Transitions)
 * assets/js/tekmak-hero-scroll.js
 *
 * Funcionalidades:
 * - Tela travada (locked) na Hero enquanto as imagens dos produtos vão passando
 * - Ordem rigorosa dos slides:
 *     01: Prensas Industriais Tekmak
 *     02: Impressoras Industriais Tekmak
 *     03: Insumos Industriais Tekmak
 *     04: Máquinas de Costura Industriais Sun Special
 * - Transição fluida e discrete a cada scroll (roda do mouse, trackpad, swipe ou setas)
 * - Liberação suave do scroll para a seção Sobre Nós (#quem-somos) após o último slide
 * - Retomada do travamento ao rolar de volta para o topo da página
 * - Proteção inteligente contra aceleração de trackpad (debounce e absorção de inércia)
 * - Sincronização em tempo real de:
 *     * Contador numérico ("01 / 04" a "04 / 04")
 *     * Nome do produto na pílula inferior
 *     * Traços indicadores (.hero-dash e .hero-dash-fill)
 *     * Tipografia editorial da esquerda (Título + Subtítulo + Botão de Ação)
 * - Desbloqueio transparente quando modals 3D estiverem abertos ou links do menu clicados
 * ==============================================================================
 */

(function () {
  'use strict';

  function initHeroScroll() {
    const heroEl = document.querySelector('#top');
    const carouselEl = document.getElementById('heroCarousel');
    if (!heroEl || !carouselEl) return;

    const slides = Array.from(carouselEl.querySelectorAll('.hero-slide'));
    if (!slides.length) return;

    // Elementos da interface gráfica
    const headlineEl = document.getElementById('heroHeadline');
    const descEl = document.getElementById('heroDescription');
    const btnTextEl = document.getElementById('heroBtnText');
    const btnEl = document.getElementById('heroBtn');
    const contentLeft = document.getElementById('heroContentLeft');
    const counterCurrent = document.getElementById('heroCounterCurrent');
    const pillName = document.getElementById('heroPillName');
    const dotsContainer = document.getElementById('heroDots');
    const dashes = dotsContainer ? Array.from(dotsContainer.querySelectorAll('.hero-dash')) : [];
    const backdropTextEl = document.getElementById('heroBackdropText');

    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');

    // Pre-decodificação de imagens para eliminar qualquer engasgo de renderização
    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (img && typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });

    // Parâmetros de controle e calibração
    const totalSlides = slides.length;
    let currentActiveIndex = 0;
    let isAnimating = false;

    // Atualiza todos os elementos visuais do slide selecionado
    function updateSlideUI(index, direction, isInit) {
      if (index < 0 || index >= totalSlides) return;
      const slide = slides[index];
      if (!slide) return;

      const dir = typeof direction === 'number' ? direction : 1;

      // 1. Alterna slides ativos com aceleração CSS
      slides.forEach((s, idx) => {
        const isActive = idx === index;
        s.classList.toggle('is-active', isActive);
        s.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      // 2. Contador numérico ("01" .. "04")
      if (counterCurrent) {
        counterCurrent.textContent = String(index + 1).padStart(2, '0');
        if (!isInit && typeof gsap !== 'undefined') {
          gsap.killTweensOf(counterCurrent);
          gsap.fromTo(
            counterCurrent,
            { opacity: 0.3, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
          );
        }
      }

      // 3. Nome do produto na pílula inferior
      if (pillName && slide.dataset.name) {
        pillName.textContent = slide.dataset.name;
        if (!isInit && typeof gsap !== 'undefined') {
          gsap.killTweensOf(pillName);
          gsap.fromTo(
            pillName,
            { opacity: 0.3, y: dir > 0 ? 5 : -5 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
          );
        }
      }

      // 4. Traços indicadores
      dashes.forEach((dash, dIdx) => {
        const isActive = dIdx === index;
        dash.classList.toggle('is-active', isActive);
        dash.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // 5. Tipografia da esquerda (Título + Descrição + Botão)
      const light = slide.dataset.titleLight || 'Máquinas';
      const b1 = slide.dataset.titleBold1 || 'industriais';
      const b2 = slide.dataset.titleBold2 || 'premium';
      const desc = slide.dataset.desc || '';
      const btnText = slide.dataset.btnText || 'Ver equipamentos 3D';
      const btnHref = slide.dataset.btnHref || '#showroomModal';
      const openShowroom = slide.dataset.btnShowroom || 'prensa';

      const applyText = () => {
        if (headlineEl) headlineEl.innerHTML = `${light}<br><b>${b1}</b><b>${b2}</b>`;
        if (descEl) descEl.innerHTML = desc;
        if (btnTextEl) btnTextEl.textContent = btnText;
        if (btnEl) {
          btnEl.setAttribute('href', btnHref);
          if (openShowroom) {
            btnEl.setAttribute('data-open-showroom', openShowroom);
          } else {
            btnEl.removeAttribute('data-open-showroom');
          }
        }
      };

      if (isInit) {
        applyText();
      } else if (contentLeft) {
        if (typeof gsap !== 'undefined') {
          gsap.killTweensOf(contentLeft);
          gsap.to(contentLeft, {
            opacity: 0.25,
            y: dir > 0 ? -6 : 6,
            duration: 0.16,
            ease: 'power1.out',
            onComplete: () => {
              applyText();
              gsap.to(contentLeft, {
                opacity: 1,
                y: 0,
                duration: 0.28,
                ease: 'power2.out'
              });
            }
          });
        } else {
          contentLeft.style.opacity = '0.3';
          setTimeout(() => {
            applyText();
            contentLeft.style.opacity = '1';
          }, 180);
        }
      }

      // 6. Letreiro Gigante de Estúdio ao Fundo (Backdrop Editorial)
      if (backdropTextEl) {
        const backdropWord = slide.dataset.backdrop || ['PRENSAS', 'UV TÊXTIL', 'INSUMOS', 'COSTURA'][index] || 'PRENSAS';
        if (isInit) {
          backdropTextEl.textContent = backdropWord;
          if (typeof gsap !== 'undefined') {
            gsap.set(backdropTextEl, { xPercent: -50, y: 0, opacity: 1 });
          } else {
            backdropTextEl.style.opacity = '1';
          }
        } else if (typeof gsap !== 'undefined') {
          gsap.killTweensOf(backdropTextEl);
          gsap.to(backdropTextEl, {
            opacity: 0,
            xPercent: -50,
            y: dir > 0 ? -16 : 16,
            duration: 0.16,
            ease: 'power1.out',
            onComplete: () => {
              backdropTextEl.textContent = backdropWord;
              gsap.fromTo(
                backdropTextEl,
                { opacity: 0, xPercent: -50, y: dir > 0 ? 16 : -16 },
                { opacity: 1, xPercent: -50, y: 0, duration: 0.32, ease: 'power2.out' }
              );
            }
          });
        } else {
          backdropTextEl.style.opacity = '0.2';
          setTimeout(() => {
            backdropTextEl.textContent = backdropWord;
            backdropTextEl.style.opacity = '1';
          }, 160);
        }
      }
    }

    // Transição para slide específico
    function goToSlide(targetIndex, direction, wrap) {
      if (isAnimating) return;

      let nextIdx = targetIndex;
      if (wrap) {
        if (nextIdx < 0) nextIdx = totalSlides - 1;
        if (nextIdx >= totalSlides) nextIdx = 0;
      } else {
        if (nextIdx < 0 || nextIdx >= totalSlides) return;
      }

      if (nextIdx === currentActiveIndex) return;

      const dir = typeof direction === 'number'
        ? direction
        : (nextIdx > currentActiveIndex ? 1 : -1);

      isAnimating = true;
      currentActiveIndex = nextIdx;

      updateSlideUI(currentActiveIndex, dir, false);
      resetAutoplay();

      setTimeout(() => {
        isAnimating = false;
      }, 520);
    }

    // Gerenciador de Autoplay (8 segundos) com pausa inteligente
    const AUTOPLAY_MS = 8000;
    let autoplayTimer = null;

    function startAutoplay() {
      stopAutoplay();
      if (document.body.classList.contains('sc-modal-open') || document.hidden) return;
      autoplayTimer = setInterval(() => {
        const nextIdx = (currentActiveIndex + 1) % totalSlides;
        goToSlide(nextIdx, 1, true);
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Navegação horizontal por toque; rolagem vertical permanece nativa.
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    heroEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    heroEl.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      if (isAnimating || isProgrammaticScrolling || document.body.classList.contains('sc-modal-open')) return;

      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;
      if (elapsed > 750) return;

      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      // Apenas swipe horizontal troca slide; swipe vertical rola a página.
      if (absX >= 30 && absX > absY * 1.1) {
        if (diffX < 0) {
          goToSlide(currentActiveIndex + 1, 1, true);
        } else {
          goToSlide(currentActiveIndex - 1, -1, true);
        }
        resetAutoplay();
      }
    }, { passive: true });

    // Botões Anterior / Próximo
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentActiveIndex - 1, -1, true);
        resetAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentActiveIndex + 1, 1, true);
        resetAutoplay();
      });
    }

    // Clique direto nos traços/dots indicadores
    dashes.forEach((dash) => {
      dash.addEventListener('click', (e) => {
        e.preventDefault();
        const target = parseInt(dash.getAttribute('data-slide'), 10);
        if (!isNaN(target) && target !== currentActiveIndex) {
          goToSlide(target, target > currentActiveIndex ? 1 : -1, false);
          resetAutoplay();
        }
      });
    });

    // Navegação por teclado
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (activeEl && activeEl.isContentEditable)) return;
      if (document.body.classList.contains('sc-modal-open')) return;

      const rect = heroEl.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && e.key === 'ArrowRight') {
        e.preventDefault();
        goToSlide(currentActiveIndex + 1, 1, true);
      } else if (rect.top < window.innerHeight && rect.bottom > 0 && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide(currentActiveIndex - 1, -1, true);
      }
    });

    // Pausa autoplay quando a aba estiver em segundo plano ou o showroom 3D abrir
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    if ('MutationObserver' in window) {
      new MutationObserver(() => {
        if (document.body.classList.contains('sc-modal-open')) stopAutoplay();
        else startAutoplay();
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    // Inicializa a interface com o Slide 0 (Prensas) imediatamente e inicia autoplay
    updateSlideUI(0, 0, true);
    startAutoplay();
    window.heroGoToSlide = (idx) => goToSlide(idx, 1, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScroll);
  } else {
    initHeroScroll();
  }
})();
