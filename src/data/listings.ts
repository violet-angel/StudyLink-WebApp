export interface Listing {
  id: number;
  title: string;
  description: string;
  area: string;
  price: string;
}

export const featuredListings: Listing[] = [
  {
    id: 1,
    title: 'Data Science Study Circle',
    description: 'Join a collaborative group focused on statistics, machine learning, and hands-on data projects.',
    area: '12 members',
    price: 'Mondays 6–8 PM',
  },
  {
    id: 2,
    title: 'Organic Chemistry Review',
    description: 'Weekly review sessions tailored for exam prep, problem solving, and concept discussion.',
    area: '8 members',
    price: 'Wednesdays 5–7 PM',
  },
  {
    id: 3,
    title: 'Essay Writing Workshop',
    description: 'A peer-led workshop that supports research, drafting, and editing for academic papers.',
    area: '15 members',
    price: 'Fridays 3–5 PM',
  },
];
