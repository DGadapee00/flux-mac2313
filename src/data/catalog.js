/** Course map for MAC 2313 (Merino). `labs` are implemented; `coming` is the rest of that unit. */

export const EXAMS = [
  {
    id: 'ch1',
    n: 1,
    title: 'Preliminaries',
    chapters: '1',
    date: 'Ch 1',
    labs: [],
    coming: ['Limits & continuity', 'Riemann sums'],
  },
  {
    id: 'ch2',
    n: 2,
    title: 'Two variables',
    chapters: '2',
    date: 'Ch 2',
    labs: ['polar', 'parametric', 'partials', 'extrema', 'chain', 'gradient'],
    coming: [],
  },
  {
    id: 'ch3',
    n: 3,
    title: 'Double integrals',
    chapters: '3',
    date: 'Ch 3',
    labs: [],
    coming: ['Riemann sums', 'Iterated integrals', 'Polar'],
  },
  {
    id: 'ch4',
    n: 4,
    title: 'Three variables',
    chapters: '4',
    date: 'Ch 4',
    labs: [],
    coming: ['R³', 'Space curves', 'Partials in R³'],
  },
  {
    id: 'ch5',
    n: 5,
    title: 'Triple integrals',
    chapters: '5',
    date: 'Ch 5',
    labs: [],
    coming: ['Cylindrical', 'Spherical'],
  },
];

export const LAB_META = {
  polar: { id: 'polar', exam: 'ch2', title: 'Polar' },
  parametric: { id: 'parametric', exam: 'ch2', title: 'Parametric' },
  partials: { id: 'partials', exam: 'ch2', title: 'Partials' },
  extrema: { id: 'extrema', exam: 'ch2', title: 'Extrema' },
  chain: { id: 'chain', exam: 'ch2', title: 'Chain' },
  gradient: { id: 'gradient', exam: 'ch2', title: 'Gradient' },
};

export const CHAPTER_TITLES = {
  1: 'Preliminaries',
  2: 'Functions of two variables',
  3: 'Double integrals',
  4: 'Functions of three variables',
  5: 'Triple integrals',
};

export function examById(id) {
  return EXAMS.find((e) => e.id === id) || EXAMS[1];
}

export function examForLab(labId) {
  const meta = LAB_META[labId];
  return meta ? examById(meta.exam) : examById('ch2');
}

export function examIndex(id) {
  const i = EXAMS.findIndex((e) => e.id === id);
  return i < 0 ? 1 : i;
}
