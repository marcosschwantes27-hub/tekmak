/* ==============================================================================
   TEKMAK DO BRASIL — Showroom 3D Dedicado: Linha de Prensas Térmicas Industriais
   Three.js r128 + GLTFLoader + MeshoptDecoder — Padrão e Regras do Showroom TekMak
   - Carrossel de 5 modelos de prensas industriais de alta performance:
     1. Prensa Industrial Dupla (Frente e Verso com Tampas Articuladas 75°)
     2. Prensa Pneumática Dupla (Cabeçote Deslizante Linear 0,89m e Bandejas Silicone)
     3. Prensa Articulada 100×80 (Pneumática Clássica com Tampa Articulada)
   - Transição fluida entre equipamentos (GPU Cache 0ms)
   - Interações personalizadas: arraste de tampa, arraste de cabeçote e inspeção 3D
   - Sleep Mode inteligente (0% CPU / 0% GPU em repouso)
   ============================================================================== */

(function initTekmakPrensaShowroom() {
  'use strict';

  const modal = document.getElementById('showroomModalPrensa');
  const stage = document.getElementById('showcasePrensaStage');
  const canvas = document.getElementById('showcasePrensaCanvas');
  const closeBtn = document.getElementById('scModalPrensaClose');
  const backdrop = document.getElementById('scModalPrensaBackdrop');
  const loader = document.getElementById('scPrensaLoader');
  const hintEl = document.getElementById('scPrensaHint');
  const prevBtn = document.getElementById('scPrensaStagePrev');
  const nextBtn = document.getElementById('scPrensaStageNext');

  if (!modal || !canvas) return;

  // ----------------------------------------------------------------------------
  // DADOS DOS 3 MODELOS DE PRENSAS TÉRMICAS INDUSTRIAIS (SEM TEXTO POR ENQUANTO)
  // ----------------------------------------------------------------------------
  const PRENSAS = [
        {
      id: 'prensa-industrial-dupla',
      watermark: 'PRENSA PNEUMÁTICA',
      category: 'GRANDE FORMATO · ALTA PRODUTIVIDADE',
      titleId: 'PRENSA PNEUMÁTICA',
      titleSub: 'SEMIAUTOMÁTICA · DUAS BANDEJAS',
      speedHighlight: '<span>120×100 CM</span><span class="sc-sh-div">|</span><span>120×150 CM</span>',
      desc: 'Para sublimação, transfer e peças têxteis de grande formato. Duas bandejas mantêm o fluxo produtivo; o acionamento pneumático oferece pressão uniforme, menos esforço e maior padronização.',
      specs: [
        { k: 'TAMANHOS', v: '120×100 cm ou 120×150 cm' },
        { k: 'BANDEJAS', v: 'Duas estações' },
        { k: 'OPERAÇÃO', v: 'Semiautomática' },
        { k: 'ACIONAMENTO', v: 'Pneumático' },
        { k: 'CONTROLES', v: 'Tempo e temperatura' },
        { k: 'APLICAÇÕES', v: 'Sublimação, transfer e têxteis' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO',
      ctaMsg: 'Olá, gostaria de uma cotação da Prensa Pneumática Semiautomática Tekmak com duas bandejas, nos tamanhos 120×100 cm ou 120×150 cm.',
      appsSubtitle: '',
      examples: [],
      path: 'assets/prensa_industrial_leve_final.glb',
      scaleDesktop: 0.9792,
      offsetX: 0.38,
      scaleMobile: 0.94464,
      offsetY: -0.10,
      hint: 'Arraste as bandejas para inserir ou retirar',
      type: 'double-lid',
      hasDescription: true
    },
        {
      id: 'prensa-dupla-deslizante',
      watermark: 'PRENSA AUTOMÁTICA',
      category: 'DTF PROFISSIONAL · DUAS BANDEJAS',
      titleId: 'PRENSA PNEUMÁTICA AUTOMÁTICA',
      titleSub: '40×60 CM · DUAS BANDEJAS',
      speedHighlight: '<span>MAIS PRODUTIVIDADE</span><span class="sc-sh-div">|</span><span>PRESSÃO UNIFORME</span>',
      desc: 'Prense uma peça enquanto prepara a próxima. O sistema pneumático oferece pressão uniforme, repetibilidade e menos esforço para acelerar DTF, sublimação e transfer.',
      specs: [
        { k: 'ÁREA DE PRENSAGEM', v: '40×60 cm' },
        { k: 'ESTAÇÕES', v: 'Duas bandejas' },
        { k: 'ACIONAMENTO', v: 'Pneumático' },
        { k: 'OPERAÇÃO', v: 'Automática' },
        { k: 'CONTROLES', v: 'Tempo e temperatura' },
        { k: 'APLICAÇÕES', v: 'DTF, sublimação e transfer' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO',
      ctaMsg: 'Olá, gostaria de uma cotação da Prensa Pneumática Automática Tekmak 40×60 cm com duas bandejas.',
      appsSubtitle: '',
      examples: [],
      path: 'assets/prensa_dupla_deslizante_leve_final.glb',
      scaleDesktop: 0.90,
      scaleMobile: 0.78,
      offsetY: -0.12,
      headTravel: 0.89,
      hint: 'Ciclo automático de deslocamento e prensagem',
      type: 'sliding-head',
      hasDescription: true
    },
        {
      id: 'prensa-compacta',
      watermark: 'PRENSA PNEUMÁTICA',
      category: 'DTF LOCALIZADO · ALTA PRECISÃO',
      titleId: 'PRENSA PNEUMÁTICA',
      titleSub: '10×15 CM · DUAS BANDEJAS',
      speedHighlight: '<span>DTF LOCALIZADO</span><span class="sc-sh-div">|</span><span>PRESSÃO UNIFORME</span>',
      desc: 'Compacta, fácil de operar e precisa para logos, etiquetas, nomes e pequenas estampas. Pressão pneumática uniforme reduz o esforço e agiliza aplicações localizadas em DTF.',
      specs: [
        { k: 'ÁREA DE PRENSAGEM', v: '10×15 cm' },
        { k: 'ESTAÇÕES', v: 'Duas bandejas' },
        { k: 'ACIONAMENTO', v: 'Pneumático' },
        { k: 'PRESSÃO', v: 'Uniforme e padronizada' },
        { k: 'CONTROLES', v: 'Tempo e temperatura' },
        { k: 'IDEAL PARA', v: 'Logos, etiquetas e pequenas estampas' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO',
      ctaMsg: 'Olá, gostaria de uma cotação da Prensa Pneumática Tekmak 10×15 cm com duas bandejas.',
      appsSubtitle: '',
      examples: [],
      path: 'assets/prensa_compacta_leve_final.glb',
      scaleDesktop: 1.65,
      scaleMobile: 1.35,
      offsetY: -0.10,
      headTravel: 0.40,
      hint: 'Ciclo automático de deslocamento e prensagem',
      type: 'sliding-head',
      hasDescription: true
    },
        {
      id: 'tk001',
      watermark: 'PRENSA MANUAL',
      category: 'PERSONALIZAÇÃO TÊXTIL · OPERAÇÃO MANUAL',
      titleId: 'PRENSA TÉRMICA MANUAL',
      titleSub: '38×38 E 40×60 CM',
      speedHighlight: '<span>38×38 CM</span><span class="sc-sh-div">|</span><span>40×60 CM</span>',
      desc: 'Compacta, versátil e fácil de operar, oferece ótimo custo-benefício para iniciar ou apoiar produções profissionais. Ajuste tempo, temperatura e pressão para personalizar camisetas, uniformes e tecidos via DTF, sublimação ou transfer.',
      specs: [
        { k: 'TAMANHOS', v: '38×38 cm ou 40×60 cm' },
        { k: 'OPERAÇÃO', v: 'Manual' },
        { k: 'CONTROLES', v: 'Tempo e temperatura' },
        { k: 'PRESSÃO', v: 'Ajustável' },
        { k: 'APLICAÇÕES', v: 'DTF, sublimação e transfer' },
        { k: 'INDICAÇÃO', v: 'Camisetas, uniformes e tecidos' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO',
      ctaMsg: 'Olá, gostaria de uma cotação da Prensa Térmica Manual Tekmak nos tamanhos 38×38 cm e 40×60 cm.',
      appsSubtitle: '',
      examples: [],
      path: 'assets/prensa_tk001_showroom.glb',
      scaleDesktop: 2.25,
      scaleMobile: 1.90,
      rotationY: -56,
      rotationX: 0.28,
      offsetY: -0.08,
      hint: 'Arraste a alavanca para abrir; puxe o puxador para retirar a bandeja',
      type: 'manual-combo',
      hasDescription: true
    },
        {
      id: 'prensa-semiautomatica-dupla',
      watermark: 'PRENSA PNEUMÁTICA',
      category: 'DTF PROFISSIONAL · ALTA PRODUTIVIDADE',
      titleId: 'PRENSA PNEUMÁTICA',
      titleSub: 'SEMIAUTOMÁTICA · 40×60 CM',
      speedHighlight: '<span>2 BANDEJAS</span><span class="sc-sh-div">|</span><span>40×60 CM</span>',
      desc: 'Mais produtividade e padronização em DTF: pressão pneumática uniforme, menos esforço e duas bandejas para preparar uma peça enquanto outra prensa.',
      specs: [
        { k: 'ÁREA DE PRENSAGEM', v: '40×60 cm' },
        { k: 'ESTAÇÕES', v: 'Duas bandejas' },
        { k: 'ACIONAMENTO', v: 'Pneumático (ar comprimido)' },
        { k: 'OPERAÇÃO', v: 'Semiautomática' },
        { k: 'CONTROLES', v: 'Tempo e temperatura' },
        { k: 'APLICAÇÃO', v: 'DTF, camisetas, uniformes e moletons' }
      ],
      ctaText: 'SOLICITAR COTAÇÃO',
      ctaMsg: 'Olá, gostaria de uma cotação da Prensa Pneumática Semiautomática Tekmak 40×60 cm com duas bandejas.',
      appsSubtitle: '',
      examples: [],
      path: 'assets/prensa_semiautomatica_showroom.glb',
      scaleDesktop: 0.82,
      scaleMobile: 0.70,
      offsetY: -0.12,
      hint: 'Ciclo automático entre as duas estações de prensagem',
      type: 'embedded-cycle',
      hasDescription: true
    },
    {
      id: 'tk2100',
      watermark: 'PRENSA',
      category: '',
      titleId: '',
      titleSub: '',
      speedHighlight: '',
      desc: '',
      specs: [],
      ctaText: '',
      ctaMsg: '',
      appsSubtitle: '',
      examples: [],
      path: 'assets/prensa_tk2100_showroom.glb',
      scaleDesktop: 0.86,
      scaleMobile: 0.72,
      offsetY: -0.10,
      hint: 'Prensa TK2100/65-2 — arraste para girar e role para aproximar',
      type: 'static',
      hasDescription: false
    }
  ];

  const TOTAL = PRENSAS.length;
  let activeIndex = 0;
  let outgoingIndex = 0;
  let incomingIndex = 0;
  let transitionProgress = 1.0;
  let transitionDirection = 1;
  let transitionStartTime = 0;
  const TRANSITION_DURATION = 420; // ms
  let isTransitioning = false;

  // ----------------------------------------------------------------------------
  // REGRAS DE ROTAÇÃO E CÂMERA IDÊNTICAS AO SHOWROOM PRINCIPAL
  // ----------------------------------------------------------------------------
  const NOBLE_ROT_Y = THREE.MathUtils.degToRad(22); // 22 graus = visão nobre de catálogo
  const MAX_ROT_Y = THREE.MathUtils.degToRad(80);   // Trava de limite de rotação
  const SWAY_AMP = THREE.MathUtils.degToRad(6);     // Leve oscilação suave de ±6 graus
  let swayTime = 0.0;
  let swayFramesCount = 0;
  const constrainedDevice = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  const MAX_SWAY_FRAMES = constrainedDevice ? 30 * 4 : 60 * 8; // ~8 segundos de oscilação antes do Sleep Mode

  let userRotationY = NOBLE_ROT_Y;
  let targetRotationY = userRotationY;
  let userRotationX = 0.04;
  let targetRotationX = 0.04;

  let isDraggingCamera = false;
  let isInteractingPart = false;
  let interactionPartType = null;
  let startX = 0;
  let startY = 0;
  let startRotY = 0;
  let startRotX = 0;

  // Variáveis para partes móveis
  // 1. Tampa articulada (prensa-articulada)
  let currentLidAngle = 28;
  let targetLidAngle = 28;
  let handleDragStartY = 0;
  let handleDragStartAngle = 28;

  // 2. Dupla tampa (prensa-industrial-dupla)
  let currentDoubleLidAngle = 0;
  let targetDoubleLidAngle = 0;
  let activeDoubleLidSide = 'front'; // 'front' | 'rear'

  // 3. Cabeçote deslizante (prensa-dupla-deslizante e prensa-compacta)
  function getHeadTravel() {
    return PRENSAS[activeIndex]?.headTravel || 0.89;
  }
  let currentHeadX = 0;
  let targetHeadX = 0;
  let headDragStartX = 0;
  let headDragStartPosX = 0;

  // Estado do Motor Three.js
  let renderer = null;
  let scene = null;
  let camera = null;
  const prensaGroups = [];

  let isVisible = false;
  let isSleeping = true;
  let autoRotate = true;
  let idleTimer = null;
  let animFrameId = null;

  let cachedRestX = 0.22;
  let cachedRestY = -0.10;
  let defaultCamDist = 5.6;

  // Raycaster para partes interativas
  const raycaster = new THREE.Raycaster();
  const pointerVec = new THREE.Vector2();

  function getOptimalDpr() {
    const isMobile = window.innerWidth <= 860;
    const maxDpr = isMobile ? 1.0 : 1.35;
    return Math.min(window.devicePixelRatio || 1, maxDpr);
  }

  // ----------------------------------------------------------------------------
  // INICIALIZAÇÃO DO THREE.JS (ESTÚDIO PBR IDÊNTICO ÀS IMPRESSORAS)
  // ----------------------------------------------------------------------------
  function initThree() {
    if (renderer) return;

    const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 860;
    const powerPref = isMobileDevice ? 'default' : 'high-performance';

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: powerPref,
        precision: 'highp',
        stencil: false,
        depth: true
      });
    } catch (err) {
      console.warn('WebGL indisponível para o Showroom de Prensas.', err);
      return;
    }

    renderer.setPixelRatio(getOptimalDpr());
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.2, 50);

    // Iluminação PBR de Estúdio com Alto Contraste e Cores Vivas (Sem Lavar)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x828c9b, 0.42));

    const keyLight = new THREE.DirectionalLight(0xfffaee, 1.30);
    keyLight.position.set(-2.6, 5.0, 4.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdce7ff, 0.45);
    fillLight.position.set(2.8, 2.5, 3.5);
    scene.add(fillLight);

    const topBackLight = new THREE.DirectionalLight(0xffffff, 0.55);
    topBackLight.position.set(0, 5.5, -3.5);
    scene.add(topBackLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
    rimLight.position.set(3.2, 3.8, -3.2);
    scene.add(rimLight);

    // Softboxes para Reflexos Metálicos Nobres com Fundo Escuro para Máxima Saturação
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x10141a);
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(18, 14, 18),
      new THREE.MeshBasicMaterial({ color: 0x0c0f14, side: THREE.BackSide })
    );
    studio.add(room);

    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    topSoftbox.position.set(0, 6.0, 0);
    topSoftbox.rotation.x = Math.PI / 2;
    studio.add(topSoftbox);

    const keySoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    keySoftbox.position.set(-5, 3.0, 4.5);
    keySoftbox.lookAt(0, 0, 0);
    studio.add(keySoftbox);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(studio, 0.04);
    scene.environment = env.texture;
    pmrem.dispose();
    studio.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    // Cria os grupos de cada prensa
    PRENSAS.forEach((m, idx) => {
      const group = new THREE.Group();
      group.userData = {
        index: idx,
        isLoaded: false,
        isLoading: false,
        model: null,
        hingeNode: null,
        handleHitbox: null,
        frontLidNode: null,
        rearLidNode: null,
        headNode: null
      };
      group.visible = false;
      scene.add(group);
      prensaGroups.push(group);
    });

    setupInteractions();
  }

  // ----------------------------------------------------------------------------
  // CARREGAMENTO DO MODELO 3D (GLB) COM TRATAMENTO DE MATERIAIS
  // ----------------------------------------------------------------------------
  // Ciclos em coordenadas originais do GLB, antes da escala do showroom.
  function automaticCycle(model, index) {
    if (index === 0) {
      const front = model.getObjectByName('BANDEJA_MOVEL_DIANTEIRA');
      const rear = model.getObjectByName('BANDEJA_MOVEL_TRASEIRA');
      if (!front || !rear) throw new Error('Bandejas móveis ausentes');
      const travel = 0.70;
      const frontInside = front.position.z - travel;
      const rearInside = rear.position.z + travel;
      front.position.z = frontInside;
      model.userData.manualTrays = {
        front: {node:front, inside:frontInside, sign:1, amount:0},
        rear: {node:rear, inside:rearInside, sign:-1, amount:1}
      };
      return null;
    }
    if (index > 2) return null;
    const head = model.getObjectByName('CABECOTE_DESLIZANTE');
    if (!head) throw new Error('Cabeçote deslizante ausente');
    if (index === 1) {
      const cycle = window.TekmakDualPress.connect(head, THREE);
      return window.TekmakDualPress.shuttle(head, cycle, 0);
    }
    const press = window.TekmakPress.connect(head, THREE, () => {});
    return window.TekmakPress.shuttle(head, press, 0, () => {}, 0.40);
  }

  function setupManualCombo(model, animations) {
    const lidClip = animations.find(clip => clip.name === 'Abrir_fechar');
    const trayClip = animations.find(clip => clip.name === 'Retirar_bandeja');
    if (!lidClip || !trayClip) throw new Error('Clipes manuais do TK-001 ausentes');

    const mixer = new THREE.AnimationMixer(model);
    const lidAction = mixer.clipAction(lidClip);
    const trayAction = mixer.clipAction(trayClip);
    [lidAction, trayAction].forEach(action => {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      action.paused = true;
    });
    return { mixer, lidAction, trayAction, lid: 0, tray: 0 };
  }

  function setManualComboPose(group, kind, amount) {
    const state = group?.userData.manualCombo;
    if (!state) return;
    amount = THREE.MathUtils.clamp(amount, 0, 1);
    if (kind === 'tray' && state.lid < 0.25) return;
    if (kind === 'lid' && state.tray > 0.001) amount = Math.max(0.25, amount);
    if (kind === 'lid') state.lid = amount;
    else state.tray = amount;
    state.lidAction.time = state.lid * state.lidAction.getClip().duration;
    state.trayAction.time = state.tray * state.trayAction.getClip().duration;
    state.mixer.update(0);
    group.userData.model.updateMatrixWorld(true);
  }

  function loadPrensa(idx, callback, isUrgent = false) {
    const group = prensaGroups[idx];
    const m = PRENSAS[idx];
    if (!group || !m) return;

    if (group.userData.isLoaded && group.userData.model) {
      if (callback) callback(group);
      return;
    }

    if (group.userData.isLoading) {
      if (isUrgent && loader) loader.classList.add('is-active');
      const waitTimer = setInterval(() => {
        if (group.userData.isLoaded && group.userData.model) {
          clearInterval(waitTimer);
          if (loader) loader.classList.remove('is-active');
          if (callback) callback(group);
        } else if (!group.userData.isLoading) {
          clearInterval(waitTimer);
          if (loader) loader.classList.remove('is-active');
        }
      }, 30);
      return;
    }

    group.userData.isLoading = true;
    if (isUrgent && loader) loader.classList.add('is-active');

    const gltfLoader = new THREE.GLTFLoader();
    if (typeof MeshoptDecoder !== 'undefined') {
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }

    gltfLoader.load(
      m.path,
      gltf => {
        const pressModel = gltf.scene;

        // Materiais e Acabamento com Cores Vivas e Contraste Nobre
        pressModel.traverse(node => {
          if (node.isMesh) {
            node.castShadow = false;
            node.receiveShadow = false;
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach(mat => {
              const name = (mat.name || '').toLowerCase();

              // 1. Amarelo Tekmak Vibrante
              if (name.includes('amarelo') || name.includes('amarela')) {
                mat.color = new THREE.Color('#FF9F00').convertSRGBToLinear();
                mat.roughness = 0.28;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.35;
                if (mat.clearcoat !== undefined) {
                  mat.clearcoat = 0.25;
                  mat.clearcoatRoughness = 0.15;
                }
              }
              // 2. Chassis Preto Acetinado e Borrachas
              else if (name.includes('preto') || name.includes('preta') || name.includes('borracha') || name.includes('recesso')) {
                mat.color = new THREE.Color(0x101215).convertSRGBToLinear();
                mat.roughness = name.includes('borracha') ? 0.82 : 0.40;
                mat.metalness = name.includes('borracha') ? 0.0 : 0.08;
                mat.envMapIntensity = 0.30;
              }
              // 3. Metais e Usinagens (Aço Polido, Alumínio Escovado e Galvanizado)
              else if (name.includes('aluminio') || name.includes('aço') || name.includes('aco') || name.includes('zincad') || name.includes('chapa') || name.includes('torneado') || name.includes('metalica') || name.includes('latão') || name.includes('latao')) {
                mat.color = new THREE.Color(name.includes('latão') || name.includes('latao') ? '#d4af37' : 0xd8dee8).convertSRGBToLinear();
                mat.metalness = 0.90;
                mat.roughness = name.includes('polido') ? 0.12 : 0.22;
                mat.envMapIntensity = 1.25;
              }
              // 4. Manta Térmica, Superfície Branca e Etiquetas
              else if (name.includes('manta') || name.includes('branco') || name.includes('branca') || name.includes('leitoso')) {
                mat.color = new THREE.Color(0xeff1f5).convertSRGBToLinear();
                mat.roughness = 0.36;
                mat.metalness = 0.0;
                mat.envMapIntensity = 0.35;
              }
              // 5. Silicone Vermelho e Molas
              else if (name.includes('silicone') || name.includes('vermelh') || name.includes('mola')) {
                mat.color = new THREE.Color('#D8001E').convertSRGBToLinear();
                mat.roughness = name.includes('silicone') ? 0.42 : 0.24;
                mat.metalness = name.includes('mola') ? 0.30 : 0.02;
                mat.envMapIntensity = 0.35;
              }
              // 6. Mangueiras Pneumáticas Laranja
              else if (name.includes('laranja')) {
                mat.color = new THREE.Color('#FF4500').convertSRGBToLinear();
                mat.roughness = 0.28;
                mat.metalness = 0.02;
                mat.envMapIntensity = 0.35;
              }
              // 7. Displays e LEDs Digitais
              else if (name.includes('azul')) {
                mat.color = new THREE.Color('#0066FF').convertSRGBToLinear();
                mat.emissive = new THREE.Color('#0055EE');
                mat.emissiveIntensity = 1.4;
              } else if (name.includes('digitos vermelhos') || name.includes('led vermelho')) {
                mat.color = new THREE.Color('#FF1122').convertSRGBToLinear();
                mat.emissive = new THREE.Color('#FF0011');
                mat.emissiveIntensity = 1.6;
              } else if (name.includes('digitos verdes') || name.includes('led verde') || name.includes('verde led')) {
                mat.color = new THREE.Color('#00DD44').convertSRGBToLinear();
                mat.emissive = new THREE.Color('#00DD44');
                mat.emissiveIntensity = 1.6;
              } else if (name.includes('tela metalica') || name.includes('tela metálica')) {
                mat.metalness = 0.85;
                mat.roughness = 0.30;
                mat.envMapIntensity = 1.20;
              }

              if (mat.map) {
                mat.envMapIntensity = Math.min(mat.envMapIntensity !== undefined ? mat.envMapIntensity : 1, 0.30);
                if (renderer.capabilities) {
                  mat.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
                  mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                  mat.map.magFilter = THREE.LinearFilter;
                  mat.map.generateMipmaps = true;
                }
              }
            });
          }
        });

        group.userData.automaticCycle = automaticCycle(pressModel, idx);
        group.userData.cycleTime = 0;
        if (m.type === 'manual-combo') {
          group.userData.manualCombo = setupManualCombo(pressModel, gltf.animations);
        } else if (m.type === 'embedded-cycle') {
          const clip = gltf.animations.find(animation => animation.name === 'Ciclo_duas_estacoes');
          if (!clip) throw new Error('Clipe de duas estações ausente');
          const mixer = new THREE.AnimationMixer(pressModel);
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          group.userData.embeddedMixer = mixer;
          group.userData.embeddedAction = action;
          group.userData.hasContinuousAnimation = true;
        }

        // Bounding Box e Centralização em Torno da Origem
        const box = new THREE.Box3().setFromObject(pressModel);
        const center = box.getCenter(new THREE.Vector3());
        pressModel.position.set(-center.x, -center.y, -center.z);

        const isMobile = window.innerWidth <= 860;
        const initialScale = isMobile ? (m.scaleMobile || 0.90) : (m.scaleDesktop || 1.05);
        pressModel.scale.setScalar(initialScale);
        if (m.rotationY) pressModel.rotation.y = THREE.MathUtils.degToRad(m.rotationY);

        group.add(pressModel);
        group.userData.model = pressModel;

        // Detecta nós específicos de acordo com o tipo de máquina
        if (m.type === 'hinged-lid') {
          const hinge = pressModel.getObjectByName('Tampa_articulada');
          group.userData.hingeNode = hinge;
          if (hinge) {
            const hitboxGeo = new THREE.BoxGeometry(0.50, 0.24, 0.34);
            const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
            const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
            hitbox.position.set(0, -0.08, 1.10);
            hitbox.name = 'Puxador_hitbox';
            hinge.add(hitbox);
            group.userData.handleHitbox = hitbox;
            hinge.rotation.x = -THREE.MathUtils.degToRad(currentLidAngle);
          }
        } else if (m.type === 'double-lid') {
          group.userData.frontLidNode = pressModel.getObjectByName('BANDEJA_MOVEL_DIANTEIRA');
          group.userData.rearLidNode = pressModel.getObjectByName('BANDEJA_MOVEL_TRASEIRA');
        } else if (m.type === 'sliding-head') {
          group.userData.headNode = pressModel.getObjectByName('CABECOTE_DESLIZANTE');
        }

        lastRotY = null; // Força o primeiro desenho depois do carregamento.
        group.userData.isLoaded = true;
        group.userData.isLoading = false;

        if (loader) loader.classList.remove('is-active');
        wakeUp();

        if (callback) callback(group);

        // Os outros modelos carregam apenas ao navegar pelo carrossel.

      },
      undefined,
      err => {
        console.error('Erro ao carregar modelo da prensa:', m.path, err);
        group.userData.isLoading = false;
        if (loader) {
          loader.classList.remove('is-active');
          loader.innerHTML = '<span style="color:#e11d48">Erro ao carregar modelo 3D.</span>';
        }
      }
    );
  }

  // ----------------------------------------------------------------------------
  // ATUALIZAÇÃO DO POSICIONAMENTO E RESPONSIVIDADE
  // ----------------------------------------------------------------------------
  function updateModelTransform() {
    if (!camera) return;
    const isMobile = window.innerWidth <= 860;
    const isNoHud = modal.classList.contains('no-hud');
    const currentModel = PRENSAS[activeIndex];
    const hasDesc = currentModel && currentModel.hasDescription && !isNoHud;
    const isPortraitShowroom = !isMobile && camera.aspect < 1.05 && hasDesc;

    if (isMobile || !hasDesc || isPortraitShowroom) {
      cachedRestX = 0;
      cachedRestY = isPortraitShowroom ? -1.25 : currentModel?.offsetY || -0.10;
      defaultCamDist = isPortraitShowroom ? 6.3 : isMobile ? 6.2 : 5.6;
      camera.fov = isMobile || isPortraitShowroom ? 38 : 32;
    } else {
      const base = Math.min(1.00, Math.max(0.62, (camera.aspect - 1.15) * 1.08));
      cachedRestX = base + (currentModel?.offsetX ?? 0.20);
      cachedRestY = currentModel?.offsetY || -0.10;
      defaultCamDist = 5.6;
      camera.fov = 32;
    }

    camera.position.set(0, 0, defaultCamDist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    prensaGroups.forEach((g, idx) => {
      const m = PRENSAS[idx];
      if (!m) return;
      const targetScale = isMobile ? (m.scaleMobile || 0.90) : (m.scaleDesktop || 1.05);
      if (g.userData.model) {
        g.userData.model.scale.setScalar(targetScale);
      }
      if (!isTransitioning && idx === activeIndex) {
        g.position.set(cachedRestX, cachedRestY, 0);
        g.rotation.y = userRotationY;
        g.rotation.x = userRotationX;
      }
    });
  }

  // ----------------------------------------------------------------------------
  // TRANSIÇÃO DE CARROSSEL ENTRE PRENSAS (DESLIZAMENTO SUAVE EM 3D)
  // ----------------------------------------------------------------------------
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
      modal.classList.toggle('no-hud', !PRENSAS[activeIndex]?.hasDescription);
      transitionProgress = 0.0;
      transitionStartTime = performance.now();
      isTransitioning = true;
      autoRotate = true;

      targetHeadX = 0;
      currentHeadX = 0;
      targetRotationX = PRENSAS[incomingIndex]?.rotationX ?? 0.04;
      const targetGrp = prensaGroups[incomingIndex];
      if (targetGrp && targetGrp.userData.headNode && !targetGrp.userData.automaticCycle) {
        targetGrp.userData.headNode.position.x = 0;
      }

      updateModelTransform();
      updateHUD(activeIndex);
      updateHint(activeIndex);
    };

    if (prensaGroups[targetIdx]?.userData?.isLoaded) {
      doTransition();
    } else {
      loadPrensa(targetIdx, doTransition, true);
    }
  }

  function next() {
    goTo((activeIndex + 1) % TOTAL, 1);
  }

  function prev() {
    goTo((activeIndex - 1 + TOTAL) % TOTAL, -1);
  }

  // ----------------------------------------------------------------------------
  // ATUALIZAÇÃO DO HUD EDITORIAL (TEXTOS, SPECS, CTA E APLICAÇÕES)
  // ----------------------------------------------------------------------------
  const scContentCol = document.getElementById('scPrensaContentCol');
  const scWatermark = document.getElementById('scPrensaWatermark');
  const scTitle = document.getElementById('scPrensaTitle');
  const scSpeedHighlight = document.getElementById('scPrensaSpeedHighlight');
  const scDesc = document.getElementById('scPrensaDesc');
  const scSpecs = document.getElementById('scPrensaSpecs');
  const scCta = document.getElementById('scPrensaCta');
  const scAppsSubtitle = document.getElementById('scPrensaAppsSubtitle');
  const scAppsGrid = document.getElementById('scPrensaAppsGrid');

  function renderPrensaInfo(m) {
    if (scWatermark) scWatermark.textContent = m.watermark || 'PRENSA';
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
    if (scAppsSubtitle) {
      scAppsSubtitle.innerHTML = m.appsSubtitle || 'ESTAMPARIA TÊXTIL';
    }
    const scAppsWrap = scAppsGrid && scAppsGrid.closest('.sc-apps-wrap');
    if (scAppsWrap) scAppsWrap.style.display = m.examples?.length ? '' : 'none';
    if (scAppsGrid && Array.isArray(m.examples)) {
      scAppsGrid.innerHTML = m.examples.map((ex, exIdx) => `
        <button type="button" class="sc-app-card" data-app-prensa-idx="${exIdx}" title="Clique para ver em tela cheia: ${ex.title}">
          <div class="sc-app-img-wrap">
            <img src="${ex.img}" alt="${ex.title}" loading="lazy" />
            <div class="sc-app-zoom" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
          </div>
          <span class="sc-app-title">${ex.label || ex.title}</span>
        </button>
      `).join('');
      attachLightboxEvents();
    }
    const scCtaWrap = scCta && scCta.closest('.sc-cta-wrap');
    if (scCtaWrap) scCtaWrap.style.display = m.ctaText ? '' : 'none';
    if (scCta) {
      scCta.target = '_blank';
      scCta.rel = 'noopener noreferrer';
      scCta.innerHTML = `${m.ctaText || 'SOLICITAR COTAÇÃO'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      const phone = '5519989825441';
      scCta.href = `https://wa.me/${phone}?text=${encodeURIComponent(m.ctaMsg || ('Olá, gostaria de uma cotação da ' + (m.titleId || 'Prensa Tekmak')))}`;
    }
  }

  let isFirstHud = true;
  function updateHUD(idx) {
    if (!scContentCol) return;
    const m = PRENSAS[idx];
    if (!m) return;

    if (modal.classList.contains('no-hud') || !m.hasDescription) {
      scContentCol.classList.add('is-hidden');
      scContentCol.style.display = 'none';
      if (scWatermark) scWatermark.textContent = m.watermark || 'PRENSA';
      return;
    }

    scContentCol.style.display = '';
    if (isFirstHud) {
      isFirstHud = false;
      renderPrensaInfo(m);
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
        renderPrensaInfo(m);
        scContentCol.style.opacity = '';
        scContentCol.style.transform = '';
        fadeElements.forEach(el => {
          el.style.opacity = '';
          el.style.transform = '';
        });
      }, 160);
    }
  }

  function updateHint(idx) {
    if (!hintEl) return;
    if (modal.classList.contains('no-hud')) {
      hintEl.style.display = 'none';
      return;
    }
    hintEl.style.display = '';
    const m = PRENSAS[idx];
    if (!m) return;
    const counterText = `${idx + 1} / ${TOTAL}`;
    hintEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>
      </svg>
      <span>${m.hint} · ${counterText}</span>
    `;
  }

  // ----------------------------------------------------------------------------
  // DETECÇÃO DE PARTES MÓVEIS (TAMPA, CABEÇOTE, PUXADOR)
  // ----------------------------------------------------------------------------
  function getActiveGroup() {
    return prensaGroups[activeIndex];
  }

  function hitTestPart(clientX, clientY) {
    if (!camera || !stage || getActiveGroup()?.userData.automaticCycle) return null;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 ||
        clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

    pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerVec, camera);

    const activeGroup = getActiveGroup();
    if (!activeGroup || !activeGroup.userData.isLoaded) return null;
    const m = PRENSAS[activeIndex];

    if (m.type === 'manual-combo') {
      const hit = raycaster.intersectObject(activeGroup.userData.model, true)[0];
      if (hit?.object?.name?.startsWith('PUXADOR_BANDEJA')) {
        return activeGroup.userData.manualCombo.lid >= 0.25 ? { type: 'manual-combo-tray' } : null;
      }
      for (let node = hit?.object; node; node = node.parent) {
        if (node.name === 'ALAVANCA_MANUAL') return { type: 'manual-combo-lid' };
      }
    } else if (m.type === 'hinged-lid') {
      const hitbox = activeGroup.userData.handleHitbox;
      const hinge = activeGroup.userData.hingeNode;
      if (hitbox && raycaster.intersectObject(hitbox, false).length > 0) {
        return { type: 'hinged-lid' };
      }
      if (hinge) {
        const hits = raycaster.intersectObjects(hinge.children, true);
        if (hits.length > 0) {
          for (let i = 0; i < hits.length; i++) {
            const h = hits[i];
            if (h.object && h.point) {
              const localPt = h.object.worldToLocal(h.point.clone());
              if (localPt.z >= 0.45 && Math.abs(localPt.x) <= 0.35) {
                return { type: 'hinged-lid' };
              }
            }
          }
        }
      }
    } else if (m.type === 'double-lid') {
      const front = activeGroup.userData.frontLidNode;
      const rear = activeGroup.userData.rearLidNode;
      if (front && raycaster.intersectObject(front, true).length > 0) {
        return { type: 'manual-tray', side: 'front' };
      }
      if (rear && raycaster.intersectObject(rear, true).length > 0) {
        return { type: 'manual-tray', side: 'rear' };
      }
    } else if (m.type === 'sliding-head') {
      const head = activeGroup.userData.headNode;
      if (head && raycaster.intersectObject(head, true).length > 0) {
        return { type: 'sliding-head' };
      }
    }

    return null;
  }

  // ----------------------------------------------------------------------------
  // INTERAÇÕES TOUCH, MOUSE E ARRASTE
  // ----------------------------------------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;

  function setupInteractions() {
    if (!stage) return;

    function onPointerDown(e) {
      wakeUp();
      autoRotate = false;
      clearTimeout(idleTimer);

      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      touchStartX = clientX;
      touchStartY = clientY;

      const hit = hitTestPart(clientX, clientY);

      if (hit) {
        isInteractingPart = true;
        interactionPartType = hit.type;
        isDraggingCamera = false;

        if (hit.type === 'hinged-lid') {
          handleDragStartY = clientY;
          handleDragStartAngle = currentLidAngle;
          targetLidAngle = currentLidAngle;
        } else if (hit.type === 'manual-tray') {
          activeDoubleLidSide = hit.side;
          handleDragStartY = clientY;
          handleDragStartAngle = getActiveGroup().userData.model.userData.manualTrays[hit.side].amount;
        } else if (hit.type === 'double-lid') {
          activeDoubleLidSide = hit.side;
          handleDragStartY = clientY;
          handleDragStartAngle = currentDoubleLidAngle;
          targetDoubleLidAngle = currentDoubleLidAngle;
        } else if (hit.type === 'sliding-head') {
          headDragStartX = clientX;
          headDragStartPosX = currentHeadX;
          targetHeadX = currentHeadX;
        } else if (hit.type === 'manual-combo-lid' || hit.type === 'manual-combo-tray') {
          handleDragStartY = clientY;
          const state = getActiveGroup().userData.manualCombo;
          handleDragStartAngle = hit.type === 'manual-combo-lid' ? state.lid : state.tray;
        }

        stage.style.cursor = 'grabbing';
        canvas.style.cursor = 'grabbing';
        if (hintEl) hintEl.style.opacity = '0.45';
      } else {
        isInteractingPart = false;
        interactionPartType = null;
        isDraggingCamera = true;
        startX = clientX;
        startY = clientY;
        startRotY = targetRotationY;
        startRotX = targetRotationX;

        stage.classList.add('is-interacting');
        stage.style.cursor = 'grabbing';
        canvas.style.cursor = 'grabbing';
      }
    }

    function onPointerMove(e) {
      if (!isVisible) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      if (isInteractingPart) {
        if (interactionPartType === 'hinged-lid') {
          const deltaY = clientY - handleDragStartY;
          targetLidAngle = THREE.MathUtils.clamp(handleDragStartAngle - (deltaY * 0.32), 0, 75);
          currentLidAngle = targetLidAngle;
          const grp = getActiveGroup();
          if (grp && grp.userData.hingeNode) {
            grp.userData.hingeNode.rotation.x = -THREE.MathUtils.degToRad(currentLidAngle);
          }
        } else if (interactionPartType === 'manual-tray') {
          const trays = getActiveGroup().userData.model.userData.manualTrays;
          const tray = trays[activeDoubleLidSide];
          const other = trays[activeDoubleLidSide === 'front' ? 'rear' : 'front'];
          const amount = THREE.MathUtils.clamp(handleDragStartAngle + (clientY - handleDragStartY) * tray.sign * 0.005, 0, 1);
          if (amount >= tray.amount || other.amount >= 0.999) {
            tray.amount = amount;
            tray.node.position.z = tray.inside + tray.sign * 0.70 * amount;
          }
        } else if (interactionPartType === 'double-lid') {
          const deltaY = clientY - handleDragStartY;
          targetDoubleLidAngle = THREE.MathUtils.clamp(handleDragStartAngle - (deltaY * 0.32), 0, 75);
          currentDoubleLidAngle = targetDoubleLidAngle;
          const grp = getActiveGroup();
          if (grp) {
            const node = activeDoubleLidSide === 'front' ? grp.userData.frontLidNode : grp.userData.rearLidNode;
            const sign = activeDoubleLidSide === 'front' ? -1 : 1;
            if (node) node.rotation.x = sign * THREE.MathUtils.degToRad(currentDoubleLidAngle);
          }
        } else if (interactionPartType === 'sliding-head') {
          const deltaX = clientX - headDragStartX;
          const sens = 0.0028;
          targetHeadX = THREE.MathUtils.clamp(headDragStartPosX + (deltaX * sens), 0, getHeadTravel());
          currentHeadX = targetHeadX;
          const grp = getActiveGroup();
          if (grp && grp.userData.headNode) {
            grp.userData.headNode.position.x = currentHeadX;
          }
        } else if (interactionPartType === 'manual-combo-lid') {
          const amount = handleDragStartAngle + (handleDragStartY - clientY) / Math.max(160, window.innerHeight * 0.32);
          setManualComboPose(getActiveGroup(), 'lid', amount);
        } else if (interactionPartType === 'manual-combo-tray') {
          const amount = handleDragStartAngle + (clientY - handleDragStartY) * 0.005;
          setManualComboPose(getActiveGroup(), 'tray', amount);
        }
        wakeUp();
      } else if (isDraggingCamera) {
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        const sensX = 0.0055;
        const sensY = 0.0030;

        targetRotationY = THREE.MathUtils.clamp(startRotY + (deltaX * sensX), -MAX_ROT_Y, MAX_ROT_Y);
        targetRotationX = THREE.MathUtils.clamp(startRotX + (deltaY * sensY), -0.04, 0.16);
        wakeUp();
      } else {
        const hit = hitTestPart(clientX, clientY);
        if (hit) {
          stage.style.cursor = 'grab';
          canvas.style.cursor = 'grab';
        } else {
          stage.style.cursor = 'default';
          canvas.style.cursor = 'default';
        }
      }
    }

    function onPointerUp(e) {
      if (!isVisible) return;

      // Suporte a swipe horizontal em dispositivos touch
      if (e && e.changedTouches && e.changedTouches[0] && !isInteractingPart) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - touchStartX;
        const diffY = endY - touchStartY;
        if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX < 0) next();
          else prev();
        }
      }

      if (isInteractingPart) {
        if (interactionPartType === 'hinged-lid') {
          if (targetLidAngle < 10) targetLidAngle = 0;
          else if (targetLidAngle > 65) targetLidAngle = 75;
        } else if (interactionPartType === 'double-lid') {
          if (targetDoubleLidAngle < 10) targetDoubleLidAngle = 0;
          else if (targetDoubleLidAngle > 65) targetDoubleLidAngle = 75;
        } else if (interactionPartType === 'sliding-head') {
          const maxTravel = getHeadTravel();
          const snapThreshold = Math.min(0.15, maxTravel * 0.35);
          if (targetHeadX < snapThreshold) targetHeadX = 0;
          else if (targetHeadX > maxTravel - snapThreshold) targetHeadX = maxTravel;
        }
        isInteractingPart = false;
        interactionPartType = null;
        if (hintEl) hintEl.style.opacity = '';
      }

      if (isDraggingCamera) {
        isDraggingCamera = false;
        stage.classList.remove('is-interacting');
      }

      stage.style.cursor = 'default';
      canvas.style.cursor = 'default';

      resetIdleTimer();
      wakeUp();
    }

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);

    if (prevBtn) {
      prevBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        prev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        next();
      });
    }

    window.addEventListener('keydown', e => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') {
        prev();
      } else if (e.key === 'ArrowRight') {
        next();
      }
    });

    attachLightboxEvents();
  }

  function attachLightboxEvents() {
    document.querySelectorAll('[data-app-prensa-idx]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-app-prensa-idx'), 10) || 0;
        openPrensaLightbox(idx);
      };
    });
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      wakeUp();
      const ratio = THREE.MathUtils.clamp((targetRotationY - NOBLE_ROT_Y) / SWAY_AMP, -0.96, 0.96);
      swayTime = isNaN(ratio) ? 0 : Math.asin(ratio);
      autoRotate = true;
    }, 3000);
  }

  // ----------------------------------------------------------------------------
  // LIGHTBOX DE PRODUTOS PRODUZIDOS
  // ----------------------------------------------------------------------------
  function openPrensaLightbox(idx) {
    const pl = document.getElementById('productLightbox');
    const plImg = document.getElementById('plImg');
    const plTitle = document.getElementById('plTitle');
    const plBadge = document.getElementById('plMachineBadge');
    const plCounter = document.getElementById('plCounter');
    const m = PRENSAS[activeIndex];
    if (!pl || !m || !m.examples || !m.examples[idx]) return;

    const ex = m.examples[idx];
    if (plImg) plImg.src = ex.img;
    if (plTitle) plTitle.textContent = ex.title;
    if (plBadge) plBadge.textContent = ex.badge || m.titleId;
    if (plCounter) plCounter.textContent = `${idx + 1} / ${m.examples.length}`;

    pl.classList.add('is-open');
    pl.setAttribute('aria-hidden', 'false');
  }

  // ----------------------------------------------------------------------------
  // LOOP DE RENDERIZAÇÃO ULTRA-OTIMIZADO COM CAP DE 60 FPS E SLEEP MODE
  // ----------------------------------------------------------------------------
  let lastRotY = null;
  let lastRotX = null;
  let lastFrameTime = 0;
  const FRAME_INTERVAL = 1000 / (constrainedDevice ? 30 : 60);

  function animate(currentTime) {
    if (!isVisible || document.hidden) { animFrameId = null; return; }
    if (isSleeping && !getActiveGroup()?.userData.automaticCycle && !getActiveGroup()?.userData.hasContinuousAnimation && !isDraggingCamera && !isInteractingPart && !isTransitioning) {
      animFrameId = null;
      return;
    }
    animFrameId = requestAnimationFrame(animate);

    const now = currentTime || performance.now();
    const elapsed = now - lastFrameTime;
    if (elapsed < FRAME_INTERVAL - 1.5) return;
    lastFrameTime = now - (elapsed % FRAME_INTERVAL);

    let needsRender = false;

    // 1. Transição fluida de slide entre prensas
    if (isTransitioning) {
      const tElapsed = now - transitionStartTime;
      transitionProgress = Math.min(1.0, tElapsed / TRANSITION_DURATION);

      // Curva cúbica suave
      const p = 1.0 - Math.pow(1.0 - transitionProgress, 3);

      prensaGroups.forEach((g, idx) => {
        if (idx === outgoingIndex && g.userData.isLoaded) {
          g.visible = true;
          const exitX = cachedRestX - (transitionDirection * p * 9.0);
          const exitZ = -p * 5.0;
          g.position.set(exitX, cachedRestY, exitZ);
          g.rotation.y = THREE.MathUtils.clamp(userRotationY - (transitionDirection * p * 0.22), -MAX_ROT_Y, MAX_ROT_Y);
          g.rotation.x = userRotationX;
        } else if (idx === incomingIndex && g.userData.isLoaded) {
          g.visible = true;
          const enterX = cachedRestX + (transitionDirection * (1 - p) * 9.0);
          const enterZ = -(1 - p) * 5.0;
          g.position.set(enterX, cachedRestY, enterZ);
          g.rotation.y = THREE.MathUtils.clamp(userRotationY + (transitionDirection * (1 - p) * 0.22), -MAX_ROT_Y, MAX_ROT_Y);
          g.rotation.x = userRotationX;
        } else {
          g.visible = false;
        }
      });

      if (transitionProgress >= 1.0) {
        isTransitioning = false;
        prensaGroups.forEach((g, idx) => {
          if (idx === activeIndex) {
            g.visible = true;
            g.position.set(cachedRestX, cachedRestY, 0);
            g.rotation.y = userRotationY;
            g.rotation.x = userRotationX;
          } else {
            g.visible = false;
          }
        });
      }
      needsRender = true;
    } else {
      prensaGroups.forEach((g, idx) => {
        if (idx === activeIndex && g.userData.isLoaded) {
          g.visible = true;
          g.position.set(cachedRestX, cachedRestY, 0);
          g.rotation.y = userRotationY;
          g.rotation.x = userRotationX;
        } else {
          g.visible = false;
        }
      });
    }

    // Avança apenas o ciclo da prensa visível; pausa em outras abas ou ao fechar.
    const activeGroup = getActiveGroup();
    if (activeGroup?.userData.automaticCycle && !isTransitioning) {
      activeGroup.userData.cycleTime += Math.min(elapsed, 100);
      if (activeGroup.userData.automaticCycle.update(activeGroup.userData.cycleTime)) needsRender = true;
    }
    if (activeGroup?.userData.embeddedMixer && !isTransitioning) {
      activeGroup.userData.embeddedMixer.update(Math.min(elapsed, 100) / 1000);
      needsRender = true;
    }

    // 3. Oscilação suave em repouso
    if (activeIndex !== 0 && autoRotate && !isDraggingCamera && !isInteractingPart && !isTransitioning) {
      swayFramesCount++;
      if (swayFramesCount > MAX_SWAY_FRAMES) {
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
    } else if (isDraggingCamera || isInteractingPart) {
      needsRender = true;
    }

    // 4. Inércia da câmera
    const diffY = targetRotationY - userRotationY;
    const diffX = targetRotationX - userRotationX;

    if (Math.abs(diffY) > 0.0001 || Math.abs(diffX) > 0.0001) {
      userRotationY += diffY * 0.10;
      userRotationX += diffX * 0.10;
      needsRender = true;
    }

    userRotationY = THREE.MathUtils.clamp(userRotationY, -MAX_ROT_Y, MAX_ROT_Y);

    if (needsRender || lastRotY === null || Math.abs(lastRotY - userRotationY) > 0.0001 || Math.abs(lastRotX - userRotationX) > 0.0001) {
      lastRotY = userRotationY;
      lastRotX = userRotationX;
      renderer.render(scene, camera);
    }
    if (activeIndex === 0 && !isDraggingCamera && !isInteractingPart && !isTransitioning && Math.abs(diffY) < 0.0001 && Math.abs(diffX) < 0.0001) isSleeping = true;
  }

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

  stage.addEventListener('mousemove', wakeUp, { passive: true });
  stage.addEventListener('mouseenter', wakeUp, { passive: true });
  stage.addEventListener('touchstart', wakeUp, { passive: true });

  // ----------------------------------------------------------------------------
  // REDIMENSIONAMENTO
  // ----------------------------------------------------------------------------
  let lastW = 0;
  let lastH = 0;

  function resize() {
    if (!renderer || !camera || !stage) return;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    if (Math.abs(width - lastW) < 2 && Math.abs(height - lastH) < 2) return;
    lastW = width;
    lastH = height;

    renderer.setPixelRatio(getOptimalDpr());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    updateModelTransform();
    wakeUp();

    if (isVisible && renderer) {
      renderer.render(scene, camera);
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  if (stage && 'ResizeObserver' in window) {
    new ResizeObserver(resize).observe(stage);
  }

  // ----------------------------------------------------------------------------
  // ABERTURA E FECHAMENTO DO MODAL
  // ----------------------------------------------------------------------------
  function openShowroom(targetId) {
    initThree();
    if (!renderer) throw new Error('WebGL indisponível');

    // Se um ID específico foi fornecido, pula direto para ele
    if (targetId) {
      const foundIdx = PRENSAS.findIndex(p => p.id === targetId);
      if (foundIdx >= 0) {
        activeIndex = foundIdx;
      }
    }

    modal.classList.toggle('no-hud', !PRENSAS[activeIndex]?.hasDescription);

    loadPrensa(activeIndex, () => {
      updateModelTransform();
      updateHUD(activeIndex);
      updateHint(activeIndex);
    }, true);

    const printerModal = document.getElementById('showroomModal');
    if (printerModal && printerModal.classList.contains('is-open')) {
      if (window.tekmakShowroom && typeof window.tekmakShowroom.close === 'function') {
        window.tekmakShowroom.close();
      } else {
        printerModal.classList.remove('is-open');
        printerModal.setAttribute('aria-hidden', 'true');
      }
    }

    const dialog = modal.querySelector('.sc-modal-dialog');
    if (dialog) dialog.scrollTop = 0;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sc-modal-open');

    isVisible = true;
    wakeUp();

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(animate);
    }

    requestAnimationFrame(() => {
      lastW = 0;
      lastH = 0;
      resize();
      wakeUp();
    });
  }

  function closeShowroom() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    const printerModal = document.getElementById('showroomModal');
    if (!printerModal || !printerModal.classList.contains('is-open')) {
      document.body.classList.remove('sc-modal-open');
    }

    isVisible = false;
    isSleeping = true;
    autoRotate = false;
    isDraggingCamera = false;
    isInteractingPart = false;
    clearTimeout(idleTimer);
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeShowroom);
  if (backdrop) backdrop.addEventListener('click', closeShowroom);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeShowroom();
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      const pl = document.getElementById('productLightbox');
      if (pl && pl.classList.contains('is-open')) return;
      closeShowroom();
    }
  });

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-open-showroom="prensa"], [data-open-showroom="prensas"], [href="#showroomModalPrensa"], [href="#showroomPrensa"]');
    if (trigger) {
      e.preventDefault();
      openShowroom();
    }
  });

  if (window.location.hash === '#showroomModalPrensa' || window.location.hash === '#showroomPrensa') {
    setTimeout(openShowroom, 300);
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#showroomModalPrensa' || window.location.hash === '#showroomPrensa') {
      openShowroom();
    }
  });

  // API Global Pública
  window.tekmakPrensaShowroom = {
    open: openShowroom,
    close: closeShowroom,
    preload(targetId) {
      try {
        initThree();
      } catch (error) {
        console.info('WebGL indisponível para o pré-carregamento de prensas.', error);
        return Promise.resolve(false);
      }
      if (!renderer) return Promise.resolve(false);

      const targetIdx = targetId ? PRENSAS.findIndex(prensa => prensa.id === targetId) : activeIndex;
      const idx = targetIdx >= 0 ? targetIdx : 0;
      const group = prensaGroups[idx];
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

        loadPrensa(idx, () => finish(true), false);
      });
    },
    next: next,
    prev: prev,
    goTo: goTo,
    getActiveIndex: () => activeIndex,
    getCycleSnapshot: () => {
      const data = getActiveGroup()?.userData;
      return { index: activeIndex, time: data?.cycleTime || 0,
        manualLid: data?.manualCombo?.lid, manualTray: data?.manualCombo?.tray,
        embeddedTime: data?.embeddedAction?.time,
        headX: data?.headNode?.position.x,
        pressY: data?.model?.getObjectByName('PRENSA_VERTICAL')?.position.y,
        frontZ: data?.frontLidNode?.position.z, rearZ: data?.rearLidNode?.position.z };
    },
    isLoaded: () => Boolean(prensaGroups[activeIndex]?.userData?.isLoaded)
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isVisible && !animFrameId) animFrameId = requestAnimationFrame(animate);
  });

})();
