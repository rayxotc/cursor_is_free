// Utility functions for data generation

// Random name generation
const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

function generateRandomName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

// Luhn Algorithm for generating valid test credit card numbers
function generateLuhnNumber(prefix, length) {
  // Generate random digits
  let cardNumber = prefix;
  const remainingLength = length - prefix.length - 1; // -1 for check digit
  
  for (let i = 0; i < remainingLength; i++) {
    cardNumber += Math.floor(Math.random() * 10);
  }
  
  // Calculate check digit using Luhn algorithm
  let sum = 0;
  let isEven = true;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return cardNumber + checkDigit;
}

function generateTestCardData() {
  // Generate a test Visa card (starts with 4)
  const cardNumber = generateLuhnNumber('4', 16);
  
  // Generate expiry date (future date)
  const currentYear = new Date().getFullYear();
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const year = currentYear + Math.floor(Math.random() * 5) + 1;
  const expiryMonth = month;
  const expiryYear = String(year).slice(-2);
  
  // Generate CVV
  const cvv = String(Math.floor(Math.random() * 900) + 100);
  
  // Generate ZIP
  const zip = String(Math.floor(Math.random() * 90000) + 10000);
  
  return {
    cardNumber,
    expiryMonth,
    expiryYear,
    cvv,
    zip,
    formatted: `${cardNumber.match(/.{1,4}/g).join(' ')} ${month}/${String(year).slice(-2)} ${cvv}`
  };
}

// Format card number with spaces
function formatCardNumber(number) {
  return number.replace(/\s/g, '').match(/.{1,4}/g).join(' ');
}

// Sleep function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateRandomName,
    generateTestCardData,
    formatCardNumber,
    sleep
  };
}

