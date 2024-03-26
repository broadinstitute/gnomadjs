export type FaqTopic = {
  heading: string
  topics: string[]
}

const helpPageTableOfContents: { topics: string[]; faq: FaqTopic[] } = {
  topics: [
    'dataset-selection',
    'variant-qc',
    'ancestry',
    'relatedness-filtering',
    'vep',
    'faf',
    'grpmax',
    'constraint',
    'pext',
    'regional-constraint',
    'sv-overview',
    'variant-cooccurrence',
    'hgdp-1kg-annotations',
    'v4-hts',
    'exome-capture-tech',
  ],
  faq: [
    {
      heading: 'General',
      topics: [
        'whats-the-difference-between-the-different-versions-of-gnomad',
        'what-features-are-not-yet-in-v4-and-where-can-i-find-them',
        'what-are-the-restrictions-on-data-usage',
        'i-have-identified-a-rare-variant-what-phenotype-data-are-available',
        'can-i-get-access-to-individual-level-genotype-data-from-gnomad',
        'can-i-contribute-data-to-gnomad',
        'why-is-a-particular-variant-found-in-some-versions-of-exac-gnomad-but-not-others',
        'where-can-i-find-more-details-on-the-qc-pipeline',
        'should-i-switch-to-the-latest-version-of-gnomad',
        'how-do-evaluate-variants-in-a-gene-that-has-a-pseudogene',
        'how-do-you-pronounce-gnomad',
      ],
    },
    {
      heading: 'Constraint',
      topics: [
        'how-was-the-expected-number-of-variants-determined',
        'which-variants-are-included-in-the-observed-counts',
        'why-are-there-fewer-variants-in-the-constraint-table-than-on-the-gene-page',
        'what-is-included-in-lof',
        'why-are-constraint-metrics-missing-for-this-gene-or-annotated-with-a-note',
        'what-is-a-loeuf-score',
        'how-do-you-pronounce-loeuf',
        'what-are-the-fields-included-in-constraint-files',
      ],
    },
    {
      heading: 'Technical details',
      topics: [
        'what-genome-build-is-the-gnomad-data-based-on',
        'what-version-of-gencode-was-used-to-annotate-variants',
        'are-all-the-individuals-in-1000-genomes-included',
        'are-all-the-individuals-in-the-exome-variant-server-included',
        'do-the-cancer-samples-in-the-database-include-tumor-exomes',
        'how-is-ancestry-determined-for-gnomad-samples',
        'what-genetic-ancestry-groups-are-represented-in-the-gnomad-data',
        'what-genetic-ancestry-groups-are-represented-in-the-remaining-individuals-category',
        'how-are-genetic-ancestry-group-names-abbreviated',
        'what-is-the-age-distribution-in-gnomad',
        'how-is-sex-determined-for-gnomad-samples',
        'how-many-xx-xy-have-this-variant-can-it-be-assumed-that-hemizygous-variants-come-only-from-males',
        'are-there-related-individuals-in-gnomad',
        'why-doesnt-the-amino-acid-position-and-consequence-on-the-gene-page-match-what-i-expect-for-my-transcript',
        'why-is-a-transcript-shown-in-the-browser-not-the-correct-length-and-or-appears-to-be-annotated-incorrectly',
        'what-do-the-flags-on-the-browser-mean',
        'why-is-this-variant-linked-to-the-wrong-dbsnp-rsid',
        'i-can-find-my-variant-of-interest-by-searching-for-the-particular-variant-but-why-doesnt-it-show-up-in-the-variant-table-when-I-type-the-gene-into-the-search-bar',
        'why-are-some-variants-depleted-for-homozygotes-out-of-hardy-weinberg-equilibrium',
        'can-i-filter-out-a-particular-cohort-for-my-analysis',
        'how-do-i-query-a-batch-of-variants-do-you-have-an-api',
        'how-do-i-download-the-data',
        'how-do-i-access-the-gnomad-hail-table-frequency-annotation',
      ],
    },
    {
      heading: 'Coverage',
      topics: [
        'how-was-coverage-calculated',
        'is-my-variant-missing-because-it-was-not-called-in-any-of-the-samples-or-did-the-site-just-lack-coverage',
        'why-does-a-variant-show-a-large-drop-in-an-compared-to-surrounding-variants-in-gnomad-v2',
        'what-are-your-calling-intervals-what-intervals-are-used-for-the-genomes-coding-only-files',
      ],
    },
    {
      heading: 'Mitochondrial DNA',
      topics: [
        'how-are-variants-called-on-the-mitochondrial-dna',
        'why-is-the-total-allele-number-lower-for-mtdna-versus-nuclear-variants',
        'what-are-numts-and-why-are-they-problematic',
        'why-are-no-variants-reported-below-10-percent-heteroplasmy',
        'what-are-haplogroups',
        'what-is-a-haplogroup-defining-variant',
        'what-are-haplogroup-specific-frequencies',
        'what-nuclear-ancestral-populations-are-represented',
        'what-is-the-distribution-of-haplogroups-in-gnomad-v3-1',
        'how-many-samples-are-in-each-mtdna-haplogroup-for-each-nuclear-ancestry-population',
        'what-are-the-meanings-of-the-mitochondrial-specific-filters-and-flags',
        'can-i-download-all-the-mtdna-variants',
      ],
    },
    {
      heading: 'Variant co-occurrence',
      topics: [
        'what-data-were-used-to-develop-the-variant-coocurrence-predictions',
        'how-did-you-calculate-the-thresholds-used-to-determine-if-a-pair-of-variants-is-predicted-to-be-in-cis-vs-in-trans',
        'what-does-it-mean-when-the-likely-coocurrence-pattern-is-listed-as-uncertain',
        'when-should-i-use-the-population-specific-predictions-vs-the-prediction-from-the-full-dataset',
        'why-are-two-variants-predicted-as-occurring-on-the-same-haplotype-when-the-majority-of-the-samples-in-gnomad-only-have-a-single-variant',
        'why-is-a-pair-of-variants-missing-from-the-downloadable-table',
      ],
    },
  ],
}

export default helpPageTableOfContents
