import React, { useMemo, useState } from "react";

export default function CreateProfile() {
  const [nick, setNick] = useState("");
  const ens = useMemo(
    () => (nick ? `${nick.toLowerCase()}.pyusd.eth` : ""),
    [nick]
  );

  return (
    <section className="create-profile">
      <h2>Let's get you set up! 🥔</h2>
      <p className="hint">
        Choose a nickname for your Potato profile. It'll become your personal
        endpoint to easily invest by sending PYUSD to it.
      </p>
      <label>
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
        Your endpoint: <strong>{ens || "<nickname>.pyusd.eth"}</strong>
      </div>
      <div className="card-actions">
        <a className="btn primary" href="#create">
          Continue
        </a>
        <a className="btn ghost" href="#">
          Cancel
        </a>
      </div>
    </section>
  );
}
