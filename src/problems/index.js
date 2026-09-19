/**
 * Problem bank for MAC 2313. Each bank module exports an array of templates.
 */
import ch2 from './bank/ch2.js';

export const PROBLEMS = [...ch2];

const byIdMap = new Map(PROBLEMS.map((p) => [p.id, p]));

export const problemById = (id) => byIdMap.get(id) || null;
export const problemsForExam = (examId) => PROBLEMS.filter((p) => p.exam === examId);
export const problemsForLab = (labId) => PROBLEMS.filter((p) => p.lab === labId);

export const CHAPTER_ORDER = ['1', '2', '3', '4', '5'];

export const CHAPTER_TITLES = {
  1: 'Preliminaries',
  2: 'Functions of two variables',
  3: 'Double integrals',
  4: 'Functions of three variables',
  5: 'Triple integrals',
};

export { instance, render, grade, answers, sig } from './engine.js';
export { applyProblem } from './simbridge.js';
