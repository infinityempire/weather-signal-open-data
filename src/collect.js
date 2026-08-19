import { runCollection } from './nws.js';

runCollection().then((snapshot) => console.info(JSON.stringify({ status: 'stored', timestamp: snapshot.timestamp, locations: snapshot.locations.length }))).catch((error) => { console.error(error); process.exit(1); });
