export type MccCode = {
  code: string
  descriptionPtBr: string
  descriptionEn: string
  parentCategory: string
  highRisk: boolean
}

export const MCC_DATASET_VERSION = 'ISO 18245 / Visa public MCC list (snapshot 2026-05-08)'

export const MCC_EXPANSION_TODO = 'TODO: expandir para lista oficial completa (~1000 MCCs) mantendo descrições PT-BR revisadas por compliance.'

export const MCC_CODES: MccCode[] = [
  {
    "code": "0742",
    "descriptionPtBr": "Veterinary Services",
    "descriptionEn": "Veterinary Services",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "0763",
    "descriptionPtBr": "Agricultural Co-operatives",
    "descriptionEn": "Agricultural Co-operatives",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "0780",
    "descriptionPtBr": "Horticultural Services, Landscaping Services",
    "descriptionEn": "Horticultural Services, Landscaping Services",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1520",
    "descriptionPtBr": "General Contractors-Residential and Commercial",
    "descriptionEn": "General Contractors-Residential and Commercial",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1711",
    "descriptionPtBr": "Air Conditioning Contractors – Sales and Installation, Heating Contractors – Sales, Service, Installation",
    "descriptionEn": "Air Conditioning Contractors – Sales and Installation, Heating Contractors – Sales, Service, Installation",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "1731",
    "descriptionPtBr": "Electrical Contractors",
    "descriptionEn": "Electrical Contractors",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1740",
    "descriptionPtBr": "Insulation – Contractors, Masonry, Stonework Contractors, Plastering Contractors, Stonework and Masonry Contractors, Tile Settings Contractors",
    "descriptionEn": "Insulation – Contractors, Masonry, Stonework Contractors, Plastering Contractors, Stonework and Masonry Contractors, Tile Settings Contractors",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1750",
    "descriptionPtBr": "Carpentry Contractors",
    "descriptionEn": "Carpentry Contractors",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1761",
    "descriptionPtBr": "Roofing – Contractors, Sheet Metal Work – Contractors, Siding – Contractors",
    "descriptionEn": "Roofing – Contractors, Sheet Metal Work – Contractors, Siding – Contractors",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1771",
    "descriptionPtBr": "Contractors – Concrete Work",
    "descriptionEn": "Contractors – Concrete Work",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "1799",
    "descriptionPtBr": "Contractors – Special Trade, Not Elsewhere Classified",
    "descriptionEn": "Contractors – Special Trade, Not Elsewhere Classified",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "2741",
    "descriptionPtBr": "Miscellaneous Publishing and Printing",
    "descriptionEn": "Miscellaneous Publishing and Printing",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "2791",
    "descriptionPtBr": "Typesetting, Plate Making, & Related Services",
    "descriptionEn": "Typesetting, Plate Making, & Related Services",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "2842",
    "descriptionPtBr": "Specialty Cleaning, Polishing, and Sanitation Preparations",
    "descriptionEn": "Specialty Cleaning, Polishing, and Sanitation Preparations",
    "parentCategory": "Serviços",
    "highRisk": false
  },
  {
    "code": "3000",
    "descriptionPtBr": "UNITED AIRLINES",
    "descriptionEn": "UNITED AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3001",
    "descriptionPtBr": "AMERICAN AIRLINES",
    "descriptionEn": "AMERICAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3002",
    "descriptionPtBr": "PAN AMERICAN",
    "descriptionEn": "PAN AMERICAN",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3003",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3004",
    "descriptionPtBr": "TRANS WORLD AIRLINES",
    "descriptionEn": "TRANS WORLD AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3005",
    "descriptionPtBr": "BRITISH AIRWAYS",
    "descriptionEn": "BRITISH AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3006",
    "descriptionPtBr": "JAPAN AIRLINES",
    "descriptionEn": "JAPAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3007",
    "descriptionPtBr": "AIR FRANCE",
    "descriptionEn": "AIR FRANCE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3008",
    "descriptionPtBr": "LUFTHANSA",
    "descriptionEn": "LUFTHANSA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3009",
    "descriptionPtBr": "AIR CANADA",
    "descriptionEn": "AIR CANADA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3010",
    "descriptionPtBr": "KLM (ROYAL DUTCH AIRLINES)",
    "descriptionEn": "KLM (ROYAL DUTCH AIRLINES)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3011",
    "descriptionPtBr": "AEORFLOT",
    "descriptionEn": "AEORFLOT",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3012",
    "descriptionPtBr": "QANTAS",
    "descriptionEn": "QANTAS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3013",
    "descriptionPtBr": "ALITALIA",
    "descriptionEn": "ALITALIA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3014",
    "descriptionPtBr": "SAUDIA ARABIAN AIRLINES",
    "descriptionEn": "SAUDIA ARABIAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3015",
    "descriptionPtBr": "SWISSAIR",
    "descriptionEn": "SWISSAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3016",
    "descriptionPtBr": "SAS",
    "descriptionEn": "SAS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3017",
    "descriptionPtBr": "SOUTH AFRICAN AIRWAYS",
    "descriptionEn": "SOUTH AFRICAN AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3018",
    "descriptionPtBr": "VARIG (BRAZIL)",
    "descriptionEn": "VARIG (BRAZIL)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3019",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3020",
    "descriptionPtBr": "AIR-INDIA",
    "descriptionEn": "AIR-INDIA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3021",
    "descriptionPtBr": "AIR ALGERIE",
    "descriptionEn": "AIR ALGERIE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3022",
    "descriptionPtBr": "PHILIPPINE AIRLINES",
    "descriptionEn": "PHILIPPINE AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3023",
    "descriptionPtBr": "MEXICANA",
    "descriptionEn": "MEXICANA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3024",
    "descriptionPtBr": "PAKISTAN INTERNATIONAL",
    "descriptionEn": "PAKISTAN INTERNATIONAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3025",
    "descriptionPtBr": "AIR NEW ZEALAND",
    "descriptionEn": "AIR NEW ZEALAND",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3026",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3027",
    "descriptionPtBr": "UTA/INTERAIR",
    "descriptionEn": "UTA/INTERAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3028",
    "descriptionPtBr": "AIR MALTA",
    "descriptionEn": "AIR MALTA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3029",
    "descriptionPtBr": "SABENA",
    "descriptionEn": "SABENA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3030",
    "descriptionPtBr": "AEROLINEAS ARGENTINAS",
    "descriptionEn": "AEROLINEAS ARGENTINAS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3031",
    "descriptionPtBr": "OLYMPIC AIRWAYS",
    "descriptionEn": "OLYMPIC AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3032",
    "descriptionPtBr": "EL AL",
    "descriptionEn": "EL AL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3033",
    "descriptionPtBr": "ANSETT AIRLINES",
    "descriptionEn": "ANSETT AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3034",
    "descriptionPtBr": "AUSTRAINLIAN AIRLINES",
    "descriptionEn": "AUSTRAINLIAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3035",
    "descriptionPtBr": "TAP (PORTUGAL)",
    "descriptionEn": "TAP (PORTUGAL)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3036",
    "descriptionPtBr": "VASP (BRAZIL)",
    "descriptionEn": "VASP (BRAZIL)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3037",
    "descriptionPtBr": "EGYPTAIR",
    "descriptionEn": "EGYPTAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3038",
    "descriptionPtBr": "KUWAIT AIRLINES",
    "descriptionEn": "KUWAIT AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3039",
    "descriptionPtBr": "AVIANCA",
    "descriptionEn": "AVIANCA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3040",
    "descriptionPtBr": "GULF AIR (BAHRAIN)",
    "descriptionEn": "GULF AIR (BAHRAIN)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3041",
    "descriptionPtBr": "BALKAN-BULGARIAN AIRLINES",
    "descriptionEn": "BALKAN-BULGARIAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3042",
    "descriptionPtBr": "FINNAIR",
    "descriptionEn": "FINNAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3043",
    "descriptionPtBr": "AER LINGUS",
    "descriptionEn": "AER LINGUS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3044",
    "descriptionPtBr": "AIR LANKA",
    "descriptionEn": "AIR LANKA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3045",
    "descriptionPtBr": "NIGERIA AIRWAYS",
    "descriptionEn": "NIGERIA AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3046",
    "descriptionPtBr": "CRUZEIRO DO SUL (BRAZIJ)",
    "descriptionEn": "CRUZEIRO DO SUL (BRAZIJ)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3047",
    "descriptionPtBr": "THY (TURKEY)",
    "descriptionEn": "THY (TURKEY)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3048",
    "descriptionPtBr": "ROYAL AIR MAROC",
    "descriptionEn": "ROYAL AIR MAROC",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3049",
    "descriptionPtBr": "TUNIS AIR",
    "descriptionEn": "TUNIS AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3050",
    "descriptionPtBr": "ICELANDAIR",
    "descriptionEn": "ICELANDAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3051",
    "descriptionPtBr": "AUSTRIAN AIRLINES",
    "descriptionEn": "AUSTRIAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3052",
    "descriptionPtBr": "LANCHILE",
    "descriptionEn": "LANCHILE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3053",
    "descriptionPtBr": "AVIACO (SPAIN)",
    "descriptionEn": "AVIACO (SPAIN)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3054",
    "descriptionPtBr": "LADECO (CHILE)",
    "descriptionEn": "LADECO (CHILE)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3055",
    "descriptionPtBr": "LAB (BOLIVIA)",
    "descriptionEn": "LAB (BOLIVIA)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3056",
    "descriptionPtBr": "QUEBECAIRE",
    "descriptionEn": "QUEBECAIRE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3057",
    "descriptionPtBr": "EASTWEST AIRLINES (AUSTRALIA)",
    "descriptionEn": "EASTWEST AIRLINES (AUSTRALIA)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3058",
    "descriptionPtBr": "DELTA",
    "descriptionEn": "DELTA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3059",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3060",
    "descriptionPtBr": "NORTHWEST",
    "descriptionEn": "NORTHWEST",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3061",
    "descriptionPtBr": "CONTINENTAL",
    "descriptionEn": "CONTINENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3062",
    "descriptionPtBr": "WESTERN",
    "descriptionEn": "WESTERN",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3063",
    "descriptionPtBr": "US AIR",
    "descriptionEn": "US AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3064",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3065",
    "descriptionPtBr": "AIRINTER",
    "descriptionEn": "AIRINTER",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3066",
    "descriptionPtBr": "SOUTHWEST",
    "descriptionEn": "SOUTHWEST",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3067",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3068",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3069",
    "descriptionPtBr": "SUN COUNTRY AIRLINES",
    "descriptionEn": "SUN COUNTRY AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3070",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3071",
    "descriptionPtBr": "AIR BRITISH COLUBIA",
    "descriptionEn": "AIR BRITISH COLUBIA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3072",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3073",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3074",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3075",
    "descriptionPtBr": "SINGAPORE AIRLINES",
    "descriptionEn": "SINGAPORE AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3076",
    "descriptionPtBr": "AEROMEXICO",
    "descriptionEn": "AEROMEXICO",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3077",
    "descriptionPtBr": "THAI AIRWAYS",
    "descriptionEn": "THAI AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3078",
    "descriptionPtBr": "CHINA AIRLINES",
    "descriptionEn": "CHINA AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3079",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3080",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3081",
    "descriptionPtBr": "NORDAIR",
    "descriptionEn": "NORDAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3082",
    "descriptionPtBr": "KOREAN AIRLINES",
    "descriptionEn": "KOREAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3083",
    "descriptionPtBr": "AIR AFRIGUE",
    "descriptionEn": "AIR AFRIGUE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3084",
    "descriptionPtBr": "EVA AIRLINES",
    "descriptionEn": "EVA AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3085",
    "descriptionPtBr": "MIDWEST EXPRESS AIRLINES, INC.",
    "descriptionEn": "MIDWEST EXPRESS AIRLINES, INC.",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3086",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3087",
    "descriptionPtBr": "METRO AIRLINES",
    "descriptionEn": "METRO AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3088",
    "descriptionPtBr": "CROATIA AIRLINES",
    "descriptionEn": "CROATIA AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3089",
    "descriptionPtBr": "TRANSAERO",
    "descriptionEn": "TRANSAERO",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3090",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3091",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3092",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3093",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3094",
    "descriptionPtBr": "ZAMBIA AIRWAYS",
    "descriptionEn": "ZAMBIA AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3095",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3096",
    "descriptionPtBr": "AIR ZIMBABWE",
    "descriptionEn": "AIR ZIMBABWE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3097",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3098",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3099",
    "descriptionPtBr": "CATHAY PACIFIC",
    "descriptionEn": "CATHAY PACIFIC",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3100",
    "descriptionPtBr": "MALAYSIAN AIRLINE SYSTEM",
    "descriptionEn": "MALAYSIAN AIRLINE SYSTEM",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3101",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3102",
    "descriptionPtBr": "IBERIA",
    "descriptionEn": "IBERIA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3103",
    "descriptionPtBr": "GARUDA (INDONESIA)",
    "descriptionEn": "GARUDA (INDONESIA)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3104",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3105",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3106",
    "descriptionPtBr": "BRAATHENS S.A.F.E. (NORWAY)",
    "descriptionEn": "BRAATHENS S.A.F.E. (NORWAY)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3107",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3108",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3109",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3110",
    "descriptionPtBr": "WINGS AIRWAYS",
    "descriptionEn": "WINGS AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3111",
    "descriptionPtBr": "BRITISH MIDLAND",
    "descriptionEn": "BRITISH MIDLAND",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3112",
    "descriptionPtBr": "WINDWARD ISLAND",
    "descriptionEn": "WINDWARD ISLAND",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3113",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3114",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3115",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3116",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3117",
    "descriptionPtBr": "VIASA",
    "descriptionEn": "VIASA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3118",
    "descriptionPtBr": "VALLEY AIRLINES",
    "descriptionEn": "VALLEY AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3119",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3120",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3121",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3122",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3123",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3124",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3125",
    "descriptionPtBr": "TAN",
    "descriptionEn": "TAN",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3126",
    "descriptionPtBr": "TALAIR",
    "descriptionEn": "TALAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3127",
    "descriptionPtBr": "TACA INTERNATIONAL",
    "descriptionEn": "TACA INTERNATIONAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3128",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3129",
    "descriptionPtBr": "SURINAM AIRWAYS",
    "descriptionEn": "SURINAM AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3130",
    "descriptionPtBr": "SUN WORLD INTERNATIONAL",
    "descriptionEn": "SUN WORLD INTERNATIONAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3131",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3132",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3133",
    "descriptionPtBr": "SUNBELT AIRLINES",
    "descriptionEn": "SUNBELT AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3134",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3135",
    "descriptionPtBr": "SUDAN AIRWAYS",
    "descriptionEn": "SUDAN AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3136",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3137",
    "descriptionPtBr": "SINGLETON",
    "descriptionEn": "SINGLETON",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3138",
    "descriptionPtBr": "SIMMONS AIRLINES",
    "descriptionEn": "SIMMONS AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3139",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3140",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3141",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3142",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3143",
    "descriptionPtBr": "SCENIC AIRLINES",
    "descriptionEn": "SCENIC AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3144",
    "descriptionPtBr": "VIRGIN ATLANTIC",
    "descriptionEn": "VIRGIN ATLANTIC",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3145",
    "descriptionPtBr": "SAN JUAN AIRLINES",
    "descriptionEn": "SAN JUAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3146",
    "descriptionPtBr": "LUXAIR",
    "descriptionEn": "LUXAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3147",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3148",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3149",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3150",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3151",
    "descriptionPtBr": "AIR ZAIRE",
    "descriptionEn": "AIR ZAIRE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3152",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3153",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3154",
    "descriptionPtBr": "PRINCEVILLE",
    "descriptionEn": "PRINCEVILLE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3155",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3156",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3157",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3158",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3159",
    "descriptionPtBr": "PBA",
    "descriptionEn": "PBA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3160",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3161",
    "descriptionPtBr": "ALL NIPPON AIRWAYS",
    "descriptionEn": "ALL NIPPON AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3162",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3163",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3164",
    "descriptionPtBr": "NORONTAIR",
    "descriptionEn": "NORONTAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3165",
    "descriptionPtBr": "NEW YORK HELICOPTER",
    "descriptionEn": "NEW YORK HELICOPTER",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3166",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3167",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3168",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3169",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3170",
    "descriptionPtBr": "NOUNT COOK",
    "descriptionEn": "NOUNT COOK",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3171",
    "descriptionPtBr": "CANADIAN AIRLINES INTERNATIONAL",
    "descriptionEn": "CANADIAN AIRLINES INTERNATIONAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3172",
    "descriptionPtBr": "NATIONAIR",
    "descriptionEn": "NATIONAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3173",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3174",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3175",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3176",
    "descriptionPtBr": "METROFLIGHT AIRLINES",
    "descriptionEn": "METROFLIGHT AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3177",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3178",
    "descriptionPtBr": "MESA AIR",
    "descriptionEn": "MESA AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3179",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3180",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3181",
    "descriptionPtBr": "MALEV",
    "descriptionEn": "MALEV",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3182",
    "descriptionPtBr": "LOT (POLAND)",
    "descriptionEn": "LOT (POLAND)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3183",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3184",
    "descriptionPtBr": "LIAT",
    "descriptionEn": "LIAT",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3185",
    "descriptionPtBr": "LAV (VENEZUELA)",
    "descriptionEn": "LAV (VENEZUELA)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3186",
    "descriptionPtBr": "LAP (PARAGUAY)",
    "descriptionEn": "LAP (PARAGUAY)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3187",
    "descriptionPtBr": "LACSA (COSTA RICA)",
    "descriptionEn": "LACSA (COSTA RICA)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3188",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3189",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3190",
    "descriptionPtBr": "JUGOSLAV AIR",
    "descriptionEn": "JUGOSLAV AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3191",
    "descriptionPtBr": "ISLAND AIRLINES",
    "descriptionEn": "ISLAND AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3192",
    "descriptionPtBr": "IRAN AIR",
    "descriptionEn": "IRAN AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3193",
    "descriptionPtBr": "INDIAN AIRLINES",
    "descriptionEn": "INDIAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3194",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3195",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3196",
    "descriptionPtBr": "HAWAIIAN AIR",
    "descriptionEn": "HAWAIIAN AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3197",
    "descriptionPtBr": "HAVASU AIRLINES",
    "descriptionEn": "HAVASU AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3198",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3199",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3200",
    "descriptionPtBr": "FUYANA AIRWAYS",
    "descriptionEn": "FUYANA AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3201",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3202",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3203",
    "descriptionPtBr": "GOLDEN PACIFIC AIR",
    "descriptionEn": "GOLDEN PACIFIC AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3204",
    "descriptionPtBr": "FREEDOM AIR",
    "descriptionEn": "FREEDOM AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3205",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3206",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3207",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3208",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3209",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3210",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3211",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3212",
    "descriptionPtBr": "DOMINICANA",
    "descriptionEn": "DOMINICANA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3213",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3214",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3215",
    "descriptionPtBr": "DAN AIR SERVICES",
    "descriptionEn": "DAN AIR SERVICES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3216",
    "descriptionPtBr": "CUMBERLAND AIRLINES",
    "descriptionEn": "CUMBERLAND AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3217",
    "descriptionPtBr": "CSA",
    "descriptionEn": "CSA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3218",
    "descriptionPtBr": "CROWN AIR",
    "descriptionEn": "CROWN AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3219",
    "descriptionPtBr": "COPA",
    "descriptionEn": "COPA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3220",
    "descriptionPtBr": "COMPANIA FAUCETT",
    "descriptionEn": "COMPANIA FAUCETT",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3221",
    "descriptionPtBr": "TRANSPORTES AEROS MILITARES ECCUATORANOS",
    "descriptionEn": "TRANSPORTES AEROS MILITARES ECCUATORANOS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3222",
    "descriptionPtBr": "COMMAND AIRWAYS",
    "descriptionEn": "COMMAND AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3223",
    "descriptionPtBr": "COMAIR",
    "descriptionEn": "COMAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3224",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3225",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3226",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3227",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3228",
    "descriptionPtBr": "CAYMAN AIRWAYS",
    "descriptionEn": "CAYMAN AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3229",
    "descriptionPtBr": "SAETA SOCIAEDAD ECUATORIANOS DE TRANSPORTES AEREOS",
    "descriptionEn": "SAETA SOCIAEDAD ECUATORIANOS DE TRANSPORTES AEREOS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3230",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3231",
    "descriptionPtBr": "SASHA SERVICIO AERO DE HONDURAS",
    "descriptionEn": "SASHA SERVICIO AERO DE HONDURAS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3232",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3233",
    "descriptionPtBr": "CAPITOL AIR",
    "descriptionEn": "CAPITOL AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3234",
    "descriptionPtBr": "BWIA",
    "descriptionEn": "BWIA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3235",
    "descriptionPtBr": "BROKWAY AIR",
    "descriptionEn": "BROKWAY AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3236",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3237",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3238",
    "descriptionPtBr": "BEMIDJI AIRLINES",
    "descriptionEn": "BEMIDJI AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3239",
    "descriptionPtBr": "BAR HARBOR AIRLINES",
    "descriptionEn": "BAR HARBOR AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3240",
    "descriptionPtBr": "BAHAMASAIR",
    "descriptionEn": "BAHAMASAIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3241",
    "descriptionPtBr": "AVIATECA (GUATEMALA)",
    "descriptionEn": "AVIATECA (GUATEMALA)",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3242",
    "descriptionPtBr": "AVENSA",
    "descriptionEn": "AVENSA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3243",
    "descriptionPtBr": "AUSTRIAN AIR SERVICE",
    "descriptionEn": "AUSTRIAN AIR SERVICE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3244",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3245",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3246",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3247",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3248",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3249",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3250",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3251",
    "descriptionPtBr": "ALOHA AIRLINES",
    "descriptionEn": "ALOHA AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3252",
    "descriptionPtBr": "ALM",
    "descriptionEn": "ALM",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3253",
    "descriptionPtBr": "AMERICA WEST",
    "descriptionEn": "AMERICA WEST",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3254",
    "descriptionPtBr": "TRUMP AIRLINE",
    "descriptionEn": "TRUMP AIRLINE",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3255",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3256",
    "descriptionPtBr": "ALASKA AIRLINES",
    "descriptionEn": "ALASKA AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3257",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3258",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3259",
    "descriptionPtBr": "AMERICAN TRANS AIR",
    "descriptionEn": "AMERICAN TRANS AIR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3260",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3261",
    "descriptionPtBr": "AIR CHINA",
    "descriptionEn": "AIR CHINA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3262",
    "descriptionPtBr": "RENO AIR, INC.",
    "descriptionEn": "RENO AIR, INC.",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3263",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3264",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3265",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3266",
    "descriptionPtBr": "AIR SEYCHELLES",
    "descriptionEn": "AIR SEYCHELLES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3267",
    "descriptionPtBr": "AIR PANAMA",
    "descriptionEn": "AIR PANAMA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3268",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3269",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3270",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3271",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3272",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3273",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3274",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3275",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3276",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3277",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3278",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3279",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3280",
    "descriptionPtBr": "AIR JAMAICA",
    "descriptionEn": "AIR JAMAICA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3281",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3282",
    "descriptionPtBr": "AIR DJIBOUTI",
    "descriptionEn": "AIR DJIBOUTI",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3283",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3284",
    "descriptionPtBr": "AERO VIRGIN ISLANDS",
    "descriptionEn": "AERO VIRGIN ISLANDS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3285",
    "descriptionPtBr": "AERO PERU",
    "descriptionEn": "AERO PERU",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3286",
    "descriptionPtBr": "AEROLINEAS NICARAGUENSIS",
    "descriptionEn": "AEROLINEAS NICARAGUENSIS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3287",
    "descriptionPtBr": "AERO COACH AVAIATION",
    "descriptionEn": "AERO COACH AVAIATION",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3288",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3289",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3290",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3291",
    "descriptionPtBr": "ARIANA AFGHAN",
    "descriptionEn": "ARIANA AFGHAN",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3292",
    "descriptionPtBr": "CYPRUS AIRWAYS",
    "descriptionEn": "CYPRUS AIRWAYS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3293",
    "descriptionPtBr": "ECUATORIANA",
    "descriptionEn": "ECUATORIANA",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3294",
    "descriptionPtBr": "ETHIOPIAN AIRLINES",
    "descriptionEn": "ETHIOPIAN AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3295",
    "descriptionPtBr": "KENYA AIRLINES",
    "descriptionEn": "KENYA AIRLINES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3296",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3297",
    "descriptionPtBr": "Companhias aéreas",
    "descriptionEn": "Airlines",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3298",
    "descriptionPtBr": "AIR MAURITIUS",
    "descriptionEn": "AIR MAURITIUS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3299",
    "descriptionPtBr": "WIDERO’S FLYVESELSKAP",
    "descriptionEn": "WIDERO’S FLYVESELSKAP",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3351",
    "descriptionPtBr": "AFFILIATED AUTO RENTAL",
    "descriptionEn": "AFFILIATED AUTO RENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3352",
    "descriptionPtBr": "AMERICAN INTL RENT-A-CAR",
    "descriptionEn": "AMERICAN INTL RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3353",
    "descriptionPtBr": "BROOKS RENT-A-CAR",
    "descriptionEn": "BROOKS RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3354",
    "descriptionPtBr": "ACTION AUTO RENTAL",
    "descriptionEn": "ACTION AUTO RENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3355",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3356",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3357",
    "descriptionPtBr": "HERTZ RENT-A-CAR",
    "descriptionEn": "HERTZ RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3358",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3359",
    "descriptionPtBr": "PAYLESS CAR RENTAL",
    "descriptionEn": "PAYLESS CAR RENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3360",
    "descriptionPtBr": "SNAPPY CAR RENTAL",
    "descriptionEn": "SNAPPY CAR RENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3361",
    "descriptionPtBr": "AIRWAYS RENT-A-CAR",
    "descriptionEn": "AIRWAYS RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3362",
    "descriptionPtBr": "ALTRA AUTO RENTAL",
    "descriptionEn": "ALTRA AUTO RENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3363",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3364",
    "descriptionPtBr": "AGENCY RENT-A-CAR",
    "descriptionEn": "AGENCY RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3365",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3366",
    "descriptionPtBr": "BUDGET RENT-A-CAR",
    "descriptionEn": "BUDGET RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3367",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3368",
    "descriptionPtBr": "HOLIDAY RENT-A-WRECK",
    "descriptionEn": "HOLIDAY RENT-A-WRECK",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3369",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3370",
    "descriptionPtBr": "RENT-A-WRECK",
    "descriptionEn": "RENT-A-WRECK",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3371",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3372",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3373",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3374",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3375",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3376",
    "descriptionPtBr": "AJAX RENT-A-CAR",
    "descriptionEn": "AJAX RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3377",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3378",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3379",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3380",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3381",
    "descriptionPtBr": "EUROP CAR",
    "descriptionEn": "EUROP CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3382",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3383",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3384",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3385",
    "descriptionPtBr": "TROPICAL RENT-A-CAR",
    "descriptionEn": "TROPICAL RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3386",
    "descriptionPtBr": "SHOWCASE RENTAL CARS",
    "descriptionEn": "SHOWCASE RENTAL CARS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3387",
    "descriptionPtBr": "ALAMO RENT-A-CAR",
    "descriptionEn": "ALAMO RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3388",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3389",
    "descriptionPtBr": "AVIS RENT-A-CAR",
    "descriptionEn": "AVIS RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3390",
    "descriptionPtBr": "DOLLAR RENT-A-CAR",
    "descriptionEn": "DOLLAR RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3391",
    "descriptionPtBr": "EUROPE BY CAR",
    "descriptionEn": "EUROPE BY CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3392",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3393",
    "descriptionPtBr": "NATIONAL CAR RENTAL",
    "descriptionEn": "NATIONAL CAR RENTAL",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3394",
    "descriptionPtBr": "KEMWELL GROUP RENT-A-CAR",
    "descriptionEn": "KEMWELL GROUP RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3395",
    "descriptionPtBr": "THRIFTY RENT-A-CAR",
    "descriptionEn": "THRIFTY RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3396",
    "descriptionPtBr": "TILDEN TENT-A-CAR",
    "descriptionEn": "TILDEN TENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3397",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3398",
    "descriptionPtBr": "ECONO-CAR RENT-A-CAR",
    "descriptionEn": "ECONO-CAR RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3399",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3400",
    "descriptionPtBr": "AUTO HOST COST CAR RENTALS",
    "descriptionEn": "AUTO HOST COST CAR RENTALS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3401",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3402",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3403",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3404",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3405",
    "descriptionPtBr": "ENTERPRISE RENT-A-CAR",
    "descriptionEn": "ENTERPRISE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3406",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3407",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3408",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3409",
    "descriptionPtBr": "GENERAL RENT-A-CAR",
    "descriptionEn": "GENERAL RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3410",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3411",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3412",
    "descriptionPtBr": "A-1 RENT-A-CAR",
    "descriptionEn": "A-1 RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3413",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3414",
    "descriptionPtBr": "GODFREY NATL RENT-A-CAR",
    "descriptionEn": "GODFREY NATL RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3415",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3416",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3417",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3418",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3419",
    "descriptionPtBr": "ALPHA RENT-A-CAR",
    "descriptionEn": "ALPHA RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3420",
    "descriptionPtBr": "ANSA INTL RENT-A-CAR",
    "descriptionEn": "ANSA INTL RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3421",
    "descriptionPtBr": "ALLSTAE RENT-A-CAR",
    "descriptionEn": "ALLSTAE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3422",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3423",
    "descriptionPtBr": "AVCAR RENT-A-CAR",
    "descriptionEn": "AVCAR RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3424",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3425",
    "descriptionPtBr": "AUTOMATE RENT-A-CAR",
    "descriptionEn": "AUTOMATE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3426",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3427",
    "descriptionPtBr": "AVON RENT-A-CAR",
    "descriptionEn": "AVON RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3428",
    "descriptionPtBr": "CAREY RENT-A-CAR",
    "descriptionEn": "CAREY RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3429",
    "descriptionPtBr": "INSURANCE RENT-A-CAR",
    "descriptionEn": "INSURANCE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3430",
    "descriptionPtBr": "MAJOR RENT-A-CAR",
    "descriptionEn": "MAJOR RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3431",
    "descriptionPtBr": "REPLACEMENT RENT-A-CAR",
    "descriptionEn": "REPLACEMENT RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3432",
    "descriptionPtBr": "RESERVE RENT-A-CAR",
    "descriptionEn": "RESERVE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3433",
    "descriptionPtBr": "UGLY DUCKLING RENT-A-CAR",
    "descriptionEn": "UGLY DUCKLING RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3434",
    "descriptionPtBr": "USA RENT-A-CAR",
    "descriptionEn": "USA RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3435",
    "descriptionPtBr": "VALUE RENT-A-CAR",
    "descriptionEn": "VALUE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3436",
    "descriptionPtBr": "AUTOHANSA RENT-A-CAR",
    "descriptionEn": "AUTOHANSA RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3437",
    "descriptionPtBr": "CITE RENT-A-CAR",
    "descriptionEn": "CITE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3438",
    "descriptionPtBr": "INTERENT RENT-A-CAR",
    "descriptionEn": "INTERENT RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3439",
    "descriptionPtBr": "MILLEVILLE RENT-A-CAR",
    "descriptionEn": "MILLEVILLE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3440",
    "descriptionPtBr": "VIA ROUTE RENT-A-CAR",
    "descriptionEn": "VIA ROUTE RENT-A-CAR",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3441",
    "descriptionPtBr": "Car Rental",
    "descriptionEn": "Car Rental",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3501",
    "descriptionPtBr": "HOLIDAY INNS, HOLIDAY INN EXPRESS",
    "descriptionEn": "HOLIDAY INNS, HOLIDAY INN EXPRESS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3502",
    "descriptionPtBr": "BEST WESTERN HOTELS",
    "descriptionEn": "BEST WESTERN HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3503",
    "descriptionPtBr": "SHERATON HOTELS",
    "descriptionEn": "SHERATON HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3504",
    "descriptionPtBr": "HILTON HOTELS",
    "descriptionEn": "HILTON HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3505",
    "descriptionPtBr": "FORTE HOTELS",
    "descriptionEn": "FORTE HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3506",
    "descriptionPtBr": "GOLDEN TULIP HOTELS",
    "descriptionEn": "GOLDEN TULIP HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3507",
    "descriptionPtBr": "FRIENDSHIP INNS",
    "descriptionEn": "FRIENDSHIP INNS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3508",
    "descriptionPtBr": "QUALITY INNS, QUALITY SUITES",
    "descriptionEn": "QUALITY INNS, QUALITY SUITES",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3509",
    "descriptionPtBr": "MARRIOTT HOTELS",
    "descriptionEn": "MARRIOTT HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3510",
    "descriptionPtBr": "DAYS INN, DAYSTOP",
    "descriptionEn": "DAYS INN, DAYSTOP",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3511",
    "descriptionPtBr": "ARABELLA HOTELS",
    "descriptionEn": "ARABELLA HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3512",
    "descriptionPtBr": "INTER-CONTINENTAL HOTELS",
    "descriptionEn": "INTER-CONTINENTAL HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3513",
    "descriptionPtBr": "WESTIN HOTELS",
    "descriptionEn": "WESTIN HOTELS",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3514",
    "descriptionPtBr": "Hotels/Motels/Inns/Resorts",
    "descriptionEn": "Hotels/Motels/Inns/Resorts",
    "parentCategory": "Transporte",
    "highRisk": false
  },
  {
    "code": "3515",
    "descriptionPtBr": "RODEWAY INNS",
    "descriptionEn": "RODEWAY INNS",
    "parentCategory": "Transporte",
    "highRisk": false
  }
]
