import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SortResponse } from '@/lib/types';
import { jevPickBuckets } from '@/lib/jev';

// Fast + cheap is ideal for bucketing. Override with ANTHROPIC_MODEL if you want Sonnet/Opus.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

const SORT_SYSTEM_PROMPT = `You categorize tasks into buckets. Return ONLY valid JSON, no extra text.

Format: {"tasks": [{"text": "task text", "bucket": "BucketName"}]}

Rules:
- Use existing buckets when one fits
- Bucket names: 1-2 words, actionable
- Group similar tasks together
- Keep each task's original text verbatim`;

// Light cleanup for the rare case the model adds a trailing comma.
function extractJSON(str: string): string {
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start === -1 || end === -1) return str;
    return str.slice(start, end + 1).replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { batch, existingBuckets } = body;

        if (!batch || batch.length === 0) {
            return NextResponse.json({ error: 'No tasks provided' }, { status: 400 });
        }

        const buckets: string[] = Array.isArray(existingBuckets) ? existingBuckets : [];

        // Jev first: it can only pick an existing bucket or say none fit.
        // Confident picks are final; everything else goes to Haiku below,
        // which can still propose a new bucket. If Jev fails, Haiku gets all.
        const picks = await jevPickBuckets(batch, buckets);
        const jevTasks = picks
            ? batch.flatMap((text: string, i: number) => (picks[i].bucket ? [{ text, bucket: picks[i].bucket as string }] : []))
            : [];
        const haikuBatch: string[] = picks ? batch.filter((_: string, i: number) => !picks[i].bucket) : batch;
        console.log(`[sort] jev answered ${jevTasks.length}, haiku answers ${haikuBatch.length}`);

        if (haikuBatch.length === 0) {
            return NextResponse.json({ tasks: jevTasks } satisfies SortResponse);
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const bucketsContext = existingBuckets?.length > 0
            ? `Existing buckets: ${existingBuckets.join(', ')}\n\n`
            : '';
        const tasksText = haikuBatch.map((task: string, i: number) => `${i + 1}. ${task}`).join('\n');
        const userPrompt = `${bucketsContext}Tasks:\n${tasksText}`;

        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
            model: MODEL,
            max_tokens: 4096,
            system: SORT_SYSTEM_PROMPT,
            messages: [
                { role: 'user', content: userPrompt },
                // Prefill the reply with "{" so Claude is forced to emit JSON, not prose.
                { role: 'assistant', content: '{' },
            ],
        });

        const block = message.content[0];
        const raw = '{' + (block?.type === 'text' ? block.text : '');

        let parsedResponse: SortResponse;
        try {
            parsedResponse = JSON.parse(extractJSON(raw));
        } catch {
            // Fallback: pull out task objects via regex if JSON is malformed.
            const matches = raw.matchAll(/"text"\s*:\s*"([^"]+)"\s*,\s*"bucket"\s*:\s*"([^"]+)"/g);
            const tasks = Array.from(matches).map(m => ({ text: m[1], bucket: m[2] }));
            if (tasks.length === 0) {
                console.error('JSON parse failed. Raw output:', raw.substring(0, 500));
                return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
            }
            parsedResponse = { tasks };
        }

        if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
            return NextResponse.json({ error: 'Invalid AI response structure' }, { status: 500 });
        }

        // Put tasks back in their original order.
        const answered = new Map<string, string>();
        for (const t of jevTasks) answered.set(t.text, t.bucket);
        for (const t of parsedResponse.tasks) if (!answered.has(t.text)) answered.set(t.text, t.bucket);
        const tasks = batch.flatMap((text: string) => (answered.has(text) ? [{ text, bucket: answered.get(text) as string }] : []));
        const matched = new Set(tasks.map((t: { text: string }) => t.text));
        // Haiku sometimes rewords a task; keep those answers rather than drop them.
        for (const t of parsedResponse.tasks) if (!matched.has(t.text)) tasks.push(t);
        return NextResponse.json({ tasks } satisfies SortResponse);
    } catch (error) {
        console.error('Sort error:', error);
        const status = (error as { status?: number })?.status;
        const message = error instanceof Error ? error.message : 'Processing failed';
        if (status === 401) {
            return NextResponse.json({ error: 'Invalid Anthropic API key' }, { status: 401 });
        }
        if (status === 429) {
            return NextResponse.json({ error: 'Rate limited. Wait a moment and retry' }, { status: 429 });
        }
        if (/credit balance is too low/i.test(message)) {
            return NextResponse.json({ error: 'Anthropic credit balance too low. Add credits at console.anthropic.com → Plans & Billing.' }, { status: 402 });
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
