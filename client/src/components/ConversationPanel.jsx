import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Clock, MessageSquare, X, ChevronRight, RefreshCw, FileText } from "lucide-react";

export function ConversationPanel({ isOpen, onClose, onSelectConversation }) {
  const { getToken, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      const res = await fetch("/api/conversations?limit=30", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        throw new Error("Unable to load history");
      }

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err?.message || "Could not retrieve saved inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadHistory();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  return (
    <div className="history-drawer-overlay" onClick={onClose}>
      <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="history-drawer-header">
          <div className="history-drawer-title">
            <Clock size={18} />
            <h3>Your JanSetu Inquiries</h3>
          </div>
          <div className="history-header-actions">
            <button
              className="history-refresh-btn"
              onClick={loadHistory}
              disabled={loading}
              title="Refresh history"
              aria-label="Refresh history"
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </button>
            <button
              className="history-close-btn"
              onClick={onClose}
              aria-label="Close history panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="history-drawer-body">
          {loading && conversations.length === 0 && (
            <div className="history-loading">
              <RefreshCw size={24} className="spin" />
              <p>Fetching your past inquiries...</p>
            </div>
          )}

          {error && (
            <div className="history-error-banner">
              <p>{error}</p>
              <button onClick={loadHistory}>Retry</button>
            </div>
          )}

          {!loading && conversations.length === 0 && !error && (
            <div className="history-empty">
              <MessageSquare size={32} />
              <h4>No inquiries recorded yet</h4>
              <p>Whenever you ask JanSetu for public scheme guidance while signed in, your queries will appear here.</p>
            </div>
          )}

          <div className="history-list">
            {conversations.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="history-card-item"
                  onClick={async () => {
                    const token = getToken();
                    try {
                      const res = await fetch(`/api/conversations/${item.id}`, {
                        headers: {
                          ...(token && { Authorization: `Bearer ${token}` }),
                        },
                      });
                      if (res.ok) {
                        const full = await res.json();
                        onSelectConversation({
                          query: full.query,
                          state: full.state,
                          language: full.language,
                          result: full.response,
                        });
                        onClose();
                      }
                    } catch {
                      // fallback
                    }
                  }}
                >
                  <div className="history-card-top">
                    <span className="history-category-pill">
                      {item.service_category || "Public Scheme"}
                    </span>
                    <span className="history-date">{formattedDate}</span>
                  </div>
                  <p className="history-card-query">"{item.query}"</p>
                  <div className="history-card-meta">
                    <span>📍 {item.state}</span>
                    <span>🌐 {item.language}</span>
                    <ChevronRight size={14} className="history-card-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
