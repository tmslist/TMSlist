/**
 * Shared geo-detection utility for TMS List
 * Detects visitor country via:
 *   1. x-country cookie (set by Vercel middleware)
 *   2. Timezone fallback
 *   3. Defaults to US
 */
(function() {
    var COUNTRY_URLS = {
        US: '/us/', GB: '/uk/', CA: '/ca/', AU: '/au/', DE: '/de/', IN: '/in/'
    };
    var COUNTRY_FLAGS = {
        US: '\u{1F1FA}\u{1F1F8}', GB: '\u{1F1EC}\u{1F1E7}', CA: '\u{1F1E8}\u{1F1E6}',
        AU: '\u{1F1E6}\u{1F1FA}', DE: '\u{1F1E9}\u{1F1EA}', IN: '\u{1F1EE}\u{1F1F3}'
    };
    var COUNTRY_NAMES = {
        US: 'United States', GB: 'United Kingdom', CA: 'Canada',
        AU: 'Australia', DE: 'Germany', IN: 'India'
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
            if (tz.startsWith('Europe/London') || tz.startsWith('Europe/Belfast')) return 'GB';
            if (/^America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax|St_Johns|Regina)/.test(tz)) return 'CA';
            if (tz.startsWith('Australia/')) return 'AU';
            if (tz.startsWith('Europe/Berlin') || tz.startsWith('Europe/Munich')) return 'DE';
            if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'IN';
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
