// types/Event.ts

export interface EventLocation {
  name: string;        // e.g. "Harrison Hall 102"
  address?: string;    // e.g. "204 E Seminary St, Greencastle, Indiana"
}

export default interface CampusEvent {
  id: string;               // extracted from URL: /engage/event/{id}
  sourceUrl: string;        // full Engage page URL
  title: string;
  description: string;
  organization: string;    // not always cleanly labeled on the page
  location: EventLocation;
  startTime: Date;
  endTime: Date;           // both examples have it, but treat as optional
  imageUrl: string;        // cover image on the event page
  tags: string[];          // Engage has categories, but may not be in HTML
  contactEmail?: string;    // only sometimes listed under Additional Information
  fetchedAt: Date;          // timestamp of when the crawler grabbed this
}