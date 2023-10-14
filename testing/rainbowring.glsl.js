
vec3 starFunction( vec2 uv ) {

    float scale = 0.0004;
    float r = length( uv );

    return vec3(
        scale / pow(r, 1.4)
    );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized square pixel coordinates
    // -.5 to .5 in shorter axis
    vec2 uv = ( fragCoord - iResolution.xy/2. ) / min(iResolution.x, iResolution.y);

    vec3 col = starFunction( uv );

    // tonemap and gamma
    col = 1. - exp(-col);
    col = pow(col, vec3(0.4545));

    // Output to screen
    fragColor = vec4(col,1.0);
}

