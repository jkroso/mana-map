const GoogleMarker = require('./marker')
const {JSX,Element} = require('mana')
const gmaps = google.maps

/**
 * A google maps wrapper for Mana
 *
 * @param {Object} params; {cursor}
 * @param {Array} markers; any Element with a location parameter
 * @return {<div/>}
 */

class MapElement extends Element {
  constructor(params, markers) {
    super('div', {className:'google-map'}, markers, {mount:onMount, unmount:onUnMount})
    this.mergeParams(params)
  }
  updateParams(params)  {
    super.updateParams(params)
    const {cursor:{value}} = params
    const {dom} = this
    const {map} = dom
    if (dom.animating) return
    // sync zoom
    if (map.getZoom() != value.get('zoom')) map.setZoom(value.get('zoom'))
    // sync center
    var center = value.get('center')
    if (center === dom.center) return
    dom.center = center
    map.panTo(center)
  }
  updateChildren(children) {
    const {markers=[],map} = this.dom
    const newMarkers = []
    children.forEach(child => {
      const {location} = child.params
      // attempt to reuse an old marker
      for (var i = 0; i < markers.length; i++) {
        var marker = markers[i]
        var l = marker.node.params.location
        if (l.lat == location.lat && l.lng == location.lng) {
          marker.node = marker.node.update(child)
          marker.draw()
          newMarkers.push(marker)
          markers.splice(i, 1)
          return
        }
      }
      newMarkers.push(new GoogleMarker(map, child))
    })
    markers.forEach(m => m.setMap(null))
    this.dom.markers = newMarkers
  }
}

const onMount = node => {
  const {params:{cursor}, dom} = node

  const map = dom.map = new gmaps.Map(dom, {
    center: cursor.value.get('center'),
    zoom: cursor.value.get('zoom'),
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
      style: 1
    },
    scrollwheel: false,
    minZoom: 2
  })

  dom.center = cursor.value.get('center')

  var dragging = false
  gmaps.event.addListener(map, 'idle', () => dom.animating = dragging)
  gmaps.event.addListener(map, 'dragstart', () => dom.animating = dragging = true)
  gmaps.event.addListener(map, 'dragend', () => dragging = false)
  gmaps.event.addListener(map, 'zoom_changed', () => dom.animating = true)
  gmaps.event.addListener(map, 'bounds_changed', () => {
    const center = map.getCenter()
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    cursor.value = cursor.value.set('bounds', {
      top: ne.lat(),
      right: ne.lng(),
      bottom: sw.lat(),
      left: sw.lng()
    }).set('center', {
      lat: center.lat(),
      lng: center.lng()
    }).set('zoom', map.getZoom())
  })
}

const onUnMount = ({dom:{map}}) => {
  gmaps.event.clearInstanceListeners(map)
}

/**
 * A simple map marker which can have any content you like
 *
 * @param  {Object} params; {location:{lat,lng}}
 * @param  {Array} children;
 * @return {<div/>}
 */

const Marker = (params, children) =>
  <div class='marker'>
    <div class='marker-arrow'></div>
    <div class='marker-inner'>{children}</div>
  </div>.mergeParams(params)

const Map = (params, children) => new MapElement(params, children)

export default Map
export {Marker,Map}
