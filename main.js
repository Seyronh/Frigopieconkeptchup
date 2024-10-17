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

async function conjuntoTablas(id) {
	let datos = [];
	let offset = 0;
	let has_more;
	do {
		let url = new URL(
			`https://g927779dd8b47aa-frigopieconketchup.adb.eu-madrid-1.oraclecloudapps.com/ords/admin/conjunto/`
		);
		if (id) url.searchParams.set("q", `{"id":{"$eq":${id}}}`);
		url.searchParams.set("offset", offset);
		let datosnuevos = await httpGet(url);
		offset += datosnuevos.count;
		has_more = datosnuevos.hasMore;
		datos = datos.concat(datosnuevos.items);
	} while (has_more);
	return datos;
}
async function caracteristicas(datos) {
	let media = datos.reduce((a, b) => a + b, 0) / datos.length;
	let copia = [...datos];
	copia.sort();
	let moda = copia[Math.floor(copia.length / 2)];
	let minimo = copia[0];
	let maximo = copia[copia.length - 1];
	return { media: media, maximo: maximo, minimo: minimo, moda: moda };
}
const datos = conjuntoTablas(18);

datos.then((r) => {
	let caracteristicasDatos = caracteristicas(r.map((e) => e.agua_actual));
	console.log(caracteristicasDatos);
});

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
	let radio = Math.round(progressInput.value * maxValue);
	if (radio == 0) radio++;
	circle = L.circle([lat, lon], {
		color: "green",
		fillColor: "#f03",
		fillOpacity: 0.2,
		radius: radio * 1000,
	}).addTo(map);
	document.getElementById("manual-lat").value = lat;
	document.getElementById("manual-lon").value = lon;
	map.setView([lat, lon]);
}

// Obtener ubicación del usuario
function getUbicacion() {
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				updateLocation(position.coords.latitude, position.coords.longitude);
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
}
document.getElementById("get-location").addEventListener("click", () => {
	getUbicacion();
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
const maxValue = 500;
maxValueSpan.textContent = maxValue;

progressInput.addEventListener("input", (e) => {
	const value = e.target.value;
	let radio = Math.round(value * maxValue);
	if (radio == 0) radio++;
	valueDisplay.textContent = `${
		traducciones[selectidioma.value]["value-display"]
	} ${radio} km`;

	circle.setRadius(radio * 1000);
});
map.on("click", (e) => {
	updateLocation(e.latlng.lat, e.latlng.lng);
});
import traducciones from "./traducciones.json";
function cargarIdioma(idioma) {
	const traduccionesIdioma = traducciones[idioma];
	for (const campo in traduccionesIdioma) {
		document.getElementById(campo).textContent = traduccionesIdioma[campo];
	}
}
const selectidioma = document.getElementById("selectidioma");
selectidioma.addEventListener("change", (e) => {
	cargarIdioma(e.target.value);
	let radio = Math.round(progressInput.value * maxValue);
	if (radio == 0) radio++;
	valueDisplay.textContent = `${
		traducciones[selectidioma.value]["value-display"]
	} ${radio} km`;
});

window.onload = function () {
	cargarIdioma(selectidioma.value);
	progressInput.value = 0.1;
	let radio = Math.round(progressInput.value * maxValue);
	if (radio == 0) radio++;
	valueDisplay.textContent = `${
		traducciones[selectidioma.value]["value-display"]
	} ${radio} km`;
	getUbicacion();
};
