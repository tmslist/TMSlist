/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        geoCountry: string;
    }
}

interface Window {
    posthog?: import('posthog-js').PostHog;
}
