import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

// Pick patient-style users (viewers), not admins/clinic owners.
const userRows = await sql`
  select id, name from users
  where role = 'viewer' and name is not null and name <> ''
`;
const patientUsers = userRows.filter(
  (u) => !/^arush$/i.test(u.name) && !/Ryan Mitchell/i.test(u.name)
);
if (patientUsers.length < 5) {
  throw new Error(`Not enough patient users: ${patientUsers.length}`);
}

const posts = await sql`select id, slug from forum_posts`;
const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p.id]));

function pickUser(seed) {
  return patientUsers[seed % patientUsers.length];
}

// Comments by post slug. Each entry: [daysAfterApr14, hourUTC, userIndex, body]
// Date range: 2026-04-14 → 2026-04-26 (today).
const plan = {
  "headaches-after-tms-sessions---when-do-they-stop-im2qyp": [
    [0, 9, 1, "Update from my end — headaches basically vanished by session 14. Magnesium glycinate at night and 64oz of water a day made the biggest difference for me."],
    [2, 14, 4, "Mine eased around session 10. The tech adjusted the angle slightly and that helped a ton — ask them to recheck the F3 placement if it persists."],
    [5, 11, 7, "Tylenol 30 min before each session was a game-changer. Doc said it doesn't blunt the antidepressant effect, only the muscle activation pain."],
    [8, 16, 2, "On session 22 now and headaches are completely gone. Hang in there, the first 2 weeks are the worst."],
    [11, 10, 5, "Just finished today's session — first one with zero headache. Took almost 4 weeks for me. Everyone's timeline is different."],
    [12, 19, 3, "Cold compress on the forehead immediately after the session helped me when nothing else did."],
  ],
  "from-barely-surviving-to-actually-living---tms-changed-everything-si4inr": [
    [1, 8, 0, "Reading this on a hard morning and it's giving me hope. Two weeks into my course. Thank you for sharing."],
    [3, 13, 6, "Same here. I cried during my session 18 because I realized I hadn't had a suicidal thought in over a week. First time in years."],
    [6, 17, 8, "How long did it take before you noticed the shift? I'm at session 12 and still waiting."],
    [9, 9, 1, "@above — for me it was around session 20. Don't lose hope, the back half is where it really clicked."],
    [10, 15, 4, "This thread is the reason I scheduled my consultation. Going in next Tuesday. Wish me luck."],
    [12, 12, 7, "Six months post-treatment and I'm still doing well. The maintenance sessions every 6 weeks have been worth it."],
  ],
  "just-finished-my-36-session-course---here-is-my-honest-review-l9mfvz": [
    [1, 11, 2, "Thanks for the detailed write-up. Did you continue any meds during the course or taper off?"],
    [4, 16, 5, "Honest reviews like this are gold. Saved this thread for when I start in May."],
    [7, 10, 0, "Curious about your work schedule during treatment — did you take time off or work through it?"],
    [10, 14, 3, "Just hit session 30 myself. Mirroring a lot of what you described — the cumulative effect is real."],
    [12, 9, 6, "What was your PHQ-9 before vs after? Trying to track my own progress."],
    [12, 20, 8, "Bookmarking this. The honesty about the rough patches mid-course is what I needed to read."],
  ],
  "free-virtual-q-and-a---ask-a-tms-specialist-anything---april-19-zrcq50": [
    [5, 18, 1, "The recording was really informative — especially the part about the difference between iTBS and standard 10Hz protocols."],
    [6, 10, 4, "Will there be another one in May? My sister couldn't make it and would've loved this."],
    [8, 13, 7, "The Q&A on insurance prior auth was the most useful 15 minutes I've spent on TMS info. Thank you for hosting."],
  ],
  "can-i-do-tms-if-i-have-a-metal-dental-implant-abm6t1": [
    [2, 9, 3, "I have two titanium implants and was cleared after a quick check with my prosthodontist. Titanium is non-ferromagnetic so it's generally fine."],
    [4, 15, 6, "My TMS provider had me bring my dental records. Took 10 minutes and I was cleared. Don't let this stop you from asking."],
    [7, 11, 0, "The rule of thumb my doc gave me: anything within ~30cm of the coil and ferromagnetic = problem. Dental implants are usually titanium = not a problem."],
    [10, 17, 5, "Cleared with braces too — they used a slightly modified angle. Worth asking specifically."],
    [11, 12, 8, "Get a letter from whoever placed the implant confirming the material. Most TMS clinics will accept that and move on."],
  ],
  "how-long-do-tms-results-typically-last-0t7473": [
    [3, 10, 2, "14 months post-treatment here. Still in remission with one maintenance week last fall."],
    [6, 14, 5, "Mine lasted about 9 months before I noticed creep. Did a 10-session refresher and bounced back quickly."],
    [9, 16, 1, "The 2018 Carpenter study showed ~50% maintained response at 12 months. Real-world for me has been close to that."],
    [12, 11, 4, "Two years out. Did one round of maintenance at month 18. Still feel like myself. Best decision I've ever made."],
    [12, 18, 7, "Lifestyle stuff matters — sleep, exercise, therapy alongside. The folks who relapse fastest in my support group are the ones who dropped everything else after TMS."],
  ],
  "tms-for-anxiety-not-just-depression---my-experience-uw5oav": [
    [1, 12, 6, "Same — I have GAD and went in for depression but my anxiety dropped almost as much. Right DLPFC adjustments seemed to be the key."],
    [4, 9, 3, "Did your provider use a specific anxiety protocol or the standard depression one with adjustments?"],
    [8, 15, 0, "Three weeks in for anxiety primarily. Sleep is the first thing that improved — I'm finally not lying awake replaying conversations."],
    [11, 13, 8, "The Stanford team published on right-sided iTBS for anxiety last year. Worth asking your provider about it."],
    [12, 17, 5, "Panic attacks went from 3-4/week to maybe 1/month. Still have them but they're shorter and I can ride them out."],
  ],
  "new-stanford-saint-protocol-showing-90-percent-remission-rates-0fuuu8": [
    [2, 11, 1, "SAINT is incredible but the cost is the issue — most clinics offering it are charging $20-30k out of pocket since insurance is still catching up."],
    [5, 14, 4, "I did SAINT-equivalent (5 sessions/day for 5 days) at a clinic in Texas. It worked but the intensity was rough — not for everyone."],
    [9, 10, 7, "The 90% number is from a small RCT. Real-world numbers are closer to 60-70% which is still huge vs ~50% standard."],
    [12, 16, 2, "My insurance just approved accelerated TMS (3 sessions/day) which is a step toward SAINT pricing. Things are moving fast."],
  ],
  "struggling-with-the-waiting-period-before-tms-starts-3kzg3q": [
    [0, 10, 5, "The waiting was the worst part for me too. Try to lock in a daily routine — same wake time, walk, structured meals. Helped me stay above water."],
    [3, 13, 8, "Six weeks of insurance back-and-forth before I started. I'm now at session 24 and so glad I pushed through. You will too."],
    [6, 11, 0, "Crisis lines don't fix the wait but they got me through three really bad nights. 988 if you're US-based."],
    [10, 16, 3, "I'm starting next week and reading this thread back-to-front. Thank you all for being here."],
    [12, 14, 6, "Update — finally started yesterday. The first session was anticlimactic in the best way. The wait is over."],
  ],
  "how-i-got-my-insurance-to-cover-tms-after-initial-denial-z1lenf": [
    [1, 9, 4, "Saving this. My second appeal letter was rejected last week. Going to use your template."],
    [4, 15, 7, "BCBS denied me twice. The peer-to-peer review with their medical director was what flipped it. Make sure your psychiatrist actually does the call."],
    [7, 12, 1, "Document EVERY medication trial — name, dose, duration, side effect, why you stopped. Insurance lives for that paper trail."],
    [10, 17, 8, "Aetna approved on first appeal after I cited the APA practice guidelines explicitly. Your provider should know to attach those."],
    [12, 10, 2, "Just got my approval letter today — used a lot of advice from this thread. Pre-authorization came through after 11 weeks. Don't give up."],
  ],
};

