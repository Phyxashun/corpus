// FILE-PATH: src/index.ts

import App from './components/App';

const Message = (msg: unknown): void => {
  if (msg instanceof Error) {
    console.error(`Fatal crash: ${msg.message}`);
  } else {
    console.error(`Fatal crash: ${msg}`);
  }
};

/**
 * MAIN ENTRY POINT
 */
if (import.meta.main) {
  try {
    await App.run();
  } catch (err) {
    Message(err);
    process.exit(1);
  }
}
