import { useCallback, useEffect, useRef, useState } from "react";
import { NOW } from "../data/now";

type OutputLine = {
  type: "input" | "output" | "error" | "success" | "info" | "blank";
  content: string;
};

const BOOT_SEQUENCE = [
  { type: "info" as const, content: "BIOS v2.6.1 ... OK" },
  { type: "info" as const, content: "Loading kernel ... OK" },
  { type: "info" as const, content: "Mounting filesystem ... OK" },
  { type: "success" as const, content: "System ready." },
  { type: "blank" as const, content: "" },
  {
    type: "output" as const,
    content: 'Type "help" to see available commands.',
  },
  { type: "blank" as const, content: "" },
];

const PROJECTS = [
  {
    name: "(Hackathon) convene",
    status: "shipped",
    desc: "90 minute Hackathon. AI agent which automates tech event management with Luma and web search.",
  },
  {
    name: "(Hackathon) EU AI act helper",
    status: "shipped",
    desc: "Analyses a product's exposure to the EU AI act, and what the team can do about it.",
  },
  {
    name: "handlebar",
    status: "wip",
    desc: "Runtime control layer for AI agents",
  },
  {
    name: "rover",
    status: "exited",
    desc: "Bug detection with AI agents and code-graph analysis",
  },
  {
    name: "pyvertical",
    status: "shipped",
    desc: "Vertical federated learning platform",
  },
];

