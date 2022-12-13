// Oscar Saharoy 2022

import * as THREE from "./three.module.js"; 
import { canvas, skyUniforms } from "./skyscape.js";


export function pointerOverSun( camera, event ) {

    const canvasBox = canvas.getBoundingClientRect();
    const clipX = event.clientX / canvasBox.width  * 2 - 1;
    const clipY = event.clientY / canvasBox.height * 2 - 1;

    const clipVec = new THREE.Vector3( clipX, clipY, 0 );
	const direction = clipVec.unproject( camera ).normalize();

	return direction.dot( skyUniforms.uSunDir.value ) > 0.98;
}

export function setSunDirection( camera, meanRelativePointer ) {

    const canvasBox = canvas.getBoundingClientRect();
    const clipX  = meanRelativePointer.x * 2 * Math.max(canvasBox.width, canvasBox.height) / canvasBox.width;
    const clipY = -meanRelativePointer.y * 2 * Math.max(canvasBox.width, canvasBox.height) / canvasBox.height;

    const clipVec = new THREE.Vector3( clipX, clipY, 0 );
	skyUniforms.uSunDir.value = clipVec.unproject( camera ).normalize();
}

