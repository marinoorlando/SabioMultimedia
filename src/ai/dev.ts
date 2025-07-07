import { config } from 'dotenv';
config();

import '@/ai/flows/generate-image-prompt.ts';
import '@/ai/flows/refine-summary.ts';
import '@/ai/flows/describe-image.ts';
import '@/ai/flows/summarize-text.ts';
