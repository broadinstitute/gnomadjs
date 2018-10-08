import fetch from 'graphql-fetch'

export const fetchRegion = regionId => {
  const [chrom, start, stop] = regionId.split('-')
  const query = `{
  region(start: ${start}, stop: ${stop}, chrom: "${chrom}") {
    start
    stop
    xstop
    xstart
    chrom
    genes {
      gene_id
      gene_name
      start
      stop
      transcript {
        _id
        start
        transcript_id
        strand
        stop
        xstart
        chrom
        gene_id
        xstop
        exons {
          _id
          start
          transcript_id
          feature_type
          strand
          stop
          chrom
          gene_id
        }
      }
    }
    exome_coverage {
      pos
      mean
    }
    genome_coverage {
      pos
      mean
    }
    exacv1_coverage {
      pos
      mean
    }
    gnomadCombinedVariants: variants(dataset: gnomad_r2_0_2) {
      allele_count: ac
      hemi_count: ac_hemi
      hom_count: ac_hom
      allele_num: an
      allele_freq: af
      consequence
      datasets
      filters
      flags
      hgvsc
      hgvsp
      pos
      rsid
      variant_id: variantId
      xpos
    }
    exacVariants: variants(dataset:exac) {
      allele_count: ac
      hemi_count: ac_hemi
      hom_count: ac_hom
      allele_num: an
      allele_freq: af
      consequence
      datasets
      filters
      flags
      hgvsc
      hgvsp
      pos
      rsid
      variant_id: variantId
      xpos
    }
  }

}
`

  return fetch(process.env.GNOMAD_API_URL)(query)
}
