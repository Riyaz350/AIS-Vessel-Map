# Architecture
 
## System Overview
[AIS Feed] --TCP--> [Node/Express backend]
                         |--> decodes AIVDM sentences (ggencoder)
                         |--> upserts vessel by MMSI (MongoDB)
                         |--> emits update over Socket.IO
                         |--> serves REST API
                                   |
                                   v
                        [React frontend, Leaflet map]
 
## Database Schema (Vessel)
| Field       | Type   | Notes                            |
|-------------|--------|-----------------------------------|
| mmsi        | Number | unique index, primary identifier |
| name        | String | optional, from static messages    |
| lat / lon   | Number | required, latest position         |
| sog         | Number | speed over ground (knots)         |
| cog         | Number | course over ground (degrees)      |
| heading     | Number | true heading (degrees)            |
| vesselType  | Number | AIS ship/cargo type code           |
| lastUpdated | Date   | timestamp of last position         |
 
One document per vessel (upsert on mmsi) rather than one document
per message, so lookups and duplicate handling stay O(1) and the
collection doesn't grow unbounded over a long-running feed.
 
## API Design Decisions
REST for on-demand/current-state reads (GET /api/vessels,
GET /api/vessels/:mmsi); Socket.IO for push updates so the map
doesn't need to poll. On connect, the socket sends a full
'vessel:snapshot' so the map isn't empty while waiting for the
next live message, then incremental 'vessel:update' events after.
 
## NMEA/AIVDM Decoding
Raw TCP bytes are buffered and split into complete newline-
terminated sentences (see ais/connection.js) because TCP does
not guarantee message boundaries. Each sentence is passed to
ggencoder (ais/decoder.js), which handles both single- and
multi-part AIVDM messages using a plain object as the session
store, and returns normalized fields. Decode failures are caught
and logged rather than crashing the process.
