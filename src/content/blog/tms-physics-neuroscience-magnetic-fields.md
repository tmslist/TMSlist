---
title: "TMS and Brain Stimulation: How Magnetic Fields Reach Neural Circuits"
description: "A behind-the-scenes look at the physics and neuroscience of how TMS works — how magnetic fields generate electrical currents, which neurons get activated, and why coil design matters for targeting."
author: "TMS List Editorial Team"
publishDate: 2026-04-16
category: research
tags: ["neuroscience", "physics", "how it works", "mechanism", "coil design"]
image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop"
---

Understanding how TMS actually works — at the level of physics and cellular neuroscience — helps explain why it is effective, why it sometimes fails, and why the specific details of how you receive treatment matter as much as the treatment itself.

The mechanism is elegantly simple at its core: a changing magnetic field induces an electrical current in conductive tissue. But the translation from this principle to a clinically effective treatment involves layers of engineering, neuroanatomy, and neuroscience that are worth understanding.

## What You'll Learn

- How Faraday's law of electromagnetic induction makes TMS possible
- Which neurons TMS activates and why it targets axons over cell bodies
- How coil design (figure-8, double-cone, H-coils) affects stimulation depth and focality
- Why motor threshold calibration is critical for personalized treatment
- How stimulation frequency (high vs. low vs. theta burst) determines excitatory or inhibitory effects

## The Physics: Faraday's Law in Practice

TMS uses a coil of copper wire wrapped around a core. When an electric current passes through the coil, it generates a magnetic field. The field strength is proportional to the current and the number of coil turns.

The key engineering challenge is generating a rapidly changing magnetic field. Neuronal membranes respond to the rate of change of the magnetic field, not its steady state. TMS devices discharge a capacitor bank through the coil, generating a pulse that rises to full strength in approximately 100 microseconds and collapses equally quickly. This rapid change is what induces the electrical current in brain tissue.

Faraday's law of electromagnetic induction states that the induced voltage in a conductor is proportional to the rate of change of the magnetic flux through it. The TMS coil produces a magnetic field; brain tissue (a conductor) develops an induced current in response. The math is straightforward. The engineering to make it safe, reliable, and clinically practical is not.

## The Biological Target: Which Neurons Respond

The induced electrical current activates neurons — but not all neurons equally. The magnetic field preferentially activates axons (the output fibers of neurons) over cell bodies, and larger diameter axons more than smaller ones. This selectivity matters for the effect.

The typical TMS target — the dorsolateral prefrontal cortex — is reached by delivering pulses through a coil placed on the scalp above that region. The magnetic field penetrates scalp, skull, and cerebrospinal fluid before reaching the cortex. The field strength drops with distance from the coil, which means the most intense stimulation occurs at the cortical surface directly beneath the coil.

Within the cortex, TMS activates the axons of pyramidal neurons — the long projecting cells that carry signals from the cortex to other brain regions. These are the output neurons of the targeted circuit. Activating them sends signals downstream to structures that do not receive direct TMS stimulation — the anterior cingulate cortex, amygdala, and other mood-regulating structures.

## The Cortical Excitability Effect

The immediate effect of a TMS pulse is depolarization of the targeted neurons — forcing them to fire. Repeated pulses at therapeutic frequencies (5-20 Hz for excitatory protocols) produce cumulative effects on cortical excitability.

The cellular mechanisms underlying this cumulative effect involve:
- Activation of voltage-gated calcium channels (triggering calcium influx)
- Calcium-dependent release of neurotransmitters (glutamate, GABA)
- Downstream signaling cascades (CREB activation, gene expression changes)
- Synaptic strengthening (long-term potentiation-like plasticity)

This is not a drug effect — there is no external neurotransmitter being added. The brain is activating its own plasticity machinery in response to the stimulation.

## Why Coil Design Matters

The geometry of the TMS coil determines the shape and depth of the induced electric field. This is not a minor technical detail — different coil designs produce different stimulation volumes, which means different brain structures are affected.

**Figure-8 coils:** Two wing-shaped loops that intersect at the center. The electric field is most concentrated at the intersection, making it focal and shallow. Ideal for cortical surface targets like the DLPFC. The standard coil for depression TMS.

**Double-cone coils:** Angled circular coils that approximate the shape of the head's curvature. The field penetrates slightly deeper and affects a larger area than figure-8 coils. Useful for deeper or larger cortical targets.

**H-coils (BrainsWay):** Specialized geometry that intentionally shapes the field to penetrate more deeply while maintaining reasonable focality. The trade-off is a larger stimulated volume. Required for subcortical targets involved in OCD.

**Circular coils:** A single circular loop producing a field that is strongest at the periphery of the circle. Less focal than figure-8 coils. Less commonly used for therapeutic applications but still used in some research contexts.

The choice of coil is a clinical decision made by your clinician based on the target structure, your condition, and the specific protocol being used.

## Motor Threshold: The Individual Calibration

One of the most important steps in TMS treatment is determining your motor threshold — the minimum stimulation intensity required to produce a motor evoked potential (MEP) in a hand muscle when stimulating the motor cortex.

The motor threshold varies between individuals by roughly 30-50% based on head geometry, skull thickness, cerebrospinal fluid volume, and individual neuronal properties. TMS dosing that is calibrated to your specific motor threshold — rather than using a fixed intensity — produces more reliable outcomes.

