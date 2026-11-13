// js/componentes/PanelComparador.js
class PanelComparador {
  constructor(container, { panelId, receta = null } = {}) {
    this.container = container;
    this.panelId = panelId; // 'A' o 'B'
    this.receta = receta;
    this.abortController = null;
    this.debounceTimer = null;
    this.render();
    this.configurarEventos();
  }

  render() {
    this.container.innerHTML = `
      <div class="comparator-panel" data-panel="${this.panelId}">
        <div class="panel-header">
          <h3>Panel ${this.panelId}</h3>
          ${this.receta ? `<button type="button" class="btn-clear-panel" aria-label="Vaciar panel ${this.panelId}">Vaciar</button>` : ''}
        </div>
        ${this.receta ? this.renderRecipeCard() : this.renderSearchBox()}
      </div>
    `;
  }

  renderSearchBox() {
    return `
      <div class="panel-search-wrapper">
        <input type="text" class="panel-search-input" placeholder="Buscar receta para comparar..." autocomplete="off">
        <div class="panel-suggestions hidden"></div>
      </div>
    `;
  }

  renderRecipeCard() {
    return `
      <div class="panel-recipe-card">
        <img src="${this.receta.strMealThumb}" alt="${this.receta.strMeal}" class="panel-recipe-img">
        <div class="panel-recipe-info">
          <h4>${this.receta.strMeal}</h4>
          <p><strong>Categoría:</strong> ${this.receta.strCategory || 'N/A'}</p>
          <p><strong>Origen:</strong> ${this.receta.strArea || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  configurarEventos() {
    const clearBtn = this.container.querySelector('.btn-clear-panel');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('comparador:vaciar-panel', { detail: { panelId: this.panelId } }));
      });
    }

    const inputSearch = this.container.querySelector('.panel-search-input');
    const suggestionsBox = this.container.querySelector('.panel-suggestions');

    if (inputSearch && suggestionsBox) {
      inputSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(this.debounceTimer);

        if (query.length < 2) {
          suggestionsBox.classList.add('hidden');
          suggestionsBox.innerHTML = '';
          return;
        }

        this.debounceTimer = setTimeout(async () => {
          if (this.abortController) {
            this.abortController.abort();
          }
          this.abortController = new AbortController();

          try {
            const data = await window.API.searchByName(query, this.abortController.signal);
            const meals = data.meals || [];

            if (meals.length > 0) {
              suggestionsBox.innerHTML = meals.slice(0, 5).map(m => `
                <div class="panel-suggestion-item" data-id="${m.idMeal}">
                  <img src="${m.strMealThumb}" width="30" height="30" alt="">
                  <span>${m.strMeal}</span>
                </div>
              `).join('');
              suggestionsBox.classList.remove('hidden');
            } else {
              suggestionsBox.innerHTML = `<div class="panel-suggestion-empty">No hay resultados</div>`;
              suggestionsBox.classList.remove('hidden');
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Error buscando receta para comparador:', err);
            }
          }
        }, 400);
      });

      suggestionsBox.addEventListener('click', (e) => {
        const item = e.target.closest('.panel-suggestion-item');
        if (item) {
          const idMeal = item.getAttribute('data-id');
          document.dispatchEvent(new CustomEvent('comparador:seleccionar-receta', { 
            detail: { panelId: this.panelId, idMeal } 
          }));
        }
      });
    }
  }

  actualizarReceta(nuevaReceta) {
    this.receta = nuevaReceta;
    this.render();
    this.configurarEventos();
  }

  destruir() {
    if (this.abortController) {
      this.abortController.abort();
    }
    clearTimeout(this.debounceTimer);
    this.container.innerHTML = '';
  }
}

window.PanelComparador = PanelComparador;