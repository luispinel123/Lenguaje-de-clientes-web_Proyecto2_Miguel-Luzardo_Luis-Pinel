// js/componentes/FormularioBusqueda.js
class FormularioBusqueda {
  constructor(container, { categorias = [], areas = [], ingredientes = [], filtrosActuales = {} } = {}) {
    this.container = container;
    this.categorias = categorias;
    this.areas = areas;
    this.ingredientes = ingredientes;
    this.filtrosActuales = filtrosActuales;
    this.render();
    this.configurarEventos();
  }

  render() {
    this.container.innerHTML = `
      <form class="search-form" id="search-filters-form">
        <div class="form-group">
          <label for="search-name">Nombre de receta</label>
          <input type="text" id="search-name" placeholder="Ej. Arrabiata" value="${this.filtrosActuales.nombre || ''}">
        </div>
        <div class="form-group">
          <label for="search-category">Categoría</label>
          <select id="search-category">
            <option value="">Todas las categorías</option>
            ${this.categorias.map(c => `<option value="${c.strCategory}" ${this.filtrosActuales.categoria === c.strCategory ? 'selected' : ''}>${c.strCategory}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="search-area">Origen</label>
          <select id="search-area">
            <option value="">Todos los orígenes</option>
            ${this.areas.map(a => `<option value="${a.strArea}" ${this.filtrosActuales.origen === a.strArea ? 'selected' : ''}>${a.strArea}</option>`).join('')}
          </select>
        </div>
        <div class="form-group autocomplete-container">
          <label for="search-ingredient">Ingrediente</label>
          <input type="text" id="search-ingredient" placeholder="Ej. Chicken" autocomplete="off" value="${this.filtrosActuales.ingrediente || ''}">
          <div id="ingredient-suggestions" class="suggestions-dropdown hidden"></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Aplicar Filtros</button>
          <button type="button" class="btn-secondary" id="btn-clear-filters">Limpiar</button>
        </div>
      </form>
    `;
  }

  configurarEventos() {
    const form = this.container.querySelector('#search-filters-form');
    const inputIng = this.container.querySelector('#search-ingredient');
    const suggestionsBox = this.container.querySelector('#ingredient-suggestions');

    inputIng.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length < 2) {
        suggestionsBox.classList.add('hidden');
        suggestionsBox.innerHTML = '';
        return;
      }

      const filtrados = this.ingredientes
        .filter(i => i.strIngredient && i.strIngredient.toLowerCase().includes(query))
        .slice(0, 8);

      if (filtrados.length > 0) {
        suggestionsBox.innerHTML = filtrados
          .map(i => `<div class="suggestion-item">${i.strIngredient}</div>`)
          .join('');
        suggestionsBox.classList.remove('hidden');
      } else {
        suggestionsBox.classList.add('hidden');
      }
    });

    suggestionsBox.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item) {
        inputIng.value = item.textContent;
        suggestionsBox.classList.add('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-container')) {
        suggestionsBox.classList.add('hidden');
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = form.querySelector('#search-name').value.trim();
      const categoria = form.querySelector('#search-category').value;
      const origen = form.querySelector('#search-area').value;
      const ingrediente = form.querySelector('#search-ingredient').value.trim();

      const filtros = { nombre, categoria, origen, ingrediente };
      document.dispatchEvent(new CustomEvent('busqueda:aplicar', { detail: { filtros } }));
    });

    form.querySelector('#btn-clear-filters').addEventListener('click', () => {
      form.reset();
      document.dispatchEvent(new CustomEvent('busqueda:limpiar'));
    });
  }

  destruir() {
    this.container.innerHTML = '';
  }
}

window.FormularioBusqueda = FormularioBusqueda;