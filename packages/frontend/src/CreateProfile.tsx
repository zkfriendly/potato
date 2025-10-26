import { useMemo, useState, useEffect } from "react";
import {
  sendSetupTransaction,
  getExistingNickname,
  getWalletAddress,
} from "./pimlico";

type CreateProfileProps = {
  onComplete?: (hash: string) => void;
  initialNickname?: string;
};

export default function CreateProfile({
  onComplete,
  initialNickname = "",
}: CreateProfileProps) {
  const [nick, setNick] = useState(initialNickname);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingNickname, setExistingNickname] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");

  const ens = useMemo(
    () => (nick ? `${nick.toLowerCase()}.pyusd.eth` : ""),
    [nick]
  );

  // Check if nickname already exists on mount
  useEffect(() => {
    async function checkExistingNickname() {
      try {
        setIsLoading(true);
        const address = await getWalletAddress();
        setWalletAddress(address);
        const nickname = await getExistingNickname(address);
        setExistingNickname(nickname);
      } catch (error) {
        console.error("Error checking existing nickname:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkExistingNickname();
  }, []);

  // Show loading state while checking for existing nickname
  if (isLoading) {
    return (
      <section className="create-profile">
        <h2>Wallet authenticated! 🥔</h2>
        <p className="hint">Checking your profile...</p>
      </section>
    );
  }

  // Show existing nickname if already set
  if (existingNickname) {
    return (
      <section className="create-profile">
        <h2>Profile already set up! 🥔</h2>
        <p className="hint">
          Your Potato profile is already configured with the nickname:{" "}
          <strong>{existingNickname}</strong>
        </p>
        <div className="ens-preview">
          Your endpoint:{" "}
          <strong>{existingNickname.toLowerCase()}.pyusd.eth</strong>
        </div>
        {walletAddress && (
          <p style={{ fontSize: "0.8em", color: "#666", marginTop: "1em" }}>
            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        )}
        <div className="card-actions">
          <button
            className="btn primary"
            onClick={() => {
              if (onComplete) {
                onComplete("existing");
              } else {
                alert("Profile already set up!");
              }
            }}
          >
            Continue
          </button>
        </div>
      </section>
    );
  }

  // Show form to create new nickname
  return (
    <section className="create-profile">
      <h2>Wallet authenticated! 🥔</h2>
      <p className="hint">
        {initialNickname
          ? "Confirm your nickname to complete setup."
          : "Choose a nickname for your Potato profile. It'll become your personal endpoint to easily invest by sending PYUSD to it."}
      </p>
      <label>
        <input
          type="text"
          placeholder="e.g. zkfriendly"
          value={nick}
          onChange={(e) =>
            setNick(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))
          }
          disabled={!!initialNickname}
          readOnly={!!initialNickname}
        />
      </label>
      <div className="ens-preview">
        Your endpoints:{" "}
        <strong>
          {ens
            ? `${ens.replace(".pyusd.eth", "")}.cc.pyusd.eth`
            : "<nickname>.cc.pyusd.eth"}
        </strong>
      </div>
      <div className="card-actions">
        <button
          className="btn primary"
          disabled={isSubmitting || !nick.trim()}
          onClick={async () => {
            const trimmedNick = nick.trim();
            if (!trimmedNick) {
              alert("Please enter a nickname");
              return;
            }
            try {
              setIsSubmitting(true);
              const hash = await sendSetupTransaction(trimmedNick);
              onComplete ? onComplete(hash) : alert(`Setup complete: ${hash}`);
            } catch (e) {
              alert(String(e));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? "Setting up..." : "Continue"}
        </button>
        <button className="btn ghost" onClick={(e) => e.preventDefault()}>
          Cancel
        </button>
      </div>
    </section>
  );
}
