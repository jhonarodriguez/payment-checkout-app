import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './store';
import { ProductPage } from './pages/ProductPage/ProductPage';
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage';
import { ResultPage } from './pages/ResultPage/ResultPage';

function AppNavigator() {
  const navigate = useNavigate();
  const { currentStep } = useAppSelector((state) => state.checkout);
  
  useEffect(() => {
    if (currentStep === 1 || currentStep === 5) {
      navigate('/');
    } else if (currentStep === 2 || currentStep === 3) {
      navigate('/checkout');
    } else if (currentStep === 4) {
      navigate('/result');
    }
  }, [currentStep, navigate]);

  return (
    <Routes>
      <Route path="/" element={<ProductPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppNavigator />
      </BrowserRouter>
    </Provider>
  );
}