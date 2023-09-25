// Oscar Saharoy 2023

import { canvas } from "./canvas.js";
import * as THREE from './three.module.js'; 


// vector that points toward azimuth
const UP = new THREE.Vector3(  0,  1,  0 );

const aspect = canvas.width / canvas.height;
const fov    = Math.min( 60 * Math.max( 1, 1/aspect ), 100 );
const near   = 0.1;
const far    = 30;

export const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );


export function panCamera( delta ) {

	// generate perpendicular vector basis (not normalised)
	const cameraForward = camera.getWorldDirection( new THREE.Vector3() );
    const right = new THREE.Vector3()
				.crossVectors( cameraForward, UP );
    const over  = new THREE.Vector3()
				.crossVectors( cameraForward, right );

	// normalise the over vector if we are panning toward the horizon
	// otherwise it feels slow
    if( UP.dot(cameraForward) > 0 && delta.y < 0
     || UP.dot(cameraForward) < 0 && delta.y > 0 )
        over.normalize();

	// compensate panning sensitivity for camera zoom
    const sensitivity = -2. * camera.getEffectiveFOV() / camera.fov;

	// calculate adjustment vector to camera direction from panning movement 
	// and scale by sensitivity
    const adjust = new THREE.Vector3().addVectors(
        right.multiplyScalar(delta.x),
        over.multiplyScalar( delta.y)
    ).multiplyScalar(sensitivity);

	// update the camera direction
    camera.lookAt( 
		cameraForward.add( adjust ).normalize()
	);

	camera.updateMatrix();
	camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
}


export function zoomCamera( delta ) {
    
	// calculate the adjustment from the zoom event delta
    const adjust = 1.17 ** delta;

	// update the camera zoom
    camera.zoom = Math.max( 0.5, camera.zoom * adjust );
    camera.updateProjectionMatrix();
}

