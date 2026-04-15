import React, { useState } from 'react';
import { Button, Card, Col, Drawer, Input, Row, Space, Switch, Table, Tabs, Tag, Typography, message } from 'antd';

const { Title, Text } = Typography;

interface PolicyRow {
  key: string;
  name: string;
  type: string;
  updateTime: string;
  orderCount: number;
  enabled: boolean;
}

const lowCategories = ['传输模板', '加密策略', '路由合约', '调度策略'];
const highCategories = ['可信环境模板', '计算模型', '清洗规则', '质量规则', '安全合约', '销毁策略'];

const lowRows: PolicyRow[] = [
  { key: '1', name: '低密-SFTP传输模板', type: '传输模板', updateTime: '2026-04-11 18:20', orderCount: 12, enabled: true },
  { key: '2', name: '低密-字段级AES策略', type: '加密策略', updateTime: '2026-04-10 09:40', orderCount: 7, enabled: true },
  { key: '3', name: '低密-路由网关V2', type: '路由合约', updateTime: '2026-04-09 15:00', orderCount: 3, enabled: false },
];

const highRows: PolicyRow[] = [
  { key: '4', name: '中密-TEE环境模板A', type: '可信环境模板', updateTime: '2026-04-12 10:10', orderCount: 8, enabled: true },
  { key: '5', name: '中密-PII清洗规则组', type: '清洗规则', updateTime: '2026-04-11 14:30', orderCount: 6, enabled: true },
  { key: '6', name: '中密-销毁策略7日', type: '销毁策略', updateTime: '2026-04-10 17:00', orderCount: 2, enabled: false },
];

const DeliveryPolicyCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'low' | 'high'>('low');
  const [category, setCategory] = useState<string>('传输模板');
  const [detail, setDetail] = useState<PolicyRow | null>(null);
  const [keyword, setKeyword] = useState('');

  const categories = activeTab === 'low' ? lowCategories : highCategories;
  const rows = (activeTab === 'low' ? lowRows : highRows)
    .filter((r) => (category ? r.type === category : true))
    .filter((r) => `${r.name}${r.type}`.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <div className="space-y-4">
      <Title level={4} style={{ margin: 0 }}>
        交付策略
      </Title>

      <Card size="small">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            const key = k as 'low' | 'high';
            setActiveTab(key);
            setCategory(key === 'low' ? lowCategories[0] : highCategories[0]);
          }}
          items={[
            { key: 'low', label: '低密交付策略' },
            { key: 'high', label: '中密交付策略' },
          ]}
        />

        <Row gutter={16}>
          <Col span={6}>
            <Card size="small" title="策略分类导航">
              <div className="space-y-2">
                {categories.map((c) => (
                  <Button key={c} type={c === category ? 'primary' : 'default'} block onClick={() => setCategory(c)}>
                    {c}
                  </Button>
                ))}
              </div>
            </Card>
          </Col>
          <Col span={18}>
            <Card
              size="small"
              title={activeTab === 'low' ? '低密策略列表' : '中密策略列表'}
              extra={
                <Space>
                  <Input placeholder="按策略名搜索" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 220 }} />
                  <Button type="primary" onClick={() => message.success('进入创建/编辑策略页（演示）')}>
                    新建策略
                  </Button>
                </Space>
              }
            >
              <Table
                rowKey="key"
                dataSource={rows}
                pagination={{ pageSize: 8 }}
                columns={[
                  { title: '策略名称', dataIndex: 'name' },
                  { title: '类型', dataIndex: 'type' },
                  { title: '最后修改', dataIndex: 'updateTime' },
                  { title: '关联订单数', dataIndex: 'orderCount' },
                  { title: '状态', dataIndex: 'enabled', render: (e: boolean) => (e ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>) },
                  {
                    title: '操作',
                    render: (_: unknown, row: PolicyRow) => (
                      <Space>
                        <Button type="link" onClick={() => message.success(`编辑策略 ${row.name}（演示）`)}>编辑</Button>
                        <Button type="link" onClick={() => setDetail(row)}>详情</Button>
                        <Switch size="small" checked={row.enabled} onChange={(checked) => message.success(`${checked ? '启用' : '禁用'}成功（演示）`)} />
                        <Button type="link" onClick={() => message.success(`已复制策略 ${row.name}`)}>复制</Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Drawer open={!!detail} onClose={() => setDetail(null)} width={620} title={`策略详情：${detail?.name || ''}`}>
        {detail && (
          <div className="space-y-4">
            <Card size="small" title="完整配置">
              <p>策略名称：{detail.name}</p>
              <p>策略类型：{detail.type}</p>
              <p>关联订单：{detail.orderCount}</p>
              <p>状态：{detail.enabled ? '启用' : '禁用'}</p>
            </Card>
            <Card size="small" title="关联关系图（摘要）">
              <Text type="secondary">策略 -&gt; 网关 -&gt; 任务模板 -&gt; 订单（示意）</Text>
            </Card>
            <Card size="small" title="执行日志">
              <p>[2026-04-13 09:20] 策略被订单 OD-20260413-002 引用</p>
              <p>[2026-04-13 09:45] 策略校验通过，发放执行令牌</p>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DeliveryPolicyCenter;

