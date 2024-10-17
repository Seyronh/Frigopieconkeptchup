import "./style.css";
import Chart from "chart.js/auto";
import L from "leaflet";

async function httpGet(theUrl) {
	return new Promise((resolve, reject) => {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", theUrl, true); // false for synchronous request
		xmlHttp.onload = (e) => {
			resolve(JSON.parse(xmlHttp.responseText));
		};
		xmlHttp.send(null);
	});
}

function solicitarDatosHistoricosAgua(id) {
	return httpGet(
		`https://g927779dd8b47aa-frigopieconketchup.adb.eu-madrid-1.oraclecloudapps.com/ords/admin/agua/?q=id eq ${id}`
	);
}
function solicitarEmbalses() {
	return httpGet(
		"https://g927779dd8b47aa-frigopieconketchup.adb.eu-madrid-1.oraclecloudapps.com/ords/admin/embalsesutf8/"
	);
}
async function conjuntoTablas(id) {
	let datos = [];
	let offset = 0;
	let has_more;
	do {
		let url = new URL(
			`https://g927779dd8b47aa-frigopieconketchup.adb.eu-madrid-1.oraclecloudapps.com/ords/admin/conjunto/`
		);
		if (id) url.searchParams.set("q", `id eq ${id}`);
		url.searchParams.set("offset", offset);
		console.log(url);
		let datosnuevos = await httpGet(url);
		offset += datosnuevos.offset;
		has_more = datosnuevos.hasMore;
		console.log(datosnuevos);
		datos = datos.concat(datosnuevos.items);
	} while (has_more);
	return datos;
}
const datos = conjuntoTablas(1);
datos.then((r) => console.log(r));

// Inicializar el mapa
const map = L.map("map").setView([40.416775, -3.70379], 6); // Centro en España

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	attribution: "© OpenStreetMap contributors",
}).addTo(map);

let userMarker;
let circle;

// Función para actualizar la ubicación en el mapa
function updateLocation(lat, lon) {
	if (userMarker) {
		map.removeLayer(userMarker);
		map.removeLayer(circle);
	}
	userMarker = L.marker([lat, lon]).addTo(map);
	circle = L.circle([lat, lon], {
		color: "green",
		fillColor: "#f03",
		fillOpacity: 0.2,
		radius: Math.round(progressInput.value * maxValue),
	}).addTo(map);
	console.log(Math.round(progressInput.value * maxValue));
	map.setView([lat, lon]);
}

// Obtener ubicación del usuario
document.getElementById("get-location").addEventListener("click", () => {
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				updateLocation(position.coords.latitude, position.coords.longitude);
				document.getElementById("manual-lat").value = position.coords.latitude;
				document.getElementById("manual-lon").value = position.coords.longitude;
			},
			(error) => {
				console.error("Error obteniendo la ubicación:", error);
				alert(
					"No se pudo obtener la ubicación. Por favor, inténtalo de nuevo o introduce la ubicación manualmente."
				);
			}
		);
	} else {
		alert(
			"Tu navegador no soporta geolocalización. Por favor, introduce la ubicación manualmente."
		);
	}
});

// Establecer ubicación manual
document.getElementById("set-manual-location").addEventListener("click", () => {
	const lat = parseFloat(document.getElementById("manual-lat").value);
	const lon = parseFloat(document.getElementById("manual-lon").value);
	if (isNaN(lat) || isNaN(lon)) {
		alert("Por favor, introduce valores válidos para latitud y longitud.");
		return;
	}
	updateLocation(lat, lon);
});

// Deslizador distancia
const progressInput = document.getElementById("progress-input");
const valueDisplay = document.getElementById("value-display");
const maxValueSpan = document.getElementById("max-value");
const maxValue = 100000;
maxValueSpan.textContent = maxValue;

progressInput.addEventListener("input", (e) => {
	const value = e.target.value;
	let radio = Math.round(value * maxValue);
	if (radio == 0) radio++;
	valueDisplay.textContent = `Radio: ${radio}`;
});
map.on("click", (e) => {
	updateLocation(e.latlng.lat, e.latlng.lng);
});
