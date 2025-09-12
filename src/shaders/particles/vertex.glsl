uniform vec2 uResolution;
uniform sampler2D uPicture;
uniform sampler2D uCanvasTexture;

varying vec3 vColor;

void main()
{
    // Final position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
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

    // Canvas
    float canvasIntensity = texture(uCanvasTexture, uv).r * 2.0;


    // Color
    // Since we want the entire particle to be the same color we dont need to calculate the color in the vertex shader


    // Point size
    float scale = 0.15; // when we increase number of points abut keep same size we need to decrease the scale
    gl_PointSize = pictureIntensity * scale * uResolution.y; // use this to scale the point size based on the picture intensity
    gl_PointSize *= (1.0 / - viewPosition.z); // this is hard coded from built in shader to sort out perspective


    // varyings parsed to fragment shader
    // power is used to make the white parts brighter (the darker parts will be darker)
    vColor = vec3(pow(pictureIntensity, 2.0)); // since we are just extracting red this is still grey scale update this later to change rgb colours
}
