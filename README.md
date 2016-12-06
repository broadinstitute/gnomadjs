# gnomAD GraphQL API

The [GraphQL](http://graphql.org/) specification describes an elegant new way to fetch data on the web. GraphQL APIs are similar to a RESTful APIs, but rather than querying with URL parameters, you precisely defined the data you would like to fetch using a simple query language. The GraphQL specification is being developed and adopted by companies like [Github, Facebook, and Pintrest](http://graphql.org/users/).

Since the gnomAD VCF files may be prohibitively large to download, this API provides a quick way to programmatically retrieve specific data of interest in JSON format. Below, we demonstrate how to interactively explore the API and build queries in the [GraphiQL browser](https://github.com/graphql/graphiql) and then use these queries to fetch data in the Python, R, and JavaScript languages.

Please note that this resource is under development and the query methods and data types described are subject to frequent change. Additional ways to query the data will likely be added in the future. We would love to hear your [feedback and suggestions](exomeconsortium@gmail.com) as to how this API could be improved.

## Getting started

To get comfortable building queries, check out the [official introductory guide](http://graphql.org/learn/queries/) and follow along by executing the queries yourself using the [Star Wars GraphiQL API](https://graphql-swapi.parseapp.com/). It may be useful to spend a few minutes doing that before proceeding.

To get started with gnomAD data, open the interactive query building editor at [gnomad.broadinstitute.org/graph](http://gnomad.broadinstitute.org:8000/graph). You should see two panels side-by-side. Build queries in the left panel and the results will be displayed in the right panel.

Click the `Docs` button in the top right-hand corner to open up the **Documentation Explorer**. GraphQL is self-documenting, so the fields and data described in this section are always up-to-date. Browsing through the Documentation Explorer is the best way to understand how to query data and learn which types of data are available to retrieve. You can think of the GraphQL data model as a graph (duh!), where we start at the root and start exploring the branches. Under `ROOT TYPES`, click on `query: Root` and you will shown the different ways to start building queries.

```graphql
lookup_by_gene_id(gene_id: String!): Gene
lookup_by_gene_name(gene_name: String!): Gene
lookup_by_transcript_id(transcript_id: String!): Transcript
lookup_by_region_bounds(xstart: Int!xstop: Int!): Region
```

Here, you can discover the different ways to start querying and we will go through a few examples.

### Query by gene

Let's start by building a query that retrieves all the exome and genome variants
in a given gene using the `lookup_by_gene_name` field.

```graphql
lookup_by_gene_name(gene_id: String!): Gene
```

This field takes one argument called `gene_id` that is of type `String`. The `!` means this argument is required. The `: Gene` means this field will return an object of type `Gene`, which is going to have its own fields. Essentially, we are retrieving data are grouped by a given gene.

The GraphiQL editor has auto completion and informative error checking. In the blank left panel, start by typing curly braces `{  }` and then `control-shift`. You should see autocomplete fields pop up. Select `lookup_by_gene_name` from the autocomplete menu, and this should now autocomplete to `{  lookup_by_gene_name }`. Notice the squiggly red underline. This means the interpreter is complaining about something. Hover over the exception to see what is wrong.

The field wants an argument and type `Gene` requires a subfield, so modify the query:

```graphql
{ lookup_by_gene_name(gene_name: "PCSK9") }
```

Press the Play button at the top of the screen or type `shift-enter`.  You should see more fields populate the query. Press the `Prettify` button to make the query look a bit nicer.

```graphql
{
  lookup_by_gene_name(gene_name: "PCSK9") {
    _id
    omim_description
    stop
    gene_id
    omim_accession
    chrom
    strand
    full_gene_name
    gene_name_upper
    other_names
    canonical_transcript
    start
    xstop
    xstart
    gene_name
  }
}
```

All of the top level fields of the `Gene` type have automatically been added. Also, the query was sent to the server and the JSON response was returned on the right-hand side of the page. You've successfully retrieved data from the gnomAD API! Observe how the GraphQL query looks a lot like JSON but with fields and no values. The shape of the JSON response mirrors that of the query:

```json
{
  "data": {
    "lookup_by_gene_name": {
      "_id": "5814af9729736fbf482e46da",
      "omim_description": " PROPROTEIN CONVERTASE, SUBTILISIN/KEXIN-TYPE, 9; PCSK9",
      "stop": "55530526",
      "gene_id": "ENSG00000169174",
      "omim_accession": "607786",
      "chrom": "1",
      "strand": "+",
      "full_gene_name": "proprotein convertase subtilisin/kexin type 9",
      "gene_name_upper": "PCSK9",
      "other_names": [
        "HCHOLA3",
        "NARC-1",
        "FH3"
      ],
      "canonical_transcript": "ENST00000302118",
      "start": 55505222,
      "xstop": 1055530526,
      "xstart": "1055505222",
      "gene_name": "PCSK9"
    }
  }
}
```

In the Documentation Explorer where it says:

```graphql
lookup_by_gene_name(gene_name: String!): Gene
```

 Click the `Gene` type. You will see all the fields available to include in this query:

```graphql
_id: String
omim_description: String
stop: String
gene_id: String
omim_accession: String
chrom: String
strand: String
full_gene_name: String
gene_name_upper: String
other_names: [String]
canonical_transcript: String
start: Int
xstop: Int
xstart: String
gene_name: String
exome_coverage: [Coverage]
genome_coverage: [Coverage]
exome_variants: [Variant]
genome_variants: [Variant]
transcript: Transcript
exons: [Exon]
```

Notice how some of the fields have not automatically filled in such as `exome_variants` or `exome_coverage`. Since these are arrays of type `[Variant]` and `[Coverage]`, respectively, they will not automatically populate because there could be a significant amount of data in these fields. Try adding `exome_variants` by going back the query and adding this field. Start typing `exome`, and finish with autocompletion. Press the play button again or `shift-return`. All of the `Variant` fields in the array under the `exome_variants` field will be added:

```graphql
{
  lookup_by_gene_name(gene_name: "PCSK9") {
    _id
    omim_description
    stop
    gene_id
    omim_accession
    chrom
    strand
    full_gene_name
    gene_name_upper
    other_names
    canonical_transcript
    start
    xstop
    xstart
    gene_name
    exome_variants {
      _id
      ac_female
      ac_male
      allele_count
      allele_freq
      allele_num
      alt
      an_female
      an_male
      chrom
      filter
      genes
      genotype_depths
      genotype_qualities
      hom_count
      orig_alt_alleles
      pos
      ref
      rsid
      site_quality
      transcripts
      variant_id
      xpos
      xstart
      xstop
    }
  }
}
```

On the right-hand side of the page, a lot of data was returned from this query. There are many variants in this gene, so you may decide you don't need some of the fields by deleting them from the query. For example, let's say you only care about allele fields and the filter status for each exome variant, the query can be simplified like so:

```graphql
{
  lookup_by_gene_name(gene_name: "PCSK9") {
    gene_name
    exome_variants {
      allele_count
      allele_freq
      allele_num
      filter
      variant_id
    }
  }
}
```

The JSON object response will look like:

```json
{
  "data": {
    "lookup_by_gene_name": {
      "gene_name": "PCSK9",
      "exome_variants": [
        {
          "allele_count": 1,
          "allele_freq": 0.000032634945499641017,
          "allele_num": 30642,
          "filter": "PASS",
          "variant_id": "1-55505475-C-T"
        },
        {
          "allele_count": 1,
          "allele_freq": 0.0000327847354271851,
          "allele_num": 30502,
          "filter": "PASS",
          "variant_id": "1-55505477-C-T"
        },
        {
          "allele_count": 0,
          "allele_freq": 0,
          "allele_num": 30432,
          "filter": "AC_Adj0_Filter",
          "variant_id": "1-55505479-T-C"
        },
        ...etc.
      ]
    }
  }
}    
```

Let's say you are interested in some of the VEP annotations for each variant, the mean coverage across the gene, and the exons for that gene, and you want information for both exome and genome data. The query would be:

```graphql
{
  lookup_by_gene_name(gene_name: "PCSK9") {
    gene_name
    exome_variants {
      allele_count
      allele_freq
      allele_num
      filter
      variant_id
      vep_annotations {
        HGVSc
        Feature
      }
    }
    exome_coverage {
      pos
      mean
    }
    genome_variants {
      allele_count
      allele_freq
      allele_num
      filter
      variant_id
      vep_annotations {
        HGVSc
        Feature
      }
    }
    genome_coverage {
      pos
      mean
    }
    exons {
      start
      transcript_id
      feature_type
      stop
    }
  }
}
```

In general, take advantage of the Documentation Explorer and autocomplete functionality to inspect the available types for each field. Experiment with building queries in the GraphiQL editor before deciding to use them in your script or application. Tuning queries such that you only retrieve what you're interested in can reduce fetching time, decrease file size, and simplify downstream data analysis.

### Query by variant

### Query by region

### Fetching data with Python

### Fetching data with R

### Fetching data with JavaScript

This could be useful for building web applications that consume gnomAD data. To fetch data in JavaScript, you could write something that looks like this:

```javascript
const API_URL = `gnomad.broadinstitute.org/graph`
const geneName = `PCSK9`
const query = `
  {
    lookup_by_gene_name(gene_id: "${geneName}") {
      gene_id
      gene_name
      start
      stop
      exome_variants {
        variant_id
        allele_num
        allele_freq
        allele_count
      }
    }
  }
`
fetch(API_URL)(query).then(data => console.log(data))
```
