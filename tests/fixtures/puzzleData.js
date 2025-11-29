/**
 * Test fixture: Sample puzzle data for unit tests
 */

const samplePuzzleData = {
  words: [
    {
      wordindex: 1,
      startX: 0,
      startY: 11,
      length: 4,
      direction: 'across',
      answer: 'ASKO'
    },
    {
      wordindex: 2,
      startX: 5,
      startY: 11,
      length: 5,
      direction: 'across',
      answer: 'TASAN'
    },
    {
      wordindex: 3,
      startX: 0,
      startY: 11,
      length: 6,
      direction: 'down',
      answer: 'ALAJAT'
    }
  ],
  cells: [
    { x: 0, y: 11, letter: 'A', isBlocked: false, wordRefs: { across: 1, down: 3 } },
    { x: 1, y: 11, letter: 'S', isBlocked: false, wordRefs: { across: 1, down: 5 } },
    { x: 2, y: 11, letter: 'K', isBlocked: false, wordRefs: { across: 1, down: 7 } },
    { x: 3, y: 11, letter: 'O', isBlocked: false, wordRefs: { across: 1, down: 8 } },
    { x: 4, y: 11, letter: ' ', isBlocked: true, wordRefs: {} },
    { x: 5, y: 11, letter: 'T', isBlocked: false, wordRefs: { across: 2, down: 11 } },
    { x: 6, y: 11, letter: 'A', isBlocked: false, wordRefs: { across: 2, down: 12 } },
    { x: 7, y: 11, letter: 'S', isBlocked: false, wordRefs: { across: 2, down: 14 } },
    { x: 8, y: 11, letter: 'A', isBlocked: false, wordRefs: { across: 2, down: 16 } },
    { x: 9, y: 11, letter: 'N', isBlocked: false, wordRefs: { across: 2, down: 18 } },
    { x: 0, y: 10, letter: 'L', isBlocked: false, wordRefs: { down: 3, across: 19 } },
    { x: 0, y: 9, letter: 'A', isBlocked: false, wordRefs: { down: 3, across: 20 } },
    { x: 0, y: 8, letter: 'J', isBlocked: false, wordRefs: { down: 3, across: 22 } },
    { x: 0, y: 7, letter: 'A', isBlocked: false, wordRefs: { down: 3, across: 23 } },
    { x: 0, y: 6, letter: 'T', isBlocked: false, wordRefs: { down: 3, across: 25 } }
  ]
};

// Solution coordinates matching the actual puzzle
const SOLUTION_COORDS = [
  { x: 7, y: 0 },
  { x: 3, y: 2 },
  { x: 8, y: 2 },
  { x: 4, y: 5 },
  { x: 6, y: 6 },
  { x: 0, y: 8 },
  { x: 9, y: 11 }
];

// Expected solution word
const SOLUTION_WORD = 'SINAPPI';

module.exports = {
  samplePuzzleData,
  SOLUTION_COORDS,
  SOLUTION_WORD
};
