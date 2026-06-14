// Shared sample data for all three direction mockups.
// Week 24 (mid-June). Wednesday is "today".
const MEMBERS = {
  cam:   { name: 'Camille', initials: 'CA' },
  jon:   { name: 'Jonas',   initials: 'JO' },
  theo:  { name: 'Théo',    initials: 'TH' },
  lina:  { name: 'Lina',    initials: 'LI' },
  marco: { name: 'Marco',   initials: 'MA' },
  sofia: { name: 'Sofia',   initials: 'SO' },
  you:   { name: 'You',     initials: 'ME' },
};

// The signed-in user's own week (for the one-tap "My Week" view)
const WEEK = [
  { key: 'mon', lab: 'Monday',    dd: '09', date: '9 Jun',  lunch: false, dinner: true,  today: false },
  { key: 'tue', lab: 'Tuesday',   dd: '10', date: '10 Jun', lunch: true,  dinner: true,  today: false },
  { key: 'wed', lab: 'Wednesday', dd: '11', date: '11 Jun', lunch: true,  dinner: false, today: true  },
  { key: 'thu', lab: 'Thursday',  dd: '12', date: '12 Jun', lunch: false, dinner: false, today: false },
  { key: 'fri', lab: 'Friday',    dd: '13', date: '13 Jun', lunch: true,  dinner: true,  today: false },
  { key: 'sat', lab: 'Saturday',  dd: '14', date: '14 Jun', lunch: false, dinner: true,  today: false },
  { key: 'sun', lab: 'Sunday',    dd: '15', date: '15 Jun', lunch: false, dinner: false, today: false },
];

// Whole-group attendance per day (for the day-centric "The Table" view)
const ATTEND = {
  mon: { lunch: ['cam', 'jon'],                 dinner: ['cam', 'theo', 'lina', 'you'] },
  tue: { lunch: ['cam', 'lina', 'you'],         dinner: ['jon', 'theo', 'marco', 'sofia', 'you'] },
  wed: { lunch: ['cam', 'jon', 'lina', 'you'],  dinner: ['cam', 'theo', 'lina', 'marco', 'sofia'] },
  thu: { lunch: ['marco'],                      dinner: ['cam', 'jon', 'sofia'] },
  fri: { lunch: ['cam', 'jon', 'theo', 'you'],  dinner: ['cam', 'jon', 'theo', 'lina', 'marco', 'sofia', 'you'] },
  sat: { lunch: [],                             dinner: ['theo', 'lina'] },
  sun: { lunch: [],                             dinner: [] },
};
