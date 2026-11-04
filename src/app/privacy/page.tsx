import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "8020.best Privacy Policy",
  description:
    "Read how the 8020.best web app and Chrome extension handle task text, saved tabs, local storage, optional AI requests, and service providers.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="trust-page">
      <h1>8020.best privacy policy</h1>
      <p>Last updated: November 1, 2026.</p>
      <p>
        8020.best provides a web task prioritizer and a Chrome tab-management extension. The products are designed to keep working libraries on the user&apos;s device, while optional AI actions send only the information needed to complete the action that the user requested.
      </p>

      <h2>Web app data</h2>
      <p>
        The 8020.best web app stores task folders, task text, completion state, priority tiers, and nested subtasks in the browser through IndexedDB. The app does not require an account. Export actions create Markdown or ZIP files only after the user requests the export.
      </p>
      <p>
        When a user chooses Sort tasks or requests task decomposition, the submitted task text and relevant bucket or context names are sent over HTTPS to the 8020.best server and forwarded to Anthropic Claude to generate that response. Anthropic handles the request under its own terms and privacy policy.
      </p>

      <h2>Chrome extension data</h2>
      <p>
        The 8020 Chrome extension stores saved tab titles, URLs, Chrome tab-group names and colors, collection names, priority tiers, stars, task state, archive state, Trash state, and a Markdown snapshot in chrome.storage.local on the user&apos;s device. Core save, search, organize, export, and restore features do not require an account.
      </p>
      <p>
        Optional AI features (sorting, assessment, chat, and optional auto-sort) are off until the user agrees to an in-extension disclosure, grants Chrome&apos;s companion permission, and installs the separate local companion. Each AI action is started by the user or by auto-sort the user switched on. For those actions the companion sends the titles of the tabs involved (a tab&apos;s web address only when it has no title), included memory text, collection names, the user&apos;s written goals and local priority context, and chat messages. Chat also sends the titles of currently open tabs. The companion passes this to the AI service it is configured with: Anthropic through the user&apos;s Claude CLI account, or TypeSafe Jev through OpenRouter. Webpage body content is never read or sent.
      </p>
      <p>
        An optional filesystem mirror writes the same saved-tab Markdown snapshot to a local file chosen by the companion configuration. The mirror itself does not invoke AI or transmit the snapshot away from the device.
      </p>
      <p>
        If Claude reaches a session or usage limit, the local companion retries the requested analysis through the signed-in Codex CLI (codex_local). This fallback sends the same analysis metadata and priority or project context to OpenAI under its terms and privacy policy. It does not send project source files or webpage bodies. The analysis response identifies the provider used.
      </p>

      <h2>Hosting and service providers</h2>
      <p>
        When the local companion is configured with an OpenRouter API key, category and priority classification sends tab titles and local priority context to TypeSafe Jev through OpenRouter. Classification uses the highest-probability category and tier without a minimum confidence threshold. Malformed responses and provider failures stop the batch without switching providers. Jev does not receive webpage bodies or project source files. Keys remain in the local companion, not the extension package. Separate focus explanations and project routing still use the Claude/Codex path.
      </p>
      <p>
        Vercel hosts the public web app and processes the technical request information needed to deliver it. Anthropic processes task text only for requested AI sorting or decomposition. When you sort tasks on the web app, each task&apos;s text and your existing bucket names are first sent to TypeSafe Jev through OpenRouter to pick an existing bucket; tasks Jev is not confident about are then sent to Anthropic. The 8020.best website uses PostHog for basic, anonymous visit analytics: which pages are viewed and when a visitor leaves, plus standard request details such as browser type and approximate location. PostHog stores an anonymous identifier in your browser to count repeat visits. Session recording, automatic click capture, and surveys are turned off, and the site never links visits to a name or email. The Chrome extension itself contains no analytics or tracking of any kind. 8020.best has no advertising scripts and does not sell user data.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Local web-app data can be removed by clearing the browser&apos;s site data. Local extension data can be removed by clearing extension storage or uninstalling the extension. Export a backup first if the information should be retained, and delete any optional filesystem mirror separately.
      </p>

      <h2>Limited use</h2>
      <p>
        8020.best uses and transfers user data only to provide or improve the product&apos;s user-facing task and tab-management features. User data is not used for advertising, creditworthiness, lending, or an unrelated purpose, and it is not sold to third parties.
      </p>

      <h2>Questions</h2>
      <p>
        Privacy questions can use the public routes on the <Link href="/contact">contact page</Link>. Do not include private task text, saved URLs, authentication information, or other sensitive content in a public GitHub issue.
      </p>
    </main>
  );
}
