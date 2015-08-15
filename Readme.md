# Mana-Map

A Google-Maps UI wrapper for Mana

## Installation

`npm install jkroso/mana-map`

then in your app:

```js
const {Map,Marker} = require('mana-map')
```

## API

`Map` takes a cursor and whatever options you want to pass on to Google-Maps as parameters. If you want to render some markers on the map just pass them as children. They can be any element type you like so long as they have a location parameter. The `Marker` component just provides some nice default styling, you don't have to use it at all.

```js
<Map cursor={cursor}>
  <Marker location={{lat:-42,lng:0}}>Cold</Marker>
  <Marker location={{lat:0,lng:0}}>Hot</Marker>
  <Marker location={{lat:42,lng:0}}>Cold</Marker>
</Map>
```

See the [example](example.html) which can also be viewed live [here](//jkroso.github.io/mana-map/example.html)
