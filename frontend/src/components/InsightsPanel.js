import React from 'react';

const InsightsPanel = ({ insights = [], darkMode }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'positive':
        return '✅';
      case 'success':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  return (
    <div
      className={`rounded-lg shadow-lg p-6 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <h3 className="text-xl font-bold mb-6">🔍 Smart Insights</h3>

      <div className="space-y-4">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'positive'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : insight.type === 'success'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : insight.type === 'warning'
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
              }`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{insight.icon || getIconForType(insight.type)}</span>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {insight.title}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No insights available yet. Upload data to generate insights.</p>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
