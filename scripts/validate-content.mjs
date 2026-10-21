import fs from "node:fs";
import assert from "node:assert/strict";
import katex from "katex";

const lessons = ["a", "b"].flatMap((part) =>
  JSON.parse(fs.readFileSync(`content/lessons-${part}.json`, "utf8")),
);
assert.equal(lessons.length, 24);
let words = 0,
  exerciseCount = 0,
  quizCount = 0,
  mathCount = 0;
const resources = new Set();
for (const [lidx, l] of lessons.entries()) {
  assert.equal(l.id, String(lidx + 1).padStart(2, "0"));
  assert.equal(l.week, lidx + 1);
  assert.equal(
    l.phase,
    [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7][
      lidx
    ],
  );
  for (const key of ["title", "subtitle", "body", "slug", "hardware", "level"])
    assert.ok(typeof l[key] === "string" && l[key].trim(), `${l.id}: ${key}`);
  assert.ok(
    l.body.split(/\s+/).length >= 750,
    `${l.id}: substantive chapter required`,
  );
  assert.equal(l.exercises.length, 3);
  assert.equal(l.quiz.length, 5);
  assert.equal(l.outcomes.length, 3);
  assert.equal(l.completion.length, 3);
  assert.ok(fs.existsSync(l.lab.path), `${l.id}: missing lab ${l.lab.path}`);
  for (const e of l.exercises)
    for (const key of ["title", "prompt", "hint", "solution"])
      assert.ok(e[key]?.length > 5, `${l.id}: exercise ${key}`);
  for (const q of l.quiz) {
    assert.equal(q.options.length, 4);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
    assert.ok(q.explanation.length > 30);
  }
  for (const r of l.resources) {
    assert.equal(new URL(r.url).protocol, "https:");
    resources.add(r.url);
    assert.ok(r.why.length > 10);
  }
  const prose = [
    l.body,
    ...l.exercises.flatMap((e) => [e.prompt, e.hint, e.solution]),
    ...l.quiz.map((q) => q.explanation),
  ].join("\n");
  const withoutCode = prose
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "");
  const math = /\$\$([\s\S]+?)\$\$|(?<!\\)\$(?!\$)((?:\\.|[^$\n])+?)\$/g;
  for (const match of withoutCode.matchAll(math)) {
    try {
      katex.renderToString(match[1] || match[2], {
        displayMode: !!match[1],
        throwOnError: true,
        strict: "ignore",
        trust: false,
      });
      mathCount++;
    } catch (e) {
      throw new Error(`${l.id}: invalid equation ${match[0]}: ${e.message}`);
    }
  }
  words += l.body.split(/\s+/).length;
  exerciseCount += l.exercises.length;
  quizCount += l.quiz.length;
}
console.log(
  JSON.stringify(
    {
      lessons: lessons.length,
      articleWords: words,
      exercises: exerciseCount,
      quizQuestions: quizCount,
      uniqueResources: resources.size,
      validatedEquations: mathCount,
    },
    null,
    2,
  ),
);
