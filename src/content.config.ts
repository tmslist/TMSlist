import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('TMS List Editorial Team'),
    publishDate: z.coerce.date(),
    category: z.enum(['research', 'treatment', 'patient-guide', 'faq']),
    image: z.string().optional(),
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
    image: z.string().optional(),
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
    image: z.string().optional(),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    treatmentA: z.string().optional(),
    treatmentB: z.string().optional(),
    image: z.string().optional(),
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

export const collections = { blog, treatments, insurance, comparisons, protocols, demographics };
