import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { useFormulaStore } from '../hooks/useFormulaStore';
import { useAutocomplete } from '../hooks/useAutocomplete';
import Dropdown from './Dropdown';
import { Operand } from '../utils/types';

const OPERATORS = ['+', '-', '*', '/', '^', '(', ')'];

const isOperator = (val: any) => typeof val === 'string' && OPERATORS.includes(val);
const isOperand = (val: any): val is Operand => typeof val === 'object' && val !== null && 'name' in val;
const isOpenBracket = (val: any) => val === '(';
const isCloseBracket = (val: any) => val === ')';

const countBrackets = (arr: any[]) => ({
  open: arr.filter(isOpenBracket).length,
  close: arr.filter(isCloseBracket).length,
});

function insertAtCaret<T>(arr: T[], value: T, idx: number): T[] {
  return [
    ...arr.slice(0, idx),
    value,
    ...arr.slice(idx),
  ];
}

const Formula: React.FC = () => {
  const { formula, setFormula } = useFormulaStore();
  const [input, setInput] = useState('');
  const [caretIdx, setCaretIdx] = useState(formula.length); // default at end
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<number | string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [error, setError] = useState(false);

  const { data: suggestions = [] } = useAutocomplete(input);

  const { data: allOperands = [] } = useQuery({
    queryKey: ['all-operands'],
    queryFn: async () => {
      const { data } = await axios.get<Operand[]>(
        'https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete'
      );
      return data;
    }
  });

  // Dropdown change handler for operands
  const handleDropdownChange = (idx: number, newCategory: string) => {
    setFormula(formula.map((item, i) => {
      if (i === idx && isOperand(item)) {
        return { ...item, category: newCategory };
      }
      return item;
    }));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const operatorMatch = val.match(/([+\-*/^()])$/);

    // If user types an operator after a number, push the number first
    if (operatorMatch) {
      const op = operatorMatch[1];
      const last = formula[caretIdx - 1];
      const numberMatch = val.slice(0, -1).match(/^\d+$/);

      // Insert number before operator if present
      if (numberMatch) {
        // Allow number at start, after operator, or after open bracket
        if (
          caretIdx === 0 ||
          isOperator(last) ||
          isOpenBracket(last)
        ) {
          setFormula(insertAtCaret(insertAtCaret(formula, Number(numberMatch[0]), caretIdx), op, caretIdx + 1));
          setCaretIdx(caretIdx + 2);
          setInput('');
          setShowSuggestions(false);
          setHighlightedIndex(0);
          setError(false);
          return;
        } else {
          setError(true);
          return;
        }
      }

      // Bracket validation
      if (op === '(') {
        if (isOperand(last) || isCloseBracket(last)) {
          setError(true);
          return;
        }
        setFormula(insertAtCaret(formula, op, caretIdx));
        setCaretIdx(caretIdx + 1);
        setInput(val.slice(0, -1));
        setShowSuggestions(false);
        setHighlightedIndex(0);
        setError(false);
        return;
      }
      if (op === ')') {
        const { open, close } = countBrackets(formula.slice(0, caretIdx));
        if (
          isOperator(last) ||
          isOpenBracket(last) ||
          open <= close
        ) {
          setError(true);
          return;
        }
        setFormula(insertAtCaret(formula, op, caretIdx));
        setCaretIdx(caretIdx + 1);
        setInput(val.slice(0, -1));
        setShowSuggestions(false);
        setHighlightedIndex(0);
        setError(false);
        return;
      }

      // Operator validation: prevent two operators in a row or operator at start
      if (caretIdx === 0 || isOperator(last)) {
        setError(true);
        return;
      }
      setFormula(insertAtCaret(formula, op, caretIdx));
      setCaretIdx(caretIdx + 1);
      setInput(val.slice(0, -1));
      setShowSuggestions(false);
      setHighlightedIndex(0);
      setError(false);
      return;
    }
    setInput(val);
    setShowSuggestions(!!val);
    setHighlightedIndex(0);
    setError(false);
  };

  const handleSelectOperand = (operand: Operand) => {
    const last = formula[caretIdx - 1];
    // Validation: prevent operand at start, or two operands in a row (but allow after ')')
    if (isOperand(last)) {
      setError(true);
      return;
    }
    setFormula(insertAtCaret(formula, operand, caretIdx));
    setCaretIdx(caretIdx + 1);
    setInput('');
    setShowSuggestions(false);
    setHighlightedIndex(0);
    setError(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        if (suggestions[highlightedIndex]) {
          handleSelectOperand(suggestions[highlightedIndex]);
          return;
        }
      }
    }
    if (e.key === 'Enter') {
      // If input is a number, add it to formula at caret
      if (/^\d+$/.test(input)) {
        const last = formula[caretIdx - 1];
        if (
          caretIdx === 0 ||
          isOperand(last) ||
          typeof last === 'number'
        ) {
          setError(true);
          return;
        }
        setFormula(insertAtCaret(formula, Number(input), caretIdx));
        setCaretIdx(caretIdx + 1);
        setInput('');
        setShowSuggestions(false);
        setHighlightedIndex(0);
        setError(false);
        return;
      }
      calculateFormula();
    }
    if (e.key === 'Backspace' && input === '') {
      if (caretIdx > 0) {
        setFormula([...formula.slice(0, caretIdx - 1), ...formula.slice(caretIdx)]);
        setCaretIdx(caretIdx - 1);
      }
    }
    if (e.key === 'ArrowLeft' && caretIdx > 0) {
      setCaretIdx(caretIdx - 1);
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight' && caretIdx < formula.length) {
      setCaretIdx(caretIdx + 1);
      e.preventDefault();
      return;
    }
  };

  const calculateFormula = () => {
    try {
      // Replace ^ with ** for JS exponentiation
      const expr = formulaToString().replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const evalResult = eval(expr);
      setResult(evalResult);
    } catch (err) {
      setResult('Invalid formula');
    }
  };

  const formulaToString = () =>
    formula
      .map((item) =>
        typeof item === 'string'
          ? item
          : typeof item === 'number'
            ? item
            : (typeof item.value === 'number' ? item.value : 0)
      )
      .join('');

  // For dropdown options, you can use all categories from suggestions or a static list
  const dropdownOptions = Array.from(new Set(allOperands.map(s => s.category)));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap border p-2 rounded">
        {formula.map((item, idx) => (
          <React.Fragment key={idx}>
            {caretIdx === idx && (
              <div className="relative inline-block align-middle">
                <input
                  className={`outline-none px-2 ${error ? 'border border-red-500' : ''}`}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Type operand or operator"
                  autoFocus
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white border mt-1 rounded shadow z-10">
                    {suggestions.map((s, index) => (
                      <div
                        key={index}
                        className={`px-2 py-1 cursor-pointer ${highlightedIndex === index ? 'bg-blue-200' : 'hover:bg-blue-100'}`}
                        onClick={() => handleSelectOperand(s)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {typeof item === 'string' ? (
              <span className="px-2">{item}</span>
            ) : typeof item === 'number' ? (
              <span className="px-2">{item}</span>
            ) : (
              <span className="flex items-center bg-blue-100 rounded p-2">
                {item.name}
                <Dropdown
                  options={dropdownOptions}
                  selectedOption={item.category}
                  onSelect={(option) => handleDropdownChange(idx, option)}
                />
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Render input at the end if caret is at the end */}
        {caretIdx === formula.length && (
          <div className="relative inline-block align-middle">
            <input
              className={`outline-none px-2 ${error ? 'border border-red-500' : ''}`}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type operand or operator"
              autoFocus
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full bg-white border mt-1 rounded shadow z-10">
                {suggestions.map((s, index) => (
                  <div
                    key={index}
                    className={`px-2 py-1 cursor-pointer ${highlightedIndex === index ? 'bg-blue-200' : 'hover:bg-blue-100'}`}
                    onClick={() => handleSelectOperand(s)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p>Please press the Enter key to see the result of the formula.</p>
      {result !== null && (
        <div className="mt-2 text-lg font-semibold">
          Result: {result}
        </div>
      )}
    </div>
  );
};

export default Formula;