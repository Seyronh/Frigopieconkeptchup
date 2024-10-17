import "./style.css";
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

async function conjuntoTablas(id, offset) {
	let has_more;
	let url = new URL(
		`https://g927779dd8b47aa-frigopieconketchup.adb.eu-madrid-1.oraclecloudapps.com/ords/admin/conjunto/`
	);
	url.searchParams.set("limit", 1000000);
	if (id) url.searchParams.set("q", `{"id":{"$eq":${id}}}`);
	url.searchParams.set("offset", offset);
	let datosnuevos = await httpGet(url);
	offset += datosnuevos.count;
	has_more = datosnuevos.hasMore;
	todoslosdatos = todoslosdatos.concat(datosnuevos.items);
	if (has_more) conjuntoTablas(undefined, offset);
	return;
}
let todoslosdatos = [];
conjuntoTablas(undefined, 0);

async function informacion(id) {
	let datos = [];
	let offset = 0;
	let has_more;
	puntos.forEach((p) => {
		map.removeLayer(p);
	});
	puntos = [];
	const tabla = document.getElementById("editable-table");

	for (var i = tabla.rows.length - 1; i > 0; i--) {
		tabla.deleteRow(i);
	}
	do {
		let url = new URL(
			"https://g927779dd8b47aa-frigopieconketchup.adb.eu-madrid-1.oraclecloudapps.com/ords/admin/informacion/"
		);
		if (id) url.searchParams.set("q", `{"id":{"$eq":${id}}}`);
		url.searchParams.set("offset", offset);
		let datosnuevos = await httpGet(url);
		datosnuevos.items.forEach((item) => {
			if (item.x == null || item.y == null) return;
			let x = parseFloat(item.x.replace(",", "."));
			let y = parseFloat(item.y.replace(",", "."));
			if (!userMarker) return;
			let posicionCentro = userMarker.getLatLng();
			let radio = Math.round(progressInput.value * maxValue);
			if (radio == 0) radio++;
			if (
				calcularDistancia(x, y, posicionCentro.lat, posicionCentro.lng) < radio
			) {
				let historial = todoslosdatos.filter((e) => e.id == item.id);
				let estadisticas = caracteristicas(historial.map((e) => e.agua_actual));
				añadirFila(
					item.id,
					item.embalse_nombre,
					item.ambito_nombre,
					item.agua_total,
					item.electrico_flag,
					estadisticas.maximo,
					estadisticas.minimo,
					estadisticas.media,
					estadisticas.moda
				);
				puntos.push(L.marker([x, y]).addTo(map));
			}
		});
		offset += datosnuevos.count;
		has_more = datosnuevos.hasMore;
		datos = datos.concat(datosnuevos.items);
	} while (has_more);
	return datos;
}

function caracteristicas(datos) {
	let media = datos.reduce((a, b) => a + b, 0) / datos.length;
	let copia = [...datos];
	copia.sort();
	let moda = copia[Math.floor(copia.length / 2)];
	let minimo = copia[0];
	let maximo = copia[copia.length - 1];
	return { media: media, maximo: maximo, minimo: minimo, moda: moda };
}

function convertirafecha(texto) {
	const [fechaStr, horaStr] = texto.split(" ");
	const [dia, mes, año] = fechaStr.split("/");
	const añocompleto = `${parseInt(año) > 24 ? "19" : "20"}${año}`;
	const fecha = new Date(`${añocompleto}-${mes}-${dia}T${horaStr}`);
	return fecha;
}
function ordenadorPorFecha(datos) {
	let copia = [...r];
	copia.sort((a, b) => {
		return convertirafecha(a.fecha) - convertirafecha(b.fecha);
	});
	return copia;
}

// Inicializar el mapa
const map = L.map("map").setView([40.416775, -3.70379], 6); // Centro en España

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	attribution: "© OpenStreetMap contributors",
}).addTo(map);

let userMarker;
let circle;
let puntos = [];

// Función para actualizar la ubicación en el mapa
function updateLocation(lat, lon) {
	if (userMarker) {
		map.removeLayer(userMarker);
		map.removeLayer(circle);
	}
	userMarker = L.marker([lat, lon]).addTo(map);
	userMarker._icon.id = "huechange";
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
	informacion();
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
let lastcomprobado = -1;
setInterval(() => {
	if (lastcomprobado !== progressInput.value) {
		informacion();
		lastcomprobado = progressInput.value;
	}
}, 1000);

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
function añadirFila(
	identificador,
	nombre,
	ambito,
	capacidadMaxima,
	generaElectricidad,
	maximo,
	minimo,
	media,
	moda
) {
	// Seleccionar la tabla

	const tabla = document.getElementById("editable-table");

	// Crear una nueva fila

	const nuevaFila = tabla.insertRow();

	// Crear y añadir celdas a la nueva fila

	const celdaId = nuevaFila.insertCell(0);

	const celdaNombre = nuevaFila.insertCell(1);

	const celdaAmbito = nuevaFila.insertCell(2);

	const celdaCapacidad = nuevaFila.insertCell(3);

	const celdaElectricidad = nuevaFila.insertCell(4);
	const Maximo = nuevaFila.insertCell(5);
	const Minimo = nuevaFila.insertCell(6);
	const Media = nuevaFila.insertCell(7);
	const Moda = nuevaFila.insertCell(8);

	// Asignar contenido a las celdas

	celdaId.textContent = identificador;

	celdaNombre.textContent = nombre;

	celdaAmbito.textContent = ambito;

	celdaCapacidad.textContent = capacidadMaxima;

	celdaElectricidad.textContent = generaElectricidad ? "Sí" : "No";
	Maximo.textContent = maximo;
	Minimo.textContent = minimo;
	Media.textContent = media;
	Moda.textContent = moda;
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
	const R = 6371; // Radius of the Earth in kilometers

	const dLat = ((lat2 - lat1) * Math.PI) / 180;

	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const lat1Rad = (lat1 * Math.PI) / 180;

	const lat2Rad = (lat2 * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1Rad) *
			Math.cos(lat2Rad) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const distance = R * c;

	return distance;
}
