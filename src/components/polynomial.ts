// import regression from 'regression';
const regression = require('regression')
const Polynomial = require('polynomial');

export interface IPolynomial {
  coeff: number[]
  eval: (num: number) => number
}

export const fromTiltFormula = (input: string) => {
  if (!input) {
    return null
  }

  let temp = input.replace('tilt*tilt*tilt', 'tilt^3') as string
  temp = temp.replace('tilt*tilt', 'tilt^2') as string
  temp = temp.replaceAll('tilt', 'x')
  temp = temp.replaceAll('*', '')
  temp = temp.replaceAll(' ', '')

  // the Polynomial library does not like scientific representation (7e-9) for coefficients.
  // It was too hard for me to modify the regex in the polynomial library to support them, so just replace them directly
  // in the formula string here
  const coeffsInScientificNotation = temp.match(/\d+\.?\d+e-?\d+/g)
  coeffsInScientificNotation && coeffsInScientificNotation.forEach(coeff => {
    const num = parseFloat(coeff)
    const exponent = Math.abs(Math.log10(num))
    temp=temp.replace(coeff, parseFloat(coeff).toFixed(exponent + 6)) // Add sufficient precision to the 0.0000... representation of the number
  })
  return new Polynomial(temp)
}

const termWithAddition = (num: number) => (
  num > 0 ? ` + ${num}` : ` ${num}`
)

export const toTiltFormula = (polynomial: IPolynomial) => {
  if (!polynomial) {
    return null
  }

  let builder = polynomial.coeff[0].toString()

  if (polynomial.coeff[1]) {
    builder += termWithAddition(polynomial.coeff[1]) + ' * tilt'
  }
  if (polynomial.coeff[2]) {
    builder += termWithAddition(polynomial.coeff[2]) + ' * tilt*tilt'
  }
  if (polynomial.coeff[3]) {
    builder += termWithAddition(polynomial.coeff[3]) + ' * tilt*tilt*tilt'
  }
  return builder
}

export const getScaledPolynomial = (
  polynomial: IPolynomial,
  originalOG: number,
  originalFG: number,
  correctedOG: number,
  correctedFG: number) => {

  if (!polynomial || !originalOG || !originalFG || !correctedOG || !correctedFG) {
    return null
  }

  // get 4 points from the original formula to form the basis of a new linear regression model
  const originalPoints = [
    [0, polynomial.eval(0)],
    [30, polynomial.eval(30)],
    [60, polynomial.eval(60)],
    [90, polynomial.eval(90)],
  ]

  const tiltForOG = findTiltForGravity(polynomial, originalOG)
  const tiltForFG = findTiltForGravity(polynomial, originalFG)

  // create a function that will 'correct' (ie, scale) the gravity for a given tilt
  // This should work so that f(originalGravity) = correctedGravity for both OG and FG
  const correctGravity = (tilt: number, gravity: number) => {
    const ogScaleFactor = correctedOG / originalOG
    const fgScaleFactor = correctedFG / originalFG

    const tiltAsPercentage = (tilt - tiltForOG) / (tiltForFG - tiltForOG)
    return gravity * (((1 - tiltAsPercentage) * ogScaleFactor) + (tiltAsPercentage) * fgScaleFactor)
  }

  // Now we scale the points
  const scaledPoints = originalPoints.map(p => [p[0], correctGravity(p[0], p[1])])

  // now perform a regression on these new points
  const newPoints = regression.polynomial(scaledPoints, {order: 3, precision: 12})

  // Coefficients from Polynomial and regression are in the opposite order
  return new Polynomial(newPoints.equation.reverse())
}

export const findTiltForGravity = (polynomial: IPolynomial, gravity: number) => {
  if (!polynomial) {
    return -90
  }

  // really naive implementation.
  // Just work your way up the tilt in small increments until you find the relevant gravity
  const originalValueIsPositive = polynomial.eval(0) >= gravity

  for (let tilt = 0; tilt < 90; tilt += 0.1) {
    const currentValue = polynomial.eval(tilt)
    if ((currentValue >= gravity) !== originalValueIsPositive) {
      return tilt
    }
  }
  throw new Error(`Could not find tilt value for gravity ${gravity}`)
}
