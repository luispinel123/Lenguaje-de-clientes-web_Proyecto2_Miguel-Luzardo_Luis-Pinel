// js/vistas/VistaCategoriasOrigenes.js
class VistaCategoriasOrigenes {
  constructor(container, { categoriaSeleccionada = null } = {}) {
    this.container = container;
    this.pestanaActiva = 'categorias'; // 'categorias' | 'origenes'
    this.itemSeleccionado = categoriaSeleccionada;
    this.resultados = [];
    this.paginaActual = 1;
    this.porPagina = 12;
    this.componentes = [];
    this.render();
    this.inicializar();
  }

  render() {
    this.container.innerHTML = `
      <section class="cat-ori-view">
        <h1 class="view-title">Categorías y Orígenes</h1>
        <div class="tabs-container">
          <button type="button" class="tab-btn active" data-tab="categorias">Categorías</button>
          <button type="button" class="tab-btn" data-tab="origenes">Orígenes</button>
        </div>
        <div id="tab-list-container" class="tab-list"></div>
        <hr class="divider">
        <div id="selection-detail-container"></div>
        <div id="cat-ori-cards-grid" class="cards-grid"></div>
        <div id="cat-ori-paginator"></div>
      </section>
    `;
  }

  async inicializar() {
    this.configurarPestanas();
    await this.cargarListaPestana();

    if (this.itemSeleccionado) {
      this.cargarRecetasItem(this.itemSeleccionado);
    }
  }

