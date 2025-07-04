export type Gender = 'Male' | 'Female' | 'Other';

export const GenderOptions = ['Male', 'Female', 'Other'];

export const PatientFormDefaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: new Date(Date.now()),
  gender: 'Male' as Gender,
  address: '',
  occupation: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  primaryPhysician: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  allergies: '',
  currentMedication: '',
  familyMedicalHistory: '',
  pastMedicalHistory: '',
  identificationType: 'Birth Certificate',
  identificationNumber: '',
  identificationDocument: [],
  treatmentConsent: false,
  disclosureConsent: false,
  privacyConsent: false,
};

export const IdentificationTypes = [
  'Birth Certificate',
  "Driver's License",
  'Medical Insurance Card/Policy',
  'Military ID Card',
  'National Identity Card',
  'Passport',
  'Resident Alien Card (Green Card)',
  'Social Security Card',
  'State ID Card',
  'Student ID Card',
  'Voter ID Card',
];

export const Doctors = [
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455219/healthcare/images/healthcare/images/dr-green.png',
    name: 'John Green',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455217/healthcare/images/healthcare/images/dr-cameron.png',
    name: 'Leila Cameron',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455221/healthcare/images/healthcare/images/dr-livingston.png',
    name: 'David Livingston',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455222/healthcare/images/healthcare/images/dr-peter.png',
    name: 'Evan Peter',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455223/healthcare/images/healthcare/images/dr-powell.png',
    name: 'Jane Powell',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455223/healthcare/images/healthcare/images/dr-remirez.png',
    name: 'Alex Ramirez',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455220/healthcare/images/healthcare/images/dr-lee.png',
    name: 'Jasmine Lee',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455218/healthcare/images/healthcare/images/dr-cruz.png',
    name: 'Alyana Cruz',
  },
  {
    image: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455224/healthcare/images/healthcare/images/dr-sharma.png',
    name: 'Hardik Sharma',
  },
];

export const StatusIcon = {
  confirmed: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455255/healthcare/icons/healthcare/icons/check.svg',
  pending: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455273/healthcare/icons/healthcare/icons/pending.svg',
  cancelled: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455251/healthcare/icons/healthcare/icons/cancelled.svg',
  completed: 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455255/healthcare/icons/healthcare/icons/check.svg',
  'no-show': 'https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455251/healthcare/icons/healthcare/icons/cancelled.svg',
};
