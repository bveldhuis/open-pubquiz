// Test setup file to suppress console.error logs during tests
// This prevents expected error logs from cluttering the test output

beforeAll(() => {
  // Store original console.error
  const originalError = console.error;
  
  // Override console.error to filter out expected test errors
  console.error = (...args: any[]) => {
    const message = args[0];
    
    // Allow certain error messages that are important for debugging
    if (typeof message === 'string') {
      if (message.includes('Database error') || 
          message.includes('Session not found') ||
          message.includes('Question not found') ||
          message.includes('Failed to create') ||
          message.includes('Failed to fetch') ||
          message.includes('Failed to update') ||
          message.includes('Failed to delete')) {
        // These are expected test errors, so we suppress them
        return;
      }
    }
    
    // For all other errors, log them normally
    originalError.apply(console, args);
  };
});

afterAll(() => {
  // Restore original console.error
  console.error = console.error;
});

// Dummy test to prevent Jest from treating this as a test suite
describe('Test Setup', () => {
  it('should be configured correctly', () => {
    expect(true).toBe(true);
  });
});
