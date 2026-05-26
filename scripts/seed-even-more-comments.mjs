import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

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
  return patientUsers[Math.abs(seed) % patientUsers.length];
}

// Each entry: [daysAfterApr14, hourUTC, userIndex, body]
// Window: 2026-04-14 → 2026-04-26 (today)
const plan = {
  "headaches-after-tms-sessions---when-do-they-stop-im2qyp": [
    [1, 7, 11, "Adding to the chorus — pre-hydrating with electrolytes (LMNT or homemade) cut my post-session headache time in half."],
    [3, 13, 14, "I clench my jaw during sessions without realizing it. Once my tech pointed it out and I focused on relaxing, the temple soreness dropped 70%."],
    [4, 9, 9, "Anyone else find that headaches got worse on the days they doubled up sessions? I had to space mine back out."],
    [6, 18, 12, "Acetaminophen is fine, ibuprofen is fine — just avoid anything that suppresses neuroplasticity (high-dose NSAIDs daily, per my psychiatrist)."],
    [7, 11, 15, "Session 8 here, and the headaches finally feel like a 2/10 instead of a 6/10. Hang in there OP."],
    [9, 14, 13, "Sleeping with a slightly elevated pillow helped me. Ear pressure + tension was making it worse overnight."],
    [10, 16, 10, "If your headache is one-sided and very sharp, ask them to lower the intensity 5%. They can usually keep efficacy and lose the pain."],
    [12, 8, 16, "Closing the loop on my own thread from last month — done with course, headaches gone for the last 14 sessions. It does end."],
  ],
  "from-barely-surviving-to-actually-living---tms-changed-everything-si4inr": [
    [0, 9, 10, "Saving this. I'm 4 sessions in and still in the dark phase. Reading stories like this is the only thing keeping me going some days."],
    [2, 12, 17, "What surprised me most was the small stuff coming back — laughing at a podcast, wanting to cook dinner. Those felt bigger than the depression scores."],
    [4, 14, 9, "My partner noticed before I did. He said 'you're humming again' around session 16. Made me cry."],
    [5, 19, 13, "Six weeks post-course. The plateau between session 10 and 18 was brutal — I thought it wasn't working. Then it clicked."],
    [7, 10, 15, "Did anyone go through a 'TMS dip' around session 6-8? My provider warned me but it still surprised me."],
    [8, 16, 11, "@above — yes, dip around session 7 was real. Lasted 3 days, then I bounced past my baseline."],
    [10, 13, 12, "I'm a year out now. Did one round of maintenance. The biggest thing TMS gave me wasn't relief — it was the energy to actually do therapy."],
    [11, 20, 14, "Reading every reply on this thread before each of my sessions. Down to session 11. Thank you all."],
    [12, 9, 16, "If TMS helped you, please consider posting your own thread. The good stories save lives — I'm proof."],
  ],
  "just-finished-my-36-session-course---here-is-my-honest-review-l9mfvz": [
    [0, 11, 9, "Bookmarking. About to start my course on Monday. Your week-by-week breakdown is more useful than anything I got from the consult."],
    [2, 15, 12, "Did you have any cognitive side effects? Brain fog? I've read mixed things."],
    [3, 10, 14, "Reply for above — I had mild fog weeks 2-3 then it lifted. Provider said it's the recalibration phase."],
    [5, 17, 11, "What was your insurance situation? Curious how the 36 vs 30 session count was handled."],
    [6, 13, 16, "Honest reviews are gold but please update us at 6 and 12 months. The durability question is what worries me most."],
    [8, 9, 15, "I had the same 'cumulative click' you described — somewhere around session 22 my baseline shifted permanently."],
    [9, 18, 10, "Did you continue therapy alongside? Curious how you split the work."],
    [11, 12, 13, "Just finished session 36 today and reread your post. So much of it tracked. The taper feels weird — like I'm waiting for it to wear off."],
    [12, 10, 17, "Three weeks post-course here. Sleep is the cleanest improvement. Mood is more like a slow climb than a switch."],
  ],
  "free-virtual-q-and-a---ask-a-tms-specialist-anything---april-19-zrcq50": [
    [1, 14, 10, "Will the slides be posted? The bit about cortical excitability and motor threshold went over my head and I want to revisit."],
    [3, 16, 13, "The honesty about who's NOT a good candidate was refreshing. I wish more clinics led with that."],
    [4, 11, 15, "Question for next time: how do you decide between iTBS, 10Hz, and SAINT-style accelerated for a new patient?"],
    [7, 19, 9, "The part about right-sided treatment for anxiety was new to me. My current provider only mentioned left-sided."],
    [9, 12, 12, "Recording link please? Couldn't make the live call."],
    [11, 17, 16, "Loved that you didn't oversell. 'TMS isn't magic, it's a tool' is the right framing."],
    [12, 15, 14, "Please do another one focused on maintenance and what to do if symptoms creep back at month 9-12."],
  ],
  "can-i-do-tms-if-i-have-a-metal-dental-implant-abm6t1": [
    [1, 8, 11, "Cleared with a permanent retainer behind my front teeth. They asked the orthodontist to confirm material in writing."],
    [3, 12, 13, "If your implant is anywhere on the jaw or below, you're almost certainly fine. The coil's effective field drops off sharply outside ~3-4cm."],
    [5, 16, 9, "Cochlear implant is the big disqualifier — that one is firm. Dental work, orthopedic plates in the leg, IUDs: usually fine after a check."],
    [6, 10, 17, "I had to bring the receipt from my crown placement to confirm zirconia. Annoying but quick."],
    [8, 14, 15, "My TMS clinic had a one-page screening checklist with specific keywords (ferromagnetic, deep brain stimulator, vagal nerve stim, etc.). Ask for it ahead of time."],
    [10, 11, 12, "Tongue piercing — they asked me to remove for sessions. Not a hard no, just a precaution."],
    [12, 17, 14, "Cleared and finished a full course with three crowns and a titanium implant. Zero issues. Don't let this be the thing that stops you."],
  ],
  "how-long-do-tms-results-typically-last-0t7473": [
    [0, 9, 16, "18 months out, did a 5-session refresher in February. Honestly think the maintenance schedule is the difference between durable and not."],
    [2, 13, 10, "Important nuance: 'durability' depends a lot on whether you address what was driving the depression in the first place. TMS without therapy = shorter runway in my support group."],
    [4, 17, 14, "26 months. No maintenance yet but I sleep, exercise, and stayed on a low-dose SSRI as a 'belt'. Working so far."],
    [5, 11, 9, "Relapsed at month 7. Did another full short course (20 sessions) and was back in remission within 4 weeks. Second round was easier."],
    [7, 14, 13, "What I wish someone had told me: track your PHQ-9 monthly post-treatment. Catching creep early = a 5-session tune-up instead of another full course."],
    [9, 10, 11, "The Carpenter and Phillip studies are the realistic anchors. ~50-60% maintain response at 12 months without maintenance, higher with."],
    [11, 18, 15, "Stress life event triggered a relapse for me at month 10. Refresher worked. The neural pathways are still there to be re-activated."],
    [12, 12, 17, "Two and a half years and counting. Best money I ever spent on my brain."],
  ],
  "tms-for-anxiety-not-just-depression---my-experience-uw5oav": [
    [0, 13, 12, "GAD + panic disorder here. Eight months post-treatment and the constant-low-level dread is just… gone. Still get situational anxiety but it doesn't run the show."],
    [2, 10, 9, "Did right-sided 1Hz for 30 sessions. Sleep onset improved first, then ruminations slowed, then the chest-tightness eased."],
    [3, 16, 14, "Important — many providers won't bill 'TMS for anxiety' because insurance won't cover it. They bill for comorbid depression and treat both. Ask explicitly."],
    [5, 19, 11, "Health anxiety has been the toughest piece for me. TMS knocked the volume down enough that CBT finally landed."],
    [7, 11, 13, "Anyone tried the Stanford-style protocol for OCD specifically? I'm in evaluation now."],
    [8, 15, 16, "Yes — Brainsway's deep TMS has an FDA clearance for OCD. Different coil shape than standard depression treatment."],
    [10, 9, 10, "Six months in, still taking my SSRI but at half the dose. Provider doesn't want me dropping it for another year. Patient with that."],
    [12, 14, 15, "Best part of TMS for anxiety: I stopped dreading new situations. The anticipatory dread was 80% of my suffering."],
  ],
  "new-stanford-saint-protocol-showing-90-percent-remission-rates-0fuuu8": [
    [0, 10, 13, "The MRI-guided targeting is the secret sauce, not the dose schedule. That's what most clinics offering 'SAINT-equivalent' are missing."],
    [2, 14, 11, "Did accelerated (3 sessions/day, 10 days) at a clinic that uses neuronavigation. Out of pocket but I got 7 weeks of treatment compressed into 2 weeks. Game changer for someone with limited PTO."],
    [4, 17, 16, "Insurance reality check: BCBS just added accelerated TMS to their coverage policy for treatment-resistant depression. Slow but it's coming."],
    [6, 11, 10, "The downside no one mentions: when SAINT works, it works fast — but the rebound risk if you don't have maintenance set up is higher. Have a plan."],
    [8, 15, 14, "Stanford's published 1-year follow-up data was less rosy than the headline. Real durability looks closer to standard TMS at 12 months. Still effective, just not magical."],
    [10, 13, 9, "Asked four clinics in my city — none use real fMRI targeting yet. Calling that out matters because it's the part that drives the 90% number."],
    [12, 18, 17, "Friend just finished SAINT-style at a research site for free. Remission at week 1. Will report back at month 6."],
  ],
  "struggling-with-the-waiting-period-before-tms-starts-3kzg3q": [
    [0, 8, 16, "Waited 9 weeks for prior auth. Used the time to do a med washout under supervision and start journaling daily — both ended up helping the TMS work better."],
    [1, 12, 10, "Therapy intensification while waiting saved me. Twice-weekly CBT instead of weekly. Felt like I had something to do with my hands."],
    [3, 15, 14, "Walking 30 min outside every morning, even if I cried while doing it. The structure mattered more than the mood lift."],
    [4, 11, 13, "Reach out to your TMS clinic's intake coordinator, not the front desk. They can sometimes pull you forward when there's a cancellation."],
    [6, 17, 9, "If you're suicidal — call 988 and consider a higher level of care while you wait. There's no shame in stepping up. TMS will still be there."],
    [7, 14, 11, "Started yesterday after a 7-week wait. Want to tell anyone reading this: the wait ends and the work begins. You're not stuck forever."],
    [9, 10, 15, "Asked my psychiatrist about ketamine as a bridge during the wait. Wasn't right for me but worth asking your provider about."],
    [11, 19, 12, "I'm so tired of waiting and so tired of being tired. Reading this thread for the third time tonight. Just here."],
    [12, 13, 17, "@above — I see you. The waiting room phase is its own form of suffering. Please tell someone today."],
  ],
  "how-i-got-my-insurance-to-cover-tms-after-initial-denial-z1lenf": [
    [1, 10, 15, "United denied me three times. The thing that finally worked: a letter from my therapist documenting functional impairment (work, relationships, ADLs)."],
    [3, 14, 9, "Anthem approved on first appeal after my psychiatrist sent the failed-medication trial table in the format their medical policy specifies. Format matters."],
    [5, 11, 13, "If you're self-pay, ask the clinic about a cash-pay discount. Mine was 40% off the billed rate."],
    [6, 16, 11, "Cigna requires you to fail SSRIs from two different classes. Mine kept denying because I'd only failed two from the same class. Switched approach and got approved."],
    [8, 13, 17, "State insurance commissioner complaints are a real lever — my approval came 5 business days after I filed one."],
    [9, 18, 12, "External review (the IRO process) is the trump card most people don't know about. After two appeals, you can force an independent doctor's review. I won there."],
    [11, 10, 14, "Medicare Advantage plans vary widely. Original Medicare actually covers TMS reliably with a referral. If you have a choice at open enrollment, factor that in."],
    [12, 15, 16, "Got my approval letter today after 4 months. Reading this whole thread back. To everyone still fighting — keep going. The system is beatable."],
  ],
};

let inserted = 0;
let skipped = 0;
const dateBase = new Date("2026-04-14T00:00:00Z");

for (const [slug, comments] of Object.entries(plan)) {
  const postId = bySlug[slug];
  if (!postId) {
    console.warn("SKIP — post not found:", slug);
    continue;
  }
  for (const [dayOffset, hour, uIdx, body] of comments) {
    // Avoid duplicates if rerun
    const exists = await sql`
      select 1 from forum_comments where post_id = ${postId} and body = ${body} limit 1
    `;
    if (exists.length) { skipped++; continue; }

    const created = new Date(dateBase);
    created.setUTCDate(created.getUTCDate() + dayOffset);
    created.setUTCHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
    const author = pickUser(uIdx + dayOffset * 3);
    await sql`
      insert into forum_comments (post_id, author_id, body, status, vote_score, created_at, updated_at)
      values (${postId}, ${author.id}, ${body}, 'published', ${Math.floor(Math.random() * 12)}, ${created}, ${created})
    `;
    inserted++;
  }
}

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
console.log("Inserted:", inserted, "Skipped (dup):", skipped, "→ total comments:", after[0].c);

await sql.end();
