"use strict";

const log = console.log;
const { google } = require("googleapis");
const fs = require("fs");

const moment = require("moment");

const scopes = ["https://www.googleapis.com/auth/calendar"];

const credential_path =
  __dirname + "/credentials/calendar-wthout-oauth2-2e6fedc49c7d.json";

(async function () {
  const client = await google.auth.getClient({
    keyFile: credential_path,
    scopes,
  });

  client.subject =
    "project-yz-service@calendar-wthout-oauth2.iam.gserviceaccount.com";

  const calendar = google.calendar({ version: "v3", auth: client });

  const timeZone = "UTC+05:30";

  calendar.events.insert(
    {
      calendarId: "primary",
      resource: {
        start: {
          dateTime: moment().add(1, "day").toDate(),
          timeZone,
        },
        end: {
          dateTime: moment().add(2, "day").toDate(),
          timeZone,
        },
        summary: "Test event",
        status: "confirmed",
        description: "Test description",
      },
    },
    (err, event) => {
      if (err) console.log("Error", err);
      log(event.data);
    }
  );
})();
