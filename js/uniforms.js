// Oscar Saharoy 2023

import * as THREE from './three.module.js'; 

const rayleighScatteringCoeffs = new THREE.Vector4(5.80, 13.6, 33.1, 0.00).multiplyScalar(1e-6);
const rayleighAbsorptionCoeffs = new THREE.Vector4(0.00, 0.00, 0.00, 0.00).multiplyScalar(1e-6);
const mieScatteringCoeffs      = new THREE.Vector4(3.99, 3.99, 3.99, 0.00).multiplyScalar(1e-6);
const mieAbsorptionCoeffs      = new THREE.Vector4(4.40, 4.40, 4.40, 0.00).multiplyScalar(1e-6);
const cloudScatteringCoeffs    = new THREE.Vector4(120., 120., 120., 0.00).multiplyScalar(1e-6);
const cloudAbsorptionCoeffs    = new THREE.Vector4(10.0, 10.0, 10.0, 0.00).multiplyScalar(1e-6);
const ozoneScatteringCoeffs    = new THREE.Vector4(0.00, 0.00, 0.00, 0.00).multiplyScalar(1e-6*0);
const ozoneAbsorptionCoeffs    = new THREE.Vector4(0.68, 1.88, 0.08, 0.00).multiplyScalar(1e-6*0);

const uSunDir = (new THREE.Vector3( 0, 0.3, -1 )).normalize();
const uScatteringMatrix = Array(16).fill(0);
const uExtinctionMatrix = Array(16).fill(0);

rayleighScatteringCoeffs.toArray( uScatteringMatrix, 0 );
mieScatteringCoeffs.toArray( uScatteringMatrix, 4 );
ozoneScatteringCoeffs.toArray( uScatteringMatrix, 8 );
cloudScatteringCoeffs.toArray( uScatteringMatrix, 12 );

const rayleighExtinction = (new THREE.Vector4()).addVectors( rayleighScatteringCoeffs, rayleighAbsorptionCoeffs );
const mieExtinction      = (new THREE.Vector4()).addVectors( mieScatteringCoeffs, mieAbsorptionCoeffs );
const cloudExtinction    = (new THREE.Vector4()).addVectors( cloudScatteringCoeffs, cloudAbsorptionCoeffs );
const ozoneExtinction    = (new THREE.Vector4()).addVectors( ozoneScatteringCoeffs, ozoneAbsorptionCoeffs );

rayleighExtinction.toArray( uExtinctionMatrix, 0 );
mieExtinction.toArray( uExtinctionMatrix, 4 );
ozoneExtinction.toArray( uExtinctionMatrix, 8 );
cloudExtinction.toArray( uExtinctionMatrix, 12 );

export const uniforms = {
    uTime: { value: 0 },
	uFrame: { value: 0 },
	uZoom: { value: 1. },
	uFramesStationary: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
	uSunDir: { value: uSunDir },
	uMoonDir: { value: new THREE.Vector3() },
	uStarsRotation: { value: new THREE.Matrix4() },
	uAtmosphereLight: { value: null },
	uSamplePointsPerFrame: { value: 5 },
	uSamplePointsTotal: { value: 200 },
	uExtinctionMatrix: { value: uExtinctionMatrix },
	uScatteringMatrix: { value: uScatteringMatrix },
	uProjectionMatrix: { value: new THREE.Matrix4() },
	uUnProjectionMatrix: { value: new THREE.Matrix4() },
};

export function updateTimingUniforms( timestampMillis ) {
	++uniforms.uFrame.value;
	uniforms.uTime.value = timestampMillis / 1000;
}

