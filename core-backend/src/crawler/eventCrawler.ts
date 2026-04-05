import axios from "axios";
import type CampusEvent from "../types/event.type.js";

const BASE_URL = "https://depauw.campuslabs.com/engage/api/discovery/event/search";
const PAGE_SIZE = 15;

interface EngageEventRaw {
  id: string;
  name: string;
  description: string;
  location: string;
  organizationName: string;
  startsOn: string;
  endsOn: string;
  imagePath: string | null;
  theme: string;
  categoryNames: string[];
  benefitNames: string[];
  latitude: string | null;
  longitude: string | null;
}

interface EngageResponse {
  value: EngageEventRaw[];
  "@odata.count": number;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function toEvent(raw: EngageEventRaw): CampusEvent {
  const event: CampusEvent = {
    id: raw.id,
    sourceUrl: `https://depauw.campuslabs.com/engage/event/${raw.id}`,
    title: raw.name,
    description: stripHtml(raw.description ?? ""),
    organization: raw.organizationName,
    location: { name: raw.location },
    startTime: new Date(raw.startsOn),
    endTime: new Date(raw.endsOn),
    tags: [...(raw.categoryNames ?? []), ...(raw.benefitNames ?? []), raw.theme].filter(Boolean),
    fetchedAt: new Date(),
  };

  if (raw.imagePath) {
    event.imageUrl = raw.imagePath;
  }

  return event;
}

function getTodayAndTomorrowBounds(): { start: Date; end: Date } {
  const now = new Date();

  // Start of today (midnight)
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  // End of tomorrow (11:59:59 PM)
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function crawlEvents(): Promise<CampusEvent[]> {
  const { start, end } = getTodayAndTomorrowBounds();
  const allEvents: CampusEvent[] = [];
  let skip = 0;

  while (true) {
    const { data } = await axios.get<EngageResponse>(BASE_URL, {
      params: {
        endsAfter: start.toISOString(),   // only events that haven't ended yet today
        orderByField: "endsOn",
        orderByDirection: "ascending",
        status: "Approved",
        take: PAGE_SIZE,
        skip,
        query: "",
      },
    });

    if (data.value.length === 0) break;

    // for (const raw of data.value) {
    //   const eventStart = new Date(raw.startsOn);

    //   // Stop paginating — events are sorted by endsOn ascending,
    //   // so once we pass tomorrow we're done
    //   if (eventStart > end) {
    //     console.log(`Stopping at "${raw.name}" — starts after tomorrow`);
    //     return allEvents;
    //   }

    //   allEvents.push(toEvent(raw));
    // }
    for (const raw of data.value) {
      const eventStart = new Date(raw.startsOn);

      // Skip events that started before today
      if (eventStart < start) continue;

      // Stop paginating — once we're past tomorrow, we're done
      if (eventStart > end) {
        console.log(`Crawled ${allEvents.length} events for today and tomorrow`);
        allEvents.sort((a,b) => a.startTime.getTime() - b.startTime.getTime())
        allEvents.forEach(event => console.log(event.title));
        console.log(`Stopping at "${raw.name}" — starts after tomorrow`);
        return allEvents;
      }

      allEvents.push(toEvent(raw));
    }

    skip += PAGE_SIZE;
  }
  allEvents.sort((a,b) => a.startTime.getTime() - b.startTime.getTime())
  allEvents.forEach(event => console.log(event.title));
  console.log(`Crawled ${allEvents.length} events for today and tomorrow`);
  return allEvents;
}