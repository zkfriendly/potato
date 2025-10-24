import React, { useMemo, useState } from "react";

export default function CreateProfile() {
  const [nick, setNick] = useState("");
  const ens = useMemo(
    () => (nick ? `${nick.toLowerCase()}.pyusd.eth` : ""),
    [nick]
  );

  return (
    <section className="create-profile">
      <h2>Create your profile</h2>
      <p className="hint">
        Pick a friendly nickname. We'll mint it as an ENS subname under
        pyusd.eth.
      </p>
      <div className="profile-card">
        <label>
          Nickname
          <input
            type="text"
            placeholder="e.g. zkfriendly"
            value={nick}
            onChange={(e) =>
              setNick(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))
            }
          />
        </label>
        <div className="ens-preview">
          Your ENS: <strong>{ens || "<nickname>.pyusd.eth"}</strong>
        </div>
        <div className="card-actions">
          <a className="btn primary" href="#create">
            Continue
          </a>
          <a className="btn ghost" href="#">
            Cancel
          </a>
        </div>
      </div>
    </section>
  );
}
