import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const DEFAULT_OG_IMAGE = '/images/tms_hero.svg';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('TMS List Editorial Team'),
    publishDate: z.coerce.date(),
    category: z.enum(['research', 'treatment', 'patient-guide', 'faq']).or(z.enum(['Research', 'Treatment', 'Patient Guide', 'FAQ'])).optional(),
    image: z.string().default(DEFAULT_OG_IMAGE),
    tags: z.array(z.string()).default([]),
  }),
});

const treatments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/treatments' }),
  schema: z.object({
    title: z.string(),
    condition: z.string(),
    description: z.string(),
    fdaApproved: z.boolean().default(false),
    successRate: z.string().optional(),
    image: z.string().default(DEFAULT_OG_IMAGE),
    sessionCount: z.string().optional(),
    duration: z.string().optional(),
    brainArea: z.string().optional(),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  }),
});

const insurance = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insurance' }),
  schema: z.object({
    title: z.string(),
    insurer: z.string().optional(),
    provider: z.string().optional(),
    description: z.string(),
    coversTms: z.boolean().default(true),
    priorAuthRequired: z.boolean().default(true),
    image: z.string().default(DEFAULT_OG_IMAGE),
    typicalCost: z.string().optional(),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    treatmentA: z.string().optional(),
    treatmentB: z.string().optional(),
    image: z.string().default(DEFAULT_OG_IMAGE),
    verdict: z.string().optional(),
    verdictWinner: z.string().optional(),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  }),
});

const protocols = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/protocols' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const demographics = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/demographics' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('TMS List Editorial Team'),
    publishDate: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().default(DEFAULT_OG_IMAGE),
  }),
});

const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('TMS List Editorial Team'),
    publishDate: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().default(DEFAULT_OG_IMAGE),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const providers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/providers' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const commercial = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/commercial' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const quiz = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/quiz' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const alternatives = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/alternatives' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    fdaApproved: z.boolean().default(false),
    approvedFor: z.string().optional(),
    mechanism: z.string().optional(),
    typicalCost: z.string().optional(),
    sessionDuration: z.string().optional(),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  }),
});

export const collections = { blog, treatments, insurance, comparisons, protocols, demographics, research, stories, legal, providers, commercial, quiz, alternatives };
