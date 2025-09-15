
import './App.css'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Experience from './components/Experience'
import Canvas2D from './components/Canvas2D'
import { useState, useRef } from 'react'


function App() {

  const [canvasCoords, setCanvasCoords] = useState([9999, 9999])
  const canvas2DRef = useRef()



  return (
    <>
      <Canvas
        // note this fixes the tone mapping (colors look better)
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
          gl.outputEncoding = THREE.sRGBEncoding
          gl.antialias = true
        }}
        shadows={true}
        camera={{
          fov: 35,
          near: 0.1,
          far: 100,
          position: [0, 0, 18]
        }}
      >
        <Experience
          onCanvasCoordsChange={setCanvasCoords}
          canvas2DRef={canvas2DRef} // passing the ref to the child component
        />


      </Canvas>

      <Canvas2D
        ref={canvas2DRef} // this ref is being lifted up to the parent component
        canvasCoords={canvasCoords}
      />

    </>
  )
}

export default App
