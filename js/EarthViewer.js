// EarthViewer.js

export class EarthViewer {
    /**
     * @param {BABYLON.Engine} engine
     * @param {HTMLCanvasElement} canvas
     */
    constructor(engine, canvas) {
        // --- Configurações & Estado ---
        this.engine = engine;
        this.canvas = canvas;
        this.earthModelRoot = null;
        this.rotationNode = null;
        this.scene = null;
        
        // --- Parâmetros da Terra ---
        this.scaleFactor = 0.01;
        this.visualRadius = 8.0; 
        this.rotationSpeed = 0.0021; 
        this.isRotating = true; 
        this.earthRadiusScaled = (58 * this.scaleFactor) / 2;
    }

    // ===================================
    // Métodos de Geometria e Conversão
    // ===================================

    /**
     * Converte coordenadas Lat/Lon em um Vector3 de Babylon, ajustando o desalinhamento de 180 graus.
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} radius
     * @returns {BABYLON.Vector3}
     */
    getPositionFromLatLon(latitude, longitude, radius) {
        const latRad = latitude * (Math.PI / 180);
        
        // Compensação de Longitude
        const lonAdjusted = longitude + 180; 
        const lonRad = -lonAdjusted * (Math.PI / 180); 

        const R = radius;

        // Fórmulas de conversão de esfera para Cartesiano
        const x_math = R * Math.cos(latRad) * Math.cos(lonRad);
        const y_math = R * Math.sin(latRad);
        const z_math = R * Math.cos(latRad) * Math.sin(lonRad);
        
        return new BABYLON.Vector3(x_math, y_math, z_math);
    }

    // ===================================
    // Métodos de Adição de Elementos
    // ===================================

    /**
     * Adiciona um marcador esférico (GeoMarker) nas coordenadas geográficas.
     */
    addGeoMarker(latitude, longitude, color) {
        if (!this.earthModelRoot) return;

        const currentEarthRadius = this.earthRadiusScaled; 
        const altitude = 4.9; 
        const markerSize = 0.1; 

        const finalRadius = currentEarthRadius + altitude;
        const markerPosition = this.getPositionFromLatLon(latitude, longitude, finalRadius);

        const marker = BABYLON.MeshBuilder.CreateSphere("GeoMarker_" + latitude, { diameter: markerSize }, this.scene);
        
        const markerMat = new BABYLON.StandardMaterial("mat_" + latitude, this.scene);
        markerMat.emissiveColor = color || new BABYLON.Color3(1, 0, 0); 
        markerMat.disableLighting = true; 

        marker.material = markerMat;
        marker.position = markerPosition;
        marker.parent = this.rotationNode; 
    }

    /**
     * Desenha a grade de latitude e longitude ao redor da Terra.
     */
    addLatLonGrid(stepDeg = 30) {
        if (!this.earthModelRoot) return;

        const earthRadius = 10; 

        // Desenha Linhas de Latitude
        // for (let lat = -90; lat <= 90; lat += stepDeg) {
        //     const path = [];
        //     for (let lon = -180; lon <= 180; lon += 5) {
        //         path.push(this.getPositionFromLatLon(lat, lon, earthRadius * 1.001));
        //     }
        //     const line = BABYLON.MeshBuilder.CreateLines("lat_" + lat, { points: path }, this.scene);
        //     line.color = new BABYLON.Color3(0.4, 0.4, 0.4);
        //     line.parent = this.rotationNode;
        // }

        // Desenha Linhas de Longitude
        // for (let lon = -180; lon <= 180; lon += stepDeg) {
        //     const path = [];
        //     for (let lat = -90; lat <= 90; lat += 5) {
        //         path.push(this.getPositionFromLatLon(lat, lon, earthRadius * 1.001));
        //     }
        //     const line = BABYLON.MeshBuilder.CreateLines("lon_" + lon, { points: path }, this.scene);
        //     line.color = new BABYLON.Color3(0.4, 0.4, 0.4);
        //     line.parent = this.rotationNode;
        // }
    }

    /**
     * Adiciona uma etiqueta de texto 3D em coordenadas específicas.
     */
    addCoordinateLabel(latitude, longitude, text) {
        if (!this.earthModelRoot) return;

        const earthRadius = this.visualRadius; 
        const pos = this.getPositionFromLatLon(latitude, longitude, earthRadius * 1.05);

        const sphere = BABYLON.MeshBuilder.CreateSphere("coordLabel_" + text, { diameter: 0.1 }, this.scene);
        sphere.position = pos;
        sphere.parent = this.rotationNode;

        const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(sphere, 256, 256);
        const label = new BABYLON.GUI.TextBlock();
        label.text = text;
        label.color = "white";
        label.fontSize = 50;
        gui.addControl(label);
    }
    
    // ===================================
    // Métodos de Inicialização (Setup)
    // ===================================

    /**
     * Cria e configura a cena de Babylon.js, câmera, luzes e carrega o modelo GLB.
     * @returns {Promise<BABYLON.Scene>}
     */
    async createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.clearColor = new BABYLON.Color3(0, 0, 0);
        this.scene = scene;

        this.rotationNode = new BABYLON.TransformNode("RotationNode", scene);

        // Câmera
        const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 1.5, Math.PI / 2, 40.0, BABYLON.Vector3.Zero(), scene);
        camera.minZ = 0.001;
        camera.attachControl(this.canvas, true);

        // Iluminação
        new BABYLON.HemisphericLight("Hemi", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.6;
        new BABYLON.DirectionalLight("Sun", new BABYLON.Vector3(1, 0, 1), scene).intensity = 0.5;

        // Carregar Modelo
        const fileName = "assets/models_3D/Earth_Nasa.glb";
        await BABYLON.SceneLoader.AppendAsync("", fileName, scene);
        this.earthModelRoot = scene.getMeshByName("__root__");

        if (this.earthModelRoot) {
            // Aplica escala e correção de espelhamento
            this.earthModelRoot.scaling = new BABYLON.Vector3(-this.scaleFactor, this.scaleFactor, this.scaleFactor);

            // Aplica inclinação da Terra (~23.5°) e orientação inicial
            this.earthModelRoot.rotation.x = Math.PI / 2;
            this.earthModelRoot.rotation.z = BABYLON.Angle.FromDegrees(23.5).radians();
            this.earthModelRoot.rotation.y = 0; 

            this.earthModelRoot.parent = this.rotationNode;
            
            // TESTE DE ALINHAMENTO
            this.addGeoMarker(-22.90, -43.20, new BABYLON.Color3(0, 1, 0)); // Rio de Janeiro (Verde)
            this.addGeoMarker(-33.86, 151.20, new BABYLON.Color3(1, 0, 0)); // Sydney (Vermelho)
            
        }

        return scene;
    }

    /**
     * Inicia o loop de renderização da Babylon.js.
     */
    startRenderLoop(scene) {
        this.engine.runRenderLoop(() => {
            if (this.rotationNode && this.isRotating) {
                this.rotationNode.rotation.y += this.rotationSpeed;
            }
            scene.render();
        });
    }
}
