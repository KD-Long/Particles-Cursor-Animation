import React, { useRef, useMemo, useEffect, useState } from 'react'
import { extend, useFrame, useThree, useLoader } from '@react-three/fiber';
import { shaderMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three'
import { TextureLoader } from 'three';

import vertexShader from '../shaders/particles/vertex.glsl'
import fragmentShader from '../shaders/particles/fragment.glsl'

const Experience = ({ onCanvasCoordsChange, canvas2DRef }) => {
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




    let [picture1, picture2, picture3, picture4] = useLoader(TextureLoader,
        [
            './static/picture-1.png',
            './static/picture-2.png',
            './static/picture-3.png',
            './static/picture-4.png',
        ]
    )
    // Create canvas texture
    const canvasTexture = useMemo(() => {
        if (canvas2DRef.current) {
            const texture = new THREE.CanvasTexture(canvas2DRef.current)
            texture.needsUpdate = true
            return texture
        }
        return null
    }, [canvas2DRef])




        // Create particles geometry - using PlaneGeometry
        // This creates a 32x32 grid = 1,024 vertices arranged in a plane.
        // This geometry is parsed as [x,y] coordinates, that build  our points.
        const particlesGeometry = useMemo(() => {
            return new THREE.PlaneGeometry(10, 10, 128, 128)
        }, [])

        // Create shader material with resolution uniform
        const MyShaderMaterial = shaderMaterial({
            uResolution: new THREE.Vector2(100, 100),
            uPicture: picture1,
            uCanvasTexture: canvasTexture,
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
            // Update uniforms if needed    
            // Update raycaster
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
            }

            // remind render to update the canvas texture
            if (canvasTexture && canvas2DRef.current) {
                canvasTexture.needsUpdate = true
            }

        })

        return (<>
            {/* Note this seems to be preventing right clicking to open the context menu on the browser (e.g inspect element ) */}
            <OrbitControls
                makeDefault
                enableDamping={true}
            />
            <color args={['#181818']} attach='background' />

            {/* Points using PlaneGeometry */}
            <points ref={particlesRef} geometry={particlesGeometry}>
                <myShaderMaterial />
            </points>

            {/* Invisible plane for raycaster to detect particles (doesnt work directly with points) */}
            <mesh
                ref={invisiblePlaneRef}
            >
                <planeGeometry args={[10, 10]} />
                <meshBasicMaterial color='blue' visible={false} />
            </mesh>
        </>
        )
    }

export default Experience