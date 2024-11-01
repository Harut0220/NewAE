import cron from "node-cron";
import NotificationService from "../services/NotificationService.js";
import EventService from "../services/EventService.js";
import moment from "moment";


//45
cron.schedule('*/10 * * * *', () => {
  let NotifService = new NotificationService()

  let nowDate = new Date().getTime();

  NotifService.cronByDate(nowDate);

});

cron.schedule('0 0 */15 * * *', () => {
  const EventServ = new EventService();
    EventServ.changeSituation();

});

cron.schedule('0 0-23/1 * * *', () => {
  const EventServ = new EventService();
  EventServ.sendEventNotif()
});

// Schedule a cron job to run every 1 hour   '0 * * * *'
// every 5 minute   */5 * * * *
cron.schedule('0 * * * *', () => {
  const EventServ = new EventService();
  EventServ.sendCreateEventNotif()
});

export default cron;