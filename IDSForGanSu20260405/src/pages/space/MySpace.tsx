import React, { useState } from 'react';
import { 
  Button, Tag, Card, Row, Col, Typography, Tooltip, 
  Modal, Form, Input, Select, message 
} from 'antd';
import { Plus, Link, Database, Users, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface SpaceItem {
  id: string;
  name: string;
  type: string;
  connectors: number;
  products: number;
  members: number;
  description: string;
  lastActivity: string;
}

const MySpace: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [spaceList, setSpaceList] = useState<SpaceItem[]>([
    {
      id: 'public_ds',
      name: '公共数据集空间',
      type: '协作空间',
      connectors: 12,
      products: 45,
      members: 8,
      description: '提供公司内部通用的公共数据集，包括基础字典、组织架构、公共流水等核心业务数据，支持全员查询与共享。',
      lastActivity: '10 分钟前',
    },
    {
      id: 'finance_research',
      name: '金融研究空间',
      type: '私有空间',
      connectors: 5,
      products: 12,
      members: 3,
      description: '针对金融行业趋势、市场风险及投资组合进行深度研究的数据空间，包含高频交易数据与敏感财务报表。',
      lastActivity: '2 小时前',
    },
    {
      id: 'marketing_ops',
      name: '营销运营中心',
      type: '协作空间',
      connectors: 8,
      products: 28,
      members: 15,
      description: '汇总全渠道营销活动数据，分析转化率与用户行为，为精准营销策略提供数据支持。',
      lastActivity: '昨天 18:30',
    },
  ]);

  const handleEnterSpace = (item: SpaceItem) => {
    // Pass both id and name for breadcrumb and header
    navigate(`/space/operation?id=${item.id}&name=${encodeURIComponent(item.name)}`);
  };

  const handleCreateSpace = () => {
    form.validateFields().then((values) => {
      const newSpace: SpaceItem = {
        id: `space_${Date.now()}`,
        name: values.name,
        type: values.type,
        connectors: 0,
        products: 0,
        members: 1,
        description: values.description || '暂无描述',
        lastActivity: '刚刚',
      };
      
      setSpaceList([newSpace, ...spaceList]);
      setIsModalOpen(false);
      form.resetFields();
      message.success('数据空间创建成功！');
    });
  };

  const getTypeTagColor = (type: string) => {
    switch (type) {
      case '私有空间': return 'purple';
      case '协作空间': return 'blue';
      case '公开数据市场': return 'orange';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={3} style={{ margin: 0 }}>我的空间</Title>
          <Text type="secondary">管理和访问您所属的数据协作空间</Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<Plus size={18} />} 
          className="flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          创建空间
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {spaceList.map((item) => (
          <Col xs={24} sm={24} md={12} lg={8} key={item.id}>
            <Card
              hoverable
              className="h-full flex flex-col transition-all duration-300 hover:shadow-md border-gray-100"
              styles={{ body: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' } }}
            >
              <div className="flex justify-between items-start mb-4">
                <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
                  {item.name}
                </Title>
                <Tag color={getTypeTagColor(item.type)}>
                  {item.type}
                </Tag>
              </div>

              <Paragraph 
                type="secondary" 
                ellipsis={{ rows: 2 }} 
                className="text-sm mb-6 flex-grow"
              >
                {item.description}
              </Paragraph>

              <div className="grid grid-cols-3 gap-2 mb-6 bg-gray-50 p-3 rounded-lg">
                <Tooltip title="连接器数量">
                  <div className="text-center">
                    <div className="flex justify-center text-blue-500 mb-1">
                      <Link size={16} />
                    </div>
                    <Text strong className="block">{item.connectors}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>连接器</Text>
                  </div>
                </Tooltip>
                <Tooltip title="开放数据产品数量">
                  <div className="text-center">
                    <div className="flex justify-center text-green-500 mb-1">
                      <Database size={16} />
                    </div>
                    <Text strong className="block">{item.products}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>数据产品</Text>
                  </div>
                </Tooltip>
                <Tooltip title="成员数量">
                  <div className="text-center">
                    <div className="flex justify-center text-orange-500 mb-1">
                      <Users size={16} />
                    </div>
                    <Text strong className="block">{item.members}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>成员</Text>
                  </div>
                </Tooltip>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock size={12} />
                  <span>最后活动: {item.lastActivity}</span>
                </div>
                <Button 
                  type="link" 
                  onClick={() => handleEnterSpace(item)}
                  className="p-0 flex items-center gap-1 group font-medium"
                >
                  进入空间
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          </Col>
        ))}
        
        {/* Empty State / Add New Placeholder */}
        <Col xs={24} sm={24} md={12} lg={8}>
          <div 
            onClick={() => setIsModalOpen(true)}
            className="h-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all min-h-[280px]"
          >
            <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
              <Plus size={32} />
            </div>
            <Text strong className="text-gray-500">创建新空间</Text>
            <Text type="secondary" className="text-xs mt-2 text-center">
              开始您的数据治理与协作之旅
            </Text>
          </div>
        </Col>
      </Row>

      {/* Create Space Modal */}
      <Modal
        title="创建数据空间"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreateSpace}
        okText="提交"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="空间名称"
            rules={[{ required: true, message: '请输入空间名称' }]}
          >
            <Input placeholder="输入空间名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="空间类型"
            rules={[{ required: true, message: '请选择空间类型' }]}
          >
            <Select placeholder="请选择空间类型">
              <Select.Option value="私有空间">私有空间</Select.Option>
              <Select.Option value="协作空间">协作空间</Select.Option>
              <Select.Option value="公开数据市场">公开数据市场</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="空间描述"
          >
            <Input.TextArea rows={4} placeholder="描述该空间的主要用途和数据范围" />
          </Form.Item>

          <Form.Item
            name="organization"
            label="所属组织"
          >
            <Input placeholder="输入所属组织名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MySpace;
