import React, { useRef, useMemo, useEffect } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three'

import vertexShader from '../shaders/particles/vertex.glsl'
import fragmentShader from '../shaders/particles/fragment.glsl'

const Experience = () => {
    const particlesRef = useRef()
    const { size } = useThree()

    // Create particles geometry - using PlaneGeometry
    // This creates a 32x32 grid = 1,024 vertices arranged in a plane.
    // This geometry is parsed as [x,y] coordinates, that build  our points.
    const particlesGeometry = useMemo(() => {
        return new THREE.PlaneGeometry(10, 10, 32, 32)
    }, [])

    // Create shader material with resolution uniform
    const MyShaderMaterial = shaderMaterial({
        uResolution: new THREE.Vector2(100, 100),
    },
        vertexShader,
        fragmentShader
    )
    console.log(window.innerWidth, window.innerHeight)

    extend({ MyShaderMaterial: MyShaderMaterial })

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

    })

    return (<>
        <OrbitControls 
            makeDefault 
            enableDamping={true}
        />
        <color args={['#181818']} attach='background' />

        {/* Points using PlaneGeometry */}
        <points ref={particlesRef} geometry={particlesGeometry}>
            <myShaderMaterial />
        </points>
    </>
    )
}

export default Experience