"use strict";

const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const moment = require("moment");

const log = console.log;

// THIS HERE IS THE CREDENTIALS OF THE CLIENT WHICH IN THIS CASE IS PROJECT-YZ

const scopes = ["https://www.googleapis.com/auth/calendar"];

//this token.json file will be created automatically when the OAuth flow finishes for the first time. this json file stores the user's access and refresh token
const TOKEN_PATH = "token.json";

const CLIENT_CREDENTIAL_PATH = __dirname + "/credentials/new_credentials.json";

function getOAuthClient() {
  fs.readFile(CLIENT_CREDENTIAL_PATH, (err, client) => {
    if (err)
      return console.error("Failed to read the client credentials path", err);
    // here i could also pass an call back to read the events
    authorize(JSON.parse(client), events);
  });
}

// everything starts from here.
getOAuthClient();

function authorize(credentials, callback) {
  const { client_id, client_secret, redirect_uris } = credentials;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // check if we had previously stored any token in token.json file
  fs.readFile(TOKEN_PATH, (err, token) => {
    // get access_token if no token.json file.
    if (err) return getAccessToken(oAuth2Client, callback);

    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  console.log("Authorize this application by visiting this url: ", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        log("Token stored in a safe location !!");
      });

      callback(oAuth2Client);
    });
  });
}

const eventStartTime = moment().add(3, "day").toDate();
const eventEndTime = moment().add(3, "day").add(45, "minutes").toDate();
const timeZone = "UTC+05:30";
const event = {
  summary: "Lunch with Shiela !!",
  location:
    "M-39, Shankar Market, Block M, Connaught Place, New Delhi, Delhi 110001",
  description: "meet with shiela and celebrate here new promotion",
  colorId: 4,
  start: {
    dateTime: eventStartTime,
    timeZone,
  },

  end: {
    dateTime: eventEndTime,
    timeZone,
  },
};

//  THIS FUNCTION CREATES AN EVENT and list dow the events
function events(auth) {
  const calendar = google.calendar({ version: "v3", auth });

  calendar.freebusy.query(
    {
      resource: {
        timeMin: eventStartTime,
        timeMax: eventEndTime,
        timeZone,
        items: [{ id: "primary" }],
      },
    },
    (err, res) => {
      if (err) return console.error("Free Busy Query Error: ", err);

      const eventArr = res.data.calendars.primary.busy;

      if (eventArr.length === 0) {
        calendar.events.insert(
          {
            auth,
            calendarId: "primary",
            resource: event,
          },
          (err) => {
            if (err) return console.error(err);
            return log("Event created successfully !!");
          }
        );
      } else {
        log("Sorry, Events already exists !! \n");
        calendar.events.list(
          {
            calendarId: "primary",
            timeMin: moment().startOf().toDate(),
            maxResults: 10,
            singleEvents: true,
            orderBy: "startTime",
          },
          (err, list) => {
            if (err) return console.error("The API returned an error !!", err);
            if (list.data.items.length) {
              log("Upcomming 10 events");
              list.data.items.forEach((event) => {
                const start = event.start.dateTime || event.start.date;
                log(`${start} - ${event.summary}`);
              });
            } else {
              log("No upcomming events !!");
            }
          }
        );
      }
    }
  );

  // also check that whether this timeframe has already some event or not
  // if yes than cancel the cvent
}

/**
 * OLD EVENT
 * {
        summary: "This is just a Test event",
        description: "Since this is an API integration, so shut the fuck up.",
        start: {
          dateTime: moment().toDate(),
          timeZone: "utc",
        },
        end: {
          dateTime: moment().add(1, "hour").toDate(),
          timeZone: "utc",
        },

        attendees: [],
        reminders: {
          useDefault: false,
          overides: [
            {
              method: "email",
              minutes: 24 * 60,
            },
            {
              method: "popup",
              minutes: 1,
            },
          ],
        },

        colorId: 4,
      }
 */
