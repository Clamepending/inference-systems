export const STORAGE_KEY = "inference-atelier-v1";
export const emptyProgress = () => ({
  version: 1,
  lessons: {},
  projects: {},
  theme: "light",
});
export function validateProgress(value) {
  if (
    !value ||
    value.version !== 1 ||
    typeof value.lessons !== "object" ||
    !value.lessons ||
    Array.isArray(value.lessons) ||
    typeof value.projects !== "object" ||
    !value.projects ||
    Array.isArray(value.projects)
  )
    throw new Error(
      "This is not an Inference Atelier progress file (version 1).",
    );
  const clean = emptyProgress();
  clean.theme = value.theme === "dark" ? "dark" : "light";
  for (const [id, entry] of Object.entries(value.lessons)) {
    if (
      !/^\d{2}$/.test(id) ||
      Number(id) < 1 ||
      Number(id) > 24 ||
      !entry ||
      typeof entry !== "object"
    )
      continue;
    const e = {
      read: entry.read === true,
      complete: entry.complete === true,
      notes:
        typeof entry.notes === "string" ? entry.notes.slice(0, 100000) : "",
      exercises: Array.isArray(entry.exercises)
        ? [
            ...new Set(
              entry.exercises.filter(
                (i) => Number.isInteger(i) && i >= 0 && i < 3,
              ),
            ),
          ]
        : [],
      checklist: Array.isArray(entry.checklist)
        ? [
            ...new Set(
              entry.checklist.filter(
                (i) => Number.isInteger(i) && i >= 0 && i < 3,
              ),
            ),
          ]
        : [],
    };
    if (entry.quiz && Array.isArray(entry.quiz.answers))
      e.quiz = {
        answers: entry.quiz.answers
          .slice(0, 5)
          .map((a) => (Number.isInteger(a) && a >= 0 && a < 4 ? a : null)),
        score: Math.max(0, Math.min(5, Number(entry.quiz.score) || 0)),
        submitted: entry.quiz.submitted === true,
      };
    clean.lessons[id] = e;
  }
  for (const [id, steps] of Object.entries(value.projects))
    if (
      ["engine", "moe", "embodied", "research"].includes(id) &&
      Array.isArray(steps)
    )
      clean.projects[id] = steps.filter(
        (n) => Number.isInteger(n) && n >= 0 && n < 6,
      );
  return clean;
}
export function readProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? validateProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}
