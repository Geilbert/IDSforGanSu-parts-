import React from 'react';
import { Layout, Menu, theme, Breadcrumb, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { 
  LayoutDashboard, 
  Database, 
  Truck,
  Share2, 
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const breadcrumbNameMap: Record<string, string> = {
  '/space': '空间管理',
  '/space/mine': '我的空间',
  '/space/operation': '空间运营中心',
  '/space/config': '空间配置中心',
  '/resource': '数据资源',
  '/resource/access': '接入数据',
  '/resource/directory': '资源目录',
  '/resource/tasks': '任务与日志',
  '/delivery': '数据交付',
  '/delivery/dashboard': '交付看板',
  '/delivery/orders': '交付订单',
  '/delivery/policy': '交付策略',
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [];
  
  // Custom logic for space management hierarchy
  if (pathSnippets[0] === 'space' && (pathSnippets[1] === 'operation' || pathSnippets[1] === 'config')) {
    breadcrumbItems.push({ key: '/space', title: '空间管理' });
    breadcrumbItems.push({ key: '/space/mine', title: '我的空间' });
    
    const searchParams = new URLSearchParams(location.search);
    const spaceId = searchParams.get('id');
    const spaceNameFromUrl = searchParams.get('name');
    
    let spaceName = spaceNameFromUrl || (spaceId === 'public_ds' ? '公共数据集空间' : (spaceId === 'finance_research' ? '金融研究空间' : '营销运营中心'));
    
    breadcrumbItems.push({ 
      key: location.pathname, 
      title: pathSnippets[1] === 'operation' ? spaceName : `${spaceName}配置` 
    });
  } else {
    pathSnippets.forEach((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      breadcrumbItems.push({
        key: url,
        title: breadcrumbNameMap[url] || url,
      });
    });
  }

  const menuItems = [
    {
      key: 'space',
      icon: <LayoutDashboard size={18} />,
      label: '空间管理',
      children: [
        { key: '/space/mine', label: <Link to="/space/mine">我的空间</Link> },
        { key: '/space/operation', label: <Link to="/space/operation">空间运营中心</Link> },
        { key: '/space/config', label: <Link to="/space/config">空间配置中心</Link> },
      ],
    },
    {
      key: 'resource',
      icon: <Database size={18} />,
      label: '数据资源',
      children: [
        { key: '/resource/access', label: <Link to="/resource/access">接入数据</Link> },
        { key: '/resource/directory', label: <Link to="/resource/directory">资源目录</Link> },
        { key: '/resource/tasks', label: <Link to="/resource/tasks">任务与日志</Link> },
      ],
    },
    {
      key: 'delivery',
      icon: <Truck size={18} />,
      label: '数据交付',
      children: [
        { key: '/delivery/dashboard', label: <Link to="/delivery/dashboard">交付看板</Link> },
        { key: '/delivery/orders', label: <Link to="/delivery/orders">交付订单</Link> },
        { key: '/delivery/policy', label: <Link to="/delivery/policy">交付策略</Link> },
      ],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <User size={14} />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogOut size={14} />,
      danger: true,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        width={240} 
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="flex items-center gap-3 px-6 py-4 mb-4">
          <div className="bg-blue-500 p-1.5 rounded-lg shadow-lg">
            <Share2 className="text-white" size={20} />
          </div>
          <span className="text-white text-base font-bold tracking-tight">
            统一运营管理平台
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['space', 'resource', 'delivery']}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: 240 }}>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: colorBgContainer, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%'
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded-md transition-colors">
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }} icon={<User size={14} />} />
              <span className="text-gray-700 font-medium">管理员</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
