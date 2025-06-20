module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/__tests__/**',
    '!src/migrations/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  // globalTeardown: '<rootDir>/src/__tests__/global-teardown.ts',
  verbose: true,
  // Игнорируем предупреждения об открытых handles (Redis соединения)
  detectOpenHandles: false,
  forceExit: true,
  maxWorkers: 1, // Запускаем тесты последовательно для избежания конфликтов в БД
}; 