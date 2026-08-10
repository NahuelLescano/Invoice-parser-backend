import type { FacturaArg } from "@/schemas/invoice.ts";

type PriceCalculator = (
  item: FacturaArg["items"][number],
  facturaArg: FacturaArg,
) => {
  unitPriceWithIva: number;
  unitPriceWithoutIva: number;
  totalCostExcludingTaxes: number;
};

const calculatePricePenaflor: PriceCalculator = (item, facturaArg) => {
  const unidades = item.unidadesPorBulto ?? 1;
  const importePorUnidad = item.precioUnitario / (item.cantidad * unidades);
  const ivaProporcional = importePorUnidad * (item.ivaPorcentaje / 100);

  const porcentajeImpIntPenaflor = facturaArg.subtotalNeto > 0
    ? facturaArg.impuestosInternosTotal / facturaArg.subtotalNeto : 0;
  const impIntProporcional = importePorUnidad * porcentajeImpIntPenaflor;

  return {
    unitPriceWithIva: importePorUnidad + ivaProporcional + impIntProporcional,
    unitPriceWithoutIva: importePorUnidad + impIntProporcional,
    totalCostExcludingTaxes: importePorUnidad,
  };
};

const calculatePriceDBA: PriceCalculator = (item) => {
  const precioBot = item.precioUnitario;
  const impIntPorUnidad = item.impuestosInternos;
  const factorIva = 1 + (item.ivaPorcentaje / 100);
  const precioSinImpuestos = (precioBot - impIntPorUnidad) / factorIva;

  return {
    unitPriceWithIva: precioBot,
    unitPriceWithoutIva: precioSinImpuestos + impIntPorUnidad,
    totalCostExcludingTaxes: precioSinImpuestos,
  };
};

const calculatePriceCocaMoet: PriceCalculator = (item) => {
  const unidades = item.unidadesPorBulto ?? 1;
  const totalUnits = item.cantidad * unidades;
  const factorIva = 1 + (item.ivaPorcentaje / 100);

  if (item.ivaPorcentaje > 0) {
    const unitPriceWithIva = item.precioUnitario / totalUnits;
    const netoTotal = (item.precioUnitario - item.impuestosInternos) / factorIva;
    const impIntPorUnidad = item.impuestosInternos / totalUnits;
    const netoPorUnidad = netoTotal / totalUnits;

    return {
      unitPriceWithIva,
      unitPriceWithoutIva: netoPorUnidad + impIntPorUnidad,
      totalCostExcludingTaxes: netoTotal,
    }
  } else {
    const unitPriceWithoutIva = item.precioUnitario / totalUnits;
    return {
      unitPriceWithIva: unitPriceWithoutIva,
      unitPriceWithoutIva,
      totalCostExcludingTaxes: item.precioUnitario,
    }
  }
};

const calculatePriceWine: PriceCalculator = (item) => {
  const unidades = item.unidadesPorBulto ?? 1;
  const precioNeto = item.precioUnitario / unidades;
  const ivaProporcional = precioNeto * (item.ivaPorcentaje / 100);

  return {
    unitPriceWithIva: precioNeto + ivaProporcional,
    unitPriceWithoutIva: precioNeto,
    totalCostExcludingTaxes: precioNeto * item.cantidad,
  }
};

const calculatePriceQuilmes: PriceCalculator = (item) => {
  const unidades = item.unidadesPorBulto ?? 1;
  const cantidadReal = item.cantidad * unidades;

  const unitPriceWithIva = item.precioUnitario;
  const unitPriceWithoutIva = item.ivaPorcentaje > 0
    ? item.precioUnitario - (item.precioUnitario * item.ivaPorcentaje / 100)
    : (item.precioUnitario + item.impuestosInternos) / cantidadReal;

  return {
    unitPriceWithIva,
    unitPriceWithoutIva,
    totalCostExcludingTaxes: unitPriceWithoutIva * cantidadReal,
  }
}

const calculatePriceDefault: PriceCalculator = (item) => {
  const unidades = item.unidadesPorBulto ?? 1;
  const precioNeto = item.precioUnitario / unidades;
  const ivaProporcional = precioNeto * (item.ivaPorcentaje / 100);
  const impInternoUnitario = item.impuestosInternos / unidades;

  return {
    unitPriceWithIva: precioNeto + impInternoUnitario + ivaProporcional,
    unitPriceWithoutIva: precioNeto + impInternoUnitario,
    totalCostExcludingTaxes: precioNeto * item.cantidad,
  }
}

// Strategy Pattern
const priceCalculatorPatterns: Array<{
  pattern: RegExp;
  calculator: PriceCalculator;
}> = [
    { pattern: /PEÑAFLOR/i, calculator: calculatePricePenaflor },
    { pattern: /DBA|DISTRIBUIDORA DE BEBIDAS SRL/i, calculator: calculatePriceDBA },
    { pattern: /COCA|MOET/i, calculator: calculatePriceCocaMoet },
    { pattern: /WINE/i, calculator: calculatePriceWine },
    { pattern: /QUILMES/i, calculator: calculatePriceQuilmes },
  ];

export const findCalculator = (proveedor: string): PriceCalculator => {
  const match = priceCalculatorPatterns.find(({ pattern }) => pattern.test(proveedor));
  return match?.calculator || calculatePriceDefault;
}
