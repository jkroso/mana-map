const {OverlayView,LatLng} = google.maps

/**
 * A custom google maps marker
 *
 * @param {google.maps.Map} map
 * @param {VirtualElement} node
 */

class Marker extends OverlayView {
  constructor(map, node) {
    super()
    this.node = node
    this.setMap(map)
  }

  /**
   * onAdd is called when the map is ready to receive the marker
   */

  onAdd() {
    this.getPanes().overlayLayer.appendChild(this.node.toDOM())
  }

  /**
   * draw is called whenever the map bounds change. Here we need to place
   * the Marker over its target
   */

  draw() {
    const {dom, params:{location}} = this.node
    const projection = this.getProjection()
    if (!projection) return
    const {x,y} = projection.fromLatLngToDivPixel(new LatLng(location.lat, location.lng))
    dom.style.left = (x - dom.clientWidth / 2) + 'px'
    dom.style.top =  (y - dom.clientHeight) + 'px'
  }

  /**
   * The onRemove() method will be called automatically from the API if
   * we ever set the overlay's map property to 'null'
   */

  onRemove() {
    this.node.dom.parentNode.removeChild(this.node.dom)
  }
}

export default Marker
