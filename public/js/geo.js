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
            // Canada — all valid Canadian IANA timezones (province/territory-level)
            if (tz.startsWith('America/Vancouver') || tz.startsWith('America/Dawson') || tz.startsWith('America/Dawson_Creek') || tz.startsWith('America/Fort_Nelson') || tz.startsWith('America/Edmonton') || tz.startsWith('America/Calgary') || tz.startsWith('America/Regina') || tz.startsWith('America/Swift_Current') || tz.startsWith('America/Winnipeg') || tz.startsWith('America/Toronto') || tz.startsWith('America/Montreal') || tz.startsWith('America/Iqaluit') || tz.startsWith('America/Rankin_Inlet') || tz.startsWith('America/Resolute') || tz.startsWith('America/Pangnirtung') || tz.startsWith('America/Nipigon') || tz.startsWith('America/Thunder_Bay') || tz.startsWith('America/Halifax') || tz.startsWith('America/Glace_Bay') || tz.startsWith('America/Goose_Bay') || tz.startsWith('America/Moncton') || tz.startsWith('America/St_Johns') || tz.startsWith('America/Yellowknife') || tz.startsWith('America/Whitehorse') || tz.startsWith('America/Inuvik') || tz.startsWith('America/Creston')) return 'CA';
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

    // ── First-load cookie sync ──
    // If timezone detected a non-US country but no x-country cookie exists yet
    // (typical on localhost / non-Vercel hosts where the middleware can't set
    // it from a header), persist the cookie and reload ONCE so SSR pages
    // re-render with the visitor's actual country instead of the US default.
    // sessionStorage guards against loops if reload doesn't take effect.
    function hasCountryCookie() {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].trim().startsWith('x-country=')) return true;
        }
        return false;
    }
    try {
        var alreadySynced = sessionStorage.getItem('tms_geo_synced') === '1';
        if (!alreadySynced && detected && !hasCountryCookie()) {
            // Persist for SSR
            document.cookie = 'x-country=' + detected + '; path=/; max-age=' + (60 * 60 * 24 * 365) + '; SameSite=Lax';
            sessionStorage.setItem('tms_geo_synced', '1');
            // Only reload if we actually changed the effective country (non-US default)
            // and we're on a page whose content depends on the cookie.
            if (detected !== 'US') {
                location.reload();
                return;
            }
        }
    } catch (e) { /* sessionStorage blocked — fall through to client-side toggling */ }

    // Update all links with href="/us/" to point to the detected country
    function updateGeoLinks() {
        if (COUNTRY_URLS[detected] && detected !== 'US') {
            document.querySelectorAll('a[href="/us/"]').forEach(function(el) {
                el.href = COUNTRY_URLS[detected];
            });
        }
    }

    // Toggle content sections based on detected country
    function switchContentCountry() {
        var country = detected;

        // 1. Toggle featured clinics by country
        document.querySelectorAll('[data-clinic-country]').forEach(function(el) {
            if (el.getAttribute('data-clinic-country') === country) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // 1b. Toggle generic [data-country] elements (footer locations, directory blocks, etc.).
        // Use a CSS-attribute selector that excludes the more specific [data-clinic-country]
        // and [data-quick-links-country] attributes so we don't double-toggle them here.
        document.querySelectorAll('[data-country]:not([data-clinic-country]):not([data-quick-links-country])').forEach(function(el) {
            if (el.getAttribute('data-country') === country) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // 2. Toggle specialist grids by country
        document.querySelectorAll('.specialist-country-grid').forEach(function(el) {
            if (el.getAttribute('data-country') === country) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // 3. Toggle "View All Clinics" links — redirect non-US to their country landing
        document.querySelectorAll('[data-country-landing]').forEach(function(el) {
            el.href = COUNTRY_URLS[country] || '/us/';
        });

        // 4. Toggle quick links sections by country (US = state links, others = region links)
        document.querySelectorAll('[data-quick-links-country]').forEach(function(el) {
            if (el.getAttribute('data-quick-links-country') === country) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // 5. Update search placeholder for non-US
        if (country !== 'US') {
            var searchInput = document.getElementById('hero-search-input');
            if (searchInput) {
                searchInput.placeholder = 'City, region, or country...';
            }
            // Change search form action to country-specific
            var searchForm = document.getElementById('hero-search-form');
            if (searchForm) {
                searchForm.action = COUNTRY_URLS[country] || '/us/';
            }
        }

        // 6. Toggle stats sections for non-US (hide "States Covered", show "Regions")
        if (country !== 'US') {
            document.querySelectorAll('.stats-states-covered').forEach(function(el) {
                el.classList.add('hidden');
            });
            document.querySelectorAll('.stats-regions-covered').forEach(function(el) {
                el.classList.remove('hidden');
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
        updateLinks: updateGeoLinks,
        switchContent: switchContentCountry
    };

    // Auto-update links when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateGeoLinks();
            switchContentCountry();
        });
    } else {
        updateGeoLinks();
        switchContentCountry();
    }
})();
