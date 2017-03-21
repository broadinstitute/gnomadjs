/* eslint-disable camelcase */

import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
} from 'graphql'

import coverageType, { lookupCoverageByStartStop } from './coverage'
import variantType, { lookupVariantsByGeneId } from './variant'
import transcriptType, { lookupTranscriptsByTranscriptId } from './transcript'
import exonType, { lookupExonsByStartStop } from './exon'
import constraintType, { lookUpConstraintByTranscriptId } from './constraint'
import cnvsGene, { lookUpCnvsGeneByGeneName } from './cnvs_genes'
import cnvsExons, { lookUpCnvsExonsByTranscriptId } from './cnvs_exons'
import metaVariantType from './metavariant'

const geneType = new GraphQLObjectType({
  name: 'Gene',
  fields: () => ({
    _id: { type: GraphQLString },
    omim_description: { type: GraphQLString },
    stop: { type: GraphQLString },
    gene_id: { type: GraphQLString },
    omim_accession: { type: GraphQLString },
    chrom: { type: GraphQLString },
    strand: { type: GraphQLString },
    full_gene_name: { type: GraphQLString },
    gene_name_upper: { type: GraphQLString },
    other_names: { type: new GraphQLList(GraphQLString) },
    canonical_transcript: { type: GraphQLString },
    start: { type: GraphQLInt },
    xstop: { type: GraphQLFloat },
    xstart: { type: GraphQLFloat },
    gene_name: { type: GraphQLString },
    exome_coverage: {
      type: new GraphQLList(coverageType),
      resolve: (obj, args, ctx) =>
        lookupCoverageByStartStop(ctx.database.gnomad, 'exome_coverage', obj.xstart, obj.xstop),
    },
    genome_coverage: {
      type: new GraphQLList(coverageType),
      resolve: (obj, args, ctx) =>
        lookupCoverageByStartStop(ctx.database.gnomad, 'genome_coverage', obj.xstart, obj.xstop),
    },
    exacv1_coverage: {
      type: new GraphQLList(coverageType),
      resolve: (obj, args, ctx) =>
        lookupCoverageByStartStop(ctx.database.exacv1, 'base_coverage', obj.xstart, obj.xstop),
    },
    exome_variants: {
      type: new GraphQLList(variantType),
      resolve: (obj, args, ctx) =>
          lookupVariantsByGeneId(ctx.database.gnomad, 'exome_variants', obj.gene_id),
    },
    genome_variants: {
      type: new GraphQLList(variantType),
      resolve: (obj, args, ctx) =>
        lookupVariantsByGeneId(ctx.database.gnomad, 'genome_variants', obj.gene_id),
    },
    exacv1_variants: {
      type: new GraphQLList(variantType),
      resolve: (obj, args, ctx) =>
        lookupVariantsByGeneId(ctx.database.exacv1, 'variants', obj.gene_id),
    },
    meta_schizophrenia_variants: {
      type: new GraphQLList(metaVariantType),
      resolve: (obj, args, ctx) =>
        ctx.database.sczMockDb.getSczVariants(),
    },
    transcript: {
      type: transcriptType,
      resolve: (obj, args, ctx) =>
        lookupTranscriptsByTranscriptId(ctx.database.gnomad, obj.canonical_transcript),
    },
    exons: {
      type: new GraphQLList(exonType),
      resolve: (obj, args, ctx) => lookupExonsByStartStop(ctx.database.gnomad, obj.start, obj.stop),
    },
    exacv1_constraint: {
      type: constraintType,
      resolve: (obj, args, ctx) =>
        lookUpConstraintByTranscriptId(ctx.database.exacv1, obj.canonical_transcript),
    },
    exacv1_cnvs_gene: {
      type: new GraphQLList(cnvsGene),
      resolve: (obj, args, ctx) =>
        lookUpCnvsGeneByGeneName(ctx.database.exacv1, obj.gene_id),
    },
    exacv1_cnvs_exons: {
      type: new GraphQLList(cnvsExons),
      resolve: (obj, args, ctx) =>
        lookUpCnvsExonsByTranscriptId(ctx.database.exacv1, obj.canonical_transcript),
    },
  }),
})

export default geneType

export const lookupGeneByGeneId = (db, gene_id) =>
  db.collection('genes').findOne({ gene_id })

export const lookupGeneByName = (db, gene_name) =>
  db.collection('genes').findOne({ gene_name })