  configurarPestanas() {
    const tabs = this.container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.pestanaActiva = e.target.getAttribute('data-tab');
        this.itemSeleccionado = null;
        this.resultados = [];
        this.container.querySelector('#selection-detail-container').innerHTML = '';
        this.container.querySelector('#cat-ori-cards-grid').innerHTML = '';
        if (this.paginador) this.paginador.destruir();
        this.cargarListaPestana();
      });
    });

    document.addEventListener('paginador:cambiar', (e) => {
      if (this.container.contains(e.target) || document.querySelector('#cat-ori-paginator').contains(e.target)) {
        this.paginaActual = e.detail.pagina;
        this.renderPaginaActual();
      }
    });
  }

  async cargarListaPestana() {
    const listContainer = this.container.querySelector('#tab-list-container');
    listContainer.innerHTML = '';
    const loader = new EstadoCarga(listContainer, { tipo: 'loading' });

    try {
      if (this.pestanaActiva === 'categorias') {
        let cats = window.memoryCache.getCategories();
        if (!cats) {
          const data = await window.API.getCategories();
          cats = data.categories;
          window.memoryCache.setCategories(cats);
        }
        loader.destruir();
        this.renderListaCategorias(listContainer, cats);
      } else {
        let areas = window.memoryCache.getAreas();
        if (!areas) {
          const data = await window.API.listAreas();
          areas = data.meals;
          window.memoryCache.setAreas(areas);
        }
        loader.destruir();
        this.renderListaOrigenes(listContainer, areas);
      }
    } catch (err) {
      loader.destruir();
      new EstadoCarga(listContainer, { tipo: 'error', mensaje: 'Error al cargar listado.' });
    }
  }

  renderListaCategorias(container, categorias) {
    container.innerHTML = categorias.map(c => `
      <button type="button" class="chip-item ${this.itemSeleccionado === c.strCategory ? 'active' : ''}" data-nombre="${c.strCategory}">
        ${c.strCategory}
      </button>
    `).join('');

    container.querySelectorAll('.chip-item').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.chip-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.itemSeleccionado = btn.getAttribute('data-nombre');
        this.paginaActual = 1;
        this.cargarRecetasItem(this.itemSeleccionado);
      });
    });
  }

  renderListaOrigenes(container, origenes) {
    container.innerHTML = origenes.map(a => `
      <button type="button" class="chip-item ${this.itemSeleccionado === a.strArea ? 'active' : ''}" data-nombre="${a.strArea}">
        ${a.strArea}
      </button>
    `).join('');

    container.querySelectorAll('.chip-item').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.chip-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.itemSeleccionado = btn.getAttribute('data-nombre');
        this.paginaActual = 1;
        this.cargarRecetasItem(this.itemSeleccionado);
      });
    });
  }

  async cargarRecetasItem(nombre) {
    const grid = this.container.querySelector('#cat-ori-cards-grid');
    grid.innerHTML = '';
    const loader = new EstadoCarga(grid, { tipo: 'loading' });

    try {
      let data = null;
      if (this.pestanaActiva === 'categorias') {
        data = await window.API.filterByCategory(nombre);
      } else {
        data = await window.API.filterByArea(nombre);
      }

      loader.destruir();
      this.resultados = data.meals || [];

      const detailContainer = this.container.querySelector('#selection-detail-container');
      detailContainer.innerHTML = `<p class="selection-title">Mostrando <strong>${this.resultados.length}</strong> recetas para: <strong>${nombre}</strong></p>`;

      if (this.resultados.length === 0) {
        new EstadoCarga(grid, { tipo: 'empty', mensaje: 'No hay recetas para la selección.' });
        return;
      }

      this.renderPaginaActual();
    } catch (err) {
      loader.destruir();
      new EstadoCarga(grid, { tipo: 'error', mensaje: 'Error al obtener recetas.' });
    }
  }

  async renderPaginaActual() {
    const grid = this.container.querySelector('#cat-ori-cards-grid');
    grid.innerHTML = '';

    const inicio = (this.paginaActual - 1) * this.porPagina;
    const fin = inicio + this.porPagina;
    const recetasPagina = this.resultados.slice(inicio, fin);
    const totalPaginas = Math.ceil(this.resultados.length / this.porPagina);

    // Resolver detalles de la página visible en paralelo
    const promesas = recetasPagina.map(r => {
      if (window.memoryCache.hasRecipe(r.idMeal)) {
        return Promise.resolve(window.memoryCache.getRecipe(r.idMeal));
      }
      return window.API.lookupById(r.idMeal).then(d => {
        if (d && d.meals && d.meals[0]) {
          window.memoryCache.setRecipe(r.idMeal, d.meals[0]);
          return d.meals[0];
        }
        throw new Error('Incompleta');
      });
    });

    const loaderGrid = new EstadoCarga(grid, { tipo: 'loading' });
    const resultados = await Promise.allSettled(promesas);
    loaderGrid.destruir();

    resultados.forEach((res, idx) => {
      const resumida = recetasPagina[idx];
      let recetaFinal = null;

      if (res.status === 'fulfilled' && res.value) {
        const completa = res.value;
        const norm = window.RecetasService.normalizarRecetaCompleta(completa);
        recetaFinal = {
          id: completa.idMeal,
          nombre: completa.strMeal,
          categoria: completa.strCategory,
          origen: completa.strArea,
          imagen: completa.strMealThumb,
          cantIngredientes: norm.ingredientes.length
        };
      } else {
        recetaFinal = {
          id: resumida.idMeal,
          nombre: resumida.strMeal,
          categoria: 'Incompleta',
          origen: 'Incompleta',
          imagen: resumida.strMealThumb,
          cantIngredientes: '?'
        };
      }

      const tarjeta = new TarjetaReceta(grid, recetaFinal);
      this.componentes.push(tarjeta);
    });

    const pagContainer = this.container.querySelector('#cat-ori-paginator');
    if (this.paginador) this.paginador.destruir();
    this.paginador = new Paginador(pagContainer, { paginaActual: this.paginaActual, totalPaginas });
    this.componentes.push(this.paginador);
  }

  destruir() {
    this.componentes.forEach(c => c.destruir && c.destruir());
    this.componentes = [];
    this.container.innerHTML = '';
  }
}

window.VistaCategoriasOrigenes = VistaCategoriasOrigenes;