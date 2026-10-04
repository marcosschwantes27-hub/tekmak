/**
 * CATÁLOGO DE MÁQUINAS DE COSTURA SUN SPECIAL — TEKMAK DO BRASIL
 * - Exibição focada exclusivamente nos cards das máquinas
 * - Design e-commerce moderno e direto
 * - Cotação direta via WhatsApp para cada modelo
 * - Modal Quick-View com ficha técnica completa e itens inclusos
 */
(function () {
  'use strict';

  const SEWING_MACHINES = [
    {
      id: 'ss780d4',
      name: 'Reta Eletrônica Industrial Direct Drive',
      model: 'SS780D4-ST-QI',
      category: 'retas',
      categoryLabel: 'RETA INDUSTRIAL',
      badge: 'Mais Vendida',
      badgeHighlight: true,
      desc: 'Motor Direct Drive integrado, cárter blindado, parada de agulha superior e inferior, retrocesso automático e luminária LED integrada.',
      img: 'assets/hero-costura/reta-eletronica.webp',
      specs: [
        { k: 'Velocidade', v: '5.000 PPM' },
        { k: 'Motor', v: 'Direct Drive' },
        { k: 'Ponto', v: 'Fixo 301 (5mm)' },
        { k: 'Funções', v: 'Arremate + Corte Auto' }
      ],
      fullSpecs: [
        { k: 'Velocidade Máxima', v: '5.000 Pontos Por Minuto (PPM)' },
        { k: 'Tipo de Ponto', v: 'Ponto Fixo 301 (comprimento até 5 mm)' },
        { k: 'Motor', v: 'Direct Drive Acoplado Econômico (Bivolt / 220V)' },
        { k: 'Sistema de Lubrificação', v: 'Automática com Micro-Cárter Blindado' },
        { k: 'Levantamento do Calcador', v: 'Automático via Solenoide (até 13 mm)' },
        { k: 'Corte de Linha', v: 'Automático Rotativo Superior e Inferior' },
        { k: 'Painel de Controle', v: 'Digital integrado no cabeçote' },
        { k: 'Indicação de Uso', v: 'Tecidos leves a médios, camisaria, polos e uniformes' }
      ],
      includedItems: [
        'Mesa industrial com tampo fórmica',
        'Estante de aço com regulagem de altura',
        'Motor Direct Drive integrado e montado',
        'Luminária LED articulada',
        'Gaveta porta-ferramentas',
        'Kit de agulhas, bobinas e óleo original'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação da máquina Reta Eletrônica Industrial Sun Special SS780D4-ST-QI.'
    },
    {
      id: 'ss93d',
      name: 'Overloque Industrial Direct Drive',
      model: 'SS93D / SS94D',
      category: 'overloques',
      categoryLabel: 'OVERLOQUE INDUSTRIAL',
      badge: 'Direct Drive',
      badgeHighlight: false,
      desc: 'Fechamento rápido e resistente para camisetas, moda praia, fitness e malhas em geral. Costura uniforme e baixíssimo ruído.',
      img: 'assets/hero-costura/overloque-frente.webp',
      specs: [
        { k: 'Velocidade', v: '6.000 PPM' },
        { k: 'Fios / Agulhas', v: '3 ou 4 Fios' },
        { k: 'Largura Ponto', v: '4 a 6 mm' },
        { k: 'Economia', v: 'Até 70% Energia' }
      ],
      fullSpecs: [
        { k: 'Velocidade Máxima', v: '6.000 Pontos Por Minuto (PPM)' },
        { k: 'Configuração', v: '3 ou 4 Fios (bitola média industrial)' },
        { k: 'Motor', v: 'Direct Drive Silencioso Integrado' },
        { k: 'Lubrificação', v: 'Totalmente Automática por Bomba' },
        { k: 'Alimentação Diferencial', v: '0.7 a 2.0 micro-ajustável' },
        { k: 'Largura do Ponto', v: '4 a 6 mm com arremate limpo' },
        { k: 'Indicação de Uso', v: 'Malharia, moda praia, fitness, lingeries e vestuário' }
      ],
      includedItems: [
        'Mesa industrial reforçada TekMak',
        'Estante de aço com sapatas de nivelamento',
        'Porta-fios para 4 cones industriais',
        'Motor Direct Drive acoplado',
        'Luminária LED de alta intensidade',
        'Kit de pinças, agulhas e óleo'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação da máquina Overloque Industrial Direct Drive Sun Special SS93D/94D.'
    },
    {
      id: 'galoneira',
      name: 'Galoneira Eletrônica Base Plana',
      model: 'SS-500D TOUCHSCREEN',
      category: 'galoneiras',
      categoryLabel: 'GALONEIRA PLANA',
      badge: 'Touchscreen Digital',
      badgeHighlight: true,
      desc: 'Bainhas e barras de altíssima precisão em malhas finas e médias. Painel touchscreen colorido, posicionador e corte automático.',
      img: 'assets/hero-costura/galoneira-eletronica.webp',
      specs: [
        { k: 'Velocidade', v: '5.000 PPM' },
        { k: 'Agulhas / Fios', v: '3 Agulhas / 5 Fios' },
        { k: 'Bitola', v: '6.4 mm Padrão' },
        { k: 'Painel', v: 'Touchscreen Colorido' }
      ],
      fullSpecs: [
        { k: 'Velocidade Máxima', v: '5.000 Pontos Por Minuto (PPM)' },
        { k: 'Agulhas e Fios', v: '3 Agulhas / 5 Fios com Trançador Superior' },
        { k: 'Bitola Entre Agulhas', v: '6.4 mm (regulável)' },
        { k: 'Painel de Controle', v: 'Touchscreen Colorido Intuitivo' },
        { k: 'Corte de Linha', v: 'Automático Eletrônico Superior/Inferior' },
        { k: 'Levantador Calcador', v: 'Automático integrado' },
        { k: 'Indicação de Uso', v: 'Barras, bainhas, golas e pespontos em malha' }
      ],
      includedItems: [
        'Mesa industrial ergonômica',
        'Estante reforçada de aço',
        'Porta-fios para 5 cones',
        'Motor Direct Drive eletrônico',
        'Luminária LED integrada',
        'Kit chaves, pinças e agulhas'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação da Galoneira Eletrônica Base Plana Sun Special com Touchscreen.'
    },
    {
      id: 'galoneira_cilindrica',
      name: 'Galoneira Cilíndrica com Refilador',
      model: 'SS-600CR BRAÇO TUBULAR',
      category: 'galoneiras',
      categoryLabel: 'GALONEIRA CILÍNDRICA',
      badge: 'Refilador Acoplado',
      badgeHighlight: false,
      desc: 'Desenvolvida especialmente para aplicação de elásticos em peças tubulares (cuecas, calcinhas e fitness) com faca refiladora que apara sobras.',
      img: 'assets/hero-costura/galoneira-refilador.webp',
      specs: [
        { k: 'Velocidade', v: '5.500 PPM' },
        { k: 'Braço', v: 'Cilíndrico Tubular' },
        { k: 'Refilador', v: 'Esquerdo Acoplado' },
        { k: 'Fios', v: '3 Agulhas / 5 Fios' }
      ],
      fullSpecs: [
        { k: 'Velocidade Máxima', v: '5.500 Pontos Por Minuto (PPM)' },
        { k: 'Formato do Braço', v: 'Cilíndrico para fechamento tubular' },
        { k: 'Dispositivo Especial', v: 'Refilador Esquerdo com navalha de precisão' },
        { k: 'Agulhas / Fios', v: '3 Agulhas e 5 Fios com trançador' },
        { k: 'Lubrificação', v: 'Forçada por bomba de alta pressão' },
        { k: 'Indicação de Uso', v: 'Cós elástico, moda íntima, lingerie e fitness' }
      ],
      includedItems: [
        'Mesa especial com recorte cilíndrico',
        'Estante de sustentação estruturada',
        'Porta-fios completo',
        'Motor Direct Drive embutido',
        'Conjunto navalha refiladora sobressalente',
        'Acessórios e manual técnico'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação da Galoneira Cilíndrica com Refilador Esquerdo Sun Special.'
    },
    {
      id: 'bordadeira',
      name: 'Bordadeira Computadorizada 1 Cabeça',
      model: 'SS-1201 (12 AGULHAS)',
      category: 'bordadeiras',
      categoryLabel: 'BORDADEIRA COMPUTADORIZADA',
      badge: '12 Cores Automáticas',
      badgeHighlight: true,
      desc: 'Bordados profissionais de alta definição em logomarcas, emblemas, camisas polo e bonés fechados com troca automática de 12 cores.',
      img: 'assets/hero-costura/bordadeira.webp',
      specs: [
        { k: 'Área Bordado', v: '360 × 200 mm' },
        { k: 'Velocidade', v: '1.000 PPM' },
        { k: 'Cores / Agulhas', v: '12 Agulhas Automáticas' },
        { k: 'Boné 270°', v: 'Bastidor Incluso' }
      ],
      fullSpecs: [
        { k: 'Capacidade', v: '1 Cabeça / 12 Agulhas com troca auto de cor' },
        { k: 'Área Máxima de Bordado', v: '360 mm × 200 mm' },
        { k: 'Velocidade Máxima', v: 'Até 1.000 Pontos Por Minuto' },
        { k: 'Painel', v: 'LCD Touch Colorido de alta resolução' },
        { k: 'Memória e Conexão', v: 'USB, Rede e leitura de arquivos DST/DSB' },
        { k: 'Kit Bastidores Boné', v: 'Sistema completo 270° incluso' },
        { k: 'Indicação de Uso', v: 'Uniformes, polos, bonés, toalhas e personalizados' }
      ],
      includedItems: [
        'Estante móvel com rodas e travas',
        'Kit com 5 tamanhos de bastidores planos',
        'Dispositivo e 2 bastidores para boné 270°',
        'Estação para preparação de bastidor de boné',
        'Enchedor de bobina independente',
        'Caixa de ferramentas, óleo e agulhas'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação da Máquina Bordadeira Computadorizada 1 Cabeça Sun Special (12 Agulhas).'
    },
    {
      id: 'cortador',
      name: 'Cortador Têxtil à Bateria Portátil',
      model: 'SS-100D LI-ION',
      category: 'corte',
      categoryLabel: 'MÁQUINA DE CORTE TÊXTIL',
      badge: 'Sem Fio Li-Ion',
      badgeHighlight: false,
      desc: 'Agilidade sem fio na mesa de enfesto e corte. Motor brushless com 5 velocidades ajustáveis, afiador embutido e capacidade até 25mm.',
      img: 'assets/hero-costura/cortador-textil.webp',
      specs: [
        { k: 'Disco', v: 'Octogonal 100 mm' },
        { k: 'Altura Corte', v: 'Até 25 mm (Enfesto)' },
        { k: 'Bateria', v: 'Li-Ion 16.8V Recarregável' },
        { k: 'Motor', v: 'Brushless 5 Velocidades' }
      ],
      fullSpecs: [
        { k: 'Diâmetro da Lâmina', v: '100 mm (formato octogonal para corte limpo)' },
        { k: 'Capacidade de Enfesto', v: 'Até 25 mm de camadas sobrepostas' },
        { k: 'Tipo de Motor', v: 'Brushless sem escovas de alta durabilidade' },
        { k: 'Afiador de Lâmina', v: 'Pedra afiadora embutida acionável por botão' },
        { k: 'Autonomia da Bateria', v: 'Trabalho contínuo sem cabos atrapalhando' },
        { k: 'Peso', v: 'Apenas 1,1 kg ultra-ergonômico' }
      ],
      includedItems: [
        'Cortador elétrico SS-100D',
        '2 Baterias Recarregáveis Li-Ion 16.8V',
        'Carregador bivolt rápido de mesa',
        'Disco octogonal reserva 100 mm',
        'Pedra afiadora sobressalente',
        'Óleo lubrificante e chave de troca'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação do Cortador Têxtil Elétrico à Bateria Sun Special SS-100D.'
    },
    {
      id: 'portatil',
      name: 'Máquina de Costura Portátil Bivolt',
      model: 'SS-988 PORTÁTIL',
      category: 'portateis',
      categoryLabel: 'COSTURA COMPACTA',
      badge: 'Compacta & Bivolt',
      badgeHighlight: false,
      desc: 'Praticidade para ateliês de ajustes, pequenos reparos e consertos rápidos. Estrutura reforçada, pontos decorativos e braço livre.',
      img: 'assets/hero-costura/reta-domestica.jpg',
      specs: [
        { k: 'Pontos', v: '12 Padrões + Zig-Zag' },
        { k: 'Caseador', v: '4 Passos Prático' },
        { k: 'Braço Livre', v: 'Tubulares e Barras' },
        { k: 'Tensão', v: 'Bivolt Automática' }
      ],
      fullSpecs: [
        { k: 'Padrões de Ponto', v: '12 tipos (reta, zig-zag, 3 pontinhos e decorativos)' },
        { k: 'Caseador de Botão', v: 'Sistema prático em 4 passos' },
        { k: 'Braço Livre', v: 'Acesso fácil a punhos, barras e mangas' },
        { k: 'Iluminação', v: 'LED de foco direto sobre a agulha' },
        { k: 'Alimentação', v: 'Bivolt Automática com pedal de velocidade' },
        { k: 'Indicação de Uso', v: 'Ateliês de conserto, residências e confecções leves' }
      ],
      includedItems: [
        'Máquina SS-988 completa',
        'Pedal de acionamento com fio',
        'Fonte bivolt automática',
        'Calcador de zíper e caseador',
        'Bobinas e agulhas sobressalentes',
        'Manual do usuário em português'
      ],
      ctaMsg: 'Olá! Gostaria de uma cotação da Máquina de Costura Portátil Sun Special SS-988.'
    }
  ];

  function initTekmakCosturaCatalog() {
    const modal = document.getElementById('showroomModalCostura');
    const grid = document.getElementById('scCosturaProductGrid');
    if (!modal || !grid) return;

    const closeBtn = document.getElementById('scModalCosturaClose');
    const backdrop = document.getElementById('scModalCosturaBackdrop');

    const quickViewModal = document.getElementById('scCosturaQuickView');
    const quickViewBackdrop = document.getElementById('scQuickViewBackdrop');
    const quickViewContent = document.getElementById('scQuickViewContent');

    // Renderiza diretamente os cards das máquinas
    function renderGrid() {
      grid.innerHTML = '';

      SEWING_MACHINES.forEach(prod => {
        const card = document.createElement('article');
        card.className = 'sc-ecom-card';
        card.setAttribute('data-prod-id', prod.id);

        const waUrl = 'https://wa.me/5598984287603?text=' + encodeURIComponent(prod.ctaMsg);

        card.innerHTML = `
          <div class="sc-ecom-media">
            <span class="sc-ecom-badge ${prod.badgeHighlight ? 'highlight' : ''}">${prod.badge}</span>
            <img src="${prod.img}" alt="${prod.name}" loading="lazy" />
          </div>
          <div class="sc-ecom-body">
            <span class="sc-ecom-cat-tag">${prod.categoryLabel}</span>
            <h3 class="sc-ecom-prod-title">${prod.name}</h3>
            <span class="sc-ecom-model-code">${prod.model}</span>
            <p class="sc-ecom-prod-desc">${prod.desc}</p>
            
            <div class="sc-ecom-specs-grid">
              ${prod.specs.map(s => `
                <div class="sc-ecom-spec-item">
                  <span class="k">${s.k}</span>
                  <span class="v">${s.v}</span>
                </div>
              `).join('')}
            </div>

            <div class="sc-ecom-card-footer">
              <div class="sc-ecom-price-tag">
                <span class="status">Pronta Entrega</span>
                <span class="commercial-note">Faturamento PJ / 12x</span>
              </div>
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="sc-ecom-btn-quote" aria-label="Solicitar Cotação no WhatsApp para ${prod.name}">
                <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
                <span>Solicitar Cotação</span>
              </a>
              <button type="button" class="sc-ecom-btn-details" data-open-quickview="${prod.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Ficha Técnica Completa</span>
              </button>
            </div>
          </div>
        `;

        const detailsBtn = card.querySelector('[data-open-quickview]');
        if (detailsBtn) {
          detailsBtn.addEventListener('click', () => openQuickView(prod.id));
        }

        grid.appendChild(card);
      });
    }

    // Modal Quick-View (Ficha Técnica)
    function openQuickView(prodId) {
      const prod = SEWING_MACHINES.find(p => p.id === prodId);
      if (!prod || !quickViewContent || !quickViewModal) return;

      const waUrl = 'https://wa.me/5598984287603?text=' + encodeURIComponent(prod.ctaMsg);

      quickViewContent.innerHTML = `
        <button class="sc-quickview-close" id="scQuickViewCloseBtn" aria-label="Fechar Ficha Técnica">&times;</button>
        <div class="sc-qv-grid">
          <div class="sc-qv-media">
            <img src="${prod.img}" alt="${prod.name}" />
          </div>
          <div class="sc-qv-info">
            <div class="sc-qv-header">
              <span class="sc-qv-tag">${prod.categoryLabel} &bull; ${prod.badge}</span>
              <h2 class="sc-qv-title">${prod.name}</h2>
              <span class="sc-qv-model">Modelo Oficial: ${prod.model}</span>
            </div>
            
            <p class="sc-qv-desc">${prod.desc}</p>

            <table class="sc-qv-specs-table">
              <tbody>
                ${prod.fullSpecs.map(s => `
                  <tr>
                    <td class="k">${s.k}</td>
                    <td class="v">${s.v}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="sc-qv-included">
              <span class="sc-qv-included-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Itens Inclusos na Montagem TekMak
              </span>
              <ul class="sc-qv-included-list">
                ${prod.includedItems.map(item => `
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="sc-qv-actions">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="sc-qv-cta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/></svg>
                <span>Solicitar Proposta Formal via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      `;

      const qvCloseBtn = document.getElementById('scQuickViewCloseBtn');
      if (qvCloseBtn) qvCloseBtn.addEventListener('click', closeQuickView);

      quickViewModal.classList.add('is-open');
      quickViewModal.setAttribute('aria-hidden', 'false');
    }

    function closeQuickView() {
      if (!quickViewModal) return;
      quickViewModal.classList.remove('is-open');
      quickViewModal.setAttribute('aria-hidden', 'true');
    }

    // Abertura e Fechamento do Catálogo Showroom
    function openShowroom(targetId) {
      // Fecha outros showrooms abertos
      document.querySelectorAll('#showroomModal.is-open, #showroomModalPrensa.is-open').forEach(m => {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      });

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('sc-modal-open');

      if (targetId && targetId !== 'costura') {
        const found = SEWING_MACHINES.find(p => p.id === targetId);
        if (found) {
          openQuickView(found.id);
        }
      }
    }

    function closeShowroom() {
      closeQuickView();
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('#showroomModal.is-open, #showroomModalPrensa.is-open')) {
        document.body.classList.remove('sc-modal-open');
      }
    }

    // Fechar ao clicar no X ou Backdrop
    if (closeBtn) closeBtn.addEventListener('click', closeShowroom);
    if (backdrop) backdrop.addEventListener('click', closeShowroom);
    if (quickViewBackdrop) quickViewBackdrop.addEventListener('click', closeQuickView);

    // Teclado Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (quickViewModal && quickViewModal.classList.contains('is-open')) {
          closeQuickView();
          return;
        }
        if (modal.classList.contains('is-open')) {
          closeShowroom();
        }
      }
    });

    // Render Inicial dos Cards
    renderGrid();

    // API Global
    window.tekmakCosturaShowroom = {
      open: openShowroom,
      close: closeShowroom,
      openQuickView: openQuickView,
      closeQuickView: closeQuickView,
      machines: SEWING_MACHINES,
      products: SEWING_MACHINES
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTekmakCosturaCatalog);
  } else {
    initTekmakCosturaCatalog();
  }
})();
