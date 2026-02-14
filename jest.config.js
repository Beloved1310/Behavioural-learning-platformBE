module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
    '!src/index.ts',
    '!src/config/**',
    '!src/scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  // Coverage thresholds - set to 80% target
  // Target: 80% coverage for Master's dissertation
  coverageThreshold: {
    global: {
      branches: 80,      // Target: 80%
      functions: 80,     // Target: 80%
      lines: 80,         // Target: 80%
      statements: 80,    // Target: 80%
    },
    './src/services/': {
      branches: 15,      // Encourage improvement in services
      functions: 20,
      lines: 30,
      statements: 30,
    },
    './src/controllers/': {
      branches: 8,
      functions: 8,
      lines: 20,
      statements: 20,
    },
    './src/repositories/': {
      branches: 10,
      functions: 40,
      lines: 40,
      statements: 40,
    },
    './src/middleware/': {
      branches: 35,
      functions: 65,
      lines: 55,
      statements: 55,
    },
  },
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/helpers/setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
