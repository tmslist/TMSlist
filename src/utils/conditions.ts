export interface ConditionInfo {
  label: string;
  match: string[];
  description: string;
  intro: string;
}

export const CONDITION_MAP: Record<string, ConditionInfo> = {
  depression: {
    label: "Depression",
    match: ["Major Depressive Disorder", "Depression"],
    description: "TMS is FDA-cleared for treatment-resistant depression and achieves remission rates of 50-60%. Find the best providers specializing in depression treatment.",
    intro: "Depression is the most common condition treated with TMS. The FDA first cleared TMS for treatment-resistant depression in 2008, and it has since become a mainstream option for patients who haven't responded to antidepressants.",
  },
  ocd: {
    label: "OCD",
    match: ["OCD"],
    description: "TMS received FDA clearance for OCD in 2018 using BrainsWay Deep TMS. Find clinics with specialized OCD protocols.",
    intro: "In 2018, BrainsWay Deep TMS received FDA clearance for treating OCD, making it the first non-drug treatment approved for obsessive-compulsive disorder. Deep TMS targets the anterior cingulate cortex and medial prefrontal cortex.",
  },
  anxiety: {
    label: "Anxiety",
    match: ["Anxiety"],
    description: "While not yet FDA-cleared specifically for anxiety, many TMS clinics treat anxiety disorders with evidence-based protocols. Find providers near you.",
    intro: "While TMS is not yet FDA-cleared specifically for generalized anxiety disorder, many clinics use it off-label with growing clinical evidence. Studies show that stimulating the right dorsolateral prefrontal cortex can reduce anxiety symptoms.",
  },
  ptsd: {
    label: "PTSD",
    match: ["PTSD"],
    description: "TMS shows promise for PTSD treatment with multiple clinical trials demonstrating significant symptom reduction. Find specialized PTSD providers.",
    intro: "PTSD is one of the most actively researched applications of TMS. Multiple clinical trials have shown that repeated TMS sessions can reduce PTSD symptom severity by 30-50% in treatment-resistant cases.",
  },
  bipolar: {
    label: "Bipolar Disorder",
    match: ["Bipolar", "Bipolar Disorder"],
    description: "TMS is being used for the depressive phase of bipolar disorder. Find clinics experienced in bipolar TMS protocols.",
    intro: "TMS is increasingly used to treat the depressive episodes of bipolar disorder. Unlike antidepressants, which can trigger manic episodes, TMS carries a much lower risk of mood switching.",
  },
};
