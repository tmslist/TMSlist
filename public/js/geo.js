/**
 * Shared geo-detection utility for TMS List
 * Detects visitor country via:
 *   1. x-country cookie (set by Vercel middleware)
 *   2. Timezone fallback
 *   3. Defaults to US
 */
(function() {
    var COUNTRY_URLS = {
        US: '/us/', GB: '/uk/', CA: '/ca/', AU: '/au/', DE: '/de/',
        IN: '/in/', FR: '/fr/', JP: '/jp/', KR: '/kr/', BR: '/br/',
        ES: '/es/', IT: '/it/', NL: '/nl/', SG: '/sg/', AE: '/ae/',
        NZ: '/nz/', ZA: '/za/', SE: '/se/', IE: '/ie/', IL: '/il/', MX: '/mx/'
    };
    var COUNTRY_FLAGS = {
        US: '\u{1F1FA}\u{1F1F8}', GB: '\u{1F1EC}\u{1F1E7}', CA: '\u{1F1E8}\u{1F1E6}',
        AU: '\u{1F1E6}\u{1F1FA}', DE: '\u{1F1E9}\u{1F1EA}', IN: '\u{1F1EE}\u{1F1F3}',
        FR: '\u{1F1EB}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}', KR: '\u{1F1F0}\u{1F1F7}',
        BR: '\u{1F1E7}\u{1F1F7}', ES: '\u{1F1EA}\u{1F1F8}', IT: '\u{1F1EE}\u{1F1F9}',
        NL: '\u{1F1F3}\u{1F1F1}', SG: '\u{1F1F8}\u{1F1EC}', AE: '\u{1F1E6}\u{1F1EA}',
        NZ: '\u{1F1F3}\u{1F1FF}', ZA: '\u{1F1FF}\u{1F1E6}', SE: '\u{1F1F8}\u{1F1EA}',
        IE: '\u{1F1EE}\u{1F1EA}', IL: '\u{1F1EE}\u{1F1F1}', MX: '\u{1F1F2}\u{1F1FD}'
    };
    var COUNTRY_NAMES = {
        US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
        DE: 'Germany', IN: 'India', FR: 'France', JP: 'Japan', KR: 'South Korea',
        BR: 'Brazil', ES: 'Spain', IT: 'Italy', NL: 'Netherlands', SG: 'Singapore',
        AE: 'United Arab Emirates', NZ: 'New Zealand', ZA: 'South Africa',
        SE: 'Sweden', IE: 'Ireland', IL: 'Israel', MX: 'Mexico'
    };

    function detectCountry() {
        // 1. Check cookie set by Vercel middleware
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.startsWith('x-country=')) {
                var val = c.substring(10).toUpperCase();
                if (COUNTRY_URLS[val]) return val;
            }
        }
        // 2. Timezone fallback
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            // UK
            if (tz.startsWith('Europe/London') || tz.startsWith('Europe/Belfast')) return 'GB';
            // Canada
            if (/^America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Ottawa|Calgary)/.test(tz)) return 'CA';
            // Australia
            if (tz.startsWith('Australia/')) return 'AU';
            // Germany
            if (tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Munich') || tz.startsWith('Europe/Frankfurt')) return 'DE';
            // India
            if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta') || tz.startsWith('Asia/Delhi') || tz.startsWith('Asia/Mumbai')) return 'IN';
            // France
            if (tz.startsWith('Europe/Paris') || tz.startsWith('Europe/Marseille') || tz.startsWith('Europe/Lyon')) return 'FR';
            // Japan
            if (tz.startsWith('Asia/Tokyo')) return 'JP';
            // South Korea
            if (tz.startsWith('Asia/Seoul')) return 'KR';
            // Brazil
            if (tz.startsWith('America/Sao_Paulo') || tz.startsWith('America/Rio_Branco') || tz.startsWith('America/Manaus')) return 'BR';
            // Spain
            if (tz.startsWith('Europe/Madrid') || tz.startsWith('Europe/Barcelona')) return 'ES';
            // Italy
            if (tz.startsWith('Europe/Rome') || tz.startsWith('Europe/Milan')) return 'IT';
            // Netherlands
            if (tz.startsWith('Europe/Amsterdam')) return 'NL';
            // Singapore
            if (tz.startsWith('Asia/Singapore')) return 'SG';
            // UAE
            if (tz.startsWith('Asia/Dubai') || tz.startsWith('Asia/Muscat')) return 'AE';
            // New Zealand
            if (tz.startsWith('Pacific/Auckland') || tz.startsWith('Pacific/Wellington')) return 'NZ';
            // South Africa
            if (tz.startsWith('Africa/Johannesburg') || tz.startsWith('Africa/Cape_Town') || tz.startsWith('Africa/Pretoria')) return 'ZA';
            // Sweden
            if (tz.startsWith('Europe/Stockholm')) return 'SE';
            // Ireland
            if (tz.startsWith('Europe/Dublin')) return 'IE';
            // Israel
            if (tz.startsWith('Asia/Jerusalem') || tz.startsWith('Asia/Tel_Aviv')) return 'IL';
            // Mexico
            if (tz.startsWith('America/Mexico_City') || tz.startsWith('America/Monterrey') || tz.startsWith('America/Guadalajara')) return 'MX';
            // US (catch-all for other America/ and US/ timezones)
            if (tz.startsWith('America/') || tz.startsWith('US/')) return 'US';
        } catch (e) {}
        // 3. Default
        return 'US';
    }

    // Run detection once and cache
    var detected = detectCountry();

    // Update all links with href="/us/" to point to the detected country
    function updateGeoLinks() {
        if (COUNTRY_URLS[detected] && detected !== 'US') {
            document.querySelectorAll('a[href="/us/"]').forEach(function(el) {
                el.href = COUNTRY_URLS[detected];
            });
        }
    }

    // Expose globally
    window.TMS_GEO = {
        country: detected,
        url: COUNTRY_URLS[detected] || '/us/',
        flag: COUNTRY_FLAGS[detected] || COUNTRY_FLAGS['US'],
        name: COUNTRY_NAMES[detected] || 'United States',
        urls: COUNTRY_URLS,
        flags: COUNTRY_FLAGS,
        names: COUNTRY_NAMES,
        detect: detectCountry,
        updateLinks: updateGeoLinks
    };

    // Auto-update links when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateGeoLinks);
    } else {
        updateGeoLinks();
    }
})();
