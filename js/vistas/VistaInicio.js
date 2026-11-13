// js/vistas/VistaInicio.js
class VistaInicio {
  constructor(container) {
    this.container = container;
    this.recetaDestacada = null;
    this.componentes = [];
    this.render();
    this.cargarDatos();
  }

  render() {
    this.container.innerHTML = `
      <section class="inicio-view">
        <h1 class="view-title">Bienvenido a Sabor</h1>
        
        <!-- Sección Receta Destacada -->
        <article class="featured-recipe-section" id="featured-recipe-container">
          <!-- Se llena dinámicamente -->
        </article>

        <!-- Sección Categorías -->
        <section class="categories-grid-section">
          <h2 class="section-title">Explora por Categorías</h2>
          <div id="categories-grid-container" class="categories-grid"></div>
        </section>
      </section>
    `;
  }

  async cargarDatos() {
    const featuredContainer = this.container.querySelector('#featured-recipe-container');
    const categoriesContainer = this.container.querySelector('#categories-grid-container');

    const loaderFeatured = new EstadoCarga(featuredContainer, { tipo: 'loading' });
    const loaderCategories = new EstadoCarga(categoriesContainer, { tipo: 'loading' });

    // Peticiones en paralelo con Promise.allSettled (Requerimiento 4.2)
    const [resFeatured, resCategories] = await Promise.allSettled([
      this.obtenerRecetaAzar(),
      this.obtenerCategorias()
    ]);

    loaderFeatured.destruir();
    loaderCategories.destruir();

    // Procesar Receta Destacada
    if (resFeatured.status === 'fulfilled' && resFeatured.value) {
      this.renderFeaturedRecipe(featuredContainer, resFeatured.value);
    } else {
      new EstadoCarga(featuredContainer, {
        tipo: 'error',
        mensaje: 'No se pudo cargar la receta destacada.',
        onRetry: () => this.cargarRecetaDestacadaIndividual()
      });
    }

    // Procesar Categorías
    if (resCategories.status === 'fulfilled' && resCategories.value) {
      this.renderCategoriesGrid(categoriesContainer, resCategories.value);
    } else {
      new EstadoCarga(categoriesContainer, {
        tipo: 'error',
        mensaje: 'No se pudieron cargar las categorías.',
        onRetry: () => this.cargarCategoriasIndividuales()
      });
    }
  }

  async obtenerRecetaAzar() {
    const data = await window.API.getRandom();
    if (data && data.meals && data.meals[0]) {
      const receta = data.meals[0];
      // Evitar repetición consecutiva
      if (this.recetaDestacada && this.recetaDestacada.idMeal === receta.idMeal) {
        return this.obtenerRecetaAzar();
      }
      this.recetaDestacada = receta;
      window.memoryCache.setRecipe(receta.idMeal, receta);
      return receta;
    }
    throw new Error('Sin datos de receta');
  }

  async obtenerCategorias() {
    const cached = window.memoryCache.getCategories();
    if (cached) return cached;
    const data = await window.API.getCategories();
    if (data && data.categories) {
      window.memoryCache.setCategories(data.categories);
      return data.categories;
    }
    throw new Error('Sin categorías');
  }

  async cargarRecetaDestacadaIndividual() {
    const container = this.container.querySelector('#featured-recipe-container');
    container.innerHTML = '';
    const loader = new EstadoCarga(container, { tipo: 'loading' });
    try {
      const receta = await this.obtenerRecetaAzar();
      loader.destruir();
      this.renderFeaturedRecipe(container, receta);
    } catch (err) {
      loader.destruir();
      new EstadoCarga(container, {
        tipo: 'error',
        mensaje: 'Error al reintentar receta destacada.',
        onRetry: () => this.cargarRecetaDestacadaIndividual()
      });
    }
  }

  async cargarCategoriasIndividuales() {
    const container = this.container.querySelector('#categories-grid-container');
    container.innerHTML = '';
    const loader = new EstadoCarga(container, { tipo: 'loading' });
    try {
      const categorias = await this.obtenerCategorias();
      loader.destruir();
      this.renderCategoriesGrid(container, categorias);
    } catch (err) {
      loader.destruir();
      new EstadoCarga(container, {
        tipo: 'error',
        mensaje: 'Error al reintentar cargar categorías.',
        onRetry: () => this.cargarCategoriasIndividuales()
      });
    }
  }

  renderFeaturedRecipe(container, receta) {
    container.innerHTML = `
      <div class="featured-card">
        <img class="featured-img" src="${receta.strMealThumb}" alt="${receta.strMeal}">
        <div class="featured-content">
          <span class="featured-badge">Receta Destacada</span>
          <h2 class="featured-title">${receta.strMeal}</h2>
          <p class="featured-info"><strong>Categoría:</strong> ${receta.strCategory || 'N/A'} | <strong>Origen:</strong> ${receta.strArea || 'N/A'}</p>
          <div class="featured-actions">
            <button type="button" class="btn-primary btn-ver-detalle" data-id="${receta.idMeal}">Ver Receta Completa</button>
            <button type="button" class="btn-secondary btn-otra-receta">Otra Receta 🎲</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('.btn-ver-detalle').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('receta:ver-detalle', { detail: { id: receta.idMeal } }));
    });

    container.querySelector('.btn-otra-receta').addEventListener('click', () => {
      this.cargarRecetaDestacadaIndividual();
    });
  }

  renderCategoriesGrid(container, categorias) {
    container.innerHTML = '';
    categorias.forEach(cat => {
      const descCorta = cat.strCategoryDescription 
        ? (cat.strCategoryDescription.substring(0, 120) + '...') 
        : '';
      
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <img src="${cat.strCategoryThumb}" alt="${cat.strCategory}" class="category-img">
        <h3 class="category-title">${cat.strCategory}</h3>
        <p class="category-desc">${descCorta}</p>
      `;

      card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('navegar', { detail: { vista: 'categorias', categoria: cat.strCategory } }));
      });

      container.appendChild(card);
    });
  }

  destruir() {
    this.componentes.forEach(c => c.destruir && c.destruir());
    this.componentes = [];
    this.container.innerHTML = '';
  }
}

window.VistaInicio = VistaInicio;