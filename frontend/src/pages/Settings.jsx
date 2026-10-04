const Settings = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          <p className="text-gray-500">Profile management coming soon</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
          <p className="text-gray-500">Notification settings coming soon</p>
        </div>

        <div className="card border-2 border-dashed border-gray-300 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">🔗 GitHub Integration</h2>
          <p className="text-sm text-gray-500">
            Coming soon: Connect your GitHub account to automatically sync repository activity
          </p>
        </div>

        <div className="card border-2 border-dashed border-gray-300 bg-gray-50">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">🤖 AI Configuration</h2>
          <p className="text-sm text-gray-500">
            Coming soon: Configure AI provider and preferences for task decomposition
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
