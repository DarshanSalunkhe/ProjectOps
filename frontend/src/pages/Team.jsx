const Team = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Team</h1>
        <button className="btn-primary">
          + Invite Member
        </button>
      </div>

      <div className="card">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-4">No team members yet</p>
          <p className="text-sm">Invite team members to collaborate on projects</p>
        </div>
      </div>
    </div>
  );
};

export default Team;
