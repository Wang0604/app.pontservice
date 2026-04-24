import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'pontai',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
