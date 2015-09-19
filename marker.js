const {OverlayView,LatLng} = google.maps

/**
 * A custom google maps marker
 *
 * @param {google.maps.Map} map
 * @param {VirtualElement} node
 */

class Marker extends OverlayView {
  constructor(map, node, location) {
    super()
    this.node = node
    this.lat = location.lat
    this.lng = location.lng
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
    const {x,y} = projection.fromLatLngToDivPixel(new LatLng(this.lat, this.lng))
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

export default Marker
