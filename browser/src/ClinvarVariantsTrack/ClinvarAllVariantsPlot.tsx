import { symbol, symbolCircle, symbolCross, symbolDiamond, symbolTriangle } from 'd3-shape'
import { debounce } from 'lodash-es'
import React, { useCallback, useMemo, useState } from 'react'

import { TooltipAnchor } from '@gnomad/ui'

import {
  CLINICAL_SIGNIFICANCE_CATEGORY_COLORS,
  clinvarVariantClinicalSignificanceCategory,
  clinvarVariantConsequenceCategory,
  ClinicalSignificance,
} from './clinvarVariantCategories'
import { ClinvarVariant } from '../VariantPage/VariantPage'
import ClinvarVariantTooltip from './ClinvarVariantTooltip'
import { Transcript } from '../TranscriptPage/TranscriptPage'

const symbolColor = (clinical_significance: ClinicalSignificance) =>
  CLINICAL_SIGNIFICANCE_CATEGORY_COLORS[clinical_significance]

// For a description of HGVS frameshift notation, see
// https://varnomen.hgvs.org/recommendations/protein/variant/frameshift/
const getFrameshiftTerminationSitePosition = (
  variant: ClinvarVariant,
  transcript?: Transcript
): number => {
  if (!transcript || !variant.hgvsp) {
    return variant.pos
  }
  const match = /^p\.[a-z]{3}(\d+)[a-z]{3,}?fsTer(\d+|\?)$/i.exec(variant.hgvsp)

  // If HGVSp annotation does not match a frameshift, draw the termination site at the variant's position
  if (!match) {
    return variant.pos
  }

  // Codon of the first amino acid changed
  const position = Number(match[1])
  // Codon within the new reading frame of the termination site
  const terminationSitePosition = match[2]

  const exons = transcript.exons.sort((e1, e2) => e1.start - e2.start)

  // Codon numbers in HGVSp notation start from the 5' end for the + strand and the 3' end for the - strand.
  if (transcript.strand === '-') {
    exons.reverse()
  }

  // Codon positions extracted from HGVS notation start at the CDS region and may extend into the downstream UTR
  const codingAndDownstreamExons = exons.slice(exons.findIndex((e) => e.feature_type === 'CDS'))

  // Termination site position may be "?" if the new reading frame does not encounter a stop codon
  // In this case, place the termination site at the end of the transcript
  if (terminationSitePosition === '?') {
    return transcript.strand === '-'
      ? codingAndDownstreamExons[0].start
      : codingAndDownstreamExons[codingAndDownstreamExons.length - 1].stop
  }

  // Offset in bases from the start of the transcript's CDS region to the termination site
  // Codon numbers are 1 indexed
  const baseOffset = (position - 1 + Number(terminationSitePosition) - 1) * 3

  let remainingOffset = baseOffset
  // Termination site should always fall within an exon
  const exonContainingTerminationSite = codingAndDownstreamExons.find((e) => {
    const exonSize = e.stop - e.start + 1
    if (remainingOffset < exonSize) {
      return true
    }
    remainingOffset -= exonSize
    return false
  })

  return transcript.strand === '-'
    ? /* @ts-expect-error */
      exonContainingTerminationSite.stop - remainingOffset
    : /* @ts-expect-error */
      exonContainingTerminationSite.start + remainingOffset
}

type ClinvarAllVariantsPlotProps = {
  scalePosition: (...args: any[]) => any
  transcripts: Transcript[]
  variants: ClinvarVariant[]
  width: number
  onClickVariant: (...args: any[]) => any
}

type Category = 'frameshift' | 'other_lof' | 'missense' | 'splice_region' | 'other'

type VariantRenderingDetails = {
  variant: ClinvarVariant
  xStart: number
  xEnd: number
  y: number
  clinicalSignificance: ClinicalSignificance
}

