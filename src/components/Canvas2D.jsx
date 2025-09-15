// rationale:
// We want to create a 2d canvas that is used to draw the cursor animation
// then inject the 2d canvas as a texture into the 3d scene
// this allows us to have more advanced animation and trail/hold effects
// if we just worked direct with mouse-x-y and vertex uv we wouldn't be able to have the advanced effects

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useState } from 'react'

const Canvas2D = forwardRef(({ canvasCoords }, ref) => {
    const canvas2DRef = useRef(null)
    // we create vars here so on one useEffect we can set the ctx and glowImg and then use them in another useEffect
    const [glowImg, setGlowImg] = useState(null)

    const canvasSize = 128
    const glowSize = canvasSize * 0.25
    const [prevCoords, setPrevCoords] = useState(null)


    // load glow image and set black background of canvas with rect
    useEffect(() => {
        const canvas = canvas2DRef.current
        let ctx = canvas.getContext('2d')

        ctx.fillRect(0, 0, canvasSize, canvasSize)
        ctx.fillStyle = 'black'
        // ctx.fillStyle = 'white'

        // NOTE: this is important to do inside useEffect otherwise the image will not be loaded
        // Create and load image inside useEffect
        const img = new Image()
        // Set up the onload handler BEFORE setting src
        img.onload = () => {
            // Image is now loaded, safe to draw
            // ctx.drawImage(glowImg, 0, 0, 12, 12)
            console.log('Image loaded successfully')
            setGlowImg(img)
            // now we can use the glowImg in the other useEffect
        }
        // Handle loading errors
        img.onerror = () => {
            console.error('Failed to load glow image')
        }

        // Set src AFTER setting up handlers
        img.src = './static/glow.png'



    }, [])

    useEffect(() => {
        // Calculate Alfa based on cursor distance from previous position
        // remember this is on the redraw of the new opaque black canvas
        let alpha = 1 // if coords are undefined
        if (canvasCoords && prevCoords) {
            const distance = Math.sqrt(
                (canvasCoords.x - prevCoords.x) ** 2 +
                (canvasCoords.y - prevCoords.y) ** 2
            )
            // This controls how fast the glow fades
            // hence how fast the particles fade/animate back to rest
            alpha = Math.min(1, distance * 20)
        }

        const canvas = canvas2DRef.current
        let ctx = canvas.getContext('2d')


        if (ctx && glowImg) {
            // fade previous rend er by drawing black rect over the top (low opacity)
            ctx.globalCompositeOperation = 'source-over' // this is default rendering on top of existing
            ctx.fillStyle = 'black'
            // ctx.fillStyle = 'white'
            ctx.globalAlpha = 0.02
            ctx.fillRect(0, 0, canvasSize, canvasSize)
            // note there is a shadowing effect here which is not ideal 
            // its a precision issue with canvas where its close to 0 (black) but it wont got to 0 cos the increment is too small
            ctx.globalAlpha = alpha // change opacity back so new glow renders right

            // The 'lighten' blend mode compares each pixel of the new drawing with 
            // the corresponding pixel already on the canvas and keeps the lighter of the two values
            ctx.globalCompositeOperation = 'lighten'

            // note canvasCoords is [0,0] bot left [1,1] top right (we need to translate to coordinates on our 2d canvas [scale and coordinate plane])
            // 2d canvas is [0,0] top left [128,128] bottom right
            let targetX = canvasCoords.x * canvasSize - glowSize / 2
            let targetY = canvasSize - canvasCoords.y * canvasSize - glowSize / 2
            ctx.drawImage(glowImg, targetX, targetY, glowSize, glowSize)
        }



        // update previous coords state at the end (so when its called again the prev will have the old coords)
        setPrevCoords(canvasCoords)
    }, [canvasCoords, glowImg])


    // Expose canvas to parent
    useImperativeHandle(ref, () => ({
        getCanvas: () => canvas2DRef.current,
        clearCanvas: () => {
            if (canvas2DRef.current) {
                const ctx = canvas2DRef.current.getContext('2d')
                ctx.clearRect(0, 0, canvasSize, canvasSize)
            }
        }
    }))

    return (<>

        <canvas
            ref={canvas2DRef}
            id="canvas2D"
            width={canvasSize} // number of pixels
            height={canvasSize}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '256px', // stretching the canvas (num pixels stay the same)
                height: '256px',
                zIndex: 10,
                // visibility: 'hidden'
            }}
        ></canvas>

    </>)
})

export default Canvas2D
