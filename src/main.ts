import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createSimpleSky } from "./sky";
import { BrowserAuthorizationClient } from "@itwin/browser-authorization";
import { getIModel3dTilesUrl } from "./iModelTiles.ts";
import { TilesRenderer } from "3d-tiles-renderer";
import { ITwinMeshExportServicePlugin } from "./ITwinMeshExportServicePlugin";

let authClient: BrowserAuthorizationClient;

// Utilitário para calcular rotação entre dois vetores
function rotationBetweenDirections(dir1: THREE.Vector3, dir2: THREE.Vector3): THREE.Quaternion {
  const rotation = new THREE.Quaternion();
  const a = new THREE.Vector3().crossVectors(dir1, dir2);
  rotation.set(a.x, a.y, a.z, 1 + dir1.clone().dot(dir2));
  rotation.normalize();
  return rotation;
}

async function setupAuth() {
  const redirectUri = window.location.origin + window.location.pathname;
  console.log("Iniciando autenticação");
  console.log("Client ID:", import.meta.env.VITE_CLIENT_ID);
  console.log("Redirect URI:", redirectUri);
  
  authClient = new BrowserAuthorizationClient({
    authority: `https://ims.bentley.com`,
    clientId: import.meta.env.VITE_CLIENT_ID,
    scope: "itwin-platform",
    redirectUri,
    responseType: "code",
  });

  console.log("Verificando callback de login...");
  await authClient.handleSigninCallback();

  console.log("Está autorizado?", authClient.isAuthorized);
  if (!authClient.isAuthorized) {
    console.log("Não está autorizado, redirecionando para login...");
    await authClient.signInRedirect();
  }

  return authClient;
}

async function main() {
  await setupAuth();

  const iModelId = import.meta.env.VITE_IMODEL_ID;
  const accessToken = await authClient.getAccessToken();
  console.log("Token obtido:", accessToken ? "Sim" : "Não");
  
  const tilesetUrl = await getIModel3dTilesUrl(iModelId, accessToken);

  if (!tilesetUrl) {
    throw new Error("Could not get tileset URL");
  }

  // Cena
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);
  camera.position.set(20, 6, 20);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Iluminação
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 0);
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 2);
  hemisphereLight.position.set(0, 1, 0);
  scene.add(directionalLight, hemisphereLight);

  // Céu
  const sky = createSimpleSky();
  scene.add(sky);

  // Controles
  const controls = new OrbitControls(camera, renderer.domElement);

  // TilesRenderer com plugin SAS
  const tilesRenderer = new TilesRenderer(tilesetUrl.toString());
  tilesRenderer.registerPlugin(new ITwinMeshExportServicePlugin(tilesetUrl.search));
  tilesRenderer.setCamera(camera);
  tilesRenderer.setResolutionFromRenderer(camera, renderer);
  scene.add(tilesRenderer.group);

  // Centralizar e alinhar o modelo
  tilesRenderer.addEventListener("load-tile-set", () => {
    const sphere = new THREE.Sphere();
    tilesRenderer.getBoundingSphere(sphere);

    const position = sphere.center.clone();
    const distanceToEllipsoidCenter = position.length();

    const surfaceDirection = position.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const rotationToNorthPole = rotationBetweenDirections(surfaceDirection, up);

    tilesRenderer.group.quaternion.copy(rotationToNorthPole);
    tilesRenderer.group.position.y = -distanceToEllipsoidCenter;
  });

  // Loop de renderização
  function renderLoop() {
    requestAnimationFrame(renderLoop);
    camera.updateMatrixWorld();
    tilesRenderer.update();
    controls.update();
    renderer.render(scene, camera);
  }
  renderLoop();

  // Resize handler
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

main();
