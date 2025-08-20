import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders Upload Image heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Upload Image/i);
  expect(headingElement).toBeInTheDocument();
});