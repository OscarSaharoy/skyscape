// Oscar Saharoy 2022

import * as THREE from './three.module.js'; 


const UP = new THREE.Vector3(  0,  1,  0 );


export function panCamera( camera, cameraForward, delta ) {

    const right = new THREE.Vector3()
				.crossVectors( cameraForward, UP );
    const over  = new THREE.Vector3()
				.crossVectors( cameraForward, right );

    if( UP.dot(cameraForward) > 0 && delta.y < 0
     || UP.dot(cameraForward) < 0 && delta.y > 0 )
        over.normalize();

    const sensitivity = -9 / (camera.zoom + 2.);

    const adjust = new THREE.Vector3().addVectors(
        right.multiplyScalar(delta.x),
        over.multiplyScalar( delta.y)
    ).multiplyScalar(sensitivity);

    cameraForward.add( adjust );
    cameraForward.normalize();
    camera.lookAt( cameraForward );
}


export function zoomCamera( camera, delta ) {
    
    const adjust = 1.17 ** delta;

    camera.zoom *= adjust;
    camera.zoom = Math.max( 0.5, camera.zoom );
    camera.updateProjectionMatrix();
}

