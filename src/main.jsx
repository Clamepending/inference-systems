import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  LayoutDashboard,
  Route,
  FlaskConical,
  FolderGit2,
  Library,
  NotebookPen,
  Search,
  Command,
  Check,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  GitBranch as Github,
  Download,
  Upload,
  Clock,
  Layers,
  Cpu,
  Network,
  Workflow,
  ScanEye,
  Sparkles,
  GraduationCap,
  ExternalLink,
  Play,
  Bookmark,
  Target,
  PanelLeftClose,
  FileText,
  RotateCcw,
} from "lucide-react";
import { phases, projects, REPO } from "./catalog";
import { VisualStudio, VisualExperiment, experiments } from "./Visuals";
import { PortfolioPage, portfolio } from "./Portfolio";
import { Markdown, CodeBlock } from "./Markdown";
import { STORAGE_KEY, readProgress, validateProgress } from "./storage";
import "./styles.css";

const files = import.meta.glob("../content/lessons-*.json", { eager: true });
const lessons = Object.values(files)
  .flatMap((f) => f.default)
  .sort((a, b) => a.week - b.week);
const icons = {
  layers: Layers,
  cpu: Cpu,
  network: Network,
  workflow: Workflow,
  scan: ScanEye,
  flask: FlaskConical,
  sparkles: Sparkles,
};
const pad = (n) => String(n).padStart(2, "0");
const navItems = [
  ["overview", "Overview", LayoutDashboard],
  ["curriculum", "Learning path", Route],
  ["lab", "Visual lab", FlaskConical],
  ["projects", "Projects", FolderGit2],
  ["portfolio", "Build in public", ArrowUpRight],
  ["resources", "Resource library", Library],
  ["notebook", "My notebook", NotebookPen],
];
const sourceResources = () => {
  const map = new Map();
  for (const l of lessons)
    for (const r of l.resources || []) {
      const existing = map.get(r.url);
      if (existing) {
        existing.lessons.push(l.id);
        existing.required ||= r.required;
      } else map.set(r.url, { ...r, lessons: [l.id] });
    }
  return [...map.values()];
};

