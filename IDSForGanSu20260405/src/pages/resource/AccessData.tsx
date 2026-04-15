import React, { useState } from 'react';
import { 
  Steps, Button, message, theme, Form, 
  Input, Select, Radio, Table, Switch, 
  Typography, Result, Divider, Layout, Tag
} from 'antd';
import { 
  Database, Link as LinkIcon, FileText, 
  CheckCircle2, ChevronRight, ChevronLeft,
  Server, ShieldCheck, List
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const steps = [
  { title: '选择空间', icon: <Server size={18} /> },
  { title: '配置连接', icon: <LinkIcon size={18} /> },
  { title: '选择资源', icon: <List size={18} /> },
  { title: '完成', icon: <CheckCircle2 size={18} /> },
];

const AccessData: React.FC = () => {
  const [searchParams] = useSearchParams();
  const spaceIdFromUrl = searchParams.get('spaceId');
  const {  } = theme.useToken();
  const [current, setCurrent] = useState(0);
  const [connectorType, setConnectorType] = useState('database');
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setIsConnected(true);
      message.success('连接测试成功！');
    }, 1500);
  };

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div className="max-w-xl mx-auto py-8">
            <Title level={4} className="mb-6">选择目标空间</Title>
            <Form layout="vertical">
              <Form.Item label="目标空间" required extra="请选择您要接入数据的空间，只有您拥有管理权限的空间才会显示在此处。" initialValue={spaceIdFromUrl || "public_ds"}>
                <Select placeholder="搜索并选择空间" size="large">
                  <Select.Option value="public_ds">公共数据集空间</Select.Option>
                  <Select.Option value="finance_research">金融研究空间</Select.Option>
                  <Select.Option value="marketing_ops">营销运营中心</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        );
      case 1:
        return (
          <div className="max-w-2xl mx-auto py-4">
            <Title level={4} className="mb-6">配置连接</Title>
            <Form layout="vertical">
              <Form.Item label="连接器类型" required>
                <Radio.Group 
                  value={connectorType} 
                  onChange={(e) => {
                    setConnectorType(e.target.value);
                    setIsConnected(false);
                  }}
                  className="w-full flex gap-4"
                >
                  <Radio.Button value="database" className="flex-1 h-auto py-4 text-center">
                    <Database size={24} className="mx-auto mb-2" />
                    <div>数据库</div>
                  </Radio.Button>
                  <Radio.Button value="api" className="flex-1 h-auto py-4 text-center">
                    <LinkIcon size={24} className="mx-auto mb-2" />
                    <div>API 接口</div>
                  </Radio.Button>
                  <Radio.Button value="file" className="flex-1 h-auto py-4 text-center">
                    <FileText size={24} className="mx-auto mb-2" />
                    <div>文件接入</div>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Divider />

              {connectorType === 'database' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="数据库类型" required>
                      <Select defaultValue="mysql">
                        <Select.Option value="mysql">MySQL</Select.Option>
                        <Select.Option value="postgresql">PostgreSQL</Select.Option>
                        <Select.Option value="oracle">Oracle</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="连接器名称" required>
                      <Input placeholder="例如：Finance_MySQL_Master" />
                    </Form.Item>
                  </div>
                  <Form.Item label="主机地址 / 端口" required>
                    <Input.Group compact>
                      <Input style={{ width: '75%' }} placeholder="127.0.0.1" />
                      <Input style={{ width: '25%' }} placeholder="3306" />
                    </Input.Group>
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="用户名" required>
                      <Input placeholder="username" />
                    </Form.Item>
                    <Form.Item label="密码" required>
                      <Input.Password placeholder="password" />
                    </Form.Item>
                  </div>
                </div>
              )}

              {connectorType === 'api' && (
                <div className="space-y-4">
                  <Form.Item label="API 名称" required>
                    <Input placeholder="例如：Weather_API_Gateway" />
                  </Form.Item>
                  <Form.Item label="Endpoint URL" required>
                    <Input placeholder="https://api.example.com/v1/data" />
                  </Form.Item>
                  <Form.Item label="认证方式" initialValue="bearer">
                    <Select>
                      <Select.Option value="none">无认证</Select.Option>
                      <Select.Option value="basic">Basic Auth</Select.Option>
                      <Select.Option value="bearer">Bearer Token</Select.Option>
                      <Select.Option value="apikey">API Key</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              )}

              {connectorType === 'file' && (
                <div className="space-y-4">
                  <Form.Item label="文件来源" initialValue="s3">
                    <Select>
                      <Select.Option value="s3">Amazon S3</Select.Option>
                      <Select.Option value="ftp">FTP / SFTP</Select.Option>
                      <Select.Option value="oss">Aliyun OSS</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Bucket 名称" required>
                    <Input placeholder="my-data-bucket" />
                  </Form.Item>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className={isConnected ? "text-green-500" : "text-gray-400"} />
                  <Text type={isConnected ? "success" : "secondary"}>
                    {isConnected ? "连接测试成功！您可以继续下一步。" : "请在继续之前测试您的连接配置。"}
                  </Text>
                </div>
                <Button 
                  loading={testing} 
                  onClick={handleTestConnection}
                  type={isConnected ? "default" : "primary"}
                  ghost={!isConnected}
                >
                  测试连接
                </Button>
              </div>
            </Form>
          </div>
        );
      case 2:
        return (
          <div className="py-4">
            <Title level={4} className="mb-6">选择数据资源并设置</Title>
            <div className="mb-4 flex justify-between items-center">
              <Text type="secondary">共发现 12 个可接入的资源，请选择需要开放的资源：</Text>
              <Input.Search placeholder="搜索资源名" className="w-64" />
            </div>
            <Table 
              dataSource={[
                { key: '1', name: 'user_info', type: 'Table', size: '1.2 MB' },
                { key: '2', name: 'order_records', type: 'Table', size: '45.8 MB' },
                { key: '3', name: 'product_catalog', type: 'Table', size: '2.5 MB' },
                { key: '4', name: 'payment_logs', type: 'Table', size: '120.4 MB' },
                { key: '5', name: 'v_user_stats', type: 'View', size: '-' },
              ]}
              columns={[
                { title: '资源名', dataIndex: 'name', key: 'name', render: (t) => <Text strong>{t}</Text> },
                { title: '类型', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
                { title: '数据大小', dataIndex: 'size', key: 'size' },
                { 
                  title: '是否开放', 
                  key: 'isOpen', 
                  render: () => <Switch checkedChildren="已开放" unCheckedChildren="未开放" defaultChecked={false} /> 
                },
              ]}
              pagination={false}
              className="border border-gray-100 rounded-lg overflow-hidden"
            />
          </div>
        );
      case 3:
        return (
          <Result
            status="success"
            title="接入成功！"
            subTitle="您的数据源已成功连接，选定的资源已加入空间资源目录。"
            extra={[
              <Button type="primary" key="directory" size="large">
                去资源目录查看
              </Button>,
              <Button key="again" size="large" onClick={() => {
                setCurrent(0);
                setIsConnected(false);
              }}>
                继续接入新数据
              </Button>,
            ]}
          >
            <div className="bg-gray-50 p-6 rounded-lg text-left max-w-md mx-auto border border-gray-100">
              <Title level={5}>接入摘要</Title>
              <Paragraph className="mb-1"><Text type="secondary">目标空间：</Text>公共数据集空间</Paragraph>
              <Paragraph className="mb-1"><Text type="secondary">连接器名称：</Text>Finance_MySQL_Master</Paragraph>
              <Paragraph className="mb-1"><Text type="secondary">资源数量：</Text>5 个资源已接入，其中 0 个已开放</Paragraph>
              <Paragraph className="mb-0"><Text type="secondary">接入时间：</Text>2024-04-07 18:45:12</Paragraph>
            </div>
          </Result>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">接入数据</h2>
      </div>

      <Layout className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <Sider 
          width={240} 
          theme="light" 
          className="border-r border-gray-100 p-8"
          style={{ background: '#fcfcfc' }}
        >
          <Steps
            direction="vertical"
            current={current}
            items={steps}
            size="small"
          />
        </Sider>
        
        <Content className="p-8 bg-white flex flex-col">
          <div className="flex-grow">
            {renderStepContent()}
          </div>
          
          {current < 3 && (
            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end gap-4">
              {current > 0 && (
                <Button onClick={prev} icon={<ChevronLeft size={16} />} className="flex items-center gap-1">
                  上一步
                </Button>
              )}
              {current < 2 ? (
                <Button 
                  type="primary" 
                  onClick={next} 
                  disabled={current === 1 && !isConnected}
                  className="flex items-center gap-1"
                >
                  下一步 <ChevronRight size={16} />
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  onClick={next}
                  className="bg-green-600 hover:bg-green-700 border-green-600 flex items-center gap-1"
                >
                  完成接入 <CheckCircle2 size={16} />
                </Button>
              )}
            </div>
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default AccessData;