const COMMANDS: Record<string, (args: string) => OutputLine[]> = {
  help: () => [
    { type: "output", content: "┌─ Available commands ──────────────────┐" },
    { type: "output", content: "│  whoami          about me             │" },
    { type: "output", content: "│  ls projects     list my projects     │" },
    { type: "output", content: "│  cat cv.txt      view cv              │" },
    { type: "output", content: "│  cd blog         go to blog           │" },
    { type: "output", content: "│  cd projects     go to projects       │" },
    { type: "output", content: "│  cd cv           go to cv page        │" },
    { type: "output", content: "│  cd now          go to now page       │" },
    { type: "output", content: "│  clear           clear terminal       │" },
    { type: "output", content: "└───────────────────────────────────────┘" },
    { type: "blank", content: "" },
  ],

  whoami: () => [
    { type: "success", content: "tom@portfolio:~$" },
    { type: "blank", content: "" },
    {
      type: "output",
      content: "Founder + AI engineer. Problem-driven, domain agnostic -",
    },
    {
      type: "output",
      content:
        "I've worked on AI for sports, healthcare, devops, finance, aerospace, and more.",
    },
    { type: "blank", content: "" },
    {
      type: "output",
      content:
        "Previously: co-founded Rover (seed-stage, AI-driven graph analysis of codebases).",
    },
    {
      type: "output",
      content: "Currently: looking for the next interesting problem.",
    },
    { type: "blank", content: "" },
    {
      type: "output",
      content:
        "Good at: LLMOps, product eng, moving fast whilst making sure things don't break.",
    },
    {
      type: "output",
      content:
        "Interested in: Scaling AI applications + doing so with control, AI infrastructure, developer tools, anything",
    },
    { type: "output", content: "           weird and technically ambitious." },
    { type: "blank", content: "" },
    { type: "info", content: "── now.txt ─────────────────────────────" },
    { type: "blank", content: "" },
    { type: "info", content: "# building" },
    ...NOW.building.slice(0, 2).map((item) => ({
      type: "output" as const,
      content: `  ▸ ${item.text}`,
    })),
    { type: "blank", content: "" },
    { type: "info", content: "# reading" },
    ...NOW.reading.map((item) => ({
      type: "output" as const,
      content: `  // ${item.text}`,
    })),
    { type: "blank", content: "" },
    { type: "info", content: "# status" },
    { type: "output", content: `  ${NOW.status}` },
    { type: "blank", content: "" },
    { type: "output", content: '  → "cd now" to read the full now page' },
    { type: "blank", content: "" },
  ],

  "ls projects": () => [
    // { type: "output", content: `total ${PROJECTS.length}` },
    { type: "blank", content: "" },
    ...PROJECTS.flatMap((p) => [
      {
        type: (p.status === "rip"
          ? "error"
          : p.status === "wip"
            ? "info"
            : "success") as OutputLine["type"],
        content: `[${p.status}]  ${p.name}`,
      },
      { type: "output" as const, content: `         └─ ${p.desc}` },
    ]),
    { type: "blank", content: "" },
    { type: "output", content: 'Run "cd projects" to see full details.' },
    { type: "blank", content: "" },
  ],

  "cat cv.txt": () => [
    { type: "output", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "success", content: "  TOM - Founder & AI Engineer" },
    { type: "output", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "blank", content: "" },
    { type: "info", content: "EXPERIENCE" },
    { type: "output", content: "  Co-founder & CTO, Handlebar" },
    {
      type: "output",
      content:
        "    Built a deterministic, runtime policy enforcement system for LLM / agent workflows",
    },
    { type: "blank", content: "" },
    { type: "output", content: "  Co-founder & CTO, Rover" },
    {
      type: "output",
      content:
        "    Built a graph-based code analysis platform (RAG, static analysis, AI agents)",
    },
    { type: "output", content: "    Seed funded; team of 5" },
    { type: "blank", content: "" },
    {
      type: "output",
      content: "  Researcher (Volunteer), OpenMined",
    },
    {
      type: "output",
      content:
        "    Researched ML security and privacy (jailbreaks, model inversion, identity attacks)",
    },
    {
      type: "output",
      content:
        "    Developed PyVertical, an open-source vertical federated learning framework",
    },
    {
      type: "output",
      content:
        "    Published papers on ML attacks and federated learning in workshops at NeurIPS, ICLR, ICIP",
    },
    { type: "blank", content: "" },
    {
      type: "output",
      content: "  Data Scientist, Tessella",
    },
    {
      type: "output",
      content:
        "    Consultant data scientist. Worked on analytics projects in computational physics, aerospace, biosciences, and more.",
    },
    { type: "blank", content: "" },
    { type: "info", content: "SKILLS" },
    { type: "output", content: "  TypeScript, Python, Go, React" },
    {
      type: "output",
      content:
        "  AI agents, LLM architecture + inference, RAG, evals, embeddings",
    },
    { type: "output", content: "  Postgres, Redis, Neo4j" },
    { type: "blank", content: "" },
    { type: "info", content: "LOOKING FOR" },
    {
      type: "output",
      content: "  Product/AI engineer or founding eng role",
    },
    {
      type: "output",
      content: "  AI-native company, interesting technical problems",
    },
    { type: "blank", content: "" },
    { type: "output", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    {
      type: "success",
      content: "  → 'cd cv' for full version",
    },
    { type: "output", content: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "blank", content: "" },
  ],

  "cd blog": () => {
    setTimeout(() => {
      window.location.href = "/blog";
    }, 500);
    return [
      { type: "success", content: "Navigating to /blog ..." },
      { type: "blank", content: "" },
    ];
  },

  "cd projects": () => {
    setTimeout(() => {
      window.location.href = "/projects";
    }, 500);
    return [
      { type: "success", content: "Navigating to /projects ..." },
      { type: "blank", content: "" },
    ];
  },

  "cd cv": () => {
    setTimeout(() => {
      window.location.href = "/cv";
    }, 500);
    return [
      { type: "success", content: "Navigating to /cv ..." },
      { type: "blank", content: "" },
    ];
  },

  "cd now": () => {
    setTimeout(() => {
      window.location.href = "/now";
    }, 500);
    return [
      { type: "success", content: "Navigating to /now ..." },
      { type: "blank", content: "" },
    ];
  },
};

const LINE_COLORS: Record<OutputLine["type"], string> = {
  input: "#00ff41",
  output: "#aacc99",
  error: "#ff3333",
  success: "#00ff41",
  info: "#ffb000",
  blank: "transparent",
};

export default function Terminal() {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [booting, setBooting] = useState(true);
  const [inputReady, setInputReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Focus input without scrolling when it becomes ready
  useEffect(() => {
    if (inputReady) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [inputReady]);

  // Boot sequence
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      for (let i = 0; i < BOOT_SEQUENCE.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, i < 4 ? 120 : 60));
        if (cancelled) return;
        setLines((prev) => [...prev, BOOT_SEQUENCE[i]]);
      }
      setBooting(false);
      setInputReady(true);
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Focus input on click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const runCommand = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase();

    if (!cmd) {
      setLines((prev) => [...prev, { type: "blank", content: "" }]);
      return;
    }

    // Add to history
    setHistory((prev) => [raw, ...prev]);
    setHistoryIdx(-1);

    // Echo input
    setLines((prev) => [
      ...prev,
      { type: "input", content: `visitor@tomtitcombe.com:~$ ${raw}` },
    ]);

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    const handler = COMMANDS[cmd];
    if (handler) {
      const output = handler(cmd);
      setLines((prev) => [...prev, ...output]);
    } else {
      setLines((prev) => [
        ...prev,
        { type: "error", content: `bash: ${cmd}: command not found` },
        { type: "output", content: 'Type "help" for available commands.' },
        { type: "blank", content: "" },
      ]);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        runCommand(input);
        setInput("");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx] ?? "");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIdx = Math.max(historyIdx - 1, -1);
        setHistoryIdx(newIdx);
        setInput(newIdx === -1 ? "" : (history[newIdx] ?? ""));
      } else if (e.key === "Tab") {
        e.preventDefault();
        // Simple tab completion
        const partial = input.toLowerCase();
        const match = Object.keys(COMMANDS).find((k) => k.startsWith(partial));
        if (match) setInput(match);
      } else if (e.key === "c" && e.ctrlKey) {
        setLines((prev) => [
          ...prev,
          { type: "input", content: `visitor@tomtitcombe.com:~$ ${input}^C` },
        ]);
        setInput("");
      }
    },
    [input, history, historyIdx, runCommand],
  );

  return (
    <div
      className="terminal-widget"
      onClick={focusInput}
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(0,255,65,0.25)",
        borderRadius: "4px",
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
        fontSize: "13px",
        lineHeight: "1.5",
        cursor: "text",
        position: "relative",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          borderBottom: "1px solid rgba(0,255,65,0.15)",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#0a0a0a",
          borderRadius: "4px 4px 0 0",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#ff3333",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#ffb000",
            display: "inline-block",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#00ff41",
            display: "inline-block",
          }}
        />
        <span style={{ marginLeft: "8px", color: "#555", fontSize: "11px" }}>
          visitor@tomtitcombe.com:~
        </span>
      </div>

      {/* Output area */}
      <div
        style={{
          padding: "12px 16px",
          minHeight: "320px",
          maxHeight: "480px",
          overflowY: "auto",
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: LINE_COLORS[line.type],
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              minHeight: "1.5em",
            }}
          >
            {line.content}
          </div>
        ))}

        {/* Input line */}
        {inputReady && (
          <div
            style={{ display: "flex", alignItems: "center", color: "#00ff41" }}
          >
            <span style={{ flexShrink: 0, marginRight: "6px" }}>
              visitor@tomtitcombe.com:~$
            </span>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ visibility: "hidden", whiteSpace: "pre" }}>
                {input || " "}
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Terminal command input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#00ff41",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  lineHeight: "inherit",
                  caretColor: "#00ff41",
                  padding: 0,
                }}
              />
            </div>
            {booting && (
              <span
                className="cursor-blink"
                style={{ color: "#00ff41", marginLeft: "2px" }}
              >
                ▋
              </span>
            )}
          </div>
        )}

        {booting && !inputReady && (
          <span className="cursor-blink" style={{ color: "#00ff41" }}>
            ▋
          </span>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
