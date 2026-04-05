import { crawlEvents } from '../crawler/eventCrawler.js';
import type CampusEvent from '../types/event.type.js';
import { getRecommendations } from '../services/recommendations.service.js';
import type { DePauwEvent } from '../types/recommendations.type.js';
import { db } from '../database/configFirestore.js';
import { finalizeDay } from '../services/tasks.service.js';

const crawledEvents: CampusEvent[] = await crawlEvents();
const campusEvents: DePauwEvent[] = crawledEvents.map(event => ({
    id: event.id,
    organizationName: event.organization,
    eventTitle: event.title,
    eventDescription: event.description,
    location: [{name: event.location.name}],
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    tags: event.tags,
}));

const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

const todaysEvents = campusEvents.filter(event => {
    const eventStart = new Date(event.startTime);

    return (eventStart >= todayStart && eventStart <= todayEnd)
});

console.log(`Crawled ${campusEvents.length} events, ${todaysEvents.length} of which are happening today.`);
console.log('Today\'s events:', campusEvents);

const getAllUsers = await db.collection('users').get();
// const allUserIds = getAllUsers.docs.map(doc => doc.id);
const allUserIds = ['test-user-finalize-job']; // TODO: replace with actual user IDs from Firestore

const today = new Date().toISOString().split('T')[0];
// Use date arithmetic to avoid DST edge cases
const prevDayDate = new Date();
prevDayDate.setDate(prevDayDate.getDate() - 1);
const prevDay = prevDayDate.toISOString().split('T')[0]!;

for (const userId of allUserIds) {
    console.log(`Processing recommendations for user ${userId} on ${today}`);
    console.log(`Finalizing previous day (${prevDay}) tasks for user ${userId}...`);

    try {
        await finalizeDay(userId, prevDay);
    } catch (err) {
        console.error(`Failed to finalize day for user ${userId}:`, err);
        continue;
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
        console.error(`No data found for user ${userId}`);
        continue;
    }

    const userGoals: string[] = userData.goals || [];

    const recommendationsCollection = await getRecommendations({
        campusEvents: todaysEvents,
        calendarEventsTime: [], // TODO: fetch actual calendar events for the user
        userGoals,
    });

    console.log(`Fetched recommendations for user ${userId} on ${today}:`, recommendationsCollection);

    if (!recommendationsCollection) {
        console.error(`Failed to get recommendations for user ${userId}`);
        continue;
    }

    console.log(`Storing recommendations for user ${userId}...`);

    try {
        await db.collection(`users/${userId}/recommendations`)
            .doc(recommendationsCollection.date).set({...recommendationsCollection});
    } catch (err) {
        console.error(`Failed to store recommendations for user ${userId}:`, err);
    }
}
