"use client";

/**
 * Dev-only auth switcher — only renders on localhost
 * Lets designer toggle between different user roles for testing
 */
import { useState, useEffect } from "react";
import { DEV_SIGNED_OUT as SIGNED_OUT } from "@/lib/dev-auth";
import { HOA_TOKEN_TO_LABEL } from "../../(hoa)/lib/hoa-roles";

type MockUser = {
  id: string;
  name: string;
  email: string;
  // "admin" is the backend token for an HOA admin (see app/(hoa)/lib/hoa-roles.ts).
  // Using "hoa_admin" here would fail every AuthGuard and cause a redirect loop.
  role: "super_admin" | "admin" | "lead_concierge" | "concierge" | "security";
  buildingId?: string;
  buildingName?: string;
};

const MOCK_USERS: MockUser[] = [
  {
    id: "bf88f7f8-7762-469c-9737-a48409c3e7ee",
    name: "Margo",
    email: "margo@parqlet.com",
    role: "super_admin",
  },
  {
    id: "user-yara",
    name: "Yaroslav",
    email: "yaroslav@parqlet.com",
    role: "super_admin",
  },
  {
    id: "user-jordan",
    name: "Jordan Manager",
    email: "jordan@44east.com",
    role: "admin",
    buildingId: "8b6bb4fd-7995-4930-94b1-8c2e262d3991",
    buildingName: "44 East Avenue",
  },
  {
    id: "user-mike",
    name: "Mike Chen",
    email: "mike@riverside.com",
    role: "admin",
    buildingId: "9b202168-c1ca-41f1-a559-d9d2ebdf5aef",
    buildingName: "Riverside Towers",
  },
  {
    id: "user-lily",
    name: "Lily Lee",
    email: "lily@44east.com",
    role: "lead_concierge",
    buildingId: "8b6bb4fd-7995-4930-94b1-8c2e262d3991",
    buildingName: "44 East Avenue",
  },
  {
    id: "user-rio",
    name: "Rio Park",
    email: "rio@riverside.com",
    role: "concierge",
    buildingId: "9b202168-c1ca-41f1-a559-d9d2ebdf5aef",
    buildingName: "Riverside Towers",
  },
  {
    id: "user-sam",
    name: "Sam Cole",
    email: "sam@44east.com",
    role: "security",
    buildingId: "8b6bb4fd-7995-4930-94b1-8c2e262d3991",
    buildingName: "44 East Avenue",
  },
];

export function DevAuthSwitcher() {
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(MOCK_USERS[0]);
  const [isLocalhost, setIsLocalhost] = useState(false);
  // Gate persistence until we've read localStorage — prevents the default user
  // from being written/dispatched before we know a signed-out state was saved.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (window.location.hostname !== "localhost") return;
    setIsLocalhost(true);
    const saved = localStorage.getItem("dev_mock_user");
    if (saved === SIGNED_OUT) {
      setSelectedUser(null);
    } else if (saved) {
      try {
        const user = JSON.parse(saved);
        const found = MOCK_USERS.find((u) => u.email === user.email);
        if (found) setSelectedUser(found);
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isLocalhost || !hydrated) return;
    if (selectedUser) {
      localStorage.setItem("dev_mock_user", JSON.stringify(selectedUser));
      window.dispatchEvent(new CustomEvent("dev_mock_user_changed", { detail: selectedUser }));
    } else {
      localStorage.setItem("dev_mock_user", SIGNED_OUT);
      window.dispatchEvent(new CustomEvent("dev_mock_user_changed", { detail: null }));
    }
  }, [selectedUser, isLocalhost, hydrated]);

  if (!isLocalhost) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: "#1a1a2e",
        border: "1px solid #4a4a6a",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        fontFamily: "system-ui, sans-serif",
        color: "#e0e0e0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 600, color: "#888" }}>
        DEV MODE
      </div>
      <div style={{ marginBottom: 4 }}>
        <select
          value={selectedUser?.email ?? SIGNED_OUT}
          onChange={(e) => {
            if (e.target.value === SIGNED_OUT) {
              setSelectedUser(null);
              return;
            }
            const user = MOCK_USERS.find((u) => u.email === e.target.value);
            if (user) setSelectedUser(user);
          }}
          style={{
            background: "#2a2a4a",
            color: "#fff",
            border: "1px solid #4a4a6a",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 12,
            width: "100%",
            cursor: "pointer",
          }}
        >
          {MOCK_USERS.map((user) => (
            <option key={user.email} value={user.email}>
              {user.name} ({user.role === "super_admin" ? "Super Admin" : (HOA_TOKEN_TO_LABEL[user.role as keyof typeof HOA_TOKEN_TO_LABEL] ?? user.role)})
              {user.buildingName ? ` - ${user.buildingName}` : ""}
            </option>
          ))}
          <option value={SIGNED_OUT}>— Signed out —</option>
        </select>
      </div>
      <div style={{ fontSize: 10, color: "#666" }}>
        {selectedUser === null
          ? "Signed out — sign-in page visible"
          : selectedUser.role === "super_admin"
          ? "Access to all buildings"
          : `Viewing: ${selectedUser.buildingName}`}
      </div>
    </div>
  );
}
