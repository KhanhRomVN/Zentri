import HeaderBar from './components/HeaderBar';
import FooterBar from './components/FooterBar';

const Dashboard = () => {
  return (
    <>
      <HeaderBar title="Dashboard" />
      <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto" />
      <FooterBar />
    </>
  );
};

export default Dashboard;