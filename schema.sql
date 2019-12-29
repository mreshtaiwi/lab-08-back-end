DROP TABLE IF EXISTS locations;

CREATE TABLE locations
(
    id SERIAL PRIMARY KEY,
    formatted_query VARCHAR(255),
    lat VARCHAR(255),
    lon VARCHAR(255),
    search_query VARCHAR(255)
);

DROP TABLE IF EXISTS weather;

CREATE TABLE weather
(
    id SERIAL PRIMARY KEY,
    thetime VARCHAR(255),
    forecast VARCHAR(255)
);

DROP TABLE IF EXISTS events;

CREATE TABLE events
(
    id SERIAL PRIMARY KEY,
    link VARCHAR(255),
    thename VARCHAR(255),
    event_date VARCHAR(255),
    summary VARCHAR(255)
);