import React from "react";
import { Match } from "../../types";

interface MatchListProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (match: Match) => void;
  activeSection: "matches" | "interests";
  onSectionChange: (section: "matches" | "interests") => void;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  activeSection,
  onSectionChange,
}) => {
  return (
    <aside
      className="w-80 shrink-0 h-full flex flex-col px-5 pt-6 pb-4 border-r border-[var(--color-border)] overflow-y-auto gap-1"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Logo */}
      <div
        className="text-[1.1rem] font-semibold tracking-tight text-[var(--color-text-primary)] mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        hot take<span className="text-[var(--color-accent-red)]">.</span>
      </div>

      {/* Side nav */}
      <nav className="flex flex-col mb-5">
        {(["matches", "interests"] as const).map((section) => (
          <button
            key={section}
            onClick={() => onSectionChange(section)}
            className={`text-left text-[0.9rem] px-3 py-2 rounded-lg cursor-pointer border-none transition-all duration-150 ${
              activeSection === section
                ? "text-[var(--color-text-primary)] bg-[var(--color-surface-selected)]"
                : "text-[var(--color-text-secondary)] bg-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            }`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {section === "matches" ? "matches" : "my interests"}
          </button>
        ))}
      </nav>

      {/* Label */}
      <div className="text-[0.65rem] font-semibold tracking-widest text-[var(--color-text-muted)] px-3 mb-2 uppercase">
        Your Matches
      </div>

      {/* Match list */}
      <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
        {matches.map((match) => (
          <li key={match.id}>
            <button
              onClick={() => onSelectMatch(match)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer text-left transition-all duration-150 ${
                selectedMatchId === match.id
                  ? "bg-[var(--color-surface-selected)] border-[var(--color-accent-red-subtle)]"
                  : "bg-transparent border-transparent hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border)]"
              }`}
            >
              {/* Avatar */}
              <div className="relative w-[38px] h-[38px] rounded-full bg-[var(--color-surface-avatar)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <span
                  className="text-[0.8rem] font-medium text-[var(--color-text-secondary)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {match.username[0].toUpperCase()}
                </span>
                {match.isOnline && (
                  <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-accent-orange)] border-2 border-[var(--color-bg)]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span
                  className="text-sm font-medium text-[var(--color-text-primary)] truncate"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {match.username}
                </span>
                <span
                  className="text-xs text-[var(--color-text-muted)] truncate"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {match.lastMessage ?? match.interests.join(" · ")}
                </span>
              </div>

              {/* Score */}
              <div className="flex flex-col items-end shrink-0">
                <span
                  className="text-base font-semibold text-[var(--color-accent-red)] leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {match.matchPercentage}
                </span>
                <span
                  className="text-[0.65rem] text-[var(--color-text-muted)] tracking-wide"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  match
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default MatchList;