// Country-specific metadata for international TMS clinic pages

export interface CountryMeta {
    code: string;
    name: string;
    urlPrefix: string;
    flag: string;
    currency: string;
    publicHealthSystem: string;
    tmsStatus: string;
    sessionCostRange: string;
    seoDescription: string;
    aboutContent: string;
    insuranceNote: string;
}

export const COUNTRY_META: Record<string, CountryMeta> = {
    GB: {
        code: 'GB',
        name: 'United Kingdom',
        urlPrefix: 'uk',
        flag: '\u{1F1EC}\u{1F1E7}',
        currency: 'GBP',
        publicHealthSystem: 'NHS',
        tmsStatus: 'NICE-approved since 2015',
        sessionCostRange: '\u00A3200\u2013\u00A3400',
        seoDescription: 'TMS therapy is NICE-approved in the UK for treatment-resistant depression. While NHS access remains limited, private clinics across England, Scotland, and Wales offer advanced rTMS and Deep TMS protocols.',
        aboutContent: 'The UK has a growing network of TMS providers, led by Smart TMS with clinics nationwide and specialist Harley Street practices in London. The Maudsley Hospital is one of the few NHS providers. NICE approved TMS for depression in 2015, but NHS commissioning varies by region.',
        insuranceNote: 'TMS is NICE-approved but NHS access is extremely limited. Most patients pay privately. Some private health insurers (Bupa, AXA PPP, Aviva) may cover TMS with pre-authorisation.',
    },
    CA: {
        code: 'CA',
        name: 'Canada',
        urlPrefix: 'ca',
        flag: '\u{1F1E8}\u{1F1E6}',
        currency: 'CAD',
        publicHealthSystem: 'Provincial Health Plans (OHIP, MSP, RAMQ)',
        tmsStatus: 'Health Canada approved',
        sessionCostRange: 'CA$200\u2013CA$500',
        seoDescription: 'TMS therapy is Health Canada approved for treatment-resistant depression. Clinics across Ontario, British Columbia, Alberta, and Quebec offer both standard rTMS and BrainsWay Deep TMS protocols.',
        aboutContent: 'Canada has TMS clinics in major cities from coast to coast. While provincial health plans (OHIP, MSP, RAMQ) generally do not cover TMS, some extended employer health benefits may provide partial coverage. Academic centres like MUHC Montreal also offer clinical TMS programs.',
        insuranceNote: 'Provincial health plans do not cover TMS. Some extended employer health insurance plans may partially cover treatment. Most patients pay out of pocket, with some clinics offering payment plans.',
    },
    AU: {
        code: 'AU',
        name: 'Australia',
        urlPrefix: 'au',
        flag: '\u{1F1E6}\u{1F1FA}',
        currency: 'AUD',
        publicHealthSystem: 'Medicare Australia',
        tmsStatus: 'TGA-approved, Medicare-rebated since 2021',
        sessionCostRange: 'A$100\u2013A$300 (after Medicare rebate)',
        seoDescription: 'Australia leads internationally in TMS accessibility \u2014 Medicare rebates have been available since November 2021 for treatment-resistant depression. Clinics across NSW, Victoria, and Queensland offer rTMS and Deep TMS.',
        aboutContent: 'Australia is one of the most accessible countries for TMS therapy, with Medicare rebates available since November 2021 for treatment-resistant depression. This makes TMS significantly more affordable than in most other countries. Major providers include Sydney TMS, NeuroCentrix, neurocare clinics, and Monarch Mental Health Group.',
        insuranceNote: 'Medicare Australia provides rebates for TMS treatment of treatment-resistant depression (MBS item numbers apply). A GP referral and psychiatrist oversight are required. Private health insurance may cover the gap. Out-of-pocket costs are typically A$100\u2013A$300 per session after rebate.',
    },
    DE: {
        code: 'DE',
        name: 'Germany',
        urlPrefix: 'de',
        flag: '\u{1F1E9}\u{1F1EA}',
        currency: 'EUR',
        publicHealthSystem: 'Gesetzliche Krankenversicherung (GKV)',
        tmsStatus: 'CE-marked, available in university hospitals',
        sessionCostRange: '\u20AC150\u2013\u20AC350',
        seoDescription: 'TMS therapy is available at leading university hospitals and private practices across Germany. Statutory health insurance (GKV) may cover treatment in clinical settings for treatment-resistant depression.',
        aboutContent: 'Germany has TMS available primarily through university hospitals (like Charit\u00E9 Berlin) and specialised private practices. The neurocare group, headquartered in Munich, is a major TMS device manufacturer and clinical provider. Statutory health insurance coverage for TMS varies by provider and clinical setting.',
        insuranceNote: 'Statutory health insurance (GKV) may cover rTMS for depression in university hospital settings. Private health insurance (PKV) coverage varies by plan. Many private practices require self-pay.',
    },
    IN: {
        code: 'IN',
        name: 'India',
        urlPrefix: 'in',
        flag: '\u{1F1EE}\u{1F1F3}',
        currency: 'INR',
        publicHealthSystem: 'Government Hospitals',
        tmsStatus: 'Available at government and private institutions',
        sessionCostRange: '\u20B93,000\u2013\u20B95,000 (approx. US$35\u201360)',
        seoDescription: 'TMS therapy is available at premier institutions like NIMHANS Bangalore and growing private clinic networks across Delhi, Bangalore, and other major cities. India offers some of the most affordable TMS treatment globally.',
        aboutContent: 'India has a growing TMS therapy landscape, led by NIMHANS (National Institute of Mental Health and Neuro Sciences) in Bangalore \u2014 one of Asia\'s foremost mental health institutions. Private clinics like Mindful TMS Neurocare operate across multiple cities. TMS treatment in India is significantly more affordable than in Western countries.',
        insuranceNote: 'Government hospitals like NIMHANS offer subsidised rates. Private clinic sessions cost approximately \u20B93,000\u2013\u20B95,000 (US$35\u201360). Most private health insurance plans in India do not yet cover TMS therapy.',
    },
};

export function getCountryMeta(urlPrefix: string): CountryMeta | undefined {
    return Object.values(COUNTRY_META).find(c => c.urlPrefix === urlPrefix);
}

export function getCountryCodeFromPrefix(urlPrefix: string): string | undefined {
    const meta = getCountryMeta(urlPrefix);
    return meta?.code;
}
