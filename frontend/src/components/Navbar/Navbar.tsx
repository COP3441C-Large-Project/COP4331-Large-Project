import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; 

const NAV_LINKS = [
  { label: "home", href: "/", protected: false },
  { label: "interests", href: "/interests", protected: true },
  { label: "matches", href: "/matches", protected: true },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/");
  };

  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center gap-8 px-8 h-14 border-b border-[var(--color-border)] sticky top-0 z-50 bg-[var(--color-bg)]"
    >
      <Link
        to="/"
        className="font-mono text-[1.1rem] font-semibold tracking-tight text-[var(--color-text-primary)] no-underline shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-red)] focus:ring-offset-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        hot take<span className="text-[var(--color-accent-red)]">.</span>
      </Link>

      <ul className="flex list-none gap-1 flex-1 m-0 p-0">
        {NAV_LINKS.map((link) => {
          if (link.protected && !isAuthenticated) return null;

          const isActive = location.pathname === link.href;

          return (
            <li key={link.href}>
              <Link
                to={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-sm px-3 py-2 rounded-md no-underline transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-red)] focus:ring-offset-2 ${
                  isActive
                    ? "text-[var(--color-accent-red)] font-medium underline underline-offset-4"
                    : "text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {isAuthenticated && (
        <button
          onClick={handleSignOut}
          type="button"
          className="text-[0.8rem] text-[var(--color-text-secondary)] bg-transparent border border-[var(--color-border-strong)] rounded-md px-3.5 py-2 cursor-pointer shrink-0 transition-all duration-150 hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-red)] focus:ring-offset-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          sign out
        </button>
      )}
    </nav>
  );
};

export default Navbar;