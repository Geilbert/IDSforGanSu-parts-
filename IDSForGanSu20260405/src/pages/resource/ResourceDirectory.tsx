import React, { useState } from 'react';
import { 
  Table, Button, Input, Tag, Space, Card, 
  Switch, Select, Typography, message,
  Drawer, Descriptions, Tabs, Statistic, Row, Col, Timeline, List, Badge
} from 'antd';
import { 
  Search, Database, FileText, 
  Globe, Server, Calendar, Info, Eye,
  HardDrive, ShieldCheck, History, BarChart3,
  AlertCircle
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

interface ResourceItem {
  key: string;
  name: string;
  type: string;
  space: string;
  connector: string;
  accessTime: string;
  isOpen: boolean;
}

const ResourceDirectory: React.FC = () => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [tableData, setTableData] = useState<ResourceItem[]>([
    {
      key: '1',
      name: 'User_Transaction_Records',
      type: 'Table',
      space: '公共数据集空间',
      connector: 'MySQL_Finance_Master',
      accessTime: '2024-04-07 10:30',
      isOpen: true,
    },
    {
      key: '2',
      name: 'Global_Product_Catalog',
      type: 'File',
      space: '公共数据集空间',
      connector: 'S3_Assets_Bucket',
      accessTime: '2024-04-07 09:15',
      isOpen: true,
    },
    {
      key: '3',
      name: 'Weather_Realtime_Feed',
      type: 'API',
      space: '公共数据集空间',
      connector: 'External_Weather_API',
      accessTime: '2024-04-06 17:00',
      isOpen: false,
    },
    {
      key: '4',
      name: 'Customer_Profile_Master',
      type: 'Table',
      space: '营销运营中心',
      connector: 'Oracle_CRM_Replica',
      accessTime: '2024-04-05 14:20',
      isOpen: true,
    },
    {
      key: '5',
      name: 'Daily_Sales_Report_PDF',
      type: 'File',
      space: '金融研究空间',
      connector: 'Local_File_Server',
      accessTime: '2024-04-05 10:00',
      isOpen: false,
    },
  ]);

  const handleStatusChange = (checked: boolean, record: ResourceItem) => {
    const hide = message.loading(`正在${checked ? '开放' : '关闭'}资源 ${record.name}...`, 0);
    
    // Simulate API request
    setTimeout(() => {
      hide();
      // Simulate 10% failure rate for demonstration of rollback
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setTableData(prev => prev.map(item => 
          item.key === record.key ? { ...item, isOpen: checked } : item
        ));
        message.success(`资源 ${record.name} 已${checked ? '成功开放' : '已关闭'}`);
      } else {
        message.error(`更新失败：后台服务响应超时，状态已回滚`);
        // No state change needed here as Switch is uncontrolled or handled by tableData
        // But in a real app, we ensure the UI reflects originalStatus
      }
    }, 1000);
  };

  const showDetails = (record: ResourceItem) => {
    setSelectedResource(record);
    setDetailsVisible(true);
  };

  const columns = [
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ResourceItem) => (
        <div className="flex items-center gap-2">
          {record.type === 'API' ? (
            <Globe size={16} className="text-blue-500" />
          ) : record.type === 'File' ? (
            <FileText size={16} className="text-orange-500" />
          ) : (
            <Database size={16} className="text-purple-500" />
          )}
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'API' ? 'blue' : (type === 'File' ? 'orange' : 'purple')}>
          {type}
        </Tag>
      ),
    },
    {
      title: '所属空间',
      dataIndex: 'space',
      key: 'space',
      render: (space: string) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Server size={14} />
          <span>{space}</span>
        </div>
      ),
    },
    {
      title: '来源连接器',
      dataIndex: 'connector',
      key: 'connector',
      render: (connector: string) => <Text type="secondary">{connector}</Text>,
    },
    {
      title: '接入时间',
      dataIndex: 'accessTime',
      key: 'accessTime',
      render: (time: string) => (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Calendar size={14} />
          <span>{time}</span>
        </div>
      ),
    },
    {
      title: '开放状态',
      key: 'isOpen',
      dataIndex: 'isOpen',
      render: (isOpen: boolean, record: ResourceItem) => (
        <Switch 
          checkedChildren="已开放" 
          unCheckedChildren="未开放" 
          checked={isOpen}
          onChange={(checked) => handleStatusChange(checked, record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ResourceItem) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<Info size={14} />} onClick={() => showDetails(record)}>详情</Button>
          <Button type="link" size="small" icon={<Eye size={14} />}>预览</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={3} style={{ margin: 0 }}>资源目录</Title>
      </div>

      <Card className="shadow-sm border-none bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">所属空间</Text>
            <Select placeholder="全部空间" className="w-full" allowClear>
              <Select.Option value="public">公共数据集空间</Select.Option>
              <Select.Option value="finance">金融研究空间</Select.Option>
              <Select.Option value="marketing">营销运营中心</Select.Option>
            </Select>
          </div>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">连接器</Text>
            <Select placeholder="全部连接器" className="w-full" allowClear>
              <Select.Option value="mysql">MySQL_Finance_Master</Select.Option>
              <Select.Option value="s3">S3_Assets_Bucket</Select.Option>
              <Select.Option value="api">External_Weather_API</Select.Option>
            </Select>
          </div>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">资源类型</Text>
            <Select placeholder="全部类型" className="w-full" allowClear>
              <Select.Option value="table">数据表 (Table)</Select.Option>
              <Select.Option value="api">API 接口</Select.Option>
              <Select.Option value="file">文件资源</Select.Option>
            </Select>
          </div>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs ml-1">搜索资源</Text>
            <Input 
              placeholder="按资源名称搜索..." 
              prefix={<Search size={16} className="text-gray-400" />} 
              className="w-full"
            />
          </div>
        </div>
      </Card>

      <Card className="shadow-sm border-none" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={tableData} 
          pagination={{
            total: 125,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条资源`,
          }}
          className="resource-directory-table"
        />
      </Card>

      {/* Data Resource Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Database size={20} className="text-blue-500" />
            <span>数据资源详情 - {selectedResource?.name}</span>
          </div>
        }
        width={720}
        onClose={() => setDetailsVisible(false)}
        open={detailsVisible}
      >
        {selectedResource && (
          <div className="space-y-8">
            <Tabs defaultActiveKey="metadata" items={[
              {
                key: 'metadata',
                label: <span className="flex items-center gap-2"><FileText size={16} /> 完整元数据</span>,
                children: (
                  <div className="space-y-6 pt-2">
                    <Descriptions title="基础信息" bordered column={2} size="small">
                      <Descriptions.Item label="资源名称">{selectedResource.name}</Descriptions.Item>
                      <Descriptions.Item label="资源类型"><Tag color="blue">{selectedResource.type}</Tag></Descriptions.Item>
                      <Descriptions.Item label="所属空间">{selectedResource.space}</Descriptions.Item>
                      <Descriptions.Item label="接入时间">{selectedResource.accessTime}</Descriptions.Item>
                      <Descriptions.Item label="开放状态" span={2}>
                        <Badge status={selectedResource.isOpen ? "success" : "default"} text={selectedResource.isOpen ? "已开放" : "未开放"} />
                      </Descriptions.Item>
                    </Descriptions>

                    <Table 
                      size="small" 
                      title={() => <Text strong>字段定义 (Schema)</Text>}
                      pagination={false}
                      dataSource={[
                        { key: '1', field: 'id', type: 'BIGINT', desc: '记录唯一标识', isNullable: 'NO', isPk: true },
                        { key: '2', field: 'user_id', type: 'VARCHAR(64)', desc: '用户账号', isNullable: 'NO', isPk: false },
                        { key: '3', field: 'amount', type: 'DECIMAL(18,2)', desc: '交易金额', isNullable: 'YES', isPk: false },
                        { key: '4', field: 'status', type: 'INT', desc: '状态码: 0-待处理, 1-完成', isNullable: 'NO', isPk: false },
                      ]}
                      columns={[
                        { title: '字段名', dataIndex: 'field', render: (t, r) => <span>{t} {r.isPk && <Tag color="gold" className="ml-1">PK</Tag>}</span> },
                        { title: '数据类型', dataIndex: 'type' },
                        { title: '描述', dataIndex: 'desc' },
                        { title: '可为空', dataIndex: 'isNullable' },
                      ]}
                    />
                  </div>
                )
              },
              {
                key: 'storage',
                label: <span className="flex items-center gap-2"><HardDrive size={16} /> 存储与统计</span>,
                children: (
                  <div className="space-y-6 pt-2">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card size="small" className="bg-blue-50/50 border-blue-100 text-center">
                          <Statistic title="访问量 (近30天)" value={12840} prefix={<Eye size={16} className="mr-1" />} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" className="bg-green-50/50 border-green-100 text-center">
                          <Statistic title="存储占用" value={45.8} suffix="MB" prefix={<HardDrive size={16} className="mr-1" />} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" className="bg-purple-50/50 border-purple-100 text-center">
                          <Statistic title="数据行数" value={156000} prefix={<BarChart3 size={16} className="mr-1" />} />
                        </Card>
                      </Col>
                    </Row>
                    <Descriptions title="存储详情" bordered column={1} size="small">
                      <Descriptions.Item label="来源连接器">{selectedResource.connector}</Descriptions.Item>
                      <Descriptions.Item label="物理存储路径">db_finance_01.public.user_transaction_records</Descriptions.Item>
                      <Descriptions.Item label="更新周期">每日增量 (T+1)</Descriptions.Item>
                      <Descriptions.Item label="最后同步成功">2024-04-07 08:45:12</Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              },
              {
                key: 'quality',
                label: <span className="flex items-center gap-2"><ShieldCheck size={16} /> 质量规则</span>,
                children: (
                  <div className="space-y-4 pt-2">
                    <AlertCircle size={48} className="text-gray-200 mx-auto block mt-8" />
                    <Paragraph type="secondary" className="text-center">该资源目前关联了 2 条质量监控规则：</Paragraph>
                    <List 
                      dataSource={[
                        { name: '非空约束校验', dim: '完整性', result: 'success' },
                        { name: '金额范围校验', dim: '准确性', result: 'error' },
                      ]}
                      renderItem={item => (
                        <List.Item className="bg-gray-50 px-4 py-2 rounded-md mb-2 border border-gray-100">
                          <div className="flex justify-between items-center w-full">
                            <Space>
                              <Text strong>{item.name}</Text>
                              <Tag>{item.dim}</Tag>
                            </Space>
                            <Badge status={item.result === 'success' ? 'success' : 'error'} text={item.result === 'success' ? '正常' : '异常'} />
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )
              },
              {
                key: 'history',
                label: <span className="flex items-center gap-2"><History size={16} /> 修改历史</span>,
                children: (
                  <div className="pt-4 px-2">
                    <Timeline items={[
                      { children: '2024-04-07 10:30 系统管理员 开启了“开放状态”', color: 'green' },
                      { children: '2024-04-05 14:20 系统管理员 修改了字段“amount”的描述' },
                      { children: '2024-04-01 09:00 系统接入 资源首次导入成功', color: 'blue' },
                    ]} />
                  </div>
                )
              }
            ]} />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ResourceDirectory;
