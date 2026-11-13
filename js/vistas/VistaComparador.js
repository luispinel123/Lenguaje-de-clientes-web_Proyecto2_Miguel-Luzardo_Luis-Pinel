// js/vistas/VistaComparador.js
class VistaComparador {
  constructor(container, { recetaA = null, recetaB = null } = {}) {
    this.container = container;
    this.recetaA = recetaA;
    this.recetaB = recetaB;
    this.componentes = [];
    this.render();
    this.inicializar();
  }

  render() {
    this.container.innerHTML = `
      <section class="comparador-view">
        <h1 class="view-title">Comparador de Recetas</h1>
        <div class="comparator-controls">
          <button type="button" id="btn-swap-panels" class="btn-secondary" ${(!this.recetaA || !this.recetaB) ? 'disabled' : ''}>
            🔄 Intercambiar Paneles
          </button>
        </div>
        <div class="panels-grid">
          <div id="panel-a-container"></div>
          <div id="panel-b-container"></div>
        </div>
        <div id="comparison-table-container"></div>
      </section>
    `;
  }

  inicializar() {
    this.panelA = new PanelComparador(this.container.querySelector('#panel-a-container'), { panelId: 'A', receta: this.recetaA });
    this.panelB = new PanelComparador(this.container.querySelector('#panel-b-container'), { panelId: 'B', receta: this.recetaB });
    this.componentes.push(this.panelA, this.panelB);

    this.escucharEventos();
    this.evaluarComparacion();
  }

  escucharEventos() {
    this.handleVaciarPanel = (e) => {
      const { panelId } = e.detail;
      if (panelId === 'A') this.recetaA = null;
      if (panelId === 'B') this.recetaB = null;
      this.actualizarPaneles();
    };

    this.handleSeleccionarReceta = async (e) => {
      const { panelId, idMeal } = e.detail;

      // Evitar comparar la misma receta consigo misma (Requerimiento 4.6)
      if ((panelId === 'A' && this.recetaB && this.recetaB.idMeal === idMeal) ||
          (panelId === 'B' && this.recetaA && this.recetaA.idMeal === idMeal)) {
        alert('No se puede comparar una receta consigo misma.');
        return;
      }

      try {
        let receta = window.memoryCache.getRecipe(idMeal);
        if (!receta) {
          const data = await window.API.lookupById(idMeal);
          if (data && data.meals && data.meals[0]) {
            receta = data.meals[0];
            window.memoryCache.setRecipe(idMeal, receta);
          }
        }

        if (panelId === 'A') this.recetaA = receta;
        if (panelId === 'B') this.recetaB = receta;

        this.actualizarPaneles();
      } catch (err) {
        console.error('Error al cargar receta para comparador:', err);
      }
    };

    this.container.querySelector('#btn-swap-panels').addEventListener('click', () => {
      const temp = this.recetaA;
      this.recetaA = this.recetaB;
      this.recetaB = temp;
      this.actualizarPaneles();
    });

    document.addEventListener('comparador:vaciar-panel', this.handleVaciarPanel);
    document.addEventListener('comparador:seleccionar-receta', this.handleSeleccionarReceta);
  }

  actualizarPaneles() {
    this.panelA.actualizarReceta(this.recetaA);
    this.panelB.actualizarReceta(this.recetaB);

    const btnSwap = this.container.querySelector('#btn-swap-panels');
    if (btnSwap) {
      btnSwap.disabled = (!this.recetaA || !this.recetaB);
    }

    // Notificar cambio de cantidad al evento global para actualizar la insignia en la barra de navegación
    const count = (this.recetaA ? 1 : 0) + (this.recetaB ? 1 : 0);
    document.dispatchEvent(new CustomEvent('comparador:actualizo-estado', { 
      detail: { recetaA: this.recetaA, recetaB: this.recetaB, count } 
    }));

    this.evaluarComparacion();
  }

  evaluarComparacion() {
    const tableContainer = this.container.querySelector('#comparison-table-container');
    if (this.tablaComp) {
      this.tablaComp.destruir();
      this.tablaComp = null;
    }

    if (this.recetaA && this.recetaB) {
      const datosComparacion = window.ComparacionService.comparar(this.recetaA, this.recetaB);
      this.tablaComp = new TablaComparacion(tableContainer, datosComparacion);
      this.componentes.push(this.tablaComp);
    } else {
      tableContainer.innerHTML = `
        <div class="comparator-empty-state">
          <p>Seleccione dos recetas en los paneles para ver la tabla comparativa.</p>
        </div>
      `;
    }
  }

  destruir() {
    document.removeEventListener('comparador:vaciar-panel', this.handleVaciarPanel);
    document.removeEventListener('comparador:seleccionar-receta', this.handleSeleccionarReceta);
    this.componentes.forEach(c => c.destruir && c.destruir());
    this.componentes = [];
    this.container.innerHTML = '';
  }
}

window.VistaComparador = VistaComparador;