import type { Clinic } from "../types/clinic";
import { getClinicPhoto, getClinicRating, getClinicReviewCount } from "./dataHelpers";

export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.item
        }))
    });
}

export function generateMedicalClinicListSchema(
    clinics: Clinic[],
    listName: string,
    description: string
) {
    // We limit to top 10 to avoid bloating the HTML too much
    const topClinics = clinics.slice(0, 10);

    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": listName,
        "description": description,
        "itemListElement": topClinics.map((clinic, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "MedicalClinic",
                "name": clinic.name,
                "image": getClinicPhoto(clinic),
                "url": clinic.website, // Or the internal clinic page if we had one
                "telephone": clinic.phone,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": clinic.address, // street is in 'address' field
                    "addressLocality": clinic.city,
                    "addressRegion": clinic.state,
                    "postalCode": clinic.zip,
                    "addressCountry": "US"
                },
                "aggregateRating": getClinicRating(clinic) > 0 ? {
                    "@type": "AggregateRating",
                    "ratingValue": getClinicRating(clinic),
                    "reviewCount": getClinicReviewCount(clinic),
                    "bestRating": "5",
                    "worstRating": "1"
                } : undefined,
                "priceRange": "$$", // Default for specialist
                "medicalSpecialty": "Psychiatry"
            }
        }))
    });
}

export function generateLocalBusinessSchema(clinic: Clinic) {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "name": clinic.name,
        "image": getClinicPhoto(clinic),
        "url": clinic.website,
        "telephone": clinic.phone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": clinic.address,
            "addressLocality": clinic.city,
            "addressRegion": clinic.state,
            "postalCode": clinic.zip,
            "addressCountry": "US"
        },
        "geo": clinic.geo ? {
            "@type": "GeoCoordinates",
            "latitude": clinic.geo.lat,
            "longitude": clinic.geo.lng
        } : undefined,
        "aggregateRating": getClinicRating(clinic) > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": getClinicRating(clinic),
            "reviewCount": getClinicReviewCount(clinic),
            "bestRating": "5",
            "worstRating": "1"
        } : undefined,
        "medicalSpecialty": "Psychiatry"
    });
}
