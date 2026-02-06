
export interface Review {
    id: string;
    source: 'Google' | 'Yelp' | 'Facebook' | 'Trustpilot' | 'Direct';
    date: string; // ISO format
    rating: number;
    author: string;
    text: string;
    listingName?: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    tags?: string[];
}

export const RATING_CATEGORIES = [
    {
        name: "Cleanliness",
        keywords: [
            'clean', 'dirt', 'hygiene', 'dust', 'mold', 'tidy', 'mess', 'stain', 'smell', 'hair', 'cockroach', 'bug', 'insect', 'rat', 'mouse', 'mice',
            'propre', 'sale', 'poussière', 'moisissure', 'tache', 'odeur', 'poil', 'insecte', 'rat', 'souris', 'ménage', 'nettoyage'
        ]
    },
    {
        name: "Accuracy",
        keywords: [
            'accuracy', 'description', 'photo', 'misleading', 'listing', 'picture', 'different', 'fake', 'lie',
            'précision', 'description', 'photo', 'trompeur', 'annonce', 'image', 'différent', 'faux', 'mensonge'
        ]
    },
    {
        name: "Check-in",
        keywords: [
            'check-in', 'check in', 'key', 'access', 'arrival', 'lockbox', 'code', 'enter', 'door', 'lock',
            'arrivée', 'clé', 'accès', 'boîte à clé', 'code', 'entrer', 'porte', 'serrure'
        ]
    },
    {
        name: "Communication",
        keywords: [
            'communication', 'respond', 'reply', 'host', 'manager', 'message', 'text', 'call', 'phone', 'answer',
            'réponse', 'répondre', 'hôte', 'gérant', 'message', 'appel', 'téléphone', 'contact'
        ]
    },
    {
        name: "Location",
        keywords: [
            'location', 'area', 'noise', 'safe', 'neighborhood', 'street', 'distance', 'view', 'loud', 'party', 'neighbor',
            'emplacement', 'quartier', 'bruit', 'sûr', 'rue', 'distance', 'vue', 'bruyant', 'fête', 'voisin'
        ]
    },
    {
        name: "Value",
        keywords: [
            'value', 'price', 'expensive', 'worth', 'cost', 'cheap', 'overpriced',
            'valeur', 'prix', 'cher', 'coût', 'dispendieux', 'qualité-prix'
        ]
    }
];

export const reviews: Review[] = [
    // January 2026 (Recent)
    {
        id: '1',
        source: 'Google',
        date: '2026-01-29',
        rating: 2,
        author: 'Sarah Jenkins',
        listingName: 'Modern Downtown Loft',
        text: 'The service was incredibly slow. We waited 45 minutes for our appetizers. The food was cold when it finally arrived.',
        sentiment: 'negative',
        tags: ['service', 'wait time', 'food temp']
    },
    {
        id: '2',
        source: 'Yelp',
        date: '2026-01-28',
        rating: 5,
        author: 'Mike Ross',
        listingName: 'Cozy Mountain Cabin',
        text: 'Absolutely loved the ambiance! The new renovation looks stunning. Will definitely come back.',
        sentiment: 'positive',
        tags: ['ambiance', 'interior']
    },
    {
        id: '3',
        source: 'Facebook',
        date: '2026-01-27',
        rating: 1,
        author: 'Emily Blunt',
        listingName: 'Seaside Villa',
        text: 'Worst experience ever. The manager was rude when I complained about the wrong order.',
        sentiment: 'negative',
        tags: ['staff', 'manager', 'wrong order']
    },
    {
        id: '4',
        source: 'Google',
        date: '2026-01-25',
        rating: 4,
        author: 'John Doe',
        listingName: 'Modern Downtown Loft',
        text: 'Great food, but a bit pricey for the portion sizes.',
        sentiment: 'neutral',
        tags: ['price', 'food quality']
    },
    {
        id: '5',
        source: 'Trustpilot',
        date: '2026-01-20',
        rating: 2,
        author: 'Alice Cooper',
        listingName: 'Cozy Mountain Cabin',
        text: 'Found a hair in my soup. Disgusting. The waiter just shrugged it off.',
        sentiment: 'negative',
        tags: ['hygiene', 'staff attitude']
    },
    // December 2025
    {
        id: '6',
        source: 'Google',
        date: '2025-12-24',
        rating: 5,
        author: 'Santa Claus',
        listingName: 'Seaside Villa',
        text: 'Best Christmas dinner spot! The turkey was moist and the pudding was divine.',
        sentiment: 'positive',
        tags: ['food quality', 'holiday']
    },
    {
        id: '7',
        source: 'Yelp',
        date: '2025-12-15',
        rating: 1,
        author: 'Grinch',
        listingName: 'Modern Downtown Loft',
        text: 'Too loud, too crowded. My ears are still ringing. Service was non-existent.',
        sentiment: 'negative',
        tags: ['atmosphere', 'noise', 'service']
    },
    {
        id: '8',
        source: 'Direct',
        date: '2025-12-10',
        rating: 3,
        author: 'Bob Builder',
        listingName: 'Cozy Mountain Cabin',
        text: 'It was okay. Nothing analyzing here. Just average food.',
        sentiment: 'neutral',
        tags: ['food quality']
    },
    {
        id: '9',
        source: 'Facebook',
        date: '2025-12-05',
        rating: 2,
        author: 'Karen Smith',
        listingName: 'Seaside Villa',
        text: ' bathrooms were dirty. Not what I expect from a place like this.',
        sentiment: 'negative',
        tags: ['cleanliness', 'facilities']
    },
    // Nov 2025
    {
        id: '10',
        source: 'Google',
        date: '2025-11-28',
        rating: 5,
        author: 'Tom Hanks',
        listingName: 'Modern Downtown Loft',
        text: 'A hidden gem! The pasta is handmade and you can really taste the difference.',
        sentiment: 'positive',
        tags: ['food quality']
    },
    {
        id: '11',
        source: 'Yelp',
        date: '2025-11-15',
        rating: 2,
        author: 'Gordon Ramsay',
        listingName: 'Cozy Mountain Cabin',
        text: 'The steak was raw! It walked off the plate! Unacceptable.',
        sentiment: 'negative',
        tags: ['food quality', 'undercooked']
    },
    {
        id: '12',
        source: 'Trustpilot',
        date: '2025-11-10',
        rating: 1,
        author: 'Disappointed Diner',
        listingName: 'Seaside Villa',
        text: 'Server spilled wine on my dress and didn\'t even apologize. Ruined our anniversary.',
        sentiment: 'negative',
        tags: ['service', 'staff']
    },
    {
        id: '13',
        source: 'Google',
        date: '2025-11-02',
        rating: 4,
        author: 'Happy Camper',
        listingName: 'Modern Downtown Loft',
        text: 'Good vibes and good food. A bit of a wait, but worth it.',
        sentiment: 'positive',
        tags: ['atmosphere', 'wait time']
    },
    {
        id: '14',
        source: 'Direct',
        date: '2026-01-15',
        rating: 2,
        author: 'Angry Customer',
        listingName: 'Cozy Mountain Cabin',
        text: 'Service is constantly slow. This is my third time here and it is always the same problem.',
        sentiment: 'negative',
        tags: ['service', 'wait time']
    },
    {
        id: '15',
        source: 'Google',
        date: '2026-01-30',
        rating: 1,
        author: 'Today Visitor',
        listingName: 'Seaside Villa',
        text: 'Just left. The AC was broken and it was sweating hot inside.',
        sentiment: 'negative',
        tags: ['facilities', 'comfort']
    }
];
