// Oscar Saharoy 2023

import * as THREE from './three.module.js'; 


export const uniforms = {
    uTime: { value: 0. },
	uZoom: { value: 1. },
	uFramesStationary: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
	uSunDir: { value: new THREE.Vector3() },
	uMoonDir: { value: new THREE.Vector3() },
	uStarsRotation: { value: new THREE.Matrix4() },
	uAtmosphereLight: { value: null },
	uSamplePointsPerFrame: { value: 5 },
	uSamplePointsTotal: { value: 200 },
};
uniforms.uSunDir.value.set(0, -0.06, -1).normalize();

