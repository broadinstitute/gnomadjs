/* eslint-disable no-shadow */
import keymirror from 'keymirror'
import { Record, Set, OrderedMap, Map, List, fromJS } from 'immutable'
import { createSelector } from 'reselect'
import { createSearchAction, getSearchSelectors } from 'redux-search'

import {
  isCategoryLoF,
  isCategoryMissenseOrLoF,
  getTableIndexByPosition,
  gnomadExportCsvTranslations,
} from '@broad/utilities'

import { types as regionTypes } from '@broad/region'
import { types as geneTypes, currentTranscript } from '@broad/redux-genes'

export const types = keymirror({
  SET_HOVERED_VARIANT: null,
  SET_FOCUSED_VARIANT: null,
  SET_SELECTED_VARIANT_DATASET: null,
  SET_VARIANT_FILTER: null,
  SET_VARIANT_SORT: null,
  TOGGLE_VARIANT_QC_FILTER: null,
  ORDER_VARIANTS_BY_POSITION: null,
  TOGGLE_DENOVO_FILTER: null,
})

export const actions = {
  setHoveredVariant: variantId => ({ type: types.SET_HOVERED_VARIANT, variantId }),

  setFocusedVariant: variantId => ({ type: types.SET_FOCUSED_VARIANT, variantId }),

  setSelectedVariantDataset: variantDataset =>
    ({ type: types.SET_SELECTED_VARIANT_DATASET, variantDataset }),

  setVariantFilter: (filter) => {
    return {
      type: types.SET_VARIANT_FILTER,
      filter,
    }
  },

  setVariantSort: (key) => {
    return {
      type: types.SET_VARIANT_SORT,
      key,
    }
  },
  toggleVariantQcFilter: () => {
    return {
      type: types.TOGGLE_VARIANT_QC_FILTER,
    }
  },
  toggleVariantDeNovoFilter: () => {
    return {
      type: types.TOGGLE_DENOVO_FILTER,
    }
  },

  searchVariantsRaw: createSearchAction('variants'),

  searchVariants(text) {
    const thunk = (dispatch) => {
      return dispatch(actions.searchVariantsRaw(text))
    }
    thunk.meta = {
      debounce: {
        time: 500,
        key: 'SEARCH_VARIANT_TABLE',
      }
    }
    return thunk
  },

  exportVariantsToCsv: (fetchFunction) => {
    const sum = (oldValue, newValue) => oldValue + newValue
    const concat = (oldValue, newValue) => {
      // console.log(oldValue, newValue)
      // console.log(oldValue.concat(newValue))
      return oldValue.concat(newValue)
    }
    const combineKeys = {
      allele_count: sum,
      allele_num: sum,
      hom_count: sum,
      filters: concat,
      // allele_freq: () => null,
      datasets: [],
    }

    return (dispatch, getState) => {
      // function flatten (map) {
      //
      // }
      const populations = new Map({
        NFE: 'european_non_finnish',
        EAS: 'east_asian',
        OTH: 'other',
        AFR: 'african',
        AMR: 'latino',
        SAS: 'south_asian',
        FIN: 'european_finnish',
        ASJ: 'ashkenazi_jewish',
      })

      const popDatatypes = ['pop_acs', 'pop_ans', 'pop_homs', 'pop_hemi']

      function flattenForCsv (data) {
        const dataMap = new Map(fromJS(data).map(v => List([v.get('variant_id'), v])))

        const qualityMetricKeys = dataMap.first().get('quality_metrics').keySeq()
        return dataMap.map((value) => {
          const flattened = popDatatypes.reduce((acc, popDatatype) => {
            return populations.valueSeq().reduce((acc, popKey) => {
              return acc.set(`${popDatatype}_${popKey}`, acc.getIn([popDatatype, popKey]))
            }, acc)
          }, value)
          const deletePopMap = popDatatypes.reduce((acc, popDatatype) =>
            acc.delete(popDatatype), flattened)
          const flattenedQualityMetrics = qualityMetricKeys.reduce((acc, key) => {
            return acc.set(`quality_metrics_${key}`, acc.getIn(['quality_metrics', key]))
          }, deletePopMap)
          return flattenedQualityMetrics.delete('quality_metrics')
        })
      }

      function formatData(data) {
        const variants = fromJS(data)
        const dictionary = OrderedMap(gnomadExportCsvTranslations)
        const renamed = variants.map((variant) => {
          return dictionary.mapEntries(([key, value]) => [value, variant.get(key)])
          // return variant.mapKeys((key) => gnomadExportCsvTranslations[key])
        })
        return renamed.sort((a, b) => b.get('XPOS') - a.get('XPOS'))
      }

      function exportToCsv (flattenedData, dataset) {
        const data = flattenedData.toIndexedSeq().map((variant) => {
          return variant.valueSeq().join(',')
        }).join('\r\n')
        const headers = flattenedData.first().keySeq().join(',')
        const csv = `data:text/csv;charset=utf-8,${headers}\n${data}\r\n`
        const encodedUri = encodeURI(csv)
        // window.open(encodedUri)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', `${dataset}_${new Date().getTime()}`)
        document.body.appendChild(link)
        link.click()
      }

      const state = getState()
      const currentDataset = selectedVariantDataset(state)
      const filteredVariants = finalFilteredVariants(state)
      const transcriptId = currentTranscript(state)
      const variantIds = filteredVariants.map(v => v.variant_id)

      function combinedAlleleFrequency(variant) {
        return variant.get('allele_count') / variant.get('allele_num')
      }
      function combinedPopmaxFrequency(variant) {
        const frequency = variant.get('popmax_ac') / variant.get('popmax_an')
        return frequency || ''
      }
      function joinFilters(variant) {
        return variant.get('filters').toJS().join('|')
      }

      if (currentDataset === 'gnomadCombinedVariants') {
        return Promise.all([
          fetchFunction(variantIds, transcriptId, 'gnomadExomeVariants'),
          fetchFunction(variantIds, transcriptId, 'gnomadGenomeVariants'),
        ]).then((promiseArray) => {
          const [exomeData, genomeData] = promiseArray
          const exomeDataMapFlattened = flattenForCsv(exomeData)
          const genomeDataMapFlattened = flattenForCsv(genomeData)
          console.log(exomeDataMapFlattened)
          console.log(genomeDataMapFlattened)
          console.log(combineKeys)
          const combined = exomeDataMapFlattened.mergeDeepWith((oldValue, newValue, key) => {
            // console.log(key)
            if (combineKeys[key]) {
              return combineKeys[key](oldValue, newValue)
            }
            return oldValue
          }, genomeDataMapFlattened).map(value => value
            .set('allele_freq', combinedAlleleFrequency(value))
            .set('popmax_af', combinedPopmaxFrequency(value))
            .set('filters', joinFilters(value)))
          exportToCsv(formatData(combined), currentDataset)
        })
      }

      fetchFunction(variantIds, transcriptId, currentDataset)
        .then((data) => {
          const variantDataMap = formatData(flattenForCsv(data))
          exportToCsv(variantDataMap, currentDataset)
        })
    }
  }
}

