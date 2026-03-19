import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Ensure the DOM is reset between tests regardless of how the environment is set up
afterEach(cleanup);
