/**
 * Shared geo-detection utility for TMS List — optimized 2026
 * 1. x-country cookie (server-set)
 * 2. Intl.DateTimeFormat timezone fallback
 * 3. Default US
 */
(function() {
    // Static lookup tables — avoid object creation per call
    var U = {
        US:'/us/',GB:'/uk/',CA:'/ca/',AU:'/au/',DE:'/de/',IN:'/in/',FR:'/fr/',JP:'/jp/',KR:'/kr/',BR:'/br/',ES:'/es/',IT:'/it/',NL:'/nl/',SG:'/sg/',AE:'/ae/',NZ:'/nz/',ZA:'/za/',SE:'/se/',IE:'/ie/',IL:'/il/',MX:'/mx/'
    };
    var F = {
        US:'US',GB:'GB',CA:'CA',AU:'AU',DE:'DE',IN:'IN',FR:'FR',JP:'JP',KR:'KR',BR:'BR',ES:'ES',IT:'IT',NL:'NL',SG:'SG',AE:'AE',NZ:'NZ',ZA:'ZA',SE:'SE',IE:'IE',IL:'IL',MX:'MX'
    };
    var N = {
        US:'United States',GB:'United Kingdom',CA:'Canada',AU:'Australia',DE:'Germany',IN:'India',FR:'France',JP:'Japan',KR:'South Korea',BR:'Brazil',ES:'Spain',IT:'Italy',NL:'Netherlands',SG:'Singapore',AE:'United Arab Emirates',NZ:'New Zealand',ZA:'South Africa',SE:'Sweden',IE:'Ireland',IL:'Israel',MX:'Mexico'
    };

    // Fast cookie read
    var c = document.cookie, country = 'US';
    var parts = c.split(';');
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].trim().startsWith('x-country=')) {
            var v = parts[i].trim().substring(10).toUpperCase();
            if (U[v]) { country = v; break; }
        }
    }

    // Timezone fallback if no cookie
    if (country === 'US') {
        try {
            var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            if (/^America\//.test(tz) || /^US\//.test(tz)) country = 'US';
            else if (/^Europe\/London$/.test(tz)) country = 'GB';
            else if (/^Australia\//.test(tz)) country = 'AU';
            else if (/^Europe\/Berlin$/.test(tz) || tz.includes('Munich')) country = 'DE';
            else if (/^Asia\/Kolkata$/.test(tz) || tz.includes('Mumbai')) country = 'IN';
            else if (/^Europe\/Paris$/.test(tz)) country = 'FR';
            else if (/^Asia\/Tokyo$/.test(tz)) country = 'JP';
            else if (/^Asia\/Seoul$/.test(tz)) country = 'KR';
            else if (/^America\/Sao_Paulo$/.test(tz)) country = 'BR';
            else if (/^Europe\/Madrid$/.test(tz)) country = 'ES';
            else if (/^Europe\/Rome$/.test(tz)) country = 'IT';
            else if (/^Europe\/Amsterdam$/.test(tz)) country = 'NL';
            else if (/^Asia\/Singapore$/.test(tz)) country = 'SG';
            else if (/^Asia\/Dubai$/.test(tz)) country = 'AE';
            else if (/^Pacific\/Auckland$/.test(tz)) country = 'NZ';
            else if (/^Africa\/Johannesburg$/.test(tz)) country = 'ZA';
            else if (/^Europe\/Stockholm$/.test(tz)) country = 'SE';
            else if (/^Europe\/Dublin$/.test(tz)) country = 'IE';
            else if (/^Asia\/Jerusalem$/.test(tz)) country = 'IL';
            else if (/^America\/Mexico_City$/.test(tz)) country = 'MX';
            else if (/^America\/(Vancouver|Toronto|Montreal|Halifax)/.test(tz)) country = 'CA';
        } catch(e) {}
    }

    // SSR cookie sync on first visit
    try {
        if (!sessionStorage.getItem('tms_geo_synced')) {
            document.cookie = 'x-country=' + country + '; path=/; max-age=31536000; SameSite=Lax';
            if (country !== 'US') {
                sessionStorage.setItem('tms_geo_synced', '1');
                location.reload();
                return;
            }
        }
    } catch(e) {}

    // Lightweight content toggle
    function updateCountryContent() {
        var cls = document.documentElement.classList;
        cls.add(country === 'US' ? 'country-us' : 'country-' + country.toLowerCase());

        var links = document.querySelectorAll('[data-country-landing]');
        for (var j = 0; j < links.length; j++) links[j].href = U[country] || '/us/';

        var input = document.getElementById('hero-search-input');
        if (input && country !== 'US') input.placeholder = 'City, region, or country...';
        var form = document.getElementById('hero-search-form');
        if (form) form.action = U[country] || '/us/';

        var stateStats = document.querySelectorAll('.stats-states-covered');
        for (var k = 0; k < stateStats.length; k++) {
            stateStats[k].style.display = country !== 'US' ? 'none' : '';
        }
    }

    window.TMS_GEO = {
        country: country,
        url: U[country] || '/us/',
        flag: F[country] || F.US,
        name: N[country] || 'United States',
        detect: function() { return country; }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateCountryContent, { passive: true });
    } else {
        updateCountryContent();
    }
})();