const ClinvarAllVariantsPlot = ({
  scalePosition,
  transcripts,
  variants,
  width,
  onClickVariant,
}: ClinvarAllVariantsPlotProps) => {
  const [highlightedCategory, _setHighlightedCategory] = useState<Category | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setHighlightedCategory = useCallback(debounce(_setHighlightedCategory, 150), [
    _setHighlightedCategory,
  ])

  const variantsByClinicalSignificance: Record<ClinicalSignificance, ClinvarVariant[]> = {
    pathogenic: [],
    uncertain: [],
    benign: [],
    other: [],
  }

  variants.forEach((variant) => {
    const category = clinvarVariantClinicalSignificanceCategory(variant)
    variantsByClinicalSignificance[category].push(variant)
  })

  const layerOrdering: ClinicalSignificance[] = ['pathogenic', 'uncertain', 'benign', 'other']

  const rows: VariantRenderingDetails[][] = []
  const pointSpacing = 9
  const rowHeight = 10
  layerOrdering.forEach((layerName) => {
    variantsByClinicalSignificance[layerName].forEach((variant) => {
      let xStart: number
      let xEnd: number

      if (variant.major_consequence === 'frameshift_variant') {
        // For transcripts on the negative strand, the termination site will be at a lower global position
        // than the variant's position.
        const pos1 = scalePosition(variant.pos)
        const transcript = transcripts.find((t) => t.transcript_id === variant.transcript_id)
        const pos2 = transcript
          ? scalePosition(getFrameshiftTerminationSitePosition(variant, transcript))
          : pos1
        xStart = Math.min(pos1, pos2)
        xEnd = Math.max(pos1, pos2)
      } else {
        xStart = scalePosition(variant.pos)
        xEnd = xStart
      }

      let rowIndex = rows.findIndex(
        (rowPoints) =>
          !rowPoints.some((p) => xStart < p.xEnd + pointSpacing && xEnd >= p.xStart - pointSpacing)
      )

      if (rowIndex === -1) {
        rows.push([])
        rowIndex = rows.length - 1
      }

      rows[rowIndex].push({
        variant,
        xStart,
        xEnd,
        clinicalSignificance: layerName,
        y: rowHeight * (rowIndex + 0.5),
      })
    })
  })

  const plotHeight = rows.length * rowHeight

  const circle = useMemo(() => symbol().size(32).type(symbolCircle)(), [])
  const cross = useMemo(() => symbol().size(40).type(symbolCross)(), [])
  const diamond = useMemo(() => symbol().size(32).type(symbolDiamond)(), [])
  const triangle = useMemo(() => symbol().size(32).type(symbolTriangle)(), [])

  /**
   * Render symbol based on variant's consequence
   * - LoF / essential splice site: square
   * - Frameshift: triangle dash square
   * - Missense / in-frame indel: triangle
   * - Non-essential splice region: diamond
   * - Synonymous / non-coding: circle
   * - Other: star
   */
  const renderMarker = (point: VariantRenderingDetails) => {
    const { variant, clinicalSignificance } = point
    const category = clinvarVariantConsequenceCategory(variant)
    const fill = symbolColor(clinicalSignificance)
    let opacity = 1
    if (
      highlightedCategory &&
      !(
        highlightedCategory === category ||
        (category === 'synonymous' && highlightedCategory === 'other')
      )
    ) {
      opacity = 0.2
    }

    if (category === 'frameshift') {
      const transcript = transcripts.find((t) => t.transcript_id === variant.transcript_id)
      const terminationSitePosition = getFrameshiftTerminationSitePosition(variant, transcript)
      const frameshiftMinPos = Math.min(variant.pos, terminationSitePosition)
      const frameshiftMaxPos = Math.max(variant.pos, terminationSitePosition)
      // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
      const frameshiftExonRegions = transcript.exons
        .sort((e1, e2) => e1.start - e2.start)
        .filter((e) => e.start <= frameshiftMaxPos && e.stop >= frameshiftMinPos)
        .map((e) => ({
          start: Math.max(e.start, frameshiftMinPos),
          stop: Math.min(e.stop, frameshiftMaxPos),
        }))

      return (
        <g onClick={() => onClickVariant(variant)}>
          <rect
            x={point.xStart}
            y={plotHeight - point.y - 5}
            width={point.xEnd - point.xStart}
            height={10}
            // transparent instead of none is necessary for tooltip hover
            fill="transparent"
            opacity={opacity}
            style={{ cursor: 'pointer' }}
          />
          {frameshiftExonRegions.map((r, i, regions) => {
            const lineY = plotHeight - point.y
            return (
              <React.Fragment key={`${r.start}-${r.stop}`}>
                {i !== 0 && (
                  <line
                    x1={scalePosition(regions[i - 1].stop)}
                    y1={lineY}
                    x2={scalePosition(r.start)}
                    y2={lineY}
                    stroke="#333"
                    strokeDasharray="2 5"
                    strokeWidth={0.5}
                    opacity={opacity}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                <line
                  x1={scalePosition(r.start)}
                  y1={lineY}
                  x2={scalePosition(r.stop)}
                  y2={lineY}
                  stroke="#333"
                  strokeWidth={0.5}
                  opacity={opacity}
                  style={{ cursor: 'pointer' }}
                />
              </React.Fragment>
            )
          })}
          <path
            // @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message
            d={cross}
            fill={fill}
            stroke="#666"
            strokeWidth={0.5}
            transform={`translate(${scalePosition(terminationSitePosition)},${
              plotHeight - point.y
            }) rotate(45)`}
            opacity={opacity}
            style={{ cursor: 'pointer' }}
          />
        </g>
      )
    }

    let symbolPath = circle
    let symbolRotation = 0
    let symbolOffset = 0
    if (category === 'other_lof') {
      symbolPath = cross
      symbolRotation = 45
    } else if (category === 'missense') {
      symbolPath = triangle
      symbolOffset = 1
    } else if (category === 'splice_region') {
      symbolPath = diamond
    }
    return (
      <path
        // @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message
        d={symbolPath}
        transform={`translate(${point.xStart},${
          plotHeight - point.y + symbolOffset
        }) rotate(${symbolRotation})`}
        fill={fill}
        stroke="#666"
        strokeWidth={0.5}
        opacity={opacity}
        onClick={() => onClickVariant(variant)}
        style={{ cursor: 'pointer' }}
      />
    )
  }

  return (
    <svg height={plotHeight + 25} width={width}>
      <g transform="translate(0, 9)">
        <g
          onMouseEnter={() => setHighlightedCategory('frameshift')}
          onMouseLeave={() => setHighlightedCategory(null)}
        >
          <line x1={0} y1={0} x2={10} y2={0} stroke="#333" strokeWidth={0.5} />
          {/* @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message */}
          <path d={cross} fill="#333" stroke="none" transform="translate(10,0) rotate(45)" />
          <text dy="0.3em" fontSize={12} x={16}>
            Frameshift
          </text>
        </g>
        <g
          transform="translate(86,0)"
          onMouseEnter={() => setHighlightedCategory('other_lof')}
          onMouseLeave={() => setHighlightedCategory(null)}
        >
          {/* @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message */}
          <path d={cross} fill="#333" stroke="none" transform="rotate(45)" />
          <text dy="0.3em" fontSize={12} x={6}>
            Other pLoF
          </text>
        </g>
        <g
          transform="translate(165,0)"
          onMouseEnter={() => setHighlightedCategory('missense')}
          onMouseLeave={() => setHighlightedCategory(null)}
        >
          {/* @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message */}
          <path d={triangle} fill="#333" stroke="none" />
          <text dy="0.3em" fontSize={12} x={6}>
            Missense / Inframe indel
          </text>
        </g>
        <g
          transform="translate(318,0)"
          onMouseEnter={() => setHighlightedCategory('splice_region')}
          onMouseLeave={() => setHighlightedCategory(null)}
        >
          {/* @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message */}
          <path d={diamond} fill="#333" stroke="none" />
          <text dy="0.3em" fontSize={12} x={6}>
            Splice region
          </text>
        </g>
        <g
          transform="translate(406,0)"
          onMouseEnter={() => setHighlightedCategory('other')}
          onMouseLeave={() => setHighlightedCategory(null)}
        >
          {/* @ts-expect-error TS(2322) FIXME: Type 'string | null' is not assignable to type 'st... Remove this comment to see the full error message */}
          <path d={circle} fill="#333" stroke="none" />
          <text dy="0.3em" fontSize={12} x={7}>
            Synonymous / non-coding
          </text>
        </g>
      </g>
      <g transform="translate(0, 25)">
        {rows.map((points, rowIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={rowIndex}>
            {points.map((point) => (
              <TooltipAnchor
                key={point.variant.variant_id}
                tooltipComponent={ClinvarVariantTooltip}
                // @ts-expect-error TS(2322) FIXME: Type '{ children: Element; key: any; tooltipCompon... Remove this comment to see the full error message
                variant={point.variant}
              >
                {renderMarker(point)}
              </TooltipAnchor>
            ))}
          </React.Fragment>
        ))}
      </g>
      <line x1={0} y1={plotHeight + 25} x2={width} y2={plotHeight + 25} stroke="#424242" />
    </svg>
  )
}

export default ClinvarAllVariantsPlot
