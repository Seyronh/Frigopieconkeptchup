import "./style.css";
import Chart from "chart.js/auto";

// Datos de ejemplo de embalses españoles
const embalses = [
	{ nombre: "Alarcón", capacidad: 1118, actual: 456 },
	{ nombre: "Buendía", capacidad: 1639, actual: 789 },
	{ nombre: "Entrepeñas", capacidad: 835, actual: 345 },
	{ nombre: "Mequinenza", capacidad: 1533, actual: 1102 },
	{ nombre: "La Serena", capacidad: 3219, actual: 1987 },
];

// Crear la gráfica
const ctx = document.getElementById("embalsesChart").getContext("2d");
new Chart(ctx, {
	type: "bar",
	data: {
		labels: embalses.map((embalse) => embalse.nombre),
		datasets: [
			{
				label: "Capacidad (hm³)",
				data: embalses.map((embalse) => embalse.capacidad),
				backgroundColor: "rgba(54, 162, 235, 0.8)",
			},
			{
				label: "Volumen actual (hm³)",
				data: embalses.map((embalse) => embalse.actual),
				backgroundColor: "rgba(255, 99, 132, 0.8)",
			},
		],
	},
	options: {
		responsive: true,
		plugins: {
			title: {
				display: true,
				text: "Capacidad y Volumen Actual de Embalses Españoles",
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				title: {
					display: true,
					text: "Volumen (hm³)",
				},
			},
		},
	},
});
