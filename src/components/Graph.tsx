import * as React from 'react'
import {FC, ReactElement, useEffect, useState} from 'react'
// @ts-ignore
import JXGBoard from 'jsxgraph-react-js'
import {findTiltForGravity} from './polynomial'

interface IProps {
  originalPolynomial: any
  correctedPolynomial: any
  originalGravity: number // for displaying points on the graph that represent gravity adjustments
  finalGravity: number // for displaying points on the graph that represent gravity adjustments
}

export const MyGraph: FC<IProps> = ({originalPolynomial, correctedPolynomial, originalGravity, finalGravity}): ReactElement => {
  const [board, setBoard] = useState(null as any)
  const [originalCurve, setOriginalCurve] = useState(null as any)
  const [correctedCurve, setCorrectedCurve] = useState(null as any)
  const [originalOGPoint, setOriginalOGPoint] = useState(null as any)
  const [originalFGPoint, setOriginalFGPoint] = useState(null as any)
  const [correctedOGPoint, setCorrectedOGPoint] = useState(null as any)
  const [correctedFGPoint, setCorrectedFGPoint] = useState(null as any)

  useEffect(() => {
      if (board) {
        board.suspendUpdate()
        try {
          if (originalCurve && originalPolynomial) {
            originalCurve.Y = (tilt: number) => originalPolynomial.eval(tilt)
            originalCurve.updateCurve()
          }
          if (correctedCurve && correctedPolynomial) {
            correctedCurve.Y = (tilt: number) => correctedPolynomial.eval(tilt)
            correctedCurve.updateCurve()
          }
          if (originalGravity) {
            const tilt = findTiltForGravity(originalPolynomial, originalGravity)
            originalOGPoint.moveTo([tilt, originalGravity])
            correctedPolynomial && correctedOGPoint.moveTo([tilt, correctedPolynomial.eval(tilt)])
          }
          if (finalGravity) {
            const tilt = findTiltForGravity(originalPolynomial, finalGravity)
            originalFGPoint.moveTo([tilt, finalGravity])
            correctedPolynomial && correctedFGPoint.moveTo([tilt, correctedPolynomial.eval(tilt)])
          }
          board.update()
          board.unsuspendUpdate()
        } catch (error) {
          // 🤷‍ we get an error on the first render doing board.update()
        }
      }
    }, [
      board, originalPolynomial, correctedPolynomial, originalCurve, correctedCurve, originalGravity, finalGravity,
      originalOGPoint, originalFGPoint, correctedOGPoint, correctedFGPoint
    ]
  )

  const logic = (brd: any) => {
    setBoard(brd)
    brd.suspendUpdate();

    // Create the original (green) curve
    setOriginalCurve(brd.create('curve', [
      (t: number) => t,
      (t: number) => originalPolynomial ? originalPolynomial.eval(t) : 0,
      0, 90
    ], {strokeColor: 'green', strokeWidth: 3}))

    setOriginalOGPoint(brd.create(
      'point',
      [-90, 0],
      {name: '', color: 'green'})
    )
    setOriginalFGPoint(brd.create(
      'point',
      [-90, 0],
      {name: '', color: 'green'})
    )
    // Create the corrected (red) curve
    setCorrectedCurve(brd.create('curve', [
      (t: number) => t,
      (t: number) => correctedPolynomial ? correctedPolynomial.eval(t) : 0,
      0, 90
    ], {strokeColor: 'red', strokeWidth: 3}))
    setCorrectedOGPoint(brd.create(
      'point',
      [-90, 0],
      {name: '', color: 'red'})
    )
    setCorrectedFGPoint(brd.create(
      'point',
      [-90, 0],
      {name: '', color: 'red'})
    )

    brd.create('axis', [[0, 1], [90, 1]], {
      withLabel: true,
      name: 'Tilt °',
      label: {
        position: 'rt',
        offset: [-35, -25],
      },
    });

    brd.create('legend', [5, 1.18], {
        labels: ['original formula', 'corrected formula'],
        colors: ['green', 'red'],
        strokeWidth: 5
      }
    );

    brd.unsuspendUpdate();
  }

  return <JXGBoard
    className="mt-3 w-100"
    logic={logic}
    boardAttributes={{
      axis: true,
      registerEvents: false,
      showCopyright: false,
      showNavigation: false,
      boundingbox: [-10, 1.2, 90, 0.94],
      defaultAxes: {
        y: {
          withLabel: true,
          name: 'SG',
          label: {
            position: 'rt',
            offset: [-20, -10]
          },
        }
      }
    }}
  />
}
