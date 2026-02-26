import React from 'react';
import Editor from '@monaco-editor/react';

const SQLEditor = ({ value, onChange, height = '300px' }) => {
  const handleEditorChange = (value) => {
    onChange(value);
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    automaticLayout: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    formatOnType: true,
    formatOnPaste: true,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    tabSize: 2,
    insertSpaces: true,
    renderWhitespace: 'selection',
    fontFamily: 'Fira Code, Consolas, Monaco, "Courier New", monospace',
  };

  // SQL keywords for autocompletion
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 
    'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX',
    'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
    'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
    'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL',
    'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT',
    'UNION', 'INTERSECT', 'EXCEPT', 'EXISTS', 'CASE',
    'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'ON'
  ];

  return (
    <div className="sql-editor-container">
      <Editor
        height={height}
        defaultLanguage="sql"
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
        options={editorOptions}
        beforeMount={(monaco) => {
          // Register SQL keywords for autocompletion
          monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model, position) => {
              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
              };

              const suggestions = sqlKeywords.map(keyword => ({
                label: keyword,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                range: range
              }));

              return { suggestions };
            }
          });
        }}
      />
    </div>
  );
};

export default SQLEditor;