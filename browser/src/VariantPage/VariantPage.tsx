import React from 'react'
import styled from 'styled-components'

import { Badge, Button, ExternalLink, Page } from '@gnomad/ui'

import {
  DatasetId,
  hasNonCodingConstraints,
  labelForDataset,
  referenceGenome,
} from '@gnomad/dataset-metadata/metadata'
import Delayed from '../Delayed'
import DocumentTitle from '../DocumentTitle'
import GnomadPageHeading from '../GnomadPageHeading'
import InfoButton from '../help/InfoButton'
import { BaseQuery } from '../Query'
import Link from '../Link'
import ReadData from '../ReadData/ReadData'
import StatusMessage from '../StatusMessage'
import TableWrapper from '../TableWrapper'
import { variantFeedbackUrl } from '../variantFeedback'
import ExacVariantOccurrenceTable from './ExacVariantOccurrenceTable'
import { ReferenceList } from './ReferenceList'
import GnomadAgeDistribution from './GnomadAgeDistribution'
import VariantClinvarInfo from './VariantClinvarInfo'
import VariantGenotypeQualityMetrics from './VariantGenotypeQualityMetrics'
import VariantNotFound from './VariantNotFound'
import { GnomadVariantOccurrenceTable } from './VariantOccurrenceTable'
import VariantInSilicoPredictors from './VariantInSilicoPredictors'
import GnomadNonCodingConstraintTableVariant from '../ConstraintTable/GnomadNonCodingConstraintTableVariant'
import VariantLoFCurationResults from './VariantLoFCurationResults'
import VariantPageTitle from './VariantPageTitle'
import VariantPopulationFrequencies from './VariantPopulationFrequencies'
import VariantRelatedVariants from './VariantRelatedVariants'
import VariantSiteQualityMetrics from './VariantSiteQualityMetrics'
import VariantTranscriptConsequences from './VariantTranscriptConsequences'
import { ReferenceGenome } from '@gnomad/dataset-metadata/metadata'

const Section = styled.section`
  width: 100%;
`

const ResponsiveSection = styled(Section)`
  width: calc(50% - 15px);

  @media (max-width: 992px) {
    width: 100%;
  }
`

const FlexWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  width: 100%;
`

export type NonCodingConstraint = {
  start: number
  stop: number
  possible: number
  observed: number
  expected: number
  oe: number
  z: number
}

export type StructuralVariant = {
  id: string
  ac: number
  an: number
  homozygote_count: number | null
  hemizygote_count: number | null
  ac_hemi: number | null
  ac_hom: number | null
}

export type ClinvarVariant = {
  clinical_significance: string
  clinvar_variation_id: string
  gold_stars: number
  last_evaluated?: string
  release_date: string
  review_status: string
  submissions: {
    clinical_significance: string
    conditions?: {
      medgen_id?: string
      name: string
    }[]
    last_evaluated?: string
    review_status: string
    submitter_name: string
  }[]
}

export type Histogram = {
  bin_edges: number[]
  bin_freq: number[]
  n_smaller: number | null
  n_larger: number | null
}

export type Population = {
  id: string
  ac: number
  an: number
  ac_hemi: number | null
  ac_hom: number
}

export type LocalAncestryPopulation = {
  id: string
  ac: number
  an: number
}

export type AgeDistribution = {
  het: Histogram
  hom: Histogram
}

export type SiteQualityMetric = {
  metric: string
  value: number | null
}

export type VariantQualityMetrics = {
  allele_balance: {
    alt: Histogram
  }
  genotype_depth: {
    all: Histogram
    alt: Histogram
  }
  genotype_quality: {
    all: Histogram
    alt: Histogram
  }
  site_quality_metrics: SiteQualityMetric[]
}

export type Faf95 = {
  popmax: number
  popmax_population: string
}

export type SequencingType = {
  ac: number
  an: number
  ac_hemi: number | null
  ac_hom: number
  faf95: Faf95
  filters: string[]
  populations: Population[]
  local_ancestry_populations: LocalAncestryPopulation[]
  age_distribution: AgeDistribution | null
  quality_metrics: VariantQualityMetrics
}

export type LofCuration = {
  gene_id: string
  gene_version: string
  gene_symbol: string | null
  verdict: string
  flags: string[]
  project: string
}

export type InSilicoPredictor = {
  id: string
  value: string
  flags: string[]
}

export type TranscriptConsequence = {
  consequence_terms: string[]
  domains: string[]
  gene_id: string
  gene_version: string | null
  gene_symbol: string | null
  hgvs: string | null
  hgvsc: string | null
  hgvsp: string | null
  is_canonical: boolean | null
  is_mane_select: boolean | null
  is_mane_select_version: boolean | null
  lof: string | null
  lof_flags: string | null
  lof_filter: string | null
  major_consequence: string | null
  polyphen_prediction: string | null
  refseq_id: string | null
  refseq_version: string | null
  sift_prediction: string | null
  transcript_id: string
  transcript_version: string

  canonical: boolean | null
}

export type Coverage = {
  pos: number
  mean: number | null
  median: number | null
  over_1: number | null
  over_5: number | null
  over_10: number | null
  over_15: number | null
  over_20: number | null
  over_25: number | null
  over_30: number | null
  over_50: number | null
  over_100: number | null
}

export type Variant = {
  variant_id: string
  reference_genome: ReferenceGenome
  colocated_variants: string[] | null
  chrom: string
  pos: number
  ref: string
  alt: string
  flags: string[] | null
  clinvar: ClinvarVariant | null
  exome: SequencingType | null
  genome: SequencingType | null
  lof_curations: LofCuration[] | null
  in_silico_predictors: InSilicoPredictor[] | null
  transcript_consequences: TranscriptConsequence[] | null
  liftover: any[] | null
  liftover_sources: any[] | null
  multi_nucleotide_variants?: any[]
  caid: string | null
  rsids: string[] | null
  coverage: {
    exome: Coverage | null
    genome: Coverage | null
  }
}

type VariantPageContentProps = {
  datasetId: DatasetId
  variant: {
    variant_id: string
    chrom: string
    flags: string[]
    clinvar?: any
    exome?: any
    genome?: any
    lof_curations?: any[]
    in_silico_predictors?: any[]
    non_coding_constraint: NonCodingConstraint | null
    transcript_consequences?: any[]
  }
}

const VariantPageContent = ({ datasetId, variant }: VariantPageContentProps) => {
  return (
    <FlexWrapper>
      <ResponsiveSection>
        <TableWrapper>
          {datasetId === 'exac' ? (
            // @ts-expect-error TS(2741) FIXME: Property 'coverage' is missing in type '{ variant_... Remove this comment to see the full error message
            <ExacVariantOccurrenceTable variant={variant} />
          ) : (
            <GnomadVariantOccurrenceTable
              datasetId={datasetId}
              variant={variant}
              showExomes={!datasetId.startsWith('gnomad_r3')}
            />
          )}
        </TableWrapper>

        {variant.flags && variant.flags.includes('par') && (
          <p>
            <Badge level="info">Note</Badge> This variant is found in a pseudoautosomal region.
          </p>
        )}

        {variant.flags && variant.flags.includes('lcr') && (
          <p>
            <Badge level="info">Note</Badge> This variant is found in a low complexity region.
          </p>
        )}
      </ResponsiveSection>
      <ResponsiveSection>
        <h2>External Resources</h2>
        {/* @ts-expect-error TS(2739) FIXME: Type '{ variant_id: string; chrom: string; flags: ... Remove this comment to see the full error message */}
        <ReferenceList variant={variant} />
        <h2>Feedback</h2>
        {/* @ts-expect-error TS(2786) FIXME: 'ExternalLink' cannot be used as a JSX component. */}
        <ExternalLink href={variantFeedbackUrl(variant, datasetId)}>
          Report an issue with this variant
        </ExternalLink>
      </ResponsiveSection>

      <Section>
        <h2>
          Population Frequencies <InfoButton topic="ancestry" />
        </h2>
        {datasetId.startsWith('gnomad_r3') &&
          (variant.genome.local_ancestry_populations || []).length > 0 && (
            <div
              style={{
                padding: '0 1em',
                border: '2px solid #1173bb',
                background: '#1173bb0f',
                borderRadius: '0.5em',
                marginBottom: '1em',
              }}
            >
              <p>
                <Badge level="info">NEW</Badge> Local ancestry is now available for gnomAD v3.
                Select the &ldquo;Local Ancestry&rdquo; tab below to view data. See our blog post on{' '}
                {/* @ts-expect-error TS(2786) FIXME: 'ExternalLink' cannot be used as a JSX component. */}
                <ExternalLink href="https://gnomad.broadinstitute.org/news/2021-12-local-ancestry-inference-for-latino-admixed-american-samples-in-gnomad/">
                  local ancestry inference for Latino/Admixed American samples in gnomAD
                </ExternalLink>{' '}
                for more information.
              </p>
            </div>
          )}
        <VariantPopulationFrequencies datasetId={datasetId} variant={variant} />
      </Section>

      <Section>
        <h2>Related Variants</h2>
        <VariantRelatedVariants datasetId={datasetId} variant={variant} />
      </Section>

      <Section>
        <h2>Variant Effect Predictor</h2>
        {/* @ts-expect-error TS(2741) FIXME: Property 'reference_genome' is missing in type '{ ... Remove this comment to see the full error message */}
        <VariantTranscriptConsequences variant={variant} />
      </Section>

      {variant.lof_curations && (
        <Section>
          <h2>
            LoF Curation <InfoButton topic="lof-curation" />
          </h2>
          {/* @ts-expect-error TS(2322) FIXME: Type '{ variant_id: string; chrom: string; flags: ... Remove this comment to see the full error message */}
          <VariantLoFCurationResults variant={variant} />
        </Section>
      )}

      <FlexWrapper>
        {variant.in_silico_predictors && variant.in_silico_predictors.length && (
          <ResponsiveSection>
            <h2>In Silico Predictors</h2>
            {/* @ts-expect-error TS(2322) FIXME: Type '{ variant_id: string; chrom: string; flags: ... Remove this comment to see the full error message */}
            <VariantInSilicoPredictors variant={variant} />
          </ResponsiveSection>
        )}
        {hasNonCodingConstraints(datasetId) && (
          <ResponsiveSection>
            <h2>Genomic Constraint of Surrounding 1kb Region</h2>
            <GnomadNonCodingConstraintTableVariant
              variantId={variant.variant_id}
              chrom={variant.chrom}
              nonCodingConstraint={variant.non_coding_constraint}
            />
          </ResponsiveSection>
        )}
      </FlexWrapper>

      {variant.clinvar && (
        <Section>
          <h2>ClinVar</h2>
          {/* @ts-expect-error TS(2322) FIXME: Type '{ variant_id: string; chrom: string; flags: ... Remove this comment to see the full error message */}
          <VariantClinvarInfo variant={variant} />
        </Section>
      )}

      <FlexWrapper>
        <ResponsiveSection>
          {((variant.exome || {}).age_distribution || (variant.genome || {}).age_distribution) && (
            <React.Fragment>
              <h2>
                Age Distribution <InfoButton topic="age" />
              </h2>
              {datasetId.startsWith('gnomad_r3') && datasetId !== 'gnomad_r3' && (
                <p>
                  Age distribution is based on the full gnomAD dataset, not the selected subset.
                </p>
              )}
              <GnomadAgeDistribution datasetId={datasetId} variant={variant} />
            </React.Fragment>
          )}
        </ResponsiveSection>
      </FlexWrapper>

      <ResponsiveSection>
        <h2>Genotype Quality Metrics</h2>
        <VariantGenotypeQualityMetrics datasetId={datasetId} variant={variant} />
      </ResponsiveSection>
      <ResponsiveSection>
        <h2>Site Quality Metrics</h2>
        <VariantSiteQualityMetrics datasetId={datasetId} variant={variant} />
      </ResponsiveSection>
      <Section>
        <h2>Read Data</h2>
        <ReadData datasetId={datasetId} variantIds={[variant.variant_id]} />
      </Section>
    </FlexWrapper>
  )
}

const operationName = 'GnomadVariant'
const variantQuery = `
query ${operationName}($variantId: String!, $datasetId: DatasetId!, $referenceGenome: ReferenceGenomeId!, $includeLocalAncestry: Boolean!, $includeLiftoverAsSource: Boolean!, $includeLiftoverAsTarget: Boolean!) {
  variant(variantId: $variantId, dataset: $datasetId) {
    variant_id
    reference_genome
    chrom
    pos
    ref
    alt
    caid
    colocated_variants
    coverage {
      exome {
        mean
      }
      genome {
        mean
      }
    }
    multi_nucleotide_variants {
      combined_variant_id
      changes_amino_acids
      n_individuals
      other_constituent_snvs
    }
    exome {
      ac
      an
      ac_hemi
      ac_hom
      faf95 {
        popmax
        popmax_population
      }
      filters
      populations {
        id
        ac
        an
        ac_hemi
        ac_hom
      }
      local_ancestry_populations @include(if: $includeLocalAncestry) {
        id
        ac
        an
      }
      age_distribution {
        het {
          bin_edges
          bin_freq
          n_smaller
          n_larger
        }
        hom {
          bin_edges
          bin_freq
          n_smaller
          n_larger
        }
      }
      quality_metrics {
        allele_balance {
          alt {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
        }
        genotype_depth {
          all {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
          alt {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
        }
        genotype_quality {
          all {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
          alt {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
        }
        site_quality_metrics {
          metric
          value
        }
      }
    }
    genome {
      ac
      an
      ac_hemi
      ac_hom
      faf95 {
        popmax
        popmax_population
      }
      filters
      populations {
        id
        ac
        an
        ac_hemi
        ac_hom
      }
      local_ancestry_populations @include(if: $includeLocalAncestry) {
        id
        ac
        an
      }
      age_distribution {
        het {
          bin_edges
          bin_freq
          n_smaller
          n_larger
        }
        hom {
          bin_edges
          bin_freq
          n_smaller
          n_larger
        }
      }
      quality_metrics {
        allele_balance {
          alt {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
        }
        genotype_depth {
          all {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
          alt {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
        }
        genotype_quality {
          all {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
          alt {
            bin_edges
            bin_freq
            n_smaller
            n_larger
          }
        }
        site_quality_metrics {
          metric
          value
        }
      }
    }
    flags
    lof_curations {
      gene_id
      gene_symbol
      verdict
      flags
      project
    }
    rsids
    transcript_consequences {
      domains
      gene_id
      gene_version
      gene_symbol
      hgvs
      hgvsc
      hgvsp
      is_canonical
      is_mane_select
      is_mane_select_version
      lof
      lof_flags
      lof_filter
      major_consequence
      polyphen_prediction
      sift_prediction
      transcript_id
      transcript_version
    }
    in_silico_predictors {
      id
      value
      flags
    }
    non_coding_constraint {
      start
      stop
      possible
      observed
      expected
      oe
      z
    }
  }

  clinvar_variant(variant_id: $variantId, reference_genome: $referenceGenome) {
    clinical_significance
    clinvar_variation_id
    gold_stars
    last_evaluated
    review_status
    submissions {
      clinical_significance
      conditions {
        name
        medgen_id
      }
      last_evaluated
      review_status
      submitter_name
    }
  }

  liftover(source_variant_id: $variantId, reference_genome: $referenceGenome) @include(if: $includeLiftoverAsSource) {
    liftover {
      variant_id
      reference_genome
    }
    datasets
  }

  liftover_sources: liftover(liftover_variant_id: $variantId, reference_genome: $referenceGenome) @include(if: $includeLiftoverAsTarget) {
    source {
      variant_id
      reference_genome
    }
    datasets
  }

  meta {
    clinvar_release_date
  }
}
`

type VariantPageProps = {
  datasetId: DatasetId
  variantId: string
}

const VariantPage = ({ datasetId, variantId }: VariantPageProps) => {
  return (
    // @ts-expect-error TS(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
    <Page>
      <DocumentTitle title={`${variantId} | ${labelForDataset(datasetId)}`} />
      <BaseQuery
        key={datasetId}
        operationName={operationName}
        query={variantQuery}
        variables={{
          datasetId,
          includeLocalAncestry: datasetId === 'gnomad_r3',
          includeLiftoverAsSource: datasetId.startsWith('gnomad_r2_1'),
          includeLiftoverAsTarget: datasetId.startsWith('gnomad_r3'),
          referenceGenome: referenceGenome(datasetId),
          variantId,
        }}
      >
        {({ data, error, graphQLErrors, loading }: any) => {
          let pageContent = null
          if (loading) {
            pageContent = (
              <Delayed>
                <StatusMessage>Loading variant...</StatusMessage>
              </Delayed>
            )
          } else if (error) {
            pageContent = <StatusMessage>Unable to load variant</StatusMessage>
          } else if (!(data || {}).variant) {
            if (
              graphQLErrors &&
              graphQLErrors.some((err: any) => err.message === 'Variant not found')
            ) {
              // @ts-expect-error TS(2322) FIXME: Type '{ datasetId: string; variantId: string; }' i... Remove this comment to see the full error message
              pageContent = <VariantNotFound datasetId={datasetId} variantId={variantId} />
            } else {
              pageContent = (
                <StatusMessage>
                  {graphQLErrors && graphQLErrors.length
                    ? Array.from(
                        new Set(
                          graphQLErrors
                            .filter((e: any) => !e.message.includes('ClinVar'))
                            .map((e: any) => e.message)
                        )
                      ).join(', ')
                    : 'Unable to load variant'}
                </StatusMessage>
              )
            }
          } else {
            const variant = {
              ...data.variant,
              clinvar: data.clinvar_variant
                ? { ...data.clinvar_variant, release_date: data.meta.clinvar_release_date }
                : null,
              liftover: data.liftover,
              liftover_sources: data.liftover_sources,
            }
            pageContent = <VariantPageContent datasetId={datasetId} variant={variant} />
          }

          return (
            <React.Fragment>
              <GnomadPageHeading
                datasetOptions={{
                  // Include ExAC for GRCh37 datasets
                  includeExac: !datasetId.startsWith('gnomad_r3'),
                  // Include gnomAD versions based on the same reference genome as the current dataset
                  includeGnomad2: !datasetId.startsWith('gnomad_r3'),
                  includeGnomad3: datasetId.startsWith('gnomad_r3'),
                  // Variant ID not valid for SVs
                  includeStructuralVariants: false,
                }}
                selectedDataset={datasetId}
                extra={
                  navigator.clipboard &&
                  navigator.clipboard.writeText && (
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(variantId)
                      }}
                      style={{ margin: '0 1em' }}
                    >
                      Copy variant ID
                    </Button>
                  )
                }
              >
                <VariantPageTitle variantId={variantId} datasetId={datasetId} />
              </GnomadPageHeading>
              {pageContent}
            </React.Fragment>
          )
        }}
      </BaseQuery>
    </Page>
  )
}

export default VariantPage
