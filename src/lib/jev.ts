// Jev (TypeSafe's judgment model on OpenRouter) picks each task's bucket from
// the user's existing buckets, plus an explicit "none of these fit" option.
// It never invents a bucket. Anything it is not confident about, or marks as
// needing a new bucket, is left for the Haiku path, which can still create one.
//
// Threshold 0.97 came from a 100-task synthetic test (25 lists, 12 tasks that
// truly needed a new bucket): Jev alone 97/100, Haiku alone 99/100, Jev at
// >= 0.97 with Haiku fallback 99/100 while sending 19% of tasks to Haiku.
// Jev's three misses were all confident (0.79 to 0.95), so a lower threshold
// trades accuracy for fewer Haiku calls. Override with JEV_THRESHOLD.

export const JEV_NONE = '__none__';
const JEV_URL = 'https://openrouter.ai/api/alpha/decisions';
const JEV_MODEL = '~typesafe/jev-latest';
const DEFAULT_THRESHOLD = 0.97;

export interface JevPick {
    bucket: string | null; // null = send to fallback
    confidence: number;
}

export function jevThreshold(): number {
    const parsed = Number(process.env.JEV_THRESHOLD);
    return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : DEFAULT_THRESHOLD;
}

export function buildJevRequest(tasks: string[], buckets: string[]) {
    const criteria: Record<string, string> = {};
    for (const bucket of buckets) criteria[bucket] = `The task belongs in the user's existing "${bucket}" bucket.`;
    criteria[JEV_NONE] = 'None of the existing buckets fits this task well; it needs a new bucket.';

    const questions: Record<string, unknown> = {};
    tasks.forEach((text, i) => {
        questions[`t${i}`] = {
            type: 'choice',
            instructions: `Which existing bucket does task ${i + 1} ("${text}") belong in? Choose ${JEV_NONE} only if no bucket is a reasonable home.`,
            criteria,
        };
    });
    const state = `Existing buckets: ${buckets.join(', ')}\nTasks:\n${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    return { model: JEV_MODEL, state, questions };
}

// Turns Jev's answers into per-task picks. A pick is kept only when it names
// a real existing bucket with probability at or above the threshold.
export function parseJevAnswers(
    answers: Record<string, { choice?: string; probabilities?: Record<string, number>; confidence?: number }> | undefined,
    tasks: string[],
    buckets: string[],
    threshold: number
): JevPick[] {
    const valid = new Set(buckets);
    return tasks.map((_, i) => {
        const answer = answers?.[`t${i}`];
        const probs = answer?.probabilities;
        const confidence = probs ? Math.max(...Object.values(probs)) : answer?.confidence ?? 0;
        const choice = answer?.choice;
        const keep = !!choice && choice !== JEV_NONE && valid.has(choice) && confidence >= threshold;
        return { bucket: keep ? choice! : null, confidence };
    });
}

export async function jevPickBuckets(tasks: string[], buckets: string[]): Promise<JevPick[] | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || buckets.length === 0 || tasks.length === 0) return null;
    try {
        const res = await fetch(JEV_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(buildJevRequest(tasks, buckets)),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) {
            console.warn(`[sort] jev unavailable (${res.status}), using haiku for all tasks`);
            return null;
        }
        const body = await res.json();
        return parseJevAnswers(body.answers, tasks, buckets, jevThreshold());
    } catch (error) {
        console.warn('[sort] jev failed, using haiku for all tasks:', error instanceof Error ? error.message : error);
        return null;
    }
}
