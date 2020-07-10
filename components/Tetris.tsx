import React, { useEffect, useRef, useState } from 'react'
import { NextComponentType } from 'next'

export const Tetris: NextComponentType = () => {
  const canvasRef = useRef(null)
  const getContext = (): CanvasRenderingContext2D => {
    const canvas: any = canvasRef.current
    return canvas.getContext('2d')
  }
  const drawRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = null
  ) => {
    const ctx: CanvasRenderingContext2D = getContext()
    if (color !== null) {
      ctx.fillStyle = color
    }
    ctx.fillRect(x, y, width, height)
  }

  interface DrawPosition {
    x: number
    y: number
  }
  type MatrixRowPosition = number
  interface MatrixPosition {
    row: MatrixRowPosition
    column: number
  }

  class Canvas {
    static get blockPartsWidth() {
      return 20
    }
    static get blockPartsHeight() {
      return 20
    }
    static get maxHorizontalBlockParts() {
      return 10
    }
    static get maxVerticalBlockParts() {
      return 20
    }
    static get canvasWidth() {
      return Canvas.blockPartsWidth * Canvas.maxHorizontalBlockParts
    }
    static get canvasHeight() {
      return Canvas.blockPartsHeight * Canvas.maxVerticalBlockParts
    }
    static get blockPartsCount() {
      return 4
    }

    private blockParts: {
      startPositions: Array<MatrixPosition>
      color: string
    }
    private blockFrame: number
    private blockMoveX: number
    private droppedBlockPartsMatrix: Array<
      Array<{ dropped: boolean; color: string }>
    >

    constructor() {
      this.createBlock()
      this.droppedBlockPartsMatrix = new Array(Canvas.maxHorizontalBlockParts)
      for (let x = 0; x < Canvas.maxHorizontalBlockParts; x++) {
        this.droppedBlockPartsMatrix[x] = new Array(
          Canvas.maxVerticalBlockParts
        ).fill({ dropped: false, color: null })
      }
    }

    getRandom = (max) => {
      return Math.floor(Math.random() * Math.floor(max))
    }

    createBlock = () => {
      this.blockFrame = 0
      this.blockMoveX = 0

      const matrixSize = Canvas.blockPartsCount * 2
      const matrix = new Array(matrixSize)
      for (let y = 0; y < matrixSize; y++) {
        matrix[y] = new Array(matrixSize).fill(false)
      }

      const xList = [],
        yList = []
      let x = Math.floor(matrixSize / 2)
      let y = Math.floor(matrixSize / 2)
      matrix[x][y] = true
      xList.push(x)
      yList.push(y)
      for (let i = 1; i < Canvas.blockPartsCount; i++) {
        let r = this.getRandom(4)
        for (let l = 0; l < 4; l++) {
          let newX = x
          let newY = y
          r = (r + 1) % 4
          switch (r) {
            case 0:
              newX++
              break
            case 1:
              newX--
              break
            case 2:
              newY++
              break
            case 3:
              newY--
              break
          }
          if (!matrix[newX][newY]) {
            matrix[newX][newY] = true
            x = newX
            y = newY
            xList.push(x)
            yList.push(y)
            break
          }
        }
      }

      const r = this.getRandom(99)
      const g = this.getRandom(99)
      const b = this.getRandom(99)
      const color =
        '#' +
        r.toString().padStart(2, '0') +
        g.toString().padStart(2, '0') +
        b.toString().padStart(2, '0')

      this.blockParts = {
        startPositions: [],
        color,
      }

      const xLength = Math.max(...xList) - Math.min(...xList) + 1
      const offsetX =
        0 -
        Math.min(...xList) +
        Math.floor(Canvas.maxHorizontalBlockParts / 2) -
        Math.floor(xLength)
      const offsetY = 0 - Math.max(...yList)
      for (let x = 0; x < matrixSize; x++) {
        for (let y = 0; y < matrixSize; y++) {
          if (matrix[x][y]) {
            this.blockParts.startPositions.push({
              row: x + offsetX,
              column: y + offsetY,
            })
          }
        }
      }
    }

    moveBlock = (amount: number) => {
      let moveX = this.blockMoveX

      moveX += amount
      for (const startPosition of this.blockParts.startPositions) {
        const posX = startPosition.row + moveX
        if (posX < 0) {
          moveX = this.blockMoveX
          break
        }
        if (Canvas.maxHorizontalBlockParts <= posX) {
          moveX = this.blockMoveX
          break
        }

        const drawPosition = this.getDrawPositionOfFallingBlock(
          startPosition,
          posX
        )
        const position = this.getPositionInDroppedBlock(drawPosition)
        if (position !== null) {
          moveX = this.blockMoveX
          break
        }
      }

      this.blockMoveX = moveX
    }

    rotateBlock = () => {
      const newStartPositions: Array<MatrixPosition> = []
      const xList = []
      const yList = []
      for (const startPosition of this.blockParts.startPositions) {
        xList.push(startPosition.row)
        yList.push(startPosition.column)
      }
      const xLength = Math.max(...xList) + 1 - Math.min(...xList)
      const yLength = Math.max(...yList) + 1 - Math.min(...yList)
      const centerX = Math.min(...xList) + Math.floor(xLength / 2)
      const centerY = Math.min(...yList) + Math.floor(yLength / 2)
      const newXList = []
      const newYList = []
      for (const startPosition of this.blockParts.startPositions) {
        const offsetX = startPosition.row - centerX
        const offsetY = startPosition.column - centerY
        const posX = centerX - offsetY
        const posY = centerY + offsetX
        newStartPositions.push({
          row: posX,
          column: posY,
        })
        newXList.push(posX)
        newYList.push(posY)
      }
      const newXLength = Math.max(...newXList) + 1 - Math.min(...newXList)
      const offsetX =
        Math.floor(Canvas.maxHorizontalBlockParts / 2) -
        Math.floor(newXLength / 2) -
        Math.min(...newXList)
      const offsetY = 0 - Math.max(...newYList)
      let moveX = 0
      for (let i = 0; i < newStartPositions.length; i++) {
        newStartPositions[i].row += offsetX
        newStartPositions[i].column += offsetY

        const posX = this.getPositionXOfFallingBlock(newStartPositions[i])
        if (posX < 0) {
          const m = 0 - posX
          if (moveX < Math.abs(m)) {
            moveX = m
          }
        }
        if (Canvas.maxHorizontalBlockParts <= posX) {
          const m = Canvas.maxHorizontalBlockParts - (posX + 1)
          if (moveX < Math.abs(m)) {
            moveX = m
          }
        }
      }

      let isCollision = false
      for (const position of newStartPositions) {
        const drawPosition = this.getDrawPositionOfFallingBlock(position, moveX)
        if (this.getPositionInDroppedBlock(drawPosition) !== null) {
          isCollision = true
          break
        }
      }
      if (!isCollision) {
        this.blockMoveX += moveX
        this.blockParts.startPositions = newStartPositions
      }
    }

    getPositionXOfFallingBlock = (
      position: MatrixPosition
    ): MatrixRowPosition => {
      return position.row + this.blockMoveX
    }

    getDrawPositionOfFallingBlock = (
      position: MatrixPosition,
      row: MatrixRowPosition = null
    ): DrawPosition => {
      const posX =
        row !== null ? row : this.getPositionXOfFallingBlock(position)
      const posY = position.column
      const drawPosX = posX * Canvas.blockPartsWidth
      const drawPosY = posY * Canvas.blockPartsHeight + this.blockFrame
      return { x: drawPosX, y: drawPosY }
    }

    getDrawPositionOfDroppedBlock = (
      position: MatrixPosition
    ): DrawPosition => {
      const drawPosX = position.row * Canvas.blockPartsWidth
      const drawPosY = position.column * Canvas.blockPartsHeight
      return { x: drawPosX, y: drawPosY }
    }

    getPositionInDroppedBlock = (position: DrawPosition): MatrixPosition => {
      for (let x = 0; x < this.droppedBlockPartsMatrix.length; x++) {
        for (let y = 0; y < this.droppedBlockPartsMatrix[x].length; y++) {
          if (!this.droppedBlockPartsMatrix[x][y].dropped) {
            continue
          }
          const droppedDrawPosition1 = this.getDrawPositionOfDroppedBlock({
            row: x,
            column: y - 1,
          })
          const droppedDrawPosition2 = this.getDrawPositionOfDroppedBlock({
            row: x,
            column: y,
          })
          const withinX = droppedDrawPosition1.x === position.x
          const withinY =
            droppedDrawPosition1.y <= position.y &&
            position.y <= droppedDrawPosition2.y

          if (withinX && withinY) {
            return { row: x, column: y }
          }
        }
      }

      return null
    }

    drawBlock = () => {
      this.blockFrame++

      let droppedPositionOffset: MatrixPosition = null
      const dropped = () => droppedPositionOffset !== null
      for (const startPosition of this.blockParts.startPositions) {
        const posX = this.getPositionXOfFallingBlock(startPosition)
        const drawPosition = this.getDrawPositionOfFallingBlock(startPosition)
        const drawPosX = drawPosition.x
        const drawPosY = drawPosition.y

        if (drawPosY + Canvas.blockPartsHeight >= Canvas.canvasHeight) {
          droppedPositionOffset = {
            row: posX - startPosition.row,
            column: Canvas.maxVerticalBlockParts - 1 - startPosition.column,
          }
        } else {
          const position = this.getPositionInDroppedBlock(drawPosition)
          if (position !== null) {
            droppedPositionOffset = {
              row: position.row - startPosition.row,
              column: position.column - 1 - startPosition.column,
            }
          }
        }

        if (!dropped()) {
          drawRect(
            drawPosX,
            drawPosY,
            Canvas.blockPartsWidth,
            Canvas.blockPartsHeight,
            this.blockParts.color
          )
        }
      }
      if (dropped()) {
        for (const startPosition of this.blockParts.startPositions) {
          this.droppedBlockPartsMatrix[
            startPosition.row + droppedPositionOffset.row
          ][startPosition.column + droppedPositionOffset.column] = {
            dropped: true,
            color: this.blockParts.color,
          }
        }

        this.createBlock()
      }

      for (let y = Canvas.maxVerticalBlockParts - 1; y >= 0; y--) {
        let filled = this.droppedBlockPartsMatrix.length > 0
        for (let x = 0; x < this.droppedBlockPartsMatrix.length; x++) {
          if (!this.droppedBlockPartsMatrix[x][y].dropped) {
            filled = false
            break
          }
        }
        if (filled) {
          for (let xx = 0; xx < this.droppedBlockPartsMatrix.length; xx++) {
            for (let yy = y; yy > 0; yy--) {
              this.droppedBlockPartsMatrix[xx][
                yy
              ] = this.droppedBlockPartsMatrix[xx][yy - 1]
            }
          }
          y++
        }
      }
      for (let x = 0; x < this.droppedBlockPartsMatrix.length; x++) {
        for (let y = 0; y < this.droppedBlockPartsMatrix[x].length; y++) {
          if (!this.droppedBlockPartsMatrix[x][y].dropped) {
            continue
          }
          const droppedDrawPosition = this.getDrawPositionOfDroppedBlock({
            row: x,
            column: y,
          })
          drawRect(
            droppedDrawPosition.x,
            droppedDrawPosition.y,
            Canvas.blockPartsWidth,
            Canvas.blockPartsHeight,
            this.droppedBlockPartsMatrix[x][y].color
          )
        }
      }
    }
  }

  const update = (canvas: Canvas) => () => {
    drawRect(0, 0, Canvas.canvasWidth, Canvas.canvasHeight, '#eeeeee')
    canvas.drawBlock()
    requestAnimationFrame(update(canvas))
  }

  const [canvas, updateCanvas] = useState<Canvas>()

  useEffect(() => {
    const canvas = new Canvas()
    updateCanvas(canvas)

    window.addEventListener(
      'keydown',
      (event) => {
        switch (event.key) {
          case 'r':
            canvas.rotateBlock()
            return
          case 'ArrowLeft':
            canvas.moveBlock(-1)
            break
          case 'ArrowRight':
            canvas.moveBlock(1)
            break
        }
      },
      false
    )

    update(canvas)()
  }, [])

  const moveLeft = () => {
    canvas.moveBlock(-1)
  }
  const moveRight = () => {
    canvas.moveBlock(1)
  }
  const rotate = () => {
    canvas.rotateBlock()
  }

  return (
    <>
      <div className="canvas">
        <canvas
          ref={canvasRef}
          width={Canvas.canvasWidth}
          height={Canvas.canvasHeight}
        />
      </div>
      <button type="button" onClick={moveLeft}>
        ←
      </button>
      <button type="button" onClick={moveRight}>
        →
      </button>
      <button type="button" onClick={rotate}>
        ↻
      </button>
      <style jsx>{`
        canvas {
          margin: 0px auto;
          border: 1px solid silver;
        }
        .canvas {
          text-align: center;
        }
        button {
          font-size: 1.4em;
          margin: 10px;
        }
      `}</style>
    </>
  )
}