function Brand() {
  return (
    <a
      className="brand"
      href="#/overview"
      aria-label="Inference Atelier overview"
    >
      <span className="brand-icon">
        <span />
        <span />
        <span />
      </span>
      <span>
        inference<span className="brand-sub">ATELIER</span>
      </span>
    </a>
  );
}
function PhaseIcon({ phase, size = 20 }) {
  const Icon = icons[phase.icon];
  return (
    <span className="phase-icon" style={{ "--phase": phase.color }}>
      <Icon size={size} />
    </span>
  );
}
function HeroDiagram() {
  return (
    <div
      className="hero-diagram"
      aria-label="From model to efficient inference: kernels, memory, scheduling, and distributed systems"
    >
      <div className="diagram-caption">
        THE INFERENCE STACK <span>FIG. 01</span>
      </div>
      <svg viewBox="0 0 420 300" role="img">
        <defs>
          <pattern
            id="hero-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="#c0cfad" opacity=".28" />
          </pattern>
        </defs>
        <rect width="420" height="300" fill="url(#hero-grid)" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(210 ${55 + i * 49})`}>
            <path
              d="M 0 -27 L 132 19 L 0 66 L -132 19 Z"
              fill={["#71937a", "#456c58", "#2e5342", "#234534"][i]}
              stroke="#b9d1a0"
              strokeOpacity=".65"
            />
            <path
              d="M -132 19 L -132 33 L 0 80 L 132 33 L 132 19 L 0 66 Z"
              fill={["#58795f", "#35583f", "#244533", "#193a2c"][i]}
              stroke="#a8c492"
              strokeOpacity=".3"
            />
            <text
              x="0"
              y="24"
              textAnchor="middle"
              fill="#e4edcd"
              fontSize="12"
              letterSpacing="2"
            >
              {["ALGORITHMS", "SCHEDULING", "MEMORY", "KERNELS"][i]}
            </text>
          </g>
        ))}
        <circle cx="210" cy="26" r="4" fill="#e2edae" />
        <path d="M210 30v20" stroke="#cdda9e" strokeDasharray="3 4" />
      </svg>
      <div className="diagram-footer">
        <span className="live-dot" />
        Understand every layer.
      </div>
    </div>
  );
}
function App() {
  const [route, setRoute] = useState(location.hash.slice(2) || "overview");
  const [progress, setProgress] = useState(readProgress);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [section, id] = route.split("/");
  const completed = lessons.filter(
    (l) => progress.lessons[l.id]?.complete,
  ).length;
  const next =
    lessons.find((l) => !progress.lessons[l.id]?.complete) || lessons[0];
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(2) || "overview");
      setMobile(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
    document.documentElement.dataset.theme = progress.theme;
  }, [progress]);
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const title =
      section === "learn"
        ? lessons.find((l) => l.id === id)?.title
        : navItems.find((n) => n[0] === section)?.[1];
    document.title = `${title || "Inference systems"} · Inference Atelier`;
  }, [section, id]);
  const updateLesson = (id, change) =>
    setProgress((p) => ({
      ...p,
      lessons: { ...p.lessons, [id]: { ...p.lessons[id], ...change } },
    }));
  const updateProject = (id, step) =>
    setProgress((p) => {
      const steps = p.projects[id] || [];
      return {
        ...p,
        projects: {
          ...p.projects,
          [id]: steps.includes(step)
            ? steps.filter((s) => s !== step)
            : [...steps, step],
        },
      };
    });
  const exportProgress = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { ...progress, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inference-atelier-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Progress and notebook exported.");
  };
  const importProgress = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2e6)
        throw new Error("Choose a progress file smaller than 2 MB.");
      const parsed = validateProgress(JSON.parse(await file.text()));
      setProgress((p) => ({
        ...p,
        lessons: { ...p.lessons, ...parsed.lessons },
        projects: { ...p.projects, ...parsed.projects },
      }));
      setToast("Imported progress. Matching lessons use the imported entries.");
    } catch (error) {
      setToast(error.message);
    }
    e.target.value = "";
  };
  const active = section === "learn" ? "curriculum" : section;
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Brand />
        <div className="edition">
          <span className="live-dot" />
          THE OPEN COURSE <span>2026</span>
        </div>
        <div className="sidebar-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navItems.map(([key, title, Icon]) => (
            <a
              key={key}
              className={`nav-item ${active === key ? "active" : ""}`}
              href={`#/${key}`}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{title}</span>
              {key === "lab" && <span className="nav-badge">6</span>}
              {key === "portfolio" && <span className="tiny-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label">THE CURRICULUM</div>
        <nav className="phase-nav" aria-label="Curriculum phases">
          {phases.map((p) => (
            <a key={p.id} href={`#/curriculum/${p.id}`}>
              <span style={{ background: p.color }} />
              {p.short}
              <small>{pad(p.id)}</small>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="course-progress">
            <div>
              <span>Your progress</span>
              <b>
                {completed} / {lessons.length || 24}
              </b>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${(completed / (lessons.length || 24)) * 100}%`,
                }}
              />
            </div>
            <small>
              {completed === 0
                ? "A good place to begin."
                : `${Math.round((completed / lessons.length) * 100)}% of lessons completed`}
            </small>
          </div>
          <a
            className="github-link"
            href={REPO}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> Open source on GitHub
            <ArrowUpRight size={14} />
          </a>
          <div className="sidebar-user">
            <span className="avatar">i.</span>
            <div>
              Independent researcher<small>Learn. Build. Measure.</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </button>
            <span>THE INFERENCE SYSTEMS COURSE</span>
            <ChevronRight size={13} />
            <b>
              {section === "learn"
                ? `Lesson ${id}`
                : navItems.find((n) => n[0] === section)?.[1] || "Overview"}
            </b>
          </div>
          <div className="header-actions">
            <button className="search-trigger" onClick={() => setSearch(true)}>
              <Search size={16} />
              <span>Search the course</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button theme-toggle"
              aria-label={`Use ${progress.theme === "dark" ? "light" : "dark"} theme`}
              onClick={() =>
                setProgress((p) => ({
                  ...p,
                  theme: p.theme === "dark" ? "light" : "dark",
                }))
              }
            >
              {progress.theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {storageError && (
            <div className="notice">
              Browser storage is unavailable. Export your work before leaving
              this page.
            </div>
          )}
          {section === "overview" && (
            <Overview progress={progress} next={next} completed={completed} />
          )}
          {section === "curriculum" && (
            <Curriculum progress={progress} selected={id} />
          )}
          {section === "learn" && (
            <Lesson
              key={id}
              lesson={lessons.find((l) => l.id === id)}
              state={progress.lessons[id] || {}}
              update={(change) => updateLesson(id, change)}
              notify={setToast}
            />
          )}
          {section === "lab" && <VisualStudio selected={id} />}
          {section === "projects" && (
            <Projects
              selected={id}
              progress={progress}
              update={updateProject}
            />
          )}
          {section === "portfolio" && <PortfolioPage />}
          {section === "resources" && <Resources />}
          {section === "notebook" && (
            <Notebook
              progress={progress}
              update={updateLesson}
              exportProgress={exportProgress}
              importProgress={importProgress}
            />
          )}
          {![
            "overview",
            "curriculum",
            "learn",
            "lab",
            "projects",
            "portfolio",
            "resources",
            "notebook",
          ].includes(section) && (
            <div className="empty-state">
              <h1>This page isn’t in the course.</h1>
              <a href="#/overview">Return to the overview</a>
            </div>
          )}
          <footer className="page-footer">
            <span>
              INFERENCE ATELIER <span>·</span> An open workshop for serious
              systems work.
            </span>
            <a
              href={`${REPO}/blob/main/docs/COURSE_GUIDE.md`}
              target="_blank"
              rel="noreferrer"
            >
              Course guide
              <ArrowUpRight size={13} />
            </a>
            <span>Edition 01 · October 2026</span>
          </footer>
        </main>
      </div>
      {search && <SearchDialog onClose={() => setSearch(false)} />}
      <div className="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}

function Overview({ progress, next, completed }) {
  return (
    <>
      <section className="overview-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" />
            FROM FIRST PRINCIPLES TO THE FRONTIER
          </div>
          <h1>
            Understand the machine.
            <br />
            Build <em>what comes next.</em>
          </h1>
          <p>
            A hands-on course in inference systems. Go from the anatomy of a
            token to GPU kernels, distributed engines, and real-time
            intelligence.
          </p>
          <div className="hero-actions">
            <a className="button primary" href={`#/learn/${next?.id || "01"}`}>
              {completed ? "Continue learning" : "Begin the course"}
              <ArrowRight size={17} />
            </a>
            <a className="text-button" href="#/curriculum">
              Explore the curriculum
              <ChevronRight size={15} />
            </a>
          </div>
          <div className="hero-credentials">
            <span>
              <Layers size={14} />7 connected phases
            </span>
            <span>
              <Clock size={14} />
              24-week pathway
            </span>
            <span>
              <Github size={14} />
              Open source
            </span>
          </div>
        </div>
        <HeroDiagram />
      </section>
      <div className="metrics-strip">
        <div>
          <b>
            {lessons.length || 24}
            <span>in-depth lessons</span>
          </b>
          <small>Intuition, derivation, implementation</small>
        </div>
        <div>
          <b>
            6<span>interactive visual labs</span>
          </b>
          <small>Explore the systems behind the math</small>
        </div>
        <div>
          <b>
            4<span>portfolio projects</span>
          </b>
          <small>Build artifacts worth putting your name on</small>
        </div>
        <div>
          <b>
            {lessons.reduce((s, l) => s + l.quiz.length, 0) || 120}
            <span>knowledge checks</span>
          </b>
          <small>Reason it through. Get precise feedback.</small>
        </div>
      </div>
      <div className="overview-middle">
        <section className="continue-card">
          <div className="section-topline">
            <span className="eyebrow">
              {completed ? "PICK UP WHERE YOU LEFT OFF" : "YOUR FIRST STEP"}
            </span>
            <span className="pill">PHASE {pad(next?.phase || 1)}</span>
          </div>
          <div className="continue-content">
            <span className="chapter-number">{next?.id || "01"}</span>
            <div>
              <h2>{next?.title || "The computational anatomy of inference"}</h2>
              <p>
                {next?.subtitle ||
                  "Follow a token through the model. Learn to predict the work before you optimize it."}
              </p>
              <div className="meta">
                <span>
                  <BookOpen size={13} />
                  {next?.minutes || 35} min read
                </span>
                <span>3 exercises</span>
                <span>5 questions</span>
              </div>
            </div>
          </div>
          <a className="continue-bottom" href={`#/learn/${next?.id || "01"}`}>
            <span>
              {completed ? "Continue lesson" : "Open your first lesson"}
            </span>
            <ArrowRight size={17} />
          </a>
        </section>
        <section className="lab-teaser">
          <div className="eyebrow">
            <FlaskConical size={14} /> THE VISUAL LAB
          </div>
          <div className="mini-bars">
            {[22, 35, 30, 54, 45, 76, 66, 95, 82, 108].map((h, i) => (
              <span
                key={i}
                style={{ height: h, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <h2>
            Don’t just read the equation.
            <br />
            <em>Change the variables.</em>
          </h2>
          <p>Watch memory, compute, and latency respond.</p>
          <a href="#/lab/roofline" className="text-button">
            Enter the lab
            <ArrowRight size={16} />
          </a>
        </section>
      </div>
      <section className="path-preview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE LEARNING PATH</span>
            <h2>One system. Every layer.</h2>
          </div>
          <a className="text-button" href="#/curriculum">
            View all 24 weeks
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="phase-grid">
          {phases.slice(0, 6).map((p) => (
            <a className="phase-card" href={`#/curriculum/${p.id}`} key={p.id}>
              <div className="phase-card-top">
                <PhaseIcon phase={p} />
                <span>WEEKS {p.weeks}</span>
              </div>
              <small>PHASE {pad(p.id)}</small>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="phase-card-footer">
                <span>
                  {lessons.filter((l) => l.phase === p.id).length ||
                    [3, 4, 4, 4, 4, 3][p.id - 1]}{" "}
                  lessons
                </span>
                <ArrowUpRight size={16} />
              </div>
            </a>
          ))}
        </div>
        <a className="capstone-strip" href="#/curriculum/7">
          <span className="capstone-star">
            <Sparkles size={23} />
          </span>
          <div>
            <span className="eyebrow">PHASE 07 · WEEKS 23–24</span>
            <h3>Then, ask a question nobody has answered well.</h3>
          </div>
          <span>
            Research capstone
            <ArrowRight size={17} />
          </span>
        </a>
      </section>
      <section className="philosophy">
        <span className="eyebrow">THE WAY WE LEARN</span>
        <h2>
          Predict. Build. Measure. <em>Explain.</em>
        </h2>
        <p>
          No speedup without a baseline. No chart without its experiment. No
          “mastery” badge for clicking through a syllabus. The outcome is your
          ability to reason about an unfamiliar system—and the work you can show
          to prove it.
        </p>
        <div>
          <span>15–20 hours / week</span>
          <span>Advanced ML & programming assumed</span>
          <span>CPU → GPU → cluster paths</span>
        </div>
        <a className="text-button" href="#/portfolio">
          See what you’ll build
          <ArrowUpRight size={15} />
        </a>
      </section>
    </>
  );
}
function Curriculum({ progress, selected }) {
  const [filter, setFilter] = useState("all");
  const shown = selected
    ? phases.filter((p) => String(p.id) === selected)
    : phases;
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">YOUR 24-WEEK RESEARCH PATHWAY</span>
        <h1>
          From a single token
          <br />
          to <em>the whole system.</em>
        </h1>
        <p>
          Seven phases, each building on the last. Read deeply, implement the
          mechanism, and earn your confidence with evidence.
        </p>
      </div>
      <div className="curriculum-toolbar">
        <div className="segmented">
          {[
            ["all", "All lessons"],
            ["remaining", "To complete"],
            ["done", "Completed"],
          ].map(([key, title]) => (
            <button
              key={key}
              className={filter === key ? "active" : ""}
              onClick={() => setFilter(key)}
            >
              {title}
            </button>
          ))}
        </div>
        {selected && (
          <a className="text-button" href="#/curriculum">
            Show all phases
            <ArrowRight size={15} />
          </a>
        )}
        <span>15–20 hours per week · self-paced</span>
      </div>
      <div className="course-orientation">
        <GraduationCap size={22} />
        <div>
          <b>
            Start with the performance model, even if you already deploy models.
          </b>
          <p>
            Each week: 8–10h implementation, 4h reading, 2–3h profiling, and
            1–3h writing. Advancement requires exercises, a quiz score of at
            least 80%, and a self-attested evidence checklist.
          </p>
        </div>
        <a
          href={`${REPO}/blob/main/docs/COURSE_GUIDE.md`}
          target="_blank"
          rel="noreferrer"
        >
          Setup guide
          <ArrowUpRight size={15} />
        </a>
      </div>
      {shown.map((p) => {
        const items = lessons.filter(
          (l) =>
            l.phase === p.id &&
            (filter === "all" ||
              (filter === "done"
                ? progress.lessons[l.id]?.complete
                : !progress.lessons[l.id]?.complete)),
        );
        return (
          <section className="curriculum-phase" key={p.id}>
            <div className="phase-heading">
              <PhaseIcon phase={p} size={23} />
              <div>
                <span className="eyebrow">
                  PHASE {pad(p.id)} · WEEKS {p.weeks}
                </span>
                <h2>{p.title}</h2>
                <p>{p.description}</p>
              </div>
            </div>
            <div className="lesson-list">
              {items.map((l) => (
                <a href={`#/learn/${l.id}`} key={l.id} className="lesson-row">
                  <span
                    className={`lesson-index ${progress.lessons[l.id]?.complete ? "done" : ""}`}
                  >
                    {progress.lessons[l.id]?.complete ? (
                      <Check size={17} />
                    ) : (
                      l.id
                    )}
                  </span>
                  <div>
                    <h3>{l.title}</h3>
                    <p>{l.subtitle}</p>
                  </div>
                  <span className="lesson-hardware">{l.hardware}</span>
                  <span className="lesson-minutes">{l.minutes} min</span>
                  <ArrowRight size={17} />
                </a>
              ))}
              {!items.length && (
                <p className="muted empty-filter">
                  No lessons match this filter in this phase.
                </p>
              )}
            </div>
            <div className="phase-outcome">
              <Target size={15} />
              <span>EXIT ARTIFACT</span>
              {p.output}
            </div>
          </section>
        );
      })}
    </>
  );
}
function Lesson({ lesson: l, state, update, notify }) {
  const [tab, setTab] = useState("article");
  const [answers, setAnswers] = useState(state.quiz?.answers || []);
  const [submitted, setSubmitted] = useState(state.quiz?.submitted || false);
  const [checklist, setChecklist] = useState([]);
  const [showVisual, setShowVisual] = useState(false);
  if (!l)
    return (
      <div className="empty-state">
        <h1>Lesson not found</h1>
        <a href="#/curriculum">Return to the learning path</a>
      </div>
    );
  const phase = phases[l.phase - 1];
  const score = answers.reduce(
    (n, a, i) => n + (a === l.quiz[i]?.answer ? 1 : 0),
    0,
  );
  const exercises = state.exercises || [];
  const canComplete =
    (state.quiz?.score || 0) >= 4 &&
    state.quiz?.submitted &&
    exercises.length === l.exercises.length &&
    checklist.length === l.completion.length;
  const related = experiments.find((e) => e.lesson === l.id);
  const changeAnswer = (i, value) => {
    const next = [...answers];
    next[i] = value;
    setAnswers(next);
    setSubmitted(false);
    update({ quiz: { answers: next, submitted: false, score: 0 } });
  };
  const submit = () => {
    setSubmitted(true);
    update({ quiz: { answers, submitted: true, score } });
  };
  return (
    <div className="lesson-page">
      <a href={`#/curriculum/${phase.id}`} className="back-link">
        ← {phase.title}
      </a>
      <header className="lesson-header">
        <div className="eyebrow">
          PHASE {pad(l.phase)} <span> / </span> WEEK {pad(l.week)}{" "}
          <span> / </span> LESSON {l.id}
        </div>
        <h1>{l.title}</h1>
        <p>{l.subtitle}</p>
        <div className="lesson-meta">
          <span>
            <Clock size={15} />
            {l.minutes} min read
          </span>
          <span>
            <Cpu size={15} />
            {l.hardware}
          </span>
          <span className="pill">{l.level}</span>
          {state.complete && (
            <span className="completed-label">
              <Check size={14} />
              Completed
            </span>
          )}
        </div>
      </header>
      <div className="lesson-tabs" role="tablist" aria-label="Lesson sections">
        {[
          ["article", "The lesson", BookOpen],
          ["exercises", "Exercises", Code2Icon],
          ["quiz", "Knowledge check", GraduationCap],
          ["notes", "Notebook", NotebookPen],
        ].map(([id, title, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {title}
            {id === "exercises" && <span>{exercises.length}/3</span>}
            {id === "quiz" && state.quiz?.submitted && (
              <span>{state.quiz.score}/5</span>
            )}
          </button>
        ))}
      </div>
      <div className="lesson-columns">
        <div className="lesson-body" role="tabpanel">
          {tab === "article" && (
            <>
              <div className="outcomes">
                <span className="eyebrow">AFTER THIS LESSON, YOU CAN</span>
                {l.outcomes.map((o) => (
                  <p key={o}>
                    <Check size={15} />
                    {o}
                  </p>
                ))}
              </div>
              {related && (
                <div className="lesson-visual">
                  <button
                    onClick={() => setShowVisual(!showVisual)}
                    aria-expanded={showVisual}
                  >
                    <span>
                      <FlaskConical size={19} />
                      <span>
                        <b>See the idea in motion</b>
                        <small>{related.description}</small>
                      </span>
                    </span>
                    <ChevronDown size={18} />
                  </button>
                  {showVisual && <VisualExperiment id={related.id} />}
                </div>
              )}
              <Markdown text={l.body} />
              <section className="lesson-lab-card">
                <span className="eyebrow">TAKE IT TO THE TERMINAL</span>
                <h2>{l.lab.title}</h2>
                <p>{l.lab.task}</p>
                <CodeBlock code={l.lab.command} />
                <p>
                  <b>Success looks like:</b> {l.lab.success}
                </p>
                <a
                  href={`${REPO}/blob/main/${l.lab.path}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open reference artifact
                  <ArrowUpRight size={14} />
                </a>
                <small>
                  Provided references demonstrate a mechanism. Extensions
                  described in the assignment are your implementation work.
                </small>
              </section>
              <div className="article-end">
                <button
                  className="button secondary"
                  onClick={() => {
                    update({ read: !state.read });
                    notify(
                      state.read
                        ? "Lesson marked unread."
                        : "Reading recorded. Continue with the exercises.",
                    );
                  }}
                >
                  {state.read ? <Check size={16} /> : <BookOpen size={16} />}{" "}
                  {state.read ? "Reading recorded" : "Mark as read"}
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setTab("exercises");
                    window.scrollTo(0, 300);
                  }}
                >
                  Work through the exercises
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
          {tab === "exercises" && (
            <>
              <div className="tab-intro">
                <span className="eyebrow">THINK FIRST. THEN CHECK.</span>
                <h2>Make the reasoning your own.</h2>
                <p>
                  Attempt each exercise before opening its solution. Save your
                  derivation, code, or measured result in your notebook.
                </p>
              </div>
              {l.exercises.map((e, i) => (
                <section className="exercise" key={i}>
                  <div className="exercise-title">
                    <span>{pad(i + 1)}</span>
                    <h3>{e.title}</h3>
                  </div>
                  <Markdown text={e.prompt} />
                  <details>
                    <summary>
                      Need a hint?
                      <ChevronDown size={15} />
                    </summary>
                    <Markdown text={e.hint} />
                  </details>
                  <details className="solution">
                    <summary>
                      Worked solution
                      <ChevronDown size={15} />
                    </summary>
                    <Markdown text={e.solution} />
                  </details>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={exercises.includes(i)}
                      onChange={() =>
                        update({
                          exercises: exercises.includes(i)
                            ? exercises.filter((n) => n !== i)
                            : [...exercises, i],
                        })
                      }
                    />
                    <span>
                      I can reproduce this result and explain the assumptions.
                    </span>
                  </label>
                </section>
              ))}
              <button
                className="button primary"
                onClick={() => {
                  setTab("quiz");
                  window.scrollTo(0, 300);
                }}
              >
                Take the knowledge check
                <ArrowRight size={16} />
              </button>
            </>
          )}
          {tab === "quiz" && (
            <>
              <div className="tab-intro">
                <span className="eyebrow">REASONING, NOT RECALL</span>
                <h2>Test your mental model.</h2>
                <p>
                  Five questions. Get at least four right to meet the quiz
                  criterion. You can retry; explanations appear after you
                  submit.
                </p>
              </div>
              {l.quiz.map((q, i) => (
                <fieldset className="quiz-question" key={i}>
                  <legend>
                    <span>{pad(i + 1)}</span>
                    {q.question}
                  </legend>
                  {q.options.map((option, j) => (
                    <label
                      key={j}
                      className={`quiz-option ${answers[i] === j ? "chosen" : ""} ${submitted && j === q.answer ? "correct" : ""} ${submitted && answers[i] === j && j !== q.answer ? "incorrect" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        value={j}
                        checked={answers[i] === j}
                        onChange={() => changeAnswer(i, j)}
                      />
                      <span className="option-letter">{"ABCD"[j]}</span>
                      <span>{option}</span>
                      {submitted && j === q.answer && <Check size={16} />}
                    </label>
                  ))}
                  {submitted && (
                    <div
                      className={`quiz-explanation ${answers[i] === q.answer ? "correct" : "incorrect"}`}
                    >
                      <b>
                        {answers[i] === q.answer
                          ? "Correct."
                          : "Revisit this one."}
                      </b>
                      <Markdown text={q.explanation} />
                    </div>
                  )}
                </fieldset>
              ))}
              {!submitted ? (
                <button
                  className="button primary"
                  disabled={l.quiz.some(
                    (_, i) => answers[i] === undefined || answers[i] === null,
                  )}
                  onClick={submit}
                >
                  Check my reasoning
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="quiz-result" role="status">
                  <div>
                    <strong>
                      {score} / {l.quiz.length}
                    </strong>
                    <p>
                      {score >= 4
                        ? "Quiz criterion met. Finish your exercises and evidence checklist."
                        : "Review the explanations and retry when you can explain each answer."}
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSubmitted(false);
                      setAnswers([]);
                      update({
                        quiz: { answers: [], submitted: false, score: 0 },
                      });
                    }}
                  >
                    <RotateCcw size={16} />
                    Try again
                  </button>
                </div>
              )}
            </>
          )}
          {tab === "notes" && (
            <>
              <div className="tab-intro">
                <span className="eyebrow">YOUR RESEARCH NOTEBOOK</span>
                <h2>Write what the experiment taught you.</h2>
                <p>
                  Keep predictions separate from observations. Record the exact
                  command, environment, results, and the next question.
                </p>
              </div>
              <textarea
                className="notebook-editor"
                aria-label={`Notes for lesson ${l.id}`}
                value={state.notes || ""}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder={
                  "Hypothesis\nWhat do I predict, and why?\n\nSetup\nHardware, versions, commit, workload, command\n\nObservations\nMeasured results and unexpected behavior\n\nExplanation\nWhat does the evidence support?\n\nNext experiment\nWhat would falsify my explanation?"
                }
              />
              <p className="model-note">
                Saved in this browser. Use My notebook → Export to keep a backup
                or move between devices.
              </p>
              <a className="text-button" href="#/notebook">
                Open all your notes
                <ArrowRight size={15} />
              </a>
            </>
          )}
        </div>
        <aside className="lesson-aside">
          <div className="aside-box">
            <span className="eyebrow">YOUR LESSON CHECKLIST</span>
            <div className="status-row">
              <span className={state.read ? "check done" : "check"}>
                {state.read && <Check size={11} />}
              </span>
              Read & understand
            </div>
            <div className="status-row">
              <span className={exercises.length === 3 ? "check done" : "check"}>
                {exercises.length === 3 && <Check size={11} />}
              </span>
              Exercises <b>{exercises.length}/3</b>
            </div>
            <div className="status-row">
              <span
                className={
                  state.quiz?.submitted && state.quiz.score >= 4
                    ? "check done"
                    : "check"
                }
              >
                {state.quiz?.submitted && state.quiz.score >= 4 && (
                  <Check size={11} />
                )}
              </span>
              Quiz{" "}
              <b>{state.quiz?.submitted ? `${state.quiz.score}/5` : "—"}</b>
            </div>
            <div className="aside-rule" />
            <span className="eyebrow">EVIDENCE CHECK</span>
            <p className="small-muted">
              Self-assessment: can you substantiate these claims?
            </p>
            {l.completion.map((c, i) => (
              <label key={i} className="check-row">
                <input
                  type="checkbox"
                  checked={checklist.includes(i) || !!state.complete}
                  disabled={state.complete}
                  onChange={() =>
                    setChecklist(
                      checklist.includes(i)
                        ? checklist.filter((n) => n !== i)
                        : [...checklist, i],
                    )
                  }
                />
                <span>{c}</span>
              </label>
            ))}
            <button
              className="button primary complete-button"
              disabled={!canComplete && !state.complete}
              onClick={() => {
                update({ complete: !state.complete, read: true });
                notify(
                  state.complete
                    ? "Lesson reopened."
                    : "Lesson completed. Keep the evidence with your notes.",
                );
              }}
            >
              {state.complete ? (
                <>
                  <Check size={15} />
                  Completed · reopen
                </>
              ) : (
                "Complete lesson"
              )}
            </button>
            {!state.complete && (
              <small className="small-muted">
                3 exercises + 80% quiz + evidence checklist
              </small>
            )}
          </div>
          <div className="aside-box resource-aside">
            <span className="eyebrow">READ & WATCH</span>
            {l.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer">
                <span>
                  {r.type} {r.required ? "· Essential" : "· Go deeper"}
                </span>
                <b>
                  {r.title}
                  <ArrowUpRight size={13} />
                </b>
                <small>{r.why}</small>
              </a>
            ))}
          </div>
        </aside>
      </div>
      <nav className="lesson-pagination" aria-label="Adjacent lessons">
        {l.week > 1 ? (
          <a href={`#/learn/${pad(l.week - 1)}`}>
            ← Previous lesson
            <span>{lessons.find((x) => x.week === l.week - 1)?.title}</span>
          </a>
        ) : (
          <a href="#/curriculum">← Learning path</a>
        )}
        {l.week < 24 ? (
          <a href={`#/learn/${pad(l.week + 1)}`}>
            Next lesson →
            <span>{lessons.find((x) => x.week === l.week + 1)?.title}</span>
          </a>
        ) : (
          <a href="#/portfolio">Build in public →</a>
        )}
      </nav>
    </div>
  );
}
function Code2Icon(props) {
  return <Workflow {...props} />;
}
function Projects({ selected, progress, update }) {
  const p = projects.find((p) => p.id === selected);
  if (p) {
    const steps = progress.projects[p.id] || [],
      s = portfolio[p.id];
    return (
      <>
        <a className="back-link" href="#/projects">
          ← All projects
        </a>
        <div className="page-intro">
          <span className="eyebrow">
            PROJECT {p.number} · {p.weeks}
          </span>
          <h1>{p.title}</h1>
          <p>{p.summary}</p>
          <div className="meta">
            <span>
              <Cpu size={14} />
              {p.hardware}
            </span>
            <span>{steps.length}/6 milestones completed</span>
          </div>
        </div>
        <div className="project-question">
          <span className="eyebrow">THE QUESTION</span>
          <h2>{p.question}</h2>
        </div>
        <div className="project-detail-grid">
          <div>
            <h2>Your build plan</h2>
            <p className="muted">Prerequisites: {p.prereqs}</p>
            <CodeBlock code={p.start} />
            <div className="project-milestones">
              {p.milestones.map((m, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={steps.includes(i)}
                    onChange={() => update(p.id, i)}
                  />
                  <span>{pad(i + 1)}</span>
                  <p>{m}</p>
                </label>
              ))}
            </div>
            <h2>Build a fair comparison.</h2>
            <p>{p.baseline}</p>
            <h2>The experiment matrix</h2>
            <p>{p.experiments}</p>
            <h2>Your deliverable</h2>
            <p>{p.deliverables}</p>
            <div className="callout">
              <Target size={24} />
              <div>
                <h3>Acceptance gate</h3>
                <p>{p.gate}</p>
              </div>
            </div>
            <h2>Extend the work</h2>
            <p>{p.stretch}</p>
          </div>
          <aside>
            <div className="aside-box">
              <span className="eyebrow">REVIEW RUBRIC · 100 POINTS</span>
              {p.rubric.map(([label, n]) => (
                <div className="rubric-row" key={label}>
                  <span>{label}</span>
                  <b>{n}</b>
                </div>
              ))}
              <p className="small-muted">
                Self-review or ask a peer to evaluate your artifact. Milestone
                checkmarks are not an automatic grade.
              </p>
            </div>
            <div className="aside-box">
              <span className="eyebrow">THE PORTFOLIO PIECE</span>
              <h3>{s.headline}</h3>
              <p>{s.artifact}</p>
              <a className="text-button" href="#/portfolio">
                Demo + writing brief
                <ArrowUpRight size={14} />
              </a>
            </div>
            <a
              className="related-lesson"
              href={`${REPO}/blob/main/docs/EXPERIMENT_TEMPLATE.md`}
              target="_blank"
              rel="noreferrer"
            >
              Experiment template
              <ExternalLink size={15} />
            </a>
          </aside>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">THE WORK THAT MAKES YOU BETTER</span>
        <h1>
          Build it. Break it.
          <br />
          <em>Understand it.</em>
        </h1>
        <p>
          Four substantial projects. Clear constraints, credible baselines, and
          deliverables that stand on their own.
        </p>
      </div>
      <div className="projects-grid">
        {projects.map((p) => (
          <a key={p.id} href={`#/projects/${p.id}`} className="project-card">
            <div className={`project-art art-${p.id}`}>
              <span>{p.number}</span>
              {p.id === "engine" ? (
                <Workflow size={80} strokeWidth={1} />
              ) : p.id === "moe" ? (
                <Network size={80} strokeWidth={1} />
              ) : p.id === "embodied" ? (
                <ScanEye size={80} strokeWidth={1} />
              ) : (
                <Sparkles size={80} strokeWidth={1} />
              )}
              <small>{p.tag}</small>
            </div>
            <div className="project-card-body">
              <span className="eyebrow">{p.weeks}</span>
              <h2>{p.title}</h2>
              <p>{p.summary}</p>
              <div className="project-card-footer">
                <span>{p.hardware}</span>
                <span>
                  {(progress.projects[p.id] || []).length}/6 milestones
                  <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
      <div className="callout">
        <GraduationCap size={25} />
        <div>
          <h3>Simulation is a valid starting point. Label what it proves.</h3>
          <p>
            The CPU labs let you test mechanisms and invariants before renting
            hardware. A GPU performance claim needs a real GPU measurement; a
            closed-loop robotics claim needs a closed-loop evaluation.
          </p>
        </div>
      </div>
    </>
  );
}
function Resources() {
  const [query, setQuery] = useState(""),
    [type, setType] = useState("All"),
    [required, setRequired] = useState(false);
  const resources = useMemo(sourceResources, []);
  const items = resources.filter(
    (r) =>
      (type === "All" || r.type === type) &&
      (!required || r.required) &&
      `${r.title} ${r.why}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">READ THE PRIMARY SOURCES</span>
        <h1>
          Your research <em>bookshelf.</em>
        </h1>
        <p>
          Papers, source code, lectures, and documentation. Each resource has a
          reason to be here and a place in the learning path.
        </p>
      </div>
      <div className="resource-toolbar">
        <label className="input-with-icon">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a paper, lecture, or repository…"
            aria-label="Search resources"
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Essential only
        </label>
      </div>
      <div className="filter-tabs">
        {["All", "Paper", "Video", "Repository", "Documentation", "Course"].map(
          (t) => (
            <button
              key={t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t === "All" ? "Everything" : t + "s"}
            </button>
          ),
        )}
        <span>{items.length} resources</span>
      </div>
      <div className="resources-grid">
        {items.map((r, i) => (
          <article className="resource-card" key={r.url}>
            <div className="resource-type">
              <span>
                {r.type === "Video" ? (
                  <Play size={15} />
                ) : r.type === "Repository" ? (
                  <Github size={15} />
                ) : (
                  <FileText size={15} />
                )}{" "}
                {r.type}
              </span>
              {r.required && <small>ESSENTIAL</small>}
            </div>
            <h3>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
                <ArrowUpRight size={16} />
              </a>
            </h3>
            <p>{r.why}</p>
            <div className="resource-lessons">
              <span>Study with</span>
              {r.lessons.slice(0, 6).map((id) => (
                <a key={id} href={`#/learn/${id}`}>
                  Lesson {id}
                </a>
              ))}
              {r.lessons.length > 6 && <small>+{r.lessons.length - 6}</small>}
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>No matching resources.</h3>
          <button
            className="text-button"
            onClick={() => {
              setType("All");
              setQuery("");
              setRequired(false);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <p className="model-note">
        Curriculum sources reviewed for the October 21, 2026 edition. Upstream
        APIs, hardware support, and branches evolve. Record a commit before
        reproducing an experiment; use the source-audit procedure in lesson 19.
      </p>
    </>
  );
}
function Notebook({ progress, update, exportProgress, importProgress }) {
  const [selected, setSelected] = useState("01");
  const l = lessons.find((l) => l.id === selected);
  const note = progress.lessons[selected]?.notes || "";
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">THINK ON PAPER. KEEP THE EVIDENCE.</span>
        <h1>
          A notebook for <em>better questions.</em>
        </h1>
        <p>
          Your derivations, experiment records, and unexpected results. Stored
          in this browser; exported whenever you choose.
        </p>
      </div>
      <div className="notebook-toolbar">
        <span>
          {lessons.filter((l) => progress.lessons[l.id]?.notes?.trim()).length}{" "}
          lessons with notes
        </span>
        <div>
          <button className="button secondary" onClick={exportProgress}>
            <Download size={15} />
            Export all progress
          </button>
          <label className="button secondary import-button">
            <Upload size={15} />
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={importProgress}
            />
          </label>
        </div>
      </div>
      <p className="model-note">
        Import merges by lesson and project ID; matching entries are replaced
        with the imported version. Export a backup first if you want to preserve
        both.
      </p>
      <div className="notebook-layout">
        <nav aria-label="Lesson notebooks">
          {lessons.map((l) => (
            <button
              className={l.id === selected ? "active" : ""}
              key={l.id}
              onClick={() => setSelected(l.id)}
            >
              <span>{l.id}</span>
              {l.title}
              {progress.lessons[l.id]?.notes?.trim() && (
                <span className="note-dot" />
              )}
            </button>
          ))}
        </nav>
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">LESSON {selected}</span>
              <h2>{l?.title || "Your notes"}</h2>
            </div>
            <a
              href={`#/learn/${selected}`}
              aria-label={`Read lesson ${selected}`}
            >
              <ArrowUpRight size={20} />
            </a>
          </div>
          <textarea
            className="notebook-editor"
            aria-label={`Notebook for lesson ${selected}`}
            value={note}
            onChange={(e) => update(selected, { notes: e.target.value })}
            placeholder={
              "My prediction\n\nExperimental setup\n\nWhat I measured\n\nWhat surprised me\n\nMy explanation\n\nThe next experiment"
            }
          />
          <div className="notebook-status">
            <span>
              <span className="live-dot" />
              Autosaves locally
            </span>
            <span>
              {note.trim() ? note.trim().split(/\s+/).length : 0} words
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
function SearchDialog({ onClose }) {
  const ref = useRef(null),
    [query, setQuery] = useState("");
  useEffect(() => {
    ref.current.showModal();
    return () => ref.current?.close();
  }, []);
  const items = lessons
    .filter((l) =>
      `${l.title} ${l.subtitle} ${l.tags.join(" ")} ${l.body}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 10);
  return (
    <dialog
      className="search-dialog"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="search-dialog-input">
        <Search size={21} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons, concepts, or equations…"
          aria-label="Search the entire course"
        />
        <button
          className="icon-button"
          aria-label="Close search"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="search-results">
        <span className="eyebrow">
          {query ? "MATCHING LESSONS" : "START EXPLORING"}
        </span>
        {items.map((l) => (
          <a key={l.id} href={`#/learn/${l.id}`} onClick={onClose}>
            <span>{l.id}</span>
            <div>
              <b>{l.title}</b>
              <small>{l.subtitle}</small>
            </div>
            <ArrowUpRight size={16} />
          </a>
        ))}
        {!items.length && (
          <p>
            No lessons match “{query}”. Try “KV cache”, “speculation”, or
            “latency”.
          </p>
        )}
      </div>
      <div className="search-dialog-footer">
        <span>Searches all lesson text</span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
    </dialog>
  );
}
createRoot(document.getElementById("root")).render(<App />);
