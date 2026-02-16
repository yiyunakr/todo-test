import { BlockList } from './components/BlockList';

function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="mx-auto max-w-[800px] px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">BlockFlow</h1>
        <BlockList />
      </div>
    </div>
  );
}

export default App;
