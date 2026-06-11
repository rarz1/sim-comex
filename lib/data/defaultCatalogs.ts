
export const DEFAULT_CATALOGS = [
    {
        name: "Puertos",
        type: "two_column" as const,
        items: [
            { id: "p1", label: "Puerto de Cartagena", value: "COCTG", value2: "Colombia" },
            { id: "p2", label: "Puerto de Buenaventura", value: "COBUN", value2: "Colombia" },
            { id: "p3", label: "Puerto de Barranquilla", value: "COBAQ", value2: "Colombia" },
            { id: "p4", label: "Puerto de Santa Marta", value: "COSMR", value2: "Colombia" },
            { id: "p5", label: "Puerto de Miami", value: "USMIA", value2: "USA" },
            { id: "p6", label: "Puerto de Shanghai", value: "CNSHA", value2: "China" },
            { id: "p7", label: "Puerto de Rotterdam", value: "NLRTM", value2: "Países Bajos" }
        ]
    },
    {
        name: "Países",
        type: "simple" as const,
        items: [
            { id: "c1", label: "Colombia", value: "CO" },
            { id: "c2", label: "Estados Unidos", value: "US" },
            { id: "c3", label: "China", value: "CN" },
            { id: "c4", label: "Alemania", value: "DE" },
            { id: "c5", label: "Brasil", value: "BR" },
            { id: "c6", label: "México", value: "MX" },
            { id: "c7", label: "España", value: "ES" }
        ]
    },
    {
        name: "Monedas",
        type: "simple" as const,
        items: [
            { id: "m1", label: "Dólar Estadounidense (USD)", value: "USD" },
            { id: "m2", label: "Euro (EUR)", value: "EUR" },
            { id: "m3", label: "Peso Colombiano (COP)", value: "COP" },
            { id: "m4", label: "Yuan Chino (CNY)", value: "CNY" }
        ]
    },
    {
        name: "Incoterms 2020",
        type: "two_column" as const,
        items: [
            { id: "i1", label: "EXW - Ex Works", value: "EXW", value2: "Cualquier modo" },
            { id: "i2", label: "FOB - Free On Board", value: "FOB", value2: "Marítimo" },
            { id: "i3", label: "CIF - Cost, Insurance and Freight", value: "CIF", value2: "Marítimo" },
            { id: "i4", label: "DAP - Delivered At Place", value: "DAP", value2: "Cualquier modo" },
            { id: "i5", label: "DDP - Delivered Duty Paid", value: "DDP", value2: "Cualquier modo" },
            { id: "i6", label: "FCA - Free Carrier", value: "FCA", value2: "Cualquier modo" }
        ]
    },
    {
        name: "Tipos de Declaración",
        type: "simple" as const,
        items: [
            { id: "d1", label: "Importación Ordinaria", value: "ORD" },
            { id: "d2", label: "Importación con Franquicia", value: "FRA" },
            { id: "d3", label: "Reimportación por Perfeccionamiento Pasivo", value: "RPP" },
            { id: "d4", label: "Depósito Franco", value: "DFR" }
        ]
    }
];
