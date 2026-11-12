// js/componentes/BarraNavegacion.js
class BarraNavegacion {
  constructor(container, { vistaActual = 'inicio', comparadorCount = 0 } = {}) {
    this.container = container;
    this.vistaActual = vistaActual;
    this.comparadorCount = comparadorCount;
    this.render();
    this.configurarEventos();
  }

  render() {
    this.container.innerHTML = `
      <ul class="nav-list">
        <li>
          <a href="#inicio" class="nav-link ${this.vistaActual === 'inicio' ? 'active' : ''}" data-vista="inicio">
            Inicio
          </a>
        </li>
        <li>
          <a href="#explorar" class="nav-link ${this.vistaActual === 'explorar' ? 'active' : ''}" data-vista="explorar">
            Explorar
          </a>
        </li>
        <li>
          <a href="#categorias" class="nav-link ${this.vistaActual === 'categorias' ? 'active' : ''}" data-vista="categorias">
            Categorías y Orígenes
          </a>
        </li>
        <li>
          <a href="#comparador" class="nav-link ${this.vistaActual === 'comparador' ? 'active' : ''}" data-vista="comparador">
            Comparador <span class="badge-comparador" aria-label="${this.comparadorCount} recetas en comparador">${this.comparadorCount}</span>
          </a>
        </li>
      </ul>
    `;
  }

  configurarEventos() {
    this.handleNavClick = (e) => {
      const link = e.target.closest('[data-vista]');
      if (link) {
        e.preventDefault();
        const vista = link.getAttribute('data-vista');
        const evento = new CustomEvent('navegar', { detail: { vista } });
        document.dispatchEvent(evento);
      }
    };

    this.handleComparadorCambio = (e) => {
      this.comparadorCount = e.detail.count;
      const badge = this.container.querySelector('.badge-comparador');
      if (badge) {
        badge.textContent = this.comparadorCount;
        badge.setAttribute('aria-label', `${this.comparadorCount} recetas en comparador`);
      }
    };

    this.container.addEventListener('click', this.handleNavClick);
    document.addEventListener('comparador:cambio', this.handleComparadorCambio);
  }

  actualizarVistaActiva(nuevaVista) {
    this.vistaActual = nuevaVista;
    const links = this.container.querySelectorAll('.nav-link');
    links.forEach(link => {
      if (link.getAttribute('data-vista') === nuevaVista) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  destruir() {
    this.container.removeEventListener('click', this.handleNavClick);
    document.removeEventListener('comparador:cambio', this.handleComparadorCambio);
    this.container.innerHTML = '';
  }
}

window.BarraNavegacion = BarraNavegacion;