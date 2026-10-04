(function () {
  'use strict';
  const commonScripts = [
    'assets/js/three.min.js',
    'assets/js/meshopt_decoder.js',
    'assets/js/GLTFLoader.js'
  ];
  const showroomScripts = {
    maquinas: 'assets/js/tekmak-showcase-carousel-3d.js?v=137',
    prensa: 'assets/js/tekmak-prensa-showroom-3d.js?v=29',
    costura: 'assets/js/tekmak-costura-showroom.js?v=3'
  };
  const scriptLoads = new Map();
  let commonLoad;
  const showroomLoads = {};
  const failedKinds = new Set();
  let pendingOpen = null;
  let pendingId = 0;

  function addScript(src) {
    if (scriptLoads.has(src)) return scriptLoads.get(src);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        scriptLoads.delete(src);
        reject(new Error('Falha ao carregar ' + src));
      };
      document.body.appendChild(script);
    });
    scriptLoads.set(src, promise);
    return promise;
  }

  function loadShowroom(kind) {
    if (kind === 'costura') {
      if (!showroomLoads.costura) {
        showroomLoads.costura = addScript(showroomScripts.costura).catch(err => {
          showroomLoads.costura = null;
          throw err;
        });
      }
      return showroomLoads.costura;
    }

    if (!commonLoad) {
      commonLoad = Promise.all(commonScripts.map(addScript))
        .catch(error => { commonLoad = null; throw error; });
    }
    if (!showroomLoads[kind]) {
      showroomLoads[kind] = commonLoad.then(async () => {
        if (kind === 'prensa') {
          await addScript('assets/js/tekmak-prensa-dupla-ciclo.js?v=1');
          await addScript('assets/js/tekmak-prensa-compacta-ciclo.js?v=1');
        }
        return addScript(showroomScripts[kind]);
      })
        .catch(error => { showroomLoads[kind] = null; throw error; });
    }
    return showroomLoads[kind];
  }

  function hydrateModalImages(kind) {
    let modalId = 'showroomModal';
    if (kind === 'costura') modalId = 'showroomModalCostura';
    else if (kind === 'prensa') modalId = 'showroomModalPrensa';

    document.querySelectorAll(`#${modalId} img[data-src]`).forEach(img => {
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
  }

  function modalFor(kind) {
    if (kind === 'costura') return document.getElementById('showroomModalCostura');
    return document.getElementById(kind === 'prensa' ? 'showroomModalPrensa' : 'showroomModal');
  }

  function loadingIndicator(kind) {
    if (kind === 'costura') return null;
    return document.getElementById(kind === 'prensa' ? 'scPrensaLoader' : 'scLoader');
  }

  function cancelPending() {
    if (!pendingOpen) return;
    const kind = pendingOpen.kind;
    pendingOpen = null;
    pendingId++;
    const modal = modalFor(kind);
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
    const indicator = loadingIndicator(kind);
    indicator?.classList.remove('is-active', 'is-error');
    const label = indicator?.querySelector('span');
    if (label) label.textContent = kind === 'prensa' ? 'Carregando prensa 3D...' : 'Carregando máquina 3D...';
    if (!document.querySelector('#showroomModal.is-open, #showroomModalPrensa.is-open, #showroomModalCostura.is-open')) {
      document.body.classList.remove('sc-modal-open');
    }
  }

  function closeAllModals() {
    ['showroomModal', 'showroomModalPrensa', 'showroomModalCostura'].forEach(id => {
      const m = document.getElementById(id);
      if (m) {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      }
    });
  }

  document.addEventListener('click', event => {
    // Fechamento de modal ao clicar no X ou Backdrop
    if (event.target.closest('#scModalClose, #scModalBackdrop, #scModalPrensaClose, #scModalPrensaBackdrop, #scModalCosturaClose, #scModalCosturaBackdrop')) {
      event.preventDefault();
      closeAllModals();
      document.body.classList.remove('sc-modal-open');
      if (pendingOpen) cancelPending();
      return;
    }

    const trigger = event.target.closest('[data-open-showroom], a[href="#showroomModal"], a[href="#showroomModalPrensa"], a[href="#showroomPrensa"], a[href="#showroomModalCostura"], a[href="#showroomCostura"]');
    if (!trigger) return;

    const key = trigger.dataset.openShowroom || '';
    const href = trigger.getAttribute('href') || '';
    let kind = 'maquinas';
    if (key === 'costura' || /Costura/i.test(href)) {
      kind = 'costura';
    } else if (key === 'prensa' || key === 'prensas' || /Prensa/i.test(href)) {
      kind = 'prensa';
    }

    // Fecha qualquer modal atualmente aberto para alternar abas de forma limpa
    closeAllModals();

    const api = kind === 'costura' ? window.tekmakCosturaShowroom : (kind === 'prensa' ? window.tekmakPrensaShowroom : window.tekmakShowroom);
    if (pendingOpen) cancelPending();

    if (api && !failedKinds.has(kind)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const modal = modalFor(kind);
      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }
      document.body.classList.add('sc-modal-open');
      hydrateModalImages(kind);
      api.open(kind === 'costura' ? (key && key !== 'costura' ? key : undefined) : (kind === 'prensa' ? (key && key !== 'prensa' && key !== 'prensas' ? key : undefined) : key || 'tk1908'));
      return;
    }

    event.preventDefault();
    if (api) event.stopImmediatePropagation();
    const token = ++pendingId;
    pendingOpen = { kind, token };
    const modal = modalFor(kind);
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('sc-modal-open');
    loadingIndicator(kind)?.classList.add('is-active');

    requestAnimationFrame(() => setTimeout(() => {
      if (pendingOpen?.token !== token) return;
      loadShowroom(kind).then(() => {
        if (pendingOpen?.token !== token) return;
        loadingIndicator(kind)?.classList.remove('is-active');
        hydrateModalImages(kind);
        const showroom = kind === 'costura' ? window.tekmakCosturaShowroom : (kind === 'prensa' ? window.tekmakPrensaShowroom : window.tekmakShowroom);
        if (!showroom?.open) throw new Error('Showroom indisponível');
        showroom.open(kind === 'costura' ? (key && key !== 'costura' ? key : undefined) : (kind === 'prensa' ? (key && key !== 'prensa' && key !== 'prensas' ? key : undefined) : key || 'tk1908'));
        failedKinds.delete(kind);
        pendingOpen = null;
      }).catch(error => {
        if (pendingOpen?.token !== token) return;
        failedKinds.add(kind);
        const indicator = loadingIndicator(kind);
        indicator?.classList.add('is-active', 'is-error');
        const label = indicator?.querySelector('span');
        if (label) label.textContent = 'Não foi possível carregar o showroom. Feche e tente novamente.';
        console.error(error);
      });
    }, 0));
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (pendingOpen) cancelPending();
      closeAllModals();
      document.body.classList.remove('sc-modal-open');
    }
  });

  // Aquece um modelo de cada showroom quando o visitante se aproxima dos produtos.
  // Mantém o carregamento sob demanda e evita tráfego em conexões econômicas ou lentas.
  const productsSection = document.getElementById('produtos');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const skipAutomaticPreload = connection?.saveData ||
    /^(slow-)?2g$/.test(connection?.effectiveType || '') ||
    typeof window.WebGLRenderingContext === 'undefined';
  let productsNearby = false;
  let preloadScheduled = false;
  let machinePreloadAttempted = false;
  let machinePreloadPromise = null;
  let pressPreloadAttempted = false;
  let pressPreloadPromise = null;
  let pressPreloadScheduled = false;

  function whenIdle(callback) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: 2200 });
    } else {
      window.setTimeout(callback, 450);
    }
  }

  async function warmShowroom(kind, modelId) {
    try {
      await loadShowroom(kind);
      const showroom = kind === 'prensa' ? window.tekmakPrensaShowroom : window.tekmakShowroom;
      if (typeof showroom?.preload === 'function') await showroom.preload(modelId);
      return true;
    } catch (error) {
      // A falha do pré-carregamento não bloqueia a abertura normal do showroom.
      console.info('Pré-carregamento 3D adiado; o modelo será carregado ao abrir o showroom.', error);
      return false;
    }
  }

  function scheduleAutomaticPreload() {
    if (!productsNearby || document.hidden || skipAutomaticPreload || preloadScheduled) return;

    preloadScheduled = true;
    whenIdle(async () => {
      preloadScheduled = false;
      if (!productsNearby || document.hidden || skipAutomaticPreload) return;

      if (!machinePreloadAttempted) {
        machinePreloadAttempted = true;
        machinePreloadPromise = warmShowroom('maquinas', 'tk1908');
      }
      if (machinePreloadPromise) await machinePreloadPromise;
      machinePreloadPromise = null;
      if (pressPreloadPromise) await pressPreloadPromise;

      if (!productsNearby || document.hidden || pressPreloadScheduled || pressPreloadAttempted) return;
      pressPreloadScheduled = true;
      whenIdle(async () => {
        pressPreloadScheduled = false;
        if (!productsNearby || document.hidden || skipAutomaticPreload || pressPreloadAttempted) return;
        pressPreloadAttempted = true;
        pressPreloadPromise = warmShowroom('prensa', 'prensa-industrial-dupla');
        await pressPreloadPromise;
        pressPreloadPromise = null;
      });
    });
  }

  if (productsSection && 'IntersectionObserver' in window && !skipAutomaticPreload) {
    const productsObserver = new IntersectionObserver(entries => {
      productsNearby = entries.some(entry => entry.isIntersecting);
      scheduleAutomaticPreload();
    }, { rootMargin: '650px 0px' });

    productsObserver.observe(productsSection);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleAutomaticPreload();
    });
  }

  if (location.hash === '#showroomModal' || location.hash === '#showroomModalPrensa' || location.hash === '#showroomPrensa' || location.hash === '#showroomModalCostura' || location.hash === '#showroomCostura') {
    let kind = 'maquinas';
    if (/Costura/i.test(location.hash)) kind = 'costura';
    else if (/Prensa/i.test(location.hash)) kind = 'prensa';

    loadShowroom(kind).then(() => {
      hydrateModalImages(kind);
      const api = kind === 'costura' ? window.tekmakCosturaShowroom : (kind === 'prensa' ? window.tekmakPrensaShowroom : window.tekmakShowroom);
      if (api?.open) api.open();
    }).catch(console.error);
  }
})();
