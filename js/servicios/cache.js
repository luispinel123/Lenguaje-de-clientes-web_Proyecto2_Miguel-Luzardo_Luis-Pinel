class MemoryCache {
  constructor() {
    this.recipes = new Map(); 
    this.categories = null;
    this.areas = null;
    this.ingredients = null;
  }

  getRecipe(id) {
    return this.recipes.get(id) || null;
  }

  setRecipe(id, recipe) {
    this.recipes.set(id, recipe);
  }

  hasRecipe(id) {
    return this.recipes.has(id);
  }

  getCategories() {
    return this.categories;
  }

  setCategories(categories) {
    this.categories = categories;
  }

  getAreas() {
    return this.areas;
  }

  setAreas(areas) {
    this.areas = areas;
  }

  getIngredients() {
    return this.ingredients;
  }

  setIngredients(ingredients) {
    this.ingredients = ingredients;
  }

  clear() {
    this.recipes.clear();
    this.categories = null;
    this.areas = null;
    this.ingredients = null;
  }
}

window.memoryCache = new MemoryCache();