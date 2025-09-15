import React, { useRef, useMemo, useEffect, useState } from 'react'
import { extend, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Perf } from 'r3f-perf'
import { shaderMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three'
import { TextureLoader } from 'three';

import vertexShader from '../shaders/particles/vertex.glsl'
import fragmentShader from '../shaders/particles/fragment.glsl'

const Experience = ({ onCanvasCoordsChange, canvas2DRef }) => {

    // Note
    //  - use useRef for THREE.js objects (when component it does not recreate the object - useState would)
    //  - use useState for other Values that should trigger re-renders

    const particlesRef = useRef()
    const { camera, scene, size } = useThree()
    let invisiblePlaneRef = useRef()

    // note for raycaster I need to parse clip space coords ([-1,1])
    // which means I need to convert mouse coords (0,0) -> [-1,1]

    // raycaster casts between two objects lets use (camera and mouse)

    let raycaster = useRef(new THREE.Raycaster())

    // [-1,-1] bottom left [1,1] top right
    const [mouse, setMouse] = useState(new THREE.Vector2(9999, 9999)) // default off screen
    // we will prase this to our 2d canvas
    // the reason we do this here is because we need raycaster to get the intersections in 3d we cant jsut do it in 2d
    // const [canvasCoords, setCanvasCoords] = useState(new THREE.Vector2(9999, 9999)) // default off screen

    const canvasTextureRef = useRef(null)

    let [kw] = useLoader(TextureLoader,
        [
            './static/kw-new-h-256.png'
        ]
    )


    // Create particles geometry - using PlaneGeometry
    // This creates a 32x32 grid = 1,024 vertices arranged in a plane.
    // This geometry is parsed as [x,y] coordinates, that build  our points.
    // Create particles geometry
    const particlesGeometry = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(10, 10, 128, 128)
        geometry.setIndex(null) // this is an optimisation - essentially duplicate vertices are being drawn at each vertex we draw a triangle (up to 6, this is a strange behaviour due to using a plane geometry to populate our points)
        geometry.deleteAttribute('normal') // this is an optimisation - we don't need normals for points

        // Add random buffer attribute
        const randoms = new Float32Array(geometry.attributes.position.count)
        // Add an angle buffer attribute
        const angles = new Float32Array(geometry.attributes.position.count)
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            randoms[i] = Math.random()
            angles[i] = Math.random() * Math.PI * 2
        }
        geometry.setAttribute('randoms', new THREE.BufferAttribute(randoms, 1))
        geometry.setAttribute('angles', new THREE.BufferAttribute(angles, 1))
        return geometry
    }, [])

    // Create shader material with resolution uniform
    const MyShaderMaterial = shaderMaterial({
        uResolution: new THREE.Vector2(100, 100),
        uPicture: kw,
        uCanvasTexture: null, // we will set this in the useFrame (can not be set before first render - as we need to update it as soon as 2dcanvas renders)
    },
        vertexShader,
        fragmentShader
    )
    extend({ MyShaderMaterial: MyShaderMaterial })

    const handleMouseMove = (event) => {
        const x = (event.clientX / size.width) * 2 - 1
        const y = -(event.clientY / size.height) * 2 + 1
        setMouse(new THREE.Vector2(x, y))
    }

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [size.width, size.height])

    // Update resolution when window size changes
    // We need to use useEffect instead of useMemo since we need access to the references
    // These references will not be fully available until after the component mounts.
    // hence if we use useMemo the values will be correct under the hood but the first render will be incorrect.
    // useEffect will be called after the first render (mount) And have have the correct size values and update the uniforms.
    useEffect(() => {
        if (particlesRef.current?.material && size.width && size.height) {
            const pixelRatio = Math.min(window.devicePixelRatio, 2)
            particlesRef.current.material.uniforms.uResolution.value.set(
                size.width * pixelRatio,
                size.height * pixelRatio
            )
        }
    }, [size.width, size.height])

    useFrame((state, delta) => {

        // Update raycaster (passes mouse coords on intersection from 3d to 2d canvas)
        raycaster.current.setFromCamera(mouse, camera)

        // Check intersections
        // const intersects = raycaster.current.intersectObjects(scene.children)
        const intersects = raycaster.current.intersectObjects([invisiblePlaneRef.current])

        if (intersects.length > 0) {
            // note uv is [0,0] bot left [1,1] top right
            let uv = intersects[0].uv

            // this is the set from the parent component
            // we do this because we want to access the state in canvas2d component
            onCanvasCoordsChange(new THREE.Vector2(uv.x, uv.y))
        } else {
            // Mouse is outside the invisible plane - send "off-screen" coordinates (this allows the animation to continue)
            onCanvasCoordsChange(new THREE.Vector2(9999, 9999))
        }



        // Update the uniform with the 2Dcanvas texture
        const canvas = canvas2DRef.current?.getCanvas()
        if (canvas) {

            // Create texture if it doesn't exist
            if (!canvasTextureRef.current) {

                canvasTextureRef.current = new THREE.CanvasTexture(canvas)
                particlesRef.current.material.uniforms.uCanvasTexture.value = canvasTextureRef.current
            }

            // Update texture
            // This is a Three.js optimisation flag that tells the WebGL renderer "the texture source has changed, please re-upload it to the GPU."
            canvasTextureRef.current.needsUpdate = true

        }


    })

    return (<>
        {/* Note this seems to be preventing right clicking to open the context menu on the browser (e.g inspect element ) */}
        <Perf position="top-right" />
        <OrbitControls
            makeDefault
            enableDamping={true}
        />
        <color args={['#181818']} attach='background' />
        {/* <color args={['#fdf000']} attach='background' /> */}

        {/* Points using PlaneGeometry */}
        <points ref={particlesRef} geometry={particlesGeometry}>
            <myShaderMaterial />
        </points>

        {/* Invisible plane for raycaster to detect particles (doesnt work directly with points) */}
        <mesh
            ref={invisiblePlaneRef}
        >
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial color='blue' visible={false} side={THREE.DoubleSide} />
        </mesh>
    </>
    )
}

export default Experience