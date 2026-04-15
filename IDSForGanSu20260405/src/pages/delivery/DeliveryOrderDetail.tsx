import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Space, Steps, Table, Tabs, Tag, Timeline, Typography } from 'antd';

const { Title } = Typography;

const DeliveryOrderDetail: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const pipeline = [
    { key: '1', title: '文件传输', status: '已完成', log: '传输 1.2GB，校验通过' },
    { key: '2', title: '数据清洗', status: '执行中', log: '规则 R-12 处理中' },
    { key: '3', title: '安全计算', status: '待执行', log: '等待上游完成' },
  ];

  return (
    <div className="space-y-4">
      <Space className="w-full justify-between">
        <Title level={4} style={{ margin: 0 }}>
          订单详情：{decodeURIComponent(orderId || '')}
        </Title>
        <Button onClick={() => navigate('/delivery/orders')}>返回</Button>
      </Space>

      <Card size="small">
        <Tabs
          items={[
            {
              key: 'overview',
              label: '订单概览',
              children: (
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="订单编号">{decodeURIComponent(orderId || '')}</Descriptions.Item>
                  <Descriptions.Item label="订单状态"><Tag color="orange">执行中</Tag></Descriptions.Item>
                  <Descriptions.Item label="交付方式">中密交付</Descriptions.Item>
                  <Descriptions.Item label="策略组合">中密-可信计算模板A</Descriptions.Item>
                  <Descriptions.Item label="源连接器">Oracle_CRM_Replica</Descriptions.Item>
                  <Descriptions.Item label="目标连接器">Local_File_Server</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'pipeline',
              label: '任务流水线',
              children: (
                <div className="space-y-4">
                  <Steps
                    current={1}
                    items={pipeline.map((p) => ({ title: p.title, description: p.status }))}
                  />
                  <Timeline
                    items={pipeline.map((p) => ({
                      children: (
                        <div className="flex items-center justify-between">
                          <span>{p.title} - {p.log}</span>
                          <Button
                            type="link"
                            onClick={() =>
                              navigate(
                                `/delivery/orders/${encodeURIComponent(orderId || '')}/tasks/${encodeURIComponent(`${p.title}-${p.key}`)}/logs`,
                              )
                            }
                          >
                            查看日志
                          </Button>
                        </div>
                      ),
                    }))}
                  />
                </div>
              ),
            },
            {
              key: 'log',
              label: '交付日志',
              children: (
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={[
                    { id: '1', time: '2026-04-13 10:10', operator: 'admin', action: '创建订单', detail: '智能订单创建成功' },
                    { id: '2', time: '2026-04-13 10:12', operator: 'system', action: '触发流水线', detail: '已创建 3 个任务节点' },
                    { id: '3', time: '2026-04-13 10:20', operator: 'system', action: '任务告警', detail: '数据清洗耗时超过阈值' },
                  ]}
                  columns={[
                    { title: '时间', dataIndex: 'time' },
                    { title: '操作者', dataIndex: 'operator' },
                    { title: '动作', dataIndex: 'action' },
                    { title: '详情', dataIndex: 'detail' },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default DeliveryOrderDetail;

