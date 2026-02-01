import { render, Text, Box, Static, useInput, useApp } from 'ink';
import { useState, useRef } from 'react';

interface HistoryEntry {
  id: number;
  command: string;
  result: string;
}

function App() {
  const { exit } = useApp();
  const [status, setStatus] = useState('Ready');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const idCounter = useRef(0);

  // Handle command
  const handleCommand = (command: string) => {
    const trimmed = command.trim();
    if (!trimmed) return;

    let result = '';

    // Simple command handling example
    if (trimmed === 'help') {
      result = 'Available commands: help, status, echo <text>, exit';
    } else if (trimmed === 'status') {
      result = `Current status: ${status}`;
    } else if (trimmed.startsWith('echo ')) {
      result = trimmed.slice(5);
    } else if (trimmed === 'exit' || trimmed === 'quit') {
      exit();
      return;
    } else {
      result = `Unknown command: ${trimmed}. Type 'help' for available commands.`;
    }

    const id = idCounter.current++;
    setHistory((prev) => [...prev, { id, command: trimmed, result }]);
    setInput('');
  };

  useInput((char, key) => {
    if (key.return) {
      handleCommand(input);
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
    } else if (key.ctrl && char === 'c') {
      exit();
    } else if (!key.ctrl && !key.meta && char) {
      setInput((prev) => prev + char);
    }
  });

  return (
    <>
      {/* Static history - output scrolls like traditional terminal */}
      <Static items={history}>
        {(entry) => (
          <Box key={entry.id} flexDirection="column">
            <Box>
              <Text color="blue">$ </Text>
              <Text>{entry.command}</Text>
            </Box>
            <Box marginLeft={2}>
              <Text dimColor>{entry.result}</Text>
            </Box>
          </Box>
        )}
      </Static>

      {/* Dynamic part - only this section updates in place */}
      <Box flexDirection="column" marginTop={history.length > 0 ? 1 : 0}>
        {/* Status display */}
        <Box>
          <Text color="yellow">&gt; </Text>
          <Text color="green">{status}</Text>
        </Box>

        {/* User input */}
        <Box>
          <Text color="blue">$ </Text>
          <Text>{input}</Text>
          <Text color="gray">▌</Text>
        </Box>

        {/* Help text */}
        <Box>
          <Text dimColor>Type 'help' for commands, Ctrl+C to exit</Text>
        </Box>
      </Box>
    </>
  );
}

render(<App />);
