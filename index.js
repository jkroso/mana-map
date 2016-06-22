import {JSX,Element,NODE} from 'mana'
import {style} from 'easy-style'

const gmaps = google.maps

/**
 * A google maps wrapper for Mana
 *
 * @param {Object} params; {cursor}
 * @param {Array} markers; any Element with a location parameter
 * @return {<div/>}
 */

export default class MapElement extends Element {
  constructor(params, markers) {
    super('div', {}, markers)
    this.mergeParams(params)
  }

  updateParams(params, dom)  {
    super.updateParams(params, dom)
    const {cursor} = params
    const {map} = dom
    if (dom.animating) return
    // sync zoom
    const zoom = cursor.get('zoom').value
    if (map.getZoom() != zoom) map.setZoom(zoom)
    // sync center
    const center = cursor.get('center').value
    if (center === dom.center) return
    dom.center = center
    Promise.resolve(center).then(center => map.panTo(center))
  }

  updateChildren(children, dom) {
    const {markers=[],map} = dom
    const newMarkers = []
    children.forEach(child => {
      const {location:{lng,lat}} = child.params
      // attempt to reuse an old marker
      for (var i = 0; i < markers.length; i++) {
        var marker = markers[i]
        if (marker.lat == lat && marker.lng == lng) {
          marker.node[NODE].update(child, marker.node)
          marker.draw()
          newMarkers.push(marker)
          markers.splice(i, 1)
          return
        }
      }
      newMarkers.push(new MarkerOverlay(map, child.toDOM(), lng, lat))
    })
    markers.forEach(m => m.setMap(null))
    dom.markers = newMarkers
  }

  onMount(dom) {
    const cursor = this.params.cursor
    const map = dom.map = new gmaps.Map(dom, {
      center: {lat:0, lng:0},
      zoom: cursor.get('zoom').value,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
        style: 1
      },
      scrollwheel: false,
      minZoom: 2
    })

    dom.center = cursor.get('center').value
    Promise.resolve(dom.center).then(center => {
      map.setCenter(center)
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
        cursor.merge({
          bounds: {
            top: ne.lat(),
            right: ne.lng(),
            bottom: sw.lat(),
            left: sw.lng()
          },
          center: {
            lat: center.lat(),
            lng: center.lng()
          },
          zoom: map.getZoom()
        })
      })
    })
  }

  onUnMount(dom) {
    gmaps.event.clearInstanceListeners(dom.map)
  }

  // TODO: Notify children correctly
  runLifeCycleMethod(name, dom) {
    this[name] && this[name](dom)
  }
}

const markerClass = style({
  position: 'absolute',
  marginTop: -7,
  zIndex: 1000,
  left: 0,
  top: 0,
  '> .arrow': {
    border: '7px dashed rgb(100,100,100)',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
    borderTopStyle: 'solid',
    borderBottom: 'none',
    position: 'absolute',
    marginLeft: -7,
    lineHeight: 0,
    left: '50%',
    top: 27,
    width: 0,
    height: 0,
    bottom: 0
  },
  '> .content': {
    backgroundColor: 'rgb(100,100,100)',
    padding: '8px 10px 7px 10px',
    borderRadius: 2,
    textAlign: 'center',
    color: 'white'
  }
})

/**
 * A simple map marker which can have any content you like
 *
 * @param  {Object} params; {location:[lat,lng]}
 * @param  {Array} children;
 * @return {<div/>}
 */

export const Marker = (params, children) =>
  <div class={markerClass}>
    <div class="arrow"/>
    <div class="content">{children}</div>
  </div>.mergeParams(params)

/**
 * A custom google maps marker
 *
 * @param {google.maps.Map} map
 * @param {VirtualElement} node
 */

class MarkerOverlay extends gmaps.OverlayView {
  constructor(map, node, lng, lat) {
    super()
    this.node = node
    this.lng = lng
    this.lat = lat
    this.setMap(map)
  }

  /**
   * onAdd is called when the map is ready to receive the marker
   */

  onAdd() {
    this.getPanes().overlayLayer.appendChild(this.node)
  }

  /**
   * draw is called whenever the map bounds change. Here we need to place
   * the Marker over its target
   */

  draw() {
    const projection = this.getProjection()
    if (!projection) return
    const dom = this.node
    const {x,y} = projection.fromLatLngToDivPixel(new gmaps.LatLng(this.lat, this.lng))
    dom.style.left = (x - dom.clientWidth / 2) + 'px'
    dom.style.top =  (y - dom.clientHeight) + 'px'
  }

  /**
   * The onRemove() method will be called automatically from the API if
   * we ever set the overlay's map property to 'null'
   */

  onRemove() {
    this.node.parentNode.removeChild(this.node)
  }
}
