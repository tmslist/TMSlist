/**
 * Seed realistic forum discussions — run with: node scripts/seed-forum-discussions.mjs
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [key, ...val] = l.split('=');
    return [key.trim(), val.join('=').trim().replace(/^["']|["']$/g, '')];
  })
);

const sql = postgres(envVars.DATABASE_URL, { max: 1 });

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80) + '-' + Math.random().toString(36).slice(2, 8);
}

function daysAgo(days, hours = 0) {
  return new Date(Date.now() - (days * 86400000) - (hours * 3600000));
}

async function seed() {
  console.log('Creating community members...\n');

  // ── Create patient users (viewers) ──
  const patients = [
    { id: randomUUID(), email: 'sarah.m.2024@gmail.com', name: 'Sarah M.', role: 'viewer' },
    { id: randomUUID(), email: 'mike.recovery@outlook.com', name: 'Mike R.', role: 'viewer' },
    { id: randomUUID(), email: 'jen.hopeful@yahoo.com', name: 'Jennifer K.', role: 'viewer' },
    { id: randomUUID(), email: 'david.tmsjourney@gmail.com', name: 'David L.', role: 'viewer' },
    { id: randomUUID(), email: 'rachel.brainhealth@gmail.com', name: 'Rachel W.', role: 'viewer' },
    { id: randomUUID(), email: 'marcus.t.healing@outlook.com', name: 'Marcus T.', role: 'viewer' },
    { id: randomUUID(), email: 'lisa.mentalhealth@gmail.com', name: 'Lisa P.', role: 'viewer' },
    { id: randomUUID(), email: 'alex.neurorecovery@gmail.com', name: 'Alex N.', role: 'viewer' },
    { id: randomUUID(), email: 'emma.tmshope@yahoo.com', name: 'Emma S.', role: 'viewer' },
    { id: randomUUID(), email: 'james.brainstim@outlook.com', name: 'James C.', role: 'viewer' },
  ];

  for (const p of patients) {
    await sql`INSERT INTO users (id, email, name, role) VALUES (${p.id}, ${p.email}, ${p.name}, ${p.role}) ON CONFLICT (email) DO NOTHING`;
  }
  console.log(`  ✓ ${patients.length} patient accounts created`);

  // ── Create doctor users (clinic_owners linked to clinics) ──
  // Pick real clinics that have doctors
  const clinicRows = await sql`
    SELECT DISTINCT d.clinic_id, d.name as doctor_name, d.credential, d.image_url
    FROM doctors d
    WHERE d.image_url IS NOT NULL
    LIMIT 5
  `;

  const doctorUsers = [];
  const doctorEmails = [
    'dr.wong.tms@neuromed.com',
    'dr.martinez.tms@brainhealth.com',
    'dr.taylor.neuro@mindcare.com',
    'dr.kim.psychiatry@wellness.com',
    'dr.brown.tms@mentalhealth.com',
  ];

  for (let i = 0; i < clinicRows.length; i++) {
    const c = clinicRows[i];
    const id = randomUUID();
    doctorUsers.push({
      id,
      email: doctorEmails[i],
      name: c.doctor_name,
      role: 'clinic_owner',
      clinic_id: c.clinic_id,
      credential: c.credential || 'MD',
      image_url: c.image_url,
    });
    await sql`
      INSERT INTO users (id, email, name, role, clinic_id)
      VALUES (${id}, ${doctorEmails[i]}, ${c.doctor_name}, 'clinic_owner', ${c.clinic_id})
      ON CONFLICT (email) DO NOTHING
    `;
  }
  console.log(`  ✓ ${doctorUsers.length} doctor accounts created\n`);

  // ── Get category IDs ──
  const catRows = await sql`SELECT id, slug FROM forum_categories ORDER BY sort_order`;
  const cats = {};
  for (const c of catRows) cats[c.slug] = c.id;

  // Helper references
  const P = (i) => patients[i].id;  // patient by index
  const D = (i) => doctorUsers[Math.min(i, doctorUsers.length - 1)].id;  // doctor by index

  console.log('Seeding discussions...\n');

  // ════════════════════════════════════════════
  // CATEGORY 1: Treatment Experiences
  // ════════════════════════════════════════════

  const post1 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post1}, ${cats['treatment-experiences']}, ${P(0)},
    ${slug('Just finished my 36 session course - here is my honest review')},
    ${'Just finished my 36-session TMS course — here is my honest review'},
    ${"I completed my last session yesterday and wanted to share my experience for anyone on the fence.\n\nBackground: I've had treatment-resistant depression for 8 years. Tried 4 different SSRIs, therapy, even ketamine. My psychiatrist suggested TMS as a next step.\n\nWeeks 1-2: Honestly, I felt nothing different. The tapping sensation on my scalp was uncomfortable but tolerable. I almost quit after session 8 because I thought it wasn't working.\n\nWeeks 3-4: Something shifted around session 15. I woke up one morning and actually wanted to make breakfast. Sounds small, but I hadn't felt that motivation in years. My wife noticed before I did — she said I was laughing at a TV show for the first time in months.\n\nWeeks 5-6: The improvement kept building. Not linear — I had a rough day around session 28 and panicked. But overall, I'd say I went from a 2/10 to a 6.5/10 on the depression scale.\n\nNow, one week post-treatment: I feel cautiously optimistic. Not \"cured\" but genuinely better. I can function again. I'm going back to work next week.\n\nHappy to answer any questions about the process, side effects, or what to expect."},
    ${24}, ${6}, ${daysAgo(5)}, ${daysAgo(0, 8)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post1}, ${P(1)}, ${"Thank you so much for sharing this. I'm starting my sessions next week and I've been so anxious about it. The fact that it took until session 15 for you to notice changes is really helpful — I'll try not to give up early."}, ${8}, ${daysAgo(4, 18)}),
    (${post1}, ${D(0)}, ${"Great to hear about your progress. The timeline you describe is very consistent with what we see clinically — most patients begin noticing changes between sessions 12-20. The key is completing the full course. For anyone reading this, the early sessions are building a foundation even when you don't feel different yet. The brain needs time to form new neural pathways."}, ${15}, ${daysAgo(4, 12)}),
    (${post1}, ${P(3)}, ${"This gives me so much hope. I'm on session 22 right now and feeling about a 5/10 compared to my starting 1/10. The non-linear part resonates — I had a terrible day last Tuesday and spiraled thinking it stopped working. Good to know that's normal."}, ${6}, ${daysAgo(3, 14)}),
    (${post1}, ${P(4)}, ${"Can I ask which type of TMS machine your clinic used? I've been researching the difference between standard TMS and deep TMS and trying to figure out which might work better for me."}, ${3}, ${daysAgo(2, 20)}),
    (${post1}, ${P(0)}, ${"@Rachel — they used the NeuroStar system. My doctor said it's the most studied one with the strongest evidence base. I didn't look into deep TMS much but I know some clinics offer it."}, ${4}, ${daysAgo(2, 16)}),
    (${post1}, ${D(1)}, ${"Both NeuroStar and BrainsWay (deep TMS) have strong FDA clearances. The choice often depends on the specific condition being treated and your provider's experience with each system. Deep TMS uses H-coils that reach broader and deeper brain regions, while standard figure-8 coils are more focal. Neither is universally \"better\" — it depends on the individual case."}, ${11}, ${daysAgo(1, 10)})
  `;
  console.log('  ✓ Treatment Experiences — "36-session honest review" (6 comments)');

  // ──

  const post2 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post2}, ${cats['treatment-experiences']}, ${P(5)},
    ${slug('TMS for anxiety not just depression - my experience')},
    ${'TMS for anxiety (not just depression) — my experience'},
    ${"Most posts I see here are about TMS for depression, but I want to share my experience using it primarily for generalized anxiety disorder.\n\nI've had GAD since college. The constant knot in my stomach, racing thoughts at 3am, avoiding phone calls — the whole package. My psychiatrist was upfront that TMS for anxiety has less research than for depression, but said the results she'd seen were promising.\n\nWe targeted the right DLPFC instead of the left (which is the typical depression target). The protocol was 30 sessions over 6 weeks.\n\nResults: My anxiety dropped significantly. Not gone, but manageable. I can actually sit through meetings without my heart pounding. I made a phone call yesterday without rehearsing what I'd say for 20 minutes first.\n\nThe unexpected bonus — my sleep improved dramatically. I didn't realize how much my anxiety was wrecking my sleep until it got better.\n\nAnyone else done TMS specifically for anxiety?"},
    ${18}, ${4}, ${daysAgo(8)}, ${daysAgo(1, 6)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post2}, ${D(2)}, ${"This is a great topic. You're right that most TMS literature focuses on MDD, but there's growing evidence for anxiety disorders. The right DLPFC target your provider chose is consistent with current research for anxiety. We're also seeing interesting results with newer protocols that target both hemispheres in the same session for patients with comorbid depression and anxiety."}, ${9}, ${daysAgo(7, 14)}),
    (${post2}, ${P(2)}, ${"YES! I did TMS for anxiety + OCD last year. Similar protocol — right side targeting. The OCD improvements were slower but the anxiety relief was noticeable by week 3. My therapist said I was making more progress in CBT sessions after TMS, like it unlocked something."}, ${7}, ${daysAgo(6, 8)}),
    (${post2}, ${P(8)}, ${"I'm about to start TMS and have both anxiety and depression. Did your doctor discuss doing both sides? I'm trying to understand what to ask about at my consultation next week."}, ${3}, ${daysAgo(3)}),
    (${post2}, ${D(0)}, ${"Emma — bilateral TMS (treating both left and right DLPFC) is becoming more common for patients with comorbid conditions. Ask your provider about sequential bilateral treatment. Some newer protocols like intermittent theta burst stimulation (iTBS) can treat both sides in a shorter session time. Bring up your specific symptom profile so they can tailor the approach."}, ${12}, ${daysAgo(1, 6)})
  `;
  console.log('  ✓ Treatment Experiences — "TMS for anxiety" (4 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 2: Ask a Specialist
  // ════════════════════════════════════════════

  const post3 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post3}, ${cats['ask-a-specialist']}, ${P(3)},
    ${slug('Can I do TMS if I have a metal dental implant')},
    ${'Can I do TMS if I have a metal dental implant?'},
    ${"I have two titanium dental implants (back molars) and I'm worried they might disqualify me from TMS. My dentist said titanium is non-ferromagnetic, but I've read conflicting information online. Some sites say any metal in your head is an absolute contraindication.\n\nI have my TMS consultation next Tuesday. Should I be concerned? Would appreciate any specialists weighing in."},
    ${14}, ${5}, ${daysAgo(3)}, ${daysAgo(0, 14)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post3}, ${D(0)}, ${"Great question, and you'll be glad to know this comes up all the time. Titanium dental implants are NOT a contraindication for TMS. You're correct that titanium is non-ferromagnetic, meaning it won't be affected by the magnetic field.\n\nThe absolute contraindications are:\n- Ferromagnetic metal implants in or near the head (certain aneurysm clips, cochlear implants, metal plates from surgery)\n- Implanted stimulators (deep brain stimulators, vagus nerve stimulators)\n\nDental implants, titanium plates, braces, and dental fillings are all safe. Your TMS provider will do a thorough screening at your consultation, but based on what you've described, you should be fine."}, ${19}, ${daysAgo(2, 20)}),
    (${post3}, ${P(6)}, ${"I had this exact worry! I have a titanium plate from a jaw surgery 10 years ago. My TMS doctor confirmed it was totally fine. I'm 20 sessions in with zero issues."}, ${5}, ${daysAgo(2, 14)}),
    (${post3}, ${P(1)}, ${"What about braces? My teenage daughter is being evaluated for TMS and she currently has metal braces."}, ${3}, ${daysAgo(2, 8)}),
    (${post3}, ${D(1)}, ${"Metal braces are also safe for TMS treatment. The magnetic field is very focused on the scalp/cortex area and standard orthodontic hardware doesn't pose any safety concerns. However, some patients with braces report a mild vibration sensation in their teeth during treatment — it's harmless but worth mentioning so she's not surprised."}, ${10}, ${daysAgo(1, 18)}),
    (${post3}, ${P(3)}, ${"Thank you Dr. Wong and Dr. Martinez — this is exactly the reassurance I needed. I'll bring this up at my consultation but I feel much less anxious about it now."}, ${4}, ${daysAgo(0, 14)})
  `;
  console.log('  ✓ Ask a Specialist — "Metal dental implant safety" (5 comments)');

  // ──

  const post4 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post4}, ${cats['ask-a-specialist']}, ${P(7)},
    ${slug('How long do TMS results typically last')},
    ${'How long do TMS results typically last?'},
    ${"I finished TMS about 4 months ago and I'm still feeling good, but I'm anxious about relapsing. My depression was severe before treatment and this is the best I've felt in years.\n\nDoctors: what does the research say about how long results last? And if symptoms start coming back, can you do another round? Is there a maintenance option?"},
    ${21}, ${4}, ${daysAgo(6)}, ${daysAgo(1, 4)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post4}, ${D(2)}, ${"The durability of TMS results varies by individual, but here's what the data shows:\n\n- About 60-70% of patients who respond to TMS maintain significant improvement at 12 months\n- Some patients maintain benefits for 2+ years without retreatment\n- If symptoms begin to return, \"maintenance\" or \"booster\" sessions can be very effective\n\nMaintenance TMS typically involves 1-2 sessions per month or a short cluster of sessions every few months. Many of our patients do a 5-session booster if they notice early signs of relapse.\n\nThe most important thing is to keep up with any medications and therapy your psychiatrist has recommended alongside TMS. The combination tends to produce the most durable results."}, ${16}, ${daysAgo(5, 12)}),
    (${post4}, ${P(4)}, ${"I'm 8 months post-TMS and still doing well. My doctor has me scheduled for a check-in every 3 months and said we can do booster sessions if needed. Haven't needed them yet! Staying on my SSRI and doing monthly therapy has helped I think."}, ${7}, ${daysAgo(4, 8)}),
    (${post4}, ${P(9)}, ${"I did need a second course about 14 months after my first one. The relapse wasn't as severe as the original depression though — more like a 4/10 vs the original 9/10. The second round worked faster too, only needed about 20 sessions to get back to feeling good."}, ${9}, ${daysAgo(3, 6)}),
    (${post4}, ${D(0)}, ${"James's experience is actually very common — retreatment typically works faster and patients often need fewer sessions. This suggests the brain retains some of the neuroplastic changes from the first course. I'd also add that ongoing lifestyle factors matter: exercise, sleep hygiene, stress management, and social connection all help maintain TMS benefits."}, ${13}, ${daysAgo(1, 4)})
  `;
  console.log('  ✓ Ask a Specialist — "How long do results last?" (4 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 3: Insurance & Cost
  // ════════════════════════════════════════════

  const post5 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post5}, ${cats['insurance-cost']}, ${P(2)},
    ${slug('How I got my insurance to cover TMS after initial denial')},
    ${'How I got my insurance to cover TMS after initial denial'},
    ${"I want to share my experience getting Blue Cross Blue Shield to cover TMS because it was a fight and I know others are going through the same thing.\n\nTimeline:\n- March: Doctor submits prior authorization. Denied within a week. Reason: \"not medically necessary.\"\n- March: Filed appeal with letter from my psychiatrist documenting 3 failed medications, 2 years of therapy, and current severity scores (PHQ-9 of 22).\n- April: Second denial. They wanted proof of a 4th medication trial.\n- April: My psychiatrist added documentation of a 4th med trial (Wellbutrin, which I'd forgotten about). We also included a letter from my therapist.\n- May: APPROVED!\n\nTotal cost to me: $1,200 copay for the full 36-session course. Without insurance it would have been about $12,000.\n\nKey tips:\n1. Document EVERYTHING. Every medication, every therapy session, every failed treatment.\n2. Get your psychiatrist AND therapist to write supporting letters.\n3. Use the specific CPT codes your clinic provides.\n4. Don't accept the first denial — most get approved on appeal.\n5. Ask your TMS clinic for help — mine had a dedicated insurance coordinator who was incredible."},
    ${32}, ${5}, ${daysAgo(12)}, ${daysAgo(2, 10)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post5}, ${P(5)}, ${"This is incredibly helpful. I'm currently at step 2 of your timeline — just got my first denial from Aetna. The 'not medically necessary' language is so frustrating when you've literally tried everything. Going to push for that appeal now."}, ${6}, ${daysAgo(11, 8)}),
    (${post5}, ${P(8)}, ${"Same experience with UnitedHealthcare. First denial, then approved on appeal with documentation of 4 failed meds. The whole process took about 6 weeks. One thing I'd add: ask for a peer-to-peer review. That's where your psychiatrist talks directly to the insurance company's reviewing doctor. My psychiatrist said that call is what turned things around."}, ${11}, ${daysAgo(10, 14)}),
    (${post5}, ${D(3)}, ${"From the provider side, I want to emphasize how important that peer-to-peer review is. Insurance companies often have non-specialists reviewing TMS claims. When I can speak directly with their reviewer and explain the clinical rationale, approval rates go way up.\n\nAlso: if your clinic doesn't have an insurance coordinator, consider that a red flag. A good TMS clinic should have staff dedicated to navigating prior authorizations."}, ${14}, ${daysAgo(8)}),
    (${post5}, ${P(6)}, ${"For anyone with Medicare — it's been covered since 2021 and the approval process was much smoother for me than what Jennifer describes with private insurance. My out-of-pocket was about $800 total."}, ${8}, ${daysAgo(5, 16)}),
    (${post5}, ${P(2)}, ${"Wanted to update: I've since helped two friends navigate the same BCBS appeal process using this exact approach. Both got approved. Don't give up after the first denial!"}, ${9}, ${daysAgo(2, 10)})
  `;
  console.log('  ✓ Insurance & Cost — "How I got insurance to cover TMS" (5 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 4: Side Effects & Recovery
  // ════════════════════════════════════════════

  const post6 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post6}, ${cats['side-effects-recovery']}, ${P(6)},
    ${slug('Headaches after TMS sessions - when do they stop')},
    ${'Headaches after TMS sessions — when do they stop?'},
    ${"I'm on session 7 and I've been getting moderate headaches after every session. They last about 2-3 hours and Tylenol helps, but it's getting old. My technician said it's normal and should improve, but I wanted to hear from others.\n\nDid your headaches go away? How many sessions in? Any tips for managing them?"},
    ${11}, ${5}, ${daysAgo(4)}, ${daysAgo(0, 18)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post6}, ${P(0)}, ${"My headaches were worst during the first 2 weeks, then gradually faded. By session 15 I barely noticed them anymore. I found that taking ibuprofen about 30 minutes BEFORE my session worked better than waiting until after."}, ${7}, ${daysAgo(3, 20)}),
    (${post6}, ${D(0)}, ${"Headaches are the most common side effect of TMS, affecting about 40-50% of patients. The good news is they almost always diminish as treatment progresses — your brain adjusts to the stimulation.\n\nSome tips:\n- OTC pain relievers (acetaminophen or ibuprofen) 30 min before treatment\n- Stay well hydrated on treatment days\n- Ask your technician about adjusting the coil position slightly\n- Some clinics can gradually ramp up intensity over the first few sessions\n\nIf headaches persist past week 3 or become severe, definitely discuss with your provider. In rare cases, the motor threshold calibration may need adjustment."}, ${14}, ${daysAgo(3, 12)}),
    (${post6}, ${P(9)}, ${"Mine stopped completely around session 12. Hang in there! I also found that eating a good meal before my session helped. Going in on an empty stomach made headaches worse for me."}, ${5}, ${daysAgo(2, 8)}),
    (${post6}, ${P(3)}, ${"I barely had any headaches, but I did get this weird scalp soreness at the treatment spot. Almost like a sunburn feeling. That also went away after a couple weeks."}, ${4}, ${daysAgo(1, 14)}),
    (${post6}, ${P(6)}, ${"Update: I'm now on session 14 and you all were right — the headaches have gotten much milder. Taking ibuprofen before the session was a game-changer. Thanks everyone!"}, ${6}, ${daysAgo(0, 18)})
  `;
  console.log('  ✓ Side Effects & Recovery — "Headaches after sessions" (5 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 5: Success Stories
  // ════════════════════════════════════════════

  const post7 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post7}, ${cats['success-stories']}, ${P(4)},
    ${slug('From barely surviving to actually living - TMS changed everything')},
    ${'From barely surviving to actually living — TMS changed everything'},
    ${"I don't usually post things like this but I feel like I need to share this for anyone who's lost hope.\n\n18 months ago, I couldn't get out of bed. Couldn't shower. Couldn't call my mom back. I was existing, not living. I'd been depressed since I was 16 (I'm 34 now) and had tried every medication my doctors could think of.\n\nMy therapist suggested TMS as a \"last resort\" option. I was skeptical — how could magnets fix what pills couldn't?\n\nI just celebrated my one-year anniversary of completing TMS. In the past year:\n- I went back to work full-time\n- I started dating again (and met someone wonderful)\n- I ran my first 5K\n- I called my mom every Sunday instead of ignoring her calls\n- I laughed. Like, really laughed. The kind where your stomach hurts.\n\nI'm not saying TMS is magic. I still take medication, I still see my therapist, and I still have bad days. But the bad days are 3/10 instead of 9/10. The baseline shifted.\n\nIf you're reading this and you're on the fence — please try it. The worst that can happen is it doesn't work and you move on. But it might be the thing that changes everything."},
    ${47}, ${7}, ${daysAgo(10)}, ${daysAgo(0, 6)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post7}, ${P(1)}, ${"I'm literally crying reading this. I'm at the \"can't call my mom back\" stage right now. I have my TMS consultation tomorrow and I almost cancelled it. I'm not cancelling it now. Thank you."}, ${22}, ${daysAgo(9, 20)}),
    (${post7}, ${P(5)}, ${"The running a 5K part hit me hard. Before TMS I couldn't walk to the mailbox without exhaustion from the depression. Now I'm hiking on weekends. These stories matter."}, ${12}, ${daysAgo(8, 14)}),
    (${post7}, ${D(2)}, ${"Thank you for sharing this, Rachel. Stories like yours are exactly why I went into this field. The \"baseline shift\" you describe is the perfect way to explain what TMS does — it doesn't eliminate the human experience of having hard days, but it moves your baseline to a place where you can actually engage with life and cope with challenges."}, ${16}, ${daysAgo(7, 10)}),
    (${post7}, ${P(8)}, ${"One year strong! That's amazing. I'm 3 months post-treatment and feeling good but nervous about it fading. Your post gives me hope that the changes can stick."}, ${6}, ${daysAgo(5, 8)}),
    (${post7}, ${P(2)}, ${"\"Existing, not living\" — I've never heard anyone describe it so perfectly. That's exactly where I was. 6 months post-TMS now and I feel like I got my life back."}, ${9}, ${daysAgo(3, 16)}),
    (${post7}, ${P(7)}, ${"Shared this with my brother who's been resistant to trying TMS. Sometimes hearing it from another patient is more convincing than hearing it from doctors. Thank you for being vulnerable and sharing."}, ${8}, ${daysAgo(2, 6)}),
    (${post7}, ${P(4)}, ${"Thank you all for the kind responses. Mike — please don't cancel that consultation. You deserve to feel better. Sending you strength."}, ${14}, ${daysAgo(0, 6)})
  `;
  console.log('  ✓ Success Stories — "From barely surviving to actually living" (7 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 6: Research & Studies
  // ════════════════════════════════════════════

  const post8 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post8}, ${cats['research-studies']}, ${D(0)},
    ${slug('New Stanford SAINT protocol showing 90 percent remission rates')},
    ${'New Stanford SAINT protocol showing 90% remission rates — what it means for patients'},
    ${"I wanted to discuss some exciting research that's been getting a lot of attention. The Stanford Accelerated Intelligent Neuromodulation Therapy (SAINT) protocol has shown remarkable results in clinical trials.\n\nKey points:\n- The SAINT protocol delivers the equivalent of a standard 6-week TMS course in just 5 days\n- It uses functional MRI to precisely target each patient's specific brain circuit\n- The landmark trial showed approximately 79% remission rates (vs ~50% with standard TMS)\n- Follow-up studies at academic centers are replicating these results\n\nWhat makes this different from standard TMS:\n1. Precision targeting using fMRI (not the standard \"5cm rule\")\n2. Accelerated delivery — 10 sessions per day for 5 days\n3. Higher total dose of stimulation\n4. Intermittent theta burst protocol instead of standard 10Hz\n\nImportant caveats: This is still relatively new and most insurance doesn't cover the accelerated protocol yet. The fMRI targeting adds cost. And more long-term data is needed.\n\nBut this represents a real step forward in the field. Happy to discuss or answer questions."},
    ${28}, ${4}, ${daysAgo(7)}, ${daysAgo(1, 8)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post8}, ${P(7)}, ${"This is fascinating. 5 days instead of 6 weeks would be life-changing for people who can't take extended time off work. Any idea when this might become more widely available? I'm in the midwest and I doubt anyone near me offers it yet."}, ${5}, ${daysAgo(6, 14)}),
    (${post8}, ${D(2)}, ${"Great summary, Dr. Wong. I'll add that several academic medical centers are now offering SAINT or SAINT-like protocols. The main barriers to wider adoption are the fMRI requirement (not every clinic has access) and the intensive staffing needed for 10 sessions per day.\n\nWe're seeing some clinics offer a modified version — accelerated TMS over 1-2 weeks without the fMRI targeting — which is a middle ground that's more accessible."}, ${10}, ${daysAgo(5, 10)}),
    (${post8}, ${P(3)}, ${"Do the 90% remission rates hold up long-term? Or is it possible that the accelerated approach wears off faster? I'd rather do 6 weeks if the results last longer."}, ${4}, ${daysAgo(3, 18)}),
    (${post8}, ${D(0)}, ${"David — that's the key question researchers are working on. The initial follow-up data shows durability comparable to standard TMS at 6 months, but we need more long-term studies. There's no evidence that accelerated delivery leads to faster relapse. In theory, the precise targeting might actually improve durability since you're stimulating exactly the right circuit."}, ${8}, ${daysAgo(1, 8)})
  `;
  console.log('  ✓ Research & Studies — "Stanford SAINT protocol" (4 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 7: Mental Health Support
  // ════════════════════════════════════════════

  const post9 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post9}, ${cats['mental-health-support']}, ${P(1)},
    ${slug('Struggling with the waiting period before TMS starts')},
    ${'Struggling with the waiting period before TMS starts'},
    ${"I got approved for TMS two weeks ago but my first appointment isn't until next month due to scheduling. This waiting period is brutal.\n\nI know rationally that a few more weeks won't matter in the long run, but when you're in the thick of depression, every day feels like a year. I finally have hope that something might help and now I just have to... wait.\n\nAnyone else dealt with this? How did you cope with the anticipation?"},
    ${15}, ${5}, ${daysAgo(9)}, ${daysAgo(2, 4)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post9}, ${P(4)}, ${"I remember this exact feeling. The gap between \"there might be hope\" and actually starting treatment was so hard. What helped me: I made a simple daily checklist — shower, walk for 10 minutes, eat one real meal. Just small things to get through each day until it started. You've already done the hardest part by getting approved."}, ${10}, ${daysAgo(8, 18)}),
    (${post9}, ${P(0)}, ${"I had a 3-week wait and used the time to prepare. I read about other people's experiences (this forum would have been great), figured out my schedule for daily appointments, and told my employer what was coming. The waiting is awful but you CAN get through it."}, ${6}, ${daysAgo(7, 12)}),
    (${post9}, ${D(1)}, ${"Mike, what you're feeling is completely valid. The frustration of having to wait when you're suffering is real. A few suggestions:\n\n- Call the clinic and ask to be put on a cancellation list — sometimes spots open up earlier\n- Continue any current medications as prescribed\n- Try to maintain basic routines even when it's hard\n- If you're in crisis at any point, please reach out to 988 (Suicide & Crisis Lifeline)\n\nYou're doing the right thing by reaching out to this community."}, ${13}, ${daysAgo(6, 8)}),
    (${post9}, ${P(8)}, ${"Sending you strength, Mike. I was in the same spot 4 months ago. Now I'm on session 24 and feeling better than I have in years. The wait is temporary."}, ${7}, ${daysAgo(4, 14)}),
    (${post9}, ${P(1)}, ${"Thank you all. I called the clinic and got on the cancellation list like Dr. Martinez suggested. They already moved me up by a week! Also, Rachel's checklist idea is exactly what I needed. One day at a time."}, ${8}, ${daysAgo(2, 4)})
  `;
  console.log('  ✓ Mental Health Support — "Struggling with waiting period" (5 comments)');

  // ════════════════════════════════════════════
  // CATEGORY 8: Events & Workshops
  // ════════════════════════════════════════════

  const post10 = randomUUID();
  await sql`INSERT INTO forum_posts (id, category_id, author_id, slug, title, body, vote_score, comment_count, created_at, last_activity_at) VALUES (
    ${post10}, ${cats['events-workshops']}, ${D(3)},
    ${slug('Free virtual Q and A - Ask a TMS Specialist anything - April 19')},
    ${'Free virtual Q&A — "Ask a TMS Specialist Anything" — April 19'},
    ${"We're hosting a free virtual Q&A session for anyone considering TMS therapy or currently in treatment.\n\nDate: Saturday, April 19, 2026 at 2:00 PM ET\nFormat: Zoom webinar (camera optional)\nDuration: 60 minutes + 30 min open Q&A\n\nTopics we'll cover:\n- How TMS works and what to expect\n- Insurance and cost considerations\n- New developments in TMS (accelerated protocols, new targets)\n- Managing side effects\n- When to consider retreatment\n\nA panel of 3 board-certified psychiatrists who specialize in TMS will be answering questions. No question is too basic or too specific.\n\nThis is NOT a sales pitch — it's an educational event for the community. We'll share the Zoom link here closer to the date.\n\nDrop any questions below that you'd like us to address!"},
    ${16}, ${3}, ${daysAgo(2)}, ${daysAgo(0, 10)}
  )`;

  await sql`INSERT INTO forum_comments (post_id, author_id, body, vote_score, created_at) VALUES
    (${post10}, ${P(5)}, ${"This is great! I'd love to hear about TMS for conditions beyond depression — specifically PTSD and chronic pain. Also, is there an age limit for TMS? My 72-year-old father is interested but worried he's \"too old.\""}, ${4}, ${daysAgo(1, 18)}),
    (${post10}, ${P(2)}, ${"Signed up! Can you address the difference between TMS providers? I've gotten quotes ranging from $6,000 to $15,000 and I don't understand why there's such a huge range. What should I be looking for in a good clinic?"}, ${6}, ${daysAgo(1, 10)}),
    (${post10}, ${D(3)}, ${"Both great questions — we'll definitely address those. Marcus, to answer quickly: there's no upper age limit for TMS. We regularly treat patients in their 70s and 80s. In fact, older adults who haven't responded to medications are often excellent TMS candidates. We'll go into more detail during the webinar."}, ${8}, ${daysAgo(0, 10)})
  `;
  console.log('  ✓ Events & Workshops — "Free virtual Q&A — April 19" (3 comments)');

  // ════════════════════════════════════════════
  // Update category post counts and last activity
  // ════════════════════════════════════════════

  console.log('\nUpdating category counters...');

  await sql`
    UPDATE forum_categories SET
      post_count = (SELECT COUNT(*) FROM forum_posts WHERE category_id = forum_categories.id AND status = 'published'),
      last_activity_at = (SELECT MAX(last_activity_at) FROM forum_posts WHERE category_id = forum_categories.id AND status = 'published')
  `;

  console.log('  ✓ Category post counts and last activity updated');

  // ── Summary ──
  const postCount = await sql`SELECT COUNT(*) as c FROM forum_posts`;
  const commentCount = await sql`SELECT COUNT(*) as c FROM forum_comments`;
  console.log(`\nDone! Seeded ${postCount[0].c} posts and ${commentCount[0].c} comments across all categories.`);

  await sql.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
