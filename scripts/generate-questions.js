// Script to generate comprehensive questions database
// Run: node scripts/generate-questions.js

const fs = require('fs');
const path = require('path');

const questionTemplates = {
  basics: [
    "What is {topic}?",
    "How does {topic} work?",
    "Is {topic} safe?",
    "How long does {topic} take?",
    "What are the benefits of {topic}?",
    "What are the risks of {topic}?",
    "Who is a good candidate for {topic}?",
    "How effective is {topic}?",
  ],
  cost: [
    "How much does {topic} cost?",
    "Does insurance cover {topic}?",
    "Is {topic} covered by Medicare?",
    "Is {topic} covered by Medicaid?",
    "How to pay for {topic}?",
    "Are there payment plans for {topic}?",
    "Is {topic} worth the cost?",
  ],
  conditions: [
    "Does {therapy} help with {condition}?",
    "Is {therapy} effective for {condition}?",
    "Can {therapy} treat {condition}?",
    "{Therapy} vs medication for {condition}",
  ],
  location: [
    "Best {therapy} clinics in {city}",
    "{Therapy} therapy near me in {state}",
    "Top rated {therapy} doctors in {city}",
    "How much does {therapy} cost in {state}?",
    "{Therapy} covered by insurance in {state}?",
  ]
};

const topics = ['TMS', 'Deep TMS', 'NeuroStar', 'BrainsWay', 'TMS therapy'];
const conditions = ['depression', 'anxiety', 'OCD', 'PTSD', 'bipolar', 'ADHD'];
const therapies = ['TMS', 'Ketamine', 'ECT', 'medication', 'therapy'];

console.log('Question generation script ready. Expand this to generate 1000+ questions.');
console.log('Example categories:', Object.keys(questionTemplates));
