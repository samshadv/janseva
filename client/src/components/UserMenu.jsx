import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, History, ChevronDown, CheckCircle2 } from "lucide-react";

export function UserMenu({ user, profile, onSignOut, onToggleHistory }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.displayName || user?.email?.split("@")[0] || "Citizen";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className="user-menu-button"
        onClick={() => setOpen(!open)}
        aria-label="User profile menu"
      >
        <span className="user-avatar-badge">{initial}</span>
        <span className="user-menu-name">{displayName}</span>
        <ChevronDown size={14} className={`user-menu-chevron ${open ? "rotate" : ""}`} />
      </button>

      {open && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-header">
            <strong>{displayName}</strong>
            <small>{user?.email}</small>
            <div className="user-dropdown-badge">
              <CheckCircle2 size={12} /> Verified Citizen Session
            </div>
          </div>

          <div className="user-dropdown-divider" />

          <button
            type="button"
            className="user-dropdown-item"
            onClick={() => {
              setOpen(false);
              onToggleHistory();
            }}
          >
            <History size={15} />
            <span>Inquiry History</span>
          </button>

          <div className="user-dropdown-divider" />

          <button
            type="button"
            className="user-dropdown-item danger"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
