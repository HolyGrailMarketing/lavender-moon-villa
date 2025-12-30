// Room data with details, images, and amenities
export interface RoomData {
  slug: string
  name: string
  type: 'suite' | 'room'
  tagline: string
  description: string
  price: number
  maxGuests: number
  beds: string
  size: string
  images: string[]
  amenities: string[]
  features: string[]
  highlights: string[]
}

export const roomsData: RoomData[] = [
  // Premium Suites
  {
    slug: 'victoria-suite',
    name: 'Victoria Suite',
    type: 'suite',
    tagline: 'Premium • Exceptional Luxury',
    description: 'Our most prestigious accommodation, the Victoria Suite offers unparalleled luxury with breathtaking views. Perfect for special occasions or those seeking the ultimate in comfort and elegance.',
    price: 480,
    maxGuests: 6,
    beds: 'King Bed + Sofa Bed',
    size: 'Extra Large',
    images: [
      '/Pictures/Victoria-Suite/placeholder.jpg', // Add your images here
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Jacuzzi', 'King Bed', 'Dining Area', 'Ocean View'],
    features: ['King Bed', 'Living Area', 'Mountain View'],
    highlights: ['Ocean & Mountain Views', 'Private Jacuzzi', 'Spacious Living Area', 'Premium Linens'],
  },
  {
    slug: 'alexander-suite',
    name: 'Alexander Suite',
    type: 'suite',
    tagline: 'Luxurious • Stunning Views',
    description: 'The Alexander Suite features two full-sized beds with a private balcony offering stunning sea and mountain views. Equipped with modern conveniences including a microwave, coffee pot, and mini fridge.',
    price: 280,
    maxGuests: 4,
    beds: 'Two Full Beds',
    size: 'Large',
    images: [
      '/Pictures/207-A/Lavender%20Moon%20207%20A%20(1).JPG',
      '/Pictures/207-A/Lavender%20Moon%20207%20A%20(2).JPG',
      '/Pictures/207-A/Lavender%20Moon%20207%20A%20(3).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Balcony', 'Microwave', 'Coffee Pot', 'Mini Fridge'],
    features: ['Two Full Beds', 'Balcony', 'AC'],
    highlights: ['Sea & Mountain Views', 'Private Balcony', 'In-Room Kitchenette', 'Modern Amenities'],
  },
  {
    slug: 'renee-suite',
    name: 'Renee Suite',
    type: 'suite',
    tagline: 'Elegant • Comfort & Style',
    description: 'The Renee Suite combines elegance with comfort, offering a peaceful retreat with beautiful surroundings. Ideal for couples or solo travelers seeking a refined stay.',
    price: 280,
    maxGuests: 4,
    beds: 'Queen Bed',
    size: 'Large',
    images: [
      '/Pictures/Renee-Suite/placeholder.jpg', // Add your images here
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Terrace', 'Queen Bed', 'Work Desk'],
    features: ['Queen Bed', 'Private Bath', 'WiFi'],
    highlights: ['Private Terrace', 'Work Desk', 'Peaceful Setting', 'Garden Views'],
  },
  // Standard Rooms
  {
    slug: 'room-106',
    name: 'Room 106-JW',
    type: 'room',
    tagline: 'Spacious • Full Kitchen',
    description: 'Room 106 is our most spacious standard accommodation featuring a full-sized kitchen, dining and living area, two queen beds, and both a private back porch and large front verandah with stunning sea views.',
    price: 325,
    maxGuests: 4,
    beds: 'Two Queen Beds',
    size: 'Extra Large',
    images: [
      '/Pictures/106-JW/Lavender%20Moon%20106JW%20(1).JPG',
      '/Pictures/106-JW/Lavender%20Moon%20106JW%20(3).JPG',
      '/Pictures/106-JW/Lavender%20Moon%20106JW%20(5).JPG',
      '/Pictures/106-JW/Lavender%20Moon%20106JW%20(10).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Full Kitchen', 'Dining Area', 'Living Area', 'Front Verandah', 'Back Porch'],
    features: ['Full Kitchen', 'Sea Views', '2 Queen Beds'],
    highlights: ['Full-Sized Kitchen', 'Dining & Living Area', 'Front Verandah with Sea Views', 'Private Back Porch'],
  },
  {
    slug: 'room-107-cf',
    name: 'Room 107-CF',
    type: 'room',
    tagline: 'Comfortable • Modern',
    description: 'A comfortable and modern room perfect for couples or solo travelers. Features quality amenities and a peaceful atmosphere.',
    price: 260,
    maxGuests: 2,
    beds: 'Queen Bed',
    size: 'Standard',
    images: [
      '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(1).JPG',
      '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(2).JPG',
      '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(5).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    features: ['Queen Bed', 'AC', 'WiFi'],
    highlights: ['Modern Amenities', 'Peaceful Setting', 'Private Bathroom'],
  },
  {
    slug: 'room-108',
    name: 'Room 108-JA',
    type: 'room',
    tagline: 'Cozy • Garden View',
    description: 'A cozy room with garden views, perfect for a relaxing stay. Features all essential amenities for a comfortable visit.',
    price: 225,
    maxGuests: 2,
    beds: 'Queen Bed',
    size: 'Standard',
    images: [
      '/Pictures/Room-108/placeholder.jpg', // Add your images here
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    features: ['Garden View', 'AC', 'WiFi'],
    highlights: ['Garden Views', 'Quiet Location', 'Modern Amenities'],
  },
  {
    slug: 'room-109-ls',
    name: 'Room 109-LS',
    type: 'room',
    tagline: 'Cozy • Modern Amenities',
    description: 'A cozy room with modern amenities, ideal for couples or solo travelers seeking comfort and convenience.',
    price: 220,
    maxGuests: 2,
    beds: 'Queen Bed',
    size: 'Standard',
    images: [
      '/Pictures/Room%20206-B/Lavender%20Moon%20206B%20(1).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    features: ['Modern', 'AC', 'WiFi'],
    highlights: ['Modern Design', 'Comfortable', 'Private Bathroom'],
  },
  {
    slug: 'room-207-a',
    name: 'Room 207-A',
    type: 'room',
    tagline: 'Scenic • Mountain Views',
    description: 'Enjoy scenic mountain views from this comfortable room. Perfect for nature lovers seeking tranquility.',
    price: 180,
    maxGuests: 2,
    beds: 'Queen Bed',
    size: 'Standard',
    images: [
      '/Pictures/207-A/Lavender%20Moon%20207%20A%20(1).JPG',
      '/Pictures/207-A/Lavender%20Moon%20207%20A%20(2).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Mountain View'],
    features: ['Mountain View', 'AC', 'WiFi'],
    highlights: ['Mountain Views', 'Peaceful', 'Natural Setting'],
  },
  {
    slug: 'room-208a',
    name: 'Room 208A',
    type: 'room',
    tagline: 'Standard • Essential Comforts',
    description: 'A standard room with all essential comforts for a pleasant stay. Great value accommodation.',
    price: 190,
    maxGuests: 2,
    beds: 'Queen Bed',
    size: 'Standard',
    images: [
      '/Pictures/Room%20107-CF/Lavender%20Moon%20107CF%20(2).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom'],
    features: ['Standard', 'AC', 'WiFi'],
    highlights: ['Essential Comforts', 'Great Value', 'Private Bathroom'],
  },
  {
    slug: 'room-208ab',
    name: 'Room 208AB',
    type: 'room',
    tagline: 'Family • Connecting Rooms',
    description: 'Connecting rooms ideal for families or groups. Spacious accommodation with the convenience of adjoining spaces.',
    price: 280,
    maxGuests: 4,
    beds: 'Two Queen Beds',
    size: 'Large (Connecting)',
    images: [
      '/Pictures/Room-208AB/placeholder.jpg', // Add your images here
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Connecting Door'],
    features: ['Connecting Rooms', 'Family Friendly', 'Spacious'],
    highlights: ['Connecting Rooms', 'Ideal for Families', 'Extra Space'],
  },
  {
    slug: 'room-209-jf',
    name: 'Room 209-JF',
    type: 'room',
    tagline: 'Spacious • Balcony',
    description: 'A spacious room with a private balcony offering mountain views. Perfect for guests who appreciate outdoor space.',
    price: 220,
    maxGuests: 3,
    beds: 'Queen Bed + Single',
    size: 'Large',
    images: [
      '/Pictures/207-A/Lavender%20Moon%20207%20A%20(2).JPG',
    ],
    amenities: ['WiFi', 'AC', 'Private Bathroom', 'Balcony'],
    features: ['Balcony', 'Mountain View', 'AC'],
    highlights: ['Private Balcony', 'Mountain Views', 'Spacious Layout'],
  },
]

export function getRoomBySlug(slug: string): RoomData | undefined {
  return roomsData.find(room => room.slug === slug)
}

export function getSuites(): RoomData[] {
  return roomsData.filter(room => room.type === 'suite')
}

export function getRooms(): RoomData[] {
  return roomsData.filter(room => room.type === 'room')
}

