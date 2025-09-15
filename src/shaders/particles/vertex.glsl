uniform vec2 uResolution;
uniform sampler2D uPicture;
uniform sampler2D uCanvasTexture;

// attached to geometry in useMemo()
attribute float randoms;
attribute float angles;

//varyings to pass to frag shader 
varying vec3 vColor;
varying float vCanvas;

void main() {

    // Position modifications 
    //    - note before modelMatrix transformation
    //    - We cannot update position attribute  directly (const) -- > create new position
    vec3 newPosition = position;
    // Canvas
    float canvasIntensity = texture(uCanvasTexture, uv).r;

    // fix the canvas intensity to smooth/clamp such that the opacity bug in 2d canvas doesn't offset moved points
    // GLSL function that creates a smooth transition between two values. It's like a smooth interpolation with easing.
    // 0.1 -> removes 2d canvas opacity bug after glow
    // 0.3 -> makes it so the points hang in the air until they get to the threshold of 0.3
    canvasIntensity = smoothstep(0.1 , 0.3, canvasIntensity);


    // make particles close to mouse  move towards camera (z) and circle around (x,y)
    vec3 displacementDirection = vec3(
        cos(angles) * 0.2,
        sin(angles) * 0.2,
        1.0);

    //normalize the direction of length 1
    displacementDirection = normalize(displacementDirection);
    displacementDirection *= canvasIntensity * randoms *2.0;
    newPosition += displacementDirection;

 
    // uv coordinates of the point, the uv ("xy plane") inside the point. Imagining the point as a plane. 
    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Picture
    // Note this uv is the vertex uv not the pixel uv
    // which means this uv is the geometry of our points. (not the mapping in side each fragment)
    // also uv is a special varying that is automatically passed to the vertex shader
    // gets the Red value of the texture at the uv coordinate (for grey scale images white parts will have higher values)
    // essentially we are increasing the size of the points where the picture is white

    float pictureIntensity = texture(uPicture, uv).r; 

    // Color
    // Since we want the entire particle to be the same color we dont need to calculate the color in the vertex shader

    // Point size
    float scale = 0.13; // when we increase number of points abut keep same size we need to decrease the scale
    gl_PointSize = pictureIntensity * scale * uResolution.y; // use this to scale the point size based on the picture intensity
    gl_PointSize *= (1.0 / -viewPosition.z); // this is hard coded from built in shader to sort out perspective

    // varyings parsed to fragment shader
    // power is used to make the white parts brighter (the darker parts will be darker)
    vColor = vec3(pow(pictureIntensity, 2.0)); // since we are just extracting red this is still grey scale update this later to change rgb colours

}
