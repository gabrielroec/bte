import { defaultTo } from '@archetype-themes/utils/utils'

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *   - When superScriptPrice is enabled, format cents in <sup> tag
 * - getBaseUnit - Splits unit price apart to get value + unit
 *
 */

let moneyFormat = '${{amount}}'

export function formatMoney(cents, format, superScript) {
  if (typeof cents === 'string') {
    cents = cents.replace('.', '')
  }
  let value = ''
  let placeholderRegex = /\{\{\s*(\w+)\s*\}\}/
  let formatString = format || moneyFormat

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultTo(precision, 2)
    thousands = defaultTo(thousands, ',')
    decimal = defaultTo(decimal, '.')

    if (isNaN(number) || number == null) {
      return 0
    }

    number = (number / 100.0).toFixed(precision)

    let parts = number.split('.')
    let dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands)
    let centsAmount = parts[1] ? decimal + parts[1] : ''

    return dollarsAmount + centsAmount
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2)

      if (superScript && value && value.includes('.')) {
        value = value.replace('.', '<sup>') + '</sup>'
      }

      break
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0)
      break
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',')

      if (superScript && value && value.includes(',')) {
        value = value.replace(',', '<sup>') + '</sup>'
      }

      break
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',')
      break
    case 'amount_no_decimals_with_space_separator':
      value = formatWithDelimiters(cents, 0, ' ')
      break
  }

  return formatString.replace(placeholderRegex, value)
}

export function getBaseUnit(variant) {
  if (!variant) {
    return
  }

  if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
    return
  }

  return variant.unit_price_measurement.reference_value === 1
    ? variant.unit_price_measurement.reference_unit
    : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit
}