export default function createVariantReducer({
  variantDatasets,
  combinedDatasets = {},
  projectDefaults: {
    startingVariant,
    startingVariantDataset,
    startingQcFilter,
  },
  definitions
}) {
  const datasetKeys = Object.keys(variantDatasets).concat(Object.keys(combinedDatasets))
  const variantRecords = datasetKeys.reduce((acc, dataset) => {
    if (dataset in variantDatasets) {
      acc[dataset] = Record(variantDatasets[dataset])
    } else if (dataset in combinedDatasets) {
      acc[dataset] = Record(combinedDatasets[dataset].schema)
    }
    return acc
  }, {})
  const State = Record({
    byVariantDataset: datasetKeys.reduce((acc, dataset) =>
      (acc.set(dataset, OrderedMap())), OrderedMap()),
    variantSortKey: 'pos',
    variantSortAscending: true,
    variantFilter: 'all',
    hoveredVariant: startingVariant,
    focusedVariant: startingVariant,
    selectedVariantDataset: startingVariantDataset,
    variantQcFilter: startingQcFilter,
    variantDeNovoFilter: false,
    searchIndexed: OrderedMap(),
    definitions: Map(definitions),
  })

  const actionHandlers = {
    [types.SET_HOVERED_VARIANT] (state, { variantId }) {
      return state.set('hoveredVariant', variantId)
    },

    [types.SET_FOCUSED_VARIANT] (state, { variantId }) {
      return state.set('focusedVariant', variantId)
    },

    [types.SET_SELECTED_VARIANT_DATASET] (state, { variantDataset }) {
      const variants = state
        .getIn(['byVariantDataset', variantDataset])

      return state
        .set('selectedVariantDataset', variantDataset)
        .set('searchIndexed', variants)
    },

    [geneTypes.RECEIVE_GENE_DATA] (state, { geneData }) {
      const exons = geneData.getIn(['transcript', 'exons']).toJS()
      const padding = 75
      const totalBasePairs = exons.filter(region => region.feature_type === 'CDS')
        .reduce((acc, { start, stop }) => (acc + ((stop - start) + (padding * 2))), 0)

      let defaultFilter = 'all'
      if (totalBasePairs > 40000) {
        defaultFilter = 'lof'
      } else if (totalBasePairs > 15000) {
        defaultFilter = 'missenseOrLoF'
      }

      const withVariants = datasetKeys.reduce((nextState, datasetKey) => {
        let variantMap = {}
        if (geneData.get(datasetKey) && variantDatasets[datasetKey]) {
          geneData.get(datasetKey).forEach((variant) => {
            variantMap[variant.get('variant_id')] = new variantRecords[datasetKey](
              variant
                .set('id', variant.get('variant_id'))
                .set('datasets', Set([datasetKey])))
          })
        } else if (combinedDatasets[datasetKey]) {
          const sources = combinedDatasets[datasetKey].sources
          const combineKeys = combinedDatasets[datasetKey].combineKeys

          variantMap = sources.reduce((acc, dataset) => {
            return acc.mergeDeepWith((oldValue, newValue, key) => {
              if (combineKeys[key]) {
                return combineKeys[key](oldValue, newValue)
              }
              return oldValue
            }, nextState.byVariantDataset.get(dataset))
          }, OrderedMap())
        }
        return nextState
          .set('byVariantDataset', nextState.byVariantDataset
            .set(datasetKey, OrderedMap(variantMap))
          )
      }, state)

      const currentVariantDataset = withVariants
        .get('byVariantDataset')
        .get(withVariants.selectedVariantDataset)

      return withVariants
        .set('searchIndexed', currentVariantDataset)
        .set('variantFilter', defaultFilter)
    },

    [regionTypes.RECEIVE_REGION_DATA] (state, { regionData }) {
      return datasetKeys.reduce((nextState, datasetKey) => {
        let variantMap = {}
        if (variantDatasets[datasetKey]) {
          regionData.get(datasetKey).forEach((variant) => {
            variantMap[variant.get('variant_id')] = new variantRecords[datasetKey](
              variant
                .set('id', variant.get('variant_id'))
                .set('datasets', Set([datasetKey])))
          })
        } else if (combinedDatasets[datasetKey]) {
          const sources = combinedDatasets[datasetKey].sources
          const combineKeys = combinedDatasets[datasetKey].combineKeys

          variantMap = sources.reduce((acc, dataset) => {
            return acc.mergeDeepWith((oldValue, newValue, key) => {
              if (combineKeys[key]) {
                return combineKeys[key](oldValue, newValue)
              }
              return oldValue
            }, nextState.byVariantDataset.get(dataset))
          }, OrderedMap())
        }

        return nextState.set('byVariantDataset', nextState.byVariantDataset
          .set(datasetKey, OrderedMap(variantMap))
        )
      }, state)
    },

    [types.SET_VARIANT_FILTER] (state, { filter }) {
      return state.set('variantFilter', filter)
    },

    [types.ORDER_VARIANTS_BY_POSITION] (state) {
      return state
        .set('variantSortKey', 'pos')
        .set('variantSortAscending', true)
    },

    [types.SET_VARIANT_SORT] (state, { key }) {
      if (key === state.get('variantSortKey')) {
        return state.set('variantSortAscending', !state.get('variantSortAscending'))
      }
      return state.set('variantSortKey', key)
    },
    [types.TOGGLE_VARIANT_QC_FILTER] (state) {
      return state.set('variantQcFilter', !state.get('variantQcFilter'))
    },
    [types.TOGGLE_DENOVO_FILTER] (state) {
      return state.set('variantDeNovoFilter', !state.get('variantDeNovoFilter'))
    },
  }

  return function variants (state = new State(), action: Object): State {
    const { type } = action
    if (type in actionHandlers) {
      return actionHandlers[type](state, action)
    }
    return state
  }
}