Motor threshold is determined by delivering pulses to the motor cortex while measuring EMG from a hand muscle (typically the abductor pollicis brevis or first dorsal interosseous). The intensity is gradually increased until consistent motor responses are observed. This intensity becomes your 100% reference point, and treatment is delivered at a percentage of that threshold (typically 100-120% for standard protocols).

Skipping or rushing motor threshold determination is a red flag in TMS practice. Accurate calibration matters.

## The Frequency Question

TMS frequency determines whether the effect is excitatory or inhibitory:

**High frequency (5-20 Hz):** Generally excitatory. Increases cortical excitability and is used for depression treatment. Standard rTMS for depression typically uses 10 Hz.

**Low frequency (1 Hz or less):** Generally inhibitory. Decreases cortical excitability and is used for conditions involving cortical hyperactivation, such as in some epilepsy applications or for reducing auditory hallucinations in schizophrenia.

**Theta burst (iTBS):** Patterned stimulation at 50 Hz (within bursts) and 5 Hz (between bursts). Synaptic plasticity theory suggests this pattern is particularly effective for inducing LTP-like changes at lower total pulse counts.

The frequency choice is based on the condition being treated and the desired effect on the target circuit. For depression, excitatory high-frequency stimulation of the left DLPFC is the standard approach.

## Why Targeting Accuracy Matters

The DLPFC is not a single point — it is a large cortical region. The specific subregion targeted affects outcomes because different parts of the DLPFC connect to different downstream structures.

The standard anatomical approach — measuring 5 cm forward from the motor cortex along the scalp — approximates the DLPFC but does not account for individual variation in brain anatomy. Studies using fMRI-based neuronavigation have shown that the 5-cm rule often misses the target by 1-2 cm, which is significant relative to the focal point of the TMS coil.

Neuronavigated TMS uses an individual's MRI scan to calculate the exact coordinates for the DLPFC target and uses an optical tracking system to maintain coil position during treatment. This improves targeting accuracy and has been associated with better outcomes in multiple studies.

## The Bottom Line: A Tool, Not Magic

TMS is a neuromodulation tool — sophisticated, but based on physics that Michael Faraday could have understood. A changing magnetic field induces current in brain tissue. That current activates neurons. Repeated activation triggers plasticity. Plasticity changes circuit function. Changed circuit function changes symptoms.

The precision of the tool — coil design, individual calibration, targeting accuracy — determines how effectively it achieves this chain. A TMS system that is well-calibrated, well-targeted, and delivered by an experienced clinician produces better outcomes than one that is not. The physics does not change; the engineering and clinical implementation do.

Understanding this does not change how you experience TMS. But it explains why the specific details of your treatment — the coil, the calibration, the targeting — matter more than the vague concept of "brain stimulation."

<div class="not-prose my-8 [&_.faq-item]:py-4 [&_.faq-item]:border-b [&_.faq-item]:border-violet-100" itemscope itemtype="https://schema.org/FAQPage">
  <h2 class="font-display font-bold text-gray-900 mb-4 text-2xl">Frequently Asked Questions</h2>
  <div class="space-y-4">
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 class="font-semibold text-gray-900 mb-2 text-lg" itemprop="name">How does TMS activate neurons without surgery or medication?</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p class="text-gray-600" itemprop="text">TMS uses Faraday's law of electromagnetic induction. A rapidly changing magnetic field generated by the coil induces an electrical current in brain tissue. This current activates neurons -- preferentially axons over cell bodies, and larger diameter axons more than smaller ones. The activation sends signals downstream to structures that do not receive direct TMS stimulation, including the anterior cingulate cortex, amygdala, and other mood-regulating structures.</p>
      </div>
    </div>
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 class="font-semibold text-gray-900 mb-2 text-lg" itemprop="name">What is motor threshold and why does it matter?</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p class="text-gray-600" itemprop="text">Motor threshold is the minimum stimulation intensity required to produce a motor evoked potential in a hand muscle when stimulating the motor cortex. It varies between individuals by roughly 30-50% based on head geometry, skull thickness, and cerebrospinal fluid volume. TMS dosing calibrated to your specific motor threshold produces more reliable outcomes than using a fixed intensity. Skipping or rushing motor threshold determination is a red flag in TMS practice.</p>
      </div>
    </div>
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 class="font-semibold text-gray-900 mb-2 text-lg" itemprop="name">What is the difference between high-frequency and low-frequency TMS?</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p class="text-gray-600" itemprop="text">High-frequency TMS (5-20 Hz) is generally excitatory and increases cortical excitability -- used for depression treatment with standard protocols using 10 Hz stimulation to the left DLPFC. Low-frequency TMS (1 Hz or less) is generally inhibitory and decreases cortical excitability -- used for conditions involving cortical hyperactivation such as some epilepsy applications or reducing auditory hallucinations in schizophrenia.</p>
      </div>
    </div>
  </div>
</div>

<div class="not-prose my-10 bg-slate-900 rounded-2xl p-8 text-center">
  <h3 class="text-2xl font-semibold text-white mb-3">Ready to Explore Your TMS Options?</h3>
  <p class="text-slate-400 mb-6 max-w-lg mx-auto">Browse verified TMS providers, read real reviews, and find the right treatment for your situation.</p>
  <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
    <a href="/us/" class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Find a TMS Clinic</a>
    <a href="/quiz/am-i-a-candidate/" class="text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors">Check If TMS Is Right for You</a>
  </div>
</div>
