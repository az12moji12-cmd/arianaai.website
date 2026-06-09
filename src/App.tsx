import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ContractAnalysis from './pages/ContractAnalysis';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fa-analysis" element={<ContractAnalysis />} />
        <Route path="/fa-analysis/:conversationId" element={<ContractAnalysis />} />
        <Route path="/drafting" element={<div>صفحه تحریر قرارداد - به زودی</div>} />
        <Route path="/intl-analysis" element={<div>صفحه تحلیل قرارداد بین‌المللی - به زودی</div>} />
      </Routes>
    </Router>
  );
}

export default App;
