import React from 'react';
import { useRoutes } from 'react-router-dom';
import './index.css';

import { appRoutes } from './routes/routes';
import { AuthProvider } from './hook/AuthContext';

function App(): JSX.Element {
  const routes = useRoutes(appRoutes);
  
  return (
    <AuthProvider>
      {routes}
    </AuthProvider>
  );
}

export default App;
