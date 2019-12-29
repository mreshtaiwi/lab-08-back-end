'use strict';
//DOTENV read our envieronment variables 
require('dotenv').config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => { throw error; });
//express server
//express does all the headers (envelope stuff)
const express = require('express');
//who can touch our server 
const cors = require('cors');
const superagent = require('superagent');
const PORT = process.env.PORT;
const server = express();
server.use(cors());

client.connect()
  .then(() => {
    server.listen(process.env.PORT, () => console.log('server on and listen to port ', process.env.PORT));
  });


server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/events', eventsHandler);
// server.get('/yelp', yelpHandler);
//server.use('*', notFoundHandler);
//server.use(errorHandler);

function yelpHandler(request, response) {
  let city = request.query.search_query;
  let lat = request.query['latitude'];
  let lon = request.query['longitude'];
  // console.log(request.query);
  getYelpData(city, lat, lon)
    .then((data) => {
      response.status(200).send(data);
    });
}

function getYelpData(city, lat, lon) {
  const url = `https://api.yelp.com/v3/businesses/search?term=delis&latitude=37.786882&longitude=-122.399972`;
  return superagent.get(url)
    .then((yelpData) => {
      let me = yelpData.body;
      console.log(me);
      let yelp = yelpData.businesses.map((day) => new Yelp(day));
      //console.log(yelp);
      return yelp;
    });
}

function Yelp(day) {
  this.name = day.businesses.name;
  this.link = day.businesses.url;
  this.image = day.businesses.image_url;
}

function eventsHandler(request, response) {
  let city = request.query.search_query;
  let lat = request.query['latitude'];
  let lng = request.query['longitude'];
  getEventsData(city, lat, lng)
    .then((data) => {
      response.status(200).send(data);
    });

}

function getEventsData(city, lat, lng) {
  const url = `http://api.eventful.com/json/events/search?app_key=${process.env.EVENTFUL_API_KEY}&q=${city}&${lat},${lng}`;
  return superagent.get(url)
    .then((eventData) => {
      let datafile = eventData.text;
      let jsonfile = JSON.parse(datafile);
      //console.log(jsonfile.events);
      let events = jsonfile.events.event.map((day) => new Event(day));
      return events;
    });
}

function Event(day) {
  this.link = day.url;
  this.name = day.city_name;
  this.eventDate = day.start_time;
  this.summary = day.description;
}



function locationHandler(request, response) {
  let city = request.query.city;//the name city is from the query link 
  //http://localhost:3000/location?city=amman
  //console.log(city);
  // if(sql){
  //   console.log('there is data');
  // }else{
  //   console.log('no data');
  // }
  // .then((data) => {
  getLocation(city,request, response);
      // let sql = `SELECT * FROM locations WHERE search_query = '${city}';`;
      // return superagent.get(sql)
      // .then( (data)=> {
      // console.log('******************',data);
        
      // response.status(200).json(data);
      // });
    // });
  // });
}

function getLocation(city,request, response) {
  let sql = `SELECT * FROM locations WHERE search_query = '${city}';`;
  client.query(sql)
    .then( (data) => {
      if (data.rows.length === 0) {
        //console.log('data is not in database',data);
        // return data.rows[0];
        const url = `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATIONIQ_API}&city=${city}&format=json`;
        return superagent.get(url)
          .then(data => {
            let sql = `INSERT INTO locations(formatted_query,lat,lon,search_query) VALUES('${data.body[0].display_name}','${data.body[0].lat}','${data.body[0].lon}','${city}');`;
            client.query(sql)
              .then( (data) => {
                console.log(data.rows[0]);
                response.status(200).json(data.rows[0]);
                //return new Location(data.body[0]);
              });
          });
      } else {
        response.status(200).json(data.rows[0]);
        // console.log('data in database',data.rows[0]);
       //return data.rows[0];
      // return new Location(data.body[0]);
      }
    });
}
function Location(data) {
  this.search_query = data.rows[0].search_query;
  this.display_names = data.rows[0].display_name;
  this.lat = data.rows[0].lat;
  this.lon = data.rows[0].lon;
}
// function weatherHandlerTester(request,response) {
//     //http://localhost:3000/weather
//     let weatherData = require('./data/darksky.json');
//     let weather = weatherData.daily.data;
//     let result = weather.map(day => {
//         return new Weather(day);
//     });
//     response.status(200).json(result);
// }
function weatherHandler(request, response) {
  let city = request.query;//will read the req query
  // console.log('the query is' , city);
  let lat = request.query.latitude;
  let lon = request.query.longitude;
  // console.log('lat is ' ,lat);
  // console.log('lon is ', lon);
  //http://localhost:3000/weather?search_query=amman&latitude=31.9515694&longitude=35.9239625
  //http://localhost:3000/weather?
  // let lat = request.query;
  // let lon = request.query;
  // console.log('lat is ',lat);
  // console.log('lon is',lon);
  getWeather(lat, lon)
    .then(weatherData => {
      response.status(200).json(weatherData);
    });
}
function getWeather(lat, lon) {
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${lat},${lon}`;
  return superagent.get(url)
    .then(data => {
      let weather = data.body;
      // console.log(weather);
      return weather.daily.data.map(day => {
        // console.log(day);
        return new Weather(day);
      });
    });
}
function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}
server.get('/', (request, response) => {
  response.status(200).send('you did it man');
});

server.get('/any', (request, response) => {
  throw new Error('any page nothing is her');
});

server.use('*', (request, response) => {
  response.status(404).send('Sorry, something went wrong');
});

server.use((error, request, response) => {
  response.status(500).send(error);
});

// client.connect()
// .then( () => {
//   server.listen(PORT, () => {
//     console.log('server is listening on ', PORT);
//   });
// });
