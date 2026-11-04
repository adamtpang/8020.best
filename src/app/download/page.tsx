import type { Metadata } from "next";
import Link from "next/link";
import { EXTENSION_SHA256, EXTENSION_VERSION, EXTENSION_ZIP } from "@/lib/extension-release";

export const metadata: Metadata = {
  title: "Download 8020 for Chrome",
  description:
    "Download the free 8020 priority tab manager and install it in Chrome, Brave, Edge, Arc, or any Chromium browser in under a minute.",
  alternates: { canonical: "/download" },
};

export default function DownloadPage() {
  return (
    <main className="trust-page download-page">
      <h1>Get 8020 for Chrome</h1>
      <p>
        8020 is free and needs no account. It works in Chrome and any Chromium
        browser (Brave, Edge, Arc, Helium). The Chrome Web Store listing is on
        its way; until then, install it directly in about a minute.
      </p>

      <p className="download-actions">
        <a className="install-button" href={EXTENSION_ZIP} download>
          Download 8020 v{EXTENSION_VERSION} <span aria-hidden="true">↓</span>
        </a>
      </p>

      <h2>Install in four steps</h2>
      <ol className="download-steps">
        <li>
          <strong>Unzip</strong> the downloaded file into a folder you will keep
          (for example Documents/8020). Chrome loads the extension from that
          folder, so do not delete it.
        </li>
        <li>
          Open <code>chrome://extensions</code> in the address bar.
        </li>
        <li>
          Turn on <strong>Developer mode</strong> (top right).
        </li>
        <li>
          Click <strong>Load unpacked</strong> and choose the unzipped folder.
          Pin 8020 from the puzzle-piece menu, then press{" "}
          <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> to save your first window.
        </li>
      </ol>

      <h2>Updating</h2>
      <p>
        Download the new zip, unzip it over the same folder, then press the
        reload arrow on the 8020 card in <code>chrome://extensions</code>. Your
        saved tabs live in browser storage, not in the folder, so they stay put.
        Export a backup from the library first if you want to be extra safe.
      </p>

      <h2>What it can see</h2>
      <p>
        Saved tabs stay in local browser storage on your device. Nothing is
        sent anywhere unless you turn on optional AI sorting, which needs a
        separate local companion and your explicit permission. Read the{" "}
        <Link href="/privacy">privacy policy</Link> for the details.
      </p>

      <h2>Verify the download</h2>
      <p>
        SHA-256 of <code>{EXTENSION_ZIP.split("/").pop()}</code>:
      </p>
      <p>
        <code className="hash">{EXTENSION_SHA256}</code>
      </p>
      <p>
        Questions or problems? See <Link href="/support">support</Link>.
      </p>
    </main>
  );
}
