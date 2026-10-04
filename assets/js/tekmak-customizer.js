/**
 * TEKMAK DO BRASIL — ESTÚDIO "MONTAR SUA PEÇA"
 * Motor interativo de seleção de camisetas (Tela 01) e desenho livre com insumos Tekmak (Tela 02).
 */
(function() {
  'use strict';

  // Elementos principais
  const modal = document.getElementById('tekCustomizerModal');
  const closeBtn = document.getElementById('tekCustomizerClose');
  const step1 = document.getElementById('tekStep1');
  const step2 = document.getElementById('tekStep2');

  if (!modal || !step1 || !step2) return;

  // Estado da Aplicação
  const state = {
    selectedShirt: 'white', // 'white' | 'navy' | 'black'
    activeTool: 'brush',    // 'brush' | 'eraser'
    activeInk: 'ciano',     // 'ciano' | 'magenta' | 'amarelo' | 'preto' | 'custom'
    brushColor: '#00a0e9',  // padrão: Ciano Tekmak
    brushSize: 8,
    isDrawing: false,
    undoStack: [],
    maxUndo: 25
  };

  const inkColors = {
    ciano: '#00a0e9',
    magenta: '#e6007e',
    amarelo: '#ffed00',
    preto: '#151515'
  };

  // Imagens da Tela 1 para cada estado de seleção
  const step1BgImages = {
    white: 'assets/screen1_white.webp',
    navy: 'assets/screen1_navy.webp',
    black: 'assets/screen1_black.webp'
  };

  // Frascos de tintas Tekmak (selecionado vs desselecionado)
  const bottleAssets = {
    ciano: {
      sel: 'assets/bottle_card_ciano_sel.webp',
      unsel: 'assets/bottle_card_ciano_unsel.webp'
    },
    magenta: {
      sel: 'assets/bottle_card_magenta_sel.webp',
      unsel: 'assets/bottle_card_magenta_unsel.webp'
    },
    amarelo: {
      sel: 'assets/bottle_card_amarelo_sel.webp',
      unsel: 'assets/bottle_card_amarelo_unsel.webp'
    },
    preto: {
      sel: 'assets/bottle_card_preto_sel.webp',
      unsel: 'assets/bottle_card_preto_unsel.webp'
    }
  };

  // ============================================================
  // TELA 1 — SELEÇÃO DE CAMISETA
  // ============================================================
  const s1BgImg = document.getElementById('tekS1BgImg');
  const hotspots = document.querySelectorAll('.tek-s1-hotspot');
  const s1ContinueBtn = document.getElementById('tekS1ContinueBtn');

  function selectShirt(shirtKey) {
    if (!step1BgImages[shirtKey]) return;
    state.selectedShirt = shirtKey;
    if (s1BgImg) {
      s1BgImg.src = step1BgImages[shirtKey];
    }
  }

  hotspots.forEach(spot => {
    spot.addEventListener('click', () => {
      const shirt = spot.getAttribute('data-shirt');
      selectShirt(shirt);
    });
  });

  if (s1ContinueBtn) {
    s1ContinueBtn.addEventListener('click', () => {
      goToStep(2);
    });
  }

  // ============================================================
  // TELA 2 — MOTOR DE DESENHO LIVRE & INSUMOS TEKMAK
  // ============================================================
  const canvas = document.getElementById('tekmakDrawCanvas');
  const canvasContainer = document.querySelector('.tek-canvas-container');
  let ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;

  const toolBrush = document.getElementById('tekToolBrush');
  const toolEraser = document.getElementById('tekToolEraser');
  const toolUndo = document.getElementById('tekToolUndo');
  const toolSlider = document.getElementById('tekToolSlider');
  const presetDots = document.querySelectorAll('.tek-tb-dot-btn');
  const bottleSlots = document.querySelectorAll('.tek-bottle-slot');
  const mixColorsBtn = document.getElementById('tekMixColorsBtn');
  const nativeColorPicker = document.getElementById('tekNativeColorPicker');
  const s2BackBtn = document.getElementById('tekS2BackBtn');
  const s2ViewShirtBtn = document.getElementById('tekS2ViewShirtBtn');

  // Ajuste de resolução do Canvas (HiDPI / Retina)
  let canvasLogicalW = 636;
  let canvasLogicalH = 408;

  function initCanvasSize() {
    if (!canvas || !canvasContainer) return;
    const rect = canvasContainer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    // Guarda o desenho atual se houver
    let tempImgData = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        tempImgData = canvas.toDataURL();
      } catch (_) {}
    }

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvasLogicalW = rect.width;
    canvasLogicalH = rect.height;

    ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Restaura desenho se existia
    if (tempImgData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasLogicalW, canvasLogicalH);
      };
      img.src = tempImgData;
    } else {
      // Salva snapshot inicial (vazio)
      saveCanvasState();
    }
  }

  function saveCanvasState() {
    if (!canvas) return;
    try {
      if (state.undoStack.length >= state.maxUndo) {
        state.undoStack.shift();
      }
      state.undoStack.push(canvas.toDataURL());
    } catch (_) {}
  }

  function undoStroke() {
    if (state.undoStack.length <= 1) return;
    state.undoStack.pop(); // Remove estado atual
    const prevState = state.undoStack[state.undoStack.length - 1];
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.drawImage(img, 0, 0, canvasLogicalW, canvasLogicalH);
    };
    img.src = prevState;
  }

  // Traçado Suave com Curvas de Bézier
  let points = [];

  function getCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
    const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches[0] ? event.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDrawing(e) {
    if (!ctx) return;
    state.isDrawing = true;
    points = [];
    const p = getCanvasCoords(e);
    points.push(p);

    ctx.save();
    if (state.activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = state.brushColor;
      ctx.fillStyle = state.brushColor;
    }
    ctx.lineWidth = state.brushSize;

    // Ponto inicial
    ctx.beginPath();
    ctx.arc(p.x, p.y, state.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMove(e) {
    if (!state.isDrawing || !ctx) return;
    const p = getCanvasCoords(e);
    points.push(p);

    if (points.length < 3) {
      const b = points[0];
      ctx.beginPath();
      ctx.arc(b.x, b.y, state.brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Suavização por pontos médios (Midpoint quadratic bezier)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 2; i++) {
      const c = (points[i].x + points[i + 1].x) / 2;
      const d = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, c, d);
    }

    // Dois últimos pontos
    const i = points.length - 2;
    ctx.quadraticCurveTo(
      points[i].x,
      points[i].y,
      points[i + 1].x,
      points[i + 1].y
    );
    ctx.stroke();
  }

  function stopDrawing() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    points = [];
    ctx.restore();
    saveCanvasState();
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      startDrawing(e);
    });
    canvas.addEventListener('pointermove', drawMove);
    canvas.addEventListener('pointerup', (e) => {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      stopDrawing();
    });
    canvas.addEventListener('pointercancel', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);
  }

  // ============================================================
  // FERRAMENTAS (PINCEL, BORRACHA, DESFAZER, SLIDER)
  // ============================================================
  function setTool(toolName) {
    state.activeTool = toolName;
    if (toolBrush) toolBrush.classList.toggle('is-active', toolName === 'brush');
    if (toolEraser) toolEraser.classList.toggle('is-active', toolName === 'eraser');
  }

  if (toolBrush) {
    toolBrush.addEventListener('click', () => setTool('brush'));
  }

  if (toolEraser) {
    toolEraser.addEventListener('click', () => setTool('eraser'));
  }

  if (toolUndo) {
    toolUndo.addEventListener('click', undoStroke);
  }

  function updateBrushSize(val) {
    const size = parseInt(val, 10) || 8;
    state.brushSize = size;
    if (toolSlider) {
      toolSlider.value = size;
      const pct = ((size - 2) / (40 - 2)) * 100;
      toolSlider.style.setProperty('--slider-pct', `${pct}%`);
    }
    presetDots.forEach(btn => {
      const dotSize = parseInt(btn.getAttribute('data-size'), 10);
      btn.classList.toggle('is-active', Math.abs(dotSize - size) <= 2);
    });
  }

  if (toolSlider) {
    toolSlider.addEventListener('input', (e) => {
      updateBrushSize(e.target.value);
    });
  }

  presetDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const s = dot.getAttribute('data-size');
      updateBrushSize(s);
    });
  });

  // ============================================================
  // SELEÇÃO DE TINTAS TEKMAK
  // ============================================================
  function selectInk(inkKey) {
    state.activeInk = inkKey;
    if (inkColors[inkKey]) {
      state.brushColor = inkColors[inkKey];
    }
    setTool('brush'); // Voltar para pincel se estiver na borracha

    // Atualiza visual dos 4 frascos
    bottleSlots.forEach(slot => {
      const key = slot.getAttribute('data-ink');
      const img = slot.querySelector('img');
      if (img && bottleAssets[key]) {
        img.src = (key === inkKey) ? bottleAssets[key].sel : bottleAssets[key].unsel;
      }
    });
  }

  bottleSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      const ink = slot.getAttribute('data-ink');
      selectInk(ink);
    });
  });

  // Misturar Cores
  if (mixColorsBtn && nativeColorPicker) {
    mixColorsBtn.addEventListener('click', () => {
      nativeColorPicker.click();
    });

    nativeColorPicker.addEventListener('input', (e) => {
      state.brushColor = e.target.value;
      state.activeInk = 'custom';
      setTool('brush');
      // Desmarca frascos
      bottleSlots.forEach(slot => {
        const key = slot.getAttribute('data-ink');
        const img = slot.querySelector('img');
        if (img && bottleAssets[key]) {
          img.src = bottleAssets[key].unsel;
        }
      });
    });
  }

  // Navegação Tela 2
  if (s2BackBtn) {
    s2BackBtn.addEventListener('click', () => {
      goToStep(1);
    });
  }

  // ============================================================
  // CONTROLE DE NAVEGAÇÃO DE PASSOS (STEPS)
  // ============================================================
  function goToStep(stepNum) {
    [step1, step2].forEach(s => s.classList.remove('is-visible'));

    if (stepNum === 1) {
      step1.classList.add('is-visible');
    } else if (stepNum === 2) {
      step2.classList.add('is-visible');
      setTimeout(initCanvasSize, 50);
    }
  }

  // ============================================================
  // ABERTURA E FECHAMENTO DO MODAL
  // ============================================================
  function openCustomizer() {
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    goToStep(1);
  }

  function closeCustomizer() {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCustomizer);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeCustomizer();
    }
  });

  // Botões de Abertura pelo site
  const openButtons = document.querySelectorAll('.tek-customizer-open-btn, [href="#montar-sua-peca"], [href="#personalizar-peca"]');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCustomizer();
    });
  });

  // Janela redimensionada
  window.addEventListener('resize', () => {
    if (step2.classList.contains('is-visible')) {
      initCanvasSize();
    }
  });

  // Exporta função global
  window.TekmakCustomizer = {
    open: openCustomizer,
    close: closeCustomizer,
    selectShirt: selectShirt,
    goToStep: goToStep
  };

  // Inicializa slider visual
  updateBrushSize(8);
})();
