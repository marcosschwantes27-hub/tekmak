/* ==============================================================================
   TEKMAK DO BRASIL — Carrossel 3D de Máquinas Split Layout (Padrão ApeChain)
   Three.js r128 + MeshoptDecoder — 1 Máquina por vez na direita, sem base circular.
   ============================================================================== */

(function initTekmakShowcaseCarousel() {
  'use strict';

  const stage = document.getElementById('showcase3dStage');
  const canvas = document.getElementById('showcase3dCanvas');
  const showroomModal = document.getElementById('showroomModal');
  const scModalClose = document.getElementById('scModalClose');
  const scModalBackdrop = document.getElementById('scModalBackdrop');
  if (!stage || !canvas || typeof THREE === 'undefined') return;

  // ----------------------------------------------------------------------------
  // DADOS DAS 3 MÁQUINAS COM MODELAGEM 3D REAL (1ª MÁQUINA: TK1804i 1,80m)
  // ----------------------------------------------------------------------------
  // DADOS DAS 3 MÁQUINAS COM MODELAGEM 3D REAL (1ª MÁQUINA: TK1804i 1,80m)
  // ----------------------------------------------------------------------------
  const MACHINES = [
    {
      id: 'tk1908',
      watermark: 'TK-1908i',
      category: 'SUBLIMAÇÃO INDUSTRIAL · 8 CABEÇAS EPSON',
      titleId: 'TK-1908i',
      titleSub: 'SUBLIMÁTICA 1,80M',
      speedHighlight: '<span>1 PASS: 320 m²/h</span><span class="sc-sh-div">|</span><span>2 PASS: 160 m²/h</span>',
      desc: 'Desenvolvida para alta velocidade e produção contínua em escala industrial. Equipada com 8 cabeças Epson i3200-A1, placa Hoson e tanque de 4 litros.',
      specs: [
        { k: 'LARGURA DE IMPRESSÃO', v: '1,80 m' },
        { k: 'VELOCIDADE EM 1 PASS', v: 'Até 320 m²/h' },
        { k: 'VELOCIDADE EM 2 PASS', v: 'Até 160 m²/h' },
        { k: 'PLACA ELETRÔNICA', v: 'Hoson Original' },
        { k: 'CABEÇAS DE IMPRESSÃO', v: '8× Epson i3200-A1' },
        { k: 'SISTEMA INDUSTRIAL', v: 'Tanque 4L • Rebobinador' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK-1908i',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora sublimática TK-1908i 1,80m',
      appsSubtitle: 'ESTAMPARIAS &amp; CONFECÇÕES EM ESCALA',
      examples: [
        { img: 'assets/products/uniformes-esportivos.webp', title: 'Uniformes Esportivos', label: 'UNIFORMES<br>ESPORTIVOS' },
        { img: 'assets/products/moda-praia-fitness.webp', title: 'Moda Praia e Fitness', label: 'MODA PRAIA<br>&amp; FITNESS' },
        { img: 'assets/products/banners-cenografia.webp', title: 'Banners e Cenografia', label: 'BANNERS &amp;<br>CENOGRAFIA' }
      ],
      path: 'assets/TK1908.glb?v=1',
      scale: 0.828,
      offsetX: 0.22,
      offsetY: -0.01,
      shadowScale: 1.25,
      hasDescription: true
    },
    {
      id: 'tk1802i',
      watermark: 'TK1802I',
      category: 'SUBLIMAÇÃO INDUSTRIAL · 2 CABEÇAS EPSON',
      titleId: 'TK1802I',
      titleSub: 'SUBLIMÁTICA 1,80M',
      speedHighlight: '<span>2 PASS: 90 m²/h</span><span class="sc-sh-div">|</span><span>4 PASS: 45 m²/h</span>',
      desc: 'A TK1802i é uma impressora sublimática de alta precisão na impressão. Ideal para confecções que buscam alta produtividade, estabilidade e qualidade de impressão.',
      specs: [
        { k: 'LARGURA DE IMPRESSÃO', v: '1,80 m' },
        { k: 'VELOCIDADE EM 2 PASS', v: 'Até 90 m²/h' },
        { k: 'VELOCIDADE EM 4 PASS', v: 'Até 45 m²/h' },
        { k: 'PLACA', v: 'Hoson Original' },
        { k: 'CABEÇAS', v: '2× Epson i3200-A1' },
        { k: 'CORES & APLICAÇÃO', v: 'CMYK • Papel Sublimação' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK1802I',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora TK1802i 1,80m',
      appsSubtitle: 'CONFECÇÕES &amp; MODA ESPORTIVA',
      examples: [
        { img: 'assets/products/app_moda_esportiva.jpg', title: 'Moda Esportiva', label: 'MODA<br>ESPORTIVA' },
        { img: 'assets/products/app_tecido_decoracao.jpg', title: 'Tecido e Decoração', label: 'TECIDO E<br>DECORAÇÃO' },
        { img: 'assets/products/app_personalizados_brindes.jpg', title: 'Personalizados e Brindes', label: 'PERSONALIZADOS<br>E BRINDES' }
      ],
      path: 'assets/TK1802I.glb?v=6',
      scale: 0.8316,
      offsetX: 0.22,
      offsetY: -0.01,
      shadowScale: 1.21,
      hasDescription: true
    },
    {
      id: 'tk1804i',
      watermark: 'TK1804I',
      category: 'SUBLIMAÇÃO INDUSTRIAL · ALTA PRODUTIVIDADE',
      titleId: 'TK1804I',
      titleSub: 'SUBLIMÁTICA 1,80M',
      speedHighlight: '<span>1 PASS: 145 m²/h</span><span class="sc-sh-div">|</span><span>4 PASS: 75 m²/h</span>',
      desc: 'Desenvolvida para grandes volumes industriais com velocidade e estabilidade ininterrupta. Equipada com 4 cabeças Epson i3200-A1, placa Hoson e rebobinador industrial contínuo.',
      specs: [
        { k: 'LARGURA DE IMPRESSÃO', v: '1,80 m' },
        { k: 'VELOCIDADE EM 1 PASS', v: 'Até 145 m²/h' },
        { k: 'VELOCIDADE EM 4 PASS', v: 'Até 75 m²/h' },
        { k: 'PLACA', v: 'Hoson Original' },
        { k: 'CABEÇAS', v: '4× Epson i3200-A1' },
        { k: 'CORES & APLICAÇÃO', v: 'CMYK • Papel Sublimação' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK1804I',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora TK1804i 1,80m',
      appsSubtitle: 'GRANDES VOLUMES INDUSTRIAIS',
      examples: [
        { img: 'assets/products/uniformes-esportivos.webp', title: 'Uniformes Esportivos', label: 'UNIFORMES<br>ESPORTIVOS' },
        { img: 'assets/products/banners-cenografia.webp', title: 'Banners e Comunicação', label: 'BANNERS &amp;<br>COMUNICAÇÃO' },
        { img: 'assets/products/abadas-micareta.webp', title: 'Abadás e Eventos', label: 'ABADÁS &amp;<br>EVENTOS' }
      ],
      path: 'assets/tekmak-printer.glb?v=9',
      scale: 0.84645,
      offsetX: 0.26,
      offsetY: -0.02,
      shadowScale: 1.529,
      hasDescription: true
    },
    {
      id: 'tk1301i',
      watermark: 'TK1301I',
      category: 'SUBLIMAÇÃO PROFISSIONAL · O COMEÇO IDEAL',
      titleId: 'TK1301I',
      titleSub: 'SUBLIMÁTICA 1,30M',
      speedHighlight: '<span>2 PASS: 40 m²/h</span><span class="sc-sh-div">|</span><span>4 PASS: 24 m²/h</span>',
      desc: 'A TK1301i foi desenvolvida para quem deseja começar na sublimação com um equipamento profissional, oferecendo qualidade incomparável, robustez e excelente custo-benefício.',
      specs: [
        { k: 'LARGURA DE IMPRESSÃO', v: '1,30 m' },
        { k: 'VELOCIDADE EM 2 PASS', v: 'Até 40 m²/h' },
        { k: 'VELOCIDADE EM 4 PASS', v: 'Até 24 m²/h' },
        { k: 'PLACA', v: 'Hoson Original' },
        { k: 'CABEÇA', v: '1× Epson i3200-A1' },
        { k: 'CORES & APLICAÇÃO', v: 'CMYK • Papel Sublimação' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK1301I',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora TK1301i 1,30m',
      appsSubtitle: 'INÍCIO PROFISSIONAL &amp; BRINDES',
      examples: [
        { img: 'assets/products/audley/tk1301i-mousepad.png', title: 'Mousepads Gamer', label: 'MOUSEPADS<br>GAMER' },
        { img: 'assets/products/audley/tk1301i-ecobag.png', title: 'Ecobags e Brindes', label: 'ECOBAGS &amp;<br>BRINDES' },
        { img: 'assets/products/brindes-sublimados.webp', title: 'Canecas e Almofadas', label: 'CANECAS &amp;<br>ALMOFADAS' }
      ],
      path: 'assets/TK1301i.glb?v=8',
      scale: 1.05615,
      offsetX: 0.24,
      offsetY: -0.25,
      shadowScale: 1.4784,
      hasDescription: true
    },
    {
      id: 'dtf-compacta',
      watermark: 'TK-3002I',
      category: 'IMPRESSÃO DTF TÊXTIL · A3 INDUSTRIAL',
      titleId: 'TK-3002I',
      titleSub: 'A3 DTF PRINTER · 30CM',
      speedHighlight: '<span>4 PASS: 12 m²/h</span><span class="sc-sh-div">|</span><span>6 PASS: 6,5 m²/h</span>',
      desc: 'Impressora DTF industrial com 2 cabeças Epson i1600-A1 e forno shaker integrado. Ideal para personalização rápida sobre qualquer tipo de tecido.',
      specs: [
        { k: 'LARGURA DE TRABALHO', v: 'Até 30 cm (A3)' },
        { k: 'VELOCIDADE EM 4 PASS', v: 'Até 12 m²/h' },
        { k: 'VELOCIDADE EM 6 PASS', v: 'Até 6,5 m²/h' },
        { k: 'PLACA ELETRÔNICA', v: 'Hoson Original' },
        { k: 'CABEÇAS DE IMPRESSÃO', v: '2× Epson i1600-A1' },
        { k: 'TINTA & CORES', v: 'Pigmentada · CMYK+W' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK-3002I',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora DTF TK-3002i 30cm',
      appsSubtitle: 'PERSONALIZAÇÃO TÊXTIL TOTAL',
      examples: [
        { img: 'assets/products/camisetas-algodao-dtf.webp', title: 'Camisetas Algodão', label: 'CAMISETAS<br>ALGODÃO' },
        { img: 'assets/products/bones-ecobags-dtf.webp', title: 'Bonés e Acessórios', label: 'BONÉS &amp;<br>ACESSÓRIOS' },
        { img: 'assets/products/moletom-streetwear-dtf.webp', title: 'Moletom Streetwear', label: 'MOLETOM<br>STREETWEAR' }
      ],
      path: 'assets/TEKMAK_DTF_COMPACTA.glb?v=3',
      scale: 0.8928,
      offsetX: 0.22,
      offsetY: -0.01,
      shadowScale: 1.21,
      hasDescription: true
    },
    {
      id: 'tk3202i',
      watermark: 'TK3202I',
      category: 'COMUNICAÇÃO VISUAL · ECO-SOLVENTE GRANDE FORMATO',
      titleId: 'TK3202i',
      titleSub: 'ECO-SOLVENTE 3,20M',
      speedHighlight: '<span>2 PASS: 75 m²/h</span><span class="sc-sh-div">|</span><span>4 PASS: 32 m²/h</span>',
      desc: 'Impressora eco-solvente de 3,20 m com 2 cabeças Epson i3200-E1 e 11 turbinas de secagem. Ideal para grandes volumes de banners, lonas e envelopamento.',
      specs: [
        { k: 'LARGURA DE IMPRESSÃO', v: '3,20 m' },
        { k: 'VELOCIDADE EM 2 PASS', v: 'Até 75 m²/h' },
        { k: 'VELOCIDADE EM 4 PASS', v: 'Até 32 m²/h' },
        { k: 'PLACA ELETRÔNICA', v: 'Hoson Original' },
        { k: 'CABEÇAS DE IMPRESSÃO', v: '2× Epson i3200-E1' },
        { k: 'TINTA & TECNOLOGIA', v: 'Eco-solvente · CMYK' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK3202i',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora eco-solvente TK3202i 3,20m',
      appsSubtitle: 'COMUNICAÇÃO VISUAL &amp; GRANDE FORMATO',
      examples: [
        { img: 'assets/products/banners-cenografia.webp', title: 'Banners e Lonas', label: 'BANNERS &amp;<br>LONAS' },
        { img: 'assets/products/abadas-micareta.webp', title: 'Fachadas e Cenografia', label: 'FACHADAS &amp;<br>CENOGRAFIA' },
        { img: 'assets/products/app_personalizados_brindes.jpg', title: 'Adesivos e Envelopamento', label: 'ADESIVOS &amp;<br>ENVELOPAMENTO' }
      ],
      path: 'assets/TK3202i.glb?v=1',
      scale: 0.792,
      offsetX: 0.32,
      offsetY: -0.05,
      shadowScale: 1.55,
      hasDescription: true
    },
    {
      id: 'tk9060',
      watermark: 'TK9060-4I',
      category: 'IMPRESSÃO UV FLATBED · 4 CABEÇAS EPSON',
      titleId: 'TK9060-4i',
      titleSub: 'UV FLATBED · 90×60CM',
      speedHighlight: '<span>6 PASS: 6,5 m²/h</span><span class="sc-sh-div">|</span><span>8 PASS: 4,8 m²/h</span>',
      desc: 'Mesa UV Flatbed profissional com 4 cabeças Epson i3200-U1 e sucção a vácuo. Impressão direta com relevo tátil 3D e verniz em acrílico, metal e brindes.',
      specs: [
        { k: 'ÁREA DE IMPRESSÃO', v: '90 × 60 cm (Mesa)' },
        { k: 'VELOCIDADE EM 6 PASS', v: 'Até 6,5 m²/h' },
        { k: 'VELOCIDADE EM 8 PASS', v: 'Até 4,8 m²/h' },
        { k: 'RESOLUÇÃO MÁXIMA', v: 'Até 3200 DPI' },
        { k: 'CABEÇAS DE IMPRESSÃO', v: '4× Epson i3200-U1' },
        { k: 'CORES & EFEITOS', v: 'CMYK + Branco + Verniz 3D' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO TK9060-4i',
      ctaMsg: 'Olá, gostaria de uma cotação da impressora UV Flatbed TK9060-4i',
      appsSubtitle: 'BRINDES, ACRÍLICOS &amp; RÍGIDOS',
      examples: [
        { img: 'assets/products/app_personalizados_brindes.jpg', title: 'Brindes e Acrílicos', label: 'BRINDES &amp;<br>ACRÍLICOS' },
        { img: 'assets/products/brindes-sublimados.webp', title: 'Troféus e Placas', label: 'TROFÉUS &amp;<br>PLACAS' },
        { img: 'assets/products/audley/tk1301i-mousepad.png', title: 'Couro e DTF UV', label: 'COURO &amp;<br>DTF UV' }
      ],
      path: 'assets/TK9060.glb?v=1',
      scale: 1.2555,
      offsetX: 0.28,
      offsetY: -0.28,
      shadowScale: 1.45,
      hasDescription: true
    }
  ];

  const TOTAL = MACHINES.length;

  // ----------------------------------------------------------------------------
  // INICIALIZAÇÃO DO THREE.JS COM OTIMIZAÇÃO EXTREMA DE GPU E BATERIA
  // ----------------------------------------------------------------------------
  const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 860;
  const powerPref = isMobileDevice ? 'default' : 'high-performance';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: powerPref,
      precision: 'highp',
      logarithmicDepthBuffer: false,
      stencil: false,
      depth: true
    });
  } catch (err) {
    console.warn('WebGL indisponível no carrossel 3D.', err);
    return;
  }

  // Gestão de perda e restauração do contexto WebGL (resiliência contra suspensão de abas)
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    isSleeping = true;
    console.warn('WebGL context lost - pausando motor 3D');
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    console.log('WebGL context restored - reiniciando renderizador');
    renderer.setPixelRatio(getOptimalDpr());
    updateMachineTransforms();
    wakeUp();
    renderer.render(scene, camera);
  }, false);

  // Capping inteligente de DPI: ultra-leveza sem qualquer perda visual
  function getOptimalDpr() {
    const isMobile = window.innerWidth <= 860;
    const maxDpr = isMobile ? 1.0 : 1.35;
    return Math.min(window.devicePixelRatio || 1, maxDpr);
  }

  renderer.setPixelRatio(getOptimalDpr());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 60);

  // Iluminação de Estúdio com Alto Contraste e Cores Vivas (Sem Lavar com Neblina)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x828c9b, 0.42));

  const keyLight = new THREE.DirectionalLight(0xfffaee, 1.35);
  keyLight.position.set(-2.5, 5.2, 4.8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xdce7ff, 0.85);
  rimLight.position.set(2.5, 4.5, -3.5);
  scene.add(rimLight);

  // Softbox de Estúdio PBR: Fundo Escuro para Máxima Saturação das Cores
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x10141a);

  const room = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 16),
    new THREE.MeshBasicMaterial({ color: 0x0c0f14, side: THREE.BackSide }));
  studio.add(room);

  const topSoftbox = new THREE.Mesh(new THREE.PlaneGeometry(10, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  topSoftbox.position.set(0, 5.8, 0);
  topSoftbox.rotation.x = Math.PI / 2;
  studio.add(topSoftbox);

  const keySoftbox = new THREE.Mesh(new THREE.PlaneGeometry(5, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  keySoftbox.position.set(-5, 2.5, 4);
  keySoftbox.lookAt(0, 0, 0);
  studio.add(keySoftbox);

  // Narrow reflection defines metal edges without lifting every dark surface.
  const edgeSoftbox = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 5.0),
    new THREE.MeshBasicMaterial({ color: 0xd8e4f5 }));
  edgeSoftbox.position.set(5, 2.2, -2);
  edgeSoftbox.lookAt(0, 0, 0);
  studio.add(edgeSoftbox);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.04);
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });

  // Sombra suave de contato no chão industrial ultra-realista
  function createSoftShadowTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 256;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, 512, 256);

    const grad = ctx.createRadialGradient(256, 128, 10, 256, 128, 220);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.50)');
    grad.addColorStop(0.30, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(0.60, 'rgba(0, 0, 0, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    const tex = new THREE.CanvasTexture(cvs);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  const shadowTex = createSoftShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(4.4, 2.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, -1.18 + 0.002, 0);
  contactShadow.matrixAutoUpdate = false;
  contactShadow.updateMatrix();
  scene.add(contactShadow);

  // ----------------------------------------------------------------------------
  // GERENCIAMENTO DE MEMÓRIA E CARREGAMENTO SOB DEMANDA (ZERO PESO / ZERO TRAVAMENTO)
  // ----------------------------------------------------------------------------
  let isSectionInView = false;

  const gltfLoader = new THREE.GLTFLoader();
  if (typeof MeshoptDecoder !== 'undefined') {
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  }

  const scLoader = document.getElementById('scLoader');
  function showLoader(show) {
    if (scLoader) scLoader.classList.toggle('is-active', !!show);
  }

  // Libera os recursos de um modelo inativo sem tocar no ambiente compartilhado.
  function disposeHierarchy(node) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    node.traverse(child => {
      if (!child.isMesh) return;
      if (child.geometry) geometries.add(child.geometry);
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(mat => {
        if (!mat) return;
        materials.add(mat);
        Object.values(mat).forEach(value => {
          if (value && value.isTexture && value !== scene.environment) textures.add(value);
        });
      });
    });
    textures.forEach(texture => texture.dispose());
    materials.forEach(material => material.dispose());
    geometries.forEach(geometry => geometry.dispose());
  }

  let cacheClock = 0;
  const MAX_CACHED_MODELS = navigator.deviceMemory && navigator.deviceMemory <= 2 ? 2 : 3;
  function pruneModelCache() {
    const loaded = machineGroups.filter(group => group.userData.isLoaded);
    if (loaded.length <= MAX_CACHED_MODELS) return;
    const protectedIndexes = new Set([activeIndex]);
    if (isTransitioning) {
      protectedIndexes.add(outgoingIndex);
      protectedIndexes.add(incomingIndex);
    }
    const candidates = loaded
      .filter(group => !protectedIndexes.has(group.userData.index))
      .sort((a, b) => a.userData.lastUsed - b.userData.lastUsed);
    while (loaded.length > MAX_CACHED_MODELS && candidates.length) {
      const group = candidates.shift();
      const model = group.userData.model;
      group.remove(model);
      disposeHierarchy(model);
      group.userData.model = null;
      group.userData.isLoaded = false;
      group.userData.halfHeight = 0.85;
      group.visible = false;
      loaded.splice(loaded.indexOf(group), 1);
    }
  }

  const machineGroups = [];
  MACHINES.forEach((m, idx) => {
    const group = new THREE.Group();
    group.userData = {
      index: idx,
      data: m,
      isLoaded: false,
      isLoading: false,
      model: null,
      halfHeight: 0.85,
      lastUsed: 0
    };
    group.visible = false;
    scene.add(group);
    machineGroups.push(group);
  });

  // ----------------------------------------------------------------------------
  // CARREGAMENTO INSTANTÂNEO COM CACHE RESIDENTE NA GPU (0ms LATÊNCIA)
  // ----------------------------------------------------------------------------
  function loadMachine(idx, callback, isUrgent = false) {
    const group = machineGroups[idx];
    const m = MACHINES[idx];
    if (!group || !m) return;

    // Se já estiver carregado na memória/GPU, retorna INSTANTANEAMENTE (0ms)
    if (group.userData.isLoaded && group.userData.model) {
      group.userData.lastUsed = ++cacheClock;
      if (callback) callback(group);
      return;
    }

    // Se já estiver em processo de download
    if (group.userData.isLoading) {
      if (isUrgent) showLoader(true);
      const waitTimer = setInterval(() => {
        if (group.userData.isLoaded && group.userData.model) {
          clearInterval(waitTimer);
          showLoader(false);
          if (callback) callback(group);
        } else if (!group.userData.isLoading) {
          clearInterval(waitTimer);
          showLoader(false);
        }
      }, 25);
      return;
    }

    group.userData.isLoading = true;
    if (isUrgent) showLoader(true);

    gltfLoader.load(m.path, gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.set(-center.x, -center.y, -center.z);
      model.scale.setScalar(m.scale || 1.0);

      model.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          const name = (mat.name || '').toLowerCase();

          // ANTI-FLICKERING / ZERO Z-FIGHTING PARA TODAS AS MÁQUINAS:
          const isFabric = name.includes('tecido');
          const isDecalOrLabel = !isFabric && (name.includes('logo') || name.includes('warning') || 
                                 name.includes('etiqueta') || name.includes('label') || 
                                 name.includes('keypad') || name.includes('meter') || 
                                 name.includes('dryer_control') || name.includes('switch') ||
                                 name.includes('selo') || name.includes('console') ||
                                 name.includes('temp') || name.includes('selector') ||
                                 name.includes('platen') || name.includes('fascia') ||
                                 name.includes('fotografia') || name.includes('referencia') ||
                                 name.includes('serigrafia') || name.includes('chart') ||
                                 name.includes('precision') || name.includes('display'));

          const isGlassOrAcrylic = name.includes('acrilico') || name.includes('ambar') ||
                                   name.includes('vidro') || name.includes('transparente') ||
                                   name.includes('fumado') || name.includes('policarbonato');

          if (isGlassOrAcrylic && m.id === 'dtf-compacta') {
            // The closed amber pane uses one blend path. Transmission plus
            // double-sided alpha makes its internal surfaces compete on rotation.
            mat.transmission = 0;
            mat.transparent = true;
            mat.depthWrite = false;
            mat.depthTest = true;
            mat.side = THREE.FrontSide;
            mat.alphaTest = 0;
            mat.polygonOffset = false;
            // Amber safety window, without a second refraction pass.
            mat.color = new THREE.Color(0xd6680a).convertSRGBToLinear();
            mat.opacity = 0.60;
            mat.roughness = 0.05;
            mat.metalness = 0.02;
            mat.envMapIntensity = 1.5;
            mat.needsUpdate = true;
            child.renderOrder = 10;
          } else if (isGlassOrAcrylic) {
            mat.transparent = true;
            mat.depthWrite = false;
            mat.depthTest = true;
            mat.side = THREE.DoubleSide;
            if (name.includes('fumado') || name.includes('policarbonato')) {
              mat.opacity = 0.52;
              mat.color = new THREE.Color(0x222830).convertSRGBToLinear();
              mat.roughness = 0.08;
              mat.metalness = 0.20;
              mat.envMapIntensity = 1.7;
            } else {
              mat.opacity = 0.60;
              mat.color = new THREE.Color(0xd6680a).convertSRGBToLinear();
              mat.roughness = 0.05;
              mat.metalness = 0.02;
              mat.envMapIntensity = 1.5;
            }
            child.renderOrder = 10;
          } else if (isFabric) {
            // Tecido têxtil sublimado (bobina industrial com estampa de alta fidelidade)
            mat.side = THREE.DoubleSide;
            mat.roughness = 0.82;
            mat.metalness = 0.02;
            mat.envMapIntensity = 0.55;
            mat.depthWrite = true;
            mat.depthTest = true;
            mat.polygonOffset = false;
            child.renderOrder = 1;
          } else if (isDecalOrLabel) {
            // Decalques, logotipos, etiquetas e serigrafias: polygonOffset + renderOrder elimina 100% de Z-fighting
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = -2;
            mat.polygonOffsetUnits = -4;
            mat.depthTest = true;
            child.renderOrder = 3;
            if (m.id === 'dtf-compacta') {
              // Printed labels are opaque ink with cutout backgrounds. Write
              // depth before the window instead of sorting them as glass.
              mat.transparent = false;
              mat.alphaTest = mat.map ? 0.02 : 0;
              mat.depthWrite = true;
              mat.needsUpdate = true;
            } else if (mat.transparent || (mat.alphaTest > 0)) {
              mat.depthWrite = false;
              mat.alphaTest = 0.02;
            } else {
              mat.depthWrite = true;
            }
            mat.side = THREE.FrontSide;
            mat.envMapIntensity = name.includes('selo') ? 1.20 : 0.95;
          } else {
            // Lataria, carenagens, rolos e perfis industriais: FrontSide elimina auto-interseção com faces internas
            mat.side = THREE.FrontSide;
            mat.depthWrite = true;
            mat.depthTest = true;
            mat.polygonOffset = false;
            child.renderOrder = 0;

            // Ajustes finos específicos por modelo
            if (m.id === 'tk1908') {
              if (name.includes('azul cobalto') || name.includes('pintura azul')) {
                mat.roughness = 0.26;
                mat.metalness = 0.12;
                mat.envMapIntensity = 0.40;
              } else if (name.includes('chapa preta')) {
                mat.roughness = 0.40;
                mat.metalness = 0.08;
                mat.envMapIntensity = 0.35;
              } else if (name.includes('torneado') || name.includes('escovado') || name.includes('aco inox') || name.includes('grelhas')) {
                mat.color = new THREE.Color(0xd0d5da).convertSRGBToLinear();
                mat.metalness = 0.90;
                mat.roughness = 0.18;
                mat.envMapIntensity = 1.6;
              } else if (name.includes('lcd') || name.includes('display')) {
                mat.emissive = new THREE.Color(0x0f2238);
                mat.emissiveIntensity = 0.8;
              }
            } else if (m.id === 'dtf-compacta') {
              if (name.includes('branca') || name.includes('tampas')) {
                mat.color = new THREE.Color(0xdce0e4).convertSRGBToLinear();
                mat.roughness = 0.32;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.40;
              } else if (name.includes('torneado') || name.includes('escovado') || name.includes('zincado')) {
                mat.color = new THREE.Color(0xccd0d5).convertSRGBToLinear();
                mat.metalness = 0.88;
                mat.roughness = 0.16;
                mat.envMapIntensity = 1.5;
              } else if (name.includes('temp') || name.includes('module_display')) {
                mat.emissive = new THREE.Color(0xff1800);
                mat.emissiveIntensity = 1.4;
              } else if (name.includes('lcd') || name.includes('console')) {
                mat.emissive = new THREE.Color(0x10253d);
                mat.emissiveIntensity = 0.7;
              } else {
                mat.envMapIntensity = 0.45;
              }
            } else if (m.id === 'tk3202i') {
              if (name.includes('carenagem branca')) {
                mat.color = new THREE.Color(0xf2f4f7).convertSRGBToLinear();
                mat.roughness = 0.28;
                mat.metalness = 0.04;
                mat.envMapIntensity = 0.40;
              } else if (name.includes('pintura azul')) {
                mat.color = new THREE.Color('#086ad8').convertSRGBToLinear();
                mat.roughness = 0.26;
                mat.metalness = 0.08;
                mat.envMapIntensity = 0.40;
              } else if (name.includes('chapa preta')) {
                mat.roughness = 0.40;
                mat.metalness = 0.08;
                mat.envMapIntensity = 0.35;
              } else if (name.includes('torneado') || name.includes('zincadas') || name.includes('aluminio')) {
                mat.color = new THREE.Color(0xd0d5da).convertSRGBToLinear();
                mat.metalness = 0.88;
                mat.roughness = 0.18;
                mat.envMapIntensity = 1.5;
              } else if (name.includes('lcd')) {
                mat.emissive = new THREE.Color(0x0f2238);
                mat.emissiveIntensity = 0.8;
              } else if (name.includes('indicador verde')) {
                mat.emissive = new THREE.Color(0x00cc44);
                mat.emissiveIntensity = 1.2;
              } else {
                mat.envMapIntensity = 0.45;
              }
            } else if (m.id === 'tk9060') {
              if (name.includes('marfim') || name.includes('bordas brancas')) {
                mat.color = new THREE.Color(0xf2f1ed).convertSRGBToLinear();
                mat.roughness = 0.30;
                mat.metalness = 0.03;
                mat.envMapIntensity = 0.40;
              } else if (name.includes('porta tecnica') || name.includes('chapa preta') || name.includes('painel preto')) {
                mat.color = new THREE.Color(0x101215).convertSRGBToLinear();
                mat.roughness = 0.28;
                mat.metalness = 0.10;
                mat.envMapIntensity = 0.35;
              } else if (name.includes('aluminio') || name.includes('ferragens') || name.includes('torneado')) {
                mat.color = new THREE.Color(0xccd0d5).convertSRGBToLinear();
                mat.metalness = 0.88;
                mat.roughness = 0.16;
                mat.envMapIntensity = 1.5;
              } else if (name.includes('polietileno')) {
                mat.color = new THREE.Color(0xdedede).convertSRGBToLinear();
                mat.roughness = 0.48;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.5;
              } else if (name.includes('identificacao amarela')) {
                mat.color = new THREE.Color(0xffcc00).convertSRGBToLinear();
              } else if (name.includes('identificacao magenta')) {
                mat.color = new THREE.Color(0xe6007e).convertSRGBToLinear();
              } else if (name.includes('identificacao ciano')) {
                mat.color = new THREE.Color(0x009fe3).convertSRGBToLinear();
              } else if (name.includes('lcd')) {
                mat.emissive = new THREE.Color(0x0f2238);
                mat.emissiveIntensity = 0.8;
              } else {
                mat.envMapIntensity = 0.45;
              }
            } else {
              mat.envMapIntensity = 0.45;
            }
          }

          // Product finishes: keep texture artwork and safety decals intact.
          if (!isGlassOrAcrylic && !isDecalOrLabel && !isFabric) {
            const isBluePaint = name.includes('pintura azul') || name.includes('azul tampas');
            if (isBluePaint) {
              const blue = (m.id === 'tk1908' || m.id === 'tk3202i') ? '#086ad8' :
                m.id === 'tk1802i' ? '#0062cc' : '#005ec4';
              mat.color = new THREE.Color(blue).convertSRGBToLinear();
              mat.roughness = 0.26;
              mat.metalness = 0.04;
              mat.envMapIntensity = 0.40;
            } else if (name.includes('faixa violeta')) {
              mat.color = new THREE.Color('#7953a7').convertSRGBToLinear();
              mat.roughness = 0.34;
              mat.envMapIntensity = 0.50;
            } else if (name.includes('chapa preta') || name.includes('pintado preto') || name.includes('carenagem grafite')) {
              mat.color = new THREE.Color(0x101215).convertSRGBToLinear();
              mat.roughness = 0.38;
              mat.metalness = 0.10;
              mat.envMapIntensity = 0.35;
            } else if (name.includes('borracha') || name.includes('recessos') || name.includes('interior sombreado')) {
              mat.color = new THREE.Color(0x0a0c0e).convertSRGBToLinear();
              mat.roughness = 0.82;
              mat.metalness = 0;
              mat.envMapIntensity = 0.15;
            }
          }
          if (isGlassOrAcrylic && m.id === 'dtf-compacta') {
            mat.envMapIntensity = 0.65;
          }

          if (mat.map) {
            mat.envMapIntensity = 0.30;
            if (renderer.capabilities) {
              mat.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
              mat.map.minFilter = THREE.LinearMipmapLinearFilter;
              mat.map.magFilter = THREE.LinearFilter;
              mat.map.generateMipmaps = true;
            }
          }
        });
      });

      group.add(model);
      group.userData.isLoaded = true;
      group.userData.isLoading = false;
      group.userData.model = model;
      group.userData.lastUsed = ++cacheClock;
      group.userData.halfHeight = (size.y * (m.scale || 1.0)) / 2;
      showLoader(false);
      updateRestPositions();
      updateMachineTransforms();
      if (isVisible) renderer.render(scene, camera);
      if (callback) callback(group);
      pruneModelCache();
    }, undefined, err => {
      console.warn('Erro ao carregar modelo GLB:', m.path, err);
      group.userData.isLoading = false;
      showLoader(false);
    });
  }

  // ----------------------------------------------------------------------------
  // ESTADOS DE TRANSIÇÃO 3D DO CARROSSEL (SUPORTE DINÂMICO PARA AS 4 MÁQUINAS)
  // ----------------------------------------------------------------------------
  const urlParamM = new URLSearchParams(window.location.search).get('m');
  let initialIdx = urlParamM !== null ? parseInt(urlParamM, 10) : 0;
  if (isNaN(initialIdx) || initialIdx < 0 || initialIdx >= TOTAL) initialIdx = 0;

  let activeIndex = initialIdx;
  let outgoingIndex = initialIdx;
  let incomingIndex = initialIdx;
  let transitionProgress = 1.0;
  let transitionStartTime = 0;
  let isTransitioning = false;
  let transitionDirection = 1; // 1 = avanço (sai para esquerda, entra da direita), -1 = recuo (sai para direita, entra da esquerda)

  // Rotação 3D travada em até 75° (a parte de trás das máquinas NUNCA é visível)
  const NOBLE_ROT_Y = THREE.MathUtils.degToRad(22); // 22 graus = perspectiva nobre exata da foto
  const MAX_ROT_Y = THREE.MathUtils.degToRad(75);   // 75 graus = trava rigorosa de limite
  const SWAY_AMP = THREE.MathUtils.degToRad(6);     // Leve oscilação suave de ±6 graus
  let swayTime = 0.0;
  let userRotationY = NOBLE_ROT_Y;
  let targetRotationY = userRotationY;
  let userRotationX = 0.04;
  let targetRotationX = 0.04;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startRotY = 0;
  let startRotX = 0;
  let autoRotate = true;
  let idleTimer = null;

  let cachedRestY = -0.16;

  function updateRestPositions() {
    const isMobile = window.innerWidth <= 860;
    cachedRestY = isMobile ? 0.02 : -0.16;
  }

  function getMachineRestY(idx) {
    const isMobile = window.innerWidth <= 860;
    const base = isMobile ? 0.02 : -0.16;
    return base + (MACHINES[idx]?.offsetY || 0);
  }

  function getMachineRestX(idx) {
    const isMobile = window.innerWidth <= 860;
    if (isMobile) return 0;
    // Máquinas com descrição na lateral esquerda ficam posicionadas no lado direito
    const base = MACHINES[idx]?.hasDescription ? Math.min(1.00, Math.max(0.62, (camera.aspect - 1.15) * 1.08)) : 0;
    return base + (MACHINES[idx]?.offsetX || 0);
  }

  function updateMachineTransforms() {
    const p = transitionProgress;

    const outRestX = getMachineRestX(outgoingIndex);
    const inRestX = getMachineRestX(incomingIndex);
    const outRestY = getMachineRestY(outgoingIndex);
    const inRestY = getMachineRestY(incomingIndex);

    for (let i = 0; i < TOTAL; i++) {
      const g = machineGroups[i];
      if (!g) continue;

      const isLoaded = !!g.userData?.isLoaded;
      const machineRestX = getMachineRestX(i);
      const machineRestY = getMachineRestY(i);

      if (!isTransitioning) {
        if (i === activeIndex && isLoaded) {
          g.visible = true;
          g.position.set(machineRestX, machineRestY, 0);
          g.rotation.y = userRotationY;
          g.rotation.x = userRotationX;
          g.scale.setScalar(1.0);
        } else {
          g.visible = false;
        }
      } else {
        if (i === outgoingIndex && isLoaded) {
          g.visible = true;
          // Máquina saindo (sai totalmente para fora da visão: 10 unidades)
          const exitX = outRestX - (transitionDirection * p * 10.0);
          const exitZ = -p * 6.0;
          g.position.set(exitX, outRestY, exitZ);
          const rotExit = userRotationY - (transitionDirection * p * 0.22);
          g.rotation.y = THREE.MathUtils.clamp(rotExit, -MAX_ROT_Y, MAX_ROT_Y);
          g.rotation.x = userRotationX;
          const s = THREE.MathUtils.lerp(1.0, 0.65, p);
          g.scale.setScalar(s);
        } else if (i === incomingIndex && isLoaded) {
          g.visible = true;
          // Máquina entrando (vem de fora da visão: 10 unidades)
          const enterX = inRestX + (transitionDirection * (1 - p) * 10.0);
          const enterZ = -(1 - p) * 6.0;
          g.position.set(enterX, inRestY, enterZ);
          const rotEnter = userRotationY + (transitionDirection * (1 - p) * 0.22);
          g.rotation.y = THREE.MathUtils.clamp(rotEnter, -MAX_ROT_Y, MAX_ROT_Y);
          g.rotation.x = userRotationX;
          const s = THREE.MathUtils.lerp(0.65, 1.0, p);
          g.scale.setScalar(s);
        } else {
          g.visible = false;
        }
      }
    }

    // Sombra de contato acompanha a máquina ativa no chão (exatamente na base dos pés)
    const outH = machineGroups[outgoingIndex]?.userData?.halfHeight || 0.85;
    const inH = machineGroups[incomingIndex]?.userData?.halfHeight || 0.85;
    const currentHalfHeight = isTransitioning ? THREE.MathUtils.lerp(outH, inH, p) : inH;
    const currentRestY = isTransitioning ? THREE.MathUtils.lerp(outRestY, inRestY, p) : inRestY;

    const shadowX = isTransitioning ? THREE.MathUtils.lerp(outRestX, inRestX, p) : inRestX;
    contactShadow.position.set(shadowX, currentRestY - currentHalfHeight + 0.002, 0);

    const outScale = MACHINES[outgoingIndex]?.shadowScale || 1.0;
    const inScale = MACHINES[incomingIndex]?.shadowScale || 1.0;
    const currentShadowScale = isTransitioning ? THREE.MathUtils.lerp(outScale, inScale, p) : inScale;
    contactShadow.scale.set(currentShadowScale, 1, 1);

    const shadowAlpha = isTransitioning ? (1.0 - Math.min(Math.abs(p - 0.5) * 0.5, 0.4)) : 1.0;
    contactShadow.material.opacity = shadowAlpha * 0.50;
    contactShadow.updateMatrix();
  }

  function goTo(newIdx, customDir) {
    wakeUp();
    if (newIdx === activeIndex && !isTransitioning) return;
    if (isTransitioning) {
      transitionProgress = 1.0;
      isTransitioning = false;
    }

    const targetIdx = (newIdx + TOTAL) % TOTAL;

    const doTransition = () => {
      outgoingIndex = activeIndex;
      incomingIndex = targetIdx;

      if (customDir !== undefined) {
        transitionDirection = customDir;
      } else {
        transitionDirection = incomingIndex >= outgoingIndex ? 1 : -1;
      }

      activeIndex = incomingIndex;
      machineGroups[activeIndex].userData.lastUsed = ++cacheClock;
      transitionProgress = 0.0;
      transitionStartTime = performance.now();
      isTransitioning = true;
      autoRotate = true;

      updateHUD(activeIndex);
    };

    // Se já estiver na memória da GPU (graças ao pré-carregamento), transiciona em 0ms!
    if (machineGroups[targetIdx]?.userData?.isLoaded) {
      doTransition();
    } else {
      loadMachine(targetIdx, doTransition, true);
    }
  }

  function next() {
    goTo((activeIndex + 1) % TOTAL, 1);
  }

  function prev() {
    goTo((activeIndex - 1 + TOTAL) % TOTAL, -1);
  }

  // ----------------------------------------------------------------------------
  // ATUALIZAÇÃO DO HUD / EXPLICAÇÃO NA ESQUERDA (TK1804i e TK1802i)
  // ----------------------------------------------------------------------------
  const scContentCol = document.getElementById('scContentCol');
  const elWatermark = document.getElementById('scWatermark');

  const scCategory = document.getElementById('scCategory');
  const scTitle = document.getElementById('scTitle');
  const scSpeedHighlight = document.getElementById('scSpeedHighlight');
  const scDesc = document.getElementById('scDesc');
  const scSpecs = document.getElementById('scSpecs');
  const scCta = document.getElementById('scCta');

  function renderMachineInfo(m) {
    if (scCategory && m.category) scCategory.textContent = m.category;
    if (scTitle) {
      scTitle.innerHTML = `<span class="sc-title-id">${m.titleId || ''}</span><span class="sc-title-sub">${m.titleSub || ''}</span>`;
    }
    if (scSpeedHighlight) {
      if (m.speedHighlight) {
        scSpeedHighlight.style.display = '';
        scSpeedHighlight.innerHTML = `<div class="sc-sh-bar">${m.speedHighlight}</div>`;
      } else {
        scSpeedHighlight.style.display = 'none';
      }
    }
    if (scDesc && m.desc) scDesc.textContent = m.desc;
    if (scSpecs && Array.isArray(m.specs)) {
      scSpecs.innerHTML = m.specs.map(s => `
        <div class="sc-spec">
          <span class="k">${s.k}</span>
          <span class="v">${s.v}</span>
        </div>
      `).join('');
    }
    const scAppsGrid = document.getElementById('scAppsGrid');
    if (scAppsGrid && Array.isArray(m.examples)) {
      scAppsGrid.innerHTML = m.examples.map((ex, exIdx) => `
        <button type="button" class="sc-app-card" data-app-idx="${exIdx}" title="Clique para ver em tela cheia: ${ex.title}">
          <div class="sc-app-img-wrap">
            <img src="${ex.img}" alt="${ex.title}" loading="lazy" />
            <div class="sc-app-zoom" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </div>
          </div>
          <span class="sc-app-title">${ex.label || ex.title}</span>
        </button>
      `).join('');
    }
    if (scCta) {
      scCta.innerHTML = `${m.ctaText || 'SOLICITAR COTAÇÃO'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      const phone = '5519989825441';
      scCta.href = `https://wa.me/${phone}?text=${encodeURIComponent(m.ctaMsg || ('Olá, gostaria de uma cotação da impressora ' + (m.titleId || '')))}`;
    }
    const scAppsSubtitle = document.getElementById('scAppsSubtitle');
    if (scAppsSubtitle) {
      scAppsSubtitle.innerHTML = m.appsSubtitle || 'IDEAL PARA O SEU NEGÓCIO';
    }
  }

  let isFirstHud = true;
  function updateHUD(idx) {
    if (elWatermark) {
      elWatermark.textContent = MACHINES[idx]?.watermark || 'TEKMAK';
    }

    if (scContentCol) {
      const m = MACHINES[idx];
      if (m && m.hasDescription) {
        if (isFirstHud) {
          isFirstHud = false;
          renderMachineInfo(m);
          scContentCol.classList.remove('is-hidden');
        } else {
          const scLead = scContentCol.querySelector('.sc-lead');
          const scCtaWrap = scContentCol.querySelector('.sc-cta-wrap');
          const scAppsWrap = scContentCol.querySelector('.sc-apps-wrap');
          const fadeElements = [scLead, scCtaWrap, scAppsWrap].filter(Boolean);

          scContentCol.style.opacity = '0';
          scContentCol.style.transform = 'translateY(8px)';
          fadeElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
          });
          setTimeout(() => {
            renderMachineInfo(m);
            scContentCol.classList.remove('is-hidden');
            scContentCol.style.opacity = '';
            scContentCol.style.transform = '';
            fadeElements.forEach(el => {
              el.style.opacity = '';
              el.style.transform = '';
            });
          }, 160);
        }
      } else {
        isFirstHud = false;
        scContentCol.classList.add('is-hidden');
      }
    }
  }

  // ----------------------------------------------------------------------------
  // DEMAND-RENDERING & SLEEP MODE (0% CPU / 0% GPU QUANDO PARADO)
  // ----------------------------------------------------------------------------
  let isSleeping = true;
  let swayFramesCount = 0;
  const constrainedDevice = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  const MAX_SWAY_FRAMES = constrainedDevice ? 30 * 4 : 60 * 8; // ~8 segundos de oscilação elegante antes de repousar

  function wakeUp() {
    swayFramesCount = 0;
    if (isSleeping) {
      isSleeping = false;
      autoRotate = true;
    }
    if (isVisible && !document.hidden && !animFrameId) {
      animFrameId = requestAnimationFrame(animate);
    }
  }

  // Desperta em 0ms em qualquer interação do usuário
  stage.addEventListener('mousemove', wakeUp, { passive: true });
  stage.addEventListener('mouseenter', wakeUp, { passive: true });
  stage.addEventListener('touchstart', wakeUp, { passive: true });

  // ----------------------------------------------------------------------------
  // SCROLL BOOST: ZERO STUTTER NA ROLAGEM DA PÁGINA (PAUSA THREE.JS DURANTE O SCROLL)
  // ----------------------------------------------------------------------------
  let isPageScrolling = false;
  let scrollPauseTimer = null;
  window.addEventListener('scroll', () => {
    if (!isVisible) return;
    isPageScrolling = true;
    clearTimeout(scrollPauseTimer);
    scrollPauseTimer = setTimeout(() => {
      isPageScrolling = false;
      if (isVisible && !isSleeping) {
        updateMachineTransforms();
        renderer.render(scene, camera);
      }
    }, 80);
  }, { passive: true });

  // Setas Flutuantes no Palco 3D com Prefetching Preditivo
  const stagePrev = document.getElementById('scStagePrev');
  const stageNext = document.getElementById('scStageNext');
  if (stagePrev) {
    stagePrev.addEventListener('click', () => { wakeUp(); prev(); });
    stagePrev.addEventListener('mouseenter', () => {
      wakeUp();
      const prevIdx = (activeIndex - 1 + TOTAL) % TOTAL;
      if (!machineGroups[prevIdx]?.userData?.isLoaded) {
        loadMachine(prevIdx, null, false);
      }
    });
  }
  if (stageNext) {
    stageNext.addEventListener('click', () => { wakeUp(); next(); });
    stageNext.addEventListener('mouseenter', () => {
      wakeUp();
      const nextIdx = (activeIndex + 1) % TOTAL;
      if (!machineGroups[nextIdx]?.userData?.isLoaded) {
        loadMachine(nextIdx, null, false);
      }
    });
  }

  // ----------------------------------------------------------------------------
  // INTERATIVIDADE MOUSE / TOUCH: TRAVA RIGOROSA EM ATÉ 75° (TRASEIRA NUNCA VISÍVEL)
  // ----------------------------------------------------------------------------
  function onPointerDown(e) {
    wakeUp();
    isDragging = true;
    autoRotate = false;
    clearTimeout(idleTimer);

    // DSR (Dynamic Scale Resolution): escala DPR suavemente durante arrasto ativo para 120 FPS estáveis
    renderer.setPixelRatio(Math.max(1.0, getOptimalDpr() * 0.85));

    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    startRotY = targetRotationY;
    startRotX = targetRotationX;
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    const sensX = 0.0055;
    const sensY = 0.0030;

    // TRAVA DE ATÉ 75 GRAUS (-1.309 rad a +1.309 rad)
    // Impede o usuário de girar até a parte de trás das máquinas
    targetRotationY = THREE.MathUtils.clamp(startRotY + (deltaX * sensX), -MAX_ROT_Y, MAX_ROT_Y);
    targetRotationX = THREE.MathUtils.clamp(startRotX + (deltaY * sensY), -0.04, 0.16);
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';

    // Restaura o DPR nativo de alta definição imediatamente ao soltar o mouse
    renderer.setPixelRatio(getOptimalDpr());
    renderer.render(scene, camera);

    // Retoma suavemente a oscilação frontal após 3 segundos sem solavancos
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      wakeUp();
      const ratio = THREE.MathUtils.clamp((targetRotationY - NOBLE_ROT_Y) / SWAY_AMP, -0.96, 0.96);
      swayTime = isNaN(ratio) ? 0 : Math.asin(ratio);
      autoRotate = true;
    }, 3000);
  }

  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Teclado (Setas ← e → quando o modal estiver aberto)
  window.addEventListener('keydown', e => {
    if (lightbox && lightbox.classList.contains('is-open')) return;
    const isModalOpen = showroomModal && showroomModal.classList.contains('is-open');
    if (isModalOpen) {
      if (e.key === 'ArrowLeft') {
        wakeUp();
        prev();
      } else if (e.key === 'ArrowRight') {
        wakeUp();
        next();
      }
    }
  });

  // ----------------------------------------------------------------------------
  // REDIMENSIONAMENTO E ENQUADRAMENTO DA CÂMERA (AMPLO, NUNCA CORTA)
  // ----------------------------------------------------------------------------
  let isVisible = false; // Começa fechado: 0% GPU / 0% CPU
  let lastW = 0;
  let lastH = 0;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    // Evita recriação desnecessária de framebuffers do WebGL por micro-variações no scroll
    if (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 2) return;
    lastW = width;
    lastH = height;

    renderer.setPixelRatio(getOptimalDpr());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    const isMobile = window.innerWidth <= 860;
    camera.fov = isMobile ? 38 : 32;

    let camDist;
    if (isMobile) {
      const mobileFactor = Math.max(1.0, 390 / Math.max(width, 300));
      camDist = 7.0 * mobileFactor;
    } else {
      // Ajuste suave e dinâmico em telas menores ou janelas de notebook (1366px, 1280px, 1024px)
      const widthFactor = Math.max(1.0, 1520 / Math.max(width, 860));
      const aspectFactor = Math.max(1.0, 1.68 / Math.max(camera.aspect, 0.9));
      camDist = 5.8 * Math.min(widthFactor, Math.max(1.0, aspectFactor * 0.92));
    }

    // Câmera perfeitamente nivelada com o centro da cena para alinhamento linear com os textos
    camera.position.set(0, 0, camDist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    updateRestPositions();

    if (isVisible) {
      updateMachineTransforms();
      renderer.render(scene, camera);
    }
  }
  resize();
  new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize, { passive: true });

  // ----------------------------------------------------------------------------
  // LOOP DE ANIMAÇÃO ULTRA-OTIMIZADO COM CAP DE 60 FPS (ECONOMIA DE ATÉ 70% DE GPU)
  // ----------------------------------------------------------------------------
  let lastRotY = null;
  let lastRotX = null;
  let lastFrameTime = 0;
  let animFrameId = null;
  const FRAME_INTERVAL = 1000 / (constrainedDevice ? 30 : 60);

  function animate(currentTime) {
    if (!isVisible || document.hidden) { animFrameId = null; return; }
    if (isSleeping && !isTransitioning && !isDragging) { animFrameId = null; return; }
    animFrameId = requestAnimationFrame(animate);
    if (isPageScrolling && !isDragging && !isTransitioning) return;

    const now = currentTime || performance.now();
    const elapsed = now - lastFrameTime;
    if (elapsed < FRAME_INTERVAL - 1.5) return;
    lastFrameTime = now - (elapsed % FRAME_INTERVAL);

    let needsRender = false;

    // 1. Transição 3D entre máquinas (Cubic Ease-Out com base no tempo real: exatos 380ms)
    if (isTransitioning) {
      needsRender = true;
      const tElapsed = Math.min((now - transitionStartTime) / 380, 1.0);
      transitionProgress = 1.0 - Math.pow(1.0 - tElapsed, 3);
      if (tElapsed >= 1.0 || transitionProgress >= 0.999) {
        transitionProgress = 1.0;
        isTransitioning = false;
        // Modelos permanecem carregados em VRAM (transição 0ms)
      }
    }

    // 2. Oscilação frontal automática suave ou ancoragem em repouso nobre (Sleep Mode)
    if (autoRotate && !isDragging) {
      swayFramesCount++;
      if (swayFramesCount > MAX_SWAY_FRAMES) {
        // Suavemente ancora na posição nobre de repouso
        targetRotationY = NOBLE_ROT_Y;
        targetRotationX = 0.04;
        if (Math.abs(userRotationY - NOBLE_ROT_Y) < 0.001 && Math.abs(userRotationX - 0.04) < 0.001) {
          userRotationY = NOBLE_ROT_Y;
          userRotationX = 0.04;
          isSleeping = true;
          autoRotate = false;
        }
        needsRender = true;
      } else {
        swayTime += 0.007;
        targetRotationY = NOBLE_ROT_Y + (Math.sin(swayTime) * SWAY_AMP);
        targetRotationX += (0.04 - targetRotationX) * 0.02;
        needsRender = true;
      }
    } else if (isDragging) {
      needsRender = true;
    }

    const diffY = targetRotationY - userRotationY;
    const diffX = targetRotationX - userRotationX;

    if (Math.abs(diffY) > 0.0001 || Math.abs(diffX) > 0.0001) {
      userRotationY += diffY * 0.10;
      userRotationX += diffX * 0.10;
      needsRender = true;
    }

    // Garantia estrita de limite em até 75 graus
    userRotationY = THREE.MathUtils.clamp(userRotationY, -MAX_ROT_Y, MAX_ROT_Y);

    if (needsRender || lastRotY === null || Math.abs(lastRotY - userRotationY) > 0.0001 || Math.abs(lastRotX - userRotationX) > 0.0001) {
      lastRotY = userRotationY;
      lastRotX = userRotationX;
      updateMachineTransforms();
      renderer.render(scene, camera);
    }
  }

  // ----------------------------------------------------------------------------
  // LIGHTBOX FULLSCREEN: FOTOS DE PRODUTOS PRODUZIDOS
  // ----------------------------------------------------------------------------
  const lightbox = document.getElementById('productLightbox');
  const plImg = document.getElementById('plImg');
  const plTitle = document.getElementById('plTitle');
  const plMachineBadge = document.getElementById('plMachineBadge');
  const plCounter = document.getElementById('plCounter');
  const plClose = document.getElementById('plClose');
  const plBackdrop = document.getElementById('plBackdrop');
  const plPrev = document.getElementById('plPrev');
  const plNext = document.getElementById('plNext');

  let currentLightboxIdx = 0;

  function renderLightboxItem() {
    const m = MACHINES[activeIndex];
    if (!m || !m.examples || !m.examples[currentLightboxIdx]) return;
    const item = m.examples[currentLightboxIdx];

    if (plImg) {
      plImg.style.opacity = '0.35';
      plImg.style.transform = 'scale(0.96)';
      const tmp = new Image();
      tmp.onload = () => {
        plImg.src = item.img;
        plImg.alt = item.title;
        plImg.style.opacity = '1';
        plImg.style.transform = 'scale(1)';
      };
      tmp.onerror = () => {
        plImg.src = item.img;
        plImg.style.opacity = '1';
        plImg.style.transform = 'scale(1)';
      };
      tmp.src = item.img;
    }
    if (plTitle) plTitle.textContent = item.title;
    if (plMachineBadge) plMachineBadge.textContent = `PRODUZIDO NA ${m.titleId || 'TEKMAK'}`;
    if (plCounter) plCounter.textContent = `${currentLightboxIdx + 1} / ${m.examples.length}`;
  }

  function openLightbox(exampleIdx = 0) {
    if (!lightbox) return;
    const m = MACHINES[activeIndex];
    if (!m || !Array.isArray(m.examples) || !m.examples.length) return;

    currentLightboxIdx = ((exampleIdx % m.examples.length) + m.examples.length) % m.examples.length;
    renderLightboxItem();

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function nextLightboxItem() {
    const m = MACHINES[activeIndex];
    if (!m || !m.examples || !m.examples.length) return;
    currentLightboxIdx = (currentLightboxIdx + 1) % m.examples.length;
    renderLightboxItem();
  }

  function prevLightboxItem() {
    const m = MACHINES[activeIndex];
    if (!m || !m.examples || !m.examples.length) return;
    currentLightboxIdx = (currentLightboxIdx - 1 + m.examples.length) % m.examples.length;
    renderLightboxItem();
  }

  if (plClose) plClose.addEventListener('click', closeLightbox);
  if (plBackdrop) plBackdrop.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  if (plNext) plNext.addEventListener('click', (e) => { e.stopPropagation(); nextLightboxItem(); });
  if (plPrev) plPrev.addEventListener('click', (e) => { e.stopPropagation(); prevLightboxItem(); });

  window.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      nextLightboxItem();
    } else if (e.key === 'ArrowLeft') {
      prevLightboxItem();
    }
  });

  // Delegar cliques nos cards de aplicações (por mouse ou teclado)
  const scAppsWrap = document.getElementById('scAppsWrap');
  if (scAppsWrap) {
    scAppsWrap.addEventListener('click', (e) => {
      const card = e.target.closest('.sc-app-card');
      if (!card) return;
      const idx = parseInt(card.getAttribute('data-app-idx') || '0', 10);
      openLightbox(isNaN(idx) ? 0 : idx);
    });

    scAppsWrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.sc-app-card');
        if (card) {
          e.preventDefault();
          const idx = parseInt(card.getAttribute('data-app-idx') || '0', 10);
          openLightbox(isNaN(idx) ? 0 : idx);
        }
      }
    });
  }

  // ----------------------------------------------------------------------------
  // API GLOBAL E CONTROLE DO MODAL SHOWROOM 3D FULLSCREEN SOB DEMANDA
  // ----------------------------------------------------------------------------
  function resolveMachineIndex(key) {
    if (typeof key === 'number') {
      return Math.max(0, Math.min(TOTAL - 1, key));
    }
    if (!key) return 0;
    const str = String(key).toLowerCase().trim();

    if (str === 'tk1908' || str === 'impressao' || str === 'impressão' || str === 'impressora' || str === 'impressoras' || str === '0') return 0;
    if (str === 'costura' || str === 'tk1802i' || str === 'tk1802' || str === '1') return 1;
    if (str === 'tk1804i' || str === 'tk1804' || str === '2') return 2;
    if (str === 'tk1301i' || str === 'tk1301' || str === '3') return 3;
    if (str === 'dtf' || str === 'dtf-compacta' || str === 'tk3002i' || str === 'tk-3002i' || str === '4') return 4;
    if (str === 'tk3202i' || str === 'tk3202' || str === 'tk-3202i' || str === 'tk-3202' || str === '3202' || str === 'comunicacao' || str === 'comunicação' || str === 'ecosolvente' || str === 'eco-solvente' || str === '5') return 5;
    if (str === 'tk9060' || str === 'tk9060-4i' || str === 'tk-9060-4i' || str === 'tk-9060' || str === '9060' || str === 'uv' || str === 'flatbed' || str === 'mesa' || str === '6') return 6;

    const foundIdx = MACHINES.findIndex(m => m.id.toLowerCase() === str);
    if (foundIdx !== -1) return foundIdx;
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 0 && num < TOTAL) return num;
    return 0;
  }

  function openShowroom(machineKey) {
    if (!showroomModal) return;

    // Fecha o showroom de prensas se estiver aberto
    const prensaModal = document.getElementById('showroomModalPrensa');
    if (prensaModal && prensaModal.classList.contains('is-open')) {
      if (window.tekmakPrensaShowroom && typeof window.tekmakPrensaShowroom.close === 'function') {
        window.tekmakPrensaShowroom.close();
      } else {
        prensaModal.classList.remove('is-open');
        prensaModal.setAttribute('aria-hidden', 'true');
      }
    }

    const targetIdx = resolveMachineIndex(machineKey);

    const dialog = showroomModal.querySelector('.sc-modal-dialog');
    if (dialog) dialog.scrollTop = 0;

    showroomModal.classList.add('is-open');
    showroomModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sc-modal-open');

    // Desperta Three.js e ativa o loop de renderização sob demanda
    isVisible = true;
    wakeUp();
    if (!animFrameId) animFrameId = requestAnimationFrame(animate);

    // Ajusta imediatamente renderer e câmera às dimensões atuais do modal
    lastW = 0;
    lastH = 0;
    resize();

    // Alterna para a máquina solicitada
    if (targetIdx !== activeIndex) {
      goTo(targetIdx);
    } else {
      updateHUD(targetIdx);
      updateMachineTransforms();
      if (renderer) renderer.render(scene, camera);
    }

    // Reforça o resize após o próximo ciclo de render para acomodar transição CSS do modal
    requestAnimationFrame(() => {
      lastW = 0;
      lastH = 0;
      resize();
      updateMachineTransforms();
      if (renderer) renderer.render(scene, camera);
    });

    loadMachine(targetIdx, () => {
      updateMachineTransforms();
      if (isVisible) renderer.render(scene, camera);
    }, true);
  }

  function closeShowroom() {
    if (!showroomModal) return;
    showroomModal.classList.remove('is-open');
    showroomModal.setAttribute('aria-hidden', 'true');

    const prensaModal = document.getElementById('showroomModalPrensa');
    if (!prensaModal || !prensaModal.classList.contains('is-open')) {
      document.body.classList.remove('sc-modal-open');
    }

    // Pausa a renderização Three.js (0% GPU e 0% CPU enquanto fechado)
    isVisible = false;
    isSleeping = true;
    autoRotate = false;
    isDragging = false;
    clearTimeout(idleTimer);
    clearTimeout(scrollPauseTimer);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  // Acionamento em qualquer elemento com [data-open-showroom]
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-showroom]');
    if (trigger) {
      const machineKey = trigger.getAttribute('data-open-showroom');
      if (machineKey === 'prensa' || machineKey === 'prensas') {
        if (window.tekmakPrensaShowroom) {
          e.preventDefault();
          window.tekmakPrensaShowroom.open();
        }
        return;
      }
      e.preventDefault();
      openShowroom(machineKey);
    }
  });

  // Fechar ao clicar no botão de fechar (X)
  if (scModalClose) {
    scModalClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeShowroom();
    });
  }

  // Fechar ao clicar no backdrop escuro
  if (scModalBackdrop) {
    scModalBackdrop.addEventListener('click', (e) => {
      e.preventDefault();
      closeShowroom();
    });
  }

  // Fechar ao clicar fora da janela de conteúdo do modal
  if (showroomModal) {
    showroomModal.addEventListener('click', (e) => {
      if (e.target === showroomModal) {
        closeShowroom();
      }
    });
  }

  // Fechar ao pressionar a tecla Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && showroomModal && showroomModal.classList.contains('is-open')) {
      if (lightbox && lightbox.classList.contains('is-open')) {
        closeLightbox();
        return;
      }
      closeShowroom();
    }
  });

  // Abrir caso a URL possua a âncora #showroomModal
  if (window.location.hash === '#showroomModal') {
    openShowroom(0);
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#showroomModal') {
      openShowroom(0);
    }
  });

  // API pública global solicitada
  window.tekmakShowroom = {
    open: openShowroom,
    close: closeShowroom,
    preload(machineKey) {
      const targetIdx = resolveMachineIndex(machineKey);
      const group = machineGroups[targetIdx];
      if (!group) return Promise.resolve(false);

      return new Promise(resolve => {
        let settled = false;
        const finish = loaded => {
          if (settled) return;
          settled = true;
          clearInterval(checkTimer);
          resolve(loaded);
        };
        const checkTimer = setInterval(() => {
          if (group.userData.isLoaded) finish(true);
          else if (!group.userData.isLoading) finish(false);
        }, 60);

        loadMachine(targetIdx, () => finish(true), false);
      });
    },
    resolveIndex: resolveMachineIndex,
    get isOpen() {
      return !!showroomModal && showroomModal.classList.contains('is-open');
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isVisible && !animFrameId) animFrameId = requestAnimationFrame(animate);
  });

  window.__TMK = {
    get activeIndex() { return activeIndex; },
    get isTransitioning() { return isTransitioning; },
    get transitionProgress() { return transitionProgress; },
    get isSleeping() { return isSleeping; },
    get isPageScrolling() { return isPageScrolling; },
    get isVisible() { return isVisible; },
    machineGroups,
    MACHINES,
    camera,
    renderer,
    goTo,
    next,
    prev,
    openShowroom,
    closeShowroom,
    openProductLightbox: openLightbox,
    closeProductLightbox: closeLightbox,
    get isLightboxOpen() { return !!lightbox && lightbox.classList.contains('is-open'); }
  };

  console.log('Showroom 3D Tekmak pronto em Modal Fullscreen sob demanda (0% GPU em repouso).');
})();
