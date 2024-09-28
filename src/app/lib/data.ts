


interface Service {
    name: string;
    subServices: string[];
  }

export const Services: Service[] = [
    { name: 'Daily parking', subServices:['On-street', 'Off-street'] },
    {name: 'Seasonal parking', subServices: ['PSV Matatus', 'Parking Stickers', 'Lorries PSV Parking Stickers', 'Taxis PSV Parking Stickers']},
    { name: 'Reserved Parking', subServices: ['Loading Zones', 'PSV Matatu Parking Bay Hire','Trailer Parking  Bay Hire','Parking bay hire']},
    { name: 'VIP Parking', subServices:['VIP Parking'] },
    { name: 'Land Valuation', subServices:['Land Valuation','Provisional Valuation'] },
    { name: 'Land Rates', subServices:['Annual Land rates','Rates Search','Land Transfers','Ground Rent','Penalties on Land Rates','Waiver of Penalties on Land','SDR-Stand Premium','Clearance Certificate'] },
    { name: 'Land Survey ', subServices:['Land Surveying'] },
    { name: 'Land Use Planning ', subServices:['Land Subdivision','Change of Use','Land Amalgamation','Extension/renewal of lease'] },
    { name: 'Development Control', subServices:['Building Permits','Construction Site Board','Building Occupation Certificate','Renovation Permit'] },
];
