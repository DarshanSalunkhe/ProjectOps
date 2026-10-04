const Risks = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Risk Management</h1>

      <div className="card border-2 border-dashed border-yellow-300 bg-yellow-50 mb-6">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">🔮</div>
          <div>
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">Future Module</h2>
            <p className="text-yellow-800">
              The Risk Management system will automatically detect and analyze:
            </p>
            <ul className="list-disc list-inside mt-2 text-yellow-800 space-y-1">
              <li>Deadline risks</li>
              <li>Dependency blockage risks</li>
              <li>Workload imbalance risks</li>
              <li>Progress deviation risks</li>
              <li>Cascading delay effects</li>
            </ul>
            <p className="mt-3 text-sm text-yellow-700">
              Risk detection and autonomous replanning will be implemented in future phases.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Current Risks</h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">No risks detected</p>
          <p className="text-sm">Risk analysis will appear here once projects are active</p>
        </div>
      </div>
    </div>
  );
};

export default Risks;
