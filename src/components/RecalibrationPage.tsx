import * as React from 'react'
import {FC, ReactElement, useEffect, useState} from 'react'
import {Button, Col, Form, InputGroup, Row} from 'react-bootstrap'
import {fromTiltFormula, getScaledPolynomial, IPolynomial, toTiltFormula} from './polynomial'
import {MyGraph} from './Graph'

const DEFAULT_FORMULA = '0.9352899244960027 + 0.004654599094590861 *tilt-0.00006370586340747028 *tilt*tilt + 4.333614746479256e-7 *tilt*tilt*tilt'

export const RecalibrationPage: FC = (): ReactElement => {
  const [originalPolynomial, setOriginalPolynomial] = useState(null as IPolynomial)
  const [correctedPolynomial, setCorrectedPolynomial] = useState(null as IPolynomial)
  const [originalGravity, setOriginalGravity] = useState(0)
  const [finalGravity, setFinalGravity] = useState(0)

  return <>
    <h1>iSpindel recalibration tool</h1>
    <p>Use this page if you have previously calibrated your iSpindel, but want to adjust the calibration without re-measuring the gravity of sugar solutions all over again</p>
    <p>Just enter in your existing tilt formula, and specify readings of OG/FG from your iSpindel along with correct readings from your hydrometer</p>

    <RecalibrationForm
      onChangeOriginalPolynomial={setOriginalPolynomial}
      onChangeCorrectedPolynomial={setCorrectedPolynomial}
      onChangeGravities={(og, fg) => {
        setOriginalGravity(og)
        setFinalGravity(fg)
      }}
    />
    <MyGraph
      originalPolynomial={originalPolynomial}
      correctedPolynomial={correctedPolynomial}
      originalGravity={originalGravity}
      finalGravity={finalGravity}
    />
  </>
}

interface IProps {
  onChangeOriginalPolynomial: (poly: IPolynomial) => void
  onChangeCorrectedPolynomial: (poly: IPolynomial) => void
  onChangeGravities: (og: number, fg: number) => void
}

const RecalibrationForm: FC<IProps> = ({onChangeOriginalPolynomial, onChangeCorrectedPolynomial, onChangeGravities}): ReactElement => {
  const [existingFormula, setExistingFormula] = useState(null as string)
  const [copied, setCopied] = useState(false)
  const [iSpindelOG, setISpindelOG] = useState(0)
  const [iSpindelFG, setISpindelFG] = useState(0)
  const [hydrometerOG, setHydrometerOG] = useState(0)
  const [hydrometerFG, setHydrometerFG] = useState(0)

  const polynomial = fromTiltFormula(existingFormula)
  const correctedPolynomial = getScaledPolynomial(polynomial, iSpindelOG, iSpindelFG, hydrometerOG, hydrometerFG)
  const correctedFormula = toTiltFormula(correctedPolynomial)
  const valid = existingFormula && iSpindelOG && iSpindelFG && hydrometerOG && hydrometerFG

  const handleExistingFormulaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    setExistingFormula(event.target.value)
    setCopied(false)
  }

  useEffect(() => {
    onChangeOriginalPolynomial(fromTiltFormula(existingFormula))
    onChangeCorrectedPolynomial(correctedPolynomial)
    onChangeGravities(iSpindelOG, iSpindelFG)
  }, [existingFormula, hydrometerOG, hydrometerFG, iSpindelOG, iSpindelFG, correctedPolynomial, onChangeOriginalPolynomial, onChangeCorrectedPolynomial, onChangeGravities])

  return <>
    <Form noValidate validated={true}>
      <Form.Group>
        <Form.Label column><h3>Existing tilt formula</h3></Form.Label>
        <Form.Control name="existingFormula" required={true} placeholder={DEFAULT_FORMULA} onChange={handleExistingFormulaChange}/>
        <Form.Control.Feedback type="invalid">Enter your existing tilt formula here</Form.Control.Feedback>
      </Form.Group>

      <Form.Label column><h3>Original gravity adjustment</h3></Form.Label>
      <Row>
        <Form.Group as={Col}>
          <Form.Label>iSpindel reading</Form.Label>
          <Form.Control name="iSpindelOG" required={true} placeholder="1.050" type="number" step="0.001" onChange={event => {
            setISpindelOG(parseFloat(event.target.value))
          }}/>
          <Form.Control.Feedback type="invalid">Enter your OG reading as reported by the iSpindel</Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col}>
          <Form.Label>Hydrometer reading</Form.Label>
          <Form.Control name="hydrometerOG" required={true} placeholder="1.045" type="number" step="0.001" onChange={event => {
            setHydrometerOG(parseFloat(event.target.value))
          }}/>
          <Form.Control.Feedback type="invalid">Enter your OG reading as measured by your hydrometer</Form.Control.Feedback>
        </Form.Group>
      </Row>

      <Form.Label column><h3>Final gravity adjustment</h3></Form.Label>
      <Row>
        <Form.Group as={Col}>
          <Form.Label>iSpindel reading</Form.Label>
          <Form.Control name="iSpindelFG" required={true} placeholder="1.020" type="number" step="0.001" onChange={event => {
            setISpindelFG(parseFloat(event.target.value))
          }}/>
          <Form.Control.Feedback type="invalid">Enter your FG reading as reported by the iSpindel</Form.Control.Feedback>
        </Form.Group>

        <Form.Group as={Col}>
          <Form.Label>Hydrometer reading</Form.Label>
          <Form.Control name="hydrometerFG" required={true} placeholder="1.015" type="number" step="0.001" onChange={event => {
            setHydrometerFG(parseFloat(event.target.value))
          }}/>
          <Form.Control.Feedback type="invalid">Enter your FG reading as measured by your hydrometer</Form.Control.Feedback>
        </Form.Group>
      </Row>

      <Form.Group>
        <Form.Group>
          <Form.Label column><h3>Adjusted tilt formula</h3></Form.Label>
          <InputGroup>
            <Form.Control
              name="existingFormula"
              disabled={true}
              value={correctedFormula || 'Modified tilt formula will appear here'}
            />
            <Button disabled={copied || !valid} onClick={async () => {
              await navigator.clipboard.writeText(DEFAULT_FORMULA)
              setCopied(true)
            }}>{copied ? 'Copied' : 'Copy'}</Button>
          </InputGroup>
        </Form.Group>
      </Form.Group>
    </Form>
  </>

}
