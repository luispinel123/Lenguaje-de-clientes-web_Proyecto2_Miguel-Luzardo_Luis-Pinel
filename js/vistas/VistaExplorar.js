// js/vistas/VistaExplorar.js
class VistaExplorar {
  constructor(container, { estadoPrevio = null } = {}) {
    this.container = container;
    this.estadoPrevio = estadoPrevio;
    this.filtros = estadoPrevio ? estadoPrevio.filtros : { nombre: '', categoria: '', origen: '', ingrediente: '' };
    this.paginaActual = estadoPrevio ? estadoPrevio.paginaActual : 1;
    this.resultadosTotales = estadoPrevio ? estadoPrevio.resultadosTotales : [];
    this.componentes = [];
    this.porPagina = 12;
    this.render();
    this.inicializar();
  }

  render() {
    this.container.innerHTML = `
      <section class="explorar-view">
        <h1 class="view-title">Explorar Recetas</h1>
        <div id="search-form-container"></div>
        <div class="results-header">
          <span id="results-count" class="results-count"></span>
        </div>
        <div id="cards-grid-container" class="cards-grid"></div>
        <div id="paginator-container"></div>
      </section>
    `;
  }

  async inicializar() {
    const formContainer = this.container.querySelector('#search-form-container');
    
    // Solicitar listas para selects de filtros (Caché en memoria)
    try {
      let categorias = window.memoryCache.getCategories();
      let areas = window.memoryCache.getAreas();
      let ingredientes = window.memoryCache.getIngredients();

      const promesas = [];
      if (!categorias) promesas.push(window.API.getCategories().then(d => { window.memoryCache.setCategories(d.categories); return d.categories; }));
      else promesas.push(Promise.resolve(categorias));

      if (!areas) promesas.push(window.API.listAreas().then(d => { window.memoryCache.setAreas(d.meals); return d.meals; }));
      else promesas.push(Promise.resolve(areas));

      if (!ingredientes) promesas.push(window.API.listIngredients().then(d => { window.memoryCache.setIngredients(d.meals); return d.meals; }));
      else promesas.push(Promise.resolve(ingredientes));

      const [catList, areaList, ingList] = await Promise.all(promesas);

      const form = new FormularioBusqueda(formContainer, {
        categorias: catList,
        areas: areaList,
        ingredientes: ingList,
        filtrosActuales: this.filtros
      });
      this.componentes.push(form);

      if (this.resultadosTotales.length > 0) {
        this.renderPaginaActual();
      }
    } catch (err) {
      new EstadoCarga(this.container.querySelector('#cards-grid-container'), {
        tipo: 'error',
        mensaje: 'No se pudieron cargar los filtros de búsqueda.'
      });
    }

    this.escucharEventos();
  }

  escucharEventos() {
    this.handleAplicarFiltros = (e) => {
      this.filtros = e.detail.filtros;
      this.paginaActual = 1;
      this.ejecutarBusquedaCombinada();
    };

    this.handleLimpiarFiltros = () => {
      this.filtros = { nombre: '', categoria: '', origen: '', ingrediente: '' };
      this.resultadosTotales = [];
      this.paginaActual = 1;
      this.container.querySelector('#cards-grid-container').innerHTML = '';
      this.container.querySelector('#results-count').textContent = '';
      if (this.paginador) this.paginador.destruir();
    };

    this.handleCambiarPagina = (e) => {
      this.paginaActual = e.detail.pagina;
      this.renderPaginaActual();
    };

    document.addEventListener('busqueda:aplicar', this.handleAplicarFiltros);
    document.addEventListener('busqueda:limpiar', this.handleLimpiarFiltros);
    document.addEventListener('paginador:cambiar', this.handleCambiarPagina);
  }

  async ejecutarBusquedaCombinada() {
    const grid = this.container.querySelector('#cards-grid-container');
    grid.innerHTML = '';
    const loader = new EstadoCarga(grid, { tipo: 'loading' });

    // Validar al menos un criterio (Requerimiento 4.7)
    const { nombre, categoria, origen, ingrediente } = this.filtros;
    if (!nombre && !categoria && !origen && !ingrediente) {
      loader.destruir();
      new EstadoCarga(grid, { tipo: 'empty', mensaje: 'Debe ingresar o seleccionar al menos un criterio de búsqueda.' });
      return;
    }

    try {
      const peticiones = [];
      if (nombre) peticiones.push(window.API.searchByName(nombre).then(d => d.meals || []));
      if (categoria) peticiones.push(window.API.filterByCategory(categoria).then(d => d.meals || []));
      if (origen) peticiones.push(window.API.filterByArea(origen).then(d => d.meals || []));
      if (ingrediente) peticiones.push(window.API.filterByIngredient(ingrediente).then(d => d.meals || []));

      // Ejecutar consultas paralelas con Promise.all
      const resultadosArreglos = await Promise.all(peticiones);

      // Intersección de resultados por idMeal
      let interseccion = resultadosArreglos[0];
      for (let i = 1; i < resultadosArreglos.length; i++) {
        const setIds = new Set(resultadosArreglos[i].map(m => m.idMeal));
        interseccion = interseccion.filter(m => setIds.has(m.idMeal));
      }

      // Ordenar alfabéticamente por nombre
      interseccion.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
      this.resultadosTotales = interseccion;

      loader.destruir();

      if (this.resultadosTotales.length === 0) {
        new EstadoCarga(grid, { tipo: 'empty', mensaje: 'No se encontraron recetas que cumplan todos los criterios seleccionados.' });
        this.container.querySelector('#results-count').textContent = '0 resultados';
        return;
      }

      this.renderPaginaActual();
    } catch (err) {
      loader.destruir();
      new EstadoCarga(grid, {
        tipo: 'error',
        mensaje: err.message || 'Error al ejecutar la búsqueda.',
        onRetry: () => this.ejecutarBusquedaCombinada()
      });
    }
  }

  async renderPaginaActual() {
    const grid = this.container.querySelector('#cards-grid-container');
    grid.innerHTML = '';
    this.container.querySelector('#results-count').textContent = `Total: ${this.resultadosTotales.length} recetas`;

    const inicio = (this.paginaActual - 1) * this.porPagina;
    const fin = inicio + this.porPagina;
    const recetasPagina = this.resultadosTotales.slice(inicio, fin);

    const totalPaginas = Math.ceil(this.resultadosTotales.length / this.porPagina);

    // Resolver detalles completos de la página visible en paralelo usando Promise.allSettled
    const promesasDetalle = recetasPagina.map(r => {
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
    const resultados = await Promise.allSettled(promesasDetalle);
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
        // Fallo parcial: datos resumidos (Requerimiento 4.3)
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

    // Paginador
    const paginatorContainer = this.container.querySelector('#paginator-container');
    if (this.paginador) this.paginador.destruir();
    this.paginador = new Paginador(paginatorContainer, {
      paginaActual: this.paginaActual,
      totalPaginas
    });
    this.componentes.push(this.paginador);
  }

  obtenerEstadoParaGuardar() {
    return {
      filtros: this.filtros,
      paginaActual: this.paginaActual,
      resultadosTotales: this.resultadosTotales
    };
  }

  destruir() {
    document.removeEventListener('busqueda:aplicar', this.handleAplicarFiltros);
    document.removeEventListener('busqueda:limpiar', this.handleLimpiarFiltros);
    document.removeEventListener('paginador:cambiar', this.handleCambiarPagina);
    this.componentes.forEach(c => c.destruir && c.destruir());
    this.componentes = [];
    this.container.innerHTML = '';
  }
}

window.VistaExplorar = VistaExplorar;