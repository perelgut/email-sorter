// ── src/components/ConnectGmailButton.jsx ────────────────────────────────────
// Initiates Gmail OAuth via full-page redirect (not popup).
// On return, GmailCallback exchanges the code via Cloud Function.
// ─────────────────────────────────────────────────────────────────────────────

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export function getRedirectUri() {
  return `${window.location.origin}/email-sorter/auth/gmail/callback`;
}

const S = {
  btn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    background: "#FFFFFF",
    border: "1px solid #D0DEF0",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#1A1A1A",
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
};

export default function ConnectGmailButton() {
  function handleConnect() {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Google Client ID not configured.");
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: "code",
      scope: GMAIL_SCOPES,
      access_type: "offline",
      prompt: "consent",
    });

    // Full-page redirect — no popup
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  return (
    <button style={S.btn} onClick={handleConnect}>
      <GmailIcon />
      Connect Gmail Account
    </button>
  );
}

function GmailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
    </svg>
  );
}
