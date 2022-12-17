// Oscar Saharoy 2022

import * as THREE from './three.module.js'; 


// vector the points toward azimuth
const UP = new THREE.Vector3(  0,  1,  0 );


export function panCamera( camera, delta ) {

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
}


export function zoomCamera( camera, delta ) {
    
	// calculate the adjustment from the zoom event delta
    const adjust = 1.17 ** delta;

	// update the camera zoom
    camera.zoom = Math.max( 0.5, camera.zoom * adjust );
    camera.updateProjectionMatrix();
}