function isEmpty(val) {
  return (
    val === undefined
    || val === null
    || val === ''
  )
}

const sortVariants = (variants, key, ascending) => {
  if (variants.isEmpty()) {
    return new List()
  }

  let getSortVal = variant => variant.get(key)
  let comparator = (a, b) => a - b

  if (typeof variants.first().get(key) === 'string') {
    getSortVal = variant => typeof variant.get(key) === 'string' ? variant.get(key) : ''
    comparator = (a, b) => a.localeCompare(b)
  }
  else if (key === 'variant_id') {
    getSortVal = variant => variant.get('pos')
  }
  else if (key === 'datasets') {
    getSortVal = variant => variant.get('datasets').first()
  }
  else if (key === 'flags') {
    getSortVal = variant =>
      List(['lcr', 'segdup', 'lof'])
        .map(flag => variant.get(flag))
        .filter(flag => flag !== null)
        .first()
  }

  const sorter = ascending
    ? comparator
    : (a, b) => comparator(b, a)

  return variants.sort((variantA, variantB) => {
    const sortValA = getSortVal(variantA)
    const sortValB = getSortVal(variantB)

    // Always sort variants with no data for the selected field to the bottom of the list.
    if (isEmpty(sortValA)) {
      return 1
    }
    if (isEmpty(sortValB)) {
      return -1
    }
    return sorter(sortValA, sortValB)
  })
}

