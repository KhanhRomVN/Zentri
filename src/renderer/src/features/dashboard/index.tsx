import HeaderBar from '../../components/HeaderBar';

const Dashboard = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto">
      <HeaderBar title="Dashboard" />
    </div>
  );
};

export default Dashboard;