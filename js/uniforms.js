// Oscar Saharoy 2023

import * as THREE from './three.module.js'; 

const rayleighScatteringCoeffs = new THREE.Vector3(5.80, 13.6, 33.1);
const rayleighAbsorptionCoeffs = new THREE.Vector3(0.00, 0.00, 0.00);
const mieScatteringCoeffs      = new THREE.Vector3(3.99, 3.99, 3.99);
const mieAbsorptionCoeffs      = new THREE.Vector3(4.40, 4.40, 4.40);
const cloudScatteringCoeffs    = new THREE.Vector3(12.0, 12.0, 12.0);
const cloudAbsorptionCoeffs    = new THREE.Vector3(1.00, 1.00, 1.00);
const ozoneScatteringCoeffs    = new THREE.Vector3(0.00, 0.00, 0.00);
const ozoneAbsorptionCoeffs    = new THREE.Vector3(0.68, 1.88, 0.08);

const uSunDir = (new THREE.Vector3( 0, -0.06, -1 )).normalize();
const uExtinctionMatrix = new THREE.Matrix4();

export const uniforms = {
    uTime: { value: 0. },
	uZoom: { value: 1. },
	uFramesStationary: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
	uSunDir: { value: uSunDir },
	uMoonDir: { value: new THREE.Vector3() },
	uStarsRotation: { value: new THREE.Matrix4() },
	uAtmosphereLight: { value: null },
	uSamplePointsPerFrame: { value: 5 },
	uSamplePointsTotal: { value: 200 },
	uExtinctionMatrix: { value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
};