/**
 * Variant selectors
 */

const byVariantDataset = state => state.variants.byVariantDataset
export const hoveredVariant = state => state.variants.hoveredVariant
export const focusedVariant = state => state.variants.focusedVariant
export const selectedVariantDataset = state => state.variants.selectedVariantDataset

const allVariantsInCurrentDataset = createSelector(
  [selectedVariantDataset, byVariantDataset],
  (selectedVariantDataset, byVariantDataset) =>
    byVariantDataset.get(selectedVariantDataset)
)

const allVariantsInCurrentDatasetAsList = createSelector(
  [selectedVariantDataset, byVariantDataset],
  (selectedVariantDataset, byVariantDataset) =>
    sortVariants(byVariantDataset.get(selectedVariantDataset).toList(), 'pos', true)
)

export const variantCount = createSelector(
  [allVariantsInCurrentDatasetAsList],
  variants => variants.size
)

export const singleVariantData = createSelector(
  [focusedVariant, allVariantsInCurrentDataset],
  (focusedVariant, variants) => focusedVariant ? variants.get(focusedVariant) : null
)

/**
 * Sort/filter selectors
 */

export const variantSortKey = state => state.variants.variantSortKey
const variantSortAscending = state => state.variants.variantSortAscending
export const variantFilter = state => state.variants.variantFilter
export const variantQcFilter = state => state.variants.variantQcFilter
export const variantDeNovoFilter = state => state.variants.variantDeNovoFilter
const definitions = state => state.variants.definitions

const filteredVariantsById = createSelector([
  allVariantsInCurrentDataset,
  variantFilter,
  variantQcFilter,
  definitions,
  variantDeNovoFilter,
], (variants, variantFilter, variantQcFilter, definitions, variantDeNovoFilter) => {
  let filteredVariants
  const consequenceKey = definitions.get('consequence') || 'consequence'
  if (variantFilter === 'all') {
    filteredVariants = variants
  }
  if (variantFilter === 'lof') {
    filteredVariants = variants.filter(v => isCategoryLoF(v.get(consequenceKey)))
  }
  if (variantFilter === 'missenseOrLoF') {
    filteredVariants = variants.filter(v => isCategoryMissenseOrLoF(v.get(consequenceKey)))
  }
  if (variantQcFilter) {
    filteredVariants = filteredVariants.filter(v => v.get('filters').size === 0)
  }
  if (variantDeNovoFilter) {
    filteredVariants = filteredVariants.filter(v => v.get('ac_denovo') > 0)
  }
  return filteredVariants
})


/**
 * Redux search selectors
 */

const resourceSelector = (resourceName, state) => state.variants.searchIndexed

const searchSelectors = getSearchSelectors({
  resourceName: 'variants',
  resourceSelector,
})
export const variantSearchText = searchSelectors.text

export const filteredIdList = createSelector(
  [state => state.search.variants.result],
  (result) => {
    return List(result)
  }
)

const sortedVariants = createSelector(
  [
    filteredVariantsById,
    variantSortKey,
    variantSortAscending
  ],
  (
    variants,
    variantSortKey,
    variantSortAscending
  ) => {
    const sortedVariants = sortVariants(
      variants,
      variantSortKey,
      variantSortAscending
    )
    return sortedVariants
  }
)

export const finalFilteredVariants = createSelector(
  [sortedVariants, filteredIdList, selectedVariantDataset],
  (variants, filteredIdList) => {
    if (filteredIdList.size !== 0 || variants.size === 0) {
      return variants.filter((v) => {
        return filteredIdList.includes(v.get('id'))
      }).toList()
    }
    return variants.toList()
  }
)

export const finalFilteredVariantsCount = createSelector(
  [finalFilteredVariants],
  finalFilteredVariants => finalFilteredVariants.size
)
