import { crawlEvents } from "../crawler/eventCrawler.js";

async function main() {
  const events = await crawlEvents();
  console.log(JSON.stringify(events, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});