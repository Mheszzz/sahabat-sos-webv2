import { RouterProvider } from 'react-router-dom';
import { router } from './routes/AppRouter';
import './assets/App.css';

export default function App() {
  return <RouterProvider router={router} />;
}

