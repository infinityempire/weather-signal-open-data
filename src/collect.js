// Product design: deterministic weekly collector for official AI and cloud service-status feeds.
import { runCollection } from './status.js';

runCollection().then((snapshot) => console.info(JSON.stringify({ status: 'stored', timestamp: snapshot.timestamp, providers: snapshot.providers.length, posture: snapshot.portfolio.label }))).catch((error) => { console.error(error); process.exit(1); });
