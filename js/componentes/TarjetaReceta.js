// js/componentes/TarjetaReceta.js
class TarjetaReceta {
  constructor(container, receta) {
    this.container = container;
    this.receta = receta; // { id, nombre, categoria, origen, imagen, cantIngredientes }
    this.element = null;
    this.render();
    this.configurarEventos();
  }

  render() {
    this.element = document.createElement('article');
    this.element.className = 'recipe-card';
    this.element.setAttribute('data-id', this.receta.id);

    // Estructura estática segura con innerHTML, rellenando datos mediante textContent
    this.element.innerHTML = `
      <div class="card-image-wrapper">
        <img class="card-img" src="" alt="" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-meta-tags">
          <span class="card-tag categoria-tag"></span>
          <span class="card-tag origen-tag"></span>
        </div>
        <h3 class="card-title"></h3>
        ${this.receta.cantIngredientes !== undefined ? '<p class="card-ingredients-count"></p>' : ''}
        <div class="card-actions">
          <button type="button" class="btn-detalle" aria-label="Ver detalle de receta">Ver Detalle</button>
          <button type="button" class="btn-comparar" aria-label="Agregar receta al comparador">+</button>
        </div>
      </div>
    `;

    // Asignación segura de datos de la API vía textContent y atributos (Requisito 5.3)
    const img = this.element.querySelector('.card-img');
    img.src = this.receta.imagen || '';
    img.alt = `Plato de ${this.receta.nombre}`;

    this.element.querySelector('.categoria-tag').textContent = this.receta.categoria || 'General';
    this.element.querySelector('.origen-tag').textContent = this.receta.origen || 'Internacional';
    this.element.querySelector('.card-title').textContent = this.receta.nombre;

    if (this.receta.cantIngredientes !== undefined) {
      this.element.querySelector('.card-ingredients-count').textContent = `${this.receta.cantIngredientes} ingredientes`;
    }

    this.container.appendChild(this.element);
  }

  configurarEventos() {
    this.handleDetalle = (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('receta:ver-detalle', { detail: { id: this.receta.id } }));
    };

    this.handleComparar = (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('receta:agregar-comparador', { detail: { receta: this.receta } }));
    };

    this.element.querySelector('.btn-detalle').addEventListener('click', this.handleDetalle);
    this.element.querySelector('.btn-comparar').addEventListener('click', this.handleComparar);
    
    // Permitir clic en toda la tarjeta excepto botones para ver detalle
    this.element.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        document.dispatchEvent(new CustomEvent('receta:ver-detalle', { detail: { id: this.receta.id } }));
      }
    });
  }

  destruir() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

window.TarjetaReceta = TarjetaReceta;