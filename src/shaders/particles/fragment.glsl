varying vec3 vColor;

void main() {

    // uv coordinates of the point, the uv ("xy plane") inside the point. Imagining the point as a plane. 
    // uv[0,0] is top left, [1,1] is bottom right.
    vec2 uv = gl_PointCoord;

    // distance from each specific uv coordinate to the center of the point. (remember frag shader works on every pixel)
    float distanceToCenter = distance(uv, vec2(0.5));

    // generally try to avoid complex if statements in frag shader. 
    // they are slow and can cause performance issues (each pixel will be checked).
    if(distanceToCenter > 0.5) {
        discard; // this is a special keyword that discards the pixel (dont render it)
    }

    gl_FragColor = vec4(vColor, 1.0);
    // gl_FragColor = vec4(uv, 1.0, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}



// Y
// 0.0 ┌─────────────┐
//     │             │
//     │             │
// 0.5 │      •      │ ← vec2(0.5, 0.5) is here
//     │             │
//     │             │
// 1.0 └─────────────┘
//     0.0    0.5    1.0 X