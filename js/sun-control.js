// Oscar Saharoy 2022

import * as THREE from "./three.module.js"; 


export function pointerOverSun( event, camera, uniforms ) {

	// get the canvas bounding box to find the pointer's location in clip space
    const canvasBox = canvas.getBoundingClientRect();
    const clipX =   event.clientX / canvasBox.width  * 2 - 1;
    const clipY = - event.clientY / canvasBox.height * 2 + 1;

	// find the pointer direction in world space
    const clipVec = new THREE.Vector3( clipX, clipY, 0 );
	const direction = clipVec.unproject( camera ).normalize();

	// calculate whether the pointer is close enough to the sun adjusting for zoom
	const paddingScaleFactor = camera.getEffectiveFOV() / camera.fov;
	return direction.dot( uniforms.uSunDir.value ) > 0.99999 - paddingScaleFactor * 0.0005;
}

export function setSunDirection( meanRelativePointer, canvas, camera, uniforms ) {

    const canvasBox = canvas.getBoundingClientRect();
    const clipX  = meanRelativePointer.x * 2 * Math.max(canvasBox.width, canvasBox.height) / canvasBox.width;
    const clipY = -meanRelativePointer.y * 2 * Math.max(canvasBox.width, canvasBox.height) / canvasBox.height;

	// set the sun direction to match the pointer location
    const clipVec = new THREE.Vector3( clipX, clipY, 0 );
	uniforms.uSunDir.value = clipVec.unproject( camera ).normalize();
}

