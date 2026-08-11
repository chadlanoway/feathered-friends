const mapContainer = document.querySelector("#contact-map");

/*
 * Replace these placeholder values with the exact coordinates.
 *
 * MapLibre uses:
 * [longitude, latitude]
 */
const sanctuaryCoordinates = [
    -89.13008610453149,
    42.8985606711546
];

if (mapContainer) {
    const map = new maplibregl.Map({
        container: "contact-map",

        style: {
            version: 8,

            sources: {
                openTopoMap: {
                    type: "raster",

                    tiles: [
                        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
                        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
                        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
                    ],

                    tileSize: 256,

                    attribution:
                        "&copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap"
                }
            },

            layers: [
                {
                    id: "open-topo-map",
                    type: "raster",
                    source: "openTopoMap",
                    paint: {
                        "raster-opacity": 0.9
                    }
                }
            ]
        },

        center: sanctuaryCoordinates,
        zoom: 14,
        cooperativeGestures: true
    });

    map.addControl(
        new maplibregl.NavigationControl({
            showCompass: false
        }),
        "top-right"
    );

    const popup = new maplibregl.Popup({
        offset: 28,
        closeButton: false
    }).setHTML(`
        <div class="contact-map-popup">
            <strong>
                Feathered Friends Sanctuary &amp; Rescue
            </strong>

            <span>1570 County Road A</span>
            <span>Edgerton, WI 53534</span>

            <a
                href="https://www.google.com/maps/dir/?api=1&destination=1570+County+Road+A%2C+Edgerton%2C+WI+53534"
                target="_blank"
                rel="noopener noreferrer"
            >
                Get directions
            </a>
        </div>
    `);

    new maplibregl.Marker({
        color: "#ffcc67"
    })
        .setLngLat(sanctuaryCoordinates)
        .setPopup(popup)
        .addTo(map);
}