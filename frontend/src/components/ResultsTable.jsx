import React from 'react';
import { FaTable } from 'react-icons/fa';

const ResultsTable = ({ data, columns }) => {
  if (!data || data.length === 0) {
    return (
      <div className="results-table__empty">
        <FaTable className="results-table__empty-icon" />
        <p>Query executed successfully but returned no rows</p>
      </div>
    );
  }

  return (
    <div className="results-table__container">
      <div className="results-table__wrapper">
        <table className="results-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} title={String(row[col.name] || '')}>
                    {row[col.name] !== null && row[col.name] !== undefined 
                      ? String(row[col.name]) 
                      : <span className="results-table__null">NULL</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;