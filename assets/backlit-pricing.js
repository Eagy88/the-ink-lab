(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BacklitPricing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STANDARD_PRICES = {
    A4: 999,
    A3: 1299,
    A2: 1699,
    A1: 2499,
    A0: 3999,
    '500x700': 1999,
    '600x900': 2799,
    '600x1200': 3499,
    '700x1000': 3499,
    '30x40': 3699,
    '40x60': 6499
  };

  function discountForQuantity(quantity) {
    if (quantity >= 25) return 20;
    if (quantity >= 10) return 15;
    if (quantity >= 5) return 10;
    if (quantity >= 2) return 5;
    return 0;
  }

  function calculate(input) {
    var width = Number(input.width);
    var height = Number(input.height);
    var quantity = Number(input.quantity);
    var custom = Boolean(input.custom);
    var finish = input.finish;

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return { valid: false, message: 'Enter a whole-number quantity of at least 1.' };
    }
    if (quantity >= 50) {
      return { valid: true, quote: true, message: 'Trade quantities of 50 or more require a quote.' };
    }
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
      return { valid: false, message: 'Enter positive whole-number dimensions in mm.' };
    }
    if (finish !== 'Trimmed to size' && finish !== 'Matt lamination' && finish !== 'Gloss lamination') {
      return { valid: false, message: 'Select a valid finish.' };
    }

    var area = width * height / 1000000;
    var finishPence = finish === 'Trimmed to size' ? 0 : Math.round(area * 800);
    var basePence;
    var unitPence;

    if (custom) {
      basePence = Math.max(1499, Math.ceil((area * 4499 + 1) / 500) * 500 - 1);
      unitPence = Math.ceil((basePence + finishPence + 1) / 500) * 500 - 1;
      if (unitPence > 49999) {
        return { valid: true, quote: true, message: 'This custom size requires a quote.' };
      }
    } else {
      basePence = STANDARD_PRICES[input.size];
      if (!Number.isSafeInteger(basePence)) {
        return { valid: false, message: 'Select a valid standard size.' };
      }
      unitPence = basePence + finishPence;
    }

    if (!Number.isSafeInteger(unitPence) || !Number.isSafeInteger(unitPence * quantity)) {
      return { valid: false, message: 'These dimensions require a quote.' };
    }

    var discountPercent = input.discountsActive ? discountForQuantity(quantity) : 0;
    var estimatedUnitPence = Math.round(unitPence * (100 - discountPercent) / 100);
    return {
      valid: true,
      quote: false,
      custom: custom,
      area: area,
      basePence: basePence,
      finishPence: finishPence,
      unitPence: unitPence,
      totalPence: unitPence * quantity,
      discountPercent: discountPercent,
      estimatedUnitPence: estimatedUnitPence,
      estimatedTotalPence: estimatedUnitPence * quantity,
      band: custom ? 'Band ' + unitPence : null
    };
  }

  return {
    STANDARD_PRICES: STANDARD_PRICES,
    discountForQuantity: discountForQuantity,
    calculate: calculate
  };
});