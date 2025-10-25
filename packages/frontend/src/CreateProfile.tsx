import { useMemo, useState } from "react";
import { sendExampleGaslessTx } from "./pimlico";

type CreateProfileProps = {
  onComplete?: (hash: string) => void;
};

export default function CreateProfile({ onComplete }: CreateProfileProps) {
  const [nick, setNick] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ens = useMemo(
    () => (nick ? `${nick.toLowerCase()}.pyusd.eth` : ""),
    [nick]
  );

  return (
    <section className="create-profile">
      <h2>Wallet authenticated! 🥔</h2>
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
        <button
          className="btn primary"
          disabled={isSubmitting}
          onClick={async () => {
            try {
              setIsSubmitting(true);
              const hash = await sendExampleGaslessTx();
              onComplete ? onComplete(hash) : alert(`UserOp included: ${hash}`);
            } catch (e) {
              alert(String(e));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? "Sending..." : "Continue"}
        </button>
        <button className="btn ghost" onClick={(e) => e.preventDefault()}>
          Cancel
        </button>
      </div>
    </section>
  );
}