let inserted = 0;
const dateBase = new Date("2026-04-14T00:00:00Z");

for (const [slug, comments] of Object.entries(plan)) {
  const postId = bySlug[slug];
  if (!postId) {
    console.warn("SKIP — post not found:", slug);
    continue;
  }
  for (const [dayOffset, hour, uIdx, body] of comments) {
    const created = new Date(dateBase);
    created.setUTCDate(created.getUTCDate() + dayOffset);
    created.setUTCHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
    const author = pickUser(uIdx + dayOffset);
    await sql`
      insert into forum_comments (post_id, author_id, body, status, vote_score, created_at, updated_at)
      values (${postId}, ${author.id}, ${body}, 'published', ${Math.floor(Math.random() * 8)}, ${created}, ${created})
    `;
    inserted++;
  }
}

// Refresh comment_count and last_activity_at for affected posts
await sql`
  update forum_posts p
  set comment_count = sub.c,
      last_activity_at = greatest(p.last_activity_at, sub.mx)
  from (
    select post_id, count(*)::int as c, max(created_at) as mx
    from forum_comments
    where status = 'published'
    group by post_id
  ) sub
  where sub.post_id = p.id
`;

const after = await sql`select count(*)::int as c from forum_comments`;
console.log("Inserted:", inserted, "→ total comments:", after[0].c);

await sql.end();
