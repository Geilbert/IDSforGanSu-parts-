import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import MySpace from './pages/space/MySpace';
import OperationCenter from './pages/space/OperationCenter';
import ConfigCenter from './pages/space/ConfigCenter';
import AccessData from './pages/resource/AccessData';
import ResourceDirectory from './pages/resource/ResourceDirectory';
import TasksLogs from './pages/resource/TasksLogs';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryOrders from './pages/delivery/DeliveryOrders';
import DeliveryOrderDetail from './pages/delivery/DeliveryOrderDetail';
import DeliveryPolicyCenter from './pages/delivery/DeliveryPolicyCenter';
import DeliveryTaskLogDetail from './pages/delivery/DeliveryTaskLogDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/space/mine" replace />} />
          
          {/* Space Management */}
          <Route path="space">
            <Route path="mine" element={<MySpace />} />
            <Route path="operation" element={<OperationCenter />} />
            <Route path="config" element={<ConfigCenter />} />
          </Route>
          
          {/* Data Resource */}
          <Route path="resource">
            <Route path="access" element={<AccessData />} />
            <Route path="directory" element={<ResourceDirectory />} />
            <Route path="tasks" element={<TasksLogs />} />
          </Route>

          <Route path="delivery">
            <Route index element={<Navigate to="/delivery/dashboard" replace />} />
            <Route path="dashboard" element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="orders/:orderId" element={<DeliveryOrderDetail />} />
            <Route path="orders/:orderId/tasks/:taskId/logs" element={<DeliveryTaskLogDetail />} />
            <Route path="policy" element={<DeliveryPolicyCenter />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
