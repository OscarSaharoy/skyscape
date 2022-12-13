// Oscar Saharoy 2022


const canvas = document.getElementById( "canvas" );

export function downloadImage() {

    const link = document.createElement("a");
    link.href = canvas.toDataURL( "image/jpeg", 0.94 );
    link.download = "skyscape.jpg";
    link.click();
}

