const STORAGE_KEY = "ace_vlsi_learn_progress";
export const LEARN_PROGRESS_EVENT = "ace_vlsi_learn_progress_updated";

export function notifyProgressChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEARN_PROGRESS_EVENT));
  }
}

export type LearnProgress = {
  completed: string[];
  quizScores: Record<string, { score: number; total: number; at: number }>;
};

function empty(): LearnProgress {
  return { completed: [], quizScores: {} };
}

export function loadLearnProgress(): LearnProgress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as LearnProgress;
    return {
      completed: Array.isArray(p.completed) ? p.completed : [],
      quizScores: p.quizScores && typeof p.quizScores === "object" ? p.quizScores : {},
    };
  } catch {
    return empty();
  }
}

export function saveLearnProgress(p: LearnProgress) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    notifyProgressChanged();
  }
}

export function resetLearnProgress(): LearnProgress {
  const p = empty();
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    notifyProgressChanged();
  }
  return p;
}

export function markSessionComplete(slug: string) {
  const p = loadLearnProgress();
  if (!p.completed.includes(slug)) p.completed.push(slug);
  saveLearnProgress(p);
  return p;
}

export function unmarkSessionComplete(slug: string) {
  const p = loadLearnProgress();
  p.completed = p.completed.filter((s) => s !== slug);
  saveLearnProgress(p);
  return p;
}

export function toggleSessionComplete(slug: string): boolean {
  const p = loadLearnProgress();
  const exists = p.completed.includes(slug);
  if (exists) {
    p.completed = p.completed.filter((s) => s !== slug);
  } else {
    p.completed.push(slug);
  }
  saveLearnProgress(p);
  return !exists;
}

export function saveQuizScore(slug: string, score: number, total: number, passMark = 70) {
  const p = loadLearnProgress();
  p.quizScores[slug] = { score, total, at: Date.now() };
  const pct = total ? (score / total) * 100 : 0;
  if (pct >= passMark && !p.completed.includes(slug)) p.completed.push(slug);
  saveLearnProgress(p);
  return p;
}
