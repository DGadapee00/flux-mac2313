const loaders = {
  polar: () => import('./polar.js'),
  parametric: () => import('./parametric.js'),
  partials: () => import('./partials.js'),
  extrema: () => import('./extrema.js'),
  chain: () => import('./chain.js'),
  gradient: () => import('./gradient.js'),
};

const cache = new Map();

export function hasLab(id) {
  return !!loaders[id];
}

export async function loadLab(id) {
  if (cache.has(id)) return cache.get(id);
  const loader = loaders[id];
  if (!loader) return null;
  const mod = await loader();
  const lab = mod.default;
  cache.set(id, lab);
  return lab;
}

export function loadExamLabs(labIds) {
  return Promise.all(labIds.filter(hasLab).map(loadLab));
}

export function registerLabLoader(id, loader) {
  loaders[id] = loader;
}
