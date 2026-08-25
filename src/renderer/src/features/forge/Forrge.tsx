import HeaderBar from '../../components/HeaderBar';

const Forge = () => {
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative selection:bg-primary/10">
      <HeaderBar title="Forge" />
    </div>
  );
};

export default Forge;