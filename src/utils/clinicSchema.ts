export function generateClinicSchema(clinic: any, doctors: any[], reviews: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": clinic.name,
    "description": clinic.description,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": clinic.address,
      "addressLocality": clinic.city,
      "addressRegion": clinic.state,
      "postalCode": clinic.zip,
      "addressCountry": clinic.country,
    },
    "telephone": clinic.phone,
    "url": clinic.website,
    "geo": clinic.lat && clinic.lng ? {
      "@type": "GeoCoordinates",
      "latitude": clinic.lat,
      "longitude": clinic.lng,
    } : undefined,
    "openingHours": clinic.openingHours,
    "aggregateRating": Number(clinic.ratingAvg) > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": clinic.ratingAvg,
      "reviewCount": clinic.reviewCount,
      "bestRating": 5,
      "worstRating": 1,
    } : undefined,
    "review": reviews?.slice(0, 5).map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.userName },
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
      "reviewBody": r.body,
      "datePublished": r.createdAt,
    })),
    "medicalSpecialty": "Psychiatry",
    "availableService": {
      "@type": "MedicalTherapy",
      "name": "Transcranial Magnetic Stimulation (TMS)",
      "description": "Non-invasive brain stimulation therapy",
    },
    "employee": doctors?.map(d => ({
      "@type": "Physician",
      "name": d.name,
      "jobTitle": d.title || d.credential,
      "description": d.bio,
    })),
    "image": clinic.media?.hero_image_url || clinic.media?.logo_url,
    "priceRange": clinic.pricing?.price_range === 'budget' ? '$' : clinic.pricing?.price_range === 'moderate' ? '$$' : '$$$',
  };
}

export function generateDoctorSchema(doctor: any, clinic: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctor.name,
    "description": doctor.bio,
    "image": doctor.imageUrl,
    "jobTitle": doctor.title || doctor.credential,
    "medicalSpecialty": "Psychiatry",
    "worksFor": {
      "@type": "MedicalClinic",
      "name": clinic.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": clinic.city,
        "addressRegion": clinic.state,
      },
    },
    "alumniOf": doctor.school ? { "@type": "EducationalOrganization", "name": doctor.school } : undefined,
  };
}
