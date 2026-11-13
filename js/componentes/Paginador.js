// js/componentes/Paginador.js
class Paginador {
  constructor(container, { paginaActual = 1, totalPaginas = 1 } = {}) {
    this.container = container;
    this.paginaActual = paginaActual;
    this.totalPaginas = totalPaginas;
    this.render();
    this.configurarEventos();
  }

  render() {
    if (this.totalPaginas <= 1) {
      this.destruir();
      return;
    }

    this.destruir();
    this.element = document.createElement('nav');
    this.element.className = 'pagination-container';
    this.element.setAttribute('aria-label', 'Paginación de resultados');

    this.element.innerHTML = `
      <button type="button" class="page-btn btn-prev" ${this.paginaActual === 1 ? 'disabled' : ''}>Anterior</button>
      <span class="page-info">Página <strong>${this.paginaActual}</strong> de <strong>${this.totalPaginas}</strong></span>
      <button type="button" class="page-btn btn-next" ${this.paginaActual === this.totalPaginas ? 'disabled' : ''}>Siguiente</button>
    `;

    this.container.appendChild(this.element);
  }

  configurarEventos() {
    this.handleClick = (e) => {
      const btn = e.target.closest('.page-btn');
      if (!btn || btn.disabled) return;

      let nuevaPagina = this.paginaActual;
      if (btn.classList.contains('btn-prev') && this.paginaActual > 1) {
        nuevaPagina--;
      } else if (btn.classList.contains('btn-next') && this.paginaActual < this.totalPaginas) {
        nuevaPagina++;
      }

      if (nuevaPagina !== this.paginaActual) {
        const evento = new CustomEvent('paginador:cambiar', { detail: { pagina: nuevaPagina } });
        document.dispatchEvent(evento);
      }
    };

    if (this.container) {
      this.container.addEventListener('click', this.handleClick);
    }
  }

  actualizar(paginaActual, totalPaginas) {
    this.paginaActual = paginaActual;
    this.totalPaginas = totalPaginas;
    this.render();
    this.configurarEventos();
  }

  destruir() {
    if (this.container) {
      this.container.removeEventListener('click', this.handleClick);
      const existente = this.container.querySelector('.pagination-container');
      if (existente) existente.remove();
    }
    this.element = null;
  }
}

window.Paginador = Paginador;