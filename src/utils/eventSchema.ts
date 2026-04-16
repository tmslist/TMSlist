// Event Schema for TMS Webinars and Educational Events

export function generateEventSchema(params: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    location?: string;
    url?: string;
    performer?: string;
    eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventCancelled' | 'EventMovedOnline';
    eventAttendanceMode?: 'OnlineEvent' | 'OfflineEvent' | 'MixedEvent';
}) {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": params.name,
        "description": params.description,
        "startDate": params.startDate,
        "endDate": params.endDate || params.startDate,
        "eventStatus": params.eventStatus || "EventScheduled",
        "eventAttendanceMode": params.eventAttendanceMode || "OnlineEvent",
        "location": {
            "@type": params.eventAttendanceMode === "OnlineEvent" ? "VirtualLocation" : "Place",
            "name": params.location || "Online",
            "url": params.url || "https://tmslist.com/webinars/",
        },
        "performer": {
            "@type": "Organization",
            "name": params.performer || "TMS List",
            "url": "https://tmslist.com",
        },
        "organizer": {
            "@type": "Organization",
            "name": "TMS List",
            "url": "https://tmslist.com",
        },
        "publisher": {
            "@type": "Organization",
            "name": "TMS List",
            "url": "https://tmslist.com",
            "logo": {
                "@type": "ImageObject",
                "url": "https://tmslist.com/logotmslist.png",
            },
        },
        "image": "https://tmslist.com/images/tms_diagram.jpg",
        "inLanguage": "en-US",
        "isAccessibleForFree": true,
        "keywords": "TMS therapy, transcranial magnetic stimulation, mental health, depression treatment, webinar",
    });
}

// Default placeholder event schema for homepage/about page
export function generateWebinarEventSchema() {
    return generateEventSchema({
        name: "TMS Education Webinar Series",
        description: "Free educational webinars on transcranial magnetic stimulation (TMS) therapy — covering treatment mechanisms, candidacy criteria, insurance navigation, and clinical outcomes. Hosted by TMS List in partnership with certified TMS providers.",
        startDate: "2026-05-01T18:00:00-07:00",
        endDate: "2026-05-01T19:30:00-07:00",
        location: "Online (Zoom)",
        url: "https://tmslist.com/webinars/tms-education-series/",
        performer: "TMS List",
        eventStatus: "EventScheduled",
        eventAttendanceMode: "OnlineEvent",
    });
}