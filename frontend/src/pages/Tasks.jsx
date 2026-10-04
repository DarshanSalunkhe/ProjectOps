const Tasks = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Tasks</h1>
      </div>

      <div className="card">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">No tasks found</p>
          <p className="text-sm">Tasks from all projects will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
