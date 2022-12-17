// Oscar Saharoy 2022

import { canvas } from "./skyscape.js";


export function downloadImage() {

	// download the image currently on the canvas by creating a link,
	// setting it to download the canvas image as a jpg and clicking it
    const link = document.createElement("a");
    link.href = canvas.toDataURL( "image/jpeg", 0.94 );
    link.download = "skyscape.jpg";
    link.click();
}

