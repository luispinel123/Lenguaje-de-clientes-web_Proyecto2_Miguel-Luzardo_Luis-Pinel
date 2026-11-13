// js/vistas/VistaDetalle.js
class VistaDetalle {
  constructor(container, { idReceta = null, vistaOrigen = 'explorar' } = {}) {
    this.container = container;
    this.idReceta = idReceta;
    this.vistaOrigen = vistaOrigen;
    this.componentes = [];
    this.render();
    this.cargarDetalle();
  }

  render() {
    this.container.innerHTML = `
      <section class="detalle-view">
        <button type="button" class="btn-volver" id="btn-volver-atras">← Volver</button>
        <div id="recipe-detail-main"></div>
        <section class="related-section">
          <h2 class="section-title">Recetas Relacionadas</h2>
          <div class="related-block">
            <h3>Misma Categoría</h3>
            <div id="related-category-grid" class="cards-grid"></div>
          </div>
          <div class="related-block">
            <h3>Mismo Origen</h3>
            <div id="related-area-grid" class="cards-grid"></div>
          </div>
        </section>
      </section>
    `;
  }

  async cargarDetalle() {
    const mainContainer = this.container.querySelector('#recipe-detail-main');
    const loader = new EstadoCarga(mainContainer, { tipo: 'loading' });

    try {
      let rawRecipe = window.memoryCache.getRecipe(this.idReceta);
      if (!rawRecipe) {
        const data = await window.API.lookupById(this.idReceta);
        if (data && data.meals && data.meals[0]) {
          rawRecipe = data.meals[0];
          window.memoryCache.setRecipe(this.idReceta, rawRecipe);
        } else {
          throw new Error('Receta no encontrada');
        }
      }

      loader.destruir();
      const receta = window.RecetasService.normalizarRecetaCompleta(rawRecipe);
      this.renderMainDetail(mainContainer, receta, rawRecipe);
      this.cargarRelacionadas(receta);
    } catch (err) {
      loader.destruir();
      new EstadoCarga(mainContainer, {
        tipo: 'error',
        mensaje: 'No se pudo cargar el detalle de la receta.',
        onRetry: () => this.cargarDetalle()
      });
    }

    this.container.querySelector('#btn-volver-atras').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('navegar:volver'));
    });
  }

  renderMainDetail(container, receta, rawRecipe) {
    container.innerHTML = `
      <header class="detail-header">
        <img class="detail-img" src="${receta.imagen}" alt="${receta.nombre}">
        <div class="detail-header-info">
          <h1 class="detail-title">${receta.nombre}</h1>
          <p class="detail-meta">
            <span><strong>Categoría:</strong> ${receta.categoria}</span> | 
            <span><strong>Origen:</strong> ${receta.origen}</span>
          </p>
          <div class="detail-tags">
            ${receta.tags.map(t => `<span class="tag-item">#${t}</span>`).join('')}
          </div>
          <div class="detail-actions">
            ${receta.video ? `<a href="${receta.video}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-video">Ver Video en YouTube 🎬</a>` : ''}
            <button type="button" class="btn-secondary btn-add-comparar">Agregar al Comparador +</button>
          </div>
        </div>
      </header>
      <div class="detail-body">
        <div id="ingredients-container"></div>
        <div id="steps-container"></div>
      </div>
    `;

    const ingComp = new ListaIngredientes(container.querySelector('#ingredients-container'), receta.ingredientes);
    const pasComp = new PasosPreparacion(container.querySelector('#steps-container'), receta.pasos);
    this.componentes.push(ingComp, pasComp);

    container.querySelector('.btn-add-comparar').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('receta:agregar-comparador', { detail: { receta: rawRecipe } }));
    });
  }

  async cargarRelacionadas(receta) {
    const gridCat = this.container.querySelector('#related-category-grid');
    const gridArea = this.container.querySelector('#related-area-grid');

    const loaderCat = new EstadoCarga(gridCat, { tipo: 'loading' });
    const loaderArea = new EstadoCarga(gridArea, { tipo: 'loading' });

    // Consultas independientes en paralelo con Promise.allSettled (Requerimiento 4.4)
    const [resCat, resArea] = await Promise.allSettled([
      window.API.filterByCategory(receta.categoria),
      window.API.filterByArea(receta.origen)
    ]);

    loaderCat.destruir();
    loaderArea.destruir();

    if (resCat.status === 'fulfilled' && resCat.value && resCat.value.meals) {
      const filtradosCat = resCat.value.meals
        .filter(m => m.idMeal !== receta.id)
        .slice(0, 6);
      this.renderRelacionadasGrid(gridCat, filtradosCat, receta.categoria, 'Categoría');
    } else {
      new EstadoCarga(gridCat, { tipo: 'empty', mensaje: 'No hay recetas relacionadas por categoría.' });
    }

    if (resArea.status === 'fulfilled' && resArea.value && resArea.value.meals) {
      const filtradosArea = resArea.value.meals
        .filter(m => m.idMeal !== receta.id)
        .slice(0, 6);
      this.renderRelacionadasGrid(gridArea, filtradosArea, receta.origen, 'Origen');
    } else {
      new EstadoCarga(gridArea, { tipo: 'empty', mensaje: 'No hay recetas relacionadas por origen.' });
    }
  }

  renderRelacionadasGrid(container, recetas, valorMeta, tipoMeta) {
    if (recetas.length === 0) {
      new EstadoCarga(container, { tipo: 'empty', mensaje: 'No hay otras recetas disponibles.' });
      return;
    }

    container.innerHTML = '';
    recetas.forEach(r => {
      const tarjeta = new TarjetaReceta(container, {
        id: r.idMeal,
        nombre: r.strMeal,
        categoria: tipoMeta === 'Categoría' ? valorMeta : '',
        origen: tipoMeta === 'Origen' ? valorMeta : '',
        imagen: r.strMealThumb
      });
      this.componentes.push(tarjeta);
    });
  }

  destruir() {
    this.componentes.forEach(c => c.destruir && c.destruir());
    this.componentes = [];
    this.container.innerHTML = '';
  }
}

window.VistaDetalle = VistaDetalle;