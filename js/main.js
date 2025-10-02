import { EarthViewer } from "./EarthViewer.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);

    const viewer = new EarthViewer(engine, canvas);

    viewer.createScene().then(scene => {
        // Start loop
        viewer.startRenderLoop(scene);

        // Exemplo: adicionar grid + labels + marcador
        viewer.addLatLonGrid(30);
        viewer.addCoordinateLabel(0, 0, "Equador / Greenwich");
        viewer.addCoordinateLabel(90, 0, "90°N");
        viewer.addCoordinateLabel(-90, 0, "90°S");
        viewer.addGeoMarker(-22.90, -43.20, new BABYLON.Color3(0, 1, 0));
        viewer.addGeoMarker(-23.66, -52.62, new BABYLON.Color3(0,1,0));
        

    });

    window.addEventListener("resize", () => engine.resize());

    // Deixar acessível no console
    window.viewer = viewer;
});
